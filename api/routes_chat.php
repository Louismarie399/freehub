<?php
/**
 * FreeHub — espace d'entraide entre membres.
 *
 * Principes retenus pour l'alpha :
 *  - tout le monde lit, seuls les comptes connectés écrivent ;
 *  - débit limité (voir DEBIT_*) : un compte ne peut pas noyer le fil ;
 *  - effacement DOUX : un message supprimé disparaît pour tous mais reste en
 *    base, consultable par un admin — sans ça, traiter un signalement revient
 *    à détruire la seule preuve de ce qui s'est passé ;
 *  - un compte peut être réduit au silence pour une durée, sans être supprimé.
 *
 * Le contenu est stocké BRUT et échappé à l'affichage : on ne veut ni perdre
 * le texte original, ni faire confiance à un nettoyage côté client.
 */

declare(strict_types=1);

const CHAT_LONGUEUR_MAX = 800;   // caractères
const CHAT_DEBIT_NB     = 5;     // messages…
const CHAT_DEBIT_SEC    = 60;    // …par minute
const CHAT_PAGE         = 60;    // messages renvoyés au maximum

/** Le membre est-il réduit au silence ? Renvoie la date de fin, ou null. */
function chat_muet(int $userId): ?string
{
    $st = db()->prepare('SELECT jusqu_a FROM chat_muets WHERE user_id = ?');
    $st->execute([$userId]);
    $r = $st->fetch();
    if (!$r) return null;
    if (strtotime($r['jusqu_a']) < time()) {
        db()->prepare('DELETE FROM chat_muets WHERE user_id = ?')->execute([$userId]);
        return null;
    }
    return $r['jusqu_a'];
}

/**
 * Le nom affiché et le badge porté d'un membre.
 *
 * Le badge vit dans le blob de données synchronisé (`badgePorte`) : c'est le
 * client qui l'y écrit, donc on ne lui fait pas confiance sur le libellé — on
 * ne renvoie que l'identifiant, et c'est le front qui l'affiche à partir de sa
 * propre liste. Un identifiant inventé ne correspondra à rien.
 */
