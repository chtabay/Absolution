// Limbes — maquette D : l’île. La carte, les choses qui poussent, le rendu low poly, l’archipel.
// Tout est dessiné en Canvas 2D, à plat, en trois tons par facette. Rien ne vient d’ailleurs.

import { pousser, especeDe } from './grammaire.js';
import { KEYS, MOCK } from './contenu.js';

export const N = 10; // tuiles par côté
const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const speedK = reduced ? 0 : 1;

/* ───────── Outils ───────── */

export const rng = seed => { let s = Math.abs(Math.floor(seed)) % 2147483647 || 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
const unpack = obj => Object.fromEntries(KEYS.map(k => [k, new Set(obj?.[k] || [])]));
const P = (x, pts, fill) => { // une facette ; opaque, elle est aussi tracée de sa couleur, pour qu’on ne voie pas les coutures
  x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = fill; x.fill();
  if (typeof fill === 'string' && fill[0] === '#') { x.strokeStyle = fill; x.lineWidth = .7; x.lineJoin = 'round'; x.stroke(); }
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const nuance = (h, k) => `rgb(${hex(h).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))).join(',')})`; // k > 0 éclaircit, k < 0 assombrit
export const ECHELLE = 1.3; // la taille des choses sur l’île, par rapport à une tuile
const L = (x, pts, stroke, w, dash) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.strokeStyle = stroke; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.stroke(); x.setLineDash([]); };
const E = (x, X, Y, rx, ry, fill) => { x.beginPath(); x.ellipse(X, Y, rx, ry, 0, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
const halo = (x, X, Y, r, col, a) => { const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); };
const pop = (t, T) => { if (t == null || reduced) return 1; const p = clamp01((T - t) / .7) - 1; return 1 + 2.7 * p * p * p + 1.7 * p * p; }; // apparaît avec un petit rebond

/* ───────── Les couleurs ───────── */

const COL = {
  sable: ['#f3e3b4', '#e8d49f', '#d9c28a'],
  herbe: ['#a9db60', '#8fc74b', '#76b03c'],
  roche: ['#bcb4a8', '#a49b8e', '#8a8175'],
  neige: ['#ffffff', '#f1f4f7', '#dde3e8'],
  terre: ['#a07752', '#7f5c3d'],
  socle: ['#6b4c34', '#563b27'],
  tronc: ['#a06d47', '#7a5033'],
  bois: ['#c79a63', '#a3784a', '#7f5a36'],
  feuillu: ['#b4e66a', '#84c94a', '#5f9e34'],
  fleuri: ['#ffe1ea', '#f7b3c8', '#df8fab'],
  pin: ['#4f9e66', '#357a4d', '#25593a'],
  nu: ['#9c8b7f', '#75665b'],
  sombre: ['#7a7486', '#575166', '#3d3948'],
  moussue: ['#b3b0a6', '#928f85', '#716e66'],
  cairn: ['#d9d2c3', '#b9b1a1', '#958d7e'],
  galet: ['#eee8dc', '#d4cbbb', '#b6ad9c'],
  pierre: ['#c3bfb6', '#a29e95', '#807c74'],
  murs: ['#f6eddb', '#dccfb5'],
  toit: ['#dc6a52', '#b4503c'],
  blanc: ['#ffffff', '#f0f3f6', '#d6dde4'],
  gris: ['#b4bcc5', '#98a1ab', '#7b848e'],
  orage: ['#737b88', '#5a6270', '#454c59'],
  fleurs: ['#ff6b6b', '#ffd166', '#ff9ecf', '#b08cff', '#ffffff', '#ff8e3c'],
};
export const CLIMATS = {
  N: { ciel: ['#8dcff0', '#e4f4fb'], eau: '#46bcd9', astre: 'soleil', teinte: null, oiseaux: true },
  AS: { ciel: ['#9edbf6', '#effafd'], eau: '#4fc7e3', astre: 'soleil', teinte: null, oiseaux: true },
  ES: { ciel: ['#f8d0a4', '#fdeedd'], eau: '#83c3d4', astre: 'soir', teinte: 'rgba(255,196,130,.15)', oiseaux: true },
  AD: { ciel: ['#f4a98a', '#7b6cae'], eau: '#4a8bb0', astre: 'crepuscule', teinte: 'rgba(170,120,180,.18)', oiseaux: false },
  ED: { ciel: ['#b8c4dc', '#f1ede9'], eau: '#7eadc2', astre: 'brume', teinte: 'rgba(180,185,215,.14)', oiseaux: false },
};

/* ───────── La carte ───────── */

const cartes = new Map();
export function carte(seed) {
  if (cartes.has(seed)) return cartes.get(seed);
  const r = rng(seed), c = (N - 1) / 2;
  const h = new Float32Array(N * N), land = new Uint8Array(N * N), noise = Array.from({ length: N * N }, () => r());
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = i * N + j, d = Math.hypot((i - c) / c, (j - c) / c), n = noise[k], edge = .93 + (n - .5) * .32;
    if (d > edge) { h[k] = -1; continue; }
    land[k] = 1;
    let z = .18 + (edge - d) * 1.05 + (n - .5) * .22;
    z += Math.max(0, 1 - Math.hypot((i - N * .27) / (N * .32), (j - N * .27) / (N * .32))) * 1.35; // la colline, au nord
    h[k] = Math.max(.15, z);
  }
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { // pas de tuile seule, pas de trou
    const k = i * N + j, v = voisins(i, j).filter(([a, b]) => land[a * N + b]).length;
    if (land[k] && v < 2) { land[k] = 0; h[k] = -1; } else if (!land[k] && v >= 3 && i > 0 && j > 0 && i < N - 1 && j < N - 1) { land[k] = 1; h[k] = .22; }
  }
  const vh = new Float32Array((N + 1) * (N + 1));
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    let s = 0, k = 0;
    for (const [di, dj] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N || !land[ii * N + jj]) continue; s += h[ii * N + jj]; k++; }
    vh[i * (N + 1) + j] = k ? (s / k) * (.88 + r() * .24) : 0;
  }
  const m = { N, h, vh, land, seed, rive: [], decor: [] };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!land[i * N + j] && voisins(i, j).some(([a, b]) => land[a * N + b])) m.rive.push([i, j]);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { // un peu de vie au sol, sans rien vouloir dire
    if (!land[i * N + j]) continue;
    const s = sol(m, i, j), n = r();
    if (s === 'herbe' && n < .4) for (let k = 0; k < 2; k++) m.decor.push([i, j, 'touffe', .2 + r() * .6, .2 + r() * .6]);
    else if (s === 'herbe' && n < .62) for (let k = 0; k < 3; k++) m.decor.push([i, j, r() < .7 ? 'paquerette' : 'bouton', .2 + r() * .6, .2 + r() * .6]);
    else if (s === 'sable' && n < .45) m.decor.push([i, j, 'galet', .25 + r() * .5, .25 + r() * .5]);
    else if (s === 'roche' && n < .3) m.decor.push([i, j, 'eclat', .3 + r() * .4, .3 + r() * .4]);
  }
  cartes.set(seed, m);
  return m;
}
const voisins = (i, j) => [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N);
const tuileH = (m, i, j) => (m.vh[i * (N + 1) + j] + m.vh[(i + 1) * (N + 1) + j] + m.vh[i * (N + 1) + j + 1] + m.vh[(i + 1) * (N + 1) + j + 1]) / 4;
export const sol = (m, i, j) => { const z = m.h[i * N + j]; return z < 0 ? 'eau' : z < .34 ? 'sable' : z < 1.3 ? 'herbe' : z < 2.05 ? 'roche' : 'neige'; };

/* ───────── Projection et rotation ───────── */
// La vue tourne par quarts de tour ; la carte, elle, ne bouge pas.

const src = (i, j, rot, n = N - 1) => (rot === 1 ? [j, n - i] : rot === 2 ? [n - i, n - j] : rot === 3 ? [n - j, i] : [i, j]);
export const vue = (a, b, rot, n = N - 1) => (rot === 1 ? [n - b, a] : rot === 2 ? [n - a, n - b] : rot === 3 ? [b, n - a] : [a, b]);
const proj = (o, i, j, z) => [o.ox + (i - j) * o.TW / 2, o.oy + (i + j) * o.TH / 2 - z * o.HZ];

/* ───────── Le placement : les quartiers ───────── */

