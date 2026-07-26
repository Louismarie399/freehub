<?php
/**
 * FreeHub — page de diagnostic (PHASE 1, temporaire).
 *
 * Vérifie que l'hébergement exécute bien PHP nativement, sans Passenger, et que
 * tout ce dont la Phase 2 aura besoin est disponible.
 *
 * À SUPPRIMER une fois la migration terminée (voir Phase 3).
 * Accès : https://free-hub.fr/diagnostic.php?k=JCf-nNDpD700d7A026p78SSg
 */

const JETON = 'JCf-nNDpD700d7A026p78SSg';

if (($_GET['k'] ?? '') !== JETON) {
    http_response_code(404);
    exit('Not found');
}

// --- Vecteur de test PBKDF2 : doit reproduire EXACTEMENT ce que produit Python.
// Référence calculée avec hashlib.pbkdf2_hmac('sha256', ..., 200000).hex()
const PBKDF2_MDP      = 'motdepasse-test';
const PBKDF2_SEL      = '0123456789abcdef0123456789abcdef';
const PBKDF2_ATTENDU  = '576dd1b69274818b80165d02934a73a795d5311aec15fda360c8ecdc145cc949';

$dataDir = getenv('FH_DATA_DIR') ?: '/home/rtym5189/freehub_data';

/** Chaque test renvoie [ok, libellé, détail]. */
$tests = [];

// 1. PHP s'exécute (si tu lis cette page rendue, c'est déjà gagné).
$tests[] = [true, 'PHP exécuté nativement',
    'PHP ' . PHP_VERSION . ' — SAPI : ' . php_sapi_name()];

// 2. POST : LE test qui échouait avec Passenger.
$estPost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$tests[] = [$estPost, 'Requête POST reçue par PHP',
    $estPost
        ? 'POST traité par PHP — le blocage Passenger est bien contourné.'
        : 'Non testé : utilise le bouton en bas de page.'];

// 3. PDO SQLite — indispensable, la base actuelle est reprise telle quelle.
$pdoOk = class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers(), true);
$tests[] = [$pdoOk, 'Extension PDO SQLite',
    $pdoOk ? 'Pilotes : ' . implode(', ', PDO::getAvailableDrivers())
           : 'ABSENT — bloquant, il faudrait demander son activation au support.'];

// 4. Compatibilité des mots de passe existants.
$calcule = hash_pbkdf2('sha256', PBKDF2_MDP, hex2bin(PBKDF2_SEL), 200000, 0, false);
$hashOk  = hash_equals(PBKDF2_ATTENDU, $calcule);
$tests[] = [$hashOk, 'Mots de passe compatibles avec Python',
    $hashOk ? 'PBKDF2 identique : aucun compte à réinitialiser.'
            : 'ÉCART — obtenu : ' . substr($calcule, 0, 24) . '…'];

// 5. Dossier de données : lisible et inscriptible.
$dirExiste = is_dir($dataDir);
$dirEcrit  = $dirExiste && is_writable($dataDir);
$baseFic   = rtrim($dataDir, '/') . '/freehub.db';
$baseLa    = file_exists($baseFic);
$tests[] = [$dirEcrit, 'Dossier de données inscriptible',
    ($dirExiste ? "Trouvé : $dataDir" : "INTROUVABLE : $dataDir")
    . ($dirEcrit ? ' — écriture OK' : ' — écriture IMPOSSIBLE')
    . ($baseLa ? ' — freehub.db présent (' . number_format(filesize($baseFic) / 1024, 1, ',', ' ') . ' Ko)'
               : ' — pas encore de freehub.db (normal si aucun compte créé)')];

