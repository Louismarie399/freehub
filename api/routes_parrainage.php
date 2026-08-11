<?php
/** FreeHub — parrainage : code personnel, validation, classement. */

declare(strict_types=1);

/**
 * Le code personnel d'un membre, créé au premier appel.
 * Format : PRENOM-XXXX, lisible à l'oral et sans ambiguïté (ni O/0 ni I/1).
 */
function parrainage_code(array $u): string
{
    $st = db()->prepare('SELECT code FROM invite_codes WHERE parrain_id = ? LIMIT 1');
    $st->execute([$u['id']]);
    $existant = $st->fetchColumn();
    if ($existant) return (string) $existant;

    // Les accents sont ramenés à leur lettre nue avant le filtrage : sans ça
    // « Élodie » donnerait LODIE, et « Zoé » donnerait ZO.
    $base = strtr((string) ($u['prenom'] ?? ''),
        ['à'=>'a','â'=>'a','ä'=>'a','á'=>'a','ã'=>'a','å'=>'a','ç'=>'c','é'=>'e','è'=>'e',
         'ê'=>'e','ë'=>'e','î'=>'i','ï'=>'i','í'=>'i','ô'=>'o','ö'=>'o','ó'=>'o','õ'=>'o',
         'ù'=>'u','û'=>'u','ü'=>'u','ú'=>'u','ÿ'=>'y','ñ'=>'n','œ'=>'oe','æ'=>'ae',
         'À'=>'A','Â'=>'A','Ä'=>'A','Á'=>'A','Ã'=>'A','Å'=>'A','Ç'=>'C','É'=>'E','È'=>'E',
         'Ê'=>'E','Ë'=>'E','Î'=>'I','Ï'=>'I','Í'=>'I','Ô'=>'O','Ö'=>'O','Ó'=>'O','Õ'=>'O',
         'Ù'=>'U','Û'=>'U','Ü'=>'U','Ú'=>'U','Ÿ'=>'Y','Ñ'=>'N','Œ'=>'OE','Æ'=>'AE']);
    $base = strtoupper((string) preg_replace('/[^A-Za-z]/', '', $base));
    $base = substr($base, 0, 8);
    if ($base === '') $base = 'MEMBRE';

    // Alphabet volontairement réduit : un code se dicte au téléphone.
    $alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($essai = 0; $essai < 12; $essai++) {
        $suffixe = '';
        for ($i = 0; $i < 4; $i++) $suffixe .= $alpha[random_int(0, strlen($alpha) - 1)];
        $code = $base . '-' . $suffixe;
        $st = db()->prepare('SELECT 1 FROM invite_codes WHERE UPPER(code) = ?');
        $st->execute([$code]);
        if ($st->fetch()) continue;
        // max_uses = 0 : un parrain n'a pas de plafond d'invitations.
        db()->prepare(
            'INSERT INTO invite_codes(code, note, max_uses, uses, actif, created, parrain_id)
             VALUES (?,?,0,0,1,?,?)')
            ->execute([$code, 'Parrainage', maintenant(), $u['id']]);
        return $code;
    }
    erreur('Impossible de générer ton lien pour le moment.', 500);
}

/**
 * Enregistre le parrainage quand le filleul a fini son arrivée.
 * Appelée par /api/parrainage/valider, jamais à l'inscription : c'est ce
 * décalage qui rend le classement difficile à gonfler.
 */
function parrainage_valider(array $u): void
{
    // utilisateur_courant() ne remonte pas invite_code : on va le chercher.
    $st = db()->prepare('SELECT invite_code FROM users WHERE id = ?');
    $st->execute([$u['id']]);
    $code = trim((string) ($st->fetchColumn() ?: ''));
    if ($code === '') return;

    $st = db()->prepare('SELECT parrain_id FROM invite_codes WHERE UPPER(code) = ?');
    $st->execute([strtoupper($code)]);
    $parrain = (int) ($st->fetchColumn() ?: 0);
    // Code d'ouverture sans parrain, ou quelqu'un qui se parraine lui-même.
    if (!$parrain || $parrain === (int) $u['id']) return;

    // INSERT OR IGNORE : la clé primaire sur filleul_id garantit qu'un membre
    // ne peut être compté qu'une fois, même si l'appel est rejoué.
    db()->prepare(
        'INSERT OR IGNORE INTO parrainages(filleul_id, parrain_id, created) VALUES (?,?,?)')
        ->execute([$u['id'], $parrain, maintenant()]);
}

/** POST /api/parrainage/valider — le filleul vient de terminer son arrivée. */
function route_parrainage_valider(): void
{
    $u = exige_connexion();
    parrainage_valider($u);
    json_reponse(['ok' => true]);
}

/**
 * GET /api/parrainage — le lien du membre, son rang, et le classement.
 * Les noms suivent la règle de l'Entraide : prénom et initiale.
 */
function route_parrainage(): void
{
    $u = exige_connexion();
    $pdo = db();

    $classement = [];
    $rangs = [];
    $position = 0;
    $sql = 'SELECT p.parrain_id AS id, COUNT(*) AS n, u.prenom, u.nom
              FROM parrainages p JOIN users u ON u.id = p.parrain_id
             GROUP BY p.parrain_id
             ORDER BY n DESC, MIN(p.created) ASC
             LIMIT 20';
    $i = 0;
    foreach ($pdo->query($sql) as $r) {
        $i++;
        $nom = trim((string) $r['prenom']);
        if ($nom !== '' && trim((string) $r['nom']) !== '') {
            $nom .= ' ' . mb_substr(trim((string) $r['nom']), 0, 1) . '.';
        }
        $classement[] = [
            'rang' => $i,
            'nom'  => $nom !== '' ? $nom : 'Membre',
            'n'    => (int) $r['n'],
            'moi'  => (int) $r['id'] === (int) $u['id'],
        ];
        if ((int) $r['id'] === (int) $u['id']) $position = $i;
    }

    $st = $pdo->prepare('SELECT COUNT(*) FROM parrainages WHERE parrain_id = ?');
    $st->execute([$u['id']]);
    $mes = (int) $st->fetchColumn();

    // Hors du top 20 : on calcule quand même le rang réel, sinon un membre
    // actif ne saurait pas où il en est.
    if (!$position && $mes) {
        $st = $pdo->prepare(
            'SELECT COUNT(*) FROM (SELECT parrain_id, COUNT(*) n FROM parrainages
                                    GROUP BY parrain_id HAVING n > ?) x');
        $st->execute([$mes]);
        $position = ((int) $st->fetchColumn()) + 1;
    }

    json_reponse([
        'code'       => parrainage_code($u),
        'mes'        => $mes,
        'rang'       => $position,
        'classement' => $classement,
    ]);
}