const QUARTIERS = { foret: [N * .28, N * .72], colline: [N * .26, N * .26], village: [N * .7, N * .7], champs: [N * .72, N * .3], centre: [N * .5, N * .5] };
function zoneDe(a) {
  const e = a.espece;
  if (a.famille === 'meteo') return e === 'etang' ? ['bas', ['herbe', 'sable']] : e === 'fleurs' ? ['pre', ['herbe']] : ['ciel', ['herbe', 'sable', 'roche']];
  if (e === 'caillou') return ['plage', ['sable']];
  if (a.famille === 'arbre') return ['foret', ['herbe', 'roche']];
  if (a.famille === 'pierre') return ['colline', ['roche', 'herbe', 'sable', 'neige']];
  if (a.famille === 'maison') return ['village', ['herbe', 'sable']];
  if (e === 'barque') return ['rive', ['eau']];
  return ['champs', ['herbe', 'sable']];
}
function placer(m, occ, a, r) {
  const [zone, sols] = zoneDe(a);
  const centre = QUARTIERS[zone] || (zone === 'plage' || zone === 'bas' ? [N * .55, N * .62] : zone === 'pre' ? [N * .5, N * .5] : QUARTIERS.champs);
  const cand = [];
  if (zone === 'rive') for (const [i, j] of m.rive) cand.push([i, j, Math.hypot(i - N * .75, j - N * .5) + r() * 1.5]);
  else for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (!m.land[i * N + j]) continue;
    const s = sol(m, i, j), z = m.h[i * N + j];
    if (!sols.includes(s)) continue;
    if (zone === 'plage' && s !== 'sable') continue;
    if (zone === 'bas' && z > .6) continue;
    if ((zone === 'village' || zone === 'champs') && z > 1.25) continue;
    let d = Math.hypot(i - centre[0], j - centre[1]) + r() * 1.6;
    if (zone === 'colline') d -= z * 1.2; // les pierres montent
    if (zone === 'plage') d += Math.abs(i + j - N) * .2;
    cand.push([i, j, d]);
  }
  cand.sort((p, q) => p[2] - q[2]);
  const libre = cand.find(([i, j]) => !occ.has(i * N + j)) || cand[0];
  if (!libre) { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (m.land[i * N + j] && !occ.has(i * N + j)) return [i, j]; return [Math.floor(N / 2), Math.floor(N / 2)]; }
  return [libre[0], libre[1]];
}
const bout = m => { let best = null, bd = -1; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (m.land[i * N + j] && sol(m, i, j) === 'sable' && i + j > bd) { bd = i + j; best = [i, j]; } return best || [N - 2, N - 2]; };

/* ───────── L’île : de ses dépôts à ses choses ───────── */

export const nouvelleIle = () => ({ id: Date.now(), seed: Math.floor(Math.random() * 1e9) + 1, nee: new Date().toISOString(), depots: [], envoyee: false, quittee: null });

// Recalcule tout depuis les dépôts, dans l’ordre : les positions ne bougent pas quand on ajoute.
export function deriver(ile) {
  const m = carte(ile.seed), etat = { assets: [], phare: null, climat: 'N' };
  let dernier = null;
  for (const d of ile.depots) dernier = pousser(etat, d, unpack(d.answers));
  const occ = new Set(), r = rng(ile.seed + 11);
  const phareTile = etat.phare ? bout(m) : null;
  if (phareTile) occ.add(phareTile[0] * N + phareTile[1]);
  for (const a of etat.assets) { a.tile = placer(m, occ, a, r); if (a.famille !== 'meteo' || a.espece === 'etang') occ.add(a.tile[0] * N + a.tile[1]); }
  return { ...etat, ile, m, phareTile, dernier };
}

// Ce qui serait transmis à l’archipel : des comptes, jamais un texte.
export function resume(d) {
  const comptes = {};
  for (const a of d.assets) { const e = especeDe(a); comptes[e] = (comptes[e] || 0) + 1; }
  const qs = d.ile.depots.map(x => x.quad).filter(Boolean);
  const a = qs.length ? qs.reduce((s, q) => s + (q[0] === 'A' ? .85 : q === 'N' ? .45 : .2), 0) / qs.length : .45;
  const v = qs.length ? qs.reduce((s, q) => s + (q[1] === 'S' ? .85 : q === 'N' ? .4 : .2), 0) / qs.length : .4;
  return { comptes, a, v, n: d.assets.length, phare: !!d.phare, climat: d.climat };
}

/* ───────── Les sprites ───────── */
// Chaque chose est dessinée à son pied (X, Y), à l’échelle u (la largeur d’une tuile).

