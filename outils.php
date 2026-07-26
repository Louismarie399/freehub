<?php
/**
 * FreeHub — outils d'administration en ligne de commande (remplace codes.py et admin.py).
 * À lancer SUR LE SERVEUR, depuis le dossier du site :
 *
 *   php outils.php comptes
 *   php outils.php creer-admin --email x@y.fr [--password "…"] [--prenom Louis]
 *   php outils.php promouvoir x@y.fr      |  php outils.php retrograder x@y.fr
 *   php outils.php mot-de-passe x@y.fr [--password "…"]
 *   php outils.php codes
 *   php outils.php code-ajouter [--code ALPHA-2026] [--uses 0] [--note "Marie"]
 *   php outils.php code-revoquer ALPHA-2026   |  php outils.php code-activer ALPHA-2026
 *
 * (--uses 0 = illimité)
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit('Not found'); }

require_once __DIR__ . '/api/bootstrap.php';

/** Options --cle valeur de la ligne de commande. */
function opt(array $argv, string $nom, ?string $defaut = null): ?string
{
    $i = array_search('--' . $nom, $argv, true);
    return ($i !== false && isset($argv[$i + 1])) ? $argv[$i + 1] : $defaut;
}

function mdp_solide(int $n = 16): string
{
    $a = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%-_';
    $s = '';
    for ($i = 0; $i < $n; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
    return $s;
}

/** Codes lisibles à voix haute : ni I, ni O, ni 0, ni 1. */
function code_aleatoire(int $n = 8): string
{
    $a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < $n; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
    return $s;
}

$argv = $_SERVER['argv'];
$cmd  = $argv[1] ?? '';
$pdo  = db();

switch ($cmd) {
    case 'comptes':
        $lignes = $pdo->query('SELECT email, prenom, nom, is_admin, beta FROM users ORDER BY created')
                      ->fetchAll();
        if (!$lignes) { echo "Aucun compte.\n"; break; }
        printf("%-34s %-16s %s\n", 'E-MAIL', 'RÔLES', 'NOM');
        echo str_repeat('-', 74), "\n";
        foreach ($lignes as $r) {
            $roles = implode(' ', array_filter([$r['is_admin'] ? 'admin' : '', $r['beta'] ? 'bêta' : '']));
            printf("%-34s %-16s %s\n", $r['email'], $roles ?: '—',
                   trim(($r['prenom'] ?: '') . ' ' . ($r['nom'] ?: '')));
        }
        break;

    case 'creer-admin':
        $email = strtolower(trim((string) opt($argv, 'email', '')));
        if (!preg_match(EMAIL_RE, $email)) exit("❌ Adresse e-mail invalide.\n");
        $st = $pdo->prepare('SELECT 1 FROM users WHERE email = ?');
        $st->execute([$email]);
        if ($st->fetch()) exit("❌ Ce compte existe déjà. Utilise « promouvoir » ou « mot-de-passe ».\n");
        $mdp = opt($argv, 'password') ?: mdp_solide();
        if (strlen($mdp) < 8) exit("❌ Mot de passe trop court (8 caractères minimum).\n");
        $sel = sel_aleatoire();
        $pdo->prepare(
            "INSERT INTO users(email, pw_hash, pw_salt, created, prenom, nom, is_admin, beta,
                               invite_code, google_sub) VALUES (?,?,?,?,?,?,1,1,'','')")
            ->execute([$email, hash_pw($mdp, $sel), $sel, maintenant(),
                       opt($argv, 'prenom', '') ?: '', opt($argv, 'nom', '') ?: '']);
        echo "✅ Compte admin créé : $email\n   Mot de passe : $mdp\n";
        if (!opt($argv, 'password')) echo "   ⚠️ Note-le maintenant : il n'est pas récupérable.\n";
        break;

    case 'promouvoir':
    case 'retrograder':
        $email = strtolower(trim((string) ($argv[2] ?? '')));
        $val = $cmd === 'promouvoir' ? 1 : 0;
        if (!$val && (int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_admin = 1')->fetchColumn() <= 1) {
            exit("❌ Impossible : c'est le dernier administrateur.\n");
        }
        $st = $pdo->prepare('UPDATE users SET is_admin = ? WHERE email = ?');
        $st->execute([$val, $email]);
        echo $st->rowCount()
            ? ($val ? "✅ $email est désormais admin.\n" : "✅ $email n'est plus admin.\n")
            : "⚠️ Compte introuvable : $email\n";
        break;

    case 'mot-de-passe':
        $email = strtolower(trim((string) ($argv[2] ?? '')));
        $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $st->execute([$email]);
        $u = $st->fetch();
        if (!$u) exit("⚠️ Compte introuvable : $email\n");
        $mdp = opt($argv, 'password') ?: mdp_solide();
        $sel = sel_aleatoire();
        $pdo->prepare('UPDATE users SET pw_hash = ?, pw_salt = ? WHERE id = ?')
            ->execute([hash_pw($mdp, $sel), $sel, $u['id']]);
        $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$u['id']]);
        echo "✅ Nouveau mot de passe pour $email : $mdp\n   Les sessions ouvertes ont été fermées.\n";
        break;

    case 'codes':
        $lignes = $pdo->query('SELECT * FROM invite_codes ORDER BY created DESC')->fetchAll();
        if (!$lignes) { echo "Aucun code.\n"; break; }
        printf("%-14s %-10s %-10s %s\n", 'CODE', 'UTILISÉ', 'ÉTAT', 'NOTE');
        echo str_repeat('-', 58), "\n";
        foreach ($lignes as $r) {
            $total = $r['max_uses'] ? (string) $r['max_uses'] : '∞';
            $etat = !$r['actif'] ? 'révoqué'
                  : (($r['max_uses'] && $r['uses'] >= $r['max_uses']) ? 'épuisé' : 'actif');
            printf("%-14s %-10s %-10s %s\n", $r['code'], $r['uses'] . '/' . $total, $etat, $r['note']);
        }
        break;

    case 'code-ajouter':
        $code = strtoupper(trim((string) (opt($argv, 'code') ?: code_aleatoire())));
        $st = $pdo->prepare('SELECT 1 FROM invite_codes WHERE UPPER(code) = ?');
        $st->execute([$code]);
        if ($st->fetch()) exit("⚠️ Le code $code existe déjà.\n");
        $uses = max(0, (int) (opt($argv, 'uses', '1')));
        $pdo->prepare('INSERT INTO invite_codes(code, note, max_uses, uses, actif, created)
                       VALUES (?,?,?,0,1,?)')
            ->execute([$code, opt($argv, 'note', '') ?: '', $uses, maintenant()]);
        echo "✅ Code créé : $code   (" . ($uses ? "$uses utilisation(s)" : 'illimité') . ")\n";
        break;

    case 'code-revoquer':
    case 'code-activer':
        $code = strtoupper(trim((string) ($argv[2] ?? '')));
        $st = $pdo->prepare('UPDATE invite_codes SET actif = ? WHERE UPPER(code) = ?');
        $st->execute([$cmd === 'code-activer' ? 1 : 0, $code]);
        echo $st->rowCount()
            ? ($cmd === 'code-activer' ? "✅ Réactivé : $code\n" : "🚫 Révoqué : $code\n")
            : "⚠️ Code introuvable : $code\n";
        break;

    default:
        echo trim((string) file_get_contents(__FILE__, false, null, 0, 1200)), "\n";
        echo "\nCommande inconnue. Voir l'en-tête ci-dessus.\n";
}
