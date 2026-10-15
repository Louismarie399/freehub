<?php
/**
 * Brise-glace — le petit jeu de présentation pour un cours.
 *
 * Volontairement INDÉPENDANT de FreeHub : sa propre base (cours.db), ses
 * propres tables, aucun appel au bootstrap de l'application. Il partage
 * seulement le dossier de données et la chaîne de déploiement. Si ce fichier
 * casse, FreeHub ne s'en aperçoit pas.
 *
 * Une seule entrée, l'action passe en ?a=…
 */

declare(strict_types=1);

// Une API qui renvoie du JSON ou un fichier ne doit JAMAIS imprimer d'avis PHP :
// une seule ligne de dépréciation en tête de réponse casse le JSON, et corrompt
// un CSV en silence. On journalise, on n'affiche pas.
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// --------------------------------------------------------------------------- //
// Base de données
// --------------------------------------------------------------------------- //
function cours_dossier(): string
{
    // Même logique que FreeHub, mais sans charger son bootstrap : variable
    // d'environnement, puis dossier de production, puis devdata en local.
    $env = getenv('FH_DATA_DIR');
    if ($env) return rtrim($env, '/');
    if (is_dir('/home/rtym5189/freehub_data')) return '/home/rtym5189/freehub_data';
    $local = dirname(__DIR__) . '/devdata';
    if (!is_dir($local)) mkdir($local, 0700, true);
    return $local;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $pdo = new PDO('sqlite:' . cours_dossier() . '/cours.db', null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    // Une seule partie à la fois : la ligne id=1 porte tout l'état du jeu.
    $pdo->exec('CREATE TABLE IF NOT EXISTS partie(
        id INTEGER PRIMARY KEY CHECK (id = 1),
        titre TEXT NOT NULL DEFAULT "",
        etat TEXT NOT NULL DEFAULT "attente",
        idx INTEGER NOT NULL DEFAULT 0,
        mdp TEXT NOT NULL DEFAULT "",
        jeton_admin TEXT NOT NULL DEFAULT "",
        maj TEXT NOT NULL DEFAULT "")');
    $pdo->exec('INSERT OR IGNORE INTO partie(id, titre, maj)
                VALUES (1, "Faisons connaissance", datetime("now"))');
    $pdo->exec('CREATE TABLE IF NOT EXISTS questions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ordre INTEGER NOT NULL,
        texte TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS eleves(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        jeton TEXT NOT NULL,
        vu TEXT NOT NULL,
        created TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS reponses(
        question_id INTEGER NOT NULL,
        eleve_id INTEGER NOT NULL,
        texte TEXT NOT NULL,
        created TEXT NOT NULL,
        PRIMARY KEY (question_id, eleve_id))');
    return $pdo;
}

// --------------------------------------------------------------------------- //
// Utilitaires
// --------------------------------------------------------------------------- //
function sortie(array $d, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE);
    exit;
}
function oups(string $m, int $code = 400): never { sortie(['erreur' => $m], $code); }

function corps(): array
{
    $brut = file_get_contents('php://input') ?: '';
    $d = json_decode($brut, true);
    return is_array($d) ? $d : [];
}
function champ(string $c, int $max = 400): string
{
    return mb_substr(trim((string) (corps()[$c] ?? '')), 0, $max);
}
function maintenant(): string { return gmdate('Y-m-d H:i:s'); }
function jeton(): string { return bin2hex(random_bytes(16)); }

function partie(): array { return db()->query('SELECT * FROM partie WHERE id = 1')->fetch(); }

function toucher(): void
{
    db()->prepare('UPDATE partie SET maj = ? WHERE id = 1')->execute([maintenant()]);
}

/** L'animateur, reconnu à son jeton. Tout ce qui pilote la partie passe par là. */
function exige_admin(): void
{
    $p = partie();
    $j = $_COOKIE['cours_admin'] ?? '';
    if ($p['jeton_admin'] === '' || $j === '' || !hash_equals($p['jeton_admin'], $j)) {
        oups('Accès réservé à l’animateur.', 401);
    }
}

function questions(): array
{
    return db()->query('SELECT id, ordre, texte FROM questions ORDER BY ordre')->fetchAll();
}

// --------------------------------------------------------------------------- //
// Actions
// --------------------------------------------------------------------------- //
$a = (string) ($_GET['a'] ?? '');

try {

// ---- Côté élève ------------------------------------------------------------
if ($a === 'rejoindre') {
    $nom = champ('nom', 60);
    if (mb_strlen($nom) < 2) oups('Indique ton prénom (2 caractères minimum).');
    $p = partie();
    if ($p['etat'] === 'fini') oups('La partie est terminée.', 409);

    // Un même prénom qui revient = la même personne qui a rechargé sa page.
    // On lui rend son jeton plutôt que de créer un doublon dans la liste.
    $st = db()->prepare('SELECT * FROM eleves WHERE lower(nom) = lower(?)');
    $st->execute([$nom]);
    $e = $st->fetch();
    if (!$e) {
        $j = jeton();
        db()->prepare('INSERT INTO eleves(nom, jeton, vu, created) VALUES (?,?,?,?)')
            ->execute([$nom, $j, maintenant(), maintenant()]);
        $e = ['id' => (int) db()->lastInsertId(), 'nom' => $nom, 'jeton' => $j];
    }
    toucher();
    sortie(['id' => (int) $e['id'], 'nom' => $e['nom'], 'jeton' => $e['jeton']]);
}

if ($a === 'etat') {
    $p = partie();
    $jet = (string) ($_GET['jeton'] ?? '');
    $moi = null;
    if ($jet !== '') {
        $st = db()->prepare('SELECT id, nom FROM eleves WHERE jeton = ?');
        $st->execute([$jet]);
        $moi = $st->fetch() ?: null;
        // Signe de présence, pour que l'animateur voie qui est encore là.
        if ($moi) db()->prepare('UPDATE eleves SET vu = ? WHERE id = ?')
                      ->execute([maintenant(), $moi['id']]);
    }

    $qs = questions();
    $q = $qs[$p['idx']] ?? null;
    $maRep = null;
    if ($moi && $q) {
        $st = db()->prepare('SELECT texte FROM reponses WHERE question_id = ? AND eleve_id = ?');
        $st->execute([$q['id'], $moi['id']]);
        $maRep = $st->fetchColumn();
        if ($maRep === false) $maRep = null;
    }

    sortie([
        'titre'   => $p['titre'],
        'etat'    => $p['etat'],
        'idx'     => (int) $p['idx'],
        'total'   => count($qs),
        'maj'     => $p['maj'],
        'moi'     => $moi,
        'eleves'  => array_column(db()->query('SELECT nom FROM eleves ORDER BY id')->fetchAll(), 'nom'),
        'question' => $q ? ['id' => (int) $q['id'], 'texte' => $q['texte']] : null,
        'maReponse' => $maRep,
    ]);
}

if ($a === 'repondre') {
    $jet = champ('jeton', 64);
    $st = db()->prepare('SELECT id FROM eleves WHERE jeton = ?');
    $st->execute([$jet]);
    $id = $st->fetchColumn();
    if (!$id) oups('Reconnecte-toi avec ton prénom.', 401);

    $p = partie();
    if ($p['etat'] !== 'en_cours') oups('Ce n’est pas le moment de répondre.', 409);
    $qs = questions();
    $q = $qs[$p['idx']] ?? null;
    if (!$q) oups('Aucune question en cours.', 409);

    $texte = champ('texte', 2000);
    if ($texte === '') oups('Ta réponse est vide.');
    // On remplace : tant que l'animateur n'a pas changé de question, chacun
    // peut corriger ce qu'il a écrit.
    db()->prepare('INSERT INTO reponses(question_id, eleve_id, texte, created) VALUES (?,?,?,?)
                   ON CONFLICT(question_id, eleve_id) DO UPDATE SET texte = excluded.texte')
        ->execute([$q['id'], $id, $texte, maintenant()]);
    toucher();
    sortie(['ok' => true]);
}

// ---- Mot de passe de l'animateur ------------------------------------------
if ($a === 'admin-config') {
    // Dit à la page d'admin s'il faut créer le mot de passe ou le demander.
    $p = partie();
    sortie(['initialise' => $p['mdp'] !== '',
            'connecte' => ($p['jeton_admin'] !== '' && hash_equals($p['jeton_admin'], $_COOKIE['cours_admin'] ?? ''))]);
}

if ($a === 'admin-creer') {
    $p = partie();
    if ($p['mdp'] !== '') oups('Le mot de passe est déjà défini.', 409);
    $mdp = champ('mdp', 100);
    if (mb_strlen($mdp) < 6) oups('Choisis un mot de passe d’au moins 6 caractères.');
    $j = jeton();
    db()->prepare('UPDATE partie SET mdp = ?, jeton_admin = ? WHERE id = 1')
        ->execute([password_hash($mdp, PASSWORD_DEFAULT), $j]);
    setcookie('cours_admin', $j, ['expires' => time() + 86400 * 30, 'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Lax']);
    sortie(['ok' => true]);
}

if ($a === 'admin-entrer') {
    $p = partie();
    if ($p['mdp'] === '') oups('Aucun mot de passe défini.', 409);
    if (!password_verify(champ('mdp', 100), $p['mdp'])) oups('Mot de passe incorrect.', 401);
    $j = jeton();
    db()->prepare('UPDATE partie SET jeton_admin = ? WHERE id = 1')->execute([$j]);
    setcookie('cours_admin', $j, ['expires' => time() + 86400 * 30, 'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Lax']);
    sortie(['ok' => true]);
}

// ---- Côté animateur --------------------------------------------------------
if ($a === 'admin-etat') {
    exige_admin();
    $p = partie();
    $qs = questions();
    $eleves = db()->query('SELECT id, nom, vu FROM eleves ORDER BY id')->fetchAll();

    // Toutes les réponses, groupées par question : l'animateur lit en direct.
    $parQ = [];
    foreach (db()->query('SELECT question_id, eleve_id, texte FROM reponses') as $r) {
        $parQ[(int) $r['question_id']][(int) $r['eleve_id']] = $r['texte'];
    }
    $out = [];
    foreach ($qs as $i => $q) {
        $rep = [];
        foreach ($eleves as $e) {
            $t = $parQ[(int) $q['id']][(int) $e['id']] ?? null;
            if ($t !== null) $rep[] = ['nom' => $e['nom'], 'texte' => $t];
        }
        $out[] = ['id' => (int) $q['id'], 'ordre' => $i, 'texte' => $q['texte'],
                  'reponses' => $rep, 'nb' => count($rep)];
    }

    sortie(['titre' => $p['titre'], 'etat' => $p['etat'], 'idx' => (int) $p['idx'],
            'eleves' => $eleves, 'questions' => $out]);
}

if ($a === 'admin-questions') {
    exige_admin();
    $p = partie();
    if ($p['etat'] !== 'attente') {
        oups('La partie est lancée : remets-la à zéro avant de modifier les questions.', 409);
    }
    $liste = corps()['questions'] ?? [];
    if (!is_array($liste)) oups('Format inattendu.');
    $pdo = db();
    $pdo->beginTransaction();
    $pdo->exec('DELETE FROM questions');
    $st = $pdo->prepare('INSERT INTO questions(ordre, texte) VALUES (?,?)');
    $n = 0;
    foreach ($liste as $t) {
        $t = mb_substr(trim((string) $t), 0, 500);
        if ($t === '') continue;
        $st->execute([$n++, $t]);
    }
    $pdo->commit();
    toucher();
    sortie(['ok' => true, 'n' => $n]);
}

if ($a === 'admin-titre') {
    exige_admin();
    db()->prepare('UPDATE partie SET titre = ? WHERE id = 1')->execute([champ('titre', 120)]);
    toucher();
    sortie(['ok' => true]);
}

if ($a === 'admin-pilote') {
    exige_admin();
    $quoi = champ('quoi', 20);
    $p = partie();
    $n = count(questions());
    if ($quoi === 'demarrer') {
        if (!$n) oups('Ajoute au moins une question.');
        db()->prepare('UPDATE partie SET etat = "en_cours", idx = 0 WHERE id = 1')->execute();
    } elseif ($quoi === 'suivant') {
        $i = (int) $p['idx'] + 1;
        if ($i >= $n) db()->prepare('UPDATE partie SET etat = "fini" WHERE id = 1')->execute();
        else db()->prepare('UPDATE partie SET idx = ? WHERE id = 1')->execute([$i]);
    } elseif ($quoi === 'precedent') {
        $i = max(0, (int) $p['idx'] - 1);
        db()->prepare('UPDATE partie SET etat = "en_cours", idx = ? WHERE id = 1')->execute([$i]);
    } elseif ($quoi === 'terminer') {
        db()->prepare('UPDATE partie SET etat = "fini" WHERE id = 1')->execute();
    } elseif ($quoi === 'rouvrir') {
        db()->prepare('UPDATE partie SET etat = "attente", idx = 0 WHERE id = 1')->execute();
    } else {
        oups('Commande inconnue.');
    }
    toucher();
    sortie(['ok' => true]);
}

if ($a === 'admin-eleve-suppr') {
    exige_admin();
    $id = (int) (corps()['id'] ?? 0);
    db()->prepare('DELETE FROM reponses WHERE eleve_id = ?')->execute([$id]);
    db()->prepare('DELETE FROM eleves WHERE id = ?')->execute([$id]);
    toucher();
    sortie(['ok' => true]);
}

if ($a === 'admin-raz') {
    exige_admin();
    // Remet la partie à zéro SANS toucher aux questions : on rejoue le même
    // jeu avec un autre groupe sans tout ressaisir.
    $garde = (corps()['questions'] ?? true) ? true : false;
    $pdo = db();
    $pdo->exec('DELETE FROM reponses');
    $pdo->exec('DELETE FROM eleves');
    if (!$garde) $pdo->exec('DELETE FROM questions');
    $pdo->exec('UPDATE partie SET etat = "attente", idx = 0 WHERE id = 1');
    toucher();
    sortie(['ok' => true]);
}

if ($a === 'admin-export') {
    exige_admin();
    $qs = questions();
    $eleves = db()->query('SELECT id, nom FROM eleves ORDER BY nom COLLATE NOCASE')->fetchAll();
    $parQ = [];
    foreach (db()->query('SELECT question_id, eleve_id, texte FROM reponses') as $r) {
        $parQ[(int) $r['question_id']][(int) $r['eleve_id']] = $r['texte'];
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="reponses-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    // BOM : sans lui, Excel ouvre l'UTF-8 en charabia sur les accents.
    fwrite($out, "\xEF\xBB\xBF");
    $tete = ['Participant'];
    foreach ($qs as $i => $q) $tete[] = 'Q' . ($i + 1) . ' — ' . $q['texte'];
    // Point-virgule : le séparateur attendu par Excel en configuration française.
    fputcsv($out, $tete, ';', '"', '');
    foreach ($eleves as $e) {
        $ligne = [$e['nom']];
        foreach ($qs as $q) $ligne[] = $parQ[(int) $q['id']][(int) $e['id']] ?? '';
        fputcsv($out, $ligne, ';', '"', '');
    }
    fclose($out);
    exit;
}

oups('Action inconnue.', 404);

} catch (Throwable $e) {
    // Jamais de détail technique au client, mais un journal pour comprendre.
    @file_put_contents(cours_dossier() . '/cours-erreurs.log',
        '[' . maintenant() . '] ' . $a . ' — ' . $e->getMessage()
        . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() . "\n", FILE_APPEND);
    sortie(['erreur' => 'Erreur interne.'], 500);
}
