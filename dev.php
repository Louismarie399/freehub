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
];
PHP);
}
putenv('FH_DATA_DIR=' . $devdata);

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
