<?php
/**
 * FreeHub — socle commun de l'API : configuration, base, helpers.
 *
 * Transposition de server.py. Deux principes conservés à l'identique :
 *  - les mots de passe restent en PBKDF2-HMAC-SHA256, 200 000 itérations
 *    (mêmes hachages que Python : aucun compte à réinitialiser) ;
 *  - la base SQLite est celle déjà en place, reprise sans conversion.
 */

declare(strict_types=1);

// --------------------------------------------------------------------------- //
// Configuration
// --------------------------------------------------------------------------- //
// Les secrets vivent HORS du dossier web : si PHP cessait de s'exécuter, un
// fichier placé dans le site serait servi en clair (c'est ce qui a exposé
// server.py). On le charge donc depuis le dossier de données.
const FH_DEFAUTS = [
    'data_dir'             => '/home/rtym5189/freehub_data',
    'site_url'             => 'https://free-hub.fr',
    'cookie_secure'        => true,
    'open_signup'          => false,   // true = fin de l'alpha, plus de code d'accès
    'anthropic_api_key'    => '',
    'google_client_id'     => '',
    'google_client_secret' => '',
    'model'                => 'claude-sonnet-5',
];

function config(?string $cle = null)
{
    static $conf = null;
    if ($conf === null) {
        $conf = FH_DEFAUTS;
        // 1. Variables d'environnement, si l'hébergeur en transmet.
        foreach ([
            'FH_DATA_DIR' => 'data_dir', 'FH_SITE_URL' => 'site_url',
            'ANTHROPIC_API_KEY' => 'anthropic_api_key',
            'GOOGLE_CLIENT_ID' => 'google_client_id',
            'GOOGLE_CLIENT_SECRET' => 'google_client_secret',
        ] as $env => $k) {
            $v = getenv($env);
            if ($v !== false && $v !== '') $conf[$k] = $v;
        }
        if (getenv('FH_OPEN_SIGNUP') === '1') $conf['open_signup'] = true;

        // 2. Fichier de configuration hors webroot — prioritaire.
        $fichier = rtrim($conf['data_dir'], '/') . '/config.php';
        if (is_file($fichier)) {
            $perso = require $fichier;
            if (is_array($perso)) $conf = array_merge($conf, $perso);
        }
    }
    return $cle === null ? $conf : ($conf[$cle] ?? null);
}

function google_actif(): bool
{
    return config('google_client_id') !== '' && config('google_client_secret') !== '';
}

// --------------------------------------------------------------------------- //
// Réponses HTTP
// --------------------------------------------------------------------------- //
function json_reponse(array $donnees, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, must-revalidate');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function erreur(string $message, int $code = 400): void
{
    json_reponse(['error' => $message], $code);
}

/** Corps JSON de la requête (remplace la validation Pydantic : on valide à la main). */
function corps(): array
{
    static $c = null;
    if ($c === null) {
        $brut = file_get_contents('php://input') ?: '';
        $d = json_decode($brut, true);
        $c = is_array($d) ? $d : [];
    }
    return $c;
}

function champ(string $nom, string $defaut = ''): string
{
    $v = corps()[$nom] ?? $defaut;
    return is_scalar($v) ? trim((string) $v) : $defaut;
}

function maintenant(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.uP');
}

// --------------------------------------------------------------------------- //
// Base de données
// --------------------------------------------------------------------------- //
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dir = rtrim(config('data_dir'), '/');
        if (!is_dir($dir)) @mkdir($dir, 0700, true);
        $pdo = new PDO('sqlite:' . $dir . '/freehub.db', null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        // WAL : autorise des lectures pendant une écriture — indispensable dès
        // que plusieurs requêtes PHP tapent la base en même temps.
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        init_db($pdo);
    }
    return $pdo;
}

