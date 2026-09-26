// Limbes — maquette C : les cases, l’entité, le ciel.
// Tout reste sur cet appareil ; rien ne part. Les étoiles des autres sont inventées.
// L’entité ne lit jamais le texte : elle suit les cases.

const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = '\u202f'; // espace fine insécable

/* ───────── Contenu (les cases de B) ───────── */

const SUBJECTS = [
  ['j’ai fait du mal à quelqu’un', 3, 2, 0], ['j’ai menti, je cache quelque chose', 2, 2, 1], ['infidélité, désir pour un autre', 2, 3, 0],
  ['sexualité', 1, 1, 0], ['couple qui va mal', 0, 3, 0], ['famille', 0, 3, 0], ['argent, dettes', 1, 1, 2], ['travail, études', 1, 1, 3],
  ['alcool, drogue, addiction', 2, 1, 2], ['santé mentale', 0, 1, 2], ['corps, apparence', 0, 0, 1], ['ce qu’on m’a fait', 0, 2, 0],
  ['deuil, perte', 0, 2, 0], ['ce que je suis, ce que je crois', 0, 1, 2], ['un rêve, une envie', 0, 0, 3],
];
const MORAL = ['s0', 's1', 's2', 's8', 's3', 's6', 's7'];
const bump = (scores, ids, n) => ids.forEach(id => { scores[id] = (scores[id] || 0) + n; });
const QUESTIONS = {
  situ: { key: 'Là, maintenant', title: 'Là, maintenant…', hint: 'Coche ce qui te ressemble. Plusieurs cases, ou aucune.', items: [
    { id: 'jamais', label: 'Il y a quelque chose que je n’ai jamais dit', chip: 'Je n’ai jamais dit que…', starter: 'Je n’ai jamais dit que ' },
    { id: 'regret', label: 'J’ai fait quelque chose que je regrette', chip: 'J’ai…', starter: 'J’ai ' },
    { id: 'mal', label: 'On m’a fait du mal', chip: 'On m’a…', starter: 'On m’a ', soft: true },
    { id: 'boucle', label: 'Ça tourne en boucle dans ma tête', chip: 'Ce qui tourne en boucle…', starter: 'Ce qui tourne en boucle, c’est ' },
    { id: 'longtemps', label: 'C’est lourd depuis longtemps', chip: 'Depuis longtemps…', starter: 'Depuis longtemps, ' },
    { id: 'recent', label: 'C’est arrivé récemment', chip: 'Il y a peu…', starter: 'Il y a peu, ' },
    { id: 'personne', label: 'Personne ne le sait', chip: 'Personne ne sait que…', starter: 'Personne ne sait que ' },
    { id: 'pasbien', label: 'Je ne suis pas bien du tout', soft: true },
    { id: 'danger', label: 'Je suis en danger, ou quelqu’un l’est', strong: true },
    { id: 'poser', label: 'Je veux juste le poser quelque part' },
  ] },
  mots: { key: 'Ça ressemble à', title: 'Ça ressemble à quoi ?', hint: 'Un mot, plusieurs, ou aucun.', grid: true, items: [
    { id: 'colere', label: 'de la colère', q: 'AD' }, { id: 'rage', label: 'de la rage', q: 'AD' }, { id: 'peur', label: 'de la peur', q: 'AD' }, { id: 'angoisse', label: 'de l’angoisse', q: 'AD' },
    { id: 'honte', label: 'de la honte', q: 'ED' }, { id: 'tristesse', label: 'de la tristesse', q: 'ED' }, { id: 'vide', label: 'du vide', q: 'ED' }, { id: 'fatigue', label: 'de la fatigue', q: 'ED' },
    { id: 'culpa', label: 'de la culpabilité', q: 'ED' }, { id: 'solitude', label: 'de la solitude', q: 'ED' },
    { id: 'envie', label: 'de l’envie', q: 'AS' }, { id: 'espoir', label: 'de l’espoir', q: 'AS' },
    { id: 'soulagement', label: 'du soulagement', q: 'ES' }, { id: 'calme', label: 'du calme', q: 'ES' },
  ], boost: a => {
    const s = {};
    if (a.situ.has('regret')) bump(s, ['culpa', 'honte'], 3);
    if (a.situ.has('mal')) { bump(s, ['peur'], 3); bump(s, ['honte'], 2); bump(s, ['colere', 'angoisse'], 1); }
    if (a.situ.has('pasbien')) { bump(s, ['vide', 'fatigue', 'tristesse'], 2); bump(s, ['angoisse'], 1); }
    if (a.situ.has('danger')) { bump(s, ['peur'], 3); bump(s, ['angoisse'], 2); }
    if (a.situ.has('boucle')) { bump(s, ['angoisse'], 2); bump(s, ['culpa'], 1); }
    if (a.situ.has('jamais') || a.situ.has('personne')) bump(s, ['honte', 'solitude'], 2);
    if (a.situ.has('recent')) bump(s, ['colere', 'tristesse'], 1);
    if (a.situ.has('longtemps')) bump(s, ['fatigue', 'vide'], 1);
    if (a.situ.has('poser')) bump(s, ['soulagement'], 1);
    return s;
  } },
  sujets: { key: 'Ça parle de', title: 'De quoi ça parle ?', hint: 'Un sujet, plusieurs, ou aucun.', items: SUBJECTS.map(([t], i) => ({ id: `s${i}`, label: t })), boost: a => {
    const s = {};
    if (a.situ.has('regret') || a.mots.has('honte') || a.mots.has('culpa')) MORAL.forEach(id => bump(s, [id], SUBJECTS[+id.slice(1)][1]));
    if (a.situ.has('mal')) { bump(s, ['s11'], 4); bump(s, ['s4', 's5'], 1); }
    if (a.mots.has('solitude')) { bump(s, ['s4', 's5'], 2); bump(s, ['s13'], 1); }
    if (a.mots.has('peur') || a.mots.has('angoisse')) { bump(s, ['s9'], 2); bump(s, ['s7', 's6'], 1); }
    if (a.mots.has('tristesse') || a.mots.has('vide')) bump(s, ['s12', 's9'], 2);
    if (a.mots.has('colere') || a.mots.has('rage')) bump(s, ['s5', 's7', 's4', 's0'], 1);
    if (a.mots.has('envie') || a.mots.has('espoir')) { bump(s, ['s14'], 2); bump(s, ['s13'], 1); }
    if (a.mots.has('fatigue')) { bump(s, ['s7'], 2); bump(s, ['s9'], 1); }
    if (a.situ.has('jamais') || a.situ.has('personne')) bump(s, ['s1', 's3', 's13'], 1);
    return s;
  } },
  fait: { key: 'Ce que tu as fait', title: 'Si c’est quelque chose que tu as fait…', hint: 'Une question de plus, d’après tes cases. Coche ce qui est vrai, ou rien.', extra: true,
    when: a => a.situ.has('regret') || ['s0', 's1', 's2'].some(id => a.sujets.has(id)), items: [
    { id: 'flong', label: 'C’était il y a longtemps', chip: 'Il y a longtemps, j’ai…', starter: 'Il y a longtemps, j’ai ' },
    { id: 'fplus', label: 'Je l’ai fait plus d’une fois', chip: 'Plus d’une fois…', starter: 'Plus d’une fois, ' },
    { id: 'fsouff', label: 'Quelqu’un en a souffert', chip: 'Quelqu’un en a souffert…', starter: 'Quelqu’un en a souffert : ' },
    { id: 'fsait', label: 'Cette personne ne le sait pas' },
    { id: 'frep', label: 'Je n’ai jamais réparé', chip: 'Je n’ai jamais réparé…', starter: 'Je n’ai jamais réparé, ' },
    { id: 'frepr', label: 'Personne ne me l’a jamais reproché' },
    { id: 'fpense', label: 'J’y pense encore', chip: 'J’y pense encore…', starter: 'J’y pense encore quand ' },
  ] },
  subi: { key: 'Ce qu’on t’a fait', title: 'Si c’est quelque chose qu’on t’a fait…', hint: 'Une question de plus, d’après tes cases. Coche ce qui est vrai, ou rien.', extra: true,
    when: a => a.situ.has('mal') || a.sujets.has('s11'), items: [
    { id: 'slong', label: 'C’était il y a longtemps', chip: 'C’était il y a longtemps…', starter: 'C’était il y a longtemps, ' },
    { id: 'scont', label: 'Ça continue', chip: 'Ça continue…', starter: 'Ça continue, ', soft: true },
    { id: 'sparle', label: 'Je n’en ai jamais parlé', chip: 'Je n’en ai jamais parlé…', starter: 'Je n’en ai jamais parlé, ' },
    { id: 'sresp', label: 'Je me sens responsable', chip: 'Je me sens responsable…', starter: 'Je me sens responsable, ' },
    { id: 'speur', label: 'J’ai peur de cette personne', strong: true },
  ] },
};
const KEYS = Object.keys(QUESTIONS);
const BASE = ['situ', 'mots', 'sujets'];

