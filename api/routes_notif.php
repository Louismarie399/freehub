<?php
/**
 * FreeHub — préférences de notification et envoi des rappels.
 *
 * Deux volets :
 *  - les routes /notifications (lire et écrire ses préférences, se désinscrire) ;
 *  - les fonctions appelées par le cron (voir notifier.php) qui calculent les
 *    échéances de chacun et envoient un e-mail, une seule fois par échéance.
 *
 * Rien n'est envoyé tant que l'utilisateur n'a pas coché la case : par défaut,
 * tout est à zéro. Chaque message porte un lien de désinscription en un clic.
 */

declare(strict_types=1);

/** Les rappels qu'on sait envoyer. L'ordre est celui affiché dans l'app. */
function notif_genres(): array
{
    return [
        'echeances' => [
            'titre' => 'Mes échéances',
            'desc'  => 'Un rappel avant chaque date qui te concerne (CFE, URSSAF, TVA…)',
            'ico'   => '📅',
            'defaut' => true,
        ],
        'parcours' => [
            'titre' => 'Mes parcours en cours',
            'desc'  => 'Une relance amicale si un parcours reste en pause plus de 3 semaines',
            'ico'   => '🧭',
            'defaut' => false,
        ],
        'entraide' => [
            'titre' => 'Les réponses à mes messages',
            'desc'  => 'Quand quelqu’un répond dans un aparté que tu as ouvert',
            'ico'   => '💬',
            'defaut' => true,
        ],
        'recap' => [
            'titre' => 'Le récap du mois',
            'desc'  => 'Ce qui t’attend le mois prochain, en un seul e-mail',
            'ico'   => '📮',
            'defaut' => false,
        ],
    ];
}

/** Combien de jours avant l'échéance on prévient. */
const NOTIF_PREAVIS = [15, 3];

/** Les préférences d'un membre, complétées par les valeurs par défaut. */
function notif_prefs(int $userId): array
{
    $st = db()->prepare('SELECT cles FROM notif_prefs WHERE user_id = ?');
    $st->execute([$userId]);
    $brut = $st->fetchColumn();
    $cles = $brut ? (json_decode((string) $brut, true) ?: []) : null;

    $out = [];
    foreach (notif_genres() as $id => $g) {
        // Jamais renseigné : on part des valeurs par défaut, sans rien envoyer
        // tant que le membre n'a pas confirmé (voir notif_actives).
        $out[$id] = $cles === null ? (bool) $g['defaut'] : !empty($cles[$id]);
    }
    return $out;
}

/** A-t-il déjà répondu ? Tant que non, on n'envoie rien. */
function notif_confirme(int $userId): bool
{
    $st = db()->prepare('SELECT COUNT(*) FROM notif_prefs WHERE user_id = ?');
    $st->execute([$userId]);
    return (int) $st->fetchColumn() > 0;
}

