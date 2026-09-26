# Limbes · maquette E — « l’île en 3D »

La maquette D, avec un vrai rendu 3D : pour évaluer ce que la 3D apporte, à parcours et grammaire identiques.

**→ https://chtabay.github.io/Absolution/limbes-e/**

## Ce qui est pareil que D

Les cases, la page, les feuilles, la lecture du texte, la grammaire (famille, espèce, taille, état), les cinq paysages, les formes, le climat, l’archipel inventé. E réutilise directement les fichiers de D. Le stockage est **partagé** : une île construite dans D apparaît dans E, et inversement, pour comparer la même île en 2D et en 3D.

## Ce qui change

- **Le relief.** Le sol est un vrai relief, lissé à partir de la carte de D, à facettes, coloré face par face selon la hauteur et la pente : plage, herbe, roche, neige, avec les plaques de couleur du paysage. Il descend sous l’eau.
- **La mer.** Transparente, avec son fond : on voit le sable sous l’eau près du bord, le bleu profond plus loin, et l’écume là où la terre sort de l’eau. La marée bouge à peine.
- **La lumière.** Un soleil qui porte des ombres douces, une lumière du ciel, un brouillard vers l’horizon, réglés pour chaque climat : jour, soir doux, crépuscule, brume du matin.
- **Les choses.** Des volumes à facettes : arbres (rond, étagé, peuplier, palmier, bouleau, hibiscus, sapin, pin élancé, cyprès, arbre nu), pierres (bloc, rocher, dalle, pierre levée gravée), maisons avec portes, marches, fenêtres, colombages, toits, cheminées, cultures, moulin qui tourne, feu qui danse, étang, barques qui tanguent, nuages, pluie et éclairs, phare au faisceau tournant, lueurs qui flottent.
- **Le mouvement.** On fait tourner l’île du doigt ; elle tourne seule, doucement, quand on la laisse. Des nuages passent, des oiseaux tournent, la mer scintille, d’autres îles se devinent au loin.
- **L’archipel.** Une mer au soir, les îles posées dessus en 3D, des voiliers ; toucher une île fait s’en approcher, et les nouvelles arrivent depuis l’horizon.
- **Les graines.** Un îlot flottant, en 3D, qui tourne sur lui-même, avec des cailloux qui flottent autour.

## Technique

three.js 0.186 (licence MIT), réduit aux pièces utilisées et embarqué dans `vendor/` : environ 550 ko, 140 ko à l’envoi. Aucune requête extérieure. Chaque chose est un assemblage de formes simples, colorées par sommet, fusionné en un ou deux maillages ; l’île entière d’un autre tient en un maillage. Sans WebGL, un message renvoie vers la maquette D.

- `modeles.js` : les choses en 3D, leurs formes, leurs états, le petit décor.
- `monde.js` : le relief, la mer, le ciel, la lumière, la caméra, l’île, l’archipel, l’îlot, les aperçus.
- `e.js` : le parcours (repris de D), branché sur la 3D.

## Ce qui est faux, ou à mesurer

- Comme dans D : les îles des autres sont inventées, rien ne part, le stockage n’est pas chiffré.
- La fluidité sur un téléphone ancien n’est pas mesurée. Pour situer : l’île pèse environ 30 000 triangles, l’archipel de 28 îles environ 126 000, sans ombres. Les ombres de l’île et la finesse du relief sont les premiers réglages à baisser si besoin.
