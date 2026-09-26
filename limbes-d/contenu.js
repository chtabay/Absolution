// Limbes — maquette D : le contenu (les cases de B, telles quelles).
// Sujets : [libellé, poids moral, poids relationnel, poids projet].

export const SUBJECTS = [
  ['j’ai fait du mal à quelqu’un', 3, 2, 0], ['j’ai menti, je cache quelque chose', 2, 2, 1], ['infidélité, désir pour un autre', 2, 3, 0],
  ['sexualité', 1, 1, 0], ['couple qui va mal', 0, 3, 0], ['famille', 0, 3, 0], ['argent, dettes', 1, 1, 2], ['travail, études', 1, 1, 3],
  ['alcool, drogue, addiction', 2, 1, 2], ['santé mentale', 0, 1, 2], ['corps, apparence', 0, 0, 1], ['ce qu’on m’a fait', 0, 2, 0],
  ['deuil, perte', 0, 2, 0], ['ce que je suis, ce que je crois', 0, 1, 2], ['un rêve, une envie', 0, 0, 3],
];
export const MORAL = ['s0', 's1', 's2', 's8', 's3', 's6', 's7'];
const bump = (scores, ids, n) => ids.forEach(id => { scores[id] = (scores[id] || 0) + n; });
export const QUESTIONS = {
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
export const KEYS = Object.keys(QUESTIONS);
export const BASE = ['situ', 'mots', 'sujets'];

export const LEX = {
  self: ['suicid', 'me tuer', 'en finir', "me foutre en l'air", 'me faire du mal', 'plus envie de vivre', 'envie de mourir', 'me pendre', 'me jeter sous', 'me jeter par', 'disparaitre pour de bon', 'me scarifi'],
  other: ['me frappe', 'me bat', 'me tape', "m'a frappe", 'des coups', 'viole', 'agresse', 'me menace', 'me force', "m'a force", 'va me tuer', 'peur de lui', "peur d'elle"],
  soft: ["j'en peux plus", "je n'en peux plus", 'a bout', 'panique', 'angoiss', 'je craque', 'trop lourd', 'plus la force', 'je tiens plus', 'je ne tiens plus'],
};

export const HUMANS = [
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

// L’archipel des autres est inventé : ces parts placent les îles.
export const MOCK = { total: 1214, quad: { AD: 27, ED: 41, AS: 14, ES: 18 } };
