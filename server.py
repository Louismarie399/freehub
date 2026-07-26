"""Serveur FreeHub — Simulateur de charges professionnelles.

Sert les fichiers statiques du dossier et expose une route `POST /api/analyze`
qui interroge l'API Claude pour analyser une ou plusieurs dépenses.

Lancer :  double-clic sur « Lancer FreeHub.command »
   ou :   python3 server.py          (puis http://localhost:8123)

La clé API Claude est lue, dans l'ordre :
  1. la variable d'environnement ANTHROPIC_API_KEY ;
  2. un fichier « .env » placé à côté de ce script (ANTHROPIC_API_KEY=...) ;
  3. la clé déjà enregistrée dans l'app mailing (pratique pour ne pas la
     ressaisir — supprime MAILING_DB ci-dessous pour couper ce lien).
La clé n'est jamais renvoyée au navigateur.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import anthropic
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

HERE = Path(__file__).resolve().parent          # …/free-hub
ENV_FILE = HERE / ".env"
# Repli pratique : réutilise la clé Claude déjà saisie dans l'app mailing.
MAILING_DB = Path.home() / "mailing-iconstudio" / "data" / "app.db"

# Modèle Claude. claude-opus-4-8 = raisonnement multi-critères ; bascule sur
# "claude-sonnet-5" pour réduire le coût par analyse si besoin.
MODEL = "claude-sonnet-5"

MAX_DEPENSES = 12

app = FastAPI(title="FreeHub — Simulateur")


# --------------------------------------------------------------------------- #
# Clé API
# --------------------------------------------------------------------------- #
def get_api_key() -> str:
    # 1. Variable d'environnement
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if key:
        return key

    # 2. Fichier .env local  →  ANTHROPIC_API_KEY=sk-ant-...
    try:
        if ENV_FILE.exists():
            for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY"):
                    value = line.partition("=")[2].strip().strip('"').strip("'")
                    if value:
                        return value
    except OSError:
        pass

    # 3. Clé déjà enregistrée dans l'app mailing
    try:
        conn = sqlite3.connect(str(MAILING_DB))
        row = conn.execute(
            "SELECT value FROM settings WHERE key = 'anthropic_api_key'"
        ).fetchone()
        conn.close()
        if row and row[0]:
            return row[0].strip()
    except sqlite3.Error:
        pass

    return ""


# --------------------------------------------------------------------------- #
# Prompt système — cadre le rôle, les garde-fous, les 4 statuts, le format.
# --------------------------------------------------------------------------- #
SYSTEM_PROMPT = """Tu es un assistant pédagogique spécialisé dans l'analyse PRÉLIMINAIRE de la déductibilité des dépenses professionnelles des SOCIÉTÉS FRANÇAISES soumises à un régime réel d'imposition (SAS, SASU, SARL, EURL).

Ton rôle : aider un dirigeant à comprendre si une dépense semble pouvoir être prise en charge par sa société, et sous quelles réserves. Tu ne fournis JAMAIS une validation fiscale, comptable ou juridique définitive.

PRINCIPE FISCAL (à appliquer). Une dépense est généralement susceptible d'être déduite du bénéfice si elle : (1) est engagée dans l'intérêt direct de l'entreprise ; (2) relève d'une gestion normale ; (3) est réelle ; (4) est correctement justifiée ; (5) n'est pas principalement personnelle ; (6) n'est pas manifestement excessive au regard de l'activité ; (7) est correctement comptabilisée ; (8) n'est pas exclue ou limitée par une règle particulière. Une dépense personnelle supportée par la société n'est pas une charge professionnelle : elle peut être réintégrée et, selon les cas, traitée comme un avantage en nature, une distribution ou un acte anormal de gestion.

TU DOIS :
- analyser UNIQUEMENT les informations fournies ; ne rien inventer ;
- prendre en compte l'activité EXACTE et l'usage réel décrit ; ne jamais juger sur le seul nom de la dépense ;
- distinguer trois analyses différentes : la déductibilité du bénéfice, la comptabilisation, et la récupération de la TVA ;
- signaler les usages mixtes (professionnel + personnel) et la quote-part éventuelle à ventiler ;
- rester prudent sans être alarmiste ;
- conseiller une validation par un expert-comptable quand la situation est complexe, importante ou mixte.

