<?php
/**
 * FreeHub — le passage quotidien des rappels par e-mail.
 *
 * À lancer une fois par jour depuis le cron cPanel, par exemple à 8 h :
 *
 *     /usr/local/bin/php /home/rtym5189/free-hub.fr/notifier.php
 *
 * Options :
 *     --simulation   n'envoie rien, affiche seulement ce qui partirait
 *
 * Le script est sans effet si aucun membre n'a activé les rappels : par
 * défaut personne n'est inscrit, l'activation se fait dans l'app.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ce script s'exécute uniquement en ligne de commande.\n");
}

require_once __DIR__ . '/api/bootstrap.php';
require_once __DIR__ . '/api/routes_notif.php';

$simulation = in_array('--simulation', $argv, true);
$r = notif_tourner($simulation);

printf("[%s] %s : %d membre(s) inscrit(s), %d rappel(s) %s\n",
    date('Y-m-d H:i'),
    $simulation ? 'SIMULATION' : 'ENVOI',
    $r['membres'], $r['envois'], $simulation ? 'seraient partis' : 'envoyés');
foreach ($r['details'] as $d) echo '  - ' . $d . "\n";
