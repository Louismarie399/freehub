# FreeHub

Application d'accompagnement administratif et fiscal pour les freelances et
dirigeants de société.

## Démarrer

Double-clique sur **« Lancer FreeHub.command »**, puis va sur
**http://localhost:8123** (le navigateur s'ouvre tout seul).

Pour arrêter : `Ctrl + C` dans la fenêtre du Terminal.

> Si macOS refuse d'ouvrir le fichier la première fois : clic droit → *Ouvrir*.

⚠️ N'ouvre pas `index.html` en double-cliquant dessus : le tableau de bord
s'affichera, mais le **simulateur ne pourra pas appeler l'IA** (il lui faut le
serveur).

## Ce que contient l'app

| Écran | Rôle |
|---|---|
| **Accueil** | Où tu en es : net estimé, prochaine échéance, action du moment |
| **Mes objectifs** | Cartes d'objectifs ; un clic ouvre le parcours étape par étape |
| **Calendrier** | Les échéances de l'année, tirées de tes objectifs et de ton statut |
| **Simulateur** | Le catalogue des simulateurs disponibles (voir ci-dessous) |
| **Lexique** | Les mots de l'administratif expliqués, avec un lexique personnel |
| **Nos partenaires** | Les services recommandés (voir ci-dessous) |
| **Mon profil** | Toutes tes données, saisies une fois et réutilisées partout |

Le profil est accessible en cliquant sur ton nom, en bas de la barre latérale.

## Mon profil — la saisie unique

**Principe : une information ne se saisit qu'à un seul endroit.** Le profil est
la source, les simulateurs se servent dedans. Modifier une valeur ici met les
cinq simulateurs à jour d'un coup.

**Une ligne par section, dépliable** — une seule ouverte à la fois. Repliée,
chaque ligne montre son résumé (« Monteur vidéo · Libéral (BNC) »), donc l'écran
tient sans trous. Le liseré de gauche donne à chaque section sa couleur.

| Bloc | Contenu | Alimente |
|---|---|---|
| 👤 Profil | prénom, nom, e-mail, téléphone, photo | la barre latérale |
| 🧑‍💻 Activité | activité, description, catégorie fiscale (BIC/BNC) | Dépenses · VL · Société |
| 🏛 Structure | forme juridique, régime, versement libératoire | Dépenses · Société · Optimiser |
| 📈 Chiffre d'affaires | montant + période (an/mois) | VL · TVA · Société · Optimiser |
| 🧾 TVA et clients | situation, taux de vente, répartition clientèle | TVA · Optimiser |
| 🏠 Foyer fiscal | parts, autres revenus, RFR N−2, réductions | VL · Société · Optimiser |
| 💶 Rémunération | rémunération, dividendes, trésorerie gardée | Société · Optimiser |
| 🧰 Charges professionnelles | la liste, une seule fois | TVA · Société · Optimiser |

Le prénom, le nom et la photo alimentent le bloc utilisateur en bas de la barre
latérale. La photo est **recadrée en carré et réduite à 256 px** avant d'aller en
`localStorage` (≈ 3 Ko), pour ne pas saturer le quota du navigateur.

> ⚠️ **Le mot de passe n'est pas stocké.** Le champ est présent mais désactivé :
> tant que FreeHub n'a pas de comptes côté serveur, garder un mot de passe ici
> reviendrait à l'écrire en clair dans le navigateur. Il s'activera avec
> l'authentification.

Ce que ça change dans les simulateurs — il ne reste que ce qui est **propre à
la simulation** :

