# Limbes · maquette D — « l’île »

Les cases de B, une île en low poly qui pousse avec ce qu’on y dépose, et un archipel où la mettre.

**→ https://chtabay.github.io/Absolution/limbes-d/** · la planche de tout ce qui peut pousser : **[planche.html](https://chtabay.github.io/Absolution/limbes-d/planche.html)**

## L’idée

Une confession ne se réduit pas à quelques nombres : elle garde toutes ses cases (un « dépôt »), et l’île est recalculée à partir des dépôts. Chaque dépôt fait pousser une ou plusieurs choses, d’après une grammaire ; un sujet redit fait grandir la même chose au lieu d’en faire une deuxième. Quand on veut, on change d’île : celle d’avant reste, et peut rejoindre l’archipel, où l’on voit les îles des autres arriver.

## La grammaire : quatre axes lus dans les cases

La grammaire est dans `grammaire.js`. Elle lit les cases. Le texte, lui, est lu par `lexique.js`, sur l’appareil seulement, pour **proposer** des sujets et une sensation : rien ne pousse du texte sans que la personne l’ait confirmé à la fin. Sur l’île, le texte ne fait qu’une lueur.

| Axe | D’après | Ce que ça fait |
| --- | --- | --- |
| **1. La place** (d’où ça vient) | le sujet coché, déplacé par « on m’a fait du mal » ou la question de plus | **la famille** : *reçu* → un arbre, dans la forêt ; *commis ou voulu* → une pierre, sur la colline ; *entre vous* → une construction, dans le village ; *soi et ce qui vient* → une culture, dans les champs ; *une sensation sans sujet* → le temps qu’il fait |
| **2. La sensation** (comment c’est ressenti) | le quadrant des mots : agité ou éteint × douloureux ou supportable | **l’espèce** : voir le tableau ci-dessous |
| **3. Le temps** (depuis quand) | récent, depuis longtemps, il y a longtemps ; plus d’une fois, ça continue | **la taille** : jeune, adulte, vieux ; un sujet redit grandit d’un cran (bosquet, pierre levée, hameau, moulin) ; « plus d’une fois » met en deux |
| **4. Le silence** (qui le sait) | jamais dit, personne ne le sait, cette personne ne le sait pas, jamais parlé ; et la présence d’un texte | **l’état** : fermé (un creux, enterrée, porte close, couvert, en friche) ; une lueur s’il y a un texte, jamais son contenu |

Les espèces, famille × sensation :

| | agité, douloureux | éteint, douloureux | agité, supportable | éteint, supportable | sans mot |
| --- | --- | --- | --- | --- | --- |
| **arbre** (reçu) | pin | arbre nu | arbre | arbre en fleurs | arbre |
| **pierre** (commis, voulu) | pierre sombre | pierre moussue | cairn | galet | pierre |
| **construction** (entre vous) | clôture | maison aux volets fermés | pont | banc | maison |
| **culture** (soi, ce qui vient) | feu | puits | champ | barque | champ |
| **temps** (une sensation) | nuage d’orage | nuage de pluie | fleurs | étang | — |

Et les autres cases : *ça tourne en boucle* → un sentier usé autour ; *ça continue* → il pleut dessus ; *je regrette* → la mousse et des fleurs reprennent la pierre ; *jamais réparé* → la pierre est fendue ; *je me sens responsable* → un caillou au pied de l’arbre ; *danger* ou *peur de cette personne* → un phare sur la rive, qu’on peut toucher pour parler à quelqu’un ; *pas bien du tout* → le ciel se couvre.

## La composition : un dépôt complète l’île

