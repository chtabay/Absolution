// Limbes — maquette D : les choses de l’île, dessinées. Chacune a des variantes et suit le paysage.
// Rien ici ne dit quelque chose de plus. Ce qui dit, c’est la famille, l’espèce, la taille et l’état (grammaire.js).
// Les variantes (o.v, un nombre stable entre 0 et 1) et le paysage (o.B) changent seulement le dessin.
// Chaque chose est dessinée à son pied (X, Y), à l’échelle u (à peu près la largeur d’une tuile).

import { speedK, reduced, rng, lerp, choix, P, L, E, C, halo, ombre, nuance } from './dessin.js?v=11';
import { BIOMES } from './biomes.js?v=11';

const B0 = BIOMES.prairie;
export const COL = {
  tronc: ['#a06d47', '#7a5033'], bois: ['#c79a63', '#a3784a', '#7f5a36'], nu: ['#9c8b7f', '#75665b'],
  sombre: ['#7a7486', '#575166', '#3d3948'], moussue: ['#b3b0a6', '#928f85', '#716e66'], cairn: ['#d9d2c3', '#b9b1a1', '#958d7e'],
  galet: ['#eee8dc', '#d4cbbb', '#b6ad9c'], pierre: ['#c3bfb6', '#a29e95', '#807c74'], caillou: ['#e6e0d4', '#c9c1b2', '#a9a092'],
  blanc: ['#ffffff', '#f0f3f6', '#d6dde4'], gris: ['#c9d0d8', '#a7b0ba', '#87909b'], orage: ['#7a8190', '#5d6574', '#454c59'],
  fleurs: ['#ff6b6b', '#ffd166', '#ff9ecf', '#b08cff', '#ffffff', '#ff8e3c'],
};
const FLEURS = { prairie: ['#ff6b6b', '#ffd166', '#ff9ecf', '#ffffff', '#b08cff'], automne: ['#ff8e3c', '#ffd166', '#e0552e', '#fff1c1'], tropique: ['#ff4d6d', '#ff8e3c', '#ffd166', '#ff9ecf'], neige: ['#ffffff', '#cfe3ff', '#ffd6e5'], lande: ['#b08cff', '#d7b8ff', '#ffffff', '#ffd166'] };
const idDe = B => Object.keys(BIOMES).find(k => BIOMES[k] === B) || 'prairie';

/* ───────── Des morceaux ───────── */

function tronc(x, X, Y, w, h, tons = COL.tronc) { // avec un léger empattement
  P(x, [[X - w * .7, Y + w * .25], [X - w / 2, Y + w * .2], [X, Y + w * .3], [X, Y - h], [X - w / 2, Y - h]], tons[0]);
  P(x, [[X, Y + w * .3], [X + w / 2, Y + w * .2], [X + w * .7, Y + w * .25], [X + w / 2, Y - h], [X, Y - h]], tons[1]);
}
function creux(x, X, Y, u) { E(x, X, Y, .05 * u, .07 * u, '#3a2a1f'); }
export function boule(x, cx, cy, r, tons, k = 7, ry = .92) { // une boule de feuillage, à facettes
  const pts = [];
  for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (i / k) * Math.PI * 2, rr = r * (i % 2 ? .9 : 1); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * ry]); }
  P(x, pts, tons[1]);
  P(x, [[cx, cy], pts[k - 2], pts[k - 1], pts[0]], tons[0]);
  P(x, [[cx, cy], pts[1], pts[2], pts[3]], tons[2]);
}
function disque(x, cx, cy, rx, ry, tons, neige) { // une couche de feuillage festonnée, avec son épaisseur
  const n = 10, pts = [], bas = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, f = i % 2 ? .84 : 1; pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]); bas.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f + ry * .55]); }
  P(x, bas, tons[2]);
  P(x, pts, tons[1]);
  P(x, [[cx, cy], pts[5], pts[6], pts[7], pts[8]], neige ? '#ffffff' : tons[0]);
}
function fleurCinq(x, X, Y, r, col, coeur = '#ffd166') { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; C(x, X + Math.cos(a) * r, Y + Math.sin(a) * r * .8, r * .72, col); } C(x, X, Y, r * .5, coeur); }
export function fleur(x, X, Y, u, col) { L(x, [[X, Y], [X, Y - .12 * u]], '#5f9e34', .025 * u); fleurCinq(x, X, Y - .14 * u, .03 * u, col, col === '#ffffff' ? '#ffd166' : '#fff4c9'); }
function capNeige(x, X, Y, w, h) { P(x, [[X - w * .5, Y + h * .2], [X - w * .25, Y - h * .35], [X + w * .1, Y - h * .5], [X + w * .45, Y - h * .15], [X + w * .5, Y + h * .25], [X, Y + h * .4]], '#ffffff'); }

/* ───────── Les arbres ───────── */

