// Absolution — confessionnal virtuel.
// Tout se passe dans le navigateur : rien n’est envoyé, rien n’est stocké.
// Le verdict est déterministe : même confession, même sentence.

/* ───────── Contenu ─────────
   Mots-clés : radicaux sans accents, séparés par « | ». Un « $ » final impose la fin du mot. */

const SINS = [
  {
    name: 'Orgueil',
    words: 'orgueil|fier|vant|frime|ego$|egocentr|narciss|selfie|miroir|mepris|snob|humili|moqu|arrogan|pretenti|pretend|semblant|menti|mensong|mentir|bluff|vanite|je sais tout|raison$|critiqu|juge|influenc|followers|abonnes',
    penances: [
      'Dire « tu avais raison » à quelqu’un. À voix haute. Sans ajouter « mais ».',
      'Poster une photo de vous sans filtre. Au réveil.',
      'Laisser quelqu’un d’autre avoir le dernier mot. Deux fois.',
      'Tenir toute une conversation sans parler de vous.',
      'Demander votre chemin au lieu de faire semblant de savoir.',
      'Reconnaître une erreur en réunion. Avant qu’on la découvre.',
    ],
  },
  {
    name: 'Avarice',
    words: 'avar|radin|rapia|pingre|cupid|argent|fric|thune|pognon|oseille|euros?$|pourboire|rembours|dette|achet|depens|shopping|soldes|promo$|amazon|vinted|leboncoin|revend|cadeau|econom|vol$|vole|voler|chipe|fraud|resquill|ticket|impot|heritage|loto|casino|crypto|bitcoin|partag|addition|monnaie|paye|payer|paie$',
    penances: [
      'Payer la prochaine tournée, sans calculer au centime près.',
      'Laisser un vrai pourboire. Celui qui pique un peu.',
      'Rembourser enfin les 20 € que vous devez depuis 2019.',
      'Prêter votre chargeur sans demander quand on vous le rend.',
      'Partager vos frites. Les longues, pas les petites brûlées.',
      'Faire un don anonyme. Vraiment anonyme : sans le raconter.',
    ],
  },
  {
    name: 'Envie',
    words: 'jalou|envieu|convoit|ex$|stalk|espionn|profil|insta|story|stories|like|compar|rival|voisin|promotion|promu|augment|mieux que|plus belle|plus beau|reussi|succes|copie|rancun|aigri|frustr|ragot|potin|commer|medi|rumeur|dit du mal',
    penances: [
      'Liker sincèrement la photo de vacances de quelqu’un que vous jalousez.',
      'Féliciter un collègue pour sa promotion. En le pensant.',
      'Ne pas consulter le profil de votre ex pendant 30 jours.',
      'Faire trois compliments sincères avant ce soir.',
      'Vous désabonner de trois comptes qui vous donnent des complexes.',
      'Lister cinq choses que vous avez et que vous n’échangeriez pour rien.',
    ],
  },
  {
    name: 'Colère',
    words: 'coler|enerv|rage|furi|fache|vener|cri[ea]|hurl|gueul|engueul|insult|injur|klaxon|frapp|cogn|claqu|baff|gifl|tape$|bagarr|disput|clash|menac|vengean|venge|rale$|rala|peste|juron|grossier|doigt|agress|boude|deteste|haine|hai$|marre|exasper|plomb|cable|impatien|bouscul|arbitre|troll|automobiliste|conducteur|imprimante',
    penances: [
      'Écrire le message rageur. Ne pas l’envoyer. Le supprimer.',
      'Céder le passage à celui qui force. Avec le sourire.',
      'Compter jusqu’à dix avant chaque réponse, pendant toute une journée.',
      'Présenter vos excuses à l’imprimante.',
      'Accueillir la prochaine mise à jour Windows dans la sérénité.',
      'Laisser un avis 5 étoiles au service client qui vous a fait attendre.',
    ],
  },
  {
    name: 'Luxure',
    words: 'luxur|sex|couche avec|dormi avec|nuit avec|tromp|infidel|amant|maitress|flirt|dragu|embrass|bisou|pelo|galoch|tinder|bumble|grindr|hinge|meetic|match$|crush|nude|nus?$|nue$|porn|coquin|fantasm|desir|libid|excit|sensu|sedui|seduc|reluqu|mate$|charm|canon$|lingerie|plan cul|baise|calin|caress|rencard|ex$',
    penances: [
      'Une douche froide. Symbolique ou non.',
      'Mettre le téléphone dans une autre pièce après 23 h.',
      'Regarder un documentaire animalier sans la moindre arrière-pensée.',
      'Réciter mentalement la table de 7 au prochain regard appuyé.',
      'Relire vos messages de 2 h du matin. Et méditer.',
      'Supprimer l’historique. La tentation, aussi.',
    ],
  },
  {
    name: 'Gourmandise',
    words: 'gourmand|mang|bouff|grignot|devor|goinfr|englout|aval|dessert|gateau|chocolat|pizza|burger|frite|chips|bonbon|sucre|nutella|fromage|croissant|pain au|viennois|patiss|biscuit|cookie|kebab|tacos|mcdo|resto|buffet|glaces?$|creme|yaourt|frigo|regime|calori|kilo|faim|apero|biere|vins?$|alcool|bu$|boire|cuite|ivre|raclette|fondue|sushi|pates$|repas|gouter|deliveroo|uber ?eats?|livraison|tartine|soda|coca|champagne|cocktail|saucisson|crepe|gaufre|donut|beignet|macaron|dernier morceau|derniere part',
    penances: [
      'Racheter ce que vous avez mangé. En double.',
      'Un repas sans photo, sans sauce et sans dessert.',
      'Laisser la dernière part aux autres. Pour de vrai.',
      'Ranger les chips sur l’étagère la plus haute. Et oublier.',
      'Ne plus ouvrir le frigo « juste pour regarder » pendant 48 h.',
      'Manger une pomme en méditant sur vos choix de vie.',
    ],
  },
  {
    name: 'Paresse',
    words: 'paress|flemm|procrastin|glande|glandu|feignant|faineant|sieste|dormi$|dormir|grasse mat|canape|lit$|netflix|series?$|binge|episode|rien fait|pas fait|rien foutu|report|repouss|retard|oubli|e?mails?$|repondu|repondre|en vu$|ghost|menage|vaisselle|linge|poubelle|lessive|sport|footing|jogging|reveil|snooze|leve$|lever|pyjama|scroll|tiktok|youtube|jeux? video|console|playstation|xbox|devoirs|deadline|malade|arret maladie|teletravail|arrive dans|traine|piece jointe',
    penances: [
      'Faire aujourd’hui la tâche repoussée depuis trois semaines.',
      'Répondre à tous vos mails en attente. Même celui-là.',
      'Se lever au premier réveil demain. Sans négocier.',
      'Descendre les poubelles avant qu’on vous le demande.',
      'Prendre l’escalier au lieu de l’ascenseur pendant une semaine.',
      'Plier le linge qui attend sur la chaise depuis on ne sait quand.',
    ],
  },
];