| Simulateur | Champs avant | Champs après |
|---|---|---|
| Versement libératoire | 7 | 1 (l'année) |
| Passer à la TVA | 11 | 3 (stratégie de prix, baisse redoutée, coûts admin) |
| Quand passer en société | 7 | 1 (investissement prévu) |
| Optimiser ma société | 8 | 1 (objectif) + le curseur dividendes |

Chaque simulateur affiche en tête une bande **« D'après ton profil »** qui
récapitule les valeurs reprises, avec un bouton *Modifier* qui ouvre le profil.

Les **charges** restent modifiables dans les simulateurs : c'est utile pour
tester une hypothèse sans toucher au profil. Pour un changement durable, passe
par le profil.

Techniquement : `PROFIL_SECTIONS` décrit les blocs (couleur, icône, champs,
conditions d'affichage), `appliquerProfil()` recopie le profil vers les cinq
simulateurs à leur ouverture, et `profilBandeHtml()` produit le rappel.

## Nos partenaires

Quatre cartes compactes **sur une seule ligne** : **LegalPlace** (juridique &
création), **Abby** (comptabilité micro), **Qonto** (compte pro), **Icon
Invest** (expertise comptable).

La carte reste courte : une phrase et trois points. Un clic **n'importe où sur
la carte** — ou sur le petit **+** en haut à droite — ouvre la **fiche** au
centre de l'écran : descriptif complet, liste complète, le **code promo** et le
lien vers le partenaire. On la referme au clic sur le fond ou avec **Échap**.

Dans la fiche, le bouton **Découvrir** est en haut à droite de l'en-tête, face au
logo. Le **code promo occupe toute la barre du bas** : label, code et avantage sur
une ligne — un clic n'importe où dessus le copie (retour « ✓ Copié »).

Sur la carte repliée, la pastille **🎁 Promo** se place sous le bouton `+`, à
droite : les logos et les noms des quatre cartes restent ainsi alignés, qu'il y
ait un code promo ou non.

Tout se pilote depuis la constante **`PARTENAIRES`** dans `assets/app.js` :

- `pitch` — la phrase courte affichée **sur la carte** ;
- `desc` — le texte long, réservé à la **fiche** (accepte du HTML : `<b>`) ;
- `points` — la liste complète ; **seuls les 3 premiers** sont sur la carte ;
- `url` — le **lien d'affiliation**. Tant qu'il est vide (`''`), la fiche
  affiche un bouton inactif « Lien bientôt disponible ». Colle l'URL et le
  bouton devient un vrai lien (`target="_blank"`, `rel="noopener sponsored"`) ;
- `promo` / `promoDetail` — le **code promo** et l'avantage. Vide (`''`) :
  l'encadré affiche « à venir ». Rempli : la carte porte une pastille 🎁, la
  fiche détaille l'avantage, et un clic copie le code ;
- `img` — le **logo**, dans `assets/partenaires/` ;
- `color` / `grad` — les deux teintes du **dégradé de l'en-tête** (relevées sur
  le logo) ; `color` sert aussi aux puces et au bouton ;
- `soft` — le **fond teinté** du corps de la carte et de la fiche.

Chaque carte porte donc les couleurs de son partenaire : en-tête en dégradé
avec le logo sur pastille blanche, corps en teinte claire assortie.

Une mention d'affiliation figure en bas de page et sur chaque fiche.

## Simulateur 5 · Optimiser ma société

Pour les dirigeants **déjà en EURL ou SASU**. Ce n'est plus un comparateur mais
un **cockpit de pilotage** : tu ajustes ta rémunération, tes dividendes, ta
trésorerie et tes leviers, et tu vois l'effet en direct.

- **Import automatique** : tes dépenses des autres simulateurs sont récupérées
  d'un clic — et la **déductibilité vient de l'analyse du simulateur 1**
  (une dépense jugée « difficilement justifiable » arrive à 0 %) ;
- **tableau de bord** complet : du chiffre d'affaires jusqu'à l'argent
  réellement disponible ;
- **scores de santé** (rémunération, trésorerie, fiscalité, charges, social) ;
- **leviers activables** : mutuelle, prévoyance, RC Pro, épargne retraite,
  titres-restaurant, indemnités kilométriques, bureau à domicile ;
- **pistes de réflexion** calculées sur tes chiffres (dont une variante testée
  en vrai : « +500 €/mois de salaire → tu gagnerais X ») ;
- **scénarios** enregistrables et rechargeables.

> ⚠️ Mêmes réserves que le simulateur 4 sur les taux. De plus, **les plafonds
> d'exonération** des dispositifs (mutuelle, prévoyance, PER, titres-restaurant…)
> ne sont pas vérifiés : seul le mécanisme de déduction est simulé.

## Simulateur 4 · Quand passer en société ?

Compare ton auto-entreprise à une EURL et une SASU. **Tout se recalcule en
temps réel** : aucun bouton à cliquer, chaque modification met à jour les
résultats, le tableau et le graphique.

- ton **revenu réellement disponible** dans chaque statut ;
- le **point de bascule** : à partir de quel chiffre d'affaires une société
  devient plus intéressante ;
- un **curseur de projection** pour voir ce qui se passe si ton activité
  grandit ;
- un **graphique** des trois courbes, avec les croisements ;
- un tableau comparatif où chaque ligne est colorée (un statut peut être bon
  sur la fiscalité et mauvais sur les cotisations).

Le point le plus important : **en auto-entreprise, tes charges ne sont pas
déductibles**. Avec peu de charges, l'auto-entreprise reste souvent gagnante ;
dès que tes charges augmentent, la société prend l'avantage. Fais varier le
montant de tes charges pour le constater.

> **Provenance des taux.** 6 paramètres sur 10 viennent de ta feuille de calcul
> (cotisations TNS 44 %, charges SASU ≈ 88 % du net, IS 15 / 25 %, PFU 30 %) et
> portent la pastille **Confirmé**. Les autres — cotisations micro, CFE, plafond
> du taux réduit d'IS — restent des ordres de grandeur et portent **À confirmer**.
> Tout est modifiable via **« Ajuster les paramètres fiscaux »**, et le bouton
> *Garder ces taux* les conserve d'une session à l'autre.

## Simulateur 3 · Est-ce intéressant de passer à la TVA ?

Tu es en franchise en base et tu te demandes si opter pour la TVA serait
rentable. **Calcul exact, sans IA.**

Tu renseignes ton chiffre d'affaires, le taux de TVA de tes ventes, la
répartition de ta clientèle, ce que tu ferais de tes prix, et tes dépenses.
Tu obtiens :

- la **TVA récupérable** sur tes achats, dépense par dépense ;
- la **TVA absorbée** si tu ne répercutes pas la hausse sur tes prix ;
- un **bilan annuel** et un avis (favorable / à étudier / défavorable) ;
- **trois scénarios** comparés : TVA ajoutée partout, prix TTC conservés,
  TVA ajoutée aux pros seulement ;
- les points de vigilance.

Deux principes importants respectés par le calcul :

- ce qui compte n'est pas que ton client soit une entreprise, mais qu'il
  puisse **réellement récupérer** la TVA (un micro-entrepreneur en franchise
  ne la récupère pas) ;
- la TVA que tu collectes **n'est pas un revenu** : elle est encaissée pour
  être reversée, elle n'apparaît donc pas comme un gain.

> Les seuils de franchise en base ne sont pas vérifiés (valeurs non
> renseignées dans les paramètres) : au-delà, la TVA devient obligatoire.

## Simulateur 2 · Versement libératoire ou impôt classique ?

Compare les deux modes d'imposition de ta micro-entreprise. **Ce simulateur ne
fait appel à aucune IA** : c'est un calcul fiscal exact (barème progressif,
quotient familial, abattements), donc instantané et gratuit.

Tu renseignes : ta catégorie fiscale, ton chiffre d'affaires, les autres revenus
de ton foyer, ton nombre de parts, et ton revenu fiscal de référence N-2. Tu
obtiens :

- le coût annuel de chaque option et l'écart entre les deux ;
- ton **éligibilité** au versement libératoire (plafond de RFR par part) ;
- le détail des calculs, formule à l'appui ;
- **ta position dans le barème**, avant et après ton bénéfice micro ;
- les hypothèses et limites du calcul.

Point important : le coût du régime classique correspond à l'impôt **que ta
micro ajoute** à ton foyer (impôt avec micro − impôt sans micro), et non à
l'impôt total du foyer.

> Les paramètres fiscaux (barème, taux, abattements, plafonds) sont regroupés
> dans une table annuelle en haut de `assets/app.js` (`FISCAL`) — à
> réactualiser chaque année. La décote et le plafonnement du quotient familial
> ne sont pas encore appliqués : c'est indiqué dans le résultat.

## Simulateur 1 · Mes dépenses sont-elles déductibles ?

Tu décris tes dépenses (nom, montant, motif) — **jusqu'à 12 en une seule
analyse**. Chacune est croisée avec ton profil, puis tu obtiens :

**Un compte-rendu global**
- le nombre de dépenses par statut ;
- le montant total analysé, le montant « a priori justifiable » et celui
  qui comporte des réserves ;
- les pièces à réunir en priorité ;
- un tableau récapitulatif (dépense, montant, résultat, risque, action).

**Le détail de chaque dépense** (à déplier)
- un **statut** — 🟢 a priori justifiable · 🟠 possible sous conditions ·
  🔴 difficilement justifiable · ⚪ analyse impossible en l'état ;
- un **niveau de confiance**, selon la qualité des informations fournies ;
- les conditions, points de vigilance, justificatifs à conserver ;
- le traitement comptable probable et un encart **TVA** distinct ;
- les questions à préciser pour affiner l'analyse.

