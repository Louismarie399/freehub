#!/usr/bin/env python3
"""Gestion des codes d'accès de l'alpha FreeHub.

    python3 codes.py list                      # tout voir
    python3 codes.py add                       # 1 code aléatoire, 1 utilisation
    python3 codes.py add --note "Marie" --uses 1
    python3 codes.py add --code AMIS2026 --uses 20 --note "Vague amis"
    python3 codes.py add --uses 0 --note "Illimité"      # 0 = illimité
    python3 codes.py revoke AMIS2026           # désactive
    python3 codes.py enable  AMIS2026          # réactive

La base est celle du serveur (FH_DATA_DIR si défini, sinon le dossier du projet).
"""
import argparse
import os
import secrets
import sqlite3
import string
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB = Path(os.environ.get("FH_DATA_DIR", str(HERE))) / "freehub.db"

# Sans I, O, 0, 1 : on lit ces codes à voix haute ou on les recopie à la main.
ALPHABET = "".join(c for c in string.ascii_uppercase + string.digits if c not in "IO01")


def conn():
    c = sqlite3.connect(str(DB))
    c.row_factory = sqlite3.Row
    # Le serveur crée la table au démarrage ; on la crée aussi ici pour pouvoir
    # préparer des codes avant le tout premier lancement.
    c.execute("""CREATE TABLE IF NOT EXISTS invite_codes(
        code TEXT PRIMARY KEY, note TEXT DEFAULT '', max_uses INTEGER DEFAULT 1,
        uses INTEGER DEFAULT 0, actif INTEGER DEFAULT 1, created TEXT NOT NULL)""")
    return c


def code_aleatoire(n=8):
    return "".join(secrets.choice(ALPHABET) for _ in range(n))


def cmd_add(args):
    c = conn()
    code = (args.code or code_aleatoire()).strip().upper()
    if c.execute("SELECT 1 FROM invite_codes WHERE UPPER(code)=?", (code,)).fetchone():
        print(f"⚠️  Le code {code} existe déjà.")
        return
    c.execute("INSERT INTO invite_codes(code, note, max_uses, uses, actif, created) "
              "VALUES (?,?,?,0,1,?)",
              (code, args.note or "", max(0, args.uses), datetime.now(timezone.utc).isoformat()))
    c.commit()
    limite = "illimité" if args.uses == 0 else f"{args.uses} utilisation(s)"
    print(f"✅ Code créé : {code}   ({limite})" + (f" — {args.note}" if args.note else ""))


def cmd_list(args):
    lignes = conn().execute("SELECT * FROM invite_codes ORDER BY created DESC").fetchall()
    if not lignes:
        print("Aucun code. Crée-en un :  python3 codes.py add --note \"Prénom\"")
        return
    print(f"{'CODE':<12} {'UTILISÉ':<10} {'ÉTAT':<10} NOTE")
    print("-" * 58)
    for r in lignes:
        total = "∞" if not r["max_uses"] else str(r["max_uses"])
        etat = "actif" if r["actif"] else "révoqué"
        if r["actif"] and r["max_uses"] and r["uses"] >= r["max_uses"]:
            etat = "épuisé"
        print(f"{r['code']:<12} {str(r['uses']) + '/' + total:<10} {etat:<10} {r['note'] or ''}")


def _set_actif(code, actif):
    c = conn()
    n = c.execute("UPDATE invite_codes SET actif=? WHERE UPPER(code)=?",
                  (actif, code.strip().upper())).rowcount
    c.commit()
    if not n:
        print(f"⚠️  Code introuvable : {code}")
    else:
        print(("✅ Réactivé : " if actif else "🚫 Révoqué : ") + code.strip().upper())


def main():
    p = argparse.ArgumentParser(description="Codes d'accès de l'alpha FreeHub")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("add", help="créer un code")
    a.add_argument("--code", help="code choisi (sinon aléatoire)")
    a.add_argument("--note", default="", help="à qui il est destiné")
    a.add_argument("--uses", type=int, default=1, help="nombre d'utilisations (0 = illimité)")
    a.set_defaults(func=cmd_add)

    sub.add_parser("list", help="lister les codes").set_defaults(func=cmd_list)

    r = sub.add_parser("revoke", help="désactiver un code")
    r.add_argument("code")
    r.set_defaults(func=lambda ar: _set_actif(ar.code, 0))

    e = sub.add_parser("enable", help="réactiver un code")
    e.add_argument("code")
    e.set_defaults(func=lambda ar: _set_actif(ar.code, 1))

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
