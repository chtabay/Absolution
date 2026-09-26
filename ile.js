// L’archipel : l’île. La carte, le placement des choses, l’île recalculée depuis ses dépôts, les îles inventées de l’archipel.
// Aucun dessin ici : le relief, la mer et la lumière sont dans monde.js, les choses dans modeles.js, les paysages dans biomes.js.

import { pousser, especeDe } from './grammaire.js?v=1';
import { KEYS, MOCK } from './contenu.js?v=1';
import { rng, hash, melange } from './outils.js?v=1';
import { BIOMES, BIOME_IDS, biomeDe } from './biomes.js?v=1';

export { BIOMES, BIOME_IDS, biomeDe };
export const N = 10; // tuiles par côté
const unpack = obj => Object.fromEntries(KEYS.map(k => [k, new Set(obj?.[k] || [])]));

// Le climat suit la dernière confession : le ciel, l’eau, et s’il y a des oiseaux.
export const CLIMATS = {
  N: { ciel: ['#8dcff0', '#e4f4fb'], eau: '#46bcd9', oiseaux: true },
  AS: { ciel: ['#9edbf6', '#effafd'], eau: '#4fc7e3', oiseaux: true },
  ES: { ciel: ['#f8d0a4', '#fdeedd'], eau: '#83c3d4', oiseaux: true },
  AD: { ciel: ['#f4a98a', '#7b6cae'], eau: '#4a8bb0', oiseaux: false },
  ED: { ciel: ['#b8c4dc', '#f1ede9'], eau: '#7eadc2', oiseaux: false },
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
export const sol = (m, i, j) => { const z = m.h[i * N + j]; return z < 0 ? 'eau' : z < .34 ? 'sable' : z < 1.3 ? 'herbe' : z < 2.05 ? 'roche' : 'neige'; };

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
