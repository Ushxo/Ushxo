// Génère les cartes de statistiques animées (stats, langages, activité).
// Usage : GITHUB_TOKEN=... node scripts/cartes.mjs <login> <dossier_sortie>
// Avec un jeton personnel en lecture seule, les dépôts privés comptent dans les langages.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { c, accents, esc, frame, prompt } from './theme.mjs';

const [login = 'Ushxo', out = 'dist'] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN manquant');
const EXCLUS = new Set((process.env.LANGUES_EXCLUES ?? '').split(',').map((s) => s.trim()).filter(Boolean));

async function gql(query, variables = {}) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profil-cartes' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

// ---------- Données ----------
const base = await gql(`query($l:String!){ user(login:$l){ createdAt } }`, { l: login });
const debut = new Date(base.user.createdAt).getUTCFullYear();
const maintenant = new Date();
const anneeCourante = maintenant.getUTCFullYear();

const jours = [];
let totalToutTemps = 0;
const parAnnee = {};
for (let a = debut; a <= anneeCourante; a++) {
  const from = `${a}-01-01T00:00:00Z`;
  const to = a === anneeCourante ? maintenant.toISOString() : `${a}-12-31T23:59:59Z`;
  const d = await gql(
    `query($l:String!,$f:DateTime!,$t:DateTime!){ user(login:$l){ contributionsCollection(from:$f,to:$t){ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`,
    { l: login, f: from, t: to },
  );
  const cal = d.user.contributionsCollection.contributionCalendar;
  parAnnee[a] = cal.totalContributions;
  totalToutTemps += cal.totalContributions;
  for (const w of cal.weeks) for (const j of w.contributionDays) jours.push({ date: j.date, n: j.contributionCount });
}
jours.sort((x, y) => x.date.localeCompare(y.date));
const aujourdhui = maintenant.toISOString().slice(0, 10);
const passes = jours.filter((j) => j.date <= aujourdhui);

let plusLongue = 0, courante = 0;
for (const j of passes) { courante = j.n > 0 ? courante + 1 : 0; plusLongue = Math.max(plusLongue, courante); }
let serie = 0;
{
  let i = passes.length - 1;
  if (i >= 0 && passes[i].n === 0) i--; // aujourd'hui pas encore commencé : on part d'hier
  for (; i >= 0 && passes[i].n > 0; i--) serie++;
}
const derniers365 = passes.slice(-365);
const joursActifs = derniers365.filter((j) => j.n > 0).length;
const total365 = derniers365.reduce((s, j) => s + j.n, 0);

let repos = [], apres = null;
do {
  const d = await gql(
    `query($l:String!,$a:String){ user(login:$l){ repositories(ownerAffiliations:OWNER,isFork:false,first:100,after:$a){ totalCount pageInfo{hasNextPage endCursor} nodes{ name stargazerCount languages(first:20,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } } } } }`,
    { l: login, a: apres },
  );
  const r = d.user.repositories;
  repos = repos.concat(r.nodes);
  apres = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
} while (apres);

const tailles = {};
for (const r of repos) for (const e of r.languages.edges) {
  if (EXCLUS.has(e.node.name)) continue;
  tailles[e.node.name] = (tailles[e.node.name] ?? 0) + e.size;
}
const totalOctets = Object.values(tailles).reduce((s, v) => s + v, 0) || 1;
const langues = Object.entries(tailles).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .map(([nom, v], i) => ({ nom, pct: (100 * v) / totalOctets, couleur: accents[i] }));
const etoiles = repos.reduce((s, r) => s + r.stargazerCount, 0);

const fr = (n) => n.toLocaleString('fr-CA').replace(/ | /g, ' ');

