# Asbolution

Confessionnal virtuel. Avouez, recevez votre pénitence, partagez votre certificat d’absolution.

**→ https://chtabay.github.io/Asbolution/**

## Principe

1. Vous écrivez votre confession (280 caractères maximum).
2. Le prêtre repère le péché capital, évalue la gravité, fait une remarque et fixe la pénitence.
3. Vous partagez le certificat : lien, partage natif sur mobile, ou image (1080 × 1350).

Même confession, même verdict : le prêtre ne change pas d’avis.

## Confidentialité

- Site 100 % statique : pas de serveur, pas de cookie, pas de traceur, aucune requête externe (polices incluses dans le dépôt).
- La confession ne quitte pas le navigateur. Par défaut, elle reste **scellée** : le lien et l’image ne contiennent que le verdict.
- « Briser le sceau » l’ajoute au certificat, au lien et à l’image. Dans le lien, elle est encodée après le `#`, une partie de l’adresse que le navigateur n’envoie jamais au serveur.

## Mise en ligne

Dans le dépôt GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch → `main` / `(root)` → Save**. Le site est en ligne une minute plus tard.

## Modifier

Tout le contenu (péchés et mots-clés, pénitences, remarques du prêtre, exemples) est en tête de `app.js`.

Tester en local :

```sh
python3 -m http.server
# puis http://localhost:8000
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page |
| `style.css` | Le style |
| `app.js` | Contenu, verdict, lien partageable, génération de l’image |
| `fonts/` | EB Garamond et Cinzel (licence SIL OFL 1.1) |
| `og.png`, `favicon.svg`, `apple-touch-icon.png` | Aperçu des liens et icônes |
| `.nojekyll` | Sert les fichiers tels quels sur GitHub Pages |

Absolution non contractuelle, sans valeur sacramentelle.