- **Un sujet par graine.** Une confession qui parle de trois sujets fait pousser trois choses. Sans sujet, la situation seule fait déjà quelque chose : « on m’a fait du mal » → un arbre, « je regrette » → une pierre ; sinon la sensation laisse une trace (un nuage, des fleurs, un étang) ; rien du tout, un caillou posé, qui porte quand même les états (enterré, sentier usé).
- **Chaque quadrant coché laisse sa trace.** Le quadrant principal donne l’espèce ; les autres, un temps qu’il fait en plus (« tristesse et espoir » : une maison aux volets fermés, et des fleurs). Plus de mots dans un quadrant, plus grand le nuage.
- **Le texte propose, la personne confirme.** Le lexique local repère les sujets dont le texte parle (« ma mère », « des dettes ») ; ils apparaissent en transparence dans les graines, puis à cocher ou non avant de poser. Il donne aussi la sensation quand aucun mot n’est coché.
- **Un sujet redit fait grandir**, jamais une deuxième chose. Les arbres et les pierres suivent la sensation du jour (un arbre nu peut se couvrir de feuilles, une pierre sombre devenir un cairn) ; une construction ou une culture garde son espèce. Les états qui disent « aujourd’hui » (fermé, en boucle, il pleut) suivent le dernier dépôt ; les autres s’accumulent.
- **Le climat** de l’île suit la dernière confession : jour, soir doux, crépuscule, ciel gris.
- **Le placement** est par quartiers : la forêt à l’ouest, la colline de pierres au nord, le village au sud, les champs à l’est ; les barques à la rive, les cailloux sur la plage. Les positions ne bougent pas quand on ajoute.

## Le rendu

Low poly isométrique, dessiné en Canvas 2D, sans image ni bibliothèque. Trois tons par facette et une lumière qui vient de l’astre. Cinq climats suivent la dernière confession : grand jour, soir doux, crépuscule, brume du matin, et le jour ordinaire. Le socle a sa tranche d’eau et ses strates. Au bord de l’île, l’eau s’éclaircit et l’écume respire. Des oiseaux passent, la fumée monte des maisons éclairées, et les lueurs des textes flottent. Les graines apparaissent sur un îlot qui flotte au-dessus des questions. Dans l’archipel, au soir, les îles sont posées sur l’eau.

## Le parcours

1. **Les questions de B**, telles quelles. En haut, un bout de terre montre ce que les cases feraient pousser, en direct.
2. **Par où aller ?**, puis la page, comme en B et C.
3. **Terminer** : poser sur l’île (avec, si on veut, le texte gardé sur le téléphone), ou brûler.
4. **L’île** : ce qui vient de pousser, avec une phrase ; toucher une chose dit ce qu’elle est, d’après quelles cases, et depuis quand ; tourner ; le détail de ce qui a poussé, la grammaire en mots, et ce qui serait compté.
5. **Changer d’île** : celle-ci reste sur le téléphone (et se revoit), et peut rejoindre l’archipel sans nom : les autres verraient « une île avec deux arbres nus, une pierre et une maison », rien d’autre.
6. **L’archipel** : une mer au soir, les îles des autres placées par sensation (agité vers l’horizon, supportable à droite), sans se chevaucher, qui arrivent depuis l’horizon au fil de l’eau ; les tiennes, nommées. Toucher une île la montre de plus près et dit ce qu’elle porte. On y met son île d’aujourd’hui si on veut ; elle y grandit avec soi.

## Ce qui est faux dans la maquette

- Les îles des autres, et leurs arrivées, sont inventées (des dépôts au hasard passés par la même grammaire).
- Rien ne part : ton île, tes îles d’avant et les textes gardés restent sur ce téléphone, sans chiffrement.
- Une planète ou un ciel étoilé feraient aussi bien que l’archipel : ce qui serait transmis est le même résumé (des comptes par espèce, une sensation moyenne).

## Modifier

- `contenu.js` : les cases, les sujets et leurs poids, les mots-clés d’alerte, les numéros.
- `grammaire.js` : les familles par sujet, les espèces, les états, la composition, les phrases.
- `lexique.js` : les mots qui font proposer un sujet ou une sensation, lus sur l’appareil.
- `ile.js` : la carte, les quartiers, les sprites, le ciel selon le climat, l’archipel inventé.
- `d.js` : les écrans, les feuilles, le stockage local.
- `planche.html` : tout ce qui peut pousser, pour vérifier d’un coup d’œil.
