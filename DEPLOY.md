# Mettre FreeHub en ligne (Fly.io)

Le repo est prêt : `Dockerfile`, `fly.toml`, `.dockerignore` et lecture de la config
par variables d'environnement. Suis ces étapes une fois.

## 0. Installer flyctl (la CLI Fly)

```
brew install flyctl
```

(ou `curl -L https://fly.io/install.sh | sh`)

Puis crée/connecte ton compte :

```
fly auth signup
```

## 1. Créer l'app (sans déployer tout de suite)

Depuis le dossier `free-hub/` :

```
fly launch --no-deploy
```

- Fly détecte le `Dockerfile` et le `fly.toml`.
- Garde la région **cdg** (Paris).
- Si le nom `freehub` est déjà pris, Fly en propose un autre et met à jour
  le champ `app` de `fly.toml` automatiquement. Note ce nom.

## 2. Créer le volume persistant (la base y vit)

```
fly volumes create freehub_data --region cdg --size 1
```

1 Go suffit très largement pour SQLite. **C'est ce qui fait survivre les comptes
et les demandes partenaires aux redéploiements.**

## 3. Donner la clé API Claude (secret, jamais dans le code)

```
fly secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

## 4. Déployer

```
fly deploy
```

## 5. Rester sur une seule machine

SQLite = un seul écrivain. On force une machine unique attachée au volume :

```
fly scale count 1
```

## 6. Ouvrir le site

```
fly open
```

Tu obtiens une URL `https://<ton-app>.fly.dev` — HTTPS actif, donc la **synchro des
comptes fonctionne enfin**, et le cookie de session passe en `Secure` tout seul
(détecté via `FLY_APP_NAME`).

---

## Rappels

- **Coût API** : chaque simulateur qui appelle `/api/analyze` consomme des crédits
  sur le compte Anthropic de la clé ci-dessus. À surveiller dès l'ouverture au public.
- **Mises à jour** : après une modif de code, un simple `fly deploy` suffit. Le
  volume (donc les données) n'est pas touché.
- **Voir les demandes partenaires** : elles sont en base sur le volume. Pour les
  consulter le temps qu'on branche un e-mail :
  ```
  fly ssh console -C "python -c \"import sqlite3;print(sqlite3.connect('/data/freehub.db').execute('select structure,email,categorie,message,created from partner_requests order by id desc').fetchall())\""
  ```
- **Sauvegarde de la base** :
  ```
  fly ssh console -C "cat /data/freehub.db" > sauvegarde-freehub.db
  ```