const LEX = {
  self: ['suicid', 'me tuer', 'en finir', "me foutre en l'air", 'me faire du mal', 'plus envie de vivre', 'envie de mourir', 'me pendre', 'me jeter sous', 'me jeter par', 'disparaitre pour de bon', 'me scarifi'],
  other: ['me frappe', 'me bat', 'me tape', "m'a frappe", 'des coups', 'viole', 'agresse', 'me menace', 'me force', "m'a force", 'va me tuer', 'peur de lui', "peur d'elle"],
  soft: ["j'en peux plus", "je n'en peux plus", 'a bout', 'panique', 'angoiss', 'je craque', 'trop lourd', 'plus la force', 'je tiens plus', 'je ne tiens plus'],
};

const HUMANS = [
  { id: 'self', title: 'Des gens qui répondent, à toute heure', items: [
    ['3114', 'tel:3114', 'idées noires, ou juste trop lourd'],
    ['SOS Amitié', 'tel:0972394050', '09 72 39 40 50, et par écrit sur sos-amitie.com'],
  ] },
  { id: 'other', title: 'Si quelqu’un te fait du mal', items: [
    ['3919', 'tel:3919', 'violences, 24 h/24, anonyme'],
    ['Par écrit', 'https://arretonslesviolences.gouv.fr', 'arretonslesviolences.gouv.fr, à toute heure'],
    ['17', 'tel:17', 'danger immédiat'],
    ['114', 'sms:114', 'par SMS, si tu ne peux pas parler'],
  ] },
  { id: 'young', title: 'Moins de 25 ans', items: [
    ['Fil Santé Jeunes', 'tel:0800235236', '0 800 235 236, tous les jours'],
    ['Nightline', 'https://www.nightline.fr', 'par écrit, le soir, entre étudiants'],
    ['3018', 'tel:3018', 'harcèlement en ligne'],
    ['119', 'tel:119', 'enfance en danger'],
  ] },
];

// Le ciel des autres est inventé : ces parts placent les étoiles.
const MOCK = { total: 1214, quad: { AD: 27, ED: 41, AS: 14, ES: 18 } };

/* ───────── État ───────── */

const emptyAnswers = () => Object.fromEntries(KEYS.map(k => [k, new Set()]));
const state = { answers: emptyAnswers(), text: '', short: false, help: 0, helpKind: '', softShown: false, path: null, hinted: false };
const trace = []; // ce qui serait compté (jamais le texte)
const note = s => trace.push(s);
const app = $('#app');
const checked = k => QUESTIONS[k].items.filter(it => state.answers[k].has(it.id));
const has = (k, id) => state.answers[k].has(id);
const anyChecked = () => KEYS.some(k => state.answers[k].size);
const pack = answers => Object.fromEntries(KEYS.map(k => [k, [...answers[k]]]));
const unpack = obj => Object.fromEntries(KEYS.map(k => [k, new Set(obj?.[k] || [])]));
const sequence = () => [...BASE, ...KEYS.filter(k => QUESTIONS[k].extra && QUESTIONS[k].when(state.answers))];
const signals = () => {
  const items = KEYS.flatMap(k => checked(k));
  return { strong: items.some(it => it.strong), soft: items.some(it => it.soft), other: has('situ', 'mal') || has('sujets', 's11') || state.answers.subi.size > 0 };
};

