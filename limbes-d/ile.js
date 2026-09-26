// Limbes — maquette D : l’île. La carte, le placement, le sol et ses paysages, l’île entière, l’archipel.
// Tout est dessiné en Canvas 2D. Les choses sont dans sprites.js, les paysages dans biomes.js.

import { pousser, especeDe } from './grammaire.js?v=11';
import { KEYS, MOCK } from './contenu.js?v=11';
import { reduced, speedK, rng, hash, lerp, melange, nuance, P, L, E, C, halo, pop } from './dessin.js?v=11';
import { dessinerChose, dessinerDecor, phare, nuage, rocher, COL } from './sprites.js?v=11';
import { BIOMES, BIOME_IDS, biomeDe } from './biomes.js?v=11';

export { dessinerChose, BIOMES, BIOME_IDS, biomeDe };
export const N = 10; // tuiles par côté
export const ECHELLE = 1.3; // la taille des choses sur l’île, par rapport à une tuile
const unpack = obj => Object.fromEntries(KEYS.map(k => [k, new Set(obj?.[k] || [])]));
const idDe = B => BIOME_IDS.find(k => BIOMES[k] === B) || 'prairie';

export const CLIMATS = {
  N: { ciel: ['#8dcff0', '#e4f4fb'], eau: '#46bcd9', astre: 'soleil', teinte: null, oiseaux: true },
  AS: { ciel: ['#9edbf6', '#effafd'], eau: '#4fc7e3', astre: 'soleil', teinte: null, oiseaux: true },
  ES: { ciel: ['#f8d0a4', '#fdeedd'], eau: '#83c3d4', astre: 'soir', teinte: 'rgba(255,196,130,.15)', oiseaux: true },
  AD: { ciel: ['#f4a98a', '#7b6cae'], eau: '#4a8bb0', astre: 'crepuscule', teinte: 'rgba(170,120,180,.18)', oiseaux: false },
  ED: { ciel: ['#b8c4dc', '#f1ede9'], eau: '#7eadc2', astre: 'brume', teinte: 'rgba(180,185,215,.14)', oiseaux: false },
};
export const eauDe = (climat, B) => { const c = (CLIMATS[climat] || CLIMATS.N).eau; return B.eau ? melange(c, B.eau, .55) : c; };

/* ───────── La carte ───────── */

const cartes = new Map();
const voisins = (i, j) => [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N);
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
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (land[i * N + j]) for (let k = 0; k < 3; k++) m.decor.push([i, j, .18 + r() * .64, .18 + r() * .64, r(), r()]); // des places pour le décor
  cartes.set(seed, m);
  return m;
}
const tuileH = (m, i, j) => (m.vh[i * (N + 1) + j] + m.vh[(i + 1) * (N + 1) + j] + m.vh[i * (N + 1) + j + 1] + m.vh[(i + 1) * (N + 1) + j + 1]) / 4;
export const sol = (m, i, j) => { const z = m.h[i * N + j]; return z < 0 ? 'eau' : z < .34 ? 'sable' : z < 1.3 ? 'herbe' : z < 2.05 ? 'roche' : 'neige'; };

/* ───────── Projection et rotation ───────── */
// La vue tourne par quarts de tour ; la carte, elle, ne bouge pas.

const src = (i, j, rot, n = N - 1) => (rot === 1 ? [j, n - i] : rot === 2 ? [n - i, n - j] : rot === 3 ? [n - j, i] : [i, j]);
export const vue = (a, b, rot, n = N - 1) => (rot === 1 ? [n - b, a] : rot === 2 ? [n - a, n - b] : rot === 3 ? [b, n - a] : [a, b]);
const proj = (o, i, j, z) => [o.ox + ((i - j) * o.TW) / 2, o.oy + ((i + j) * o.TH) / 2 - z * o.HZ];

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

export const nouvelleIle = (biome = 'prairie') => ({ id: Date.now(), seed: Math.floor(Math.random() * 1e9) + 1, nee: new Date().toISOString(), biome, depots: [], envoyee: false, quittee: null });

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