function tronc(x, X, Y, w, h, tons = COL.tronc) {
  P(x, [[X - w * .7, Y + w * .25], [X - w / 2, Y + w * .2], [X, Y + w * .3], [X, Y - h], [X - w / 2, Y - h]], tons[0]); // avec un léger empattement
  P(x, [[X, Y + w * .3], [X + w / 2, Y + w * .2], [X + w * .7, Y + w * .25], [X + w / 2, Y - h], [X, Y - h]], tons[1]);
}
function ombre(x, X, Y, rx, ry, a = .12) { E(x, X + rx * .12, Y + ry * .2, rx, ry, `rgba(40,30,20,${a})`); }
function blob(x, cx, cy, r, tons, k = 7, ry = .92) {
  const pts = [];
  for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (i / k) * Math.PI * 2, rr = r * (i % 2 ? .9 : 1); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * ry]); }
  P(x, pts, tons[1]);
  P(x, [[cx, cy], pts[k - 2], pts[k - 1], pts[0]], tons[0]);
  P(x, [[cx, cy], pts[1], pts[2], pts[3]], tons[2]);
}
function creux(x, X, Y, u) { E(x, X, Y, .05 * u, .07 * u, '#3a2a1f'); }
function unArbre(x, X, Y, u, a, T, o) {
  const e = a.espece;
  if (e === 'pin') {
    tronc(x, X, Y, .12 * u, .3 * u);
    if (a.etats.ferme) creux(x, X, Y - .12 * u, u);
    for (let l = 0; l < 3; l++) {
      const w = (.95 - l * .24) * u, hb = Y - .22 * u - l * .34 * u, ht = hb - .5 * u;
      P(x, [[X - w / 2, hb], [X, ht], [X, hb + .04 * u]], COL.pin[0]);
      P(x, [[X, ht], [X + w / 2, hb], [X, hb + .04 * u]], COL.pin[2]);
    }
  } else if (e === 'nu') {
    const t = COL.nu;
    L(x, [[X, Y + .04 * u], [X, Y - .95 * u]], t[1], .1 * u);
    L(x, [[X, Y - .45 * u], [X - .34 * u, Y - .85 * u], [X - .42 * u, Y - 1.05 * u]], t[1], .06 * u);
    L(x, [[X, Y - .6 * u], [X + .3 * u, Y - .95 * u], [X + .48 * u, Y - 1.05 * u]], t[1], .06 * u);
    L(x, [[X - .2 * u, Y - .69 * u], [X - .3 * u, Y - .92 * u]], t[1], .04 * u);
    L(x, [[X, Y - .95 * u], [X - .12 * u, Y - 1.2 * u]], t[1], .05 * u);
    L(x, [[X, Y - .95 * u], [X + .1 * u, Y - 1.22 * u]], t[1], .05 * u);
    L(x, [[X + .2 * u, Y - .83 * u], [X + .18 * u, Y - 1.05 * u]], t[1], .04 * u);
    L(x, [[X - .03 * u, Y], [X - .03 * u, Y - .9 * u]], t[0], .035 * u);
    if (a.etats.ferme) creux(x, X, Y - .3 * u, u);
  } else {
    const tons = e === 'fleuri' ? COL.fleuri : COL.feuillu;
    tronc(x, X, Y, .13 * u, .42 * u);
    if (a.etats.ferme) creux(x, X, Y - .2 * u, u);
    blob(x, X - .28 * u, Y - .56 * u, .3 * u, tons, 7);
    blob(x, X + .29 * u, Y - .54 * u, .3 * u, tons, 7);
    blob(x, X + .02 * u, Y - .84 * u, .4 * u, tons, 8);
    blob(x, X - .04 * u, Y - .5 * u, .26 * u, tons, 7);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(X - .12 * u, Y - 1.05 * u, .06 * u, 0, Math.PI * 2); x.fill(); // un éclat de lumière
    if (e === 'fleuri') { x.fillStyle = '#fff'; for (const [dx, dy] of [[-.3, -.5], [.25, -.7], [-.05, -1.02], [.12, -.45], [-.2, -.85], [.3, -.42]]) { x.beginPath(); x.arc(X + dx * u, Y + dy * u, .045 * u, 0, Math.PI * 2); x.fill(); } }
  }
}
function arbre(x, X, Y, u, a, T, o) {
  ombre(x, X, Y, (a.stade >= 3 ? .8 : [.3, .4, .5][a.stade]) * u, .16 * u);
  if (a.stade >= 3) { unArbre(x, X - .4 * u, Y - .16 * u, u * .72, a, T, o); unArbre(x, X + .42 * u, Y - .12 * u, u * .66, a, T, o); unArbre(x, X, Y + .04 * u, u * 1.02, a, T, o); }
  else unArbre(x, X, Y, u * [.6, .88, 1.15][a.stade], a, T, o);
  if (a.etats.caillou) pierreUne(x, X + .36 * u, Y + .1 * u, .2 * u, .14 * u, COL.pierre);
  if (a.etats.pluie) { const sc = [.6, .88, 1.15, 1.2][a.stade]; nuage(x, X + .1 * u, Y - (1.35 * sc + .55) * u, u * .55, COL.gris); pluie(x, X + .1 * u, Y - (1.35 * sc + .4) * u, u * .55, T, 4, (1.35 * sc + .3) * u); }
}
function pierreUne(x, cx, cy, w, h, t) {
  const tl = [cx - w * .3, cy - h * .95], tr = [cx + w * .22, cy - h], rm = [cx + w * .48, cy - h * .5], br = [cx + w * .45, cy], bl = [cx - w * .5, cy], lm = [cx - w * .5, cy - h * .45], mid = [cx + w * .04, cy - h * .5];
  P(x, [tl, tr, rm, br, bl, lm], t[1]);
  P(x, [tl, tr, mid, lm], t[0]);
  P(x, [tr, rm, br, mid], t[2]);
}
function pierre(x, X, Y, u, a, T, o) {
  const e = a.espece, tons = e === 'caillou' ? COL.galet : COL[e] || COL.pierre, st = a.stade, terrain = o.m ? sol(o.m, o.i, o.j) : 'herbe';
  ombre(x, X, Y, (e === 'caillou' ? .2 : st >= 3 ? .34 : [.22, .32, .44][st]) * u, .12 * u);
  const Y0 = Y;
  if (a.etats.ferme && st < 3) Y += .08 * u; // à moitié enterrée : plus bas, puis un tertre devant
  if (e === 'caillou') pierreUne(x, X, Y, [.24, .32, .42, .5][st] * u, [.16, .22, .3, .36][st] * u, tons);
  else if (e === 'cairn') { const n = 2 + st; let y = Y, w = (.55 + st * .06) * u; for (let k = 0; k < n; k++) { const h = (.16 + .03 * (n - k)) * u; pierreUne(x, X + (k % 2 ? .03 : -.03) * u, y, w, h, tons); y -= h * .85; w *= .8; } }
  else if (st >= 3) pierreUne(x, X, Y, .5 * u, 1.3 * u, tons);
  else pierreUne(x, X, Y, [.34, .55, .8][st] * u, [.24, .42, .62][st] * u, tons);
  if (a.etats.ferme && st < 3) { tertre(x, X, Y0 + .04 * u, u, terrain); Y = Y0; }
  if (a.etats.fissure) L(x, [[X - .02 * u, Y - .6 * u * [.4, .7, 1, 2][st]], [X + .05 * u, Y - .4 * u * [.4, .7, 1, 2][st]], [X - .04 * u, Y - .25 * u * [.4, .7, 1, 2][st]], [X + .03 * u, Y - .1 * u]], '#3d3948', .035 * u);
  if (a.etats.mousse) { for (const [dx, dy, c] of [[-.22, -.1, '#7bb661'], [.18, -.16, '#8fc44a'], [-.05, -.02, '#7bb661']]) E(x, X + dx * u, Y + dy * u * [.6, .9, 1.2, 2][st], .09 * u, .05 * u, c); fleur(x, X - .3 * u, Y + .04 * u, u, COL.fleurs[0]); fleur(x, X + .28 * u, Y + .05 * u, u, COL.fleurs[1]); }
}
function fleur(x, X, Y, u, col) { L(x, [[X, Y], [X, Y - .12 * u]], '#5f9e34', .025 * u); x.fillStyle = col; x.beginPath(); x.arc(X, Y - .13 * u, .05 * u, 0, Math.PI * 2); x.fill(); }
function boite(x, X, Y, u, style, o = {}, T = 0) {
  const hw = .42 * u, hh = hw * .5, wh = .44 * u, rh = .34 * u;
  const murs = style === 'bois' ? [COL.bois[0], COL.bois[1]] : COL.murs, toit = style === 'bois' ? [COL.bois[1], COL.bois[2]] : COL.toit;
  ombre(x, X, Y + hh * .3, hw * 1.25, hh * 1.2, .1);
  P(x, [[X - hw, Y], [X, Y + hh], [X, Y + hh - wh], [X - hw, Y - wh]], murs[0]);
  P(x, [[X, Y + hh], [X + hw, Y], [X + hw, Y - wh], [X, Y + hh - wh]], murs[1]);
  const dx = X - hw * .5, dy = Y + hh * .5, dw = .075 * u, dh = .24 * u; // la porte, sur le mur gauche, avec son seuil
  P(x, [[dx - dw * 1.4, dy - .5 * dw * 1.4 + .03 * u], [dx + dw * 1.4, dy + .5 * dw * 1.4 + .03 * u], [dx + dw * 1.4, dy + .5 * dw * 1.4], [dx - dw * 1.4, dy - .5 * dw * 1.4]], COL.pierre[2]);
  P(x, [[dx - dw, dy - .5 * dw], [dx + dw, dy + .5 * dw], [dx + dw, dy + .5 * dw - dh], [dx - dw, dy - .5 * dw - dh]], o.ferme ? '#4a3626' : '#7a5236');
  x.fillStyle = '#e9c46a'; x.beginPath(); x.arc(dx + dw * .55, dy + .5 * dw * .55 - dh * .45, .015 * u, 0, Math.PI * 2); x.fill();
  const wx = X + hw * .5, wy = Y + hh * .5 - wh * .5, ww = .08 * u, wwh = .14 * u; // la fenêtre, sur le mur droit, avec son cadre
  const fen = [[wx - ww, wy + .5 * ww], [wx + ww, wy - .5 * ww], [wx + ww, wy - .5 * ww - wwh], [wx - ww, wy + .5 * ww - wwh]];
  P(x, fen.map(([px, py]) => [wx + (px - wx) * 1.25, wy - wwh / 2 + (py - (wy - wwh / 2)) * 1.18]), style === 'bois' ? COL.bois[2] : '#c9bda3');
  if (o.lit) { halo(x, wx, wy - wwh / 2, .5 * u, 'rgba(255,214,102,A)', .38 + .06 * Math.sin(T * 3)); P(x, fen, '#ffd766'); } else P(x, fen, '#6a7d93');
  if (o.volets) { P(x, [fen[0], [wx, wy], [wx, wy - wwh], fen[3]], '#7a5236'); P(x, [[wx + .01 * u, wy - .005 * u], fen[1], fen[2], [wx + .01 * u, wy - wwh - .005 * u]], '#6a4630'); }
  const e = 1.14, apex = [X, Y - wh - rh];
  P(x, [[X - hw * e, Y - wh + hh * (e - 1)], [X, Y + hh * e - wh], apex], toit[0]);
  P(x, [[X, Y + hh * e - wh], [X + hw * e, Y - wh + hh * (e - 1)], apex], toit[1]);
  L(x, [[X, Y + hh * e - wh], apex], style === 'bois' ? COL.bois[0] : '#ea8a72', .02 * u); // l’arête, dans la lumière
  if (style !== 'bois') {
    const cx = X + hw * .5, cy = Y - wh - rh * .42;
    P(x, [[cx - .05 * u, cy], [cx + .05 * u, cy - .025 * u], [cx + .05 * u, cy - .2 * u], [cx - .05 * u, cy - .175 * u]], '#9a9a9a'); P(x, [[cx - .05 * u, cy - .175 * u], [cx + .05 * u, cy - .2 * u], [cx, cy - .24 * u]], '#bdbdbd');
    if (o.lit && speedK) for (let k = 0; k < 3; k++) { const t = ((T * .35 + k * .33) % 1); E(x, cx + Math.sin(t * 6 + k) * .05 * u + t * .1 * u, cy - .3 * u - t * .55 * u, (.05 + t * .07) * u, (.04 + t * .05) * u, `rgba(255,255,255,${(1 - t) * .55})`); } // la fumée
  }
}
function maison(x, X, Y, u, a, T, o) {
  const e = a.espece, st = a.stade;
  if (e === 'banc' || e === 'cloture') ombre(x, X, Y, .45 * u, .12 * u, .09);
  if (e === 'pont') {
    const sc = [.75, .9, 1.05, 1.2][st] * u;
    E(x, X, Y + .02 * u, .55 * sc, .15 * sc, o.eau); E(x, X - .1 * sc, Y, .3 * sc, .07 * sc, '#8fd8ec');
    x.beginPath(); x.moveTo(X - .48 * sc, Y - .02 * sc); x.quadraticCurveTo(X, Y - .46 * sc, X + .48 * sc, Y - .02 * sc); x.strokeStyle = COL.bois[1]; x.lineWidth = .13 * sc; x.lineCap = 'round'; x.stroke();
    x.beginPath(); x.moveTo(X - .46 * sc, Y - .2 * sc); x.quadraticCurveTo(X, Y - .62 * sc, X + .46 * sc, Y - .2 * sc); x.strokeStyle = COL.bois[2]; x.lineWidth = .035 * sc; x.stroke();
    for (const t of [.06, .5, .94]) { const px = lerp(X - .47 * sc, X + .47 * sc, t), py = (1 - t) ** 2 * (Y - .02 * sc) + 2 * (1 - t) * t * (Y - .46 * sc) + t * t * (Y - .02 * sc); L(x, [[px, py + .03 * sc], [px, py - .2 * sc]], COL.bois[2], .04 * sc); }
    if (a.etats.ferme) L(x, [[X - .2 * sc, Y - .28 * sc], [X + .2 * sc, Y - .16 * sc]], '#4a3626', .05 * sc);
    return;
  }
  if (e === 'banc') {
    const sc = [.8, .95, 1.1, 1.2][st] * u;
    L(x, [[X - .22 * sc, Y - .02 * sc], [X - .22 * sc, Y - .26 * sc]], COL.bois[2], .045 * sc); L(x, [[X + .22 * sc, Y + .02 * sc], [X + .22 * sc, Y - .22 * sc]], COL.bois[2], .045 * sc);
    P(x, [[X - .32 * sc, Y - .24 * sc], [X + .32 * sc, Y - .19 * sc], [X + .32 * sc, Y - .13 * sc], [X - .32 * sc, Y - .18 * sc]], COL.bois[1]);
    P(x, [[X - .32 * sc, Y - .3 * sc], [X + .32 * sc, Y - .25 * sc], [X + .32 * sc, Y - .19 * sc], [X - .32 * sc, Y - .24 * sc]], COL.bois[0]);
    P(x, [[X - .3 * sc, Y - .5 * sc], [X + .3 * sc, Y - .45 * sc], [X + .3 * sc, Y - .38 * sc], [X - .3 * sc, Y - .43 * sc]], COL.bois[0]);
    L(x, [[X - .26 * sc, Y - .28 * sc], [X - .26 * sc, Y - .5 * sc]], COL.bois[2], .04 * sc); L(x, [[X + .26 * sc, Y - .23 * sc], [X + .26 * sc, Y - .45 * sc]], COL.bois[2], .04 * sc);
    if (st >= 2) lanterne(x, X + .48 * sc, Y + .04 * sc, u * .9, T);
    return;
  }
  if (e === 'cloture') {
    const n = 3 + Math.min(st, 2), pts = Array.from({ length: n }, (_, k) => [X - .45 * u + (k * .9 * u) / (n - 1), Y + .22 * u - (k * .45 * u) / (n - 1)]);
    for (const [px, py] of pts) L(x, [[px, py + .02 * u], [px, py - .34 * u]], COL.bois[2], .055 * u);
    L(x, pts.slice(0, -1).map(([px, py]) => [px, py - .14 * u]), COL.bois[1], .04 * u);
    L(x, pts.slice(0, -1).map(([px, py]) => [px, py - .27 * u]), COL.bois[0], .04 * u);
    const [ax, ay] = pts[n - 2], [bx, by] = pts[n - 1];
    L(x, [[ax, ay - .27 * u], [bx + .04 * u, by + .02 * u]], COL.bois[1], .04 * u); // la traverse tombée
    return;
  }
  if (st >= 3) { boite(x, X - .62 * u, Y - .3 * u, u * .58, 'pierre', {}, T); boite(x, X + .6 * u, Y - .28 * u, u * .55, 'bois', {}, T); }
  else if (st >= 2) boite(x, X - .58 * u, Y - .28 * u, u * .58, 'bois', {}, T);
  boite(x, X, Y, u * (st === 0 ? .72 : .98), st === 0 ? 'bois' : 'pierre', { lit: a.etats.lueur, volets: e === 'volets' && a.quad[1] !== 'S', ferme: a.etats.ferme }, T);
}
function culture(x, X, Y, u, a, T, o) {
  const e = a.espece, st = a.stade;
  if (e !== 'champ' && e !== 'barque') ombre(x, X, Y, .3 * u, .12 * u);
  if (e === 'champ') {
    const tw = .43 * u, th = tw * .5, ferme = a.etats.ferme;
    P(x, [[X, Y - th], [X + tw, Y], [X, Y + th], [X - tw, Y]], ferme ? '#cfc9a3' : '#e6cb5c');
    for (const t of [.2, .4, .6, .8]) { const px = X - tw + t * tw, py = Y + t * th; L(x, [[px, py], [px + tw, py - th]], ferme ? '#b3ad88' : '#c9a93a', .05 * u); }
    if (!ferme) for (let k = 0; k < 6; k++) { const t = .15 + k * .14, px = X - tw * .6 + t * tw * 1.2, py = Y + (k % 2 ? .05 : -.05) * u; L(x, [[px, py], [px, py - .16 * u]], '#e0b63a', .03 * u); x.fillStyle = '#f2d36a'; x.beginPath(); x.arc(px, py - .18 * u, .035 * u, 0, Math.PI * 2); x.fill(); }
    if (st >= 2) { // le moulin
      const mx = X + .02 * u, my = Y - .06 * u;
      P(x, [[mx - .18 * u, my], [mx, my + .06 * u], [mx, my - .62 * u], [mx - .13 * u, my - .62 * u]], COL.blanc[0]); P(x, [[mx, my + .06 * u], [mx + .18 * u, my], [mx + .13 * u, my - .62 * u], [mx, my - .62 * u]], COL.blanc[2]);
      P(x, [[mx - .16 * u, my - .6 * u], [mx + .16 * u, my - .6 * u], [mx, my - .82 * u]], COL.bois[1]);
      const ang = T * .7 * speedK; x.save(); x.translate(mx + .02 * u, my - .66 * u); x.rotate(ang);
      for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); L(x, [[0, 0], [.42 * u, 0]], COL.bois[2], .035 * u); P(x, [[.1 * u, 0], [.4 * u, 0], [.4 * u, -.09 * u], [.1 * u, -.07 * u]], '#f3e7cf'); }
      x.restore();
    }
    return;
  }
  if (e === 'puits') {
    const sc = [.8, .95, 1.1, 1.2][st] * u;
    P(x, [[X - .22 * sc, Y - .1 * sc], [X + .22 * sc, Y - .1 * sc], [X + .22 * sc, Y + .06 * sc], [X - .22 * sc, Y + .06 * sc]], COL.pierre[1]);
    P(x, [[X, Y - .1 * sc], [X + .22 * sc, Y - .1 * sc], [X + .22 * sc, Y + .06 * sc], [X, Y + .06 * sc]], COL.pierre[2]);
    E(x, X, Y - .1 * sc, .22 * sc, .1 * sc, a.etats.ferme ? COL.bois[1] : '#2c3a48');
    if (!a.etats.ferme) E(x, X, Y - .1 * sc, .16 * sc, .06 * sc, '#3f6f8c');
    L(x, [[X - .17 * sc, Y - .06 * sc], [X - .17 * sc, Y - .5 * sc]], COL.bois[2], .04 * sc); L(x, [[X + .17 * sc, Y - .06 * sc], [X + .17 * sc, Y - .5 * sc]], COL.bois[2], .04 * sc);
    P(x, [[X - .26 * sc, Y - .48 * sc], [X + .26 * sc, Y - .48 * sc], [X, Y - .66 * sc]], COL.toit[1]);
    L(x, [[X, Y - .48 * sc], [X, Y - .3 * sc]], '#6b5b50', .02 * sc);
    if (st >= 2) P(x, [[X - .05 * sc, Y - .3 * sc], [X + .05 * sc, Y - .3 * sc], [X + .04 * sc, Y - .2 * sc], [X - .04 * sc, Y - .2 * sc]], COL.bois[2]);
    return;
  }
  if (e === 'feu') {
    const sc = [.7, .9, 1.05, 1.2][st] * u, fl = 1 + .1 * Math.sin(T * 9 * speedK) + .06 * Math.sin(T * 13.7 * speedK);
    L(x, [[X - .28 * sc, Y + .06 * sc], [X + .25 * sc, Y - .06 * sc]], COL.bois[2], .07 * sc); L(x, [[X - .25 * sc, Y - .06 * sc], [X + .28 * sc, Y + .06 * sc]], COL.bois[1], .07 * sc);
    if (a.etats.ferme) { for (const [dx, dy] of [[-.08, -.02], [.06, -.05], [0, .02]]) E(x, X + dx * sc, Y + dy * sc, .045 * sc, .03 * sc, '#e07a3a'); return; }
    halo(x, X, Y - .15 * sc, .7 * sc, 'rgba(255,150,60,A)', .28);
    P(x, [[X - .17 * sc, Y - .02 * sc], [X - .08 * sc, Y - .28 * sc * fl], [X + .02 * sc, Y - .5 * sc * fl], [X + .1 * sc, Y - .26 * sc * fl], [X + .17 * sc, Y - .02 * sc]], '#ff8e3c');
    P(x, [[X - .09 * sc, Y - .02 * sc], [X - .03 * sc, Y - .18 * sc * fl], [X + .02 * sc, Y - .32 * sc * fl], [X + .06 * sc, Y - .16 * sc * fl], [X + .09 * sc, Y - .02 * sc]], '#ffd166');
    return;
  }
  if (e === 'barque') {
    const sc = [.8, .95, 1.1, 1.2][st] * u, yb = Y + Math.sin(T * 1.3 * speedK) * .02 * u - .04 * u;
    if (st >= 2) { const bx = X + .35 * u, by = yb - .2 * u, s2 = sc * .7; P(x, [[bx - .35 * s2, by - .08 * s2], [bx + .38 * s2, by - .08 * s2], [bx + .28 * s2, by + .06 * s2], [bx - .25 * s2, by + .06 * s2]], COL.bois[2]); P(x, [[bx - .28 * s2, by - .07 * s2], [bx + .3 * s2, by - .07 * s2], [bx + .22 * s2, by], [bx - .2 * s2, by]], COL.bois[0]); }
    P(x, [[X - .35 * sc, yb - .08 * sc], [X + .38 * sc, yb - .08 * sc], [X + .28 * sc, yb + .06 * sc], [X - .25 * sc, yb + .06 * sc]], COL.bois[2]);
    P(x, [[X - .28 * sc, yb - .07 * sc], [X + .3 * sc, yb - .07 * sc], [X + .22 * sc, yb], [X - .2 * sc, yb]], a.etats.ferme ? COL.gris[1] : COL.bois[0]);
    L(x, [[X - .05 * sc, yb - .07 * sc], [X - .05 * sc, yb]], COL.bois[2], .03 * sc);
    L(x, [[X + .1 * sc, yb - .06 * sc], [X + .3 * sc, yb - .22 * sc]], COL.bois[2], .03 * sc);
    return;
  }
}
function nuage(x, X, Y, u, tons) {
  P(x, [[X - .48 * u, Y], [X + .48 * u, Y], [X + .44 * u, Y + .1 * u], [X - .44 * u, Y + .1 * u]], tons[1]);
  blob(x, X - .25 * u, Y - .02 * u, .24 * u, tons, 8); blob(x, X + .27 * u, Y, .22 * u, tons, 8); blob(x, X, Y - .12 * u, .32 * u, tons, 8);
}
function pluie(x, X, Y, u, T, n, chute = 1.3 * u) {
  for (let k = 0; k < n; k++) { const t = ((T * 1.6 * speedK + k * .37) % 1), px = X - .34 * u + (k * .68 * u) / (n - 1), py = Y + t * chute; L(x, [[px, py], [px - .03 * u, py + .16 * u]], `rgba(120,190,225,${.85 - t * .5})`, .035 * u); }
}
function meteo(x, X, Y, u, a, T, o) {
  const e = a.espece, st = a.stade, sc = [.8, 1, 1.15, 1.3][st], drift = Math.sin(T * .35 * speedK + X * .01) * .15 * u, haut = (o.bas ? 1.05 : 1.55) * u;
  if (e === 'orage' || e === 'pluie') E(x, X + drift, Y, .42 * u * sc, .15 * u * sc, 'rgba(40,45,70,.16)'); // son ombre, au sol
  if (e === 'orage') {
    nuage(x, X + drift, Y - haut, u * sc, COL.orage);
    const on = reduced ? .5 : Math.sin(T * 6.3) > .86 ? 1 : .15;
    L(x, [[X + drift + .06 * u, Y - haut + .1 * u], [X + drift - .08 * u, Y - haut * .62], [X + drift + .05 * u, Y - haut * .58], [X + drift - .06 * u, Y - .05 * u]], `rgba(255,224,102,${on})`, .05 * u);
    if (on > .5) halo(x, X + drift, Y - haut * .5, .7 * u, 'rgba(255,240,180,A)', .25);
  } else if (e === 'pluie') { nuage(x, X + drift, Y - haut, u * sc, COL.gris); pluie(x, X + drift, Y - haut + .12 * u, u * sc, T, 7, haut - .15 * u); E(x, X + drift, Y + .02 * u, .22 * u, .07 * u, 'rgba(130,200,230,.45)'); }
  else if (e === 'fleurs') {
    const r = rng(o.i * 31 + o.j * 7 + 3);
    for (let k = 0; k < 6 + st * 2; k++) fleur(x, X + (r() - .5) * .8 * u, Y + (r() - .5) * .38 * u, u * .9, COL.fleurs[k % COL.fleurs.length]);
  } else if (e === 'etang') {
    const rx = .46 * u * sc, ry = .22 * u * sc, pts = [];
    for (let k = 0; k < 9; k++) { const an = (k / 9) * Math.PI * 2, rr = 1 + (k % 2 ? -.08 : .06); pts.push([X + Math.cos(an) * rx * rr, Y + Math.sin(an) * ry * rr]); }
    P(x, pts, COL.sable[1]); P(x, pts.map(([px, py]) => [X + (px - X) * .86, Y + (py - Y) * .86]), o.eau); E(x, X - rx * .2, Y - ry * .2, rx * .35, ry * .3, '#9fe0f0');
    E(x, X + drift * .5, Y - .12 * u, .55 * u, .1 * u, 'rgba(255,255,255,.28)');
  } else if (e === 'caillou') pierreUne(x, X, Y, [.24, .34, .46, .58][st] * u, [.16, .24, .32, .4][st] * u, COL.galet);
}
function lanterne(x, X, Y, u, T) { // un réverbère, près du banc
  E(x, X, Y, .06 * u, .03 * u, '#3f3834');
  L(x, [[X, Y], [X, Y - .5 * u]], '#3f3834', .035 * u);
  halo(x, X, Y - .57 * u, .45 * u, 'rgba(255,214,120,A)', .4 + .05 * Math.sin(T * 2.3 * speedK));
  P(x, [[X - .06 * u, Y - .5 * u], [X + .06 * u, Y - .5 * u], [X + .05 * u, Y - .64 * u], [X - .05 * u, Y - .64 * u]], '#ffe39a');
  P(x, [[X - .09 * u, Y - .64 * u], [X + .09 * u, Y - .64 * u], [X, Y - .73 * u]], '#3f3834');
}
function lueur(x, X, Y, u, T, ph = 0) { // il y a un texte : une lumière flotte à côté, jamais son contenu
  const cx = X + Math.cos(T * .7 * speedK + ph) * .07 * u, cy = Y + Math.sin(T * 1.6 * speedK + ph) * .06 * u;
  halo(x, cx, cy, .45 * u, 'rgba(255,214,130,A)', .5);
  halo(x, cx, cy, .13 * u, 'rgba(255,250,225,A)', .95);
  x.fillStyle = '#fffbea'; x.beginPath(); x.arc(cx, cy, .045 * u, 0, Math.PI * 2); x.fill();
  for (let k = 0; k < 3; k++) { const an = T * 1.1 * speedK + ph + k * 2.1; x.fillStyle = `rgba(255,236,170,${.45 + .4 * Math.sin(T * 3 * speedK + k + ph)})`; x.beginPath(); x.arc(cx + Math.cos(an) * .2 * u, cy + Math.sin(an) * .09 * u - .04 * u, .02 * u, 0, Math.PI * 2); x.fill(); }
}
function sentier(x, X, Y, u) { // ça tourne en boucle : un sentier usé, tout autour
  x.beginPath(); x.ellipse(X, Y + .03 * u, .42 * u, .2 * u, 0, 0, Math.PI * 2); x.strokeStyle = 'rgba(196,160,110,.9)'; x.lineWidth = .075 * u; x.stroke();
  x.beginPath(); x.ellipse(X, Y + .025 * u, .42 * u, .2 * u, 0, Math.PI * 1.05, Math.PI * 1.95); x.strokeStyle = 'rgba(236,214,170,.9)'; x.lineWidth = .025 * u; x.stroke();
}
function tertre(x, X, Y, u, terrain) { // jamais dit : la chose sort à peine d’un petit tertre
  const t = terrain === 'sable' ? COL.sable : COL.herbe;
  P(x, [[X - .32 * u, Y + .02 * u], [X - .14 * u, Y - .07 * u], [X + .16 * u, Y - .06 * u], [X + .33 * u, Y + .02 * u], [X + .06 * u, Y + .11 * u]], t[1]);
  P(x, [[X - .32 * u, Y + .02 * u], [X - .14 * u, Y - .07 * u], [X + .02 * u, Y - .02 * u], [X + .06 * u, Y + .11 * u]], t[0]);
  L(x, [[X - .18 * u, Y + .02 * u], [X - .2 * u, Y - .06 * u]], COL.herbe[2], .02 * u); L(x, [[X + .2 * u, Y + .02 * u], [X + .23 * u, Y - .05 * u]], COL.herbe[2], .02 * u);
}
function phare(x, X, Y, u, T) {
  const w = .36 * u, h = 1.35 * u;
  ombre(x, X, Y, .32 * u, .14 * u);
  for (const [dx, dy, ww] of [[-.3, .08, .16], [.28, .1, .14], [.05, .16, .12]]) pierreUne(x, X + dx * u, Y + dy * u, ww * u, ww * .6 * u, COL.pierre); // des rochers au pied
  P(x, [[X - w / 2, Y + .06 * u], [X, Y + .12 * u], [X, Y - h], [X - w * .36, Y - h]], COL.blanc[0]); P(x, [[X, Y + .12 * u], [X + w / 2, Y + .06 * u], [X + w * .36, Y - h], [X, Y - h]], COL.blanc[2]);
  for (const t of [.3, .62]) { const yy = Y - h * t, ww = w * (1 - .28 * t) / 2; P(x, [[X - ww, yy + .08 * u], [X, yy + .12 * u], [X, yy - .02 * u], [X - ww, yy - .06 * u]], '#e04e4e'); P(x, [[X, yy + .12 * u], [X + ww, yy + .08 * u], [X + ww, yy - .06 * u], [X, yy - .02 * u]], '#b93d3d'); }
  E(x, X, Y - h, w * .5, w * .22, '#4a4a55');
  const ang = T * .8 * speedK;
  x.fillStyle = 'rgba(255,240,170,.22)'; x.beginPath(); x.moveTo(X, Y - h - .12 * u); x.lineTo(X + Math.cos(ang) * 1.7 * u, Y - h - .12 * u + Math.sin(ang) * .6 * u - .25 * u); x.lineTo(X + Math.cos(ang + .5) * 1.7 * u, Y - h - .12 * u + Math.sin(ang + .5) * .6 * u + .1 * u); x.closePath(); x.fill();
  halo(x, X, Y - h - .12 * u, .5 * u, 'rgba(255,240,170,A)', .5);
  P(x, [[X - .1 * u, Y - h], [X + .1 * u, Y - h], [X + .1 * u, Y - h - .22 * u], [X - .1 * u, Y - h - .22 * u]], '#ffe9a3');
  P(x, [[X - .14 * u, Y - h - .22 * u], [X + .14 * u, Y - h - .22 * u], [X, Y - h - .38 * u]], '#4a4a55');
}
const DESSINS = { arbre, pierre, maison, culture, meteo, caillou: pierre };

