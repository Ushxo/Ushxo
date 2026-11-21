// Palette Catppuccin Mocha sur fond noir pur (comme Ghostty et Cursor).
export const c = {
  bg: '#000000',
  crust: '#11111b',
  mantle: '#181825',
  base: '#1e1e2e',
  surface0: '#313244',
  surface1: '#45475a',
  overlay0: '#6c7086',
  subtext0: '#a6adc8',
  text: '#cdd6f4',
  mauve: '#cba6f7',
  pink: '#f5c2e7',
  lavender: '#b4befe',
  blue: '#89b4fa',
  sapphire: '#74c7ec',
  teal: '#94e2d5',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  peach: '#fab387',
  red: '#f38ba8',
};

export const accents = [c.mauve, c.pink, c.blue, c.teal, c.peach, c.yellow, c.green, c.lavender];

export const mono = `'JetBrainsMono Nerd Font','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Cadre commun : fond noir, bordure surface0, coins arrondis, lueur mauve qui respire.
export function frame(w, h, inner, { title = '', glow = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <linearGradient id="bord" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c.mauve}"/><stop offset=".5" stop-color="${c.surface0}"/><stop offset="1" stop-color="${c.blue}"/>
  </linearGradient>
</defs>
<style>
  text{font-family:${mono}}
  .fade{animation:fade .6s ease-out both}
  @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  .respire{animation:respire 4s ease-in-out infinite}
  @keyframes respire{0%,100%{opacity:.35}50%{opacity:1}}
</style>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${c.bg}" stroke="${c.surface0}"/>
${glow ? `<rect class="respire" x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="none" stroke="url(#bord)" stroke-width="1.2"/>` : ''}
${inner}
</svg>
`;
}

// Titre façon invite de commande : « ❯ ~/stats ».
export function prompt(x, y, label) {
  return `<text x="${x}" y="${y}" font-size="15" font-weight="700"><tspan fill="${c.mauve}">❯</tspan><tspan fill="${c.blue}" dx="8">~/</tspan><tspan fill="${c.text}">${esc(label)}</tspan></text>`;
}