**Export** : bouton *Imprimer / PDF* (choisis « Enregistrer au format PDF »
dans la fenêtre d'impression) et *Copier le compte-rendu* en texte, par
exemple pour l'envoyer à ton expert-comptable.

**Historique** : chaque analyse est enregistrée automatiquement. Tu la
retrouves sur l'accueil du simulateur, sous *Mes simulations* — clique dessus
pour rouvrir le compte-rendu, ou sur la croix pour la supprimer. Les
20 dernières sont conservées, dans ton navigateur uniquement.

Le simulateur ne juge jamais sur le seul nom de la dépense : une même table
achetée peut être justifiable pour un studio photo et ne pas l'être pour un
bureau à domicile. C'est ton profil et le motif qui font la différence.

L'analyse est **indicative** : ce n'est ni un conseil fiscal, ni une validation
comptable. Fais confirmer les dépenses sensibles par ton expert-comptable.

## Clé API Claude

Le simulateur appelle l'API Claude. La clé est cherchée dans cet ordre :

1. la variable d'environnement `ANTHROPIC_API_KEY` ;
2. un fichier `.env` placé dans ce dossier :
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. à défaut, la clé déjà enregistrée dans l'app *Mailing ICON STUDIO*
   (repli pratique, pour ne pas la ressaisir).

La clé reste côté serveur : elle n'est **jamais** envoyée au navigateur.

Le modèle utilisé est défini en haut de `server.py` (`MODEL`) : **`claude-sonnet-5`**,
choisi pour son rapport qualité/coût. `claude-opus-4-8` reste disponible si tu veux
un raisonnement plus poussé sur les cas limites.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La coquille (17 lignes) |
| `assets/app.css` | Toute la mise en forme (~54 Ko) |
| `assets/app.js` | Toute la logique (~219 Ko) |
| `server.py` | Serveur : sert la page et expose `POST /api/analyze` |
| `requirements.txt` | Dépendances Python |
| `Lancer FreeHub.command` | Lanceur double-cliquable |
| `assets/` | Le logo FreeHub et ceux des partenaires |

## Le logo dans la barre latérale

Le logo affiché est `assets/freehub-logo-blanc.png`, sur 25 px de haut (la
largeur suit). **Si le fichier est absent**, l'app retombe sur le wordmark CSS
« Freehub. » — aucune image cassée, aucune erreur.

Le fichier d'origine avait un **fond blanc opaque**, qui aurait fait un
rectangle blanc sur la barre bleu nuit. Il a donc été **détouré** : le blanc est
devenu transparent, en conservant l'antialiasing des lettres (le taux de
couverture de chaque pixel est repassé en canal alpha). Le tracé et la couleur
sont inchangés.

Deux versions sont disponibles :

| Fichier | Rendu |
|---|---|
| `assets/freehub-logo-blanc.png` | le blanc — **c'est celui utilisé** |
| `assets/freehub-logo.png` | le bleu d'origine, si le fond change un jour |

Pour basculer, change le `src` dans `shellHtml()`.

Les données du profil sont enregistrées **dans ton navigateur**
(`localStorage`) — il n'y a pas encore de compte utilisateur.

## Sauvegarde de tes données

Tout vit dans le navigateur (`localStorage`). Depuis **Mon profil**, en bas :

- **Exporter mes données** télécharge un fichier `freehub-sauvegarde-AAAA-MM-JJ.json`
  contenant profil, historiques, scénarios et taux fiscaux ajustés ;
- **Importer un fichier** restaure le tout — pratique pour changer d'ordinateur.

L'import n'écrit que les clés connues de FreeHub, jamais autre chose.

## Ce qui relie les écrans

- **Objectifs → simulateurs** : une étape peut porter un bouton qui ouvre
  directement le bon simulateur (`sim` dans le catalogue) ;
- **Objectifs → partenaires** : ou ouvrir la fiche du partenaire concerné, code
  promo compris (`part`) ;
- **Profil → simulateurs** : `appliquerProfil()` à chaque ouverture ;
- **Simulateur 1 → profil** : après une analyse, le bouton *Mettre à jour mon
  profil* recopie la déductibilité jugée par l'IA dans tes charges — les
  simulateurs TVA, société et optimisation en tiennent compte aussitôt.

## L'écran d'accueil

Le premier écran répond à une seule question : **où j'en suis ?**

- **Ce qui te reste vraiment** — ton net mensuel calculé depuis ton profil et ta
  forme juridique, avec l'anneau « où part ton chiffre d'affaires » ;
- **Prochaine échéance** — la plus proche des dates de `ECHEANCES` ; un clic
  ouvre l'objectif correspondant (et l'ajoute à ta liste s'il n'y était pas) ;
- **À faire maintenant** — ce qui débloque le plus : d'abord un trou dans le
  profil, sinon la prochaine étape de ton objectif le plus avancé ;
- **Ton profil** — l'anneau de complétude, en raccourci ;
- **Tes objectifs** — chacun avec son anneau, cliquable.

> `ECHEANCES` ne contient que des dates **déjà affirmées ailleurs dans l'app**
> (versement libératoire au 30 septembre, CFE au 15 décembre). Les autres
> (URSSAF, déclaration de revenus) restent à confirmer avant d'être ajoutées.

**Une seule page pour les objectifs.** Plus d'onglet Progression ni d'écran
« Ajouter un objectif » séparé : tout tient sur un écran, en deux zones.

1. **Tes objectifs** — ceux que tu as choisis, triés : ce que tu as commencé
   d'abord, puis ce qui reste à démarrer. Les terminés se replient dans une
   ligne « ✓ N maîtrisés ». Un `×` au survol retire un objectif.
2. **Ajouter un objectif** — les parcours disponibles, présentés plus sobrement
   (bordure pointillée) avec un `+`. Ceux que ton profil désigne portent
   « Pour toi » et gardent leur couleur.

En haut, la progression **ne compte que les objectifs que tu as choisis** — pas
tout le catalogue : anneau + « X étapes franchies sur Y » + trois compteurs.
En dessous, des **pastilles de filtre par domaine**.

Chaque tuile porte la couleur de son domaine et affiche :

- les **étapes en points** `●●○○` — plus lisible qu'un pourcentage ;
- les **raccourcis en clair et cliquables** : `📊 Comparer les statuts`,
  `🤝 LegalPlace`… Ils sont **toujours visibles**, même si l'étape
  correspondante n'est pas encore atteinte : c'est ce qui donne envie d'aller
  voir. Un clic ouvre directement le simulateur ou la fiche partenaire.
- l'**échéance** seulement si elle est légale et réelle.

Dans le parcours, une étape verrouillée **garde son raccourci** : on ne peut pas
la *valider* avant la précédente, mais rien n'empêche d'aller explorer.

Le choix des objectifs et les étapes cochées sont **enregistrés**
(`freehub_objectifs`) et repris dans l'export de sauvegarde.

**Couleur par domaine.** `DOMAINES` : Statut, Fiscalité, TVA, Administratif,
Apprentissage, Pilotage. `pertinent(profil)` décide du badge « Pour toi » et du
tri des disponibles ; `echeance` n'est posé que sur les objectifs à date légale.

## Nos partenaires

Quatre cartes compactes **sur une seule ligne** : **LegalPlace** (juridique &
création), **Abby** (comptabilité micro), **Qonto** (compte pro), **Icon
Invest** (expertise comptable).

La carte reste courte : une phrase et trois points. Un clic **n'importe où sur
la carte** — ou sur le petit **+** en haut à droite — ouvre la **fiche** au
centre de l'écran : descriptif complet, liste complète, le **code promo** et le
lien vers le partenaire. On la referme au clic sur le fond ou avec **Échap**.

Dans la fiche, le bouton **Découvrir** est en haut à droite de l'en-tête, face au
logo. Le **code promo occupe toute la barre du bas** : label, code et avantage sur
une ligne — un clic n'importe où dessus le copie (retour « ✓ Copié »).

Sur la carte repliée, la pastille **🎁 Promo** se place sous le bouton `+`, à
droite : les logos et les noms des quatre cartes restent ainsi alignés, qu'il y
ait un code promo ou non.

Tout se pilote depuis la constante **`PARTENAIRES`** dans `assets/app.js` :