// Ce qui serait transmis à l’archipel : des comptes, une sensation moyenne, le paysage choisi. Jamais un texte.
export function resume(d) {
  const comptes = {};
  for (const a of d.assets) { const e = especeDe(a); comptes[e] = (comptes[e] || 0) + 1; }
  const qs = d.ile.depots.map(x => x.quad).filter(Boolean);
  const a = qs.length ? qs.reduce((s, q) => s + (q[0] === 'A' ? .85 : q === 'N' ? .45 : .2), 0) / qs.length : .45;
  const v = qs.length ? qs.reduce((s, q) => s + (q[1] === 'S' ? .85 : q === 'N' ? .4 : .2), 0) / qs.length : .4;
  return { comptes, a, v, n: d.assets.length, phare: !!d.phare, climat: d.climat, paysage: d.ile.biome || 'prairie' };
}

/* ───────── Le ciel, la mer, le socle ───────── */

function ciel(x, W, H, climat, T, r) {
  const c = CLIMATS[climat] || CLIMATS.N, g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c.ciel[0]); g.addColorStop(1, c.ciel[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (c.astre === 'soleil') { halo(x, W * .82, H * .16, W * .16, 'rgba(255,240,150,A)', .55); E(x, W * .82, H * .16, W * .045, W * .045, '#ffe66d'); }
  if (c.astre === 'brume') { halo(x, W * .74, H * .24, W * .24, 'rgba(255,246,228,A)', .8); E(x, W * .74, H * .24, W * .045, W * .045, 'rgba(255,250,240,.9)'); for (let k = 0; k < 3; k++) { const by = H * (.18 + k * .08) + Math.sin(T * .2 + k) * 3, gg = x.createLinearGradient(0, by - H * .03, 0, by + H * .03); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.3)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, by - H * .03, W, H * .06); } }
  if (c.astre === 'soir') { halo(x, W * .84, H * .3, W * .2, 'rgba(255,190,110,A)', .6); E(x, W * .84, H * .3, W * .055, W * .055, '#ffb45c'); }
  if (c.astre === 'crepuscule') { halo(x, W * .16, H * .34, W * .2, 'rgba(255,120,90,A)', .5); E(x, W * .16, H * .34, W * .05, W * .05, '#ff8a65'); for (let k = 0; k < 9; k++) C(x, (r() * .9 + .05) * W, r() * H * .26, 1.1, 'rgba(255,255,255,.75)'); }
  for (let k = 0; k < 2; k++) { const cx = ((r() * W + T * 3 * speedK * (k + 1)) % (W + 120)) - 60, cy = H * (.08 + k * .09); nuage(x, cx, cy, W * .11, climat === 'ED' || climat === 'AD' ? COL.gris : ['#ffffff', '#f3f6f9', '#dde4ec']); }
  if (c.oiseaux) for (let k = 0; k < 3; k++) { // des oiseaux, qui passent
    const bx = ((T * 11 * speedK + k * 150 + r() * 60) % (W + 80)) - 40, by = H * (.13 + k * .05) + Math.sin(T * .8 + k) * 5, fl = Math.sin(T * 7 * speedK + k * 2) * .35, s = 5 + k;
    x.strokeStyle = 'rgba(60,50,60,.55)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(bx - s, by + fl * s); x.quadraticCurveTo(bx - s * .4, by - s * .3, bx, by); x.quadraticCurveTo(bx + s * .4, by - s * .3, bx + s, by + fl * s); x.stroke();
  }
}

