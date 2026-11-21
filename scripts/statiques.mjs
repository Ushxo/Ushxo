// Génère les SVG fixes du profil (bannière, terminal, cartes de projets, séparateur, pied de page).
// Usage : node scripts/statiques.mjs [dossier_sortie=assets]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { c, mono, esc, frame } from './theme.mjs';

const out = process.argv[2] ?? 'assets';
mkdirSync(out, { recursive: true });
const W = 860;

// ---------- Bannière : aurore boréale + nom en dégradé animé ----------
function banniere() {
  const H = 250;
  const etoiles = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 197.3) % W, y = (i * 83.7) % H, r = (i % 3) * 0.35 + 0.5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="${c.text}" class="scintille" style="animation-delay:${((i * 0.37) % 4).toFixed(2)}s"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sami Madani">
<title>Sami Madani</title>
<defs>
  <filter id="flou" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>
  <linearGradient id="nom" x1="0" x2="1" gradientUnits="objectBoundingBox" spreadMethod="reflect">
    <stop offset="0" stop-color="${c.mauve}"/><stop offset=".35" stop-color="${c.pink}"/><stop offset=".7" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.mauve}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 0;1 0;0 0" dur="8s" repeatCount="indefinite"/>
  </linearGradient>
  <clipPath id="cadre"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<style>
  text{font-family:${mono}}
  .a1{animation:d1 14s ease-in-out infinite alternate}
  .a2{animation:d2 18s ease-in-out infinite alternate}
  .a3{animation:d3 16s ease-in-out infinite alternate}
  @keyframes d1{from{transform:translate(-60px,10px)}to{transform:translate(120px,-20px)}}
  @keyframes d2{from{transform:translate(80px,-10px)}to{transform:translate(-140px,25px)}}
  @keyframes d3{from{transform:translate(0,20px) scale(1)}to{transform:translate(60px,-15px) scale(1.15)}}
  .scintille{animation:sc 4s ease-in-out infinite;opacity:.2}
  @keyframes sc{0%,100%{opacity:.15}50%{opacity:.8}}
  .monte{animation:monte .9s cubic-bezier(.2,.8,.2,1) both}
  @keyframes monte{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
</style>
<g clip-path="url(#cadre)">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${etoiles}
  <g filter="url(#flou)" opacity=".55">
    <ellipse class="a1" cx="250" cy="70" rx="230" ry="55" fill="${c.mauve}"/>
    <ellipse class="a2" cx="590" cy="60" rx="220" ry="45" fill="${c.blue}"/>
    <ellipse class="a3" cx="430" cy="240" rx="260" ry="40" fill="${c.pink}" opacity=".6"/>
    <ellipse class="a2" cx="120" cy="230" rx="160" ry="35" fill="${c.teal}" opacity=".45"/>
  </g>
  <text x="${W / 2}" y="128" font-size="56" font-weight="800" fill="url(#nom)" text-anchor="middle" class="monte" letter-spacing="1">Sami Madani</text>
  <text x="${W / 2}" y="170" font-size="15" fill="${c.text}" text-anchor="middle" class="monte" style="animation-delay:.35s">génie logiciel @ ÉTS  <tspan fill="${c.mauve}">·</tspan>  fondateur d'Auron Studio  <tspan fill="${c.mauve}">·</tspan>  Montréal</text>
  <text x="26" y="34" font-size="12" fill="${c.overlay0}" class="monte" style="animation-delay:.6s"><tspan fill="${c.mauve}">❯</tspan> ushxo</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${c.surface0}"/>
</svg>
`;
}

// ---------- Terminal façon Ghostty : commandes tapées une à une ----------
function terminal() {
  const fs = 14, cw = fs * 0.62; // largeur approximative d'un caractère à chasse fixe
  const blocs = [
    ['whoami', [[c.text, "Sami Madani, étudiant en génie logiciel à l'ÉTS (Montréal)"]]],
    ['cat studio.txt', [[c.text, "Fondateur d'Auron Studio  "], [c.blue, 'auronstudio.ca']]],
    ['echo $STACK', [[c.peach, 'TypeScript'], [c.overlay0, ' · '], [c.red, 'Rust + Tauri'], [c.overlay0, ' · '], [c.yellow, 'Python'], [c.overlay0, ' · '], [c.sapphire, 'Luau'], [c.overlay0, ' · '], [c.green, 'GDScript']]],
    ['ls ~/projets', [[c.blue, 'archipel/'], [c.text, '    '], [c.blue, 'just-tennis/']]],
  ];
  const H = 72 + blocs.length * 46 + 30;
  let t = 0.6, y = 70, defs = '', corps = '';
  blocs.forEach(([cmd, sortie], i) => {
    const largeur = 700;
    const dur = Math.max(0.35, cmd.length * 0.065);
    const pas = cmd.length;
    const fin = (cmd.length * cw + 4).toFixed(1);
    defs += `@keyframes tape${i}{0%{transform:translateX(0)}99.9%{transform:translateX(${fin}px)}100%{transform:translateX(700px)}}\n`;
    const cache = `<rect x="44" y="${y - 16}" width="720" height="22" fill="${c.bg}" style="transform:translateX(700px);animation:tape${i} ${dur.toFixed(2)}s steps(${pas}) ${t.toFixed(2)}s both"/>`;
    corps += `<text x="26" y="${y}" font-size="${fs}" font-weight="700" fill="${c.mauve}">❯</text>
<text x="46" y="${y}" font-size="${fs}" fill="${c.text}">${esc(cmd)}</text>\n${cache}`;
    t += dur + 0.25;
    corps += `<text x="46" y="${y + 22}" font-size="${fs - 0.5}" class="sortie" style="animation-delay:${t.toFixed(2)}s">${sortie.map(([col, s]) => `<tspan fill="${col}">${esc(s)}</tspan>`).join('')}</text>`;
    t += 0.45;
    y += 46;
  });
  corps += `<text x="26" y="${y}" font-size="${fs}" font-weight="700" fill="${c.mauve}" class="sortie" style="animation-delay:${t.toFixed(2)}s">❯</text>
<rect x="46" y="${y - 13}" width="9" height="17" fill="${c.text}" class="curseur" style="animation-delay:${t.toFixed(2)}s"/>
<style>.sortie{animation:apparait .01s both}@keyframes apparait{from{opacity:0}}.curseur{animation:clignote 1.05s steps(1) infinite both}@keyframes clignote{0%{opacity:1}50%{opacity:0}}</style>`;

  const barre = `<rect x="1" y="1" width="${W - 2}" height="34" rx="12" fill="${c.crust}"/><rect x="1" y="24" width="${W - 2}" height="11" fill="${c.crust}"/>
<line x1="1" x2="${W - 1}" y1="35" y2="35" stroke="${c.surface0}"/>
<circle cx="22" cy="18" r="6" fill="${c.red}"/><circle cx="42" cy="18" r="6" fill="${c.yellow}"/><circle cx="62" cy="18" r="6" fill="${c.green}"/>
<text x="${W / 2}" y="22" font-size="12" fill="${c.subtext0}" text-anchor="middle">ushxo@montreal: ~</text>`;
  return frame(W, H, `<style>${defs}</style>${barre}\n${corps}`, { title: 'Terminal : présentation de Sami Madani' });
}

// ---------- Cartes de projets ----------
function pixels(motif, taille, palette, x, y) {
  return motif.map((ligne, j) => [...ligne].map((ch, i) => (ch === '.' ? '' : `<rect x="${x + i * taille}" y="${y + j * taille}" width="${taille}" height="${taille}" fill="${palette[ch]}"/>`)).join('')).join('');
}

function carteProjet({ id, titre, description, etiquettes, pied, icone }) {
  const Wc = 420, H = 180;
  const lignes = [];
  let ligne = '';
  for (const mot of description.split(' ')) {
    if ((ligne + ' ' + mot).trim().length > 36) { lignes.push(ligne.trim()); ligne = mot; } else ligne += ' ' + mot;
  }
  lignes.push(ligne.trim());
  let x = 24;
  const tags = etiquettes.map(([nom, col]) => {
    const w = nom.length * 7.2 + 18;
    const s = `<rect x="${x}" y="134" width="${w}" height="22" rx="11" fill="${c.crust}" stroke="${col}" stroke-opacity=".5"/><text x="${x + w / 2}" y="149" font-size="11.5" fill="${col}" text-anchor="middle">${esc(nom)}</text>`;
    x += w + 8;
    return s;
  }).join('');
  return frame(Wc, H, `${icone}
<text x="24" y="44" font-size="19" font-weight="800" fill="${c.text}" class="fade">${esc(titre)}</text>
${lignes.map((l, i) => `<text x="24" y="${72 + i * 19}" font-size="12.5" fill="${c.subtext0}" class="fade" style="animation-delay:${0.15 + i * 0.08}s">${esc(l)}</text>`).join('\n')}
<g class="fade" style="animation-delay:.5s">${tags}</g>
<text x="${Wc - 24}" y="44" font-size="11.5" fill="${c.overlay0}" text-anchor="end">${esc(pied)}</text>`, { title: `Projet ${titre}` });
}

const P = { m: c.mauve, p: c.pink, b: c.blue, t: c.text, y: c.yellow, s: c.surface1, w: c.sapphire, g: c.green, o: c.peach };

// Petit bateau en pixel art qui tangue sur des vagues qui défilent.
const bateau = pixels([
  '.....t......',
  '....tt......',
  '...ttt......',
  '..tttt......',
  '.ttttt......',
  '.....m......',
  'mmmmmmmmmmm.',
  '.mmmmmmmmm..',
  '..ppppppp...',
], 4, P, 0, 0);
const iconeArchipel = `<style>
  .tangue{transform-box:fill-box;transform-origin:50% 100%;animation:tangue 2.6s ease-in-out infinite}
  @keyframes tangue{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(5deg) translateY(-2px)}}
  .vague{animation:vague 3s linear infinite}
  @keyframes vague{from{transform:translateX(0)}to{transform:translateX(-24px)}}