function chat_auteurs(array $ids): array
{
    if (!$ids) return [];
    $marques = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare(
        "SELECT u.id, u.prenom, u.nom, u.is_admin, u.beta, d.blob
           FROM users u LEFT JOIN data d ON d.user_id = u.id
          WHERE u.id IN ($marques)");
    $st->execute($ids);
    $out = [];
    foreach ($st->fetchAll() as $r) {
        $badge = null; $nbBadges = 0;
        if ($r['blob']) {
            $d = json_decode($r['blob'], true);
            if (is_array($d)) {
                // Le blob reprend les clés localStorage telles quelles :
                // `freehub_badge_porte` est une chaîne brute, `freehub_badges`
                // une chaîne JSON à décoder.
                $b = $d['freehub_badge_porte'] ?? null;
                // Un identifiant de badge : lettres, chiffres, tirets. Rien d'autre.
                if (is_string($b) && preg_match('/^[a-z0-9-]{1,32}$/', $b)) $badge = $b;
                $liste = json_decode((string) ($d['freehub_badges'] ?? ''), true);
                if (is_array($liste)) $nbBadges = count($liste);
            }
        }
        $prenom = trim((string) $r['prenom']);
        $out[(int) $r['id']] = [
            'id'      => (int) $r['id'],
            // Prénom + initiale : on n'expose jamais le nom complet ni l'e-mail.
            'nom'     => $prenom !== '' ? $prenom . (($r['nom'] ?? '') !== '' ? ' ' . mb_substr($r['nom'], 0, 1) . '.' : '')
                                        : 'Membre',
            'admin'   => (bool) $r['is_admin'],
            'beta'    => (bool) $r['beta'],
            'badge'   => $badge,
            'nbBadges' => $nbBadges,
        ];
    }
    return $out;
}

/**
 * GET /api/chat?depuis=<id> — les messages, du plus ancien au plus récent.
 *
 * La lecture est OUVERTE : pas besoin de compte pour suivre le fil. Seule
 * l'écriture engage une identité — c'est elle qui exige la connexion.
 */
function route_chat_liste(): void
{
    $u = utilisateur_courant();   // null si personne n'est connecté
    $depuis = (int) ($_GET['depuis'] ?? 0);
    $pdo = db();

    if ($depuis > 0) {
        // Suite du fil : uniquement ce qui est arrivé depuis.
        $st = $pdo->prepare(
            'SELECT id, user_id, contenu, created, supprime, signale
               FROM chat_messages WHERE id > ? ORDER BY id ASC LIMIT ?');
        $st->execute([$depuis, CHAT_PAGE]);
        $lignes = $st->fetchAll();
    } else {
        // Premier chargement : la fin du fil, remise dans l'ordre.
        $st = $pdo->prepare(
            'SELECT id, user_id, contenu, created, supprime, signale
               FROM chat_messages ORDER BY id DESC LIMIT ?');
        $st->execute([CHAT_PAGE]);
        $lignes = array_reverse($st->fetchAll());
    }

    $auteurs = chat_auteurs(array_values(array_unique(
        array_map(fn($l) => (int) $l['user_id'], $lignes))));

    $messages = [];
    foreach ($lignes as $l) {
        $supprime = (bool) $l['supprime'];
        $messages[] = [
            'id'       => (int) $l['id'],
            'auteur'   => $auteurs[(int) $l['user_id']] ?? ['nom' => 'Membre', 'admin' => false],
            'moi'      => $u && (int) $l['user_id'] === (int) $u['id'],
            'created'  => $l['created'],
            'supprime' => $supprime,
            'signale'  => (bool) $l['signale'],
            // Le texte d'un message supprimé n'est renvoyé qu'aux admins.
            'contenu'  => $supprime
                ? (($u && $u['is_admin']) ? $l['contenu'] : '')
                : $l['contenu'],
        ];
    }

    json_reponse([
        'messages' => $messages,
        'muet'     => $u ? chat_muet((int) $u['id']) : null,
        'admin'    => (bool) ($u && $u['is_admin']),
        'connecte' => (bool) $u,
    ]);
}

/** POST /api/chat — publier un message. */
function route_chat_envoyer(): void
{
    $u = exige_connexion();

    $fin = chat_muet((int) $u['id']);
    if ($fin) erreur('Tu ne peux plus écrire pour le moment (jusqu’au ' . $fin . ').', 403);

    $texte = trim((string) (corps()['contenu'] ?? ''));
    if ($texte === '') erreur('Message vide.');
    if (mb_strlen($texte) > CHAT_LONGUEUR_MAX) {
        erreur('Message trop long (' . CHAT_LONGUEUR_MAX . ' caractères maximum).');
    }

    // Débit : on compte ce que ce compte a publié dans la dernière minute.
    $st = db()->prepare(
        'SELECT COUNT(*) FROM chat_messages WHERE user_id = ? AND created > ?');
    $st->execute([$u['id'], gmdate('Y-m-d\TH:i:s\Z', time() - CHAT_DEBIT_SEC)]);
    if ((int) $st->fetchColumn() >= CHAT_DEBIT_NB) {
        erreur('Doucement — ' . CHAT_DEBIT_NB . ' messages par minute au maximum.', 429);
    }

    $st = db()->prepare(
        'INSERT INTO chat_messages(user_id, contenu, created) VALUES (?,?,?)');
    $st->execute([$u['id'], $texte, maintenant()]);
    json_reponse(['ok' => true, 'id' => (int) db()->lastInsertId()]);
}

/** POST /api/chat/signaler — n'importe quel membre peut alerter. */
function route_chat_signaler(): void
{
    exige_connexion();
    $id = (int) (corps()['id'] ?? 0);
    if (!$id) erreur('Message introuvable.');
    db()->prepare('UPDATE chat_messages SET signale = 1 WHERE id = ?')->execute([$id]);
    json_reponse(['ok' => true]);
}

/** POST /api/chat/supprimer — réservé aux administrateurs. */
function route_chat_supprimer(): void
{
    $u = exige_admin();
    $id = (int) (corps()['id'] ?? 0);
    if (!$id) erreur('Message introuvable.');
    db()->prepare('UPDATE chat_messages SET supprime = 1, supprime_par = ? WHERE id = ?')
        ->execute([$u['id'], $id]);
    json_reponse(['ok' => true]);
}

/** POST /api/chat/muet — réduire au silence, ou lever la sanction. */
function route_chat_muet(): void
{
    exige_admin();
    $c = corps();
    $userId = (int) ($c['userId'] ?? 0);
    $heures = (int) ($c['heures'] ?? 0);
    if (!$userId) erreur('Membre introuvable.');

    if ($heures <= 0) {
        db()->prepare('DELETE FROM chat_muets WHERE user_id = ?')->execute([$userId]);
        json_reponse(['ok' => true, 'muet' => null]);
    }
    $jusqu = gmdate('Y-m-d\TH:i:s\Z', time() + $heures * 3600);
    db()->prepare(
        'INSERT INTO chat_muets(user_id, jusqu_a, motif) VALUES (?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET jusqu_a = excluded.jusqu_a')
        ->execute([$userId, $jusqu, (string) ($c['motif'] ?? '')]);
    json_reponse(['ok' => true, 'muet' => $jusqu]);
}

/** GET /api/chat/moderation — la file des signalements, pour les admins. */
function route_chat_moderation(): void
{
    exige_admin();
    $st = db()->query(
        'SELECT id, user_id, contenu, created, supprime, signale
           FROM chat_messages WHERE signale = 1 ORDER BY id DESC LIMIT 100');
    $lignes = $st->fetchAll();
    $auteurs = chat_auteurs(array_values(array_unique(
        array_map(fn($l) => (int) $l['user_id'], $lignes))));
    $out = [];
    foreach ($lignes as $l) {
        $out[] = [
            'id'       => (int) $l['id'],
            'auteur'   => $auteurs[(int) $l['user_id']] ?? ['nom' => 'Membre'],
            'userId'   => (int) $l['user_id'],
            'contenu'  => $l['contenu'],
            'created'  => $l['created'],
            'supprime' => (bool) $l['supprime'],
        ];
    }
    json_reponse(['messages' => $out]);
}