TU NE DOIS PAS :
- garantir qu'une dépense sera acceptée en cas de contrôle ;
- inventer une règle, un seuil ou un chiffre ;
- écrire « validé », « autorisé à 100 % » ou « garanti déductible » ;
- considérer qu'une facture suffit à rendre une dépense déductible ;
- considérer qu'un paiement par la société rend la dépense professionnelle ;
- confondre charge déductible et TVA récupérable ;
- expliquer comment maquiller une dépense personnelle ou contourner une règle fiscale.

STATUTS — un seul par dépense :
- "vert"   → "A priori justifiable" : lien professionnel direct, montant cohérent, usage principalement professionnel, pas de signal personnel important. (Ne veut PAS dire « garanti déductible ».)
- "orange" → "Possible sous conditions" : usage mixte ; restaurant, déplacement, véhicule, mobilier au domicile, vêtements, cadeaux, abonnement à avantage personnel ; montant important ; justificatif incertain ; intérêt professionnel indirect ; dépense à ventiler.
- "rouge"  → "Difficilement justifiable" : dépense principalement personnelle ou familiale, absence de lien avec l'activité, montant manifestement disproportionné, bénéficiaire personnel, apparence de libéralité. (Éviter le mot « interdit ».)
- "gris"   → "Analyse impossible en l'état" : description trop vague, informations contradictoires ou insuffisantes, situation nécessitant impérativement une validation professionnelle.

RÈGLE BLOQUANTE. Si une demande vise clairement à dissimuler une dépense personnelle, à utiliser un faux justificatif ou à contourner une obligation fiscale → statut "rouge", et "reponse" DOIT être exactement : « Cette utilisation présente un risque important. Le simulateur ne peut pas vous aider à dissimuler une dépense personnelle ou à contourner une obligation fiscale. »

CONFIANCE : "élevée", "moyenne" ou "faible" selon la QUANTITÉ et la QUALITÉ des informations fournies — jamais selon ta simple assurance. Peu d'informations → confiance "faible" et souvent statut "gris".

TVA. Ne déduis jamais que, parce qu'une dépense est professionnelle, sa TVA est récupérable. Si l'entreprise est en franchise en base → « Non applicable en franchise de TVA. » Sinon reste prudent.

BIENS DURABLES. Pour un bien durable d'un montant significatif, signale qu'il peut devoir être immobilisé puis amorti plutôt que déduit en charge.

═══════════════════════════════════════════════════════════════
STYLE — SOIS BREF. C'est une exigence, pas une préférence.
═══════════════════════════════════════════════════════════════
- "reponse" : 2 phrases MAXIMUM, 45 mots maximum au total. Va droit au fait : le lien avec l'activité, puis la réserve principale. Pas de reformulation de la question, pas de « D'après les informations fournies » systématique.
- Chaque élément de liste : une ligne, 14 mots maximum, sans phrase d'introduction.
- "conditions", "vigilance", "justificatifs", "questions" : 3 éléments maximum chacun, et seulement les plus utiles. Mieux vaut 2 éléments pertinents que 4 dilués.
- "comptable", "tva", "action" : UNE phrase courte chacun (20 mots max).
- Pas de redite entre les champs : une information n'apparaît qu'à un seul endroit.

FORMAT DE SORTIE. Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni balises autour. Le tableau "depenses" doit contenir un objet par dépense soumise, DANS LE MÊME ORDRE :
{
  "depenses": [
    {
      "statut": "vert|orange|rouge|gris",
      "libelle": "le libellé exact du statut",
      "confiance": "élevée|moyenne|faible",
      "reponse": "2 phrases max",
      "conditions": ["…"],
      "vigilance": ["…"],
      "justificatifs": ["…"],
      "comptable": "une phrase",
      "tva": "une phrase",
      "action": "une phrase",
      "questions": ["…"]
    }
  ],
  "synthese": {
    "pieces_manquantes": ["élément concret à réunir en priorité, 12 mots max", "…"]
  }
}
Les tableaux peuvent être vides. N'ajoute aucune clé supplémentaire."""


