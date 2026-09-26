// Limbes — maquette B : trois questions à cocher, puis on voit.
// Tout reste sur cet appareil ; rien ne part. Les chiffres de « où tu es » sont inventés.
// Les cases réordonnent la suite, n’enlèvent rien, et peuvent ouvrir une question de plus.

const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = '\u202f'; // espace fine insécable

/* ───────── Contenu ───────── */

// Sujets, avec leurs poids invisibles : moral, relationnel, projet.
const SUBJECTS = [
  ['j’ai fait du mal à quelqu’un', 3, 2, 0], ['j’ai menti, je cache quelque chose', 2, 2, 1], ['infidélité, désir pour un autre', 2, 3, 0],
  ['sexualité', 1, 1, 0], ['couple qui va mal', 0, 3, 0], ['famille', 0, 3, 0], ['argent, dettes', 1, 1, 2], ['travail, études', 1, 1, 3],
  ['alcool, drogue, addiction', 2, 1, 2], ['santé mentale', 0, 1, 2], ['corps, apparence', 0, 0, 1], ['ce qu’on m’a fait', 0, 2, 0],
  ['deuil, perte', 0, 2, 0], ['ce que je suis, ce que je crois', 0, 1, 2], ['un rêve, une envie', 0, 0, 3],
];
const MORAL = ['s0', 's1', 's2', 's8', 's3', 's6', 's7']; // du plus au moins moral

// Les questions. Chaque case peut porter une amorce pour la page, ou un signal pour l’aide.
// `boost` réordonne les cases d’après ce qui est déjà coché ; `when` ouvre une question de plus.
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
  sujets: { key: 'Ça parle de', title: 'De quoi ça parle ?', hint: 'Un sujet, plusieurs, ou aucun.', items: SUBJECTS.map(([t], i) => ({ id: `s${i}`, label: t, subject: t })), boost: a => {
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
const QUADRANTS = { AD: 'agité et douloureux', AS: 'agité et supportable', ED: 'éteint et douloureux', ES: 'éteint et supportable' };

// Détection locale sur la page, sans accents. Rien ne part ; l’appli ne dit jamais ce qu’elle a repéré.
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

// Chiffres inventés pour la maquette.
const MOCK = {
  total: 1214,
  quad: { AD: 27, ED: 41, AS: 14, ES: 18 },
  sentences: {
    boucle: 'Une personne sur trois a coché « ça tourne en boucle », comme toi.',
    longtemps: 'Une personne sur deux porte ça depuis longtemps, comme toi.',
    personne: 'Pour une personne sur quatre, personne ne le sait. Comme toi.',
    jamais: 'Deux personnes sur cinq n’ont jamais dit ce qu’elles déposent ici.',
    frep: 'Une personne sur deux n’a jamais réparé, comme toi.',
    fsait: 'Trois fois sur quatre, la personne ne le sait pas.',
    fpense: 'Presque tout le monde y pense encore.',
    sparle: 'Deux personnes sur trois n’en ont jamais parlé, comme toi.',
    scont: 'Pour une personne sur cinq, ça continue.',
    sresp: 'Une personne sur deux se sent responsable, comme toi.',
  },
  pairs: {
    'famille|argent, dettes': 'Une personne sur quatre qui coche famille coche aussi argent.',
    'travail, études|santé mentale': 'Travail et santé mentale arrivent ensemble une fois sur trois.',
    'couple qui va mal|infidélité, désir pour un autre': 'Couple qui va mal et désir pour un autre vont ensemble une fois sur deux.',
    'j’ai menti, je cache quelque chose|couple qui va mal': 'Un mensonge sur deux concerne le couple.',
    'alcool, drogue, addiction|santé mentale': 'Addiction et santé mentale arrivent ensemble une fois sur deux.',
    'corps, apparence|sexualité': 'Le corps et la sexualité vont souvent ensemble.',
    'deuil, perte|famille': 'Un deuil sur deux est un deuil de famille.',
    'j’ai fait du mal à quelqu’un|j’ai menti, je cache quelque chose': 'Faire du mal et le cacher vont ensemble deux fois sur trois.',
  },
  alone: 'Une personne sur cinq a coché la même chose ce mois-ci.',
};

/* ───────── État ───────── */

const emptyAnswers = () => Object.fromEntries(KEYS.map(k => [k, new Set()]));
const state = { answers: emptyAnswers(), deposited: null, text: '', short: false, help: 0, helpKind: '', softShown: false, path: null, gesture: null };
const trace = []; // ce qui serait compté (jamais le texte)
const note = s => trace.push(s);
const app = $('#app');
const checkedIn = (answers, k) => QUESTIONS[k].items.filter(it => answers[k].has(it.id));
const checked = k => checkedIn(state.answers, k);
const has = (k, id) => state.answers[k].has(id);
const anyChecked = answers => KEYS.some(k => answers[k].size);
const pack = answers => Object.fromEntries(KEYS.map(k => [k, [...answers[k]]]));
const unpack = obj => Object.fromEntries(KEYS.map(k => [k, new Set(obj?.[k] || [])]));
const sequence = () => [...BASE, ...KEYS.filter(k => QUESTIONS[k].extra && QUESTIONS[k].when(state.answers))];

// Ce que les cases disent déjà de l’aide : fort (des humains en premier), doux (une ligne), et de quel côté.
const signals = () => {
  const items = KEYS.flatMap(k => checked(k));
  return { strong: items.some(it => it.strong), soft: items.some(it => it.soft), other: has('situ', 'mal') || has('sujets', 's11') || state.answers.subi.size > 0 };
};

function saveDraft() {
  try { localStorage.setItem('limbesB.draft', JSON.stringify({ answers: pack(state.answers), text: state.text, short: state.short })); } catch { /* stockage indisponible */ }
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem('limbesB.draft') || 'null');
    if (!d || Array.isArray(d.answers)) return; // un brouillon d’une version précédente : on repart
    state.answers = unpack(d.answers);
    state.text = d.text || '';
    state.short = !!d.short;
  } catch { /* pas de brouillon */ }
}
function clearDraft() {
  state.deposited = state.answers; // pour « où tu es » juste après un geste
  state.answers = emptyAnswers();
  state.text = '';
  state.path = null;
  try { localStorage.removeItem('limbesB.draft'); } catch { /* rien à effacer */ }
}