function init_db(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL, pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL,
            created TEXT NOT NULL, prenom TEXT DEFAULT '', nom TEXT DEFAULT '');
        CREATE TABLE IF NOT EXISTS data(
            user_id INTEGER PRIMARY KEY, blob TEXT NOT NULL, updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(
            token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS partner_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT, structure TEXT NOT NULL, email TEXT NOT NULL,
            site TEXT, categorie TEXT, message TEXT, created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS invite_codes(
            code TEXT PRIMARY KEY, note TEXT DEFAULT '', max_uses INTEGER DEFAULT 1,
            uses INTEGER DEFAULT 0, actif INTEGER DEFAULT 1, created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS oauth_states(
            state TEXT PRIMARY KEY, mode TEXT NOT NULL, code TEXT DEFAULT '', created TEXT NOT NULL);
        -- Espace d'entraide. `supprime` est un effacement DOUX : le message
        -- disparaît pour tout le monde mais reste consultable par un admin,
        -- ce qui permet de traiter un signalement sans perdre la preuve.
        CREATE TABLE IF NOT EXISTS chat_messages(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            contenu TEXT NOT NULL,
            created TEXT NOT NULL,
            supprime INTEGER DEFAULT 0,
            supprime_par INTEGER DEFAULT NULL,
            signale INTEGER DEFAULT 0);
        CREATE INDEX IF NOT EXISTS idx_chat_id ON chat_messages(id);
        -- Un utilisateur réduit au silence ne peut plus écrire ; il continue de
        -- lire, ce qui évite qu'il se recrée un compte dans la foulée.
        CREATE TABLE IF NOT EXISTS chat_muets(
            user_id INTEGER PRIMARY KEY, jusqu_a TEXT NOT NULL, motif TEXT DEFAULT '');
        -- Réactions : une par membre, par message et par emoji (liste fermée).
        CREATE TABLE IF NOT EXISTS chat_reactions(
            message_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL, created TEXT NOT NULL,
            PRIMARY KEY(message_id, user_id, emoji));
        -- Présence : dernier passage de chaque membre dans l'Entraide. Sert aux
        -- compteurs « en ligne » (vu < 2 min) et « membres passés par ici ».
        CREATE TABLE IF NOT EXISTS chat_presence(
            user_id INTEGER PRIMARY KEY, vu TEXT NOT NULL);
        -- Retours et réclamations (la bulle d'aide) ; `identite` sert au débit.
        CREATE TABLE IF NOT EXISTS sav_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
            identite TEXT NOT NULL, email TEXT DEFAULT '', type TEXT DEFAULT '',
            message TEXT NOT NULL, created TEXT NOT NULL, traite INTEGER DEFAULT 0);
        -- La question de la semaine, et une voix par membre.
        CREATE TABLE IF NOT EXISTS chat_sondages(
            id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT NOT NULL,
            options TEXT NOT NULL, created TEXT NOT NULL, actif INTEGER DEFAULT 1);
        CREATE TABLE IF NOT EXISTS chat_votes(
            sondage_id INTEGER NOT NULL, user_id INTEGER NOT NULL, choix INTEGER NOT NULL,
            PRIMARY KEY(sondage_id, user_id));
        -- Préférences de notification, une ligne par membre. `cles` est un
        -- objet JSON { echeances:1, recap:0, … } ; `jeton` sert au lien de
        -- désinscription en un clic, sans connexion.
        CREATE TABLE IF NOT EXISTS notif_prefs(
            user_id INTEGER PRIMARY KEY, cles TEXT NOT NULL DEFAULT '{}',
            jeton TEXT NOT NULL DEFAULT '', maj TEXT NOT NULL DEFAULT '');
        -- Journal des envois : garantit qu'une même échéance n'est notifiée
        -- qu'une fois, même si le cron passe plusieurs fois par jour.
        CREATE TABLE IF NOT EXISTS notif_envois(
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            genre TEXT NOT NULL, reference TEXT NOT NULL, envoye TEXT NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_unique
            ON notif_envois(user_id, genre, reference);
    ");
    // Migration douce, comme en Python : ajoute les colonnes manquantes.
    $cols = array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(), 'name');
    foreach (['prenom' => "TEXT DEFAULT ''", 'nom' => "TEXT DEFAULT ''",
              'google_sub' => "TEXT DEFAULT ''", 'invite_code' => "TEXT DEFAULT ''",
              'is_admin' => 'INTEGER DEFAULT 0', 'beta' => 'INTEGER DEFAULT 0'] as $c => $type) {
        if (!in_array($c, $cols, true)) $pdo->exec("ALTER TABLE users ADD COLUMN $c $type");
    }
    // Apartés : un message peut répondre à un message du fil principal.
    $colsChat = array_column($pdo->query('PRAGMA table_info(chat_messages)')->fetchAll(), 'name');
    if (!in_array('parent_id', $colsChat, true)) {
        $pdo->exec('ALTER TABLE chat_messages ADD COLUMN parent_id INTEGER DEFAULT NULL');
    }
    // Les demandes de partenariat rejoignent la file admin : état « traité ».
    $colsPart = array_column($pdo->query('PRAGMA table_info(partner_requests)')->fetchAll(), 'name');
    if (!in_array('traite', $colsPart, true)) {
        $pdo->exec('ALTER TABLE partner_requests ADD COLUMN traite INTEGER DEFAULT 0');
    }
    $colsSav = array_column($pdo->query('PRAGMA table_info(sav_requests)')->fetchAll(), 'name');
    if (!in_array('type', $colsSav, true)) {
        $pdo->exec("ALTER TABLE sav_requests ADD COLUMN type TEXT DEFAULT ''");
    }
    // Une suggestion traitée est annoncée à son auteur, une seule fois : cette
    // colonne retient si le message lui a déjà été montré.
    if (!in_array('annonce', $colsSav, true)) {
        $pdo->exec('ALTER TABLE sav_requests ADD COLUMN annonce INTEGER DEFAULT 0');
    }
    // Un retour appelle souvent un aller-retour : « tu as regardé au bon
    // endroit ? ». Chaque réclamation porte donc son fil, clos quand elle
    // passe en traité. `lu` ne concerne que le destinataire de la réponse.
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS sav_reponses(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demande_id INTEGER NOT NULL,
            admin INTEGER DEFAULT 0,
            message TEXT NOT NULL,
            created TEXT NOT NULL,
            lu INTEGER DEFAULT 0)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_sav_reponses ON sav_reponses(demande_id)');
    // Journal des orientations BIC/BNC : sert uniquement à plafonner les
    // appels payants à l'API, on n'y garde ni la question ni la réponse.
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS categorie_appels(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_categorie_appels
                ON categorie_appels(user_id, created)');
    // Parrainage : un code personnel par membre. `parrain_id` relie le code à
    // son propriétaire ; les codes d'ouverture (ALPHA-2026) restent sans
    // parrain et ne comptent donc pour personne.
    $colsCodes = array_column($pdo->query('PRAGMA table_info(invite_codes)')->fetchAll(), 'name');
    if (!in_array('parrain_id', $colsCodes, true)) {
        $pdo->exec('ALTER TABLE invite_codes ADD COLUMN parrain_id INTEGER DEFAULT NULL');
    }
    // Un filleul ne compte qu'une fois son arrivée terminée : la ligne est
    // écrite à ce moment-là, pas à l'inscription. Sans quoi le classement se
    // gagnerait avec des adresses jetables.
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS parrainages(
            filleul_id INTEGER PRIMARY KEY,
            parrain_id INTEGER NOT NULL,
            created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_parrainages ON parrainages(parrain_id)');
}

// --------------------------------------------------------------------------- //
// Mots de passe et sessions
// --------------------------------------------------------------------------- //
const PBKDF2_ITERS = 200000;
const COOKIE = 'fh_session';

/** Strictement équivalent à hashlib.pbkdf2_hmac('sha256', …, 200000).hex() en Python. */
function hash_pw(string $mdp, string $sel_hex): string
{
    return hash_pbkdf2('sha256', $mdp, hex2bin($sel_hex), PBKDF2_ITERS, 0, false);
}

function sel_aleatoire(): string
{
    return bin2hex(random_bytes(16));
}

function jeton(int $octets = 32): string
{
    return rtrim(strtr(base64_encode(random_bytes($octets)), '+/', '-_'), '=');
}

function ouvrir_session(int $user_id): string
{
    $t = jeton();
    $st = db()->prepare('INSERT INTO sessions(token, user_id, created) VALUES (?,?,?)');
    $st->execute([$t, $user_id, maintenant()]);
    return $t;
}

function poser_cookie(string $token): void
{
    setcookie(COOKIE, $token, [
        'expires'  => time() + 60 * 60 * 24 * 30,
        'path'     => '/',
        'httponly' => true,                    // inaccessible au JavaScript
        'secure'   => (bool) config('cookie_secure'),
        'samesite' => 'Lax',
    ]);
}

/** Utilisateur de la session courante, ou null. */
function utilisateur_courant(): ?array
{
    $t = $_COOKIE[COOKIE] ?? '';
    if ($t === '') return null;
    $st = db()->prepare(
        'SELECT u.id, u.email, u.prenom, u.nom, u.is_admin, u.beta
         FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?');
    $st->execute([$t]);
    return $st->fetch() ?: null;
}

function exige_connexion(): array
{
    $u = utilisateur_courant();
    if (!$u) erreur('Non connecté.', 401);
    return $u;
}

/** ⚠️ Le contrôle admin se fait ICI, côté serveur : masquer l'onglet ne protège rien. */
function exige_admin(): array
{
    $u = exige_connexion();
    if (!$u['is_admin']) erreur('Accès réservé aux administrateurs.', 403);
    return $u;
}

// --------------------------------------------------------------------------- //
// Codes d'accès de l'alpha
// --------------------------------------------------------------------------- //
function code_valide(string $code): ?array
{
    $code = strtoupper(trim($code));
    if ($code === '') return null;
    $st = db()->prepare('SELECT * FROM invite_codes WHERE UPPER(code) = ?');
    $st->execute([$code]);
    $r = $st->fetch();
    if (!$r || !$r['actif']) return null;
    if ($r['max_uses'] && $r['uses'] >= $r['max_uses']) return null;
    return $r;
}

function consommer_code(array $code): void
{
    $st = db()->prepare('UPDATE invite_codes SET uses = uses + 1 WHERE code = ?');
    $st->execute([$code['code']]);
}

function refus_code(): void
{
    erreur("Code d'accès invalide ou déjà utilisé. "
         . "FreeHub est en alpha privée jusqu'en septembre 2026.", 403);
}

const EMAIL_RE = '/^[^@\s]+@[^@\s]+\.[^@\s]+$/';