def build_user_message(p: "AnalyzeIn") -> str:
    def c(x):
        return (x or "").strip()

    ent = []
    if c(p.activite):    ent.append(f"- Activité principale : {c(p.activite)}")
    if c(p.description): ent.append(f"- Description de l'activité : {c(p.description)}")
    if c(p.categorieFiscale):
        libelles = {"venteBIC": "Vente de marchandises (BIC)",
                    "serviceBIC": "Prestations de services (BIC)",
                    "bnc": "Activité libérale (BNC)"}
        lib = libelles.get(c(p.categorieFiscale))
        if lib:          ent.append(f"- Catégorie fiscale : {lib}")
    if c(p.forme):       ent.append(f"- Forme juridique : {c(p.forme)}")
    if c(p.regime):      ent.append(f"- Régime d'imposition : {c(p.regime)}")
    if c(p.tva):         ent.append(f"- Situation au regard de la TVA : {c(p.tva)}")
    ent_block = "\n".join(ent) if ent else "- (profil d'entreprise non renseigné)"

    blocs = []
    for i, d in enumerate(p.depenses, start=1):
        lignes = [
            f"DÉPENSE {i}",
            f"- Nom : {c(d.nom) or 'non précisé'}",
            f"- Montant TTC : {c(d.montant) or 'non précisé'} €",
        ]
        if c(d.motif):
            lignes.append(f"- Motif / utilité pour l'activité : {c(d.motif)}")
        blocs.append("\n".join(lignes))
    dep_block = "\n\n".join(blocs)

    n = len(p.depenses)
    pluriel = "ces dépenses" if n > 1 else "cette dépense"
    return f"""INFORMATIONS SUR L'ENTREPRISE
{ent_block}

DÉPENSES À ANALYSER ({n})

{dep_block}

Les informations non listées n'ont pas été demandées à l'utilisateur : déduis-les si possible de l'activité, de la description et du motif ; si une information manquante est DÉTERMINANTE (notamment l'usage professionnel/personnel, le bénéficiaire ou le justificatif), signale-le et pose la question dans "questions". Analyse {pluriel} en appliquant strictement tes règles, respecte les limites de longueur, et réponds au format JSON demandé avec {n} objet(s) dans "depenses"."""


# --------------------------------------------------------------------------- #
# Parsing robuste de la réponse (Claude peut entourer le JSON de ```)
# --------------------------------------------------------------------------- #
def parse_result(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t
        if t.endswith("```"):
            t = t[:-3]
        t = t.strip()
        if t.lower().startswith("json"):
            t = t[4:].strip()
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1 and end > start:
        t = t[start : end + 1]
    return json.loads(t)


# --------------------------------------------------------------------------- #
# Route d'analyse
# --------------------------------------------------------------------------- #
class Depense(BaseModel):
    nom: str = ""
    montant: str = ""
    motif: str = ""


class AnalyzeIn(BaseModel):
    # Profil d'entreprise
    activite: str = ""
    description: str = ""
    categorieFiscale: str = ""
    forme: str = ""
    regime: str = ""
    tva: str = ""
    # Dépenses à analyser
    depenses: List[Depense] = []


@app.post("/api/analyze")
def analyze(payload: AnalyzeIn):
    if not payload.depenses:
        return JSONResponse(status_code=400, content={"error": "Aucune dépense à analyser."})
    if len(payload.depenses) > MAX_DEPENSES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Maximum {MAX_DEPENSES} dépenses par analyse."},
        )

    api_key = get_api_key()
    if not api_key:
        return JSONResponse(
            status_code=400,
            content={"error": "Clé API Claude introuvable. Définis ANTHROPIC_API_KEY, "
                              "ou crée un fichier .env avec ANTHROPIC_API_KEY=..."},
        )

    client = anthropic.Anthropic(api_key=api_key)
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_user_message(payload)}],
        )
    except anthropic.APIError as e:
        return JSONResponse(status_code=502, content={"error": f"Erreur de l'API Claude : {e}"})

    text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    try:
        result = parse_result(text)
    except (json.JSONDecodeError, ValueError):
        return JSONResponse(
            status_code=502,
            content={"error": "Réponse de l'IA illisible (JSON invalide).", "raw": text[:500]},
        )

    # Garde-fou : autant de résultats que de dépenses soumises.
    resultats = result.get("depenses")
    if not isinstance(resultats, list) or len(resultats) != len(payload.depenses):
        return JSONResponse(
            status_code=502,
            content={"error": "L'IA n'a pas renvoyé un résultat par dépense. Relance l'analyse."},
        )

    result["_model"] = MODEL
    return result


