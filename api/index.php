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
require_once __DIR__ . '/routes_notif.php';
require_once __DIR__ . '/routes_categorie.php';
require_once __DIR__ . '/routes_sav.php';

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
    'POST /chat/reagir'          => 'route_chat_reagir',
    'POST /chat/signaler'        => 'route_chat_signaler',
    'POST /chat/blanchir'        => 'route_chat_blanchir',
    'POST /chat/supprimer'       => 'route_chat_supprimer',
    'POST /chat/muet'            => 'route_chat_muet',
    'GET /chat/moderation'       => 'route_chat_moderation',
    'POST /chat/sondage'         => 'route_chat_sondage',
    'POST /chat/voter'           => 'route_chat_voter',

    // Notifications par e-mail
    'GET /notifications'         => 'route_notif_lire',
    'POST /notifications'        => 'route_notif_ecrire',
    'GET /notifications/stop'    => 'route_notif_stop',
    'GET /admin/notifications/test' => 'route_notif_test',

    // Retours, réclamations
    'POST /sav'                  => 'route_sav',
    'GET /sav/annonces'          => 'route_sav_annonces',
    'POST /sav/annonces/vu'      => 'route_sav_annonces_vu',
    'POST /sav/repondre'         => 'route_sav_repondre',
    'GET /sav/fils'              => 'route_sav_fils',
    'POST /sav/fil/vu'           => 'route_sav_fil_vu',
    'GET /admin/demandes'        => 'route_admin_demandes',
    'POST /admin/demandes/traiter' => 'route_admin_demandes_traiter',

    // Public
    'POST /partenaire'           => 'route_partenaire',
    'POST /analyze'              => 'route_analyze',
    'POST /categorie'            => 'route_categorie',

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