// 6. Lecture réelle de la base, si elle existe.
if ($baseLa && $pdoOk) {
    try {
        $pdo = new PDO('sqlite:' . $baseFic, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                      ->fetchAll(PDO::FETCH_COLUMN);
        $nbUsers = in_array('users', $tables, true)
            ? (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() : 0;
        $tests[] = [true, 'Base SQLite lisible',
            count($tables) . ' table(s) : ' . implode(', ', $tables) . " — $nbUsers compte(s)"];
    } catch (Throwable $e) {
        $tests[] = [false, 'Base SQLite lisible', 'Erreur : ' . $e->getMessage()];
    }
}

// 7. cURL — requis pour l'API Claude et l'échange de jetons Google.
$curlOk = function_exists('curl_init');
$tests[] = [$curlOk, 'Extension cURL',
    $curlOk ? 'Disponible — /api/analyze et Google OAuth pourront fonctionner.'
            : 'ABSENTE — repli possible sur file_get_contents si allow_url_fopen est actif.'];

// 8. Réécriture d'URL : sans elle, pas de routeur /api/*.
$rewriteOk = in_array('mod_rewrite', function_exists('apache_get_modules') ? apache_get_modules() : [], true)
             || isset($_SERVER['HTTP_X_REWRITE_TEST']);
$tests[] = [null, 'Réécriture d’URL (mod_rewrite)',
    'Non déterminable depuis PHP sur LiteSpeed — validée par le test /api/ping ci-dessous.'];

// 9. Les fichiers sensibles sont-ils encore exposés ?
$expose = [];
foreach (['server.py', 'codes.py', 'requirements.txt', 'admin.py'] as $f) {
    if (file_exists(__DIR__ . '/' . $f)) $expose[] = $f;
}
$tests[] = [count($expose) === 0, 'Fichiers Python retirés du web',
    $expose ? 'Encore présents : ' . implode(', ', $expose)
              . ' — protégés par .htaccess, mais à supprimer en Phase 3.'
            : 'Aucun fichier Python résiduel.'];

// 10. Variables d'environnement : elles ne suivent PAS depuis « Setup Python App ».
$vars = [];
foreach (['FH_DATA_DIR', 'FH_SITE_URL', 'COOKIE_SECURE', 'ANTHROPIC_API_KEY',
          'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as $v) {
    $val = getenv($v);
    $vars[$v] = $val === false || $val === '' ? null : (strlen($val) > 12 ? '(définie)' : $val);
}
$definies = count(array_filter($vars));
$tests[] = [null, 'Variables d’environnement visibles par PHP',
    $definies . ' / ' . count($vars) . ' détectée(s). Celles de « Setup Python App » ne '
    . 'sont PAS transmises à PHP : la Phase 2 les lira dans un fichier de config hors webroot.'];

$echecs = count(array_filter($tests, fn($t) => $t[0] === false));
?><!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FreeHub — diagnostic PHP</title>
<style>
  body{margin:0;background:#f4f6fa;font-family:system-ui,-apple-system,sans-serif;color:#0f1b33;padding:28px 18px}
  .box{max-width:760px;margin:0 auto}
  h1{font-size:21px;margin:0 0 4px}
  .sub{color:#5b6b85;font-size:14px;margin-bottom:20px}
  .bilan{padding:14px 18px;border-radius:12px;font-weight:700;margin-bottom:18px}
  .bilan.ok{background:#e6f6ee;color:#0f7040}
  .bilan.ko{background:#fef2f2;color:#b91c1c}
  .t{background:#fff;border:1px solid rgba(15,27,51,.1);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;gap:13px;align-items:flex-start}
  .p{font-size:17px;line-height:1;margin-top:2px}
  .n{font-weight:700;font-size:14.5px}
  .d{color:#5b6b85;font-size:13px;margin-top:3px;line-height:1.5;word-break:break-word}
  form{margin-top:18px}
  button{padding:11px 20px;border:none;border-radius:10px;background:#2f6bff;color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
  .note{margin-top:22px;font-size:12.5px;color:#8a97ad;line-height:1.6}
  code{background:#eef1f7;padding:1px 6px;border-radius:5px;font-size:12px}
</style></head><body><div class="box">
<h1>FreeHub — diagnostic de l'hébergement</h1>
<div class="sub">Phase 1 de la migration Python → PHP. Page temporaire.</div>

<div class="bilan <?= $echecs ? 'ko' : 'ok' ?>">
  <?= $echecs ? "⚠️ $echecs point(s) bloquant(s) — voir ci-dessous."
              : '✅ Tout est vert : PHP s’exécute nativement, la Phase 2 peut démarrer.' ?>
</div>

<?php foreach ($tests as [$ok, $nom, $detail]): ?>
  <div class="t">
    <span class="p"><?= $ok === true ? '✅' : ($ok === false ? '❌' : 'ℹ️') ?></span>
    <span><span class="n"><?= htmlspecialchars($nom) ?></span>
    <div class="d"><?= htmlspecialchars($detail) ?></div></span>
  </div>
<?php endforeach; ?>

<form method="post">
  <button type="submit">Tester une requête POST</button>
</form>

<div class="note">
  Test complémentaire du routage : ouvrir <code>/api/ping?k=<?= JETON ?></code>.
  S'il répond en JSON, la réécriture d'URL fonctionne et le routeur de la Phase 2 est prêt.<br>
  Supprimer <code>diagnostic.php</code> et <code>api/index.php</code>'s ping en fin de migration.
</div>
</div></body></html>