# --------------------------------------------------------------------------- #
# Comptes utilisateurs (optionnels) — base SQLite locale, mots de passe hashés.
#
# ⚠️ SÉCURITÉ : les mots de passe ne sont JAMAIS stockés en clair. On garde un
# hash PBKDF2-HMAC-SHA256 avec sel aléatoire par utilisateur. En local (HTTP sur
# 127.0.0.1) le mot de passe transite en clair sur la boucle locale, ce qui est
# acceptable ; en production, servir OBLIGATOIREMENT derrière HTTPS.
# --------------------------------------------------------------------------- #
# En prod (Fly.io), FH_DATA_DIR pointe vers un volume persistant (/data) pour que
# la base — comptes ET demandes partenaires — survive aux redéploiements. En local,
# repli sur le dossier du projet.
DATA_DIR = Path(os.environ.get("FH_DATA_DIR", str(HERE)))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB = DATA_DIR / "freehub.db"
PBKDF2_ITERS = 200_000
COOKIE = "fh_session"
# Cookie Secure activé automatiquement en prod (Fly fixe FLY_APP_NAME) ; laissé à
# False en local pour que les tests en http sur 127.0.0.1 fonctionnent encore.
COOKIE_SECURE = bool(os.environ.get("FLY_APP_NAME") or os.environ.get("COOKIE_SECURE"))


# --- Alpha sur invitation -------------------------------------------------- #
# La création de compte exige un code, distribué à la main. Mettre FH_OPEN_SIGNUP=1
# pour rouvrir les inscriptions à tous (fin de l'alpha).
OPEN_SIGNUP = os.environ.get("FH_OPEN_SIGNUP", "") == "1"