// ---------- Carte stats ----------
function carteStats() {
  const W = 420, H = 210;
  const lignes = [
    ['Contributions totales', fr(totalToutTemps), c.mauve],
    ['12 derniers mois', fr(total365), c.pink],
    ['Série actuelle', `${serie} j`, c.peach],
    ['Plus longue série', `${plusLongue} j`, c.yellow],
    ['Dépôts', fr(repos.length), c.blue],
  ];
  const rows = lignes.map(([lab, val, col], i) => {
    const y = 72 + i * 27;
    return `<g class="fade" style="animation-delay:${0.15 + i * 0.12}s">
  <rect x="24" y="${y - 9}" width="8" height="8" rx="2" fill="${col}"/>
  <text x="42" y="${y}" font-size="13" fill="${c.subtext0}">${esc(lab)}</text>
  <text x="272" y="${y}" font-size="14" font-weight="700" fill="${c.text}" text-anchor="end">${esc(val)}</text>
</g>`;
  }).join('\n');
  const pct = joursActifs / 365;
  const R = 46, C = 2 * Math.PI * R;
  const anneau = `<g transform="translate(340 118)">
  <circle r="${R}" fill="none" stroke="${c.surface0}" stroke-width="8"/>
  <circle r="${R}" fill="none" stroke="url(#anneau)" stroke-width="8" stroke-linecap="round" transform="rotate(-90)"
    stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}" style="animation:remplir 1.6s .3s cubic-bezier(.2,.8,.2,1) both"/>
  <text y="2" font-size="22" font-weight="700" fill="${c.text}" text-anchor="middle" class="fade" style="animation-delay:.9s">${joursActifs}</text>
  <text y="20" font-size="10" fill="${c.subtext0}" text-anchor="middle" class="fade" style="animation-delay:1s">jours actifs</text>
</g>
<style>@keyframes remplir{from{stroke-dashoffset:${C.toFixed(1)}}}</style>
<defs><linearGradient id="anneau" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.mauve}"/><stop offset="1" stop-color="${c.pink}"/></linearGradient></defs>`;
  return frame(W, H, `${prompt(24, 36, 'stats')}\n${rows}\n${anneau}`, { title: `Statistiques GitHub de ${login}` });
}

// ---------- Carte langages ----------
function carteLangues() {
  const W = 420, H = 210;
  const max = Math.max(...langues.map((l) => l.pct), 1);
  const rows = langues.map((l, i) => {
    const y = 66 + i * 23;
    const larg = (230 * l.pct) / max;
    return `<g class="fade" style="animation-delay:${0.1 + i * 0.1}s">
  <text x="24" y="${y + 4}" font-size="12.5" fill="${c.text}">${esc(l.nom)}</text>
  <rect x="128" y="${y - 6}" width="230" height="10" rx="5" fill="${c.crust}"/>
  <rect x="128" y="${y - 6}" width="${larg.toFixed(1)}" height="10" rx="5" fill="${l.couleur}" style="transform-origin:128px 0;animation:pousse 1s ${(0.3 + i * 0.1).toFixed(2)}s cubic-bezier(.2,.8,.2,1) both"/>
  <text x="396" y="${y + 4}" font-size="11.5" fill="${c.subtext0}" text-anchor="end">${l.pct.toFixed(1)}%</text>
</g>`;
  }).join('\n');
  return frame(W, H, `${prompt(24, 36, 'langages')}\n<style>@keyframes pousse{from{transform:scaleX(0)}}</style>\n${rows}`, {
    title: `Langages les plus utilisés par ${login}`,
  });
}