function palmier(x, X, Y, u, tons, v) {
  const sens = v < .5 ? -1 : 1, h = 1.2 * u, lean = sens * .24 * u, pt = t => [X + lean * t * t, Y - h * t];
  for (let k = 0; k < 6; k++) { const [ax, ay] = pt(k / 6), [bx, by] = pt((k + 1) / 6), w = (.07 - k * .006) * u; P(x, [[ax - w, ay], [ax + w, ay], [bx + w * .85, by], [bx - w * .85, by]], k % 2 ? '#b48a5c' : '#9c7249'); }
  const [tx, ty] = pt(1), palmes = [];
  for (let f = 0; f < 8; f++) { const an = (f / 8) * Math.PI * 2 + v * 2.3; palmes.push([Math.cos(an), Math.sin(an) * .5, (.52 + .16 * ((f * 5) % 3) / 2) * u]); }
  const palme = ([dx, dy, len]) => {
    const mx = tx + dx * len * .5, my = ty + dy * len * .5 - .14 * u, ex = tx + dx * len, ey = ty + dy * len + .2 * u, nx = -dy * .1 * u, ny = dx * .05 * u + .03 * u;
    const t = dx > .3 ? tons[2] : dx < -.3 ? tons[0] : tons[1];
    P(x, [[tx, ty], [mx + nx, my + ny], [ex, ey], [mx - nx, my - ny]], t);
    L(x, [[tx, ty], [mx, my], [ex, ey]], nuance(t, -.22), .014 * u);
  };
  palmes.filter(p => p[1] < 0).forEach(palme);
  C(x, tx - .05 * u, ty + .05 * u, .055 * u, '#7a5233'); C(x, tx + .045 * u, ty + .07 * u, .05 * u, '#8a5f3c');
  palmes.filter(p => p[1] >= 0).forEach(palme);
}
function bouleau(x, X, Y, u, tons) {
  const h = .95 * u;
  P(x, [[X - .045 * u, Y + .02 * u], [X, Y + .03 * u], [X, Y - h], [X - .035 * u, Y - h]], '#f4f1ea');
  P(x, [[X, Y + .03 * u], [X + .045 * u, Y + .02 * u], [X + .035 * u, Y - h], [X, Y - h]], '#d9d3c7');
  for (let k = 0; k < 5; k++) { const yy = Y - (.1 + k * .17) * u; L(x, [[X - .035 * u, yy], [X + .012 * u, yy - .015 * u]], '#3a3530', .018 * u); }
  L(x, [[X, Y - .55 * u], [X - .2 * u, Y - .76 * u]], '#ece7dd', .025 * u); L(x, [[X, Y - .7 * u], [X + .18 * u, Y - .9 * u]], '#ece7dd', .025 * u);
  for (const [dx, dy, r] of [[-.05, -.7, .16], [.22, -.74, .15], [-.22, -.82, .19], [.18, -.94, .19], [0, -1.1, .22]]) boule(x, X + dx * u, Y + dy * u, r * u, tons, 6);
}
function peuplier(x, X, Y, u, tons) {
  tronc(x, X, Y, .1 * u, .3 * u);
  const w = .3 * u, top = Y - 1.45 * u, bot = Y - .22 * u, mid = (top + bot) / 2, k = bot - top;
  const g = [[X - w * .7, top + k * .25], [X - w, mid], [X - w * .75, bot - k * .1]], d = [[X + w * .7, top + k * .25], [X + w, mid], [X + w * .75, bot - k * .1]];
  P(x, [[X, top], ...g, [X, bot]], tons[0]);
  P(x, [[X, top], ...d, [X, bot]], tons[1]);
  P(x, [[X + w * .15, mid], d[1], d[2], [X, bot]], tons[2]);
  L(x, [[X - w * .35, top + k * .3], [X - w * .5, mid]], nuance(tons[0], .15), .02 * u);
}
function hibiscus(x, X, Y, u, tons, fleurs) {
  tronc(x, X, Y, .1 * u, .3 * u);
  for (const [dx, dy, r] of [[-.25, -.45, .28], [.26, -.45, .27], [0, -.7, .34], [0, -.42, .25]]) boule(x, X + dx * u, Y + dy * u, r * u, tons, 7);
  [[-.3, -.5], [.25, -.62], [-.05, -.9], [.12, -.4], [-.15, -.72], [.3, -.38]].forEach(([dx, dy], k) => fleurCinq(x, X + dx * u, Y + dy * u, .045 * u, fleurs[k % fleurs.length], '#fff4c9'));
}
function sapin(x, X, Y, u, tons, forme, neige) {
  tronc(x, X, Y, .12 * u, .3 * u);
  if (forme === 'cypres') {
    const top = Y - 1.5 * u, w = .26 * u, bas = Y - .15 * u;
    P(x, [[X, top], [X - w, Y - .6 * u], [X - w * .7, Y - .2 * u], [X, bas]], tons[0]);
    P(x, [[X, top], [X + w, Y - .6 * u], [X + w * .7, Y - .2 * u], [X, bas]], tons[2]);
    P(x, [[X, top], [X + w * .45, Y - .9 * u], [X + w * .2, Y - .4 * u], [X, bas]], tons[1]);
    if (neige) P(x, [[X, top], [X - w * .5, Y - 1.05 * u], [X - w * .1, Y - 1.12 * u], [X + w * .45, Y - 1.02 * u]], '#ffffff');
    return;
  }
  const n = forme === 'elance' ? 5 : 3, W0 = forme === 'elance' ? .74 : .98, pas = forme === 'elance' ? .27 : .34, haut = forme === 'elance' ? .42 : .5;
  for (let l = 0; l < n; l++) {
    const w = (W0 - l * (W0 * .72) / n) * u, hb = Y - .22 * u - l * pas * u, ht = hb - haut * u;
    P(x, [[X - w / 2, hb], [X, ht], [X, hb + .05 * u]], tons[0]);
    P(x, [[X, ht], [X + w / 2, hb], [X, hb + .05 * u]], tons[2]);
    L(x, [[X - w * .42, hb - .005 * u], [X, hb + .045 * u], [X + w * .42, hb - .005 * u]], nuance(tons[2], -.2), .02 * u);
    if (neige) P(x, [[X - w * .26, ht + (hb - ht) * .55], [X, ht], [X + w * .24, ht + (hb - ht) * .52], [X + w * .08, ht + (hb - ht) * .44], [X - w * .06, ht + (hb - ht) * .5]], '#ffffff');
  }
}
function nu(x, X, Y, u, v, B) {
  const t = COL.nu, autre = v > .5, s = autre ? -1 : 1;
  L(x, [[X, Y + .04 * u], [X + s * .02 * u, Y - .95 * u]], t[1], .1 * u);
  const branches = autre
    ? [[[0, -.4], [.32, -.7], [.44, -.98]], [[0, -.58], [-.28, -.9], [-.38, -1.08]], [[.2, -.62], [.28, -.84]], [[0, -.9], [.08, -1.22]], [[-.18, -.78], [-.14, -.98]]]
    : [[[0, -.45], [-.34, -.85], [-.42, -1.05]], [[0, -.6], [.3, -.95], [.48, -1.05]], [[-.2, -.69], [-.3, -.92]], [[0, -.95], [-.12, -1.2]], [[0, -.95], [.1, -1.22]], [[.2, -.83], [.18, -1.05]]];
  for (const br of branches) { const pts = br.map(([dx, dy]) => [X + dx * u, Y + dy * u]); L(x, pts, t[1], .055 * u); if (B.enneige) L(x, pts.map(([px, py]) => [px, py - .025 * u]), '#ffffff', .03 * u); }
  L(x, [[X - .03 * u, Y], [X - .03 * u, Y - .9 * u]], t[0], .035 * u);
  if (B.feuillesNues) [[-.4, -1.02], [.45, -1.02], [.1, -1.2], [-.3, -.9]].forEach(([dx, dy], k) => P(x, [[X + dx * u, Y + dy * u - .04 * u], [X + dx * u + .04 * u, Y + dy * u], [X + dx * u, Y + dy * u + .04 * u], [X + dx * u - .04 * u, Y + dy * u]], ['#f08a2c', '#e5603a', '#f2b93e', '#c9661e'][k]));
}
function unArbre(x, X, Y, u, a, T, o, v) {
  const B = o.B || B0, e = a.espece;
  if (e === 'pin') { sapin(x, X, Y, u, B.pin.tons[0], choix(B.pin.formes, v), B.enneige); if (a.etats.ferme) creux(x, X, Y - .12 * u, u); return; }
  if (e === 'nu') { nu(x, X, Y, u, v, B); if (a.etats.ferme) creux(x, X, Y - .3 * u, u); return; }
  const cfg = e === 'fleuri' ? B.fleuri : B.feuillu, forme = choix(cfg.formes, v), tons = choix(cfg.tons, (v * 7.31) % 1);
  if (forme === 'palmier') { palmier(x, X, Y, u, tons, v); if (a.etats.ferme) creux(x, X, Y - .2 * u, u); return; }
  if (forme === 'hibiscus') { hibiscus(x, X, Y, u, tons, FLEURS.tropique); return; }
  if (forme === 'bouleau') { bouleau(x, X, Y, u, tons); if (a.etats.ferme) creux(x, X, Y - .3 * u, u); return; }
  if (forme === 'peuplier') { peuplier(x, X, Y, u, tons); if (a.etats.ferme) creux(x, X, Y - .16 * u, u); return; }
  if (forme === 'etage') {
    tronc(x, X, Y, .12 * u, .6 * u);
    if (a.etats.ferme) creux(x, X, Y - .22 * u, u);
    disque(x, X, Y - .52 * u, .5 * u, .19 * u, tons, B.enneige);
    disque(x, X + .02 * u, Y - .8 * u, .4 * u, .16 * u, tons, B.enneige);
    disque(x, X, Y - 1.04 * u, .27 * u, .12 * u, tons, B.enneige);
  } else {
    tronc(x, X, Y, .13 * u, .42 * u);
    if (a.etats.ferme) creux(x, X, Y - .2 * u, u);
    boule(x, X - .28 * u, Y - .56 * u, .3 * u, tons, 7); boule(x, X + .29 * u, Y - .54 * u, .3 * u, tons, 7);
    boule(x, X + .02 * u, Y - .84 * u, .4 * u, tons, 8); boule(x, X - .04 * u, Y - .5 * u, .26 * u, tons, 7);
    C(x, X - .12 * u, Y - 1.05 * u, .06 * u, 'rgba(255,255,255,.35)'); // un éclat de lumière
    if (B.enneige) { capNeige(x, X + .02 * u, Y - 1.1 * u, .5 * u, .16 * u); capNeige(x, X - .3 * u, Y - .78 * u, .34 * u, .1 * u); }
  }
  if (e === 'fleuri') { const fl = forme === 'etage' ? [[-.3, -.5], [.25, -.55], [-.1, -.82], [.2, -.84], [0, -1.06], [-.36, -.56]] : [[-.3, -.5], [.25, -.7], [-.05, -1.02], [.12, -.45], [-.2, -.85], [.3, -.42]]; for (const [dx, dy] of fl) C(x, X + dx * u, Y + dy * u, .045 * u, '#ffffff'); }
}
function arbre(x, X, Y, u, a, T, o) {
  const v = o.v ?? .5;
  ombre(x, X, Y, (a.stade >= 3 ? .8 : [.3, .4, .5][a.stade]) * u, .16 * u);
  if (a.stade >= 3) { unArbre(x, X - .4 * u, Y - .16 * u, u * .72, a, T, o, (v + .37) % 1); unArbre(x, X + .42 * u, Y - .12 * u, u * .66, a, T, o, (v + .71) % 1); unArbre(x, X, Y + .04 * u, u * 1.02, a, T, o, v); }
  else unArbre(x, X, Y, u * [.6, .88, 1.15][a.stade], a, T, o, v);
  touffes(x, X, Y, u, o.B || B0, v);
  if (a.etats.caillou) rocher(x, X + .36 * u, Y + .1 * u, .2 * u, .14 * u, COL.pierre);
  if (a.etats.pluie) { const sc = [.6, .88, 1.15, 1.2][a.stade]; nuage(x, X + .1 * u, Y - (1.35 * sc + .55) * u, u * .55, COL.gris); pluie(x, X + .1 * u, Y - (1.35 * sc + .4) * u, u * .55, T, 4, (1.35 * sc + .3) * u); }
}
function touffes(x, X, Y, u, B, v) { // un peu d’herbe au pied
  if (B.enneige) { E(x, X - .2 * u, Y + .05 * u, .1 * u, .04 * u, '#ffffff'); return; }
  const c = B.sol.herbe[2];
  for (const [dx, dy] of [[-.24, .06], [.2, .09]]) { const px = X + (dx + (v - .5) * .1) * u, py = Y + dy * u; L(x, [[px - .03 * u, py], [px - .05 * u, py - .08 * u]], c, .018 * u); L(x, [[px, py], [px + .005 * u, py - .1 * u]], c, .018 * u); L(x, [[px + .03 * u, py], [px + .05 * u, py - .07 * u]], c, .018 * u); }
}