export function dessinerChose(x, X, Y, u, a, T, o = {}) {
  x.save();
  if (a.propose) x.globalAlpha *= .5; // proposé d’après le texte, pas encore confirmé
  if (a.etats?.boucle && a.famille !== 'meteo') sentier(x, X, Y, u);
  if (a.etats?.double && a.famille !== 'meteo') DESSINS[a.famille](x, X + .34 * u, Y - .15 * u, u * .68, a, T, o);
  DESSINS[a.famille](x, X, Y, u, a, T, o);
  if (a.etats?.lueur && !(a.famille === 'maison' && ['maison', 'volets'].includes(a.espece))) lueur(x, X + .38 * u, Y - (a.famille === 'arbre' ? .75 : .5) * u, u, T, X * .07 + Y * .05);
  x.restore();
}

/* ───────── Le ciel, la mer, le socle ───────── */

function ciel(x, W, H, climat, T, r) {
  const c = CLIMATS[climat] || CLIMATS.N, g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.ciel[0]); g.addColorStop(1, c.ciel[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (c.astre === 'soleil') { halo(x, W * .82, H * .16, W * .16, 'rgba(255,240,150,A)', .55); E(x, W * .82, H * .16, W * .045, W * .045, '#ffe66d'); }
  if (c.astre === 'brume') { halo(x, W * .74, H * .24, W * .24, 'rgba(255,246,228,A)', .8); E(x, W * .74, H * .24, W * .045, W * .045, 'rgba(255,250,240,.9)'); for (let k = 0; k < 3; k++) { const by = H * (.18 + k * .08) + Math.sin(T * .2 + k) * 3, g = x.createLinearGradient(0, by - H * .03, 0, by + H * .03); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, by - H * .03, W, H * .06); } }
  if (c.astre === 'soir') { halo(x, W * .84, H * .3, W * .2, 'rgba(255,190,110,A)', .6); E(x, W * .84, H * .3, W * .055, W * .055, '#ffb45c'); }
  if (c.astre === 'crepuscule') { halo(x, W * .16, H * .34, W * .2, 'rgba(255,120,90,A)', .5); E(x, W * .16, H * .34, W * .05, W * .05, '#ff8a65'); x.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc(((r() * .9 + .05) * W), r() * H * .26, 1.1, 0, Math.PI * 2); x.fill(); } }
  for (let k = 0; k < 2; k++) { const cx = ((r() * W + T * 3 * speedK * (k + 1)) % (W + 120)) - 60, cy = H * (.08 + k * .09); nuage(x, cx, cy, W * .11, climat === 'ED' || climat === 'AD' ? COL.gris : COL.blanc); }
  if (c.oiseaux) for (let k = 0; k < 3; k++) { // des oiseaux, qui passent
    const bx = ((T * 11 * speedK + k * 150 + r() * 60) % (W + 80)) - 40, by = H * (.13 + k * .05) + Math.sin(T * .8 + k) * 5, fl = Math.sin(T * 7 * speedK + k * 2) * .35, s = 5 + k;
    x.strokeStyle = 'rgba(60,50,60,.55)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(bx - s, by + fl * s); x.quadraticCurveTo(bx - s * .4, by - s * .3, bx, by); x.quadraticCurveTo(bx + s * .4, by - s * .3, bx + s, by + fl * s); x.stroke();
  }
}

