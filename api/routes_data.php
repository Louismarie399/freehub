<?php
/** FreeHub — synchronisation des données, espace admin, demandes partenaires. */

declare(strict_types=1);

// --------------------------------------------------------------------------- //
// Données synchronisées
// --------------------------------------------------------------------------- //
function route_data_get(): void
{
    $u = exige_connexion();
    $st = db()->prepare('SELECT blob, updated FROM data WHERE user_id = ?');
    $st->execute([$u['id']]);
    $r = $st->fetch();
    if (!$r) json_reponse(['donnees' => new stdClass(), 'updated' => null]);
    $d = json_decode($r['blob'], true);
    json_reponse(['donnees' => $d ?: new stdClass(), 'updated' => $r['updated']]);
}

function route_data_put(): void
{
    $u = exige_connexion();
    $d = corps()['donnees'] ?? null;
    if (!is_array($d)) erreur('Données invalides.');
    $blob = json_encode($d, JSON_UNESCAPED_UNICODE);
    $st = db()->prepare(
        'INSERT INTO data(user_id, blob, updated) VALUES (?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET blob = excluded.blob, updated = excluded.updated');
    $st->execute([$u['id'], $blob, maintenant()]);

    // L'identité vit à deux endroits : le profil (table `data`) et les colonnes
    // de `users`, écrites à l'inscription et jamais reprises ensuite. Or c'est
    // `users` que lisent l'Entraide et la file de réclamations : changer son
    // nom dans le profil ne se voyait donc nulle part ailleurs. On réaligne ici.
    $profil = profil_de($blob);
    if ($profil) {
        $prenom = mb_substr(trim((string) ($profil['prenom'] ?? '')), 0, 80);
        $nom    = mb_substr(trim((string) ($profil['nom'] ?? '')), 0, 80);
        // Un profil vidé n'efface pas l'identité du compte : sans prénom,
        // l'Entraide n'aurait plus personne à afficher.
        if ($prenom !== '' && ($prenom !== $u['prenom'] || $nom !== $u['nom'])) {
            db()->prepare('UPDATE users SET prenom = ?, nom = ? WHERE id = ?')
                ->execute([$prenom, $nom, $u['id']]);
        }
    }
    json_reponse(['ok' => true, 'updated' => maintenant()]);
}

// --------------------------------------------------------------------------- //
// Espace d'administration
// --------------------------------------------------------------------------- //
/** Extrait le profil d'un paquet synchronisé (du JSON dans du JSON). */
function profil_de(string $blob): array
{
    $paquet = json_decode($blob, true);
    if (!is_array($paquet)) return [];
    $brut = $paquet['freehub_profil'] ?? null;
    if (is_string($brut)) $brut = json_decode($brut, true);
    return is_array($brut) ? $brut : [];
}