/* ───────── Les pierres ───────── */

export function bloc(x, cx, cy, w, h, t) {
  const tl = [cx - w * .3, cy - h * .95], tr = [cx + w * .22, cy - h], rm = [cx + w * .48, cy - h * .5], br = [cx + w * .45, cy], bl = [cx - w * .5, cy], lm = [cx - w * .5, cy - h * .45], mid = [cx + w * .04, cy - h * .5];
  P(x, [tl, tr, rm, br, bl, lm], t[1]); P(x, [tl, tr, mid, lm], t[0]); P(x, [tr, rm, br, mid], t[2]);
}
export function rocher(x, cx, cy, w, h, t) { // un rocher arrondi
  const up = [];
  for (let k = 0; k <= 6; k++) { const a = Math.PI + (k / 6) * Math.PI, f = k % 2 ? .92 : 1; up.push([cx + Math.cos(a) * w * .5 * f, cy - h * .15 + Math.sin(a) * h * .85 * f]); }
  P(x, [...up, [cx + w * .46, cy], [cx + w * .08, cy + h * .07], [cx - w * .44, cy]], t[1]);
  P(x, [up[0], up[1], up[2], up[3], [cx - w * .04, cy - h * .45]], t[0]);
  P(x, [up[4], up[5], up[6], [cx + w * .46, cy], [cx + w * .1, cy - h * .25]], t[2]);
  L(x, [up[2], up[3], up[4]], nuance(t[0], .25), Math.max(.8, w * .03));
}
function dalle(x, cx, cy, w, h, t) { // une pierre dressée, plate
  const pts = [[cx - w * .32, cy], [cx - w * .36, cy - h * .75], [cx - w * .1, cy - h], [cx + w * .3, cy - h * .88], [cx + w * .34, cy - h * .05], [cx + w * .05, cy + h * .04]];
  P(x, pts, t[1]); P(x, [pts[0], pts[1], pts[2], [cx - w * .02, cy - h * .5], pts[5]], t[0]); P(x, [pts[3], pts[4], pts[5], [cx + w * .08, cy - h * .45]], t[2]);
}
function spirale(x, cx, cy, r, col) { x.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * Math.PI * 4.2, rr = r * t, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * .9; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = col; x.lineWidth = Math.max(.8, r * .16); x.lineCap = 'round'; x.stroke(); }
function mousseSur(x, cx, cy, w, h) { P(x, [[cx - w * .4, cy - h * .7], [cx - w * .12, cy - h * .98], [cx + w * .22, cy - h * .92], [cx + w * .14, cy - h * .72], [cx - w * .16, cy - h * .62]], '#86b94f'); P(x, [[cx - w * .4, cy - h * .7], [cx - w * .12, cy - h * .98], [cx - w * .06, cy - h * .8]], '#a2d063'); }
function tertre(x, X, Y, u, terrain, B) { // jamais dit : la chose sort à peine d’un petit tertre
  const t = (B.sol[terrain] || B.sol.herbe);
  P(x, [[X - .32 * u, Y + .02 * u], [X - .14 * u, Y - .07 * u], [X + .16 * u, Y - .06 * u], [X + .33 * u, Y + .02 * u], [X + .06 * u, Y + .11 * u]], t[1]);
  P(x, [[X - .32 * u, Y + .02 * u], [X - .14 * u, Y - .07 * u], [X + .02 * u, Y - .02 * u], [X + .06 * u, Y + .11 * u]], t[0]);
  L(x, [[X - .18 * u, Y + .02 * u], [X - .2 * u, Y - .06 * u]], B.sol.herbe[2], .02 * u); L(x, [[X + .2 * u, Y + .02 * u], [X + .23 * u, Y - .05 * u]], B.sol.herbe[2], .02 * u);
}
function pierre(x, X, Y, u, a, T, o) {
  const B = o.B || B0, e = a.espece, st = a.stade, v = o.v ?? .5, terrain = o.terrain || 'herbe', tons = COL[e] || COL.pierre;
  const forme = ['cairn', 'caillou', 'galet'].includes(e) ? e : st >= 3 ? 'menhir' : choix(['bloc', 'rond', 'dalle'], v);
  const w = [.34, .55, .8, .5][st] * u, h = [.24, .42, .62, 1.3][st] * u;
  ombre(x, X, Y, (e === 'caillou' ? .2 : st >= 3 ? .34 : [.22, .32, .44][st]) * u, .12 * u);
  const ferme = a.etats.ferme && st < 3, Y0 = Y;
  if (ferme) Y += .08 * u; // à moitié enterrée : plus bas, puis un tertre devant
  if (forme === 'caillou') { rocher(x, X, Y, [.24, .32, .42, .5][st] * u, [.16, .22, .3, .36][st] * u, tons); if (v > .5) rocher(x, X + .18 * u, Y + .05 * u, .1 * u, .07 * u, tons); }
  else if (forme === 'galet') { for (const [dx, dy, s2] of [[-.12, .02, 1], [.14, .05, .75], [.02, -.08, .6]].slice(0, 1 + Math.min(2, st))) { E(x, X + dx * u, Y + dy * u - .06 * u * s2, .2 * u * s2, .1 * u * s2, tons[1]); E(x, X + dx * u - .03 * u * s2, Y + dy * u - .09 * u * s2, .12 * u * s2, .05 * u * s2, tons[0]); } }
  else if (forme === 'cairn') { const n = 2 + st; let y = Y, ww = (.55 + st * .06) * u; for (let k = 0; k < n; k++) { const hh = (.16 + .03 * (n - k)) * u; bloc(x, X + (k % 2 ? .03 : -.03) * u, y, ww, hh, tons); y -= hh * .85; ww *= .8; } }
  else if (forme === 'menhir') { dalle(x, X, Y, w, h, tons); spirale(x, X - .04 * u, Y - h * .55, .12 * u, nuance(tons[0], .35)); }
  else if (forme === 'rond') rocher(x, X, Y, w * 1.05, h, tons);
  else if (forme === 'dalle') dalle(x, X, Y, w * .8, h * 1.35, tons);
  else bloc(x, X, Y, w, h, tons);
  const hh = forme === 'dalle' ? h * 1.35 : forme === 'cairn' || forme === 'galet' || forme === 'caillou' ? 0 : h;
  if (hh && !B.enneige && (e === 'moussue' || (B.mousse && e !== 'sombre' && v > .45))) mousseSur(x, X, Y, forme === 'dalle' || forme === 'menhir' ? w * .7 : w, hh);
  if (hh && B.enneige) capNeige(x, X - .02 * w, Y - hh * .92, w * .8, hh * .18);
  if (ferme) { tertre(x, X, Y0 + .04 * u, u, terrain, B); Y = Y0; }
  if (a.etats.fissure && hh) L(x, [[X - .02 * u, Y - hh * .95], [X + .05 * u, Y - hh * .65], [X - .04 * u, Y - hh * .4], [X + .03 * u, Y - hh * .12]], '#3d3948', .035 * u);
  if (a.etats.mousse) { for (const [dx, dy, c] of [[-.22, -.1, '#7bb661'], [.18, -.16, '#8fc44a'], [-.05, -.02, '#7bb661']]) E(x, X + dx * u, Y + dy * u * (1 + st * .3), .09 * u, .05 * u, c); fleur(x, X - .3 * u, Y + .04 * u, u, '#ff6b6b'); fleur(x, X + .28 * u, Y + .05 * u, u, '#ffd166'); }
}

/* ───────── Les constructions ───────── */

