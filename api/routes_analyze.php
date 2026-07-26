<?php
/** FreeHub — /api/analyze : analyse des dépenses par l'API Claude. */

declare(strict_types=1);

require_once __DIR__ . '/prompt.php';

const MAX_DEPENSES = 12;

function construire_message(array $p): string
{
    $c = fn($x) => trim((string) ($x ?? ''));

    $ent = [];
    if ($c($p['activite'] ?? '') !== '')    $ent[] = '- Activité principale : ' . $c($p['activite']);
    if ($c($p['description'] ?? '') !== '') $ent[] = "- Description de l'activité : " . $c($p['description']);
    $libelles = ['venteBIC' => 'Vente de marchandises (BIC)',
                 'serviceBIC' => 'Prestations de services (BIC)',
                 'bnc' => 'Activité libérale (BNC)'];
    $lib = $libelles[$c($p['categorieFiscale'] ?? '')] ?? null;
    if ($lib)                            $ent[] = '- Catégorie fiscale : ' . $lib;
    if ($c($p['forme'] ?? '') !== '')    $ent[] = '- Forme juridique : ' . $c($p['forme']);
    if ($c($p['regime'] ?? '') !== '')   $ent[] = "- Régime d'imposition : " . $c($p['regime']);
    if ($c($p['tva'] ?? '') !== '')      $ent[] = '- Situation au regard de la TVA : ' . $c($p['tva']);
    $entBloc = $ent ? implode("\n", $ent) : "- (profil d'entreprise non renseigné)";

    $blocs = [];
    foreach (array_values($p['depenses']) as $i => $d) {
        $lignes = [
            'DÉPENSE ' . ($i + 1),
            '- Nom : ' . ($c($d['nom'] ?? '') ?: 'non précisé'),
            '- Montant TTC : ' . ($c($d['montant'] ?? '') ?: 'non précisé') . ' €',
        ];
        if ($c($d['motif'] ?? '') !== '') {
            $lignes[] = "- Motif / utilité pour l'activité : " . $c($d['motif']);
        }
        $blocs[] = implode("\n", $lignes);
    }

    $n = count($p['depenses']);
    $pluriel = $n > 1 ? 'ces dépenses' : 'cette dépense';
    return "INFORMATIONS SUR L'ENTREPRISE\n$entBloc\n\nDÉPENSES À ANALYSER ($n)\n\n"
        . implode("\n\n", $blocs)
        . "\n\nLes informations non listées n'ont pas été demandées à l'utilisateur : déduis-les "
        . "si possible de l'activité, de la description et du motif ; si une information manquante "
        . "est DÉTERMINANTE (notamment l'usage professionnel/personnel, le bénéficiaire ou le "
        . "justificatif), signale-le et pose la question dans \"questions\". Analyse $pluriel en "
        . "appliquant strictement tes règles, respecte les limites de longueur, et réponds au "
        . "format JSON demandé avec $n objet(s) dans \"depenses\".";
}

/** Claude peut entourer le JSON de ``` : on extrait l'objet quoi qu'il arrive. */
function parser_resultat(string $texte): ?array
{
    $t = trim($texte);
    if (str_starts_with($t, '```')) {
        $pos = strpos($t, "\n");
        if ($pos !== false) $t = substr($t, $pos + 1);
        if (str_ends_with(trim($t), '```')) $t = substr(trim($t), 0, -3);
        $t = trim($t);
        if (stripos($t, 'json') === 0) $t = trim(substr($t, 4));
    }
    $d = strpos($t, '{');
    $f = strrpos($t, '}');
    if ($d !== false && $f !== false && $f > $d) $t = substr($t, $d, $f - $d + 1);
    $r = json_decode($t, true);
    return is_array($r) ? $r : null;
}

function route_analyze(): void
{
    $p = corps();
    $depenses = $p['depenses'] ?? [];
    if (!is_array($depenses) || count($depenses) === 0) erreur('Aucune dépense à analyser.');
    if (count($depenses) > MAX_DEPENSES) {
        erreur('Maximum ' . MAX_DEPENSES . ' dépenses par analyse.');
    }
    $p['depenses'] = $depenses;

    $cle = (string) config('anthropic_api_key');
    if ($cle === '') {
        erreur("Clé API Claude introuvable. Renseigne anthropic_api_key dans le fichier "
             . 'de configuration, ou la variable ANTHROPIC_API_KEY.');
    }

    $charge = [
        'model'      => config('model'),
        'max_tokens' => 8000,
        'system'     => SYSTEM_PROMPT,
        'messages'   => [['role' => 'user', 'content' => construire_message($p)]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($charge, JSON_UNESCAPED_UNICODE),
        // L'analyse de 12 dépenses peut être longue : on laisse de la marge.
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $cle,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $rep  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($rep === false)  erreur("Erreur de l'API Claude : $err", 502);
    $d = json_decode((string) $rep, true);
    if ($code >= 400 || !is_array($d)) {
        $m = $d['error']['message'] ?? ('HTTP ' . $code);
        erreur("Erreur de l'API Claude : $m", 502);
    }

    $texte = '';
    foreach ($d['content'] ?? [] as $bloc) {
        if (($bloc['type'] ?? '') === 'text') $texte .= $bloc['text'];
    }

    $resultat = parser_resultat($texte);
    if ($resultat === null) {
        json_reponse(["error" => "Réponse de l'IA illisible (JSON invalide).",
                      'raw' => mb_substr($texte, 0, 500)], 502);
    }

    // Garde-fou : autant de résultats que de dépenses soumises.
    $res = $resultat['depenses'] ?? null;
    if (!is_array($res) || count($res) !== count($depenses)) {
        erreur("L'IA n'a pas renvoyé un résultat par dépense. Relance l'analyse.", 502);
    }

    $resultat['_model'] = config('model');
    json_reponse($resultat);
}