function route_admin_stats(): void
{
    exige_admin();
    $pdo = db();
    $n = fn(string $sql, array $a = []) => (function () use ($pdo, $sql, $a) {
        $s = $pdo->prepare($sql); $s->execute($a); return (int) $s->fetchColumn();
    })();

    $total  = $n('SELECT COUNT(*) FROM users');
    $google = $n("SELECT COUNT(*) FROM users WHERE google_sub != ''");
    $depuis = fn(int $j) => (new DateTimeImmutable("-$j days", new DateTimeZone('UTC')))
                            ->format('Y-m-d\TH:i:s.uP');

    $formes = [];
    $activites = 0;
    foreach ($pdo->query('SELECT blob FROM data') as $r) {
        $p = profil_de($r['blob']);
        $f = trim((string) ($p['forme'] ?? ''));
        if ($f !== '') $formes[$f] = ($formes[$f] ?? 0) + 1;
        if (trim((string) ($p['activite'] ?? '')) !== '') $activites++;
    }
    arsort($formes);
    $formesListe = [];
    foreach ($formes as $k => $v) $formesListe[] = [$k, $v];

    $derniers = [];
    foreach ($pdo->query('SELECT email, prenom, nom, google_sub, is_admin, created
                          FROM users ORDER BY created DESC LIMIT 8') as $r) {
        $derniers[] = [
            'email'   => $r['email'],
            'nom'     => trim(($r['prenom'] ?: '') . ' ' . ($r['nom'] ?: '')),
            'google'  => $r['google_sub'] !== '',
            'admin'   => (bool) $r['is_admin'],
            'created' => $r['created'],
        ];
    }

    json_reponse([
        'total'   => $total,
        'admins'  => $n('SELECT COUNT(*) FROM users WHERE is_admin = 1'),
        'beta'    => $n('SELECT COUNT(*) FROM users WHERE beta = 1'),
        'google'  => $google,
        'motDePasse' => $total - $google,
        'j7'      => $n('SELECT COUNT(*) FROM users WHERE created >= ?', [$depuis(7)]),
        'j30'     => $n('SELECT COUNT(*) FROM users WHERE created >= ?', [$depuis(30)]),
        'avecDonnees'   => $n('SELECT COUNT(*) FROM data'),
        'profilRempli'  => $activites,
        'codesActifs'   => $n('SELECT COUNT(*) FROM invite_codes WHERE actif = 1'),
        'codesUtilises' => $n('SELECT COALESCE(SUM(uses), 0) FROM invite_codes'),
        'demandesPartenaires' => $n('SELECT COUNT(*) FROM partner_requests'),
        'formes'      => $formesListe,
        'derniers'    => $derniers,
        'listeAdmins' => $pdo->query('SELECT email FROM users WHERE is_admin = 1 ORDER BY email')
                             ->fetchAll(PDO::FETCH_COLUMN),
    ]);
}

function route_admin_promote(): void
{
    exige_admin();
    $email = strtolower(champ('email'));
    $pdo = db();
    $st = $pdo->prepare('SELECT id, is_admin FROM users WHERE email = ?');
    $st->execute([$email]);
    $r = $st->fetch();
    if (!$r)             erreur('Aucun compte avec cette adresse.', 404);
    if ($r['is_admin'])  erreur('Ce compte est déjà administrateur.', 409);
    $pdo->prepare('UPDATE users SET is_admin = 1 WHERE id = ?')->execute([$r['id']]);
    json_reponse(['ok' => true, 'email' => $email]);
}

function route_admin_demote(): void
{
    exige_admin();
    $email = strtolower(champ('email'));
    $pdo = db();
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ? AND is_admin = 1');
    $st->execute([$email]);
    $r = $st->fetch();
    if (!$r) erreur("Ce compte n'est pas administrateur.", 404);
    // Garde-fou : on ne retire jamais le dernier admin, sinon plus personne n'entre.
    if ((int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_admin = 1')->fetchColumn() <= 1) {
        erreur("Impossible : c'est le dernier administrateur.", 409);
    }
    $pdo->prepare('UPDATE users SET is_admin = 0 WHERE id = ?')->execute([$r['id']]);
    json_reponse(['ok' => true, 'email' => $email]);
}

// --------------------------------------------------------------------------- //
// Demande « devenir partenaire » — ouverte à tous
// --------------------------------------------------------------------------- //
function route_partenaire(): void
{
    $structure = champ('structure');
    $email     = strtolower(champ('email'));
    if ($structure === '')              erreur('Le nom de la structure est requis.');
    if (!preg_match(EMAIL_RE, $email))  erreur('Adresse e-mail invalide.');

    $st = db()->prepare(
        'INSERT INTO partner_requests(structure, email, site, categorie, message, created)
         VALUES (?,?,?,?,?,?)');
    $st->execute([$structure, $email, mb_substr(champ('site'), 0, 500),
                  mb_substr(champ('categorie'), 0, 200), mb_substr(champ('message'), 0, 2000),
                  maintenant()]);
    // TODO : notifier par e-mail (mail() ou service transactionnel).
    json_reponse(['ok' => true]);
}