function saveDraft() {
  try { localStorage.setItem('limbesC.draft', JSON.stringify({ answers: pack(state.answers), text: state.text, short: state.short })); } catch { /* stockage indisponible */ }
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem('limbesC.draft') || 'null');
    if (!d) return;
    state.answers = unpack(d.answers);
    state.text = d.text || '';
    state.short = !!d.short;
  } catch { /* pas de brouillon */ }
}
function clearDraft() {
  state.answers = emptyAnswers();
  state.text = '';
  state.path = null;
  try { localStorage.removeItem('limbesC.draft'); } catch { /* rien à effacer */ }
  derive();
}

/* ───────── L’entité ───────── */

const lerp = (a, b, x) => a + (b - a) * x;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = x => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const mix = (c1, c2, x) => c1.map((c, i) => Math.round(lerp(c, c2[i], x)));
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rng = seed => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
const speedK = reduced ? .25 : 1;
const t0 = performance.now();
const now = () => (performance.now() - t0) / 1000;

const ent = { a: .45, v: .4, w: .25, m: false, r: false, p: false, t: false }; // la cible : ce que disent les cases
const cur = { a: .45, v: .4, w: .25, m: 0, r: 0, p: 0, t: 0 }; // ce qu’on voit : glisse vers la cible

// Les cases font l’entité. Jamais le texte, sauf sa présence (une lueur).
function derive() {
  const words = checked('mots');
  let a = .45, v = .4;
  if (words.length) {
    a = words.reduce((s, it) => s + (it.q[0] === 'A' ? .85 : .2), 0) / words.length;
    v = words.reduce((s, it) => s + (it.q[1] === 'S' ? .85 : .2), 0) / words.length;
  }
  if (has('situ', 'danger')) a = Math.max(a, .8);
  if (has('situ', 'boucle')) a = Math.min(1, a + .1);
  if (has('situ', 'pasbien')) v = Math.max(0, v - .1);
  const heavy = ['boucle', 'longtemps', 'pasbien', 'danger', 'jamais', 'personne', 'mal', 'regret'].filter(id => has('situ', id)).length + state.answers.fait.size + state.answers.subi.size;
  const dims = [0, 0, 0];
  for (const it of checked('sujets')) { const s = SUBJECTS[+it.id.slice(1)]; dims[0] += s[1]; dims[1] += s[2]; dims[2] += s[3]; }
  Object.assign(ent, { a, v, w: clamp01(.25 + heavy * .09), m: dims[0] >= 2 || state.answers.fait.size > 0, r: dims[1] >= 3 || state.answers.subi.size > 0, p: dims[2] >= 2, t: !!state.text.trim() });
}

function smooth() {
  for (const k of ['a', 'v', 'w']) cur[k] += (ent[k] - cur[k]) * .05;
  for (const k of ['m', 'r', 'p', 't']) cur[k] += ((ent[k] ? 1 : 0) - cur[k]) * .06;
}

const PALE = [[94, 98, 214], [236, 168, 92]]; // douloureux → supportable
function tone(q) {
  const c = mix(PALE[0], PALE[1], clamp01(q.v));
  const dull = mix(c, [150, 145, 150], (1 - clamp01(q.a)) * .3);
  const bright = lerp(.8, 1.05, clamp01(q.a));
  return dull.map(x => Math.min(255, Math.round(x * bright)));
}

function entityPath(x, cx, cy, R, q, T, phase = 0) {
  const speed = (.35 + 1.6 * q.a) * speedK, amp = .05 + .14 * q.a, N = 110;
  x.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = i / N * Math.PI * 2;
    let r = R * (1 + amp * Math.sin(3 * th + T * speed + phase) + amp * .6 * Math.sin(5 * th - T * speed * 1.3 + 1 + phase) + amp * .3 * Math.sin(8 * th + T * speed * .7 + phase * 2));
    r += R * .14 * q.m * Math.abs(Math.sin(7 * th + T * speed * 1.7));
    r *= 1 + .3 * q.p * Math.max(0, -Math.sin(th));
    const X = cx + r * Math.cos(th), Y = cy + r * Math.sin(th);
    if (i) x.lineTo(X, Y); else x.moveTo(X, Y);
  }
  x.closePath();
}

function drawEntity(x, cx, cy, R, q, T, alpha = 1) {
  const col = tone(q), light = mix(col, [255, 250, 240], .6), deep = mix(col, [30, 24, 60], .4);
  let g = x.createRadialGradient(cx, cy, R * .5, cx, cy, R * 2); // halo
  g.addColorStop(0, rgba(col, .22 * alpha)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 2, 0, Math.PI * 2); x.fill();
  if (q.r > .01) { // une attache : un petit lobe relié
    const ang = Math.PI * .8 + Math.sin(T * .4 * speedK) * .2, d = R * (.9 + .5 * q.r);
    const lx = cx + Math.cos(ang) * d, ly = cy + Math.sin(ang) * d;
    x.strokeStyle = rgba(col, .85 * alpha * q.r); x.lineWidth = Math.max(2, R * .16); x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(lx, ly); x.stroke();
    x.fillStyle = rgba(col, alpha * q.r); x.beginPath(); x.arc(lx, ly, R * .34 * q.r, 0, Math.PI * 2); x.fill();
  }
  entityPath(x, cx, cy, R, q, T); // le corps
  g = x.createRadialGradient(cx - R * .25, cy - R * .3, R * .1, cx, cy, R * 1.15);
  g.addColorStop(0, rgba(light, alpha)); g.addColorStop(.45, rgba(col, alpha)); g.addColorStop(1, rgba(deep, alpha));
  x.fillStyle = g; x.fill();
  x.save();
  entityPath(x, cx, cy, R, q, T); x.clip();
  for (let k = 0; k < 3; k++) { // des cellules translucides qui dérivent
    const ox = Math.cos(T * .3 * speedK + k * 2.1) * R * .35, oy = Math.sin(T * .25 * speedK + k * 1.7) * R * .3;
    entityPath(x, cx + ox, cy + oy, R * (.28 + k * .06), q, T, k + 1);
    x.fillStyle = rgba(light, .16 * alpha); x.fill();
  }
  if (q.t > .01) { // la lueur : il y a un texte
    const gg = x.createRadialGradient(cx - R * .1, cy - R * .15, 0, cx, cy, R * .7);
    gg.addColorStop(0, `rgba(255,255,255,${.75 * q.t * alpha})`); gg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gg; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
  }
  x.restore();
  entityPath(x, cx, cy, R, q, T); // un liseré de lumière
  x.strokeStyle = rgba(light, .45 * alpha); x.lineWidth = 1.5; x.stroke();
}

