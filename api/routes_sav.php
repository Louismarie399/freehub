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
    // Un membre connecté ne saisit rien : on retombe sur l'e-mail de son compte,
    // sinon l'admin n'a aucun moyen de lui répondre.
    $email = strtolower(trim((string) ($c['email'] ?? '')));
    if ($email === '') $email = strtolower(trim((string) ($u['email'] ?? '')));
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
        'SELECT s.id, s.user_id, s.email, s.type, s.message, s.created, s.traite,
                u.prenom, u.nom, u.email AS email_compte
           FROM sav_requests s LEFT JOIN users u ON u.id = s.user_id
          ORDER BY s.id DESC LIMIT 200') as $r) {
        $nom = trim((string) ($r['prenom'] ?? ''));
        if ($nom !== '' && ($r['nom'] ?? '') !== '') $nom .= ' ' . mb_substr($r['nom'], 0, 1) . '.';
        // Les retours envoyés avant la correction n'ont pas d'e-mail stocké :
        // on retombe sur celui du compte pour rester joignable.
        $mail = $r['email'] ?: ($r['email_compte'] ?? '');
        $out[] = [
            'type' => 'sav', 'id' => (int) $r['id'],
            'titre' => $nom !== '' ? $nom : ($mail ?: 'Anonyme'),
            'email' => $mail, 'detail' => $libelles[$r['type']] ?? '',
            'message' => $r['message'], 'created' => $r['created'],
            'traite' => (bool) $r['traite'],
            // Un retour anonyme n'a pas de fil : sans compte, l'auteur n'a
            // aucun endroit où lire la réponse. Il reste l'e-mail.
            'repondable' => (int) ($r['user_id'] ?? 0) > 0,
            'sav_id' => (int) $r['id'],
        ];
    }
    // Les fils, en une requête pour tout le lot.
    $fils = sav_fils(array_map(fn($o) => $o['id'],
        array_values(array_filter($out, fn($o) => $o['type'] === 'sav'))));
    foreach ($out as &$o) {
        if ($o['type'] === 'sav') $o['reponses'] = $fils[$o['id']] ?? [];
    }
    unset($o);
    usort($out, fn($a, $b) => strcmp($b['created'], $a['created']));
    json_reponse(['demandes' => $out]);
}

/**
 * GET /api/admin/demandes/nb — le nombre de demandes encore à traiter.
 * Route séparée et volontairement minuscule : la pastille de la barre latérale
 * se rafraîchit en fond, et rapatrier 400 messages complets pour afficher un
 * chiffre serait absurde.
 */
function route_admin_demandes_nb(): void
{
    exige_admin();
    $pdo = db();
    $n = (int) $pdo->query('SELECT COUNT(*) FROM partner_requests WHERE traite = 0')->fetchColumn()
       + (int) $pdo->query('SELECT COUNT(*) FROM sav_requests WHERE traite = 0')->fetchColumn();
    json_reponse(['n' => $n]);
}

/** POST /api/admin/demandes/traiter — cocher ou décocher une demande. */
function route_admin_demandes_traiter(): void
{
    exige_admin();
    $c = corps();
    $table = ($c['type'] ?? '') === 'partenaire' ? 'partner_requests' : 'sav_requests';
    $id = (int) ($c['id'] ?? 0);
    if (!$id) erreur('Demande introuvable.');
    $traite = empty($c['traite']) ? 0 : 1;
    db()->prepare("UPDATE $table SET traite = ? WHERE id = ?")->execute([$traite, $id]);
    // Repasser une suggestion en « à traiter » rouvre le droit à l'annonce :
    // sinon une erreur de clic priverait définitivement l'auteur du message.
    if ($table === 'sav_requests' && !$traite) {
        db()->prepare('UPDATE sav_requests SET annonce = 0 WHERE id = ?')->execute([$id]);
    }
    json_reponse(['ok' => true]);
}

