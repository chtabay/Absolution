// Limbes — maquette D : les cases, les graines, l’île, l’archipel.
// Tout reste sur cet appareil ; rien ne part. Les îles des autres sont inventées.
// L’île ne lit jamais le texte : elle pousse d’après les cases.

import { SUBJECTS, QUESTIONS, KEYS, BASE, LEX, HUMANS, MOCK } from './contenu.js';
import { graines, quadDe, nomDe, phrasesDe, casesDe, sujetLabel, listeDe, listeGraines, FAMILLES, ESPECES, NOMS } from './grammaire.js';
import { nouvelleIle, deriver, resume, dessinerIle, dessinerGraines, archipelInvente, ileInventee, vignette } from './ile.js';

const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = '\u202f'; // espace fine insécable
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const jour = iso => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const mois = iso => new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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
const store = {
  get(k, def) { try { return JSON.parse(localStorage.getItem(`limbesD.${k}`) || 'null') ?? def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem(`limbesD.${k}`, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  del(k) { try { localStorage.removeItem(`limbesD.${k}`); } catch { /* rien à effacer */ } },
};

function saveDraft() { store.set('draft', { answers: pack(state.answers), text: state.text, short: state.short }); }
function loadDraft() {
  const d = store.get('draft', null);
  if (!d) return;
  state.answers = unpack(d.answers); state.text = d.text || ''; state.short = !!d.short;
}
function clearDraft() {
  state.answers = emptyAnswers(); state.text = ''; state.path = null;
  store.del('draft');
  derive();
}

/* ───────── L’île, et celles d’avant ───────── */

let ile = store.get('ile', null) || nouvelleIle(); // celle qui pousse
let iles = store.get('iles', []); // celles d’avant, gardées ici
const saveIle = () => store.set('ile', ile);
const saveIles = () => store.set('iles', iles);
const vie = new Map(); // clé → instant d’apparition, pour le petit rebond
let courant = deriver(ile); // ce que l’île montre
let regard = null; // une île d’avant qu’on regarde, sinon null
const t0 = performance.now();
const now = () => (performance.now() - t0) / 1000;

/* ───────── Les graines, en compagnie ───────── */

const companion = $('#companion'), entCanvas = $('#ent'), ex = entCanvas.getContext('2d');
let EW = 0, EH = 0, preview = [], burnAnim = null;

function derive() { // ce que la confession en cours ferait pousser ; jamais le texte, sauf sa présence
  const before = new Set(preview.map(a => a.key));
  preview = anyChecked() || state.text.trim() ? graines(state.answers, state.text.trim()).graines : [];
  for (const a of preview) if (!before.has(a.key)) vie.set(a.key, now());
}

function sizeCanvas(c, ctx) {
  const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [Math.round(r.width), Math.round(r.height)];
}

function drawCompanion(T) {
  if (burnAnim) { // brûler : les graines s’envolent
    const p = Math.min(1, (performance.now() - burnAnim.start) / 1300);
    ex.clearRect(0, 0, EW, EH);
    ex.save(); ex.globalAlpha = 1 - p; ex.translate(0, -p * 30);
    dessinerGraines(ex, EW, EH, preview, T, vie);
    ex.restore();
    return;
  }
  dessinerGraines(ex, EW, EH, preview, T, vie);
}

/* ───────── L’île, à l’écran ───────── */

const scene = { canvas: null, ctx: null, W: 0, H: 0, rot: 0, hits: [], sel: null };
let titre = null; // ce qui vient de pousser, pour le titre de l’écran

function renderIle() {
  const d = regard ? deriver(regard) : courant, mine = !regard;
  const wrap = el('div', { className: 'ilewrap' }), c = el('canvas');
  c.setAttribute('aria-label', mine ? 'Ton île, et ce qui y a poussé' : 'Une de tes îles d’avant');
  wrap.append(c);
  const caption = el('p', { className: 'ile-caption', id: 'ile-caption', textContent: d.assets.length ? 'Touche ce qui a poussé.' : 'Rien n’a encore poussé. Ça viendra avec ta première confession.' });
  const excerpt = el('p', { className: 'excerpt', id: 'ile-excerpt', hidden: true });
  const line = el('p', { className: 'ile-line', id: 'ile-line' });
  const nav = el('nav', { className: 'nav wrap' });
  const tourner = quiet('tourner', () => { scene.rot = (scene.rot + 1) % 4; note('geste : tourner l’île'); });
  if (mine) {
    nav.append(quiet('l’archipel', () => go('archipel')), tourner);
    if (ile.depots.length) nav.append(quiet('changer d’île', changerSheet));
    if (iles.length) nav.append(quiet('tes îles d’avant', ilesSheet));
    nav.append(el('span', { className: 'spacer' }), quiet('recommencer', () => { clearDraft(); go('q:situ'); }));
  } else nav.append(tourner, el('span', { className: 'spacer' }), quiet('revenir à ton île', () => { regard = null; go('ile'); }));
  const pousses = el('ul', {}, ...(d.assets.length ? d.assets.map(a => el('li', { textContent: ligneDe(a, d) })) : [el('li', { textContent: 'rien encore' })]));
  const what = titre && mine ? titre : null;
  app.replaceChildren(
    el('p', { className: 'step', textContent: mine ? (what ? 'Ton île' : 'Ton île, aujourd’hui') : `Une île d’avant · ${mois(regard.nee)}` }),
    el('h1', { textContent: what ? what.h1 : mine ? 'Ton île' : 'Elle ne pousse plus' }),
    el('p', { className: 'hint', textContent: what ? what.line : mine ? 'Elle pousse avec ce que tu déposes. Rien ne quitte ce téléphone.' : 'Elle reste ici, telle que tu l’as laissée.' }),
    wrap, caption, excerpt, line,
    nav,
    el('details', {}, el('summary', { textContent: 'Ce qui a poussé' }), pousses),
    el('details', {}, el('summary', { textContent: 'Comment ça pousse' }), legende()),
    el('details', {}, el('summary', { textContent: 'Ce qui serait compté' }), el('ul', {}, ...(trace.length ? trace : ['rien']).map(t => el('li', { textContent: t })))),
    el('p', { className: 'tiny', textContent: 'Maquette : ton île reste sur ce téléphone, sans chiffrement. L’archipel des autres est inventé.' }),
  );
  titre = null;
  scene.canvas = c; scene.ctx = c.getContext('2d'); scene.sel = null; scene.d = d;
  [scene.W, scene.H] = sizeCanvas(c, scene.ctx);
  c.addEventListener('pointerdown', e => {
    const r = c.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const h of scene.hits) { const dd = Math.hypot(h.X - px, h.Y - py); if (dd < h.r && dd < bd) { bd = dd; best = h; } }
    scene.sel = best?.key ?? null;
    excerpt.hidden = true;
    if (!best) { caption.textContent = d.assets.length ? 'Touche ce qui a poussé.' : ''; return; }
    if (best.key === 'phare') { caption.replaceChildren('Un phare. Si tu veux parler à quelqu’un, c’est là. ', quiet('parler à quelqu’un', () => humansSheet(signals().other ? 'other' : 'self'))); return; }
    const a = d.assets.find(x => x.key === best.key);
    caption.textContent = ligneDe(a, d);
    const texte = (d.ile.depots.filter(x => a.depots.includes(x.id) && x.contenu).pop() || {}).contenu;
    if (texte) { excerpt.textContent = `« ${texte.trim().replace(/\s+/g, ' ').slice(0, 140)}${texte.trim().length > 140 ? '…' : ''} »`; excerpt.hidden = false; }
  });
  updateIleLine();
}

function ligneDe(a, d) {
  const deps = d.ile.depots.filter(x => a.depots.includes(x.id));
  const first = deps[0], cases = first ? casesDe(unpack(first.answers)) : [];
  const quoi = `${cap(nomDe(a))} · ${FAMILLES[a.famille].de}${a.sujet ? `${NB}: ${sujetLabel(a.sujet)}` : ''}`;
  const quand = first?.date ? (deps.length > 1 ? `Depuis le ${jour(first.date)}, redit ${deps.length - 1 === 1 ? 'une fois' : `${deps.length - 1} fois`}.` : `Le ${jour(first.date)}.`) : '';
  return `${quoi}. ${cases.length ? `${cap(cases.join(', '))}. ` : ''}${quand}`.trim();
}

function updateIleLine() {
  const line = $('#ile-line');
  if (!line) return;
  const d = scene.d || courant, n = d.assets.length, k = d.ile.depots.length;
  line.textContent = n ? `${n} chose${n > 1 ? 's' : ''} · ${k} dépôt${k > 1 ? 's' : ''}${d.ile.nee ? ` · depuis le ${jour(d.ile.nee)}` : ''}${d.ile.envoyee ? ' · dans l’archipel' : ''}` : `Rien encore${d.ile.nee ? ` · île commencée le ${jour(d.ile.nee)}` : ''}`;
}

function legende() {
  const Q = { AD: 'agité et douloureux', ED: 'éteint et douloureux', AS: 'agité et supportable', ES: 'éteint et supportable' };
  const ul = el('ul', { className: 'legende' });
  ul.append(el('li', {}, el('b', { textContent: 'D’où ça vient, la famille. ' }), ...Object.values(FAMILLES).map(f => `${f.de} → ${f.nom}, ${f.zone}. `)));
  ul.append(el('li', {}, el('b', { textContent: 'Comment c’est ressenti, l’espèce. ' }), ...Object.entries(Q).map(([q, t]) => `${cap(t)}${NB}: ${Object.keys(ESPECES).map(f => NOMS[ESPECES[f][q]][0].replace(/^(un|une|des) /, '')).join(', ')}. `)));
  ul.append(el('li', {}, el('b', { textContent: 'Depuis quand, la taille. ' }), 'Récent, c’est petit ; depuis longtemps, c’est grand. Un sujet redit fait grandir la même chose, jamais une deuxième. Un arbre nu peut se couvrir de feuilles.'));
  ul.append(el('li', {}, el('b', { textContent: 'Qui le sait, l’état. ' }), 'Jamais dit, c’est fermé. Un texte, c’est une lueur, jamais son contenu. En boucle, un sentier usé. Plus d’une fois, en deux. Ça continue, il pleut dessus. Regret, la mousse reprend la pierre. Jamais réparé, elle est fendue. Un danger, c’est un phare, pour parler à quelqu’un.'));
  ul.append(el('li', {}, el('b', { textContent: 'Le temps qu’il fait. ' }), 'Le ciel de l’île suit ta dernière confession. Une sensation sans sujet laisse un nuage, des fleurs, un étang ; rien du tout, un caillou posé.'));
  return ul;
}

/* ───────── L’archipel ───────── */

const arch = { canvas: null, ctx: null, W: 0, H: 0, autres: [], blooms: [], arrivals: 0, next: 0, sel: null };
const posArch = (a, v) => [arch.W * (.1 + .8 * v), arch.H * (.16 + .76 * (1 - a))];
const miennes = () => [...iles.filter(x => x.envoyee), ...(ile.envoyee ? [ile] : [])];

function arriver(T) { // une île de quelqu’un d’autre (inventée)
  const r = Math.random(), q = r < .27 ? 'AD' : r < .68 ? 'ED' : r < .82 ? 'AS' : 'ES';
  const a = (q[0] === 'A' ? .5 : 0) + Math.random() * .5, v = (q[1] === 'S' ? .5 : 0) + Math.random() * .5;
  arch.autres.push({ ile: ileInventee(5000 + Math.floor(Math.random() * 1e6), q), a, v, ph: Math.random() * 6.28, born: T });
  arch.blooms.push({ a, v, born: T });
  arch.arrivals++;
  arch.next = T + 4 + Math.random() * 5;
  updateArchLine();
}
function drawArchipel(T) {
  const x = arch.ctx, W = arch.W, H = arch.H;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#cfeafa'); g.addColorStop(.13, '#8fd0f0'); g.addColorStop(.14, '#5fc2df'); g.addColorStop(1, '#2c8fb0');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.22)'; x.font = '700 9px Nunito, sans-serif'; x.textAlign = 'center';
  x.fillText('AGITÉ', W / 2, H * .14 + 11); x.fillText('ÉTEINT', W / 2, H - 5);
  x.save(); x.translate(8, H * .57); x.rotate(-Math.PI / 2); x.fillText('DOULOUREUX', 0, 3); x.restore();
  x.save(); x.translate(W - 8, H * .57); x.rotate(Math.PI / 2); x.fillText('SUPPORTABLE', 0, 3); x.restore();
  for (let k = 0; k < 26; k++) { // des vaguelettes
    const px = ((k * 137) % W) + Math.sin(T * .5 + k) * 6, py = H * .16 + ((k * 61) % Math.round(H * .82));
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - 6, py); x.quadraticCurveTo(px, py - 2.5, px + 6, py); x.stroke();
  }
  if (T > arch.next && !reduced) arriver(T);
  const items = [];
  for (const o of arch.autres) items.push({ ...o, mine: false });
  for (const m of miennes()) { const d = deriver(m), r = resume(d); items.push({ ile: m, d, a: r.a, v: r.v, ph: 0, born: -10, mine: true }); }
  items.sort((p, q) => posArch(p.a, p.v)[1] - posArch(q.a, q.v)[1]);
  arch.hits = [];
  for (const it of items) {
    const [X0, Y] = posArch(it.a, it.v), X = X0 + Math.sin(T * .12 + it.ph) * 3, depth = .55 + .5 * (Y / H), size = (it.mine ? 84 : 66) * depth;
    const ramp = Math.min(1, (T - it.born) / 1.5), d = it.d || deriver(it.ile);
    if (it.mine) { x.strokeStyle = `rgba(255,255,255,${arch.sel === it.ile.id ? .95 : .55})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(X, Y + size * .32, size * .6, size * .22, 0, 0, Math.PI * 2); x.stroke(); }
    x.globalAlpha = ramp;
    const v = vignette(it.ile, d, 96);
    x.drawImage(v, X - size / 2, Y - size * .5 + Math.sin(T * .7 + it.ph) * 1.5, size, size * .9);
    x.globalAlpha = 1;
    arch.hits.push({ it, X, Y, r: size * .5 });
  }
  arch.blooms = arch.blooms.filter(b => T - b.born < 1.8);
  for (const b of arch.blooms) { const [X, Y] = posArch(b.a, b.v), age = T - b.born; x.strokeStyle = `rgba(255,255,255,${(1 - age / 1.8) * .8})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(X, Y + 8, 6 + age * 30, (6 + age * 30) * .45, 0, 0, Math.PI * 2); x.stroke(); }
}

function updateArchLine() {
  const line = $('#arch-line');
  if (!line) return;
  const n = miennes().length;
  line.textContent = `Ce mois-ci${NB}: ${(MOCK.total + n).toLocaleString('fr-FR')} îles · arrivées depuis que tu regardes${NB}: ${arch.arrivals} · les tiennes${NB}: ${n}`;
}

function renderArchipel() {
  const wrap = el('div', { className: 'ilewrap mer' }), c = el('canvas');
  c.setAttribute('aria-label', 'L’archipel : les îles des autres, et les tiennes');
  wrap.append(c);
  const caption = el('p', { className: 'ile-caption', id: 'arch-caption', textContent: 'Touche une île.' });
  const nav = el('nav', { className: 'nav wrap' }, quiet('retour', () => history.back()));
  if (!ile.envoyee && ile.depots.length) nav.append(quiet('y mettre ton île', envoyerSheet));
  nav.append(el('span', { className: 'spacer' }), quiet('ton île', () => { regard = null; go('ile'); }));
  app.replaceChildren(
    el('p', { className: 'step', textContent: 'L’archipel' }),
    el('h1', { textContent: 'L’archipel, ce soir' }),
    el('p', { className: 'hint', textContent: 'Les îles des autres arrivent au fil de l’eau, placées par sensation. Personne ne lit rien : ce sont des formes.' }),
    wrap, caption, el('p', { className: 'ile-line', id: 'arch-line' }),
    nav,
    el('p', { className: 'tiny', textContent: 'Les îles des autres sont inventées pour la maquette. Les tiennes restent sur ce téléphone.' }),
  );
  arch.canvas = c; arch.ctx = c.getContext('2d'); arch.sel = null;
  [arch.W, arch.H] = sizeCanvas(c, arch.ctx);
  if (!arch.autres.length) arch.autres = archipelInvente(40);
  arch.blooms = []; arch.arrivals = 0; arch.next = now() + 3;
  c.addEventListener('pointerdown', e => {
    const r = c.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const h of arch.hits || []) { const dd = Math.hypot(h.X - px, h.Y - py); if (dd < h.r + 8 && dd < bd) { bd = dd; best = h; } }
    if (!best) { arch.sel = null; caption.textContent = 'Touche une île.'; return; }
    const it = best.it, d = it.d || deriver(it.ile), rs = resume(d);
    arch.sel = it.mine ? it.ile.id : null;
    caption.textContent = it.mine ? `La tienne${it.ile === ile ? ', celle d’aujourd’hui' : `, celle de ${mois(it.ile.nee)}`}${NB}: ${listeDe(rs.comptes)}.` : `Une île avec ${listeDe(rs.comptes)}${rs.phare ? ', et un phare' : ''}. ${it.born > 0 ? 'Arrivée à l’instant.' : 'Là depuis un moment.'}`;
  });
  updateArchLine();
}

/* ───────── Navigation ───────── */

const quiet = (text, fn) => { const b = el('button', { type: 'button', className: 'quiet', textContent: text }); b.addEventListener('click', fn); return b; };

function go(screen) { history.pushState({ screen }, '', ''); render(screen); }

function render(screen) {
  document.body.classList.toggle('short', state.short && screen === 'page');
  companion.hidden = ['after', 'ile', 'archipel'].includes(screen);
  if (!companion.hidden) [EW, EH] = sizeCanvas(entCanvas, ex);
  scene.canvas = null; arch.canvas = null;
  if (screen === 'orient') renderOrient();
  else if (screen === 'page') renderPage();
  else if (screen === 'after') renderAfter();
  else if (screen === 'ile') renderIle();
  else if (screen === 'archipel') renderArchipel();
  else renderQ(QUESTIONS[screen.slice(2)] ? screen.slice(2) : 'situ');
  scrollTo(0, 0);
  const h = app.querySelector('h1, .big');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  updateIleBtn();
}

function updateIleBtn() {
  const b = $('#ile-btn'), n = courant.assets.length;
  b.hidden = !(n || iles.length);
  b.textContent = n ? `ton île · ${n}` : 'ton île';
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

const pousseraient = () => (preview.length ? `Ça ferait pousser ${listeGraines(preview)}.` : 'Rien coché : ça poserait un caillou.');

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
  if (poser) path('Juste le poser', 'sans écrire : sur l’île, ou au feu', finishSheet);
  path('Écrire', starters().length ? 'avec des débuts de phrases tirés de tes cases' : 'la page est à toi', () => { state.short = false; go('page'); });
  path('Le dire en trois lignes', 'court, et c’est tout', () => { state.short = true; go('page'); });
  if (!poser) path('Juste le poser', 'sans écrire : sur l’île, ou au feu', finishSheet);
  if (!sig.strong && sig.soft) path('Parler à quelqu’un', 'des humains, ailleurs, à toute heure', humans);
  path('Voir ton île', courant.assets.length ? 'ce qui a poussé, et l’archipel' : 'elle est vide, pour l’instant', () => { regard = null; go('ile'); });
  const seq = sequence();
  app.replaceChildren(
    el('p', { className: 'step', textContent: 'D’après tes cases' }),
    el('h1', { textContent: 'Par où aller ?' }),
    recap,
    el('p', { className: 'hint', textContent: total ? `${pousseraient()} Tu choisis. Tu pourras revenir.` : '' }),
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
    el('p', { className: 'hint', textContent: 'Rien ne part. Le texte ne fait qu’une lueur sur l’île, jamais plus.' }),
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
const checkRow = (label, checked = true) => { const input = el('input', { type: 'checkbox', checked }); return [el('label', { className: 'check' }, input, el('span', { textContent: label })), input]; };

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
  const seeds = graines(state.answers, state.text.trim()).graines;
  body.append(el('p', { className: 'intro', textContent: `${state.text.trim() ? '' : 'Juste tes cases, sans texte. Ça suffit. '}Sur l’île, ça ferait pousser ${listeGraines(seeds)}.` }));
  const [row, keepText] = checkRow('Garder aussi le texte, sur ce téléphone', true);
  const gesture = (t, sub, fn) => {
    const b = el('button', { type: 'button', className: 'gesture' }, t, el('small', { textContent: sub }));
    b.addEventListener('click', () => { closeSheet(); fn(); });
    body.append(b);
  };
  gesture('Poser sur l’île', 'ça restera sur ce téléphone, et ça poussera', () => poser(keepText.checked));
  if (state.text.trim()) body.append(row);
  gesture('Brûler', 'il n’en restera rien, rien ne pousse', burn);
  body.append(footRow(quiet('pas maintenant', closeSheet), quiet('voir l’île', () => { closeSheet(); regard = null; go('ile'); })));
  openSheet(body);
}

function changerSheet() {
  const rs = resume(courant);
  const [row, send] = checkRow('L’ajouter à l’archipel, sans ton nom', !ile.envoyee);
  const body = el('div', {},
    el('h2', { textContent: 'Changer d’île' }),
    el('p', { className: 'intro', textContent: `Celle-ci restera sur ce téléphone, telle qu’elle est${NB}: ${listeDe(rs.comptes)}. Une île vide t’attend.` }));
  if (ile.envoyee) body.append(el('p', { className: 'intro', textContent: 'Elle est déjà dans l’archipel, et y restera.' }));
  else body.append(row, el('p', { className: 'tiny', textContent: `Les autres verraient une île avec ${listeDe(rs.comptes)}${rs.phare ? ', et un phare' : ''}. Rien d’autre${NB}: ni texte, ni date, ni case.` }));
  const b = el('button', { type: 'button', className: 'gesture', textContent: 'Commencer une nouvelle île' });
  b.addEventListener('click', () => {
    closeSheet();
    if (!ile.envoyee && send.checked) { ile.envoyee = true; note(`île : ajoutée à l’archipel (${listeDe(rs.comptes)})`); }
    ile.quittee = new Date().toISOString();
    iles = [...iles, ile]; saveIles();
    ile = nouvelleIle(); saveIle();
    courant = deriver(ile); scene.rot = 0; vie.clear();
    note('geste : changer d’île');
    titre = { h1: 'Une île vide', line: 'Elle poussera avec ce que tu déposeras. Celle d’avant reste ici.' };
    go('ile');
  });
  body.append(b, footRow(quiet('pas maintenant', closeSheet)));
  openSheet(body);
}

function envoyerSheet() {
  const rs = resume(courant);
  const b = el('button', { type: 'button', className: 'gesture', textContent: 'Y mettre ton île' });
  b.addEventListener('click', () => {
    closeSheet();
    ile.envoyee = true; saveIle();
    note(`île : ajoutée à l’archipel (${listeDe(rs.comptes)})`);
    arch.blooms.push({ a: rs.a, v: rs.v, born: now() });
    updateArchLine();
    const cap = $('#arch-caption'); if (cap) cap.textContent = 'Elle est là, parmi les autres. Elle y grandira avec toi.';
    app.querySelectorAll('.nav .quiet').forEach(q => { if (q.textContent === 'y mettre ton île') q.remove(); });
  });
  openSheet(el('div', {},
    el('h2', { textContent: 'Y mettre ton île' }),
    el('p', { className: 'intro', textContent: `Elle partira sans ton nom, et sans rien qui permette de te reconnaître. Les autres verraient une île avec ${listeDe(rs.comptes)}${rs.phare ? ', et un phare' : ''}. Rien d’autre${NB}: ni texte, ni date, ni case.` }),
    el('p', { className: 'intro', textContent: 'Elle continuera de pousser ici, et là-bas avec elle.' }),
    b, footRow(quiet('pas maintenant', closeSheet))));
}

function ilesSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Tes îles d’avant' }), el('p', { className: 'intro', textContent: 'Elles restent ici. Elles ne poussent plus.' }));
  body.append(el('div', { className: 'list' }, ...[...iles].reverse().map(x => {
    const d = deriver(x), rs = resume(d);
    const open = el('button', { type: 'button', className: 'row' }, `L’île de ${mois(x.nee)}`, el('small', { textContent: `${listeDe(rs.comptes)}${x.envoyee ? ' · dans l’archipel' : ''}` }));
    open.addEventListener('click', () => { closeSheet(); regard = x; scene.rot = 0; go('ile'); });
    return open;
  })));
  body.append(footRow(quiet('revenir', closeSheet)));
  openSheet(body);
}

/* ───────── Gestes ───────── */

function poser(garderTexte) {
  const texte = state.text.trim();
  const depot = { id: Date.now(), date: new Date().toISOString(), quad: quadDe(state.answers), texte: !!texte, answers: pack(state.answers) };
  if (texte && garderTexte) depot.contenu = texte;
  ile.depots.push(depot); saveIle();
  const d = deriver(ile);
  courant = d;
  const { nouvelles, grandies } = d.dernier;
  const T = now();
  for (const a of [...nouvelles, ...grandies]) vie.set(a.key, T);
  if (d.phare === depot.id) vie.set('phare', T);
  note(`geste : poser sur l’île (${[...nouvelles, ...grandies].map(nomDe).join(', ')})`);
  const phrases = phrasesDe(nouvelles, grandies);
  const n = nouvelles.length + grandies.length, NOMBRES = ['', '', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit'];
  const verbe = !nouvelles.length ? 'grandi' : !grandies.length ? 'poussé' : 'bougé';
  titre = { h1: n === 1 ? `Quelque chose a ${verbe}` : `${NOMBRES[n] || n} choses ont ${verbe}`, line: phrases.join(' ') + (d.phare === depot.id ? ' Un phare s’est allumé sur la rive.' : '') };
  clearDraft();
  regard = null;
  go('ile');
}

function burn() {
  note('geste : brûler');
  const done = () => { burnAnim = null; clearDraft(); afterLine = 'Partie.'; go('after'); };
  if (reduced || companion.hidden) return done();
  burnAnim = { start: performance.now() };
  setTimeout(done, 1300);
}

let afterLine = '';
function renderAfter() {
  app.replaceChildren(el('div', { className: 'after' },
    el('p', { className: 'big', textContent: afterLine }),
    el('div', { className: 'links' }, quiet('voir ton île', () => { regard = null; go('ile'); }), quiet('recommencer', () => { clearDraft(); go('q:situ'); }))));
}

/* ───────── Boucle et départ ───────── */

function frame() {
  const T = now();
  if (!companion.hidden) drawCompanion(T);
  if (scene.canvas && scene.canvas.isConnected && !document.hidden) scene.hits = dessinerIle(scene.ctx, scene.W, scene.H, scene.d, { rot: scene.rot, vie, sel: scene.sel, hits: scene.hits }, T);
  if (arch.canvas && arch.canvas.isConnected && !document.hidden) drawArchipel(T);
  requestAnimationFrame(frame);
}

addEventListener('resize', () => {
  if (!companion.hidden) [EW, EH] = sizeCanvas(entCanvas, ex);
  if (scene.canvas && scene.canvas.isConnected) [scene.W, scene.H] = sizeCanvas(scene.canvas, scene.ctx);
  if (arch.canvas && arch.canvas.isConnected) [arch.W, arch.H] = sizeCanvas(arch.canvas, arch.ctx);
});

loadDraft();
derive();
$('#ile-btn').addEventListener('click', () => { regard = null; go('ile'); });
$('#humans').addEventListener('click', () => humansSheet());
$('#exit').addEventListener('click', e => { e.preventDefault(); location.replace(e.currentTarget.href); });
addEventListener('popstate', e => render(e.state?.screen || 'q:situ'));
history.replaceState({ screen: 'q:situ' }, '', '');
render('q:situ');
requestAnimationFrame(frame);
window.limbesD = { state, get ile() { return ile; }, get iles() { return iles; }, get courant() { return courant; }, get preview() { return preview; }, scene, arch, vie }; // pour les tests
