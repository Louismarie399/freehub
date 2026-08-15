<?php
/**
 * FreeHub — /api/recherche : « où dois-je aller ? » posé en langage courant.
 *
 * Le frontend fait déjà une recherche par mots-clés, instantanée et gratuite.
 * Cette route ne sert qu'aux questions formulées en phrases, que la recherche
 * par mots-clés ne sait pas relier à une destination.
 *
 * Principe de sûreté : le modèle ne PROPOSE PAS de destination, il en CHOISIT
 * une dans la liste qu'on lui envoie. Un identifiant hors liste est rejeté
 * côté serveur. Il ne peut donc pas inventer un écran qui n'existe pas, ni
 * répondre sur le fond d'une question fiscale — ce n'est pas son rôle ici.
 */

declare(strict_types=1);

const RECHERCHE_PAR_JOUR = 30;

function route_recherche(): void
{
    $u = exige_connexion();
    $c = corps();
    $question = trim((string) ($c['question'] ?? ''));
    $dests    = $c['destinations'] ?? null;

    if (mb_strlen($question) < 3)   erreur('Question trop courte.');
    if (mb_strlen($question) > 300) erreur('Question trop longue.');
    if (!is_array($dests) || !$dests) erreur('Liste de destinations manquante.');
    if (count($dests) > 120)        erreur('Trop de destinations.');

    // La clé est vérifiée AVANT de décompter : sans elle, l'appel n'aura pas
    // lieu, et il serait absurde d'amputer le quota de quelqu'un pour une
    // panne de configuration.
    $cle = (string) config('anthropic_api_key');
    if ($cle === '') erreur('Recherche assistée indisponible.', 503);

    $pdo = db();

    // Le quota est réservé AVANT l'appel : celui-ci dure plusieurs secondes, et
    // écrire après coup sur une connexion SQLite gardée ouverte tout ce temps
    // provoquait des « database is locked ».
    $st = $pdo->prepare(
        'SELECT COUNT(*) FROM recherche_appels WHERE user_id = ? AND jour = ?');
    $st->execute([$u['id'], date('Y-m-d')]);
    if ((int) $st->fetchColumn() >= RECHERCHE_PAR_JOUR) {
        erreur('Tu as atteint la limite de recherches assistées pour aujourd’hui. '
             . 'La recherche par mots-clés, elle, reste sans limite.', 429);
    }
    $pdo->prepare('INSERT INTO recherche_appels(user_id, jour, created) VALUES (?,?,?)')
        ->execute([$u['id'], date('Y-m-d'), maintenant()]);

    // Le catalogue, en une ligne par destination. On ne garde que l'identifiant
    // et de quoi comprendre à quoi il sert : ni contenu, ni chiffre.
    $lignes = [];
    $valides = [];
    foreach ($dests as $d) {
        $id  = trim((string) ($d['id'] ?? ''));
        $typ = trim((string) ($d['type'] ?? ''));
        $lib = trim((string) ($d['l'] ?? ''));
        if ($id === '' || $typ === '' || $lib === '') continue;
        $cleD = $typ . ':' . $id;
        $valides[$cleD] = true;
        $sous = trim((string) ($d['d'] ?? ''));
        $lignes[] = '- ' . $cleD . ' — ' . mb_substr($lib, 0, 120)
                  . ($sous !== '' ? ' : ' . mb_substr($sous, 0, 160) : '');
    }
    if (!$lignes) erreur('Liste de destinations vide.');

    $systeme = <<<'TXT'
Tu es l'aiguilleur de FreeHub, une application française qui aide les
indépendants à comprendre leur administratif et leur fiscalité.

On te donne une question posée par un membre, et la liste complète des écrans
de l'application. Ton rôle est UNIQUEMENT d'orienter : tu choisis les écrans
les plus utiles pour cette question.

Règles absolues :
- Tu choisis exclusivement des identifiants présents dans la liste fournie.
  N'invente jamais un identifiant, même s'il te semble manquer un écran.
- Tu ne réponds JAMAIS sur le fond de la question. Pas de règle fiscale, pas de
  taux, pas de seuil, pas de date d'obligation, pas de conseil. Ces contenus
  sont dans les écrans, écrits et vérifiés : ton travail est d'y conduire.
- Si rien dans la liste ne correspond vraiment, renvoie une liste vide plutôt
  qu'une destination approximative.
- « pourquoi » : une seule phrase, maximum 90 caractères, qui dit ce que la
  personne va y trouver. Tutoiement. Pas de formule d'introduction.

Réponds uniquement par un objet JSON, sans texte autour :
{"resultats":[{"cle":"type:id","pourquoi":"…"}]}
Trois résultats au maximum, le plus pertinent en premier.
TXT;

    $message = "QUESTION DU MEMBRE\n" . $question
             . "\n\nÉCRANS DISPONIBLES\n" . implode("\n", $lignes);

    $charge = [
        'model'      => config('model'),
        'max_tokens' => 700,
        'system'     => $systeme,
        'messages'   => [['role' => 'user', 'content' => $message]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($charge, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $cle,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $rep  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rep === false || $code >= 400) erreur('La recherche assistée n’a pas répondu.', 502);
    $d = json_decode((string) $rep, true);
    if (!is_array($d)) erreur('La recherche assistée n’a pas répondu.', 502);

    $texte = '';
    foreach ($d['content'] ?? [] as $bloc) {
        if (($bloc['type'] ?? '') === 'text') $texte .= $bloc['text'];
    }
    $texte = trim($texte);
    if (str_starts_with($texte, '```')) {
        $texte = (string) preg_replace('/^```[a-z]*\s*|\s*```$/', '', $texte);
    }
    $out = json_decode($texte, true);

    // Le filet : tout identifiant hors catalogue est jeté, quoi qu'ait répondu
    // le modèle. C'est ce qui garantit qu'on ne renverra jamais vers un écran
    // qui n'existe pas.
    $resultats = [];
    foreach ((is_array($out) ? ($out['resultats'] ?? []) : []) as $r) {
        $cleR = trim((string) ($r['cle'] ?? ''));
        if (!isset($valides[$cleR])) continue;
        $resultats[] = [
            'cle'      => $cleR,
            'pourquoi' => mb_substr(trim((string) ($r['pourquoi'] ?? '')), 0, 140),
        ];
        if (count($resultats) >= 3) break;
    }

    json_reponse(['resultats' => $resultats]);
}