function boite(x, X, Y, u, o, T = 0) {
  const hw = .42 * u, hh = hw * .5, wh = .44 * u, rh = .34 * u, style = o.style || 'crepi', murs = o.murs, toit = o.toit;
  ombre(x, X, Y + hh * .3, hw * 1.25, hh * 1.2, .1);
  const G = (s, t) => [X - hw + hw * s, Y + hh * s - wh * t], D = (s, t) => [X + hw * s, Y + hh - hh * s - wh * t]; // un point sur le mur gauche, sur le mur droit
  P(x, [G(0, 0), G(1, 0), G(1, 1), G(0, 1)], murs[0]); P(x, [D(0, 0), D(1, 0), D(1, 1), D(0, 1)], murs[1]);
  const trait = (a, b, c, w = .024) => L(x, [a, b], c, w * u);
  if (style === 'colombage') { const c = '#8a5a3c'; for (const f of [G, D]) { trait(f(0, .5), f(1, .5), c); trait(f(.02, 0), f(.02, 1), c); trait(f(.98, 0), f(.98, 1), c); trait(f(.02, .96), f(.98, .96), c); } trait(G(.25, .5), G(.02, .96), c, .018); trait(D(.75, .5), D(.98, .96), c, .018); }
  else if (style === 'pierre') { const r = rng(Math.round(X * 7 + Y * 13)); for (let k = 0; k < 9; k++) { const f = k % 2 ? G : D, s = .1 + r() * .75, t = .1 + r() * .7, c = k % 3 ? nuance(murs[k % 2], -.1) : nuance(murs[k % 2], .12); P(x, [f(s, t), f(s + .14, t), f(s + .14, t + .12), f(s, t + .12)], c); } }
  else if (style === 'bois' || style === 'paillote') { for (const f of [G, D]) for (const t of [.22, .44, .66, .88]) trait(f(0, t), f(1, t), nuance(murs[0], -.22), .012); if (style === 'paillote') for (const f of [G, D]) for (const s of [.2, .4, .6, .8]) trait(f(s, 0), f(s, 1), nuance(murs[0], -.15), .01); }
  else P(x, [G(0, 0), G(1, 0), G(1, .12), G(0, .12)], nuance(murs[0], -.12)), P(x, [D(0, 0), D(1, 0), D(1, .12), D(0, .12)], nuance(murs[1], -.12));
  const dw = .075 * u, dh = .24 * u, [dx, dy] = G(.5, 0); // la porte et ses deux marches
  P(x, [[dx - dw * 1.5, dy - .5 * dw * 1.5 + .04 * u], [dx + dw * 1.5, dy + .5 * dw * 1.5 + .04 * u], [dx + dw * 1.5, dy + .5 * dw * 1.5 + .015 * u], [dx - dw * 1.5, dy - .5 * dw * 1.5 + .015 * u]], '#a39c90');
  P(x, [[dx - dw * 1.25, dy - .5 * dw * 1.25 + .015 * u], [dx + dw * 1.25, dy + .5 * dw * 1.25 + .015 * u], [dx + dw * 1.25, dy + .5 * dw * 1.25], [dx - dw * 1.25, dy - .5 * dw * 1.25]], '#bdb6aa');
  const porte = [[dx - dw, dy - .5 * dw], [dx + dw, dy + .5 * dw], [dx + dw, dy + .5 * dw - dh], [dx - dw, dy - .5 * dw - dh]];
  P(x, porte.map(([px, py]) => [dx + (px - dx) * 1.22, py + (py < dy - dh * .5 ? -.02 * u : 0)]), '#6d4a33');
  P(x, porte, o.ferme ? '#4a3626' : o.lit ? '#ffcf6a' : '#8a5a3c');
  if (!o.ferme) { L(x, [[dx, dy], [dx, dy - dh]], o.lit ? '#e8a94a' : '#6d4a33', .012 * u); C(x, dx + dw * .6, dy + .5 * dw * .6 - dh * .45, .014 * u, '#e9c46a'); }
  const [wx, wy] = D(.5, .35), ww = .08 * u, wwh = .15 * u; // la fenêtre, son cadre, sa croisée, son appui
  const fen = [[wx - ww, wy + .5 * ww], [wx + ww, wy - .5 * ww], [wx + ww, wy - .5 * ww - wwh], [wx - ww, wy + .5 * ww - wwh]];
  P(x, fen.map(([px, py]) => [wx + (px - wx) * 1.3, wy - wwh / 2 + (py - (wy - wwh / 2)) * 1.2]), style === 'bois' ? COL.bois[2] : '#c9bda3');
  if (o.lit) { halo(x, wx, wy - wwh / 2, .5 * u, 'rgba(255,214,102,A)', .38 + .06 * Math.sin(T * 3 * speedK)); P(x, fen, '#ffd766'); } else P(x, fen, '#6a7d93');
  L(x, [[wx, wy], [wx, wy - wwh]], '#f3ead8', .014 * u); L(x, [[wx - ww, wy + .5 * ww - wwh / 2], [wx + ww, wy - .5 * ww - wwh / 2]], '#f3ead8', .014 * u);
  P(x, [[wx - ww * 1.3, wy + .5 * ww * 1.3 + .01 * u], [wx + ww * 1.3, wy - .5 * ww * 1.3 + .01 * u], [wx + ww * 1.3, wy - .5 * ww * 1.3 - .012 * u], [wx - ww * 1.3, wy + .5 * ww * 1.3 - .012 * u]], '#e9e0cf');
  if (o.volets) { P(x, [fen[0], [wx, wy], [wx, wy - wwh], fen[3]], '#6f8f6a'); P(x, [[wx + .01 * u, wy - .005 * u], fen[1], fen[2], [wx + .01 * u, wy - wwh - .005 * u]], '#5d7a59'); }
  const e = 1.16, apex = [X, Y - wh - rh], EL = [X - hw * e, Y - wh + hh * (e - 1)], EF = [X, Y + hh * e - wh], ER = [X + hw * e, Y - wh + hh * (e - 1)];
  P(x, [EL, EF, apex], toit[0]); P(x, [EF, ER, apex], toit[1]);
  const lignes = style === 'paillote' ? nuance(toit[0], -.15) : nuance(toit[0], -.14), lignesD = nuance(toit[1], -.14);
  for (const t of [.28, .52, .76]) { L(x, [[lerp(EL[0], apex[0], t), lerp(EL[1], apex[1], t)], [lerp(EF[0], apex[0], t), lerp(EF[1], apex[1], t)]], lignes, .016 * u); L(x, [[lerp(EF[0], apex[0], t), lerp(EF[1], apex[1], t)], [lerp(ER[0], apex[0], t), lerp(ER[1], apex[1], t)]], lignesD, .016 * u); }
  if (o.neige) { P(x, [[lerp(EL[0], apex[0], .35), lerp(EL[1], apex[1], .35)], [lerp(EF[0], apex[0], .35), lerp(EF[1], apex[1], .35)], apex], '#ffffff'); P(x, [[lerp(EF[0], apex[0], .35), lerp(EF[1], apex[1], .35)], [lerp(ER[0], apex[0], .35), lerp(ER[1], apex[1], .35)], apex], '#e6eef6'); L(x, [EL, EF, ER], '#ffffff', .03 * u); }
  L(x, [EF, apex], nuance(toit[0], .25), .02 * u); // l’arête, dans la lumière
  if (style !== 'paillote') {
    const cx = X + hw * .5, cy = Y - wh - rh * .42;
    P(x, [[cx - .05 * u, cy], [cx + .05 * u, cy - .025 * u], [cx + .05 * u, cy - .2 * u], [cx - .05 * u, cy - .175 * u]], '#9a9a9a'); P(x, [[cx - .06 * u, cy - .175 * u], [cx + .06 * u, cy - .205 * u], [cx + .06 * u, cy - .23 * u], [cx - .06 * u, cy - .2 * u]], '#7d7d7d');
    if (o.lit && speedK) for (let k = 0; k < 3; k++) { const t = ((T * .35 + k * .33) % 1); E(x, cx + Math.sin(t * 6 + k) * .05 * u + t * .1 * u, cy - .3 * u - t * .55 * u, (.05 + t * .07) * u, (.04 + t * .05) * u, `rgba(255,255,255,${(1 - t) * .55})`); } // la fumée
  }
}
function lanterne(x, X, Y, u, T) { // un réverbère
  E(x, X, Y, .06 * u, .03 * u, '#3f3834'); L(x, [[X, Y], [X, Y - .5 * u]], '#3f3834', .035 * u);
  halo(x, X, Y - .57 * u, .45 * u, 'rgba(255,214,120,A)', .4 + .05 * Math.sin(T * 2.3 * speedK));
  P(x, [[X - .06 * u, Y - .5 * u], [X + .06 * u, Y - .5 * u], [X + .05 * u, Y - .64 * u], [X - .05 * u, Y - .64 * u]], '#ffe39a');
  P(x, [[X - .09 * u, Y - .64 * u], [X + .09 * u, Y - .64 * u], [X, Y - .73 * u]], '#3f3834');
}
function maison(x, X, Y, u, a, T, o) {
  const B = o.B || B0, e = a.espece, st = a.stade, v = o.v ?? .5;
  if (e === 'banc' || e === 'cloture') ombre(x, X, Y, .45 * u, .12 * u, .09);
  if (e === 'pont') {
    const sc = [.75, .9, 1.05, 1.2][st] * u;
    E(x, X, Y + .02 * u, .55 * sc, .15 * sc, o.eau); E(x, X - .1 * sc, Y, .3 * sc, .07 * sc, 'rgba(255,255,255,.35)');
    for (const [dx, dy] of [[-.48, .03], [.48, .03]]) { rocher(x, X + dx * sc, Y + dy * sc, .14 * sc, .08 * sc, COL.pierre); }
    x.beginPath(); x.moveTo(X - .48 * sc, Y - .02 * sc); x.quadraticCurveTo(X, Y - .46 * sc, X + .48 * sc, Y - .02 * sc); x.strokeStyle = COL.bois[1]; x.lineWidth = .13 * sc; x.lineCap = 'round'; x.stroke();
    for (let k = 1; k < 8; k++) { const t = k / 8, px = lerp(X - .48 * sc, X + .48 * sc, t), py = (1 - t) ** 2 * (Y - .02 * sc) + 2 * (1 - t) * t * (Y - .46 * sc) + t * t * (Y - .02 * sc); L(x, [[px, py - .05 * sc], [px, py + .05 * sc]], COL.bois[2], .012 * sc); }
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
    if (B.enneige) L(x, [[X - .31 * sc, Y - .31 * sc], [X + .31 * sc, Y - .26 * sc]], '#ffffff', .025 * sc);
    fleur(x, X - .42 * sc, Y + .04 * sc, u * .8, choix(FLEURS[idDe(B)], v));
    if (st >= 2) lanterne(x, X + .48 * sc, Y + .04 * sc, u * .9, T);
    return;
  }
  if (e === 'cloture') {
    const n = 3 + Math.min(st, 2), pts = Array.from({ length: n }, (_, k) => [X - .45 * u + (k * .9 * u) / (n - 1), Y + .22 * u - (k * .45 * u) / (n - 1)]);
    for (const [px, py] of pts) { L(x, [[px, py + .02 * u], [px, py - .34 * u]], COL.bois[2], .055 * u); P(x, [[px - .03 * u, py - .34 * u], [px + .03 * u, py - .34 * u], [px, py - .39 * u]], COL.bois[1]); }
    L(x, pts.slice(0, -1).map(([px, py]) => [px, py - .14 * u]), COL.bois[1], .04 * u);
    L(x, pts.slice(0, -1).map(([px, py]) => [px, py - .27 * u]), COL.bois[0], .04 * u);
    const [ax, ay] = pts[n - 2], [bx, by] = pts[n - 1];
    L(x, [[ax, ay - .27 * u], [bx + .04 * u, by + .02 * u]], COL.bois[1], .04 * u); // la traverse tombée
    return;
  }
  const lieu = k => { const vv = (v + k * .29) % 1; return { murs: choix(B.maisons.murs, vv), toit: choix(B.maisons.toits, (vv * 3.7) % 1), style: choix(B.maisons.styles, (vv * 5.3) % 1), neige: B.enneige }; };
  if (st >= 3) { boite(x, X - .62 * u, Y - .3 * u, u * .58, lieu(1), T); boite(x, X + .6 * u, Y - .28 * u, u * .55, lieu(2), T); }
  else if (st >= 2) boite(x, X - .58 * u, Y - .28 * u, u * .58, lieu(1), T);
  boite(x, X, Y, u * (st === 0 ? .72 : .98), { ...lieu(0), lit: a.etats.lueur, volets: e === 'volets' && a.quad[1] !== 'S', ferme: a.etats.ferme }, T);
  if (!B.enneige) fleur(x, X - .5 * u, Y + .04 * u, u * .9, choix(FLEURS[idDe(B)], v));
}

