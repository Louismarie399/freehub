# FreeHub — infrastructure et exploitation (backend PHP)

> Document de référence après la migration Python → PHP de juillet 2026.
> L'ancien backend FastAPI/Passenger a été abandonné : l'enregistrement Passenger
> de l'app était cassé côté O2Switch et le code Python n'était jamais exécuté.
> PHP est exécuté nativement par LiteSpeed — aucune dépendance à Passenger.

## Architecture

| | |
|---|---|
| **Hébergeur** | O2Switch mutualisé cPanel — compte `rtym5189`, serveur `cronos.o2switch.net` |
| **Domaine** | `free-hub.fr` (HTTPS AutoSSL) — docroot `/home/rtym5189/free-hub.fr` |
| **Backend** | PHP 8.1 natif (aucun framework, aucun Composer) — routeur `api/index.php` |
| **Base** | SQLite via PDO (mode WAL) — `/home/rtym5189/freehub_data/freehub.db` |
| **Secrets** | `/home/rtym5189/freehub_data/config.php` (chmod 600, HORS webroot, hors git) |
| **Front** | statique : `index.html` (landing), `app.html` + `assets/` (dashboard) |
| **Mots de passe** | PBKDF2-HMAC-SHA256, 200 000 itérations — hashs identiques à l'ancien backend Python |

## Fichiers du dépôt

```
.htaccess            → protection des fichiers + routage /api/* et /app
index.html           → landing publique (auth intégrée)
app.html, assets/    → dashboard
api/index.php        → routeur (15 routes, mêmes URL/JSON que l'ancien server.py)
api/bootstrap.php    → config, PDO, PBKDF2, sessions, codes d'accès
api/routes_*.php     → auth, Google OAuth, données/admin/partenaire, analyze
api/prompt.php       → prompt système de /api/analyze (copie exacte)
outils.php           → CLI d'administration (à lancer en SSH sur le serveur)
dev.php              → serveur de développement local (php -S)
config.exemple.php   → modèle du config.php de production
.github/workflows/deploy.yml, .deployignore, deploy.sh → déploiement
```

## Déploiement automatique

`git push` sur `main` → GitHub Actions (**runner self-hosted sur le Mac de Louis**,
installé en service `svc.sh`, car O2Switch limite le SSH aux IP autorisées dans
cPanel) → `rsync --delete` avec les protections de `.deployignore` → **contrôle de
santé** sur `https://free-hub.fr/api/ping` (échec visible si l'API ne répond pas).

Rien à installer, rien à redémarrer : PHP est servi nativement.

- Secours manuel : `./deploy.sh` (ou `--dry-run`) après avoir rempli `.deploy.env`.
- Si le runner est arrêté : `cd ~/actions-runner && ./svc.sh start`.
- ⚠️ Les données de prod (`freehub_data/`) sont HORS du dossier déployé : un
  déploiement ne peut pas les toucher.

## Exploitation courante (SSH sur le serveur, dossier du site)

```
php outils.php comptes                                   # lister les comptes
php outils.php creer-admin --email x@y.fr                # créer un admin (mdp généré)
php outils.php promouvoir x@y.fr | retrograder x@y.fr
php outils.php mot-de-passe x@y.fr                       # regénérer + fermer les sessions
php outils.php codes                                     # codes d'accès alpha
php outils.php code-ajouter --code AMIS2026 --uses 20 --note "Vague amis"
php outils.php code-revoquer AMIS2026 | code-activer AMIS2026
```

Demandes partenaires :
`sqlite3 ~/freehub_data/freehub.db "select structure,email,categorie,message,created from partner_requests order by id desc;"`

## Configuration (`freehub_data/config.php`)

Voir `config.exemple.php`. Clés notables :
- `anthropic_api_key` — sans elle, `/api/analyze` renvoie une erreur explicite.
- `open_signup` — `false` = alpha privée (code d'accès obligatoire, insigne bêta
  automatique) ; `true` = inscriptions ouvertes.
- `google_client_id` / `google_client_secret` — vides = bouton Google masqué.
  URI de redirection à déclarer côté Google : `https://free-hub.fr/api/auth/google/callback`.
  (Écran de consentement en mode « Test » = seuls les comptes déclarés passent.)

## Développement local

```
brew install php            # une fois (macOS ne fournit plus PHP)
php -S 127.0.0.1:8123 dev.php
```
Base et config de dev auto-créées dans `./devdata/` — jamais celles de production.

## Sécurité — acquis à préserver

- Contrôles d'accès **côté serveur** (`exige_connexion`/`exige_admin`) : masquer un
  onglet ne protège rien.
- `.htaccess` refuse les extensions sensibles : l'époque où `server.py` était
  téléchargeable publiquement ne doit jamais revenir.
- Cookie `httponly` + `secure` + `samesite=lax` ; comparaison de hashs à temps
  constant ; jetons d'état OAuth anti-CSRF (15 min).
- Garde-fous admin : pas d'auto-retrait, jamais moins d'un administrateur.

## Comptes de référence

- Admin : `louismarie54000@gmail.com` (rôles admin + bêta).
- Code d'accès alpha : `ALPHA-2026` (illimité, révocable).
