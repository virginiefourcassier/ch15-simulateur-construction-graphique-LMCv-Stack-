# Construire l'image d'un objet par une lentille convergente

Simulation interactive (seconde) : l'élève construit lui-même les trois trajets lumineux remarquables issus de B, place B', puis construit l'image réelle A'B'. Le logiciel ne trace jamais un rayon à sa place.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | L'application complète, **autonome** (HTML + CSS + JavaScript + SVG, aucune dépendance externe, fonctionne hors ligne). |
| `tests/tests-geometrie.js` | Tests automatisés du moteur géométrique (Node.js), extraits directement de `index.html`. |
| `tests/resultats-tests.txt` | Résultats du dernier passage des tests. |
| `.nojekyll` | Fichier vide pour GitHub Pages. |

## Déroulé élève (9 étapes)

1. Trajet 1 : rayon incident (parallèle à l'axe) — 2. son rayon émergent (par F')
3. Trajet 2 : rayon incident (par O) — 4. son rayon émergent (non dévié)
5. Trajet 3 : rayon incident (par F) — 6. son rayon émergent (parallèle à l'axe)
7. Placement de la croix B' — 8. Construction de A'B' — 9. Bilan par compétence, comparaison avec la construction de référence (en pointillés), nouvel exercice.

Chaque étape a deux aides facultatives (bouton « 💡 J'ai besoin d'une aide »), sans pénalité. L'aide « Comment utiliser l'outil de tracé ? » contient une animation des gestes sur deux points P et Q quelconques, sans optique.

## Principes de l'assistance (ce que fait et ne fait pas l'outil)

- **Accrochage** : uniquement sur le point que l'élève manipule, et seulement s'il arrive à moins de 10 px (18 px au doigt) d'un point **déjà connu** : B, A, O, F, F', les points d'incidence **tracés par l'élève**, puis le B' **placé par l'élève** à l'étape 8. Près de la lentille, l'extrémité se pose sur la lentille (seule l'abscisse change) ; à l'étape 8, même chose avec l'axe optique.
- **Jamais** : de tracé automatique, de correction de direction, d'attraction vers B', A' ou un point d'incidence théorique. La croix B' n'est attirée par rien (hormis les nœuds du quadrillage si l'élève active cette option).
- **F et F'** : un repère jaune discret s'allume quand le segment passe près de F ou F', sans jamais raccourcir le segment.
- **Quadrillage** : option désactivée par défaut ; elle ne capture que très près d'un nœud (30 % du pas), pour ne jamais imposer une direction.
- **Correction** : toucher un segment fait apparaître ses deux poignées ; les flèches du clavier ajustent finement la dernière poignée (Maj + flèche : un demi-carreau). Si l'élève modifie un segment déjà validé, le logiciel revérifie et n'invalide que ce qui en dépend (l'émergent de ce trajet, B', A'B') ; aucun rayon n'est effacé.

## Paramètres modifiables par l'enseignante

### Par l'adresse (sans toucher au code)

Ajouter les paramètres après `index.html?`, séparés par `&`. Exemple :
`index.html?kmin=1.5&kmax=2.5&focales=4;5&grille=1`

| Paramètre | Effet | Défaut |
|---|---|---|
| `kmin`, `kmax` | OA tiré entre kmin·f' et kmax·f' | 1.5 et 3 |
| `focales` | valeurs possibles de f' en cm, séparées par `;` | 3;3.5;4;4.5;5 |
| `tailles` | valeurs possibles de AB en cm | 1.5;2;2.5;3;3.5;4 |
| `types` | images proposées : `agrandie`, `meme`, `reduite` (séparés par `;`) | les trois |
| `tolpos` | tolérance de position des extrémités (carreaux) | 0.25 |
| `tolpassage` | tolérance de passage par F, F' (carreaux) | 0.25 |
| `tolangle` | tolérance angulaire des directions (degrés) | 2 |
| `tolbprime` | tolérance de position de B' (carreaux) | 0.35 |
| `tolvert` | tolérance de verticalité de A'B' (carreaux) | 0.25 |
| `accrochage`, `accrochagetactile` | rayon de capture en pixels (souris / doigt) | 10 / 18 |
| `grille=1` | option « Aligner sur le quadrillage » cochée au départ | décochée |
| `graine` | nombre entier : tous les élèves ont la même suite d'exercices | hasard |

### Dans le code

Toutes les valeurs (dont la taille de la grille, les marges de lisibilité, l'écart minimal entre rayons émergents) sont dans l'objet `DEFAUTS` en haut du moteur, dans `index.html`.

**Tolérances** : elles sont exprimées en carreaux, donc indépendantes de la taille de l'écran (1 carreau ≈ 30 px sur un ordinateur portable, d'où 0,25 carreau ≈ 8 px). Sur un très petit écran, elles ne descendent jamais sous l'équivalent de 8 px (10 px pour B'). Les règles d'accrochage et les règles de validation sont deux fonctions séparées.

## Publication sur GitHub Pages

1. Créer un dépôt public (par exemple `construction-image-lentille`).
2. Y déposer `index.html` et `.nojekyll` (le dossier `tests` est facultatif).
3. *Settings* → *Pages* → *Deploy from a branch* → `main` / `(root)` → *Save*.
4. Après une à deux minutes, l'adresse est `https://<votre-compte>.github.io/construction-image-lentille/`.

## Intégration dans Éléa (Moodle)

**Option 1 — iframe dans une page ou une étiquette** (recommandée) : ajouter une activité *Page* (ou une *Zone texte et média*), passer l'éditeur en mode code source `</>` et coller :

```html
<iframe src="https://<votre-compte>.github.io/construction-image-lentille/"
        width="100%" height="760" style="border:0;max-width:1400px"
        allow="fullscreen" title="Construction de l'image par une lentille convergente"></iframe>
<p><a href="https://<votre-compte>.github.io/construction-image-lentille/" target="_blank">Ouvrir en plein écran</a></p>
```

Une hauteur de 720 à 800 px convient sur ordinateur ; le lien « plein écran » est conseillé sur tablette (à utiliser de préférence en mode paysage).

**Option 2 — fichier déposé dans Éléa** : ressource *Fichier* avec `index.html`, affichage « Intégrer » ou « Dans une fenêtre surgissante ». Fonctionne car l'application est autonome.

**Note** : l'application **ne communique pas** avec le carnet de notes Moodle. Elle calcule en interne un rapport (score, achèvement, réussite, aides consultées, durée) prêt pour une future version SCORM 1.2 (`Rapport.calculer()` et le point d'extension `AdaptateurLMS` dans le code), mais rien n'est transmis à Éléa pour l'instant. Dans la console du navigateur, `ConstructionImage.rapport()` affiche ce rapport.

## Tests réalisés

### Tests automatisés (moteur géométrique) — `node tests/tests-geometrie.js`

2 000 tirages aléatoires (graine 20261111) + 500 tirages avec un domaine modifié : **22 tests réussis, 0 en échec**. Détail dans `tests/resultats-tests.txt`. Principaux contrôles :

- tous les tirages sont constructibles et entièrement visibles (marge de 1,5 carreau), image réelle et renversée, OA entre 1,5 f' et 3 f' ; images agrandies (625), réduites (618) et de même taille (757), |γ| de 0,50 à 2,00 ;
- les trois rayons émergents théoriques concourent en B' (écart maximal 2,5 × 10⁻¹⁵ carreau) ;
- la construction exacte est acceptée aux 8 étapes, même tracée à l'envers, et les petites imprécisions dans les tolérances aussi ;
- sont refusés : un rayon incident qui dépasse la lentille ou s'arrête avant, une rotation de 4° des incidents et de 3° des émergents, les erreurs classiques (émergent 1 non dévié, émergent 3 passant par F'), un mauvais départ, un émergent vers la gauche ou trop court, une discontinuité incident/émergent, B' décalé de 0,7 carreau, A' hors de l'axe, A'B' non vertical ;
- modifier un incident validé invalide son émergent ; le point d'incidence réutilisé est celui de l'élève ;
- l'accrochage capture dans la zone et **ne déplace jamais un point hors zone** (19 523 positions vérifiées) ; aucune cible ne coïncide avec B', A' ou un point d'incidence théorique ; la croix n'est jamais attirée.

### Tests dans le navigateur (Chromium intégré, souris simulée et réelle)

- Parcours complet des 9 étapes avec des tracés imprécis : départ capturé sur B, extrémité posée sur la lentille sans correction de l'ordonnée, direction erronée refusée, correction par poignée, départ des émergents capturé sur le point d'incidence de l'élève, repère jaune allumé au passage près de F sans raccourcir le segment, croix B' déposée exactement où on la lâche, A' posé sur l'axe.
- Modification d'un rayon validé : seuls l'étape modifiée et son émergent passent « à revoir », les autres trajets restent validés ; « Annuler » restaure l'état précédent.
- Redimensionnement 1280×720 → 900×700 → 768×1024 : les positions géométriques restent identiques (à 0,1 px près à l'écran).
- Gestes de type `touch` et `pen`, aides 1 et 2, animation de l'aide outil, ajustement au clavier, bilan, superposition de la référence.

### Non testé à ce jour

Vraie tablette tactile et stylet physiques, Firefox et Safari, publication réelle sur GitHub Pages et affichage dans une iframe Éléa. Les tolérances proposées (8 px, 2°) restent à confirmer en classe sur différents écrans.