function socle(x, o, climat, T, r) {
  const c = CLIMATS[climat] || CLIMATS.N, z = -.12, e = .35;
  const top = proj(o, -e, -e, z), right = proj(o, N + e, -e, z), bottom = proj(o, N + e, N + e, z), left = proj(o, -e, N + e, z), B = o.TH * 2.4;
  const g = x.createRadialGradient(o.ox, bottom[1] + B * .55, 0, o.ox, bottom[1] + B * .55, (right[0] - left[0]) * .55); // l’ombre portée du socle
  g.addColorStop(0, 'rgba(30,20,10,.28)'); g.addColorStop(1, 'rgba(30,20,10,0)');
  x.save(); x.translate(0, bottom[1] + B * .55); x.scale(1, .32); x.translate(0, -(bottom[1] + B * .55)); x.fillStyle = g; x.beginPath(); x.arc(o.ox, bottom[1] + B * .55, (right[0] - left[0]) * .55, 0, Math.PI * 2); x.fill(); x.restore();
  const face = (a, b, tons, eauK) => { // une face du socle : la tranche d’eau, la terre, deux strates, la roche
    const at = (p, k) => [p[0], p[1] + B * k];
    P(x, [a, b, at(b, 1), at(a, 1)], tons[0]);
    P(x, [at(a, .72), at(b, .72), at(b, 1), at(a, 1)], tons[1]);
    L(x, [at(a, .5), at(b, .5)], 'rgba(40,25,15,.18)', 1);
    P(x, [a, b, at(b, .26), at(a, .26)], nuance(c.eau, eauK));
    L(x, [at(a, .26), at(b, .26)], 'rgba(255,255,255,.35)', 1);
  };
  face(left, bottom, ['#7a5a3d', '#5f4530'], -.18);
  face(bottom, right, ['#634832', '#4c3625'], -.32);
  const cx = (top[0] + bottom[0]) / 2, cy = (top[1] + bottom[1]) / 2, g2 = x.createRadialGradient(cx, cy, 0, cx, cy, (right[0] - left[0]) * .55);
  g2.addColorStop(0, nuance(c.eau, .12)); g2.addColorStop(1, nuance(c.eau, -.12));
  P(x, [top, right, bottom, left], g2);
  for (let k = 0; k < 34; k++) { // des facettes qui respirent
    const i = -e + r() * (N + 2 * e), j = -e + r() * (N + 2 * e), a = .05 + .07 * Math.sin(T * .8 * speedK + k), p = proj(o, i, j, z);
    P(x, [p, proj(o, i + .8, j, z), proj(o, i + .3, j + .7, z)], `rgba(255,255,255,${a})`);
  }
  for (let k = 0; k < 22; k++) { // des étincelles
    const i = -e + r() * (N + 2 * e), j = -e + r() * (N + 2 * e), a = Math.max(0, Math.sin(T * 1.4 * speedK + k * 1.7)) * .7, p = proj(o, i, j, z);
    L(x, [[p[0] - o.TW * .06, p[1]], [p[0] + o.TW * .06, p[1]]], `rgba(255,255,255,${a})`, 1.2);
  }
}