- `pitch` — la phrase courte affichée **sur la carte** ;
- `desc` — le texte long, réservé à la **fiche** (accepte du HTML : `<b>`) ;
- `points` — la liste complète ; **seuls les 3 premiers** sont sur la carte ;
- `url` — le **lien d'affiliation**. Tant qu'il est vide (`''`), la fiche
  affiche un bouton inactif « Lien bientôt disponible ». Colle l'URL et le
  bouton devient un vrai lien (`target="_blank"`, `rel="noopener sponsored"`) ;
- `promo` / `promoDetail` — le **code promo** et l'avantage. Vide (`''`) :
  l'encadré affiche « à venir ». Rempli : la carte porte une pastille 🎁, la
  fiche détaille l'avantage, et un clic copie le code ;
- `img` — le **logo**, dans `assets/partenaires/` ;
- `color` / `grad` — les deux teintes du **dégradé de l'en-tête** (relevées sur
  le logo) ; `color` sert aussi aux puces et au bouton ;
- `soft` — le **fond teinté** du corps de la carte et de la fiche.

Chaque carte porte donc les couleurs de son partenaire : en-tête en dégradé
avec le logo sur pastille blanche, corps en teinte claire assortie.

Une mention d'affiliation figure en bas de page et sur chaque fiche.

## Simulateur 5 · Optimiser ma société

Pour les dirigeants **déjà en EURL ou SASU**. Ce n'est plus un comparateur mais
un **cockpit de pilotage** : tu ajustes ta rémunération, tes dividendes, ta
trésorerie et tes leviers, et tu vois l'effet en direct.

- **Import automatique** : tes dépenses des autres simulateurs sont récupérées
  d'un clic — et la **déductibilité vient de l'analyse du simulateur 1**
  (une dépense jugée « difficilement justifiable » arrive à 0 %) ;
- **tableau de bord** complet : du chiffre d'affaires jusqu'à l'argent
  réellement disponible ;
- **scores de santé** (rémunération, trésorerie, fiscalité, charges, social) ;
- **leviers activables** : mutuelle, prévoyance, RC Pro, épargne retraite,
  titres-restaurant, indemnités kilométriques, bureau à domicile ;
- **pistes de réflexion** calculées sur tes chiffres (dont une variante testée
  en vrai : « +500 €/mois de salaire → tu gagnerais X ») ;
- **scénarios** enregistrables et rechargeables.

> ⚠️ Mêmes réserves que le simulateur 4 sur les taux. De plus, **les plafonds
> d'exonération** des dispositifs (mutuelle, prévoyance, PER, titres-restaurant…)
> ne sont pas vérifiés : seul le mécanisme de déduction est simulé.

## Simulateur 4 · Quand passer en société ?

Compare ton auto-entreprise à une EURL et une SASU. **Tout se recalcule en
temps réel** : aucun bouton à cliquer, chaque modification met à jour les
résultats, le tableau et le graphique.

- ton **revenu réellement disponible** dans chaque statut ;
- le **point de bascule** : à partir de quel chiffre d'affaires une société
  devient plus intéressante ;
- un **curseur de projection** pour voir ce qui se passe si ton activité
  grandit ;
- un **graphique** des trois courbes, avec les croisements ;
- un tableau comparatif où chaque ligne est colorée (un statut peut être bon
  sur la fiscalité et mauvais sur les cotisations).

Le point le plus important : **en auto-entreprise, tes charges ne sont pas
déductibles**. Avec peu de charges, l'auto-entreprise reste souvent gagnante ;
dès que tes charges augmentent, la société prend l'avantage. Fais varier le
montant de tes charges pour le constater.

> **Provenance des taux.** 6 paramètres sur 10 viennent de ta feuille de calcul
> (cotisations TNS 44 %, charges SASU ≈ 88 % du net, IS 15 / 25 %, PFU 30 %) et
> portent la pastille **Confirmé**. Les autres — cotisations micro, CFE, plafond
> du taux réduit d'IS — restent des ordres de grandeur et portent **À confirmer**.
> Tout est modifiable via **« Ajuster les paramètres fiscaux »**, et le bouton
> *Garder ces taux* les conserve d'une session à l'autre.

## Simulateur 3 · Est-ce intéressant de passer à la TVA ?

Tu es en franchise en base et tu te demandes si opter pour la TVA serait
rentable. **Calcul exact, sans IA.**

Tu renseignes ton chiffre d'affaires, le taux de TVA de tes ventes, la
répartition de ta clientèle, ce que tu ferais de tes prix, et tes dépenses.
Tu obtiens :

- la **TVA récupérable** sur tes achats, dépense par dépense ;
- la **TVA absorbée** si tu ne répercutes pas la hausse sur tes prix ;
- un **bilan annuel** et un avis (favorable / à étudier / défavorable) ;
- **trois scénarios** comparés : TVA ajoutée partout, prix TTC conservés,
  TVA ajoutée aux pros seulement ;
- les points de vigilance.

Deux principes importants respectés par le calcul :

- ce qui compte n'est pas que ton client soit une entreprise, mais qu'il
  puisse **réellement récupérer** la TVA (un micro-entrepreneur en franchise
  ne la récupère pas) ;
- la TVA que tu collectes **n'est pas un revenu** : elle est encaissée pour
  être reversée, elle n'apparaît donc pas comme un gain.

> Les seuils de franchise en base ne sont pas vérifiés (valeurs non
> renseignées dans les paramètres) : au-delà, la TVA devient obligatoire.

## Simulateur 2 · Versement libératoire ou impôt classique ?

Compare les deux modes d'imposition de ta micro-entreprise. **Ce simulateur ne
fait appel à aucune IA** : c'est un calcul fiscal exact (barème progressif,
quotient familial, abattements), donc instantané et gratuit.

Tu renseignes : ta catégorie fiscale, ton chiffre d'affaires, les autres revenus
de ton foyer, ton nombre de parts, et ton revenu fiscal de référence N-2. Tu
obtiens :

- le coût annuel de chaque option et l'écart entre les deux ;
- ton **éligibilité** au versement libératoire (plafond de RFR par part) ;
- le détail des calculs, formule à l'appui ;
- **ta position dans le barème**, avant et après ton bénéfice micro ;
- les hypothèses et limites du calcul.

Point important : le coût du régime classique correspond à l'impôt **que ta
micro ajoute** à ton foyer (impôt avec micro − impôt sans micro), et non à
l'impôt total du foyer.

> Les paramètres fiscaux (barème, taux, abattements, plafonds) sont regroupés
> dans une table annuelle en haut de `assets/app.js` (`FISCAL`) — à
> réactualiser chaque année. La décote et le plafonnement du quotient familial
> ne sont pas encore appliqués : c'est indiqué dans le résultat.

## Simulateur 1 · Mes dépenses sont-elles déductibles ?

Tu décris tes dépenses (nom, montant, motif) — **jusqu'à 12 en une seule
analyse**. Chacune est croisée avec ton profil, puis tu obtiens :

**Un compte-rendu global**
- le nombre de dépenses par statut ;
- le montant total analysé, le montant « a priori justifiable » et celui
  qui comporte des réserves ;
- les pièces à réunir en priorité ;
- un tableau récapitulatif (dépense, montant, résultat, risque, action).