/* ───────── Navigation ───────── */

const quiet = (text, fn) => { const b = el('button', { type: 'button', className: 'quiet', textContent: text }); b.addEventListener('click', fn); return b; };

function go(screen) {
  history.pushState({ screen }, '', '');
  render(screen);
}

function render(screen) {
  document.body.classList.toggle('short', state.short && screen === 'page');
  if (screen === 'orient') renderOrient();
  else if (screen === 'page') renderPage();
  else if (screen === 'after') renderAfter();
  else if (screen === 'where') renderWhere();
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
  const dots = el('div', { className: 'dots' });
  const step = el('p', { className: 'step' });
  const next = el('button', { type: 'button', className: 'btn' });
  const nav = el('nav', { className: 'nav' });
  const refresh = () => { // la suite peut s’allonger pendant qu’on coche
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
      saveDraft();
      refresh();
    });
    const opt = el('label', { className: 'opt' }, input, el('span', { textContent: it.label }));
    if (scores[it.id]) { const m = el('i', { className: 'mark' }); m.setAttribute('title', 'd’après tes cases'); opt.append(m); }
    return opt;
  }));
  refresh();
  app.replaceChildren(dots, step, el('h1', { textContent: q.title }),
    el('p', { className: 'hint', textContent: boosted ? 'Les premières viennent de tes cases. Tout le reste est là aussi.' : q.hint }),
    list, nav);
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
  const sig = signals(), poser = has('situ', 'poser'), total = anyChecked(state.answers);
  const recap = el('div', { className: 'recap' });
  if (!total) recap.append(el('p', { className: 'hint', textContent: 'Tu n’as rien coché. C’est très bien aussi. Voilà par où on peut aller.' }));
  else {
    for (const k of KEYS) {
      const c = checked(k);
      if (!c.length) continue;
      recap.append(el('p', { className: 'recap-row' }, el('span', { className: 'k', textContent: `${QUESTIONS[k].key}${NB}:` }), ...c.map(it => {
        const b = el('button', { type: 'button', className: 'tag', textContent: it.label });
        b.addEventListener('click', () => go(`q:${k}`));
        return b;
      })));
    }
  }
  const paths = el('div', { className: 'paths' });
  const path = (title, sub, fn, cls = '') => {
    const b = el('button', { type: 'button', className: `path ${cls}`.trim() }, el('b', { textContent: title }), el('small', { textContent: sub }));
    b.addEventListener('click', () => { state.path = title; note(`chemin : ${title}`); fn(); });
    paths.append(b);
  };
  const humans = () => humansSheet(sig.other ? 'other' : 'self');
  if (sig.strong) path('Parler à quelqu’un, maintenant', 'des humains, à toute heure', humans, 'first');
  if (poser) path('Juste le poser', 'sans écrire : garder, brûler ou transmettre tes cases', finishSheet);
  path('Écrire', starters().length ? 'avec des débuts de phrases tirés de tes cases' : 'la page est à toi', () => { state.short = false; go('page'); });
  path('Le dire en trois lignes', 'court, et c’est tout', () => { state.short = true; go('page'); });
  if (!poser) path('Juste le poser', 'sans écrire : garder, brûler ou transmettre tes cases', finishSheet);
  if (!sig.strong && sig.soft) path('Parler à quelqu’un', 'des humains, ailleurs, à toute heure', humans);
  path('Voir où tu es parmi les autres', 'avec tes cases, sans rien écrire', () => go('where'));
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