// Le rivage : l’eau claire au bord de la terre, et l’écume.
function rivage(x, o, m, rot, T) {
  const z = -.12, terre = (i, j) => { if (i < 0 || j < 0 || i >= N || j >= N) return false; const [a, b] = src(i, j, rot); return !!m.land[a * N + b]; };
  for (const [si, sj] of m.rive) { // l’eau claire, en halo doux
    const [i, j] = vue(si, sj, rot), [X, Y] = proj(o, i + .5, j + .5, z), R = o.TW * .9;
    const g = x.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(215,250,244,.42)'); g.addColorStop(1, 'rgba(215,250,244,0)');
    x.save(); x.translate(X, Y); x.scale(1, .5); x.translate(-X, -Y); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.fill(); x.restore();
  }
  for (const [si, sj] of m.rive) {
    const [i, j] = vue(si, sj, rot);
    const c = [i + .5, j + .5], aretes = [[[i + 1, j], [i + 1, j + 1], terre(i + 1, j)], [[i, j], [i, j + 1], terre(i - 1, j)], [[i, j + 1], [i + 1, j + 1], terre(i, j + 1)], [[i, j], [i + 1, j], terre(i, j - 1)]];
    for (const [p, q, t] of aretes) {
      if (!t) continue;
      const k = .12 + .06 * Math.sin(T * 1.3 * speedK + i + j), a = proj(o, p[0] + (c[0] - p[0]) * k, p[1] + (c[1] - p[1]) * k, z), b = proj(o, q[0] + (c[0] - q[0]) * k, q[1] + (c[1] - q[1]) * k, z);
      L(x, [a, b], `rgba(255,255,255,${.5 + .22 * Math.sin(T * 1.1 * speedK + i * 2 + j)})`, o.TW * .045);
    }
  }
}