**Le détail de chaque dépense** (à déplier)
- un **statut** — 🟢 a priori justifiable · 🟠 possible sous conditions ·
  🔴 difficilement justifiable · ⚪ analyse impossible en l'état ;
- un **niveau de confiance**, selon la qualité des informations fournies ;
- les conditions, points de vigilance, justificatifs à conserver ;
- le traitement comptable probable et un encart **TVA** distinct ;
- les questions à préciser pour affiner l'analyse.

**Export** : bouton *Imprimer / PDF* (choisis « Enregistrer au format PDF »
dans la fenêtre d'impression) et *Copier le compte-rendu* en texte, par
exemple pour l'envoyer à ton expert-comptable.

**Historique** : chaque analyse est enregistrée automatiquement. Tu la
retrouves sur l'accueil du simulateur, sous *Mes simulations* — clique dessus
pour rouvrir le compte-rendu, ou sur la croix pour la supprimer. Les
20 dernières sont conservées, dans ton navigateur uniquement.

Le simulateur ne juge jamais sur le seul nom de la dépense : une même table
achetée peut être justifiable pour un studio photo et ne pas l'être pour un
bureau à domicile. C'est ton profil et le motif qui font la différence.

L'analyse est **indicative** : ce n'est ni un conseil fiscal, ni une validation
comptable. Fais confirmer les dépenses sensibles par ton expert-comptable.

## Clé API Claude

Le simulateur appelle l'API Claude. La clé est cherchée dans cet ordre :

1. la variable d'environnement `ANTHROPIC_API_KEY` ;
2. un fichier `.env` placé dans ce dossier :
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. à défaut, la clé déjà enregistrée dans l'app *Mailing ICON STUDIO*
   (repli pratique, pour ne pas la ressaisir).

La clé reste côté serveur : elle n'est **jamais** envoyée au navigateur.

Le modèle utilisé est défini en haut de `server.py` (`MODEL`) : **`claude-sonnet-5`**,
choisi pour son rapport qualité/coût. `claude-opus-4-8` reste disponible si tu veux
un raisonnement plus poussé sur les cas limites.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La coquille (17 lignes) |
| `assets/app.css` | Toute la mise en forme (~54 Ko) |
| `assets/app.js` | Toute la logique (~219 Ko) |
| `server.py` | Serveur : sert la page et expose `POST /api/analyze` |
| `requirements.txt` | Dépendances Python |
| `Lancer FreeHub.command` | Lanceur double-cliquable |
| `assets/` | Le logo FreeHub et ceux des partenaires |

## Le logo dans la barre latérale

Le logo affiché est `assets/freehub-logo-blanc.png`, sur 25 px de haut (la
largeur suit). **Si le fichier est absent**, l'app retombe sur le wordmark CSS
« Freehub. » — aucune image cassée, aucune erreur.

Le fichier d'origine avait un **fond blanc opaque**, qui aurait fait un
rectangle blanc sur la barre bleu nuit. Il a donc été **détouré** : le blanc est
devenu transparent, en conservant l'antialiasing des lettres (le taux de
couverture de chaque pixel est repassé en canal alpha). Le tracé et la couleur
sont inchangés.

Deux versions sont disponibles :

| Fichier | Rendu |
|---|---|
| `assets/freehub-logo-blanc.png` | le blanc — **c'est celui utilisé** |
| `assets/freehub-logo.png` | le bleu d'origine, si le fond change un jour |

Pour basculer, change le `src` dans `shellHtml()`.

Les données du profil sont enregistrées **dans ton navigateur**
(`localStorage`) — il n'y a pas encore de compte utilisateur.

## Sauvegarde de tes données

Tout vit dans le navigateur (`localStorage`). Depuis **Mon profil**, en bas :

- **Exporter mes données** télécharge un fichier `freehub-sauvegarde-AAAA-MM-JJ.json`
  contenant profil, historiques, scénarios et taux fiscaux ajustés ;
- **Importer un fichier** restaure le tout — pratique pour changer d'ordinateur.

L'import n'écrit que les clés connues de FreeHub, jamais autre chose.

## Ce qui relie les écrans

- **Objectifs → simulateurs** : une étape peut porter un bouton qui ouvre
  directement le bon simulateur (`sim` dans le catalogue) ;
- **Objectifs → partenaires** : ou ouvrir la fiche du partenaire concerné, code
  promo compris (`part`) ;
- **Profil → simulateurs** : `appliquerProfil()` à chaque ouverture ;
- **Simulateur 1 → profil** : après une analyse, le bouton *Mettre à jour mon
  profil* recopie la déductibilité jugée par l'IA dans tes charges — les
  simulateurs TVA, société et optimisation en tiennent compte aussitôt.

## L'écran d'accueil

Le premier écran répond à une seule question : **où j'en suis ?**

- **Ce qui te reste vraiment** — ton net mensuel calculé depuis ton profil et ta
  forme juridique, avec l'anneau « où part ton chiffre d'affaires » ;
- **Prochaine échéance** — la plus proche des dates de `ECHEANCES` ; un clic
  ouvre l'objectif correspondant (et l'ajoute à ta liste s'il n'y était pas) ;
- **À faire maintenant** — ce qui débloque le plus : d'abord un trou dans le
  profil, sinon la prochaine étape de ton objectif le plus avancé ;
- **Ton profil** — l'anneau de complétude, en raccourci ;
- **Tes objectifs** — chacun avec son anneau, cliquable.

> `ECHEANCES` ne contient que des dates **déjà affirmées ailleurs dans l'app**
> (versement libératoire au 30 septembre, CFE au 15 décembre). Les autres
> (URSSAF, déclaration de revenus) restent à confirmer avant d'être ajoutées.

**Une seule page pour les objectifs.** Il n'y a plus d'onglet Progression ni
d'écran « Ajouter un objectif », et **la notion d'« ajouter » a disparu** : un
objectif te concerne ou non, c'est ton profil qui le dit, pas un clic. Les sept
parcours sont donc toujours visibles.

L'ordre est calculé : **ce que tu as commencé**, puis **ce que ton profil
désigne** (badge « Pour toi »), puis le reste. Les objectifs terminés se replient
dans une ligne « ✓ N maîtrisés ».

En haut : une ligne de progression globale (anneau + « X étapes franchies sur
Y » + les trois compteurs). En dessous : des **pastilles de filtre par domaine**,
qui remplacent les anciens en-têtes de section.

Chaque tuile porte la couleur de son domaine et affiche :

- les **étapes en points** `●●○○` — plus lisible qu'un pourcentage ;
- un **aperçu du contenu** : 📊 le nombre de simulateurs qu'elle ouvre, 🤝 si
  elle mène à un partenaire — on sait dans quoi on entre avant de cliquer ;
- l'**échéance** seulement si elle est légale et réelle.

Un clic ouvre le parcours à la place de la grille, avec *← Tous mes objectifs*
pour revenir.

**Couleur par domaine.** `DOMAINES` : Statut, Fiscalité, TVA, Administratif,
Apprentissage, Pilotage. `pertinent(profil)` décide du badge « Pour toi » et du
tri ; `echeance` n'est posé que sur les objectifs à date légale.