function grow(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

function insert(ta, str) { // sur une nouvelle ligne si la page a déjà du texte avant le curseur
  const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s;
  const before = ta.value.slice(0, s);
  ta.setRangeText(before && !/\n\s*$/.test(before) ? `\n${str}` : str, s, e, 'end');
  ta.focus({ preventScroll: true });
  ta.dispatchEvent(new Event('input'));
}

function moment() {
  const h = new Date().getHours();
  return h >= 22 || h < 6 ? 'cette nuit' : h >= 18 ? 'ce soir' : 'aujourd’hui';
}

// L’aide : rien, une ligne douce (une fois), une ligne qui reste. Jamais au-dessus du texte, jamais bloquante.
function showHelp(box, level, kind = 'self') {
  if (level < state.help || (level === state.help && kind === state.helpKind)) return;
  if (level === 2) { if (state.softShown) return; state.softShown = true; }
  state.help = level;
  state.helpKind = kind;
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
    box.append(el('div', {},
      el('p', {}, `Si quelqu’un te fait du mal, le 3919 écoute, à toute heure. En danger immédiat${NB}: le 17, ou le 114 par SMS.`),
      el('div', { className: 'calls' },
        el('a', { className: 'call', href: 'tel:3919', textContent: 'Appeler le 3919' }),
        el('a', { className: 'call', href: 'tel:17', textContent: '17' }),
        el('a', { className: 'call', href: 'sms:114', textContent: '114 par SMS' }))));
  } else {
    note('aide : une ligne qui reste');
    box.append(el('div', {},
      el('p', {}, 'Des gens répondent au 3114, maintenant, à toute heure.'),
      el('div', { className: 'calls' },
        el('a', { className: 'call', href: 'tel:3114', textContent: 'Appeler le 3114' }),
        el('a', { className: 'call', href: 'https://www.sos-amitie.com', target: '_blank', rel: 'noopener', textContent: 'Écrire à SOS Amitié' }))));
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
  help.setAttribute('role', 'status');
  help.setAttribute('aria-live', 'polite');
  const onInput = () => {
    grow(ta);
    state.text = ta.value;
    if (state.short) count.textContent = `${ta.value.length} / 280`;
    saveDraft();
    clearTimeout(assessTimer);
    assessTimer = setTimeout(() => assess(ta.value, help), 600);
  };
  ta.addEventListener('input', onInput);
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
  // Ce que les cases ont déjà dit : la ligne d’aide vient sous la page, sans rien bloquer.
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
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  back.append(box);
  back.addEventListener('click', e => { if (e.target === back) closeSheet(); });
  document.body.append(back);
  sheetNode = back;
  sheetNode.onClose = onClose;
  box.focus({ preventScroll: true });
}

function closeSheet() {
  if (!sheetNode) return;
  const cb = sheetNode.onClose;
  sheetNode.remove();
  sheetNode = null;
  cb?.();
  lastFocus?.focus?.({ preventScroll: true });
}
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

const footRow = (...btns) => el('p', { className: 'foot-row' }, ...btns);

function humansSheet(first = 'self') {
  note('canal : parler à quelqu’un');
  const body = el('div', {}, el('h2', { textContent: 'Parler à quelqu’un' }), el('p', { className: 'intro', textContent: 'Ici, personne ne lit. Là-bas, quelqu’un répond.' }));
  const groups = [...HUMANS].sort((a, b) => (a.id === first ? -1 : b.id === first ? 1 : 0));
  for (const g of groups) {
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
  gesture('Transmettre aux autres', 'sans ton nom, mêlé à d’autres', transmitSheet);
  body.append(footRow(quiet('pas maintenant', closeSheet), quiet('voir où tu es parmi les autres', () => { closeSheet(); go('where'); })));
  openSheet(body);
}

function transmitSheet() {
  const check = el('input', { type: 'checkbox', checked: true });
  const send = el('button', { type: 'button', className: 'gesture', textContent: 'Transmettre' });
  send.addEventListener('click', () => { closeSheet(); transmit(check.checked); });
  openSheet(el('div', {},
    el('h2', { textContent: 'Transmettre aux autres' }),
    el('p', { className: 'intro', textContent: 'Tes cases, et ton texte s’il y en a un, partiront sans ton nom, et sans rien qui permette de te reconnaître. Ils rejoindront ce que d’autres ont déposé. Ils pourront être comptés, mélangés, racontés avec d’autres. Personne ne les lira seuls.' }),
    el('label', { className: 'check' }, check, 'garder une copie sur ce téléphone'),
    send,
    footRow(quiet('pas maintenant', closeSheet))));
}

function keptList() {
  try { return JSON.parse(localStorage.getItem('limbesB.kept') || '[]').filter(k => k.answers && !Array.isArray(k.answers)); } catch { return []; }
}
function saveKept(list) {
  try { localStorage.setItem('limbesB.kept', JSON.stringify(list)); } catch { /* stockage indisponible */ }
  updateKept();
}
function updateKept() {
  const n = keptList().length, b = $('#kept');
  b.hidden = !n;
  b.textContent = n === 1 ? '1 gardé' : `${n} gardés`;
}
const labelsOf = answers => KEYS.flatMap(k => QUESTIONS[k].items.filter(it => (answers[k] || []).includes(it.id)).map(it => it.label));

function keptSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Ce que tu as gardé' }));
  body.append(el('div', { className: 'list' }, ...keptList().map(k => {
    const excerpt = k.text.trim().replace(/\s+/g, ' ') || `cases${NB}: ${labelsOf(k.answers).join(', ') || 'aucune'}`;
    const open = el('button', { type: 'button', className: 'row' }, excerpt.slice(0, 90) + (excerpt.length > 90 ? '…' : ''),
      el('small', { textContent: new Date(k.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + (k.sent ? ' · transmis' : '') }));
    open.addEventListener('click', () => { // reprendre : ce qui est en cours est gardé d’abord, rien ne se perd
      closeSheet();
      const rest = keptList().filter(x => x.id !== k.id);
      if (state.text.trim() || anyChecked(state.answers)) rest.unshift(snapshot());
      saveKept(rest);
      state.answers = unpack(k.answers);
      state.text = k.text;
      saveDraft();
      go(k.text ? 'page' : 'orient');
    });
    const burnOne = quiet('brûler', () => { saveKept(keptList().filter(x => x.id !== k.id)); closeSheet(); if (keptList().length) keptSheet(); });
    return el('div', { className: 'kept-row' }, open, burnOne);
  })));
  body.append(footRow(quiet('revenir', closeSheet)));
  openSheet(body);
}

/* ───────── Gestes ───────── */

const snapshot = extra => ({ id: Date.now(), date: new Date().toISOString(), text: state.text, answers: pack(state.answers), ...extra });

function keep() {
  state.gesture = 'garder';
  note('geste : garder ici');
  saveKept([snapshot(), ...keptList()]);
  clearDraft();
  renderAfterWith('Gardé ici. Tu peux revenir.');
}

function burn() {
  state.gesture = 'brûler';
  note('geste : brûler');
  const ta = app.querySelector('textarea');
  const done = () => { clearDraft(); renderAfterWith('Parti.'); };
  if (reduced || !ta || !ta.value) return done();
  ta.classList.add('burning');
  setTimeout(done, 1300);
}

function transmit(copy) {
  state.gesture = 'transmettre';
  note(`geste : transmettre${copy ? ', copie gardée' : ''}`);
  if (copy) saveKept([snapshot({ sent: true }), ...keptList()]);
  clearDraft();
  renderAfterWith('Transmis. Merci.', 'maquette : rien ne part vraiment');
}

let afterLine = '', afterNote = '';
function renderAfterWith(line, tiny = '') { afterLine = line; afterNote = tiny; go('after'); }

function renderAfter() {
  app.replaceChildren(el('div', { className: 'after' },
    el('p', { className: 'big', textContent: afterLine }),
    el('p', { className: 'tiny', textContent: afterNote }),
    el('div', { className: 'links' }, quiet('voir où tu es parmi les autres', () => go('where')), quiet('recommencer', () => { clearDraft(); go('q:situ'); }))));
}

/* ───────── Où tu es ───────── */

function quadFigure(mine) {
  const S = 220, half = S / 2, ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text) n.textContent = text; return n; };
  const svg = mk('svg', { viewBox: `0 0 ${S} ${S}`, class: 'quad', 'aria-hidden': 'true' });
  const zones = { AD: [0, 0], AS: [half, 0], ED: [0, half], ES: [half, half] };
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3f7d6a';
  for (const [q, [x, y]] of Object.entries(zones)) svg.append(mk('rect', { x, y, width: half, height: half, fill: mine.has(q) ? 'rgba(63,125,106,.14)' : 'rgba(127,127,127,.06)', stroke: 'rgba(127,127,127,.25)' }));
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [q, [x, y]] of Object.entries(zones)) {
    for (let i = 0; i < Math.round(MOCK.quad[q] / 1.5); i++) svg.append(mk('circle', { cx: (x + 12 + r() * (half - 24)).toFixed(1), cy: (y + 12 + r() * (half - 24)).toFixed(1), r: 2.2, fill: 'rgba(127,127,127,.45)' }));
  }
  for (const q of mine) { const [mx, my] = zones[q]; svg.append(mk('circle', { cx: mx + half / 2, cy: my + half / 2, r: 6, fill: accent, stroke: 'rgba(255,255,255,.9)', 'stroke-width': 2 })); }
  const label = { fill: '#9a9184', 'font-size': 9, 'font-weight': 700, 'letter-spacing': 1.5, 'text-anchor': 'middle', 'font-family': 'Nunito, sans-serif' };
  svg.append(mk('text', { ...label, x: half, y: 12 }, 'AGITÉ'), mk('text', { ...label, x: half, y: S - 5 }, 'ÉTEINT'),
    mk('text', { ...label, x: 6, y: half, transform: `rotate(-90 6 ${half})` }, 'DOULOUREUX'),
    mk('text', { ...label, x: S - 6, y: half, transform: `rotate(90 ${S - 6} ${half})` }, 'SUPPORTABLE'));
  return svg;
}

