// Contenu du confessionnal : examen de conscience, remarques du prêtre, pénitences.
//
// L’examen suit les sept péchés capitaux, dans l’ordre traditionnel (Orgueil, Avarice,
// Luxure, Envie, Gourmandise, Colère, Paresse). Chaque péché regroupe les fautes qui en
// découlent, dont celles des dix commandements et des commandements de l’Église.
// Chaque question : [poids, texte]. Poids : 1 léger, 2 sérieux, 3 grave.

export const SINS = [
  {
    name: 'Orgueil',
    latin: 'Superbia',
    about: 'Se croire au-dessus des autres, et parfois de Dieu.',
    questions: {
      'Envers les autres': [
        [1, 'J’ai cherché à me faire admirer ou à attirer l’attention sur moi.'],
        [1, 'J’ai accordé une importance excessive à mon apparence ou à mon image.'],
        [1, 'J’ai menti ou exagéré pour me faire valoir : CV, réseaux sociaux, dîners.'],
        [2, 'J’ai récupéré le mérite du travail d’un autre.'],
        [2, 'J’ai regardé quelqu’un de haut : argent, origine, apparence, diplômes.'],
        [2, 'J’ai humilié ou ridiculisé quelqu’un.'],
        [1, 'J’ai jugé quelqu’un sévèrement, sans connaître sa situation.'],
        [1, 'J’ai refusé de reconnaître mes torts ou de demander pardon.'],
        [1, 'J’ai rejeté un conseil ou une critique par fierté.'],
        [1, 'J’ai voulu avoir raison à tout prix, quitte à blesser.'],
        [2, 'J’ai manqué de respect à mes parents ou je leur ai désobéi.'],
        [1, 'J’ai méprisé une autorité légitime : professeur, employeur, loi.'],
        [1, 'J’ai affiché des vertus que je n’ai pas.'],
        [2, 'J’ai donné le mauvais exemple ou entraîné quelqu’un à mal faire.'],
        [1, 'J’ai oublié de remercier ceux qui m’aident.'],
      ],
      'Envers Dieu': [
        [1, 'J’ai pensé n’avoir besoin ni de Dieu ni de pardon.'],
        [2, 'J’ai eu honte de ma foi ou je l’ai reniée devant les autres.'],
        [2, 'J’ai tourné en dérision la foi, les croyants ou ce qui est sacré.'],
        [1, 'J’ai consulté horoscope, voyance ou tarot, ou compté sur un porte-bonheur.'],
        [3, 'J’ai pratiqué le spiritisme, la magie ou l’occultisme.'],
        [2, 'J’ai péché en me disant que, de toute façon, Dieu pardonne.'],
        [3, 'J’ai caché un péché grave en confession, ou communié malgré lui.'],
      ],
    },
    remarks: [
      'Le premier des péchés capitaux. Évidemment, il vous fallait la première place.',
      'C’est par orgueil que les anges sont tombés. Vous êtes en bonne compagnie.',
      'L’humilité vous irait très bien. Elle va à tout le monde, vous verrez.',
    ],
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
    latin: 'Avaritia',
    about: 'Trop tenir à l’argent et aux biens, au détriment des autres.',
    questions: {
      'Envers les autres': [
        [2, 'J’ai volé quelque chose, même de peu de valeur.'],
        [1, 'J’ai gardé un objet trouvé ou emprunté au lieu de le rendre.'],
        [2, 'J’ai tardé à rembourser une dette, ou je ne l’ai jamais remboursée.'],
        [2, 'J’ai fraudé : impôts, assurance, aides sociales, transports sans billet.'],
        [2, 'J’ai été malhonnête au travail ou en affaires : notes de frais, factures, tromperie.'],
        [2, 'J’ai menti ou dissimulé pour obtenir de l’argent ou un avantage.'],
        [3, 'J’ai fait un faux serment ou un faux témoignage.'],
        [2, 'J’ai versé ou accepté un pot-de-vin, ou travaillé au noir.'],
        [3, 'J’ai exploité ou sous-payé quelqu’un qui travaillait pour moi.'],
        [1, 'J’ai abîmé le bien d’autrui ou le bien public sans le réparer.'],
        [1, 'J’ai téléchargé ou utilisé illégalement films, musique ou logiciels.'],
        [1, 'J’ai rechigné à partager ou à prêter ce que j’avais.'],
        [1, 'J’ai fermé les yeux sur la misère des autres sans rien donner.'],
        [1, 'J’ai revendu un cadeau, ou compté ce que « valait » un geste d’amitié.'],
      ],
      'Envers moi-même': [
        [1, 'J’ai dépensé sans compter pour des choses inutiles, par envie de posséder.'],
        [1, 'J’ai surconsommé ou gaspillé : énergie, eau, objets jetables.'],
        [2, 'J’ai joué de l’argent de façon excessive : paris, casino, jeux en ligne.'],
        [1, 'J’ai fait passer l’argent ou la carrière avant ma famille et mes amis.'],
      ],
      'Envers Dieu': [
        [1, 'J’ai mis ma sécurité dans l’argent plutôt qu’en Dieu.'],
        [1, 'Je n’ai soutenu ni l’Église ni aucune œuvre, alors que j’en avais les moyens.'],
      ],
    },
    remarks: [
      'Heureusement pour vous, le pardon est gratuit.',
      'On n’emporte rien là-haut. Pas même les points de fidélité.',
      'L’argent ne fait pas le bonheur. Il ne fait pas non plus l’absolution.',
    ],
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
    name: 'Luxure',
    latin: 'Luxuria',
    about: 'Le désir détaché de l’amour et du respect.',
    questions: {
      'Envers les autres': [
        [3, 'J’ai trompé mon ou ma partenaire.'],
        [1, 'J’ai flirté ou entretenu une ambiguïté alors que j’étais en couple.'],
        [2, 'J’ai eu des relations sexuelles hors mariage.'],
        [3, 'J’ai payé pour des relations ou des contenus sexuels.'],
        [1, 'J’ai échangé des messages, photos ou vidéos à caractère sexuel.'],
        [1, 'J’ai regardé les autres avec convoitise, comme des objets.'],
        [1, 'J’ai séduit quelqu’un sans sincérité, pour me prouver quelque chose.'],
        [1, 'J’ai manqué d’attention ou de respect envers mon ou ma partenaire dans l’intimité.'],
        [1, 'J’ai tenu des propos ou fait des blagues obscènes.'],
      ],
      'Envers moi-même': [
        [1, 'J’ai entretenu volontairement des pensées ou des désirs impurs.'],
        [2, 'J’ai regardé de la pornographie.'],
        [2, 'J’ai eu des plaisirs solitaires.'],
        [1, 'J’ai fait défiler des profils ou des photos pour le frisson.'],
      ],
    },
    remarks: [
      'Je vais faire comme si je n’avais rien lu.',
      'Même le confessionnal a rougi.',
      'La chair est faible. Je note que la vôtre l’est particulièrement.',
    ],
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
    name: 'Envie',
    latin: 'Invidia',
    about: 'S’attrister du bonheur des autres, se réjouir de leurs malheurs.',
    questions: {
      'Envers les autres': [
        [1, 'J’ai éprouvé de la jalousie devant la réussite, la beauté ou le bonheur d’un autre.'],
        [2, 'J’ai secrètement savouré l’échec ou le malheur de quelqu’un.'],
        [2, 'J’ai dit du mal de quelqu’un dans son dos.'],
        [3, 'J’ai répandu des rumeurs ou des accusations fausses sur quelqu’un.'],
        [2, 'J’ai colporté des ragots ou trahi un secret qu’on m’avait confié.'],
        [1, 'J’ai rabaissé la réussite des autres pour me sentir mieux.'],
        [1, 'J’ai refusé de féliciter quelqu’un, par dépit.'],
        [2, 'J’ai semé la zizanie ou monté des gens les uns contre les autres.'],
        [2, 'J’ai freiné ou saboté la réussite d’un collègue ou d’un proche.'],
        [2, 'J’ai désiré une personne déjà engagée ailleurs.'],
        [1, 'J’ai convoité les biens des autres au point d’en perdre la paix.'],
      ],
      'Envers moi-même': [
        [1, 'J’ai comparé ma vie à celle des autres sur les réseaux sociaux.'],
        [1, 'J’ai espionné le profil d’un ex ou d’un rival.'],
        [1, 'J’ai eu du mal à me contenter de ce que j’ai.'],
      ],
    },
    remarks: [
      'L’herbe est toujours plus verte chez le voisin. Surtout sur Instagram.',
      'Les autres ne vivent pas mieux que vous. Ils le postent mieux.',
      'L’envie est le seul péché qui ne procure aucun plaisir. Quel gâchis.',
    ],
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
    name: 'Gourmandise',
    latin: 'Gula',
    about: 'L’excès de table et de boisson, et tout ce qui s’avale sans mesure.',
    questions: {
      'Envers moi-même': [
        [1, 'J’ai mangé au-delà de ma faim, par pure gourmandise.'],
        [1, 'J’ai grignoté en cachette, ou fini le paquet « pour ne pas le gâcher ».'],
        [2, 'J’ai bu jusqu’à l’ivresse.'],
        [2, 'J’ai consommé de la drogue.'],
        [1, 'J’ai abîmé ma santé par mes excès : alcool, sucre, tabac.'],
        [1, 'J’ai fait la fine bouche ou méprisé ce qu’on m’avait servi.'],
      ],
      'Envers les autres': [
        [3, 'J’ai pris le volant après avoir bu.'],
        [2, 'J’ai poussé quelqu’un à boire plus que de raison.'],
        [1, 'J’ai mangé la part des autres sans demander.'],
        [1, 'J’ai gaspillé de la nourriture.'],
        [1, 'J’ai dépensé sans mesure pour manger ou boire, quand d’autres manquent de tout.'],
      ],
      'Envers Dieu': [
        [1, 'Je n’ai pas respecté le jeûne ou l’abstinence : mercredi des Cendres, vendredi saint, vendredis de carême.'],
        [1, 'Je n’ai pas respecté le jeûne d’une heure avant la communion.'],
        [1, 'J’ai oublié de rendre grâce avant les repas.'],
      ],
    },
    remarks: [
      'La gourmandise est un vilain défaut. Mais quel défaut.',
      'Le Seigneur a multiplié les pains. Pas pour que vous les finissiez.',
      'Vous reprendrez bien un peu de pénitence ?',
    ],
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
    name: 'Colère',
    latin: 'Ira',
    about: 'Perdre patience, et parfois tout le reste.',
    questions: {
      'Envers les autres': [
        [1, 'J’ai laissé éclater ma colère : cris, portes claquées, objets jetés.'],
        [1, 'J’ai insulté quelqu’un, y compris au volant ou en ligne.'],
        [2, 'J’ai eu des paroles blessantes, humiliantes ou méprisantes.'],
        [3, 'J’ai eu un geste violent envers quelqu’un.'],
        [3, 'J’ai harcelé, intimidé ou menacé quelqu’un, en ligne ou en vrai.'],
        [2, 'J’ai souhaité du mal à quelqu’un.'],
        [2, 'J’ai nourri de la haine ou de la rancune.'],
        [2, 'J’ai refusé de pardonner.'],
        [2, 'J’ai cherché à me venger.'],
        [1, 'J’ai manqué de patience avec mes proches, mes collègues ou des inconnus.'],
        [1, 'J’ai boudé ou imposé un silence punitif.'],
        [1, 'J’ai alimenté des disputes ou des polémiques en ligne.'],
        [2, 'J’ai conduit de façon agressive ou dangereuse : vitesse, téléphone au volant.'],
        [2, 'J’ai maltraité un animal.'],
      ],
      'Envers Dieu': [
        [1, 'J’ai prononcé le nom de Dieu à la légère ou dans un juron.'],
        [3, 'J’ai blasphémé : insulté Dieu, les saints ou ce qui est sacré.'],
        [1, 'J’en ai voulu à Dieu de ce qui m’arrivait.'],
      ],
    },
    remarks: [
      'Respirez. Voilà. Maintenant, on peut parler.',
      'Tendez l’autre joue. Pas le poing.',
      'Même le Christ s’est mis en colère. Une fois. Pas tous les matins.',
    ],
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
    name: 'Paresse',
    latin: 'Acedia',
    about: 'Remettre à demain : le travail, les autres, et même Dieu.',
    questions: {
      'Au quotidien': [
        [1, 'J’ai négligé mon travail ou mes études : bâclé, remis à plus tard.'],
        [1, 'J’ai repoussé indéfiniment une tâche importante.'],
        [1, 'J’ai perdu des heures sur les écrans au détriment de ce que j’avais à faire.'],
        [2, 'J’ai triché à un examen ou copié le travail d’un autre.'],
        [1, 'J’ai menti par facilité, pour éviter une corvée, un conflit ou une responsabilité.'],
        [1, 'J’ai négligé ma santé par laisser-aller : sommeil, alimentation, soins.'],
        [1, 'J’ai cédé au découragement au point de ne plus rien entreprendre.'],
      ],
      'Envers les autres': [
        [1, 'J’ai laissé les autres faire ma part : tâches ménagères, travail d’équipe.'],
        [1, 'J’ai fait attendre les autres par négligence.'],
        [1, 'J’ai manqué à une promesse ou à un engagement.'],
        [2, 'J’ai négligé mes parents âgés ou des proches qui avaient besoin de moi.'],
        [2, 'J’ai négligé mon couple ou l’éducation de mes enfants, y compris religieuse.'],
        [2, 'J’ai vu quelqu’un dans le besoin sans lever le petit doigt.'],
        [1, 'J’ai négligé mes devoirs civiques, comme voter, par indifférence.'],
      ],
      'Envers Dieu': [
        [3, 'J’ai manqué la messe du dimanche ou d’une fête d’obligation sans raison grave.'],
        [1, 'J’ai assisté à la messe distraitement : en retard, téléphone en main, ou en partant avant la fin.'],
        [1, 'J’ai travaillé ou fait travailler le dimanche sans nécessité.'],
        [1, 'J’ai négligé la prière, ou je ne prie jamais.'],
        [2, 'J’ai laissé passer plus d’un an sans me confesser.'],
        [2, 'J’ai laissé passer Pâques sans communier.'],
        [1, 'J’ai manqué à une promesse faite à Dieu.'],
        [2, 'J’ai désespéré de la miséricorde de Dieu.'],
      ],
    },
    remarks: [
      'Dieu s’est reposé le septième jour. Pas les six autres.',
      'Vous auriez presque pu remettre cette confession à demain.',
      'Le purgatoire est une longue salle d’attente. Vous devriez vous y plaire.',
    ],
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

// Ancienneté de la dernière confession : [choix proposé, formule du certificat].
export const LAST = [
  ['Moins d’un mois', 'il y a moins d’un mois'],
  ['Moins d’un an', 'il y a moins d’un an'],
  ['Plus d’un an', 'il y a plus d’un an'],
  ['Jamais, ou je ne sais plus', 'jamais, ou il y a si longtemps…'],
];

export const LEVELS = ['Broutille', 'Véniel', 'Sérieux', 'Grave', 'Mortel'];

// Commentaire du bilan, selon la gravité (le premier : aucun péché coché).
export const VERDICTS = [
  'Aucun péché coché. Le prêtre aura sans doute un avis là-dessus.',
  'Quelques broutilles. Le Ciel en a vu d’autres.',
  'Des péchés véniels : rien qu’une bonne confession ne répare.',
  'Un examen sérieux. Vous avez bien fait de passer.',
  'Le bilan est lourd. Heureusement, vous êtes au bon endroit.',
  'Un bilan mortel. Mais aucun péché n’est trop grand pour le pardon.',
];

// Remarques du prêtre sur le certificat : légère (gravité 1-2), moyenne (3), lourde (4-5).
export const REMARKS = [
  [
    'C’est tout ? J’ai interrompu ma sieste pour ça.',
    'Péché de débutant. Tout le monde commence quelque part.',
    'Le Ciel a d’autres chats à fouetter. Mais c’est noté.',
    'Pardon accordé avant même la fin de votre phrase.',
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

// Remarques réservées à des cas particuliers.
export const SPECIAL = {
  none: 'Rien à vous reprocher ? C’est précisément de l’orgueil.',
  all: 'Les sept péchés capitaux. Le grand chelem. Respect.',
  first: 'Une première confession ? Il était temps.',
  many: 'Il va me falloir un moment. Et un verre de vin de messe.',
};