## Nos partenaires

Quatre cartes compactes **sur une seule ligne** : **LegalPlace** (juridique &
création), **Abby** (comptabilité micro), **Qonto** (compte pro), **Icon
Invest** (expertise comptable).

La carte reste courte : une phrase et trois points. Un clic **n'importe où sur
la carte** — ou sur le petit **+** en haut à droite — ouvre la **fiche** au
centre de l'écran : descriptif complet, liste complète, le **code promo** et le
lien vers le partenaire. On la referme au clic sur le fond ou avec **Échap**.

Dans la fiche, le bouton **Découvrir** est en haut à droite de l'en-tête, face au
logo. Le **code promo occupe toute la barre du bas** : label, code et avantage sur
une ligne — un clic n'importe où dessus le copie (retour « ✓ Copié »).

Sur la carte repliée, la pastille **🎁 Promo** se place sous le bouton `+`, à
droite : les logos et les noms des quatre cartes restent ainsi alignés, qu'il y
ait un code promo ou non.

Tout se pilote depuis la constante **`PARTENAIRES`** dans `assets/app.js` :

- `pitch` — la phrase courte affichée **sur la carte** ;
- `desc` — le texte long, réservé à la **fiche** (accepte du HTML : `<b>`) ;
- `points` — la liste complète ; **seuls les 3 premiers** sont sur la carte ;
- `url` — le **lien d'affiliation**. Tant qu'il est vide (`''`), la fiche
  affiche un bouton inactif « Lien bientôt disponible ». Colle l'URL et le
  bouton devient un vrai lien (`target="_blank"`, `rel="noopener sponsored"`) ;
- `promo` / `promoDetail` — le **code promo** et l'avantage. Vide (`''`) :
  l'encadré affiche « à venir ». Rempli : la carte porte une pastille 🎁, la
  fiche détaille l'avantage, et un clic copie le code ;
- `img` — le **logo**, dans `assets/partenaires/` ;
- `color` / `grad` — les deux teintes du **dégradé de l'en-tête** (relevées sur
  le logo) ; `color` sert aussi aux puces et au bouton ;
- `soft` — le **fond teinté** du corps de la carte et de la fiche.

Chaque carte porte donc les couleurs de son partenaire : en-tête en dégradé
avec le logo sur pastille blanche, corps en teinte claire assortie.

Une mention d'affiliation figure en bas de page et sur chaque fiche.

## Simulateur 5 · Optimiser ma société

Pour les dirigeants **déjà en EURL ou SASU**. Ce n'est plus un comparateur mais
un **cockpit de pilotage** : tu ajustes ta rémunération, tes dividendes, ta
trésorerie et tes leviers, et tu vois l'effet en direct.

- **Import automatique** : tes dépenses des autres simulateurs sont récupérées
  d'un clic — et la **déductibilité vient de l'analyse du simulateur 1**
  (une dépense jugée « difficilement justifiable » arrive à 0 %) ;
- **tableau de bord** complet : du chiffre d'affaires jusqu'à l'argent
  réellement disponible ;
- **scores de santé** (rémunération, trésorerie, fiscalité, charges, social) ;
- **leviers activables** : mutuelle, prévoyance, RC Pro, épargne retraite,
  titres-restaurant, indemnités kilométriques, bureau à domicile ;
- **pistes de réflexion** calculées sur tes chiffres (dont une variante testée
  en vrai : « +500 €/mois de salaire → tu gagnerais X ») ;
- **scénarios** enregistrables et rechargeables.

> ⚠️ Mêmes réserves que le simulateur 4 sur les taux. De plus, **les plafonds
> d'exonération** des dispositifs (mutuelle, prévoyance, PER, titres-restaurant…)
> ne sont pas vérifiés : seul le mécanisme de déduction est simulé.

## Simulateur 4 · Quand passer en société ?

Compare ton auto-entreprise à une EURL et une SASU. **Tout se recalcule en
temps réel** : aucun bouton à cliquer, chaque modification met à jour les
résultats, le tableau et le graphique.

- ton **revenu réellement disponible** dans chaque statut ;
- le **point de bascule** : à partir de quel chiffre d'affaires une société
  devient plus intéressante ;
- un **curseur de projection** pour voir ce qui se passe si ton activité
  grandit ;
- un **graphique** des trois courbes, avec les croisements ;
- un tableau comparatif où chaque ligne est colorée (un statut peut être bon
  sur la fiscalité et mauvais sur les cotisations).

Le point le plus important : **en auto-entreprise, tes charges ne sont pas
déductibles**. Avec peu de charges, l'auto-entreprise reste souvent gagnante ;
dès que tes charges augmentent, la société prend l'avantage. Fais varier le
montant de tes charges pour le constater.

> **Provenance des taux.** 6 paramètres sur 10 viennent de ta feuille de calcul
> (cotisations TNS 44 %, charges SASU ≈ 88 % du net, IS 15 / 25 %, PFU 30 %) et
> portent la pastille **Confirmé**. Les autres — cotisations micro, CFE, plafond
> du taux réduit d'IS — restent des ordres de grandeur et portent **À confirmer**.
> Tout est modifiable via **« Ajuster les paramètres fiscaux »**, et le bouton
> *Garder ces taux* les conserve d'une session à l'autre.

## Simulateur 3 · Est-ce intéressant de passer à la TVA ?

Tu es en franchise en base et tu te demandes si opter pour la TVA serait
rentable. **Calcul exact, sans IA.**

Tu renseignes ton chiffre d'affaires, le taux de TVA de tes ventes, la
répartition de ta clientèle, ce que tu ferais de tes prix, et tes dépenses.
Tu obtiens :

- la **TVA récupérable** sur tes achats, dépense par dépense ;
- la **TVA absorbée** si tu ne répercutes pas la hausse sur tes prix ;
- un **bilan annuel** et un avis (favorable / à étudier / défavorable) ;
- **trois scénarios** comparés : TVA ajoutée partout, prix TTC conservés,
  TVA ajoutée aux pros seulement ;
- les points de vigilance.

Deux principes importants respectés par le calcul :

- ce qui compte n'est pas que ton client soit une entreprise, mais qu'il
  puisse **réellement récupérer** la TVA (un micro-entrepreneur en franchise
  ne la récupère pas) ;
- la TVA que tu collectes **n'est pas un revenu** : elle est encaissée pour
  être reversée, elle n'apparaît donc pas comme un gain.

> Les seuils de franchise en base ne sont pas vérifiés (valeurs non
> renseignées dans les paramètres) : au-delà, la TVA devient obligatoire.

## Simulateur 2 · Versement libératoire ou impôt classique ?

Compare les deux modes d'imposition de ta micro-entreprise. **Ce simulateur ne
fait appel à aucune IA** : c'est un calcul fiscal exact (barème progressif,
quotient familial, abattements), donc instantané et gratuit.

Tu renseignes : ta catégorie fiscale, ton chiffre d'affaires, les autres revenus
de ton foyer, ton nombre de parts, et ton revenu fiscal de référence N-2. Tu
obtiens :

