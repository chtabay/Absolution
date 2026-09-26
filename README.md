# Absolution

Confessionnal virtuel. Examinez votre conscience, avouez, recevez votre pénitence et partagez votre certificat d’absolution.

**→ https://chtabay.github.io/Absolution/**

## Parcours

1. **Dernière confession** : « Pardonnez-moi, mon père, car j’ai péché. Ma dernière confession remonte à… »
2. **Examen de conscience** : 122 questions à cocher, en 7 étapes, une par péché capital, dans l’ordre traditionnel (Orgueil, Avarice, Luxure, Envie, Gourmandise, Colère, Paresse). Chaque étape est découpée en « envers les autres », « envers moi-même » et « envers Dieu ». On y retrouve les questions des examens de conscience des applications de confession : dix commandements et commandements de l’Église, rangés sous le péché capital dont ils découlent.
3. **Bilan** : nombre de péchés avoués, dont les graves, gravité (de « Broutille » à « Mortel »), profil sur les 7 péchés et détail des réponses. Ce détail n’apparaît que sur votre écran.
4. **Confession libre** : facultative et purement déclarative. Rien n’est analysé.
5. **Absolution** : certificat avec le péché dominant (le plus coché), la gravité, le profil, une remarque du prêtre et la pénitence (prières et gage moderne). Il se partage par lien, par partage natif sur mobile ou en image au format story (1080 × 1920).

Mêmes réponses, même verdict : le prêtre ne change pas d’avis.

## Limbes

Un autre concept : un endroit où l’on peut tout déposer, sans prêtre ni jugement. On coche quelques cases, on écrit si on veut, et une île en 3D pousse avec ce qu’on dépose. On peut la mettre dans un archipel, sans son nom.

**→ https://chtabay.github.io/Absolution/limbes/**

Tout est dans [`limbes/`](limbes/) : la grammaire qui fait pousser l’île, le rendu en 3D (three.js embarqué), l’archipel. Voir [`limbes/README.md`](limbes/README.md). Les anciennes adresses des maquettes renvoient vers cette page.

## Confidentialité

- Site 100 % statique : pas de serveur, pas de cookie, pas de traceur, aucune requête externe (polices incluses dans le dépôt).
- Les réponses ne quittent pas le navigateur. Le lien partagé ne contient que le bilan : nombre de péchés par péché capital, gravité, dernière confession. Jamais le détail des cases cochées.
- La confession libre reste **scellée** par défaut. « Briser le sceau » l’ajoute au certificat, au lien et à l’image. Dans le lien, tout est encodé après le `#`, une partie de l’adresse que le navigateur n’envoie jamais au serveur.

## Modifier le contenu

Tout est dans `contenu.js` : questions (avec leur poids : 1 léger, 2 sérieux, 3 grave), remarques du prêtre, pénitences et textes du bilan. Le code de l’application est dans `app.js`.

Tester en local :

```sh
python3 -m http.server
# puis http://localhost:8000
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page et ses cinq écrans |
| `style.css` | Le style |
| `contenu.js` | L’examen de conscience et tous les textes |
| `app.js` | Parcours, verdict, lien partageable, image du certificat |
| `fonts/` | EB Garamond et Cinzel (licence SIL OFL 1.1) |
| `og.png`, `favicon.svg`, `apple-touch-icon.png` | Aperçu des liens et icônes |
| `.nojekyll` | Sert les fichiers tels quels sur GitHub Pages |
| `404.html` | Page introuvable ; renvoie les anciennes adresses des maquettes vers `limbes/` |
| `limbes/` | Limbes, l’île en 3D (voir son README) |

Absolution non contractuelle, sans valeur sacramentelle.