/* ───────── Les cultures ───────── */

function champ(x, X, Y, u, a, T, o) {
  const B = o.B || B0, v = o.v ?? .5, sorte = a.etats.ferme ? 'friche' : choix(B.champs, v), st = a.stade, tw = .43 * u, th = tw * .5;
  const SOL = { ble: '#e6cb5c', potager: '#8a5d3b', lavande: '#8a7e5c', riz: '#8fd3cf', ananas: '#c7a765', citrouilles: '#7d6a3c', neige: '#f3f7fb', friche: '#cfc9a3' };
  P(x, [[X, Y - th], [X + tw, Y], [X, Y + th], [X - tw, Y]], SOL[sorte]);
  P(x, [[X - tw, Y], [X, Y + th], [X, Y + th + .05 * u], [X - tw, Y + .05 * u]], nuance(SOL[sorte], -.25)); P(x, [[X, Y + th], [X + tw, Y], [X + tw, Y + .05 * u], [X, Y + th + .05 * u]], nuance(SOL[sorte], -.35));
  const rangs = [.2, .4, .6, .8], le = (t, s) => [X - tw + t * tw + s * tw, Y + t * th - s * th]; // sur le rang t, à la position s
  for (const t of rangs) L(x, [le(t, 0), le(t, 1)], nuance(SOL[sorte], sorte === 'riz' ? .2 : -.18), .045 * u);
  if (sorte === 'ble') for (const t of rangs) for (const s of [.15, .45, .75]) { const [px, py] = le(t, s); L(x, [[px, py], [px, py - .16 * u]], '#d9ad34', .025 * u); E(x, px, py - .18 * u, .025 * u, .045 * u, '#f5d56c'); }
  else if (sorte === 'potager') for (const t of rangs) for (const s of [.2, .5, .8]) { const [px, py] = le(t, s); boule(x, px, py - .05 * u, .06 * u, ['#9ee06a', '#6fbf4a', '#4f9636'], 5); if ((t * 10 + s * 10) % 3 < 1) C(x, px + .03 * u, py - .02 * u, .025 * u, '#ff8e3c'); }
  else if (sorte === 'lavande') for (const t of rangs) for (const s of [.15, .45, .75]) { const [px, py] = le(t, s); boule(x, px, py - .06 * u, .07 * u, ['#c8a8f0', '#a47fd9', '#7f5cb8'], 6); }
  else if (sorte === 'riz') for (const t of rangs) for (const s of [.1, .3, .5, .7, .9]) { const [px, py] = le(t, s); L(x, [[px, py], [px - .02 * u, py - .08 * u]], '#5cbf4a', .016 * u); L(x, [[px, py], [px + .02 * u, py - .09 * u]], '#7ed957', .016 * u); }
  else if (sorte === 'ananas') for (const t of rangs.slice(0, 3)) for (const s of [.2, .6]) { const [px, py] = le(t + .1, s); E(x, px, py - .06 * u, .04 * u, .06 * u, '#f2b93e'); for (const k of [-1, 0, 1]) L(x, [[px, py - .11 * u], [px + k * .04 * u, py - .19 * u]], '#4f9a3a', .018 * u); }
  else if (sorte === 'citrouilles') for (const t of rangs.slice(0, 3)) for (const s of [.25, .7]) { const [px, py] = le(t + .1, s); E(x, px - .03 * u, py - .03 * u, .05 * u, .04 * u, '#e5762c'); E(x, px + .02 * u, py - .03 * u, .05 * u, .045 * u, '#f08a2c'); L(x, [[px, py - .07 * u], [px + .01 * u, py - .1 * u]], '#5f7a2e', .015 * u); boule(x, px - .08 * u, py - .02 * u, .04 * u, ['#9fcf5a', '#78ad44', '#5a8a34'], 5); }
  else if (sorte === 'neige') for (const t of rangs) for (const s of [.2, .5, .8]) { const [px, py] = le(t, s); L(x, [[px, py], [px, py - .05 * u]], '#6fa36a', .016 * u); }
  if (st >= 2) { // le moulin
    const mx = X + .02 * u, my = Y - .06 * u;
    P(x, [[mx - .18 * u, my], [mx, my + .06 * u], [mx, my - .62 * u], [mx - .13 * u, my - .62 * u]], COL.blanc[0]); P(x, [[mx, my + .06 * u], [mx + .18 * u, my], [mx + .13 * u, my - .62 * u], [mx, my - .62 * u]], COL.blanc[2]);
    P(x, [[mx - .04 * u, my - .02 * u], [mx + .04 * u, my - .01 * u], [mx + .04 * u, my - .16 * u], [mx - .04 * u, my - .17 * u]], '#8a5a3c');
    C(x, mx - .07 * u, my - .38 * u, .025 * u, '#6a7d93');
    P(x, [[mx - .16 * u, my - .6 * u], [mx + .16 * u, my - .6 * u], [mx, my - .82 * u]], B.enneige ? '#ffffff' : COL.bois[1]);
    const ang = T * .7 * speedK; x.save(); x.translate(mx + .02 * u, my - .66 * u); x.rotate(ang);
    for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); L(x, [[0, 0], [.42 * u, 0]], COL.bois[2], .035 * u); P(x, [[.1 * u, 0], [.4 * u, 0], [.4 * u, -.09 * u], [.1 * u, -.07 * u]], '#f3e7cf'); L(x, [[.25 * u, 0], [.25 * u, -.08 * u]], '#d8c9a8', .01 * u); }
    x.restore(); C(x, mx + .02 * u, my - .66 * u, .03 * u, COL.bois[2]);
  }
}
function culture(x, X, Y, u, a, T, o) {
  const B = o.B || B0, e = a.espece, st = a.stade, v = o.v ?? .5;
  if (e === 'champ') return champ(x, X, Y, u, a, T, o);
  if (e !== 'barque') ombre(x, X, Y, .3 * u, .12 * u);
  if (e === 'puits') {
    const sc = [.8, .95, 1.1, 1.2][st] * u;
    P(x, [[X - .22 * sc, Y - .1 * sc], [X, Y - .1 * sc], [X, Y + .07 * sc], [X - .22 * sc, Y + .06 * sc]], COL.pierre[1]);
    P(x, [[X, Y - .1 * sc], [X + .22 * sc, Y - .1 * sc], [X + .22 * sc, Y + .06 * sc], [X, Y + .07 * sc]], COL.pierre[2]);
    for (const [dx, dy] of [[-.16, -.02], [-.06, .03], [.08, -.04], [.16, .02]]) P(x, [[X + dx * sc - .04 * sc, Y + dy * sc], [X + dx * sc + .04 * sc, Y + dy * sc], [X + dx * sc + .04 * sc, Y + dy * sc - .04 * sc], [X + dx * sc - .04 * sc, Y + dy * sc - .04 * sc]], nuance(COL.pierre[1], dx > 0 ? -.15 : .12));
    E(x, X, Y - .1 * sc, .22 * sc, .1 * sc, a.etats.ferme ? COL.bois[1] : '#2c3a48');
    if (!a.etats.ferme) { E(x, X, Y - .1 * sc, .16 * sc, .06 * sc, '#3f6f8c'); E(x, X - .04 * sc, Y - .11 * sc, .06 * sc, .02 * sc, 'rgba(255,255,255,.4)'); }
    else for (const t of [-.1, 0, .1]) L(x, [[X + t * sc - .06 * sc, Y - .1 * sc + t * .2 * sc], [X + t * sc + .08 * sc, Y - .1 * sc - t * .2 * sc]], COL.bois[2], .012 * sc);
    L(x, [[X - .17 * sc, Y - .06 * sc], [X - .17 * sc, Y - .5 * sc]], COL.bois[2], .04 * sc); L(x, [[X + .17 * sc, Y - .06 * sc], [X + .17 * sc, Y - .5 * sc]], COL.bois[2], .04 * sc);
    L(x, [[X - .17 * sc, Y - .42 * sc], [X + .17 * sc, Y - .42 * sc]], COL.bois[1], .025 * sc);
    const toit = choix(B.maisons.toits, v);
    P(x, [[X - .27 * sc, Y - .48 * sc], [X, Y - .48 * sc], [X, Y - .68 * sc]], toit[0]); P(x, [[X, Y - .48 * sc], [X + .27 * sc, Y - .48 * sc], [X, Y - .68 * sc]], toit[1]);
    if (B.enneige) P(x, [[X - .2 * sc, Y - .54 * sc], [X, Y - .68 * sc], [X + .18 * sc, Y - .55 * sc]], '#ffffff');
    L(x, [[X, Y - .42 * sc], [X, Y - .28 * sc]], '#6b5b50', .02 * sc);
    P(x, [[X - .045 * sc, Y - .28 * sc], [X + .045 * sc, Y - .28 * sc], [X + .035 * sc, Y - .19 * sc], [X - .035 * sc, Y - .19 * sc]], COL.bois[2]);
    return;
  }
  if (e === 'feu') {
    const sc = [.7, .9, 1.05, 1.2][st] * u, fl = 1 + .1 * Math.sin(T * 9 * speedK) + .06 * Math.sin(T * 13.7 * speedK);
    for (let k = 0; k < 7; k++) { const an = (k / 7) * Math.PI * 2; rocher(x, X + Math.cos(an) * .26 * sc, Y + Math.sin(an) * .12 * sc + .02 * sc, .1 * sc, .07 * sc, COL.pierre); } // un cercle de pierres
    L(x, [[X - .2 * sc, Y + .05 * sc], [X + .18 * sc, Y - .05 * sc]], COL.bois[2], .07 * sc); L(x, [[X - .18 * sc, Y - .05 * sc], [X + .2 * sc, Y + .05 * sc]], COL.bois[1], .07 * sc);
    if (a.etats.ferme) { for (const [dx, dy] of [[-.08, -.02], [.06, -.05], [0, .02]]) E(x, X + dx * sc, Y + dy * sc, .045 * sc, .03 * sc, '#e07a3a'); return; }
    halo(x, X, Y - .15 * sc, .7 * sc, 'rgba(255,150,60,A)', .28);
    P(x, [[X - .17 * sc, Y - .02 * sc], [X - .08 * sc, Y - .28 * sc * fl], [X + .02 * sc, Y - .5 * sc * fl], [X + .1 * sc, Y - .26 * sc * fl], [X + .17 * sc, Y - .02 * sc]], '#ff8e3c');
    P(x, [[X - .09 * sc, Y - .02 * sc], [X - .03 * sc, Y - .18 * sc * fl], [X + .02 * sc, Y - .32 * sc * fl], [X + .06 * sc, Y - .16 * sc * fl], [X + .09 * sc, Y - .02 * sc]], '#ffd166');
    if (speedK) for (let k = 0; k < 3; k++) { const t = (T * .9 + k * .33) % 1; C(x, X + Math.sin(t * 9 + k) * .06 * sc, Y - (.4 + t * .5) * sc, .012 * sc, `rgba(255,200,120,${1 - t})`); } // des étincelles
    return;
  }
  if (e === 'barque') {
    const sc = [.8, .95, 1.1, 1.2][st] * u, yb = Y + Math.sin(T * 1.3 * speedK) * .02 * u - .04 * u, coque = choix([['#7f5a36', '#a3784a'], ['#5d7fa3', '#7ea0c4'], ['#b4503c', '#dc6a52']], v);
    E(x, X, yb + .04 * sc, .45 * sc, .09 * sc, 'rgba(255,255,255,.35)'); // le cercle sur l’eau
    const une = (bx, by, s2) => {
      P(x, [[bx - .35 * s2, by - .08 * s2], [bx + .38 * s2, by - .08 * s2], [bx + .28 * s2, by + .06 * s2], [bx - .25 * s2, by + .06 * s2]], coque[0]);
      P(x, [[bx - .28 * s2, by - .07 * s2], [bx + .3 * s2, by - .07 * s2], [bx + .22 * s2, by], [bx - .2 * s2, by]], a.etats.ferme ? COL.gris[1] : COL.bois[0]);
      L(x, [[bx - .33 * s2, by - .08 * s2], [bx + .36 * s2, by - .08 * s2]], coque[1], .02 * s2);
      for (const t of [-.1, .08]) L(x, [[bx + t * s2, by - .07 * s2], [bx + t * s2, by]], COL.bois[2], .02 * s2);
    };
    if (st >= 2) une(X + .35 * u, yb - .2 * u, sc * .7);
    une(X, yb, sc);
    L(x, [[X + .1 * sc, yb - .06 * sc], [X + .34 * sc, yb - .2 * sc]], COL.bois[2], .03 * sc); E(x, X + .36 * sc, yb - .21 * sc, .04 * sc, .018 * sc, COL.bois[1]); // une rame
  }
}

