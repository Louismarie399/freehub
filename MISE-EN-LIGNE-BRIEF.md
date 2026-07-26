# Briefing — mettre FreeHub en ligne

> Document à donner tel quel à l'agent qui réalise le déploiement.
> **Hébergeur retenu : O2Switch** (mutualisé cPanel) + nom de domaine déjà possédé.
>
> 👉 **Aller directement à la [section O2Switch (§10)](#10-o2switch--étapes-concrètes-hébergeur-retenu)** : c'est le mode d'emploi précis.
> Les sections 1 à 9 restent la référence technique générale.

---

## 1. Où se trouve le projet

**Dossier :** `/Users/louisltddstudio/free-hub`
(projet autonome, séparé de `~/mailing-iconstudio`)

Tout le nécessaire de déploiement est déjà dans ce dossier.

## 2. Ce qu'est l'application

Une web-app pour freelances/indépendants (dashboard + simulateurs fiscaux + comptes).

| | |
|---|---|
| **Langage** | Python (compatible 3.10+ ; image de référence : 3.12) |
| **Framework** | FastAPI, servi par **uvicorn** (ASGI) |
| **Objet ASGI** | `server:app` (variable `app` dans `server.py`) |
| **Base de données** | **SQLite** (fichier unique `freehub.db`) — comptes utilisateurs + demandes partenaires |
| **Front** | statique, **servi par l'app elle-même** (pas de build, pas de Node). `/` = landing publique (`index.html`) · `/app` = dashboard (`app.html`), derrière la création de compte |
| **Dépendance externe** | API Anthropic (Claude) pour l'endpoint `/api/analyze` |
| **Poids** | ~35 Mo |

## 3. Fichiers importants

```
server.py            → le serveur (API + service des fichiers statiques)
index.html           → page d'entrée
assets/              → app.js, app.css, logos, logos partenaires
requirements.txt     → dépendances Python
Dockerfile           → image de prod prête (si déploiement Docker)
fly.toml             → config Fly.io (ignorer si l'hébergeur n'est pas Fly)
DEPLOY.md            → runbook spécifique Fly.io (ignorer si autre hébergeur)
freehub.db           → base de DEV locale — NE PAS téléverser en prod (voir §6)
Lancer FreeHub.command → lanceur local macOS — sans objet en prod
```

## 4. Comment lancer l'app en production

L'app lit sa config dans des **variables d'environnement**. Deux commandes équivalentes :

```
# via uvicorn directement (recommandé en prod)
uvicorn server:app --host 0.0.0.0 --port 8123

# ou en laissant server.py lire HOST/PORT
python server.py
```

Installer d'abord les dépendances :

```
pip install -r requirements.txt
```

Les tables SQLite se créent automatiquement au premier démarrage (`init_db()`).

## 5. Variables d'environnement à définir

| Variable | Obligatoire | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Oui** | Clé API Claude. Sans elle, les simulateurs renvoient une erreur. À stocker en **secret**, jamais dans le code. |
| `COOKIE_SECURE` | **Oui en prod** | Mettre à `1`. Force le cookie de session en `Secure` (obligatoire derrière HTTPS). |
| `FH_DATA_DIR` | Recommandé | Dossier où vit `freehub.db`. Pointer vers un **emplacement persistant** (voir §6). Défaut : le dossier du projet. |
| `HOST` | Optionnel | `0.0.0.0` pour être joignable (déjà le cas si on lance via uvicorn). |
| `PORT` | Optionnel | Port d'écoute interne. Défaut `8123`. |
| `FH_SITE_URL` | **Oui si Google** | URL publique du site, ex. `https://app.mondomaine.fr`. Sert à construire l'URI de redirection OAuth. |
| `GOOGLE_CLIENT_ID` | Optionnel | Identifiant OAuth Google. Absent → le bouton « Continuer avec Google » est masqué, le reste fonctionne. |
| `GOOGLE_CLIENT_SECRET` | Optionnel | Secret OAuth Google. |
| `FH_OPEN_SIGNUP` | Optionnel | `1` pour ouvrir les inscriptions à tous (fin de l'alpha). Par défaut, un **code d'accès** est exigé. |

⚠️ **Important :** en local, l'app peut retrouver la clé API dans un fichier annexe de
la machine de l'utilisateur. **Ce fallback n'existe pas sur le serveur** → la variable
`ANTHROPIC_API_KEY` doit impérativement être fournie.

## 6. Points critiques de production

1. **HTTPS obligatoire.** L'utilisateur a un domaine → le faire pointer vers le serveur
   et terminer le TLS (reverse proxy nginx/Caddy/Apache, ou le TLS intégré de l'hébergeur).
   Puis `COOKIE_SECURE=1`. La **synchro des comptes ne marche qu'en HTTPS**.

2. **Persistance de SQLite.** `freehub.db` doit vivre sur un stockage qui **survit aux
   redéploiements/redémarrages** (disque/volume persistant). Sinon comptes et demandes
   partenaires sont perdus à chaque mise à jour. Définir `FH_DATA_DIR` vers ce stockage.

3. **Ne PAS déployer `freehub.db` du dépôt** (c'est la base de dev, avec des données de
   test). En prod la base se crée toute seule, vide, dans `FH_DATA_DIR`.

4. **Un seul worker / une seule instance.** SQLite n'accepte qu'un écrivain à la fois :
   lancer **1 process uvicorn** (pas de `--workers 4`, pas d'autoscaling multi-instances).

5. **Reverse proxy** (schéma type) : `domaine (443/HTTPS)  →  127.0.0.1:8123 (uvicorn)`.
   L'app sert déjà les fichiers statiques ; inutile de configurer nginx pour `assets/`.

6. **Gestionnaire de process** : lancer uvicorn sous systemd / supervisor / pm2 pour
   qu'il redémarre tout seul.

## 7. Deux formes de déploiement possibles (au choix selon l'hébergeur)

- **A. Docker** — un `Dockerfile` est déjà prêt (`FH_DATA_DIR=/data`, port 8080). Idéal si
  l'hébergeur accepte les conteneurs. Monter un volume persistant sur `/data`.
- **B. Python « nu »** — cloner le dossier, `pip install -r requirements.txt`, lancer
  uvicorn sous systemd, mettre un reverse proxy HTTPS devant. Idéal sur un VPS classique.

## 8. Infos que l'utilisateur doit fournir à l'agent

Pour choisir la bonne méthode, l'agent aura besoin de savoir :

- [ ] **Type d'hébergeur** (VPS type OVH/Hetzner/DigitalOcean ? PaaS ? hébergement mutualisé cPanel ? conteneurs ?)
- [ ] **Mode d'accès** (SSH ? tableau de bord web ? Git push ?)
- [ ] **Le nom de domaine** et qui gère le DNS
- [ ] **La clé `ANTHROPIC_API_KEY`** à injecter en secret
- [ ] Un **emplacement persistant** disponible pour `freehub.db`

⚠️ Un **hébergement mutualisé classique** (type cPanel PHP) ne fait généralement **pas**
tourner un process Python long-running : il faut un VPS, un support ASGI/WSGI Python, ou
un hébergeur qui accepte Docker.

## 9. Vérifier que ça marche

- `GET /` renvoie la page (200) → le front est servi.
- Créer un compte puis se reconnecter → l'auth + SQLite fonctionnent.
- Lancer un simulateur → si résultat OK, la clé API est bien branchée.
- Ouvrir *Nos partenaires* → *Devenir partenaire* → envoyer → « Demande envoyée ! ».
  La demande est stockée dans la table `partner_requests` de `freehub.db`.

---

## 10. O2Switch — étapes concrètes (hébergeur retenu)

O2Switch = hébergement mutualisé **cPanel**. Trois bonnes nouvelles par rapport à un
PaaS conteneurisé :

- ✅ **Système de fichiers persistant** → `freehub.db` (comptes + demandes partenaires)
  se conserve tout seul. **Aucun volume à gérer.**
- ✅ **AutoSSL gratuit (Let's Encrypt)** → HTTPS automatique sur le domaine.
- ✅ **SSH disponible** + gestionnaire d'applications Python (**Passenger**).

**Un seul point technique, déjà réglé :** Passenger parle **WSGI**, or FastAPI est
**ASGI**. Le pont est fourni dans le dossier — `passenger_wsgi.py` (qui utilise `a2wsgi`).
Ce montage a été **testé et validé** (page servie, création de compte + cookie, formulaire
partenaire). Rien d'autre à coder.

### Fichiers à envoyer sur O2Switch

`server.py`, `index.html` (landing publique), `app.html` (le dashboard),
`assets/` (tout le dossier), `requirements.txt`, `passenger_wsgi.py`.
**Ne PAS envoyer** : `freehub.db` (base de dev), `.env`, `Dockerfile`, `fly.toml`,
`DEPLOY.md`, `Lancer FreeHub.command` (inutiles ici).

### Étapes dans cPanel

1. **Domaine / sous-domaine** — choisir le domaine ou un sous-domaine (ex.
   `app.tondomaine.fr`) et le rattacher à un dossier, ex. `~/freehub`.

2. **Récupérer le projet** dans ce dossier. Le code est sur GitHub (dépôt **privé**) :
   ```
   git clone https://github.com/Louismarie399/freehub.git ~/freehub
   ```
   Le clone demandera l'identifiant GitHub et un token d'accès personnel (portées
   `repo` + `workflow`). À défaut de git sur le serveur : `rsync`/`scp` depuis le Mac,
   ou le Gestionnaire de fichiers cPanel, en suivant la liste ci-dessus.

   ⚠️ Après le clone, `freehub.db` **n'existe pas** (il est volontairement exclu du
   dépôt) : la base de production se crée vide au premier démarrage dans `FH_DATA_DIR`.
   C'est le comportement attendu.

3. **cPanel → « Setup Python App » / Application Manager** :
   - *Python version* : la plus récente proposée (**≥ 3.9**).
   - *Application root* : `freehub` (le dossier ci-dessus).
   - *Application URL* : le domaine/sous-domaine choisi.
   - *Application startup file* : `passenger_wsgi.py`
   - *Application Entry point* : `application`
   - Créer → cPanel génère un **virtualenv** dédié.

4. **Variables d'environnement** (section de cette même page) :
   | Variable | Valeur |
   |---|---|
   | `ANTHROPIC_API_KEY` | *(la clé Claude de l'utilisateur)* |
   | `COOKIE_SECURE` | `1` |
   | `FH_DATA_DIR` | un chemin **persistant hors du dossier de code**, ex. `/home/TONUSER/freehub_data` — pour que la base survive à un re-téléversement du code. (Le dossier se crée tout seul au démarrage.) |

5. **Installer les dépendances** : bouton **« Run Pip Install »** de la page (cible
   `requirements.txt`) ; ou en SSH, activer le venv (la commande `source .../activate`
   est affichée par cPanel) puis :
   ```
   pip install -r requirements.txt
   ```
   ⚠️ Si `uvicorn[standard]` échoue à l'installation (compilation), ce n'est **pas
   bloquant** : uvicorn n'est pas utilisé sous Passenger. Installer alors seulement :
   ```
   pip install fastapi anthropic a2wsgi
   ```

6. **Redémarrer l'application** (bouton *Restart*), puis ouvrir l'URL.

7. **HTTPS** : vérifier qu'AutoSSL est actif pour le domaine (cPanel → SSL/TLS Status).
   Confirmer que `https://…` répond. `COOKIE_SECURE=1` (étape 4) rend alors le cookie
   de session `Secure`.

### Après mise en ligne — utile

- **Voir les demandes partenaires** (en SSH) :
  ```
  sqlite3 /home/TONUSER/freehub_data/freehub.db "select structure,email,categorie,message,created from partner_requests order by id desc;"
  ```
- **Mettre à jour le code** : voir §13 (déploiement automatique). Manuellement :
  re-téléverser les fichiers modifiés, puis *Restart* dans cPanel. La base (dans
  `FH_DATA_DIR`) n'est pas touchée.
- **« database is locked »** (peu probable en faible trafic) : Passenger peut lancer
  plusieurs process. Si ça arrive, activer le mode WAL de SQLite — une ligne à ajouter
  dans `server.py`. À signaler à l'auteur du projet.

### Ce que l'utilisateur doit fournir à l'agent

- [ ] Accès **cPanel** et/ou **SSH** O2Switch (identifiants).
- [ ] Le **domaine / sous-domaine** à utiliser.
- [ ] La clé **`ANTHROPIC_API_KEY`**.
- [ ] (Si connexion Google souhaitée) `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.

---

## 11. Alpha privée — les codes d'accès

Par défaut, **créer un compte exige un code d'accès** (mot de passe classique *et* Google).
Les codes se gèrent avec `codes.py`, en SSH depuis le dossier de l'app :

```
python3 codes.py add --note "Marie" --uses 1     # code aléatoire, 1 personne
python3 codes.py add --code AMIS2026 --uses 20   # code choisi, 20 places
python3 codes.py add --uses 0 --note "Illimité"  # 0 = illimité
python3 codes.py list                            # voir l'état et les compteurs
python3 codes.py revoke AMIS2026                 # couper l'accès immédiatement
python3 codes.py enable  AMIS2026                # réactiver
```

Les codes sont insensibles à la casse et aux espaces. Un code épuisé ou révoqué est
refusé, avec un message explicite côté visiteur.

**Fin de l'alpha** : poser `FH_OPEN_SIGNUP=1` ouvre les inscriptions à tous — le champ
« code d'accès » disparaît alors tout seul du formulaire.

---

## 12. Connexion Google — mise en place

1. **Google Cloud Console** → créer un projet → *API et services* → *Écran de consentement
   OAuth* (type « Externe », renseigner le nom de l'app et l'e-mail de contact).
2. *Identifiants* → **Créer des identifiants** → **ID client OAuth** → type
   **Application Web**.
3. Renseigner l'**URI de redirection autorisée**, exactement :
   ```
   https://<ton-domaine>/api/auth/google/callback
   ```
4. Copier l'ID client et le secret dans les variables d'environnement
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, et définir `FH_SITE_URL` sur l'URL
   publique (`https://<ton-domaine>`, **sans** barre oblique finale).
5. Redémarrer l'app. Le bouton « Continuer avec Google » apparaît automatiquement.

⚠️ Tant que l'écran de consentement est en mode « Test », seuls les comptes Google
ajoutés comme *utilisateurs de test* peuvent se connecter — ce qui convient très bien
à une alpha privée.

Notes de fonctionnement :
- Un compte Google **nouveau** doit fournir un code d'accès valide (saisi avant de
  cliquer sur le bouton) tant que l'alpha est active.
- Si l'e-mail Google correspond à un compte existant, les deux sont **reliés** : la
  personne peut ensuite se connecter par mot de passe ou par Google indifféremment.
- Les comptes créés via Google n'ont pas de mot de passe utilisable.

---

## 13. Déploiement automatique à chaque modification du code

Objectif : `git push` → le site en ligne se met à jour tout seul. Fichiers déjà prêts
dans le dépôt : `.github/workflows/deploy.yml`, `.deployignore`, `deploy.sh`.

### Le principe

1. Le code vit sur **GitHub**.
2. À chaque push sur `main`, **GitHub Actions** se connecte en SSH à O2Switch.
3. Il synchronise les fichiers (`rsync`), installe les dépendances si besoin,
   puis **redémarre Passenger** via `touch tmp/restart.txt`.

**Ce qui n'est jamais envoyé ni supprimé** (fichier `.deployignore`, vérifié) :
`freehub.db`, `.env`, `tmp/`, et les fichiers propres aux autres hébergeurs.
La base de production est donc **protégée** même avec `rsync --delete`.

### Mise en place (une seule fois)

**a. Créer une clé SSH dédiée au déploiement** (sur ton Mac) :
```
ssh-keygen -t ed25519 -f ~/.ssh/freehub_deploy -C "deploiement-freehub" -N ""
```

**b. Autoriser la clé publique sur O2Switch** : cPanel → *Accès SSH* → *Gérer les clés
SSH* → importer le contenu de `~/.ssh/freehub_deploy.pub`, puis **l'autoriser**.

**c. Mettre le projet sur GitHub** (dépôt **privé** de préférence) :
```
git init && git add . && git commit -m "FreeHub"
git branch -M main
git remote add origin git@github.com:<toncompte>/freehub.git
git push -u origin main
```

**d. Renseigner les secrets GitHub** (Settings → Secrets and variables → Actions) :

| Secret | Valeur |
|---|---|
| `O2S_HOST` | ex. `monsite.o2switch.net` |
| `O2S_USER` | ton identifiant cPanel |
| `O2S_PATH` | ex. `/home/tonuser/freehub` |
| `O2S_SSH_KEY` | tout le contenu de `~/.ssh/freehub_deploy` (la clé **privée**) |
| `O2S_PORT` | facultatif (22 par défaut) |

C'est fini : chaque `git push` déploie. L'onglet **Actions** de GitHub montre le
déroulé et signale toute erreur. Un bouton *Run workflow* permet aussi de relancer
un déploiement à la main.

### Variante sans GitHub — déployer depuis ton Mac

```
cp .deploy.env.exemple .deploy.env     # puis remplis tes accès
./deploy.sh --dry-run                  # montre ce qui partirait, sans rien toucher
./deploy.sh                            # déploie + redémarre
```

Toujours faire un `--dry-run` la première fois.

### Points de vigilance

- **Toujours vérifier en local avant de pousser** : sur `main`, un push part
  directement en production. Pour se protéger, travailler sur une branche et ne
  fusionner dans `main` qu'une fois testé.
- **Les migrations de base sont automatiques** (`init_db()` au démarrage ajoute les
  colonnes manquantes), mais elles n'effacent jamais de données.
- **Si le redémarrage ne prend pas** : vérifier que `O2S_PATH` est bien la racine de
  l'application déclarée dans cPanel (c'est là que doit vivre `tmp/restart.txt`).