/** Le jeton de désinscription, créé à la volée s'il manque. */
function notif_jeton(int $userId): string
{
    $st = db()->prepare('SELECT jeton FROM notif_prefs WHERE user_id = ?');
    $st->execute([$userId]);
    $j = (string) ($st->fetchColumn() ?: '');
    if ($j !== '') return $j;
    $j = bin2hex(random_bytes(16));
    db()->prepare('INSERT INTO notif_prefs(user_id, cles, jeton, maj) VALUES (?,?,?,?)
                   ON CONFLICT(user_id) DO UPDATE SET jeton = excluded.jeton')
        ->execute([$userId, '{}', $j, maintenant()]);
    return $j;
}

/** GET /api/notifications — mes préférences et le catalogue. */
function route_notif_lire(): void
{
    $u = exige_connexion();
    $genres = [];
    foreach (notif_genres() as $id => $g) {
        $genres[] = ['id' => $id, 'titre' => $g['titre'], 'desc' => $g['desc'], 'ico' => $g['ico']];
    }
    json_reponse([
        'genres'  => $genres,
        'choix'   => notif_prefs((int) $u['id']),
        'confirme' => notif_confirme((int) $u['id']),
        'email'   => $u['email'],
    ]);
}

/** POST /api/notifications — enregistrer ses choix. */
function route_notif_ecrire(): void
{
    $u = exige_connexion();
    $c = corps();
    $recu = (array) ($c['choix'] ?? []);
    $cles = [];
    foreach (notif_genres() as $id => $g) $cles[$id] = !empty($recu[$id]) ? 1 : 0;

    db()->prepare('INSERT INTO notif_prefs(user_id, cles, jeton, maj) VALUES (?,?,?,?)
                   ON CONFLICT(user_id) DO UPDATE SET cles = excluded.cles, maj = excluded.maj')
        ->execute([(int) $u['id'], json_encode($cles, JSON_UNESCAPED_UNICODE),
                   notif_jeton((int) $u['id']), maintenant()]);
    json_reponse(['ok' => true, 'choix' => notif_prefs((int) $u['id'])]);
}

/** GET /api/notifications/stop?j=… — désinscription en un clic, sans connexion. */
function route_notif_stop(): void
{
    $j = (string) ($_GET['j'] ?? '');
    $page = function (string $titre, string $texte) {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
           . '<meta name="viewport" content="width=device-width,initial-scale=1">'
           . '<title>Freehub</title><style>body{margin:0;min-height:100vh;display:flex;'
           . 'align-items:center;justify-content:center;font-family:system-ui,sans-serif;'
           . 'background:#f6f9ff;color:#0f1b33;padding:24px}div{max-width:420px;text-align:center}'
           . 'h1{font-size:22px;margin:0 0 10px}p{color:#5b6b85;line-height:1.6;margin:0 0 20px}'
           . 'a{display:inline-block;background:#0f1b33;color:#fff;text-decoration:none;'
           . 'padding:12px 22px;border-radius:100px;font-weight:700}</style></head><body><div>'
           . '<h1>' . htmlspecialchars($titre) . '</h1><p>' . htmlspecialchars($texte) . '</p>'
           . '<a href="/app">Retour à mon espace</a></div></body></html>';
        exit;
    };
    if (!preg_match('/^[a-f0-9]{32}$/', $j)) $page('Lien invalide', 'Ce lien de désinscription n’est plus valable.');

    $st = db()->prepare('SELECT user_id FROM notif_prefs WHERE jeton = ?');
    $st->execute([$j]);
    $uid = $st->fetchColumn();
    if (!$uid) $page('Lien invalide', 'Ce lien de désinscription n’est plus valable.');

    $cles = [];
    foreach (notif_genres() as $id => $g) $cles[$id] = 0;
    db()->prepare('UPDATE notif_prefs SET cles = ?, maj = ? WHERE user_id = ?')
        ->execute([json_encode($cles), maintenant(), (int) $uid]);
    $page('C’est noté', 'Tu ne recevras plus aucun e-mail de Freehub. '
        . 'Tu peux les réactiver à tout moment depuis ton profil.');
}

// --------------------------------------------------------------------------- //
// Échéances : ce que le calendrier sait, le rappel doit le savoir aussi.
// --------------------------------------------------------------------------- //

/**
 * Les échéances d'un membre pour les 60 prochains jours.
 *
 * Les dates fixes (CFE, versement libératoire) sont celles déjà affichées dans
 * l'app. Les dates récurrentes (URSSAF, TVA) dépendent de la périodicité que le
 * membre a renseignée dans son profil — on ne devine rien.
 */
function notif_echeances(array $profil, int $joursMax = 60): array
{
    $out = [];
    $auj = new DateTimeImmutable('today');

    $ajoute = function (string $ref, string $quoi, DateTimeImmutable $d, string $note) use (&$out, $auj, $joursMax) {
        $jours = (int) $auj->diff($d)->format('%r%a');
        if ($jours < 0 || $jours > $joursMax) return;
        $out[] = ['ref' => $ref, 'quoi' => $quoi, 'date' => $d->format('Y-m-d'),
                  'jours' => $jours, 'note' => $note];
    };

    $forme = strtolower((string) ($profil['forme'] ?? ''));
    $micro = $forme === '' || strpos($forme, 'micro') !== false || strpos($forme, 'auto') !== false;

    // Deux passages : l'année en cours et la suivante, pour couvrir décembre.
    foreach ([0, 1] as $dec) {
        $an = (int) $auj->format('Y') + $dec;

        // --- Dates fixes, déjà présentes dans le calendrier de l'app ---
        $ajoute('cfe-' . $an, 'Paiement de la CFE',
            new DateTimeImmutable("$an-12-15"),
            'À régler depuis ton espace professionnel sur impots.gouv.fr.');
        if ($micro) {
            $ajoute('vfl-' . $an, 'Demande de versement libératoire',
                new DateTimeImmutable("$an-09-30"),
                'Pour en bénéficier l’année suivante. La demande se fait sur autoentrepreneur.urssaf.fr.');
        }

        // --- URSSAF : selon la périodicité déclarée par le membre ---
        $urssaf = (string) ($profil['periodeUrssaf'] ?? '');
        if ($micro && $urssaf === 'mensuel') {
            // Déclaration du mois M à faire pendant le mois M+1.
            for ($m = 1; $m <= 12; $m++) {
                $fin = new DateTimeImmutable(sprintf('%d-%02d-01', $an, $m));
                $fin = $fin->modify('last day of this month');
                $mois = $fin->modify('-1 month');
                $ajoute(sprintf('urssaf-%d-%02d', $an, $m),
                    'Déclaration URSSAF de ' . notif_mois((int) $mois->format('n')),
                    $fin,
                    'Déclaration et paiement sur autoentrepreneur.urssaf.fr. '
                    . 'La date exacte figure sur ton espace.');
            }
        } elseif ($micro && $urssaf === 'trimestriel') {
            // Un trimestre se déclare le dernier jour du mois qui suit.
            foreach ([1 => '04-30', 2 => '07-31', 3 => '10-31', 4 => '01-31'] as $t => $jour) {
                $anEch = $t === 4 ? $an + 1 : $an;
                $ajoute(sprintf('urssaf-t%d-%d', $t, $an),
                    'Déclaration URSSAF du trimestre ' . $t,
                    new DateTimeImmutable("$anEch-$jour"),
                    'Déclaration et paiement sur autoentrepreneur.urssaf.fr. '
                    . 'La date exacte figure sur ton espace.');
            }
        }

        // --- TVA : uniquement si le membre y est assujetti ---
        $tva = (string) ($profil['periodeTva'] ?? '');
        if ($tva === 'mensuel') {
            for ($m = 1; $m <= 12; $m++) {
                $mois = new DateTimeImmutable(sprintf('%d-%02d-01', $an, $m));
                $ech = $mois->modify('+1 month')->setDate(
                    (int) $mois->modify('+1 month')->format('Y'),
                    (int) $mois->modify('+1 month')->format('n'), 21);
                $ajoute(sprintf('tva-%d-%02d', $an, $m),
                    'Déclaration de TVA de ' . notif_mois($m),
                    $ech,
                    'Formulaire CA3, depuis ton espace professionnel sur impots.gouv.fr. '
                    . 'Ta date limite exacte y est indiquée : elle varie selon ton dossier.');
            }
        } elseif ($tva === 'trimestriel') {
            // Premier dépôt en avril, puis tous les trois mois.
            foreach ([4, 7, 10, 1] as $i => $m) {
                $anEch = $m === 1 ? $an + 1 : $an;
                $ajoute(sprintf('tva-t%d-%d', $i + 1, $an),
                    'Déclaration de TVA du trimestre ' . ($i + 1),
                    new DateTimeImmutable(sprintf('%d-%02d-21', $anEch, $m)),
                    'Formulaire CA3, depuis ton espace professionnel sur impots.gouv.fr. '
                    . 'Ta date limite exacte y est indiquée : elle varie selon ton dossier.');
            }
        }
    }

    usort($out, fn($a, $b) => strcmp($a['date'], $b['date']));
    return $out;
}

function notif_mois(int $m): string
{
    $noms = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
             'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return $noms[$m] ?? '';
}

// --------------------------------------------------------------------------- //
// Envoi
// --------------------------------------------------------------------------- //

/** Le gabarit d'un e-mail : sobre, lisible, sans image externe. */
function notif_gabarit(string $prenom, string $titre, string $corps, string $lienStop): string
{
    return '<!doctype html><html lang="fr"><body style="margin:0;padding:24px;'
        . 'background:#f4f7fd;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0f1b33">'
        . '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:18px;padding:30px">'
        . '<div style="font-size:19px;font-weight:800;letter-spacing:-.02em;margin-bottom:22px">Freehub</div>'
        . '<div style="font-size:17px;font-weight:700;margin-bottom:12px">Salut ' . htmlspecialchars($prenom) . ',</div>'
        . '<div style="font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:14px">'
        . htmlspecialchars($titre) . '</div>'
        . '<div style="font-size:15px;line-height:1.65;color:#4a5a75">' . $corps . '</div>'
        . '<a href="' . htmlspecialchars(notif_base()) . '/app" style="display:inline-block;margin-top:24px;'
        . 'background:#0f1b33;color:#fff;text-decoration:none;padding:13px 24px;border-radius:100px;'
        . 'font-weight:700;font-size:15px">Ouvrir mon espace</a>'
        . '<div style="margin-top:26px;padding-top:18px;border-top:1px solid #eef1f7;'
        . 'font-size:12px;color:#8a97ad;line-height:1.5">'
        . 'Tu reçois cet e-mail parce que tu as activé les rappels dans ton espace Freehub.<br>'
        . '<a href="' . htmlspecialchars($lienStop) . '" style="color:#8a97ad">Ne plus recevoir d’e-mails</a>'
        . '</div></div></body></html>';
}

function notif_base(): string
{
    $c = config();
    return rtrim((string) ($c['base_url'] ?? 'https://free-hub.fr'), '/');
}

/**
 * Envoie un e-mail. En développement, rien ne part : le message est écrit dans
 * devdata/mails/ pour pouvoir le relire.
 */
function notif_envoyer(string $dest, string $sujet, string $html): bool
{
    $c = config();
    if (!empty($c['mail_fichier'])) {
        $dossier = (string) $c['mail_fichier'];
        if (!is_dir($dossier)) @mkdir($dossier, 0770, true);
        $nom = $dossier . '/' . date('Ymd-His') . '-' . substr(md5($dest . $sujet . microtime()), 0, 6) . '.html';
        file_put_contents($nom, "<!-- À : $dest\n     Sujet : $sujet -->\n" . $html);
        return true;
    }
    $exp = (string) ($c['mail_from'] ?? 'notifications@free-hub.fr');
    $entetes = "MIME-Version: 1.0\r\n"
             . "Content-Type: text/html; charset=UTF-8\r\n"
             . 'From: Freehub <' . $exp . ">\r\n"
             . 'Reply-To: ' . $exp . "\r\n";
    return @mail($dest, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $html, $entetes);
}

/** A-t-on déjà envoyé ce rappel précis ? */
function notif_deja(int $uid, string $genre, string $ref): bool
{
    $st = db()->prepare('SELECT COUNT(*) FROM notif_envois
                         WHERE user_id = ? AND genre = ? AND reference = ?');
    $st->execute([$uid, $genre, $ref]);
    return (int) $st->fetchColumn() > 0;
}

function notif_marquer(int $uid, string $genre, string $ref): void
{
    db()->prepare('INSERT OR IGNORE INTO notif_envois(user_id, genre, reference, envoye)
                   VALUES (?,?,?,?)')->execute([$uid, $genre, $ref, maintenant()]);
}

/**
 * Le passage quotidien : pour chaque membre volontaire, regarde ses échéances
 * et envoie ce qui doit l'être. Renvoie un compte-rendu.
 */
function notif_tourner(bool $simulation = false): array
{
    $pdo = db();
    $rapport = ['membres' => 0, 'envois' => 0, 'details' => []];

    // Le profil vit dans la table `data`, sérialisé deux fois : le blob JSON
    // contient une chaîne JSON par clé de stockage.
    $lignes = $pdo->query(
        'SELECT u.id, u.email, u.prenom, d.blob, p.cles, p.jeton
           FROM users u
           JOIN notif_prefs p ON p.user_id = u.id
           LEFT JOIN data d ON d.user_id = u.id')->fetchAll();

    foreach ($lignes as $l) {
        $cles = json_decode((string) $l['cles'], true) ?: [];
        if (empty($cles['echeances'])) continue;
        $rapport['membres']++;

        $data = json_decode((string) ($l['blob'] ?? '{}'), true) ?: [];
        $profil = $data['freehub_profil'] ?? [];
        if (is_string($profil)) $profil = json_decode($profil, true) ?: [];

        foreach (notif_echeances($profil) as $e) {
            if (!in_array($e['jours'], NOTIF_PREAVIS, true)) continue;
            $ref = $e['ref'] . '-j' . $e['jours'];
            if (notif_deja((int) $l['id'], 'echeances', $ref)) continue;

            $quand = $e['jours'] === 0 ? "c'est aujourd'hui"
                   : ($e['jours'] === 1 ? "c'est demain" : 'dans ' . $e['jours'] . ' jours');
            $corps = '<p style="margin:0 0 14px"><strong>' . htmlspecialchars($e['quoi'])
                   . '</strong>, ' . $quand . '.</p><p style="margin:0">'
                   . htmlspecialchars($e['note']) . '</p>';
            $html = notif_gabarit((string) ($l['prenom'] ?: 'toi'),
                $e['quoi'] . ' — ' . $quand,
                $corps,
                notif_base() . '/api/notifications/stop?j=' . $l['jeton']);

            if (!$simulation) {
                if (notif_envoyer((string) $l['email'], 'Freehub · ' . $e['quoi'] . ' ' . $quand, $html)) {
                    notif_marquer((int) $l['id'], 'echeances', $ref);
                    $rapport['envois']++;
                }
            } else {
                $rapport['envois']++;
            }
            $rapport['details'][] = $l['email'] . ' → ' . $e['quoi'] . ' (J-' . $e['jours'] . ')';
        }
    }
    return $rapport;
}

/** GET /api/admin/notifications/test — simulation, réservée aux admins. */
function route_notif_test(): void
{
    exige_admin();
    json_reponse(['simulation' => notif_tourner(true)]);
}
