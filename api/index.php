<?php
/**
 * FreeHub — routeur de l'API (PHP natif).
 *
 * Toutes les requêtes /api/* arrivent ici via la règle de réécriture du .htaccess.
 * PHASE 1 : seule la route /api/ping existe, pour valider le routage.
 * PHASE 2 : les routes d'authentification, de données et d'administration
 *           viendront s'ajouter dans le tableau $routes.
 */

declare(strict_types=1);

// Chemin demandé, sans la query string ni le préfixe /api.
$chemin = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$chemin = '/' . ltrim(substr($chemin, strlen('/api')), '/');
$chemin = rtrim($chemin, '/') ?: '/';
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/** Réponse JSON, systématiquement non mise en cache. */
function json_reponse(array $donnees, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, must-revalidate');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// --------------------------------------------------------------------------- //
// Routes
// --------------------------------------------------------------------------- //
$routes = [
    // PHASE 1 — sonde de validation du routage. À retirer en Phase 3.
    'GET /ping' => function (): void {
        if (($_GET['k'] ?? '') !== 'JCf-nNDpD700d7A026p78SSg') {
            json_reponse(['error' => 'Not found'], 404);
        }
        json_reponse([
            'ok'       => true,
            'message'  => 'Le routeur PHP répond : la réécriture d’URL fonctionne.',
            'php'      => PHP_VERSION,
            'methode'  => $_SERVER['REQUEST_METHOD'] ?? '',
            'chemin'   => $GLOBALS['chemin'] ?? '',
        ]);
    },

    // PHASE 1 — prouve qu'un POST atteint bien le routeur (le cas qui échouait).
    'POST /ping' => function (): void {
        if (($_GET['k'] ?? '') !== 'JCf-nNDpD700d7A026p78SSg') {
            json_reponse(['error' => 'Not found'], 404);
        }
        $corps = json_decode(file_get_contents('php://input') ?: '', true);
        json_reponse([
            'ok'         => true,
            'message'    => 'POST reçu par PHP — le blocage Passenger est contourné.',
            'corpsRecu'  => is_array($corps) ? $corps : null,
        ]);
    },
];

$cle = $methode . ' ' . $chemin;
if (isset($routes[$cle])) {
    $routes[$cle]();
}

// Une route inconnue doit renvoyer un vrai 404 JSON — jamais la page d'accueil.
// C'était exactement le symptôme du bug Passenger.
json_reponse(['error' => 'Route inconnue : ' . $cle], 404);
