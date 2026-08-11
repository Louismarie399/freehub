<?php
/** FreeHub — /api/categorie : orientation BIC / BNC d'après l'activité décrite. */

declare(strict_types=1);

require_once __DIR__ . '/prompt_categorie.php';

// Une orientation par jour et par personne suffit largement : l'activité d'un
// indépendant ne change pas d'une heure à l'autre. Le plafond protège surtout
// la facture d'API d'une boucle involontaire.
const CATEGORIE_PAR_JOUR = 10;

/**
 * POST /api/categorie
 * Corps : { activite, description }. Réservé aux comptes connectés — un appel
 * coûte de l'argent, il ne peut pas être ouvert à tout Internet.
 */
function route_categorie(): void
{
    $u = exige_connexion();
    $c = corps();
    $activite    = trim((string) ($c['activite'] ?? ''));
    $description = trim((string) ($c['description'] ?? ''));

    if ($activite === '' && $description === '') {
        erreur('Décris ton activité pour qu’on puisse t’orienter.');
    }
    // Une ligne de description ne dit rien d'exploitable : mieux vaut le dire
    // tout de suite que de rendre une orientation au hasard.
    if (mb_strlen($activite . ' ' . $description) < 12) {
        erreur('Quelques mots de plus sur ce que tu fais, et on peut t’orienter.');
    }
    $activite    = mb_substr($activite, 0, 200);
    $description = mb_substr($description, 0, 1500);

    $depuis = gmdate('Y-m-d\TH:i:s\Z', time() - 86400);
    $st = db()->prepare(
        'SELECT COUNT(*) FROM categorie_appels WHERE user_id = ? AND created >= ?');
    $st->execute([$u['id'], $depuis]);
    if ((int) $st->fetchColumn() >= CATEGORIE_PAR_JOUR) {
        erreur('Tu as atteint la limite d’orientations pour aujourd’hui. Reviens demain.', 429);
    }

    $cle = (string) config('anthropic_api_key');
    if ($cle === '') erreur('Orientation indisponible pour le moment.', 503);

    $message = "ACTIVITÉ DÉCLARÉE\n" . ($activite !== '' ? $activite : '(non précisée)')
        . "\n\nCE QUE FAIT CONCRÈTEMENT CETTE PERSONNE\n"
        . ($description !== '' ? $description : '(non précisé)')
        . "\n\nOriente cette activité vers les BIC ou les BNC en appliquant tes règles. "
        . "Si la description ne permet pas de trancher, dis-le et baisse ta confiance.";

    $charge = [
        'model'      => config('model'),
        'max_tokens' => 1200,
        'system'     => SYSTEM_PROMPT_CATEGORIE,
        'messages'   => [['role' => 'user', 'content' => $message]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($charge, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $cle,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $rep  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rep === false || $code >= 400) erreur('Orientation indisponible pour le moment.', 502);
    $d = json_decode((string) $rep, true);
    if (!is_array($d)) erreur('Orientation indisponible pour le moment.', 502);

    $texte = '';
    foreach ($d['content'] ?? [] as $bloc) {
        if (($bloc['type'] ?? '') === 'text') $texte .= $bloc['text'];
    }
    // parser_resultat() vit dans routes_analyze.php : il retire les éventuels
    // ``` autour du JSON.
    $res = parser_resultat($texte);
    if (!is_array($res) || !isset($res['categorie'])) {
        erreur('Réponse illisible. Réessaie dans un instant.', 502);
    }

    // On ne fait confiance à rien de ce qui revient : chaque champ est borné.
    $cat = strtoupper((string) $res['categorie']);
    if (!in_array($cat, ['BIC', 'BNC', 'MIXTE'], true)) $cat = 'MIXTE';
    $conf = strtolower((string) ($res['confiance'] ?? 'moyenne'));
    if (!in_array($conf, ['haute', 'moyenne', 'faible'], true)) $conf = 'moyenne';
    $liste = function ($v, int $max): array {
        if (!is_array($v)) return [];
        $out = [];
        foreach (array_slice($v, 0, $max) as $x) {
            $x = trim((string) $x);
            if ($x !== '') $out[] = mb_substr($x, 0, 300);
        }
        return $out;
    };

    db()->prepare('INSERT INTO categorie_appels(user_id, created) VALUES (?,?)')
        ->execute([$u['id'], maintenant()]);

    json_reponse([
        'categorie'  => $cat,
        'confiance'  => $conf,
        'resume'     => mb_substr(trim((string) ($res['resume'] ?? '')), 0, 200),
        'pourquoi'   => $liste($res['pourquoi'] ?? [], 4),
        'attention'  => $liste($res['attention'] ?? [], 3),
        'question'   => mb_substr(trim((string) ($res['question'] ?? '')), 0, 300),
    ]);
}