function socle(x, o, climat, B, T, r) {
  const eau = eauDe(climat, B), z = -.12, e = .35;
  const top = proj(o, -e, -e, z), right = proj(o, N + e, -e, z), bottom = proj(o, N + e, N + e, z), left = proj(o, -e, N + e, z), Bh = o.TH * 2.4;
  const cy0 = bottom[1] + Bh * .55, R = (right[0] - left[0]) * .55, g = x.createRadialGradient(o.ox, cy0, 0, o.ox, cy0, R); // l’ombre portée du socle
  g.addColorStop(0, 'rgba(30,20,10,.28)'); g.addColorStop(1, 'rgba(30,20,10,0)');
  x.save(); x.translate(0, cy0); x.scale(1, .32); x.translate(0, -cy0); x.fillStyle = g; x.beginPath(); x.arc(o.ox, cy0, R, 0, Math.PI * 2); x.fill(); x.restore();
  const face = (a, b, tons, eauK) => { // une face du socle : la tranche d’eau, la terre, une strate, la roche
    const at = (p, k) => [p[0], p[1] + Bh * k];
    P(x, [a, b, at(b, 1), at(a, 1)], tons[0]);
    P(x, [at(a, .72), at(b, .72), at(b, 1), at(a, 1)], tons[1]);
    L(x, [at(a, .5), at(b, .5)], 'rgba(40,25,15,.18)', 1);
    P(x, [a, b, at(b, .26), at(a, .26)], nuance(eau, eauK));
    L(x, [at(a, .26), at(b, .26)], 'rgba(255,255,255,.35)', 1);
  };
  face(left, bottom, B.strates[0], -.18);
  face(bottom, right, B.strates[1], -.32);
  const cx = (top[0] + bottom[0]) / 2, cy = (top[1] + bottom[1]) / 2, g2 = x.createRadialGradient(cx, cy, 0, cx, cy, (right[0] - left[0]) * .55);
  g2.addColorStop(0, nuance(eau, .12)); g2.addColorStop(1, nuance(eau, -.12));
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

function rivage(x, o, m, rot, B, T) { // l’eau claire au bord de la terre, et l’écume
  const z = -.12, terre = (i, j) => { if (i < 0 || j < 0 || i >= N || j >= N) return false; const [a, b] = src(i, j, rot); return !!m.land[a * N + b]; };
  for (const [si, sj] of m.rive) {
    const [i, j] = vue(si, sj, rot), [X, Y] = proj(o, i + .5, j + .5, z), R = o.TW * .9;
    const g = x.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, `rgba(${B.lagon},.42)`); g.addColorStop(1, `rgba(${B.lagon},0)`);
    x.save(); x.translate(X, Y); x.scale(1, .5); x.translate(-X, -Y); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.fill(); x.restore();
  }
  for (const [si, sj] of m.rive) {
    const [i, j] = vue(si, sj, rot), c = [i + .5, j + .5];
    for (const [p, q, t] of [[[i + 1, j], [i + 1, j + 1], terre(i + 1, j)], [[i, j], [i, j + 1], terre(i - 1, j)], [[i, j + 1], [i + 1, j + 1], terre(i, j + 1)], [[i, j], [i + 1, j], terre(i, j - 1)]]) {
      if (!t) continue;
      const k = .12 + .06 * Math.sin(T * 1.3 * speedK + i + j), a = proj(o, p[0] + (c[0] - p[0]) * k, p[1] + (c[1] - p[1]) * k, z), b = proj(o, q[0] + (c[0] - q[0]) * k, q[1] + (c[1] - q[1]) * k, z);
      L(x, [a, b], `rgba(255,255,255,${.5 + .22 * Math.sin(T * 1.1 * speedK + i * 2 + j)})`, o.TW * .045);
    }
  }
}

// Au ras de l’eau (pour l’archipel) : une côte arrondie qui suit la terre, un lagon, l’écume, la plage.
const formes = new Map();
function cote(m) {
  if (formes.has(m.seed)) return formes.get(m.seed);
  const pts = [], T1 = (i, j) => i >= 0 && j >= 0 && i < N && j < N && m.land[i * N + j];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (!T1(i, j)) continue;
    pts.push([i + .5, j + .5]);
    if (T1(i + 1, j)) pts.push([i + 1, j + .5]);
    if (T1(i, j + 1)) pts.push([i + .5, j + 1]);
    if (T1(i + 1, j) && T1(i, j + 1) && T1(i + 1, j + 1)) pts.push([i + 1, j + 1]);
  }
  formes.set(m.seed, pts);
  return pts;
}
function union(x, o, pts, r, dy = 0) { // l’union d’ellipses : une forme arrondie qui suit la terre
  const rx = r * o.TW * .7071, ry = r * o.TH * .7071;
  x.beginPath();
  for (const [i, j] of pts) { const [X, Y] = proj(o, i, j, 0); x.moveTo(X + rx, Y + dy); x.ellipse(X, Y + dy, rx, ry, 0, 0, Math.PI * 2); }
}
function plage(x, o, m, B, T) {
  const pts = cote(m);
  union(x, o, pts, 1.55); x.fillStyle = `rgba(${B.lagon},.2)`; x.fill();
  union(x, o, pts, 1.18); x.fillStyle = `rgba(${B.lagon},.34)`; x.fill();
  union(x, o, pts, .9); x.fillStyle = `rgba(255,255,255,${.72 + .14 * Math.sin(T * 1.2 * speedK)})`; x.fill();
  union(x, o, pts, .8, o.TH * .16); x.fillStyle = nuance(B.sol.sable[2], -.14); x.fill();
  union(x, o, pts, .8); x.fillStyle = B.sol.sable[0]; x.fill();
}