function renderWhere() {
  const total = MOCK.total.toLocaleString('fr-FR');
  const w = el('div', { className: 'where' },
    el('p', { className: 'step', textContent: 'Avec tes cases' }),
    el('h1', { textContent: 'Où tu es, parmi les autres' }),
    el('p', { className: 'hint', textContent: `Ce mois-ci, ${total} personnes ont déposé quelque chose ici.` }));
  const answers = anyChecked(state.answers) ? state.answers : state.deposited || state.answers;
  const words = checkedIn(answers, 'mots'), subs = checkedIn(answers, 'sujets').map(it => it.label);
  const others = ['situ', 'fait', 'subi'].flatMap(k => checkedIn(answers, k)).filter(it => MOCK.sentences[it.id]);
  if (words.length) {
    const quads = new Set(words.map(it => it.q));
    const main = [...quads].sort((a, b) => MOCK.quad[b] - MOCK.quad[a])[0];
    w.append(quadFigure(quads), el('p', { textContent: `Tes mots${NB}: ${words.map(it => it.label.replace(/^(de la |de l’|du )/, '')).join(', ')}. Le coin ${QUADRANTS[main]}${NB}: ${MOCK.quad[main]}${NB}% des gens ce mois-ci.` }));
  }
  if (subs.length) {
    w.append(el('p', { textContent: `Tes sujets${NB}: ${subs.join(', ')}.` }));
    let sentence = null;
    for (const a of subs) for (const b of subs) sentence = MOCK.pairs[`${a}|${b}`] || sentence;
    w.append(el('p', { className: 'muted', textContent: sentence || MOCK.alone }));
    const dims = [0, 0, 0];
    for (const t of subs) { const s = SUBJECTS.find(x => x[0] === t); dims[0] += s[1]; dims[1] += s[2]; dims[2] += s[3]; }
    const max = Math.max(...dims, 1);
    w.append(el('p', { className: 'small', textContent: 'Ce que ça touche' }), el('div', { className: 'dims' },
      ...[['moral', dims[0]], ['relationnel', dims[1]], ['projet', dims[2]]].map(([n, v]) => el('div', {}, el('span', { textContent: n }), el('i', {}, el('b', { style: `--p:${v / max}` }))))));
  }
  for (const it of others.slice(0, 2)) w.append(el('p', { textContent: MOCK.sentences[it.id] }));
  if (!words.length && !subs.length && !others.length) {
    w.append(el('p', { textContent: `Tu n’as rien coché, ou presque. C’est très bien aussi${NB}: tu es parmi les ${total}.` }));
    const b = el('button', { type: 'button', className: 'gesture', textContent: 'Cocher quelques cases' });
    b.addEventListener('click', () => go('q:mots'));
    w.append(b);
  }
  w.append(
    el('details', {}, el('summary', { textContent: 'Ce qui serait compté' }), el('ul', {}, ...(trace.length ? trace : ['rien']).map(t => el('li', { textContent: t })))),
    el('p', { className: 'tiny', textContent: 'Chiffres inventés pour la maquette. Le texte, lui, n’est jamais compté.' }),
    el('nav', { className: 'nav' }, quiet('retour', () => history.back()), el('span', { className: 'spacer' }), quiet('recommencer', () => { clearDraft(); go('q:situ'); })),
  );
  app.replaceChildren(w);
}

/* ───────── Départ ───────── */

loadDraft();
updateKept();
$('#kept').addEventListener('click', keptSheet);
$('#humans').addEventListener('click', () => humansSheet());
$('#exit').addEventListener('click', e => { e.preventDefault(); location.replace(e.currentTarget.href); });
addEventListener('popstate', e => render(e.state?.screen || 'q:situ'));
history.replaceState({ screen: 'q:situ' }, '', '');
render('q:situ');
