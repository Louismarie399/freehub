<?php
/**
 * FreeHub — retours, réclamations et sondage de la semaine.
 *
 *  - /sav : la bulle d'aide, ouverte à tous (l'e-mail suffit si pas de compte) ;
 *  - /admin/demandes : la file unifiée côté admin (partenariats + SAV) ;
 *  - /chat/sondage : la question de la semaine, épinglée en tête de l'Entraide.
 */

declare(strict_types=1);

const SAV_LONGUEUR_MAX = 2000;
const SAV_PAR_JOUR     = 5;      // par compte (ou par e-mail sans compte)

/** POST /api/sav — un retour, une idée, un pépin. */
function route_sav(): void
{
    $u = utilisateur_courant();
    $c = corps();
    $message = trim((string) ($c['message'] ?? ''));
    $email = strtolower(trim((string) ($c['email'] ?? ($u['email'] ?? ''))));
    if ($message === '') erreur('Dis-nous au moins quelques mots.');
    if (mb_strlen($message) > SAV_LONGUEUR_MAX) erreur('Message trop long.');
    if ($email !== '' && !preg_match(EMAIL_RE, $email)) erreur('Adresse e-mail invalide.');
    if (!$u && $email === '') erreur('Laisse un e-mail pour qu’on puisse te répondre.');

    // Débit doux : cinq retours par jour et par identité.
    $qui = $u ? 'u:' . $u['id'] : 'e:' . $email;
    $st = db()->prepare(
        "SELECT COUNT(*) FROM sav_requests WHERE identite = ? AND created >= ?");
    $st->execute([$qui, gmdate('Y-m-d\T00:00:00\Z')]);
    if ((int) $st->fetchColumn() >= SAV_PAR_JOUR) {
        erreur('On a bien reçu tes messages du jour — on te répond vite.', 429);
    }

    $type = (string) ($c['type'] ?? '');
    if (!in_array($type, ['suggestion', 'bug', 'question'], true)) $type = 'question';

    db()->prepare(
        'INSERT INTO sav_requests(user_id, identite, email, type, message, created)
         VALUES (?,?,?,?,?,?)')
        ->execute([$u['id'] ?? null, $qui, $email, $type, $message, maintenant()]);
    json_reponse(['ok' => true]);
}

/** GET /api/admin/demandes — partenariats et SAV, du plus récent au plus ancien. */
function route_admin_demandes(): void
{
    exige_admin();
    $pdo = db();
    $out = [];
    foreach ($pdo->query(
        'SELECT id, structure, email, site, categorie, message, created, traite
           FROM partner_requests ORDER BY id DESC LIMIT 200') as $r) {
        $out[] = [
            'type' => 'partenaire', 'id' => (int) $r['id'],
            'titre' => $r['structure'], 'email' => $r['email'],
            'detail' => trim(($r['categorie'] ? $r['categorie'] . ' · ' : '') . ($r['site'] ?? '')),
            'message' => $r['message'], 'created' => $r['created'],
            'traite' => (bool) $r['traite'],
        ];
    }
    $libelles = ['suggestion' => '💡 Suggestion', 'bug' => '🐛 Bug', 'question' => '❓ Question'];
    foreach ($pdo->query(
        'SELECT s.id, s.email, s.type, s.message, s.created, s.traite, u.prenom, u.nom
           FROM sav_requests s LEFT JOIN users u ON u.id = s.user_id
          ORDER BY s.id DESC LIMIT 200') as $r) {
        $nom = trim((string) ($r['prenom'] ?? ''));
        if ($nom !== '' && ($r['nom'] ?? '') !== '') $nom .= ' ' . mb_substr($r['nom'], 0, 1) . '.';
        $out[] = [
            'type' => 'sav', 'id' => (int) $r['id'],
            'titre' => $nom !== '' ? $nom : ($r['email'] ?: 'Anonyme'),
            'email' => $r['email'], 'detail' => $libelles[$r['type']] ?? '',
            'message' => $r['message'], 'created' => $r['created'],
            'traite' => (bool) $r['traite'],
        ];
    }
    usort($out, fn($a, $b) => strcmp($b['created'], $a['created']));
    json_reponse(['demandes' => $out]);
}

/** POST /api/admin/demandes/traiter — cocher ou décocher une demande. */
function route_admin_demandes_traiter(): void
{
    exige_admin();
    $c = corps();
    $table = ($c['type'] ?? '') === 'partenaire' ? 'partner_requests' : 'sav_requests';
    $id = (int) ($c['id'] ?? 0);
    if (!$id) erreur('Demande introuvable.');
    db()->prepare("UPDATE $table SET traite = ? WHERE id = ?")
        ->execute([empty($c['traite']) ? 0 : 1, $id]);
    json_reponse(['ok' => true]);
}

/** POST /api/chat/sondage — poser (ou clore) la question de la semaine. */
function route_chat_sondage(): void
{
    exige_admin();
    $c = corps();
    $pdo = db();
    if (!empty($c['clore'])) {
        $pdo->exec('UPDATE chat_sondages SET actif = 0');
        json_reponse(['ok' => true]);
    }
    $q = trim((string) ($c['question'] ?? ''));
    $options = array_values(array_filter(array_map('trim', (array) ($c['options'] ?? [])),
        fn($o) => $o !== ''));
    if ($q === '' || count($options) < 2) erreur('Une question et au moins deux réponses.');
    if (count($options) > 5) erreur('Cinq réponses au maximum.');
    // Une seule question active à la fois : la nouvelle remplace l'ancienne.
    $pdo->exec('UPDATE chat_sondages SET actif = 0');
    $pdo->prepare('INSERT INTO chat_sondages(question, options, created, actif)
                   VALUES (?,?,?,1)')
        ->execute([$q, json_encode($options, JSON_UNESCAPED_UNICODE), maintenant()]);
    json_reponse(['ok' => true]);
}

/** POST /api/chat/voter — un clic, une voix, modifiable. */
function route_chat_voter(): void
{
    $u = exige_connexion();
    $choix = (int) (corps()['choix'] ?? -1);
    $s = db()->query('SELECT id, options FROM chat_sondages WHERE actif = 1 LIMIT 1')->fetch();
    if (!$s) erreur('Pas de question en cours.');
    $options = json_decode($s['options'], true) ?: [];
    if ($choix < 0 || $choix >= count($options)) erreur('Réponse inconnue.');
    db()->prepare('INSERT INTO chat_votes(sondage_id, user_id, choix)
                   VALUES (?,?,?)
                   ON CONFLICT(sondage_id, user_id) DO UPDATE SET choix = excluded.choix')
        ->execute([(int) $s['id'], $u['id'], $choix]);
    json_reponse(['ok' => true]);
}

/** Le sondage actif et ses votes — appelé par le relevé du fil. */
function chat_sondage_etat(?array $u): ?array
{
    $s = db()->query('SELECT id, question, options FROM chat_sondages WHERE actif = 1 LIMIT 1')->fetch();
    if (!$s) return null;
    $options = json_decode($s['options'], true) ?: [];
    $votes = array_fill(0, count($options), 0);
    $mien = null;
    $st = db()->prepare('SELECT user_id, choix FROM chat_votes WHERE sondage_id = ?');
    $st->execute([(int) $s['id']]);
    foreach ($st->fetchAll() as $v) {
        $i = (int) $v['choix'];
        if (isset($votes[$i])) $votes[$i]++;
        if ($u && (int) $v['user_id'] === (int) $u['id']) $mien = $i;
    }
    return ['id' => (int) $s['id'], 'question' => $s['question'],
            'options' => $options, 'votes' => $votes, 'mien' => $mien,
            'total' => array_sum($votes)];
}