/* ───────── Le sol : les couleurs du paysage, sa texture, son petit décor ───────── */

function tonsTuile(m, B, si, sj) {
  const type = sol(m, si, sj), base = B.sol[type] || B.sol.herbe, h1 = hash(`${m.seed}:${si}:${sj}`), h2 = hash(`${si}:${sj}:${m.seed}`);
  if (type === 'herbe' && h1 < B.taches[1]) return base.map(c => melange(c, B.taches[0], .38 + h2 * .18)); // une plaque de couleur
  return base.map(c => nuance(c, (h2 - .5) * .08));
}
function texture(x, type, B, cx, cy, TW, r, tons) {
  const blanc = B.enneige && (type === 'herbe' || type === 'neige');
  if (blanc || type === 'neige') { for (let k = 0; k < 3; k++) C(x, cx + (r() - .5) * TW * .55, cy + (r() - .5) * TW * .24, .7, '#ffffff'); if (blanc) { const px = cx + (r() - .5) * TW * .4, py = cy + (r() - .5) * TW * .2; E(x, px, py, .1 * TW, .025 * TW, 'rgba(160,190,220,.25)'); } return; }
  if (type === 'herbe') for (let k = 0; k < 2; k++) { const px = cx + (r() - .5) * TW * .5, py = cy + (r() - .5) * TW * .22; L(x, [[px - .03 * TW, py], [px - .012 * TW, py - .045 * TW], [px + .005 * TW, py], [px + .025 * TW, py - .035 * TW]], nuance(tons[2], -.14), .8); }
  else if (type === 'sable') { const px = cx + (r() - .5) * TW * .4, py = cy + (r() - .5) * TW * .2; x.beginPath(); x.ellipse(px, py, .12 * TW, .035 * TW, 0, Math.PI * 1.1, Math.PI * 1.9); x.strokeStyle = nuance(tons[2], -.05); x.lineWidth = .8; x.stroke(); }
  else if (type === 'roche') { const px = cx + (r() - .5) * TW * .4, py = cy + (r() - .5) * TW * .2; L(x, [[px - .06 * TW, py], [px - .02 * TW, py - .02 * TW], [px + .01 * TW, py + .01 * TW], [px + .05 * TW, py - .012 * TW]], nuance(tons[2], -.18), .9); }
}
const tirer = (table, r) => { const tot = table.reduce((s, [, w]) => s + w, 0); let t = r * tot; for (const [k, w] of table) { if (t < w) return k; t -= w; } return table[0]?.[0]; };