function sizeCanvas(c, ctx) {
  const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [Math.round(r.width), Math.round(r.height)];
}

const companion = $('#companion'), entCanvas = $('#ent'), ex = entCanvas.getContext('2d');
let EW = 0, EH = 0, burnAnim = null;

function drawCompanion(T) {
  ex.clearRect(0, 0, EW, EH);
  const R = (22 + 22 * cur.w) * (EH / 120);
  if (burnAnim) { // brûler : elle se dissout
    const p = clamp01((performance.now() - burnAnim.start) / 1300), r = rng(9);
    drawEntity(ex, EW / 2, EH / 2 + 4, R * (1 + p * .5), cur, T, 1 - p);
    ex.fillStyle = rgba(tone(cur), (1 - p) * .8);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = R * (.4 + p * 3) * (.5 + r()); ex.beginPath(); ex.arc(EW / 2 + Math.cos(a) * d, EH / 2 + 4 + Math.sin(a) * d - p * 40, 1.5 + r() * 2, 0, Math.PI * 2); ex.fill(); }
    return;
  }
  drawEntity(ex, EW / 2, EH / 2 + 4, R, cur, T);
}

/* ───────── Le ciel ───────── */

const sky = { canvas: null, ctx: null, W: 0, H: 0, others: [], mine: [], blooms: [], arrivals: 0, next: 0, sending: null, sel: null };

function loadMine() { try { sky.mine = JSON.parse(localStorage.getItem('limbesC.stars') || '[]'); } catch { sky.mine = []; } }
function saveMine() { try { localStorage.setItem('limbesC.stars', JSON.stringify(sky.mine)); } catch { /* stockage indisponible */ } }

function seedOthers() {
  const r = rng(3);
  sky.others = [];
  for (const [q, share] of Object.entries(MOCK.quad)) {
    for (let i = 0; i < Math.round(share * 1.4); i++) {
      const a = (q[0] === 'A' ? .5 : 0) + r() * .5, v = (q[1] === 'S' ? .5 : 0) + r() * .5, layer = Math.floor(r() * 3);
      sky.others.push({ a, v, layer, size: [.7, 1.1, 1.6][layer] + r() * .6, ph: r() * 6.28, sp: .4 + r() * 1.2, born: -10 });
    }
  }
}

const starPos = (a, v) => [sky.W * (.07 + .86 * v), sky.H * (.07 + .86 * (1 - a))];
const starColor = q => mix(tone(q), [255, 255, 255], .35);

function drawStar(x, X, Y, size, col, alpha, q, T) {
  const halo = x.createRadialGradient(X, Y, 0, X, Y, size * 5);
  halo.addColorStop(0, rgba(col, .45 * alpha)); halo.addColorStop(1, rgba(col, 0));
  x.fillStyle = halo; x.beginPath(); x.arc(X, Y, size * 5, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgba(mix(col, [255, 255, 255], .5), alpha); x.beginPath(); x.arc(X, Y, size, 0, Math.PI * 2); x.fill();
  if (q?.m) {
    x.strokeStyle = rgba(col, alpha * .7); x.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4 + T * .25 * speedK; x.beginPath(); x.moveTo(X - Math.cos(an) * size * 3.2, Y - Math.sin(an) * size * 3.2); x.lineTo(X + Math.cos(an) * size * 3.2, Y + Math.sin(an) * size * 3.2); x.stroke(); }
  }
  if (q?.r) { x.fillStyle = rgba(col, alpha); x.beginPath(); x.arc(X + size * 2.6, Y + size * 1.3, size * .5, 0, Math.PI * 2); x.fill(); }
  if (q?.p) {
    const g = x.createLinearGradient(X, Y, X - size * 7, Y + size * 7);
    g.addColorStop(0, rgba(col, alpha * .6)); g.addColorStop(1, rgba(col, 0));
    x.strokeStyle = g; x.lineWidth = size * .8; x.beginPath(); x.moveTo(X, Y); x.lineTo(X - size * 7, Y + size * 7); x.stroke();
  }
}

function arrive(T) { // une étoile de quelqu’un d’autre (inventée)
  const r = Math.random(), q = r < .27 ? 'AD' : r < .68 ? 'ED' : r < .82 ? 'AS' : 'ES';
  const a = (q[0] === 'A' ? .5 : 0) + Math.random() * .5, v = (q[1] === 'S' ? .5 : 0) + Math.random() * .5;
  sky.others.push({ a, v, layer: 2, size: 1.4 + Math.random() * .6, ph: Math.random() * 6.28, sp: .6 + Math.random(), born: T });
  sky.blooms.push({ a, v, born: T, col: starColor({ a, v }) });
  sky.arrivals++;
  sky.next = T + 4 + Math.random() * 5;
  updateSkyLine();
}