# --- Connexion Google (OAuth 2.0) ------------------------------------------ #
# Identifiants à créer dans Google Cloud Console ; sans eux, le bouton Google est
# simplement masqué et le reste de l'app fonctionne normalement.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
# URL publique du site, pour construire l'URI de redirection (ex. https://app.mondomaine.fr).
SITE_URL = os.environ.get("FH_SITE_URL", "http://127.0.0.1:8123").rstrip("/")
GOOGLE_OK = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def db():
    conn = sqlite3.connect(str(DB))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            pw_hash TEXT NOT NULL,
            pw_salt TEXT NOT NULL,
            created TEXT NOT NULL,
            prenom TEXT DEFAULT '',
            nom TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS data(
            user_id INTEGER PRIMARY KEY,
            blob TEXT NOT NULL,
            updated TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions(
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS partner_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            structure TEXT NOT NULL,
            email TEXT NOT NULL,
            site TEXT,
            categorie TEXT,
            message TEXT,
            created TEXT NOT NULL
        );
        -- Accès sur invitation pendant l'alpha : un code par personne/vague.
        -- max_uses = 0 → illimité. actif = 0 → révoqué.
        CREATE TABLE IF NOT EXISTS invite_codes(
            code TEXT PRIMARY KEY,
            note TEXT DEFAULT '',
            max_uses INTEGER DEFAULT 1,
            uses INTEGER DEFAULT 0,
            actif INTEGER DEFAULT 1,
            created TEXT NOT NULL
        );
        -- Jetons anti-CSRF du parcours Google, à durée de vie courte.
        CREATE TABLE IF NOT EXISTS oauth_states(
            state TEXT PRIMARY KEY,
            mode TEXT NOT NULL,
            code TEXT DEFAULT '',
            created TEXT NOT NULL
        );
        """
    )
    # Migration douce : les bases créées avant l'ajout de ces colonnes.
    existantes = {r["name"] for r in conn.execute("PRAGMA table_info(users)")}
    for colonne in ("prenom", "nom", "google_sub", "invite_code"):
        if colonne not in existantes:
            conn.execute(f"ALTER TABLE users ADD COLUMN {colonne} TEXT DEFAULT ''")
    conn.commit()
    conn.close()


init_db()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_pw(password: str, salt: str) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"),
                             bytes.fromhex(salt), PBKDF2_ITERS)
    return dk.hex()


def user_from_request(req: Request):
    token = req.cookies.get(COOKIE)
    if not token:
        return None
    conn = db()
    row = conn.execute(
        "SELECT u.id, u.email, u.prenom, u.nom FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ?", (token,)
    ).fetchone()
    conn.close()
    return row


def open_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn = db()
    conn.execute("INSERT INTO sessions(token, user_id, created) VALUES (?,?,?)",
                 (token, user_id, now_iso()))
    conn.commit()
    conn.close()
    return token


def set_cookie(resp: JSONResponse, token: str):
    # httponly : inaccessible au JavaScript, donc protégé du vol par XSS.
    # secure : envoyé seulement sur HTTPS (activé en prod via COOKIE_SECURE).
    resp.set_cookie(COOKIE, token, httponly=True, secure=COOKIE_SECURE,
                    samesite="lax", max_age=60 * 60 * 24 * 30)


class Credentials(BaseModel):
    email: str
    password: str
    # Renseignés à l'inscription depuis la landing ; ignorés à la connexion.
    prenom: Optional[str] = ""
    nom: Optional[str] = ""
    code: Optional[str] = ""      # code d'accès alpha


class DataIn(BaseModel):
    donnees: dict


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def code_valide(conn, code: str):
    """Retourne la ligne du code s'il est utilisable, sinon None.
    Les codes sont comparés sans tenir compte de la casse ni des espaces."""
    code = (code or "").strip().upper()
    if not code:
        return None
    row = conn.execute("SELECT * FROM invite_codes WHERE UPPER(code) = ?", (code,)).fetchone()
    if not row or not row["actif"]:
        return None
    if row["max_uses"] and row["uses"] >= row["max_uses"]:
        return None
    return row


def consommer_code(conn, code_row):
    conn.execute("UPDATE invite_codes SET uses = uses + 1 WHERE code = ?", (code_row["code"],))


def refus_code():
    return JSONResponse(
        status_code=403,
        content={"error": "Code d'accès invalide ou déjà utilisé. "
                          "FreeHub est en alpha privée jusqu'en septembre 2026."},
    )


@app.get("/api/auth/config")
def auth_config():
    """Ce que la landing doit savoir avant d'afficher ses formulaires."""
    return {"google": GOOGLE_OK, "codeRequis": not OPEN_SIGNUP}


@app.post("/api/auth/signup")
def signup(cred: Credentials):
    email = (cred.email or "").strip().lower()
    pw = cred.password or ""
    if not EMAIL_RE.match(email):
        return JSONResponse(status_code=400, content={"error": "Adresse e-mail invalide."})
    if len(pw) < 8:
        return JSONResponse(status_code=400,
                            content={"error": "Le mot de passe doit faire au moins 8 caractères."})
    conn = db()
    if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        conn.close()
        return JSONResponse(status_code=409, content={"error": "Un compte existe déjà pour cet e-mail."})
    # Alpha privée : un code d'accès valide est exigé pour créer un compte.
    code_row = None
    if not OPEN_SIGNUP:
        code_row = code_valide(conn, cred.code)
        if not code_row:
            conn.close()
            return refus_code()
    salt = secrets.token_hex(16)
    prenom = (cred.prenom or "").strip()[:80]
    nom = (cred.nom or "").strip()[:80]
    conn.execute(
        "INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, invite_code) "
        "VALUES (?,?,?,?,?,?,?)",
        (email, hash_pw(pw, salt), salt, now_iso(), prenom, nom,
         code_row["code"] if code_row else ""))
    if code_row:
        consommer_code(conn, code_row)
    conn.commit()
    uid = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]
    conn.close()
    resp = JSONResponse(content={"email": email, "prenom": prenom, "nom": nom})
    set_cookie(resp, open_session(uid))
    return resp