function dessinerSol(x, o, m, rot, B, mer) {
  const pt = (i, j) => m.vh[i * (N + 1) + j], TW = o.TW, decor = new Map();
  for (const s of m.decor) { const [vi, vj] = vue(s[0], s[1], rot), k = vi * N + vj; (decor.get(k) || decor.set(k, []).get(k)).push(s); }
  const terre = (a, b) => { if (a < 0 || b < 0 || a >= N || b >= N) return false; const [sa, sb] = src(a, b, rot); return !!m.land[sa * N + sb]; };
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = Math.max(0, s - N + 1); i <= Math.min(N - 1, s); i++) {
    const j = s - i, [si, sj] = src(i, j, rot);
    if (!m.land[si * N + sj]) continue;
    const [a00, b00] = src(i, j, rot, N), [a10, b10] = src(i + 1, j, rot, N), [a11, b11] = src(i + 1, j + 1, rot, N), [a01, b01] = src(i, j + 1, rot, N);
    const z00 = pt(a00, b00), z10 = pt(a10, b10), z11 = pt(a11, b11), z01 = pt(a01, b01), base = -.12;
    const p00 = proj(o, i, j, z00), p10 = proj(o, i + 1, j, z10), p11 = proj(o, i + 1, j + 1, z11), p01 = proj(o, i, j + 1, z01);
    if (!mer) { // les falaises, avec une strate et quelques cailloux
      const f0 = [p01, p11, proj(o, i + 1, j + 1, base), proj(o, i, j + 1, base)], f1 = [p10, p11, proj(o, i + 1, j + 1, base), proj(o, i + 1, j, base)];
      P(x, f0, B.falaise[0]); P(x, f1, B.falaise[1]);
    }
    const type = sol(m, si, sj), tons = tonsTuile(m, B, si, sj);
    const shade = (za, zb, zc, ia, ja, ib, jb, ic, jc) => { // une lumière venant de la gauche et du haut
      const ux = ib - ia, uy = jb - ja, uz = (zb - za) * .5, vx = ic - ia, vy = jc - ja, vz = (zc - za) * .5;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, n = Math.hypot(nx, ny, nz) || 1, sgn = nz < 0 ? -1 : 1;
      const l = (sgn * (nx * -.62 + ny * .2 + nz * 1)) / n / 1.2;
      return l > .84 ? tons[0] : l > .74 ? tons[1] : tons[2];
    };
    if ((si + sj) % 2) { P(x, [p00, p10, p11], shade(z00, z10, z11, i, j, i + 1, j, i + 1, j + 1)); P(x, [p00, p11, p01], shade(z00, z11, z01, i, j, i + 1, j + 1, i, j + 1)); }
    else { P(x, [p00, p10, p01], shade(z00, z10, z01, i, j, i + 1, j, i, j + 1)); P(x, [p10, p11, p01], shade(z10, z11, z01, i + 1, j, i + 1, j + 1, i, j + 1)); }
    if (!mer) {
      const strate = (a, b, pa, pb) => L(x, [[lerp(a[0], pa[0], .55), lerp(a[1], pa[1], .55)], [lerp(b[0], pb[0], .55), lerp(b[1], pb[1], .55)]], 'rgba(60,40,25,.2)', 1);
      if (!terre(i, j + 1)) { L(x, [p01, p11], tons[0], 1.3); strate(p01, p11, proj(o, i, j + 1, base), proj(o, i + 1, j + 1, base)); }
      if (!terre(i + 1, j)) { L(x, [p10, p11], tons[0], 1.3); strate(p10, p11, proj(o, i + 1, j, base), proj(o, i + 1, j + 1, base)); }
    }
    const [cx, cy] = proj(o, i + .5, j + .5, (z00 + z10 + z11 + z01) / 4);
    texture(x, type, B, cx, cy, TW, rng(m.seed * 7 + si * 31 + sj * 17), tons);
    for (const [, , dx, dy, r1, r2] of decor.get(i * N + j) || []) {
      if (r2 > B.densite) continue;
      const kind = tirer(B.decor[type] || [], r1), zc = z00 * (1 - dx) * (1 - dy) + z10 * dx * (1 - dy) + z01 * (1 - dx) * dy + z11 * dx * dy, [X, Y] = proj(o, i + dx, j + dy, zc);
      if (kind) dessinerDecor(x, X, Y, TW, kind, B, r2 / B.densite);
    }
  }
}
const couches = new Map(); // le sol ne bouge pas : on le garde dessiné
function coucheSol(o, m, rot, B, W, H) {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2), key = `${m.seed}:${rot}:${W}:${H}:${o.TW.toFixed(2)}:${o.oy.toFixed(1)}:${idDe(B)}:${dpr}`;
  let c = couches.get(key);
  if (!c) {
    if (couches.size > 12) couches.clear();
    c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessinerSol(x, o, m, rot, B, false);
    couches.set(key, c);
  }
  return c;
}

/* ───────── L’île, dessinée ───────── */
// opts : { rot, vie (clé → instant d’apparition), sel (clé choisie), hits (rempli), TW, oy, sansCiel, mer (au ras de l’eau) }

