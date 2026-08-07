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
const CHAT_PAGE         = 50;    // messages affichés au maximum dans le fil
const CHAT_APARTE_CLOS  = 86400; // un aparté sans message depuis 24 h est clos
// Liste fermée : pas le clavier emoji entier, cinq gestes qui suffisent.
const CHAT_EMOJIS = ['👍', '👎', '🙏', '❤️', '🔥'];

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
        $badge = null; $nbBadges = 0; $photo = null;
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
                // La photo vit dans le profil (data URL, redimensionnée côté
                // client). On la borne : une valeur anormalement grosse est
                // ignorée plutôt que de gonfler chaque relevé du fil.
                if (empty($_GET['leger'])) {
                    $profil = json_decode((string) ($d['freehub_profil'] ?? ''), true);
                    if (is_array($profil)) {
                        $ph = (string) ($profil['photo'] ?? '');
                        if (str_starts_with($ph, 'data:image/') && strlen($ph) < 120000) {
                            $photo = $ph;
                        }
                    }
                }
            }
        }
        // Les mercis reçus : la monnaie sociale de l'Entraide.
        $stM = db()->prepare(
            "SELECT COUNT(*) FROM chat_reactions cr
              JOIN chat_messages cm ON cm.id = cr.message_id
             WHERE cm.user_id = ? AND cr.emoji = '🙏' AND cr.user_id != cm.user_id");
        $stM->execute([(int) $r['id']]);
        $mercis = (int) $stM->fetchColumn();

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
            'photo'   => $photo,
            'mercis'  => $mercis,
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
    $fil = (int) ($_GET['fil'] ?? 0);
    $pdo = db();

    // Passage relevé : alimente les compteurs « en ligne » et « déjà venus ».
    if ($u) {
        $pdo->prepare('INSERT INTO chat_presence(user_id, vu) VALUES (?,?)
                       ON CONFLICT(user_id) DO UPDATE SET vu = excluded.vu')
            ->execute([$u['id'], maintenant()]);
    }

    $clos = false;
    if ($fil > 0) {
        // Un aparté : le message d'origine puis ses réponses.
        $st = $pdo->prepare(
            'SELECT id, user_id, contenu, created, supprime, signale
               FROM chat_messages WHERE id = ? OR parent_id = ?
              ORDER BY id ASC LIMIT ?');
        $st->execute([$fil, $fil, CHAT_PAGE]);
        $lignes = $st->fetchAll();
        $clos = chat_aparte_clos($fil);
    } else {
        // Le fil principal : la fin, remise dans l'ordre, sans les apartés.
        $st = $pdo->prepare(
            'SELECT id, user_id, contenu, created, supprime, signale
               FROM chat_messages WHERE parent_id IS NULL ORDER BY id DESC LIMIT ?');
        $st->execute([CHAT_PAGE]);
        $lignes = array_reverse($st->fetchAll());
    }

    // Nombre de réponses en aparté de chaque message affiché.
    $nbReponses = [];
    if ($lignes) {
        $ids = array_map(fn($l) => (int) $l['id'], $lignes);
        $marques = implode(',', array_fill(0, count($ids), '?'));
        $st = $pdo->prepare(
            "SELECT parent_id, COUNT(*) AS n FROM chat_messages
              WHERE parent_id IN ($marques) AND supprime = 0 GROUP BY parent_id");
        $st->execute($ids);
        foreach ($st->fetchAll() as $r) $nbReponses[(int) $r['parent_id']] = (int) $r['n'];
    }

    $auteurs = chat_auteurs(array_values(array_unique(
        array_map(fn($l) => (int) $l['user_id'], $lignes))));

    // Réactions des messages affichés, regroupées par message puis par emoji.
    $reactions = [];
    if ($lignes) {
        $ids = array_map(fn($l) => (int) $l['id'], $lignes);
        $marques = implode(',', array_fill(0, count($ids), '?'));
        $st = $pdo->prepare(
            "SELECT r.message_id, r.emoji, r.user_id, u.prenom, u.nom
               FROM chat_reactions r JOIN users u ON u.id = r.user_id
              WHERE r.message_id IN ($marques) ORDER BY r.created ASC");
        $st->execute($ids);
        foreach ($st->fetchAll() as $r) {
            $mid = (int) $r['message_id'];
            $e = $r['emoji'];
            if (!isset($reactions[$mid][$e])) {
                $reactions[$mid][$e] = ['e' => $e, 'n' => 0, 'moi' => false, 'qui' => []];
            }
            $reactions[$mid][$e]['n']++;
            if ($u && (int) $r['user_id'] === (int) $u['id']) $reactions[$mid][$e]['moi'] = true;
            if (count($reactions[$mid][$e]['qui']) < 15) {
                $p = trim((string) $r['prenom']);
                $reactions[$mid][$e]['qui'][] = $p !== ''
                    ? $p . (($r['nom'] ?? '') !== '' ? ' ' . mb_substr($r['nom'], 0, 1) . '.' : '')
                    : 'Membre';
            }
        }
    }

    $messages = [];
    foreach ($lignes as $l) {
        $supprime = (bool) $l['supprime'];
        $mid = (int) $l['id'];
        // L'ordre d'affichage suit la liste fermée, pas l'ordre d'arrivée.
        $rs = [];
        foreach (CHAT_EMOJIS as $e) {
            if (isset($reactions[$mid][$e])) $rs[] = $reactions[$mid][$e];
        }
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
            'reactions' => $supprime ? [] : $rs,
            'nbReponses' => $nbReponses[$mid] ?? 0,
        ];
    }

    // Compteurs de présence : « en ligne » = passé dans les deux dernières
    // minutes ; « déjà venus » = tous ceux qui ont ouvert l'Entraide un jour.
    $limite = gmdate('Y-m-d\TH:i:s\Z', time() - 120);
    $enLigne = (int) $pdo->query(
        "SELECT COUNT(*) FROM chat_presence WHERE vu > '" . $limite . "'")->fetchColumn();
    $total = (int) $pdo->query('SELECT COUNT(*) FROM chat_presence')->fetchColumn();

    json_reponse([
        'messages' => $messages,
        'muet'     => $u ? chat_muet((int) $u['id']) : null,
        'admin'    => (bool) ($u && $u['is_admin']),
        'connecte' => (bool) $u,
        'enLigne'  => $enLigne,
        'total'    => $total,
        'clos'     => $clos,
        'sondage'  => $fil > 0 ? null : chat_sondage_etat($u),
        'mesMercis' => (function () use ($u) {
            if (!$u) return 0;
            $st = db()->prepare(
                "SELECT COUNT(*) FROM chat_reactions cr
                  JOIN chat_messages cm ON cm.id = cr.message_id
                 WHERE cm.user_id = ? AND cr.emoji = '🙏' AND cr.user_id != cm.user_id");
            $st->execute([(int) $u['id']]);
            return (int) $st->fetchColumn();
        })(),
    ]);
}

/** Un aparté est clos quand plus rien n'y a été écrit depuis 24 h. */
function chat_aparte_clos(int $fil): bool
{
    $st = db()->prepare(
        'SELECT MAX(created) FROM chat_messages WHERE parent_id = ?');
    $st->execute([$fil]);
    $dernier = $st->fetchColumn();
    if (!$dernier) return false;                       // pas encore ouvert
    return strtotime((string) $dernier) < time() - CHAT_APARTE_CLOS;
}

/**
 * Le fil principal reste court : au-delà de CHAT_PAGE messages, les plus
 * anciens sont effacés pour de bon — avec leurs apartés et leurs réactions.
 * Exception : un message dont l'aparté est encore actif (moins de 24 h)
 * survit jusqu'à ce que la conversation s'y éteigne.
 */
function chat_purger(): void
{
    $pdo = db();
    $ids = $pdo->query(
        'SELECT id FROM chat_messages WHERE parent_id IS NULL
          ORDER BY id DESC LIMIT -1 OFFSET ' . CHAT_PAGE)->fetchAll(PDO::FETCH_COLUMN);
    if (!$ids) return;
    $limite = gmdate('Y-m-d\TH:i:s\Z', time() - CHAT_APARTE_CLOS);
    $victimes = [];
    foreach ($ids as $id) {
        $st = $pdo->prepare(
            'SELECT COUNT(*) FROM chat_messages WHERE parent_id = ? AND created > ?');
        $st->execute([$id, $limite]);
        if ((int) $st->fetchColumn() === 0) $victimes[] = (int) $id;
    }
    if (!$victimes) return;
    $m = implode(',', array_fill(0, count($victimes), '?'));
    $pdo->prepare("DELETE FROM chat_reactions WHERE message_id IN ($m)
                    OR message_id IN (SELECT id FROM chat_messages WHERE parent_id IN ($m))")
        ->execute(array_merge($victimes, $victimes));
    $pdo->prepare("DELETE FROM chat_messages WHERE parent_id IN ($m)")->execute($victimes);
    $pdo->prepare("DELETE FROM chat_messages WHERE id IN ($m)")->execute($victimes);
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

    // Réponse en aparté : rattachée à un message du fil principal.
    $fil = (int) (corps()['fil'] ?? 0);
    if ($fil > 0) {
        $st = db()->prepare(
            'SELECT parent_id, supprime FROM chat_messages WHERE id = ?');
        $st->execute([$fil]);
        $parent = $st->fetch();
        if (!$parent) erreur('Message d’origine introuvable.');
        if ($parent['parent_id'] !== null) erreur('Un aparté ne peut pas en contenir un autre.');
        if ((int) $parent['supprime']) erreur('Ce message a été retiré.');

        if (chat_aparte_clos($fil)) {
            erreur('Cet aparté est clôturé : plus personne n’y a écrit depuis 24 h.', 410);
        }

        // Ouvrir un aparté (première réponse) : un seul par membre et par jour.
        $st = db()->prepare('SELECT COUNT(*) FROM chat_messages WHERE parent_id = ?');
        $st->execute([$fil]);
        if ((int) $st->fetchColumn() === 0) {
            $debutJour = gmdate('Y-m-d\T00:00:00\Z');
            $st = db()->prepare(
                "SELECT COUNT(*) FROM chat_messages m
                  WHERE m.user_id = ? AND m.parent_id IS NOT NULL AND m.created >= ?
                    AND NOT EXISTS (SELECT 1 FROM chat_messages a
                                     WHERE a.parent_id = m.parent_id AND a.id < m.id)");
            $st->execute([$u['id'], $debutJour]);
            if ((int) $st->fetchColumn() >= 1) {
                erreur('Tu as déjà ouvert un aparté aujourd’hui — réponds dans ceux qui existent, ou reviens demain.', 429);
            }
        }
    }

    // Débit : on compte ce que ce compte a publié dans la dernière minute.
    $st = db()->prepare(
        'SELECT COUNT(*) FROM chat_messages WHERE user_id = ? AND created > ?');
    $st->execute([$u['id'], gmdate('Y-m-d\TH:i:s\Z', time() - CHAT_DEBIT_SEC)]);
    if ((int) $st->fetchColumn() >= CHAT_DEBIT_NB) {
        erreur('Doucement — ' . CHAT_DEBIT_NB . ' messages par minute au maximum.', 429);
    }

    $st = db()->prepare(
        'INSERT INTO chat_messages(user_id, contenu, created, parent_id) VALUES (?,?,?,?)');
    $st->execute([$u['id'], $texte, maintenant(), $fil > 0 ? $fil : null]);
    $id = (int) db()->lastInsertId();
    if ($fil <= 0) chat_purger();
    json_reponse(['ok' => true, 'id' => $id]);
}

/** POST /api/chat/reagir — pose ou retire une réaction (liste fermée). */
function route_chat_reagir(): void
{
    $u = exige_connexion();
    $c = corps();
    $id = (int) ($c['id'] ?? 0);
    $emoji = (string) ($c['emoji'] ?? '');
    if (!$id) erreur('Message introuvable.');
    if (!in_array($emoji, CHAT_EMOJIS, true)) erreur('Réaction inconnue.');

    $st = db()->prepare('SELECT supprime FROM chat_messages WHERE id = ?');
    $st->execute([$id]);
    $m = $st->fetch();
    if (!$m) erreur('Message introuvable.');
    if ((int) $m['supprime']) erreur('Ce message a été retiré.');

    // Une seule réaction par personne et par message : cliquer un autre emoji
    // remplace la précédente ; recliquer le même la retire.
    $st = db()->prepare(
        'SELECT emoji FROM chat_reactions WHERE message_id = ? AND user_id = ?');
    $st->execute([$id, $u['id']]);
    $avant = $st->fetchColumn();
    db()->prepare('DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ?')
        ->execute([$id, $u['id']]);
    if ($avant !== $emoji) {
        db()->prepare(
            'INSERT INTO chat_reactions(message_id, user_id, emoji, created) VALUES (?,?,?,?)')
            ->execute([$id, $u['id'], $emoji, maintenant()]);
    }
    json_reponse(['ok' => true]);
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