/* ───────── Le temps qu’il fait ───────── */

export function nuage(x, X, Y, u, tons) {
  P(x, [[X - .5 * u, Y], [X + .5 * u, Y], [X + .42 * u, Y + .1 * u], [X - .42 * u, Y + .1 * u]], tons[2]);
  boule(x, X - .28 * u, Y - .03 * u, .24 * u, tons, 8); boule(x, X + .3 * u, Y - .01 * u, .22 * u, tons, 8); boule(x, X + .02 * u, Y - .15 * u, .32 * u, tons, 8); boule(x, X - .1 * u, Y + .01 * u, .2 * u, tons, 7);
}
export function pluie(x, X, Y, u, T, n, chute = 1.3 * u) {
  for (let k = 0; k < n; k++) { const t = ((T * 1.6 * speedK + k * .37) % 1), px = X - .34 * u + (k * .68 * u) / (n - 1), py = Y + t * chute; L(x, [[px, py], [px - .03 * u, py + .16 * u]], `rgba(120,190,225,${.85 - t * .5})`, .035 * u); }
}
function etang(x, X, Y, u, a, T, o) {
  const B = o.B || B0, sc = [.8, 1, 1.15, 1.3][a.stade], rx = .46 * u * sc, ry = .22 * u * sc, r = rng(Math.round(X * 3 + Y * 5));
  const bord = [];
  for (let k = 0; k < 11; k++) { const an = (k / 11) * Math.PI * 2, rr = 1 + (r() - .5) * .16; bord.push([X + Math.cos(an) * rx * rr, Y + Math.sin(an) * ry * rr]); }
  P(x, bord.map(([px, py]) => [X + (px - X) * 1.08, Y + (py - Y) * 1.1 + .02 * u]), nuance(B.sol.sable[1], -.1));
  P(x, bord, B.sol.sable[0]);
  const eau = bord.map(([px, py]) => [X + (px - X) * .84, Y + (py - Y) * .84]);
  P(x, eau, o.eau || '#46bcd9');
  P(x, eau.slice(4, 9).concat([[X, Y]]), 'rgba(255,255,255,.18)');
  x.beginPath(); x.ellipse(X, Y, rx * .78, ry * .74, 0, Math.PI * 1.08, Math.PI * 1.9); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = .025 * u; x.stroke(); // l’écume du bord
  for (const [dx, dy, s2] of [[-.18, .02, 1], [.12, .06, .8], [.02, -.07, .7]]) { // des nénuphars
    const px = X + dx * u * sc, py = Y + dy * u * sc + Math.sin(T * .8 * speedK + dx * 9) * .005 * u;
    x.beginPath(); x.moveTo(px, py); x.ellipse(px, py, .07 * u * s2, .035 * u * s2, 0, .4, Math.PI * 2 - .1); x.closePath(); x.fillStyle = '#6cc04a'; x.fill();
  }
  if (!B.enneige) fleurCinq(x, X - .16 * u * sc, Y + .01 * u * sc, .025 * u, '#ff9ecf', '#fff4c9');
  for (let k = 0; k < 4; k++) { const px = X + rx * .75 + k * .03 * u, py = Y - ry * .3 + k * .02 * u; L(x, [[px, py], [px + .01 * u, py - (.18 + (k % 2) * .06) * u]], '#5f8f3a', .016 * u); if (k % 2) E(x, px + .01 * u, py - .2 * u, .012 * u, .035 * u, '#8a5a3c'); } // des roseaux
  rocher(x, X - rx * .95, Y + ry * .3, .12 * u, .08 * u, COL.pierre);
}
function meteo(x, X, Y, u, a, T, o) {
  const B = o.B || B0, e = a.espece, st = a.stade, sc = [.8, 1, 1.15, 1.3][st], drift = Math.sin(T * .35 * speedK + X * .01) * .15 * u, haut = (o.bas ? 1.05 : 1.55) * u;
  if (e === 'orage' || e === 'pluie') E(x, X + drift, Y, .42 * u * sc, .15 * u * sc, 'rgba(40,45,70,.16)'); // son ombre, au sol
  if (e === 'orage') {
    nuage(x, X + drift, Y - haut, u * sc, COL.orage);
    const on = reduced ? .5 : Math.sin(T * 6.3) > .86 ? 1 : .15;
    L(x, [[X + drift + .06 * u, Y - haut + .1 * u], [X + drift - .08 * u, Y - haut * .62], [X + drift + .05 * u, Y - haut * .58], [X + drift - .06 * u, Y - .05 * u]], `rgba(255,224,102,${on})`, .05 * u);
    if (on > .5) halo(x, X + drift, Y - haut * .5, .7 * u, 'rgba(255,240,180,A)', .25);
  } else if (e === 'pluie') { nuage(x, X + drift, Y - haut, u * sc, COL.gris); if (B.enneige) { for (let k = 0; k < 7; k++) { const t = ((T * .5 * speedK + k * .37) % 1); C(x, X + drift - .3 * u + k * .1 * u + Math.sin(T + k) * .03 * u, Y - haut + .12 * u + t * (haut - .15 * u), .02 * u, `rgba(255,255,255,${.95 - t * .5})`); } } else pluie(x, X + drift, Y - haut + .12 * u, u * sc, T, 7, haut - .15 * u); E(x, X + drift, Y + .02 * u, .22 * u, .07 * u, 'rgba(130,200,230,.45)'); }
  else if (e === 'fleurs') {
    const r = rng((o.i ?? 1) * 31 + (o.j ?? 1) * 7 + 3), pal = FLEURS[idDe(B)];
    for (let k = 0; k < 7 + st * 3; k++) { const px = X + (r() - .5) * .85 * u, py = Y + (r() - .5) * .4 * u; L(x, [[px - .03 * u, py], [px - .05 * u, py - .06 * u]], '#5f9e34', .016 * u); fleur(x, px, py, u * (.8 + r() * .3), pal[k % pal.length]); }
  } else if (e === 'etang') etang(x, X, Y, u, a, T, o);
}

