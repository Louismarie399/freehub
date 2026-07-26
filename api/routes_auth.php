<?php
/** FreeHub — routes d'authentification (transposition de server.py). */

declare(strict_types=1);

/** Ce que la landing doit savoir avant d'afficher ses formulaires. */
function route_auth_config(): void
{
    json_reponse(['google' => google_actif(), 'codeRequis' => !config('open_signup')]);
}

function route_signup(): void
{
    $email = strtolower(champ('email'));
    $mdp   = (string) (corps()['password'] ?? '');

    if (!preg_match(EMAIL_RE, $email))  erreur('Adresse e-mail invalide.');
    if (strlen($mdp) < 8)               erreur('Le mot de passe doit faire au moins 8 caractères.');

    $pdo = db();
    $st = $pdo->prepare('SELECT 1 FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) erreur('Un compte existe déjà pour cet e-mail.', 409);

    // Alpha privée : un code d'accès valide est exigé.
    $code = null;
    if (!config('open_signup')) {
        $code = code_valide(champ('code'));
        if (!$code) refus_code();
    }

    $sel  = sel_aleatoire();
    $beta = config('open_signup') ? 0 : 1;   // insigne bêta, définitif
    $st = $pdo->prepare(
        'INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, invite_code, beta,
                           google_sub, is_admin)
         VALUES (?,?,?,?,?,?,?,?,\'\',0)');
    $st->execute([$email, hash_pw($mdp, $sel), $sel, maintenant(),
                  mb_substr(champ('prenom'), 0, 80), mb_substr(champ('nom'), 0, 80),
                  $code['code'] ?? '', $beta]);
    if ($code) consommer_code($code);

    $uid = (int) $pdo->lastInsertId();
    poser_cookie(ouvrir_session($uid));
    json_reponse([
        'email'   => $email,
        'prenom'  => champ('prenom'),
        'nom'     => champ('nom'),
        'isAdmin' => false,
        'beta'    => (bool) $beta,
    ]);
}

function route_login(): void
{
    $email = strtolower(champ('email'));
    $st = db()->prepare(
        'SELECT id, pw_hash, pw_salt, prenom, nom, is_admin, beta FROM users WHERE email = ?');
    $st->execute([$email]);
    $r = $st->fetch();

    // hash_equals : comparaison à temps constant, contre les attaques temporelles.
    $mdp = (string) (corps()['password'] ?? '');
    if (!$r || !hash_equals($r['pw_hash'], hash_pw($mdp, $r['pw_salt']))) {
        erreur('E-mail ou mot de passe incorrect.', 401);
    }

    poser_cookie(ouvrir_session((int) $r['id']));
    json_reponse([
        'email'   => $email,
        'prenom'  => $r['prenom'] ?: '',
        'nom'     => $r['nom'] ?: '',
        'isAdmin' => (bool) $r['is_admin'],
        'beta'    => (bool) $r['beta'],
    ]);
}

function route_logout(): void
{
    $t = $_COOKIE[COOKIE] ?? '';
    if ($t !== '') {
        $st = db()->prepare('DELETE FROM sessions WHERE token = ?');
        $st->execute([$t]);
    }
    setcookie(COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
    json_reponse(['ok' => true]);
}

function route_me(): void
{
    $u = exige_connexion();
    json_reponse([
        'email'   => $u['email'],
        'prenom'  => $u['prenom'] ?: '',
        'nom'     => $u['nom'] ?: '',
        'isAdmin' => (bool) $u['is_admin'],
        'beta'    => (bool) $u['beta'],
    ]);
}