function dessinerChoses(x, o, d, rot, B, opts, T, hits) {
  const m = d.m, eau = eauDe(d.climat, B), parTuile = new Map(), U = o.TW * ECHELLE;
  for (const a of d.assets) { const [vi, vj] = vue(a.tile[0], a.tile[1], rot), k = vi * N + vj; (parTuile.get(k) || parTuile.set(k, []).get(k)).push(a); }
  const ph = d.phareTile ? vue(d.phareTile[0], d.phareTile[1], rot) : null;
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = Math.max(0, s - N + 1); i <= Math.min(N - 1, s); i++) {
    const j = s - i, [si, sj] = src(i, j, rot), zc = m.land[si * N + sj] ? tuileH(m, si, sj) : -.12;
    for (const a of parTuile.get(i * N + j) || []) {
      const [X, Y] = proj(o, i + .5, j + .5, zc), u = U * pop(opts.vie?.get(a.key), T);
      if (opts.sel === a.key) { x.beginPath(); x.ellipse(X, Y + .04 * U, .5 * U, .24 * U, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2; x.stroke(); }
      dessinerChose(x, X, Y, u, a, T, { m, i: si, j: sj, eau, B, v: hash(`${a.key}:${d.ile.seed}`), terrain: sol(m, si, sj) });
      hits.push({ key: a.key, X, Y: Y - .45 * U, r: U * .6 });
    }
    if (ph && ph[0] === i && ph[1] === j) { const [X, Y] = proj(o, i + .5, j + .5, zc); phare(x, X, Y, U, T); hits.push({ key: 'phare', X, Y: Y - .7 * U, r: U * .8 }); }
  }
}