const LEVELS = ['Broutille', 'Véniel', 'Sérieux', 'Grave', 'Mortel'];

// Remarques du prêtre, selon la gravité : légère (1-2), moyenne (3), lourde (4-5).
const REMARKS = [
  [
    'C’est tout ? J’ai interrompu ma sieste pour ça.',
    'Péché de débutant. Tout le monde commence quelque part.',
    'Le Ciel a d’autres chats à fouetter. Mais c’est noté.',
    'Pardonné avant même la fin de votre phrase.',
  ],
  [
    'Le Seigneur a vu. Il a même fait une capture d’écran.',
    'Classique. C’est la troisième fois qu’on me la fait aujourd’hui.',
    'Rien d’irréparable. Enfin, presque.',
    'Même les saints ont connu des mardis difficiles.',
  ],
  [
    'Je vais devoir en référer à mon supérieur. Tout là-haut.',
    'Le purgatoire vous garde une place. Côté fenêtre.',
    'J’ai entendu pire. Pas souvent. Et pas aujourd’hui.',
    'Il va me falloir un moment. Et un verre de vin de messe.',
  ],
];

// Le prêtre écoute vraiment : certains mots appellent une remarque (et pèsent sur la gravité).
const SPECIAL = [
  { re: /\baccus/, g: 1, say: 'Et en plus, vous avez accusé un innocent. C’est noté.' },
  { re: /\bencore\b/, g: 1, say: '« Encore » ? J’ai bien entendu « encore » ?' },
  { re: /\b(tous les jours|chaque jour|chaque fois|toujours|tout le temps|souvent)\b/, g: 1, say: 'À ce rythme, ce n’est plus un péché : c’est un abonnement.' },
  { re: /\b(juste|un peu|seulement|a peine|un petit|une petite)\b/, g: 1, say: '« Juste un peu » ? Minimiser, c’est déjà récidiver.' },
  { re: /\b(accident|pas fait expres|sans faire expres|sans le vouloir|par erreur)\b/, g: 0, say: '« Sans faire exprès »… C’est ce qu’ils disent tous.' },
];