function drawSky(T) {
  const x = sky.ctx, W = sky.W, H = sky.H;
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0d2a'); bg.addColorStop(1, '#181b40');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  let h = x.createRadialGradient(W * .25, H * .3, 0, W * .25, H * .3, W * .6); // des brumes
  h.addColorStop(0, 'rgba(120,120,230,.16)'); h.addColorStop(1, 'rgba(120,120,230,0)');
  x.fillStyle = h; x.fillRect(0, 0, W, H);
  h = x.createRadialGradient(W * .8, H * .8, 0, W * .8, H * .8, W * .55);
  h.addColorStop(0, 'rgba(236,168,92,.10)'); h.addColorStop(1, 'rgba(236,168,92,0)');
  x.fillStyle = h; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.22)'; x.font = '700 9px Nunito, sans-serif'; x.textAlign = 'center'; // des repères, à peine
  x.fillText('AGITÉ', W / 2, 12); x.fillText('ÉTEINT', W / 2, H - 5);
  x.save(); x.translate(8, H / 2); x.rotate(-Math.PI / 2); x.fillText('DOULOUREUX', 0, 3); x.restore();
  x.save(); x.translate(W - 8, H / 2); x.rotate(Math.PI / 2); x.fillText('SUPPORTABLE', 0, 3); x.restore();
  if (T > sky.next && !reduced) arrive(T);
  for (const s of sky.others) {
    const [X0, Y] = starPos(s.a, s.v), X = X0 + Math.sin(T * .06 * speedK + s.ph) * (s.layer + 1) * 1.2;
    const ramp = clamp01((T - s.born) / 1.5), tw = .45 + .3 * Math.sin(T * s.sp * speedK + s.ph), col = starColor({ a: s.a, v: s.v });
    const halo = x.createRadialGradient(X, Y, 0, X, Y, s.size * 4);
    halo.addColorStop(0, rgba(col, .35 * tw * ramp)); halo.addColorStop(1, rgba(col, 0));
    x.fillStyle = halo; x.beginPath(); x.arc(X, Y, s.size * 4, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgba(col, (.55 + .45 * tw) * ramp); x.beginPath(); x.arc(X, Y, s.size, 0, Math.PI * 2); x.fill();
  }
  sky.blooms = sky.blooms.filter(b => T - b.born < 1.8);
  for (const b of sky.blooms) { // une arrivée : un anneau qui s’ouvre
    const [X, Y] = starPos(b.a, b.v), age = T - b.born;
    x.strokeStyle = rgba(b.col, (1 - age / 1.8) * .7); x.lineWidth = 1.5;
    x.beginPath(); x.arc(X, Y, 4 + age * 24, 0, Math.PI * 2); x.stroke();
  }
  sky.mine.forEach((s, i) => { // les tiennes
    const [X, Y] = starPos(s.a, s.v), col = starColor(s), size = 2.5 + 4 * s.w, tw = .8 + .2 * Math.sin(T * (1 + 4 * s.a) * speedK + i);
    x.strokeStyle = rgba(col, sky.sel === i ? .8 : .35); x.lineWidth = 1;
    x.beginPath(); x.arc(X, Y, size * 2.6 + Math.sin(T * .8 * speedK + i) * .8, 0, Math.PI * 2); x.stroke();
    drawStar(x, X, Y, size, col, tw, s, T);
  });
  if (sky.sending) { // la tienne monte, et devient une étoile
    const p = clamp01((performance.now() - sky.sending.start) / 1900), e = ease(p);
    const [tx, ty] = starPos(ent.a, ent.v), sx = W / 2, sy = -30;
    for (let k = 6; k >= 1; k--) {
      const ee = ease(clamp01(p - k * .03)), tX = lerp(sx, tx, ee), tY = lerp(sy, ty, ee) - Math.sin(clamp01(p - k * .03) * Math.PI) * 40;
      x.fillStyle = rgba(tone(ent), .22 * (1 - k / 7)); x.beginPath(); x.arc(tX, tY, (4 + 4 * ent.w) * (1 - k / 8), 0, Math.PI * 2); x.fill();
    }
    drawEntity(x, lerp(sx, tx, e), lerp(sy, ty, e) - Math.sin(p * Math.PI) * 40, (22 + 22 * ent.w) * (1 - .8 * e), cur, T, 1 - .15 * e);
    if (p >= 1) finishSend(T);
  }
}

function finishSend(T) {
  const s = { a: ent.a, v: ent.v, w: ent.w, m: ent.m, r: ent.r, p: ent.p, t: ent.t, date: new Date().toISOString() };
  sky.mine.push(s);
  saveMine();
  sky.blooms.push({ a: s.a, v: s.v, born: T, col: starColor(s) });
  sky.sending = null;
  note('geste : envoyer au ciel');
  clearDraft();
  updateSkyLine('Elle est là, parmi les autres.');
  const h = app.querySelector('h1'), st = app.querySelector('.step');
  if (h) h.textContent = 'Le ciel, ce soir';
  if (st) st.textContent = 'Le ciel';
}

function updateSkyLine(extra = '') {
  const line = $('#sky-line');
  if (!line) return;
  const n = sky.mine.length;
  line.textContent = `Ce mois-ci${NB}: ${(MOCK.total + n).toLocaleString('fr-FR')} étoiles · arrivées depuis que tu regardes${NB}: ${sky.arrivals} · les tiennes${NB}: ${n}${extra ? ` · ${extra}` : ''}`;
}

function renderSky(sending) {
  const wrap = el('div', { className: 'skywrap' }), c = el('canvas');
  c.setAttribute('aria-label', 'Le ciel : les étoiles des autres, et les tiennes');
  wrap.append(c);
  const caption = el('p', { className: 'sky-caption', id: 'sky-caption', textContent: sky.mine.length ? 'Touche une des tiennes.' : '' });
  app.replaceChildren(
    el('p', { className: 'step', textContent: sending ? 'Elle monte' : 'Le ciel' }),
    el('h1', { textContent: sending ? 'Envoyée au ciel' : 'Le ciel, ce soir' }),
    el('p', { className: 'hint', textContent: 'Les étoiles des autres arrivent au fil de l’eau. Personne ne lit rien : ce sont des lumières.' }),
    wrap, caption, el('p', { className: 'sky-line', id: 'sky-line' }),
    el('details', {}, el('summary', { textContent: 'Ce qui serait compté' }), el('ul', {}, ...(trace.length ? trace : ['rien']).map(t => el('li', { textContent: t })))),
    el('p', { className: 'tiny', textContent: 'Les étoiles des autres sont inventées pour la maquette. Les tiennes restent sur ce téléphone.' }),
    el('nav', { className: 'nav' }, quiet('retour', () => history.back()), el('span', { className: 'spacer' }), quiet('recommencer', () => { clearDraft(); go('q:situ'); })),
  );
  sky.canvas = c; sky.ctx = c.getContext('2d');
  [sky.W, sky.H] = sizeCanvas(c, sky.ctx);
  seedOthers();
  sky.blooms = []; sky.arrivals = 0; sky.sel = null; sky.next = now() + 3;
  sky.sending = sending ? { start: performance.now() } : null;
  c.addEventListener('pointerdown', e => { // seules les tiennes répondent
    const r = c.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bd = 26;
    sky.mine.forEach((s, i) => { const [X, Y] = starPos(s.a, s.v), d = Math.hypot(X - px, Y - py); if (d < bd) { bd = d; best = i; } });
    sky.sel = best;
    caption.textContent = best == null ? (sky.mine.length ? 'Touche une des tiennes.' : '') : `La tienne, envoyée le ${new Date(sky.mine[best].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${new Date(sky.mine[best].date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`;
  });
  updateSkyLine();
}