export function dessinerIle(x, W, H, d, opts = {}, T = 0) {
  const rot = opts.rot || 0, m = d.m, B = biomeDe(d.ile.biome), mer = !!opts.mer;
  const TW = opts.TW || Math.min(46, (W - 8) / (N + 1.2)), TH = TW / 2, HZ = TW * .42;
  const o = { ox: W / 2, oy: opts.oy ?? H * .55 - (N * TH) / 2, TW, TH, HZ };
  const hits = opts.hits || [];
  hits.length = 0;
  if (!opts.sansCiel) ciel(x, W, H, d.climat, T, rng(m.seed + 9));
  if (mer) { plage(x, o, m, B, T); dessinerSol(x, o, m, rot, B, true); }
  else { socle(x, o, d.climat, B, T, rng(m.seed + 5)); rivage(x, o, m, rot, B, T); x.drawImage(coucheSol(o, m, rot, B, W, H), 0, 0, W, H); }
  dessinerChoses(x, o, d, rot, B, opts, T, hits);
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
// Un îlot qui flotte, dans le paysage de l’île, avec ce que la confession en cours ferait pousser.

export function dessinerGraines(x, W, H, g, T, vie, opts = {}) {
  x.clearRect(0, 0, W, H);
  const B = opts.B || BIOMES.prairie, seed = opts.seed || 1;
  const n = Math.max(1, Math.min(6, g.length)), cols = n <= 2 ? n : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), k = cols + rows;
  const TW = Math.min(54, ((W - 24) / k) * 1.3, (H - 10) / (k / 4 + 2.1)), TH = TW / 2, bob = reduced ? 0 : Math.sin(T * .9) * 2.5;
  const o = { ox: W / 2 - ((cols - rows) * TW) / 4, oy: H / 2 - ((k * TH) / 2 - .5 * TW) / 2 + bob, TW, TH, HZ: TW * .42 };
  const c = [proj(o, 0, 0, 0), proj(o, cols, 0, 0), proj(o, cols, rows, 0), proj(o, 0, rows, 0)];
  const at = (p, dy) => [p[0], p[1] + dy], D = TH * .45; // la tranche de terre
  const xc = (c[1][0] + c[3][0]) / 2, b3 = at(c[3], D), b2 = at(c[2], D), b1 = at(c[1], D), epaule = p => [xc + (p[0] - xc) * .8, p[1] + TW * .26];
  const s3 = epaule(b3), s2 = epaule(b2), s1 = epaule(b1), pointe = [xc + TW * .05, b2[1] + TW * .56], R = B.enneige ? ['#a9b3bf', '#929da9', '#7c8794', '#6a7480'] : ['#a08f7f', '#8a7a6c', '#776a5e', '#63584e'];
  P(x, [b3, b2, s2, s3], R[0]); P(x, [s3, s2, pointe], R[1]); P(x, [b2, b1, s1, s2], R[2]); P(x, [s2, s1, pointe], R[3]); // la roche, par facettes
  P(x, [c[3], c[2], at(c[2], D), at(c[3], D)], B.falaise[0]); P(x, [c[2], c[1], at(c[1], D), at(c[2], D)], B.falaise[1]);
  L(x, [at(c[3], D * .55), at(c[2], D * .55), at(c[1], D * .55)], 'rgba(40,25,15,.2)', 1);
  for (const [dx, dy, s, ph] of [[-.62, .55, .1, 0], [.7, .75, .08, 2], [-.4, 1.05, .06, 4]]) { // des cailloux qui flottent avec lui
    const px = o.ox + dx * TW * (k / 2.2), py = c[2][1] + dy * TW + Math.sin(T * 1.1 * speedK + ph) * 2.5;
    rocher(x, px, py, s * TW * 2, s * TW * 1.3, [R[0], R[1], R[3]]);
  }
  const herbe = B.sol.herbe;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const p00 = proj(o, i, j, 0), p10 = proj(o, i + 1, j, 0), p11 = proj(o, i + 1, j + 1, 0), p01 = proj(o, i, j + 1, 0);
    P(x, [p00, p10, p11], herbe[(i + j) % 2 ? 0 : 1]); P(x, [p00, p11, p01], herbe[(i + j) % 2 ? 1 : 0]);
    if (j === rows - 1) L(x, [p01, p11], nuance(herbe[0], .25), 1.4);
    if (i === cols - 1) L(x, [p10, p11], nuance(herbe[0], .25), 1.4);
    const r = rng(i * 13 + j * 7 + 3);
    for (let d = 0; d < 2; d++) { const [X, Y] = proj(o, i + .15 + r() * .7, j + .15 + r() * .7, 0), kind = tirer(B.decor.herbe, r()); dessinerDecor(x, X, Y, TW, kind, B, r()); }
  }
  const hits = [];
  g.slice(0, 6).forEach((a, kk) => {
    const i = kk % cols, j = Math.floor(kk / cols), [X, Y] = proj(o, i + .5, j + .5, 0);
    dessinerChose(x, X, Y, TW * pop(vie?.get(a.key), T), a, T, { m: null, i, j, eau: eauDe('N', B), B, v: hash(`${a.key}:${seed}`), terrain: 'herbe', bas: true });
    hits.push({ key: a.key, X, Y });
  });
  return hits;
}

/* ───────── L’archipel ───────── */
// Les îles des autres sont inventées : des dépôts au hasard, passés par la même grammaire, dans un paysage au hasard.

const SUJETS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13', 's14'];
const MOTS = { AD: ['colere', 'peur', 'angoisse', 'rage'], ED: ['honte', 'tristesse', 'vide', 'fatigue', 'culpa', 'solitude'], AS: ['envie', 'espoir'], ES: ['soulagement', 'calme'] };
export function ileInventee(seed, quad) {
  const r = rng(seed), ile = { id: seed, seed, nee: '', biome: BIOME_IDS[Math.floor(hash(`paysage:${seed}`) * BIOME_IDS.length)], depots: [], envoyee: true, quittee: null, autre: true };
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
export function vignette(ile, d, taille = 88) { // l’île posée sur l’eau, dessinée une fois
  const key = `${ile.id}:${ile.depots.length}:${ile.biome}:${taille}:mer`;
  if (vignettes.has(key)) return vignettes.get(key);
  const c = document.createElement('canvas'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(taille * dpr); c.height = Math.round(taille * .9 * dpr);
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const TW = taille / (N * 1.18);
  dessinerIle(x, taille, taille * .9, d, { TW, oy: taille * .52 - (N * TW) / 4, sansCiel: true, mer: true }, 0);
  vignettes.set(key, c);
  return c;
}
