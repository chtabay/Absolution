// Limbes — maquette cliquable.
// Une page où l’on peut tout dire. Tout reste sur cet appareil ; rien ne part.
// Les chiffres de l’écran « où tu es » sont inventés pour la maquette.

const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NB = '\u202f'; // espace fine insécable

/* ───────── Contenu ───────── */

// Amorces : un tap insère la phrase. Une ouvre le nuage, une signale doucement.
const STARTERS = [
  { label: 'J’ai…', text: 'J’ai ' },
  { label: 'On m’a…', text: 'On m’a ' },
  { label: 'Je me sens…', cloud: true },
  { label: 'Ce qui me pèse…', text: 'Ce qui me pèse, ' },
  { label: 'Là, tout de suite…', text: 'Là, tout de suite, ', soft: true },
  { label: 'Depuis…', text: 'Depuis ', more: true },
  { label: 'Je n’ai jamais dit…', text: 'Je n’ai jamais dit ', more: true },
  { label: 'Personne ne sait que…', text: 'Personne ne sait que ', more: true },
  { label: 'Ce que je voudrais…', text: 'Ce que je voudrais, ', more: true },
];
const GHOSTS = ['J’ai…', 'Ce que je n’ai jamais dit…', 'Là, tout de suite…', 'Je me sens…', 'Ce qui me pèse…'];

// Le nuage : la disposition suit le circumplexe (agité / éteint × douloureux / supportable).
// Les mots complètent « Je me sens… » quel que soit le genre de la personne.
const QUADRANTS = { AD: 'agité et douloureux', AS: 'agité et supportable', ED: 'éteint et douloureux', ES: 'éteint et supportable' };
const WORDS = {
  AD: ['en colère', 'en rage', 'en panique', 'à bout', 'à vif', 'sous pression', 'en alerte', 'en danger'],
  AS: ['en vie', 'libre', 'capable', 'électrique', 'd’attaque', 'en feu', 'pas si mal'],
  ED: ['triste', 'vide', 'mal', 'sale', 'inutile', 'invisible', 'de trop', 'à plat', 'sans force', 'coupable'],
  ES: ['calme', 'en paix', 'tranquille', 'à ma place', 'à l’abri', 'au chaud', 'stable', 'tendre'],
};
const SOFT_WORDS = new Set(['en danger', 'à bout', 'en panique', 'mal']);

// Les cartes : on les tire dans n’importe quel ordre, ou pas.
const CARDS = [
  { id: 'fait', label: 'ce qui s’est passé', text: 'Ce qui s’est passé : ', chips: ['j’ai fait', 'on m’a fait', 'je vis', 'je ressens'] },
  { id: 'temps', label: 'depuis quand', text: 'Depuis : ', chips: ['des jours', 'des mois', 'des années', 'toujours'] },
  { id: 'lien', label: 'qui est concerné', text: 'Qui est concerné : ', chips: ['moi, personne d’autre', 'un proche', 'mon couple', 'ma famille', 'quelqu’un au travail', 'quelqu’un que je ne connais pas'] },
  { id: 'ressenti', label: 'ce que ça me fait', cloud: true },
  { id: 'besoin', label: 'ce que je voudrais', text: 'Ce que je voudrais : ', chips: ['qu’on me comprenne', 'que ça s’arrête', 'réparer', 'oublier', 'que quelqu’un sache', 'rien, juste le dire'] },
];

// Se situer : sujets (poids invisibles : moral, relationnel, projet) et fardeau.
const SUBJECTS = [
  ['j’ai fait du mal à quelqu’un', 3, 2, 0], ['j’ai menti, je cache quelque chose', 2, 2, 1], ['infidélité, désir pour un autre', 2, 3, 0],
  ['sexualité', 1, 1, 0], ['couple qui va mal', 0, 3, 0], ['famille', 0, 3, 0], ['argent, dettes', 1, 1, 2], ['travail, études', 1, 1, 3],
  ['alcool, drogue, addiction', 2, 1, 2], ['santé mentale', 0, 1, 2], ['corps, apparence', 0, 0, 1], ['ce qu’on m’a fait', 0, 2, 0],
  ['deuil, perte', 0, 2, 0], ['ce que je suis, ce que je crois', 0, 1, 2], ['un rêve, une envie', 0, 0, 3],
];
const REVIENT = ['rarement', 'parfois', 'souvent', 'tout le temps'];
const PESE = ['un peu', 'beaucoup', 'ça m’écrase'];
const DEPUIS = ['des jours', 'des mois', 'des années', 'toujours'];