/* ───────── Navigation ───────── */

const quiet = (text, fn) => { const b = el('button', { type: 'button', className: 'quiet', textContent: text }); b.addEventListener('click', fn); return b; };

let pendingSend = false;
function go(screen) { history.pushState({ screen }, '', ''); render(screen); }

function render(screen) {
  document.body.classList.toggle('short', state.short && screen === 'page');
  companion.hidden = screen === 'after' || screen === 'sky';
  if (!companion.hidden) [EW, EH] = sizeCanvas(entCanvas, ex);
  if (screen === 'orient') renderOrient();
  else if (screen === 'page') renderPage();
  else if (screen === 'after') renderAfter();
  else if (screen === 'sky') { renderSky(pendingSend); pendingSend = false; }
  else renderQ(QUESTIONS[screen.slice(2)] ? screen.slice(2) : 'situ');
  scrollTo(0, 0);
  const h = app.querySelector('h1, .big');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
}

/* ───────── Les questions ───────── */

function renderQ(key) {
  const q = QUESTIONS[key];
  const scores = q.boost ? q.boost(state.answers) : {};
  const items = [...q.items].sort((x, y) => (scores[y.id] || 0) - (scores[x.id] || 0));
  const boosted = items.some(it => scores[it.id]);
  const dots = el('div', { className: 'dots' }), step = el('p', { className: 'step' }), next = el('button', { type: 'button', className: 'btn' }), nav = el('nav', { className: 'nav' });
  const refresh = () => {
    const seq = sequence(), i = seq.indexOf(key), last = i === seq.length - 1, n = state.answers[key].size;
    dots.replaceChildren(...seq.map((k, j) => el('i', { className: j === i ? 'now' : j < i ? 'done' : '' })));
    step.textContent = q.extra ? 'Une question de plus' : `${i + 1} sur ${seq.length}`;
    next.textContent = (last ? 'Voir' : 'Suivant') + (n ? ` (${n})` : '');
    next.onclick = () => go(last ? 'orient' : `q:${seq[i + 1]}`);
    nav.replaceChildren(key === 'situ' ? el('span') : quiet('retour', () => history.back()), el('span', { className: 'spacer' }), quiet('passer', next.onclick), next);
  };
  const list = el('div', { className: `opts${q.grid ? ' grid' : ''}` }, ...items.map(it => {
    const input = el('input', { type: 'checkbox', checked: has(key, it.id) });
    input.addEventListener('change', () => {
      if (input.checked) { state.answers[key].add(it.id); note(`case : ${it.label}`); } else state.answers[key].delete(it.id);
      if (!state.hinted) { state.hinted = true; $('#ent-hint').hidden = true; }
      derive(); saveDraft(); refresh();
    });
    const opt = el('label', { className: 'opt' }, input, el('span', { textContent: it.label }));
    if (scores[it.id]) { const m = el('i', { className: 'mark' }); m.setAttribute('title', 'd’après tes cases'); opt.append(m); }
    return opt;
  }));
  refresh();
  app.replaceChildren(dots, step, el('h1', { textContent: q.title }),
    el('p', { className: 'hint', textContent: boosted ? 'Les premières viennent de tes cases. Tout le reste est là aussi.' : q.hint }), list, nav);
}

/* ───────── Par où aller ───────── */

function starters() {
  const out = KEYS.filter(k => k !== 'mots' && k !== 'sujets').flatMap(k => checked(k).filter(it => it.starter).map(it => ({ label: it.chip, text: it.starter })));
  const words = checked('mots').map(it => it.label);
  if (words.length) out.push({ label: 'Il y a…', text: `Il y a ${words.join(' et ')}. ` });
  const subs = checked('sujets').map(it => it.label);
  if (subs.length) out.push({ label: 'Ça parle de…', text: `Ça parle de${NB}: ${subs.join(', ')}. ` });
  return out;
}

function renderOrient() {
  const sig = signals(), poser = has('situ', 'poser'), total = anyChecked();
  const recap = el('div', { className: 'recap' });
  if (!total) recap.append(el('p', { className: 'hint', textContent: 'Tu n’as rien coché. C’est très bien aussi. Voilà par où on peut aller.' }));
  else for (const k of KEYS) {
    const c = checked(k);
    if (!c.length) continue;
    recap.append(el('p', { className: 'recap-row' }, el('span', { className: 'k', textContent: `${QUESTIONS[k].key}${NB}:` }), ...c.map(it => {
      const b = el('button', { type: 'button', className: 'tag', textContent: it.label });
      b.addEventListener('click', () => go(`q:${k}`));
      return b;
    })));
  }
  const paths = el('div', { className: 'paths' });
  const path = (title, sub, fn, cls = '') => {
    const b = el('button', { type: 'button', className: `path ${cls}`.trim() }, el('b', { textContent: title }), el('small', { textContent: sub }));
    b.addEventListener('click', () => { state.path = title; note(`chemin : ${title}`); fn(); });
    paths.append(b);
  };
  const humans = () => humansSheet(sig.other ? 'other' : 'self');
  if (sig.strong) path('Parler à quelqu’un, maintenant', 'des humains, à toute heure', humans, 'first');
  if (poser) path('Juste le poser', 'sans écrire : garder, brûler, ou envoyer au ciel', finishSheet);
  path('Écrire', starters().length ? 'avec des débuts de phrases tirés de tes cases' : 'la page est à toi', () => { state.short = false; go('page'); });
  path('Le dire en trois lignes', 'court, et c’est tout', () => { state.short = true; go('page'); });
  if (!poser) path('Juste le poser', 'sans écrire : garder, brûler, ou envoyer au ciel', finishSheet);
  if (!sig.strong && sig.soft) path('Parler à quelqu’un', 'des humains, ailleurs, à toute heure', humans);
  path('Voir le ciel', sky.mine.length ? 'les étoiles des autres, et les tiennes' : 'les étoiles des autres', () => go('sky'));
  const seq = sequence();
  app.replaceChildren(
    el('p', { className: 'step', textContent: 'D’après tes cases' }),
    el('h1', { textContent: 'Par où aller ?' }),
    recap,
    el('p', { className: 'hint', textContent: total ? 'Tu choisis. Tu pourras revenir.' : '' }),
    paths,
    el('nav', { className: 'nav' }, quiet('retour aux questions', () => go(`q:${seq[seq.length - 1]}`))),
  );
}

