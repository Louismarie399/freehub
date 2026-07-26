<?php
/**
 * MODÈLE de configuration FreeHub.
 *
 * À copier sur le serveur dans le dossier de données, HORS du dossier web :
 *     /home/rtym5189/freehub_data/config.php     (chmod 600)
 *
 * Pourquoi hors du dossier web : si PHP cessait de s'exécuter (comme c'est arrivé
 * avec Passenger), tout fichier du site serait servi en clair — secrets compris.
 * Ce fichier n'est jamais commité ni déployé.
 */
return [
    'data_dir'             => '/home/rtym5189/freehub_data',
    'site_url'             => 'https://free-hub.fr',   // sans barre oblique finale
    'cookie_secure'        => true,                    // false uniquement en local http
    'open_signup'          => false,                   // true = fin de l'alpha privée
    'anthropic_api_key'    => 'sk-ant-…',
    'google_client_id'     => '',                      // vide = bouton Google masqué
    'google_client_secret' => '',
    'model'                => 'claude-sonnet-5',
];