const EXAMPLES = [
  'J’ai mangé le dernier yaourt de mon coloc et j’ai accusé le chat.',
  'J’ai laissé un message en « vu » pendant trois semaines.',
  'J’ai liké une photo de mon ex datant de 2017. À 3 h du matin.',
  'J’ai dit « j’arrive dans 5 minutes » alors que j’étais encore sous la douche.',
  'J’ai revendu le cadeau d’anniversaire de ma tante sur Vinted.',
  'J’ai insulté un automobiliste. Il ne m’a pas entendu, mais quand même.',
  'J’ai fait semblant d’avoir lu le livre. J’ai juste vu le film.',
  'J’ai commandé une pizza en plein régime et caché la boîte chez le voisin.',
  'J’ai répondu « bien reçu » sans avoir ouvert la pièce jointe.',
  'J’ai posé un arrêt maladie pour finir ma série.',
  'J’ai secrètement jalousé le bronzage de mon collègue.',
  'J’ai claqué la porte au nez de l’imprimante. Elle l’avait cherché.',
];

/* ───────── Verdict ───────── */

const MAX = 280;
const SIN_RE = SINS.map(s => new RegExp(`\\b(?:${s.words.replace(/\$/g, '\\b')})`, 'g'));

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/€/g, ' euros ').replace(/[’‘`´]/g, "'")
  .replace(/[^a-z0-9' ]+/g, ' ').replace(/ +/g, ' ').trim();

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
const today = () => { const n = new Date(); return Math.round(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 864e5); };

// Typographie française : apostrophes courbes, espaces fines insécables.
const fr = s => s.replace(/'/g, '’').replace(/ ([?!:;»])/g, '\u202f$1').replace(/« /g, '«\u202f');
const oneLine = s => s.replace(/\s+/g, ' ').trim();

function judge(text) {
  const n = norm(text), k = hash(n || text), r = rng(k);
  const scores = SIN_RE.map(re => (n.match(re) || []).length);
  const best = Math.max(...scores);
  const s = pick(r, scores.flatMap((score, i) => (score === best ? [i] : [])));
  const x = SPECIAL.findIndex(sp => sp.re.test(n)) + 1;
  const g = clamp(pick(r, [1, 2, 2, 3, 3, 3, 4, 4, 5]) + (x ? SPECIAL[x - 1].g : 0), 1, 5);
  return { k, s, g, x, d: today() };
}

function prayers(g, r) {
  if (g === 5) return 'Un chapelet entier. À genoux.';
  const pater = [0, 1, 2, 5][g - 1] + (g > 1 ? Math.floor(r() * 2) : 0);
  const ave = [1, 3, 5, 10][g - 1] + Math.floor(r() * (g > 1 ? 3 : 2));
  return `${pater ? `${pater} Notre Père et ` : ''}${ave} Je vous salue Marie`;
}

function details(v) {
  const r = rng(v.k ^ 0x5bd1e995), sin = SINS[v.s];
  return {
    sin: sin.name,
    level: LEVELS[v.g - 1],
    penance: pick(r, sin.penances),
    remark: v.x ? SPECIAL[v.x - 1].say : pick(r, REMARKS[v.g < 3 ? 0 : v.g < 4 ? 1 : 2]),
    prayers: prayers(v.g, r),
    no: v.k.toString(36).toUpperCase().padStart(7, '0').replace(/^(...)/, '$1-'),
    date: new Date(v.d * 864e5).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

/* ───────── Lien partageable ─────────
   #k.s.g.x.d[.texte] — entiers en base 36, texte (facultatif) en base64url.
   Le fragment « # » n’est jamais transmis au serveur. */

const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

const encode = (v, text) => [v.k, v.s, v.g, v.x, v.d].map(n => n.toString(36)).concat(text ? [b64(text)] : []).join('.');

function decode(frag) {
  try {
    const [k, s, g, x, d, t] = frag.split('.');
    const v = { k: parseInt(k, 36), s: parseInt(s, 36), g: parseInt(g, 36), x: parseInt(x, 36), d: parseInt(d, 36) };
    const ok = v.k >= 0 && v.k < 2 ** 32 && SINS[v.s] && v.g >= 1 && v.g <= 5 && v.x >= 0 && v.x <= SPECIAL.length && v.d > 0 && v.d < 1e5;
    return ok ? { ...v, t: t ? oneLine(unb64(t)).slice(0, MAX) || null : null } : null;
  } catch {
    return null;
  }
}

/* ───────── Image à partager (1080 × 1350) ───────── */

const INK = '#2b1d12', INK_SOFT = '#6b5642', RED = '#a3212a';
const SERIF = '"EB Garamond", Georgia, serif', CAPS = 'Cinzel, Georgia, serif';
const FONTS = [`700 20px ${CAPS}`, `600 20px ${CAPS}`, `400 20px ${SERIF}`, `italic 400 20px ${SERIF}`];

function spaced(x, str, cx, y, gap) { // texte centré, lettres espacées
  const chars = [...str], w = chars.map(ch => x.measureText(ch).width);
  let px = cx - (w.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)) / 2;
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
  x.setLineDash([5, 7]); x.lineCap = 'round'; x.lineWidth = 10; x.stroke(); x.setLineDash([]);
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 3;
  x.beginPath(); x.arc(cx, cy, r * .72, 0, 2 * Math.PI); x.stroke();
  x.fillStyle = 'rgba(0,0,0,.28)';
  x.fillRect(cx - r * .1, cy - r * .57, r * .2, r * 1.14);
  x.fillRect(cx - r * .4, cy - r * .29, r * .8, r * .19);
  x.restore();
}

function stamp(x, cx, cy, seed) {
  const w = 440, h = 260, s = document.createElement('canvas');
  s.width = w; s.height = h;
  const o = s.getContext('2d');
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

async function drawCert(v, d, text) {
  await Promise.all(FONTS.map(f => document.fonts.load(f).catch(() => {})));
  const W = 1080, H = 1350, M = 60, TOP = M, BOTTOM = H - 170, cx = W / 2;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const set = (font, color) => { x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; };

  // Fond et parchemin
  x.fillStyle = '#0d0a08'; x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(cx, -150, 0, cx, -150, 1100);
  glow.addColorStop(0, 'rgba(217,169,78,.35)'); glow.addColorStop(1, 'rgba(217,169,78,0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  const paper = x.createRadialGradient(cx, TOP, 0, cx, TOP, 1300);
  paper.addColorStop(0, '#fbf6ec'); paper.addColorStop(.45, '#f5edde'); paper.addColorStop(1, '#e8d8b8');
  x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 60; x.shadowOffsetY = 24;
  x.fillStyle = paper; x.fillRect(M, TOP, W - 2 * M, BOTTOM - TOP); x.restore();
  x.strokeStyle = 'rgba(122,90,48,.55)';
  x.lineWidth = 2; x.strokeRect(M + 18, TOP + 18, W - 2 * M - 36, BOTTOM - TOP - 36);
  x.lineWidth = 1; x.strokeRect(M + 25, TOP + 25, W - 2 * M - 50, BOTTOM - TOP - 50);
  const rule = (y, half) => { x.strokeStyle = 'rgba(122,90,48,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx - half, y); x.lineTo(cx + half, y); x.stroke(); };

  // En-tête
  set(`700 30px ${CAPS}`, INK); spaced(x, 'CERTIFICAT D’ABSOLUTION', cx, TOP + 100, 8);
  set(`400 30px ${SERIF}`, INK_SOFT); x.fillText(`N° ${d.no} · ${d.date}`, cx, TOP + 148);

  // Corps : blocs empilés, centrés verticalement
  const blocks = [];
  if (text) {
    let font, lh, ls;
    for (const size of [46, 40, 34, 30]) {
      font = `italic 400 ${size}px ${SERIF}`; lh = size * 1.3;
      ls = lines(x, fr(`« ${text} »`), font, 800, 6);
      if (ls.length * lh <= 250) break;
    }
    blocks.push({ h: ls.length * lh, draw: y => { set(font, INK); ls.forEach((l, i) => x.fillText(l, cx, y + lh * (i + .5))); } });
  } else {
    blocks.push({ h: 175, draw: y => {
      seal(x, cx, y + 46, 42);
      set(`italic 400 36px ${SERIF}`, INK_SOFT); x.fillText('Confession scellée', cx, y + 130);
      set(`700 18px ${CAPS}`, INK_SOFT); spaced(x, 'SECRET DE LA CONFESSION', cx, y + 166, 5);
    } });
  }
  blocks.push({ h: 180, draw: y => {
    const c1 = cx - 210, c2 = cx + 210;
    rule(y, 380); rule(y + 180, 380);
    set(`700 20px ${CAPS}`, INK_SOFT); spaced(x, 'PÉCHÉ', c1, y + 42, 6); spaced(x, 'GRAVITÉ', c2, y + 42, 6);
    set(`700 54px ${CAPS}`, INK);
    const wSin = x.measureText(d.sin.toUpperCase()).width;
    if (wSin > 390) x.font = `700 ${Math.floor(54 * 390 / wSin)}px ${CAPS}`;
    x.fillText(d.sin.toUpperCase(), c1, y + 108);
    for (let i = 0; i < 5; i++) {
      const gx = c2 - 68 + i * 34, gy = y + 92;
      x.beginPath(); x.moveTo(gx, gy - 11); x.lineTo(gx + 11, gy); x.lineTo(gx, gy + 11); x.lineTo(gx - 11, gy); x.closePath();
      x.fillStyle = x.strokeStyle = RED; x.lineWidth = 2.5;
      if (i < v.g) x.fill(); else x.stroke();
    }
    set(`italic 400 36px ${SERIF}`, INK); x.fillText(d.level, c2, y + 138);
  } });
  const rl = lines(x, fr(d.remark), `italic 400 32px ${SERIF}`, 760, 2);
  blocks.push({ h: rl.length * 42, draw: y => { set(`italic 400 32px ${SERIF}`, INK_SOFT); rl.forEach((l, i) => x.fillText(l, cx, y + 42 * (i + .5))); } });
  const tl = lines(x, fr(d.penance), `400 34px ${SERIF}`, 800, 3);
  blocks.push({ h: 96 + tl.length * 46, draw: y => {
    set(`700 20px ${CAPS}`, INK_SOFT); spaced(x, 'PÉNITENCE', cx, y + 12, 6);
    set(`400 34px ${SERIF}`, INK); x.fillText(d.prayers, cx, y + 64);
    tl.forEach((l, i) => x.fillText(l, cx, y + 96 + 46 * (i + .5)));
  } });

  const areaTop = TOP + 190, areaH = BOTTOM - 175 - areaTop;
  const sum = blocks.reduce((a, b) => a + b.h, 0);
  const gap = clamp((areaH - sum) / (blocks.length + 1), 18, 60);
  let y = areaTop + (areaH - sum - gap * (blocks.length - 1)) / 2;
  for (const b of blocks) { b.draw(y); y += b.h + gap; }

  // Pied : envoi et tampon
  set(`italic 400 40px ${SERIF}`, INK); x.textAlign = 'left'; x.fillText('Allez en paix.', M + 90, BOTTOM - 95);
  stamp(x, W - M - 230, BOTTOM - 105, v.k);

  // Signature du site
  set(`600 34px ${CAPS}`, '#f3cf85'); spaced(x, 'ABSOLUTION', cx, BOTTOM + 68, 12);
  set(`italic 400 27px ${SERIF}`, '#a89a88'); x.fillText((location.host + location.pathname).replace(/\/(index\.html)?$/, ''), cx, BOTTOM + 112);
  return c;
}

/* ───────── Interface ───────── */

const $ = s => document.querySelector(s);
const form = $('#form'), input = $('#text'), submit = $('#submit');
const coarse = matchMedia('(pointer: coarse)').matches;
const native = coarse && !!navigator.share; // mobile : feuille de partage du système ; ailleurs : copie du lien
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TITLE = document.title;

let state = null; // { v, text, reveal, mine }
let imageFile = null, imageJob = 0, toastTimer;

const shareURL = () => `${location.origin}${location.pathname}#${encode(state.v, state.reveal ? state.text : null)}`;

function shareText() {
  const d = details(state.v), q = state.reveal && state.text ? `« ${state.text} »\n` : '';
  const verdict = `Péché : ${d.sin} (${d.level.toLowerCase()}). Pénitence : ${d.penance}`;
  return state.mine ? `${q}Je viens de me confesser. ${verdict}\nEt toi, qu’as-tu à confesser ?` : `${q}Certificat d’absolution. ${verdict}`;
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
    const t = Object.assign(document.createElement('textarea'), { value: str });
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  }
}

async function prepareImage(d, text) {
  const job = ++imageJob;
  imageFile = null;
  $('#image').disabled = true;
  let blob = null;
  try {
    const canvas = await drawCert(state.v, d, text);
    blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', .9));
  } catch { /* pas d’image : le bouton reste désactivé */ }
  if (job !== imageJob || !blob) return;
  imageFile = new File([blob], `absolution-${d.no}.jpg`, { type: 'image/jpeg' });
  $('#image').disabled = false;
}

function renderCert() {
  const { v, text, reveal } = state, d = details(v), shown = reveal && text ? oneLine(text) : null;
  $('#no').textContent = `N° ${d.no}`;
  $('#date').textContent = d.date;
  $('#quote').hidden = !shown;
  $('#sealed').hidden = !!shown;
  $('#quote').textContent = shown ? fr(`« ${shown} »`) : '';
  $('#reveal').textContent = shown ? 'Resceller' : 'Briser le sceau';
  $('#reveal').setAttribute('aria-label', shown ? 'Resceller : retirer ma confession du certificat et du partage' : 'Briser le sceau : afficher ma confession sur le certificat et dans le partage');
  $('#sin').textContent = d.sin;
  document.querySelectorAll('#gauge i').forEach((el, i) => el.classList.toggle('on', i < v.g));
  $('#level').textContent = d.level;
  $('#level-sr').textContent = ` (${v.g} sur 5)`;
  $('#remark').textContent = fr(d.remark);
  $('#prayers').textContent = d.prayers;
  $('#task').textContent = fr(d.penance);
  document.title = `Certificat d’absolution · ${d.sin} — Absolution`;
  prepareImage(d, shown);
}

function showForm() {
  document.body.classList.remove('judged');
  $('#verdict').hidden = true;
  $('#confess').hidden = false;
  document.title = TITLE;
}

function showVerdict(focus) {
  const { mine } = state, sec = $('#verdict'), cert = $('#cert');
  $('#confess').hidden = true;
  sec.hidden = false;
  sec.dataset.mode = mine ? 'mine' : 'shared';
  document.body.classList.add('judged');
  $('#share').className = mine ? 'btn primary' : 'btn';
  $('#again').className = mine ? 'link' : 'btn primary';
  $('#again').textContent = mine ? 'Nouvelle confession' : 'À votre tour de vous confesser';
  renderCert();
  cert.classList.remove('in');
  void cert.offsetWidth; // relance l’animation
  cert.classList.add('in');
  scrollTo(0, 0);
  if (focus) $('#cert-title').focus({ preventScroll: true });
}

function route() {
  const v = decode(location.hash.slice(1));
  if (!v) return showForm();
  if (!state || state.v.k !== v.k || !state.mine) state = { v, text: v.t, reveal: !!v.t, mine: false };
  showVerdict(false);
}

input.addEventListener('input', () => {
  $('#count').textContent = `${input.value.length} / ${MAX}`;
  $('#error').textContent = '';
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit ? form.requestSubmit() : submit.click();
  }
});