/* ───────── L’île, dessinée ───────── */
// opts : { rot, vie (Map clé → instant d’apparition), sel (clé choisie), hits (tableau rempli) , cadre: { ox, oy, TW } }

export function dessinerIle(x, W, H, d, opts = {}, T = 0) {
  const rot = opts.rot || 0, m = d.m, r = rng(m.seed + 5);
  const TW = opts.TW || Math.min(46, (W - 8) / (N + 1.2)), TH = TW / 2, HZ = TW * .42;
  const o = { ox: W / 2, oy: opts.oy ?? H * .55 - (N * TH) / 2, TW, TH, HZ };
  const eau = (CLIMATS[d.climat] || CLIMATS.N).eau;
  if (!opts.sansCiel) ciel(x, W, H, d.climat, T, rng(m.seed + 9));
  if (!opts.sansSocle) socle(x, o, d.climat, T, r);
  rivage(x, o, m, rot, T);
  const decor = new Map();
  for (const [si, sj, kind, dx, dy] of m.decor) { const [vi, vj] = vue(si, sj, rot); const k = vi * N + vj; (decor.get(k) || decor.set(k, []).get(k)).push([kind, dx, dy]); }
  const parTuile = new Map();
  for (const a of d.assets) { const [vi, vj] = vue(a.tile[0], a.tile[1], rot); const k = vi * N + vj; (parTuile.get(k) || parTuile.set(k, []).get(k)).push(a); }
  const hits = opts.hits || [];
  hits.length = 0;
  const pt = (i, j) => m.vh[i * (N + 1) + j];
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = Math.max(0, s - N + 1); i <= Math.min(N - 1, s); i++) {
    const j = s - i, [si, sj] = src(i, j, rot);
    if (m.land[si * N + sj]) {
      const [a00, b00] = src(i, j, rot, N), [a10, b10] = src(i + 1, j, rot, N), [a11, b11] = src(i + 1, j + 1, rot, N), [a01, b01] = src(i, j + 1, rot, N);
      const z00 = pt(a00, b00), z10 = pt(a10, b10), z11 = pt(a11, b11), z01 = pt(a01, b01);
      const p00 = proj(o, i, j, z00), p10 = proj(o, i + 1, j, z10), p11 = proj(o, i + 1, j + 1, z11), p01 = proj(o, i, j + 1, z01);
      const base = -.12;
      P(x, [p01, p11, proj(o, i + 1, j + 1, base), proj(o, i, j + 1, base)], COL.terre[0]);
      P(x, [p10, p11, proj(o, i + 1, j + 1, base), proj(o, i + 1, j, base)], COL.terre[1]);
      const tons = COL[sol(m, si, sj)] || COL.herbe;
      const shade = (pa, pb, pc, za, zb, zc, ia, ja, ib, jb, ic, jc) => { // une lumière venant de la gauche et du haut
        const ux = ib - ia, uy = jb - ja, uz = (zb - za) * .5, vx = ic - ia, vy = jc - ja, vz = (zc - za) * .5;
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, n = Math.hypot(nx, ny, nz) || 1, sgn = nz < 0 ? -1 : 1;
        const l = (sgn * (nx * -.62 + ny * .2 + nz * 1)) / n / 1.2;
        return l > .84 ? tons[0] : l > .74 ? tons[1] : tons[2];
      };
      if ((si + sj) % 2) { P(x, [p00, p10, p11], shade(p00, p10, p11, z00, z10, z11, i, j, i + 1, j, i + 1, j + 1)); P(x, [p00, p11, p01], shade(p00, p11, p01, z00, z11, z01, i, j, i + 1, j + 1, i, j + 1)); }
      else { P(x, [p00, p10, p01], shade(p00, p10, p01, z00, z10, z01, i, j, i + 1, j, i, j + 1)); P(x, [p10, p11, p01], shade(p10, p11, p01, z10, z11, z01, i + 1, j, i + 1, j + 1, i, j + 1)); }
      const terre = (a, b) => { if (a < 0 || b < 0 || a >= N || b >= N) return false; const [sa, sb] = src(a, b, rot); return !!m.land[sa * N + sb]; };
      if (!terre(i, j + 1)) { L(x, [p01, p11], tons[0], 1.3); L(x, [[lerp(p01[0], proj(o, i, j + 1, base)[0], .55), lerp(p01[1], proj(o, i, j + 1, base)[1], .55)], [lerp(p11[0], proj(o, i + 1, j + 1, base)[0], .55), lerp(p11[1], proj(o, i + 1, j + 1, base)[1], .55)]], 'rgba(60,40,25,.18)', 1); } // la lèvre d’herbe et une strate
      if (!terre(i + 1, j)) { L(x, [p10, p11], tons[0], 1.3); L(x, [[lerp(p10[0], proj(o, i + 1, j, base)[0], .55), lerp(p10[1], proj(o, i + 1, j, base)[1], .55)], [lerp(p11[0], proj(o, i + 1, j + 1, base)[0], .55), lerp(p11[1], proj(o, i + 1, j + 1, base)[1], .55)]], 'rgba(60,40,25,.18)', 1); }
      const dec = decor.get(i * N + j);
      if (dec) for (const [kind, dx, dy] of dec) {
        const zc = (z00 * (1 - dx) * (1 - dy) + z10 * dx * (1 - dy) + z01 * (1 - dx) * dy + z11 * dx * dy), [X, Y] = proj(o, i + dx, j + dy, zc);
        if (kind === 'touffe') { L(x, [[X, Y], [X - .05 * TW, Y - .12 * TW]], COL.herbe[2], 1.2); L(x, [[X, Y], [X + .02 * TW, Y - .14 * TW]], COL.herbe[2], 1.2); L(x, [[X, Y], [X + .06 * TW, Y - .1 * TW]], COL.herbe[2], 1.2); }
        else if (kind === 'galet') E(x, X, Y, .045 * TW, .03 * TW, COL.sable[2]);
        else if (kind === 'paquerette' || kind === 'bouton') { x.fillStyle = kind === 'bouton' ? '#ffd166' : '#fffdf5'; x.beginPath(); x.arc(X, Y - .02 * TW, .028 * TW, 0, Math.PI * 2); x.fill(); }
        else P(x, [[X - .05 * TW, Y], [X + .04 * TW, Y - .01 * TW], [X, Y - .07 * TW]], COL.roche[2]);
      }
    }
    const zc = m.land[si * N + sj] ? tuileH(m, si, sj) : -.12;
    const ici = parTuile.get(i * N + j);
    if (ici) for (const a of ici) {
      const [X, Y] = proj(o, i + .5, j + .5, zc), sc = pop(opts.vie?.get(a.key), T), u = TW * sc * ECHELLE, U = TW * ECHELLE;
      if (opts.sel === a.key) { x.beginPath(); x.ellipse(X, Y + .04 * U, .5 * U, .24 * U, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2; x.stroke(); }
      dessinerChose(x, X, Y, u, a, T, { m, i: si, j: sj, eau });
      hits.push({ key: a.key, X, Y: Y - .45 * U, r: U * .6 });
    }
    if (d.phareTile && vue(d.phareTile[0], d.phareTile[1], rot).join() === [i, j].join()) { const [X, Y] = proj(o, i + .5, j + .5, zc), U = TW * ECHELLE; phare(x, X, Y, U, T); hits.push({ key: 'phare', X, Y: Y - .7 * U, r: U * .8 }); }
  }
  const cl = CLIMATS[d.climat] || CLIMATS.N;
  if (cl.teinte && !opts.sansCiel) { x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = cl.teinte; x.fillRect(0, 0, W, H); x.restore(); }
  if (cl.astre && !opts.sansCiel) { // une lumière douce, venue de l’astre
    const [sx, sy] = cl.astre === 'soleil' ? [W * .82, H * .16] : cl.astre === 'soir' ? [W * .84, H * .3] : cl.astre === 'brume' ? [W * .74, H * .24] : [W * .16, H * .34], g = x.createRadialGradient(sx, sy, 0, sx, sy, W);
    g.addColorStop(0, 'rgba(255,228,170,.26)'); g.addColorStop(1, 'rgba(255,228,170,0)');
    x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
  }
  return hits;
}