@app.post("/api/auth/login")
def login(cred: Credentials):
    email = (cred.email or "").strip().lower()
    conn = db()
    row = conn.execute("SELECT id, pw_hash, pw_salt, prenom, nom FROM users WHERE email = ?",
                       (email,)).fetchone()
    conn.close()
    # hmac.compare_digest : comparaison à temps constant contre les attaques temporelles.
    if not row or not hmac.compare_digest(row["pw_hash"], hash_pw(cred.password or "", row["pw_salt"])):
        return JSONResponse(status_code=401, content={"error": "E-mail ou mot de passe incorrect."})
    resp = JSONResponse(content={"email": email, "prenom": row["prenom"] or "",
                                 "nom": row["nom"] or ""})
    set_cookie(resp, open_session(row["id"]))
    return resp


@app.post("/api/auth/logout")
def logout(req: Request):
    token = req.cookies.get(COOKIE)
    if token:
        conn = db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    resp = JSONResponse(content={"ok": True})
    resp.delete_cookie(COOKIE)
    return resp


@app.get("/api/auth/me")
def me(req: Request):
    u = user_from_request(req)
    if not u:
        return JSONResponse(status_code=401, content={"error": "Non connecté."})
    return {"email": u["email"], "prenom": u["prenom"] or "", "nom": u["nom"] or ""}


@app.get("/api/data")
def get_data(req: Request):
    u = user_from_request(req)
    if not u:
        return JSONResponse(status_code=401, content={"error": "Non connecté."})
    conn = db()
    row = conn.execute("SELECT blob, updated FROM data WHERE user_id = ?", (u["id"],)).fetchone()
    conn.close()
    if not row:
        return {"donnees": {}, "updated": None}
    return {"donnees": json.loads(row["blob"]), "updated": row["updated"]}


@app.put("/api/data")
def put_data(payload: DataIn, req: Request):
    u = user_from_request(req)
    if not u:
        return JSONResponse(status_code=401, content={"error": "Non connecté."})
    conn = db()
    conn.execute(
        "INSERT INTO data(user_id, blob, updated) VALUES (?,?,?) "
        "ON CONFLICT(user_id) DO UPDATE SET blob = excluded.blob, updated = excluded.updated",
        (u["id"], json.dumps(payload.donnees), now_iso()),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "updated": now_iso()}


class PartnerReq(BaseModel):
    structure: str
    email: str
    site: Optional[str] = ""
    categorie: Optional[str] = ""
    message: Optional[str] = ""


@app.post("/api/partenaire")
def partenaire(req: PartnerReq):
    """Demande « devenir partenaire », ouverte à tous. On stocke la demande ;
    l'envoi d'un e-mail de notification se branchera ici plus tard."""
    structure = (req.structure or "").strip()
    email = (req.email or "").strip().lower()
    if not structure:
        return JSONResponse(status_code=400, content={"error": "Le nom de la structure est requis."})
    if not EMAIL_RE.match(email):
        return JSONResponse(status_code=400, content={"error": "Adresse e-mail invalide."})
    conn = db()
    conn.execute(
        "INSERT INTO partner_requests(structure, email, site, categorie, message, created) "
        "VALUES (?,?,?,?,?,?)",
        (structure, email, (req.site or "").strip()[:500],
         (req.categorie or "").strip()[:200], (req.message or "").strip()[:2000], now_iso()),
    )
    conn.commit()
    conn.close()
    # TODO : notifier par e-mail (SMTP / service transactionnel) à la mise en ligne.
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Connexion Google (OAuth 2.0, « Authorization Code »)
# --------------------------------------------------------------------------- #
GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo"


def google_redirect_uri() -> str:
    return f"{SITE_URL}/api/auth/google/callback"


def retour_landing(erreur: str) -> RedirectResponse:
    """Renvoie sur la landing avec un message affichable dans la modal."""
    return RedirectResponse(f"/?erreur={urllib.parse.quote(erreur)}", status_code=303)


