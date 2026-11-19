# Stories automatiques @sublet.madrid

Une story Instagram par jour, choisie et dessinée par `src/auto.mjs`, publiée par Buffer. Ce fichier est le mode d'emploi de la tâche programmée « Instagram Sublet · story du jour ».

## Ce que fait le script

`node auto.mjs next` (depuis `src/`, après `npm install`) :

1. Lit les logements en ligne sur le site (`https://flatmatch.uk/api/listings`, route publique : identifiant, ville et point flouté, rien d'autre).
2. **Nouveau logement** (identifiant absent de `auto/state.json`) : une story « New place in Madrid / London » par ville concernée, avec le quartier le plus proche du point flouté (`auto/districts.json`). Jamais de prix, de dates, de photo ni d'adresse : le site ne les montre qu'aux personnes inscrites.
3. **Sinon** : le thème de `auto/themes.json` utilisé il y a le plus longtemps (jamais utilisé = en premier, dans l'ordre du fichier). `months` limite un thème à certains mois, `minLive` à un nombre minimum de logements en ligne.
   Les thèmes `available-madrid` et `available-london` (modèle `available`) sont dans cette rotation : « Available now · 2 places in Madrid », avec le nombre réel de logements en ligne dans la ville et leurs quartiers. Ils sont sautés tant que la ville n'a aucun logement en ligne.
4. Dessine l'image (1080 × 1920, JPEG) dans `ig/auto/<date>-<thème>.jpg`, écrit `auto/pending.json` et affiche le plan : pour chaque story `file`, `url`, `link` (autocollant lien) et `altText`.

Si une story est déjà enregistrée pour la date du jour, `stories` est vide (`reason: already published today`) : ne rien publier.

`node auto.mjs confirm` : à lancer **après** la publication. Ajoute les stories à l'historique et les logements à la liste des logements connus, puis supprime `pending.json`.

`node auto.mjs available` : à la demande, dessine tout de suite la story « Available now » de chaque ville qui a des logements en ligne (même suite : regarder, pousser, publier, `confirm`). Compte comme la story du jour.

**À la une.** Ni Buffer ni l'API d'Instagram ne savent ranger une story dans « À la une » : c'est à faire à la main dans l'application. Deux albums, nommés « Madrid » et « London », couvertures `ig/cover-available-madrid.jpg` et `ig/cover-available-london.jpg` (le mot « Available » est sur la couverture, le nom de l'album donne la ville). Quand une nouvelle story « Available now » sort, l'ajouter à l'album de sa ville et en retirer l'ancienne, sinon l'album affiche un chiffre périmé.

`node auto.mjs preview` : dessine tous les thèmes dans `auto/preview/` pour les regarder (jamais publié, jamais commité).

## Déroulé d'un passage

```bash
cd src && npm install --no-audit --no-fund
node auto.mjs next
```

1. Regarder chaque image du plan (outil Read) : texte entier et lisible, rien de coupé, aucun caractère remplacé par un carré, bonne ville. Une image ratée ne se publie pas.
2. Pousser les images : `git add ig/auto && git commit -m "Story du <date> : <thème>" && git pull --rebase && git push`. Attendre que `curl -s -o /dev/null -w "%{http_code}" <url>` réponde 200 (jusqu'à une minute).
3. Publier chaque story avec Buffer `create_post` :
   - `channelId` : `6afa6953ece6dfde5fdd05b8` (Instagram sublet.madrid, organisation `6af515d67d076dea6075fdb4`)
   - `schedulingType` : `automatic`, `mode` : `shareNow`, pas de `text`
   - `assets` : `[{ "image": { "url": <url>, "metadata": { "altText": <altText> } } }]`
   - `metadata` : `{ "instagram": { "type": "story", "shouldShareToFeed": false, "link": <link> } }`
4. Publication acceptée : `node auto.mjs confirm`, puis `git add auto/state.json && git commit -m "Story du <date> publiée" && git pull --rebase && git push`.
5. Publication refusée (limite du forfait, compte déconnecté, erreur) : une seule nouvelle tentative, pas de `confirm`, et le dire dans le résumé.

## Règles

- Au plus une story par jour, deux seulement si des logements arrivent le même jour dans les deux villes.
- Uniquement des faits : pas de prix, de frais, de nombre d'utilisateurs, de témoignage ni de promesse. Le seul chiffre autorisé est le nombre de logements réellement en ligne.
- Ne modifier ni supprimer aucune publication existante, ne pas toucher aux autres comptes de Buffer, ne pas répondre aux messages.
- Changer un texte ou ajouter un thème : modifier `auto/themes.json`, lancer `node auto.mjs preview`, regarder le résultat, puis pousser.
- Si le site change de quartiers : recopier les centres depuis `public/cities.js` du dépôt du site dans `auto/districts.json`.
- Le nom affiché sur les visuels (« sublet.madrid ») est dans `brand()` de `src/auto.mjs`. Les liens des autocollants sont dans `SITE`.