// ---------- Carte activité (12 mois, par semaine) ----------
function carteActivite() {
  const W = 860, H = 240;
  const semaines = [];
  for (let i = 0; i < derniers365.length; i += 7) {
    const tranche = derniers365.slice(i, i + 7);
    semaines.push({ date: tranche[0].date, n: tranche.reduce((s, j) => s + j.n, 0) });
  }
  const x0 = 50, x1 = W - 28, y0 = 196, y1 = 78;
  const max = Math.max(...semaines.map((s) => s.n), 1);
  const pts = semaines.map((s, i) => [x0 + ((x1 - x0) * i) / (semaines.length - 1), y0 - ((y0 - y1) * s.n) / max]);
  // Courbe lissée (Catmull-Rom vers Bézier).
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const cp1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(y0, p1[1] + (p2[1] - p0[1]) / 6)];
    const cp2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(y0, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${cp1[0].toFixed(1)},${cp1[1].toFixed(1)} ${cp2[0].toFixed(1)},${cp2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const aire = `${d} L${x1},${y0} L${x0},${y0} Z`;
  const grille = [0, 0.5, 1].map((f) => {
    const y = y0 - (y0 - y1) * f;
    return `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${c.surface0}" stroke-dasharray="3 5"/>
<text x="${x0 - 10}" y="${y + 4}" font-size="10" fill="${c.overlay0}" text-anchor="end">${Math.round(max * f)}</text>`;
  }).join('\n');
  const moisFr = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  let dernierMois = -1;
  const etiquettes = semaines.map((s, i) => {
    const m = new Date(s.date + 'T12:00:00Z').getUTCMonth();
    if (m === dernierMois) return '';
    dernierMois = m;
    if (i < 2 || i > semaines.length - 3) return ''; // mois partiels aux extrémités
    return `<text x="${pts[i][0].toFixed(1)}" y="${y0 + 20}" font-size="10" fill="${c.overlay0}">${moisFr[m]}</text>`;
  }).join('');
  const iMax = semaines.findIndex((s) => s.n === max);
  const [mx, my] = pts[iMax];
  const longueur = 3000;
  return frame(W, H, `${prompt(24, 36, 'activité')}
<text x="${W - 24}" y="36" font-size="12" fill="${c.subtext0}" text-anchor="end">${fr(total365)} contributions sur 12 mois</text>
<defs>
  <linearGradient id="ligne" x1="0" x2="1"><stop offset="0" stop-color="${c.blue}"/><stop offset=".5" stop-color="${c.mauve}"/><stop offset="1" stop-color="${c.pink}"/></linearGradient>
  <linearGradient id="aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.mauve}" stop-opacity=".35"/><stop offset="1" stop-color="${c.mauve}" stop-opacity="0"/></linearGradient>
  <filter id="lueur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>
  .trace{stroke-dasharray:${longueur};animation:trace 2.4s .2s ease-out both}
  @keyframes trace{from{stroke-dashoffset:${longueur}}to{stroke-dashoffset:0}}
  .aire{animation:fade 1.2s 1.4s ease-out both}
  .pic{animation:fade .5s 2.4s both}
  .halo{transform-origin:${mx.toFixed(1)}px ${my.toFixed(1)}px;animation:halo 2s 2.6s ease-out infinite;opacity:0}
  @keyframes halo{0%{transform:scale(1);opacity:.8}100%{transform:scale(3.2);opacity:0}}
</style>
${grille}
${etiquettes}
<path class="aire" d="${aire}" fill="url(#aire)"/>
<path class="trace" d="${d}" fill="none" stroke="url(#ligne)" stroke-width="2.5" stroke-linecap="round" filter="url(#lueur)"/>
<circle class="halo" cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="5" fill="none" stroke="${c.pink}"/>
<g class="pic"><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="4.5" fill="${c.pink}"/>
<text x="${(mx > W - 140 ? mx - 12 : mx).toFixed(1)}" y="${(mx > W - 140 ? my + 4 : my - 12).toFixed(1)}" font-size="11" fill="${c.pink}" text-anchor="${mx > W - 140 ? 'end' : 'middle'}">${max} / sem.</text></g>`, {
    title: `Activité de ${login} sur 12 mois`,
  });
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'stats.svg'), carteStats());
writeFileSync(join(out, 'langages.svg'), carteLangues());
writeFileSync(join(out, 'activite.svg'), carteActivite());
console.log(JSON.stringify({ totalToutTemps, total365, serie, plusLongue, joursActifs, repos: repos.length, etoiles, parAnnee, langues: langues.map((l) => `${l.nom} ${l.pct.toFixed(1)}%`) }));