@app.get("/api/auth/google/start")
def google_start(mode: str = "signup", code: str = ""):
    if not GOOGLE_OK:
        return retour_landing("La connexion Google n'est pas encore configurée.")
    # Jeton d'état : protège du CSRF et transporte le code d'accès jusqu'au retour.
    state = secrets.token_urlsafe(24)
    conn = db()
    conn.execute("DELETE FROM oauth_states WHERE created < ?",
                 ((datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(),))
    conn.execute("INSERT INTO oauth_states(state, mode, code, created) VALUES (?,?,?,?)",
                 (state, "login" if mode == "login" else "signup", (code or "").strip(), now_iso()))
    conn.commit()
    conn.close()
    params = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    return RedirectResponse(f"{GOOGLE_AUTH}?{params}", status_code=303)


def google_echange(code: str) -> dict:
    """Échange le code d'autorisation contre les infos du compte Google."""
    donnees = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": google_redirect_uri(),
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request(GOOGLE_TOKEN, data=donnees,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=15) as r:
        jeton = json.loads(r.read())
    req2 = urllib.request.Request(
        GOOGLE_USERINFO, headers={"Authorization": "Bearer " + jeton["access_token"]})
    with urllib.request.urlopen(req2, timeout=15) as r:
        return json.loads(r.read())


@app.get("/api/auth/google/callback")
def google_callback(state: str = "", code: str = "", error: str = ""):
    if error or not code or not state:
        return retour_landing("Connexion Google annulée.")
    if not GOOGLE_OK:
        return retour_landing("La connexion Google n'est pas encore configurée.")

    conn = db()
    st = conn.execute("SELECT * FROM oauth_states WHERE state = ?", (state,)).fetchone()
    if not st:
        conn.close()
        return retour_landing("Session Google expirée. Réessaie.")
    conn.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
    conn.commit()

    try:
        infos = google_echange(code)
    except Exception:
        conn.close()
        return retour_landing("Google n'a pas répondu. Réessaie.")

    email = (infos.get("email") or "").strip().lower()
    if not email or not infos.get("email_verified", True):
        conn.close()
        return retour_landing("Adresse Google non vérifiée.")
    sub = infos.get("sub") or ""

    user = conn.execute("SELECT id, google_sub FROM users WHERE email = ?", (email,)).fetchone()
    if user:
        # Compte existant : on le relie au compte Google au premier passage.
        if not user["google_sub"]:
            conn.execute("UPDATE users SET google_sub = ? WHERE id = ?", (sub, user["id"]))
        uid = user["id"]
    else:
        # Nouveau compte : soumis au code d'accès de l'alpha, comme l'inscription classique.
        code_row = None
        if not OPEN_SIGNUP:
            code_row = code_valide(conn, st["code"])
            if not code_row:
                conn.close()
                return retour_landing(
                    "Il faut un code d'accès valide pour créer un compte (alpha privée).")
        # Pas de mot de passe utilisable : la connexion se fait via Google.
        salt = secrets.token_hex(16)
        conn.execute(
            "INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, google_sub, invite_code) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (email, hash_pw(secrets.token_urlsafe(32), salt), salt, now_iso(),
             (infos.get("given_name") or "")[:80], (infos.get("family_name") or "")[:80],
             sub, code_row["code"] if code_row else ""))
        if code_row:
            consommer_code(conn, code_row)
        uid = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]
    conn.commit()
    conn.close()

    resp = RedirectResponse("/app", status_code=303)
    set_cookie(resp, open_session(uid))
    return resp


# Le dashboard vit sous /app ; « / » sert la landing publique (index.html).
@app.get("/app")
def dashboard():
    return FileResponse(str(HERE / "app.html"), media_type="text/html")


# Pas de cache : sans ça, le navigateur garde app.js et app.css en mémoire et on
# continue de voir l'ancienne version après une modification.
@app.middleware("http")
async def no_cache(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, must-revalidate"
    return response


# Fichiers statiques (index.html…). Monté en dernier pour que /api/* reste prioritaire.
app.mount("/", StaticFiles(directory=str(HERE), html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    # En local : 127.0.0.1:8123. En prod (Fly) : HOST=0.0.0.0 et PORT fourni.
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8123"))
    uvicorn.run(app, host=host, port=port)
