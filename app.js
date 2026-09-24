// Absolution — confessionnal virtuel.
// Parcours : dernière confession → examen de conscience (sept péchés capitaux) → bilan
// → confession libre (facultative, jamais analysée) → certificat d’absolution.
// Tout se passe dans le navigateur : rien n’est envoyé, rien n’est stocké.

import { SINS, LAST, LEVELS, VERDICTS, REMARKS, SPECIAL } from './contenu.js';

/* ───────── Outils ───────── */

const MAX = 280;

const hash = s => { // FNV-1a
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

const rng = seed => () => { // mulberry32
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (r, list) => list[Math.floor(r() * list.length)];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const sum = list => list.reduce((a, b) => a + b, 0);
const today = () => { const n = new Date(); return Math.round(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 864e5); };
const article = name => (/^[aeiou]/i.test(name) ? 'l’' : 'la ');
const lcfirst = s => s.charAt(0).toLowerCase() + s.slice(1);
const confessed = n => (n ? `${n} péché${n > 1 ? 's' : ''} avoué${n > 1 ? 's' : ''}` : 'Aucun péché avoué');

// Typographie française : apostrophes courbes, espaces fines insécables.
const fr = s => s.replace(/'/g, '’').replace(/ ([?!:;»])/g, '\u202f$1').replace(/« /g, '«\u202f');
const oneLine = s => s.replace(/\s+/g, ' ').trim();

const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};

/* ───────── Examen et verdict ───────── */

const QUESTIONS = []; // l’index de chaque question sert d’identifiant
SINS.forEach((sin, s) => {
  sin.total = 0;
  for (const list of Object.values(sin.questions)) {
    for (const [w, text] of list) {
      QUESTIONS.push({ s, w, text });
      sin.total++;
    }
  }
});

// Mêmes réponses, même verdict : la graine vient des réponses elles-mêmes.
function assess(ids, last, text) {
  const counts = SINS.map(() => 0), scores = SINS.map(() => 0);
  let grave = 0;
  for (const id of ids) {
    const q = QUESTIONS[id];
    counts[q.s]++;
    scores[q.s] += q.w;
    if (q.w === 3) grave++;
  }
  const score = sum(scores);
  const g = Math.max(score < 6 ? 1 : score < 15 ? 2 : score < 30 ? 3 : score < 50 ? 4 : 5, grave > 1 ? 5 : grave ? 4 : 1);
  let dom = 0; // le plus coché ; à égalité, le plus lourd, puis l’ordre traditionnel ; sans péché, l’orgueil
  counts.forEach((n, i) => { if (n > counts[dom] || (n === counts[dom] && scores[i] > scores[dom])) dom = i; });
  return { k: hash(`${ids.join(',')}|${last}|${oneLine(text).toLowerCase()}`), counts, dom, g, last, d: today(), grave };
}

function prayers(g, r) {
  if (g === 5) return 'Un chapelet entier. À genoux.';
  const pater = [0, 1, 2, 5][g - 1] + (g > 1 ? Math.floor(r() * 2) : 0);
  const ave = [1, 3, 5, 10][g - 1] + Math.floor(r() * (g > 1 ? 3 : 2));
  return `${pater ? `${pater} Notre Père et ` : ''}${ave} Je vous salue Marie`;
}

function details(v) {
  const r = rng(v.k ^ 0x5bd1e995), sin = SINS[v.dom], total = sum(v.counts);
  let second = -1;
  v.counts.forEach((c, i) => { if (i !== v.dom && c && (second < 0 || c > v.counts[second])) second = i; });
  const other = second >= 0 && v.counts[second] >= 3 ? SINS[second] : null;
  const special = !total ? SPECIAL.none : v.counts.every(c => c) ? SPECIAL.all : v.last === 3 ? SPECIAL.first : total >= 40 ? SPECIAL.many : null;
  return {
    total,
    sin: sin.name,
    level: LEVELS[v.g - 1],
    remark: special || pick(r, [...sin.remarks, ...REMARKS[v.g < 3 ? 0 : v.g < 4 ? 1 : 2]]),
    prayers: prayers(v.g, r),
    penance: pick(r, sin.penances),
    penance2: other && `Et pour ${article(other.name)}${other.name.toLowerCase()} : ${lcfirst(pick(r, other.penances))}`,
    last: LAST[v.last][1],
    no: v.k.toString(36).toUpperCase().padStart(7, '0').replace(/^(...)/, '$1-'),
    date: new Date(v.d * 864e5).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

// Ordre d’affichage du profil : le péché dominant d’abord, puis par nombre de fautes.
const ranking = (counts, dom) => {
  const first = i => (i === dom && counts[i] ? 1 : 0);
  return counts.map((_, i) => i).sort((a, b) => first(b) - first(a) || counts[b] - counts[a] || a - b);
};

/* ───────── Lien partageable ─────────
   #2.k.nnnnnnn.dom.g.last.d[.texte] — entiers en base 36, un chiffre par péché capital,
   texte en base64url (« ~ » : confession libre scellée). Le détail des réponses n’y figure
   jamais, et le fragment « # » n’est pas transmis au serveur. */

const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

function encode(v, mode, text) {
  const fields = ['2', v.k.toString(36), v.counts.map(c => c.toString(36)).join(''), v.dom, v.g, v.last, v.d.toString(36)];
  if (mode === 'shown') fields.push(b64(text));
  if (mode === 'sealed') fields.push('~');
  return fields.join('.');
}

function decode(frag) {
  try {
    const [ver, k, counts, dom, g, last, d, t] = frag.split('.');
    if (ver !== '2' || !/^[0-9a-z]{7}$/.test(counts || '')) return null;
    const v = { k: parseInt(k, 36), counts: [...counts].map(c => parseInt(c, 36)), dom: parseInt(dom, 36), g: parseInt(g, 36), last: parseInt(last, 36), d: parseInt(d, 36) };
    const ok = v.k >= 0 && v.k < 2 ** 32 && v.counts.every((c, i) => c <= SINS[i].total) && SINS[v.dom] && v.g >= 1 && v.g <= 5 && LAST[v.last] && v.d > 0 && v.d < 1e5;
    if (!ok) return null;
    return { ...v, t: t && t !== '~' ? oneLine(unb64(t)).slice(0, MAX) || null : null, sealed: t === '~' };
  } catch {
    return null;
  }
}

/* ───────── Image à partager (1080 × 1920) ───────── */

const INK = '#2b1d12', INK_SOFT = '#6b5642', RED = '#a3212a';
const SERIF = '"EB Garamond", Georgia, serif', CAPS = 'Cinzel, Georgia, serif';
const FONTS = [`700 20px ${CAPS}`, `600 20px ${CAPS}`, `400 20px ${SERIF}`, `italic 400 20px ${SERIF}`];

function spaced(x, str, cx, y, gap) { // texte centré, lettres espacées
  const chars = [...str], w = chars.map(ch => x.measureText(ch).width);
  let px = cx - (sum(w) + gap * (chars.length - 1)) / 2;
  x.textAlign = 'left';
  chars.forEach((ch, i) => { x.fillText(ch, px, y); px += w[i] + gap; });
  x.textAlign = 'center';
}

function wrap(x, str, max) {
  const out = [];
  let line = '';
  for (const word of str.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (x.measureText(test).width <= max) { line = test; continue; }
    if (line) out.push(line);
    line = word;
    while (x.measureText(line).width > max) { // mot trop long : on le coupe
      let i = line.length - 1;
      while (i > 1 && x.measureText(line.slice(0, i)).width > max) i--;
      out.push(line.slice(0, i));
      line = line.slice(i);
    }
  }
  if (line) out.push(line);
  return out;
}

function lines(x, str, font, max, count) {
  x.font = font;
  const out = wrap(x, str, max);
  if (out.length > count) {
    out.length = count;
    out[count - 1] = out[count - 1].replace(/\s*\S*$/, '…');
  }
  return out;
}

function rrect(x, X, Y, w, h, r) {
  x.beginPath();
  if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h);
}

function seal(x, cx, cy, r) {
  x.save();
  x.fillStyle = x.strokeStyle = RED;
  x.beginPath(); x.arc(cx, cy, r, 0, 2 * Math.PI); x.fill();
  x.setLineDash([r * .12, r * .17]); x.lineCap = 'round'; x.lineWidth = r * .24; x.stroke(); x.setLineDash([]);
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = r * .07;
  x.beginPath(); x.arc(cx, cy, r * .72, 0, 2 * Math.PI); x.stroke();
  x.fillStyle = 'rgba(0,0,0,.28)';
  x.fillRect(cx - r * .1, cy - r * .57, r * .2, r * 1.14);
  x.fillRect(cx - r * .4, cy - r * .29, r * .8, r * .19);
  x.restore();
}

function stamp(x, cx, cy, seed) {
  const w = 440, h = 260, s = el('canvas', { width: w, height: h }), o = s.getContext('2d');
  o.translate(w / 2, h / 2); o.rotate(-12 * Math.PI / 180);
  o.strokeStyle = o.fillStyle = RED; o.textBaseline = 'middle';
  rrect(o, -170, -70, 340, 140, 16); o.lineWidth = 7; o.stroke();
  rrect(o, -156, -56, 312, 112, 9); o.lineWidth = 2.5; o.stroke();
  o.font = `700 24px ${CAPS}`; spaced(o, 'EGO TE', 0, -24, 12);
  o.font = `700 46px ${CAPS}`; spaced(o, 'ABSOLVO', 0, 16, 5);
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalCompositeOperation = 'destination-out'; // usure de l’encre : grain fin, puis encrage inégal
  const r = rng(seed), dot = (rad, alpha) => { o.globalAlpha = alpha; o.beginPath(); o.arc(r() * w, r() * h, rad, 0, 2 * Math.PI); o.fill(); };
  for (let i = 0; i < 1600; i++) dot(.4 + r() * 1.4, .2 + r() * .8);
  for (let i = 0; i < 18; i++) dot(6 + r() * 14, .12 + r() * .2);
  x.save(); x.globalAlpha = .9; x.globalCompositeOperation = 'multiply';
  x.drawImage(s, cx - w / 2, cy - h / 2);
  x.restore();
}

async function drawCert(v, d, mode, text) {
  await Promise.all(FONTS.map(f => document.fonts.load(f).catch(() => {})));
  const W = 1080, H = 1920, M = 60, TOP = M, BOTTOM = H - 180, cx = W / 2;
  const c = el('canvas', { width: W, height: H }), x = c.getContext('2d');
  const set = (font, color) => { x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; };
  const rule = (y, half) => { x.strokeStyle = 'rgba(122,90,48,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx - half, y); x.lineTo(cx + half, y); x.stroke(); };

  // Fond et parchemin
  x.fillStyle = '#0d0a08'; x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(cx, -150, 0, cx, -150, 1300);
  glow.addColorStop(0, 'rgba(217,169,78,.35)'); glow.addColorStop(1, 'rgba(217,169,78,0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  const paper = x.createRadialGradient(cx, TOP, 0, cx, TOP, 1800);
  paper.addColorStop(0, '#fbf6ec'); paper.addColorStop(.45, '#f5edde'); paper.addColorStop(1, '#e8d8b8');
  x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 60; x.shadowOffsetY = 24;
  x.fillStyle = paper; x.fillRect(M, TOP, W - 2 * M, BOTTOM - TOP); x.restore();
  x.strokeStyle = 'rgba(122,90,48,.55)';
  x.lineWidth = 2; x.strokeRect(M + 18, TOP + 18, W - 2 * M - 36, BOTTOM - TOP - 36);
  x.lineWidth = 1; x.strokeRect(M + 25, TOP + 25, W - 2 * M - 50, BOTTOM - TOP - 50);

  // En-tête
  set(`700 32px ${CAPS}`, INK); spaced(x, 'CERTIFICAT D’ABSOLUTION', cx, TOP + 105, 8);
  set(`400 30px ${SERIF}`, INK_SOFT); x.fillText(`N° ${d.no} · ${d.date}`, cx, TOP + 158);
  set(`italic 400 30px ${SERIF}`, INK_SOFT); x.fillText(`Dernière confession : ${d.last}`, cx, TOP + 202);

  // Corps : blocs empilés, centrés verticalement
  const blocks = [];
  if (mode === 'shown') {
    let font, lh, ls;
    for (const size of [44, 40, 36, 32]) {
      font = `italic 400 ${size}px ${SERIF}`; lh = size * 1.3;
      ls = lines(x, fr(`« ${text} »`), font, 820, 6);
      if (ls.length * lh <= 220) break;
    }
    blocks.push({ h: ls.length * lh, draw: y => { set(font, INK); ls.forEach((l, i) => x.fillText(l, cx, y + lh * (i + .5))); } });
  } else if (mode === 'sealed') {
    blocks.push({ h: 150, draw: y => {
      seal(x, cx, y + 32, 30);
      set(`italic 400 34px ${SERIF}`, INK_SOFT); x.fillText('Confession libre scellée', cx, y + 100);
      set(`700 18px ${CAPS}`, INK_SOFT); spaced(x, 'SECRET DE LA CONFESSION', cx, y + 138, 5);
    } });
  }
  blocks.push({ h: 170, draw: y => {
    const c1 = cx - 210, c2 = cx + 210;
    rule(y, 380); rule(y + 170, 380);
    set(`700 20px ${CAPS}`, INK_SOFT); spaced(x, 'PÉCHÉ DOMINANT', c1, y + 40, 5); spaced(x, 'GRAVITÉ', c2, y + 40, 6);
    set(`700 52px ${CAPS}`, INK);
    const wSin = x.measureText(d.sin.toUpperCase()).width;
    if (wSin > 390) x.font = `700 ${Math.floor(52 * 390 / wSin)}px ${CAPS}`;
    x.fillText(d.sin.toUpperCase(), c1, y + 104);
    for (let i = 0; i < 5; i++) {
      const gx = c2 - 68 + i * 34, gy = y + 88;
      x.beginPath(); x.moveTo(gx, gy - 11); x.lineTo(gx + 11, gy); x.lineTo(gx, gy + 11); x.lineTo(gx - 11, gy); x.closePath();
      x.fillStyle = x.strokeStyle = RED; x.lineWidth = 2.5;
      if (i < v.g) x.fill(); else x.stroke();
    }
    set(`italic 400 36px ${SERIF}`, INK); x.fillText(d.level, c2, y + 134);
  } });
  blocks.push({ h: 64 + 7 * 48, draw: y => {
    const most = Math.max(...v.counts);
    set(`700 20px ${CAPS}`, INK_SOFT); spaced(x, `PROFIL · ${confessed(d.total).toUpperCase()}`, cx, y + 14, 5);
    ranking(v.counts, v.dom).forEach((i, row) => {
      const ry = y + 64 + row * 48 + 24, n = v.counts[i], top = n && i === v.dom;
      x.globalAlpha = n ? 1 : .4;
      set(`700 25px ${CAPS}`, top ? RED : INK); x.textAlign = 'left'; x.fillText(SINS[i].name.toUpperCase(), 190, ry);
      rrect(x, 480, ry - 7, 340, 14, 7); x.fillStyle = 'rgba(107,86,66,.18)'; x.fill();
      if (n) { rrect(x, 480, ry - 7, Math.max(14, 340 * n / most), 14, 7); x.fillStyle = top ? RED : INK_SOFT; x.fill(); }
      set(`400 32px ${SERIF}`, top ? RED : INK); x.textAlign = 'right'; x.fillText(String(n), 890, ry);
      x.globalAlpha = 1;
    });
  } });
  const rl = lines(x, fr(d.remark), `italic 400 32px ${SERIF}`, 800, 2);
  blocks.push({ h: rl.length * 44, draw: y => { set(`italic 400 32px ${SERIF}`, INK_SOFT); rl.forEach((l, i) => x.fillText(l, cx, y + 44 * (i + .5))); } });
  const t1 = lines(x, fr(d.penance), `400 34px ${SERIF}`, 820, 2);
  const t2 = d.penance2 ? lines(x, fr(d.penance2), `italic 400 30px ${SERIF}`, 820, 2) : [];
  blocks.push({ h: 92 + t1.length * 46 + (t2.length ? 12 + t2.length * 42 : 0), draw: y => {
    set(`700 20px ${CAPS}`, INK_SOFT); spaced(x, 'PÉNITENCE', cx, y + 12, 6);
    set(`400 34px ${SERIF}`, INK); x.fillText(d.prayers, cx, y + 60);
    t1.forEach((l, i) => x.fillText(l, cx, y + 92 + 46 * (i + .5)));
    const y2 = y + 92 + t1.length * 46 + 12;
    set(`italic 400 30px ${SERIF}`, INK_SOFT); t2.forEach((l, i) => x.fillText(l, cx, y2 + 42 * (i + .5)));
  } });

  const areaTop = TOP + 250, areaH = BOTTOM - 205 - areaTop;
  const total = sum(blocks.map(b => b.h));
  const gap = clamp((areaH - total) / (blocks.length + 1), 16, 64);
  let y = areaTop + (areaH - total - gap * (blocks.length - 1)) / 2;
  for (const b of blocks) { b.draw(y); y += b.h + gap; }

  // Pied : envoi et tampon
  set(`italic 400 40px ${SERIF}`, INK); x.textAlign = 'left'; x.fillText('Allez en paix.', M + 90, BOTTOM - 100);
  stamp(x, W - M - 230, BOTTOM - 110, v.k);

  // Signature du site
  set(`600 36px ${CAPS}`, '#f3cf85'); spaced(x, 'ABSOLUTION', cx, BOTTOM + 78, 12);
  set(`italic 400 28px ${SERIF}`, '#a89a88'); x.fillText((location.host + location.pathname).replace(/\/(index\.html)?$/, ''), cx, BOTTOM + 124);
  return c;
}

/* ───────── Interface ───────── */

const $ = s => document.querySelector(s);
const SCREENS = ['intro', 'exam', 'bilan', 'libre', 'verdict'];
const form = $('#form'), input = $('#text'), submit = $('#submit');
const coarse = matchMedia('(pointer: coarse)').matches;
const native = coarse && !!navigator.share; // mobile : feuille de partage du système ; ailleurs : copie du lien
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TITLE = document.title;

let session = null; // { last } : confession en cours (les réponses vivent dans les cases à cocher)
let step = 0;
let cert = null; // { v, text, reveal, sealed, mine }
let imageFile = null, imageJob = 0, toastTimer;

const checkedIds = () => [...document.querySelectorAll('#sins input:checked')].map(box => +box.value);
const libreMode = () => (cert.text ? (cert.reveal ? 'shown' : 'sealed') : cert.sealed ? 'sealed' : 'none');
const shareURL = () => `${location.origin}${location.pathname}#${encode(cert.v, libreMode(), cert.text)}`;

function gauge(node, g) {
  node.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < g));
}

function profile(list, counts, dom, full) {
  const most = Math.max(...counts); // les barres se mesurent au péché le plus coché
  list.replaceChildren(...ranking(counts, dom).map(i => {
    const n = counts[i];
    return el('li', { className: [n ? '' : 'zero', n && i === dom ? 'top' : ''].join(' ').trim() },
      el('span', { className: 'pname', textContent: SINS[i].name }),
      el('span', { className: 'bar' }, el('i', { style: `--p:${most ? n / most : 0}` })),
      el('span', { className: 'pcount', textContent: full ? `${n} / ${SINS[i].total}` : String(n) }),
    );
  }));
}

function show(name, focus) {
  for (const id of SCREENS) $(`#${id}`).hidden = id !== name;
  document.body.classList.toggle('inner', name !== 'intro');
  if (name !== 'verdict') document.title = TITLE;
  scrollTo(0, 0);
  if (focus) focus.focus({ preventScroll: true });
}

function showStep(s, focus) {
  step = s;
  document.querySelectorAll('#sins .sin').forEach((box, i) => { box.hidden = i !== s; });
  document.querySelectorAll('.progress i').forEach((bar, i) => { bar.className = i < s ? 'done' : i === s ? 'now' : ''; });
  $('#step').textContent = `Étape ${s + 1} sur ${SINS.length}`;
  updateNext();
  show('exam', focus && $(`#sin-${s}`));
}

function updateNext() {
  const n = document.querySelectorAll(`#sin-box-${step} input:checked`).length;
  $('#next').textContent = step === SINS.length - 1 ? 'Voir le bilan' : n ? `Suivant (${n})` : 'Rien à signaler';
}

function showBilan(focus) {
  const ids = checkedIds(), a = assess(ids, session.last, '');
  $('#b-total').textContent = confessed(ids.length);
  $('#b-grave').textContent = a.grave ? `dont ${a.grave} grave${a.grave > 1 ? 's' : ''}` : '';
  gauge($('#b-gauge'), a.g);
  $('#b-level').textContent = LEVELS[a.g - 1];
  $('#b-verdict').textContent = fr(VERDICTS[ids.length ? a.g : 0]);
  profile($('#b-profile'), a.counts, a.dom, true);
  $('#b-detail').replaceChildren(...SINS.flatMap((sin, s) => {
    const mine = ids.filter(id => QUESTIONS[id].s === s);
    if (!mine.length) return [];
    return [el('h3', { textContent: sin.name }), el('ul', {}, ...mine.map(id => el('li', {}, fr(QUESTIONS[id].text),
      ...(QUESTIONS[id].w === 3 ? [' ', el('small', { textContent: 'grave' })] : []))))];
  }));
  $('.detail').hidden = !ids.length;
  show('bilan', focus && $('#b-total'));
}

function renderCert() {
  const { v } = cert, d = details(v), mode = libreMode(), shown = mode === 'shown' ? oneLine(cert.text) : null;
  $('#no').textContent = `N° ${d.no}`;
  $('#date').textContent = d.date;
  $('#c-last').textContent = d.last;
  $('#libre-block').hidden = mode === 'none';
  $('#quote').hidden = !shown;
  $('#sealed').hidden = !!shown;
  $('#quote').textContent = shown ? fr(`« ${shown} »`) : '';
  $('#reveal').hidden = !(cert.mine && cert.text);
  $('#reveal').textContent = shown ? 'Resceller' : 'Briser le sceau';
  $('#reveal').setAttribute('aria-label', shown ? 'Resceller : retirer ma confession libre du certificat et du partage' : 'Briser le sceau : afficher ma confession libre sur le certificat et dans le partage');
  $('#sin').textContent = d.sin;
  gauge($('#gauge'), v.g);
  $('#level').textContent = d.level;
  $('#level-sr').textContent = ` (${v.g} sur 5)`;
  $('#c-total').textContent = `Profil · ${confessed(d.total)}`;
  profile($('#c-profile'), v.counts, v.dom, false);
  $('#remark').textContent = fr(d.remark);
  $('#prayers').textContent = d.prayers;
  $('#task').textContent = fr(d.penance);
  $('#task2').hidden = !d.penance2;
  $('#task2').textContent = d.penance2 ? fr(d.penance2) : '';
  document.title = `Certificat d’absolution · ${d.sin} — Absolution`;
  prepareImage(d, mode, shown);
}

function showVerdict(focus) {
  const { mine } = cert, card = $('#cert');
  $('#verdict').dataset.mode = mine ? 'mine' : 'shared';
  $('#share').className = mine ? 'btn primary' : 'btn';
  $('#again').className = mine ? 'link' : 'btn primary';
  $('#again').textContent = mine ? 'Nouvelle confession' : 'À votre tour de vous confesser';
  renderCert();
  show('verdict', focus && $('#cert-title'));
  card.classList.remove('in');
  void card.offsetWidth; // relance l’animation
  card.classList.add('in');
}

function render(screen, s, focus) {
  if (screen === 'exam') return showStep(s || 0, focus);
  if (screen === 'bilan') return showBilan(focus);
  if (screen === 'libre') return show('libre', focus && $('#libre h2'));
  if (screen === 'verdict') return showVerdict(focus);
  show('intro', focus && $('.formula'));
}

function go(screen, s = 0, hash = '') {
  history.pushState({ screen, step: s }, '', hash ? `#${hash}` : location.pathname);
  render(screen, s, true);
}

function route() {
  const v = decode(location.hash.slice(1));
  if (v) {
    if (!cert || cert.v.k !== v.k || !cert.mine) cert = { v, text: v.t, reveal: !!v.t, sealed: v.sealed, mine: false };
    return render('verdict');
  }
  const st = history.state;
  render(session && st && st.screen !== 'verdict' ? st.screen : 'intro', st?.step);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

async function copy(str) {
  try {
    await navigator.clipboard.writeText(str);
    return true;
  } catch {
    const t = el('textarea', { value: str });
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  }
}

function shareText() {
  const d = details(cert.v), q = libreMode() === 'shown' ? `« ${oneLine(cert.text)} »\n` : '';
  const bilan = d.total
    ? `${confessed(d.total).toLowerCase()}, surtout de ${article(d.sin)}${d.sin.toLowerCase()} (${d.level.toLowerCase()})`
    : 'aucun péché avoué, et le prêtre y voit de l’orgueil';
  return cert.mine
    ? `${q}Examen de conscience : ${bilan}. Ma pénitence : « ${d.penance} »\nEt toi, qu’as-tu à confesser ?`
    : `${q}Certificat d’absolution : ${bilan}. Pénitence : « ${d.penance} »`;
}

async function prepareImage(d, mode, text) {
  const job = ++imageJob;
  imageFile = null;
  $('#image').disabled = true;
  let blob = null;
  try {
    const canvas = await drawCert(cert.v, d, mode, text);
    blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', .9));
  } catch { /* pas d’image : le bouton reste désactivé */ }
  if (job !== imageJob || !blob) return;
  imageFile = new File([blob], `absolution-${d.no}.jpg`, { type: 'image/jpeg' });
  $('#image').disabled = false;
}

function reset() {
  session = null;
  cert = null;
  document.querySelectorAll('#sins input:checked').forEach(box => { box.checked = false; });
  input.value = '';
  input.dispatchEvent(new Event('input'));
}

/* ───────── Construction et événements ───────── */

LAST.forEach(([label], i) => {
  const b = el('button', { type: 'button', className: 'btn', textContent: label });
  b.addEventListener('click', () => {
    session = { last: i };
    go('exam', 0);
  });
  $('#last').append(b);
});

let qid = 0;
SINS.forEach((sin, s) => {
  const box = el('div', { className: 'sin', id: `sin-box-${s}`, hidden: true },
    el('p', { className: 'latin', lang: 'la', textContent: sin.latin }),
    el('h2', { id: `sin-${s}`, tabIndex: -1, textContent: sin.name }),
    el('p', { className: 'about', textContent: fr(sin.about) }),
  );
  box.setAttribute('role', 'group');
  box.setAttribute('aria-labelledby', `sin-${s}`);
  if (!s) box.append(el('p', { className: 'instr', textContent: 'Cochez ce qui vous concerne depuis votre dernière confession.' }));
  for (const [group, list] of Object.entries(sin.questions)) {
    box.append(el('h3', { className: 'group', textContent: group }));
    for (const [, text] of list) {
      box.append(el('label', { className: 'q' }, el('input', { type: 'checkbox', value: qid++ }), el('span', { textContent: fr(text) })));
    }
  }
  $('#sins').append(box);
});

$('#sins').addEventListener('change', updateNext);
$('#next').addEventListener('click', () => (step < SINS.length - 1 ? go('exam', step + 1) : go('bilan')));
$('#to-libre').addEventListener('click', () => go('libre'));
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => history.back()));

input.addEventListener('input', () => { $('#count').textContent = `${input.value.length} / ${MAX}`; });
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit ? form.requestSubmit() : submit.click();
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (submit.disabled || !session) return;
  const text = oneLine(input.value);
  submit.disabled = true;
  submit.textContent = 'Le prêtre écoute…';
  form.classList.add('busy');
  await new Promise(res => setTimeout(res, reduced ? 150 : 1100));
  cert = { v: assess(checkedIds(), session.last, text), text: text || null, reveal: false, sealed: false, mine: true };
  go('verdict', 0, encode(cert.v, libreMode(), cert.text));
  submit.disabled = false;
  submit.textContent = 'Recevoir l’absolution';
  form.classList.remove('busy');
});

$('#reveal').addEventListener('click', () => {
  cert.reveal = !cert.reveal;
  history.replaceState(history.state, '', `#${encode(cert.v, libreMode(), cert.text)}`);
  renderCert();
});

if (native) {
  $('#share svg path').setAttribute('d', 'M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7');
  $('#share span').textContent = 'Partager';
}

$('#share').addEventListener('click', async () => {
  if (native) {
    try {
      await navigator.share({ title: 'Mon certificat d’absolution', text: shareText(), url: shareURL() });
    } catch { /* partage annulé */ }
    return;
  }
  toast((await copy(shareURL())) ? 'Lien copié.' : 'Copie impossible : copiez l’adresse de la page.');
});

$('#image').addEventListener('click', async () => {
  if (!imageFile) return;
  if (coarse && navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({ files: [imageFile] });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  const a = el('a', { href: URL.createObjectURL(imageFile), download: imageFile.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Image téléchargée.');
});

$('#again').addEventListener('click', () => {
  if (cert?.mine) reset();
  go('intro');
});

addEventListener('popstate', route);
if (!history.state) history.replaceState({ screen: 'intro', step: 0 }, '');
input.dispatchEvent(new Event('input')); // le navigateur a pu restaurer le texte
route();
