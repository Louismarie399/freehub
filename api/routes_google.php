<?php
/** FreeHub — connexion Google (OAuth 2.0, « Authorization Code »). */

declare(strict_types=1);

const GOOGLE_AUTH     = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN    = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

function google_redirect_uri(): string
{
    return rtrim(config('site_url'), '/') . '/api/auth/google/callback';
}

/** Retour sur la landing avec un message affichable dans la modal. */
function retour_landing(string $erreur): void
{
    header('Location: /?erreur=' . rawurlencode($erreur), true, 303);
    exit;
}

function route_google_start(): void
{
    if (!google_actif()) retour_landing("La connexion Google n'est pas encore configurée.");

    // Jeton d'état : protège du CSRF et transporte le code d'accès jusqu'au retour.
    $state = jeton(24);
    $pdo = db();
    $st = $pdo->prepare('DELETE FROM oauth_states WHERE created < ?');
    $st->execute([(new DateTimeImmutable('-15 minutes', new DateTimeZone('UTC')))
                  ->format('Y-m-d\TH:i:s.uP')]);
    $mode = ($_GET['mode'] ?? 'signup') === 'login' ? 'login' : 'signup';
    $st = $pdo->prepare('INSERT INTO oauth_states(state, mode, code, created) VALUES (?,?,?,?)');
    $st->execute([$state, $mode, trim((string) ($_GET['code'] ?? '')), maintenant()]);

    $params = http_build_query([
        'client_id'     => config('google_client_id'),
        'redirect_uri'  => google_redirect_uri(),
        'response_type' => 'code',
        'scope'         => 'openid email profile',
        'state'         => $state,
        'prompt'        => 'select_account',
    ]);
    header('Location: ' . GOOGLE_AUTH . '?' . $params, true, 303);
    exit;
}

/** Appel HTTP JSON via cURL. Retourne null en cas d'échec. */
function http_json(string $url, ?array $post = null, array $entetes = []): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => $entetes,
    ]);
    if ($post !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    }
    $rep  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($rep === false || $code >= 400) return null;
    $d = json_decode((string) $rep, true);
    return is_array($d) ? $d : null;
}

function route_google_callback(): void
{
    $state = (string) ($_GET['state'] ?? '');
    $code  = (string) ($_GET['code'] ?? '');
    if (($_GET['error'] ?? '') !== '' || $code === '' || $state === '') {
        retour_landing('Connexion Google annulée.');
    }
    if (!google_actif()) retour_landing("La connexion Google n'est pas encore configurée.");

    $pdo = db();
    $st = $pdo->prepare('SELECT * FROM oauth_states WHERE state = ?');
    $st->execute([$state]);
    $etat = $st->fetch();
    if (!$etat) retour_landing('Session Google expirée. Réessaie.');
    $pdo->prepare('DELETE FROM oauth_states WHERE state = ?')->execute([$state]);

    $jeton = http_json(GOOGLE_TOKEN, [
        'code'          => $code,
        'client_id'     => config('google_client_id'),
        'client_secret' => config('google_client_secret'),
        'redirect_uri'  => google_redirect_uri(),
        'grant_type'    => 'authorization_code',
    ]);
    if (!$jeton || empty($jeton['access_token'])) retour_landing("Google n'a pas répondu. Réessaie.");

    $infos = http_json(GOOGLE_USERINFO, null, ['Authorization: Bearer ' . $jeton['access_token']]);
    if (!$infos) retour_landing("Google n'a pas répondu. Réessaie.");

    $email = strtolower(trim((string) ($infos['email'] ?? '')));
    if ($email === '' || ($infos['email_verified'] ?? true) === false) {
        retour_landing('Adresse Google non vérifiée.');
    }
    $sub = (string) ($infos['sub'] ?? '');

    $st = $pdo->prepare('SELECT id, google_sub FROM users WHERE email = ?');
    $st->execute([$email]);
    $user = $st->fetch();

    if ($user) {
        // Compte existant : on le relie au compte Google au premier passage.
        if (!$user['google_sub']) {
            $pdo->prepare('UPDATE users SET google_sub = ? WHERE id = ?')
                ->execute([$sub, $user['id']]);
        }
        $uid = (int) $user['id'];
    } else {
        // Nouveau compte : soumis au code d'accès, comme l'inscription classique.
        $codeRow = null;
        if (!config('open_signup')) {
            $codeRow = code_valide((string) $etat['code']);
            if (!$codeRow) {
                retour_landing("Il faut un code d'accès valide pour créer un compte (alpha privée).");
            }
        }
        // Pas de mot de passe utilisable : la connexion se fait via Google.
        $sel = sel_aleatoire();
        $pdo->prepare(
            'INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, google_sub,
                               invite_code, beta, is_admin) VALUES (?,?,?,?,?,?,?,?,?,0)')
            ->execute([$email, hash_pw(jeton(32), $sel), $sel, maintenant(),
                       mb_substr((string) ($infos['given_name'] ?? ''), 0, 80),
                       mb_substr((string) ($infos['family_name'] ?? ''), 0, 80),
                       $sub, $codeRow['code'] ?? '', config('open_signup') ? 0 : 1]);
        if ($codeRow) consommer_code($codeRow);
        $uid = (int) $pdo->lastInsertId();
    }

    poser_cookie(ouvrir_session($uid));
    header('Location: /app', true, 303);
    exit;
}