- le coût annuel de chaque option et l'écart entre les deux ;
- ton **éligibilité** au versement libératoire (plafond de RFR par part) ;
- le détail des calculs, formule à l'appui ;
- **ta position dans le barème**, avant et après ton bénéfice micro ;
- les hypothèses et limites du calcul.

Point important : le coût du régime classique correspond à l'impôt **que ta
micro ajoute** à ton foyer (impôt avec micro − impôt sans micro), et non à
l'impôt total du foyer.

> Les paramètres fiscaux (barème, taux, abattements, plafonds) sont regroupés
> dans une table annuelle en haut de `assets/app.js` (`FISCAL`) — à
> réactualiser chaque année. La décote et le plafonnement du quotient familial
> ne sont pas encore appliqués : c'est indiqué dans le résultat.

## Simulateur 1 · Mes dépenses sont-elles déductibles ?

Tu décris tes dépenses (nom, montant, motif) — **jusqu'à 12 en une seule
analyse**. Chacune est croisée avec ton profil, puis tu obtiens :

**Un compte-rendu global**
- le nombre de dépenses par statut ;
- le montant total analysé, le montant « a priori justifiable » et celui
  qui comporte des réserves ;
- les pièces à réunir en priorité ;
- un tableau récapitulatif (dépense, montant, résultat, risque, action).

**Le détail de chaque dépense** (à déplier)
- un **statut** — 🟢 a priori justifiable · 🟠 possible sous conditions ·
  🔴 difficilement justifiable · ⚪ analyse impossible en l'état ;
- un **niveau de confiance**, selon la qualité des informations fournies ;
- les conditions, points de vigilance, justificatifs à conserver ;
- le traitement comptable probable et un encart **TVA** distinct ;
- les questions à préciser pour affiner l'analyse.

**Export** : bouton *Imprimer / PDF* (choisis « Enregistrer au format PDF »
dans la fenêtre d'impression) et *Copier le compte-rendu* en texte, par
exemple pour l'envoyer à ton expert-comptable.

**Historique** : chaque analyse est enregistrée automatiquement. Tu la
retrouves sur l'accueil du simulateur, sous *Mes simulations* — clique dessus
pour rouvrir le compte-rendu, ou sur la croix pour la supprimer. Les
20 dernières sont conservées, dans ton navigateur uniquement.

Le simulateur ne juge jamais sur le seul nom de la dépense : une même table
achetée peut être justifiable pour un studio photo et ne pas l'être pour un
bureau à domicile. C'est ton profil et le motif qui font la différence.

L'analyse est **indicative** : ce n'est ni un conseil fiscal, ni une validation
comptable. Fais confirmer les dépenses sensibles par ton expert-comptable.

## Clé API Claude

Le simulateur appelle l'API Claude. La clé est cherchée dans cet ordre :

1. la variable d'environnement `ANTHROPIC_API_KEY` ;
2. un fichier `.env` placé dans ce dossier :
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. à défaut, la clé déjà enregistrée dans l'app *Mailing ICON STUDIO*
   (repli pratique, pour ne pas la ressaisir).

La clé reste côté serveur : elle n'est **jamais** envoyée au navigateur.

Le modèle utilisé est défini en haut de `server.py` (`MODEL`) : **`claude-sonnet-5`**,
choisi pour son rapport qualité/coût. `claude-opus-4-8` reste disponible si tu veux
un raisonnement plus poussé sur les cas limites.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La coquille (17 lignes) |
| `assets/app.css` | Toute la mise en forme (~54 Ko) |
| `assets/app.js` | Toute la logique (~219 Ko) |
| `server.py` | Serveur : sert la page et expose `POST /api/analyze` |
| `requirements.txt` | Dépendances Python |
| `Lancer FreeHub.command` | Lanceur double-cliquable |
| `assets/` | Le logo FreeHub et ceux des partenaires |

## Le logo dans la barre latérale

Le logo affiché est `assets/freehub-logo-blanc.png`, sur 25 px de haut (la
largeur suit). **Si le fichier est absent**, l'app retombe sur le wordmark CSS
« Freehub. » — aucune image cassée, aucune erreur.

Le fichier d'origine avait un **fond blanc opaque**, qui aurait fait un
rectangle blanc sur la barre bleu nuit. Il a donc été **détouré** : le blanc est
devenu transparent, en conservant l'antialiasing des lettres (le taux de
couverture de chaque pixel est repassé en canal alpha). Le tracé et la couleur
sont inchangés.

Deux versions sont disponibles :

| Fichier | Rendu |
|---|---|
| `assets/freehub-logo-blanc.png` | le blanc — **c'est celui utilisé** |
| `assets/freehub-logo.png` | le bleu d'origine, si le fond change un jour |

Pour basculer, change le `src` dans `shellHtml()`.

Les données du profil sont enregistrées **dans ton navigateur**
(`localStorage`) — il n'y a pas encore de compte utilisateur.

## Sauvegarde de tes données

Tout vit dans le navigateur (`localStorage`). Depuis **Mon profil**, en bas :

- **Exporter mes données** télécharge un fichier `freehub-sauvegarde-AAAA-MM-JJ.json`
  contenant profil, historiques, scénarios et taux fiscaux ajustés ;
- **Importer un fichier** restaure le tout — pratique pour changer d'ordinateur.

L'import n'écrit que les clés connues de FreeHub, jamais autre chose.

## Ce qui relie les écrans

- **Objectifs → simulateurs** : une étape peut porter un bouton qui ouvre
  directement le bon simulateur (`sim` dans le catalogue) ;
- **Objectifs → partenaires** : ou ouvrir la fiche du partenaire concerné, code
  promo compris (`part`) ;
- **Profil → simulateurs** : `appliquerProfil()` à chaque ouverture ;
- **Simulateur 1 → profil** : après une analyse, le bouton *Mettre à jour mon
  profil* recopie la déductibilité jugée par l'IA dans tes charges — les
  simulateurs TVA, société et optimisation en tiennent compte aussitôt.

## L'écran d'accueil

Le premier écran répond à une seule question : **où j'en suis ?**

- **Ce qui te reste vraiment** — ton net mensuel calculé depuis ton profil et ta
  forme juridique, avec l'anneau « où part ton chiffre d'affaires » ;
- **Prochaine échéance** — la plus proche des dates de `ECHEANCES` ; un clic
  ouvre l'objectif correspondant (et l'ajoute à ta liste s'il n'y était pas) ;
- **À faire maintenant** — ce qui débloque le plus : d'abord un trou dans le
  profil, sinon la prochaine étape de ton objectif le plus avancé ;
- **Ton profil** — l'anneau de complétude, en raccourci ;
- **Tes objectifs** — chacun avec son anneau, cliquable.

> `ECHEANCES` ne contient que des dates **déjà affirmées ailleurs dans l'app**
> (versement libératoire au 30 septembre, CFE au 15 décembre). Les autres
> (URSSAF, déclaration de revenus) restent à confirmer avant d'être ajoutées.

**Objectifs et Progression ont fusionné.** Il n'y a plus d'onglet Progression :
le parcours s'ouvre à la place de la grille quand on clique une carte, avec un
bouton *← Tous mes objectifs* pour revenir. La carte affiche la prochaine étape
plutôt que la description, et un objectif terminé porte un ✓ et sa célébration.

