#!/usr/bin/env python3
"""Gestion des comptes FreeHub (admin, bêta testeurs).

    python3 admin.py list                                  # tous les comptes
    python3 admin.py create --email x@y.fr --admin         # créer (mdp généré)
    python3 admin.py create --email x@y.fr --password "…"  # créer avec un mdp choisi
    python3 admin.py promote x@y.fr                        # rendre admin
    python3 admin.py demote  x@y.fr                        # retirer l'admin
    python3 admin.py beta    x@y.fr                        # marquer bêta testeur
    python3 admin.py passwd  x@y.fr                        # regénérer le mot de passe

La base est celle du serveur (FH_DATA_DIR si défini, sinon le dossier du projet).
⚠️ À lancer SUR LE SERVEUR pour créer un compte en production : la base de
production est distincte de celle de développement.
"""
import argparse
import hashlib
import os
import re
import secrets
import sqlite3
import string
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB = Path(os.environ.get("FH_DATA_DIR", str(HERE))) / "freehub.db"
PBKDF2_ITERS = 200_000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def conn():
    c = sqlite3.connect(str(DB))
    c.row_factory = sqlite3.Row
    return c


def hash_pw(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"),
                               bytes.fromhex(salt), PBKDF2_ITERS).hex()


def mdp_solide(n=16):
    """Mot de passe lisible : lettres, chiffres et quelques signes sans ambiguïté."""
    alphabet = string.ascii_letters + string.digits + "!@#$%-_"
    return "".join(secrets.choice(alphabet) for _ in range(n))


def _table_prete(c):
    if not c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").fetchone():
        raise SystemExit(
            f"❌ Aucune base à {DB}.\n"
            "   Lance le serveur une première fois pour qu'il crée les tables."
        )


def cmd_create(args):
    c = conn()
    _table_prete(c)
    email = args.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise SystemExit("❌ Adresse e-mail invalide.")
    if c.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise SystemExit(f"❌ Un compte existe déjà pour {email}. "
                         f"Utilise « promote » ou « passwd ».")
    mdp = args.password or mdp_solide()
    if len(mdp) < 8:
        raise SystemExit("❌ Le mot de passe doit faire au moins 8 caractères.")
    salt = secrets.token_hex(16)
    c.execute(
        "INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, "
        "is_admin, beta, invite_code, google_sub) VALUES (?,?,?,?,?,?,?,?,'','')",
        (email, hash_pw(mdp, salt), salt, datetime.now(timezone.utc).isoformat(),
         args.prenom or "", args.nom or "", 1 if args.admin else 0, 0 if args.no_beta else 1))
    c.commit()
    print(f"✅ Compte créé : {email}")
    print(f"   Mot de passe : {mdp}")
    print(f"   Rôles : {'admin + ' if args.admin else ''}{'' if args.no_beta else 'bêta testeur'}")
    if not args.password:
        print("   ⚠️ Note-le maintenant : il n'est pas récupérable ensuite.")


def cmd_list(args):
    c = conn()
    _table_prete(c)
    lignes = c.execute("SELECT email, prenom, nom, is_admin, beta, created "
                       "FROM users ORDER BY created").fetchall()
    if not lignes:
        print("Aucun compte.")
        return
    print(f"{'E-MAIL':<34} {'RÔLES':<20} NOM")
    print("-" * 74)
    for r in lignes:
        roles = " ".join(filter(None, ["admin" if r["is_admin"] else "",
                                       "bêta" if r["beta"] else ""])) or "—"
        nom = " ".join(filter(None, [r["prenom"] or "", r["nom"] or ""]))
        print(f"{r['email']:<34} {roles:<20} {nom}")


def _maj(email, champ, valeur, message):
    c = conn()
    _table_prete(c)
    n = c.execute(f"UPDATE users SET {champ} = ? WHERE email = ?",
                  (valeur, email.strip().lower())).rowcount
    c.commit()
    print(message.format(email=email.strip().lower()) if n else f"⚠️ Compte introuvable : {email}")


def cmd_passwd(args):
    c = conn()
    _table_prete(c)
    email = args.email.strip().lower()
    if not c.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise SystemExit(f"⚠️ Compte introuvable : {email}")
    mdp = args.password or mdp_solide()
    salt = secrets.token_hex(16)
    c.execute("UPDATE users SET pw_hash = ?, pw_salt = ? WHERE email = ?",
              (hash_pw(mdp, salt), salt, email))
    # Les sessions ouvertes deviennent caduques : on force une reconnexion.
    c.execute("DELETE FROM sessions WHERE user_id = "
              "(SELECT id FROM users WHERE email = ?)", (email,))
    c.commit()
    print(f"✅ Nouveau mot de passe pour {email} : {mdp}")
    print("   Les sessions ouvertes ont été fermées.")


def main():
    p = argparse.ArgumentParser(description="Comptes FreeHub")
    sub = p.add_subparsers(dest="cmd", required=True)

    cr = sub.add_parser("create", help="créer un compte")
    cr.add_argument("--email", required=True)
    cr.add_argument("--password", help="sinon, généré automatiquement")
    cr.add_argument("--prenom", default="")
    cr.add_argument("--nom", default="")
    cr.add_argument("--admin", action="store_true", help="donner le rôle admin")
    cr.add_argument("--no-beta", action="store_true", help="ne pas marquer bêta testeur")
    cr.set_defaults(func=cmd_create)

    sub.add_parser("list", help="lister les comptes").set_defaults(func=cmd_list)

    for nom, champ, val, msg in [
        ("promote", "is_admin", 1, "✅ {email} est désormais admin."),
        ("demote", "is_admin", 0, "✅ {email} n'est plus admin."),
        ("beta", "beta", 1, "✅ {email} est marqué bêta testeur."),
        ("unbeta", "beta", 0, "✅ {email} n'est plus bêta testeur."),
    ]:
        sp = sub.add_parser(nom)
        sp.add_argument("email")
        sp.set_defaults(func=lambda a, c=champ, v=val, m=msg: _maj(a.email, c, v, m))

    pw = sub.add_parser("passwd", help="regénérer le mot de passe")
    pw.add_argument("email")
    pw.add_argument("--password", help="sinon, généré automatiquement")
    pw.set_defaults(func=cmd_passwd)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