/* ───────── La page ───────── */

let assessTimer;

function grow(ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }

function insert(ta, str) {
  const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s, before = ta.value.slice(0, s);
  ta.setRangeText(before && !/\n\s*$/.test(before) ? `\n${str}` : str, s, e, 'end');
  ta.focus({ preventScroll: true });
  ta.dispatchEvent(new Event('input'));
}

function moment() {
  const h = new Date().getHours();
  return h >= 22 || h < 6 ? 'cette nuit' : h >= 18 ? 'ce soir' : 'aujourd’hui';
}

function showHelp(box, level, kind = 'self') {
  if (level < state.help || (level === state.help && kind === state.helpKind)) return;
  if (level === 2) { if (state.softShown) return; state.softShown = true; }
  state.help = level; state.helpKind = kind;
  paintHelp(box);
}

function paintHelp(box) {
  if (!state.help) return;
  box.replaceChildren();
  box.hidden = false;
  if (state.help === 2) {
    note('aide : une ligne douce');
    const x = el('button', { type: 'button', className: 'x', textContent: '×' });
    x.setAttribute('aria-label', 'fermer');
    x.addEventListener('click', () => { box.hidden = true; });
    box.append(el('p', {}, `Si c’est trop lourd ${moment()}, des gens répondent au `, el('a', { href: 'tel:3114', textContent: '3114' }), ', à toute heure.'), x);
  } else if (state.helpKind === 'other') {
    note('aide : une ligne qui reste (quelqu’un fait du mal)');
    box.append(el('div', {}, el('p', {}, `Si quelqu’un te fait du mal, le 3919 écoute, à toute heure. En danger immédiat${NB}: le 17, ou le 114 par SMS.`),
      el('div', { className: 'calls' }, el('a', { className: 'call', href: 'tel:3919', textContent: 'Appeler le 3919' }), el('a', { className: 'call', href: 'tel:17', textContent: '17' }), el('a', { className: 'call', href: 'sms:114', textContent: '114 par SMS' }))));
  } else {
    note('aide : une ligne qui reste');
    box.append(el('div', {}, el('p', {}, 'Des gens répondent au 3114, maintenant, à toute heure.'),
      el('div', { className: 'calls' }, el('a', { className: 'call', href: 'tel:3114', textContent: 'Appeler le 3114' }), el('a', { className: 'call', href: 'https://www.sos-amitie.com', target: '_blank', rel: 'noopener', textContent: 'Écrire à SOS Amitié' }))));
  }
}

function assess(text, box) {
  const t = norm(text);
  if (LEX.self.some(k => t.includes(k))) return showHelp(box, 3, 'self');
  if (LEX.other.some(k => t.includes(k))) return showHelp(box, 3, 'other');
  if (LEX.soft.some(k => t.includes(k))) showHelp(box, 2);
}

function renderPage() {
  const ta = el('textarea', { rows: 6, value: state.text, placeholder: state.short ? 'Trois lignes, pas plus.' : 'Écris ce que tu veux. Ou rien.' });
  ta.setAttribute('aria-label', 'Ta page');
  if (state.short) ta.maxLength = 280;
  const count = el('p', { className: 'count', hidden: !state.short });
  const help = el('div', { className: 'help', hidden: true });
  help.setAttribute('role', 'status'); help.setAttribute('aria-live', 'polite');
  ta.addEventListener('input', () => {
    grow(ta); state.text = ta.value;
    if (state.short) count.textContent = `${ta.value.length} / 280`;
    derive(); saveDraft();
    clearTimeout(assessTimer); assessTimer = setTimeout(() => assess(ta.value, help), 600);
  });
  const chips = el('div', { className: 'chips' }, ...starters().map(s => {
    const b = el('button', { type: 'button', className: 'chip', textContent: s.label });
    b.addEventListener('click', () => { insert(ta, s.text); note(`amorce : ${s.label}`); });
    return b;
  }));
  const finish = el('button', { type: 'button', className: 'btn', textContent: 'Terminer' });
  finish.addEventListener('click', finishSheet);
  app.replaceChildren(
    el('p', { className: 'step', textContent: state.short ? 'En trois lignes' : 'La page' }),
    el('h1', { textContent: state.short ? 'Dis-le court.' : 'À toi.' }),
    el('p', { className: 'hint', textContent: 'Rien ne part. Tu peux t’arrêter quand tu veux.' }),
    ta, count, help, chips,
    el('nav', { className: 'nav' }, quiet('retour', () => history.back()), el('span', { className: 'spacer' }), finish),
  );
  requestAnimationFrame(() => { grow(ta); if (state.short) count.textContent = `${ta.value.length} / 280`; });
  const sig = signals();
  if (sig.strong) showHelp(help, 3, sig.other ? 'other' : 'self');
  else if (sig.soft) showHelp(help, 2);
  else paintHelp(help);
  if (state.text) assess(state.text, help);
}

/* ───────── Feuilles ───────── */

let sheetNode = null, lastFocus = null;

function openSheet(body, onClose) {
  closeSheet();
  lastFocus = document.activeElement;
  const back = el('div', { className: 'sheet' });
  const box = el('div', { className: 'sheet-body', tabIndex: -1 }, el('div', { className: 'handle' }), body);
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  back.append(box);
  back.addEventListener('click', e => { if (e.target === back) closeSheet(); });
  document.body.append(back);
  sheetNode = back; sheetNode.onClose = onClose;
  box.focus({ preventScroll: true });
}
function closeSheet() {
  if (!sheetNode) return;
  const cb = sheetNode.onClose;
  sheetNode.remove(); sheetNode = null;
  cb?.();
  lastFocus?.focus?.({ preventScroll: true });
}
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
const footRow = (...btns) => el('p', { className: 'foot-row' }, ...btns);