/* ───────── L’ensemble ───────── */

export function lueur(x, X, Y, u, T, ph = 0) { // il y a un texte : une lumière flotte à côté, jamais son contenu
  const cx = X + Math.cos(T * .7 * speedK + ph) * .07 * u, cy = Y + Math.sin(T * 1.6 * speedK + ph) * .06 * u;
  halo(x, cx, cy, .45 * u, 'rgba(255,214,130,A)', .5);
  halo(x, cx, cy, .13 * u, 'rgba(255,250,225,A)', .95);
  C(x, cx, cy, .045 * u, '#fffbea');
  for (let k = 0; k < 3; k++) { const an = T * 1.1 * speedK + ph + k * 2.1; C(x, cx + Math.cos(an) * .2 * u, cy + Math.sin(an) * .09 * u - .04 * u, .02 * u, `rgba(255,236,170,${.45 + .4 * Math.sin(T * 3 * speedK + k + ph)})`); }
}
function sentier(x, X, Y, u) { // ça tourne en boucle : un sentier usé, tout autour
  x.beginPath(); x.ellipse(X, Y + .03 * u, .42 * u, .2 * u, 0, 0, Math.PI * 2); x.strokeStyle = 'rgba(196,160,110,.9)'; x.lineWidth = .075 * u; x.stroke();
  x.beginPath(); x.ellipse(X, Y + .025 * u, .42 * u, .2 * u, 0, Math.PI * 1.05, Math.PI * 1.95); x.strokeStyle = 'rgba(236,214,170,.9)'; x.lineWidth = .025 * u; x.stroke();
}
export function phare(x, X, Y, u, T) {
  const w = .36 * u, h = 1.35 * u;
  ombre(x, X, Y, .32 * u, .14 * u);
  for (const [dx, dy, ww] of [[-.3, .08, .16], [.28, .1, .14], [.05, .16, .12]]) rocher(x, X + dx * u, Y + dy * u, ww * u, ww * .6 * u, COL.pierre); // des rochers au pied
  P(x, [[X - w / 2, Y + .06 * u], [X, Y + .12 * u], [X, Y - h], [X - w * .36, Y - h]], COL.blanc[0]); P(x, [[X, Y + .12 * u], [X + w / 2, Y + .06 * u], [X + w * .36, Y - h], [X, Y - h]], COL.blanc[2]);
  for (const t of [.3, .62]) { const yy = Y - h * t, ww = (w * (1 - .28 * t)) / 2; P(x, [[X - ww, yy + .08 * u], [X, yy + .12 * u], [X, yy - .02 * u], [X - ww, yy - .06 * u]], '#e04e4e'); P(x, [[X, yy + .12 * u], [X + ww, yy + .08 * u], [X + ww, yy - .06 * u], [X, yy - .02 * u]], '#b93d3d'); }
  P(x, [[X - .05 * u, Y + .05 * u], [X + .03 * u, Y + .08 * u], [X + .03 * u, Y - .12 * u], [X - .05 * u, Y - .15 * u]], '#7a5236');
  E(x, X, Y - h, w * .5, w * .22, '#4a4a55');
  const ang = T * .8 * speedK;
  x.fillStyle = 'rgba(255,240,170,.22)'; x.beginPath(); x.moveTo(X, Y - h - .12 * u); x.lineTo(X + Math.cos(ang) * 1.7 * u, Y - h - .12 * u + Math.sin(ang) * .6 * u - .25 * u); x.lineTo(X + Math.cos(ang + .5) * 1.7 * u, Y - h - .12 * u + Math.sin(ang + .5) * .6 * u + .1 * u); x.closePath(); x.fill();
  halo(x, X, Y - h - .12 * u, .5 * u, 'rgba(255,240,170,A)', .5);
  P(x, [[X - .1 * u, Y - h], [X + .1 * u, Y - h], [X + .1 * u, Y - h - .22 * u], [X - .1 * u, Y - h - .22 * u]], '#ffe9a3');
  P(x, [[X - .14 * u, Y - h - .22 * u], [X + .14 * u, Y - h - .22 * u], [X, Y - h - .38 * u]], '#4a4a55');
}
const DESSINS = { arbre, pierre, maison, culture, meteo, caillou: pierre };