/* ───────── Les graines, en compagnie ───────── */
// Un bout de terre qui flotte, avec ce que la confession en cours ferait pousser.

export function dessinerGraines(x, W, H, g, T, vie) {
  x.clearRect(0, 0, W, H);
  const n = Math.max(1, Math.min(6, g.length)), cols = n <= 2 ? n : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), k = cols + rows;
  const TW = Math.min(54, ((W - 24) / k) * 1.3, (H - 10) / (k / 4 + 2.1)), TH = TW / 2, bob = reduced ? 0 : Math.sin(T * .9) * 2.5;
  const z = 0, oyTop = H / 2 - ((k * TH) / 2 - .5 * TW) / 2 + bob;
  const o = { ox: W / 2 - ((cols - rows) * TW) / 4, oy: oyTop, TW, TH, HZ: TW * .42 };
  const c = [proj(o, 0, 0, z), proj(o, cols, 0, z), proj(o, cols, rows, z), proj(o, 0, rows, z)];
  const at = (p, dy) => [p[0], p[1] + dy], D = TH * .45; // la tranche de terre
  const xc = (c[1][0] + c[3][0]) / 2, b3 = at(c[3], D), b2 = at(c[2], D), b1 = at(c[1], D), epaule = p => [xc + (p[0] - xc) * .8, p[1] + TW * .26];
  const s3 = epaule(b3), s2 = epaule(b2), s1 = epaule(b1), pointe = [xc + TW * .05, b2[1] + TW * .56];
  P(x, [b3, b2, s2, s3], '#a08f7f'); P(x, [s3, s2, pointe], '#8a7a6c'); // la roche, par facettes
  P(x, [b2, b1, s1, s2], '#776a5e'); P(x, [s2, s1, pointe], '#63584e');
  P(x, [c[3], c[2], at(c[2], D), at(c[3], D)], COL.terre[0]); P(x, [c[2], c[1], at(c[1], D), at(c[2], D)], COL.terre[1]);
  L(x, [at(c[3], D * .55), at(c[2], D * .55), at(c[1], D * .55)], 'rgba(40,25,15,.2)', 1);
  for (const [dx, dy, s2, ph] of [[-.62, .55, .1, 0], [.7, .75, .08, 2], [-.4, 1.05, .06, 4]]) { // des cailloux qui flottent avec lui
    const px = o.ox + dx * TW * (k / 2.2), py = c[2][1] + dy * TW + Math.sin(T * 1.1 * speedK + ph) * 2.5;
    pierreUne(x, px, py, s2 * TW * 2, s2 * TW * 1.3, ['#a39383', '#8b7d70', '#706459']);
  }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const p00 = proj(o, i, j, z), p10 = proj(o, i + 1, j, z), p11 = proj(o, i + 1, j + 1, z), p01 = proj(o, i, j + 1, z);
    P(x, [p00, p10, p11], COL.herbe[(i + j) % 2 ? 0 : 1]); P(x, [p00, p11, p01], COL.herbe[(i + j) % 2 ? 1 : 0]);
    if (j === rows - 1) L(x, [p01, p11], '#c3ea7c', 1.4);
    if (i === cols - 1) L(x, [p10, p11], '#c3ea7c', 1.4);
  }
  const hits = [];
  g.slice(0, 6).forEach((a, kk) => {
    const i = kk % cols, j = Math.floor(kk / cols), [X, Y] = proj(o, i + .5, j + .5, z), sc = pop(vie?.get(a.key), T);
    dessinerChose(x, X, Y, TW * sc, a, T, { m: null, i, j, eau: CLIMATS.N.eau, bas: true });
    hits.push({ key: a.key, X, Y });
  });
  return hits;
}

/* ───────── L’archipel ───────── */
// Les îles des autres sont inventées : des dépôts au hasard, passés par la même grammaire.

const SUJETS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13', 's14'];
const MOTS = { AD: ['colere', 'peur', 'angoisse', 'rage'], ED: ['honte', 'tristesse', 'vide', 'fatigue', 'culpa', 'solitude'], AS: ['envie', 'espoir'], ES: ['soulagement', 'calme'] };
export function ileInventee(seed, quad) {
  const r = rng(seed), ile = { id: seed, seed, nee: '', depots: [], envoyee: true, quittee: null, autre: true };
  const n = 1 + Math.floor(r() ** 1.4 * 8);
  for (let k = 0; k < n; k++) {
    const q = r() < .75 ? quad : ['AD', 'ED', 'AS', 'ES'][Math.floor(r() * 4)];
    const answers = { situ: [], mots: [MOTS[q][Math.floor(r() * MOTS[q].length)]], sujets: [], fait: [], subi: [] };
    if (r() < .85) answers.sujets.push(SUJETS[Math.floor(r() * SUJETS.length)]);
    if (r() < .25) answers.sujets.push(SUJETS[Math.floor(r() * SUJETS.length)]);
    for (const [id, p] of [['longtemps', .35], ['jamais', .3], ['boucle', .3], ['regret', .3], ['mal', .2], ['recent', .2], ['personne', .2]]) if (r() < p) answers.situ.push(id);
    if (answers.situ.includes('mal') && r() < .6) answers.subi.push(['slong', 'scont', 'sparle', 'sresp'][Math.floor(r() * 4)]);
    if (answers.situ.includes('regret') && r() < .6) answers.fait.push(['flong', 'fplus', 'fsouff', 'frep', 'fpense'][Math.floor(r() * 5)]);
    ile.depots.push({ id: k + 1, quad: q, texte: r() < .5, answers });
  }
  return ile;
}

export function archipelInvente(n = 62) {
  const r = rng(31), out = [];
  const parts = Object.entries(MOCK.quad), total = parts.reduce((s, [, v]) => s + v, 0);
  for (let k = 0; k < n; k++) {
    let t = r() * total, q = 'ED';
    for (const [qq, v] of parts) { if (t < v) { q = qq; break; } t -= v; }
    const a = (q[0] === 'A' ? .5 : 0) + r() * .5, v = (q[1] === 'S' ? .5 : 0) + r() * .5;
    out.push({ ile: ileInventee(1000 + k * 37, q), a, v, ph: r() * 6.28, born: -10 });
  }
  return out;
}

const vignettes = new Map();
export function vignette(ile, d, taille = 88) {
  const key = `${ile.id}:${ile.depots.length}:${taille}:mer`;
  if (vignettes.has(key)) return vignettes.get(key);
  const c = document.createElement('canvas'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(taille * dpr); c.height = Math.round(taille * .9 * dpr);
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const TW = (taille - 2) / (N * .98);
  dessinerIle(x, taille, taille * .9, d, { TW, oy: taille * .5 - (N * TW) / 4, sansCiel: true, sansSocle: true }, 0);
  vignettes.set(key, c);
  return c;
}
