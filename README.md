# Limbes

Un endroit où l’on peut tout déposer, sans jugement. On coche quelques cases, on écrit si on veut, et une île en 3D pousse avec ce qu’on dépose. Quand on veut, on la met dans un archipel, sans son nom.

**→ https://chtabay.github.io/Absolution/limbes/**

Tout est dans [`limbes/`](limbes/) : le parcours, la grammaire qui fait pousser l’île, le rendu en 3D (three.js embarqué) et l’archipel. Voir [`limbes/README.md`](limbes/README.md).

## Confidentialité

- Site 100 % statique : pas de serveur, pas de cookie, pas de traceur, aucune requête externe. La police et la bibliothèque 3D sont dans le dépôt.
- Ce qu’on dépose reste sur le téléphone. Le texte y est lu, pour proposer des sujets, et n’en sort jamais.
- Pour l’instant, les îles des autres dans l’archipel sont inventées : rien ne part.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `limbes/` | L’application (voir son README) |
| `fonts/` | Nunito (licence SIL OFL 1.1) |
| `index.html` | Ouvre Limbes depuis la racine du site |
| `404.html` | Page introuvable ; renvoie les anciennes adresses des maquettes vers `limbes/` |
| `.nojekyll` | Sert les fichiers tels quels sur GitHub Pages |

Tester en local, depuis la racine du dépôt :

```sh
python3 -m http.server
# puis http://localhost:8000/limbes/
```