$('#inspire').addEventListener('click', () => {
  let t;
  do t = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]; while (t === input.value);
  input.value = t;
  input.dispatchEvent(new Event('input'));
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (submit.disabled) return;
  const text = oneLine(input.value);
  if (text.replace(/\s/g, '').length < 3) {
    $('#error').textContent = 'Le silence n’est pas une confession.';
    input.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Le prêtre écoute…';
  form.classList.add('busy');
  await new Promise(res => setTimeout(res, reduced ? 150 : 1100));
  state = { v: judge(text), text, reveal: false, mine: true };
  history.pushState(null, '', `#${encode(state.v)}`);
  showVerdict(true);
  submit.disabled = false;
  submit.textContent = 'Se confesser';
  form.classList.remove('busy');
});

$('#reveal').addEventListener('click', () => {
  state.reveal = !state.reveal;
  history.replaceState(null, '', `#${encode(state.v, state.reveal ? state.text : null)}`);
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
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(imageFile), download: imageFile.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Image téléchargée.');
});

$('#again').addEventListener('click', () => {
  history.pushState(null, '', location.pathname);
  if (state?.mine) input.value = '';
  input.dispatchEvent(new Event('input'));
  showForm();
  scrollTo(0, 0);
  if (!coarse) input.focus();
});

addEventListener('popstate', route);
input.dispatchEvent(new Event('input')); // le navigateur a pu restaurer le texte
route();