**Couleur par domaine.** Chaque objectif appartient à un domaine (`DOMAINES` :
Statut, Fiscalité, TVA, Administratif, Apprentissage, Pilotage), qui lui donne sa
couleur — liseré, pastille d'icône, fond léger. La grille est **groupée par
domaine**. Trois états de carte : *neuf* (blanc), *en cours* (teinté + anneau),
*terminé* (grisé, ✓).

**Suggestions selon le profil.** Chaque objectif porte un `pertinent(profil)` :
un micro voit *Passer à la TVA* et *Versement libératoire*, une société voit
*Piloter ma société*. Ils apparaissent dans un groupe **« Suggéré pour toi »** et
sont badgés dans le catalogue.

**Échéances légales seulement.** `echeance` n'est posé que sur les objectifs qui
ont une vraie date légale (CFE au 15/12, versement libératoire au 30/09) —
affichée dans le détail. Pas de délai inventé ailleurs.

**Le catalogue est en pleine page** (`state.tab === 'catalogue'`), groupé par
domaine, les objectifs déjà pris grisés. Plus de modale.

## Note de développement

Le serveur envoie `Cache-Control: no-store` sur tous les fichiers : sans ça, le
navigateur garde `app.js` et `app.css` en mémoire et on continue de voir
l'ancienne version après une modification.

## Écrans étroits

L'app vise le bureau. Elle reste utilisable jusqu'à **1024 px** : la barre
latérale se resserre, la liste des simulateurs et les grilles à trois colonnes
passent sur une colonne, les lignes de charges se replient. En dessous de
900 px, un défilement horizontal apparaît — le mobile n'est pas encore traité.

## Lexique

Un onglet **Lexique** explique les mots de l'administratif (abattement, PFU,
TNS, Kbis, franchise en base…) en une à trois phrases, sans jargon et **sans
chiffre inventé** (définitions qualitatives).

- **Recherche** en direct (titre, résumé, définition).
- **Mon lexique** : une étoile épingle un terme ; le filtre « ★ Mon lexique »
  n'affiche que les tiens. Persisté dans `freehub_lexique` et inclus dans
  l'export de sauvegarde.
- Chaque terme est coloré selon son domaine (Statut, Fiscalité, TVA…).

Les termes vivent dans la constante `LEXIQUE` (`assets/app.js`).

**Les « ? » inline** : le helper `lexQ('id')` pose un petit « ? » cliquable
après n'importe quel mot ; il ouvre la fiche du terme, quel que soit l'écran.
Déjà branché sur les champs du **profil** (versement libératoire, franchise,
RFR, dividendes, trésorerie, CFE, abattement) et sur le **panneau des paramètres
fiscaux** du simulateur 4 (cotisations, TNS, assimilé salarié, IS, PFU, CFE).
Pour en ajouter un ailleurs : `+ lexQ('termId')` après un libellé, ou l'option
`lex:'termId'` dans un champ de profil.

## Contenu des objectifs

Chaque étape d'un objectif est **dépliable** : l'étape en cours s'ouvre d'office,
les autres au clic sur leur en-tête (le cercle, lui, coche l'étape). Le contenu
vit dans la constante `CONTENUS` (`assets/app.js`), séparée du catalogue,
au format `{ intro, faire:[…], vigilance:[…], liens:[{l,url}] }`.

> **Aucun chiffre ni seuil inventé** : le contenu reste qualitatif et renvoie
> vers les sources officielles (impots.gouv.fr, urssaf.fr, guichet unique) pour
> les valeurs qui changent (seuils, taux, dates).

## Partenaires dans les résultats

En bas de chaque résultat de simulateur, un **bandeau partenaire contextuel**
(`simPartenaireHtml(index, texte)`) : LegalPlace ou Icon Invest pour « Quand
passer en société », Icon Invest pour le versement libératoire et le cockpit,
Abby pour la TVA, Icon Invest pour l'analyse de dépenses. Un clic ouvre la fiche
du partenaire (lien d'affiliation + code promo).

## Onboarding

Au **tout premier lancement** (aucun drapeau `freehub_onboarded`), un onboarding
conversationnel s'ouvre en plein écran : bienvenue → prénom → activité → forme
juridique → chiffre d'affaires → c'est parti. Il remplit le profil et se pose un
drapeau pour ne plus réapparaître. Bouton **Passer** à tout moment. Pour le
revoir : supprimer `freehub_onboarded` du navigateur.

## Calendrier

Un onglet **Calendrier** réunit les échéances de l'année : celles des objectifs
que tu suis **et** celles que ton statut rend pertinentes (même non ajoutées) —
CFE, versement libératoire, déclaration de revenus. Hero avec la prochaine
échéance datée, puis une frise mois par mois. **Aucune date inventée** : seules
les échéances encodées dans le catalogue apparaissent, et une note renvoie aux
sites officiels pour les dates limites exactes.

## Comptes utilisateurs (optionnels)

L'app reste **local-first** : tout marche sans compte, dans le navigateur. Créer
un compte (depuis **Mon profil → Profil**) ajoute une **synchronisation** : tes
données sont sauvegardées côté serveur et se retrouvent après un changement
d'appareil ou un vidage de cache.

- **Signup** ensemence le compte avec tes données locales ; **login** récupère
  celles du compte (source de vérité) ; la session est reprise automatiquement à
  la prochaine visite.
- Chaque sauvegarde locale (profil, objectifs, lexique…) est repoussée vers le
  serveur, avec un indicateur « ✓ Synchronisé ».

**Sécurité** : les mots de passe sont hashés (PBKDF2-HMAC-SHA256 + sel aléatoire
par utilisateur), jamais stockés en clair. Session par cookie `httponly`. Base
SQLite locale `freehub.db` (ignorée par git).

> ⚠️ **Local vs en ligne.** Le serveur tourne sur `127.0.0.1`. Les comptes
> fonctionnent, mais la synchro entre *appareils différents* n'aura d'effet que
> lorsque l'app sera **hébergée en ligne** — et alors **obligatoirement derrière
> HTTPS** (en local, le mot de passe transite en clair sur la boucle locale, ce
> qui est sans risque, mais ne le serait pas sur Internet sans HTTPS).

## Badges & jalons

Un système de récompenses sur les **vraies étapes franchies** (jamais les clics) :
premier objectif bouclé, profil complet, les cinq simulateurs essayés, un terme
épinglé au lexique, un compte créé… 12 badges en tout.

- Les badges vivent dans `BADGES` (`assets/app.js`), chacun avec un `check()`
  évalué à chaque rendu. Le premier passage à vrai le débloque.
- Un **déblocage déclenche une célébration** animée (icône qui pop, halo). Les
  déblocages simultanés s'enchaînent en file.
- Une **bande « Tes hauts faits »** sur l'accueil : débloqués en couleur, à
  débloquer grisés (cadenas) avec leur condition en infobulle.
- Persistés (`freehub_badges`) et **synchronisés** avec le compte. Les badges
  déjà mérités au premier chargement ne se célèbrent pas rétroactivement.

L'usage des simulateurs est tracé dans `freehub_faits` (`sim:statut`,
`sim:tva`…) via `marquerFait()`.