</style>
<g transform="translate(330 84)"><g class="tangue">${bateau}</g></g>
<clipPath id="mer"><rect x="300" y="118" width="100" height="14"/></clipPath>
<g clip-path="url(#mer)"><path class="vague" d="${Array.from({ length: 7 }, (_, i) => `M${300 + i * 24},124 q6,-6 12,0 t12,0`).join(' ')}" fill="none" stroke="${c.sapphire}" stroke-width="2"/></g>`;

// Balle de tennis en pixel art qui rebondit.
const balle = pixels([
  '...yyyy...',
  '.tyyyyyyt.',
  '.ytyyyyty.',
  'yytyyyytyy',
  'yytyyyytyy',
  'yytyyyytyy',
  '.ytyyyyty.',
  '.tyyyyyyt.',
  '...yyyy...',
], 4, { y: c.green, t: c.text }, 0, 0);
const iconeTennis = `<style>
  .rebond{animation:rebond 1.1s cubic-bezier(.5,0,.5,1) infinite alternate}
  @keyframes rebond{from{transform:translateY(-34px)}to{transform:translateY(0)}}
  .ombre{transform-box:fill-box;transform-origin:center;animation:ombre 1.1s cubic-bezier(.5,0,.5,1) infinite alternate}
  @keyframes ombre{from{transform:scaleX(.45);opacity:.25}to{transform:scaleX(1);opacity:.7}}