// o : { B (le paysage), v (la variante), eau, terrain, m, i, j, bas (nuages plus bas) }
export function dessinerChose(x, X, Y, u, a, T, o = {}) {
  x.save();
  if (a.propose) x.globalAlpha *= .5; // proposé d’après le texte, pas encore confirmé
  if (a.etats?.boucle && a.famille !== 'meteo') sentier(x, X, Y, u);
  if (a.etats?.double && a.famille !== 'meteo') DESSINS[a.famille](x, X + .34 * u, Y - .15 * u, u * .68, a, T, { ...o, v: ((o.v ?? .5) + .5) % 1 });
  DESSINS[a.famille](x, X, Y, u, a, T, o);
  if (a.etats?.lueur && !(a.famille === 'maison' && ['maison', 'volets'].includes(a.espece))) lueur(x, X + .38 * u, Y - (a.famille === 'arbre' ? .75 : .5) * u, u, T, X * .07 + Y * .05);
  x.restore();
}

/* ───────── Le petit décor du sol ───────── */
// Il ne dit rien : il habille le paysage. s est la largeur d’une tuile.

export function dessinerDecor(x, X, Y, s, kind, B = B0, r = .5) {
  const h = B.sol.herbe;
  switch (kind) {
    case 'touffe': for (const [dx, dy, c] of [[-.04, -.1, h[2]], [0, -.13, nuance(h[2], -.12)], [.04, -.09, h[2]], [.02, -.11, nuance(h[0], -.05)]]) L(x, [[X + dx * .4 * s, Y], [X + dx * s, Y + dy * s]], c, Math.max(.9, .018 * s)); break;
    case 'paquerette': L(x, [[X, Y], [X, Y - .05 * s]], h[2], .9); fleurCinq(x, X, Y - .06 * s, .018 * s, '#ffffff'); break;
    case 'bouton': L(x, [[X, Y], [X, Y - .06 * s]], h[2], .9); fleurCinq(x, X, Y - .07 * s, .016 * s, '#ffd166', '#f08a2c'); break;
    case 'trefle': for (const [dx, dy] of [[-.02, -.02], [.02, -.02], [0, -.045]]) C(x, X + dx * s, Y + dy * s, .02 * s, nuance(h[1], -.12)); break;
    case 'dalle': E(x, X, Y + .01 * s, .09 * s, .045 * s, '#8f8a82'); E(x, X, Y, .09 * s, .045 * s, '#b9b4ab'); E(x, X - .02 * s, Y - .008 * s, .05 * s, .02 * s, '#cfcac1'); break;
    case 'galet': E(x, X, Y, .045 * s, .03 * s, nuance(B.sol.sable[2], -.1)); E(x, X - .01 * s, Y - .008 * s, .025 * s, .012 * s, 'rgba(255,255,255,.4)'); break;
    case 'eclat': P(x, [[X - .05 * s, Y], [X + .04 * s, Y - .01 * s], [X, Y - .07 * s]], nuance(B.sol.roche[2], -.08)); P(x, [[X - .05 * s, Y], [X, Y - .07 * s], [X - .01 * s, Y - .02 * s]], B.sol.roche[0]); break;
    case 'mousse': E(x, X, Y, .07 * s, .03 * s, '#7fae4a'); E(x, X - .02 * s, Y - .01 * s, .04 * s, .015 * s, '#9cc95c'); break;
    case 'feuilles': [[-.04, 0, '#f08a2c'], [.03, .01, '#e5603a'], [0, -.02, '#f2b93e'], [.05, -.02, '#c9661e']].forEach(([dx, dy, c]) => P(x, [[X + dx * s - .018 * s, Y + dy * s], [X + dx * s, Y + dy * s - .01 * s], [X + dx * s + .018 * s, Y + dy * s], [X + dx * s, Y + dy * s + .01 * s]], c)); break;
    case 'champignon': for (const [dx, sz] of [[0, 1], [.05, .7]]) { const px = X + dx * s, k = sz * s; P(x, [[px - .012 * k, Y], [px + .012 * k, Y], [px + .01 * k, Y - .05 * k], [px - .01 * k, Y - .05 * k]], '#f4ecdc'); x.beginPath(); x.ellipse(px, Y - .05 * k, .04 * k, .035 * k, 0, Math.PI, 0); x.closePath(); x.fillStyle = '#e0413a'; x.fill(); C(x, px - .015 * k, Y - .065 * k, .007 * k, '#fff'); C(x, px + .012 * k, Y - .07 * k, .006 * k, '#fff'); } break;
    case 'souche': P(x, [[X - .05 * s, Y], [X + .05 * s, Y], [X + .045 * s, Y - .06 * s], [X - .045 * s, Y - .06 * s]], '#8a5a3c'); P(x, [[X, Y], [X + .05 * s, Y], [X + .045 * s, Y - .06 * s], [X, Y - .06 * s]], '#6d4630'); E(x, X, Y - .06 * s, .045 * s, .022 * s, '#d9b27c'); x.beginPath(); x.ellipse(X, Y - .06 * s, .025 * s, .012 * s, 0, 0, Math.PI * 2); x.strokeStyle = '#a3784a'; x.lineWidth = .8; x.stroke(); break;
    case 'buche': P(x, [[X - .08 * s, Y - .02 * s], [X + .06 * s, Y - .05 * s], [X + .06 * s, Y - .01 * s], [X - .08 * s, Y + .02 * s]], '#8a5a3c'); E(x, X + .06 * s, Y - .03 * s, .016 * s, .022 * s, '#d9b27c'); break;
    case 'fougere': for (const [a2, l] of [[-2.3, .1], [-1.9, .12], [-1.3, .12], [-.8, .1]]) { const ex = X + Math.cos(a2) * l * s, ey = Y + Math.sin(a2) * l * s * .8; L(x, [[X, Y], [(X + ex) / 2, (Y + ey) / 2 - .015 * s], [ex, ey]], '#4f9a3a', Math.max(.9, .02 * s)); } break;
    case 'fleurrouge': L(x, [[X, Y], [X, Y - .06 * s]], '#4f9a3a', .9); fleurCinq(x, X, Y - .07 * s, .02 * s, '#ff4d6d', '#ffd166'); break;
    case 'coquillage': P(x, [[X - .03 * s, Y], [X + .03 * s, Y], [X, Y - .035 * s]], '#f7c6c0'); L(x, [[X, Y], [X, Y - .03 * s]], '#e39a90', .7); break;
    case 'etoile': for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2 - Math.PI / 2; L(x, [[X, Y], [X + Math.cos(an) * .03 * s, Y + Math.sin(an) * .018 * s]], '#f08a2c', Math.max(1, .018 * s)); } break;
    case 'tasneige': E(x, X, Y, .07 * s, .03 * s, '#d9e4ee'); E(x, X - .01 * s, Y - .012 * s, .055 * s, .025 * s, '#ffffff'); break;
    case 'baies': boule(x, X, Y - .03 * s, .04 * s, ['#4f8a5a', '#3a6f47', '#2b5536'], 6); C(x, X - .015 * s, Y - .035 * s, .008 * s, '#e0413a'); C(x, X + .015 * s, Y - .025 * s, .008 * s, '#e0413a'); break;
    case 'sapineau': P(x, [[X - .035 * s, Y - .01 * s], [X, Y - .1 * s], [X + .035 * s, Y - .01 * s]], '#3f6f55'); P(x, [[X, Y - .1 * s], [X + .035 * s, Y - .01 * s], [X, Y - .005 * s]], '#2e5541'); if (B.enneige) P(x, [[X - .012 * s, Y - .07 * s], [X, Y - .1 * s], [X + .012 * s, Y - .07 * s]], '#ffffff'); break;
    case 'bruyere': for (const [dx, dy] of [[-.03, 0], [0, -.015], [.03, 0], [-.015, -.03], [.015, -.028]]) C(x, X + dx * s, Y + dy * s, .014 * s, r > .5 ? '#a57dc4' : '#c299e0'); break;
    default: break;
  }
}
