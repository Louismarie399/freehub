<?php
/**
 * FreeHub — routeur de l'API (PHP natif).
 *
 * Toutes les requêtes /api/* arrivent ici via la réécriture du .htaccess.
 * Les URL, les charges utiles et les réponses sont identiques à celles de
 * l'ancien server.py : le frontend n'a rien à changer.
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/routes_auth.php';
require_once __DIR__ . '/routes_google.php';
require_once __DIR__ . '/routes_data.php';
require_once __DIR__ . '/routes_analyze.php';
require_once __DIR__ . '/routes_chat.php';

// Chemin demandé, sans query string ni préfixe /api.
$chemin = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$chemin = '/' . ltrim(substr($chemin, strlen('/api')), '/');
$chemin = rtrim($chemin, '/') ?: '/';
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$routes = [
    // Authentification
    'GET /auth/config'           => 'route_auth_config',
    'POST /auth/signup'          => 'route_signup',
    'POST /auth/login'           => 'route_login',
    'POST /auth/logout'          => 'route_logout',
    'GET /auth/me'               => 'route_me',
    'GET /auth/google/start'     => 'route_google_start',
    'GET /auth/google/callback'  => 'route_google_callback',

    // Données synchronisées
    'GET /data'                  => 'route_data_get',
    'PUT /data'                  => 'route_data_put',

    // Administration
    'GET /admin/stats'           => 'route_admin_stats',
    'POST /admin/promote'        => 'route_admin_promote',
    'POST /admin/demote'         => 'route_admin_demote',

    // Espace d'entraide
    'GET /chat'                  => 'route_chat_liste',
    'POST /chat'                 => 'route_chat_envoyer',
    'POST /chat/signaler'        => 'route_chat_signaler',
    'POST /chat/supprimer'       => 'route_chat_supprimer',
    'POST /chat/muet'            => 'route_chat_muet',
    'GET /chat/moderation'       => 'route_chat_moderation',

    // Public
    'POST /partenaire'           => 'route_partenaire',
    'POST /analyze'              => 'route_analyze',

    // Sonde de santé (sans secret : ne révèle rien de sensible).
    // `maj` = date de dernière mise à jour de ce fichier : permet de vérifier
    // d'un simple curl qu'un déploiement est bien arrivé jusqu'en production.
    'GET /ping'                  => fn() => json_reponse([
        'ok'  => true,
        'php' => PHP_VERSION,
        'maj' => date('Y-m-d H:i', (int) filemtime(__FILE__)) . ' UTC',
    ]),
];

$cle = $methode . ' ' . $chemin;
if (isset($routes[$cle])) {
    try {
        ($routes[$cle])();
    } catch (Throwable $e) {
        // Jamais de détail technique au client : il partirait dans le navigateur.
        error_log('[FreeHub] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        json_reponse(['error' => 'Erreur interne du serveur.'], 500);
    }
}

// Une route inconnue renvoie un vrai 404 JSON — jamais la page d'accueil.
json_reponse(['error' => 'Route inconnue : ' . $cle], 404);