</style>
<ellipse class="ombre" cx="360" cy="132" rx="16" ry="3" fill="${c.surface1}"/>
<g transform="translate(342 94)"><g class="rebond">${balle}</g></g>`;

writeFileSync(join(out, 'banniere.svg'), banniere());
writeFileSync(join(out, 'terminal.svg'), terminal());
writeFileSync(join(out, 'projet-archipel.svg'), carteProjet({
  id: 'archipel', titre: "L'Archipel", pied: '↗ versions',
  description: 'Carte maritime en pixel art pour piloter des agents Claude Code CLI',
  etiquettes: [['Tauri', c.yellow], ['Rust', c.red], ['TypeScript', c.blue]], icone: iconeArchipel,
}));
writeFileSync(join(out, 'projet-just-tennis.svg'), carteProjet({
  id: 'tennis', titre: 'Just Tennis', pied: 'dépôt privé',
  description: 'Jeu de tennis 3D arcade en solo, sous Godot 4.7, pour Steam',
  etiquettes: [['Godot', c.blue], ['GDScript', c.green]], icone: iconeTennis,
}));

// ---------- Séparateur : trait en dégradé qui balaie ----------
writeFileSync(join(out, 'separateur.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="8" viewBox="0 0 ${W} 8">
<defs><linearGradient id="g" x1="0" x2="1" spreadMethod="reflect">
  <stop offset="0" stop-color="${c.bg}" stop-opacity="0"/><stop offset=".3" stop-color="${c.mauve}"/><stop offset=".5" stop-color="${c.pink}"/><stop offset=".7" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/>
  <animateTransform attributeName="gradientTransform" type="translate" values="-0.5 0;0.5 0;-0.5 0" dur="6s" repeatCount="indefinite"/>
</linearGradient></defs>
<rect y="3" width="${W}" height="2" rx="1" fill="url(#g)"/>
</svg>
`);

// ---------- Pied de page : vagues ----------
const vague = (amp, phase) => {
  let d = `M-${W},40`;
  for (let x = -W; x <= W * 2; x += 60) d += ` q15,${-amp} 30,0 t30,0`;
  return d;
};
writeFileSync(join(out, 'pied.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="90" viewBox="0 0 ${W} 90" role="img" aria-label="Merci de ta visite">
<title>Merci de ta visite</title>
<style>
  text{font-family:${mono}}
  .v1{animation:v 9s linear infinite}.v2{animation:v 13s linear infinite reverse}.v3{animation:v 17s linear infinite}
  @keyframes v{from{transform:translateX(0)}to{transform:translateX(-60px)}}
</style>
<path class="v1" d="${vague(10)}" fill="none" stroke="${c.mauve}" stroke-width="1.6" opacity=".9"/>
<path class="v2" d="${vague(7)}" transform="translate(0 10)" fill="none" stroke="${c.blue}" stroke-width="1.3" opacity=".6"/>
<path class="v3" d="${vague(5)}" transform="translate(0 20)" fill="none" stroke="${c.pink}" stroke-width="1" opacity=".4"/>
<text x="${W / 2}" y="84" font-size="12" fill="${c.overlay0}" text-anchor="middle">merci de ta visite <tspan fill="${c.mauve}">♥</tspan></text>
</svg>
`);
console.log('ok');