// Détection locale, sans accents. Rien ne part, et l’appli ne dit jamais ce qu’elle a repéré.
const LEX = {
  self: ['suicid', 'me tuer', 'en finir', "me foutre en l'air", 'me faire du mal', 'plus envie de vivre', 'envie de mourir', 'me pendre', 'me jeter sous', 'me jeter par', 'disparaitre pour de bon', 'me scarifi'],
  other: ['me frappe', 'me bat', 'me tape', "m'a frappe", 'des coups', 'viole', 'agresse', 'me menace', 'me force', "m'a force", 'va me tuer', 'peur de lui', "peur d'elle"],
  soft: ["j'en peux plus", "je n'en peux plus", 'a bout', 'panique', 'angoiss', 'je craque', 'trop lourd', 'plus la force', 'je tiens plus', 'je ne tiens plus'],
};

// Des humains, ailleurs.
const HUMANS = [
  { title: 'Des gens qui répondent, à toute heure', items: [
    ['3114', 'tel:3114', 'idées noires, ou juste trop lourd'],
    ['SOS Amitié', 'tel:0972394050', '09 72 39 40 50, et par écrit sur sos-amitie.com'],
  ] },
  { title: 'Si quelqu’un te fait du mal', items: [
    ['3919', 'tel:3919', 'violences, 24 h/24, anonyme'],
    ['Par écrit', 'https://arretonslesviolences.gouv.fr', 'arretonslesviolences.gouv.fr, à toute heure'],
    ['17', 'tel:17', 'danger immédiat'],
    ['114', 'sms:114', 'par SMS, si tu ne peux pas parler'],
  ] },
  { title: 'Moins de 25 ans', items: [
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
  revient: [
    'Une personne sur dix y pense rarement, comme toi.',
    'Une personne sur quatre y pense parfois, comme toi.',
    'Une personne sur trois y pense souvent, comme toi.',
    'Une personne sur trois y pense tout le temps, comme toi.',
  ],
  pairs: {
    'famille|argent, dettes': 'Une personne sur quatre qui parle de famille parle aussi d’argent.',
    'travail, études|santé mentale': 'Le travail et la santé mentale arrivent ensemble une fois sur trois.',
    'couple qui va mal|infidélité, désir pour un autre': 'Le couple qui va mal et le désir pour un autre vont ensemble une fois sur deux.',
    'j’ai menti, je cache quelque chose|couple qui va mal': 'Un mensonge sur deux concerne le couple.',
    'alcool, drogue, addiction|santé mentale': 'L’addiction et la santé mentale arrivent ensemble une fois sur deux.',
    'corps, apparence|sexualité': 'Le corps et la sexualité vont souvent ensemble.',
    'deuil, perte|famille': 'Un deuil sur deux est un deuil de famille.',
    'j’ai fait du mal à quelqu’un|j’ai menti, je cache quelque chose': 'Faire du mal et le cacher vont ensemble deux fois sur trois.',
  },
  alone: 'Une personne sur cinq a déposé la même chose ce mois-ci.',
};

/* ───────── État ───────── */

const state = { amorces: [], words: [], cards: [], subjects: [], revient: null, pese: null, depuis: null, gesture: null, help: 0, helpKind: '', softShown: false, short: false, deck: false };
const trace = []; // ce qui serait compté (jamais le texte)
const note = s => trace.push(s);

const input = $('#text'), ghost = $('#ghost');

/* ───────── La page ───────── */

function grow() {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

let assessTimer, deckTimer;
function onInput() {
  grow();
  const has = input.value.trim().length > 0;
  ghost.style.opacity = input.value ? 0 : 1;
  $('#finish').hidden = !has;
  if (state.short) $('#count').textContent = `${input.value.length} / 280`;
  try { localStorage.setItem('limbes.draft', input.value); } catch { /* stockage indisponible : la page reste utilisable */ }
  clearTimeout(assessTimer);
  assessTimer = setTimeout(assess, 600);
  if (has && input.value.trim().length >= 15 && !state.deck && !state.short) {
    clearTimeout(deckTimer);
    deckTimer = setTimeout(showDeck, 2500);
  }
}

function insertRaw(str) { // au curseur, tel quel
  const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
  input.setRangeText(str, s, e, 'end');
  input.focus({ preventScroll: true });
  onInput();
}

function insert(str) { // sur une nouvelle ligne si la page a déjà du texte avant le curseur
  const before = input.value.slice(0, input.selectionStart ?? input.value.length);
  insertRaw(before && !/\n\s*$/.test(before) ? `\n${str}` : str);
}

function insertInline(str) { // à la suite, après une carte : « Depuis : des mois, des années »
  const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
  const trimmed = input.value.slice(0, s).replace(/[ \t]+$/, '');
  const sep = !trimmed || /\n$/.test(trimmed) ? '' : /[:,;]$/.test(trimmed) ? ' ' : ', ';
  input.setRangeText(sep + str, trimmed.length, e, 'end');
  input.focus({ preventScroll: true });
  onInput();
}

function useStarter(s) {
  state.amorces.push(s.label);
  note(`amorce : ${s.label}`);
  if (s.cloud) { insert('Je me sens '); return cloudSheet(); }
  insert(s.text);
  if (s.soft) showHelp(2);
}

function pickWord(w, q) {
  state.words.push({ w, q });
  note(`mot : ${w} (${QUADRANTS[q]})`);
  if (/Je me sens\s*$/.test(input.value.slice(0, input.selectionStart ?? input.value.length))) insertRaw(`${w}. `);
  else insert(`Je me sens ${w}. `);
  if (SOFT_WORDS.has(w)) showHelp(2);
}

// Le texte fantôme tourne lentement tant que la page est vide.
let gi = 0;
setInterval(() => {
  if (input.value) return;
  ghost.style.opacity = 0;
  setTimeout(() => {
    gi = (gi + 1) % GHOSTS.length;
    ghost.textContent = GHOSTS[gi];
    if (!input.value) ghost.style.opacity = 1;
  }, reduced ? 0 : 800);
}, 4000);

/* ───────── Les cartes ───────── */

function showDeck() {
  if (state.deck || state.short || input.value.trim().length < 15) return;
  state.deck = true;
  $('#deck').hidden = false;
}
addEventListener('scroll', () => { if (scrollY > 40) showDeck(); }, { passive: true });

function drawCard(card, btn) {
  if (!btn.classList.contains('drawn')) {
    btn.classList.add('drawn');
    state.cards.push(card.id);
    note(`carte : ${card.label}`);
  }
  if (card.cloud) return cloudSheet();
  insert(card.text);
  const sub = $('#subchips');
  sub.replaceChildren(...card.chips.map(c => {
    const b = el('button', { type: 'button', className: 'chip', textContent: c });
    b.addEventListener('click', () => { insertInline(c); note(`précision : ${c}`); });
    return b;
  }));
  sub.hidden = false;
}

/* ───────── L’aide : trois niveaux, jamais un mur ───────── */

function moment() {
  const h = new Date().getHours();
  return h >= 22 || h < 6 ? 'cette nuit' : h >= 18 ? 'ce soir' : 'aujourd’hui';
}

function showHelp(level, kind = 'self') {
  if (level < state.help || (level === state.help && kind === state.helpKind)) return;
  if (level === 2) {
    if (state.softShown) return;
    state.softShown = true;
  }
  state.help = level;
  state.helpKind = kind;
  const box = $('#help');
  box.replaceChildren();
  box.hidden = false;
  if (level === 2) {
    note('aide : une ligne douce');
    const x = el('button', { type: 'button', className: 'x', textContent: '×' });
    x.setAttribute('aria-label', 'fermer');
    x.addEventListener('click', () => { box.hidden = true; });
    box.append(el('p', {}, `Si c’est trop lourd ${moment()}, des gens répondent au `, el('a', { href: 'tel:3114', textContent: '3114' }), ', à toute heure.'), x);
  } else if (kind === 'other') {
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

function assess() {
  const t = norm(input.value);
  if (LEX.self.some(k => t.includes(k))) return showHelp(3, 'self');
  if (LEX.other.some(k => t.includes(k))) return showHelp(3, 'other');
  if (LEX.soft.some(k => t.includes(k))) showHelp(2);
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

const quiet = (text, fn) => { const b = el('button', { type: 'button', className: 'quiet', textContent: text }); b.addEventListener('click', fn); return b; };
const foot = (...btns) => el('p', { className: 'foot' }, ...btns);

function cloudSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Un mot, s’il y en a un.' }));
  const cloud = el('div', { className: 'cloud' });
  for (const [cls, t] of [['top', 'agité'], ['bottom', 'éteint'], ['left', 'douloureux'], ['right', 'supportable']]) {
    const a = el('span', { className: `axis ${cls}`, textContent: t });
    a.setAttribute('aria-hidden', 'true');
    cloud.append(a);
  }
  for (const q of ['AD', 'AS', 'ED', 'ES']) {
    const zone = el('div', { className: `q ${q}` });
    zone.setAttribute('aria-label', QUADRANTS[q]);
    for (const w of WORDS[q]) {
      const b = el('button', { type: 'button', className: 'chip', textContent: w });
      b.addEventListener('click', () => { closeSheet(); pickWord(w, q); });
      zone.append(b);
    }
    cloud.append(zone);
  }
  body.append(cloud, foot(quiet('aucun, pour l’instant', closeSheet)));
  openSheet(body);
}

function drawerSheet() {
  const list = el('div', { className: 'list' });
  const row = (t, sub, fn, disabled) => {
    const b = el('button', { type: 'button', className: 'row', disabled: !!disabled }, t, el('small', { textContent: sub }));
    b.addEventListener('click', () => { closeSheet(); fn(); });
    list.append(b);
  };
  row('Choisir un mot', 'pour dire comment c’est, là', cloudSheet);
  row('Me situer', 'des sujets, sans rien écrire', () => situerSheet());
  row(state.short ? 'Reprendre toute la page' : 'Dire en trois lignes', state.short ? 'sans limite' : 'court, et c’est tout', () => setShort(!state.short));
  row('Parler à quelqu’un', 'des humains, ailleurs, à toute heure', humansSheet);
  row('Dire à voix haute', 'bientôt', () => {}, true);
  openSheet(el('div', {}, el('h2', { textContent: 'Autrement' }), list));
}

function humansSheet() {
  note('canal : parler à quelqu’un');
  const body = el('div', {}, el('h2', { textContent: 'Parler à quelqu’un' }), el('p', { className: 'intro', textContent: 'Ici, personne ne lit. Là-bas, quelqu’un répond.' }));
  for (const g of HUMANS) {
    body.append(el('h3', { textContent: g.title }), el('div', { className: 'list' }, ...g.items.map(([name, href, sub]) => {
      const a = el('a', { className: 'row', href }, name, el('small', { textContent: sub }));
      if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    })));
  }
  body.append(foot(quiet('revenir à la page', closeSheet)));
  openSheet(body);
}

function situerSheet(onDone) {
  const body = el('div', {}, el('h2', { textContent: 'Te situer, si tu veux.' }), el('p', { className: 'intro', textContent: 'Plusieurs, un seul, ou aucun.' }));
  body.append(el('div', { className: 'chips' }, ...SUBJECTS.map(([t]) => {
    const b = el('button', { type: 'button', className: `chip${state.subjects.includes(t) ? ' on' : ''}`, textContent: t });
    b.addEventListener('click', () => {
      const i = state.subjects.indexOf(t);
      if (i >= 0) state.subjects.splice(i, 1); else { state.subjects.push(t); note(`sujet : ${t}`); }
      b.classList.toggle('on', i < 0);
    });
    return b;
  })));
  const single = (title, list, key) => {
    const row = el('div', { className: 'chips' });
    list.forEach((t, i) => {
      const b = el('button', { type: 'button', className: `chip${state[key] === i ? ' on' : ''}`, textContent: t });
      b.addEventListener('click', () => {
        state[key] = state[key] === i ? null : i;
        if (state[key] !== null) note(`${title.toLowerCase()} : ${t}`);
        [...row.children].forEach((c, j) => c.classList.toggle('on', state[key] === j));
      });
      row.append(b);
    });
    body.append(el('h3', { textContent: title }), row);
  };
  single('Ça te revient', REVIENT, 'revient');
  single('Ça pèse', PESE, 'pese');
  single('Depuis', DEPUIS, 'depuis');
  body.append(foot(quiet('c’est tout', closeSheet)));
  openSheet(body, onDone);
}

function setShort(on) {
  state.short = on;
  note(on ? 'mode : trois lignes' : 'mode : toute la page');
  document.body.classList.toggle('short', on);
  $('#count').hidden = !on;
  if (on) { input.maxLength = 280; $('#deck').hidden = true; } else { input.removeAttribute('maxlength'); if (state.deck) $('#deck').hidden = false; }
  onInput();
  input.focus({ preventScroll: true });
}

function finishSheet() {
  const body = el('div', {}, el('h2', { textContent: 'Et maintenant ?' }));
  const gesture = (t, sub, fn) => {
    const b = el('button', { type: 'button', className: 'gesture' }, t, el('small', { textContent: sub }));
    b.addEventListener('click', () => { closeSheet(); fn(); });
    body.append(b);
  };
  gesture('Garder ici', 'sur ce téléphone, rien ne part', keep);
  gesture('Brûler', 'il n’en restera rien', burn);
  gesture('Transmettre aux autres', 'sans ton nom, mêlé à d’autres', transmitSheet);
  body.append(foot(quiet('pas maintenant', closeSheet), quiet('voir où tu es parmi les autres', () => { closeSheet(); showWhere(); })));
  openSheet(body);
}

function transmitSheet() {
  const check = el('input', { type: 'checkbox', checked: true });
  const go = el('button', { type: 'button', className: 'gesture', textContent: 'Transmettre' });
  go.addEventListener('click', () => { closeSheet(); transmit(check.checked); });
  openSheet(el('div', {},
    el('h2', { textContent: 'Transmettre aux autres' }),
    el('p', { className: 'intro', textContent: 'Ton texte partira sans ton nom, et sans rien qui permette de te reconnaître. Il rejoindra ce que d’autres ont déposé. Il pourra être compté, mélangé, raconté avec d’autres. Personne ne le lira seul.' }),
    el('label', { className: 'check' }, check, 'garder une copie sur ce téléphone'),
    go,
    foot(quiet('pas maintenant', closeSheet))));
}

function keptSheet() {
  const list = keptList();
  const body = el('div', {}, el('h2', { textContent: 'Ce que tu as gardé' }));
  body.append(el('div', { className: 'list' }, ...list.map(k => {
    const excerpt = k.text.trim().replace(/\s+/g, ' ');
    const open = el('button', { type: 'button', className: 'row' }, excerpt.slice(0, 90) + (excerpt.length > 90 ? '…' : ''),
      el('small', { textContent: new Date(k.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + (k.sent ? ' · transmis' : '') }));
    open.addEventListener('click', () => { // reprendre : la page en cours est gardée d’abord, rien ne se perd
      closeSheet();
      const rest = keptList().filter(x => x.id !== k.id);
      if (input.value.trim()) rest.unshift({ id: Date.now(), date: new Date().toISOString(), text: input.value });
      saveKept(rest);
      input.value = k.text;
      onInput();
      showPage();
    });
    const burnOne = quiet('brûler', () => { saveKept(keptList().filter(x => x.id !== k.id)); closeSheet(); if (keptList().length) keptSheet(); });
    return el('div', { className: 'kept-row' }, open, burnOne);
  })));
  body.append(foot(quiet('revenir à la page', closeSheet)));
  openSheet(body);
}

/* ───────── Gestes et écrans ───────── */

function keptList() {
  try { return JSON.parse(localStorage.getItem('limbes.kept') || '[]'); } catch { return []; }
}
function saveKept(list) {
  try { localStorage.setItem('limbes.kept', JSON.stringify(list)); } catch { /* stockage indisponible */ }
  updateKept();
}
function updateKept() {
  const n = keptList().length, b = $('#kept');
  b.hidden = !n;
  b.textContent = n === 1 ? '1 gardé' : `${n} gardés`;
}

function clearPage() {
  input.value = '';
  try { localStorage.removeItem('limbes.draft'); } catch { /* rien à effacer */ }
  onInput();
}

function keep() {
  state.gesture = 'garder';
  note('geste : garder ici');
  saveKept([{ id: Date.now(), date: new Date().toISOString(), text: input.value }, ...keptList()]);
  clearPage();
  showAfter('Gardé ici. Tu peux revenir.');
}

function burn() {
  state.gesture = 'brûler';
  note('geste : brûler');
  const done = () => { input.classList.remove('burning'); clearPage(); showAfter('Parti.'); };
  if (reduced) return done();
  input.classList.add('burning');
  setTimeout(done, 1400);
}

function transmit(copy) {
  state.gesture = 'transmettre';
  note(`geste : transmettre${copy ? ', copie gardée' : ''}`);
  if (copy) saveKept([{ id: Date.now(), date: new Date().toISOString(), text: input.value, sent: true }, ...keptList()]);
  clearPage();
  showAfter('Transmis. Merci.', 'maquette : rien ne part vraiment');
}

function show(name) {
  for (const id of ['page-screen', 'after', 'where']) $(`#${id}`).hidden = id !== name;
  $('.bar').hidden = name !== 'page-screen';
  scrollTo(0, 0);
}

function showAfter(line, tiny = '') {
  $('#after-line').textContent = line;
  $('#after-note').textContent = tiny;
  show('after');
  $('#after-line').focus({ preventScroll: true });
}

function showPage() {
  show('page-screen');
  input.focus({ preventScroll: true });
}

function quadFigure(mine) {
  const S = 220, half = S / 2, ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text) n.textContent = text; return n; };
  const svg = mk('svg', { viewBox: `0 0 ${S} ${S}`, class: 'quad', 'aria-hidden': 'true' });
  const zones = { AD: [0, 0], AS: [half, 0], ED: [0, half], ES: [half, half] };
  for (const [q, [x, y]] of Object.entries(zones)) svg.append(mk('rect', { x, y, width: half, height: half, fill: q === mine ? 'rgba(217,169,78,.12)' : 'rgba(255,255,255,.025)', stroke: 'rgba(217,169,78,.18)' }));
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [q, [x, y]] of Object.entries(zones)) {
    for (let i = 0; i < Math.round(MOCK.quad[q] / 1.5); i++) svg.append(mk('circle', { cx: (x + 12 + r() * (half - 24)).toFixed(1), cy: (y + 12 + r() * (half - 24)).toFixed(1), r: 2.2, fill: 'rgba(239,230,214,.35)' }));
  }
  const [mx, my] = zones[mine];
  svg.append(mk('circle', { cx: mx + half / 2, cy: my + half / 2, r: 5.5, fill: '#f3cf85', stroke: '#0d0a08', 'stroke-width': 2 }));
  const label = { fill: '#7b6e5e', 'font-size': 9, 'letter-spacing': 1.5, 'text-anchor': 'middle' };
  svg.append(mk('text', { ...label, x: half, y: 12 }, 'AGITÉ'), mk('text', { ...label, x: half, y: S - 5 }, 'ÉTEINT'),
    mk('text', { ...label, x: 6, y: half, transform: `rotate(-90 6 ${half})` }, 'DOULOUREUX'),
    mk('text', { ...label, x: S - 6, y: half, transform: `rotate(90 ${S - 6} ${half})` }, 'SUPPORTABLE'));
  return svg;
}

function showWhere() {
  const w = $('#where');
  const total = MOCK.total.toLocaleString('fr-FR');
  w.replaceChildren(el('h2', { textContent: 'Où tu es, parmi les autres' }), el('p', { className: 'intro', textContent: `Ce mois-ci, ${total} personnes ont déposé quelque chose ici.` }));
  const situated = state.words.length || state.subjects.length || state.revient !== null;
  if (state.words.length) {
    const { w: word, q } = state.words[state.words.length - 1];
    w.append(quadFigure(q), el('p', { textContent: `«${NB}${word}${NB}»${NB}: tu es dans le coin ${QUADRANTS[q]}, avec ${MOCK.quad[q]}${NB}% des gens.` }));
  }
  if (state.subjects.length) {
    w.append(el('p', { textContent: `Tes sujets${NB}: ${state.subjects.join(', ')}.` }));
    let sentence = null;
    for (const a of state.subjects) for (const b of state.subjects) sentence = MOCK.pairs[`${a}|${b}`] || sentence;
    w.append(el('p', { className: 'muted', textContent: sentence || MOCK.alone }));
    const dims = [0, 0, 0];
    for (const t of state.subjects) { const s = SUBJECTS.find(x => x[0] === t); dims[0] += s[1]; dims[1] += s[2]; dims[2] += s[3]; }
    const max = Math.max(...dims, 1);
    w.append(el('p', { className: 'muted small', textContent: 'Ce que ça touche' }), el('div', { className: 'dims' },
      ...[['moral', dims[0]], ['relationnel', dims[1]], ['projet', dims[2]]].map(([n, v]) => el('div', {}, el('span', { textContent: n }), el('i', {}, el('b', { style: `--p:${v / max}` }))))));
  }
  if (state.revient !== null) w.append(el('p', { textContent: MOCK.revient[state.revient] }));
  if (!situated) {
    w.append(el('p', { textContent: `Tu n’as rien situé. C’est très bien aussi${NB}: tu es parmi les ${total}.` }));
    const b = el('button', { type: 'button', className: 'gesture', textContent: 'Me situer, en deux touches' });
    b.addEventListener('click', () => situerSheet(showWhere));
    w.append(b);
  }
  w.append(
    el('details', {}, el('summary', { textContent: 'Ce qui serait compté' }), el('ul', {}, ...(trace.length ? trace : ['rien']).map(t => el('li', { textContent: t })))),
    el('p', { className: 'tiny', textContent: 'Chiffres inventés pour la maquette. Le texte, lui, n’est jamais compté.' }),
    foot(quiet('revenir à la page', showPage)));
  show('where');
  w.querySelector('h2').setAttribute('tabindex', '-1');
  w.querySelector('h2').focus({ preventScroll: true });
}

/* ───────── Construction ───────── */

const starters = $('#starters');
const chip = s => { const b = el('button', { type: 'button', className: 'chip', textContent: s.label }); b.addEventListener('click', () => useStarter(s)); return b; };
starters.append(...STARTERS.filter(s => !s.more).map(chip));
const dots = el('button', { type: 'button', className: 'chip', textContent: '…' });
dots.setAttribute('aria-label', 'd’autres amorces');
dots.addEventListener('click', () => { dots.remove(); starters.append(...STARTERS.filter(s => s.more).map(chip)); });
starters.append(dots);

$('#cards').append(...CARDS.map(c => { const b = el('button', { type: 'button', className: 'card', textContent: c.label }); b.addEventListener('click', () => drawCard(c, b)); return b; }));

try { input.value = localStorage.getItem('limbes.draft') || ''; } catch { /* pas de brouillon */ }
ghost.textContent = GHOSTS[0];
updateKept();
onInput();

input.addEventListener('input', onInput);
$('#other').addEventListener('click', drawerSheet);
$('#finish').addEventListener('click', finishSheet);
$('#kept').addEventListener('click', keptSheet);
$('#exit').addEventListener('click', e => { e.preventDefault(); location.replace(e.currentTarget.href); });
$('#to-where').addEventListener('click', showWhere);
$('#write-more').addEventListener('click', showPage);