/** Les réponses d'un lot de réclamations, rangées par demande. */
function sav_fils(array $ids): array
{
    if (!$ids) return [];
    $trous = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare(
        "SELECT id, demande_id, admin, message, created, lu FROM sav_reponses
          WHERE demande_id IN ($trous) ORDER BY id ASC");
    $st->execute($ids);
    $out = [];
    foreach ($st as $r) {
        $out[(int) $r['demande_id']][] = [
            'id'      => (int) $r['id'],
            'admin'   => (bool) $r['admin'],
            'message' => $r['message'],
            'created' => $r['created'],
            'lu'      => (bool) $r['lu'],
        ];
    }
    return $out;
}

/**
 * POST /api/sav/repondre — l'équipe répond à une réclamation, ou son auteur
 * relance. Un fil clos (demande traitée) n'accepte plus rien : c'est le sens
 * du bouton « traité » côté admin.
 */
function route_sav_repondre(): void
{
    $u = exige_connexion();
    $c = corps();
    $id = (int) ($c['id'] ?? 0);
    $message = trim((string) ($c['message'] ?? ''));
    if (!$id) erreur('Demande introuvable.');
    if ($message === '') erreur('Message vide.');
    if (mb_strlen($message) > SAV_LONGUEUR_MAX) erreur('Message trop long.');

    $st = db()->prepare('SELECT user_id, traite FROM sav_requests WHERE id = ?');
    $st->execute([$id]);
    $d = $st->fetch();
    if (!$d) erreur('Demande introuvable.');

    // Seuls l'équipe et l'auteur du retour ont accès à ce fil.
    $estAdmin = (bool) $u['is_admin'];
    if (!$estAdmin && (int) $d['user_id'] !== (int) $u['id']) {
        erreur('Accès refusé.', 403);
    }
    if ((int) $d['traite']) erreur('Cet échange est clos.', 410);

    db()->prepare(
        'INSERT INTO sav_reponses(demande_id, admin, message, created, lu)
         VALUES (?,?,?,?,0)')
        ->execute([$id, $estAdmin ? 1 : 0, $message, maintenant()]);
    json_reponse(['ok' => true]);
}

/**
 * GET /api/sav/fils — les réclamations de l'utilisateur qui portent un
 * échange : ce qu'il a écrit, ce qu'on lui a répondu, et si le fil est clos.
 */
function route_sav_fils(): void
{
    $u = utilisateur_courant();
    if (!$u) { json_reponse(['fils' => []]); return; }

    $st = db()->prepare(
        'SELECT id, type, message, created, traite FROM sav_requests
          WHERE user_id = ? ORDER BY id DESC LIMIT 20');
    $st->execute([$u['id']]);
    $lignes = $st->fetchAll();
    $reponses = sav_fils(array_map(fn($l) => (int) $l['id'], $lignes));

    $out = [];
    foreach ($lignes as $l) {
        $id = (int) $l['id'];
        // Un retour sans échange n'a pas à encombrer la liste de l'utilisateur.
        if (empty($reponses[$id])) continue;
        $out[] = [
            'id'       => $id,
            'type'     => $l['type'],
            'message'  => $l['message'],
            'created'  => $l['created'],
            'clos'     => (bool) $l['traite'],
            'reponses' => $reponses[$id],
        ];
    }
    json_reponse(['fils' => $out]);
}

/** POST /api/sav/fil/vu — l'auteur a lu les réponses de l'équipe. */
function route_sav_fil_vu(): void
{
    $u = exige_connexion();
    $id = (int) (corps()['id'] ?? 0);
    if (!$id) { json_reponse(['ok' => true]); return; }
    // La jointure borne la mise à jour aux fils de cet utilisateur.
    db()->prepare(
        'UPDATE sav_reponses SET lu = 1
          WHERE demande_id = ? AND admin = 1
            AND demande_id IN (SELECT id FROM sav_requests WHERE user_id = ?)')
        ->execute([$id, $u['id']]);
    json_reponse(['ok' => true]);
}

/**
 * GET /api/sav/annonces — les suggestions de l'utilisateur qui ont été
 * retenues depuis sa dernière visite. Rien pour les anonymes : sans compte,
 * on n'a personne à qui annoncer quoi que ce soit.
 */
function route_sav_annonces(): void
{
    $u = utilisateur_courant();
    if (!$u) { json_reponse(['annonces' => []]); return; }

    $st = db()->prepare(
        "SELECT id, message, created FROM sav_requests
          WHERE user_id = ? AND type = 'suggestion' AND traite = 1 AND annonce = 0
          ORDER BY id ASC LIMIT 5");
    $st->execute([$u['id']]);
    $out = [];
    foreach ($st as $r) {
        $out[] = ['id' => (int) $r['id'], 'message' => $r['message'], 'created' => $r['created']];
    }
    json_reponse(['annonces' => $out]);
}

/** POST /api/sav/annonces/vu — l'auteur a vu le message, on ne le rejoue pas. */
function route_sav_annonces_vu(): void
{
    $u = exige_connexion();
    $ids = corps()['ids'] ?? [];
    if (!is_array($ids) || !$ids) { json_reponse(['ok' => true]); return; }

    // Les identifiants viennent du client : on les force en entiers et on
    // borne la mise à jour aux lignes de cet utilisateur.
    $ids = array_slice(array_map('intval', $ids), 0, 20);
    $trous = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare(
        "UPDATE sav_requests SET annonce = 1 WHERE user_id = ? AND id IN ($trous)");
    $st->execute(array_merge([$u['id']], $ids));
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
