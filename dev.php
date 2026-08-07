<?php
/**
 * FreeHub — serveur de développement local (remplace l'ancien server.py).
 *
 * Nécessite PHP en local (macOS ne l'embarque plus : `brew install php`), puis :
 *
 *     php -S 127.0.0.1:8123 dev.php
 *
 * Reproduit le routage de production (.htaccess) :
 *   /api/*  → api/index.php        /app → app.html        /  → index.html
 *
 * Les données de dev vont dans ./devdata/ (ignoré par git et par le déploiement),
 * avec un config.php local créé au premier lancement (cookie non-secure pour http).
 */

declare(strict_types=1);

// Environnement de dev auto-suffisant : base et config locales, jamais celles de prod.
$devdata = __DIR__ . '/devdata';
if (!is_dir($devdata)) mkdir($devdata, 0700, true);
if (!is_file($devdata . '/config.php')) {
    file_put_contents($devdata . '/config.php', <<<PHP
<?php
// Config de DÉVELOPPEMENT locale — générée par dev.php, modifiable librement.
return [
    'data_dir'          => __DIR__,
    'site_url'          => 'http://127.0.0.1:8123',
    'cookie_secure'     => false,              // http local
    'open_signup'       => false,
    'anthropic_api_key' => '',                 // à remplir pour tester /api/analyze
    'model'             => 'claude-sonnet-5',
    'base_url'          => 'http://127.0.0.1:8123',
    // En local, AUCUN e-mail ne part : chaque message est déposé en HTML ici,
    // pour être relu dans le navigateur.
    'mail_fichier'      => __DIR__ . '/mails',
];
PHP);
}
putenv('FH_DATA_DIR=' . $devdata);

// L'environnement local doit être une copie conforme de la production : sans
// compte admin ni code d'accès, l'onglet « Dashboard admin » et l'inscription
// restent invisibles en local, et on ne peut pas tester ce qui est en ligne.
// Cet amorçage ne touche QUE ./devdata/ — jamais la base de production, qui
// vit hors du dépôt sur le serveur.
(function () use ($devdata) {
    $temoin = $devdata . '/.amorce';
    if (is_file($temoin)) return;
    require_once __DIR__ . '/api/bootstrap.php';
    $pdo = db();

    $email = 'louismarie54000@gmail.com';
    $mdp   = 'devlocal';                       // local uniquement, jamais en ligne
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if (!$st->fetch()) {
        $sel = sel_aleatoire();
        $pdo->prepare(
            "INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, is_admin, beta,
                               invite_code, google_sub) VALUES (?,?,?,?,?,?,1,1,'','')")
            ->execute([$email, hash_pw($mdp, $sel), $sel, maintenant(), 'Louis', '']);
    }
    // Code d'accès alpha, identique à celui de la production.
    $st = $pdo->prepare('SELECT 1 FROM invite_codes WHERE code = ?');
    $st->execute(['ALPHA-2026']);
    if (!$st->fetch()) {
        $pdo->prepare('INSERT INTO invite_codes(code, note, max_uses, uses, actif, created)
                       VALUES (?,?,0,0,1,?)')
            ->execute(['ALPHA-2026', 'Amorçage local', maintenant()]);
    }
    file_put_contents($temoin, "amorcé\n");
    error_log("[FreeHub dev] Compte admin local : $email / $mdp — code d'accès ALPHA-2026");
})();

$chemin = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($chemin, '/api/') || $chemin === '/api') {
    require __DIR__ . '/api/index.php';
    return true;
}
if ($chemin === '/app' || $chemin === '/app/') {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/app.html');
    return true;
}
if ($chemin === '/') {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    return true;
}
return false;   // fichier statique existant : servi tel quel par php -S