function humansSheet(first = 'self') {
  note('canal : parler à quelqu’un');
  const body = el('div', {}, el('h2', { textContent: 'Parler à quelqu’un' }), el('p', { className: 'intro', textContent: 'Ici, personne ne lit. Là-bas, quelqu’un répond.' }));
  for (const g of [...HUMANS].sort((a, b) => (a.id === first ? -1 : b.id === first ? 1 : 0))) {
    body.append(el('h3', { textContent: g.title }), el('div', { className: 'list' }, ...g.items.map(([name, href, sub]) => {
      const a = el('a', { className: 'row', href }, name, el('small', { textContent: sub }));
      if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    })));
  }
  body.append(footRow(quiet('revenir', closeSheet)));
  openSheet(body);
}

function finishSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Et maintenant ?' }));
  if (!state.text.trim()) body.append(el('p', { className: 'intro', textContent: 'Juste tes cases, sans texte. Ça suffit.' }));
  const gesture = (t, sub, fn) => {
    const b = el('button', { type: 'button', className: 'gesture' }, t, el('small', { textContent: sub }));
    b.addEventListener('click', () => { closeSheet(); fn(); });
    body.append(b);
  };
  gesture('Garder ici', 'sur ce téléphone, rien ne part', keep);
  gesture('Brûler', 'il n’en restera rien', burn);
  gesture('Envoyer au ciel', 'sans ton nom : une étoile parmi les autres', skySheet);
  body.append(footRow(quiet('pas maintenant', closeSheet), quiet('voir le ciel', () => { closeSheet(); go('sky'); })));
  openSheet(body);
}

function skySheet() {
  const send = el('button', { type: 'button', className: 'gesture', textContent: 'Envoyer' });
  send.addEventListener('click', () => { closeSheet(); pendingSend = true; go('sky'); });
  openSheet(el('div', {},
    el('h2', { textContent: 'Envoyer au ciel' }),
    el('p', { className: 'intro', textContent: 'Elle partira sans ton nom, et sans rien qui permette de te reconnaître. Elle deviendra une étoile parmi les autres. Personne ne lira ce qu’il y a dedans : ce sera une lumière, comptée avec les autres.' }),
    el('p', { className: 'intro', textContent: 'Tu la retrouveras dans le ciel, sur ce téléphone.' }),
    send,
    footRow(quiet('pas maintenant', closeSheet))));
}

function keptList() { try { return JSON.parse(localStorage.getItem('limbesC.kept') || '[]'); } catch { return []; } }
function saveKept(list) { try { localStorage.setItem('limbesC.kept', JSON.stringify(list)); } catch { /* stockage indisponible */ } updateKept(); }
function updateKept() { const n = keptList().length, b = $('#kept'); b.hidden = !n; b.textContent = n === 1 ? '1 gardé' : `${n} gardés`; }
const labelsOf = answers => KEYS.flatMap(k => QUESTIONS[k].items.filter(it => (answers[k] || []).includes(it.id)).map(it => it.label));

function keptSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Ce que tu as gardé' }));
  body.append(el('div', { className: 'list' }, ...keptList().map(k => {
    const excerpt = k.text.trim().replace(/\s+/g, ' ') || `cases${NB}: ${labelsOf(k.answers).join(', ') || 'aucune'}`;
    const open = el('button', { type: 'button', className: 'row' }, excerpt.slice(0, 90) + (excerpt.length > 90 ? '…' : ''),
      el('small', { textContent: new Date(k.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }));
    open.addEventListener('click', () => {
      closeSheet();
      const rest = keptList().filter(x => x.id !== k.id);
      if (state.text.trim() || anyChecked()) rest.unshift(snapshot());
      saveKept(rest);
      state.answers = unpack(k.answers); state.text = k.text;
      derive(); saveDraft();
      go(k.text ? 'page' : 'orient');
    });
    const burnOne = quiet('brûler', () => { saveKept(keptList().filter(x => x.id !== k.id)); closeSheet(); if (keptList().length) keptSheet(); });
    return el('div', { className: 'kept-row' }, open, burnOne);
  })));
  body.append(footRow(quiet('revenir', closeSheet)));
  openSheet(body);
}

/* ───────── Gestes ───────── */

const snapshot = () => ({ id: Date.now(), date: new Date().toISOString(), text: state.text, answers: pack(state.answers), ent: { ...ent } });

function keep() {
  note('geste : garder ici');
  saveKept([snapshot(), ...keptList()]);
  clearDraft();
  renderAfterWith('Gardée ici. Tu peux revenir.');
}

function burn() {
  note('geste : brûler');
  const done = () => { burnAnim = null; clearDraft(); renderAfterWith('Partie.'); };
  if (reduced) return done();
  burnAnim = { start: performance.now() };
  setTimeout(done, 1300);
}

let afterLine = '';
function renderAfterWith(line) { afterLine = line; go('after'); }

function renderAfter() {
  app.replaceChildren(el('div', { className: 'after' },
    el('p', { className: 'big', textContent: afterLine }),
    el('div', { className: 'links' }, quiet('voir le ciel', () => go('sky')), quiet('recommencer', () => { clearDraft(); go('q:situ'); }))));
}

/* ───────── Boucle et départ ───────── */

function frame() {
  const T = now();
  smooth();
  if (!companion.hidden) drawCompanion(T);
  if (sky.canvas && sky.canvas.isConnected && !document.hidden) drawSky(T);
  requestAnimationFrame(frame);
}

addEventListener('resize', () => {
  if (!companion.hidden) [EW, EH] = sizeCanvas(entCanvas, ex);
  if (sky.canvas && sky.canvas.isConnected) [sky.W, sky.H] = sizeCanvas(sky.canvas, sky.ctx);
});

loadDraft();
loadMine();
derive();
Object.assign(cur, { a: ent.a, v: ent.v, w: ent.w, m: ent.m ? 1 : 0, r: ent.r ? 1 : 0, p: ent.p ? 1 : 0, t: ent.t ? 1 : 0 });
updateKept();
$('#kept').addEventListener('click', keptSheet);
$('#humans').addEventListener('click', () => humansSheet());
$('#exit').addEventListener('click', e => { e.preventDefault(); location.replace(e.currentTarget.href); });
addEventListener('popstate', e => render(e.state?.screen || 'q:situ'));
history.replaceState({ screen: 'q:situ' }, '', '');
render('q:situ');
requestAnimationFrame(frame);
window.limbesC = { ent, cur, sky }; // pour les tests
