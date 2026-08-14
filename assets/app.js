(function(){
  "use strict";

  // ---------------------------------------------------------------------------
  // Catalogue des objectifs (données statiques, côté client)
  // ---------------------------------------------------------------------------
  // Les domaines donnent leur couleur aux objectifs : on classe par sujet, pas
  // par objectif. Teintes volontairement plus douces que dans le profil.
  var DOMAINES = {
    statut:        { l:'Statut',        c:'#2563eb', soft:'#f2f6ff', ico:'🏛' },
    fiscalite:     { l:'Fiscalité',     c:'#b45309', soft:'#fffbef', ico:'🧾' },
    tva:           { l:'TVA',           c:'#7c3aed', soft:'#f7f3ff', ico:'📊' },
    administratif: { l:'Administratif', c:'#4a6180', soft:'#ecf0f8', ico:'📁' },
    pilotage:      { l:'Pilotage',      c:'#0f9d6e', soft:'#f0fdf6', ico:'🎛' },
  };
  var ORDRE_DOMAINES = ['statut','fiscalite','tva','administratif','pilotage'];

  // ---------------------------------------------------------------------------
  // Lexique - les mots de l'administratif, expliqués simplement
  // ---------------------------------------------------------------------------
  // `cat` reprend les domaines pour la couleur ; `def` = 1 à 3 phrases, sans
  // jargon. On n'invente aucun chiffre : les définitions restent qualitatives.
  var LEXIQUE = [
    { id:'client-recup', t:'Client qui récupère la TVA', cat:'tva',
      court:'En général, une entreprise assujettie à la TVA.',
      def:'Un client assujetti à la TVA la récupère sur ses achats : pour lui, ta TVA n’est pas un coût définitif, juste une avance de trésorerie. En pratique, c’est le cas de la plupart des sociétés (SAS, SARL, EURL…) et des indépendants qui ont opté pour la TVA. Leur facturer la TVA ne change donc quasiment rien pour eux.' },
    { id:'client-non-recup', t:'Client qui ne récupère pas la TVA', cat:'tva',
      court:'Particuliers, auto-entrepreneurs en franchise, associations.',
      def:'Si tu travailles avec des particuliers ou des auto-entrepreneurs en franchise en base, aucun des deux ne récupère la TVA : ta hausse de prix devient pour eux une vraie augmentation. Même chose pour beaucoup d’associations et d’activités exonérées. C’est cette part de clientèle qui rend le passage à la TVA délicat commercialement.' },
    { id:'micro', t:'Micro-entreprise', cat:'statut',
      court:'Le régime simplifié de l’entreprise individuelle.',
      def:'Un régime simplifié pour exercer en solo : démarches allégées, comptabilité réduite, et des cotisations calculées en pourcentage de ce que tu encaisses. On dit aussi « auto-entreprise ».' },
    { id:'ei', t:'Entreprise individuelle (EI)', cat:'statut',
      court:'Tu es l’entreprise, sans créer de société.',
      def:'Tu exerces en ton nom propre, sans personne morale distincte. La micro-entreprise est une version simplifiée de l’EI.' },
    { id:'eurl', t:'EURL', cat:'statut',
      court:'Une SARL à un seul associé.',
      def:'Une société à responsabilité limitée avec un seul associé. Le dirigeant y est « travailleur non salarié ». Elle sépare ton patrimoine de celui de l’entreprise.' },
    { id:'sasu', t:'SASU', cat:'statut',
      court:'Une SAS à un seul associé.',
      def:'Une société par actions simplifiée avec un seul associé. Le dirigeant y est « assimilé salarié », mieux couvert socialement mais plus coûteux en cotisations.' },
    { id:'tns', t:'Travailleur non salarié (TNS)', cat:'statut',
      court:'Le régime social du dirigeant d’EURL ou de micro.',
      def:'Un statut social où tu cotises à ta propre caisse d’indépendant. Cotisations plus légères qu’un salarié, mais protection sociale plus limitée.' },
    { id:'assimile', t:'Assimilé salarié', cat:'statut',
      court:'Le régime social du dirigeant de SASU.',
      def:'Un dirigeant rattaché au régime général, presque comme un salarié : meilleure couverture (hors chômage), mais cotisations plus élevées.' },
    { id:'kbis', t:'Extrait Kbis', cat:'statut',
      court:'La carte d’identité officielle d’une société.',
      def:'Le document officiel qui prouve l’existence légale de ta société : forme, siège, dirigeant, numéro d’immatriculation.' },
    { id:'siret', t:'SIRET', cat:'statut',
      court:'Le numéro d’identification de ton établissement.',
      def:'Un numéro à 14 chiffres qui identifie ton entreprise et son adresse. Il figure sur tes factures.' },
    { id:'guichet', t:'Guichet unique', cat:'administratif',
      court:'Le site officiel pour toutes tes formalités.',
      def:'La plateforme par laquelle passent désormais création, modification et cessation d’entreprise, à la place des anciens centres de formalités.' },
    { id:'domiciliation', t:'Domiciliation', cat:'administratif',
      court:'L’adresse administrative de ton entreprise.',
      def:'L’adresse officielle de ton activité : ton domicile, un local, ou une société de domiciliation. Elle apparaît sur tes documents et détermine ta CFE.' },
    { id:'dpae', t:'DPAE', cat:'administratif',
      court:'La déclaration à faire avant d’embaucher.',
      def:'La « déclaration préalable à l’embauche » : une formalité obligatoire à réaliser avant l’arrivée d’un salarié.' },

    { id:'abattement', t:'Abattement', cat:'fiscalite',
      court:'La part de revenu retirée avant impôt.',
      def:'Un pourcentage déduit de ton chiffre d’affaires pour estimer ton bénéfice, censé représenter tes frais. En micro, il remplace la déduction des dépenses réelles.' },
    { id:'bic', t:'BIC (bénéfices industriels et commerciaux)', cat:'fiscalite',
      court:'La catégorie du commerce, de l’artisanat et des services commerciaux.',
      def:'La case dans laquelle l’administration range tes revenus quand tu achètes et revends, fabriques, ou rends un service de nature commerciale : boutique, restauration, travaux, réparation, transport. Les BIC se divisent en deux sous-familles qui ne sont pas logées à la même enseigne : la vente de marchandises d’un côté, les prestations de services de l’autre. C’est cette catégorie qui fixe ton abattement en micro-entreprise et la case que tu remplis à la déclaration.' },
    { id:'bnc', t:'BNC (bénéfices non commerciaux)', cat:'fiscalite',
      court:'La catégorie des professions libérales et des activités intellectuelles.',
      def:'La case dans laquelle l’administration range tes revenus quand ton activité est intellectuelle ou libérale : conseil, développement, design, rédaction, traduction, coaching, mais aussi les professions réglementées. Si tu vends surtout ton temps et ton expertise plutôt que des biens, tu es très probablement en BNC. Attention à une confusion fréquente : ce n’est pas ton code APE qui tranche, c’est la nature réelle de ton activité.' },
    { id:'ir', t:'Impôt sur le revenu (IR)', cat:'fiscalite',
      court:'L’impôt sur les revenus du foyer.',
      def:'L’impôt calculé sur l’ensemble des revenus de ton foyer, selon un barème progressif par tranches.' },
    { id:'is', t:'Impôt sur les sociétés (IS)', cat:'fiscalite',
      court:'L’impôt sur le bénéfice d’une société.',
      def:'L’impôt payé par la société sur son bénéfice, avant toute distribution. Il existe un taux réduit sur une première tranche de bénéfice, puis un taux normal.' },
    { id:'bareme', t:'Barème progressif', cat:'fiscalite',
      court:'L’impôt par tranches, de plus en plus taxées.',
      def:'Ton revenu est découpé en tranches, chacune taxée à un taux croissant. Seule la part qui dépasse une tranche est imposée au taux supérieur.' },
    { id:'vfl', t:'Versement libératoire', cat:'fiscalite',
      court:'Payer son impôt au fil du chiffre d’affaires.',
      def:'Une option en micro-entreprise : tu règles ton impôt sur le revenu en même temps que tes cotisations, sous forme d’un petit pourcentage de ton chiffre d’affaires. Intéressant seulement dans certains cas.' },
    { id:'rfr', t:'Revenu fiscal de référence (RFR)', cat:'fiscalite',
      court:'Le revenu global qui sert de repère à l’administration.',
      def:'Un montant calculé par le fisc à partir de tous tes revenus. Il conditionne l’accès à certains dispositifs, comme le versement libératoire.' },
    { id:'quotient', t:'Quotient familial', cat:'fiscalite',
      court:'Les « parts » qui allègent l’impôt selon le foyer.',
      def:'Un système de parts (selon ta situation familiale) qui divise le revenu imposable pour adoucir la progressivité de l’impôt.' },
    { id:'cfe', t:'CFE', cat:'fiscalite',
      court:'Un impôt local dû par presque toutes les entreprises.',
      def:'La « cotisation foncière des entreprises » : un impôt local basé sur ta commune et ton activité, à régler chaque année, souvent en décembre.' },
    { id:'cotisations', t:'Cotisations sociales', cat:'fiscalite',
      court:'Ce que tu verses pour ta protection sociale.',
      def:'Les sommes qui financent ta santé, ta retraite et tes autres droits sociaux. En micro, elles sont un pourcentage de ton chiffre d’affaires ; en société, elles dépendent de ta rémunération.' },
    { id:'pfu', t:'PFU (flat tax)', cat:'fiscalite',
      court:'Un prélèvement forfaitaire sur les dividendes.',
      def:'Le « prélèvement forfaitaire unique » : un taux global appliqué notamment aux dividendes, qui regroupe impôt et prélèvements sociaux.' },

    { id:'franchise', t:'Franchise en base de TVA', cat:'tva',
      court:'Ne pas facturer la TVA sous un certain seuil.',
      def:'Un régime qui te dispense de facturer la TVA tant que ton chiffre d’affaires reste sous un seuil. Tu ne la collectes pas, mais tu ne la récupères pas non plus sur tes achats.' },
    { id:'tva-collectee', t:'TVA collectée', cat:'tva',
      court:'La TVA que tu factures à tes clients.',
      def:'La TVA que tu ajoutes à tes prix et encaisses pour le compte de l’État. Ce n’est pas un revenu : tu la reverses.' },
    { id:'tva-deductible', t:'TVA déductible', cat:'tva',
      court:'La TVA que tu récupères sur tes achats.',
      def:'La TVA payée sur tes dépenses professionnelles, que tu peux déduire de la TVA collectée. Tu ne reverses que la différence.' },
    { id:'tva-intra', t:'TVA intracommunautaire', cat:'tva',
      court:'Le numéro de TVA pour commercer dans l’UE.',
      def:'Un numéro de TVA européen qui identifie ton entreprise pour les échanges avec d’autres pays de l’Union.' },
    { id:'autoliquidation', t:'Autoliquidation', cat:'tva',
      court:'Le client déclare la TVA à ta place.',
      def:'Un mécanisme fréquent entre professionnels de pays différents : tu factures sans TVA, et c’est ton client qui la déclare de son côté.' },

    { id:'deductible', t:'Charge déductible', cat:'pilotage',
      court:'Une dépense qui réduit le bénéfice imposable.',
      def:'Une dépense engagée dans l’intérêt de l’entreprise, qu’on retire du bénéfice avant impôt. Encore faut-il qu’elle soit justifiée et réellement professionnelle.' },
    { id:'immobilisation', t:'Immobilisation', cat:'pilotage',
      court:'Un bien durable étalé dans le temps.',
      def:'Un achat coûteux et durable (matériel, véhicule) qui ne passe pas en charge d’un coup : sa valeur est répartie sur plusieurs années par l’amortissement.' },
    { id:'amortissement', t:'Amortissement', cat:'pilotage',
      court:'Étaler le coût d’un bien sur sa durée d’usage.',
      def:'La façon de déduire progressivement le prix d’un bien durable, année après année, plutôt qu’en une seule fois.' },
    { id:'dividendes', t:'Dividendes', cat:'pilotage',
      court:'La part du bénéfice versée aux associés.',
      def:'Une partie du bénéfice de la société distribuée à ses associés. En société, c’est une alternative ou un complément à la rémunération.' },
    { id:'quotepart', t:'Quote-part privée', cat:'pilotage',
      court:'La part personnelle d’une dépense mixte.',
      def:'Quand une dépense sert à la fois au pro et au perso (téléphone, voiture), la partie personnelle qu’il faut retirer avant de la déduire.' },
    { id:'tresorerie', t:'Trésorerie', cat:'pilotage',
      court:'L’argent réellement disponible tout de suite.',
      def:'Les liquidités dont tu disposes à un instant donné. La piloter, c’est garder de quoi encaisser les creux et les échéances.' },
    { id:'acre', t:'ACRE', cat:'fiscalite',
      court:'Une réduction de cotisations au démarrage.',
      def:'Un dispositif d’aide à la création qui allège tes cotisations sociales sur une période, si tu y es éligible.' },
  ];

  function loadLexique(){
    try { var raw = localStorage.getItem('freehub_lexique'); if(raw) return JSON.parse(raw) || []; }
    catch(e){}
    return [];
  }
  function saveLexique(){
    try { localStorage.setItem('freehub_lexique', JSON.stringify(state.lexEpingles)); } catch(e){}
    pousserServeur();
  }
  // Sélection du guide des dépenses (ids favoris), synchronisée avec le compte.
  function loadDepFavoris(){
    try { var raw = localStorage.getItem('freehub_dep_favoris'); if(raw) return JSON.parse(raw) || []; }
    catch(e){}
    return [];
  }
  function saveDepFavoris(){
    try { localStorage.setItem('freehub_dep_favoris', JSON.stringify(state.depFavoris)); } catch(e){}
    pousserServeur();
  }
  function terme(id){ return LEXIQUE.filter(function(x){ return x.id === id; })[0]; }

  // ---------------------------------------------------------------------------
  // Badges & jalons - récompenser les VRAIES étapes franchies, pas les clics.
  // Chaque badge a un `check()` évalué à chaque rendu ; le premier passage à vrai
  // le débloque et déclenche une petite célébration.
  // ---------------------------------------------------------------------------
  function nbObjectifsFinis(){
    return catalog.filter(function(o){ return pctOf(o.id).pct === 100; }).length;
  }
  function domainesEntames(){
    var s = {};
    catalog.forEach(function(o){ if(pctOf(o.id).done > 0) s[o.dom] = 1; });
    return Object.keys(s).length;
  }
  function profilComplet(){
    return sectionsProfil().every(function(x){ return x.ok; });
  }

  // Easter egg : le faux partenariat URSSAF (fiche au premier degré, code promo
  // crédible, lien vers le clip de Rick Astley). Passer ce drapeau à false le
  // retire partout d'un coup - la carte, la fiche et le badge - sans toucher au
  // reste. À basculer avant l'ouverture publique si le gag ne doit pas survivre
  // à l'alpha : afficher un partenariat avec un organisme public qui n'en est
  // pas un se défend mal une fois sorti d'un cercle d'invités.
  var GAG_URSSAF = true;

  var BADGES = [
    { id:'cap', ico:'🧭', t:'Le cap est fixé', d:'Ta première étape d’objectif cochée.',
      check:function(){ return catalog.some(function(o){ return pctOf(o.id).done > 0; }); } },
    { id:'premier-fini', ico:'🏁', t:'Premier objectif bouclé', d:'Un parcours mené jusqu’au bout.',
      check:function(){ return nbObjectifsFinis() >= 1; } },
    { id:'tous-azimuts', ico:'🗺️', t:'Tous azimuts', d:'Des objectifs entamés dans 3 domaines.',
      check:function(){ return domainesEntames() >= 3; } },
    { id:'habitue', ico:'🏆', t:'Habitué des parcours', d:'Trois objectifs bouclés.',
      check:function(){ return nbObjectifsFinis() >= 3; } },
    { id:'identite', ico:'👤', t:'Carte d’identité', d:'Prénom, nom et e-mail renseignés.',
      check:function(){ var p = state.profil; return !!(p.prenom && p.nom && p.email); } },
    { id:'profil-plein', ico:'✅', t:'Profil au complet', d:'Ton profil rempli à 100 %.',
      check:function(){ return profilComplet(); } },
    { id:'sim-1', ico:'📊', t:'Première simulation', d:'Un simulateur lancé sur tes chiffres.',
      check:function(){ return Object.keys(state.faits).some(function(k){ return /^sim:/.test(k); }); } },
    { id:'sim-tous', ico:'🧮', t:'Tour du propriétaire', d:'Les cinq simulateurs essayés.',
      check:function(){ return ['depenses','vl','tva','statut','optim']
        .every(function(s){ return state.faits['sim:'+s]; }); } },
    { id:'depenses', ico:'🧾', t:'Œil de lynx', d:'Une analyse de dépenses réalisée.',
      check:function(){ return !!state.faits['sim:depenses']; } },
    { id:'lex-1', ico:'📖', t:'Mot à mot', d:'Un premier terme épinglé au lexique.',
      check:function(){ return state.lexEpingles.length >= 1; } },
    { id:'lex-8', ico:'📚', t:'Lexique perso', d:'Huit termes épinglés.',
      check:function(){ return state.lexEpingles.length >= 8; } },
    { id:'compte', ico:'☁️', t:'À l’abri', d:'Un compte créé pour tout sauvegarder.',
      check:function(){ return !!state.compte; } },

    // --- Paliers d'objectifs : de quoi viser loin ---
    { id:'palier-5', ico:'🎯', t:'Le pied à l’étrier', d:'Cinq objectifs bouclés.',
      rang:'bronze',
      check:function(){ return nbObjectifsFinis() >= 5; } },
    { id:'palier-10', ico:'🎯', t:'Rouage bien huilé', d:'Dix objectifs bouclés.',
      rang:'argent',
      check:function(){ return nbObjectifsFinis() >= 10; } },
    { id:'palier-15', ico:'🎯', t:'Bête de paperasse', d:'Quinze objectifs bouclés.',
      rang:'or',
      check:function(){ return nbObjectifsFinis() >= 15; } },
    { id:'palier-tout', ico:'🎯', t:'Souverain de l’administratif',
      d:'Tous les parcours bouclés, sans exception.',
      rang:'royal',
      check:function(){ return nbObjectifsFinis() >= catalog.length; } },

    // --- Quelques autres, sur des gestes qu'on veut encourager ---
    { id:'priorites', ico:'📌', t:'Sens des priorités', d:'Trois objectifs mis en avant.',
      check:function(){ return (state.avant || []).length >= MAX_AVANT; } },
    { id:'lex-20', ico:'🧠', t:'Dictionnaire vivant', d:'Vingt termes épinglés.',
      check:function(){ return state.lexEpingles.length >= 20; } },
    { id:'anticipe', ico:'🔭', t:'Vue à long terme', d:'Le calendrier consulté sur une autre année.',
      check:function(){ return !!state.faits['cal:autre-annee']; } },
    { id:'curieux', ico:'🤝', t:'Bien entouré', d:'Une fiche partenaire ouverte.',
      check:function(){ return !!state.faits['part:vu']; } },
    { id:'assidu', ico:'🔥', t:'Sur la lancée', d:'Dix étapes franchies, tous objectifs confondus.',
      check:function(){ return etapesFranchies() >= 10; } },
    { id:'marathonien', ico:'🏃', t:'Souffle long', d:'Cinquante étapes franchies.',
      check:function(){ return etapesFranchies() >= 50; } },

    { id:'salon', ico:'👋', t:'Entré dans le salon', d:'Un premier passage dans l’Entraide.',
      check:function(){ return !!state.faits['chat:visite']; } },
    { id:'samaritain', ico:'🤲', t:'Bon samaritain',
      d:'Cinq mercis reçus dans l’Entraide.',
      check:function(){ return (state.chat.mesMercis || 0) >= 5; } },
    // Réservé à l'alpha : introuvable ensuite. La rareté fait le badge.
    { id:'pionnier', ico:'🚀', t:'Pionnier de l’alpha',
      d:'Membre pendant l’alpha privée. Ce badge ne reviendra jamais.',
      check:function(){ return !!(state.compte && state.compte.beta); } },
    // Celui-là ne se cherche pas, il se trouve.
    { id:'secret', ico:'🕵️', t:'Là où personne ne regarde',
      d:'Trouvé sans indice : sept clics au bon endroit.',
      check:function(){ return !!state.faits['secret:logo']; } },
    // Le marqueur est posé dès qu'on touche la première place : le badge reste
    // acquis même quand quelqu'un repasse devant. On ne retire pas un trophée.
    { id:'ambassadeur', ico:'📣', t:'Premier ambassadeur',
      d:'Arrivé en tête du classement des parrainages, ne serait-ce qu’un instant.',
      rang:'or',
      check:function(){ return !!state.faits['parrain:top1']; } },
    { id:'parrain', ico:'🤝', t:'Le bouche-à-oreille',
      d:'Un premier membre arrivé grâce à toi, et allé au bout de son arrivée.',
      check:function(){ return (state.parrainage.mes || 0) >= 1; } },
    // Tombe quand on clique sur l'offre URSSAF, qui mène au clip de Rick Astley.
    { id:'enfume', ico:'🎣', t:'Franchise en base de crédulité',
      d:'Aucun seuil, aucun plafond : tu as tout gobé.',
      check:function(){ return !!state.faits['part:urssaf']; } },

    // --- La collection elle-même : des médailles pour les médailles ---
    { id:'serie-5', ico:'🥉', t:'Première salve', d:'Cinq récompenses débloquées.',
      rang:'bronze',
      check:function(){ return state.badges.length >= 5; } },
    { id:'serie-10', ico:'🥈', t:'Chasseur de trophées', d:'Dix récompenses débloquées.',
      rang:'argent',
      check:function(){ return state.badges.length >= 10; } },
    { id:'serie-15', ico:'🥇', t:'Vitrine bien garnie', d:'Quinze récompenses débloquées.',
      rang:'or',
      check:function(){ return state.badges.length >= 15; } },
    { id:'serie-tout', ico:'🏆', t:'Sans faute',
      d:'Toutes les récompenses débloquées, jusqu’à la dernière.',
      rang:'royal',
      // Tous les autres - sauf lui-même, et sauf les badges exclusifs qu'un
      // membre arrivé après l'alpha ne pourra jamais avoir.
      check:function(){
        return BADGES.every(function(b){
          return b.id === 'serie-tout' || BADGES_EXCLUSIFS.indexOf(b.id) >= 0
            || state.badges.indexOf(b.id) >= 0;
        });
      } },
  ];

  // Gag désactivé : le badge n'a plus aucun moyen d'être obtenu, on le sort de
  // la collection plutôt que de laisser une case définitivement verrouillée.
  if(!GAG_URSSAF){
    BADGES = BADGES.filter(function(b){ return b.id !== 'enfume'; });
  }

  // Introuvables hors de leur fenêtre : jamais requis pour « Sans faute ».
  var BADGES_EXCLUSIFS = ['pionnier'];

  // Les deux échelles de paliers, pour l'affichage en vitrine.
  var BADGES_SERIE   = ['serie-5', 'serie-10', 'serie-15', 'serie-tout'];
  var BADGES_PALIERS = ['palier-5', 'palier-10', 'palier-15', 'palier-tout'];

  // Où en est-on vers un palier encore verrouillé ? Montrer « 7/10 » transforme
  // un badge opaque en objectif chiffré : c'est là que la collection devient un jeu.
  function progresBadge(id){
    var cibles = { 'palier-5':5, 'palier-10':10, 'palier-15':15 };
    if(/^palier-/.test(id)){
      var cible = cibles[id] || catalog.length;
      return { n: Math.min(nbObjectifsFinis(), cible), sur: cible };
    }
    var ciblesS = { 'serie-5':5, 'serie-10':10, 'serie-15':15 };
    if(/^serie-/.test(id)){
      if(id === 'serie-tout'){
        var requis = BADGES.filter(function(b){
          return b.id !== 'serie-tout' && BADGES_EXCLUSIFS.indexOf(b.id) < 0; });
        var faits = requis.filter(function(b){
          return state.badges.indexOf(b.id) >= 0; }).length;
        return { n: faits, sur: requis.length };
      }
      return { n: Math.min(state.badges.length, ciblesS[id]), sur: ciblesS[id] };
    }
    return null;
  }

  // Ce que le badge apporte, une fois porté : c'est la récompense concrète,
  // et elle se voit dans l'Entraide.
  function avantageBadge(b){
    if(b.id === 'pionnier'){
      return 'Porté, il dit que tu étais là avant tout le monde, introuvable après l’alpha';
    }
    if(!b.rang) return 'Débloqué, tu peux le porter à côté de ton nom, visible de tous';

    // Le mot de la couleur porte sa couleur, ET dit la bonne : les deux
    // échelles n'ont pas la même palette, l'annonce doit suivre.
    var parcours = BADGES_PALIERS.indexOf(b.id) >= 0;
    var noms = parcours
      ? { bronze:'turquoise', argent:'bleu océan', or:'indigo', royal:'dégradé cyan' }
      : { bronze:'bronze', argent:'argenté', or:'doré', royal:'dégradé violet' };
    var cls = (parcours ? 'teinte-p-' : 'teinte-') + b.rang;
    var couleur = '<b class="'+cls+'">'+noms[b.rang]+'</b>';
    if(b.rang === 'royal'){
      return 'Porté, il passe ton pseudo en '+couleur+' dans l’Entraide, réservé à ce badge';
    }
    if(b.rang === 'or'){
      return 'Porté, il teinte ton pseudo en '+couleur+', avec un halo, dans l’Entraide';
    }
    return 'Porté, il teinte ton pseudo en '+couleur+' dans l’Entraide';
  }

  // Nombre total d'étapes cochées, tous objectifs confondus.
  function etapesFranchies(){
    return catalog.reduce(function(n, o){ return n + pctOf(o.id).done; }, 0);
  }

  // Indices affichés sur un badge encore verrouillé : on dit assez pour donner
  // envie, pas assez pour que ça ressemble à une case à cocher.
  var BADGE_INDICES = {
    'cap':          'Il suffit d’un premier pas dans un parcours.',
    'premier-fini': 'Un parcours mené jusqu’au bout, quel qu’il soit.',
    'tous-azimuts': 'Ne reste pas dans un seul domaine.',
    'habitue':      'Quand boucler un parcours devient une habitude.',
    'identite':     'Dis-nous qui tu es, au moins l’essentiel.',
    'profil-plein': 'Quand il ne manque plus une seule information.',
    'sim-1':        'Les simulateurs n’attendent que tes chiffres.',
    'sim-tous':     'Aucun des cinq outils ne t’aura échappé.',
    'depenses':     'Va voir ce qui passe vraiment en charge.',
    'lex-1':        'Un mot que tu veux retenir, une étoile.',
    'lex-8':        'Ton propre lexique commence à ressembler à quelque chose.',
    'lex-20':       'À ce stade, l’administratif ne te fait plus peur.',
    'compte':       'Pour que rien ne se perde en changeant d’ordinateur.',
    'palier-5':     'Cinq parcours au compteur. Ça commence à compter.',
    'palier-10':    'La barre des dix. Peu de gens y arrivent.',
    'palier-15':    'À ce niveau-là, tu pourrais conseiller les autres.',
    'palier-tout':  'Le dernier. Celui que personne n’a encore.',
    'priorites':    'Choisir, c’est renoncer. Trois, pas plus.',
    'anticipe':     'Et l’an prochain, il se passe quoi ?',
    'curieux':      'On a sélectionné quelques outils, va voir.',
    'assidu':       'Les étapes s’accumulent sans qu’on s’en rende compte.',
    'marathonien':  'Un chiffre qu’on n’atteint pas par hasard.',
    'salon':        'Là où les membres se parlent, il y a une porte.',
    'samaritain':   'Aide vraiment quelqu’un, il te le dira avec les mains jointes.',
    'pionnier':     'Être là avant tout le monde. Ça ne se rattrape pas.',
    'secret':       'Aucun indice. C’est tout le principe.',
    'serie-5':      'Les récompenses appellent les récompenses.',
    'serie-10':     'La collection commence à peser.',
    'serie-15':     'Il ne t’en manque plus beaucoup.',
    'serie-tout':   'Le badge de fin. Littéralement.',
  };

  function loadBadges(){
    try { var r = localStorage.getItem('freehub_badges'); if(r) return JSON.parse(r) || []; } catch(e){}
    return [];
  }
  function loadFaits(){
    try { var r = localStorage.getItem('freehub_faits'); if(r) return JSON.parse(r) || {}; } catch(e){}
    return {};
  }
  function marquerFait(cle){
    if(state.faits[cle]) return;
    state.faits[cle] = 1;
    try { localStorage.setItem('freehub_faits', JSON.stringify(state.faits)); } catch(e){}
    pousserServeur();
  }

  // Débloque les badges nouvellement mérités et met les célébrations en file.
  // Appelée à chaque rendu : ne relance jamais render() (pas de boucle).
  function evaluerBadges(){
    var nouveaux = [];
    BADGES.forEach(function(b){
      if(state.badges.indexOf(b.id) < 0 && b.check()){
        state.badges.push(b.id);
        nouveaux.push(b.id);
      }
    });
    if(nouveaux.length){
      try { localStorage.setItem('freehub_badges', JSON.stringify(state.badges)); } catch(e){}
      pousserServeur();
      // Au tout premier chargement, on ne célèbre pas rétroactivement.
      if(!state.badgesInitialises) return;
      state.badgeQueue = state.badgeQueue.concat(nouveaux);
    }
  }
  function badge(id){ return BADGES.filter(function(b){ return b.id === id; })[0]; }

  // Pastille des Récompenses : combien de badges ont été débloqués sans qu'on
  // soit allé les voir. Même principe que les messages non lus de l'Entraide —
  // on retient le nombre vu à la dernière visite, et il survit au F5.
  function badgesVus(){
    try { return parseInt(localStorage.getItem('freehub_badges_vus'), 10) || 0; }
    catch(e){ return 0; }
  }
  function badgesNonVus(){
    // Tant que les badges du serveur ne sont pas arrivés, on ne montre rien :
    // sinon la pastille clignoterait à chaque chargement.
    if(!state.badgesInitialises) return 0;
    return Math.max(0, state.badges.length - badgesVus());
  }
  function badgesMarquerVus(){
    try { localStorage.setItem('freehub_badges_vus', String(state.badges.length)); } catch(e){}
  }

  // Confirmation après l'ajout d'un objectif suggéré : on dit ce qui a été
  // ajouté, et on laisse le choix entre y aller et finir ce qu'on faisait.
  function suiteAjoutHtml(){
    var a = state.suiteAjout;
    if(!a) return '';
    var o = obj(a.id);
    if(!o) return '';
    var d = dom(o), depuis = a.retour ? obj(a.retour) : null;
    return '<div class="overlay" data-action="suite-rester">'
      + '<div class="modal sa-modal" data-action="stop">'
        + '<div class="sa-body" style="--c:'+d.c+'">'
          + '<div class="sa-ico" style="background:'+d.soft+'">'+d.ico+'</div>'
          + '<div class="sa-l">Ajouté à tes objectifs</div>'
          + '<div class="sa-t">'+esc(o.title)+'</div>'
          + '<div class="sa-d">'+esc(o.desc)+'</div>'
          + '<div class="sa-meta">'+o.steps.length+' étapes'
            + (depuis ? ' · tu le retrouveras dans tes objectifs' : '')+'</div>'
          + '<button class="sa-go" data-action="suite-go">Commencer maintenant</button>'
          + (depuis
              ? '<button class="sa-rester" data-action="suite-rester">Finir « '
                + esc(depuis.title)+' » d’abord</button>'
              : '<button class="sa-rester" data-action="suite-rester">Plus tard</button>')
        + '</div>'
      + '</div></div>';
  }

  // Charte d'accueil : le ton attendu, dit une fois, avant d'entrer.
  function chatCharteHtml(){
    if(!state.chatCharte) return '';
    return '<div class="overlay" data-action="chat-charte-ok">'
      + '<div class="modal charte-modal" data-action="stop">'
        + '<div class="charte-haut"><div class="charte-ico">💬</div>'
          + '<div class="cat-t">Bienvenue dans l’Entraide</div>'
          + '<div class="cat-s">Le seul endroit de FreeHub où l’on se parle entre membres</div></div>'
        + '<div class="charte-corps">'
          + '<div class="charte-r"><span>🤝</span>On se parle comme à un confrère : '
            + 'professionnel, correct, bienveillant</div>'
          + '<div class="charte-r"><span>🔒</span>Pas de données sensibles ici : SIRET, '
            + 'revenus précis, coordonnées</div>'
          + '<div class="charte-r"><span>🚩</span>Un message déplacé ? Signale-le, '
            + 'la modération s’en occupe</div>'
          + '<div class="charte-r"><span>⚖️</span>La modération peut retirer un message '
            + 'ou suspendre l’écriture d’un compte</div>'
        + '</div>'
        + '<div class="charte-pied"><button class="charte-ok" data-action="chat-charte-ok">'
          + 'J’ai compris, j’entre</button></div>'
      + '</div></div>';
  }

  // File de modération : les messages signalés, avec le contexte et les actions.
  function chatModerationHtml(){
    var m = state.chat.moderation;
    if(m === null) return '';
    return '<div class="overlay" data-action="chat-moderation-close">'
      + '<div class="modal cat-modal" data-action="stop">'
        + '<div class="cat-head">'
          + '<div><div class="cat-t">File de modération</div>'
            + '<div class="cat-s">'+(m.length ? m.length+' message'+(m.length>1?'s':'')+' signalé'+(m.length>1?'s':'')
                : 'Rien en attente')+'</div></div>'
          + '<button class="cat-x" data-action="chat-moderation-close" aria-label="Fermer">✕</button>'
        + '</div>'
        + '<div class="cat-body">'
          + (m.length
              ? m.map(function(x){
                  return '<div class="ch-modmsg'+(x.supprime ? ' efface' : '')+'">'
                    + '<div class="ch-tete">'+chatAuteurHtml(x.auteur)
                      + '<span class="ch-h">'+chatHeure(x.created)+'</span>'
                      + (x.supprime ? '<span class="ch-tag">déjà retiré</span>' : '')+'</div>'
                    + '<div class="ch-txt">'+esc(x.contenu)+'</div>'
                    + '<div class="ch-actions">'
                      // Sortie « rien à signaler » en premier : c'est l'issue
                      // la plus fréquente, et la seule qui ne sanctionne pas.
                      + '<button class="ch-act ok" data-action="chat-blanchir" data-id="'+x.id+'">'
                        + 'Signalement infondé</button>'
                      + (x.supprime ? ''
                          : '<button class="ch-act sup" data-action="chat-supprimer" data-id="'+x.id+'">Retirer</button>')
                      + '<button class="ch-act sup" data-action="chat-muet" data-id="'+x.userId+'">'
                        + 'Réduire au silence 24 h</button>'
                    + '</div>'
                  + '</div>';
                }).join('')
              : '<div class="obj-vide">Aucun signalement - c’est bon signe</div>')
        + '</div>'
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // Parrainage — le lien perso, le podium, le rang
  // ---------------------------------------------------------------------------
  function parrainageLien(){
    var c = state.parrainage.code;
    return c ? 'https://free-hub.fr/?code=' + encodeURIComponent(c) : '';
  }
  // La validation est rejouable sans risque (clé primaire sur le filleul), mais
  // si l'appel échoue au mauvais moment le parrainage serait perdu : on garde
  // un témoin local pour pouvoir le reprendre à la session suivante.
  function parrainageValider(){
    return apiJson('POST', '/api/parrainage/valider', {}).then(function(r){
      if(r.ok) try { localStorage.setItem('freehub_parrain_ok', '1'); } catch(e){}
      return r;
    });
  }
  function parrainageRattraper(){
    var fini = false, fait = false;
    try {
      fini = localStorage.getItem('freehub_onboarded') === '1';
      fait = localStorage.getItem('freehub_parrain_ok') === '1';
    } catch(e){ return; }
    if(fini && !fait) parrainageValider();
  }

  var parrEnVol = false;
  function parrainageCharger(){
    if(!state.compte || parrEnVol) return;
    parrEnVol = true;
    // `charge` passe à vrai tout de suite : un appel en échec ne doit pas
    // relancer une requête à chaque rendu de la page.
    state.parrainage.charge = true;
    state.parrainage.quand = Date.now();
    apiJson('GET', '/api/parrainage').then(function(r){
      parrEnVol = false;
      if(!r.ok || !r.data) return;
      state.parrainage = Object.assign({}, state.parrainage, {
        code: r.data.code, mes: r.data.mes || 0, rang: r.data.rang || 0,
        classement: r.data.classement || [], charge: true, quand: Date.now(),
      });
      // Première place atteinte : le badge est acquis pour de bon, même si
      // quelqu'un repasse devant ensuite.
      if(state.parrainage.rang === 1 && state.parrainage.mes > 0){
        marquerFait('parrain:top1');
      }
      render();
    });
  }

  // Tant qu'on regarde le classement, il se rafraîchit tout seul : voir une
  // place bouger sous ses yeux vaut mieux qu'un chiffre figé.
  var PARR_FRAICHEUR = 45000;
  var parrVeilleTimer = null;
  function parrainageVeille(){
    if(parrVeilleTimer) return;
    parrVeilleTimer = setInterval(function(){
      if(state.tab === 'parrainage' && document.visibilityState === 'visible'){
        parrainageCharger();
      }
    }, PARR_FRAICHEUR);
  }

  var PARR_MEDAILLES = ['🥇', '🥈', '🥉'];

  // L'encadré personnel : le lien à partager, et où l'on en est. C'est la
  // première chose de la page, avant même le classement — on vient d'abord
  // chercher son lien.
  function parrainageMoiHtml(){
    var p = state.parrainage;
    var moi;
    if(!p.mes){
      moi = 'Personne n’est encore arrivé par toi. Le premier te place au classement.';
    } else if(p.rang === 1){
      moi = 'Tu es en tête avec ' + p.mes + ' membre' + (p.mes > 1 ? 's' : '')
          + ' arrivé' + (p.mes > 1 ? 's' : '') + ' par toi.';
    } else {
      moi = p.mes + ' membre' + (p.mes > 1 ? 's' : '') + ' grâce à toi'
          + (p.rang ? ' · ' + p.rang + '<sup>e</sup> au classement' : '');
    }

    var lien = parrainageLien();
    // Partage natif quand l'appareil le propose (surtout sur mobile) : c'est le
    // chemin le plus court vers une conversation ou un réseau.
    var partage = (typeof navigator !== 'undefined' && navigator.share)
      ? '<button class="parr-part" data-action="parr-partager">Partager</button>' : '';

    return '<div class="parr-moi-c">'
      + '<div class="parr-t">Ton lien à partager</div>'
      + '<div class="parr-s">Tous ceux qui créent leur compte avec ce lien te sont '
        + 'rattachés. C’est le seul moyen d’être compté.</div>'
      + '<div class="parr-lien">'
        + '<input readonly value="'+esc(lien)+'" data-parr-lien'
          + (lien ? '' : ' placeholder="Ton lien arrive…"')+'>'
        + '<button class="parr-copie" data-action="parr-copier">'
          + (p.copie ? '✓ Copié' : 'Copier')+'</button>'
        + partage
      + '</div>'
      + '<div class="parr-moi">'+moi+'</div>'
    + '</div>';
  }

  // Les règles, dites une bonne fois : un classement dont on ne comprend pas
  // le décompte n'engage personne.
  function parrainageReglesHtml(){
    var regles = [
      ['1', 'Tu partages ton lien',
       'Message, réseau, bouche-à-oreille : peu importe le chemin, c’est le lien qui compte.'],
      ['2', 'Ton filleul crée son compte',
       'Le code de ton lien se remplit tout seul sur la page d’inscription.'],
      ['3', 'Il termine son arrivée',
       'C’est à ce moment-là seulement qu’il est compté : un compte ouvert puis '
       + 'abandonné ne fait grimper personne.'],
    ];
    return '<div class="parr-regles">'
      + '<div class="parr-sect">Comment ça marche</div>'
      + '<div class="parr-etapes">'
        + regles.map(function(r){
            return '<div class="parr-et">'
              + '<span class="parr-et-n">'+r[0]+'</span>'
              + '<div><div class="parr-et-t">'+esc(r[1])+'</div>'
              + '<div class="parr-et-d">'+esc(r[2])+'</div></div>'
            + '</div>';
          }).join('')
      + '</div>'
      + '<div class="parr-note">Le classement est public entre membres et se rafraîchit '
        + 'tout seul. On n’y affiche que le prénom et l’initiale du nom, jamais l’e-mail. '
        + 'Deux badges à la clé : un au premier filleul, un autre le jour où tu passes '
        + 'en tête.</div>'
    + '</div>';
  }

  function parrainageClassementHtml(){
    var p = state.parrainage;

    // Les trois marches sont toujours dessinées, même vides : un podium qu'on
    // voit est un podium qu'on a envie de monter. L'ordre visuel est 2·1·3,
    // comme un vrai podium, la première place au centre et surélevée.
    var ordre = [1, 0, 2];
    var podium = ordre.map(function(i){
      var x = p.classement[i];
      var cls = 'parr-p r'+(i+1)+(x && x.moi ? ' moi' : '')+(x ? '' : ' libre');
      var dedans = x
        ? '<div class="parr-p-n">'+esc(x.nom)+'</div>'
          + '<div class="parr-p-c">'+x.n+' membre'+(x.n > 1 ? 's' : '')+'</div>'
        : '<div class="parr-p-n">Place à prendre</div>'
          + '<div class="parr-p-c">personne ici pour l’instant</div>';
      return '<div class="'+cls+'">'
        + '<div class="parr-p-m">'+PARR_MEDAILLES[i]+'</div>'
        + dedans
        + '<div class="parr-p-socle"><span>'+(i + 1)+'</span></div>'
      + '</div>';
    }).join('');

    var suite = p.classement.slice(3).map(function(x){
      return '<div class="parr-l'+(x.moi ? ' moi' : '')+'">'
        + '<span class="parr-l-r">'+x.rang+'</span>'
        + '<span class="parr-l-n">'+esc(x.nom)+'</span>'
        + '<span class="parr-l-c">'+x.n+'</span>'
      + '</div>';
    }).join('');

    if(!p.charge){
      return '<div class="parr-cl">'
        + '<div class="parr-sect">Le classement</div>'
        + '<div class="parr-vide">Chargement du classement…</div></div>';
    }

    return '<div class="parr-cl">'
      + '<div class="parr-sect">Le classement<span class="parr-sect-h">'
        + 'les vingt premiers, mis à jour en continu</span></div>'
      + '<div class="parr-podium">'+podium+'</div>'
      + (suite ? '<div class="parr-liste">'+suite+'</div>' : '')
      + (!p.classement.length
          ? '<div class="parr-amorce">Le podium est encore vierge : '
            + 'le premier à faire venir quelqu’un prend la première place.</div>' : '')
    + '</div>';
  }

  function parrainageVueHtml(){
    if(!state.compte){
      return '<div class="view"><div class="parr"><div class="parr-t">Classement</div>'
        + '<div class="parr-s">Le classement des recommandations est réservé aux membres '
        + 'connectés : c’est ton compte qui porte ton lien.</div></div></div>';
    }
    if(!state.parrainage.charge
       || Date.now() - (state.parrainage.quand || 0) > PARR_FRAICHEUR){
      parrainageCharger();
    }
    return '<div class="view">'
      + '<div class="parr">'
        + parrainageMoiHtml()
        + parrainageReglesHtml()
      + '</div>'
      + '<div class="parr">'+parrainageClassementHtml()+'</div>'
    + '</div>';
  }

  function badgeFicheHtml(){
    var b = badge(state.badgeOuvert);
    if(!b) return '';
    var acquis = state.badges.indexOf(b.id) >= 0;
    var porte = state.badgePorte === b.id;
    var rang = b.rang ? ' rang-'+b.rang : '';
    if(b.rang && BADGES_PALIERS.indexOf(b.id) >= 0) rang += ' fam-parcours';
    return '<div class="overlay" data-action="badge-fiche-close">'
      + '<div class="modal bf-modal'+rang+'" data-action="stop">'
        + '<div class="bf-haut">'
          + '<div class="bf-ico'+(acquis?'':' verrou')+'">'+(acquis ? b.ico : '🔒')+'</div>'
          + '<div class="bf-l">'+(acquis ? 'Débloqué' : 'À débloquer')+'</div>'
          + '<div class="bf-t">'+esc(b.t)+'</div>'
        + '</div>'
        + '<div class="bf-corps">'
          + (acquis
              ? '<p class="bf-d">'+esc(b.d)+'</p>'
              : '<p class="bf-indice"><span class="bf-indice-i">✨</span>'
                + esc(BADGE_INDICES[b.id] || 'À toi de trouver.')+'</p>')
          + (function(){
              // Un palier verrouillé montre où l'on en est : l'objectif devient chiffré.
              var pr = acquis ? null : progresBadge(b.id);
              if(!pr) return '';
              return '<div class="bf-prog"><div class="bf-prog-b">'
                + '<i style="width:'+Math.round(pr.n / pr.sur * 100)+'%"></i></div>'
                + '<span class="bf-prog-n">'+pr.n+' / '+pr.sur+'</span></div>';
            })()
          + '<div class="bf-gain"><span class="bf-gain-i">🎁</span><span>'+avantageBadge(b)+'</span></div>'
          + (acquis
              ? '<button class="bf-porter'+(porte?' on':'')+'" data-action="badge-porter"'
                + ' data-id="'+b.id+'">'
                + (porte ? '✓ Affiché à côté de ton nom' : 'L’afficher à côté de mon nom')
                + '</button>'
              : '')
        + '</div>'
        + '<button class="cat-x bf-x" data-action="badge-fiche-close" aria-label="Fermer">✕</button>'
      + '</div></div>';
  }

  function badgeCelebreHtml(){
    if(!state.badgeQueue.length) return '';
    var b = badge(state.badgeQueue[0]);
    if(!b) return '';
    return '<div class="overlay bd-overlay" data-action="badge-close">'
      + '<div class="bd-card" data-action="stop">'
        + '<div class="bd-halo"></div>'
        + '<div class="bd-ico">'+b.ico+'</div>'
        + '<div class="bd-l">Badge débloqué</div>'
        + '<div class="bd-t">'+esc(b.t)+'</div>'
        + '<div class="bd-d">'+esc(b.d)+'</div>'
        + '<button class="btn-primary" data-action="badge-close">Super !</button>'
      + '</div></div>';
  }

  // Petit « ? » cliquable à poser après un mot de jargon : il ouvre la fiche du
  // lexique correspondante, quel que soit l'écran. `terme(id)` garantit que le
  // terme existe (sinon on n'affiche rien).
  function lexQ(id){
    if(!terme(id)) return '';
    return '<button class="lexq" data-action="lex-open" data-id="'+id+'" '
      + 'title="Voir la définition" aria-label="Définition">?</button>';
  }
  function dom(o){ return DOMAINES[o.dom] || DOMAINES.administratif; }

  // Chaque étape peut pointer vers un simulateur (`sim`) ou un partenaire
  // (`part`, index dans PARTENAIRES) : c'est ce qui relie les objectifs au reste
  // de l'app au lieu d'en faire une simple liste à cocher.
  //
  // `echeance` : UNIQUEMENT les dates légales réelles. Pas de délai inventé -
  // on ne met pas la pression sur des étapes qui n'en ont pas.
  // `pertinent` : à qui l'objectif s'adresse, d'après le profil.
  var catalog = [
    { id:'statut', dom:'statut', title:'Choisir son statut de société',
      suite:['creer-societe','piloter'],
      desc:'Micro, EURL ou SASU : trancher en confiance',
      pertinent:function(p){ return estMicro(p) || /je ne sais pas/i.test(p.forme || ''); },
      pourquoi:'Tu es en micro : vois à partir de quand une société te rapporterait plus',
      steps:[
        {t:'Comparer micro, EURL et SASU', h:'Les vraies différences, sans jargon', sim:'statut', duree:'10 min', illu:'balance'},
        {t:'Estimer ton net par statut', h:'Sur ton chiffre d’affaires réel', sim:'statut', duree:'10 min', illu:'courbe'},
        {t:'Vérifier ta protection sociale', h:'TNS vs assimilé salarié', duree:'10 min', illu:'bouclier'},
        {t:'Décider et planifier la bascule', h:'Choisir la date et faire les démarches', part:0, duree:'À ton rythme', illu:'fusee'},
      ]},
    { id:'tva-comprendre', dom:'tva', title:'Comprendre la TVA',
      suite:['tva-passer','facturer-etranger'],
      desc:'Les bases pour ne plus jamais être perdu·e',
      pourquoi:'La TVA revient dans presque toutes les décisions : autant la comprendre une fois',
      steps:[
        {t:'Qu’est-ce que la TVA ?', h:'Le principe en 3 minutes', duree:'5 min', illu:'loupe'},
        {t:'La franchise en base', h:'Pourquoi tu n’en factures pas encore', duree:'5 min', illu:'facture'},
        {t:'TVA collectée vs déductible', h:'Le mécanisme qui change tout', duree:'10 min', illu:'balance'},
        {t:'Voir ce que ça donnerait chez toi', h:'Sur tes vrais chiffres', sim:'tva', duree:'10 min', illu:'courbe'},
      ]},
    { id:'cfe', dom:'fiscalite', title:'Déclarer la CFE',
      suite:['urssaf-1','compte-pro'],
      desc:'La cotisation foncière des entreprises, sans stress',
      echeance:{ jour:15, mois:12, quoi:'Paiement de la CFE' },
      pourquoi:'Elle concerne presque toutes les entreprises, et son avis n’arrive pas par courrier',
      steps:[
        {t:'Créer ton espace pro sur impots.gouv', h:'Indispensable pour recevoir ton avis', duree:'15 min', illu:'ecran'},
        {t:'Vérifier ton avis de CFE', h:'Disponible en novembre dans ton espace', duree:'10 min', illu:'enveloppe'},
        {t:'Vérifier si tu es exonéré·e', h:'1re année ou faible CA : possible exonération', duree:'10 min', illu:'loupe'},
        {t:'Payer avant le 15 décembre', h:'Prélèvement ou paiement en ligne', duree:'10 min', illu:'euro'},
      ]},
    { id:'tva-passer', dom:'tva', title:'Passer à la TVA',
      suite:['facturer-etranger','facture-elec'],
      desc:'Basculer proprement en TVA quand c’est le moment',
      pertinent:function(p){ return /franchise/i.test(p.tva || ''); },
      pourquoi:'Tu es en franchise : l’option pour la TVA est parfois gagnante, parfois non',
      steps:[
        {t:'Vérifier ton dépassement de seuil', h:'Les seuils figurent sur ton espace impots.gouv', duree:'10 min', illu:'courbe'},
        {t:'Chiffrer si l’option est rentable', h:'TVA récupérable contre TVA absorbée', sim:'tva', duree:'15 min', illu:'euro'},
        {t:'Choisir ton régime de TVA', h:'Franchise, réel simplifié ou normal', duree:'10 min', illu:'balance'},
        {t:'Faire la demande au guichet unique', h:'Obtenir ton numéro de TVA intracom', duree:'20 min', illu:'form'},
        {t:'Mettre à jour ta facturation', h:'Ajouter la TVA sur devis et factures', part:1, duree:'30 min', illu:'facture'},
      ]},
    { id:'vfl', dom:'fiscalite', title:'Passer au versement libératoire',
      suite:['impot-ae','urssaf-1'],
      desc:'Payer ton impôt au fil de l’eau, si c’est avantageux',
      echeance:{ jour:30, mois:9, quoi:'Demande de versement libératoire' },
      pertinent:estMicro,
      pourquoi:'Réservé aux micro-entrepreneurs : à comparer avec le barème classique',
      steps:[
        {t:'Vérifier ton éligibilité', h:'Revenu fiscal de référence sous le plafond', sim:'vl', duree:'5 min', illu:'loupe'},
        {t:'Simuler l’intérêt du versement', h:'Compare avec l’imposition classique', sim:'vl', duree:'10 min', illu:'courbe'},
        {t:'Faire la demande', h:'Avant le 30 septembre pour l’année suivante', duree:'15 min', illu:'enveloppe'},
      ]},
    { id:'mes-papiers', dom:'administratif', title:'Retrouver mes papiers officiels',
      nouveau:'2026-08-07',              // mis en avant 4 jours dans le catalogue
      suite:['compte-pro','facture-elec'],
      desc:'Kbis, attestation de vigilance, avis de situation : où les trouver',
      pourquoi:'Un client ou une banque te les demandera : autant savoir où ils sont',
      steps:[
        {t:'Identifier le bon document', h:'Chacun prouve une chose différente', duree:'3 min', illu:'loupe'},
        {t:'Récupérer ton avis de situation SIRENE', h:'La preuve que ton entreprise existe', duree:'2 min', illu:'dossier'},
        {t:'Télécharger ton extrait d’immatriculation', h:'Le « Kbis », pour les sociétés', duree:'5 min', illu:'batiment'},
        {t:'Obtenir ton attestation de vigilance', h:'Celle que tes clients réclament', duree:'5 min', illu:'bouclier'},
        {t:'Les ranger une bonne fois', h:'Pour ne plus jamais les rechercher', duree:'5 min', illu:'tampon'},
      ]},
    { id:'compte-pro', dom:'administratif', title:'Ouvrir un compte pro',
      suite:['facture-elec','piloter'],
      desc:'Séparer perso et pro proprement',
      pourquoi:'Séparer les flux simplifie toute ta comptabilité, quel que soit ton statut',
      steps:[
        {t:'Vérifier si c’est obligatoire', h:'Au-delà de 10 000 € de CA deux ans de suite', duree:'5 min', illu:'loupe'},
        {t:'Comparer les comptes pro', h:'Frais, services, dépôt de capital', part:2, duree:'20 min', illu:'balance'},
        {t:'Ouvrir le compte', h:'Réunir les justificatifs', part:2, duree:'30 min', illu:'carte'},
      ]},
    { id:'piloter', dom:'pilotage', title:'Piloter ma société',
      suite:['revenu-regulier','impot-societe'],
      desc:'Savoir ce qui passe en charge et ce que tu touches vraiment',
      pertinent:estSociete,
      pourquoi:'Tu es en société : rémunération, dividendes et charges se pilotent',
      steps:[
        {t:'Vérifier quelles dépenses passent', h:'Une analyse dépense par dépense', sim:'depenses', duree:'20 min', illu:'loupe'},
        {t:'Régler rémunération et dividendes', h:'Trouver ton équilibre net / société', sim:'optim', duree:'20 min', illu:'euro'},
        {t:'Activer les bons leviers', h:'Mutuelle, prévoyance, retraite, bureau', sim:'optim', duree:'15 min', illu:'bouclier'},
        {t:'Faire valider par un comptable', h:'Les arbitrages sensibles se confirment', part:3, duree:'1 rendez-vous', illu:'signature'},
      ]},

    // --- Créer ---
    { id:'creer-ae', dom:'statut', title:'Créer son auto-entreprise',
      desc:'Le statut le plus simple pour se lancer, de A à Z',
      pourquoi:'Le moyen le plus rapide de démarrer une activité : on déroule le parcours complet',
      suite:['obligations-creation','compte-pro'],
      steps:[
        {t:'Vérifier que ton activité est éligible', h:'Deux minutes pour éviter une mauvaise surprise', duree:'2 min', illu:'loupe'},
        {t:'Réunir tes justificatifs', h:'Identité, domicile, diplôme si ton métier est réglementé', duree:'15 min', illu:'dossier'},
        {t:'Remplir la déclaration de début d’activité', h:'Le formulaire du guichet unique, écran par écran', part:0, duree:'30 min', illu:'form'},
        {t:'Récupérer ton SIRET', h:'Il arrive tout seul, il n’y a rien à faire', duree:'Attente', illu:'tampon'},
        {t:'Mettre en place ta facturation', h:'Pour être prêt dès le premier client', part:1, duree:'20 min', illu:'facture'},
      ]},
    { id:'obligations-creation', dom:'administratif', title:'Tes premières obligations après la création',
      desc:'Les comptes à ouvrir et les papiers à ne pas rater',
      pourquoi:'Une fois immatriculé, quelques démarches conditionnent tout le reste : autant les faire d’un coup',
      pertinent:estMicro,
      suite:['compte-pro','urssaf-1'],
      steps:[
        {t:'Créer ton compte URSSAF', h:'C’est là que tu déclareras ton chiffre d’affaires', duree:'10 min', illu:'ecran'},
        {t:'Créer ton espace pro sur impots.gouv', h:'Rien n’arrive par courrier, tout passe par là', duree:'15 min', illu:'batiment'},
        {t:'Envoyer ta déclaration initiale de CFE', h:'Le formulaire que presque tout le monde oublie', duree:'20 min', illu:'form'},
        {t:'Ouvrir un compte dédié à ton activité', h:'Obligatoire au-delà d’un certain chiffre d’affaires', part:2, duree:'20 min', illu:'carte'},
      ]},
    { id:'creer-societe', dom:'statut', title:'Les 5 étapes pour créer sa société',
      suite:['compte-pro','piloter'],
      desc:'EURL, SASU… les étapes clés jusqu’au Kbis',
      pourquoi:'Créer une société suit un parcours précis : on le déroule sans jargon',
      steps:[
        {t:'Choisir ta forme juridique', h:'EURL, SASU, SARL : les vraies différences', sim:'statut', duree:'20 min', illu:'balance'},
        {t:'Rédiger tes statuts', h:'Le contrat de base de ta société', part:0, duree:'1 h', illu:'signature'},
        {t:'Déposer ton capital', h:'Sur un compte dédié à la création', part:2, duree:'30 min', illu:'carte'},
        {t:'Immatriculer ta société', h:'Le dépôt du dossier au guichet unique', part:0, duree:'45 min', illu:'form'},
        {t:'Obtenir ton Kbis', h:'La carte d’identité de ton entreprise', duree:'Attente', illu:'tampon'},
      ]},
    { id:'domicilier', dom:'administratif', title:'Pourquoi et comment domicilier son entreprise',
      suite:['compte-pro','facture-elec'],
      desc:'L’adresse de ton entreprise n’est pas un détail',
      pourquoi:'Le choix de ton adresse a des effets fiscaux, pratiques et d’image',
      steps:[
        {t:'Comprendre ce qu’est la domiciliation', h:'L’adresse administrative de ton activité', duree:'5 min', illu:'loupe'},
        {t:'Comparer les options', h:'Domicile, société de domiciliation, local', duree:'15 min', illu:'balance'},
        {t:'Choisir ta solution', h:'Selon ton budget et l’image voulue', part:0, duree:'15 min', illu:'maison'},
        {t:'Déclarer ton adresse', h:'Sur le dossier de ton entreprise', duree:'20 min', illu:'form'},
      ]},

    // --- Facturation ---
    { id:'facture-elec', dom:'administratif', title:'Tout comprendre sur la facture électronique',
      suite:['facturer-etranger','tva-comprendre'],
      desc:'La réforme qui va toucher toutes les entreprises',
      pourquoi:'La facturation électronique se généralise : mieux vaut l’anticiper',
      steps:[
        {t:'Comprendre ce qui change', h:'Facture papier vs électronique, et pour qui', duree:'10 min', illu:'loupe'},
        {t:'Situer ton calendrier d’obligation', h:'La date dépend de la taille de ton entreprise', duree:'5 min', illu:'calendrier'},
        {t:'Choisir un outil compatible', h:'Une plateforme de facturation conforme', part:1, duree:'20 min', illu:'outil'},
        {t:'Adapter tes factures', h:'Mentions et format électronique', duree:'30 min', illu:'facture'},
      ]},
    { id:'facturer-etranger', dom:'tva', title:'Facturer à l’étranger, comment ça marche',
      suite:['tva-comprendre','facture-elec'],
      desc:'UE ou hors UE, la TVA change tout',
      pourquoi:'Une facture internationale ne se remplit pas comme une facture française',
      steps:[
        {t:'Distinguer UE et hors UE', h:'Les règles ne sont pas les mêmes', duree:'5 min', illu:'globe'},
        {t:'Vérifier le statut de ton client', h:'Professionnel ou particulier', duree:'10 min', illu:'loupe'},
        {t:'Appliquer la bonne TVA', h:'Autoliquidation, exonération ou TVA française', duree:'10 min', illu:'balance'},
        {t:'Ajouter les mentions obligatoires', h:'Numéro de TVA intracommunautaire, mention légale', duree:'15 min', illu:'facture'},
      ]},

    // --- Déclarations ---
    { id:'urssaf-1', dom:'fiscalite', title:'Faire sa première déclaration URSSAF',
      suite:['impot-ae','vfl'],
      desc:'La première fait peur pour rien',
      pertinent:estMicro,
      pourquoi:'On déroule ta première déclaration, pas à pas, pour la faire sereinement',
      steps:[
        {t:'Connaître ta périodicité', h:'Mensuelle ou trimestrielle, choisie au départ', duree:'5 min', illu:'calendrier'},
        {t:'Calculer ton chiffre d’affaires', h:'Les sommes réellement encaissées', duree:'15 min', illu:'euro'},
        {t:'Déclarer sur ton espace URSSAF', h:'Même à zéro, la déclaration est obligatoire', part:1, duree:'10 min', illu:'form'},
        {t:'Payer tes cotisations', h:'Prélevées selon ce que tu déclares', duree:'5 min', illu:'carte'},
      ]},
    { id:'impot-ae', dom:'fiscalite', title:'Remplir sa déclaration d’impôt en auto-entreprise',
      suite:['cfe','vfl'],
      desc:'Reporter ton CA au bon endroit, sans erreur',
      pertinent:estMicro,
      echeance:{ periode:'avril → juin', moisDebut:4, moisFin:6, quoi:'Déclaration de revenus' },
      pourquoi:'Bien déclarer évite les erreurs, et parfois de payer trop d’impôt',
      steps:[
        {t:'Choisir ton mode d’imposition', h:'Versement libératoire ou barème progressif', sim:'vl', duree:'10 min', illu:'balance'},
        {t:'Retrouver ton chiffre d’affaires annuel', h:'Le total encaissé sur l’année', duree:'10 min', illu:'euro'},
        {t:'Le reporter sur ta déclaration', h:'Dans la bonne case selon ta catégorie', duree:'15 min', illu:'form'},
        {t:'Vérifier avant d’envoyer', h:'L’abattement s’applique automatiquement', duree:'10 min', illu:'loupe'},
      ]},
    { id:'impot-societe', dom:'fiscalite', title:'Remplir sa déclaration d’impôt en société',
      suite:['piloter','revenu-regulier'],
      desc:'Résultat, IS, rémunération, dividendes',
      pertinent:estSociete,
      echeance:{ periode:'avril → juin', moisDebut:4, moisFin:6, quoi:'Déclaration de revenus' },
      pourquoi:'La déclaration d’une société a ses règles : on les clarifie une par une',
      steps:[
        {t:'Établir ton résultat', h:'Produits moins charges de l’exercice', duree:'1 h', illu:'courbe'},
        {t:'Déclarer ton impôt sur les sociétés', h:'Le formulaire de résultat', duree:'30 min', illu:'batiment'},
        {t:'Déclarer ta rémunération', h:'Sur ta déclaration de revenus personnelle', duree:'15 min', illu:'form'},
        {t:'Traiter tes dividendes', h:'Selon le PFU ou le barème', sim:'optim', duree:'20 min', illu:'euro'},
      ]},

    // --- Vie de l'indépendant ---
    { id:'droits-independant', dom:'administratif', title:'Comprendre mes droits en indépendant',
      suite:['revenu-regulier','urssaf-1'],
      desc:'Chômage, retraite, maladie, naissance : ce à quoi tu as droit',
      pourquoi:'Être indépendant ne veut pas dire être sans filet : voici ce qui te protège',
      steps:[
        {t:'Ta protection maladie', h:'Remboursements et indemnités journalières', duree:'10 min', illu:'bouclier'},
        {t:'Ta retraite', h:'Ce que tu cotises et ce que ça t’ouvre', duree:'10 min', illu:'horloge'},
        {t:'Congé maternité ou paternité', h:'Indemnités et démarches', duree:'10 min', illu:'equipe'},
        {t:'En cas d’arrêt d’activité', h:'Ce qui existe, et ses limites', duree:'10 min', illu:'dossier'},
      ]},
    { id:'embaucher-alternant', dom:'administratif', title:'Les 5 étapes pour embaucher un alternant',
      suite:['piloter','revenu-regulier'],
      desc:'Un renfort peu coûteux, mais un cadre précis',
      pourquoi:'L’alternance t’aide à grandir à moindre coût, si le cadre est bien posé',
      steps:[
        {t:'Définir le poste et le rythme', h:'Missions et alternance école / entreprise', duree:'30 min', illu:'equipe'},
        {t:'Trouver ton alternant', h:'Écoles, plateformes, cooptation', duree:'Plusieurs semaines', illu:'loupe'},
        {t:'Établir le contrat', h:'Apprentissage ou professionnalisation', duree:'45 min', illu:'signature'},
        {t:'Faire la déclaration d’embauche', h:'La DPAE, avant l’arrivée', duree:'15 min', illu:'form'},
        {t:'Activer les aides employeur', h:'Des aides existent selon le contrat', duree:'20 min', illu:'euro'},
      ]},
    { id:'revenu-regulier', dom:'pilotage', title:'Se verser un revenu régulier selon son statut',
      suite:['piloter','impot-societe','urssaf-1'],
      desc:'Se payer sans mettre sa trésorerie en danger',
      pourquoi:'Un revenu régulier, ça s’organise, surtout quand le chiffre d’affaires varie',
      steps:[
        {t:'Comprendre comment tu te paies', h:'Micro : prélèvement libre. Société : salaire et dividendes', duree:'10 min', illu:'loupe'},
        {t:'Fixer un montant tenable', h:'Ce que ton activité permet vraiment', sim:'optim', duree:'20 min', illu:'balance'},
        {t:'Provisionner charges et impôts', h:'Pour ne jamais être pris de court', part:2, duree:'15 min', illu:'dossier'},
        {t:'Automatiser ton versement', h:'Un virement régulier, comme un salaire', duree:'15 min', illu:'outil'},
      ]},
  ];

  // ---------------------------------------------------------------------------
  // Contenu détaillé des étapes - séparé du catalogue pour rester lisible.
  // Règle : aucun chiffre ni seuil inventé. On oriente vers les sources
  // officielles pour les valeurs qui changent (seuils, taux, dates).
  // Par étape : { intro, faire:[…], vigilance:[…], liens:[{l,url}] }.
  // ---------------------------------------------------------------------------
  var IMPOTS = { l:'impots.gouv.fr', url:'https://www.impots.gouv.fr' };
  var URSSAF = { l:'autoentrepreneur.urssaf.fr', url:'https://www.autoentrepreneur.urssaf.fr' };
  var GUICHET = { l:'Guichet unique - formalites.entreprises.gouv.fr', url:'https://formalites.entreprises.gouv.fr' };
  var SPUBLIC = { l:'entreprendre.service-public.fr', url:'https://entreprendre.service-public.fr' };

  var CONTENUS = {
    statut: [
      { intro:'Trois familles de statuts, trois logiques différentes. L’idée n’est pas de trouver « le meilleur » dans l’absolu, mais celui qui colle à ton activité',
        astuce:'Ne choisis pas pour dans cinq ans : changer de statut plus tard est possible, tu ne repars pas de zéro',
        faire:['Micro-entreprise : le plus simple, cotisations sur le chiffre d’affaires, pas de déduction des charges',
               'EURL : une société à l’IR ou à l’IS, dirigeant « travailleur non salarié »',
               'SASU : une société à l’IS, dirigeant « assimilé salarié », mieux couvert mais plus coûteux'],
        liens:[SPUBLIC] },
      { intro:'Le vrai comparatif, c’est ce qu’il te reste en poche. Notre simulateur le calcule sur tes chiffres',
        faire:['Renseigne ton chiffre d’affaires et tes charges dans ton profil',
               'Le simulateur « Quand passer en société » compare les trois côte à côte'] },
      { intro:'Le statut détermine ta protection sociale, souvent sous-estimée au moment du choix',
        faire:['En TNS (micro, EURL) : cotisations plus légères, couverture plus limitée',
               'En assimilé salarié (SASU) : meilleure couverture santé et retraite, hors chômage'],
        vigilance:['Aucun statut n’ouvre droit à l’assurance chômage classique pour le dirigeant'] },
      { intro:'Une fois le choix fait, la bascule se prépare : rien n’est urgent, mais mieux vaut anticiper',
        faire:['Choisis une date de bascule cohérente (souvent en début d’exercice)',
               'Prépare la création via un accompagnement si tu passes en société'] },
    ],
    'tva-comprendre': [
      { intro:'La TVA est un impôt sur la consommation que les entreprises collectent pour l’État. Tu n’en es qu’un intermédiaire',
        faire:['Tu ajoutes la TVA à tes prix, tu l’encaisses, puis tu la reverses',
               'Ce que tu collectes n’est pas un revenu : ça ne t’appartient pas'] },
      { intro:'Tant que tu débutes, tu es souvent en « franchise en base » : tu ne factures pas de TVA',
        astuce:'Tant que tu es en franchise, garde la mention « TVA non applicable » sur tes factures, sinon ton client la cherchera',
        faire:['Tu factures sans TVA, donc des prix plus simples pour les particuliers',
               'En contrepartie, tu ne récupères pas la TVA sur tes achats'],
        vigilance:['La franchise a des seuils de chiffre d’affaires : au-delà, la TVA devient obligatoire. Les montants sont sur impots.gouv.fr'],
        liens:[IMPOTS] },
      { intro:'Le mécanisme tient en deux mots : collectée moins déductible',
        faire:['TVA collectée : celle que tu factures à tes clients',
               'TVA déductible : celle que tu paies sur tes achats pro',
               'Tu ne reverses que la différence entre les deux'] },
      { intro:'La théorie, c’est bien ; sur tes chiffres, c’est plus parlant',
        faire:['Ouvre le simulateur « Passer à la TVA » pour voir ce que ça donnerait chez toi'] },
    ],
    cfe: [
      { intro:'Ton espace professionnel sur impots.gouv.fr est indispensable : c’est là qu’arrive ton avis de CFE, jamais par courrier',
        astuce:'Crée cet espace dès ta première année : la CFE oubliée est la mauvaise surprise classique de décembre',
        faire:['Crée ton espace pro avec ton SIRET','Active la réception des avis en ligne'],
        liens:[IMPOTS] },
      { intro:'L’avis de CFE est mis à disposition en fin d’année dans ton espace',
        faire:['Consulte-le dès sa mise en ligne, en général à l’automne','Vérifie la commune et la base retenues'] },
      { intro:'Certaines situations ouvrent droit à une exonération, totale ou partielle',
        faire:['La première année d’activité est souvent exonérée','Un chiffre d’affaires faible peut réduire la base'],
        vigilance:['Les conditions exactes évoluent : vérifie ton cas sur impots.gouv.fr plutôt que de supposer'],
        liens:[IMPOTS] },
      { intro:'Le paiement se fait en ligne, avant la date limite indiquée sur ton avis (souvent mi-décembre)',
        faire:['Paie depuis ton espace pro, ou mets en place un prélèvement'] },
    ],
    'tva-passer': [
      { intro:'Passer à la TVA peut être subi (dépassement de seuil) ou choisi (option volontaire)',
        faire:['Compare ton chiffre d’affaires aux seuils de franchise, indiqués sur impots.gouv.fr'],
        vigilance:['Au-delà des seuils, la TVA n’est plus une option : elle devient obligatoire'],
        liens:[IMPOTS] },
      { intro:'Opter volontairement n’a de sens que si tu récupères plus que tu n’absorbes',
        faire:['Le simulateur « Passer à la TVA » chiffre le gain ou la perte sur tes données'] },
      { intro:'Plusieurs régimes de déclaration existent selon ton activité et ton volume',
        faire:['Franchise, réel simplifié, réel normal : le bon dépend de ta situation','Renseigne-toi avant de choisir'],
        liens:[SPUBLIC] },
      { intro:'La demande se fait via le guichet unique des formalités',
        faire:['Formule ton option pour la TVA','Tu obtiens un numéro de TVA intracommunautaire'],
        liens:[GUICHET] },
      { intro:'Une fois assujetti, tes documents changent',
        astuce:'Préviens tes clients avant de changer tes tarifs, pas après : la surprise passe beaucoup moins bien que l’explication',
        faire:['Ajoute la TVA sur tes devis et factures','Fais apparaître ton numéro de TVA','Un outil de facturation t’évite les oublis'] },
    ],
    vfl: [
      { intro:'Le versement libératoire n’est ouvert qu’à certaines conditions de revenu',
        faire:['Vérifie ton revenu fiscal de référence sur ton avis d’impôt'],
        vigilance:['Le plafond d’éligibilité dépend de ton foyer : les valeurs sont sur impots.gouv.fr'],
        liens:[IMPOTS] },
      { intro:'Avantageux pour les uns, coûteux pour les autres : tout dépend de ton taux d’imposition',
        faire:['Le simulateur « Versement libératoire ou impôt classique » tranche sur tes chiffres'] },
      { intro:'L’option se demande à l’avance et s’applique l’année suivante',
        astuce:'Note la date limite dans ton agenda tout de suite : une option ratée ne se rattrape que l’année suivante',
        faire:['Fais ta demande auprès de l’Urssaf, en respectant la date limite annuelle'],
        liens:[URSSAF] },
    ],
    'mes-papiers': [
      { intro:'Trois documents reviennent sans arrêt, et on les confond tout le temps',
        astuce:'Retiens la logique : l’avis SIRENE dit que tu existes, le Kbis dit que ta société existe, l’attestation de vigilance dit que tu paies bien tes cotisations',
        faire:['Avis de situation SIRENE : pour tout le monde, c’est ta « carte d’identité » d’entreprise',
               'Extrait d’immatriculation (le « Kbis ») : pour les sociétés inscrites au registre du commerce',
               'Attestation de vigilance : celle que tes clients demandent quand tu factures beaucoup'],
        liens:[SPUBLIC] },
      { intro:'L’avis de situation SIRENE se télécharge en trente secondes, sans compte',
        faire:['Va sur avis-situation-sirene.insee.fr','Entre ton SIREN ou ton SIRET, télécharge le PDF'],
        astuce:'Il est daté du jour : regénère-le au moment de l’envoyer plutôt que d’envoyer un vieux fichier' },
      { intro:'L’extrait d’immatriculation ne concerne que les sociétés et les commerçants',
        faire:['Depuis 2023, il se récupère gratuitement sur le portail des formalités',
               'En micro sans activité commerciale, tu n’en as pas : ton avis SIRENE fait foi'],
        vigilance:['Certains sites facturent ce document alors qu’il est gratuit sur le canal officiel'],
        liens:[GUICHET] },
      { intro:'L’attestation de vigilance prouve que tu es à jour de tes cotisations',
        faire:['Micro : depuis ton espace sur autoentrepreneur.urssaf.fr',
               'Société : depuis ton espace employeur sur urssaf.fr',
               'Elle est valable six mois, et ton client peut la vérifier en ligne'],
        vigilance:['Elle n’est délivrée que si tu es à jour : un retard de déclaration la bloque'],
        liens:[URSSAF] },
      { intro:'Le vrai gain, c’est de ne plus jamais les rechercher dans l’urgence',
        astuce:'Un dossier « Papiers officiels » dans ton cloud, et le réflexe de le mettre à jour à chaque nouvelle version',
        faire:['Range les trois documents au même endroit','Note la date : l’attestation de vigilance se périme'] },
    ],
    'compte-pro': [
      { intro:'Un compte dédié n’est pas toujours obligatoire, mais il simplifie tout',
        astuce:'Même sans obligation, un compte séparé te fera gagner des heures quand tu chercheras une dépense',
        faire:['En société : un compte professionnel est requis, notamment pour le dépôt de capital',
               'En micro : un compte dédié devient obligatoire au-delà d’un certain chiffre d’affaires sur deux ans'],
        liens:[SPUBLIC] },
      { intro:'Compte pro « classique » ou néobanque : compare sur ce qui compte pour toi',
        faire:['Frais mensuels, dépôt de capital, encaissements, intégration comptable'] },
      { intro:'L’ouverture est rapide, souvent 100 % en ligne',
        faire:['Réunis pièce d’identité, justificatif d’activité (Kbis ou SIRET)'] },
    ],
    piloter: [
      { intro:'Avant d’optimiser, il faut savoir ce qui passe vraiment en charge',
        astuce:'Prends l’habitude de photographier tes justificatifs au moment de payer, pas en fin d’année',
        faire:['Le simulateur « Mes dépenses » analyse chaque dépense','Sa conclusion peut redescendre dans ton profil'] },
      { intro:'Rémunération et dividendes n’ont ni le même coût, ni la même couverture sociale',
        faire:['Le cockpit « Optimiser ma société » te montre l’effet en direct'] },
      { intro:'Plusieurs dispositifs sont des charges déductibles pour la société',
        faire:['Mutuelle, prévoyance, retraite, bureau à domicile : à activer selon tes besoins'],
        vigilance:['Chaque dispositif a ses plafonds d’exonération, non vérifiés par l’outil'] },
      { intro:'Les arbitrages fiscaux sensibles se confirment avec un professionnel',
        faire:['Fais valider ta stratégie par ton expert-comptable'] },
    ],
    'creer-ae': [
      { intro:'Bonne nouvelle : la grande majorité des activités passent en micro-entreprise. Quelques métiers en sont exclus (certaines professions juridiques, médicales, agricoles ou liées à l’immobilier), et d’autres demandent un diplôme ou une expérience pour être exercés',
        faire:['Cherche ton métier sur le site de l’Urssaf pour lever le doute',
               'Si ton activité est réglementée, prévois le justificatif de qualification'],
        astuce:'Dans le doute, appelle l’Urssaf : c’est gratuit et ils répondent vite',
        liens:[URSSAF] },
      { intro:'Le dossier tient en trois pièces. Prépare-les en amont, tu rempliras la déclaration d’une traite au lieu de la reprendre trois fois',
        faire:['Ta pièce d’identité, recto verso, scannée ou photographiée nettement',
               'Un justificatif de domicile de moins de trois mois',
               'Ton diplôme ou une attestation d’expérience, seulement si ton métier est réglementé'],
        astuce:'Mets tout dans un même dossier sur ton ordinateur : tu les rechercheras encore souvent' },
      { intro:'Tout se passe en ligne sur le guichet unique des formalités des entreprises, qui a remplacé les anciens CFE. Compte une trentaine de minutes, et pas un centime : la création d’une auto-entreprise est gratuite',
        video:{ url:'https://www.youtube.com/watch?v=u34Ow_Q_-5Y',
                t:'La déclaration en vidéo, écran par écran',
                d:'Si tu préfères voir quelqu’un le faire avant de te lancer' },
        faire:['Crée ton compte sur le guichet unique, puis choisis « Créer une entreprise »',
               'Renseigne ton identité et ton adresse personnelle',
               'Choisis l’adresse de ton entreprise : ton domicile convient très bien pour démarrer',
               'Décris ton activité en une phrase claire, c’est elle qui déterminera ton code APE',
               'Indique ta date de début d’activité : elle peut être dans le futur',
               'Choisis ton régime social et coche le versement libératoire si tu y as droit',
               'Relis, signe électroniquement et valide'],
        vigilance:['Ta date de début d’activité déclenche tes cotisations : ne la place pas avant d’être vraiment prêt',
                   'La description de ton activité oriente ton régime fiscal et ta CFE, prends le temps de la formuler'],
        liens:[GUICHET, URSSAF] },
      { intro:'Rien à faire à cette étape, c’est l’administration qui travaille. Ton dossier part à l’Insee, qui t’attribue un numéro SIREN et un SIRET, puis tu reçois ton mémento fiscal',
        faire:['Surveille tes mails, y compris les indésirables',
               'Note ton SIRET quelque part : tu le mettras sur chaque facture'],
        astuce:'Pas de nouvelles au bout de trois semaines ? Relance via ton compte au guichet unique' },
      { intro:'Dès ton premier client, tu émets une facture. Autant partir avec les bons réflexes plutôt que de tout reprendre dans six mois',
        faire:['Prépare un modèle de facture avec toutes les mentions obligatoires',
               'Note ton SIRET et la mention de franchise de TVA si tu n’y es pas assujetti',
               'Tiens ton livre de recettes à jour dès la première vente'],
        astuce:'Un outil de facturation te génère tout ça et suit tes seuils à ta place' },
    ],
    'obligations-creation': [
      { intro:'C’est ton interlocuteur pour les cotisations sociales. Tu y déclareras ton chiffre d’affaires chaque mois ou chaque trimestre, même quand il est à zéro',
        faire:['Crée ton compte sur autoentrepreneur.urssaf.fr avec ton SIRET',
               'Choisis ta périodicité de déclaration, mensuelle ou trimestrielle',
               'Note la date de ta première déclaration dans ton agenda'],
        vigilance:['Une déclaration à zéro reste obligatoire : ne rien envoyer déclenche une pénalité'],
        astuce:'Le mensuel fait de plus petits montants et évite les mauvaises surprises de trésorerie',
        liens:[URSSAF] },
      { intro:'Ton espace professionnel sur impots.gouv, c’est là qu’arrivent tes avis. Rien ne te sera envoyé par courrier : sans ce compte, tu ne verras pas passer ta CFE',
        faire:['Crée ton espace professionnel avec ton SIRET',
               'Active le service « Consulter mon avis de CFE »',
               'Renseigne un moyen de paiement pour ne pas courir en décembre'],
        astuce:'Fais-le tout de suite après avoir reçu ton SIRET, tu n’y penseras plus après',
        liens:[IMPOTS] },
      { intro:'C’est le papier le plus oublié de la création. La déclaration initiale de CFE se dépose l’année de ta création, et elle conditionne ton exonération de première année',
        faire:['Repère le formulaire de déclaration initiale de CFE sur impots.gouv',
               'Renseigne l’adresse de ton local ou de ton domicile professionnel',
               'Dépose-le avant la fin de l’année de création'],
        vigilance:['Sans cette déclaration, tu peux perdre l’exonération de ta première année',
                   'La date limite exacte figure sur impots.gouv, vérifie-la pour ton cas'],
        liens:[IMPOTS] },
      { intro:'Un compte dédié à ton activité devient obligatoire au-delà d’un certain chiffre d’affaires sur deux années consécutives. En dessous, ce n’est pas obligatoire, mais ça sépare ta vie perso de ton activité',
        faire:['Un compte courant séparé suffit au début, un compte pro n’est pas exigé',
               'Fais passer toutes tes recettes et tes dépenses pro par ce compte'],
        astuce:'Même sans obligation, c’est ce qui te fera gagner le plus de temps en comptabilité' },
    ],
    'creer-societe': [
      { intro:'Le choix de la forme conditionne fiscalité, statut social et coûts',
        faire:['Le simulateur « Quand passer en société » compare EURL et SASU sur tes chiffres'] },
      { intro:'Les statuts sont le contrat fondateur de ta société',
        astuce:'Relis tes statuts en te demandant ce qui se passe si tu n’es plus seul : c’est là que les modèles gratuits montrent leurs limites',
        faire:['Rédige-les avec soin : un accompagnement évite les erreurs coûteuses'] },
      { intro:'Le capital se dépose sur un compte dédié avant l’immatriculation',
        faire:['Ouvre un compte, dépose le capital, récupère l’attestation'] },
      { intro:'L’immatriculation se fait via le guichet unique',
        faire:['Dépose ton dossier complet en ligne'],
        liens:[GUICHET] },
      { intro:'Le Kbis officialise l’existence de ta société',
        faire:['Conserve-le : il te sera demandé partout (banque, clients, aides)'] },
    ],
    domicilier: [
      { intro:'Domicilier, c’est fixer l’adresse administrative officielle de ton entreprise',
        astuce:'L’adresse de ton entreprise devient publique : c’est souvent ce qui fait renoncer à domicilier chez soi',
        faire:['Elle apparaît sur tes documents et détermine ta commune de CFE'] },
      { intro:'Plusieurs options, avec des conséquences différentes',
        faire:['Ton domicile : gratuit, mais adresse visible','Société de domiciliation : une adresse pro, souvent mieux située','Un local : si tu reçois du public'] },
      { intro:'Le bon choix dépend de ton budget et de l’image voulue',
        faire:['Compare les offres de domiciliation selon la localisation et les services'] },
      { intro:'L’adresse retenue se déclare sur ton dossier d’entreprise',
        faire:['Mets-la à jour au guichet unique en cas de changement'],
        liens:[GUICHET] },
    ],
    'facture-elec': [
      { intro:'La facturation électronique va progressivement devenir obligatoire entre entreprises',
        faire:['Comprends la différence : une facture PDF envoyée par mail n’est pas une facture électronique au sens de la réforme'] },
      { intro:'Le calendrier dépend de la taille de ton entreprise',
        faire:['Repère ta date d’entrée dans le dispositif sur les sources officielles'],
        vigilance:['Le calendrier a déjà évolué : vérifie les échéances à jour plutôt que de te fier à une date entendue'],
        liens:[IMPOTS] },
      { intro:'Tu devras émettre et recevoir tes factures via une plateforme conforme',
        astuce:'Change d’outil avant la date butoir, pas la semaine d’avant : reprendre son historique de factures prend du temps',
        faire:['Choisis un outil de facturation compatible pour être prêt le moment venu'] },
      { intro:'Quelques mentions et formats deviennent incontournables',
        faire:['Assure-toi que ton outil gère le format électronique attendu'] },
    ],
    'facturer-etranger': [
      { intro:'La règle de TVA change selon que ton client est dans l’UE ou en dehors',
        faire:['Identifie d’abord le pays de ton client'] },
      { intro:'Le statut du client (pro ou particulier) change tout',
        astuce:'Demande son numéro de TVA intracommunautaire au client dès le devis, et vérifie-le : c’est lui qui détermine la règle',
        faire:['Demande son numéro de TVA intracommunautaire s’il est professionnel dans l’UE'] },
      { intro:'Selon les cas : TVA française, exonération, ou autoliquidation par le client',
        faire:['Vérifie la règle applicable à ta situation précise'],
        vigilance:['En cas de doute sur une facture internationale, fais-la relire : les erreurs de TVA se paient cher'],
        liens:[SPUBLIC] },
      { intro:'Les factures transfrontalières exigent des mentions spécifiques',
        faire:['Fais figurer les numéros de TVA et la mention légale correspondant au régime (ex. « autoliquidation »)'] },
    ],
    'urssaf-1': [
      { intro:'Tu déclares à l’Urssaf selon la périodicité choisie à ton inscription',
        faire:['Vérifie si tu es en déclaration mensuelle ou trimestrielle'],
        liens:[URSSAF] },
      { intro:'Le montant à déclarer, c’est ce que tu as réellement encaissé',
        faire:['Additionne tes encaissements de la période, pas tes factures émises'] },
      { intro:'La déclaration se fait en ligne, même si tu n’as rien encaissé',
        astuce:'Déclare le jour où tu reçois le rappel plutôt qu’au dernier moment : le site sature aux échéances',
        faire:['Déclare sur ton espace autoentrepreneur.urssaf.fr','Une déclaration à zéro reste obligatoire'],
        vigilance:['Oublier une déclaration entraîne des pénalités, mets un rappel'],
        liens:[URSSAF] },
      { intro:'Tes cotisations sont calculées automatiquement sur ce que tu déclares',
        faire:['Le prélèvement suit ta déclaration'] },
    ],
    'impot-ae': [
      { intro:'En micro, ton imposition dépend de l’option choisie : versement libératoire ou barème',
        faire:['Le simulateur « Versement libératoire ou impôt classique » t’aide à choisir'] },
      { intro:'Le point de départ, c’est ton chiffre d’affaires annuel',
        faire:['Récupère le total encaissé sur l’année civile'] },
      { intro:'Tu le reportes sur ta déclaration de revenus, dans la case de ta catégorie',
        faire:['Vente, prestations de services ou libéral : chaque catégorie a sa case'],
        liens:[IMPOTS] },
      { intro:'L’abattement forfaitaire s’applique tout seul : tu ne déduis pas tes frais réels',
        astuce:'Ne déduis rien toi-même : l’abattement remplace tes frais réels, les soustraire une seconde fois est l’erreur la plus fréquente',
        faire:['Vérifie le montant reporté avant de valider'] },
    ],
    'impot-societe': [
      { intro:'La société déclare son résultat : ce qu’elle a gagné, moins ce qu’elle a dépensé',
        astuce:'Tiens ta comptabilité au fil de l’eau : reconstituer une année entière au printemps coûte bien plus cher qu’un peu de rigueur chaque mois',
        faire:['Établis ton résultat de l’exercice'] },
      { intro:'L’impôt sur les sociétés se déclare sur un formulaire de résultat dédié',
        faire:['La liasse fiscale se télétransmet, souvent via ton comptable'],
        liens:[IMPOTS] },
      { intro:'Ta rémunération de dirigeant, elle, va sur ta déclaration personnelle',
        faire:['Reporte-la comme un revenu d’activité'] },
      { intro:'Les dividendes ont leur propre traitement fiscal',
        faire:['Le cockpit « Optimiser ma société » montre l’effet PFU vs barème'] },
    ],
    'droits-independant': [
      { intro:'Indépendant ne veut pas dire sans protection, mais elle a ses limites',
        astuce:'Regarde ce que couvre déjà ton régime avant d’acheter une prévoyance : tu sauras quoi demander au lieu de subir un devis',
        faire:['Fais le point sur ce que ton statut couvre réellement'] },
      { intro:'Santé : tu es rattaché à l’Assurance Maladie, avec des indemnités sous conditions',
        faire:['Vérifie tes droits aux indemnités journalières en cas d’arrêt'],
        liens:[URSSAF] },
      { intro:'Retraite : tu cotises, mais le niveau dépend fortement de ton statut et de ta rémunération',
        faire:['Consulte ton relevé de carrière pour anticiper'] },
      { intro:'Maternité, paternité, arrêt : des dispositifs existent, avec des montants et durées encadrés',
        faire:['Renseigne-toi en amont d’un projet (naissance, pause)'],
        vigilance:['Le chômage classique ne couvre pas le dirigeant : anticipe une épargne de précaution'] },
    ],
    'embaucher-alternant': [
      { intro:'Un alternant partage son temps entre l’école et ton entreprise',
        faire:['Définis ses missions et le rythme de l’alternance'] },
      { intro:'Le recrutement passe souvent par les écoles et les plateformes dédiées',
        faire:['Diffuse ton offre, ou contacte directement des centres de formation'] },
      { intro:'Deux types de contrats existent : apprentissage et professionnalisation',
        faire:['Choisis celui adapté au profil et à la formation'],
        liens:[SPUBLIC] },
      { intro:'La déclaration préalable à l’embauche (DPAE) est obligatoire avant l’arrivée',
        astuce:'La DPAE se fait dans les jours qui précèdent l’arrivée, jamais après : c’est le point de contrôle numéro un',
        faire:['Réalise la DPAE auprès de l’Urssaf'],
        vigilance:['Elle doit être faite avant le premier jour, sous peine de sanction'] },
      { intro:'Des aides à l’embauche existent pour l’employeur d’alternant',
        faire:['Vérifie les aides en vigueur et leurs conditions'],
        liens:[SPUBLIC] },
    ],
    'revenu-regulier': [
      { intro:'La façon de te payer dépend de ton statut',
        faire:['Micro : tu prélèves librement ce que tu veux','Société : salaire et/ou dividendes, avec des règles distinctes'] },
      { intro:'Le bon montant, c’est celui que ton activité soutient dans la durée',
        faire:['Le cockpit « Optimiser ma société » aide à fixer un niveau tenable'] },
      { intro:'Mettre de côté charges et impôts évite les mauvaises surprises',
        astuce:'Ouvre un second compte pour tes provisions : l’argent qu’on ne voit pas sur le compte courant ne se dépense pas',
        faire:['Provisionne dès l’encaissement, sur un sous-compte dédié'] },
      { intro:'Un versement automatique et régulier te donne la stabilité d’un salaire',
        faire:['Programme un virement mensuel fixe vers ton compte perso'] },
    ],
  };

  // ---------------------------------------------------------------------------
  // Nos partenaires
  // ---------------------------------------------------------------------------
  // `url`   : lien d'affiliation. Tant qu'il est vide, la fiche affiche un bouton
  //           inactif « Lien bientôt disponible » - il suffit de coller l'URL ici.
  // `img`   : le logo, fourni par l'utilisateur, dans assets/partenaires/.
  // `color` / `grad` : les deux teintes de l'en-tête coloré, relevées sur le logo.
  // `soft`  : le fond teinté du corps de la carte.
  // `pitch` + les 3 premiers `points` s'affichent sur la carte ; `desc` et la
  // liste complète sont réservés à la fiche qui s'ouvre au clic.
  var PARTENAIRES = [
    {
      nom:'LegalPlace', kind:'Juridique & création',
      img:'assets/partenaires/legalplace.png',
      color:'#a9762a', grad:'#ddb055', soft:'#fdf7ea',
      url:'https://www.legalplace.fr/?utm_source=affilae&utm_medium=partner&utm_campaign=ML%20Consulting%20(Louis%20M.)&ae=950',
      promo:'FREELANCETOI15', promoDetail:'−15 % sur toutes les offres',
      pitch:'Créer sa société sans avocat ni paperasse : tu réponds à un questionnaire, ils rédigent et déposent.',
      desc:'Créer sa société ne devrait pas demander trois rendez-vous chez l’avocat et six semaines d’attente. '
        + 'LegalPlace transforme les formalités en un <b>questionnaire guidé</b> : tu réponds, la plateforme rédige '
        + 'tes statuts et dépose ton dossier d’immatriculation. Et elle reste là après la création - chaque changement '
        + 'dans la vie de ta société se règle au même endroit.',
      points:[
        'Choisir la bonne forme : micro, EURL, SASU, SARL',
        'Statuts rédigés et dossier déposé, jusqu’au Kbis',
        'Domiciliation : une adresse pro sans bureau',
        'Siège, statuts, associés, dissolution : tout au même endroit',
        'Contrats prêts à l’emploi : CGV, prestation, pacte d’associés',
      ],
    },
    {
      nom:'Abby', kind:'Comptabilité micro',
      img:'assets/partenaires/abby.webp',
      color:'#0057c2', grad:'#3f95f5', soft:'#eef5ff',
      url:'https://abby.fr/?partnerCode=MLCONSULTING&utm_source=ML+Consulting+(Louis+M.)&utm_campaign=affiliation&utm_medium=partner&aecid=67a61b7caa39bef2dc02dcd5',
      promo:'MLCONSULTING', promoDetail:'−25 % sur l’abonnement annuel, ou −25 % les 3 premiers mois en mensuel',
      pitch:'Tes factures alimentent ton livre de recettes toutes seules, et tu déclares à l’URSSAF sans quitter l’outil.',
      desc:'En micro-entreprise, ce n’est pas la comptabilité qui fait mal, c’est l’oubli : une déclaration URSSAF '
        + 'passée, un livre des recettes jamais tenu. Abby travaille en fond - tes factures alimentent '
        + '<b>automatiquement</b> ton livre de recettes, ton chiffre d’affaires est prêt à déclarer, et tu le déclares '
        + 'sans quitter l’outil. Pensé pour ceux qui se lancent, avec une version gratuite pour démarrer.',
      points:[
        'Devis et factures conformes en quelques secondes',
        'Livre des recettes et registre des achats automatiques',
        'Déclaration URSSAF et TVA depuis l’outil',
        'Synchro bancaire : chaque encaissement rapproché de sa facture',
        'Suivi client et temps passé, pour facturer au juste prix',
      ],
    },
    {
      nom:'Qonto', kind:'Compte professionnel',
      img:'assets/partenaires/qonto.webp',
      color:'#141414', grad:'#4a4a4a', soft:'#f2f2f1',
      url:'https://qonto.com/r/cj2xa2', promo:'',
      pitch:'Le compte pro qui dépose ton capital et envoie chaque dépense chez ton comptable, justificatif compris.',
      desc:'Le compte pro n’est pas une case à cocher : c’est là que tout transite. Qonto ouvre le tien en ligne, '
        + 'dépose ton capital pour la création, et surtout <b>fait le lien avec ta comptabilité</b> - chaque paiement '
        + 'part chez ton expert-comptable avec son justificatif attaché. Plus de 600 000 entreprises l’utilisent en Europe.',
      points:[
        'Dépôt de capital en ligne pour créer ta société',
        'Cartes, virements SEPA, encaissements',
        'Sous-comptes : provisionner TVA et impôt sans y penser',
        'Justificatifs rattachés et export vers ton comptable',
        'Facturation et suivi de TVA intégrés au compte',
      ],
    },
    {
      nom:'Icon Invest', kind:'Expertise comptable', tease:true,
      img:'assets/partenaires/icon-invest.png',
      color:'#6a1fb0', grad:'#a55ce0', soft:'#f6edff',
      url:'https://icongroup.fr/invest', promo:'',
      pitch:'Une équipe jeune qui bosse avec de jeunes entrepreneurs : mêmes modèles, mêmes questions, même langage.',
      desc:'Un cabinet qui répond « ça dépend » et facture le rendez-vous, tu as déjà donné. Icon Invest, c’est une '
        + '<b>équipe jeune qui travaille au quotidien avec de jeunes entrepreneurs</b> : mêmes modèles économiques, '
        + 'mêmes questions, même vocabulaire. La comptabilité est tenue, oui - mais surtout, quelqu’un décroche '
        + 'quand tu ne sais pas si cette dépense peut passer.',
      points:[
        'Tenue comptable et bilan, du premier euro à la clôture',
        'Un interlocuteur qui connaît ton activité',
        'Rémunération, dividendes, dépenses : les vrais arbitrages',
        'Accompagnement financier : structurer, prévoir, décider',
        'Des réponses en français, pas en jargon fiscal',
      ],
    },
    // Celui-ci n'est pas un partenaire. C'est l'easter egg : fiche au premier
    // degré, code promo crédible, et un lien qui mène au clip de Rick Astley.
    // Le badge « Franchise en base de crédulité » tombe au clic.
    // Volontairement en dernier : les bandeaux contextuels des simulateurs
    // désignent les partenaires par leur index, l'insérer plus haut les
    // ferait tous pointer un cran à côté.
    {
      gag:true, neuf:true,
      nom:'URSSAF', kind:'Cotisations & protection sociale',
      img:'assets/partenaires/urssaf.png',
      color:'#1257a8', grad:'#25c3d4', soft:'#eef6fc',
      url:'https://www.youtube.com/watch?v=Aq5WXmQQooo', fait:'part:urssaf',
      // Tout le monde connaît l'URSSAF : « Découvrir » ne donne aucune raison
      // de cliquer. Le bouton promet donc ce qu'on vient chercher.
      cta:'Activer ma réduction',
      promo:'FREEHUB10', promoDetail:'−10 % sur ta prochaine déclaration URSSAF',
      pitch:'Déclarer, payer, récupérer ses attestations : le guichet de tes cotisations, et un accompagnement dédié aux créateurs.',
      desc:'L’URSSAF nous fait confiance dans le développement de cet outil : un partenariat rare pour une '
        + 'plateforme indépendante, et une reconnaissance de ce qu’on essaie de faire ici - rendre '
        + 'l’administratif <b>compréhensible aux jeunes indépendants</b>, plutôt que subi. Concrètement, tu '
        + 'retrouves le même interlocuteur que pour tes déclarations, avec un accès direct à tes démarches '
        + 'et aux dispositifs auxquels tu as droit sans le savoir.',
      points:[
        'Déclaration et paiement de tes cotisations au même endroit',
        'Attestation de vigilance téléchargeable en un clic',
        'Simulateur officiel de cotisations sociales',
        'Un conseiller dédié pendant ta première année d’activité',
        'Délais de paiement accordés en cas de baisse d’activité',
      ],
    },
  ].filter(function(p){ return !p.gag || GAG_URSSAF; });

  // Mise en avant d'un partenaire fraîchement arrivé : « New » dans la barre
  // latérale et contour doré sur sa carte, sur le modèle des objectifs. Deux
  // extinctions possibles - la date butoir ci-dessous, ou l'ouverture de la
  // fiche, qui vaut découverte. Il suffit de changer la date pour prolonger.
  var PART_NEUF_FIN = '2026-08-17';   // borne exclue : visible jusqu'au 16 inclus

  // Même principe pour un simulateur fraîchement mis en ligne : le « New » de
  // la barre latérale s'éteint à la date butoir, ou dès qu'on l'a ouvert.
  var SIM_NEUF = 'categorie';
  var SIM_NEUF_FIN = '2026-08-25';
  function simulateurNeuf(){
    if(Date.now() >= Date.parse(SIM_NEUF_FIN)) return false;
    return !state.faits['sim-neuf-vu:' + SIM_NEUF];
  }
  // Le Classement est un onglet neuf : sans repère visuel, ceux qui connaissent
  // déjà la barre latérale ne le verraient tout simplement pas.
  var PARR_NEUF_FIN = '2026-09-30';
  function parrainageNeuf(){
    if(Date.now() >= Date.parse(PARR_NEUF_FIN)) return false;
    return !state.faits['parrainage-vu'];
  }
  // L'accueil a été refondu : le marqueur signale la nouveauté à ceux qui
  // connaissent l'ancienne page, et s'éteint dès qu'ils l'ont vue.
  var ACC_NEUF = '2026-08-14';
  var ACC_NEUF_FIN = '2026-09-15';
  function accueilNeuf(){
    if(Date.now() >= Date.parse(ACC_NEUF_FIN)) return false;
    return !state.faits['accueil-neuf-vu:' + ACC_NEUF];
  }
  function partenairesNouveaux(){
    if(Date.now() >= Date.parse(PART_NEUF_FIN)) return [];
    var out = [];
    PARTENAIRES.forEach(function(p, i){
      if(p.neuf && !state.faits['part-neuf-vu:' + p.nom]) out.push(i);
    });
    return out;
  }

  var titles = {
    accueil:    ['Accueil',         '🏠', '#2f6bff'],
    objectifs:  ['Mes objectifs',   '🎯', '#2f6bff'],
    simulateur: ['Simulateur',      '📊', '#7c3aed'],
    lexique:    ['Lexique',         '📖', '#0891b2'],
    calendrier: ['Calendrier',      '🗓', '#db2777'],
    partenaires:['Nos partenaires', '🤝', '#16a34a'],
    chat:       ['Entraide',        '💬', '#e11d48'],
    parrainage: ['Classement',      '🏅', '#0d9488'],
    succes:     ['Récompenses',     '🏆', '#d97706'],
    sav:        ['Réclamations',    '📮', '#be123c'],
    profil:     ['Mon profil',      '👤', '#475569'],
    admin:      ['Dashboard',       '🛠', '#be123c'],
  };

  // Bandeau de titre : une pastille colorée et le nom de l'écran. Assez présent
  // pour situer, assez discret pour ne pas repousser le contenu vers le bas.
  function titrePageHtml(){
    var t = titles[state.tab];
    if(!t) return '';
    // La pastille reprend l'icône SVG de la barre latérale quand elle existe :
    // même trait, même famille. L'emoji ne sert que de repli.
    var ico = NAV_ICONES[state.tab]
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
        + 'stroke-linecap="round" stroke-linejoin="round">'+NAV_ICONES[state.tab]+'</svg>'
      : t[1];
    return '<div class="ptitre" style="--c:'+t[2]+'">'
      + '<span class="ptitre-i">'+ico+'</span>'
      + '<span class="ptitre-t">'+esc(t[0])+'</span>'
      + titreOutilsHtml()
    + '</div>';
  }

  // À droite du titre : ce qui appartient à l'écran courant (les compteurs de
  // l'Entraide, la modération) puis l'identité. Tout cela vivait auparavant
  // dans le corps de la page et mangeait la hauteur du fil de discussion.
  function titreOutilsHtml(){
    var out = '';
    if(state.tab === 'chat'){
      var c = state.chat;
      out += '<span class="ptitre-stats">'
        + '<span class="ch-stat"><span class="ch-stat-pt"></span>'+(c.enLigne || 0)+' en ligne</span>'
        + '<span class="ch-stat-sep">·</span>'
        + '<span class="ch-stat">'+(c.total || 0)+' membre'+((c.total||0)>1?'s':'')+'</span>'
      + '</span>';
      if(c.admin){
        out += '<button class="ch-mod" data-action="chat-moderation">Modération'
          + (c.nbSignales ? '<span class="ch-mod-n">'+c.nbSignales+'</span>' : '')
        + '</button>';
      }
    }
    if(state.compte){
      var p = state.profil;
      var nom = ((p.prenom || '') + ' ' + (p.nom || '')).trim() || state.compte.email || '';
      var ini = (p.prenom || state.compte.email || '?').trim().charAt(0).toUpperCase();
      // Le badge porté et le rôle : la seule information de statut visible en
      // permanence. Le reste attend le survol.
      var bp = state.badgePorte && state.badges.indexOf(state.badgePorte) >= 0
             ? badge(state.badgePorte) : null;
      var grade = state.compte.isAdmin
        ? '<span class="moi-grade admin">★ Admin</span>'
        : (bp ? '<span class="moi-grade'+(bp.rang ? ' rang-'+bp.rang : '')+'">'
                + bp.ico+' '+esc(bp.t)+'</span>'
              : (state.compte.beta ? '<span class="moi-grade beta">Bêta</span>' : ''));

      var avatar = p.photo ? '<img src="'+esc(p.photo)+'" alt="">'
                           : '<span class="ptitre-ini">'+esc(ini)+'</span>';
      out += '<div class="moi-zone">'
        + '<button class="ptitre-moi'+(state.tab === 'profil' ? ' on' : '')+'"'
          + ' data-action="open-profil" title="Mon profil">'
          + avatar
          + '<span class="moi-x"><span class="ptitre-nom">'+esc(nom)+'</span>'
            + (grade ? '<span class="moi-g">'+grade+'</span>' : '')+'</span>'
        + '</button>'
        // La carte de survol : le détail sans encombrer la barre.
        + '<div class="moi-pop">'
          + '<div class="moi-pop-h">'+avatar
            + '<div><div class="moi-pop-n">'+esc(nom)+'</div>'
            + '<div class="moi-pop-e">'+esc(state.compte.email || '')+'</div></div></div>'
          + '<div class="moi-pop-l"><span>Activité</span><strong>'
            + esc(p.activite || 'À compléter')+'</strong></div>'
          + '<div class="moi-pop-l"><span>Statut</span><strong>'
            + esc(p.forme || 'À compléter')+'</strong></div>'
          + (bp ? '<div class="moi-pop-l"><span>Badge porté</span><strong>'
              + bp.ico+' '+esc(bp.t)+'</strong></div>' : '')
          + '<button class="moi-pop-cta" data-action="open-profil">Ouvrir mon profil →</button>'
        + '</div>'
      + '</div>';
    }
    return out ? '<span class="ptitre-outils">'+out+'</span>' : '';
  }

  // Profil d'entreprise - centralisé, persisté dans le navigateur (localStorage),
  // réutilisé par le simulateur. Pré-rempli avec un exemple modifiable.
  // Profil = source unique de vérité. Chaque champ ici est un champ en moins
  // dans les simulateurs : ils lisent le profil à l'ouverture (appliquerProfil).
  var DEFAULT_PROFIL = {
    // 0 · Identité. Le mot de passe n'est volontairement PAS stocké : sans
    // backend d'authentification, le garder ici reviendrait à écrire un mot de
    // passe en clair dans le navigateur.
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    photo: '',            // data URL, redimensionnée à 256 px avant stockage
    // 1 · Activité
    activite: 'Monteur vidéo',
    description: 'Je réalise des montages vidéo à distance pour des créateurs de contenu. J’échange avec eux par mail et WhatsApp et je travaille depuis mon domicile.',
    categorieFiscale: 'bnc',
    // 2 · Structure
    forme: 'SASU',
    regime: 'Impôt sur les sociétés',
    versementLiberatoire: 'non',
    // Périodicités déclaratives : elles nourrissent le calendrier et les
    // rappels. Vide = on ne sait pas, donc on n'invente aucune échéance.
    periodeUrssaf: '',
    periodeTva: '',
    // 3 · Chiffre d'affaires
    ca: '60000',
    periodeCa: 'annuel',
    // 4 · TVA
    tva: 'Je suis à la TVA',
    regimeTva: 'Régime réel simplifié',
    tauxVente: '0.2',
    clientRecup: '70',
    clientProNon: '30',
    // 5 · Foyer fiscal
    parts: '1',
    autresRevenus: '',
    rfr: '',
    partsRfr: '',
    reductions: '',
    // 6 · Rémunération
    remMensuelle: '3000',
    dividendes: '100',
    tresorerie: '10000',
    cfe: '',
    // 7 · Charges professionnelles - liste partagée par 3 simulateurs
    charges: [
      { nom:'Logiciels et abonnements', montant:'180', frequence:'mensuelle',
        tauxTVA:'0.2', deductible:'100', categorie:'fonctionnement' },
    ],
  };

  // Est-on à la TVA ? On accepte les anciennes formulations du profil
  // (« Société assujettie à la TVA ») pour ne pas casser les profils existants.
  function estAssujettiTVA(p){
    var t = (p && p.tva) || '';
    if(/pas encore|franchise/i.test(t)) return false;
    return /^je suis à la tva$/i.test(t.trim()) || /assujettie/i.test(t);
  }
  function estMicro(p){
    return /micro|individuelle/i.test(p.forme || '');
  }
  function estSociete(p){
    return !estMicro(p) && !/je ne sais pas/i.test(p.forme || '');
  }
  // Le CA saisi, toujours ramené à l'année.
  function caProfilAnnuel(p){
    var v = parseFloat(String(p.ca).replace(/\s/g, '').replace(',', '.')) || 0;
    return p.periodeCa === 'mensuel' ? v * 12 : v;
  }


  // ---------------------------------------------------------------------------
  // Paramètres fiscaux par année - à réviser chaque année, jamais en dur ailleurs.
  // ---------------------------------------------------------------------------
  // Un seul millésime affiché dans toute l'app : l'utilisateur raisonne en
  // « ma déclaration de cette année », pas en « année du taux ».
  var MILLESIME = {
    revenus: 2025,
    label: 'revenus 2025',
    verifieLe: { fiscal:'23/07/2026', tva:'23/07/2026', statut:'ta feuille de calcul (29/08/2024)' },
  };

  function bandeauMillesimeHtml(jeu){
    return '<div class="millesime">Paramètres <strong>' + esc(MILLESIME.label) + '</strong>'
      + ' · vérifiés : ' + esc(MILLESIME.verifieLe[jeu] || '-')
      + ' · <button class="btn-link" data-action="open-profil" style="display:inline">'
      + 'à revoir chaque année</button></div>';
  }

  var FISCAL = {
    '2025': {
      anneeRevenus: 2025,
      anneeDeclaration: 2026,
      anneeRfr: 2024,              // RFR de l'année N-2 servant à l'éligibilité
      source: 'economie.gouv.fr · impots.gouv.fr · entreprendre.service-public.fr',
      verifieLe: '23/07/2026',
      micro: {
        venteBIC:   { vl: 0.010, abattement: 0.71, court: 'Vente (micro-BIC)',
                      label: 'Vente de marchandises, restauration ou hébergement - micro-BIC' },
        serviceBIC: { vl: 0.017, abattement: 0.50, court: 'Services (micro-BIC)',
                      label: 'Prestations de services commerciales ou artisanales - micro-BIC' },
        bnc:        { vl: 0.022, abattement: 0.34, court: 'Libéral (micro-BNC)',
                      label: 'Activité libérale - micro-BNC' },
      },
      abattementMinimum: 305,
      bareme: [
        { de: 0,      a: 11600,  taux: 0    },
        { de: 11600,  a: 29579,  taux: 0.11 },
        { de: 29579,  a: 84577,  taux: 0.30 },
        { de: 84577,  a: 181917, taux: 0.41 },
        { de: 181917, a: null,   taux: 0.45 },
      ],
      plafondRfrParPart: 29315,
      // Volontairement non renseignés : valeurs officielles non fournies dans le
      // brief. Tant qu'ils sont à null, le calcul les ignore ET le dit dans les
      // hypothèses affichées - plutôt que d'inventer des seuils.
      decote: null,
      plafondQuotientFamilial: null,
    },
  };

  // ---------------------------------------------------------------------------
  // Paramètres du simulateur « Quand passer en société ? »
  //
  // ⚠️ ATTENTION : contrairement aux autres simulateurs, le brief ne fournissait
  // AUCUNE valeur chiffrée. Celles-ci sont des ORDRES DE GRANDEUR destinés à
  // rendre l'outil utilisable, PAS des taux officiels vérifiés. Elles sont
  // toutes modifiables par l'utilisateur dans le panneau « Paramètres », et
  // l'interface affiche un avertissement tant qu'elles n'ont pas été validées.
  // ---------------------------------------------------------------------------
  var STATUT_PARAMS = {
    annee: 2026,
    source: 'Feuille de calcul de l’utilisateur (L. Marie, 29/08/2024)',
    valide: false,          // partiellement : voir PARAM_SOURCE ci-dessous
    micro: {
      // Cotisations sociales du micro-entrepreneur, en % du CA encaissé
      cotisations: { venteBIC: 0.123, serviceBIC: 0.212, bnc: 0.246 },
      // Abattement fiscal (identique au simulateur versement libératoire)
      abattement: { venteBIC: 0.71, serviceBIC: 0.50, bnc: 0.34 },
      vlTaux:     { venteBIC: 0.01, serviceBIC: 0.017, bnc: 0.022 },
    },
    is: { tauxReduit: 0.15, plafondReduit: 42500, tauxNormal: 0.25 },
    pfu: 0.30,              // prélèvement forfaitaire unique sur les dividendes
    cfe: 500,               // cotisation foncière des entreprises (très variable)
    eurl: { cotisationsTNS: 0.44 },              // en % de la rémunération versée
    // Calibré pour que le coût total colle au « 88 % du net » de la feuille :
    // (1 + 0,466) / (1 − 0,22) = 1,88.
    sasu: { patronales: 0.466, salariales: 0.22 },
    abattementSalaire: 0.10,                     // abattement de 10 % pour l'IR
  };

  // Provenance de chaque paramètre : ce qui vient de la feuille de calcul de
  // l'utilisateur, et ce qui reste une estimation. Affiché dans l'interface pour
  // qu'on ne confonde jamais un chiffre confirmé avec un ordre de grandeur.
  var PARAM_SOURCE = {
    'eurl.cotisationsTNS': 'confirme',
    'sasu.patronales':     'confirme',
    'sasu.salariales':     'confirme',
    'is.tauxReduit':       'confirme',
    'is.tauxNormal':       'confirme',
    'pfu':                 'confirme',
    'is.plafondReduit':    'estime',
    'cfe':                 'estime',
    'micro.cotisations':   'estime',
    'abattementSalaire':   'estime',
  };
  var PARAM_BADGE = {
    confirme: { l:'Confirmé', bg:'#dcfce7', c:'#15803d',
                t:'Valeur reprise de ta feuille de calcul.' },
    estime:   { l:'À confirmer', bg:'#fef3c7', c:'#b45309',
                t:'Ordre de grandeur : ta feuille de calcul ne donne pas cette valeur.' },
  };

  // Impôt sur les sociétés, avec le taux réduit sur la première tranche.
  function calculIS(benefice, P){
    if(!(benefice > 0)) return 0;
    var reduit = Math.min(benefice, P.is.plafondReduit);
    var normal = Math.max(0, benefice - P.is.plafondReduit);
    return reduit * P.is.tauxReduit + normal * P.is.tauxNormal;
  }

  // Calcule les trois statuts pour un chiffre d'affaires donné.
  // Tout est déterministe : aucune IA n'intervient.
  function calculerStatuts(f, caAnnuel){
    var P = state.statut ? state.statut.params : STATUT_PARAMS;
    var bareme = FISCAL['2025'];
    var ca = Math.max(0, caAnnuel);
    var cat = f.categorie || 'bnc';
    var parts = Math.max(1, parseFloat(f.parts) || 1);
    var charges = Math.max(0, parseFloat(f.chargesAnnuelles) || 0);
    var invest = Math.max(0, parseFloat(f.investissement) || 0);
    var remSouhaitee = Math.max(0, (parseFloat(f.remMensuelle) || 0) * 12);
    var tauxDiv = Math.min(1, Math.max(0, (parseFloat(f.dividendes) || 0) / 100));

    // ---- Auto-entreprise ----
    // Point clé : les charges ne sont PAS déductibles, elles sortent de la poche.
    function micro(){
      var cot = ca * P.micro.cotisations[cat];
      var cfe = P.cfe;
      var ir, assiette = ca * (1 - P.micro.abattement[cat]);
      if(f.versementLiberatoire === 'oui') ir = ca * P.micro.vlTaux[cat];
      else ir = impotBareme(assiette, parts, bareme);
      var net = ca - cot - ir - cfe - charges - invest;
      return { ca:ca, charges:charges + invest, chargesDeductibles:false,
               cotisations:cot, fiscalite:ir + cfe, ir:ir, cfe:cfe,
               dividendes:0, net:net, remuneration:0, plafonnee:false };
    }

    // ---- EURL (gérant TNS, à l'IS) ----
    function eurl(){
      var dispo = ca - charges - invest;
      // On ne peut pas se verser plus que ce que l'entreprise peut supporter.
      var rem = Math.max(0, Math.min(remSouhaitee, dispo / (1 + P.eurl.cotisationsTNS)));
      var cot = rem * P.eurl.cotisationsTNS;
      var resultat = dispo - rem - cot;
      var is = calculIS(Math.max(0, resultat), P);
      var apresIS = Math.max(0, resultat - is);
      var div = apresIS * tauxDiv;
      var pfu = div * P.pfu;
      var irRem = impotBareme(rem * (1 - P.abattementSalaire), parts, bareme);
      var net = (rem - irRem) + (div - pfu);
      return { ca:ca, charges:charges + invest, chargesDeductibles:true,
               cotisations:cot, fiscalite:is + pfu + irRem, is:is, pfu:pfu, ir:irRem,
               remuneration:rem, resultat:resultat, dividendes:div, net:net,
               plafonnee: rem < remSouhaitee - 1 };
    }

    // ---- SASU (président assimilé salarié, à l'IS) ----
    function sasu(){
      var dispo = ca - charges - invest;
      // La rémunération saisie est un NET souhaité : on remonte au brut.
      var brutSouhaite = remSouhaitee / (1 - P.sasu.salariales);
      var coutMax = dispo / (1 + P.sasu.patronales);
      var brut = Math.max(0, Math.min(brutSouhaite, coutMax));
      var patronales = brut * P.sasu.patronales;
      var salariales = brut * P.sasu.salariales;
      var netAvantIR = brut - salariales;
      var resultat = dispo - brut - patronales;
      var is = calculIS(Math.max(0, resultat), P);
      var apresIS = Math.max(0, resultat - is);
      var div = apresIS * tauxDiv;
      var pfu = div * P.pfu;
      var irRem = impotBareme(netAvantIR * (1 - P.abattementSalaire), parts, bareme);
      var net = (netAvantIR - irRem) + (div - pfu);
      return { ca:ca, charges:charges + invest, chargesDeductibles:true,
               cotisations:patronales + salariales, fiscalite:is + pfu + irRem,
               is:is, pfu:pfu, ir:irRem, remuneration:netAvantIR, brut:brut,
               resultat:resultat, dividendes:div, net:net,
               plafonnee: brut < brutSouhaite - 1 };
    }

    return { micro:micro(), eurl:eurl(), sasu:sasu() };
  }

  // Cherche le CA à partir duquel un statut dépasse l'auto-entreprise.
  // Les niveaux de CA où l'activité n'est pas viable (revenu négatif dans l'un
  // des deux statuts) sont ignorés : y comparer deux pertes n'a aucun sens.
  // Répond à la question de l'utilisateur : « à partir de QUAND ? »
  // On part donc de son CA actuel et on monte - chercher en dessous produirait
  // des croisements parasites (à très bas CA la rémunération est plafonnée et
  // la société peut sembler gagnante alors que rien n'est viable).
  // Retourne { deja:true } si la société est déjà devant, { ca } sinon, ou null.
  function pointDeBascule(f, cle, caActuel){
    var depart = Math.max(5000, Math.round(caActuel || 0));
    var r0 = calculerStatuts(f, depart);
    if(r0.micro.net > 0 && r0[cle].net > r0.micro.net) return { deja:true, ca:depart };
    for(var ca = depart; ca <= 400000; ca += 1000){
      var r = calculerStatuts(f, ca);
      if(r.micro.net <= 0 || r[cle].net <= 0) continue;
      if(r[cle].net > r.micro.net) return { deja:false, ca:ca };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Simulateur « Optimiser ma société » - moteur (temps réel, sans IA)
  // Réutilise STATUT_PARAMS : mêmes taux, donc mêmes réserves de validation.
  // ---------------------------------------------------------------------------
  var OPTIM_CATEGORIES = [
    { v:'fonctionnement', l:'Fonctionnement', ex:'Logiciels, abonnements' },
    { v:'vehicule',       l:'Véhicule',       ex:'Achat, LOA, carburant, entretien' },
    { v:'deplacement',    l:'Déplacements',   ex:'Train, avion, hôtel, restaurant' },
    { v:'local',          l:'Local',          ex:'Loyer, coworking, internet' },
    { v:'assurance',      l:'Assurances',     ex:'RC Pro, mutuelle, prévoyance' },
    { v:'investissement', l:'Investissements',ex:'Ordinateur, caméra, mobilier' },
    { v:'communication',  l:'Communication',  ex:'Publicité, sponsoring, événements' },
  ];

  // Leviers activables : chacun est une charge déductible supplémentaire.
  // ⚠️ Les plafonds d'exonération propres à chaque dispositif ne sont PAS
  // vérifiés (le brief ne les chiffre pas) - seul le mécanisme de déduction
  // est simulé. C'est indiqué à l'utilisateur.
  var OPTIM_LEVIERS = [
    { v:'mutuelle',    l:'Mutuelle santé',        def:80,  unite:'mois', social:true },
    { v:'prevoyance',  l:'Prévoyance',            def:60,  unite:'mois', social:true },
    { v:'rcpro',       l:'RC Pro',                def:400, unite:'an' },
    { v:'per',         l:'Plan d’épargne retraite',def:200, unite:'mois', social:true },
    { v:'ticketsResto',l:'Titres-restaurant',     def:100, unite:'mois' },
    { v:'ik',          l:'Indemnités kilométriques',def:150,unite:'mois' },
    { v:'bureau',      l:'Bureau à domicile',     def:100, unite:'mois' },
  ];

  function totalLeviers(leviers){
    return OPTIM_LEVIERS.reduce(function(s, L){
      var m = parseFloat(leviers[L.v]) || 0;
      return s + (L.unite === 'mois' ? m * 12 : m);
    }, 0);
  }

  function chargesOptimAnnuelles(charges){
    return charges.reduce(function(s, c){
      var m = parseFloat(c.montant) || 0;
      var annuel = c.frequence === 'mensuelle' ? m * 12 : m;
      var ded = Math.min(1, Math.max(0, (parseFloat(c.deductible) || 0) / 100));
      return s + annuel * ded;
    }, 0);
  }

  // TVA récupérable sur les charges (réutilise la formule du simulateur TVA).
  function tvaRecupOptim(charges, assujetti){
    if(!assujetti) return 0;
    return charges.reduce(function(s, c){
      var m = parseFloat(c.montant) || 0;
      var annuel = c.frequence === 'mensuelle' ? m * 12 : m;
      var t = parseFloat(c.tauxTVA) || 0;
      var ded = Math.min(1, Math.max(0, (parseFloat(c.deductible) || 0) / 100));
      return s + tvaDansTTC(annuel, t) * ded;
    }, 0);
  }

  function calculerOptim(f, charges, leviers, statut, caAnnuel){
    var P = state.statut.params;
    var bareme = FISCAL['2025'];
    var ca = Math.max(0, caAnnuel);
    var parts = Math.max(1, parseFloat(f.parts) || 1);
    var assujetti = f.tva === 'oui';

    var chargesDed = chargesOptimAnnuelles(charges);
    var tvaRecup = tvaRecupOptim(charges, assujetti);
    // Si la société récupère la TVA, la charge réelle est le HT.
    var chargesReelles = chargesDed - tvaRecup;
    var leviersTotal = totalLeviers(leviers);
    var chargesTotales = chargesReelles + leviersTotal;

    var remSouhaitee = Math.max(0, (parseFloat(f.remMensuelle) || 0) * 12);
    var tresoCible = Math.max(0, parseFloat(f.tresorerie) || 0);
    var tauxDiv = Math.min(1, Math.max(0, (parseFloat(f.dividendes) || 0) / 100));

    var dispo = ca - chargesTotales;
    var rem, cotisations, brut = 0, patronales = 0, salariales = 0, netAvantIR;

    if(statut === 'sasu'){
      var brutSouhaite = remSouhaitee / (1 - P.sasu.salariales);
      brut = Math.max(0, Math.min(brutSouhaite, Math.max(0, dispo) / (1 + P.sasu.patronales)));
      patronales = brut * P.sasu.patronales;
      salariales = brut * P.sasu.salariales;
      cotisations = patronales + salariales;
      netAvantIR = brut - salariales;
      rem = netAvantIR;
    } else {
      rem = Math.max(0, Math.min(remSouhaitee, Math.max(0, dispo) / (1 + P.eurl.cotisationsTNS)));
      cotisations = rem * P.eurl.cotisationsTNS;
      netAvantIR = rem;
    }

    var coutRemuneration = (statut === 'sasu') ? (brut + patronales) : (rem + cotisations);
    var resultat = dispo - coutRemuneration;
    var is = calculIS(Math.max(0, resultat), P);
    var apresIS = Math.max(0, resultat - is);

    // La trésorerie conservée n'est pas distribuable.
    var distribuable = Math.max(0, apresIS - tresoCible);
    var dividendes = distribuable * tauxDiv;
    var pfu = dividendes * P.pfu;
    var tresorerieFinale = apresIS - dividendes;

    var irRem = impotBareme(netAvantIR * (1 - P.abattementSalaire), parts, bareme);
    var argentPerso = (netAvantIR - irRem) + (dividendes - pfu);
    var prelevements = cotisations + is + pfu + irRem;

    return {
      ca:ca, assujetti:assujetti, chargesDed:chargesDed, tvaRecup:tvaRecup,
      chargesReelles:chargesReelles, leviersTotal:leviersTotal, chargesTotales:chargesTotales,
      statut:statut, remuneration:netAvantIR, brut:brut, patronales:patronales,
      salariales:salariales, cotisations:cotisations, coutRemuneration:coutRemuneration,
      resultat:resultat, is:is, apresIS:apresIS, tresoCible:tresoCible,
      distribuable:distribuable, dividendes:dividendes, pfu:pfu,
      tresorerieFinale:tresorerieFinale, ir:irRem, argentPerso:argentPerso,
      prelevements:prelevements,
      tauxPrelevement: ca > 0 ? prelevements / ca : 0,
      plafonnee: (statut === 'sasu' ? brut * (1 + P.sasu.patronales) : rem * (1 + P.eurl.cotisationsTNS))
                 < (remSouhaitee * (statut === 'sasu' ? 1.2 : 1.4)) && rem < remSouhaitee - 1,
    };
  }

  // --- Scores de santé (règles PRODUIT, pas des règles fiscales) ---
  function scoresOptim(r, leviers){
    var borne = function(v){ return Math.max(0, Math.min(100, Math.round(v))); };
    // Rémunération : part du CA effectivement versée au dirigeant
    var ratioRem = r.ca > 0 ? r.remuneration / r.ca : 0;
    var remScore = borne(ratioRem <= 0 ? 0 : (ratioRem < 0.15 ? ratioRem / 0.15 * 55
                        : ratioRem <= 0.45 ? 100 : 100 - (ratioRem - 0.45) * 180));
    // Trésorerie : combien de mois de fonctionnement le matelas couvre.
    // On compare aux charges ET au coût de la rémunération : comparer aux seules
    // charges donnait des scores absurdes quand elles sont faibles.
    var mensuelFonctionnement = (r.chargesTotales + r.coutRemuneration) / 12;
    var mois = mensuelFonctionnement > 0 ? r.tresorerieFinale / mensuelFonctionnement
                                         : (r.tresorerieFinale > 0 ? 6 : 0);
    var tresoScore = borne(mois <= 0 ? 0 : (mois < 3 ? mois / 3 * 65 : mois <= 9 ? 100
                          : 100 - (mois - 9) * 2.5));
    // Fiscal : taux de prélèvement global
    var tp = r.tauxPrelevement;
    var fiscalScore = borne(tp <= 0.25 ? 100 : tp >= 0.55 ? 20 : 100 - (tp - 0.25) * 265);
    // Charges : part du CA déduite (trop peu = on paie de l'impôt sur tout)
    var ratioCh = r.ca > 0 ? r.chargesTotales / r.ca : 0;
    var chargesScore = borne(ratioCh <= 0 ? 25 : ratioCh < 0.10 ? 40 + ratioCh / 0.10 * 45
                            : ratioCh <= 0.40 ? 100 : 100 - (ratioCh - 0.40) * 200);
    // Social : leviers de protection activés
    var actifs = ['mutuelle','prevoyance','per'].filter(function(k){ return (parseFloat(leviers[k])||0) > 0; }).length;
    var socialScore = borne(actifs / 3 * 70 + (r.statut === 'sasu' ? 30 : 15));
    var scores = { remuneration:remScore, tresorerie:tresoScore, fiscal:fiscalScore,
                   charges:chargesScore, social:socialScore };
    scores.global = Math.round((remScore + tresoScore + fiscalScore + chargesScore + socialScore) / 5);
    return scores;
  }

  // --- Import depuis les autres simulateurs (l'écosystème) ---
  function depensesImportables(){
    var out = [];
    // 1) Simulateur TVA : montant, fréquence, taux, part récupérable
    (state.tva.depenses || []).forEach(function(d){
      if(!(d.nom || '').trim() || !(parseFloat(d.montant) > 0)) return;
      out.push({ nom:d.nom, montant:d.montant, frequence:d.frequence || 'mensuelle',
                 tauxTVA:d.taux || '0.2', deductible:String(parseFloat(d.recup) || 0),
                 categorie:'fonctionnement', source:'Simulateur TVA' });
    });
    // 2) Simulateur de dépenses : la déductibilité vient de l'analyse IA
    var derniere = (state.historique || [])[0];
    if(derniere && derniere.depenses){
      derniere.depenses.forEach(function(d, i){
        if(!(d.nom || '').trim() || !(parseFloat(d.montant) > 0)) return;
        var res = derniere.result && derniere.result.depenses && derniere.result.depenses[i];
        var st = res && res.statut;
        var ded = st === 'vert' ? '100' : (st === 'orange' ? '50' : (st === 'rouge' ? '0' : '50'));
        out.push({ nom:d.nom, montant:d.montant, frequence:'annuelle', tauxTVA:'0.2',
                   deductible:ded, categorie:'fonctionnement',
                   source:'Analyse de dépenses' + (st ? ' (' + STATUT[st].label + ')' : '') });
      });
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Paramètres du simulateur TVA - à réviser chaque année.
  // ---------------------------------------------------------------------------
  var TVA_PARAMS = {
    annee: 2026,
    source: 'impots.gouv.fr · entreprendre.service-public.fr',
    verifieLe: '23/07/2026',
    tauxVente: [
      { v:'0.2',   l:'20% - taux normal' },
      { v:'0.1',   l:'10% - taux intermédiaire' },
      { v:'0.055', l:'5,5% - taux réduit' },
      { v:'0.021', l:'2,1% - taux particulier' },
    ],
    tauxDepense: [
      { v:'0.2',   l:'20%' }, { v:'0.1',   l:'10%' },
      { v:'0.055', l:'5,5%' }, { v:'0.021', l:'2,1%' },
      { v:'0',     l:'0% / sans TVA' },
    ],
    // Seuils de franchise en base de TVA, vérifiés sur entreprendre.service-public.gouv.fr
    // (stabilisés par la loi du 4 novembre 2025, inchangés pour 2026).
    // Au-delà du seuil de base : TVA au 1er janvier suivant.
    // Au-delà du seuil majoré : TVA dès le jour du dépassement.
    seuilsFranchise: {
      venteBIC:   { base:85000, majore:93500, l:'vente de marchandises et hébergement' },
      serviceBIC: { base:37500, majore:41250, l:'prestations de services' },
      bnc:        { base:37500, majore:41250, l:'professions libérales' },
      annee: 2026,
    },
    // Seuils de recommandation : règles PRODUIT, pas des règles fiscales.
    seuilFavorable: 0.01,      // gain net > 1 % du CA
    seuilDefavorable: -0.01,   // perte nette > 1 % du CA
    // Risque commercial estimé à partir de la part de clients qui NE récupèrent
    // PAS la TVA (pour eux, ta hausse de prix est une vraie augmentation).
    // Repères PRODUIT, pas des statistiques : plus la clientèle est sensible,
    // plus le risque de perdre des clients est réel.
    ancresRisque: [[0, 0], [0.3, 0.075], [0.5, 0.20], [1, 0.30]],
    // Ordres de grandeur du coût administratif annuel du passage à la TVA.
    // Sources : grille tarifaire publique d'Abby (plan Pro = premier niveau
    // gérant la TVA) et fourchette d'honoraires d'expert-comptable.
    coutsOutils: [
      { id:'seul',      l:'Tu déclares toi-même',      min:0,    max:0,
        d:'Gratuit, mais c’est du temps et un risque d’erreur à assumer.' },
      { id:'logiciel',  l:'Un logiciel type Abby',     min:144,  max:180,
        d:'Plan Pro (12 €/mois avec engagement annuel, 15 €/mois sans engagement) : déclarations CA3 générées depuis tes factures.' },
      { id:'comptable', l:'Un expert-comptable',       min:1800, max:3000,
        d:'À partir d’environ 150 €/mois pour un suivi complet - il gère bien plus que la TVA.' },
    ],
    // Catégories dont la TVA est souvent limitée ou exclue.
    categoriesSensibles: ['vehicule','carburant','restaurant','hebergement','cadeau','mixte','logement'],
  };

  // ---------------------------------------------------------------------------
  // Moteur de calcul TVA (déterministe et testable - l'IA ne calcule rien ici)
  // ---------------------------------------------------------------------------
  // TVA comprise dans un montant TTC.
  // Piège classique : TTC / 1,2 donne le HT, PAS la TVA.
  function tvaDansTTC(ttc, taux){
    if(!(ttc > 0) || !(taux > 0)) return 0;
    return ttc * taux / (1 + taux);
  }

  // Un achat unique ne doit jamais être multiplié par douze.
  function annualiser(montant, frequence){
    var m = parseFloat(montant) || 0;
    return frequence === 'mensuelle' ? m * 12 : m;
  }

  // Contrôle de cohérence : quelqu'un qui se déclare hors TVA mais dont le CA
  // dépasse le seuil de sa catégorie a probablement une information à corriger.
  function alerteSeuilTVA(p){
    var S = TVA_PARAMS.seuilsFranchise;
    if(!S || estAssujettiTVA(p)) return null;
    var cat = S[p.categorieFiscale] || S.bnc;
    var ca = caProfilAnnuel(p);
    if(!(ca > cat.base)) return null;
    return { ca:ca, base:cat.base, majore:cat.majore, l:cat.l,
             depasseMajore: ca > cat.majore };
  }

  // Interpolation linéaire entre les ancres de risque commercial.
  function risqueCommercial(partSensible){
    var a = TVA_PARAMS.ancresRisque;
    var x = Math.min(1, Math.max(0, partSensible));
    for(var i = 1; i < a.length; i++){
      if(x <= a[i][0]){
        var t = (x - a[i-1][0]) / (a[i][0] - a[i-1][0] || 1);
        return a[i-1][1] + t * (a[i][1] - a[i-1][1]);
      }
    }
    return a[a.length-1][1];
  }

  function calculerTVA(f, depenses){
    var p = TVA_PARAMS;
    var ca = Math.max(0, parseFloat(f.ca) || 0);
    if(f.caMensuel) ca = ca * 12;
    var taux = parseFloat(f.tauxVente) || 0;

    var pRecup = (parseFloat(f.partRecup) || 0) / 100;
    var pProNon = (parseFloat(f.partProNon) || 0) / 100;
    var pParticuliers = 0;                      // fusionné dans « ne récupèrent pas »
    var pSensible = pProNon;                    // ceux pour qui la TVA est un coût

    // --- TVA récupérable sur les dépenses ---
    var lignes = (depenses || []).map(function(d){
      var ttcAnnuel = annualiser(d.montant, d.frequence);
      var t = parseFloat(d.taux) || 0;
      var theorique = tvaDansTTC(ttcAnnuel, t);
      var coef = Math.min(1, Math.max(0, (parseFloat(d.recup) || 0) / 100));
      return {
        nom: d.nom || 'Dépense', ttcAnnuel: ttcAnnuel, taux: t,
        theorique: theorique, coef: coef, recuperable: theorique * coef,
        sensible: p.categoriesSensibles.indexOf(d.categorie) !== -1,
        categorie: d.categorie || '',
      };
    });
    var tvaRecuperable = lignes.reduce(function(s, l){ return s + l.recuperable; }, 0);
    // Le coût administratif n'est plus demandé : on le présente en scénarios
    // dans le résultat. Le gain « brut » se calcule donc sans lui.
    var coutsAdmin = 0;

    // --- Un scénario = un taux de répercussion par groupe de clients ---
    // rRecup / rSensible ∈ [0,1] : part de la TVA ajoutée au prix actuel.
    function scenario(rRecup, rSensible){
      var absorbee = 0, collectee = 0, caHT = 0, hausseTTC = 0;
      [{ ca: ca * pRecup, r: rRecup }, { ca: ca * pSensible, r: rSensible }].forEach(function(s){
        if(!(s.ca > 0)) return;
        var nouveauTTC = s.ca * (1 + taux * s.r);   // prix actuel + part de TVA répercutée
        var ht = nouveauTTC / (1 + taux);
        absorbee += Math.max(0, s.ca - ht);         // ce que l'entrepreneur perd en HT
        collectee += nouveauTTC - ht;               // encaissé pour être reversé (pas un revenu)
        caHT += ht;
        hausseTTC += nouveauTTC - s.ca;
      });
      return {
        absorbee: absorbee, collectee: collectee, caHT: caHT, hausseTTC: hausseTTC,
        gain: tvaRecuperable - absorbee - coutsAdmin,
      };
    }

    // --- Scénario de référence ---
    // On ne demande plus « que ferais-tu de tes prix ? » : on part de l'hypothèse
    // la plus courante et la plus lisible - la TVA s'ajoute aux prix, le revenu
    // HT est donc préservé. Les autres stratégies restent comparées plus bas.
    var rRecup = 1, rSensible = 1;
    var principal = scenario(rRecup, rSensible);

    // --- Les trois scénarios de référence ---
    var scenarios = {
      ajoutee: scenario(1, 1),
      conservee: scenario(0, 0),
      mixte: scenario(1, 0),
    };

    // --- Risque commercial : estimé automatiquement, jamais fondu dans le gain ---
    // Fourchette autour de l'estimation centrale : on affiche un ordre de
    // grandeur, pas une prédiction au point près.
    var baisse = risqueCommercial(pSensible);
    var perteCommerciale = ca * pSensible * baisse;
    var risque = {
      taux: baisse,
      tauxMin: baisse * 0.7,
      tauxMax: baisse * 1.3,
      caExpose: ca * pSensible,
      perte: perteCommerciale,
      perteMin: ca * pSensible * baisse * 0.7,
      perteMax: ca * pSensible * baisse * 1.3,
    };

    // --- Coût administratif : trois scénarios, jamais imposé ---
    var coutsScenarios = p.coutsOutils.map(function(o){
      return { id:o.id, l:o.l, d:o.d, min:o.min, max:o.max,
               gainMin: tvaRecuperable - o.max, gainMax: tvaRecuperable - o.min };
    });

    // --- Avis ---
    var sommeParts = Math.round((pRecup + pProNon) * 100);
    var incomplet = !(ca > 0) || !(taux > 0) || sommeParts !== 100;
    var relatif = ca > 0 ? principal.gain / ca : 0;
    var avis;
    if(incomplet) avis = 'gris';
    else if(relatif > p.seuilFavorable) avis = 'vert';
    else if(relatif < p.seuilDefavorable) avis = 'rouge';
    else avis = 'orange';

    return {
      params: p, ca: ca, taux: taux,
      parts: { recup:pRecup, proNon:pProNon, particuliers:pParticuliers, sensible:pSensible },
      segments: {
        recup: ca * pRecup, proNon: ca * pProNon,
        particuliers: ca * pParticuliers, sensible: ca * pSensible,
      },
      lignes: lignes, tvaRecuperable: tvaRecuperable, coutsAdmin: coutsAdmin,
      principal: principal, scenarios: scenarios,
      perteCommerciale: perteCommerciale, baisse: baisse,
      risque: risque, coutsScenarios: coutsScenarios,
      avis: avis, relatif: relatif, sommeParts: sommeParts,
      rRecup: rRecup, rSensible: rSensible,
    };
  }

  // ---------------------------------------------------------------------------
  // Moteur de calcul fiscal (déterministe, aucun appel à l'IA)
  // ---------------------------------------------------------------------------
  // Impôt sur le revenu au barème progressif, avec quotient familial.
  function impotBareme(revenuImposable, parts, p){
    if(!(revenuImposable > 0) || !(parts > 0)) return 0;
    var parPart = revenuImposable / parts;
    var impot = 0;
    p.bareme.forEach(function(tr){
      var haut = (tr.a === null) ? Infinity : tr.a;
      if(parPart > tr.de) impot += (Math.min(parPart, haut) - tr.de) * tr.taux;
    });
    return impot * parts;
  }

  // Tranche dans laquelle tombe un revenu PAR PART.
  function trancheDe(revenuParPart, p){
    var t = p.bareme[0];
    p.bareme.forEach(function(tr){ if(revenuParPart > tr.de) t = tr; });
    return t;
  }

  // Bénéfice imposable micro = CA − abattement (jamais inférieur à l'abattement minimum).
  function beneficeMicro(ca, abattement, minAbat){
    if(!(ca > 0)) return 0;
    var abat = Math.max(ca * abattement, minAbat);
    return Math.max(0, ca - abat);
  }

  // Comparaison complète des deux options.
  function comparerVL(f){
    var p = FISCAL[f.annee] || FISCAL['2025'];
    var cat = p.micro[f.categorie] || p.micro.bnc;
    var ca = Math.max(0, parseFloat(f.ca) || 0);
    var autres = Math.max(0, parseFloat(f.autresRevenus) || 0);
    var parts = Math.max(1, parseFloat(f.parts) || 1);

    // Option A - versement libératoire : assis sur le chiffre d'affaires.
    var vl = ca * cat.vl;

    // Option B - barème progressif : on ne retient que le SURCOÛT dû à la micro.
    var benefice = beneficeMicro(ca, cat.abattement, p.abattementMinimum);
    var impotSans = impotBareme(autres, parts, p);
    var impotAvec = impotBareme(autres + benefice, parts, p);
    var coutClassique = Math.max(0, impotAvec - impotSans);

    // Réductions/crédits éventuels : ils réduisent l'impôt réellement dû, donc
    // peuvent annuler tout ou partie du surcoût de la micro.
    var reductions = Math.max(0, parseFloat(f.reductions) || 0);
    if(reductions > 0){
      var apres = Math.max(0, impotAvec - reductions);
      var avant = Math.max(0, impotSans - reductions);
      coutClassique = Math.max(0, apres - avant);
    }

    var ecart = coutClassique - vl;   // > 0 → le VL fait économiser

    // Position dans le barème, avant et après la micro.
    var parPartAvant = autres / parts;
    var parPartApres = (autres + benefice) / parts;

    // Éligibilité au versement libératoire (RFR de N-2).
    var rfr = parseFloat(f.rfr);
    var partsRfr = Math.max(1, parseFloat(f.partsRfr) || parts);
    var plafond = p.plafondRfrParPart * partsRfr;
    var eligible = (f.rfr === '' || f.rfr === null || isNaN(rfr)) ? null : (rfr <= plafond);

    return {
      params: p, cat: cat, ca: ca, autres: autres, parts: parts,
      vl: vl, vlMensuel: vl / 12,
      benefice: benefice, impotSans: impotSans, impotAvec: impotAvec,
      coutClassique: coutClassique, coutMensuel: coutClassique / 12,
      ecart: ecart, ecartMensuel: ecart / 12,
      parPartAvant: parPartAvant, parPartApres: parPartApres,
      trancheAvant: trancheDe(parPartAvant, p), trancheApres: trancheDe(parPartApres, p),
      eligible: eligible, plafondRfr: plafond, rfr: isNaN(rfr) ? null : rfr,
      reductions: reductions,
    };
  }

  // Historique des simulations - conservé dans le navigateur, 20 dernières.
  function loadHistorique(){
    try {
      var raw = localStorage.getItem('freehub_historique');
      if(raw){ var a = JSON.parse(raw); if(Array.isArray(a)) return a; }
    } catch(e){}
    return [];
  }
  function saveHistorique(h){
    try { localStorage.setItem('freehub_historique', JSON.stringify(h.slice(0, 20))); } catch(e){}
    pousserServeur();
  }
  // Historique propre au comparateur : chaque simulateur garde ses simulations.
  function loadHistVL(){
    try {
      var raw = localStorage.getItem('freehub_hist_vl');
      if(raw){ var a = JSON.parse(raw); if(Array.isArray(a)) return a; }
    } catch(e){}
    return [];
  }
  function saveHistVL(h){
    try { localStorage.setItem('freehub_hist_vl', JSON.stringify(h.slice(0, 20))); } catch(e){}
    pousserServeur();
  }
  // Scénarios sauvegardés du simulateur d'optimisation.
  // Les taux ajustés par l'utilisateur étaient perdus au rechargement.
  function loadParams(){
    var base = JSON.parse(JSON.stringify(STATUT_PARAMS));
    try {
      var raw = localStorage.getItem('freehub_params');
      if(raw){
        var enr = JSON.parse(raw);
        ['micro','is','eurl','sasu'].forEach(function(k){
          if(enr[k]) Object.assign(base[k], enr[k]);
        });
        ['pfu','cfe','abattementSalaire'].forEach(function(k){
          if(enr[k] !== undefined) base[k] = enr[k];
        });
      }
    } catch(e){}
    return base;
  }
  function saveParams(P){
    try { localStorage.setItem('freehub_params', JSON.stringify(P)); } catch(e){}
    pousserServeur();
  }

  // Objectifs choisis + étapes cochées. Sans ça, tout se perdait au rechargement.
  // Au-delà de trois, « en avant » ne veut plus rien dire : on garde la
  // contrainte qui donne son sens à la mise en avant.
  var MAX_AVANT = 3;

  var OBJECTIFS_DEFAUT = {
    added: ['statut','tva-comprendre','cfe'],
    checks: { 'statut:0':true, 'statut:1':true, 'tva-comprendre:0':true },
  };
  function loadObjectifs(){
    try {
      var raw = localStorage.getItem('freehub_objectifs');
      if(raw){
        var o = JSON.parse(raw);
        return { added: Array.isArray(o.added) ? o.added : OBJECTIFS_DEFAUT.added.slice(),
                 checks: o.checks || {},
                 avant: Array.isArray(o.avant) ? o.avant : [] };
      }
    } catch(e){}
    return { added: OBJECTIFS_DEFAUT.added.slice(),
             checks: Object.assign({}, OBJECTIFS_DEFAUT.checks),
             avant: [] };
  }
  function saveObjectifs(){
    try {
      localStorage.setItem('freehub_objectifs',
        JSON.stringify({ added: state.added, checks: state.checks, avant: state.avant }));
    } catch(e){}
    pousserServeur();
  }

  function loadScenarios(){
    try {
      var raw = localStorage.getItem('freehub_scenarios');
      if(raw){ var a = JSON.parse(raw); if(Array.isArray(a)) return a; }
    } catch(e){}
    return [];
  }
  function saveScenarios(s){
    try { localStorage.setItem('freehub_scenarios', JSON.stringify(s.slice(0, 12))); } catch(e){}
    pousserServeur();
  }
  function loadHistTVA(){
    try {
      var raw = localStorage.getItem('freehub_hist_tva');
      if(raw){ var a = JSON.parse(raw); if(Array.isArray(a)) return a; }
    } catch(e){}
    return [];
  }
  function saveHistTVA(h){
    try { localStorage.setItem('freehub_hist_tva', JSON.stringify(h.slice(0, 20))); } catch(e){}
    pousserServeur();
  }

  // Statuts du simulateur : couleur, fond, icône, libellé.
  var STATUT = {
    vert:   { bg:'#16a34a', color:'#15803d', soft:'#dcfce7', icon:'✓', label:'A priori justifiable' },
    orange: { bg:'#f59e0b', color:'#c2410c', soft:'#ffedd5', icon:'!', label:'Possible sous conditions' },
    rouge:  { bg:'#dc2626', color:'#b91c1c', soft:'#fee2e2', icon:'✕', label:'Difficilement justifiable' },
    gris:   { bg:'#64748b', color:'#475569', soft:'#f1f5f9', icon:'?', label:'Analyse impossible en l’état' },
  };

  // Options des menus déroulants du formulaire (d'après le brief produit).
  // La micro relève de l'impôt sur le revenu, sans exception possible : l'IS
  // suppose une société (ou une EI qui a opté pour l'assimilation à une EURL,
  // ce qui la fait précisément sortir du régime micro).
  var REGIME_IS = 'Impôt sur les sociétés';
  var REGIME_IR = 'Impôt sur le revenu';
  // Volontairement plus stricte que estMicro(profil), qui range aussi l'EI
  // avec la micro : depuis 2022 une entreprise individuelle peut opter pour
  // l'IS, ce qui la fait sortir du régime micro. Interdire l'IS à une EI
  // serait donc faux. Ici, seule la micro proprement dite est visée.
  function formeExclutIS(forme){ return forme === 'Micro-entreprise'; }

  var SIM_OPTIONS = {
    forme: ['Micro-entreprise','Entreprise individuelle','EURL','SASU','SARL','SAS','Autre société','Je ne sais pas'],
    // L'IR d'abord : c'est le cas de loin le plus fréquent chez les
    // indépendants qui arrivent ici, et le seul possible en micro.
    regime: [REGIME_IR, REGIME_IS,'Je ne sais pas'],
    // Formulé du point de vue de l'utilisateur, pas du vocabulaire fiscal.
    tva: ['Je suis à la TVA','Je ne suis pas encore à la TVA','Je ne sais pas'],
    regimeTva: ['Régime réel simplifié','Régime réel normal','Franchise en base (pas de TVA)','Je ne sais pas'],
    usage: ['Exclusivement professionnelle','Majoritairement professionnelle','Mixte professionnelle et personnelle','Principalement personnelle','Je ne sais pas'],
    beneficiaire: ["L'entreprise",'Le dirigeant','Un salarié','Un client','Un prospect','Plusieurs personnes','Autre'],
    justificatif: ['Facture au nom de la société','Facture au nom du dirigeant','Ticket de caisse','Relevé bancaire uniquement','Aucun justificatif pour le moment'],
  };


  // Les 7 blocs du profil. Chaque bloc porte sa couleur, son icône, et la liste
  // des simulateurs qui s'en servent - pour que l'utilisateur sache pourquoi il
  // remplit un champ. `si` masque un bloc ou un champ hors contexte.
  // Les blocs du profil. Chaque bloc : sa couleur, son icône, ses champs, et un
  // résumé affiché quand il est replié. `si` masque un bloc ou un champ hors contexte.
  var PROFIL_SECTIONS = [
    {
      id:'identite', titre:'Profil', ico:'👤', color:'#db2777', soft:'#fdf2f8',
      resume:function(p){
        var n = ((p.prenom||'') + ' ' + (p.nom||'')).trim();
        return n ? n + (p.email ? ' · ' + p.email : '') : 'À compléter';
      },
      champs:[
        { k:'prenom', l:'Prénom', ph:'Louis' },
        { k:'nom', l:'Nom', ph:'Martin' },
        { k:'email', l:'Adresse e-mail', type:'email', ph:'louis@exemple.fr' },
        { k:'telephone', l:'Téléphone', type:'tel', ph:'06 12 34 56 78' },
      ],
      // Bloc spécial rendu à la main (photo + mot de passe).
      extra:'identite',
    },
    {
      id:'activite', titre:'Activité', ico:'🧑‍💻', color:'#2563eb', soft:'#eff5ff',
      resume:function(p){
        return (p.activite || 'À compléter') + ' · ' + valeurProfil('categorieFiscale');
      },
      champs:[
        { k:'activite', l:'Activité principale', large:true, ph:'Ex : monteur vidéo, consultant marketing…' },
        { k:'description', l:'Comment tu travailles', textarea:true, large:true,
          ph:'Ex : à distance pour des créateurs, depuis mon domicile…',
          aide:'Sert à l’analyse de tes dépenses : plus c’est précis, plus le verdict est juste.' },
        { k:'categorieFiscale', l:'Catégorie fiscale', lex:'abattement', large:true, options:[
            {v:'venteBIC', l:'Vente, restauration, hébergement (BIC)'},
            {v:'serviceBIC', l:'Prestations de services (BIC)'},
            {v:'bnc', l:'Activité libérale (BNC)'},
            {v:'inconnu', l:'Je ne sais pas'} ],
          aide:'Elle fixe ton abattement et le taux du versement libératoire.' },
      ],
    },
    {
      id:'structure', titre:'Structure', ico:'🏛', color:'#7c3aed', soft:'#f5f0ff',
      resume:function(p){ return (p.forme || 'À compléter') + ' · ' + (p.regime || ''); },
      champs:[
        { k:'forme', l:'Forme juridique', options:SIM_OPTIONS.forme.map(function(x){ return {v:x,l:x}; }) },
        { k:'regime', l:'Régime d’imposition', options:SIM_OPTIONS.regime.map(function(x){ return {v:x,l:x}; }) },
        { k:'versementLiberatoire', l:'Versement libératoire', lex:'vfl', si:estMicro, options:[
            {v:'non', l:'Non - barème progressif'}, {v:'oui', l:'Oui'} ] },
        { k:'periodeUrssaf', l:'Déclaration URSSAF', si:estMicro, large:true, options:[
            {v:'', l:'- je ne sais pas encore -'},
            {v:'mensuel', l:'Tous les mois'},
            {v:'trimestriel', l:'Tous les trimestres'} ],
          aide:'Tu l’as choisie à l’inscription. Elle est rappelée sur ton espace autoentrepreneur.urssaf.fr, et sert à placer tes échéances dans le calendrier.' },
      ],
    },
    {
      id:'ca', titre:'Chiffre d’affaires', ico:'📈', color:'#059669', soft:'#ecfdf5',
      resume:function(p){ return valeurProfil('ca'); },
      champs:[
        { k:'ca', l:'Montant encaissé', type:'number', ph:'60 000',
          aide:'Ce que tes clients te paient, avant cotisations et dépenses.' },
        { k:'periodeCa', l:'Période', options:[
            {v:'annuel', l:'par an'}, {v:'mensuel', l:'par mois'} ] },
      ],
    },
    {
      id:'tva', titre:'TVA et clients', ico:'🧾', color:'#0891b2', soft:'#ecfeff',
      resume:function(p){ return (p.tva || 'À compléter') + ' · clients ' + valeurProfil('clientele'); },
      champs:[
        { k:'tva', l:'Ta situation', lex:'franchise', large:true,
          options:SIM_OPTIONS.tva.map(function(x){ return {v:x,l:x}; }) },
        // Le régime ne se pose que si l'on est effectivement à la TVA.
        { k:'regimeTva', l:'Ton régime de TVA', large:true, si:estAssujettiTVA,
          options:SIM_OPTIONS.regimeTva.map(function(x){ return {v:x,l:x}; }),
          aide:'Il détermine la fréquence de tes déclarations. En cas de doute, regarde ton avis de situation ou demande à ton comptable.' },
        { k:'periodeTva', l:'Fréquence de tes déclarations de TVA', large:true, si:estAssujettiTVA,
          options:[
            {v:'', l:'- je ne sais pas encore -'},
            {v:'mensuel', l:'Tous les mois'},
            {v:'trimestriel', l:'Tous les trimestres'} ],
          aide:'Elle place tes déclarations dans le calendrier. La date limite exacte figure sur ton espace professionnel impots.gouv.fr : elle varie selon ton dossier.' },
        { k:'tauxVente', l:'Taux de TVA', large:true, options:TVA_PARAMS.tauxVente },
        { k:'clientRecup', l:'Clients qui récupèrent la TVA', type:'number', suffixe:'%',
          lex:'client-recup', aide:'En général, les entreprises assujetties à la TVA.' },
        { k:'clientProNon', l:'Clients qui ne la récupèrent pas', type:'number', suffixe:'%',
          lex:'client-non-recup', aide:'Particuliers, auto-entrepreneurs en franchise, associations.' },
      ],
      total:{ cles:['clientRecup','clientProNon'], attendu:100,
              l:'Répartition de ta clientèle' },
    },
    {
      id:'notifications', titre:'Rappels par e-mail', ico:'📬', color:'#0f9d6e', soft:'#effdf6',
      resume:function(){
        var n = state.notif.choix ? Object.keys(state.notif.choix)
          .filter(function(k){ return state.notif.choix[k]; }).length : 0;
        if(!state.notif.charge) return 'Chargement…';
        return n ? n + ' rappel' + (n > 1 ? 's activés' : ' activé') : 'Aucun rappel activé';
      },
      note:'On ne t’écrit que si tu l’as demandé. Tu peux tout couper en un clic.',
      champs:[],
      extra:'notifications',
    },
    {
      id:'foyer', titre:'Foyer fiscal', ico:'🏠', color:'#ca8a04', soft:'#fefce8',
      resume:function(p){
        return (p.parts || '1') + ' part' + (parseFloat(p.parts) > 1 ? 's' : '')
             + ' · autres revenus ' + valeurProfil('autresRevenus');
      },
      champs:[
        { k:'parts', l:'Parts fiscales', options:[
            {v:'1',l:'1'},{v:'1.5',l:'1,5'},{v:'2',l:'2'},{v:'2.5',l:'2,5'},
            {v:'3',l:'3'},{v:'3.5',l:'3,5'},{v:'4',l:'4'} ],
          aide:'Célibataire = 1 · Couple = 2 · + 0,5 par enfant.' },
        { k:'autresRevenus', l:'Autres revenus du foyer', type:'number', ph:'30 000',
          aide:'Hors ton activité : salaires, conjoint, pensions, foncier…' },
        { k:'rfr', l:'Revenu fiscal de référence N−2', lex:'rfr', type:'number', ph:'25 000',
          aide:'Sur ton avis d’impôt. Sert à vérifier ton éligibilité au versement libératoire.' },
        { k:'partsRfr', l:'Parts à cette année-là', options:[
            {v:'',l:'- même qu’aujourd’hui -'},
            {v:'1',l:'1'},{v:'1.5',l:'1,5'},{v:'2',l:'2'},{v:'2.5',l:'2,5'},
            {v:'3',l:'3'},{v:'3.5',l:'3,5'},{v:'4',l:'4'} ] },
        { k:'reductions', l:'Réductions et crédits d’impôt', type:'number', ph:'0',
          aide:'Emploi à domicile, garde d’enfants, dons…' },
      ],
    },
    {
      id:'remuneration', titre:'Rémunération', ico:'💶', color:'#4d7c0f', soft:'#f5fbe8',
      resume:function(p){
        // Parler de dividendes à un micro-entrepreneur n'a pas de sens.
        return estMicro(p)
          ? valeurProfil('remuneration') + ' · prélèvement libre'
          : valeurProfil('remuneration') + ' · ' + valeurProfil('dividendes') + ' en dividendes';
      },
      note:'Ce que tu te verses - ou ce que tu te verserais si tu passais en société.',
      champs:[
        { k:'remMensuelle', l:'Rémunération nette voulue', type:'number', ph:'3 000', suffixe:'€ / mois',
          aide:function(p){ return estMicro(p)
            ? 'En micro, tu prélèves librement : sers-t’en pour viser un montant, '
              + 'une fois cotisations et impôt mis de côté.' : ''; } },
        // Sans société, il n'y a ni dividende à distribuer ni trésorerie à y
        // laisser : ces deux questions ne veulent rien dire en micro.
        { k:'dividendes', l:'Bénéfices distribués en dividendes', lex:'dividendes', type:'number', ph:'100', suffixe:'%',
          si:estSociete, aide:'0 % = tout reste dans la société.' },
        { k:'tresorerie', l:'À laisser dans la société', lex:'tresorerie', type:'number', ph:'10 000', suffixe:'€ / an',
          si:estSociete, aide:'Ce matelas n’est pas distribué.' },
        { k:'cfe', l:'Ta CFE', lex:'cfe', type:'number', ph:'500', suffixe:'€ / an',
          aide:'Sur ton avis de CFE, dans ton espace impots.gouv. Très variable selon la commune.' },
      ],
    },
  ];
  // Petit utilitaire sûr : la valeur existe-t-elle en localStorage ?
  function localStorageOk(cle){
    try { return localStorage.getItem(cle) !== null; } catch(e){ return true; }
  }

  // ---------------------------------------------------------------------------
  // Modifications du profil : ne rien perdre en partant
  // ---------------------------------------------------------------------------
  // `profilSaved` sert au bandeau « ✓ Enregistré » et vaut false au démarrage :
  // il ne dit donc pas si quelque chose a réellement changé. D'où ce drapeau
  // distinct, seul à déclencher la question avant de quitter.
  function profilTouche(){
    state.profilSaved = false;
    state.profilDirty = true;
  }
  function profilEnregistrer(){
    saveProfil(state.profil);
    state.profilSaved = true;
    state.profilDirty = false;
    appliquerProfil();
  }
  // L'action demandée est mise en attente le temps de poser la question.
  function profilGarde(action){
    if(state.tab !== 'profil' || !state.profilDirty) return false;
    state.profilQuitter = action;
    render();
    return true;
  }

  function loadProfil(){
    try {
      var raw = localStorage.getItem('freehub_profil');
      if(raw) return migrerProfil(Object.assign({}, DEFAULT_PROFIL, JSON.parse(raw)));
    } catch(e){}
    return Object.assign({}, DEFAULT_PROFIL);
  }

  // Reprise des profils créés avant la simplification du bloc TVA :
  // trois catégories de clients sont devenues deux, et les libellés de
  // situation ont été reformulés du point de vue de l'utilisateur.
  var profilMigre = false;   // évite de réécrire le stockage à chaque lecture
  function migrerProfil(p){
    var avant = p.tva + '|' + p.clientProNon + '|' + p.clientParticuliers + '|' + p.regime;
    p = migrerProfilChamps(p);
    // Une fois migré, on réécrit le stockage : sinon les anciennes clés
    // repartiraient vers le compte à la prochaine synchronisation.
    if(!profilMigre && avant !== p.tva + '|' + p.clientProNon + '|' + p.clientParticuliers
                                 + '|' + p.regime){
      profilMigre = true;
      try { localStorage.setItem('freehub_profil', JSON.stringify(p)); } catch(e){}
    }
    return p;
  }

  function migrerProfilChamps(p){
    // Micro + IS : combinaison que l'interface laissait passer avant le
    // 11/08. Elle n'existe pas fiscalement et faussait les simulateurs.
    if(formeExclutIS(p.forme) && p.regime === REGIME_IS) p.regime = REGIME_IR;
    if(p.clientParticuliers !== undefined && p.clientParticuliers !== ''){
      p.clientProNon = String((parseFloat(p.clientProNon) || 0)
                            + (parseFloat(p.clientParticuliers) || 0));
      delete p.clientParticuliers;
    }
    var anciens = { 'Société assujettie à la TVA':'Je suis à la TVA',
                    'Franchise en base de TVA':'Je ne suis pas encore à la TVA' };
    if(anciens[p.tva]){
      if(p.tva === 'Franchise en base de TVA') p.regimeTva = 'Franchise en base (pas de TVA)';
      p.tva = anciens[p.tva];
    } else if(p.tva === 'Exonération particulière'){
      p.tva = 'Je ne sais pas';
    }
    return p;
  }
  function saveProfil(p){
    try { localStorage.setItem('freehub_profil', JSON.stringify(p)); } catch(e){}
    pousserServeur();
  }

  // ---------------------------------------------------------------------------
  // État
  // ---------------------------------------------------------------------------
  var state = {
    tab: 'accueil',
    objectifOuvert: null,   // objectif déplié dans l'onglet Mes objectifs
    added: loadObjectifs().added,
    checks: loadObjectifs().checks,
    avant: loadObjectifs().avant,   // ids mis en avant, dans l'ordre choisi
    drag: null,                     // id de la carte en cours de déplacement
    // Calendrier : vue courante, année, mois, et lundi de la semaine affichée
    cal: (function(){
      var n = new Date();
      var lundi = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7));
      return { vue:'annee', annee:n.getFullYear(), mois:n.getMonth(), semaine:lundi.getTime() };
    })(),
    retourVers: null,       // onglet d'où l'objectif a été ouvert
    badgeOuvert: null,      // badge dont la fiche est ouverte
    chat: { messages:[], charge:false, erreur:null, muet:null, admin:false,
            nonLus:0, nbSignales:0, moderation:null, empreinte:null,
            enLigne:0, total:0,
            fil:null, filMessages:[], filCharge:false, filClos:false, filErreur:null },
    chatCharte: false,      // charte d'accueil de l'Entraide (première visite)
    // `texte` et `email` vivent dans l'état et non dans le DOM : la bulle est
    // reconstruite à chaque rendu, un brouillon laissé dans le champ était
    // effacé au premier clic ailleurs (retour de testeur du 10/08).
    // Le brouillon est relu du stockage local : fermer l'onglet par mégarde ou
    // rafraîchir la page ne doit pas coûter un message à moitié écrit. La
    // péremption est vérifiée à la relecture, pas seulement en session.
    sav: (function(){
      var vide = { ouvert:false, envoi:false, envoye:false, erreur:null, type:null,
                   texte:'', email:'', grand:false, touche:0 };
      try {
        var brut = localStorage.getItem('freehub_sav_brouillon');
        if(!brut) return vide;
        var d = JSON.parse(brut);
        if(!d || !d.touche || Date.now() - d.touche >= 30 * 60 * 1000) return vide;
        vide.texte = typeof d.texte === 'string' ? d.texte : '';
        vide.email = typeof d.email === 'string' ? d.email : '';
        vide.type  = typeof d.type  === 'string' ? d.type  : null;
        vide.touche = d.touche;
      } catch(e){}
      return vide;
    })(),
    demandes: { chargees:false, enCours:false, liste:[], filtre:null },
    demandesNb: 0,          // réclamations en attente, pour la pastille admin
    sondageForm: false,     // formulaire « question de la semaine » (admin)
    sondageOuvert: false,   // la carte du sondage, repliée par défaut
    simIntro: null,         // simulateur dont on montre l'explication d'accueil
    // Suggestions de l'utilisateur retenues par la modération, à lui annoncer.
    annonces: { liste: [], deplie: false },
    savFils: [],            // ses réclamations qui ont reçu une réponse
    // Parrainage : code personnel, compteur, rang et podium.
    parrainage: { code:null, mes:0, rang:0, classement:[], charge:false, copie:false, quand:0 },
    pfAlerte: null,         // combinaison fiscale refusée, à expliquer
    // Orientation BIC/BNC. `null` sur activite/description = on n'a pas encore
    // touché aux champs, donc on affiche ceux du profil.
    categorie: { activite:null, description:null, enCours:false, erreur:null, resultat:null },
    profilDirty: false,     // des champs modifiés sans enregistrement
    profilQuitter: null,    // action mise en attente pendant la question
    // Préférences de rappels : chargées à l'ouverture du profil.
    notif: { charge:false, genres:[], choix:{}, confirme:false, email:'', envoi:false, sauve:0 },
    // Score de sérénité : le ressenti déclaré à l'onboarding, et le détail
    // ouvert ou non sur l'accueil.
    serenite: (function(){
      try { return { reponses: JSON.parse(localStorage.getItem('freehub_serenite') || '{}'),
                     detail:false, bilan:false }; }
      catch(e){ return { reponses:{}, detail:false, bilan:false }; }
    })(),
    // Sur mobile la barre latérale est un tiroir : elle démarre TOUJOURS fermée,
    // quelle que soit la préférence enregistrée sur ordinateur.
    sidePlie: (function(){
      try {
        if(window.matchMedia && window.matchMedia('(max-width:860px)').matches) return true;
        return localStorage.getItem('freehub_side_plie') === '1';
      } catch(e){ return false; }
    })(),
    badgePorte: (function(){
      try { return localStorage.getItem('freehub_badge_porte') || null; } catch(e){ return null; }
    })(),
    objFiltre: null,        // filtre du catalogue (pop-up)
    objFiltrePage: null,    // filtre de la page « Mes objectifs », indépendant
    objVoirFinis: false,    // afficher les objectifs déjà maîtrisés
    objectifsVus: false,    // le badge « New » disparaît une fois l'onglet ouvert
    lexEpingles: loadLexique(),  // ids des termes épinglés dans « mon lexique »
    lexRecherche: '',       // filtre de recherche du lexique
    // Guide des dépenses pro
    depFavoris: loadDepFavoris(),  // ids des dépenses mises en sélection
    depFiltre: 'tous',             // 'tous' | 'favoris' | une catégorie
    depRecherche: '',
    depOuvert: null,               // id de la fiche ouverte (pop-up)
    // Formulaire d'ajout aux charges, à l'intérieur de la fiche
    depAjout: { id:null, nom:'', frequence:'mensuelle', montant:'', erreur:'', fait:false, dernier:'' },
    depOnb: { actif:false, etape:0 },   // parcours d'accueil du guide (1re visite)
    lexFiltre: null,        // domaine filtré sur la page Lexique
    lexFiltreModal: null,   // domaine filtré dans la pop-up « Tous les mots »
    lexTousOuvert: false,   // pop-up du dictionnaire complet
    lexOuvert: null,        // id du terme dont la fiche est ouverte (pop-up)
    stepOuvert: null,       // index de l'étape dépliée (null = l'étape en cours)
    suiteAjout: null,       // {id, retour} : objectif suggéré qu'on vient d'ajouter
    catOpen: false,         // pop-up du catalogue d'objectifs
    // Onboarding au premier lancement : tant que le drapeau n'est pas posé.
    // L'onboarding reprend là où il s'est arrêté : fermer l'onglet ne permet
    // pas d'y échapper, on retombe sur la même question.
    onboarding: (function(){
      var repris = { actif: !localStorageOk('freehub_onboarded'), etape: 0, rep: {} };
      try {
        var brut = localStorage.getItem('freehub_onb_cours');
        if(brut && repris.actif){
          var d = JSON.parse(brut) || {};
          if(typeof d.etape === 'number') repris.etape = d.etape;
          if(d.rep) repris.rep = d.rep;
        }
      } catch(e){}
      return repris;
    })(),
    // Compte (optionnel) : null = déconnecté, sinon { email }.
    compte: null, authOpen: false, authMode: 'login', authErr: '', authBusy: false,
    syncEtat: '',           // '' | 'en cours' | 'ok' | 'erreur'
    // Badges & jalons
    badges: loadBadges(), faits: loadFaits(), badgeQueue: [], badgesInitialises: false,
    profil: loadProfil(),
    profilReturn: 'simulateur',
    profilSaved: false,
    profilSection: null,  // id de la section dépliée dans le profil
    importInfo: null,     // retour après un import de sauvegarde
    partOpen: null,       // index du partenaire dont la fiche est ouverte
    // Espace d'administration (chargé à la demande depuis le serveur)
    admin: { stats:null, chargement:false, erreur:'', msg:'', msgErr:false, busy:false },
    // Formulaire « devenir partenaire » (ouvert à tous).
    partForm: false, partFormBusy: false, partFormDone: false, partFormErr: '',
    historique: loadHistorique(),
    sim: {
      open: null,           // null = liste des simulateurs ; 'depenses' = simulateur ouvert
      step: 'form',         // form | result | error
      analyzing: false,     // pop-up « Analyse en cours »
      consent: false,
      consentOpen: false,   // pop-up d'avertissement avant l'analyse
      depenses: [ { nom:'', montant:'', motif:'' } ],
      coteMontant: '',      // « combien mettre de côté » : la somme encaissée
      formError: null,
      result: null,         // { depenses:[…], synthese:{…} }
      openResult: 0,        // index du résultat déplié
      error: null,
    },
    // Comparateur versement libératoire / impôt classique (100 % calculé, sans IA)
    vl: {
      step: 'form',         // form | result
      form: { annee:'2025', categorie:'', ca:'', caMensuel:false, autresRevenus:'',
              parts:'1', rfr:'', partsRfr:'', reductions:'' },
      result: null,
      formError: null,
      historique: loadHistVL(),
      onb: { actif:false, etape:0 },
      essai: false,            // société : on teste sans écrire dans le profil
    },
    // Simulateur « Optimiser ma société » - cockpit temps réel
    optim: {
      statut: 'eurl',          // eurl | sasu
      form: { caAnnuel:'80000', caMensuel:false, tva:'oui', remMensuelle:'3000',
              dividendes:'100', tresorerie:'10000', parts:'1', objectif:'revenu' },
      charges: [ { nom:'Logiciels et abonnements', montant:'180', frequence:'mensuelle',
                   tauxTVA:'0.2', deductible:'100', categorie:'fonctionnement' } ],
      leviers: { mutuelle:0, prevoyance:0, rcpro:0, per:0, ticketsResto:0, ik:0, bureau:0 },
      projection: null,
      scenarios: loadScenarios(),
      onb: { actif:false, etape:0 },
      essai: false,   // profil en micro : on teste le cockpit sans rien écrire
      outil: null,             // 'profil' | 'charges' | 'tableau' : modale d'outil ouverte
      importInfo: null,        // message après un import
    },
    // Simulateur « Quand passer en société ? » - recalcul en temps réel
    statut: {
      params: loadParams(),
      paramsSaved: false,
      mode: 'tous',            // eurl | sasu | tous
      form: { categorie:'bnc', caAnnuel:'48000', caMensuel:false, versementLiberatoire:'non',
              parts:'1', remMensuelle:'2500', dividendes:'100', investissement:'0' },
      charges: [ { nom:'Logiciels et abonnements', montant:'150', frequence:'mensuelle' } ],
      avance: false,           // panneau des paramètres fiscaux
      projection: null,        // CA du curseur (null = CA réel saisi)
      onb: { actif:false, etape:0 },
      essai: false,            // profil déjà en société : on teste sans rien écrire
      outil: null,             // 'profil' | 'charges' | 'tableau' : modale d'outil ouverte
    },
    // Simulateur de passage à la TVA (calcul déterministe, sans IA)
    tva: {
      step: 'form',
      // Parcours guidé : une pop-up centrée, pas un formulaire à remplir.
      onb: { actif:false, etape:0 },
      // Carte de saisie en cours et charges ajoutées pendant le parcours.
      brouillon: { nom:'', montant:'', frequence:'mensuelle', taux:'0.2' },
      brouillonErr: '',
      ajoutees: [],
      form: { franchise:'oui', exoneree:'non', ca:'', caMensuel:false, tauxVente:'0.2',
              partRecup:'', partProNon:'' },
      depenses: [ { nom:'', montant:'', frequence:'mensuelle', taux:'0.2', recup:'100', categorie:'' } ],
      result: null,
      formError: null,
      historique: loadHistTVA(),
    },
  };

  function setState(patch){
    Object.assign(state, patch); render(); majHistorique(); chatSondage();
  }

  // ---------------------------------------------------------------------------
  // L'écran courant, dans l'URL
  // ---------------------------------------------------------------------------
  // Tout l'état de navigation vivait en mémoire : un rafraîchissement renvoyait
  // à l'accueil, en perdant le parcours ou le simulateur ouvert. On l'écrit
  // donc dans le hash. `replaceState` et non `pushState` : aucune entrée
  // d'historique n'est ajoutée, la flèche « retour » reste réservée à la
  // fermeture d'un objectif (voir majHistorique juste au-dessus).
  // Les onglets d'administration sont volontairement absents : ils dépendent
  // d'un rôle connu seulement après la vérification de session.
  var ONGLETS_URL = ['accueil', 'objectifs', 'calendrier', 'simulateur', 'lexique',
                     'partenaires', 'chat', 'parrainage', 'succes', 'profil'];

  function ecrireHash(){
    // Pendant l'onboarding, il n'y a pas d'écran à retrouver.
    if(state.onboarding && state.onboarding.actif) return;
    if(ONGLETS_URL.indexOf(state.tab) < 0) return;
    var h = state.tab;
    if(state.tab === 'objectifs' && state.objectifOuvert) h += '/' + state.objectifOuvert;
    if(state.tab === 'simulateur' && state.sim.open)      h += '/' + state.sim.open;
    if(location.hash === '#' + h) return;
    try { history.replaceState(history.state, '', '#' + h); } catch(e){}
  }

  // Le hash vient de l'utilisateur : chaque valeur est vérifiée contre le
  // catalogue avant d'être posée dans l'état.
  function lireHash(){
    var brut = (location.hash || '').replace(/^#/, '');
    if(!brut) return;
    var bouts = brut.split('/');
    var onglet = bouts[0], detail = bouts[1] || null;
    if(ONGLETS_URL.indexOf(onglet) < 0) return;
    state.tab = onglet;
    if(onglet === 'objectifs' && detail && obj(detail)){
      state.objectifOuvert = detail;
    }
    if(onglet === 'simulateur' && detail && SIM_INTRO[detail]){
      state.sim.open = detail;
      state.sim.step = 'form';
    }
  }

  // Historique du navigateur : on n'y pousse qu'une chose, l'ouverture d'un
  // objectif. C'est le seul endroit où l'utilisateur s'attend à ce que la
  // flèche « retour » le ramène à l'écran précédent plutôt que de sortir.
  var histObjectif = false;
  function majHistorique(){
    var ouvert = state.tab === 'objectifs' && !!state.objectifOuvert;
    if(ouvert && !histObjectif){
      try { history.pushState({ fh:'objectif' }, ''); } catch(e){}
      histObjectif = true;
    } else if(!ouvert && histObjectif){
      // Fermé par l'interface : on retire l'entrée qu'on avait ajoutée, sinon
      // il faudrait deux « retour » pour sortir vraiment.
      histObjectif = false;
      try { if(history.state && history.state.fh === 'objectif') history.back(); } catch(e){}
    }
  }
  window.addEventListener('popstate', function(){
    if(!histObjectif) return;
    histObjectif = false;
    if(state.objectifOuvert){
      Object.assign(state, { objectifOuvert:null, stepOuvert:null,
                             tab: state.retourVers || 'objectifs', retourVers:null });
      render();
    }
  });

  // ---------------------------------------------------------------------------
  // Compte & synchronisation (optionnels - l'app marche sans)
  // ---------------------------------------------------------------------------
  function apiJson(method, path, body){
    return fetch(path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    }).then(function(r){
      return r.json().then(function(d){ return { ok:r.ok, status:r.status, data:d }; },
                           function(){ return { ok:r.ok, status:r.status, data:{} }; });
    });
  }

  // Le paquet synchronisé = les mêmes clés que l'export de sauvegarde.
  function paquetLocal(){
    var d = {};
    CLES_SAUVEGARDE.forEach(function(k){
      var v = null; try { v = localStorage.getItem(k); } catch(e){}
      if(v !== null) d[k] = v;
    });
    return d;
  }

  var syncTimer = null;
  // Envoi différé : on regroupe les changements rapprochés en un seul envoi.
  function pousserServeur(){
    if(!state.compte) return;
    if(syncTimer) clearTimeout(syncTimer);
    var badge = document.querySelector('.compte-sync');
    if(badge){ badge.textContent = '⟳ Synchronisation…'; }
    syncTimer = setTimeout(function(){
      apiJson('PUT', 'api/data', { donnees: paquetLocal() }).then(function(res){
        state.syncEtat = res.ok ? 'ok' : 'erreur';
        var b = document.querySelector('.compte-sync');
        if(b) b.textContent = res.ok ? '✓ Synchronisé' : '⚠ Synchro impossible';
      }, function(){
        state.syncEtat = 'erreur';
        var b = document.querySelector('.compte-sync');
        if(b) b.textContent = '⚠ Synchro impossible';
      });
    }, 900);
  }

  // Applique un paquet reçu du serveur au stockage local, puis recharge l'état.
  function appliquerPaquet(donnees){
    Object.keys(donnees || {}).forEach(function(k){
      if(CLES_SAUVEGARDE.indexOf(k) < 0) return;
      try { localStorage.setItem(k, donnees[k]); } catch(e){}
    });
    state.profil = loadProfil();
    // Le paquet vient du compte et peut donc contenir un profil d'avant une
    // migration. loadProfil() le normalise en mémoire mais ne réécrit qu'une
    // fois par session : sans ça, la version périmée resterait en stockage et
    // repartirait telle quelle à la synchronisation suivante.
    try {
      localStorage.setItem('freehub_profil', JSON.stringify(state.profil));
    } catch(e){}
    var ob = loadObjectifs(); state.added = ob.added; state.checks = ob.checks;
    state.avant = ob.avant;
    state.historique = loadHistorique();
    state.vl.historique = loadHistVL();
    state.tva.historique = loadHistTVA();
    state.optim.scenarios = loadScenarios();
    state.statut.params = loadParams();
    state.lexEpingles = loadLexique();
    state.depFavoris = loadDepFavoris();
    state.badges = loadBadges();
    state.faits = loadFaits();
    // Le questionnaire d'arrivée a déjà été rempli sur un autre appareil ? On le
    // referme au lieu de le rejouer.
    if(localStorageOk('freehub_onboarded')) state.onboarding.actif = false;
    appliquerProfil();
  }

  // Reprend l'identité du compte dans le profil : prénom et nom sont saisis à
  // l'inscription (landing), donc jamais redemandés dans l'onboarding.
  function identiteDepuisCompte(c){
    var p = state.profil, change = false;
    if(c.prenom && !(p.prenom || '').trim()){ p.prenom = c.prenom; change = true; }
    if(c.nom    && !(p.nom || '').trim()){    p.nom    = c.nom;    change = true; }
    if(c.email  && !(p.email || '').trim()){  p.email  = c.email;  change = true; }
    if(change) saveProfil(p);
  }

  // Au chargement : y a-t-il une session ouverte ? Si oui, on tire les données.
  // Sinon, un visiteur arrivé sur /app sans compte ni données locales est
  // renvoyé vers la landing (le point d'entrée public).
  function verifierSession(){
    apiJson('GET', 'api/auth/me').then(function(res){
      if(!res.ok){
        if(!aDesDonneesLocales()) window.location.replace('./');
        return;
      }
      state.compte = { email: res.data.email, prenom: res.data.prenom, nom: res.data.nom,
                       isAdmin: !!res.data.isAdmin, beta: !!res.data.beta };
      identiteDepuisCompte(state.compte);
      annoncesCharger();   // « ta suggestion a été retenue », s'il y en a
      savFilsCharger();    // et les échanges qui attendent une lecture
      // Un premier relevé du salon : il alimente le compteur de non-lus et
      // met le sondage en mémoire, pour qu'il soit déjà là en arrivant.
      // Le relevé a lieu MÊME quand on est déjà sur l'Entraide : arriver
      // directement sur #chat (un F5, un lien) ne passe pas par le clic
      // d'onglet, et le fil restait bloqué sur son squelette.
      chatCharger(state.tab !== 'chat');
      chatVeille();
      parrainageVeille();
      parrainageRattraper();
      demandesVeille();      // sans effet hors compte administrateur
      apiJson('GET', 'api/data').then(function(d){
        // Marqueur de remise à zéro posé côté serveur : on efface TOUT le
        // stockage local (sinon il ré-ensemencerait le compte aussitôt) et on
        // repart comme à la première visite, onboarding compris.
        if(d.ok && d.data.donnees && d.data.donnees.freehub_reset){
          var razVue = null;
          try { razVue = localStorage.getItem('freehub_reset_vu'); } catch(e){}
          if(d.data.donnees.freehub_reset !== razVue){
            remiseAZeroLocale(d.data.donnees.freehub_reset);
            return;
          }
        }
        if(d.ok && d.data.donnees && Object.keys(d.data.donnees).length){
          appliquerPaquet(d.data.donnees);
          identiteDepuisCompte(state.compte);   // le compte fait foi pour l'identité
        } else {
          pousserServeur();   // compte vide : on l'ensemence avec le local
        }
        state.syncEtat = 'ok';
        render();
      });
    }, function(){ /* serveur injoignable : on reste en local */ });
  }

  // Remise à zéro « usine », déclenchée par le serveur : tout le stockage
  // local saute (sauf le thème), puis la page se recharge sur un état neuf.
  function remiseAZeroLocale(marqueur){
    try {
      CLES_SAUVEGARDE.forEach(function(k){ localStorage.removeItem(k); });
      ['freehub_chat_onb', 'freehub_side_plie'].forEach(function(k){
        localStorage.removeItem(k);
      });
      localStorage.setItem('freehub_reset_vu', marqueur);
    } catch(e){}
    window.location.reload();
  }

  // Y a-t-il déjà un usage local ? Le drapeau est relevé AVANT le premier rendu
  // (voir plus bas) : le rendu lui-même écrit des clés - les badges notamment -
  // qui fausseraient la mesure. Sert à ne pas éjecter vers la landing quelqu'un
  // qui utilise l'outil sans compte.
  function aDesDonneesLocales(){ return usageLocalInitial; }

  // ---------------------------------------------------------------------------
  // Profil → simulateurs
  // ---------------------------------------------------------------------------
  // Appelée à l'ouverture d'un simulateur et à l'enregistrement du profil.
  // Tout ce qui vient d'ici a disparu des formulaires : c'est le cœur de la
  // promesse « on ne te redemande jamais deux fois la même chose ».
  function appliquerProfil(){
    var p = state.profil;
    // La CFE du profil remplace l'estimation par défaut (ta feuille la laisse
    // en case rouge : c'est bien une donnée propre à chaque entreprise).
    var cfeProfil = parseFloat(p.cfe);
    if(cfeProfil >= 0 && String(p.cfe).trim() !== '') state.statut.params.cfe = cfeProfil;
    var caAn = String(caProfilAnnuel(p) || '');
    var franchise = /franchise/i.test(p.tva) ? 'oui'
                  : (/assujettie/i.test(p.tva) ? 'non' : 'inconnu');

    // 2 · Versement libératoire
    Object.assign(state.vl.form, {
      categorie: p.categorieFiscale || '',
      ca: caAn, caMensuel: false,
      autresRevenus: p.autresRevenus, parts: p.parts,
      rfr: p.rfr, partsRfr: p.partsRfr || p.parts, reductions: p.reductions,
    });

    // 3 · Passage à la TVA
    Object.assign(state.tva.form, {
      franchise: franchise,
      exoneree: /exonération/i.test(p.tva) ? 'oui' : 'non',
      ca: caAn, caMensuel: false,
      tauxVente: p.tauxVente,
      partRecup: p.clientRecup, partProNon: p.clientProNon,
    });
    state.tva.depenses = (p.charges || []).map(function(c){
      return { nom:c.nom, montant:c.montant, frequence:c.frequence,
               taux:c.tauxTVA, recup:c.deductible, categorie:c.categorie };
    });
    if(!state.tva.depenses.length){
      state.tva.depenses = [ { nom:'', montant:'', frequence:'mensuelle',
                               taux:'0.2', recup:'100', categorie:'' } ];
    }

    // 4 · Quand passer en société
    Object.assign(state.statut.form, {
      categorie: p.categorieFiscale === 'inconnu' ? 'bnc' : (p.categorieFiscale || 'bnc'),
      caAnnuel: caAn, caMensuel: false,
      versementLiberatoire: p.versementLiberatoire,
      parts: p.parts, remMensuelle: p.remMensuelle, dividendes: p.dividendes,
    });
    state.statut.charges = (p.charges || []).map(function(c){
      return { nom:c.nom, montant:c.montant, frequence:c.frequence };
    });

    // 5 · Optimiser ma société
    if(/sasu|^sas$/i.test(p.forme)) state.optim.statut = 'sasu';
    else if(/eurl|sarl/i.test(p.forme)) state.optim.statut = 'eurl';
    Object.assign(state.optim.form, {
      caAnnuel: caAn, caMensuel: false,
      tva: franchise === 'oui' ? 'non' : 'oui',
      parts: p.parts, remMensuelle: p.remMensuelle,
      dividendes: p.dividendes, tresorerie: p.tresorerie,
    });
    state.optim.charges = (p.charges || []).map(function(c){
      return { nom:c.nom, montant:c.montant, frequence:c.frequence,
               tauxTVA:c.tauxTVA, deductible:c.deductible,
               categorie:c.categorie, source:c.source };
    });
  }

  // Rappel compact du profil, en tête de chaque simulateur : ce qui a été repris
  // et un accès direct pour le corriger. `cles` = champs à montrer.
  var PROFIL_LIBELLES = {
    activite:'Activité', categorieFiscale:'Catégorie', forme:'Forme', regime:'Régime',
    versementLiberatoire:'Versement libératoire', ca:'Chiffre d’affaires', tva:'TVA',
    tauxVente:'Taux de TVA', clientele:'Clientèle', parts:'Parts fiscales',
    autresRevenus:'Autres revenus', rfr:'RFR N−2', remuneration:'Rémunération',
    dividendes:'Dividendes', tresorerie:'Trésorerie gardée', charges:'Charges',
  };

  function valeurProfil(k){
    var p = state.profil;
    switch(k){
      case 'ca': return fmtEur(caProfilAnnuel(p)) + ' / an';
      case 'categorieFiscale': {
        var m = { venteBIC:'Vente (BIC)', serviceBIC:'Services (BIC)',
                  bnc:'Libéral (BNC)', inconnu:'Non précisée' };
        return m[p.categorieFiscale] || 'Non précisée';
      }
      case 'tauxVente': return fmtPct(parseFloat(p.tauxVente) || 0);
      case 'clientele': return (p.clientRecup||0)+'% récup / '+(p.clientProNon||0)+'% non';
      case 'remuneration': return fmtEur(p.remMensuelle) + ' / mois';
      case 'dividendes': return (p.dividendes || 0) + ' %';
      case 'tresorerie': return fmtEur(p.tresorerie) + ' / an';
      case 'cfe': return String(p.cfe).trim() ? fmtEur(p.cfe) + ' / an' : 'Estimée à ' + fmtEur(STATUT_PARAMS.cfe);
      case 'charges': {
        var n = (p.charges || []).length;
        var t = (p.charges || []).reduce(function(a, c){
          return a + annualiser(parseFloat(c.montant) || 0, c.frequence); }, 0);
        return n + (n > 1 ? ' charges · ' : ' charge · ') + fmtEur(t) + ' / an';
      }
      case 'versementLiberatoire': return p.versementLiberatoire === 'oui' ? 'Oui' : 'Non';
      case 'autresRevenus': return p.autresRevenus ? fmtEur(p.autresRevenus) + ' / an' : 'Non renseigné';
      case 'rfr': return p.rfr ? fmtEur(p.rfr) : 'Non renseigné';
      default: return String(p[k] || 'Non renseigné');
    }
  }

  // Sections du profil dont chaque simulateur a besoin, pour l'alerte ciblée.
  var BESOINS_SIM = {
    depenses: ['activite','structure'],
    vl:       ['activite','ca','foyer'],
    tva:      ['tva','ca','charges'],
    statut:   ['activite','ca','foyer','remuneration','charges'],
    optim:    ['structure','ca','remuneration','charges'],
  };

  function profilBandeHtml(cles){
    var items = cles.map(function(k){
      return '<div class="pb-item"><span class="pb-k">'+esc(PROFIL_LIBELLES[k] || k)+'</span>'
        + '<span class="pb-v">'+esc(valeurProfil(k))+'</span></div>';
    }).join('');

    // Ce qui manque pour que CE simulateur soit fiable.
    var besoins = BESOINS_SIM[state.sim.open] || [];
    var secs = sectionsProfil();
    var manque = secs.filter(function(s){ return besoins.indexOf(s.id) >= 0 && !s.fiable; });
    var champsManquants = [];
    manque.forEach(function(s){ champsManquants = champsManquants.concat(s.bloquants); });
    var alerte = champsManquants.length
      ? '<div class="pb-manque">⚠ À compléter pour un résultat fiable : <strong>'
        + champsManquants.map(esc).join(', ') + '</strong></div>'
      : '';

    return '<div class="pbande'+(manque.length?' incomplet':'')+'">'
      + '<div class="pbande-h"><span class="pbande-ico">🗂</span>'
        + '<span class="pbande-t">D’après ton profil</span>'
        + '<button class="pbande-btn" data-action="open-profil">Modifier →</button></div>'
      + '<div class="pb-items">'+items+'</div>'
      + alerte
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function obj(id){ return catalog.find(function(c){ return c.id === id; }); }
  function pctOf(id){
    var o = obj(id);
    var done = o.steps.filter(function(_, i){ return state.checks[id+':'+i]; }).length;
    return { done:done, total:o.steps.length, pct:Math.round(done / o.steps.length * 100) };
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------
  // Icônes de nav : traits fins, monochromes (currentColor) - plus sobres que
  // des emojis colorés sur le fond bleu nuit.
  var NAV_ICONES = {
    accueil:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/>',
    objectifs:  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
    simulateur: '<line x1="4" y1="7.5" x2="20" y2="7.5"/><circle cx="9" cy="7.5" r="2.3"/>'
              + '<line x1="4" y1="16.5" x2="20" y2="16.5"/><circle cx="15" cy="16.5" r="2.3"/>',
    partenaires:'<circle cx="9" cy="9" r="3"/><path d="M3.6 19c0-3 2.4-5 5.4-5s5.4 2 5.4 5"/>'
              + '<path d="M16 6.6a3 3 0 0 1 0 5.6"/><path d="M17 14.2c2.1.5 3.6 2.2 3.6 4.6"/>',
    lexique:    '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/>'
              + '<line x1="9" y1="8" x2="14" y2="8"/>',
    calendrier: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><line x1="3.5" y1="9" x2="20.5" y2="9"/>'
              + '<line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/>',
    chat:       '<path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.7-.36L4.5 20.5l1.3-3.6'
              + 'A6.8 6.8 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2z"/>',
    sav:        '<path d="M4 6.5h16v11H4z"/><path d="M4 7l8 6 8-6"/>',
    succes:     '<path d="M7 4h10v3.6a5 5 0 0 1-10 0z"/>'
              + '<path d="M7 5H4.7a2.9 2.9 0 0 0 3 2.9M17 5h2.3a2.9 2.9 0 0 1-3 2.9"/>'
              + '<path d="M12 12.6V16M10 16h4l.7 3.5H9.3z"/><path d="M8.3 19.5h7.4"/>',
    // Classement : trois barres de podium, la plus haute au milieu.
    parrainage: '<rect x="9.6" y="7" width="4.8" height="13"/>'
              + '<rect x="3.5" y="12" width="4.8" height="8"/>'
              + '<rect x="15.7" y="14.5" width="4.8" height="5.5"/>',
    // Espace admin : un bouclier, pour marquer l'accès restreint.
    admin:      '<path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6z"/>'
              + '<path d="M9.2 12.2l2 2 3.6-3.9"/>',
  };
  function navHtml(){
    var tabs = [ {key:'accueil',label:'Accueil'}, {key:'objectifs',label:'Mes objectifs'},
                 {key:'calendrier',label:'Calendrier'},
                 {key:'simulateur',label:'Simulateur'}, {key:'lexique',label:'Lexique'},
                 {key:'partenaires',label:'Nos partenaires'} ];
    // L'entraide vit à part : c'est le seul endroit où l'on croise d'autres
    // personnes, autant que la navigation le dise.
    tabs.push({ key:'chat', label:'Entraide', section:'Social', alpha:true });
    tabs.push({ key:'parrainage', label:'Classement', alpha:true });
    tabs.push({ key:'succes', label:'Récompenses', alpha:true });
    // Espace admin : tout en bas, et seulement pour les comptes administrateurs.
    // (L'API vérifie de toute façon le rôle côté serveur.)
    if(state.compte && state.compte.isAdmin){
      tabs.push({ key:'admin', label:'Dashboard', section:'Admin' });
      tabs.push({ key:'sav', label:'Réclamations' });
    }
    return tabs.map(function(t){
      var on = state.tab === t.key;
      return (t.section ? '<div class="nav-sec">'+esc(t.section)+'</div>' : '')
        + '<button class="nav-row'+(on?' on':'')
        + (t.key==='admin' || t.key==='sav' ?' nav-admin':'')
        + (t.key==='chat'?' nav-chat':'')
        + '" data-action="tab" data-tab="'+t.key+'">'
        + '<span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
          + 'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+NAV_ICONES[t.key]+'</svg></span>'
        + '<span class="nav-text">'+esc(t.label)+'</span>'
        + '<span class="nav-tip">'+esc(t.label)+'</span>'
        + ((t.key === 'objectifs' && objectifsNouveaux().length)
           || (t.key === 'partenaires' && partenairesNouveaux().length)
           || (t.key === 'simulateur' && simulateurNeuf())
           || (t.key === 'parrainage' && parrainageNeuf())
           || (t.key === 'accueil' && accueilNeuf())
            ? '<span class="nav-badge">New</span>' : '')
        // L'étiquette est toujours posée ; render() la masque sur les lignes
        // qui portent déjà un « New » ou un compteur.
        + (t.alpha ? '<span class="nav-badge alpha">Alpha</span>' : '')
        + (t.key === 'chat' && state.chat.nonLus
            ? '<span class="nav-pastille">'+state.chat.nonLus+'</span>' : '')
        + (t.key === 'succes' && badgesNonVus()
            ? '<span class="nav-pastille">'+badgesNonVus()+'</span>' : '')
        + (t.key === 'sav' && state.demandesNb
            ? '<span class="nav-pastille">'+state.demandesNb+'</span>' : '')
        + '</button>';
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Accueil - « où j'en suis ? » en un écran
  // ---------------------------------------------------------------------------
  // Échéances récurrentes. On ne met ici QUE des dates déjà affirmées ailleurs
  // dans l'app : pas d'échéance inventée. `objectif` relie au parcours associé.
  var ECHEANCES = [
    { jour:30, mois:9,  titre:'Demande de versement libératoire',
      note:'Pour en bénéficier l’année suivante.', objectif:'vfl' },
    { jour:15, mois:12, titre:'Paiement de la CFE',
      note:'Dans ton espace pro sur impots.gouv.', objectif:'cfe' },
  ];

  function prochaineEcheance(){
    var now = new Date();
    var candidates = ECHEANCES.map(function(e){
      var d = new Date(now.getFullYear(), e.mois - 1, e.jour);
      if(d < now) d = new Date(now.getFullYear() + 1, e.mois - 1, e.jour);
      return { e:e, date:d, jours:Math.ceil((d - now) / 86400000) };
    }).sort(function(a, b){ return a.date - b.date; });
    return candidates[0] || null;
  }

  // Le net estimé part du profil et du statut déclaré : c'est le chiffre que
  // l'utilisateur veut voir en premier en ouvrant l'app.
  function netEstime(caOverride){
    var p = state.profil;
    var ca = (caOverride != null && caOverride > 0) ? caOverride : caProfilAnnuel(p);
    if(!(ca > 0)) return null;
    var f = {
      categorie: p.categorieFiscale === 'inconnu' ? 'bnc' : (p.categorieFiscale || 'bnc'),
      parts: p.parts || '1',
      chargesAnnuelles: (p.charges || []).reduce(function(a, c){
        return a + annualiser(parseFloat(c.montant) || 0, c.frequence); }, 0),
      investissement: 0,
      remMensuelle: p.remMensuelle, dividendes: p.dividendes,
      versementLiberatoire: p.versementLiberatoire,
    };
    var r = calculerStatuts(f, ca);
    var cle = estMicro(p) ? 'micro' : (/sasu|^sas$/i.test(p.forme) ? 'sasu' : 'eurl');
    return { ca:ca, cle:cle, res:r[cle], tous:r,
             label: STATUT_LABELS[cle] || cle,
             part: ca > 0 ? Math.round(r[cle].net / ca * 100) : 0 };
  }

  // Met à jour le hero en direct pendant le glissement, sans re-render : sinon
  // le curseur perdrait le focus à chaque cran.
  function majAccueilProjection(ca){
    var n = netEstime(ca);
    if(!n) return;
    var host = document.querySelector('.acc-hero');
    if(!host) return;
    var reel = caProfilAnnuel(state.profil);
    var proj = Math.round(ca) !== Math.round(reel);
    host.querySelector('.acc-hero-n').innerHTML = fmtEur(n.res.net / 12) + '<span> / mois</span>';
    host.querySelector('.acc-hero-s').textContent = 'soit ' + fmtEur(n.res.net)
      + ' sur l’année, sur ' + fmtEur(ca) + ' encaissés';
    host.querySelector('.acc-hero-r').innerHTML = anneauCa(n.res, ca, 132);
    host.querySelector('.acc-slider-val').textContent = fmtEur(ca);
    var badge = host.querySelector('.acc-proj-badge');
    if(badge) badge.style.display = proj ? 'inline-flex' : 'none';
  }

  // L'étape précise où l'on s'est arrêté : c'est ce qu'on veut voir en arrivant,
  // plus qu'un résumé de progression.
  function repriseHtml(){
    var candidats = state.added.filter(function(id){
      return obj(id) && etatObjectif(id) !== 'fait';
    });
    // On privilégie ce qui est mis en avant, puis ce qui est déjà entamé.
    candidats.sort(function(a, b){
      var pa = (state.avant.indexOf(a) >= 0 ? 0 : 2) + (pctOf(a).done ? 0 : 1);
      var pb = (state.avant.indexOf(b) >= 0 ? 0 : 2) + (pctOf(b).done ? 0 : 1);
      return pa - pb;
    });
    var id = candidats[0];
    if(!id) return '';
    var o = obj(id), pr = pctOf(id), d = dom(o);
    var st = o.steps[pr.done];
    if(!st) return '';
    return '<button class="acc-reprise" style="--c:'+d.c+';--s:'+d.soft+'"'
      + ' data-action="view" data-id="'+id+'">'
      + '<span class="acc-reprise-illu">'+illustrationHtml(st.illu)+'</span>'
      + '<span class="acc-reprise-x">'
        + '<span class="acc-reprise-l">'+(pr.done ? 'Tu en étais là' : 'On commence par là')
          + ' · '+esc(o.title)+'</span>'
        + '<span class="acc-reprise-t">'+esc(st.t)+'</span>'
        + '<span class="acc-reprise-d">'+esc(st.h)
          + (st.duree ? ' · '+esc(st.duree) : '')+'</span>'
      + '</span>'
      + '<span class="acc-reprise-cta">Reprendre →</span>'
    + '</button>';
  }

  // Portes d'entrée choisies selon l'état réel du compte, pas une liste figée.
  function portesHtml(){
    var p = state.profil, portes = [];
    var pctP = (function(){
      var secs = sectionsProfil();
      var f = secs.reduce(function(a, s){ return a + s.faits; }, 0);
      var t = secs.reduce(function(a, s){ return a + s.total; }, 0);
      return t ? Math.round(f / t * 100) : 100;
    })();

    if(pctP < 100) portes.push({ ico:'👤', c:'#7c3aed', t:'Compléter mon profil',
      d:'Il manque '+(100 - pctP)+' % d’informations pour que les simulateurs soient justes',
      action:'open-profil' });

    if(!state.faits['sim:depenses']) portes.push({ ico:'🧾', c:'#0f9d6e',
      t:'Ce qui passe en charge', d:'49 dépenses passées en revue, avec un avis pour chacune',
      action:'goto-sim', sim:'depenses' });

    if(estMicro(p) && !state.faits['sim:vl']) portes.push({ ico:'📊', c:'#b45309',
      t:'Versement libératoire ou pas', d:'La comparaison sur tes vrais chiffres, en deux minutes',
      action:'goto-sim', sim:'vl' });

    if(estSociete(p) && !state.faits['sim:optim']) portes.push({ ico:'🎛', c:'#0f9d6e',
      t:'Rémunération et dividendes', d:'Trouver l’équilibre entre ton net et ta société',
      action:'goto-sim', sim:'optim' });

    if(state.lexEpingles.length < 3) portes.push({ ico:'📖', c:'#0891b2',
      t:'Les mots qui bloquent', d:'Abattement, PFU, Kbis : expliqués sans jargon',
      action:'tab', tab:'lexique' });

    var nbDispo = catalog.filter(function(o){ return state.added.indexOf(o.id) < 0; }).length;
    if(nbDispo) portes.push({ ico:'🎯', c:'#2f6bff', t:'Choisir un nouvel objectif',
      d:nbDispo+' parcours guidés, on avance étape par étape',
      action:'tab', tab:'objectifs' });

    if(!state.compte) portes.push({ ico:'☁️', c:'#4a6180', t:'Mettre tout à l’abri',
      d:'Un compte, et tes données te suivent d’un ordinateur à l’autre',
      action:'auth-open' });

    if(!portes.length) return '';
    return '<div class="acc-sec">'
      + '<div class="acc-sec-h">Par où on continue ?</div>'
      + '<div class="acc-portes">'+portes.slice(0, 4).map(function(x){
          return '<button class="acc-porte" style="--c:'+x.c+'" data-action="'+x.action+'"'
            + (x.sim ? ' data-sim="'+x.sim+'"' : '')
            + (x.tab ? ' data-tab="'+x.tab+'"' : '')+'>'
            + '<span class="acc-porte-i">'+x.ico+'</span>'
            + '<span class="acc-porte-t">'+esc(x.t)+'</span>'
            + '<span class="acc-porte-d">'+esc(x.d)+'</span>'
            + '<span class="acc-porte-f">→</span>'
          + '</button>';
        }).join('')+'</div>'
    + '</div>';
  }

  // Dire bonjour comme on le dirait vraiment, selon l'heure qu'il est.
  function salutation(){
    var h = new Date().getHours();
    if(h < 6)  return 'Bonsoir';
    if(h < 13) return 'Bonjour';
    if(h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  // Le mot du jour. Volontairement sans aucun chiffre ni règle fiscale : ces
  // phrases changent tous les jours et ne sont pas datées, elles n'ont donc
  // rien à faire de la loi de finances. Elles parlent de méthode et de moral,
  // ce qui est justement ce qui manque quand on ouvre son administratif.
  var MOTS_DU_JOUR = [
    'L’administratif n’est pas un test d’intelligence. C’est une suite d’habitudes.',
    'Une tâche ouverte pèse plus lourd qu’une tâche faite. Commence par la plus courte.',
    'Tu n’as pas à tout comprendre aujourd’hui. Juste la prochaine étape.',
    'Personne ne naît en sachant lire un avis d’imposition. Ça s’apprend, comme le reste.',
    'Dix minutes maintenant valent mieux qu’une soirée entière la veille de l’échéance.',
    'Le bon réflexe : noter la question qui t’angoisse, puis aller chercher la réponse.',
    'Ranger ses justificatifs au fil de l’eau, c’est se rendre service à soi-même dans six mois.',
    'Un doute sur une dépense ? Mieux vaut le lever tout de suite que le porter toute l’année.',
    'Ton temps de travail facturable n’est pas ton seul temps utile. Celui-ci compte aussi.',
    'La sérénité, ce n’est pas tout savoir. C’est savoir où regarder.',
    'Avancer d’une étape par semaine, c’est cinquante-deux étapes dans l’année.',
    'Le pire moment pour découvrir une obligation, c’est le jour de l’échéance.',
    'Se tromper puis corriger fait partie du métier. L’administration prévoit ça.',
    'Tu gères une entreprise. Le fait qu’elle soit petite ne la rend pas moins réelle.',
    'Un chiffre que tu ne comprends pas est un chiffre qu’il faut poser à quelqu’un.',
    'Ce qui est écrit quelque part n’a plus besoin d’être retenu.',
    'La question bête n’existe pas. L’Entraide est là pour ça.',
    'Fais le point une fois par mois plutôt que de tout revérifier une fois par an.',
    'Facturer, relancer, encaisser : la troisième étape compte autant que la première.',
    'Ce que tu mets en place aujourd’hui, tu ne le remettras plus jamais en place.',
    'Un statut n’est pas un engagement à vie. Il se change quand il ne colle plus.',
    'Le meilleur outil est celui que tu rouvriras la semaine prochaine.',
    'Mettre un montant de côté chaque mois évite d’avoir à en trouver un d’un coup.',
    'Tu n’es pas en retard. Tu es en train de t’y mettre.',
  ];

  // Le même mot pour tout le monde et pour toute la journée : indexé sur le
  // quantième, pas sur un tirage au sort qui changerait à chaque rendu.
  function motDuJour(){
    var d = new Date();
    var jour = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    return MOTS_DU_JOUR[(jour + d.getFullYear()) % MOTS_DU_JOUR.length];
  }

  function dateDuJour(){
    return new Date().toLocaleDateString('fr-FR',
      { weekday:'long', day:'numeric', month:'long' });
  }

  function accueilHtml(){
    var p = state.profil;
    var prenom = (p.prenom || '').trim();
    var ech = prochaineEcheance();

    // --- Le bandeau d'accueil : la date, la salutation, le mot du jour ---
    var hero = '<div class="acc-tete">'
      + '<div class="acc-tete-d">'+esc(dateDuJour())+'</div>'
      + '<div class="acc-salut">'+salutation()
        + (prenom ? ' '+esc(prenom) : '')+' <span class="acc-salut-m">👋</span></div>'
      + '<div class="acc-mot"><span class="acc-mot-q">“</span>'
        + esc(motDuJour())+'</div>'
    + '</div>';

    // --- L'échéance : une ligne datée, pas un pavé ---
    var carteEch = ech
      ? '<button class="acc-ech" data-action="view" data-id="'+ech.e.objectif+'">'
        + '<span class="acc-ech-i">📅</span>'
        + '<span class="acc-ech-x"><b>'+esc(ech.e.titre)+'</b> · '
          + ech.date.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })
          + ' <span class="acc-ech-j">dans '+ech.jours+' j</span></span>'
        + '<span class="acc-ech-f">→</span>'
        + '</button>'
      : '';

    // --- Objectifs en cours, en compact ---
    var enCours = state.added.filter(function(id){ return !!obj(id); })
      .map(function(id){ return obj(id); }).slice(0, 4).map(function(o){
      var id = o.id, pr = pctOf(id), d = dom(o);
      return '<button class="acc-obj" style="--c:'+d.c+'" data-action="view" data-id="'+id+'">'
        + anneauSection(pr.pct, d.c, 30)
        + '<span class="acc-obj-t">'+esc(o.title)+'</span>'
        + '<span class="acc-obj-p">'+pr.done+'/'+pr.total+'</span>'
        + '</button>';
    }).join('');

    var reprise = repriseHtml();

    // Deux colonnes plutôt qu'une pile : à gauche ce sur quoi on agit, à droite
    // où l'on en est. Tout empilé, la page se lisait comme une liste de courses
    // et la moitié de la largeur restait vide sur un écran d'ordinateur.
    var colonneGauche = ''
      + (reprise
          ? '<div class="acc-sec"><div class="acc-sec-h">Reprendre</div>'+reprise+'</div>'
          : '')
      + portesHtml();

    var colonneDroite = ''
      + '<div class="acc-sec"><div class="acc-sec-h">Ta sérénité</div>'
        + sereniteCarteHtml(true)+'</div>'
      + (carteEch
          ? '<div class="acc-sec"><div class="acc-sec-h">À venir</div>'+carteEch+'</div>'
          : '')
      + (enCours
          ? '<div class="acc-sec">'
            + '<div class="acc-sec-h">Tes objectifs'
              + '<button class="btn-link" data-action="tab" data-tab="objectifs">Tout voir →</button></div>'
            + '<div class="acc-objs">'+enCours+'</div>'
          + '</div>'
          : '');

    return '<div class="view">'
      + hero
      + '<div class="acc-grille">'
        + '<div class="acc-col">'+colonneGauche+'</div>'
        + '<aside class="acc-rail">'+colonneDroite+'</aside>'
      + '</div>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Objectifs - la vue détaillée est imbriquée, plus d'onglet séparé
  // ---------------------------------------------------------------------------
  // Le raccourci d'une étape : soit un simulateur, soit un partenaire.
  var SIM_LIBELLES = {
    depenses:'Analyser mes dépenses', vl:'Comparer les deux options',
    tva:'Simuler le passage à la TVA', statut:'Comparer les statuts',
    optim:'Ouvrir le cockpit',
  };

  function etapeActionHtml(st){
    if(st.sim){
      return '<button class="step-cta" data-action="goto-sim" data-sim="'+esc(st.sim)+'">'
        + '📊 ' + esc(SIM_LIBELLES[st.sim] || 'Ouvrir le simulateur') + ' →</button>';
    }
    if(st.part !== undefined){
      var pa = PARTENAIRES[st.part];
      if(!pa) return '';
      return '<button class="step-cta part" style="--c:'+pa.color+'"'
        + ' data-action="goto-part" data-i="'+st.part+'">'
        + '🤝 ' + esc(pa.nom) + (pa.promo ? ' · code ' + esc(pa.promo) : '') + ' →</button>';
    }
    return '';
  }

  // Un objectif « en cours » = au moins une étape cochée, pas encore fini.
  function etatObjectif(id){
    var p = pctOf(id);
    return p.pct === 100 ? 'fait' : (p.done > 0 ? 'encours' : 'neuf');
  }

  // Les étapes en points : on lit d'un coup où on en est et ce qu'il reste.
  function pointsEtapes(id, color){
    var o = obj(id), faites = pctOf(id).done;
    return '<span class="obj-pts">' + o.steps.map(function(_, i){
      return '<i class="'+(i < faites ? 'on' : '')+'"'
        + (i < faites ? ' style="background:'+color+'"' : '')+'></i>';
    }).join('') + '</span>';
  }

  // Libellés courts, pour tenir sur une tuile.
  var SIM_COURT = {
    depenses:'Mes dépenses', vl:'Versement libératoire',
    tva:'Passer à la TVA', statut:'Comparer les statuts', optim:'Cockpit',
  };

  // Les raccourcis d'un objectif, sans doublon : simulateurs puis partenaires.
  function liensObjectif(o){
    var sims = [], parts = [];
    o.steps.forEach(function(st){
      if(st.sim && sims.indexOf(st.sim) < 0) sims.push(st.sim);
      if(st.part !== undefined && parts.indexOf(st.part) < 0) parts.push(st.part);
    });
    return { sims:sims, parts:parts };
  }

  // Affichés en clair sur la tuile - même si l'étape n'est pas encore atteinte :
  // c'est ce qui donne envie d'aller voir.
  function liensTuileHtml(o){
    var l = liensObjectif(o);
    var chips = l.sims.map(function(k){
      return '<span class="tui-lien" data-action="goto-sim" data-sim="'+k+'">'
        + '📊 '+esc(SIM_COURT[k] || 'Simulateur')+'</span>';
    }).concat(l.parts.map(function(i){
      var pa = PARTENAIRES[i];
      if(!pa) return '';
      // Partenaire encore secret : la pastille reste anonyme.
      return '<span class="tui-lien part" style="--p:'+pa.color+'"'
        + ' data-action="goto-part" data-i="'+i+'">🤝 '
        + (pa.tease ? 'Prochainement' : esc(pa.nom))+'</span>';
    }));
    return chips.length ? '<span class="tui-liens">'+chips.join('')+'</span>' : '';
  }

  function echeanceCourte(o){
    if(!o.echeance) return '';
    // Certaines échéances n'ont pas de date fixe mais une période (ex. la
    // déclaration de revenus, dont la date limite varie selon le département).
    if(o.echeance.periode) return '<span class="obj-ech">📅 '+esc(o.echeance.periode)+'</span>';
    var now = new Date();
    var dt = new Date(now.getFullYear(), o.echeance.mois - 1, o.echeance.jour);
    if(dt < now) dt = new Date(now.getFullYear() + 1, o.echeance.mois - 1, o.echeance.jour);
    return '<span class="obj-ech">📅 '
      + dt.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) + '</span>';
  }

  // Les objectifs récemment ajoutés au catalogue. `nouveau` porte la date de
  // mise en ligne ; passé le délai, la mise en avant disparaît d'elle-même.
  var NOUVEAU_JOURS = 4;
  function objectifsNouveaux(){
    var now = Date.now();
    return catalog.filter(function(o){
      if(!o.nouveau) return false;
      var age = (now - Date.parse(o.nouveau)) / 86400000;
      // Un clic sur la tuile vaut découverte : le halo s'éteint pour de bon.
      return age >= 0 && age <= NOUVEAU_JOURS && !state.faits['nouveau-vu:' + o.id];
    }).map(function(o){ return o.id; });
  }
  function estNouveau(id){ return objectifsNouveaux().indexOf(id) >= 0; }
  function marquerNouveauVu(id){
    var o = obj(id);
    if(!o || !o.nouveau) return;
    marquerFait('nouveau-vu:' + id);
  }

  // `dispo` : objectif pas encore choisi - présenté plus sobrement, avec un +.
  function illusObjectif(id){
    return 'assets/illus/obj-' + id + '.svg';
  }

  function objectifTuileHtml(id, dispo){
    var o = obj(id), d = dom(o), etat = etatObjectif(id), pr = pctOf(id);
    var pertinent = o.pertinent && o.pertinent(state.profil);
    var sous = etat === 'fait' ? 'Parcours terminé'
      : (etat === 'encours' ? 'Prochaine : ' + o.steps[pr.done].t : o.desc);

    var epingle = state.avant.indexOf(id) >= 0;
    var pleinAvant = state.avant.length >= MAX_AVANT && !epingle;
    var coin = dispo
      ? '<span class="tui-add" data-action="obj-add" data-id="'+id+'" title="Ajouter à mes objectifs">+</span>'
      : (etat === 'fait' ? '<span class="tui-ok">✓</span>'
          : '<span class="tui-actions">'
            // L'épingle est le moyen sûr de mettre en avant : le glisser-déposer
            // reste possible, mais il n'est pas fiable sur tous les navigateurs.
            + '<span class="tui-pin'+(epingle ? ' on' : '')+(pleinAvant ? ' plein' : '')+'"'
              + ' data-action="obj-epingle" data-id="'+id+'" role="button" tabindex="0"'
              + ' title="'+(epingle ? 'Retirer de la mise en avant'
                  : (pleinAvant ? 'Trois objectifs déjà en avant' : 'Mettre en avant'))+'">'
              + '📌</span>'
            + '<span class="tui-x" data-action="obj-remove" data-id="'+id+'" title="Retirer de mes objectifs">×</span>'
          + '</span>');

    // « inedit » et non « neuf » : l'état d'avancement s'appelle déjà `neuf`
    // (= pas commencé), la collision mettait un halo doré sur tout le monde.
    var inedit = estNouveau(id);
    return '<button class="tui '+etat+(dispo?' dispo':'')+(pertinent&&dispo?' reco':'')
      + (inedit ? ' inedit' : '')+'"'
      + ' draggable="false"'
      + ' style="--c:'+d.c+';--s:'+d.soft+'" data-action="'+(dispo?'obj-add':'view')+'" data-id="'+id+'">'
      + '<span class="tui-h">'
        + '<span class="tui-ico">'+d.ico+'</span>'
        + '<span class="tui-dom">'+esc(d.l)+'</span>'
        + (inedit ? '<span class="tui-neuf" title="Nouveau parcours">🔔</span>' : '')
        + (pertinent && dispo && !inedit
            ? '<span class="tui-reco"><span class="tui-reco-e">★</span>Pour toi</span>' : '')
        + coin
      + '</span>'
      + '<span class="tui-t">'+esc(o.title)+'</span>'
      + '<span class="tui-d">'+esc(dispo ? (o.pourquoi || o.desc) : sous)+'</span>'
      + '<img class="tui-illu" src="'+illusObjectif(id)+'" alt="" draggable="false"'
        + ' loading="lazy" decoding="async">'
      + liensTuileHtml(o)
      + '<span class="tui-f">'
        + (dispo ? '<span class="tui-nb">'+o.steps.length+' étapes</span>' : pointsEtapes(id, d.c))
        + echeanceCourte(o)
      + '</span>'
      + '</button>';
  }

  function objectifsHtml(){
    // Un objectif ouvert : on affiche son parcours, à la place de la grille.
    if(state.objectifOuvert && obj(state.objectifOuvert)
       && state.added.indexOf(state.objectifOuvert) >= 0){
      return '<div class="view">' + objectifDetailHtml(state.objectifOuvert) + '</div>';
    }

    var p = state.profil;
    var mesIds = state.added.filter(function(id){ return !!obj(id); });

    // Ordre : ce qu'on a commencé d'abord, puis ce qui reste à démarrer.
    var poids = function(id){
      var e = etatObjectif(id);
      return e === 'encours' ? 0 : (e === 'fait' ? 2 : 1);
    };
    var tries = mesIds.slice().sort(function(a, b){ return poids(a) - poids(b); });
    var filtre = function(id){ return !state.objFiltrePage || obj(id).dom === state.objFiltrePage; };
    var actifs = tries.filter(function(id){ return filtre(id) && etatObjectif(id) !== 'fait'; });
    var finis  = tries.filter(function(id){ return filtre(id) && etatObjectif(id) === 'fait'; });

    // Disponibles : ceux qu'on n'a pas encore choisis. Les pertinents d'abord.
    var dispos = catalog.filter(function(o){ return mesIds.indexOf(o.id) < 0; })
      .filter(function(o){ return !state.objFiltre || o.dom === state.objFiltre; })
      .sort(function(a, b){
        var ra = a.pertinent && a.pertinent(p) ? 0 : 1;
        var rb = b.pertinent && b.pertinent(p) ? 0 : 1;
        return ra - rb;
      });

    // --- En-tête : la progression ne compte QUE les objectifs choisis ---
    var etapesFaites = 0, etapesTotal = 0, nbEnCours = 0, nbFinis = 0;
    mesIds.forEach(function(id){
      var pr = pctOf(id);
      etapesFaites += pr.done; etapesTotal += pr.total;
      if(etatObjectif(id) === 'encours') nbEnCours++;
      if(etatObjectif(id) === 'fait') nbFinis++;
    });
    var pctGlobal = etapesTotal ? Math.round(etapesFaites / etapesTotal * 100) : 0;
    var aDemarrer = mesIds.length - nbEnCours - nbFinis;

    // Même traitement que la jauge du profil : fond sombre, anneau blanc, chiffres
    // en pastilles. C'est le seul bloc « fier » de la page, il donne le ton.
    var R = 30, C = 2 * Math.PI * R;
    var anneau = '<svg viewBox="0 0 72 72" width="72" height="72">'
      + '<circle cx="36" cy="36" r="'+R+'" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="6"/>'
      + '<circle cx="36" cy="36" r="'+R+'" fill="none" stroke="#fff" stroke-width="6" '
        + 'stroke-linecap="round" stroke-dasharray="'+(pctGlobal/100*C)+' '+C+'" '
        + 'transform="rotate(-90 36 36)"/>'
      + '<text x="36" y="42" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">'
        + pctGlobal + '%</text></svg>';

    var puce = function(n, l, cls, action){
      if(!n) return '';
      return '<'+(action?'button':'span')+' class="ochip'+(cls?' '+cls:'')+'"'
        + (action ? ' data-action="'+action+'"' : '')+'>'
        + '<b>'+n+'</b> '+l+'</'+(action?'button':'span')+'>';
    };
    var entete = '<div class="obj-tete">'
      + '<div class="obj-tete-r">'+anneau+'</div>'
      + '<div class="obj-tete-x">'
        + '<div class="obj-tete-t">'
          + (etapesTotal
              ? 'Ton parcours est avancé à '+pctGlobal+' %'
              : 'Ton parcours commence ici')+'</div>'
        + '<div class="obj-tete-s">'
          + (etapesTotal
              ? etapesFaites+' étape'+(etapesFaites>1?'s':'')+' franchie'+(etapesFaites>1?'s':'')
                + ' sur '+etapesTotal+', '
                + (mesIds.length > 1
                    ? 'dans les '+mesIds.length+' objectifs que tu as choisis'
                    : 'dans l’objectif que tu as choisi')
              : 'Choisis un premier objectif, on avance étape par étape')+'</div>'
        + (mesIds.length
            ? '<div class="obj-tete-c">'
              + puce(nbEnCours, 'en cours', 'on')
              + puce(aDemarrer, 'à démarrer', '')
              + puce(nbFinis, 'maîtrisé'+(nbFinis>1?'s':''), 'ok', 'obj-voir-finis')
            + '</div>'
            : '')
      + '</div>'
      + '</div>';

    // --- Filtres par domaine, limités à ce que l'utilisateur a réellement pris ---
    var domainesPris = ORDRE_DOMAINES.filter(function(k){
      return mesIds.some(function(id){ return obj(id).dom === k; });
    });
    var pastilles = domainesPris.length > 1
      ? '<div class="fpills">'
        + '<button class="fpill'+(state.objFiltrePage?'':' on')+'"'
          + ' data-action="obj-filtre-page" data-dom="">Tous</button>'
        + domainesPris.map(function(k){
            var dd = DOMAINES[k], on = state.objFiltrePage === k;
            var n = mesIds.filter(function(id){ return obj(id).dom === k; }).length;
            return '<button class="fpill'+(on?' on':'')+'" style="--c:'+dd.c+'"'
              + ' data-action="obj-filtre-page" data-dom="'+k+'">'+dd.ico+' '+esc(dd.l)
              + '<span class="fpill-n">'+n+'</span></button>';
          }).join('')
      + '</div>'
      : '';

    // --- Maîtrisés : repliés, pour ne pas encombrer ---
    // Les maîtrisés vivent dans leur propre pop-up : ils n'encombrent plus la page.
    var blocFinis = '';

    // --- Ouvrir le catalogue : une invite, pas 18 tuiles de plus sur la page ---
    var nbDispos = catalog.filter(function(o){ return mesIds.indexOf(o.id) < 0; }).length;
    var invite = nbDispos
      ? '<button class="obj-plus" data-action="cat-open">'
        + '<span class="obj-plus-c">+</span>'
        + '<span class="obj-plus-txt"><span class="obj-plus-t">Ajouter un objectif</span>'
          + '<span class="obj-plus-d">'+nbDispos+' parcours t’attendent, on choisit ce qui te parle</span>'
        + '</span></button>'
      : '';

    return '<div class="view">'
      + entete
      + pastilles
      + blocFinis
      + zonesHtml(actifs)
      + invite
      + '</div>';
  }

  // Le catalogue complet vit dans une pop-up : la page d'accueil des objectifs
  // reste courte, on n'y voit que ce qu'on a choisi.
  function catalogueModalHtml(){
    if(!state.catOpen) return '';
    var p = state.profil;
    var mesIds = state.added.filter(function(id){ return !!obj(id); });
    var dispos = catalog.filter(function(o){ return mesIds.indexOf(o.id) < 0; })
      .filter(function(o){ return !state.objFiltre || o.dom === state.objFiltre; })
      .sort(function(a, b){
        var ra = a.pertinent && a.pertinent(p) ? 0 : 1;
        var rb = b.pertinent && b.pertinent(p) ? 0 : 1;
        return ra - rb;
      });
    var pastilles = '<button class="fpill'+(state.objFiltre?'':' on')+'"'
      + ' data-action="obj-filtre" data-dom="">Tous</button>'
      + ORDRE_DOMAINES.filter(function(k){
          return catalog.some(function(o){ return o.dom === k; });
        }).map(function(k){
          var dd = DOMAINES[k], on = state.objFiltre === k;
          return '<button class="fpill'+(on?' on':'')+'" style="--c:'+dd.c+'"'
            + ' data-action="obj-filtre" data-dom="'+k+'">'+dd.ico+' '+esc(dd.l)+'</button>';
        }).join('');

    return '<div class="cat-head">'
        + '<img src="assets/illus/en-route.svg" alt="" class="cat-illu">'
        + '<div><div class="cat-t">Ajouter un objectif</div>'
          + '<div class="cat-s">Choisis ce qui te parle, tu pourras en ajouter d’autres plus tard</div></div>'
        + '<button class="cat-x" data-action="cat-close" aria-label="Fermer">✕</button>'
      + '</div>'
      + '<div class="cat-filtres"><div class="fpills">'+pastilles+'</div></div>'
      + '<div class="cat-body">'
        + (dispos.length
            ? '<div class="tuis">'
              + dispos.map(function(o){ return objectifTuileHtml(o.id, true); }).join('')
              + '</div>'
            : '<div class="obj-vide">Rien de plus dans cette catégorie</div>')
      + '</div>';
  }

  // Deux zones de dépôt : ce qu'on met en avant, et le reste. L'ordre est libre
  // à l'intérieur de chacune, et il est conservé d'une session à l'autre.
  function zonesHtml(actifs){
    var enAvant = state.avant.filter(function(id){ return actifs.indexOf(id) >= 0; });
    var reste = actifs.filter(function(id){ return enAvant.indexOf(id) < 0; });
    var grille = function(ids, zone){
      return ids.map(function(id){
        return '<div class="tui-slot" draggable="true" data-zone="'+zone+'" data-id="'+id+'">'
          + objectifTuileHtml(id, false)+'</div>';
      }).join('');
    };

    // La zone reste dans le DOM même vide : le CSS la révèle pendant un
    // glissement. La faire apparaître en JS obligerait à re-rendre en plein
    // déplacement, ce qui saccade.
    var haut = '<div class="zone zone-avant'+(enAvant.length?'':' vide')+'" data-zone="avant">'
      + '<div class="zone-t"><span class="zone-p">📌</span>En avant'
        + '<span class="zone-h">'
          + (enAvant.length >= MAX_AVANT
              ? 'trois au maximum, c’est ce qui garde la priorité utile'
              : 'glisse ici jusqu’à '+MAX_AVANT+' objectifs à traiter en priorité')
        + '</span></div>'
      + (enAvant.length
          ? '<div class="tuis">'+grille(enAvant, 'avant')+'</div>'
          : '<div class="zone-vide">Dépose une carte ici pour l’épingler en haut</div>')
    + '</div>';

    var bas = actifs.length
      ? '<div class="zone zone-reste" data-zone="reste">'
        + (enAvant.length ? '<div class="zone-t">Le reste de tes objectifs</div>' : '')
        + (reste.length
            ? '<div class="tuis">'+grille(reste, 'reste')+'</div>'
            : '<div class="zone-vide">Tout est en avant</div>')
      + '</div>'
      : '<div class="obj-vide illu">'
        + '<img src="assets/illus/rien-en-cours.svg" alt="" class="illu-img">'
        + '<div class="obj-vide-t">Rien en cours pour l’instant</div>'
        + '<div class="obj-vide-d">Choisis un premier objectif, on le déroule étape par étape</div>'
      + '</div>';

    return haut + bas;
  }

  // Ce qui est bouclé mérite d'être montré, pas relégué : une pop-up dédiée,
  // entièrement verte, qui donne le sentiment d'une étagère à trophées.
  function finisModalHtml(){
    if(!state.objVoirFinis) return '';
    var finis = state.added.filter(function(id){
      return obj(id) && etatObjectif(id) === 'fait'; });
    if(!finis.length) return '';
    var etapes = finis.reduce(function(a, id){ return a + pctOf(id).total; }, 0);
    return '<div class="overlay" data-action="obj-voir-finis">'
      + '<div class="modal fin-modal" data-action="stop">'
        + '<div class="fin-head">'
          + '<div class="fin-ico">🏆</div>'
          + '<div><div class="fin-t">'+finis.length+' objectif'+(finis.length>1?'s':'')
            + ' bouclé'+(finis.length>1?'s':'')+'</div>'
            + '<div class="fin-s">'+etapes+' étapes franchies, tu peux y revenir quand tu veux</div></div>'
          + '<button class="fin-x" data-action="obj-voir-finis" aria-label="Fermer">✕</button>'
        + '</div>'
        + '<div class="fin-body"><div class="tuis">'
          + finis.map(function(id){ return objectifTuileHtml(id, false); }).join('')
        + '</div></div>'
      + '</div></div>';
  }

  // Le catalogue vit dans un root persistant : ajouter un objectif ne doit pas
  // recréer l'overlay, sinon la pop-up rejoue son animation à chaque clic et on
  // a l'impression que la page se rafraîchit.
  function majCatalogue(){
    var root = document.getElementById('cat-root');
    if(!root) return;
    if(!state.catOpen){ root.innerHTML = ''; return; }
    var card = root.querySelector('.cat-modal');
    if(!card){
      root.innerHTML = '<div class="overlay" data-action="cat-close">'
        + '<div class="modal cat-modal" data-action="stop"></div></div>';
      card = root.querySelector('.cat-modal');
    }
    // On garde la position de défilement : la tuile ajoutée disparaît, le reste
    // ne doit pas sauter sous le curseur.
    var corps = card.querySelector('.cat-body');
    var y = corps ? corps.scrollTop : 0;
    card.innerHTML = catalogueModalHtml();
    var neuf = card.querySelector('.cat-body');
    if(neuf) neuf.scrollTop = y;
  }

  // ---------------------------------------------------------------------------
  // Petites illustrations d'étape
  // ---------------------------------------------------------------------------
  // Du trait simple, dessiné à la main, qui prend la couleur du domaine. Le but
  // n'est pas de décorer : c'est de donner un repère visuel à chaque étape pour
  // que le parcours ressemble moins à un formulaire administratif.
  var ILLUS = {
    loupe:    '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l4.5 4.5"/>',
    dossier:  '<path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5h8A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 18.5z"/>',
    form:     '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    enveloppe:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.6 6.6L12 13l8.4-6.4"/>',
    facture:  '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9.5 8.5h5M9.5 12.5h5"/>',
    ecran:    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M10 10.5h4"/>',
    batiment: '<path d="M3.5 9.5L12 4l8.5 5.5"/><path d="M5.5 10.5V19M18.5 10.5V19M10 10.5V19M14 10.5V19"/><path d="M3 19.5h18"/>',
    carte:    '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 14.5h3.5"/>',
    calendrier:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 14h3"/>',
    euro:     '<circle cx="12" cy="12" r="8.5"/><path d="M15 8.6a4 4 0 1 0 0 6.8"/><path d="M7.8 11h5M7.8 13.2h5"/>',
    balance:  '<path d="M12 4v16M7 20h10"/><path d="M4 8h16"/><path d="M4 8l-2 5a2.6 2.6 0 0 0 4 0z"/><path d="M20 8l2 5a2.6 2.6 0 0 1-4 0z"/>',
    courbe:   '<path d="M4 19V5M4 19h16"/><path d="M7 15.5l3.5-4 3 2.5L19 8"/>',
    bouclier: '<path d="M12 3.2l7 2.6v5.6c0 4.3-2.9 7.6-7 9.4-4.1-1.8-7-5.1-7-9.4V5.8z"/><path d="M9.2 12.2l2 2 3.6-3.9"/>',
    signature:'<path d="M4 17.5c3-1 4-8 6-8s1.5 8 3.5 8 2-3.5 3.5-3.5c1 0 1.5 1 2 2"/><path d="M4 20.5h16"/>',
    equipe:   '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.2 19.5c0-3.2 2.6-5.3 5.8-5.3s5.8 2.1 5.8 5.3"/><path d="M16.2 6.2a3.2 3.2 0 0 1 0 6.2M17 14.6c2.2.5 3.8 2.3 3.8 4.9"/>',
    maison:   '<path d="M4 10.5L12 4l8 6.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>',
    globe:    '<circle cx="12" cy="12" r="8.5"/><path d="M3.6 12h16.8"/><path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5z"/>',
    outil:    '<path d="M14.5 3.5a5 5 0 0 0-5.9 6.4L3.5 15v5.5H9l5.1-5.1a5 5 0 0 0 6.4-5.9l-3 3-2.8-.7-.7-2.8z"/>',
    horloge:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.4 2"/>',
    fusee:    '<path d="M12 3c3.2 2.4 5 5.9 5 9.6l-2.6 2.6H9.6L7 12.6C7 8.9 8.8 5.4 12 3z"/><circle cx="12" cy="10" r="1.8"/><path d="M9.6 15.2L7.4 17.4M14.4 15.2l2.2 2.2M12 16v4"/>',
    tampon:   '<path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><path d="M5 14h14l-1 3H6z"/><path d="M4.5 20.5h15"/>',
  };

  // Motif par défaut si une étape n'en déclare pas : jamais de trou visuel.
  function illustrationHtml(nom){
    var d = ILLUS[nom] || ILLUS.form;
    return '<svg class="et-illu" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
      + ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
      + ' aria-hidden="true">'+d+'</svg>';
  }

  // Contenu détaillé d'une étape : un texte d'intro, des points « à faire »,
  // des points de vigilance, et des liens vers les sites officiels.
  function contenuEtapeHtml(d){
    var h = '';
    if(d.intro) h += '<p class="sc-intro">'+d.intro+'</p>';
    // Une vidéo vaut mieux qu'un paragraphe pour qui bloque sur l'administratif.
    if(d.video){
      h += '<a class="sc-video" href="'+esc(d.video.url)+'" target="_blank" rel="noopener">'
        + '<span class="sc-video-play">▶</span>'
        + '<span class="sc-video-txt"><span class="sc-video-t">'+esc(d.video.t)+'</span>'
        + '<span class="sc-video-d">'+esc(d.video.d)+'</span></span>'
        + '<span class="sc-video-fl">↗</span></a>';
    }
    if(d.faire && d.faire.length){
      // Cases à cocher visuelles : on avance ligne par ligne au lieu de lire une consigne.
      h += '<div class="sc-bloc"><div class="sc-l">Concrètement, tu fais ça</div>'
        + '<ul class="sc-liste">'
        + d.faire.map(function(x){ return '<li>'+x+'</li>'; }).join('') + '</ul></div>';
    }
    if(d.astuce){
      h += '<div class="sc-astuce"><span class="sc-astuce-i">💡</span><span>'+d.astuce+'</span></div>';
    }
    if(d.vigilance && d.vigilance.length){
      h += '<div class="sc-bloc"><div class="sc-l warn">Là où ça coince souvent</div>'
        + '<ul class="sc-liste warn">'
        + d.vigilance.map(function(x){ return '<li>'+x+'</li>'; }).join('') + '</ul></div>';
    }
    if(d.liens && d.liens.length){
      h += '<div class="sc-liens">' + d.liens.map(function(a){
        return '<a class="sc-lien" href="'+esc(a.url)+'" target="_blank" rel="noopener">'
          + esc(a.l)+' ↗</a>'; }).join('') + '</div>';
    }
    return '<div class="step-contenu">'+h+'</div>';
  }

  function objectifDetailHtml(curId){
    var cur = obj(curId), cp = pctOf(curId), dd = dom(cur);

    // Trois blocs bien distincts plutôt qu'une longue frise : ce qui est fait se
    // replie en vert, l'étape du moment occupe tout l'espace, la suite reste
    // volontairement en retrait pour ne pas décourager d'avance.
    var premiereNonFaite = cur.steps.findIndex(function(_, i){ return !state.checks[curId+':'+i]; });
    var total = cur.steps.length;
    var blocs = '';
    var aVenir = [];

    cur.steps.forEach(function(st, i){
      var done = !!state.checks[curId+':'+i];
      var enCours = !done && i === premiereNonFaite;
      if(!done && !enCours){ aVenir.push({ st:st, i:i }); return; }

      // Le contenu détaillé vit à part (CONTENUS), pour ne pas alourdir le catalogue.
      var d = (CONTENUS[curId] || [])[i];
      var contenu = (d ? contenuEtapeHtml(d) : '') + etapeActionHtml(st);

      if(done){
        // Ce qui est fait se range : une ligne verte, rouvrable si besoin.
        var ouvertFait = state.stepOuvert === i;
        blocs += '<div class="et et-ok'+(ouvertFait?' open':'')+'">'
          + '<button type="button" class="et-ok-hd" data-action="step-expand" data-i="'+i+'"'
            + ' aria-expanded="'+(ouvertFait?'true':'false')+'">'
            + '<span class="et-ok-c">✓</span>'
            + '<span class="et-ok-illu">'+illustrationHtml(st.illu)+'</span>'
            + '<span class="et-ok-t">'+esc(st.t)+'</span>'
            + '<span class="et-ok-x">'+(ouvertFait?'Replier':'Revoir')+'</span>'
          + '</button>'
          + '<div class="step-wrap"><div class="step-inner"><div class="et-ok-in">'
            + contenu
            + '<button class="et-defaire" data-action="step-check" data-i="'+i+'">'
              + 'Finalement, ce n’est pas fait</button>'
          + '</div></div></div>'
        + '</div>';
        return;
      }

      // L'étape du moment : le bloc principal de la page.
      blocs += '<div class="et et-now" style="--c:'+dd.c+';--s:'+dd.soft+'">'
        + '<div class="et-now-top">'
          + '<span class="et-now-pos">Étape '+(i+1)+' sur '+total+'</span>'
          + (st.duree ? '<span class="et-now-duree">'+esc(st.duree)+'</span>' : '')
        + '</div>'
        + '<div class="et-now-hd">'
          + '<span class="et-illu-b">'+illustrationHtml(st.illu)+'</span>'
          + '<div class="et-now-ht">'
            + '<div class="et-now-t">'+esc(st.t)+'</div>'
            + '<div class="et-now-h">'+esc(st.h)+'</div>'
          + '</div>'
        + '</div>'
        + (contenu ? '<div class="et-now-body">'+contenu+'</div>' : '')
        + '<button class="et-fait" data-action="step-check" data-i="'+i+'">'
          + '<span class="et-fait-c">✓</span>C’est fait, étape suivante</button>'
      + '</div>';
    });

    // La suite du parcours, réduite à des titres : on sait où on va sans se
    // faire écraser par tout ce qui reste.
    if(aVenir.length){
      blocs += '<div class="et-apres">'
        + '<div class="et-apres-t">Ensuite</div>'
        + aVenir.map(function(x){
            return '<div class="et-apres-i"><span class="et-apres-n">'+(x.i+1)+'</span>'
              + '<span class="et-apres-illu">'+illustrationHtml(x.st.illu)+'</span>'
              + esc(x.st.t)+'</div>';
          }).join('')
      + '</div>';
    }

    var steps = blocs;

    // Échéance légale, uniquement si l'objectif en a une réelle.
    var ech = '';
    if(cur.echeance){
      if(cur.echeance.periode){
        ech = '<div class="detail-ech">📅 <strong>'+esc(cur.echeance.quoi)+'</strong> - chaque année, '
          + 'période <strong>'+esc(cur.echeance.periode)+'</strong> (date limite variable selon le département)</div>';
      } else {
        var now = new Date();
        var date = new Date(now.getFullYear(), cur.echeance.mois - 1, cur.echeance.jour);
        if(date < now) date = new Date(now.getFullYear() + 1, cur.echeance.mois - 1, cur.echeance.jour);
        ech = '<div class="detail-ech">📅 <strong>'+esc(cur.echeance.quoi)+'</strong> - avant le '
          + date.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })+'</div>';
      }
    }

    var retour = state.retourVers && titles[state.retourVers]
      ? titles[state.retourVers][0] : 'Tous mes objectifs';
    return '<button class="retour" data-action="obj-close">← '+esc(retour)+'</button>'
      + '<div class="detail" data-key="'+curId+'" style="--c:'+dd.c+';border-top:4px solid '+dd.c+'">'
      + '<div class="detail-head">'
        + '<div class="detail-head-l">'
          + '<div class="detail-tag"><span class="detail-ico" style="background:'+dd.soft+'">'
            + dd.ico+'</span>'
            + '<span class="tag" style="color:'+dd.c+'">'+esc(dd.l)+'</span></div>'
          + '<div class="detail-title">'+esc(cur.title)+'</div>'
          + '<div class="detail-desc">'+esc(cur.desc)+'</div>'
        + '</div>'
        + '<div class="detail-head-r">'
          + '<img class="detail-illu" src="'+illusObjectif(curId)+'" alt="" decoding="async">'
          + jaugeEtapesHtml(cur, cp, premiereNonFaite, dd)
        + '</div>'
      + '</div>'
      + ech
      + (cp.pct === 100
          ? '<div class="obj-fini">'
            + '<img src="assets/illus/objectif-boucle.svg" alt="" class="obj-fini-illu">'
            + '<span><span class="obj-fini-t">Objectif bouclé</span>'
            + '<span class="obj-fini-d">Tu peux repasser sur n’importe quelle étape quand tu veux</span>'
            + '</span>'
            + (state.compte
                ? (state.faits['partage:'+curId]
                    ? '<span class="obj-partage fait">✓ Partagé</span>'
                    : '<button class="obj-partage" data-action="obj-partager" data-id="'+curId+'">'
                      + 'Partager dans l’Entraide 🎉</button>')
                : '')
            + '</div>' : '')
      + '<div class="steps">'+steps+'</div>'
      + suiteHtml(cur, cp.pct === 100)
      + '</div>';
  }

  // Un segment par étape, coloré comme les blocs plus bas : vert pour ce qui est
  // fait, couleur du domaine pour l'étape en cours, gris pour ce qui reste. On
  // lit le nombre d'étapes et l'avancement sans avoir à lire un pourcentage.
  function jaugeEtapesHtml(cur, cp, enCours, dd){
    var reste = cp.total - cp.done;
    var segs = cur.steps.map(function(_, i){
      var done = !!state.checks[cur.id+':'+i];
      var cls = done ? 'ok' : (i === enCours ? 'now' : '');
      var st = done ? '' : (i === enCours ? ' style="background:'+dd.c+'"' : '');
      return '<i class="'+cls+'"'+st+'></i>';
    }).join('');
    var l = cp.done === 0
      ? cp.total+' étapes en tout'
      : (reste === 0
          ? 'Les '+cp.total+' étapes sont faites'
          : cp.done+' faite'+(cp.done>1?'s':'')+', '
            + (reste === 1 ? 'plus qu’une étape' : 'plus que '+reste+' étapes'));
    return '<div class="detail-prog'+(reste===0?' fini':'')+'">'
      + '<div class="dp-segs">'+segs+'</div>'
      + '<div class="dp-l">'+l+'</div>'
    + '</div>';
  }

  // Ce qui vient après : on enchaîne au lieu de laisser l'utilisateur chercher
  // seul quel est le prochain sujet à traiter.
  function suiteHtml(cur, fini){
    // On ne propose que ce qui colle au profil : suggérer une démarche de
    // société à un micro-entrepreneur serait pire que de ne rien suggérer.
    var ids = (cur.suite || []).filter(function(id){
      var o = obj(id);
      return !!o && !(o.pertinent && !o.pertinent(state.profil));
    });
    if(!ids.length) return '';
    return '<div class="obj-suite'+(fini?' pret':'')+'">'
      + '<div class="obj-suite-t">'+(fini ? 'Et maintenant ?' : 'La suite logique')+'</div>'
      + '<div class="obj-suite-l">'+ ids.map(function(id){
          var o = obj(id), d = dom(o), pc = pctOf(id);
          var pris = state.added.indexOf(id) >= 0;
          return '<button class="obj-suite-c" data-action="suite-add" data-id="'+id+'"'
            + ' style="--c:'+d.c+';--s:'+d.soft+'">'
            + '<span class="obj-suite-ico" style="background:'+d.soft+'">'+d.ico+'</span>'
            + '<span class="obj-suite-txt">'
              + '<span class="obj-suite-n">'+esc(o.title)+'</span>'
              + '<span class="obj-suite-d">'+esc(o.desc)+'</span></span>'
            + '<span class="obj-suite-b">'+(pris ? (pc===100?'Terminé':'Ouvrir') : 'Ajouter')+'</span>'
            + '</button>';
        }).join('') + '</div></div>';
  }



  // ===========================================================================
  // Simulateur : optimiser ma société (cockpit temps réel)
  // ===========================================================================
  var OPTIM_OBJECTIFS = [
    { v:'revenu',    l:'Maximiser mon revenu personnel' },
    { v:'impots',    l:'Réduire mes impôts' },
    { v:'tresorerie',l:'Conserver de la trésorerie' },
    { v:'investir',  l:'Investir' },
    { v:'immobilier',l:'Préparer un achat immobilier' },
    { v:'social',    l:'Optimiser ma protection sociale' },
  ];

  function caOptim(){
    var f = state.optim.form;
    if(state.optim.projection !== null) return state.optim.projection;
    var ca = parseFloat(f.caAnnuel) || 0;
    return f.caMensuel ? ca * 12 : ca;
  }
  function caOptimReel(){
    var f = state.optim.form;
    var ca = parseFloat(f.caAnnuel) || 0;
    return f.caMensuel ? ca * 12 : ca;
  }

  function optimResultat(){
    var o = state.optim;
    return calculerOptim(o.form, o.charges, o.leviers, o.statut, caOptim());
  }

  // --- Anneau de score ---
  function anneauScore(valeur, label, taille){
    taille = taille || 74;
    var r = (taille - 10) / 2, c = 2 * Math.PI * r;
    var couleur = valeur >= 70 ? STATUT.vert.bg : (valeur >= 40 ? STATUT.orange.bg : STATUT.rouge.bg);
    return '<div class="score">'
      + '<svg viewBox="0 0 '+taille+' '+taille+'" style="width:'+taille+'px;height:'+taille+'px">'
        + '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+r+'" fill="none" stroke="#e7edf6" stroke-width="7"/>'
        + '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+r+'" fill="none" stroke="'+couleur+'" '
          + 'stroke-width="7" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" '
          + 'stroke-dashoffset="'+(c * (1 - valeur/100)).toFixed(1)+'" '
          + 'transform="rotate(-90 '+(taille/2)+' '+(taille/2)+')"/>'
        + '<text x="'+(taille/2)+'" y="'+(taille/2 + 5)+'" text-anchor="middle" font-size="16" '
          + 'font-weight="800" fill="#0f1b33">'+valeur+'</text>'
      + '</svg>'
      + '<div class="score-l">'+esc(label)+'</div></div>';
  }

  // --- Répartition du chiffre d'affaires (barre empilée) ---
  function repartitionOptim(r){
    var parts = [
      { l:'Charges',      v:r.chargesTotales, c:'#94a3b8' },
      { l:'Cotisations',  v:r.cotisations,    c:'#f59e0b' },
      { l:'Impôts (IS, PFU, IR)', v:r.is + r.pfu + r.ir, c:'#ef4444' },
      { l:'Ta rémunération nette', v:Math.max(0, r.remuneration - r.ir), c:'#2f6bff' },
      { l:'Dividendes nets', v:Math.max(0, r.dividendes - r.pfu), c:'#10b981' },
      { l:'Trésorerie conservée', v:Math.max(0, r.tresorerieFinale), c:'#0f1b33' },
    ].filter(function(p){ return p.v > 0; });
    var total = parts.reduce(function(s,p){ return s + p.v; }, 0) || 1;
    var segments = parts.map(function(p){
      return '<div class="rep-seg" style="width:'+(p.v/total*100)+'%;background:'+p.c+'" title="'
        + esc(p.l)+'"></div>';
    }).join('');
    var legende = parts.map(function(p){
      return '<div class="rep-item"><span class="rep-dot" style="background:'+p.c+'"></span>'
        + '<span class="rep-l">'+esc(p.l)+'</span>'
        + '<span class="rep-v">'+fmtEur(p.v)+'</span></div>';
    }).join('');
    return '<div class="card"><div class="card-title">Où va ton chiffre d’affaires</div>'
      + '<div class="rep-bar">'+segments+'</div>'
      + '<div class="rep-list">'+legende+'</div></div>';
  }

  // --- Tableau d'optimisation avec indicateurs ---
  function tableauOptimisation(r, scores){
    var o = state.optim;
    var lignes = [];
    var ajout = function(label, etat, commentaire){
      var st = etat === 'ok' ? STATUT.vert : (etat === 'moyen' ? STATUT.orange : STATUT.rouge);
      lignes.push('<tr><td><strong>'+esc(label)+'</strong></td>'
        + '<td><span class="pill" style="background:'+st.soft+';color:'+st.color+'">'+st.icon+'</span></td>'
        + '<td>'+esc(commentaire)+'</td></tr>');
    };

    ajout('Rémunération',
      scores.remuneration >= 70 ? 'ok' : (scores.remuneration >= 40 ? 'moyen' : 'non'),
      scores.remuneration >= 70 ? 'Ta rémunération représente une part cohérente de ton chiffre d’affaires.'
        : (r.remuneration <= 0 ? 'Tu ne te verses rien : tout passe en dividendes ou reste dans la société.'
           : 'Le curseur salaire / dividendes mérite d’être testé dans les deux sens.'));

    ajout('Dividendes',
      r.distribuable <= 0 ? 'moyen' : (r.dividendes > 0 ? 'ok' : 'moyen'),
      r.distribuable <= 0 ? 'Rien de distribuable : le résultat est absorbé par la rémunération et la trésorerie.'
        : (r.dividendes > 0 ? 'Tu distribues ' + fmtEur(r.dividendes) + ', soumis au PFU ('+fmtEur(r.pfu)+').'
           : 'Aucun dividende distribué : le bénéfice reste dans la société.'));

    ajout('Trésorerie',
      scores.tresorerie >= 70 ? 'ok' : (scores.tresorerie >= 40 ? 'moyen' : 'non'),
      r.tresorerieFinale <= 0 ? 'Aucune réserve : ta société n’a pas de matelas de sécurité.'
        : 'Il resterait ' + fmtEur(r.tresorerieFinale) + ' dans la société.');

    ajout('Charges déductibles',
      scores.charges >= 70 ? 'ok' : (scores.charges >= 40 ? 'moyen' : 'non'),
      r.chargesTotales <= 0 ? 'Aucune charge renseignée : ton résultat imposable est maximal.'
        : fmtEur(r.chargesTotales) + ' de charges viennent réduire ton résultat imposable.');

    ['mutuelle','prevoyance','rcpro'].forEach(function(k){
      var L = OPTIM_LEVIERS.filter(function(x){ return x.v === k; })[0];
      var m = parseFloat(o.leviers[k]) || 0;
      ajout(L.l, m > 0 ? 'ok' : 'non',
        m > 0 ? 'Prise en charge par la société, déduite du résultat.'
              : 'Non renseignée - un levier à étudier avec ton expert-comptable.');
    });

    ajout('TVA récupérée',
      !r.assujetti ? 'moyen' : (r.tvaRecup > 0 ? 'ok' : 'non'),
      !r.assujetti ? 'Tu n’es pas assujetti : aucune TVA récupérable sur tes achats.'
        : (r.tvaRecup > 0 ? fmtEur(r.tvaRecup) + ' de TVA récupérée sur tes charges.'
           : 'Aucune TVA récupérable détectée sur tes charges.'));

    return '<div class="card"><div class="card-title">Tableau d’optimisation</div>'
      + '<div class="recap-scroll"><table class="recap-t" style="min-width:0"><tbody>'
      + lignes.join('') + '</tbody></table></div></div>';
  }

  // --- Suggestions (pistes de réflexion, jamais des recommandations) ---
  function suggestionsOptim(r, scores){
    var o = state.optim, s = [];
    var P = state.statut.params;

    // Comparer salaire vs dividendes : on teste une variante
    if(r.ca > 0 && r.distribuable > 1000){
      var variante = calculerOptim(
        Object.assign({}, o.form, { remMensuelle: String((parseFloat(o.form.remMensuelle)||0) + 500) }),
        o.charges, o.leviers, o.statut, caOptim());
      var delta = variante.argentPerso - r.argentPerso;
      if(Math.abs(delta) > 200){
        s.push(delta > 0
          ? 'En te versant 500 € de plus par mois, ton revenu personnel net augmenterait d’environ '
            + fmtEur(delta) + ' par an : la rémunération est ici moins coûteuse que la distribution.'
          : 'En te versant 500 € de plus par mois, tu perdrais environ ' + fmtEur(-delta)
            + ' par an : à ton niveau, les dividendes ressortent plus efficaces que le salaire.');
      }
    }
    if(scores.tresorerie < 40 && r.tresorerieFinale < r.chargesTotales / 4)
      s.push('Ta société ne conserve presque rien. Garder l’équivalent de quelques mois de charges '
           + '(' + fmtEur(r.chargesTotales / 4) + ' environ) donnerait de la marge en cas de coup dur.');
    if(r.tresorerieFinale > r.chargesTotales * 1.5 && r.chargesTotales > 0)
      s.push('Ta trésorerie est confortable (' + fmtEur(r.tresorerieFinale) + '). Une partie pourrait '
           + 'financer du matériel professionnel, déductible et générateur de TVA récupérable.');
    if((parseFloat(o.leviers.mutuelle)||0) === 0 || (parseFloat(o.leviers.prevoyance)||0) === 0)
      s.push('Mutuelle et prévoyance prises en charge par la société sont des charges déductibles qui '
           + 'améliorent ta protection sans passer par du salaire net imposé.');
    if(r.assujetti && r.tvaRecup === 0 && r.chargesTotales > 0)
      s.push('Aucune TVA récupérable n’est détectée alors que tu es assujetti : vérifie les taux de TVA '
           + 'renseignés sur tes charges.');
    if(!r.assujetti && r.chargesTotales > r.ca * 0.2)
      s.push('Tes charges sont importantes et tu n’es pas assujetti à la TVA : le simulateur « Passer à '
           + 'la TVA » te dira si l’option serait rentable.');
    if(r.tauxPrelevement > 0.45)
      s.push('Ton taux de prélèvement global atteint ' + fmtPct(r.tauxPrelevement) + '. Tester d’autres '
           + 'répartitions salaire / dividendes / trésorerie peut faire une vraie différence.');

    // Adapter selon l'objectif déclaré
    var parObjectif = {
      revenu:'Ton objectif est de maximiser ton revenu : compare surtout la ligne « Argent personnel » entre plusieurs réglages.',
      impots:'Ton objectif est de réduire tes impôts : regarde l’effet des charges déductibles et des leviers sociaux sur l’IS.',
      tresorerie:'Ton objectif est de conserver de la trésorerie : augmente le curseur « conservé dans la société » et observe l’IS.',
      investir:'Ton objectif est d’investir : ajoute l’investissement en charge et vois l’effet immédiat sur le résultat imposable.',
      immobilier:'Ton objectif est un achat immobilier : une rémunération régulière et déclarée pèse souvent plus qu’un revenu global élevé auprès des banques.',
      social:'Ton objectif est ta protection sociale : le salaire et les leviers (mutuelle, prévoyance, retraite) comptent davantage que les dividendes.',
    };
    if(parObjectif[o.form.objectif]) s.unshift(parObjectif[o.form.objectif]);
    return s;
  }

  function optimFormHtml(){
    var o = state.optim, f = o.form;
    var champ = function(nom, label, valeur, opts){
      opts = opts || {};
      var inner;
      if(opts.options){
        inner = '<select data-optim-field="'+nom+'">' + opts.options.map(function(op){
          return '<option value="'+esc(op.v)+'"'+(String(valeur)===String(op.v)?' selected':'')+'>'
            + esc(op.l)+'</option>'; }).join('') + '</select>';
      } else {
        inner = '<input data-optim-field="'+nom+'" type="'+(opts.type||'text')+'" value="'+esc(valeur||'')
          + '" placeholder="'+esc(opts.ph||'')+'"'+(opts.type==='number'?' min="0" step="any"':'')+'>';
      }
      return '<div class="field"><label>'+esc(label)+'</label>'+inner
        + (opts.aide ? '<div class="field-eg">'+esc(opts.aide)+'</div>' : '') + '</div>';
    };

    var chargesHtml = o.charges.map(function(c, i){
      return '<div class="ocharge">'
        + '<div class="ocharge-1">'
          + '<input data-ocharge-field="nom" data-i="'+i+'" value="'+esc(c.nom||'')+'" placeholder="Nom">'
          + '<button class="icon-btn danger" data-action="ocharge-remove" data-i="'+i+'" title="Supprimer">✕</button>'
        + '</div>'
        + '<div class="ocharge-2">'
          + '<input data-ocharge-field="montant" data-i="'+i+'" type="number" min="0" step="any" '
            + 'value="'+esc(c.montant||'')+'" placeholder="0 €">'
          + '<select data-ocharge-field="frequence" data-i="'+i+'">'
            + '<option value="mensuelle"'+(c.frequence==='mensuelle'?' selected':'')+'>/ mois</option>'
            + '<option value="annuelle"'+(c.frequence==='annuelle'?' selected':'')+'>/ an</option>'
          + '</select>'
          + '<select data-ocharge-field="tauxTVA" data-i="'+i+'">'
            + TVA_PARAMS.tauxDepense.map(function(t){
                return '<option value="'+t.v+'"'+(String(c.tauxTVA)===String(t.v)?' selected':'')+'>TVA '+t.l+'</option>';
              }).join('')
          + '</select>'
          + '<select data-ocharge-field="deductible" data-i="'+i+'">'
            + [['100','Déductible'],['50','50 %'],['0','Non déductible']].map(function(d){
                return '<option value="'+d[0]+'"'+(String(c.deductible)===d[0]?' selected':'')+'>'+d[1]+'</option>';
              }).join('')
          + '</select>'
        + '</div>'
        + '</div>';
    }).join('');

    var importables = depensesImportables().length;

    var leviersHtml = OPTIM_LEVIERS.map(function(L){
      var v = parseFloat(o.leviers[L.v]) || 0;
      var actif = v > 0;
      return '<div class="levier'+(actif?' on':'')+'">'
        + '<button class="levier-t" data-action="levier-toggle" data-k="'+L.v+'">'
          + '<span class="levier-check">'+(actif?'✓':'')+'</span>'
          + '<span>'+esc(L.l)+'</span></button>'
        + (actif ? '<div class="levier-m"><input data-levier-field="'+L.v+'" type="number" min="0" '
            + 'step="any" value="'+v+'"><span>€ / '+L.unite+'</span></div>' : '')
        + '</div>';
    }).join('');

    return '<div class="card optim-reglages">'
      + '<div class="card-title">Tes réglages</div>'
      + '<div class="seg-group" style="width:100%;margin-bottom:16px">'
        + '<button class="seg'+(o.statut==='eurl'?' on':'')+'" data-action="optim-statut" data-s="eurl" style="flex:1">EURL</button>'
        + '<button class="seg'+(o.statut==='sasu'?' on':'')+'" data-action="optim-statut" data-s="sasu" style="flex:1">SASU</button>'
      + '</div>'
      + champ('objectif', 'Ton objectif principal', f.objectif, { options:OPTIM_OBJECTIFS })
      + '<div class="field"><label>Dividendes distribués : <strong>'+esc(f.dividendes)+' %</strong> du distribuable</label>'
        + '<input data-optim-range="dividendes" type="range" min="0" max="100" step="5" value="'+esc(f.dividendes)+'"></div>'

      + (importables > 0
          ? '<button class="btn-import" data-action="optim-import">↓ Reprendre la déductibilité analysée '
            + 'sur '+importables+' dépense'+(importables>1?'s':'')+'</button>'
          : '')
      + (o.importInfo ? '<div class="import-info">'+esc(o.importInfo)+'</div>' : '')

      + '<div class="card-title" style="margin-top:22px">Leviers d’optimisation</div>'
      + '<div class="field-eg" style="margin-bottom:10px">Chacun est une charge déductible pour la société. '
        + 'Les plafonds d’exonération propres à chaque dispositif ne sont pas vérifiés ici.</div>'
      + '<div class="leviers">'+leviersHtml+'</div>'
      + '</div>';
  }

  function optimResultsHtml(){
    var o = state.optim;
    var r = optimResultat();
    var scores = scoresOptim(r, o.leviers);
    var suggestions = suggestionsOptim(r, scores);
    var estSasu = o.statut === 'sasu';

    var ligne = function(label, valeur, opts){
      opts = opts || {};
      return '<div class="vl-line'+(opts.fort?' fort':'')+'"><span>'+esc(label)+'</span>'
        + '<span'+(opts.couleur?' style="color:'+opts.couleur+'"':'')+'>'+valeur+'</span></div>';
    };

    var tableauPrincipal = '<div class="card"><div class="card-title">Ton tableau de bord</div>'
      + ligne('Chiffre d’affaires', fmtEur(r.ca))
      + ligne('Charges déductibles', '− ' + fmtEur(r.chargesTotales))
      + (r.assujetti && r.tvaRecup > 0
          ? ligne('dont TVA récupérée', '+ ' + fmtEur(r.tvaRecup), { couleur:STATUT.vert.color }) : '')
      + ligne(estSasu ? 'Salaire brut' : 'Rémunération du gérant',
              '− ' + fmtEur(estSasu ? r.brut : r.remuneration))
      + ligne(estSasu ? 'Charges patronales' : 'Cotisations TNS',
              '− ' + fmtEur(estSasu ? r.patronales : r.cotisations))
      + ligne('Résultat avant impôt', fmtEur(r.resultat), { fort:true })
      + ligne('Impôt sur les sociétés', '− ' + fmtEur(r.is))
      + ligne('Dividendes distribués', fmtEur(r.dividendes))
      + ligne('PFU sur dividendes', '− ' + fmtEur(r.pfu))
      + ligne('Impôt sur le revenu', '− ' + fmtEur(r.ir))
      + '<div class="vl-line fort" style="border-top:1px solid var(--border);margin-top:8px;padding-top:12px">'
        + '<span>Argent personnel disponible</span>'
        + '<span style="color:'+STATUT.vert.color+'">'+fmtEur(r.argentPerso)+'</span></div>'
      + ligne('soit par mois', fmtEur(r.argentPerso / 12))
      + ligne('Trésorerie laissée dans la société', fmtEur(r.tresorerieFinale))
      + (r.plafonnee ? '<div class="vl-note" style="background:#fffbeb">Ta rémunération souhaitée dépasse '
          + 'ce que le chiffre d’affaires permet : elle a été ramenée au maximum possible.</div>' : '')
      + '</div>';

    var scoresHtml = '<div class="card"><div class="card-title">Santé de ta société</div>'
      + '<div class="scores">'
        + anneauScore(scores.global, 'Global', 86)
        + anneauScore(scores.remuneration, 'Rémunération')
        + anneauScore(scores.tresorerie, 'Trésorerie')
        + anneauScore(scores.fiscal, 'Fiscalité')
        + anneauScore(scores.charges, 'Charges')
        + anneauScore(scores.social, 'Social')
      + '</div>'
      + '<div class="field-eg">Indicateurs indicatifs, calculés à partir de règles simples (part de la '
        + 'rémunération, mois de charges couverts, taux de prélèvement…). Ce ne sont pas des normes fiscales.</div>'
      + '</div>';

    var suggestionsHtml = suggestions.length
      ? '<div class="card tinted"><div class="card-title">Pistes de réflexion</div>'
        + '<ul class="res-list">' + suggestions.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')
        + '</ul>'
        + '<div class="field-eg">Ces pistes sont générées à partir de tes chiffres. Elles ne remplacent pas '
          + 'l’avis d’un expert-comptable.</div></div>'
      : '';

    var scen = o.scenarios.length
      ? '<div class="card"><div class="card-title">Mes scénarios</div>'
        + '<div class="scen-list">' + o.scenarios.map(function(s, i){
            return '<div class="scen">'
              + '<button class="scen-load" data-action="scen-load" data-i="'+i+'">'
                + '<div class="scen-n">'+esc(s.nom)+'</div>'
                + '<div class="scen-m">'+esc(s.statut.toUpperCase())+' · CA '+fmtEur(s.ca)
                  + ' · '+fmtEur(s.argentPerso)+' perso</div></button>'
              + '<button class="icon-btn danger" data-action="scen-delete" data-i="'+i+'" title="Supprimer">✕</button>'
              + '</div>';
          }).join('') + '</div></div>'
      : '';

    return '<div class="optim-top">'
        + '<div class="optim-kpi"><div class="optim-kpi-l">Argent personnel</div>'
          + '<div class="optim-kpi-v">'+fmtEur(r.argentPerso)+'</div>'
          + '<div class="optim-kpi-s">'+fmtEur(r.argentPerso/12)+' par mois</div></div>'
        + '<div class="optim-kpi"><div class="optim-kpi-l">Trésorerie conservée</div>'
          + '<div class="optim-kpi-v">'+fmtEur(r.tresorerieFinale)+'</div>'
          + '<div class="optim-kpi-s">dans la société</div></div>'
        + '<div class="optim-kpi"><div class="optim-kpi-l">Prélèvements totaux</div>'
          + '<div class="optim-kpi-v">'+fmtEur(r.prelevements)+'</div>'
          + '<div class="optim-kpi-s">'+fmtPct(r.tauxPrelevement)+' du chiffre d’affaires</div></div>'
      + '</div>'
      + scoresHtml
      + '<div class="vl-cards">' + tableauPrincipal + repartitionOptim(r) + '</div>'
      + tableauOptimisation(r, scores)
      + suggestionsHtml
      + scen
      + simPartenaireHtml(3, 'Ces arbitrages méritent un œil expert. Icon Invest optimise ta '
          + 'société à tes côtés, avec une équipe qui parle ton langage.');
  }

  // Carte d'un scénario enregistré, sur l'écran de lancement.
  function scenCarteHtml(sc, i){
    var d = new Date(sc.date);
    var jour = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    return '<div class="tva-sim" style="--c:#ca8a04">'
      + '<button class="tva-sim-x" data-action="scen-delete" data-i="'+i+'" title="Supprimer">✕</button>'
      + '<div class="tva-sim-date">'+esc(jour)+'</div>'
      + '<div class="tva-sim-g" style="color:#a16207">'+fmtEur(sc.argentPerso)+'<span> / an</span></div>'
      + '<div class="tva-sim-l">'+esc(STATUT_LABELS[sc.statut] || sc.statut)+'</div>'
      + '<div class="tva-sim-meta">CA '+fmtEur(sc.ca)+'</div>'
      + '<button class="tva-sim-btn" data-action="scen-load" data-i="'+i+'">Reprendre ce scénario →</button>'
      + '</div>';
  }

  function optimHtml(){
    var ca = caOptimReel();
    var maxCurseur = Math.max(250000, Math.round(ca * 2 / 10000) * 10000);
    var proj = state.optim.projection;
    // « Enregistrer ce scénario » n'a de sens qu'une fois qu'on a bougé quelque
    // chose : avant, il n'y a rien à mémoriser.
    var modifie = proj !== null || Object.keys(state.optim.leviers || {}).some(function(k){
      return (parseFloat(state.optim.leviers[k]) || 0) > 0; });
    var avis = estMicro(state.profil)
      ? '<div class="sim-avis">🎛️ Rémunération, dividendes et trésorerie n’existent pas en '
        + 'auto-entreprise. Tu peux explorer ce cockpit pour voir à quoi ressemble le pilotage '
        + 'd’une société</div>' : '';
    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + avis
      + '<div class="statut-bar">'
        + '<div class="proj" style="max-width:520px">'
          + '<div class="proj-l">Projection du chiffre d’affaires'
            + (proj !== null ? ' <button class="btn-link" data-action="optim-reset-proj">- revenir à '
                + fmtEur(ca) + '</button>' : '') + '</div>'
          + '<input type="range" data-optim-range="projection" min="20000" max="'+maxCurseur+'" step="5000" '
            + 'value="'+(proj !== null ? proj : ca)+'">'
          + '<div class="proj-v" id="optim-proj-value">'+fmtEur(proj !== null ? proj : ca)+'</div>'
        + '</div>'
        + (modifie
            ? '<button class="btn-primary" data-action="scen-save">Enregistrer ce scénario</button>'
            : '<div class="scen-hint">Bouge un levier ou le curseur pour comparer des scénarios</div>')
      + '</div>'
      + simOutilsHtml('optim', BESOINS_SIM.optim)
      + '<div id="optim-results">' + optimResultsHtml() + '</div>'
      + optimFormHtml()
      + '<div class="final-note">Estimation indicative fondée sur les informations renseignées et sur des '
        + 'paramètres sociaux et fiscaux <strong>à valider</strong>. Elle ne constitue ni un conseil '
        + 'juridique, ni fiscal, ni comptable. Certaines optimisations dépendent de ta situation '
        + 'personnelle, de ton activité et de la nature exacte de tes dépenses ; les plafonds d’exonération '
        + 'des dispositifs (mutuelle, prévoyance, épargne retraite, titres-restaurant…) ne sont pas '
        + 'vérifiés ici. Avant toute décision importante, fais valider ta stratégie par un expert-comptable.</div>'
      + '</div>';
  }

  function renderOptimResults(){
    var zone = document.getElementById('optim-results');
    if(zone) zone.innerHTML = optimResultsHtml();
  }

  // ===========================================================================
  // Simulateur : quand passer en société ? (temps réel, sans IA)
  // ===========================================================================
  var STATUT_LABELS = { micro:'Auto-entreprise', eurl:'EURL', sasu:'SASU' };

  function totalCharges(){
    return state.statut.charges.reduce(function(s, c){
      var m = parseFloat(c.montant) || 0;
      return s + (c.frequence === 'mensuelle' ? m * 12 : m);
    }, 0);
  }

  function statutInputs(){
    var f = state.statut.form;
    return {
      categorie: f.categorie, parts: f.parts,
      chargesAnnuelles: totalCharges(), investissement: f.investissement,
      remMensuelle: f.remMensuelle, dividendes: f.dividendes,
      versementLiberatoire: f.versementLiberatoire,
    };
  }

  function caReel(){
    var f = state.statut.form;
    var ca = parseFloat(f.caAnnuel) || 0;
    return f.caMensuel ? ca * 12 : ca;
  }
  function caAffiche(){
    return state.statut.projection !== null ? state.statut.projection : caReel();
  }
  function statutsVisibles(){
    var m = state.statut.mode;
    return m === 'eurl' ? ['micro','eurl'] : (m === 'sasu' ? ['micro','sasu'] : ['micro','eurl','sasu']);
  }

  // Classe une ligne du tableau : vert = meilleur, rouge = moins bon.
  function couleursLigne(valeurs, plusHautEstMieux){
    var cles = Object.keys(valeurs).filter(function(k){ return isFinite(valeurs[k]); });
    if(cles.length < 2) return {};
    var tri = cles.slice().sort(function(a, b){
      return plusHautEstMieux ? valeurs[b] - valeurs[a] : valeurs[a] - valeurs[b];
    });
    var res = {};
    // Si tout est identique, pas de couleur.
    if(Math.abs(valeurs[tri[0]] - valeurs[tri[tri.length-1]]) < 1) return {};
    res[tri[0]] = STATUT.vert.color;
    res[tri[tri.length-1]] = STATUT.rouge.color;
    if(tri.length > 2) res[tri[1]] = STATUT.orange.color;
    return res;
  }

  // --- Graphique d'évolution : 3 courbes + croisements ---
  function grapheEvolution(){
    var f = statutInputs();
    var cles = statutsVisibles();
    var maxCA = Math.max(150000, caAffiche() * 1.4);
    var minCA = 10000, pas = (maxCA - minCA) / 48;
    var series = {}; cles.forEach(function(k){ series[k] = []; });
    var maxNet = 0;
    for(var ca = minCA; ca <= maxCA + 1; ca += pas){
      var r = calculerStatuts(f, ca);
      cles.forEach(function(k){
        series[k].push({ ca: ca, net: r[k].net });
        if(r[k].net > maxNet) maxNet = r[k].net;
      });
    }
    if(maxNet <= 0) maxNet = 1;

    var W = 820, H = 300, PL = 58, PR = 14, PT = 14, PB = 34;
    var x = function(ca){ return PL + (ca - minCA) / (maxCA - minCA) * (W - PL - PR); };
    var y = function(net){ return PT + (1 - Math.max(0, net) / maxNet) * (H - PT - PB); };
    var couleurs = { micro:'#2f6bff', eurl:'#10b981', sasu:'#8b5cf6' };

    var lignes = cles.map(function(k){
      var pts = series[k].map(function(p){ return x(p.ca).toFixed(1) + ',' + y(p.net).toFixed(1); }).join(' ');
      return '<polyline points="'+pts+'" fill="none" stroke="'+couleurs[k]+'" stroke-width="2.5" '
        + 'stroke-linejoin="round" stroke-linecap="round"/>';
    }).join('');

    // Repères horizontaux
    var grille = '', etiquettes = '';
    for(var i = 0; i <= 4; i++){
      var v = maxNet * i / 4, yy = y(v);
      grille += '<line x1="'+PL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-PR)+'" y2="'+yy.toFixed(1)
        + '" stroke="#e7edf6" stroke-width="1"/>';
      etiquettes += '<text x="'+(PL-8)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" font-size="10" '
        + 'fill="#8a97ad" font-weight="600">'+Math.round(v/1000)+'k</text>';
    }
    // Repères verticaux
    for(var c = 25000; c < maxCA; c += 25000){
      etiquettes += '<text x="'+x(c).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" font-size="10" '
        + 'fill="#8a97ad" font-weight="600">'+Math.round(c/1000)+'k</text>';
    }

    // Position actuelle
    var caNow = caAffiche();
    var repere = '<line x1="'+x(caNow).toFixed(1)+'" y1="'+PT+'" x2="'+x(caNow).toFixed(1)+'" y2="'+(H-PB)
      + '" stroke="#0f1b33" stroke-width="1.5" stroke-dasharray="4 3"/>'
      + '<text x="'+x(caNow).toFixed(1)+'" y="'+(PT+11)+'" text-anchor="middle" font-size="10" '
      + 'font-weight="800" fill="#0f1b33">'+fmtEur(caNow)+'</text>';

    // Croisements avec l'auto-entreprise
    var croisements = '';
    ['eurl','sasu'].forEach(function(k){
      if(cles.indexOf(k) === -1) return;
      var b = pointDeBascule(f, k, caAffiche());
      if(b === null || b.deja || b.ca > maxCA) return;
      var r = calculerStatuts(f, b.ca);
      croisements += '<circle cx="'+x(b.ca).toFixed(1)+'" cy="'+y(r[k].net).toFixed(1)
        + '" r="5" fill="#fff" stroke="'+couleurs[k]+'" stroke-width="2.5"/>';
    });

    var legende = cles.map(function(k){
      return '<span class="lg"><span class="lg-dot" style="background:'+couleurs[k]+'"></span>'
        + esc(STATUT_LABELS[k]) + '</span>';
    }).join('');

    return '<div class="card"><div class="card-title">Ton revenu net selon ton chiffre d’affaires</div>'
      + '<div class="graph-legend">'+legende+'</div>'
      + '<svg viewBox="0 0 '+W+' '+H+'" class="graph" preserveAspectRatio="none">'
        + grille + lignes + croisements + repere + etiquettes
      + '</svg>'
      + '<div class="field-eg">Les cercles marquent le moment où une société dépasse l’auto-entreprise. '
        + 'La ligne pointillée est ta position actuelle.</div>'
      + '</div>';
  }

  // --- Zone recalculée à chaque frappe ---
  // « Où part ton chiffre d'affaires » - un anneau par statut, pour voir d'un
  // coup d'œil ce qui reste et ce qui part, sans lire un tableau.
  var PARTS_CA = [
    { k:'net',        l:'Dans ta poche', c:'#10b981' },
    { k:'cotisations',l:'Cotisations',   c:'#f97316' },
    { k:'fiscalite',  l:'Impôts',        c:'#8b5cf6' },
    { k:'charges',    l:'Charges',       c:'#94a3b8' },
  ];

  function anneauCa(res, ca, taille){
    var R = taille / 2 - 9, C = 2 * Math.PI * R, offset = 0;
    var arcs = PARTS_CA.map(function(p){
      var v = Math.max(0, res[p.k] || 0);
      var part = ca > 0 ? v / ca : 0;
      var arc = '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+R+'" fill="none" '
        + 'stroke="'+p.c+'" stroke-width="15" stroke-linecap="butt" '
        + 'stroke-dasharray="'+(part * C)+' '+C+'" stroke-dashoffset="'+(-offset * C)+'" '
        + 'transform="rotate(-90 '+(taille/2)+' '+(taille/2)+')"><title>'
        + esc(p.l)+' - '+fmtEur(v)+'</title></circle>';
      offset += part;
      return arc;
    }).join('');
    var pctNet = ca > 0 ? Math.round((res.net || 0) / ca * 100) : 0;
    return '<svg viewBox="0 0 '+taille+' '+taille+'" width="'+taille+'" height="'+taille+'">'
      + '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+R+'" fill="none" stroke="#eef1f6" stroke-width="15"/>'
      + arcs
      + '<text x="'+(taille/2)+'" y="'+(taille/2 - 2)+'" text-anchor="middle" '
        + 'font-size="26" font-weight="800" fill="#0f1b33">'+pctNet+'%</text>'
      + '<text x="'+(taille/2)+'" y="'+(taille/2 + 17)+'" text-anchor="middle" '
        + 'font-size="11" font-weight="700" fill="#8a97ad">pour toi</text>'
      + '</svg>';
  }

  function camembertsHtml(r, cles, ca){
    if(!(ca > 0)) return '';
    var anneaux = cles.map(function(k){
      var res = r[k];
      var lignes = PARTS_CA.map(function(p){
        var v = Math.max(0, res[p.k] || 0);
        if(v <= 0) return '';
        return '<div class="cam-l"><span class="cam-p" style="background:'+p.c+'"></span>'
          + '<span class="cam-n">'+esc(p.l)+'</span>'
          + '<span class="cam-v">'+fmtEur(v)+'</span></div>';
      }).join('');
      return '<div class="cam"><div class="cam-t">'+esc(STATUT_LABELS[k])+'</div>'
        + anneauCa(res, ca, 128)
        + '<div class="cam-legende">'+lignes+'</div></div>';
    }).join('');
    return '<div class="card"><div class="card-title">Où part ton chiffre d’affaires ?</div>'
      + '<div class="field-eg" style="margin-bottom:14px">Sur '+fmtEur(ca)+' encaissés - '
      + 'survole un anneau pour le détail.</div>'
      + '<div class="cams">'+anneaux+'</div></div>';
  }

  function statutResultsHtml(){
    var f = statutInputs();
    var ca = caAffiche();
    var cles = statutsVisibles();
    var r = calculerStatuts(f, ca);
    var P = state.statut.params;

    // Meilleur statut
    var meilleur = cles.slice().sort(function(a,b){ return r[b].net - r[a].net; })[0];
    var ecartMicro = r[meilleur].net - r.micro.net;

    // --- Synthèse ---
    var cartes = cles.map(function(k){
      var best = (k === meilleur && cles.length > 1);
      return '<div class="stat-card'+(best?' best':'')+'">'
        + '<div class="stat-card-t">'+esc(STATUT_LABELS[k])+(best?' · le plus avantageux':'')+'</div>'
        + '<div class="stat-card-n">'+fmtEur(r[k].net)+'</div>'
        + '<div class="stat-card-s">'+fmtEur(r[k].net/12)+' par mois</div>'
        + (r[k].plafonnee ? '<div class="stat-card-w">Rémunération limitée par le CA disponible</div>' : '')
        + '</div>';
    }).join('');

    // --- Recommandation ---
    var reco, recoCouleur, recoTitre;
    if(cles.length === 1 || meilleur === 'micro'){
      recoCouleur = STATUT.rouge.color;
      recoTitre = 'Ton auto-entreprise reste le statut le plus avantageux';
      var prochaine = null, prochainCA = null;
      ['eurl','sasu'].forEach(function(k){
        if(cles.indexOf(k) === -1) return;
        var b = pointDeBascule(f, k, ca);
        if(b !== null && !b.deja && (prochainCA === null || b.ca < prochainCA)){
          prochainCA = b.ca; prochaine = k;
        }
      });
      if(prochainCA !== null && prochainCA <= ca * 1.35){
        recoCouleur = STATUT.orange.color;
        recoTitre = 'Tu approches du seuil où une société devient plus intéressante';
        reco = 'À partir d’environ ' + fmtEur(prochainCA) + ' de chiffre d’affaires, une '
             + STATUT_LABELS[prochaine] + ' deviendrait plus avantageuse - soit '
             + fmtEur(prochainCA - ca) + ' de plus qu’aujourd’hui.';
      } else if(prochainCA !== null){
        reco = 'Le passage en société augmenterait tes coûts sans améliorer ton revenu disponible. '
             + 'Une ' + STATUT_LABELS[prochaine] + ' deviendrait intéressante vers '
             + fmtEur(prochainCA) + ' de chiffre d’affaires.';
      } else {
        reco = 'Avec les paramètres actuels, aucune société ne dépasse ton auto-entreprise sur la plage testée.';
      }
    } else {
      recoCouleur = STATUT.vert.color;
      recoTitre = 'Le passage en société semble pertinent';
      reco = 'Avec cette configuration, une ' + STATUT_LABELS[meilleur] + ' te laisserait environ '
           + fmtEur(ecartMicro) + ' de plus par an que ton auto-entreprise, soit '
           + fmtEur(ecartMicro/12) + ' par mois.';
    }

    // --- Points de bascule ---
    var basculesHtml = ['eurl','sasu'].filter(function(k){ return cles.indexOf(k) !== -1; }).map(function(k){
      var b = pointDeBascule(f, k, ca);
      return '<div class="bascule">'
        + '<div class="bascule-k">'+esc(STATUT_LABELS[k])+'</div>'
        + (b === null
            ? '<div class="bascule-v muted">Ne dépasse pas l’auto-entreprise sur la plage testée</div>'
            : (b.deja
                ? '<div class="bascule-v" style="color:'+STATUT.vert.color+'">Déjà plus avantageuse à ton '
                  + 'niveau de chiffre d’affaires actuel</div>'
                : '<div class="bascule-v">Devient plus avantageuse à partir de <strong>'+fmtEur(b.ca)+'</strong>'
                  + '<div class="field-eg">' + fmtEur(b.ca - ca) + ' de plus qu’aujourd’hui</div></div>'))
        + '</div>';
    }).join('');

    // --- Tableau comparatif coloré ---
    var val = function(k, champ){ return r[k][champ]; };
    var ligneTableau = function(label, champ, plusHautEstMieux, aide){
      var valeurs = {}; cles.forEach(function(k){ valeurs[k] = val(k, champ); });
      var couleurs = couleursLigne(valeurs, plusHautEstMieux);
      return '<tr><td><strong>'+esc(label)+'</strong>'
        + (aide ? '<div class="field-eg">'+esc(aide)+'</div>' : '') + '</td>'
        + cles.map(function(k){
            var c = couleurs[k];
            return '<td'+(c?' style="color:'+c+';font-weight:800"':'')+'>'+fmtEur(valeurs[k])+'</td>';
          }).join('') + '</tr>';
    };
    var tableau = '<div class="recap-scroll"><table class="recap-t" style="min-width:0"><thead><tr><th>Élément</th>'
      + cles.map(function(k){ return '<th>'+esc(STATUT_LABELS[k])+'</th>'; }).join('')
      + '</tr></thead><tbody>'
        + '<tr><td><strong>Chiffre d’affaires</strong></td>'
          + cles.map(function(){ return '<td>'+fmtEur(ca)+'</td>'; }).join('') + '</tr>'
        + ligneTableau('Charges', 'charges', false,
            'En auto-entreprise elles ne sont pas déductibles : elles sortent de ta poche.')
        + ligneTableau('Cotisations sociales', 'cotisations', false)
        + ligneTableau('Fiscalité', 'fiscalite', false, 'Impôt sur le revenu, IS, PFU et CFE cumulés.')
        + ligneTableau('Rémunération versée', 'remuneration', true)
        + ligneTableau('Dividendes', 'dividendes', true)
        + '<tr style="border-top:2px solid var(--border)"><td><strong>Argent réellement disponible</strong></td>'
          + (function(){
              var valeurs = {}; cles.forEach(function(k){ valeurs[k] = r[k].net; });
              var couleurs = couleursLigne(valeurs, true);
              return cles.map(function(k){
                var c = couleurs[k];
                return '<td style="font-size:15px;font-weight:800'+(c?';color:'+c:'')+'">'+fmtEur(r[k].net)+'</td>';
              }).join('');
            })()
        + '</tr>'
      + '</tbody></table></div>';
    state.statut.tableauHtml = tableau;   // repris par la modale « Comparatif détaillé »

    // --- Analyse automatique ---
    var analyses = {
      micro: 'Tes cotisations sont calculées directement sur ton chiffre d’affaires et restent simples, '
           + 'mais tes charges ne sont pas déductibles : ' + fmtEur(f.chargesAnnuelles + (parseFloat(f.investissement)||0))
           + ' sortent de ta poche sans réduire ton imposition.',
      eurl: 'L’EURL déduit tes charges du résultat, impose les bénéfices à l’IS (souvent plus bas que ton '
          + 'taux marginal) et permet d’arbitrer entre rémunération et dividendes. Les cotisations TNS du '
          + 'gérant sont plus faibles qu’en SASU, avec une protection sociale moindre.',
      sasu: 'La SASU offre une meilleure protection sociale (statut assimilé salarié), mais ses cotisations '
          + 'sont nettement plus lourdes : ' + fmtEur(r.sasu.cotisations) + ' ici. Les dividendes y échappent '
          + 'aux cotisations sociales, ce qui rend la stratégie de rémunération déterminante.',
    };
    var analyse = '<div class="vl-cards">' + cles.map(function(k){
      return '<div class="card"><div class="card-title">'+esc(STATUT_LABELS[k])+'</div>'
        + '<div class="res-line">'+esc(analyses[k])+'</div></div>';
    }).join('') + '</div>';

    // Verdict d'abord, chiffres ensuite, recommandations tout à la fin.
    return '<div class="statut-verdict" style="border-left-color:'+recoCouleur+'">'
        + '<div class="vl-verdict-t" style="color:'+recoCouleur+'">'+esc(recoTitre)+'</div>'
        + '<div class="vl-verdict-s">'+esc(reco)+'</div>'
      + '</div>'
      + '<div class="stat-cards">'+cartes+'</div>'
      + camembertsHtml(r, cles, ca)
      + (basculesHtml ? '<div class="card"><div class="card-title">Points de bascule</div>'
          + '<div class="bascules">'+basculesHtml+'</div></div>' : '')
      + grapheEvolution()
      + analyse
      + bandeauMillesimeHtml('statut')
      + '<div class="sim-reco-t">Pour aller plus loin</div>'
      + (meilleur !== 'micro'
          ? simPartenaireHtml(0, 'Une '+STATUT_LABELS[meilleur]+' semble t’avantager ? '
              + 'LegalPlace crée ta société sans paperasse, statuts et immatriculation compris')
          : '')
      + simPartenaireHtml(3, 'Avant de trancher, un avis d’expert peut valoir le coup. '
          + 'Icon Invest fait le point avec toi, sans jargon');
  }

  function statutParamsHtml(){
    var P = state.statut.params;
    // Chaque champ porte sa provenance : confirmé par la feuille de calcul de
    // l'utilisateur, ou simple ordre de grandeur.
    var badge = function(cle){
      var b = PARAM_BADGE[PARAM_SOURCE[cle] || 'estime'];
      return '<span class="pbadge" style="background:'+b.bg+';color:'+b.c+'" title="'+esc(b.t)+'">'
        + esc(b.l)+'</span>';
    };
    var pc = function(nom, label, valeur, cleSource, lexId){
      return '<div class="field"><label>'+esc(label)+(lexId?lexQ(lexId):'')+badge(cleSource || nom)+'</label>'
        + '<input data-param-field="'+nom+'" type="number" min="0" step="0.1" value="'+(valeur*100)+'"></div>';
    };
    var confirmes = Object.keys(PARAM_SOURCE).filter(function(k){ return PARAM_SOURCE[k] === 'confirme'; }).length;
    var total = Object.keys(PARAM_SOURCE).length;

    return '<div class="params-box">'
      + '<div class="vl-note" style="background:#fffbeb;margin-top:0">'
        + '<strong>' + confirmes + ' paramètres sur ' + total + '</strong> viennent de ta feuille de '
        + 'calcul. Les autres restent des <strong>ordres de grandeur</strong> : ajuste-les avec ton '
        + 'expert-comptable, ils déterminent tout le résultat.</div>'
      + '<div class="field-row">'
        + pc('micro.cotisations.'+state.statut.form.categorie, 'Cotisations micro (%)',
             P.micro.cotisations[state.statut.form.categorie], 'micro.cotisations', 'cotisations')
        + pc('eurl.cotisationsTNS', 'Cotisations TNS - EURL (%)', P.eurl.cotisationsTNS, null, 'tns')
      + '</div>'
      + '<div class="field-row">'
        + pc('sasu.patronales', 'Charges patronales - SASU (%)', P.sasu.patronales, null, 'assimile')
        + pc('sasu.salariales', 'Charges salariales - SASU (%)', P.sasu.salariales, null, 'assimile')
      + '</div>'
      + '<div class="field-eg" style="margin:-4px 0 12px">Ensemble, elles représentent environ '
        + Math.round((1 + P.sasu.patronales) / (1 - P.sasu.salariales) * 100 - 100)
        + ' % du salaire net - le « 88 % » de ta feuille de calcul.</div>'
      + '<div class="field-row">'
        + pc('is.tauxReduit', 'IS - taux réduit (%)', P.is.tauxReduit, null, 'is')
        + pc('is.tauxNormal', 'IS - taux normal (%)', P.is.tauxNormal, null, 'is')
      + '</div>'
      + '<div class="field-row">'
        + pc('pfu', 'PFU sur dividendes (%)', P.pfu, null, 'pfu')
        + '<div class="field"><label>CFE annuelle (€)'+lexQ('cfe')+badge('cfe')+'</label>'
          + '<input data-param-field="cfe" type="number" min="0" step="1" value="'+P.cfe+'"></div>'
      + '</div>'
      + '<div class="field"><label>Plafond du taux réduit d’IS (€)'+badge('is.plafondReduit')+'</label>'
        + '<input data-param-field="is.plafondReduit" type="number" min="0" step="1" value="'+P.is.plafondReduit+'"></div>'
      + '<button class="btn-link" data-action="params-save" style="margin-top:6px">'
        + '💾 Garder ces taux pour la prochaine fois</button>'
      + (state.statut.paramsSaved ? '<span class="profil-saved" style="margin-left:10px">✓ Enregistrés</span>' : '')
      + '</div>';
  }

  // Barre d'outils compacte : tout ce qui relève de la saisie est rangé dans
  // des boutons, pour laisser la place aux chiffres.
  function simOutilsHtml(cle, besoins){
    var secs = sectionsProfil();
    var manque = secs.filter(function(x){ return besoins.indexOf(x.id) >= 0 && !x.fiable; });
    var champs = [];
    manque.forEach(function(x){ champs = champs.concat(x.bloquants); });
    var nbCharges = (cle === 'statut' ? state.statut.charges : state.optim.charges)
                    .filter(function(c){ return c.nom && c.montant; }).length;
    return '<div class="sim-outils">'
      + '<button class="outil'+(champs.length ? ' alerte' : '')+'" data-action="'+cle+'-outil" data-o="profil">'
        + '<span class="outil-i">🗂</span>Profil'
        + (champs.length ? '<span class="outil-pastille" title="'+esc(champs.join(', '))+'">!</span>'
                         : '<span class="outil-ok">✓</span>')
      + '</button>'
      + '<button class="outil" data-action="'+cle+'-outil" data-o="charges">'
        + '<span class="outil-i">🧾</span>Charges<span class="outil-n">'+nbCharges+'</span></button>'
      + (cle === 'statut'
          ? '<button class="outil" data-action="statut-outil" data-o="tableau">'
            + '<span class="outil-i">📊</span>Comparatif détaillé</button>'
          : '')
      + '</div>';
  }

  // Total des charges du cockpit, pour la modale d'outil.
  function totalChargesOptim(){
    return (state.optim.charges || []).reduce(function(a, c){
      return a + annualiser(parseFloat(c.montant) || 0, c.frequence); }, 0);
  }

  // Modales d'outil : profil, charges, comparatif détaillé.
  function simOutilModalHtml(){
    var cle = state.statut.outil ? 'statut' : (state.optim.outil ? 'optim' : null);
    if(!cle) return '';
    var outil = state[cle].outil;
    var titres = { profil:'Tes informations', charges:'Tes charges professionnelles',
                   tableau:'Comparatif détaillé' };
    var corps = '';

    if(outil === 'profil'){
      var besoins = BESOINS_SIM[cle] || [];
      var manque = sectionsProfil().filter(function(x){ return besoins.indexOf(x.id) >= 0 && !x.fiable; });
      var champs = [];
      manque.forEach(function(x){ champs = champs.concat(x.bloquants); });
      var lignes = cle === 'statut'
        ? ['categorieFiscale','ca','versementLiberatoire','parts','remuneration','cfe']
        : ['forme','ca','tva','parts','remuneration','tresorerie'];
      corps = (champs.length
          ? '<div class="outil-alerte">⚠ À compléter pour un résultat fiable : <strong>'
            + champs.map(esc).join(', ') + '</strong></div>' : '')
        + '<div class="pb-items">' + lignes.map(function(k){
            return '<div class="pb-item"><span class="pb-k">'+esc(PROFIL_LIBELLES[k] || k)+'</span>'
              + '<span class="pb-v">'+esc(valeurProfil(k))+'</span></div>'; }).join('') + '</div>'
        + (cle === 'statut'
            ? '<div class="outil-sep">Propre à cette simulation</div>'
              + '<label class="tvo-lab">Investissement prévu cette année</label>'
              + '<div class="tvo-champ"><input data-statut-field="investissement" type="number" min="0" '
              + 'step="any" value="'+esc(state.statut.form.investissement || '')+'"><span>€</span></div>'
              + '<div class="tvo-aide">Matériel, véhicule… Déductible en société, jamais en micro</div>'
            : '')
        + '<div class="dga-btns" style="margin-top:18px">'
          + '<button class="dgf-btn sec" data-action="open-profil">Modifier mon profil →</button></div>';
    }

    if(outil === 'charges'){
      var liste = cle === 'statut' ? state.statut.charges : state.optim.charges;
      var cf = cle === 'statut' ? 'charge-field' : 'ocharge-field';
      var rows = liste.map(function(c, i){
        return '<div class="outil-charge-bloc">'
          + '<div class="outil-charge">'
            + '<input data-'+cf+'="nom" data-i="'+i+'" value="'+esc(c.nom||'')+'" placeholder="Nom de la charge">'
            + '<div class="outil-charge-m"><input data-'+cf+'="montant" data-i="'+i+'" type="number" '
              + 'min="0" step="any" value="'+esc(c.montant||'')+'" placeholder="0"><span>€</span></div>'
            + '<button class="tvo-ch-f" data-action="sim-charge-freq" data-cle="'+cle+'" data-i="'+i+'">'
              + (c.frequence === 'mensuelle' ? '/mois' : '/an')+'</button>'
            + '<button class="tvo-ch-x" data-action="'+(cle === 'statut' ? 'charge-remove' : 'ocharge-remove')
              + '" data-i="'+i+'" title="Retirer">✕</button>'
          + '</div>'
          + (c.nouvelle
              ? '<label class="outil-garder"><input type="checkbox" data-sim-garder="'+i+'" '
                + 'data-cle="'+cle+'"'+(c.dansProfil ? ' checked' : '')+'>'
                + '<span>Enregistrer aussi dans mon profil</span></label>'
              : '')
          + '</div>';
      }).join('');
      corps = '<div class="tvo-aide" style="margin:0 0 14px">Reprises de ton profil. Tu peux les ajuster '
          + 'ici pour tester : sans la case cochée, ton profil n’est pas modifié</div>'
        + '<div class="outil-charges">'+rows+'</div>'
        + '<button class="tvo-add" data-action="'+(cle === 'statut' ? 'charge-add' : 'ocharge-add')+'">'
          + '＋ Ajouter une charge</button>'
        + '<div class="outil-total">Total <strong>'
          + fmtEur(cle === 'statut' ? totalCharges() : totalChargesOptim())+'</strong> par an</div>';
    }

    if(outil === 'tableau') corps = state.statut.tableauHtml || '';

    return '<div class="overlay" data-action="sim-outil-close">'
      + '<div class="modal" style="width:'+(outil === 'tableau' ? '780' : '540')+'px" data-action="stop">'
        + '<div class="modal-head"><div class="modal-title">'+esc(titres[outil])+'</div></div>'
        + '<div class="modal-body">'+corps+'</div>'
        + '<div class="modal-foot"><button class="btn-primary" data-action="sim-outil-close">Fermer</button></div>'
      + '</div></div>';
  }

  function statutHtml(){
    var ca = caReel();
    var maxCurseur = Math.max(150000, Math.round(ca * 2 / 10000) * 10000);
    var proj = state.statut.projection;
    var mode = state.statut.mode;
    var bouton = function(v, l){
      return '<button class="seg'+(mode===v?' on':'')+'" data-action="statut-mode" data-mode="'+v+'">'
        + esc(l)+'</button>';
    };
    // Contrôle de cohérence, en bandeau discret plutôt qu'en pop-up bloquante.
    var deja = estSociete(state.profil)
      ? '<div class="sim-avis">🏛️ Tu es déjà en '+esc(state.profil.forme)+'. Ce comparateur sert '
        + 'surtout à vérifier que ton statut reste le bon</div>' : '';

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + deja
      + '<div class="statut-bar">'
        + '<div class="seg-group">'
          + bouton('eurl','Auto-entreprise vs EURL')
          + bouton('sasu','Auto-entreprise vs SASU')
          + bouton('tous','Les trois')
        + '</div>'
        + '<div class="proj">'
          + '<div class="proj-l">Projection du chiffre d’affaires'
            + (proj !== null ? ' <button class="btn-link" data-action="statut-reset-proj">revenir à '
                + fmtEur(ca) + '</button>' : '') + '</div>'
          + '<input type="range" data-statut-range min="10000" max="'+maxCurseur+'" step="1000" '
            + 'value="'+(proj !== null ? proj : ca)+'">'
          + '<div class="proj-v" id="proj-value">'+fmtEur(proj !== null ? proj : ca)+'</div>'
        + '</div>'
      + '</div>'
      + simOutilsHtml('statut', BESOINS_SIM.statut)
      + '<div id="statut-results">' + statutResultsHtml() + '</div>'
      + '<div class="final-note">Estimation fondée sur les informations renseignées et sur des paramètres '
        + 'fiscaux <strong>à valider</strong>. Elle ne constitue ni un conseil juridique, ni fiscal, ni '
        + 'comptable. Le résultat réel dépend de ton foyer fiscal, de tes choix de rémunération, de ton '
        + 'régime de TVA et des évolutions législatives. Avant toute création de société ou changement de '
        + 'statut, fais valider ton projet par un expert-comptable.</div>'
      + '</div>';
  }


  // Recalcule uniquement la zone de résultats (temps réel, sans perdre le focus).
  function renderStatutResults(){
    var zone = document.getElementById('statut-results');
    if(zone) zone.innerHTML = statutResultsHtml();
  }

  // ===========================================================================
  // Simulateur : est-ce intéressant de passer à la TVA ?
  // ===========================================================================
  var TVA_CATEGORIES = [
    {v:'',           l:'- non précisée -'},
    {v:'informatique', l:'Matériel informatique'}, {v:'logiciel', l:'Logiciel / abonnement'},
    {v:'soustraitance',l:'Sous-traitance'},        {v:'local',    l:'Local professionnel'},
    {v:'publicite',   l:'Publicité'},              {v:'deplacement', l:'Déplacement'},
    {v:'vehicule',    l:'Véhicule'},               {v:'carburant',l:'Carburant'},
    {v:'restaurant',  l:'Restaurant'},             {v:'hebergement', l:'Hébergement'},
    {v:'cadeau',      l:'Cadeau'},                 {v:'mixte',    l:'Frais mixtes (pro + perso)'},
    {v:'autre',       l:'Autre'},
  ];

  function tvaField(name, label, value, o){
    o = o || {};
    var req = o.req ? ' <span class="req">*</span>' : '';
    var inner;
    if(o.options){
      inner = '<select data-tva-field="'+name+'">'
        + (o.placeholder ? '<option value=""'+(value?'':' selected')+'>- choisir -</option>' : '')
        + o.options.map(function(op){
            var v = op.v !== undefined ? op.v : op, l = op.l !== undefined ? op.l : op;
            return '<option value="'+esc(v)+'"'+(String(value)===String(v)?' selected':'')+'>'+esc(l)+'</option>';
          }).join('') + '</select>';
    } else {
      inner = '<input data-tva-field="'+name+'" type="'+(o.type||'text')+'" value="'+esc(value||'')
        + '" placeholder="'+esc(o.ph||'')+'"'+(o.type==='number'?' min="0" step="any"':'')+'>';
    }
    return '<div class="field"><label>'+esc(label)+req+'</label>'+inner
      + (o.aide ? '<div class="field-eg">'+esc(o.aide)+'</div>' : '') + '</div>';
  }

  function tvaDepCardHtml(d, i){
    var rempli = !!(d.nom && d.nom.trim());
    var multi = state.tva.depenses.length > 1;
    var f = function(n, label, val, o){
      o = o || {}; o.dep = i;
      var attrs = 'data-tvadep-field="'+n+'" data-i="'+i+'"';
      var inner;
      if(o.options){
        inner = '<select '+attrs+'>' + o.options.map(function(op){
          var v = op.v !== undefined ? op.v : op, l = op.l !== undefined ? op.l : op;
          return '<option value="'+esc(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+esc(l)+'</option>';
        }).join('') + '</select>';
      } else {
        inner = '<input '+attrs+' type="'+(o.type||'text')+'" value="'+esc(val||'')
          + '" placeholder="'+esc(o.ph||'')+'"'+(o.type==='number'?' min="0" step="any"':'')+'>';
      }
      return '<div class="field"><label>'+esc(label)+'</label>'+inner+'</div>';
    };
    return '<div class="dep-card">'
      + '<div class="dep-head">'
        + '<div class="dep-num">'+(i+1)+'</div>'
        + '<div class="dep-title'+(rempli?'':' empty')+'">'+esc(rempli ? d.nom : 'Nouvelle dépense')+'</div>'
        + '<div class="dep-actions">'
          + (multi ? '<button class="icon-btn danger" data-action="tvadep-remove" data-i="'+i+'" title="Supprimer">✕</button>' : '')
        + '</div>'
      + '</div>'
      + f('nom','Nom de la dépense', d.nom, {ph:'Ex : logiciel, loyer…'})
      + '<div class="field-row">'
        + f('montant','Montant TTC', d.montant, {type:'number', ph:'120 €'})
        + f('frequence','Fréquence', d.frequence, {options:[
            {v:'mensuelle',l:'Par mois'},{v:'annuelle',l:'Par an'},{v:'unique',l:'Achat unique'}]})
      + '</div>'
      + '<div class="field-row">'
        + f('taux','TVA sur la facture', d.taux, {options:TVA_PARAMS.tauxDepense})
        + f('recup','TVA récupérable', d.recup, {options:[
            {v:'100',l:'100 % - oui'},{v:'50',l:'50 % - partiellement'},
            {v:'0',l:'0 % - non'},{v:'80',l:'80 %'},{v:'20',l:'20 %'}]})
      + '</div>'
      + f('categorie','Catégorie (facultatif)', d.categorie, {options:TVA_CATEGORIES})
      + (TVA_PARAMS.categoriesSensibles.indexOf(d.categorie) !== -1
          ? '<div class="vl-note" style="background:#fffbeb">⚠️ La TVA de cette catégorie est souvent '
            + 'limitée ou exclue. Vérifie ton droit à déduction avant de compter ce gain.</div>' : '')
      + '</div>';
  }

  function tvaFormHtml(){
    var f = state.tva.form;
    var err = state.tva.formError ? '<div class="form-error">'+esc(state.tva.formError)+'</div>' : '';
    var somme = (parseFloat(f.partRecup)||0) + (parseFloat(f.partProNon)||0);
    var sommeOk = Math.round(somme) === 100;

    var h = state.tva.historique;
    var hist = h.length
      ? '<div class="tva-sims-t">'+(h.length > 1 ? 'Mes simulations' : 'Ma simulation')+'</div>'
        + '<div class="tva-sims">' + h.map(tvaHistItemHtml).join('') + '</div>'
      : '';

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + (!sommeOk
          ? '<div class="vl-note" style="margin-top:0;background:#fef2f2">La répartition de ta clientèle '
            + 'fait <strong>'+Math.round(somme)+'%</strong> au lieu de 100% - corrige-la dans ton profil.</div>' : '')
      + '<div class="sim-lancer tva">'
        + '<div class="sim-lancer-e">🧮</div>'
        + '<div class="sim-lancer-t">Faut-il passer à la TVA ?</div>'
        + '<div class="sim-lancer-s">On regarde ce que tu récupérerais sur tes achats, ce que ça '
          + 'coûterait à gérer, et le risque côté clients</div>'
        + '<button class="btn-primary" data-action="tva-onb-start">Lancer la simulation</button>'
      + '</div>'
      + err
      + bandeauMillesimeHtml('tva')
      + hist
      + '</div>';
  }

  function tvaResultHtml(){
    var r = state.tva.result;
    if(!r) return '';
    var st = { vert:STATUT.vert, orange:STATUT.orange, rouge:STATUT.rouge, gris:STATUT.gris }[r.avis];
    var g = r.principal.gain;

    var titre, sousTitre;
    if(r.avis === 'gris'){
      titre = 'Impossible de conclure de façon fiable';
      sousTitre = r.sommeParts !== 100
        ? 'La répartition de ta clientèle doit faire exactement 100% (actuellement ' + r.sommeParts + '%).'
        : 'Complète ton chiffre d’affaires et ton taux de TVA dans ton profil.';
    } else if(g > 0){
      titre = 'Tu récupérerais environ ' + fmtEur(g) + ' de TVA par an';
      sousTitre = 'En ajoutant la TVA à tes prix - ton revenu hors taxes reste identique. '
                + 'Reste à en retirer les coûts de gestion, ci-dessous.';
    } else {
      titre = 'Le passage à la TVA ne te rapporterait rien';
      sousTitre = 'Tes dépenses ne portent pas assez de TVA récupérable pour compenser.';
    }
    var libelle = { vert:'Le passage à la TVA semble financièrement intéressant',
                    orange:'Le passage à la TVA mérite d’être étudié',
                    rouge:'Le passage volontaire semble peu avantageux en l’état',
                    gris:'Informations insuffisantes' }[r.avis];

    // --- Clientèle ---
    var segLigne = function(label, part, montant, note){
      return '<div class="vl-line"><span>'+esc(label)+' - '+Math.round(part*100)+' %</span>'
        + '<span>'+fmtEur(montant)+'</span></div>'
        + (note ? '<div class="field-eg" style="margin:-4px 0 8px">'+esc(note)+'</div>' : '');
    };
    var carteClients = '<div class="card"><div class="card-title">Ta clientèle</div>'
      + segLigne('Récupèrent la TVA', r.parts.recup, r.segments.recup,
                 'Pour eux, la TVA ajoutée ne devrait pas être un coût définitif.')
      + segLigne('Ne la récupèrent pas', r.parts.proNon, r.segments.proNon,
                 'Pour eux, la TVA est une hausse de prix réelle.')
      + '</div>';

    // --- TVA récupérable ---
    var lignesDep = r.lignes.filter(function(l){ return l.ttcAnnuel > 0; }).map(function(l){
      return '<tr><td><strong>'+esc(l.nom)+'</strong>'
        + (l.sensible ? '<div class="field-eg">⚠️ déduction souvent limitée</div>' : '') + '</td>'
        + '<td>'+fmtEur(l.ttcAnnuel)+'</td>'
        + '<td>'+fmtPct(l.taux)+'</td>'
        + '<td>'+fmtEur(l.theorique)+'</td>'
        + '<td><strong>'+fmtEur(l.recuperable)+'</strong></td></tr>';
    }).join('');
    var carteDepenses = '<div class="card"><div class="card-title">TVA récupérable sur tes dépenses</div>'
      + (lignesDep
          ? '<div class="recap-scroll"><table class="recap-t" style="min-width:0">'
            + '<thead><tr><th>Dépense</th><th>TTC / an</th><th>Taux</th><th>TVA</th><th>Récupérable</th></tr></thead>'
            + '<tbody>'+lignesDep+'</tbody></table></div>'
          : '<div class="res-line">Aucune dépense renseignée.</div>')
      + '<div class="vl-line fort" style="border-top:1px solid var(--border);margin-top:10px;padding-top:12px">'
        + '<span>Total récupérable par an</span><span>'+fmtEur(r.tvaRecuperable)+'</span></div>'
      + '</div>';

    // --- Coût de gestion : trois scénarios, mis face au gain ---
    var lignesCouts = r.coutsScenarios.map(function(c){
      var net = c.gainMin;   // hypothèse haute du coût = le net le plus prudent
      var couleur = net >= 0 ? STATUT.vert.color : STATUT.rouge.color;
      var cout = c.max === 0 ? 'aucun coût'
               : fmtEur(c.min) + (c.max !== c.min ? ' à ' + fmtEur(c.max) : '') + ' / an';
      return '<div class="tva-cout">'
        + '<div class="tva-cout-h"><span class="tva-cout-l">'+esc(c.l)+'</span>'
          + '<span class="tva-cout-n" style="color:'+couleur+'">'
          + (net >= 0 ? '+' : '−') + fmtEur(Math.abs(net)) + '</span></div>'
        + '<div class="tva-cout-d">'+esc(c.d)+'</div>'
        + '<div class="tva-cout-c">Coût : '+cout+'</div>'
        + '</div>';
    }).join('');
    var carteCouts = '<div class="card"><div class="card-title">Ce que ça coûte à gérer</div>'
      + '<div class="field-eg" style="margin-bottom:14px">Passer à la TVA, c’est des déclarations '
        + 'régulières. Voici ce qu’il te resterait selon la façon de les gérer, en ordres de grandeur '
        + 'à confirmer avec les tarifs du moment</div>'
      + lignesCouts
      + '</div>';

    // --- Risque commercial estimé automatiquement ---
    var q = r.risque;
    var carteRisque = q.caExpose > 0
      ? '<div class="card"><div class="card-title">Le risque côté clients</div>'
        + '<div class="tva-risque-t">'+Math.round(r.parts.proNon*100)+'% de ton chiffre d’affaires '
          + 'vient de clients qui ne récupèrent pas la TVA</div>'
        + '<div class="field-eg" style="margin:6px 0 14px">Pour eux, ta hausse de prix est une vraie '
          + 'augmentation. Une partie pourrait s’en aller ou négocier.</div>'
        + '<div class="tva-risque-b">'
          + '<div class="tva-risque-v">'+Math.round(q.tauxMin*100)+' à '+Math.round(q.tauxMax*100)+'%</div>'
          + '<div class="tva-risque-l">de perte de clientèle plausible sur cette part</div>'
        + '</div>'
        + '<div class="vl-line" style="margin-top:12px"><span>Chiffre d’affaires exposé</span>'
          + '<span>'+fmtEur(q.caExpose)+'</span></div>'
        + '<div class="vl-line"><span>Perte estimée</span>'
          + '<span style="color:'+STATUT.rouge.color+'">−'+fmtEur(q.perteMin)+' à '+fmtEur(q.perteMax)+'</span></div>'
        + '<div class="field-eg">Estimation indicative bâtie sur ta répartition clientèle, pas une '
          + 'prédiction : tout dépend de ton positionnement et de la valeur perçue. '
          + 'Non déduite du gain - l’impact réel dépend de ta marge.</div>'
        + '</div>'
      : '<div class="card"><div class="card-title">Le risque côté clients</div>'
        + '<div class="tva-risque-t" style="color:'+STATUT.vert.color+'">Quasi nul 👌</div>'
        + '<div class="field-eg" style="margin-top:6px">Tous tes clients récupèrent la TVA : '
          + 'la leur facturer ne change presque rien pour eux.</div></div>';

    // --- Deux scénarios de prix, exprimés en euros concrets ---
    // Le tableau précédent parlait de « CA HT » et « TVA absorbée » : trop abstrait.
    // Ici on montre ce que le client paie et ce qui reste réellement.
    var caActuel = r.ca;
    var tvaAjoutee = caActuel * r.taux;              // prix inchangés + TVA par-dessus
    var htSiConserve = caActuel / (1 + r.taux);      // prix inchangés, TVA prise dedans
    var perteSiConserve = caActuel - htSiConserve;
    var carteScenarios = '<div class="card"><div class="card-title">Deux façons de gérer tes prix</div>'
      + '<div class="tva-scen">'
        + '<div class="tva-scen-c bon">'
          + '<div class="tva-scen-t">Tu ajoutes la TVA à tes prix</div>'
          + '<div class="tva-scen-l"><span>Tes clients paient</span>'
            + '<b>'+fmtEur(caActuel + tvaAjoutee)+'</b></div>'
          + '<div class="tva-scen-l"><span>dont TVA à reverser</span>'
            + '<b>'+fmtEur(tvaAjoutee)+'</b></div>'
          + '<div class="tva-scen-r"><span>Ce qu’il te reste</span>'
            + '<b style="color:'+STATUT.vert.color+'">'+fmtEur(caActuel)+'</b></div>'
          + '<div class="tva-scen-d">Ton revenu ne bouge pas. Tes clients qui récupèrent la TVA '
            + 'ne verront aucune différence, les autres paieront '+fmtPct(r.taux)+' de plus</div>'
        + '</div>'
        + '<div class="tva-scen-c mauvais">'
          + '<div class="tva-scen-t">Tu gardes tes prix actuels</div>'
          + '<div class="tva-scen-l"><span>Tes clients paient</span>'
            + '<b>'+fmtEur(caActuel)+'</b></div>'
          + '<div class="tva-scen-l"><span>dont TVA à reverser</span>'
            + '<b>'+fmtEur(perteSiConserve)+'</b></div>'
          + '<div class="tva-scen-r"><span>Ce qu’il te reste</span>'
            + '<b style="color:'+STATUT.rouge.color+'">'+fmtEur(htSiConserve)+'</b></div>'
          + '<div class="tva-scen-d">Rien ne change pour tes clients, mais tu absorbes la TVA : '
            + fmtEur(perteSiConserve)+' de revenu en moins sur l’année</div>'
        + '</div>'
      + '</div></div>';

    // --- Points de vigilance ---
    var vigilance = [];
    if(r.lignes.some(function(l){ return l.sensible; }))
      vigilance.push('Certaines dépenses relèvent de catégories dont la TVA est souvent limitée ou exclue : vérifie ton droit à déduction.');
    if(r.parts.sensible > 0.5)
      vigilance.push('Plus de la moitié de ta clientèle supporterait la TVA comme un coût : ta capacité à ajuster tes prix est déterminante.');
    vigilance.push('Le calcul suppose que tu ajoutes la TVA à tes prix. Si tu gardes tes prix TTC actuels, tu absorbes la TVA et ton revenu hors taxes baisse (voir le tableau des scénarios).');
    vigilance.push('Le passage à la TVA ajoute des obligations déclaratives et un suivi de trésorerie (la TVA encaissée ne t’appartient pas).');
    vigilance.push('Les seuils de franchise en base ne sont pas vérifiés ici : au-delà, la TVA devient obligatoire et non plus optionnelle.');
    vigilance.push('Opérations internationales, autoliquidation, TVA sur marge et régularisations ne sont pas prises en compte.');

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="res-topbar">'
        + '<h2>Résultat de la simulation</h2>'
        + '<div class="export-bar">'
          + '<button class="btn-ghost egal" data-action="tva-print">Imprimer / PDF</button>'
          + '<button class="btn-ghost egal" data-action="tva-hist">Mes simulations</button>'
          + '<button class="btn-primary egal" data-action="tva-new">Nouvelle simulation</button>'
        + '</div>'
      + '</div>'
      + '<div class="vl-verdict" style="border-left-color:'+st.color+'">'
        + '<div class="field-eg" style="margin-bottom:4px">'+esc(libelle)+'</div>'
        + '<div class="vl-verdict-t" style="color:'+st.color+'">'+esc(titre)+'</div>'
        + '<div class="vl-verdict-s">'+esc(sousTitre)+'</div>'
      + '</div>'
      + '<div class="vl-cards">' + carteClients + carteDepenses + '</div>'
      + carteScenarios
      + '<div class="vl-cards">' + carteCouts + carteRisque + '</div>'
      + '<div class="card tinted" style="margin-top:16px">'
        + '<div class="card-title">Points de vigilance</div>'
        + '<ul class="res-list">' + vigilance.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('') + '</ul>'
      + '</div>'
      + simPartenaireHtml(1, 'Passer à la TVA, c’est des déclarations en plus. Abby les génère '
          + 'depuis tes factures et t’évite les oublis.')
      + '<div class="final-note">Estimation indicative. Le droit de récupérer la TVA dépend de la nature de '
        + 'ton activité, de l’usage professionnel réel, de la conformité de tes factures et des exclusions '
        + 'applicables. Les conséquences commerciales d’une hausse de prix ne peuvent pas être prédites : '
        + 'elles reposent uniquement sur tes hypothèses. Avant d’opter pour la TVA, vérifie ta situation '
        + 'auprès de ton service des impôts des entreprises ou d’un expert-comptable.</div>'
      + '</div>';
  }

  // Carte d'une simulation enregistrée : date, verdict, accès au détail.
  function tvaHistItemHtml(sim, i){
    var d = new Date(sim.date);
    var jour = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    var heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    var st = STATUT[sim.avis] || STATUT.gris;
    var libelle = { vert:'Semble intéressant', orange:'Mérite réflexion',
                    rouge:'Peu avantageux en l’état', gris:'Informations à compléter' }[sim.avis];
    var g = sim.gain || 0;
    return '<div class="tva-sim" style="--c:'+st.color+'">'
      + '<button class="tva-sim-x" data-action="tva-hist-delete" data-i="'+i+'" title="Supprimer">✕</button>'
      + '<div class="tva-sim-date">'+esc(jour)+' · '+esc(heure)+'</div>'
      + '<div class="tva-sim-g" style="color:'+st.color+'">'
        + (g >= 0 ? '+' : '−') + fmtEur(Math.abs(g)) + '<span> / an</span></div>'
      + '<div class="tva-sim-l">'+esc(libelle || '')+'</div>'
      + '<div class="tva-sim-meta">CA '+fmtEur(sim.ca)+'</div>'
      + '<button class="tva-sim-btn" data-action="tva-hist-view" data-i="'+i+'">Voir le détail →</button>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Parcours guidé du simulateur TVA
  //
  // Plutôt qu'un long formulaire, une pop-up centrée qui déroule les étapes.
  // Presque tout vient du profil : on montre, on fait valider, on complète.
  // Étapes : 0 = accueil (avec clin d'œil si déjà à la TVA) · 1 = récap profil
  //          2 = charges reprises du profil · 3 = ajout libre · puis simulation.
  // ---------------------------------------------------------------------------
  function tvaOnbNav(precedent, suivant, labelSuivant){
    return '<div class="tvo-nav">'
      + (precedent ? '<button class="tvo-back" data-action="tvo-prev">← Retour</button>'
                   : '<button class="tvo-back" data-action="tvo-quit">Quitter</button>')
      + (suivant ? '<button class="tvo-next" data-action="tvo-next">'
                   + esc(labelSuivant || 'Continuer') + ' →</button>' : '')
      + '</div>';
  }

  function tvaOnbCorpsHtml(){
    var p = state.profil;
    var f = state.tva.form;
    var e = state.tva.onb.etape;

    var points = '<div class="tvo-dots">' + [0,1,2,3].map(function(i){
      return '<span class="'+(i <= e ? 'on' : '')+'"></span>';
    }).join('') + '</div>';

    // --- Étape 0 : accueil, avec les contrôles de cohérence ---
    if(e === 0){
      // Contrôle prioritaire : CA au-dessus du seuil alors qu'on se déclare hors TVA.
      var al = alerteSeuilTVA(p);
      if(al){
        return '<div class="tvo-emoji">🚨</div>'
          + '<div class="tvo-q">Attention, ton chiffre d’affaires dépasse le seuil</div>'
          + '<div class="tvo-sub">Ton profil indique que tu n’es pas à la TVA, pourtant tu déclares '
            + fmtEur(al.ca) + ' de chiffre d’affaires. Pour ' + esc(al.l) + ', la franchise en base '
            + 's’arrête à ' + fmtEur(al.base) + '</div>'
          + '<div class="tvo-alerte">'
            + (al.depasseMajore
                ? 'Tu dépasses même le seuil majoré de ' + fmtEur(al.majore) + ' : dans ce cas la TVA '
                  + 's’applique dès le jour du dépassement, pas l’année suivante'
                : 'Au-delà de ' + fmtEur(al.base) + ', tu bascules à la TVA au 1er janvier suivant')
            + '. Vérifie ta situation auprès de ton service des impôts ou de ton comptable : '
            + 'la TVA n’est peut-être plus une option pour toi, mais une obligation'
          + '</div>'
          + '<div class="tvo-actions">'
            + '<button class="tvo-next" data-action="tvo-next">Continuer quand même →</button>'
            + '<button class="tvo-ghost" data-action="tvo-quit-sims">Retour aux simulateurs</button>'
          + '</div>';
      }
      if(estAssujettiTVA(p)){
        return '<div class="tvo-emoji">✅</div>'
          + '<div class="tvo-q">Tu es déjà à la TVA !</div>'
          + '<div class="tvo-sub">Ce simulateur sert à décider s’il vaut le coup d’y passer, et toi '
            + 'c’est déjà fait. Tu peux quand même jeter un œil pour vérifier que l’opération est '
            + 'rentable dans ton cas</div>'
          + '<div class="tvo-actions">'
            + '<button class="tvo-next" data-action="tvo-next">Continuer quand même →</button>'
            + '<button class="tvo-ghost" data-action="tvo-quit-sims">Retour aux simulateurs</button>'
          + '</div>';
      }
      return '<div class="tvo-emoji">🧮</div>'
        + '<div class="tvo-q">Faut-il passer à la TVA ?</div>'
        + '<div class="tvo-sub">On regarde ce que tu récupérerais sur tes achats, ce que ça coûterait '
          + 'à gérer, et le risque côté clients</div>'
        + '<div class="tvo-actions">'
          + '<button class="tvo-next" data-action="tvo-next">C’est parti →</button>'
        + '</div>'
        + '<button class="tvo-skip" data-action="tvo-quit-sims">Retour aux simulateurs</button>';
    }

    // --- Étape 1 : les infos du profil, modifiables sur place ---
    if(e === 1){
      var caAn = Math.round((parseFloat(f.ca) || 0) * (f.caMensuel ? 12 : 1));
      var tauxBtns = TVA_PARAMS.tauxVente.map(function(o){
        return '<button class="tvo-chip'+(String(f.tauxVente) === String(o.v) ? ' on' : '')+'" '
          + 'data-action="tvo-form-set" data-champ="tauxVente" data-v="'+esc(o.v)+'">'
          + esc(o.l.split(' - ')[0])+'</button>';
      }).join('');
      var recup = Math.round(parseFloat(f.partRecup) || 0);
      return points
        + '<div class="tvo-q">D’après ton profil</div>'
        + '<div class="tvo-edit">'
          + '<label class="tvo-lab">Chiffre d’affaires annuel</label>'
          + '<div class="tvo-champ"><input data-tvo-form="ca" type="number" min="0" step="any" '
            + 'value="'+esc(caAn)+'"><span>€</span></div>'
          + '<label class="tvo-lab">Taux de TVA</label>'
          + '<div class="tvo-chips">'+tauxBtns+'</div>'
          + '<label class="tvo-lab">Part de tes clients qui récupèrent la TVA</label>'
          + '<div class="tvo-champ"><input data-tvo-form="partRecup" type="number" min="0" max="100" '
            + 'value="'+esc(recup)+'"><span>%</span></div>'
          + '<div class="tvo-aide">Les '+(100 - recup)+'% restants ne la récupèrent pas : '
            + 'particuliers, auto-entrepreneurs en franchise, associations</div>'
        + '</div>'
        + tvaOnbNav(true, true);
    }

    // --- Étape 2 : les charges du profil, modifiables sur place ---
    if(e === 2){
      var reprises = state.tva.depenses
        .map(function(d, i){ return { d:d, i:i }; })
        .filter(function(x){ return (x.d.nom || '').trim(); });
      var liste = reprises.length
        ? '<div class="tvo-charges">' + reprises.map(function(x){
            return tvoChargeLigneHtml(x.d, x.i);
          }).join('') + '</div>'
        : '<div class="tvo-vide">Aucune charge dans ton profil pour l’instant, tu pourras en '
          + 'ajouter à l’écran suivant</div>';
      return points
        + '<div class="tvo-q">Tes charges actuelles</div>'
        + '<div class="tvo-sub">C’est sur elles qu’on calcule la TVA que tu pourrais récupérer</div>'
        + liste
        + tvaOnbNav(true, true, reprises.length ? 'Je valide' : 'Continuer');
    }

    // --- Étape 3 : ajout libre, une carte vierge et les validées en dessous ---
    var ajoutees = state.tva.ajoutees || [];
    var recap = ajoutees.length
      ? '<div class="tvo-ajoutees">' + ajoutees.map(function(a, i){
          return '<div class="tvo-aj"><span class="tvo-aj-c">✓</span>'
            + '<span class="tvo-aj-n">'+esc(a.nom)+'</span>'
            + '<span class="tvo-aj-m">'+fmtEur(parseFloat(a.montant) || 0)
            + (a.frequence === 'mensuelle' ? '/mois' : '/an')+'</span>'
            + '<button class="tvo-aj-x" data-action="tvo-aj-remove" data-i="'+i+'" '
            + 'title="Retirer">✕</button></div>';
        }).join('') + '</div>'
      : '';
    return points
      + '<div class="tvo-q">Autre charge à ajouter ?</div>'
      + '<div class="tvo-sub">Facultatif. Ajoute les dépenses sur lesquelles tu paies de la TVA et '
        + 'qui ne sont pas encore listées</div>'
      + tvoDepCarteHtml(state.tva.brouillon, 0)
      + recap
      + tvaOnbNav(true, true, 'Lancer la simulation');
  }

  // Ligne d'une charge reprise du profil : modifiable sans quitter le parcours.
  function tvoChargeLigneHtml(d, i){
    var tauxCourt = { '0.2':'20%', '0.1':'10%', '0.055':'5,5%', '0.021':'2,1%', '0':'0%' };
    return '<div class="tvo-ch">'
      + '<span class="tvo-ch-n">'+esc(d.nom)+'</span>'
      + '<div class="tvo-ch-m"><input data-tvo-charge="montant" data-i="'+i+'" type="number" '
        + 'min="0" step="any" value="'+esc(d.montant || '')+'"><span>€</span></div>'
      + '<button class="tvo-ch-f" data-action="tvo-charge-freq" data-i="'+i+'">'
        + (d.frequence === 'mensuelle' ? '/mois' : '/an')+'</button>'
      + '<button class="tvo-ch-t" data-action="tvo-charge-taux" data-i="'+i+'">'
        + esc(tauxCourt[String(d.taux)] || '20%')+'</button>'
      + '<button class="tvo-ch-x" data-action="tvo-charge-remove" data-i="'+i+'" title="Retirer">✕</button>'
      + '</div>';
  }

  // Carte de saisie : nom, période, montant, taux. Validée, elle rejoint la
  // liste verte en dessous et la carte redevient vierge, prête pour la suivante.
  function tvoDepCarteHtml(d, i){
    var seg = function(champ, options){
      return '<div class="tvo-seg">' + options.map(function(o){
        return '<button class="tvo-seg-b'+(String(d[champ]) === String(o.v) ? ' on' : '')+'" '
          + 'data-action="tvo-brouillon-set" data-champ="'+champ+'" data-v="'+esc(o.v)+'">'
          + esc(o.l)+'</button>';
      }).join('') + '</div>';
    };
    return '<div class="tvo-dep">'
      + '<input class="tvo-dep-n" data-tvo-brouillon="nom" value="'+esc(d.nom || '')
        + '" placeholder="Nom de la dépense">'
      + seg('frequence', [{v:'mensuelle',l:'Par mois'},{v:'annuelle',l:'Par an'}])
      + '<div class="tvo-dep-m"><input data-tvo-brouillon="montant" type="number" '
        + 'min="0" step="any" value="'+esc(d.montant || '')+'" placeholder="0"><span>€ TTC</span></div>'
      + '<div class="tvo-dep-l">Taux de TVA sur cette dépense</div>'
      + seg('taux', [{v:'0.021',l:'2,1%'},{v:'0.055',l:'5,5%'},
                     {v:'0.1',l:'10%'},{v:'0.2',l:'20%'}])
      + (state.tva.brouillonErr ? '<div class="tvo-dep-err">'+esc(state.tva.brouillonErr)+'</div>' : '')
      + '<button class="tvo-dep-ok" data-action="tvo-brouillon-valide">Ajouter cette charge</button>'
      + '</div>';
  }

  // Le parcours écrit directement dans le profil : ce qu'on corrige ici est
  // corrigé partout, sans passer par l'écran Profil.
  function synchroniserChargeProfil(i){
    var d = state.tva.depenses[i];
    var c = (state.profil.charges || [])[i];
    if(!d || !c) return;
    c.montant = d.montant;
    c.frequence = d.frequence;
    c.tauxTVA = d.taux;
    saveProfil(state.profil);
  }

  function synchroniserChargesProfil(){
    // Les charges du parcours qui viennent du profil sont en tête de liste :
    // on réaligne le profil sur elles, sans toucher aux ajouts du parcours.
    var nbProfil = (state.profil.charges || []).length;
    state.profil.charges = state.tva.depenses.slice(0, nbProfil).map(function(d){
      return { nom:d.nom, montant:d.montant, frequence:d.frequence,
               tauxTVA:d.taux, deductible:d.recup || '100', categorie:d.categorie || '' };
    });
    saveProfil(state.profil);
  }

  // Une charge testée dans un simulateur ne rejoint le profil que sur demande.
  function synchroniserChargeVersProfil(c){
    if(!c.nom || !c.montant) return;
    state.profil.charges = state.profil.charges || [];
    var idx = state.profil.charges.findIndex(function(x){ return x.__simRef === c; });
    var entree = { nom:c.nom, montant:c.montant, frequence:c.frequence,
                   tauxTVA:c.tauxTVA || '0.2', deductible:c.deductible || '100',
                   categorie:c.categorie || '', __simRef:c };
    if(idx >= 0) state.profil.charges[idx] = entree;
    else state.profil.charges.push(entree);
    saveProfil(state.profil);
  }
  function retirerChargeDuProfil(c){
    state.profil.charges = (state.profil.charges || []).filter(function(x){ return x.__simRef !== c; });
    saveProfil(state.profil);
  }

  function tvaOnbHtml(){
    if(!(state.tva.onb.actif && state.sim.open === 'tva')) return '';
    return '<div class="tvo-overlay"><div class="tvo-card">'+tvaOnbCorpsHtml()+'</div></div>';
  }

  // Mise à jour ciblée : la carte seule est reconstruite, jamais l'overlay -
  // sinon l'animation d'apparition se rejouerait à chaque clic.
  function majTvaOnb(){
    var root = document.getElementById('tvo-root');
    if(!root) return;
    if(!(state.tva.onb.actif && state.sim.open === 'tva')){ root.innerHTML = ''; return; }
    var card = root.querySelector('.tvo-card');
    if(!card){
      root.innerHTML = '<div class="tvo-overlay"><div class="tvo-card"></div></div>';
      card = root.querySelector('.tvo-card');
    }
    card.innerHTML = tvaOnbCorpsHtml();
  }

  // Fin du parcours : on calcule, on enregistre, et on revient sur la page du
  // simulateur où la simulation apparaît sous forme de carte datée.
  function lancerSimulationTVA(){
    var tf = state.tva.form;
    var somme = (parseFloat(tf.partRecup) || 0) + (parseFloat(tf.partProNon) || 0);
    if(!(parseFloat(tf.ca) > 0)){
      state.tva.onb.actif = false;
      state.tva.formError = 'Indique ton chiffre d’affaires dans ton profil.';
      render(); return;
    }
    if(Math.round(somme) !== 100){
      state.tva.onb.actif = false;
      state.tva.formError = 'La répartition de ta clientèle doit être égale à 100% (actuellement '
        + Math.round(somme) + '%). Corrige-la dans ton profil.';
      render(); return;
    }
    marquerFait('sim:tva');
    state.tva.formError = null;
    var res = calculerTVA(tf, state.tva.depenses);
    state.tva.result = res;
    state.tva.onb.actif = false;
    state.tva.step = 'result';        // on ouvre directement le détail
    state.tva.ajoutees = [];
    state.tva.brouillon = { nom:'', montant:'', frequence:'mensuelle', taux:'0.2' };
    try { localStorage.setItem('freehub_tva_onb', '1'); } catch(e){}
    state.tva.historique.unshift({
      date: Date.now(), ca: res.ca, gain: res.principal.gain, avis: res.avis,
      form: Object.assign({}, tf),
      depenses: state.tva.depenses.map(function(d){ return Object.assign({}, d); }),
    });
    saveHistTVA(state.tva.historique);
    render();
  }

  function tvaHtml(){
    return state.tva.step === 'result' ? tvaResultHtml() : tvaFormHtml();
  }

  // ===========================================================================
  // Comparateur : versement libératoire ou impôt classique
  // ===========================================================================
  function vlField(name, label, value, o){
    o = o || {};
    var req = o.req ? ' <span class="req">*</span>' : '';
    var inner;
    if(o.options){
      inner = '<select data-vl-field="'+name+'">'
        + (o.placeholder !== false ? '<option value=""'+(value?'':' selected')+'>- choisir -</option>' : '')
        + o.options.map(function(op){
            var v = op.v !== undefined ? op.v : op;
            var l = op.l !== undefined ? op.l : op;
            return '<option value="'+esc(v)+'"'+(String(value)===String(v)?' selected':'')+'>'+esc(l)+'</option>';
          }).join('')
        + '</select>';
    } else {
      inner = '<input data-vl-field="'+name+'" type="'+(o.type||'text')+'" value="'+esc(value||'')
        + '" placeholder="'+esc(o.ph||'')+'"'+(o.type==='number'?' min="0" step="any"':'')+'>';
    }
    return '<div class="field"><label>'+esc(label)+req+'</label>'+inner
      + (o.aide ? '<div class="field-eg">'+esc(o.aide)+'</div>' : '') + '</div>';
  }

  function vlFormHtml(){
    var f = state.vl.form;
    var p = FISCAL[f.annee] || FISCAL['2025'];
    var err = state.vl.formError ? '<div class="form-error">'+esc(state.vl.formError)+'</div>' : '';
    var metier = (state.profil.activite || '').trim();

    var h = state.vl.historique;
    var hist = h.length
      ? '<div class="hist-h" style="margin-top:34px"><div class="hist-title">Mes simulations précédentes</div></div>'
        + '<div class="hist-list">' + h.map(vlHistItemHtml).join('') + '</div>'
      : '';

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="sim-lancer vl">'
        + '<div class="sim-lancer-e">⚖️</div>'
        + '<div class="sim-lancer-t">Versement libératoire ou impôt classique ?</div>'
        + '<div class="sim-lancer-s">On compare les deux modes d’imposition de ta micro-entreprise '
          + 'et on te dit lequel te coûte le moins cher, chiffres à l’appui</div>'
        + '<button class="btn-primary" data-action="vl-onb-start">Lancer la comparaison</button>'
      + '</div>'
      + err
      + bandeauMillesimeHtml('fiscal')
      + hist
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Parcours guidé du versement libératoire
  //
  // Le VL n'existe qu'en micro-entreprise. Une société peut quand même essayer
  // le simulateur : on bascule alors en « mode essai », où les valeurs saisies
  // ne touchent pas au profil.
  // ---------------------------------------------------------------------------
  function vlOnbCorpsHtml(){
    var p = state.profil;
    var f = state.vl.form;
    var e = state.vl.onb.etape;
    var par = FISCAL[f.annee] || FISCAL['2025'];

    if(e === 0){
      if(estSociete(p)){
        return '<div class="tvo-emoji">🏛️</div>'
          + '<div class="tvo-q">Le versement libératoire n’existe pas en société</div>'
          + '<div class="tvo-sub">C’est une option réservée à la micro-entreprise. Avec ton statut '
            + '('+esc(p.forme || 'société')+'), tu relèves d’un autre régime d’imposition</div>'
          + '<div class="tvo-alerte">Tu peux quand même essayer le simulateur pour voir comment ça '
            + 'marche. Dans ce cas tu saisis des valeurs à la volée, et rien n’est enregistré dans '
            + 'ton profil</div>'
          + '<div class="tvo-actions">'
            + '<button class="tvo-next" data-action="vl-onb-essai">Essayer quand même →</button>'
            + '<button class="tvo-ghost" data-action="vl-onb-quit-sims">Retour aux simulateurs</button>'
          + '</div>';
      }
      return '<div class="tvo-emoji">⚖️</div>'
        + '<div class="tvo-q">Versement libératoire ou impôt classique ?</div>'
        + '<div class="tvo-sub">Deux écrans, presque tout vient de ton profil. On calcule ce que '
          + 'chaque option te coûte réellement</div>'
        + '<div class="tvo-actions">'
          + '<button class="tvo-next" data-action="vl-onb-next">C’est parti →</button>'
        + '</div>'
        + '<button class="tvo-skip" data-action="vl-onb-quit-sims">Retour aux simulateurs</button>';
    }

    // Étape 1 : les données du calcul, éditables. En mode essai elles ne
    // remontent pas au profil ; sinon elles le mettent à jour.
    var essai = state.vl.essai;
    var cats = [{v:'venteBIC',l:'Vente'},{v:'serviceBIC',l:'Services'},{v:'bnc',l:'Libéral'}];
    var chips = cats.map(function(c){
      return '<button class="tvo-chip'+(f.categorie === c.v ? ' on' : '')+'" '
        + 'data-action="vl-onb-set" data-champ="categorie" data-v="'+c.v+'">'+esc(c.l)+'</button>';
    }).join('');
    var ligne = function(champ, label, val, unite){
      return '<label class="tvo-lab">'+esc(label)+'</label>'
        + '<div class="tvo-champ"><input data-vl-onb="'+champ+'" type="number" min="0" step="any" '
        + 'value="'+esc(val || '')+'"><span>'+unite+'</span></div>';
    };
    return '<div class="tvo-dots"><span class="on"></span><span class="on"></span></div>'
      + '<div class="tvo-q">'+(essai ? 'Saisis des valeurs pour essayer' : 'D’après ton profil')+'</div>'
      + (essai ? '<div class="tvo-sub">Rien de tout ça ne sera enregistré dans ton profil</div>' : '')
      + '<div class="tvo-edit">'
        + '<label class="tvo-lab">Catégorie de ton activité</label>'
        + '<div class="tvo-chips">'+chips+'</div>'
        + ligne('ca', 'Chiffre d’affaires annuel', f.ca, '€')
        + ligne('parts', 'Parts fiscales du foyer', f.parts, 'parts')
        + ligne('autresRevenus', 'Autres revenus imposables du foyer', f.autresRevenus, '€')
        + ligne('rfr', 'Revenu fiscal de référence ' + par.anneeRfr, f.rfr, '€')
        + '<div class="tvo-aide">L’éligibilité au versement libératoire se juge sur ce revenu '
          + 'fiscal de référence, avec un plafond de ' + fmtEur(par.plafondRfrParPart) + ' par part</div>'
      + '</div>'
      + '<div class="tvo-nav">'
        + '<button class="tvo-back" data-action="vl-onb-prev">← Retour</button>'
        + '<button class="tvo-next" data-action="vl-onb-lancer">Comparer les deux options →</button>'
      + '</div>';
  }

  // Fin du parcours : on valide, on calcule, on ouvre le résultat.
  function lancerComparaisonVL(){
    var vf = state.vl.form;
    var stop = function(msg){
      state.vl.onb.actif = false;
      state.vl.formError = msg;
      render();
    };
    if(!vf.categorie || vf.categorie === 'inconnu')
      return stop('Choisis la catégorie fiscale de ton activité pour lancer la comparaison');
    if(!(parseFloat(vf.ca) > 0)) return stop('Indique ton chiffre d’affaires');
    if(vf.autresRevenus === '' || isNaN(parseFloat(vf.autresRevenus)))
      return stop('Indique les autres revenus imposables de ton foyer, 0 si tu n’en as pas');

    marquerFait('sim:vl');
    state.vl.formError = null;
    // Le CA saisi au mois est ramené à l'année.
    var calc = Object.assign({}, vf);
    if(vf.caMensuel) calc.ca = String((parseFloat(vf.ca) || 0) * 12);
    var r = comparerVL(calc);
    state.vl.result = r;
    state.vl.onb.actif = false;
    state.vl.step = 'result';
    // En mode essai, la simulation ne rejoint pas l'historique du compte.
    if(!state.vl.essai){
      state.vl.historique.unshift({
        date: Date.now(), ca: r.ca, ecart: r.ecart, vl: r.vl,
        coutClassique: r.coutClassique, form: Object.assign({}, vf),
      });
      saveHistVL(state.vl.historique);
    }
    render();
  }

  function vlOnbHtml(){
    if(!(state.vl.onb.actif && state.sim.open === 'vl')) return '';
    return '<div class="tvo-overlay"><div class="tvo-card">'+vlOnbCorpsHtml()+'</div></div>';
  }

  function majVlOnb(){
    var root = document.getElementById('vlo-root');
    if(!root) return;
    if(!(state.vl.onb.actif && state.sim.open === 'vl')){ root.innerHTML = ''; return; }
    var card = root.querySelector('.tvo-card');
    if(!card){
      root.innerHTML = '<div class="tvo-overlay"><div class="tvo-card"></div></div>';
      card = root.querySelector('.tvo-card');
    }
    card.innerHTML = vlOnbCorpsHtml();
  }

  // ---------------------------------------------------------------------------
  // Parcours guidés de « Passer en société ? » et « Optimiser ma société »
  //
  // Même principe que la TVA et le versement libératoire : on met en contexte,
  // on montre ce qu'on a compris du profil, on laisse corriger sur place.
  // Chacun garde un contrôle de cohérence : le comparateur de statuts n'a pas
  // de sens si tu es déjà en société, le cockpit n'en a pas si tu es en micro.
  // ---------------------------------------------------------------------------

  // --- Visualisation du barème progressif ---
  var TRANCHE_COULEURS = ['#e8edf5', '#c7dcff', '#8fb4ff', '#f7c9a0', '#f2a3a3'];

  function baremeHtml(r){
    var p = r.params;
    // Échelle d'affichage : on va jusqu'au haut de la tranche atteinte après la micro.
    var haute = r.trancheApres.a;
    var echelle = haute === null ? r.parPartApres * 1.25 : haute;
    echelle = Math.max(echelle, r.parPartApres * 1.05, 15000);

    var segments = '', labels = '';
    p.bareme.forEach(function(tr, i){
      if(tr.de >= echelle) return;
      var haut = (tr.a === null) ? echelle : Math.min(tr.a, echelle);
      var largeur = (haut - tr.de) / echelle * 100;
      if(largeur <= 0) return;
      segments += '<div class="bareme-seg" style="width:'+largeur+'%;background:'+TRANCHE_COULEURS[i]+'">'
        + '<span>'+Math.round(tr.taux*100)+'%</span></div>';
      if(tr.de > 0){
        labels += '<span class="bareme-tick" style="left:'+(tr.de / echelle * 100)+'%">'
          + fmtEur(tr.de) + '</span>';
      }
    });

    var pos = function(v){ return Math.max(0, Math.min(100, v / echelle * 100)); };
    var marqueurs =
        '<div class="bareme-mark avant" style="left:'+pos(r.parPartAvant)+'%">'
          + '<span class="bareme-mark-l">Avant<br>'+fmtEur(r.parPartAvant)+'</span></div>'
      + '<div class="bareme-mark apres" style="left:'+pos(r.parPartApres)+'%">'
          + '<span class="bareme-mark-l">Après<br>'+fmtEur(r.parPartApres)+'</span></div>';

    var msg = (r.trancheApres.taux > r.trancheAvant.taux)
      ? 'Avant ton activité, ton revenu par part se situe dans la tranche à '
        + Math.round(r.trancheAvant.taux*100) + ' %. Après ajout de ton bénéfice micro, une partie de tes '
        + 'revenus entre dans la tranche à ' + Math.round(r.trancheApres.taux*100) + ' %.'
      : 'Ton bénéfice micro reste dans la tranche à ' + Math.round(r.trancheApres.taux*100) + ' %.';

    return '<div class="card">'
      + '<div class="card-title">Ta position dans le barème (par part fiscale)</div>'
      + '<div class="bareme"><div class="bareme-bar">'+segments+'</div>'
        + '<div class="bareme-ticks">'+labels+'</div>'
        + '<div class="bareme-marks">'+marqueurs+'</div>'
      + '</div>'
      + '<div class="res-line" style="margin-top:52px">'+esc(msg)+'</div>'
      + '<div class="vl-note">Être dans la tranche à '+Math.round(r.trancheApres.taux*100)+' % ne veut pas '
        + 'dire que tous tes revenus sont imposés à ce taux : seule la part qui dépasse le seuil de cette '
        + 'tranche l’est.</div>'
      + '</div>';
  }

  function vlResultHtml(){
    var r = state.vl.result;
    if(!r) return '';
    var f = state.vl.form;
    var vlGagne = r.ecart > 0;
    var proche = Math.abs(r.ecart) < 50 || (Math.max(r.vl, r.coutClassique) > 0 &&
                 Math.abs(r.ecart) < 0.05 * Math.max(r.vl, r.coutClassique));

    // --- En-tête : la conclusion ---
    var titre, sousTitre, couleur;
    if(proche){
      couleur = STATUT.gris.color;
      titre = 'Les deux options se valent presque';
      sousTitre = 'L’écart est de ' + fmtEur(Math.abs(r.ecart)) + ' par an. Ton choix peut dépendre de la '
        + 'simplicité de paiement et de l’évolution prévisible de tes revenus.';
    } else if(vlGagne){
      couleur = STATUT.vert.color;
      titre = 'Le versement libératoire te ferait économiser ' + fmtEur(r.ecart) + ' par an';
      sousTitre = 'Soit environ ' + fmtEur(r.ecartMensuel) + ' par mois.';
    } else {
      couleur = STATUT.orange.color;
      titre = 'L’impôt classique serait plus avantageux de ' + fmtEur(-r.ecart) + ' par an';
      sousTitre = 'Soit environ ' + fmtEur(-r.ecartMensuel) + ' par mois.';
    }

    // --- Bandeau d'éligibilité ---
    var elig;
    if(r.eligible === true){
      elig = '<div class="vl-elig ok">🟢 <div><strong>Tu sembles éligible au versement libératoire</strong>'
        + '<div>Ton revenu fiscal de référence (' + fmtEur(r.rfr) + ') est inférieur au plafond applicable '
        + 'à ton foyer (' + fmtEur(r.plafondRfr) + ').</div></div></div>';
    } else if(r.eligible === false){
      elig = '<div class="vl-elig ko">🔴 <div><strong>Tu ne sembles pas éligible au versement libératoire</strong>'
        + '<div>Ton revenu fiscal de référence (' + fmtEur(r.rfr) + ') dépasse le plafond applicable ('
        + fmtEur(r.plafondRfr) + '). La comparaison ci-dessous reste affichée à titre indicatif, mais '
        + 'l’option n’est probablement pas accessible.</div></div></div>';
    } else {
      elig = '<div class="vl-elig na">⚪ <div><strong>Éligibilité à vérifier</strong>'
        + '<div>Sans ton revenu fiscal de référence ' + r.params.anneeRfr + ', nous comparons les deux '
        + 'méthodes mais ne pouvons pas confirmer que tu peux choisir le versement libératoire.</div></div></div>';
    }

    // --- Les deux cartes de calcul ---
    var ligne = function(k, v, fort){
      return '<div class="vl-line'+(fort?' fort':'')+'"><span>'+esc(k)+'</span><span>'+v+'</span></div>';
    };

    var carteVL = '<div class="card">'
      + '<div class="card-title">Option A · Versement libératoire</div>'
      + ligne('Chiffre d’affaires', fmtEur(r.ca))
      + ligne('Taux applicable', fmtPct(r.cat.vl))
      + ligne('Impôt annuel', fmtEur(r.vl), true)
      + ligne('Moyenne mensuelle', fmtEur(r.vlMensuel))
      + '<div class="vl-formule">' + fmtEur(r.ca) + ' × ' + fmtPct(r.cat.vl)
        + ' = ' + fmtEur(r.vl) + '</div>'
      + '</div>';

    var carteIR = '<div class="card">'
      + '<div class="card-title">Option B · Impôt classique au barème</div>'
      + ligne('Chiffre d’affaires', fmtEur(r.ca))
      + ligne('Abattement forfaitaire', fmtPct(r.cat.abattement))
      + ligne('Bénéfice imposable', fmtEur(r.benefice))
      + ligne('Autres revenus du foyer', fmtEur(r.autres))
      + ligne('Impôt du foyer sans la micro', fmtEur(r.impotSans))
      + ligne('Impôt du foyer avec la micro', fmtEur(r.impotAvec))
      + ligne('Coût de la micro', fmtEur(r.coutClassique), true)
      + '<div class="vl-formule">' + fmtEur(r.impotAvec) + ' − ' + fmtEur(r.impotSans)
        + ' = ' + fmtEur(r.coutClassique) + '</div>'
      + '</div>';

    // --- Graphique de comparaison ---
    var maxi = Math.max(r.vl, r.coutClassique, 1);
    var barre = function(label, val, color){
      return '<div class="cmp-row"><div class="cmp-label">'+esc(label)+'</div>'
        + '<div class="cmp-track"><div class="cmp-bar" style="width:'+(val/maxi*100)+'%;background:'+color+'">'
        + '</div></div><div class="cmp-val">'+fmtEur(val)+'</div></div>';
    };
    var graphique = '<div class="card">'
      + '<div class="card-title">Comparaison annuelle</div>'
      + barre('Versement libératoire', r.vl, '#2f6bff')
      + barre('Impôt classique', r.coutClassique, '#f59e0b')
      + '<div class="vl-line fort" style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px">'
        + '<span>Écart annuel</span><span>' + fmtEur(Math.abs(r.ecart)) + '</span></div>'
      + '<div class="vl-line"><span>Écart mensuel moyen</span><span>'
        + fmtEur(Math.abs(r.ecartMensuel)) + '</span></div>'
      + '</div>';

    // --- Interprétation ---
    var interpretation;
    if(proche){
      interpretation = 'L’écart entre les deux options est faible. Ton choix peut davantage dépendre de la '
        + 'simplicité de paiement (le versement libératoire est prélevé au fil des déclarations) et de '
        + 'l’évolution prévisible de tes revenus.';
    } else if(vlGagne){
      interpretation = 'Ton foyer est déjà imposé : le bénéfice de ta micro-entreprise vient s’ajouter à tes '
        + 'autres revenus et se retrouve imposé à ' + Math.round(r.trancheApres.taux*100) + ' % sur sa partie '
        + 'haute. Le taux forfaitaire de ' + fmtPct(r.cat.vl) + ' appliqué à ton '
        + 'chiffre d’affaires est alors plus favorable.';
    } else {
      interpretation = 'Ton foyer est peu ou pas imposé sur cette tranche de revenus. Le versement libératoire '
        + 'te ferait payer ' + fmtPct(r.cat.vl) + ' de ton chiffre d’affaires dès '
        + 'le premier euro encaissé, alors que ton bénéfice micro est faiblement imposé au barème. '
        + 'Attention : une personne non imposable peut payer inutilement un versement libératoire.';
    }

    // --- Hypothèses et limites (transparence sur ce qui n'est pas calculé) ---
    var limites = ['Calcul fondé sur le barème applicable aux ' + MILLESIME.label
      + ', source : ' + r.params.source + '.'];
    if(!r.params.decote) limites.push('La décote pour les revenus modestes n’est pas appliquée : '
      + 'ton impôt réel peut être inférieur à l’estimation si tes revenus sont proches du seuil d’imposition.');
    if(!r.params.plafondQuotientFamilial) limites.push('Le plafonnement du quotient familial n’est pas appliqué.');
    limites.push('Le mécanisme du taux effectif (impact du revenu micro sur l’imposition de tes autres '
      + 'revenus en cas de versement libératoire) n’est pas pris en compte.');
    limites.push('Cotisations sociales, CFE, TVA et contribution à la formation professionnelle sont exclues : '
      + 'seule la part fiscale est comparée.');
    limites.push('Une seule catégorie d’activité à la fois : les activités mixtes ne sont pas encore gérées.');

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="res-topbar">'
        + '<h2>Résultat de la comparaison</h2>'
        + '<div class="export-bar">'
          + '<button class="btn-ghost" data-action="vl-print">Imprimer / PDF</button>'
          + '<button class="btn-ghost" data-action="vl-back">Modifier mes informations</button>'
          + '<button class="btn-primary" data-action="vl-new">Nouvelle simulation</button>'
        + '</div>'
      + '</div>'
      + '<div class="vl-verdict" style="border-left-color:'+couleur+'">'
        + '<div class="vl-verdict-t" style="color:'+couleur+'">'+esc(titre)+'</div>'
        + '<div class="vl-verdict-s">'+esc(sousTitre)+'</div>'
      + '</div>'
      + elig
      + '<div class="vl-cards">' + carteVL + carteIR + '</div>'
      + '<div class="vl-cards">' + graphique + baremeHtml(r) + '</div>'
      + '<div class="card" style="margin-top:16px">'
        + '<div class="card-title">Comment lire ce résultat</div>'
        + '<div class="res-line">'+esc(interpretation)+'</div>'
      + '</div>'
      + '<div class="card tinted" style="margin-top:16px">'
        + '<div class="card-title">Hypothèses et limites du calcul</div>'
        + '<ul class="res-list">' + limites.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('') + '</ul>'
      + '</div>'
      + simPartenaireHtml(3, 'Un doute sur ton imposition ? Icon Invest fait le point sur ta '
          + 'situation, en français, sans jargon fiscal.')
      + '<div class="final-note">Estimation indicative, fondée sur les informations renseignées. Elle ne '
        + 'constitue ni une consultation fiscale, ni un conseil juridique, ni une validation par '
        + 'l’administration. Vérifie ton éligibilité et ta situation auprès de l’Urssaf ou de ton service '
        + 'des impôts avant de modifier ton option fiscale. Pour opter à compter de l’année suivante, la '
        + 'demande se fait en principe auprès de l’Urssaf au plus tard le 30 septembre.</div>'
      + '</div>';
  }

  function vlHistItemHtml(sim, i){
    var d = new Date(sim.date);
    var jour = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    var heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    var gagnant = sim.ecart > 0 ? 'Versement libératoire' : (sim.ecart < 0 ? 'Impôt classique' : 'Équivalent');
    var col = sim.ecart > 0 ? STATUT.vert.bg : STATUT.orange.bg;
    return '<div class="hist-item" data-action="vl-hist-view" data-i="'+i+'">'
      + '<div style="flex:1;min-width:0">'
        + '<div class="hist-date">'+esc(jour)+' · '+esc(heure)+'</div>'
        + '<div class="hist-meta">CA '+fmtEur(sim.ca)+' · '+esc(gagnant)+'</div>'
      + '</div>'
      + '<span class="hist-dot" style="background:'+col+'"></span>'
      + '<button class="icon-btn danger" data-action="vl-hist-delete" data-i="'+i+'" title="Supprimer">✕</button>'
      + '</div>';
  }

  function vlHtml(){
    return state.vl.step === 'result' ? vlResultHtml() : vlFormHtml();
  }

  // ---------------------------------------------------------------------------
  // Vue Simulateur
  // ---------------------------------------------------------------------------
  function field(name, label, value, o){
    o = o || {};
    var req = o.req ? ' <span class="req">*</span>' : '';
    var attr = o.prof ? 'data-profil-field="'+name+'"'
             : (o.dep !== undefined ? 'data-dep-field="'+name+'" data-i="'+o.dep+'"'
                                    : 'data-sim-field="'+name+'"');
    var inner;
    if(o.options){
      inner = '<select '+attr+'>'
        + '<option value=""'+(value?'':' selected')+'>- choisir -</option>'
        + o.options.map(function(op){
            return '<option value="'+esc(op)+'"'+(value===op?' selected':'')+'>'+esc(op)+'</option>';
          }).join('')
        + '</select>';
    } else if(o.textarea){
      inner = '<textarea '+attr+' placeholder="'+esc(o.ph||'')+'">'+esc(value||'')+'</textarea>';
    } else {
      inner = '<input '+attr+' type="'+(o.type||'text')+'" value="'+esc(value||'')+'" placeholder="'+esc(o.ph||'')+'">';
    }
    return '<div class="field"><label>'+esc(label)+req+'</label>'+inner
      + (o.eg ? '<div class="field-eg">'+esc(o.eg)+'</div>' : '') + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Écran Profil - la saisie unique dont vivent tous les simulateurs
  // ---------------------------------------------------------------------------
  function pfield(c, p){
    var v = p[c.k];
    var inner;
    if(c.options){
      // En micro, l'IS est grisé : mieux vaut montrer que l'option existe mais
      // ne s'applique pas ici, plutôt que de la faire disparaître sans un mot.
      var bloqueIS = c.k === 'regime' && formeExclutIS(p.forme);
      inner = '<select data-profil-field="'+c.k+'">' + c.options.map(function(o){
        var off = bloqueIS && o.v === REGIME_IS;
        return '<option value="'+esc(o.v)+'"'+(String(v)===String(o.v)?' selected':'')
          + (off ? ' disabled' : '')+'>'
          + esc(o.l) + (off ? ' — impossible en micro' : '')+'</option>'; }).join('')
        + '</select>';
      if(bloqueIS){
        inner += '<div class="pf-aide">En micro-entreprise, c’est l’impôt sur le revenu, '
          + 'avec ou sans versement libératoire.</div>';
      }
    } else if(c.textarea){
      inner = '<textarea data-profil-field="'+c.k+'" placeholder="'+esc(c.ph||'')+'">'+esc(v||'')+'</textarea>';
    } else {
      inner = '<input data-profil-field="'+c.k+'" type="'+(c.type||'text')+'" value="'+esc(v||'')
        + '" placeholder="'+esc(c.ph||'')+'"'+(c.type==='number'?' min="0" step="any"':'')+'>';
      if(c.suffixe) inner = '<div class="pf-suffixe">'+inner+'<span>'+esc(c.suffixe)+'</span></div>';
    }
    return '<div class="pf'+(c.large?' large':'')+'"><label>'+esc(c.l)+(c.lex?lexQ(c.lex):'')+'</label>'+inner
      // `aide` peut dépendre du profil : le texte utile en micro n'est pas
      // celui d'une société.
      + (function(){
          var a = typeof c.aide === 'function' ? c.aide(p) : c.aide;
          return a ? '<div class="pf-aide">'+esc(a)+'</div>' : '';
        })() + '</div>';
  }

  function profilChargeHtml(c, i){
    return '<div class="pcharge">'
      + '<input data-pcharge-field="nom" data-i="'+i+'" value="'+esc(c.nom||'')+'" placeholder="Nom de la charge">'
      + '<div class="pf-suffixe compact"><input data-pcharge-field="montant" data-i="'+i+'" type="number" '
        + 'min="0" step="any" value="'+esc(c.montant||'')+'" placeholder="0"><span>€</span></div>'
      + '<select data-pcharge-field="frequence" data-i="'+i+'">'
        + '<option value="mensuelle"'+(c.frequence==='mensuelle'?' selected':'')+'>/ mois</option>'
        + '<option value="annuelle"'+(c.frequence==='annuelle'?' selected':'')+'>/ an</option>'
      + '</select>'
      + '<select data-pcharge-field="categorie" data-i="'+i+'">'
        + OPTIM_CATEGORIES.map(function(o){
            return '<option value="'+o.v+'"'+(c.categorie===o.v?' selected':'')+'>'+esc(o.l)+'</option>';
          }).join('')
      + '</select>'
      + '<select data-pcharge-field="tauxTVA" data-i="'+i+'">'
        + TVA_PARAMS.tauxDepense.map(function(t){
            return '<option value="'+t.v+'"'+(String(c.tauxTVA)===String(t.v)?' selected':'')+'>TVA '+t.l+'</option>';
          }).join('')
      + '</select>'
      + '<select data-pcharge-field="deductible" data-i="'+i+'">'
        + [['100','Déductible'],['50','50 %'],['0','Non déductible']].map(function(d){
            return '<option value="'+d[0]+'"'+(String(c.deductible)===d[0]?' selected':'')+'>'+d[1]+'</option>';
          }).join('')
      + '</select>'
      + '<button class="icon-btn danger" data-action="pcharge-remove" data-i="'+i+'" title="Supprimer">✕</button>'
      + '</div>';
  }

  // Mises à jour ciblées : on retouche le DOM sans re-rendre, pour ne pas
  // arracher le focus pendant que l'utilisateur tape.
  function majTotalClientele(){
    var el = document.querySelector('.pf-total');
    if(!el) return;
    var sec = PROFIL_SECTIONS.filter(function(s){ return s.total; })[0];
    if(!sec) return;
    var somme = sec.total.cles.reduce(function(a, k){
      return a + (parseFloat(state.profil[k]) || 0); }, 0);
    var ok = Math.round(somme) === sec.total.attendu;
    el.classList.toggle('ok', ok);
    el.innerHTML = esc(sec.total.l) + ' : <strong>' + Math.round(somme) + ' %</strong>'
      + (ok ? ' ✓' : ' - doit faire 100 %');
  }
  function majTotalCharges(){
    var lignes = state.profil.charges || [];
    var el = document.querySelector('[data-action="profil-section"][data-id="charges"] .prow-r');
    if(!el) return;
    var total = lignes.reduce(function(a, c){
      return a + annualiser(parseFloat(c.montant) || 0, c.frequence); }, 0);
    el.textContent = lignes.length + ' ligne' + (lignes.length > 1 ? 's' : '')
      + ' · ' + fmtEur(total) + ' / an';
  }

  // Photo + mot de passe : rendus à la main, ils ne rentrent pas dans pfield().
  function profilIdentiteExtra(p){
    var ini = ((p.prenom || '').charAt(0) + (p.nom || '').charAt(0)).toUpperCase() || '🙂';
    var vignette = p.photo
      ? '<img src="'+esc(p.photo)+'" alt="Photo de profil">'
      : '<span>'+esc(ini)+'</span>';
    return '<div class="pf large pf-photo">'
        + '<label>Photo de profil</label>'
        + '<div class="pphoto">'
          + '<div class="pphoto-v">'+vignette+'</div>'
          + '<div class="pphoto-a">'
            + '<label class="btn-ghost pphoto-btn">Choisir une image'
              + '<input type="file" accept="image/*" data-profil-photo hidden></label>'
            + (p.photo ? '<button class="btn-link" data-action="photo-remove">Retirer</button>' : '')
          + '</div>'
        + '</div>'
      + '</div>'
      + '<div class="pf large">'+compteHtml()+'</div>';
  }

  // Panneau « Mon compte » : synchro des données côté serveur (optionnel).
  function compteHtml(){
    if(state.compte){
      var sync = { 'en cours':'⟳ Synchronisation…', ok:'✓ Synchronisé', erreur:'⚠ Synchro impossible' };
      return '<div class="compte connecte">'
        + '<div class="compte-h"><span class="compte-ico">🔒</span>'
          + '<div><div class="compte-t">Compte connecté</div>'
            + '<div class="compte-mail">'+esc(state.compte.email)+'</div></div>'
          + '<button class="btn-ghost" data-action="auth-logout">Se déconnecter</button></div>'
        + '<div class="compte-sync">'+(sync[state.syncEtat] || '✓ Tes données sont sauvegardées sur ton compte')+'</div>'
      + '</div>';
    }
    return '<div class="compte">'
      + '<div class="compte-h"><span class="compte-ico">☁️</span>'
        + '<div><div class="compte-t">Retrouve tes données partout</div>'
          + '<div class="compte-sub">Crée un compte pour sauvegarder ton profil et tes objectifs, '
            + 'et les retrouver sur un autre appareil.</div></div></div>'
      + '<div class="compte-a">'
        + '<button class="btn-primary" data-action="auth-open" data-mode="signup">Créer un compte</button>'
        + '<button class="btn-ghost" data-action="auth-open" data-mode="login">J’ai déjà un compte</button>'
      + '</div>'
    + '</div>';
  }

  function authModalHtml(){
    if(!state.authOpen) return '';
    var signup = state.authMode === 'signup';
    return '<div class="overlay" data-action="auth-close">'
      + '<div class="modal" style="width:440px" data-action="stop">'
        + '<div class="modal-head">'
          + '<div class="modal-title">'+(signup ? 'Créer un compte' : 'Se connecter')+'</div>'
          + '<div class="modal-sub">'+(signup
              ? 'Pour sauvegarder tes données et les retrouver partout.'
              : 'Retrouve ton profil et tes objectifs.')+'</div>'
        + '</div>'
        + '<div class="modal-body">'
          + '<div class="pf"><label>Adresse e-mail</label>'
            + '<input data-auth="email" type="email" placeholder="louis@exemple.fr" autocomplete="email"></div>'
          + '<div class="pf" style="margin-top:12px"><label>Mot de passe</label>'
            + '<input data-auth="password" type="password" placeholder="'
              + (signup?'8 caractères minimum':'Ton mot de passe')+'" '
              + 'autocomplete="'+(signup?'new-password':'current-password')+'"></div>'
          + (state.authErr ? '<div class="form-error" style="margin-top:12px">'+esc(state.authErr)+'</div>' : '')
          + '<div class="auth-note">🔒 Ton mot de passe est chiffré côté serveur. '
            + 'Tes données restent aussi dans ce navigateur.</div>'
        + '</div>'
        + '<div class="modal-foot">'
          + '<button class="btn-cancel" data-action="auth-switch">'
            + (signup ? 'J’ai déjà un compte' : 'Créer un compte')+'</button>'
          + '<button class="btn-confirm active"'+(state.authBusy?' disabled':'')
            + ' data-action="auth-submit">'+(state.authBusy?'…':(signup?'Créer mon compte':'Se connecter'))+'</button>'
        + '</div>'
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // Rappels par e-mail - préférences
  // ---------------------------------------------------------------------------
  // Rien n'est envoyé tant que le membre n'a pas coché : le serveur ne connaît
  // personne tant qu'aucune préférence n'a été enregistrée.
  function notifCharger(force){
    if(!state.compte) return;
    if(state.notif.charge && !force) return;
    fetch('api/notifications', { credentials:'same-origin' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if(!d) return;
        state.notif = { charge:true, genres:d.genres || [], choix:d.choix || {},
                        confirme:!!d.confirme, email:d.email || '' };
        majProfilNotif();
      }, function(){});
  }

  function notifEnregistrer(){
    if(!state.compte) return;
    state.notif.envoi = true;
    majProfilNotif();
    fetch('api/notifications', {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'same-origin', body: JSON.stringify({ choix: state.notif.choix }),
    }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        state.notif.envoi = false;
        state.notif.confirme = true;
        if(d && d.choix) state.notif.choix = d.choix;
        state.notif.sauve = Date.now();
        majProfilNotif();
      }, function(){ state.notif.envoi = false; majProfilNotif(); });
  }

  // Rendu chirurgical : on ne re-render pas toute la modale pour une case.
  function majProfilNotif(){
    var zone = document.querySelector('[data-notif-zone]');
    if(zone) zone.innerHTML = notifBlocHtml(true);
    var res = document.querySelector('.prow[data-sid="notifications"] .prow-r');
    if(res){
      var n = Object.keys(state.notif.choix || {})
        .filter(function(k){ return state.notif.choix[k]; }).length;
      res.textContent = n ? n + ' rappel' + (n > 1 ? 's activés' : ' activé')
                          : 'Aucun rappel activé';
    }
  }

  function notifBlocHtml(interieur){
    if(!state.notif.charge){
      var vide = '<div class="notif-bloc">' + [0,1,2,3].map(function(){
        return '<div class="sq sq-notif"></div>'; }).join('') + '</div>';
      return interieur ? vide : '<div data-notif-zone>'+vide+'</div>';
    }
    var lignes = (state.notif.genres || []).map(function(g){
      var on = !!state.notif.choix[g.id];
      return '<button class="notif-l'+(on ? ' on' : '')+'" data-action="notif-bascule"'
        + ' data-id="'+esc(g.id)+'" role="switch" aria-checked="'+(on?'true':'false')+'">'
        + '<span class="notif-ico">'+g.ico+'</span>'
        + '<span class="notif-x"><span class="notif-t">'+esc(g.titre)+'</span>'
          + '<span class="notif-d">'+esc(g.desc)+'</span></span>'
        + '<span class="notif-sw"><i></i></span>'
      + '</button>';
    }).join('');

    var etat = state.notif.envoi ? 'Enregistrement…'
             : (state.notif.sauve && Date.now() - state.notif.sauve < 4000 ? 'Enregistré ✓' : '');
    var html = '<div class="notif-bloc">'
      + '<div class="notif-dest">Les rappels partiront à <strong>'+esc(state.notif.email)+'</strong></div>'
      + lignes
      + '<div class="notif-pied">'
        + '<span class="notif-etat">'+etat+'</span>'
        + '<span class="notif-aide">Un lien de désinscription est joint à chaque e-mail.</span>'
      + '</div>'
    + '</div>';
    return interieur ? html : '<div data-notif-zone>'+html+'</div>';
  }

  function profilBlocHtml(s, p){
    var ouvert = state.profilSection === s.id;
    var etat = etatSection(s.id);
    var champs = s.champs.filter(function(c){ return !c.si || c.si(p); })
                         .map(function(c){ return pfield(c, p); }).join('');
    if(s.extra === 'identite') champs += profilIdentiteExtra(p);
    if(s.extra === 'notifications') champs += notifBlocHtml();

    var total = '';
    if(s.total){
      var somme = s.total.cles.reduce(function(a, k){ return a + (parseFloat(p[k]) || 0); }, 0);
      var ok = Math.round(somme) === s.total.attendu;
      total = '<div class="pf-total'+(ok?' ok':'')+'">'+esc(s.total.l)+' : <strong>'
        + Math.round(somme)+' %</strong>'+(ok ? ' ✓' : ' - doit faire 100 %')+'</div>';
    }

    return '<section class="prow'+(ouvert?' open':'')+'" data-sid="'+s.id+'"'
      + ' style="--c:'+s.color+';--s:'+s.soft+'">'
      + '<button class="prow-head" data-action="profil-section" data-id="'+s.id+'">'
        + '<span class="prow-ico">'+s.ico+'</span>'
        + '<span class="prow-t">'+esc(s.titre)+'</span>'
        + '<span class="prow-r">'+esc(s.resume(p))+'</span>'
        + '<span class="prow-etat" title="'+esc(etat.manquants.length
            ? 'À compléter : ' + etat.manquants.join(', ') : 'Section complète')+'">'
          + anneauSection(etat.pct, s.color, 26)
          + '<span class="prow-frac">'+etat.faits+'/'+etat.total+'</span></span>'
        + '<span class="prow-chev">▶</span>'
      + '</button>'
      + '<div class="prow-wrap"><div class="prow-inner"><div class="prow-body">'
        + (s.note ? '<div class="prow-note">'+esc(s.note)+'</div>' : '')
        + '<div class="pf-grid">'+champs+'</div>'
        + total
      + '</div></div></div>'
    + '</section>';
  }

  // Chaque section a la liste de SES champs indispensables : on en tire un
  // pourcentage réel, affiché en anneau sur la ligne. Plus lisible qu'un
  // simple « rempli / pas rempli ».
  var rempli = function(v){ return v !== undefined && v !== null && String(v).trim() !== ''; };
  var REQUIS = {
    identite: [
      { k:'prenom', l:'Prénom' }, { k:'nom', l:'Nom' }, { k:'email', l:'E-mail' },
    ],
    activite: [
      { k:'activite', l:'Activité' },
      { k:'description', l:'Description', opt:true },
      { k:'categorieFiscale', l:'Catégorie fiscale',
        ok:function(p){ return p.categorieFiscale && p.categorieFiscale !== 'inconnu'; } },
    ],
    structure: [
      { k:'forme', l:'Forme juridique', ok:function(p){ return p.forme && !/je ne sais pas/i.test(p.forme); } },
      { k:'regime', l:'Régime', ok:function(p){ return p.regime && !/je ne sais pas/i.test(p.regime); } },
    ],
    ca: [
      { k:'ca', l:'Montant', ok:function(p){ return caProfilAnnuel(p) > 0; } },
      { k:'periodeCa', l:'Période' },
    ],
    tva: [
      { k:'tva', l:'Situation TVA', ok:function(p){ return p.tva && !/je ne sais pas/i.test(p.tva); } },
      { k:'tauxVente', l:'Taux de TVA' },
      { k:'clientele', l:'Répartition clientèle', ok:function(p){
          var t = (parseFloat(p.clientRecup)||0) + (parseFloat(p.clientProNon)||0);
          return Math.round(t) === 100; } },
    ],
    foyer: [
      { k:'parts', l:'Parts fiscales' },
      { k:'autresRevenus', l:'Autres revenus' },
      { k:'rfr', l:'Revenu fiscal de référence' },
    ],
    remuneration: [
      { k:'remMensuelle', l:'Rémunération', ok:function(p){ return parseFloat(p.remMensuelle) > 0; } },
      // Masqués en micro : ils ne doivent pas non plus peser dans le compte
      // des informations à fournir, sinon le profil paraît incomplet à vie.
      { k:'dividendes', l:'Dividendes', opt:true, si:estSociete },
      { k:'tresorerie', l:'Trésorerie gardée', opt:true, si:estSociete },
      { k:'cfe', l:'Montant de ta CFE', opt:true },
    ],
    charges: [
      { k:'charges', l:'Au moins une charge', ok:function(p){
          return (p.charges||[]).some(function(c){ return c.nom && c.montant; }); } },
    ],
  };

  // { faits, total, pct, manquants[] } pour une section.
  function etatSection(id){
    var p = state.profil;
    // Même filtre que l'affichage : un champ qui ne s'applique pas au statut
    // ne peut pas être « manquant ».
    var champs = (REQUIS[id] || []).filter(function(c){ return !c.si || c.si(p); });
    var manquants = champs.filter(function(c){
      return !(c.ok ? c.ok(p) : rempli(p[c.k]));
    });
    var faits = champs.length - manquants.length;
    // Les champs marqués `opt` ont un repli fonctionnel (valeur par défaut ou
    // secondaire) : ils comptent dans le taux de remplissage, mais ils ne
    // rendent pas un résultat douteux. On ne les signale donc pas en alerte.
    var bloquants = manquants.filter(function(c){ return !c.opt; });
    return { faits:faits, total:champs.length,
             pct: champs.length ? Math.round(faits / champs.length * 100) : 100,
             manquants: manquants.map(function(c){ return c.l; }),
             bloquants: bloquants.map(function(c){ return c.l; }) };
  }

  function sectionsProfil(){
    var p = state.profil;
    var liste = PROFIL_SECTIONS.filter(function(s){ return !s.si || s.si(p); })
      .map(function(s){ return { id:s.id, titre:s.titre, color:s.color }; });
    liste.push({ id:'charges', titre:'Charges professionnelles', color:'#ea580c' });
    return liste.map(function(s){
      var e = etatSection(s.id);
      s.pct = e.pct; s.faits = e.faits; s.total = e.total;
      s.manquants = e.manquants; s.bloquants = e.bloquants;
      s.ok = e.pct === 100; s.fiable = e.bloquants.length === 0;
      return s;
    });
  }

  // Petit anneau de remplissage, posé sur chaque ligne du profil.
  // `epais` : anneau large avec le chiffre en grand, pour le score de sérénité.
  function anneauSection(pct, color, taille, epais){
    var trait = epais ? Math.max(8, taille * 0.095) : 4;
    var R = taille / 2 - trait / 2 - 1, C = 2 * Math.PI * R;
    var chiffre = epais ? taille * 0.3 : 9;
    return '<svg class="ring'+(epais ? ' ring-gras' : '')+'" viewBox="0 0 '+taille+' '+taille+'" '
      + 'width="'+taille+'" height="'+taille+'">'
      + '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+R+'" fill="none" stroke="#e6eaf2" '
        + 'stroke-width="'+trait+'"/>'
      + '<circle cx="'+(taille/2)+'" cy="'+(taille/2)+'" r="'+R+'" fill="none" stroke="'+color+'" '
        + 'stroke-width="'+trait+'" stroke-linecap="round" stroke-dasharray="'+(pct/100*C)+' '+C+'" '
        + 'transform="rotate(-90 '+(taille/2)+' '+(taille/2)+')"/>'
      + (pct === 100 && !epais
          ? '<path d="M'+(taille*0.32)+' '+(taille*0.5)+' l'+(taille*0.12)+' '+(taille*0.13)
            + ' l'+(taille*0.24)+' -'+(taille*0.26)+'" fill="none" stroke="'+color
            + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<text x="'+(taille/2)+'" y="'+(taille/2 + chiffre*0.36)+'" text-anchor="middle" '
            + 'font-size="'+chiffre+'" font-weight="800" fill="'+color+'"'
            + (epais ? ' letter-spacing="-1"' : '')+'>'+pct+'</text>')
      + '</svg>';
  }

  function jaugeProfilHtml(){
    var secs = sectionsProfil();
    // Pourcentage global = champs remplis / champs attendus, toutes sections
    // confondues. Une section à moitié faite compte donc pour moitié.
    var faits = secs.reduce(function(a, s){ return a + s.faits; }, 0);
    var total = secs.reduce(function(a, s){ return a + s.total; }, 0);
    var pct = total ? Math.round(faits / total * 100) : 100;
    var restantes = secs.filter(function(s){ return !s.ok; });

    var R = 34, C = 2 * Math.PI * R;
    var anneau = '<svg viewBox="0 0 80 80" width="80" height="80">'
      + '<circle cx="40" cy="40" r="'+R+'" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7"/>'
      + '<circle cx="40" cy="40" r="'+R+'" fill="none" stroke="#fff" stroke-width="7" '
        + 'stroke-linecap="round" stroke-dasharray="'+(pct/100*C)+' '+C+'" '
        + 'transform="rotate(-90 40 40)"/>'
      + '<text x="40" y="46" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">'
        + pct + '%</text></svg>';

    var reste = restantes.length
      ? '<div class="jauge-reste"><span class="jauge-rl">Il te reste</span>' + restantes.map(function(s){
          return '<button class="jchip" style="--c:'+s.color+'" data-action="profil-section" data-id="'
            + s.id+'">'+esc(s.titre)+' <b>'+s.faits+'/'+s.total+'</b></button>'; }).join('') + '</div>'
      : '<div class="jauge-reste"><span class="jauge-ok">🎉 Profil complet - tes cinq simulateurs '
        + 'tournent sur des données à jour.</span></div>';

    return '<div class="jauge">'
      + '<div class="jauge-anneau">'+anneau+'</div>'
      + '<div class="jauge-txt">'
        + '<div class="jauge-t">Ton profil est rempli à '+pct+' %</div>'
        + '<div class="jauge-s">'+faits+' information'+(faits>1?'s':'')+' sur '+total
          + ' - plus il est complet, plus tes simulateurs sont justes.</div>'
        + reste
      + '</div>'
      + '</div>';
  }

  function profilHtml(){
    var p = state.profil;
    var blocs = PROFIL_SECTIONS.filter(function(s){ return !s.si || s.si(p); })
                               .map(function(s){ return profilBlocHtml(s, p); }).join('');

    // Charges : même ligne dépliable, mais son contenu est une liste.
    var charges = p.charges || [];
    var totalAn = charges.reduce(function(a, c){
      return a + annualiser(parseFloat(c.montant) || 0, c.frequence); }, 0);
    var ouvertCh = state.profilSection === 'charges';
    var blocCharges = '<section class="prow'+(ouvertCh?' open':'')+'" style="--c:#ea580c;--s:#fff4ed">'
      + '<button class="prow-head" data-action="profil-section" data-id="charges">'
        + '<span class="prow-ico">🧰</span>'
        + '<span class="prow-t">Charges professionnelles</span>'
        + '<span class="prow-r">'+charges.length+' ligne'+(charges.length>1?'s':'')
          + ' · '+fmtEur(totalAn)+' / an</span>'
        + '<span class="prow-etat">'+anneauSection(etatSection('charges').pct, '#ea580c', 26)
          + '<span class="prow-frac">'+etatSection('charges').faits+'/'
          + etatSection('charges').total+'</span></span>'
        + '<span class="prow-chev">▶</span>'
      + '</button>'
      + '<div class="prow-wrap"><div class="prow-inner"><div class="prow-body">'
        + '<div class="prow-note">Saisies une seule fois ici : les simulateurs TVA, '
          + '« Passer en société » et « Optimiser » s’en servent directement.</div>'
        + '<div class="pcharges">' + charges.map(profilChargeHtml).join('') + '</div>'
        + '<button class="btn-link" data-action="pcharge-add">+ Ajouter une charge</button>'
      + '</div></div></div>'
    + '</section>';

    var saved = state.profilSaved ? '<span class="profil-saved">✓ Enregistré</span>' : '';
    return '<div class="view">'
      + jaugeProfilHtml()
      + '<div class="prows">'+blocs+blocCharges+'</div>'
      + '<div class="sauvegarde">'
        + '<div class="sauvegarde-t">💾 Sauvegarde</div>'
        + '<div class="sauvegarde-s">Tes données vivent uniquement dans ce navigateur. '
          + 'Exporte-les pour les mettre à l’abri, ou les reprendre sur un autre ordinateur.</div>'
        + '<div class="sauvegarde-a">'
          + '<button class="btn-ghost" data-action="export-donnees">Exporter mes données</button>'
          + '<label class="btn-ghost" style="cursor:pointer">Importer un fichier'
            + '<input type="file" accept="application/json,.json" data-import-donnees hidden></label>'
          + (state.importInfo ? '<span class="profil-saved">'+esc(state.importInfo)+'</span>' : '')
        + '</div>'
      + '</div>'
      + '<div class="pbar">'
        + '<button class="btn-primary" data-action="profil-save">Enregistrer</button>'
        + '<button class="btn-ghost" data-action="profil-back">Retour</button>'
        + saved
      + '</div>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Sauvegarde : export / import de tout ce que l'app garde dans le navigateur
  // ---------------------------------------------------------------------------
  // 'freehub_onboarded' fait partie du lot : sans lui, se connecter depuis un
  // autre navigateur rejouerait le questionnaire d'arrivée déjà rempli.
  var CLES_SAUVEGARDE = ['freehub_profil','freehub_historique','freehub_hist_vl',
                         'freehub_hist_tva','freehub_scenarios','freehub_params',
                         'freehub_objectifs','freehub_lexique','freehub_dep_favoris','freehub_badges','freehub_faits',
                         'freehub_badge_porte','freehub_onboarded','freehub_serenite'];

  function exporterDonnees(){
    var paquet = { app:'FreeHub', version:1, date:new Date().toISOString(), donnees:{} };
    CLES_SAUVEGARDE.forEach(function(k){
      var v = null;
      try { v = localStorage.getItem(k); } catch(e){}
      if(v !== null) paquet.donnees[k] = v;
    });
    var blob = new Blob([JSON.stringify(paquet, null, 2)], { type:'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'freehub-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  function importerDonnees(fichier){
    var lecteur = new FileReader();
    lecteur.onload = function(ev){
      var paquet;
      try { paquet = JSON.parse(ev.target.result); } catch(e){ paquet = null; }
      if(!paquet || paquet.app !== 'FreeHub' || !paquet.donnees){
        state.importInfo = '✕ Fichier non reconnu';
        render();
        return;
      }
      var n = 0;
      Object.keys(paquet.donnees).forEach(function(k){
        if(CLES_SAUVEGARDE.indexOf(k) < 0) return;   // on n'écrit que nos propres clés
        try { localStorage.setItem(k, paquet.donnees[k]); n++; } catch(e){}
      });
      // On relit tout depuis le stockage pour repartir sur des données propres.
      state.profil = loadProfil();
      state.historique = loadHistorique();
      state.vl.historique = loadHistVL();
      state.tva.historique = loadHistTVA();
      state.optim.scenarios = loadScenarios();
      var ob = loadObjectifs();
      state.added = ob.added; state.checks = ob.checks;
      appliquerProfil();
      state.importInfo = '✓ ' + n + ' élément' + (n>1?'s':'') + ' restauré' + (n>1?'s':'');
      render();
    };
    lecteur.readAsText(fichier);
  }

  function fmtEur(n){
    n = Math.round(Number(n) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  }
  // Evite les 2,1999999999999997 % dus a l'arithmetique flottante.
  function fmtPct(taux){
    return String(Math.round(taux * 10000) / 100).replace('.', ',') + '%';
  }

  // ---------- Étape 1 : accueil ----------
  function histItemHtml(sim, i){
    var d = new Date(sim.date);
    var jour = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    var heure = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    var items = (sim.result && sim.result.depenses) || [];
    var dots = items.map(function(it){
      var st = STATUT[it && it.statut] ? STATUT[it.statut] : STATUT.gris;
      return '<span class="hist-dot" style="background:'+st.bg+'"></span>';
    }).join('');
    var n = items.length;
    return '<div class="hist-item" data-action="hist-view" data-i="'+i+'">'
      + '<div style="flex:1;min-width:0">'
        + '<div class="hist-date">'+esc(jour)+' · '+esc(heure)+'</div>'
        + '<div class="hist-meta">'+n+' dépense'+(n>1?'s':'')+' · '+fmtEur(sim.total || 0)+'</div>'
      + '</div>'
      + '<div class="hist-dots">'+dots+'</div>'
      + '<button class="icon-btn danger" data-action="hist-delete" data-i="'+i+'" title="Supprimer">✕</button>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Guide des dépenses pro - le catalogue visuel qui remplace le « test » sec.
  //
  // Philosophie : pousser à la réflexion (« tiens, ça aussi je pourrais le
  // passer ») plutôt que faire vérifier un frais. Chaque carte porte une jauge
  // de « facilité » 0–100 : plus c'est à droite (vert), plus la dépense passe
  // couramment ; plus c'est à gauche (rouge), plus elle est encadrée.
  // Les scores sont des repères QUALITATIFS pour une société au réel - jamais
  // un avis fiscal. Aucun chiffre officiel n'est inventé : les fiches renvoient
  // vers les sites officiels quand un barème existe.
  // ---------------------------------------------------------------------------
  var DEP_CATS = {
    outils:      { l:'Outils & matériel',       e:'🧰', c:'#2f6bff', s:'#eef4ff' },
    deplacement: { l:'Déplacements',            e:'🚗', c:'#e0803b', s:'#fdf1e7' },
    repas:       { l:'Repas & relations',       e:'🍽️', c:'#d4488e', s:'#fdeef5' },
    local:       { l:'Local & domicile',        e:'🏠', c:'#0ea5e9', s:'#e9f6fd' },
    protection:  { l:'Assurances & protection', e:'🛡️', c:'#0f9d58', s:'#e6f6ee' },
    services:    { l:'Services & compétences',  e:'🤝', c:'#6d3fd4', s:'#f2eefe' },
    equipe:      { l:'Rémunérations & équipe',  e:'👥', c:'#c2410c', s:'#fdf0e9' },
    finance:     { l:'Finance & banque',        e:'🏦', c:'#0f766e', s:'#e7f5f3' },
    perso:       { l:'Zone grise perso',        e:'🚦', c:'#5b6b85', s:'#eef1f6' },
  };

  var DEPENSES_GUIDE = [
    // ----- Outils & matériel -----
    { id:'logiciels', cat:'outils', e:'💻', n:'Logiciels & abonnements pro', score:95, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'SaaS, licences, IA… l’outillage numérique de ton activité',
      verdict:'La dépense pro par excellence : difficile de faire plus évident',
      detail:'Un outil que tu utilises pour produire, vendre ou gérer ton activité est dans l’intérêt direct de l’entreprise. Facture au nom de la société et le tour est joué',
      vigi:['Facture au nom de la société, pas en ton nom perso','Un abonnement à usage mixte (ex : streaming) ne passe pas'],
      mots:['logiciel','abonnement','saas','adobe','figma','notion','licence','chatgpt','claude'] },
    { id:'materiel-info', cat:'outils', e:'🖥️', n:'Matériel informatique', score:83, pcat:'investissement', ptva:'0.2', multi:true,
      pitch:'Ordinateur, écran, clavier : tes machines de travail',
      verdict:'Passe très bien, mais au-delà d’un certain montant on amortit au lieu de déduire d’un coup',
      detail:'L’outil de travail numéro un du freelance. Pour un matériel coûteux, il s’immobilise et s’amortit sur plusieurs années plutôt qu’en une seule charge, ton comptable arbitre',
      vigi:['Usage principalement professionnel','Gros montant : penser amortissement','Garder la facture, pas juste le ticket'],
      mots:['ordinateur','mac','pc','écran','clavier','souris','imprimante','informatique','macbook'] },
    { id:'telephone', cat:'outils', e:'📱', n:'Téléphone & forfait', score:66, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'L’appareil et l’abonnement qui font tourner ton activité',
      verdict:'Courant et accepté, à condition que la part d’usage perso reste cohérente',
      detail:'Une ligne 100 % pro passe sans discussion. Un appareil mixte pro/perso se ventile : on ne déduit que la part professionnelle, estimée honnêtement',
      vigi:['Ligne dédiée = plus simple à justifier','Usage mixte : ventiler la part pro'],
      mots:['téléphone','forfait','mobile','iphone','samsung','sfr','orange','bouygues','free'] },
    { id:'fournitures', cat:'outils', e:'🖇️', n:'Fournitures de bureau', score:89, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'Papier, encre, petit matériel du quotidien',
      verdict:'Aucun sujet : c’est le b.a.-ba de la charge déductible',
      detail:'Les petites fournitures consommées par l’activité passent en charge sans difficulté. Le seul vrai risque, c’est de perdre les justificatifs',
      vigi:['Garder les factures, même petites'],
      mots:['fourniture','papier','encre','stylo','cartouche','bureau'] },
    { id:'mobilier', cat:'outils', e:'🪑', n:'Mobilier de bureau', score:71, pcat:'investissement', ptva:'0.2', multi:true,
      pitch:'Bureau, fauteuil, rangements de ton espace de travail',
      verdict:'Passe bien pour un vrai poste de travail, beaucoup moins pour meubler le salon',
      detail:'Un fauteuil ergonomique ou un bureau dédié à l’activité se justifient sans mal, même à domicile. Ce qui coince : le mobilier qui profite manifestement à toute la maison',
      vigi:['Cohérent avec un espace de travail réel','Gros montant : amortissement possible'],
      mots:['bureau','fauteuil','chaise','mobilier','meuble'] },
    { id:'hebergement-web', cat:'outils', e:'🌐', n:'Site web, domaine, hébergement', score:93, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Ta vitrine en ligne et tout ce qui la fait tourner',
      verdict:'Dépense évidente : c’est ton outil de visibilité professionnelle',
      detail:'Nom de domaine, hébergement, thème, prestation de création : tout ce qui construit ta présence en ligne professionnelle est une charge classique',
      vigi:['Facture au nom de la société'],
      mots:['site','domaine','hébergement','ovh','wordpress','wix','webflow'] },
    { id:'materiel-metier', cat:'outils', e:'🎥', n:'Matériel spécifique métier', score:74, pcat:'investissement', ptva:'0.2', multi:true,
      pitch:'Caméra, instruments, outillage : les outils de TON métier',
      verdict:'Très solide dès que le lien avec ton activité saute aux yeux',
      detail:'Une caméra pour un vidéaste, un micro pour un podcasteur, une ponceuse pour un artisan : le lien direct avec l’activité rend la dépense limpide. Le même achat sans lien métier devient personnel',
      vigi:['Le lien avec l’activité doit être évident','Usage perso résiduel toléré, pas dominant'],
      mots:['caméra','objectif','micro','instrument','outillage','drone','appareil photo'] },

    // ----- Déplacements -----
    { id:'km', cat:'deplacement', e:'⛽', n:'Frais kilométriques', score:50, pcat:'vehicule', ptva:'0', multi:false,
      pitch:'Ta voiture perso au service de l’activité, au barème officiel',
      verdict:'Très utilisé et parfaitement légal, à condition de tenir ses trajets au propre',
      detail:'Le barème kilométrique officiel indemnise l’usage pro de ton véhicule personnel. Tout repose sur la traçabilité : date, motif, destination, kilomètres de chaque trajet',
      vigi:['Tenir un relevé des trajets (date, motif, km)','Trajets domicile-bureau : règles particulières','Ne couvre que l’usage réellement pro'],
      mots:['kilométrique','essence','carburant','km','voiture','déplacement véhicule'],
      lien:IMPOTS, prio:6,
      sugg:function(p){ return estSociete(p) ? 'Tu utilises ta voiture perso pour l’activité ? Le barème kilométrique officiel est fait pour ça.' : null; } },
    { id:'transport', cat:'deplacement', e:'🚆', n:'Train, avion, transports', score:73, pcat:'deplacement', ptva:'0.1', multi:true,
      pitch:'Rejoindre un client, un salon, une mission',
      verdict:'Passe bien dès que le motif professionnel du déplacement est clair',
      detail:'Un billet pour aller voir un client ou un événement pro est une charge évidente. Garde le motif du déplacement avec le billet : c’est lui qui fait la différence',
      vigi:['Noter le motif pro du déplacement','Classe confort : rester raisonnable'],
      mots:['train','avion','sncf','billet','métro','taxi','uber','vol'] },
    { id:'hotel', cat:'deplacement', e:'🏨', n:'Hôtel & hébergement', score:61, pcat:'deplacement', ptva:'0.1', multi:true,
      pitch:'Dormir sur place quand la mission l’exige',
      verdict:'Accepté en déplacement pro réel, avec un standing qui reste cohérent',
      detail:'Une nuit d’hôtel pour une mission loin de chez toi se justifie naturellement. Les ennuis commencent quand la durée ou le standing dépassent ce que la mission explique',
      vigi:['Lié à un déplacement pro daté et motivé','Standing raisonnable par rapport à l’activité'],
      mots:['hôtel','airbnb','hébergement','nuit'] },
    { id:'peage-parking', cat:'deplacement', e:'🅿️', n:'Péages & parking', score:69, pcat:'vehicule', ptva:'0.2', multi:false,
      pitch:'Les à-côtés des trajets professionnels',
      verdict:'Suit le sort du déplacement : pro si le trajet l’est',
      detail:'Péages et stationnement d’un déplacement professionnel passent avec lui. Pense juste à récupérer les reçus, souvent oubliés',
      vigi:['Récupérer les justificatifs','Lié à un trajet pro identifiable'],
      mots:['péage','parking','stationnement'] },
    { id:'vehicule-societe', cat:'deplacement', e:'🚙', n:'Voiture de société', score:30, pcat:'vehicule', ptva:'0.2', multi:false,
      pitch:'Acheter ou louer un véhicule au nom de la société',
      verdict:'Possible mais lourdement encadré : à ne jamais décider sans ton comptable',
      detail:'Amortissement plafonné, taxes spécifiques, avantage en nature si usage perso : la voiture de société est un vrai dossier, pas une simple charge. Parfois pertinente, souvent moins avantageuse que le barème kilométrique',
      vigi:['Comparer avec les frais kilométriques avant de décider','Usage perso = avantage en nature à déclarer','Décision à valider avec un expert-comptable'],
      mots:['véhicule société','leasing','lld','loa'], lien:IMPOTS },
    { id:'voyage-mixte', cat:'deplacement', e:'🏝️', n:'Voyage mixte pro/perso', score:15, pcat:'deplacement', ptva:'0.1', multi:true,
      pitch:'Prolonger une mission par quelques jours de vacances…',
      verdict:'La part vacances ne passera jamais, seule la part strictement pro se défend',
      detail:'Coupler un déplacement pro et des vacances n’est pas interdit, mais seule la fraction professionnelle (transport aller pour la mission, nuits de mission) peut se justifier. Le reste est personnel, point',
      vigi:['Séparer clairement les jours pro des jours perso','En cas de doute : ne pas passer la dépense'],
      mots:['voyage','vacances'] },

    // ----- Repas & relations -----
    { id:'resto-affaires', cat:'repas', e:'🍽️', n:'Restaurant d’affaires', score:47, pcat:'deplacement', ptva:'0.1', multi:true,
      pitch:'Inviter un client, un prospect, un partenaire',
      verdict:'Classique et admis, si tu notes avec qui et pourquoi à chaque fois',
      detail:'Le repas d’affaires est une charge reconnue quand il sert l’activité. La règle d’or tient en deux questions : avec qui ? pour parler de quoi ? Note-le sur la facture',
      vigi:['Noter l’invité et le motif sur le justificatif','Fréquence et montants raisonnables','Un repas seul n’est pas un repas d’affaires'],
      mots:['restaurant','repas client','déjeuner'] },
    { id:'repas-deplacement', cat:'repas', e:'🥪', n:'Repas en déplacement', score:45, pcat:'deplacement', ptva:'0.1', multi:false,
      pitch:'Manger sur la route, loin de sa cuisine',
      verdict:'Admis en déplacement réel, dans la limite du surcoût raisonnable',
      detail:'En mission loin de chez toi, ton repas devient une charge : l’idée est qu’on t’indemnise le surcoût par rapport à un repas à la maison, pas le repas gastronomique',
      vigi:['Lié à un déplacement pro identifiable','Montants raisonnables'],
      mots:['repas déplacement'] },
    { id:'repas-quotidien', cat:'repas', e:'🍱', n:'Repas du quotidien', score:19, pcat:'deplacement', ptva:'0.1', multi:false,
      pitch:'Le déjeuner de tous les jours, près de chez toi',
      verdict:'Dépense personnelle par nature : manger, tu le ferais de toute façon',
      detail:'Le repas quotidien sans déplacement ni invité est l’exemple type de la dépense personnelle. Le passer en charge, c’est le redressement facile en cas de contrôle',
      vigi:['Ne passe pas, sauf déplacement ou invitation pro'],
      mots:['déjeuner quotidien','cantine'] },
    { id:'cadeaux', cat:'repas', e:'🎁', n:'Cadeaux clients', score:42, pcat:'communication', ptva:'0.2', multi:true,
      pitch:'Remercier un client, soigner une relation d’affaires',
      verdict:'Admis avec modération, bénéficiaire identifiable et montant raisonnable',
      detail:'Offrir un cadeau à un client dans l’intérêt de la relation commerciale est prévu par les règles fiscales, avec des limites de bon sens sur les montants et une traçabilité du bénéficiaire',
      vigi:['Noter le bénéficiaire','Montant proportionné à la relation','Au-delà de certains seuils, un relevé spécial est demandé : vois ton comptable'],
      mots:['cadeau'], lien:IMPOTS },
    { id:'invitations', cat:'repas', e:'🎟️', n:'Invitations & événements', score:38, pcat:'communication', ptva:'0.2', multi:true,
      pitch:'Un match, un concert, un salon avec un client',
      verdict:'Défendable dans une vraie logique commerciale, glissant au-delà',
      detail:'Inviter un client à un événement peut relever des relations publiques de l’entreprise. Plus l’événement ressemble à un loisir perso, plus la justification devient acrobatique',
      vigi:['Invité et objectif commercial notés','Fréquence contenue'],
      mots:['invitation','événement','place','billet concert'] },

    // ----- Local & domicile -----
    { id:'coworking', cat:'local', e:'🏢', n:'Coworking & location de bureau', score:88, pcat:'local', ptva:'0.2', multi:false,
      pitch:'Un vrai lieu de travail, une charge évidente',
      verdict:'Aucune ambiguïté : c’est le loyer professionnel du freelance',
      detail:'Abonnement coworking ou location d’un bureau : usage 100 % professionnel, facture au nom de la société, rien à redire',
      vigi:['Facture au nom de la société'],
      mots:['coworking','bureau location','wework'] },
    { id:'quote-part-domicile', cat:'local', e:'🏠', n:'Quote-part du domicile', score:52, pcat:'local', ptva:'0', multi:false,
      pitch:'Travailler de chez soi peut se valoriser, proprement',
      verdict:'Légitime avec un calcul sérieux : surface dédiée, part cohérente, trace écrite',
      detail:'Si ton activité occupe une pièce ou un coin dédié de ton logement, une fraction du loyer et des charges peut passer sur l’entreprise. La clé : un calcul de surface documenté et constant, pas un pourcentage sorti du chapeau',
      vigi:['Calcul de surface écrit et conservé','Cohérence dans le temps','Propriétaire : d’autres règles, voir comptable'],
      mots:['loyer','domicile','quote-part'], prio:4,
      sugg:function(p){ return estSociete(p) ? 'Tu travailles de chez toi ? Une partie de ton loyer et de tes factures peut passer sur la société.' : null; } },
    { id:'internet', cat:'local', e:'📶', n:'Internet du domicile', score:54, pcat:'local', ptva:'0.2', multi:false,
      pitch:'La box qui fait tourner ton activité… et Netflix',
      verdict:'Se ventile comme le loyer : part pro raisonnable, pas la facture entière',
      detail:'Ta connexion sert l’activité, mais aussi le foyer. On déduit une quote-part cohérente avec ton usage professionnel, pas 100 %',
      vigi:['Quote-part raisonnable et constante'],
      mots:['internet','box','fibre'] },
    { id:'energie-domicile', cat:'local', e:'💡', n:'Électricité & chauffage (part pro)', score:48, pcat:'local', ptva:'0.2', multi:false,
      pitch:'Les charges du logement, au prorata de ton espace de travail',
      verdict:'Suit la quote-part du domicile : même logique, même rigueur',
      detail:'Si tu valorises un espace de travail à domicile, les fluides suivent le même prorata de surface. Sans calcul documenté, ça ne tient pas',
      vigi:['Même prorata que la quote-part logement','Justificatifs des factures'],
      mots:['électricité','edf','chauffage','énergie'] },

    // ----- Assurances & protection -----
    { id:'rc-pro', cat:'protection', e:'🛡️', n:'Assurance RC pro', score:91, pcat:'assurance', ptva:'0', multi:false,
      pitch:'La protection de base de ton activité',
      verdict:'Charge évidente, et une protection que tout indépendant devrait avoir',
      detail:'La responsabilité civile professionnelle couvre les dégâts que ton activité pourrait causer. Assurance strictement professionnelle : déduction sans débat',
      vigi:['Contrat au nom de l’activité/société'],
      mots:['rc pro','responsabilité civile','assurance pro','axa','maif','hiscox'], prio:5,
      sugg:function(p){ return estSociete(p) ? 'Peu chère, entièrement déductible, et elle protège ton activité : la RC pro coche toutes les cases.' : null; } },
    { id:'mutuelle', cat:'protection', e:'🩺', n:'Mutuelle santé (Madelin)', score:56, pcat:'assurance', ptva:'0', multi:false,
      pitch:'Ta complémentaire santé, déductible sous conditions de statut',
      verdict:'Déductible pour les indépendants TNS via un contrat Madelin, mais pas en micro',
      detail:'Gérant d’EURL ou de SARL (statut TNS) : un contrat de mutuelle « loi Madelin » se déduit de ton revenu. En micro-entreprise, rien ne se déduit ; en SASU, tu relèves d’un autre cadre (assimilé salarié)',
      vigi:['Contrat estampillé « Madelin » requis','Dépend de ton statut : TNS uniquement','Être à jour de ses cotisations sociales'],
      mots:['mutuelle','complémentaire santé','madelin'], lien:SPUBLIC, prio:1,
      sugg:function(p){ return /eurl|sarl/i.test(p.forme||'') ? 'Avec ton statut de gérant TNS, ta mutuelle peut se déduire via un contrat Madelin, beaucoup passent à côté' : null; } },
    { id:'prevoyance', cat:'protection', e:'🧯', n:'Prévoyance & retraite (Madelin)', score:58, pcat:'assurance', ptva:'0', multi:false,
      pitch:'Préparer les coups durs et la suite, en déduisant',
      verdict:'Même logique Madelin que la mutuelle : réservé aux TNS, et souvent très pertinent',
      detail:'Arrêt de travail, invalidité, retraite complémentaire : les contrats Madelin permettent aux TNS de se construire une protection en déduisant les cotisations, dans des plafonds officiels',
      vigi:['Contrat Madelin, plafonds officiels','TNS uniquement (EURL, SARL…)'],
      mots:['prévoyance','retraite','per','madelin'], lien:SPUBLIC, prio:2,
      sugg:function(p){ return /eurl|sarl/i.test(p.forme||'') ? 'Prévoyance et retraite complémentaire profitent aussi du dispositif Madelin pour les TNS.' : null; } },
    { id:'frais-bancaires', cat:'protection', e:'🏦', n:'Frais bancaires pro', score:87, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'Le compte pro et ses frais de tenue',
      verdict:'Charge banale et incontestée du compte professionnel',
      detail:'Frais de tenue de compte, cartes, virements du compte pro : des charges d’exploitation ordinaires',
      vigi:['Compte professionnel, pas le compte perso'],
      mots:['banque','frais bancaires','qonto','shine','compte pro'] },

    // ----- Services & compétences -----
    { id:'comptable', cat:'services', e:'🧮', n:'Expert-comptable', score:92, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'Celui qui sécurise tout le reste de cette page',
      verdict:'Charge évidente, et probablement la plus rentable de la liste',
      detail:'Honoraires de comptabilité, de bilan, de conseil fiscal : intégralement professionnels. C’est aussi lui qui tranchera les cas orange et rouges de ce guide pour TON dossier',
      vigi:['Aucune vigilance particulière'],
      mots:['comptable','compta','expert-comptable','indy','dougs','pennylane'], prio:3,
      sugg:function(p){ return estSociete(p) ? 'En société, l’expert-comptable est quasi incontournable, et entièrement déductible' : null; } },
    { id:'sous-traitance', cat:'services', e:'🤝', n:'Sous-traitance & freelances', score:79, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Déléguer une partie de la production ou des tâches',
      verdict:'Passe très bien avec de vraies factures et une vraie prestation',
      detail:'Faire appel à un autre indépendant pour une mission est une charge classique. Les contrôles regardent la réalité de la prestation : devis, livrables, factures',
      vigi:['Factures en bonne et due forme','Prestation réelle et documentée','Attention au salariat déguisé sur les missions longues'],
      mots:['sous-traitance','freelance','prestataire'] },
    { id:'formation', cat:'services', e:'🎓', n:'Formation professionnelle', score:77, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Monter en compétence dans ton domaine',
      verdict:'Très bien vue quand elle sert l’activité actuelle ou son développement direct',
      detail:'Une formation liée à ton métier ou à son évolution logique passe sans mal. Une reconversion totale vers un autre domaine se discute davantage',
      vigi:['Lien avec l’activité (actuelle ou développement)','Garder programme et facture'],
      mots:['formation','cours','certification','udemy'] },
    { id:'livres', cat:'services', e:'📚', n:'Livres & documentation pro', score:76, pcat:'fonctionnement', ptva:'0.055', multi:true,
      pitch:'La veille et la doc de ton métier',
      verdict:'Passe bien dès que le sujet parle à ton activité',
      detail:'Livres métier, presse spécialisée, abonnements de veille : des charges modestes et cohérentes. Le roman de plage, non',
      vigi:['Thème en lien avec l’activité'],
      mots:['livre','documentation','presse','magazine','veille'] },
    { id:'pub', cat:'services', e:'📣', n:'Publicité & marketing', score:86, pcat:'communication', ptva:'0.2', multi:true,
      pitch:'Faire connaître ton activité : ads, flyers, branding',
      verdict:'Dépense de développement classique, très bien acceptée',
      detail:'Campagnes en ligne, création de logo, cartes de visite, salons : tout ce qui sert à vendre est une charge d’exploitation naturelle',
      vigi:['Factures au nom de la société'],
      mots:['publicité','ads','google ads','meta','marketing','flyer','logo'] },
    { id:'cotisations-pro', cat:'services', e:'🏛️', n:'Cotisations pro (ordre, syndicat)', score:81, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'Adhésions professionnelles et organismes de ton secteur',
      verdict:'Charge normale de la vie professionnelle organisée',
      detail:'Cotisation à un ordre, un syndicat professionnel, une fédération de ton secteur : lien direct avec l’exercice du métier',
      vigi:['Organisme en lien avec ton activité'],
      mots:['cotisation','ordre','syndicat','fédération','adhésion'] },
    { id:'juridique', cat:'services', e:'⚖️', n:'Frais juridiques & administratifs', score:84, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Avocat, formalités, protection de ta marque',
      verdict:'Les frais de structuration de l’entreprise passent naturellement',
      detail:'Conseil juridique, dépôt de marque, formalités de société : des dépenses au service direct de l’entreprise et de sa protection',
      vigi:['Conserver les actes avec les factures'],
      mots:['avocat','juridique','marque','inpi','formalités'] },

    // ----- Zone grise perso -----
    { id:'vetements', cat:'perso', e:'👔', n:'Vêtements', score:24, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'S’habiller pour travailler… comme pour tout le reste',
      verdict:'Refusé sauf tenue spécifique au métier : le costume « pour faire pro » ne passe pas',
      detail:'La règle est constante : un vêtement portable dans la vie courante est personnel, même acheté « pour les clients ». Passent : les tenues techniques ou imposées (EPI, blouse, costume de scène)',
      vigi:['Seules les tenues spécifiques au métier passent','Le vêtement de ville ne passe jamais, même élégant'],
      mots:['vêtement','costume','chaussure'] },
    { id:'lunettes', cat:'perso', e:'👓', n:'Lunettes de vue', score:12, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'Tu en as besoin pour l’écran… et pour conduire, lire, vivre',
      verdict:'Dépense de santé personnelle : passe par ta mutuelle, pas par la société',
      detail:'Les lunettes corrigent ta vue dans toute ta vie, pas seulement au travail : c’est une dépense personnelle de santé. Le bon canal, c’est la complémentaire santé',
      vigi:['Ne passe pas en charge, même « pour l’écran »'],
      mots:['lunettes','optique'] },
    // ----- Rémunérations & équipe -----
    { id:'salaires', cat:'equipe', e:'👥', n:'Salaires & cotisations', score:96, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'La paie de tes salariés et les charges qui vont avec',
      verdict:'Charge d’exploitation par excellence : aucune discussion possible',
      detail:'Salaires bruts et cotisations patronales se déduisent du résultat. C’est souvent le premier poste de dépense d’une société qui embauche',
      vigi:['Contrat de travail et bulletins de paie en règle','Déclarations sociales à jour'],
      mots:['salaire','paie','cotisation','employé','salarié'] },
    { id:'remuneration-dirigeant', cat:'equipe', e:'💼', n:'Rémunération du dirigeant', score:88, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'Ce que tu te verses, et son coût pour la société',
      verdict:'Déductible du résultat de la société, mais imposable chez toi',
      detail:'Ta rémunération réduit le bénéfice imposable de la société. En contrepartie, elle devient un revenu imposable et cotisé de ton côté : l’arbitrage rémunération / dividendes est un vrai levier d’optimisation',
      vigi:['Doit correspondre à un travail effectif','L’arbitrage avec les dividendes se calcule, il ne s’improvise pas'],
      mots:['rémunération','dirigeant','gérant'], prio:7,
      sugg:function(p){ return estSociete(p) ? 'Le dosage rémunération / dividendes change beaucoup ce qu’il te reste, le cockpit « Optimiser ma société » le calcule' : null; } },
    { id:'alternant', cat:'equipe', e:'🎓', n:'Stagiaire ou alternant', score:85, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'Gratification de stage, salaire d’apprenti',
      verdict:'Déductible, et souvent accompagnée d’aides à l’embauche',
      detail:'Gratifications et rémunérations d’alternants sont des charges classiques. Des aides existent selon le type de contrat : elles se demandent, elles ne tombent pas toutes seules',
      vigi:['Convention de stage ou contrat d’alternance obligatoire','Vérifier les aides auxquelles tu as droit'],
      mots:['stagiaire','alternant','apprenti','stage'], lien:SPUBLIC },

    // ----- Finance -----
    { id:'interets-emprunt', cat:'finance', e:'🏛️', n:'Intérêts d’emprunt pro', score:87, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'Le coût du crédit contracté pour l’activité',
      verdict:'Les intérêts se déduisent, le remboursement du capital non',
      detail:'C’est la confusion la plus fréquente : seule la part d’intérêts de tes échéances est une charge. Le capital remboursé n’en est pas une, il éteint une dette',
      vigi:['Distinguer intérêts (charge) et capital (pas une charge)','Emprunt réellement affecté à l’activité'],
      mots:['emprunt','crédit','intérêt','prêt'] },
    { id:'commissions', cat:'finance', e:'💳', n:'Commissions d’encaissement', score:90, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Stripe, PayPal, terminal de carte bancaire',
      verdict:'Frais directement liés à tes ventes : charge évidente',
      detail:'Les commissions prélevées sur tes encaissements accompagnent chaque vente. Elles se déduisent intégralement',
      vigi:['Récupérer les relevés de commission'],
      mots:['commission','stripe','paypal','sumup','terminal'] },
    { id:'impayes', cat:'finance', e:'📉', n:'Factures impayées', score:64, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'Un client qui ne paiera jamais',
      verdict:'Déductible en créance irrécouvrable, après avoir vraiment tenté de recouvrer',
      detail:'Une facture définitivement perdue peut être passée en perte et réduire ton bénéfice imposable. Encore faut-il prouver que tu as tenté de récupérer la somme : relances, mise en demeure, procédure',
      vigi:['Conserver les preuves de relance et de recouvrement','Le caractère irrécouvrable doit être établi','La TVA déjà déclarée peut parfois être récupérée'],
      mots:['impayé','créance','irrécouvrable'] },

    // ----- Outils & matériel (compléments) -----
    { id:'outillage', cat:'outils', e:'🔧', n:'Petit outillage & consommables', score:88, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'L’outillage du quotidien des métiers manuels',
      verdict:'Charge courante : le lien avec l’activité est immédiat',
      detail:'Perceuse, clés, consommables d’atelier ou de chantier : le petit matériel passe en charge. Au-delà d’un certain montant unitaire, on bascule sur l’amortissement',
      vigi:['Gros montant unitaire : amortissement plutôt que charge'],
      mots:['outillage','outil','perceuse','consommable','chantier'] },
    { id:'epi', cat:'outils', e:'🦺', n:'Équipements de protection', score:93, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Casque, gants, chaussures de sécurité, blouse',
      verdict:'La seule famille de vêtements qui passe sans discussion',
      detail:'Contrairement aux vêtements de ville, les équipements de protection et les tenues imposées par le métier sont déductibles : ils ne sont pas portables dans la vie courante',
      vigi:['Tenue réellement spécifique au métier'],
      mots:['epi','protection','casque','gants','sécurité','blouse'] },
    { id:'stock', cat:'outils', e:'📦', n:'Stock & matières premières', score:94, pcat:'fonctionnement', ptva:'0.2', multi:true,
      pitch:'Ce que tu achètes pour produire ou revendre',
      verdict:'Le cœur du métier dès que tu vends des biens',
      detail:'Marchandises et matières premières entrent dans le résultat via la variation de stock. Leur suivi devient une obligation comptable',
      vigi:['Inventaire de fin d’exercice à tenir','Suivi des entrées et sorties'],
      mots:['stock','marchandise','matière première'] },

    // ----- Local (compléments) -----
    { id:'loyer-local', cat:'local', e:'🏬', n:'Loyer d’un local pro', score:94, pcat:'local', ptva:'0.2', multi:false,
      pitch:'Un local dédié à l’activité, hors domicile',
      verdict:'Loyer professionnel : charge nette, sans ambiguïté',
      detail:'Le loyer d’un local commercial ou professionnel se déduit intégralement, charges locatives comprises',
      vigi:['Bail au nom de l’entreprise','Conserver bail et quittances'],
      mots:['loyer','local','bail','boutique','atelier'] },
    { id:'entretien-local', cat:'local', e:'🧹', n:'Entretien & ménage du local', score:86, pcat:'local', ptva:'0.2', multi:false,
      pitch:'Nettoyage, petites réparations, maintenance',
      verdict:'Charge d’exploitation courante d’un local professionnel',
      detail:'Prestation de ménage, réparations locatives, maintenance des équipements : tout ce qui entretient l’outil de travail est déductible',
      vigi:['Distinguer entretien (charge) et gros travaux (amortissables)'],
      mots:['ménage','entretien','nettoyage','réparation'] },

    // ----- Déplacements (complément) -----
    { id:'entretien-vehicule', cat:'deplacement', e:'🔩', n:'Entretien & assurance du véhicule', score:44, pcat:'vehicule', ptva:'0.2', multi:false,
      pitch:'Révision, pneus, assurance auto',
      verdict:'Piège du doublon : le barème kilométrique les couvre déjà',
      detail:'Si tu utilises le barème kilométrique, il inclut déjà entretien, assurance et dépréciation : les déduire en plus reviendrait à compter deux fois. Ces frais ne se déduisent séparément qu’au régime des frais réels, sur un véhicule inscrit à l’actif',
      vigi:['Ne jamais cumuler avec le barème kilométrique','Choisir un régime et s’y tenir sur l’année'],
      mots:['entretien véhicule','pneus','révision','assurance auto','garage'], lien:IMPOTS },

    // ----- Zone grise (complément) -----
    { id:'amendes', cat:'perso', e:'🚨', n:'Amendes & pénalités', score:5, pcat:'fonctionnement', ptva:'0', multi:false,
      pitch:'PV de stationnement, excès de vitesse, pénalités fiscales',
      verdict:'Jamais déductibles, la loi les exclut explicitement',
      detail:'Les sanctions pécuniaires ne se déduisent pas du résultat, même quand l’infraction survient pendant un déplacement professionnel. Payées par la société, elles sont réintégrées',
      vigi:['Aucune exception : ne pas les passer en charge'],
      mots:['amende','pv','contravention','pénalité'] },

    { id:'sport', cat:'perso', e:'💪', n:'Sport & bien-être', score:10, pcat:'fonctionnement', ptva:'0.2', multi:false,
      pitch:'La salle de sport « pour tenir le rythme »',
      verdict:'Bien-être personnel : aucun lien direct admis avec l’activité',
      detail:'Aussi vrai que le sport aide à travailler mieux, le fisc y voit une dépense d’hygiène de vie personnelle. Exceptions rarissimes liées à des métiers du corps',
      vigi:['Ne passe pas, hors métiers très spécifiques (sportif, cascadeur…)'],
      mots:['sport','salle','fitness','yoga'] },
  ];

  function depGuide(id){
    return DEPENSES_GUIDE.filter(function(d){ return d.id === id; })[0] || null;
  }

  // ---------------------------------------------------------------------------
  // Jauge de facilité - volontairement NON binaire.
  //
  // La couleur suit un dégradé continu : deux dépenses « rouges » n'ont pas la
  // même teinte selon qu'elles sont impossibles ou juste très encadrées. Le
  // rendu reprend le principe des jauges à segments (barres fines) : on lit une
  // position sur une échelle, pas un feu tricolore.
  // ---------------------------------------------------------------------------
  var DEP_PALIERS = [
    { s:0,   c:[200, 30, 30]  },   // rouge profond
    { s:22,  c:[239, 68, 68]  },   // rouge
    { s:38,  c:[249, 115, 22] },   // orange foncé
    { s:52,  c:[245, 158, 11] },   // orange
    { s:66,  c:[234, 179, 8]  },   // jaune
    { s:78,  c:[132, 204, 22] },   // vert-jaune
    { s:90,  c:[34, 197, 94]  },   // vert
    { s:100, c:[22, 163, 74]  },   // vert profond
  ];

  function depCouleur(score){
    var s = Math.min(100, Math.max(0, score));
    for(var i = 1; i < DEP_PALIERS.length; i++){
      var b = DEP_PALIERS[i], a = DEP_PALIERS[i-1];
      if(s <= b.s){
        var t = (s - a.s) / (b.s - a.s || 1);
        var m = a.c.map(function(v, j){ return Math.round(v + t * (b.c[j] - v)); });
        return 'rgb(' + m.join(',') + ')';
      }
    }
    return 'rgb(22,163,74)';
  }

  // Six paliers de lecture au lieu de trois : « très encadré » et « risqué »
  // ne se valent pas, « passe bien » et « évident » non plus.
  function depNiveau(score){
    var l;
    if(score >= 85)      l = 'Évident';
    else if(score >= 70) l = 'Passe bien';
    else if(score >= 55) l = 'Courant, à bien cadrer';
    else if(score >= 40) l = 'Sous conditions strictes';
    else if(score >= 25) l = 'Risqué - cas par cas';
    else                 l = 'Très encadré';
    return { c: depCouleur(score), l: l };
  }

  // Jauge à segments : les traits remplis prennent la couleur du score, les
  // autres restent gris. On lit la position d'un coup d'œil.
  function depJaugeHtml(score, taille){
    var nv = depNiveau(score);
    var n = taille === 'grand' ? 34 : 24;
    var pleins = Math.max(1, Math.round(score / 100 * n));
    var traits = '';
    for(var i = 0; i < n; i++){
      // Les segments remplis s'éclaircissent légèrement vers la gauche :
      // le regard va naturellement vers la pointe de la jauge.
      var op = i < pleins ? (0.45 + 0.55 * (i / Math.max(1, pleins - 1))) : 1;
      traits += '<i style="background:' + (i < pleins ? nv.c : '#dfe3ec')
              + ';opacity:' + (i < pleins ? op.toFixed(2) : 1) + '"></i>';
    }
    return '<div class="dj'+(taille === 'grand' ? ' grand' : '')+'">'
      + '<div class="dj-seg">'+traits+'</div>'
      + '<div class="dj-l" style="color:'+nv.c+'">'+esc(nv.l)+'</div>'
      + '</div>';
  }

  function depEstFavori(id){ return state.depFavoris.indexOf(id) >= 0; }

  // Rapprochement avec les charges déjà saisies dans le profil : on compare les
  // intitulés libres aux mots-clés de chaque fiche.
  function depDansCharges(d){
    var noms = (state.profil.charges || []).map(function(c){ return (c.nom || '').toLowerCase(); });
    return noms.some(function(nom){
      if(!nom) return false;
      return d.mots.some(function(m){ return nom.indexOf(m) >= 0; });
    });
  }

  function depListeFiltree(){
    var q = (state.depRecherche || '').trim().toLowerCase();
    var f = state.depFiltre;
    return DEPENSES_GUIDE.filter(function(d){
      if(f === 'favoris' && !depEstFavori(d.id)) return false;
      if(DEP_CATS[f] && d.cat !== f) return false;
      if(!q) return true;
      return (d.n + ' ' + d.pitch + ' ' + d.mots.join(' ')).toLowerCase().indexOf(q) >= 0;
    }).sort(function(a, b){ return b.score - a.score || a.n.localeCompare(b.n); });
  }

  function depCarteHtml(d){
    var cat = DEP_CATS[d.cat];
    var fav = depEstFavori(d.id);
    var dans = depDansCharges(d);
    return '<div class="dg" style="--c:'+cat.c+';--s:'+cat.s+'" data-action="dep-open" data-id="'+d.id+'">'
      + '<button class="dg-pin'+(fav?' on':'')+'" data-action="dep-fav" data-id="'+d.id+'"'
        + ' title="'+(fav?'Retirer de ma sélection':'Ajouter à ma sélection')+'">'+(fav?'★':'☆')+'</button>'
      + '<div class="dg-cat" style="color:'+cat.c+'">'+esc(cat.l)+'</div>'
      + '<div class="dg-tete"><span class="dg-e">'+d.e+'</span>'
        + '<span class="dg-n">'+esc(d.n)+'</span></div>'
      + '<div class="dg-p">'+esc(d.pitch)+'</div>'
      + (dans ? '<div class="dg-dans">✓ Dans tes charges</div>' : '')
      + depJaugeHtml(d.score)
      + '</div>';
  }

  // Suggestions personnalisées : des dépenses auxquelles ce profil n'a
  // peut-être pas pensé (ni en favoris, ni déjà dans ses charges).
  function depSuggestions(){
    var p = state.profil;
    if(!estSociete(p)) return [];
    return DEPENSES_GUIDE
      .map(function(d){
        var raison = d.sugg ? d.sugg(p) : null;
        return raison ? { d:d, raison:raison, prio:d.prio || 99 } : null;
      })
      .filter(function(x){ return x && !depEstFavori(x.d.id) && !depDansCharges(x.d); })
      .sort(function(a, b){ return a.prio - b.prio; })
      .slice(0, 3);
  }

  // ---------------------------------------------------------------------------
  // Parcours d'accueil du guide (première visite) : on montre ce qu'on a compris
  // du profil, puis on suggère des dépenses à explorer. Même principe que le
  // parcours du simulateur TVA.
  // ---------------------------------------------------------------------------
  function depOnbCorpsHtml(){
    var p = state.profil;
    var e = state.depOnb.etape;

    if(e === 0){
      var ligne = function(l, v){
        return '<div class="tvo-rec"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>';
      };
      var nbCharges = (p.charges || []).length;
      return '<div class="tvo-emoji">🧾</div>'
        + '<div class="tvo-q">Voyons ce que tu peux passer</div>'
        + '<div class="tvo-sub">D’après ton profil, voici ce que j’ai retenu de ton activité. '
          + 'C’est là-dessus que je vais te suggérer des dépenses</div>'
        + '<div class="tvo-recap">'
          + ligne('Activité', p.activite || 'à compléter')
          + ligne('Statut', p.forme || 'à compléter')
          + ligne('Charges déjà listées', nbCharges + (nbCharges > 1 ? ' charges' : ' charge'))
        + '</div>'
        + '<div class="tvo-actions">'
          + '<button class="tvo-next" data-action="dep-onb-next">C’est bon pour moi →</button>'
          + '<button class="tvo-ghost" data-action="dep-onb-profil">Modifier mon profil</button>'
        + '</div>';
    }

    // Étape 1 : suggestions personnalisées
    var sugg = depSuggestions();
    var liste = sugg.length
      ? '<div class="dgo-sugg">' + sugg.map(function(x){
          var cat = DEP_CATS[x.d.cat];
          return '<button class="dgo-sg" style="--c:'+cat.c+'" data-action="dep-onb-open" data-id="'+x.d.id+'">'
            + '<span class="dgo-sg-e">'+x.d.e+'</span>'
            + '<span class="dgo-sg-txt"><span class="dgo-sg-n">'+esc(x.d.n)+'</span>'
            + '<span class="dgo-sg-r">'+esc(x.raison)+'</span></span>'
            + '<span class="dgo-sg-fl">→</span></button>';
        }).join('') + '</div>'
      : '<div class="tvo-vide">Complète ton statut dans ton profil et je te ferai des suggestions '
        + 'sur mesure. En attendant, le guide complet t’attend</div>';

    return '<div class="tvo-emoji">💡</div>'
      + '<div class="tvo-q">Des pistes pour toi</div>'
      + '<div class="tvo-sub">Des dépenses auxquelles ton profil correspond, et auxquelles tu n’as '
        + 'peut-être pas pensé. Clique pour ouvrir la fiche</div>'
      + liste
      + '<div class="tvo-actions">'
        + '<button class="tvo-next" data-action="dep-onb-fin">Explorer le guide complet →</button>'
      + '</div>';
  }

  function majDepOnb(){
    var root = document.getElementById('dgo-root');
    if(!root) return;
    if(!(state.depOnb.actif && state.sim.open === 'depenses')){ root.innerHTML = ''; return; }
    var card = root.querySelector('.tvo-card');
    if(!card){
      root.innerHTML = '<div class="tvo-overlay"><div class="tvo-card"></div></div>';
      card = root.querySelector('.tvo-card');
    }
    card.innerHTML = depOnbCorpsHtml();
  }

  function guideDepHtml(){
    var p = state.profil;
    var nbFav = state.depFavoris.length;

    // Bandeau adapté au statut : en micro, rien ne se déduit - le dire clairement
    // vaut mieux que laisser croire l'inverse.
    var bandeau = '';
    if(estMicro(p)){
      bandeau = '<div class="dg-micro">'
        + '<div class="dg-micro-t">⚠️ En micro-entreprise, tes dépenses ne se déduisent pas</div>'
        + '<div class="dg-micro-s">Ton abattement forfaitaire les remplace : l’administration considère '
          + 'tes frais couverts d’office. Ce guide reste utile pour te projeter : si tes dépenses '
          + 'réelles dépassent cet abattement, la société devient intéressante</div>'
        + '<button class="dg-micro-cta" data-action="sim-open" data-sim="statut">Quand passer en société ? →</button>'
        + '</div>';
    } else if(!estSociete(p)){
      bandeau = '<div class="dg-note">💡 Renseigne ton statut dans ton profil : le guide s’adaptera '
        + 'et te suggérera des dépenses selon ta situation</div>';
    }

    var suggestions = depSuggestions();
    var suggHtml = suggestions.length
      ? '<div class="dg-sugg-titre">Suggestions pour toi'
          + '<span class="dg-sugg-pourquoi">d’après ton profil</span></div>'
        + '<div class="dg-sugg">' + suggestions.map(function(x){
            var cat = DEP_CATS[x.d.cat];
            return '<div class="dg-sg" style="--c:'+cat.c+'" data-action="dep-open" data-id="'+x.d.id+'">'
              + '<span class="dg-sg-e">'+x.d.e+'</span>'
              + '<div><div class="dg-sg-n">'+esc(x.d.n)+'</div>'
              + '<div class="dg-sg-r">'+esc(x.raison)+'</div></div>'
              + '<span class="dg-sg-fl">→</span></div>';
          }).join('') + '</div>'
      : '';

    var pills = [
      { k:'tous',    l:'Tous' },
      { k:'favoris', l:'★ Ma sélection' + (nbFav ? ' ('+nbFav+')' : '') },
    ].concat(Object.keys(DEP_CATS).map(function(k){
      return { k:k, l:DEP_CATS[k].e + ' ' + DEP_CATS[k].l };
    }));

    return '<div class="view">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="dg-intro">'
        + '<div class="dg-intro-txt">'
          + '<div class="dg-intro-t">Qu’est-ce qui peut passer sur ta société&nbsp;?</div>'
          + '<div class="dg-intro-s">Explore les dépenses que les indépendants peuvent passer sur '
            + 'leur société, repère celles qui collent à ton activité et garde ta sélection sous la main</div>'
        + '</div>'
        + '<div class="dg-legende">'
          + '<div class="dg-leg-track"></div>'
          + '<div class="dg-leg-labels"><span>Très encadré</span><span>Sous conditions</span>'
            + '<span>Courant</span><span>Évident</span></div>'
        + '</div>'
      + '</div>'
      + bandeau
      + suggHtml
      + '<div class="lx-bar">'
        + '<div class="lx-search"><span class="lx-search-i">🔎</span>'
          + '<input type="text" data-dep-search placeholder="Chercher une dépense… (hôtel, mutuelle, logiciel…)" '
            + 'value="'+esc(state.depRecherche)+'"></div>'
      + '</div>'
      + '<div class="dg-pills">' + pills.map(function(x){
          return '<button class="dg-pill'+(state.depFiltre===x.k?' on':'')+'" data-action="dep-filtre" '
            + 'data-f="'+x.k+'">'+esc(x.l)+'</button>';
        }).join('') + '</div>'
      + depGrilleHtml()
      + '<div class="dg-fin">'
        + '<p class="dg-disclaimer">Des repères généraux pour une société au réel - <strong>pas un '
          + 'avis fiscal</strong>. Chaque situation a ses nuances : ton activité, ton statut, l’usage '
          + 'réel que tu fais de la dépense. Avant d’engager un montant important, mieux vaut faire '
          + 'valider ton cas précis par un professionnel</p>'
        + simPartenaireHtml(3, 'Un doute sur ce que tu peux vraiment passer ? Icon Invest regarde ta '
            + 'situation en détail et sécurise tes arbitrages, du premier euro à la clôture')
      + '</div>'
      + '</div>';
  }

  function depGrilleHtml(){
    var liste = depListeFiltree();
    if(!liste.length){
      return '<div class="obj-vide" id="dg-grid">'
        + (state.depFiltre === 'favoris' && !state.depRecherche
            ? 'Ta sélection est vide : parcours le guide et clique sur l’étoile des dépenses qui parlent à ton activité'
            : 'Aucune dépense ne correspond à ta recherche')
        + '</div>';
    }
    return '<div class="dg-grid" id="dg-grid">' + liste.map(depCarteHtml).join('') + '</div>';
  }

  // Recherche : on ne remplace que la grille, pour garder le focus dans le champ.
  function majGuideDep(){
    var g = document.getElementById('dg-grid');
    if(!g) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = depGrilleHtml();
    g.replaceWith(tmp.firstChild);
  }

  // --- Ajout aux charges : formulaire intégré à la fiche -------------------
  // Les champs alimentent directement le profil, donc tous les simulateurs.
  // Pour les dépenses « multi » (logiciels, matériel…), on propose d'en
  // enchaîner une autre : personne n'a un seul abonnement.
  function depAjoutHtml(d){
    var a = state.depAjout;
    if(a.fait){
      return '<div class="dga dga-ok">'
        + '<div class="dga-ok-t">✓ Ajouté à tes charges</div>'
        + '<div class="dga-ok-s">'+esc(a.dernier)+' apparaît maintenant dans ton profil et '
          + 'dans tes simulateurs</div>'
        + (d.multi
            ? '<div class="dga-btns">'
              + '<button class="dgf-btn sec" data-action="dep-ajout-encore" data-id="'+d.id+'">'
                + '＋ En ajouter un autre</button>'
              + '<button class="dgf-btn" data-action="dep-ajout-fin">Terminé</button>'
              + '</div>'
            : '<div class="dga-btns"><button class="dgf-btn" data-action="dep-ajout-fin">Terminé</button></div>')
        + '</div>';
    }
    var seg = function(champ, options){
      return '<div class="dga-seg">' + options.map(function(o){
        return '<button class="dga-seg-b'+(String(a[champ]) === String(o.v) ? ' on' : '')+'" '
          + 'data-action="dep-ajout-set" data-champ="'+champ+'" data-v="'+esc(o.v)+'">'+esc(o.l)+'</button>';
      }).join('') + '</div>';
    };
    return '<div class="dga">'
      + '<div class="dga-t">Ajouter à mes charges</div>'
      + '<label class="dga-l">Nom de la charge</label>'
      + '<input class="dga-in" data-dga="nom" value="'+esc(a.nom)+'" placeholder="'
        + esc(d.multi ? 'Ex : ' + (d.mots[0] || d.n) : d.n)+'">'
      + (d.multi ? '<div class="dga-aide">Tu en as peut-être plusieurs : donne un nom précis, '
                 + 'tu pourras en ajouter d’autres juste après</div>' : '')
      + '<label class="dga-l">C’est une dépense…</label>'
      + seg('frequence', [{v:'mensuelle',l:'Par mois'},{v:'annuelle',l:'Par an'}])
      + '<label class="dga-l">Montant TTC</label>'
      + '<div class="dga-m"><input data-dga="montant" type="number" min="0" step="any" value="'
        + esc(a.montant)+'" placeholder="0"><span>€</span></div>'
      + (a.erreur ? '<div class="dga-err">'+esc(a.erreur)+'</div>' : '')
      + '<div class="dga-btns">'
        + '<button class="dgf-btn sec" data-action="dep-ajout-annule">Annuler</button>'
        + '<button class="dgf-btn" data-action="dep-ajout-valide" data-id="'+d.id+'">Ajouter</button>'
      + '</div>'
      + '</div>';
  }

  // Fiche détaillée d'une dépense (pop-up).
  function depFicheHtml(){
    if(!state.depOuvert) return '';
    var d = depGuide(state.depOuvert);
    if(!d) return '';
    var cat = DEP_CATS[d.cat];
    var nv = depNiveau(d.score);
    var fav = depEstFavori(d.id);
    var dans = depDansCharges(d);

    var vigi = d.vigi.map(function(v){
      return '<li><span class="dgf-tiret" style="background:'+cat.c+'"></span><span>'+esc(v)+'</span></li>';
    }).join('');

    var lien = d.lien
      ? '<a class="dgf-lien" href="'+esc(d.lien.url)+'" target="_blank" rel="noopener">'
        + 'ℹ️ En savoir plus : '+esc(d.lien.l)+' ↗</a>'
      : '';

    // Quand le formulaire d'ajout est ouvert, il remplace le pied de fiche.
    var ajoutOuvert = state.depAjout && state.depAjout.id === d.id;
    var pied = ajoutOuvert
      ? ''
      : '<div class="modal-foot dgf-foot">'
        // Une dépense « multi » (logiciels, matériel…) reste ajoutable même si
        // tu en as déjà une : personne n'a un seul abonnement.
        + (dans && !d.multi
            ? '<span class="dgf-dans">✓ Déjà dans tes charges</span>'
            : '<button class="dgf-btn" data-action="dep-ajout-ouvrir" data-id="'+d.id+'">'
              + (dans ? '＋ En ajouter un autre' : '＋ Ajouter à mes charges')+'</button>')
        + '</div>';

    return '<div class="overlay" data-action="dep-close">'
      + '<div class="modal dgf" style="width:560px;--c:'+cat.c+';--s:'+cat.s+'" data-action="stop">'
        + '<div class="dgf-head">'
          + '<span class="dgf-e">'+d.e+'</span>'
          + '<div class="dgf-id"><div class="dgf-cat">'+esc(cat.l)+'</div>'
            + '<div class="dgf-n">'+esc(d.n)+'</div></div>'
          + '<button class="dgf-fav'+(fav?' on':'')+'" data-action="dep-fav" data-id="'+d.id+'"'
            + ' title="'+(fav?'Retirer de ma sélection':'Ajouter à ma sélection')+'">'+(fav?'★':'☆')+'</button>'
        + '</div>'
        + '<div class="modal-body dgf-body">'
          + '<div class="dgf-jauge">' + depJaugeHtml(d.score, 'grand') + '</div>'
          + '<div class="dgf-verdict" style="color:'+nv.c+'">'+esc(d.verdict)+'</div>'
          + '<p class="dgf-detail">'+esc(d.detail)+'</p>'
          + '<div class="dgf-label">Les points de vigilance</div>'
          + '<ul class="dgf-vigi">'+vigi+'</ul>'
          + lien
          + (ajoutOuvert ? depAjoutHtml(d) : '')
        + '</div>'
        + pied
      + '</div></div>';
  }

  // Liste des simulateurs disponibles sur la plateforme.
  function simListHtml(){
    var chip = function(color, label){
      return '<span class="chip"><span class="dot" style="background:'+color+'"></span>'+esc(label)+'</span>';
    };
    return '<div class="sim-wrap"><div class="sim-list">'
      + '<div class="sim-hero cote" data-action="sim-open" data-sim="cote"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🏦</div>'
        + '<div class="sim-hero-title">Combien mettre de côté&nbsp;ce&nbsp;mois&nbsp;?</div>'
        + '<div class="sim-hero-sub">Tu encaisses une somme, on te dit ce qui n’est pas à toi : '
          + 'cotisations, impôt, TVA. Ce qui reste, tu peux le dépenser tranquille.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#bae6fd', 'Sur ton régime')
          + chip('#7dd3fc', 'Détail poste par poste')
          + chip('#38bdf8', 'En 5 secondes')
        + '</div>'
        + '<div class="sim-hero-cta">Calculer ma part →</div>'
      + '</div></div>'
      + '<div class="sim-hero categorie'+(simulateurNeuf() ? ' inedit' : '')+'"'
        + ' data-action="sim-open" data-sim="categorie">'
        + (simulateurNeuf() ? '<span class="sim-neuf">🔔 Nouveau</span>' : '')
        + '<div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🧭</div>'
        + '<div class="sim-hero-title">BIC ou BNC&nbsp;?</div>'
        + '<div class="sim-hero-sub">La case dans laquelle l’administration range tes revenus. '
          + 'Décris ce que tu fais vraiment, on t’oriente et on t’explique pourquoi.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#fbcfe8', 'D’après ton activité')
          + chip('#f9a8d4', 'Avec le raisonnement')
          + chip('#f472b6', 'Cas limites signalés')
        + '</div>'
        + '<div class="sim-hero-cta">M’orienter →</div>'
      + '</div></div>'
      + '<div class="sim-hero" data-action="sim-open" data-sim="depenses"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🧾</div>'
        + '<div class="sim-hero-title">Qu’est-ce qui peut passer sur&nbsp;ta&nbsp;société&nbsp;?</div>'
        + '<div class="sim-hero-sub">Un guide visuel de dizaines de dépenses pro, classées de '
          + 'l’évidente à la risquée. Compose ta sélection, reçois des suggestions selon ton '
          + 'profil - et analyse tes cas précis avec l’IA.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#22c55e', 'Passe très bien')
          + chip('#f59e0b', 'Courant, mais encadré')
          + chip('#ef4444', 'Cas par cas')
        + '</div>'
        + '<div class="sim-hero-cta">Explorer le guide →</div>'
      + '</div></div>'
      + '<div class="sim-hero alt" data-action="sim-open" data-sim="vl"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">⚖️</div>'
        + '<div class="sim-hero-title">Versement libératoire ou impôt&nbsp;classique&nbsp;?</div>'
        + '<div class="sim-hero-sub">Compare les deux modes d’imposition de ta micro-entreprise et vois '
          + 'lequel te coûte le moins cher, chiffres à l’appui.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#a7f3d0', 'Calcul exact')
          + chip('#6ee7b7', 'Barème progressif')
          + chip('#34d399', 'Éligibilité')
        + '</div>'
        + '<div class="sim-hero-cta">Comparer les options →</div>'
      + '</div></div>'
      + '<div class="sim-hero tva" data-action="sim-open" data-sim="tva"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🧮</div>'
        + '<div class="sim-hero-title">Est-ce intéressant de passer à&nbsp;la&nbsp;TVA&nbsp;?</div>'
        + '<div class="sim-hero-sub">Estime ce que tu récupérerais sur tes achats, ce que tu absorberais '
          + 'sur tes prix, et si l’option volontaire vaut le coup.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#ddd6fe', 'TVA récupérable')
          + chip('#c4b5fd', 'Impact sur tes prix')
          + chip('#a78bfa', '3 scénarios')
        + '</div>'
        + '<div class="sim-hero-cta">Simuler le passage →</div>'
      + '</div></div>'
      + '<div class="sim-hero societe" data-action="sim-open" data-sim="statut"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🏛️</div>'
        + '<div class="sim-hero-title">Quand passer en&nbsp;société&nbsp;?</div>'
        + '<div class="sim-hero-sub">Compare ton auto-entreprise à une EURL et une SASU, et vois à partir '
          + 'de quel chiffre d’affaires créer une société te rapporte vraiment plus.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#fed7aa', 'Temps réel')
          + chip('#fdba74', 'Point de bascule')
          + chip('#fb923c', 'Projection')
        + '</div>'
        + '<div class="sim-hero-cta">Projeter mon activité →</div>'
      + '</div></div>'
      + '<div class="sim-hero optim" data-action="sim-open" data-sim="optim"><div class="sim-hero-inner">'
        + '<div class="sim-hero-emoji">🎛️</div>'
        + '<div class="sim-hero-title">Optimiser ma&nbsp;société</div>'
        + '<div class="sim-hero-sub">Ton cockpit de pilotage : teste ta rémunération, tes dividendes, ta '
          + 'trésorerie et tes leviers, et vois l’effet en direct sur ce qu’il te reste.</div>'
        + '<div class="sim-hero-chips">'
          + chip('#a5f3fc', 'Temps réel')
          + chip('#67e8f9', 'Import automatique')
          + chip('#22d3ee', 'Scénarios')
        + '</div>'
        + '<div class="sim-hero-cta">Piloter ma société →</div>'
      + '</div></div>'
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // « Combien mettre de côté ce mois-ci ? »
  // ---------------------------------------------------------------------------
  // Le principe : sur une somme encaissée, une part n'a jamais été à toi. On la
  // nomme poste par poste plutôt que de sortir un pourcentage magique.
  function coteCalcul(encaisse){
    var p = state.profil;
    var ca = parseFloat(encaisse) || 0;
    if(ca <= 0) return null;

    var micro = estMicro(p);
    var cat = p.categorieFiscale === 'inconnu' ? 'bnc' : (p.categorieFiscale || 'bnc');
    var postes = [];

    // La TVA se retire EN PREMIER : cotisations et impôt se calculent sur le
    // chiffre d'affaires hors taxes, jamais sur l'encaissement TTC.
    var assujetti = estAssujettiTVA(p);
    var taux = parseFloat(p.tauxVente) || 0.2;
    var tva = assujetti ? ca - (ca / (1 + taux)) : 0;
    var ht = ca - tva;

    if(assujetti){
      postes.push({ l:'TVA collectée', v:tva, c:'#7c3aed',
        d:'Elle ne t’a jamais appartenu : tu l’encaisses pour l’État et tu la '
          + 'reverses. Tout le reste se calcule sur le montant hors taxes.' });
    }

    if(micro){
      var tauxCot = STATUT_PARAMS.micro.cotisations[cat] || STATUT_PARAMS.micro.cotisations.bnc;
      postes.push({ l:'Cotisations sociales', v:ht * tauxCot, c:'#2563eb',
        d:'URSSAF, sur ton chiffre d’affaires hors taxes ('
          + (tauxCot * 100).toFixed(1).replace('.', ',') + ' %)' });

      if(p.versementLiberatoire === 'oui'){
        var tvl = STATUT_PARAMS.micro.vlTaux[cat] || STATUT_PARAMS.micro.vlTaux.bnc;
        postes.push({ l:'Impôt sur le revenu', v:ht * tvl, c:'#b45309',
          d:'Versement libératoire ('+(tvl * 100).toFixed(1).replace('.', ',')
            + ' %), prélevé en même temps que tes cotisations' });
      } else {
        // Sans versement libératoire, l'impôt dépend du foyer : on prend le taux
        // moyen réel calculé par le simulateur plutôt qu'un forfait inventé.
        var net = netEstime(ht * 12);
        var tauxIr = net && net.res && net.ca
          ? Math.max(0, Math.min(0.45, (net.res.ir || 0) / net.ca)) : 0;
        if(tauxIr > 0){
          postes.push({ l:'Impôt sur le revenu', v:ht * tauxIr, c:'#b45309',
            d:'Estimé d’après ton foyer ('+(tauxIr * 100).toFixed(1).replace('.', ',')
              + ' %). Il est prélevé à la source, mais autant l’avoir de côté.' });
        }
      }
    } else {
      postes.push({ l:'Charges et impôts de la société', v:ht * 0.45, c:'#2563eb',
        d:'Ordre de grandeur : cotisations sur ta rémunération et impôt sur les '
          + 'sociétés. Le simulateur « Optimiser ma société » calcule ton cas précis.' });
    }

    var aGarder = postes.reduce(function(a, x){ return a + x.v; }, 0);
    return { ca:ca, postes:postes, aGarder:aGarder, dispo:ca - aGarder,
             pct:Math.round(aGarder / ca * 100), micro:micro };
  }

  // Recalcule le résultat sans toucher au champ de saisie : la frappe n'est
  // jamais interrompue.
  function majCote(){
    var zone = document.querySelector('[data-cote-res]');
    if(zone) zone.innerHTML = coteResultatHtml();
    [].forEach.call(document.querySelectorAll('[data-action="cote-montant"]'), function(b){
      b.classList.toggle('on', String(state.sim.coteMontant) === b.getAttribute('data-v'));
    });
  }

  function coteResultatHtml(){
    var r = coteCalcul(state.sim.coteMontant);
    var resultat = '';
    if(r){
      var barres = r.postes.map(function(x){
        var part = Math.round(x.v / r.ca * 100);
        return '<div class="cote-p" style="--c:'+x.c+'">'
          + '<div class="cote-p-h"><span class="cote-p-l">'+esc(x.l)+'</span>'
            + '<span class="cote-p-v">'+fmtEur(x.v)+'</span></div>'
          + '<div class="cote-p-b"><i style="width:'+Math.min(100, part)+'%"></i></div>'
          + '<div class="cote-p-d">'+esc(x.d)+'</div>'
        + '</div>';
      }).join('');

      resultat = '<div class="cote-res">'
        + '<div class="cote-grand">'
          + '<div class="cote-g-k">À mettre de côté</div>'
          + '<div class="cote-g-v">'+fmtEur(r.aGarder)+'</div>'
          + '<div class="cote-g-s">soit '+r.pct+' % de ce que tu viens d’encaisser</div>'
        + '</div>'
        + '<div class="cote-reste">'
          + '<div class="cote-r-k">Vraiment à toi</div>'
          + '<div class="cote-r-v">'+fmtEur(r.dispo)+'</div>'
        + '</div>'
      + '</div>'
      + '<div class="cote-postes">'+barres+'</div>'
      + '<div class="cote-note">Ce calcul part de ton profil (régime, catégorie, TVA). '
        + 'Il donne un ordre de grandeur fiable pour provisionner, pas un montant à '
        + 'déclarer : les dates et montants exacts restent ceux de tes espaces officiels.</div>';
    } else {
      resultat = '<div class="cote-vide">'
        + '<img src="assets/illus/obj-piloter.svg" alt="" class="illu-img">'
        + '<div class="obj-vide-t">Entre ce que tu viens d’encaisser</div>'
        + '<div class="obj-vide-d">On te dit tout de suite quelle part n’est pas à toi.</div>'
      + '</div>';
    }
    return resultat;
  }

  function coteHtml(){
    var v = state.sim.coteMontant;
    var raccourcis = [500, 1000, 2500, 5000].map(function(m){
      return '<button class="cote-rac'+(String(v) === String(m) ? ' on' : '')
        + '" data-action="cote-montant" data-v="'+m+'">'+fmtEur(m)+'</button>';
    }).join('');

    // Même ossature que les autres simulateurs : bouton « retour », barre de
    // titre `res-topbar`, puis le contenu.
    return '<div class="view"><div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="res-topbar">'
        + '<h2>Combien mettre de côté ce mois-ci ?</h2>'
      + '</div>'
      + '<div class="cote-tete">'
        + '<div class="cote-s">Sur un encaissement, une partie ne t’appartient pas. '
          + 'Provisionne-la, et dépense le reste sans arrière-pensée.</div>'
      + '</div>'
      + '<div class="cote-saisie">'
        + '<label>J’ai encaissé</label>'
        + '<div class="cote-champ"><input type="number" min="0" step="any" data-cote-input '
          + 'value="'+esc(v || '')+'" placeholder="2 500" autofocus><span>€</span></div>'
        + '<div class="cote-racs">'+raccourcis+'</div>'
      + '</div>'
      + '<div data-cote-res>'+coteResultatHtml()+'</div>'
    + '</div></div>';
  }

  // ---------- Étape 2 : les dépenses ----------
  function depCardHtml(d, i){
    var rempli = !!(d.nom && d.nom.trim());
    var multi = state.sim.depenses.length > 1;
    return '<div class="dep-card">'
      + '<div class="dep-head">'
        + '<div class="dep-num">'+(i+1)+'</div>'
        + '<div class="dep-title'+(rempli?'':' empty')+'">'+esc(rempli ? d.nom : 'Nouvelle dépense')+'</div>'
        + '<div class="dep-actions">'
          + (multi ? '<button class="icon-btn danger" data-action="dep-remove" data-i="'+i+'" title="Supprimer">✕</button>' : '')
        + '</div>'
      + '</div>'
      + '<div class="field-row">'
        + field('nom','Nom de la dépense', d.nom, {req:true, dep:i, ph:'Ex : téléphone, restaurant…'})
        + field('montant','Montant TTC', d.montant, {req:true, dep:i, type:'number', ph:'1100 €'})
      + '</div>'
      + field('motif','Pourquoi cette dépense serait-elle utile à ton activité ?', d.motif,
              {textarea:true, dep:i, ph:'Ex : échanger avec mes clients et tester les applis utilisées dans mes projets…'})
      + '</div>';
  }

  function simFormHtml(){
    var err = state.sim.formError ? '<div class="form-error">'+esc(state.sim.formError)+'</div>' : '';
    var n = state.sim.depenses.length;
    var h = state.historique;
    var hist = h.length
      ? '<div class="hist-h" style="margin-top:34px"><div class="hist-title">Mes simulations précédentes</div></div>'
        + '<div class="hist-list">' + h.map(histItemHtml).join('') + '</div>'
      : '';

    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      // Bandeau haut : rappel du profil + action principale à droite
      + '<div class="sim-bar">'
        + profilBandeHtml(['activite','forme','regime','tva'])
        + '<div class="sim-bar-actions">'
          + '<button class="btn-primary" data-action="sim-analyze">Analyser les dépenses</button>'
          + '<div style="font-size:12.5px;color:var(--muted);font-weight:600;text-align:center">'
            + n + ' dépense' + (n>1?'s':'') + '</div>'
        + '</div>'
      + '</div>'
      + err
      + '<div class="dep-grid">'
        + state.sim.depenses.map(depCardHtml).join('')
        // Le bouton « ajouter » est la cellule suivante de la grille.
        + '<button class="dep-add" data-action="dep-add">'
          + '<div class="dep-add-plus">+</div>Ajouter une dépense</button>'
      + '</div>'
      + '<div class="final-note" style="border:none;padding-top:0">'
        + 'Ne renseigne pas de donnée personnelle ou confidentielle qui n’est pas nécessaire à l’analyse.</div>'
      + hist
      + '</div>';
  }

  // Pop-up légère : la page des dépenses reste visible derrière.
  function loadingModalHtml(){
    if(!state.sim.analyzing) return '';
    return '<div class="overlay">'
      + '<div class="load-modal"><div class="spinner"></div>'
      + '<div class="load-text">Analyse en cours…</div></div>'
      + '</div>';
  }

  function listBlock(title, items){
    if(!items || !items.length) return '';
    return '<div class="res-block"><div class="res-block-title">'+esc(title)+'</div>'
      + '<ul class="res-list">'
      + items.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')
      + '</ul></div>';
  }

  // ---------- Étape 3 : compte-rendu ----------
  function statutOf(item){ return STATUT[item && item.statut] ? item.statut : 'gris'; }

  function synthesisHtml(items, syn){
    var deps = state.sim.depenses;
    var counts = { vert:0, orange:0, rouge:0, gris:0 };
    var total = 0, montantVert = 0, montantReserve = 0;
    items.forEach(function(it, i){
      var s = statutOf(it);
      counts[s]++;
      var m = parseFloat((deps[i] && deps[i].montant) || 0) || 0;
      total += m;
      if(s === 'vert') montantVert += m;
      else if(s === 'orange' || s === 'rouge') montantReserve += m;
    });

    var stat = function(n, label, cls){
      return '<div class="stat '+cls+'"><div class="stat-n">'+n+'</div>'
        + '<div class="stat-k">'+esc(label)+'</div></div>';
    };
    var amount = function(label, value, color){
      return '<div><span class="amount-k">'+esc(label)+'</span>'
        + '<span class="amount-v" style="color:'+color+'">'+value+'</span></div>';
    };

    var statsCard = '<div class="card">'
      + '<div class="card-title">Résultats</div>'
      + '<div class="syn-stats">'
        + stat(counts.vert,   'A priori justifiables',      'v')
        + stat(counts.orange, 'Sous conditions',            'o')
        + stat(counts.rouge,  'Difficilement justifiables', 'r')
        + stat(counts.gris,   'À préciser',                 'g')
      + '</div>'
      + '<div class="amount-row" style="border-top:1px solid var(--border);padding-top:16px">'
        + amount('Montant total analysé', fmtEur(total), 'var(--ink)')
        + amount('Dont « a priori justifiable »', fmtEur(montantVert), STATUT.vert.color)
        + amount('Dont avec réserves', fmtEur(montantReserve), STATUT.orange.color)
      + '</div></div>';

    var piecesCard = '<div class="card tinted">'
      + '<div class="card-title">Pièces à réunir en priorité</div>'
      + (syn.pieces_manquantes && syn.pieces_manquantes.length
          ? '<ul class="res-list">'
            + syn.pieces_manquantes.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')
            + '</ul>'
          : '<div class="res-line">Rien de particulier à réunir d’après les informations fournies.</div>')
      + '</div>';

    return '<div class="syn-grid">' + statsCard + piecesCard + '</div>';
  }

  // Pop-up d'avertissement, affichée juste avant de lancer l'analyse.
  function consentModalHtml(){
    if(!state.sim.consentOpen) return '';
    var on = state.sim.consent;
    return '<div class="overlay" data-action="consent-close">'
      + '<div class="modal" style="width:580px" data-action="stop">'
        + '<div class="modal-head">'
          + '<div class="modal-title">Avant de lancer l’analyse</div>'
          + '<div class="modal-sub">Un point important à garder en tête.</div>'
        + '</div>'
        + '<div class="modal-body">'
          + '<div style="font-size:14.5px;line-height:1.6;color:#3f4b60">'
            + 'Ce simulateur fournit une analyse <strong>automatisée et indicative</strong>, à partir des '
            + 'informations que tu déclares. Il ne constitue ni une consultation juridique, ni un conseil '
            + 'fiscal, ni une validation comptable, ni une prise de position de l’administration fiscale.'
            + '<br><br>'
            + 'Un résultat favorable ne garantit pas que la dépense sera acceptée en cas de contrôle. '
            + 'Pour une dépense importante, inhabituelle ou à usage mixte, consulte ton expert-comptable.'
          + '</div>'
          + '<div class="sim-consent'+(on?' on':'')+'" style="margin:20px 0 6px" data-action="sim-consent">'
            + '<div class="sim-check">'+(on?'✓':'')+'</div>'
            + '<div class="sim-consent-text">J’ai compris que le résultat ne constitue pas un conseil '
              + 'juridique, fiscal ou comptable personnalisé.</div>'
          + '</div>'
        + '</div>'
        + '<div class="modal-foot">'
          + '<button class="btn-cancel" data-action="consent-close">Annuler</button>'
          + '<button class="btn-confirm'+(on?' active':'')+'" data-action="consent-confirm">Lancer l’analyse</button>'
        + '</div>'
      + '</div></div>';
  }

  function recapHtml(items){
    var deps = state.sim.depenses;
    var rows = items.map(function(it, i){
      var st = STATUT[statutOf(it)];
      var d = deps[i] || {};
      var risque = (it.vigilance && it.vigilance[0]) || '-';
      return '<tr>'
        + '<td><strong>'+esc(d.nom || '-')+'</strong></td>'
        + '<td style="white-space:nowrap">'+(d.montant ? fmtEur(d.montant) : '-')+'</td>'
        + '<td><span class="pill" style="background:'+st.soft+';color:'+st.color+'">'+st.icon+' '
          + esc(it.libelle || st.label)+'</span></td>'
        + '<td>'+esc(risque)+'</td>'
        + '<td>'+esc(it.action || '-')+'</td>'
        + '</tr>';
    }).join('');
    return '<div class="recap"><div class="recap-h">Récapitulatif</div><div class="recap-scroll">'
      + '<table class="recap-t"><thead><tr>'
        + '<th>Dépense</th><th>Montant</th><th>Résultat</th><th>Risque principal</th><th>Action recommandée</th>'
      + '</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }

  function resultItemHtml(it, i){
    var st = STATUT[statutOf(it)];
    var d = state.sim.depenses[i] || {};
    var open = state.sim.openResult === i;

    var body = '';
    if(it.reponse) body += '<div class="res-answer" style="margin-bottom:20px">'+esc(it.reponse)+'</div>';
    body += listBlock('Conditions à respecter', it.conditions);
    body += listBlock('Points de vigilance', it.vigilance);
    body += listBlock('Justificatifs à conserver', it.justificatifs);
    if(it.comptable) body += '<div class="res-block"><div class="res-block-title">Traitement comptable indicatif</div>'
      + '<div class="res-line">'+esc(it.comptable)+'</div></div>';
    if(it.tva) body += '<div class="res-tva"><div class="res-block-title">Récupération de TVA</div>'
      + '<div class="res-line">'+esc(it.tva)+'</div></div>';
    if(it.action) body += '<div class="res-action"><span class="res-action-ico">→</span>'
      + '<span class="res-action-text">'+esc(it.action)+'</span></div>';
    body += listBlock('Pour affiner l’analyse', it.questions);

    return '<div class="res-item'+(open?' open':'')+'">'
      + '<div class="res-item-head" data-action="res-toggle" data-i="'+i+'">'
        + '<div class="res-mini" style="background:'+st.bg+'">'+st.icon+'</div>'
        + '<div class="res-item-main">'
          + '<div class="res-item-name">'+esc(d.nom || 'Dépense')+'</div>'
          + '<div class="res-item-meta">'+(d.montant ? fmtEur(d.montant)+' · ' : '')
            + 'Confiance : '+esc(it.confiance || '-')+'</div>'
        + '</div>'
        + '<div class="res-item-status" style="color:'+st.color+'">'+esc(it.libelle || st.label)+'</div>'
        + '<span class="res-item-chev">▶</span>'
      + '</div>'
      + '<div class="res-item-wrap"><div class="res-item-inner">'
        + '<div class="res-item-body">'+body+'</div>'
      + '</div></div>'
      + '</div>';
  }

  // Synchronisation inverse : les verdicts de l'IA redescendent dans les charges
  // du profil, donc dans les simulateurs TVA / société / optimisation.
  var DEDUCT_PAR_STATUT = { vert:'100', orange:'50', rouge:'0', gris:'50' };

  function syncProfilHtml(items){
    if(!items.length) return '';
    if(state.sim.syncFait){
      return '<div class="sync-bar done">✓ '+esc(state.sim.syncFait)+'</div>';
    }
    return '<div class="sync-bar">'
      + '<span class="sync-ico">🔄</span>'
      + '<div class="sync-t"><strong>Reprendre ces verdicts dans ton profil ?</strong>'
        + '<span>La déductibilité analysée ici sera appliquée à tes charges - '
        + 'les simulateurs TVA, société et optimisation en tiendront compte.</span></div>'
      + '<button class="btn-primary" data-action="sim-sync">Mettre à jour mon profil</button>'
      + '</div>';
  }

  function appliquerVerdictsAuProfil(){
    var items = (state.sim.result && state.sim.result.depenses) || [];
    var saisies = state.sim.depenses || [];
    var charges = state.profil.charges || (state.profil.charges = []);
    var maj = 0, ajouts = 0;

    items.forEach(function(it, i){
      var d = saisies[i];
      if(!d || !d.nom) return;
      var ded = DEDUCT_PAR_STATUT[statutOf(it)] || '50';
      var nom = d.nom.trim().toLowerCase();
      var existante = charges.filter(function(c){
        return (c.nom || '').trim().toLowerCase() === nom; })[0];
      if(existante){
        existante.deductible = ded;
        existante.source = 'Analyse de dépenses - ' + STATUT[statutOf(it)].label;
        maj++;
      } else {
        charges.push({ nom:d.nom, montant:d.montant, frequence:'annuelle',
          tauxTVA:'0.2', deductible:ded, categorie:'fonctionnement',
          source:'Analyse de dépenses - ' + STATUT[statutOf(it)].label });
        ajouts++;
      }
    });

    saveProfil(state.profil);
    appliquerProfil();
    var bouts = [];
    if(maj) bouts.push(maj + ' charge' + (maj>1?'s':'') + ' mise' + (maj>1?'s':'') + ' à jour');
    if(ajouts) bouts.push(ajouts + ' ajoutée' + (ajouts>1?'s':''));
    state.sim.syncFait = bouts.length ? ('Profil à jour - ' + bouts.join(', ') + '.')
                                      : 'Rien à reprendre.';
  }

  function simResultHtml(){
    var r = state.sim.result || {};
    var items = r.depenses || [];
    var syn = r.synthese || {};
    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="res-topbar">'
        + '<h2>Compte-rendu de l’analyse</h2>'
        + '<div class="export-bar">'
          + '<button class="btn-ghost" data-action="sim-print">Imprimer / PDF</button>'
          + '<button class="btn-ghost" data-action="sim-copy">Copier le compte-rendu</button>'
          + '<button class="btn-ghost" data-action="sim-back">Modifier mes dépenses</button>'
          + '<button class="btn-primary" data-action="sim-new">Nouvelle analyse</button>'
        + '</div>'
      + '</div>'
      + syncProfilHtml(items)
      + synthesisHtml(items, syn)
      + (items.length > 1 ? recapHtml(items) : '')
      + '<div class="card-title" style="margin:24px 0 12px">Détail par dépense</div>'
      + items.map(resultItemHtml).join('')
      + simPartenaireHtml(3, 'Une dépense sensible, un doute sur un justificatif ? Icon Invest '
          + 'te répond clairement, sans te facturer le moindre rendez-vous à l’aveugle.')
      + '<div class="final-note">Analyse indicative, sans valeur de validation fiscale ou comptable. '
        + '« A priori justifiable » ne signifie pas « garanti déductible ». La décision finale dépend de ta '
        + 'situation réelle et des justificatifs disponibles - fais confirmer les dépenses sensibles par ton '
        + 'expert-comptable.</div>'
      + '</div>';
  }

  function simErrorHtml(){
    return '<div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="sim-error">'+esc(state.sim.error || 'Une erreur est survenue.')+'</div>'
      + '<div class="sim-actions">'
        + '<button class="btn-primary" data-action="sim-back">Revenir à mes dépenses</button>'
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // BIC ou BNC — orientation d'après l'activité réellement décrite
  // ---------------------------------------------------------------------------
  // Le profil porte déjà l'activité et sa description : l'écran les reprend et
  // les laisse modifiables, parce que c'est la précision de la description qui
  // fait la qualité de la réponse.
  var CAT_LIB = {
    BIC:   { t:'Plutôt BIC', s:'Bénéfices industriels et commerciaux', c:'#b45309' },
    BNC:   { t:'Plutôt BNC', s:'Bénéfices non commerciaux',            c:'#0f766e' },
    MIXTE: { t:'Les deux',   s:'Ton activité relève des deux',         c:'#7c3aed' },
  };
  var CAT_CONF = { haute:'Cas assez net', moyenne:'À confirmer', faible:'Cas limite' };

  function categorieHtml(){
    var c = state.categorie;
    var p = state.profil;
    var act = c.activite !== null ? c.activite : (p.activite || '');
    var des = c.description !== null ? c.description : (p.description || '');

    var corps;
    if(c.resultat){
      var r = c.resultat;
      var d = CAT_LIB[r.categorie] || CAT_LIB.MIXTE;
      corps = '<div class="cat-res" style="--c:'+d.c+'">'
        + '<div class="cat-res-h">'
          + '<div><div class="cat-res-t">'+esc(d.t)+'</div>'
          + '<div class="cat-res-s">'+esc(d.s)+'</div></div>'
          + '<span class="cat-conf '+esc(r.confiance)+'">'
            + esc(CAT_CONF[r.confiance] || '')+'</span>'
        + '</div>'
        + (r.resume ? '<div class="cat-res-r">'+esc(r.resume)+'</div>' : '')
        + (r.pourquoi.length
            ? '<div class="cat-bloc"><div class="cat-bloc-t">Pourquoi</div><ul>'
              + r.pourquoi.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')
              + '</ul></div>' : '')
        + (r.attention.length
            ? '<div class="cat-bloc warn"><div class="cat-bloc-t">Ce qui pourrait changer la réponse</div><ul>'
              + r.attention.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')
              + '</ul></div>' : '')
        + (r.question ? '<div class="cat-question">🤔 '+esc(r.question)+'</div>' : '')
        + '<button class="cat-refaire" data-action="cat-refaire">Recommencer</button>'
      + '</div>';
    } else {
      corps = '<form class="cat-form" data-cat-form>'
        + '<label class="cat-l">Ton activité</label>'
        + '<input data-cat-activite value="'+esc(act)+'" maxlength="200"'
          + ' placeholder="Développeur web, coiffeuse, photographe…">'
        + '<label class="cat-l">Ce que tu fais concrètement</label>'
        + '<textarea data-cat-description rows="5" maxlength="1500"'
          + ' placeholder="Le plus précis possible : ce que tu vends, à qui, et comment. '
          + 'C’est ce qui fait la différence entre les deux catégories.">'+esc(des)+'</textarea>'
        + '<div class="cat-aide">Vends-tu des biens que tu achètes&nbsp;? Du temps et de '
          + 'l’expertise&nbsp;? Les deux&nbsp;? Dis-le ici.</div>'
        + (c.erreur ? '<div class="bulle-erreur">'+esc(c.erreur)+'</div>' : '')
        + '<button type="submit" class="cat-go"'+(c.enCours ? ' disabled' : '')+'>'
          + (c.enCours
              ? '<span class="cat-spin" aria-hidden="true"></span>On regarde ton activité…'
              : 'M’orienter')
        + '</button>'
      + '</form>';
    }

    // Même ossature que « Combien mettre de côté » : sim-wrap, bouton retour,
    // res-topbar. C'est ce qui donne aux simulateurs leur air de famille.
    return '<div class="view"><div class="sim-wrap">'
      + '<button class="retour" data-action="sim-liste">← Tous les simulateurs</button>'
      + '<div class="res-topbar cat-topbar"><h2>BIC ou BNC&nbsp;?</h2></div>'
      + '<div class="cote-tete cat-tete">'
        + '<div class="cote-s">Cette catégorie décide de ta case de déclaration et de ton '
          + 'abattement. Elle dépend de ce que tu fais réellement, pas de ton code APE.</div>'
      + '</div>'
      + corps
      + '<div class="cat-avert">⚖️ Une orientation, pas une qualification officielle. '
        + 'Certaines activités relèvent des deux catégories selon ce qu’elles vendent, et '
        + 'quelques cas se tranchent au cas par cas. En cas de doute, fais confirmer par '
        + 'ton service des impôts des entreprises ou un expert-comptable.</div>'
    + '</div></div>';
  }

  function simulateurHtml(){
    if(!state.sim.open) return simListHtml();      // liste des simulateurs
    if(state.sim.open === 'cote') return coteHtml();          // combien mettre de côté
    if(state.sim.open === 'categorie') return categorieHtml(); // BIC ou BNC (orientation IA)
    if(state.sim.open === 'depenses') return guideDepHtml();  // guide visuel des dépenses
    if(state.sim.open === 'vl') return vlHtml();   // comparateur (calcul, sans IA)
    if(state.sim.open === 'tva') return tvaHtml(); // passage à la TVA (calcul, sans IA)
    if(state.sim.open === 'statut') return statutHtml();  // quand passer en société (temps réel)
    if(state.sim.open === 'optim') return optimHtml();    // optimiser ma société (cockpit)
    // 'depenses-ia' : l'analyse IA d'un cas précis, accessible depuis les fiches du guide.
    var step = state.sim.step;
    if(step === 'result') return simResultHtml();
    if(step === 'error')  return simErrorHtml();
    return simFormHtml();
  }

  // Compte-rendu en texte brut (bouton « Copier »).
  function recapText(){
    var r = state.sim.result || {};
    var items = r.depenses || [];
    var p = state.profil;
    var L = ['COMPTE-RENDU - Simulateur de charges professionnelles (FreeHub)',
             'Date : ' + new Date().toLocaleDateString('fr-FR'),
             '',
             'ENTREPRISE',
             '- Activité : ' + (p.activite || 'non renseignée'),
             '- Forme juridique : ' + (p.forme || 'non renseignée'),
             '- Régime : ' + (p.regime || 'non renseigné'),
             '- TVA : ' + (p.tva || 'non renseignée'),
             ''];
    if(r.synthese && r.synthese.resume){ L.push('SYNTHÈSE', r.synthese.resume, ''); }
    items.forEach(function(it, i){
      var d = state.sim.depenses[i] || {};
      var st = STATUT[statutOf(it)];
      L.push('──────────────────────────────');
      L.push((i+1) + '. ' + (d.nom || 'Dépense') + ' - ' + (d.montant ? fmtEur(d.montant) : '-'));
      L.push('Résultat : ' + (it.libelle || st.label) + '  |  Confiance : ' + (it.confiance || '-'));
      if(it.reponse) L.push('', it.reponse);
      var bloc = function(titre, arr){
        if(arr && arr.length){ L.push('', titre + ' :'); arr.forEach(function(x){ L.push('  • ' + x); }); }
      };
      bloc('Conditions à respecter', it.conditions);
      bloc('Points de vigilance', it.vigilance);
      bloc('Justificatifs à conserver', it.justificatifs);
      if(it.comptable) L.push('', 'Traitement comptable : ' + it.comptable);
      if(it.tva) L.push('TVA : ' + it.tva);
      if(it.action) L.push('Action : ' + it.action);
      bloc('Pour affiner l’analyse', it.questions);
      L.push('');
    });
    L.push('──────────────────────────────');
    L.push('Analyse indicative, sans valeur de validation fiscale ou comptable.');
    L.push('Fais confirmer les dépenses sensibles par ton expert-comptable.');
    return L.join('\n');
  }

  function runAnalysis(){
    fetch('api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, state.profil, { depenses: state.sim.depenses })),
    }).then(function(resp){
      return resp.json().then(function(data){ return { ok: resp.ok, data: data }; });
    }).then(function(res){
      state.sim.analyzing = false;
      if(res.ok){
        state.sim.result = res.data;
        state.sim.openResult = 0;
        state.sim.syncFait = null;
        state.sim.step = 'result';
        marquerFait('sim:depenses');
        // Sauvegarde de la simulation dans l'historique.
        state.historique.unshift({
          date: Date.now(),
          profil: Object.assign({}, state.profil),
          depenses: state.sim.depenses.map(function(d){
            return { nom:d.nom, montant:d.montant, motif:d.motif };
          }),
          result: res.data,
          total: state.sim.depenses.reduce(function(s, d){
            return s + (parseFloat(d.montant) || 0);
          }, 0),
        });
        saveHistorique(state.historique);
      } else {
        state.sim.error = (res.data && res.data.error) || 'Erreur inconnue.';
        state.sim.step = 'error';
      }
      render();
    }).catch(function(){
      state.sim.analyzing = false;
      state.sim.error = 'Impossible de contacter le serveur d’analyse. '
        + 'Assure-toi qu’il tourne (double-clic sur « Lancer FreeHub.command ») - '
        + 'l’IA ne fonctionne pas en ouvrant index.html directement.';
      state.sim.step = 'error';
      render();
    });
  }

  // Les 3 teintes du partenaire, passées en variables CSS à la carte / la fiche.
  function partVars(p){
    return '--c:'+p.color+';--g:'+p.grad+';--s:'+p.soft;
  }

  // Bandeau partenaire contextuel, affiché en bas d'un résultat de simulateur.
  // Un clic ouvre la fiche du partenaire (lien d'affiliation + code promo).
  function simPartenaireHtml(index, texte){
    var p = PARTENAIRES[index];
    if(!p) return '';
    // Un partenaire encore secret garde son mystère partout, pas seulement sur
    // sa fiche : ni logo, ni nom tant qu'il n'est pas dévoilé.
    var logo = p.tease
      ? '<div class="sim-part-logo part-logo tease">?</div>'
      : '<div class="sim-part-logo"><img src="'+esc(p.img)+'" alt="Logo '+esc(p.nom)+'"></div>';
    return '<div class="sim-part" style="--c:'+p.color+';--s:'+p.soft+'" '
      + 'data-action="part-open" data-i="'+index+'">'
      + logo
      + '<div class="sim-part-txt">'
        + '<div class="sim-part-h">'
          + (p.tease ? 'Un partenaire arrive pour ça' : 'Recommandé pour aller plus loin')
          + (p.promo && !p.tease ? '<span class="sim-part-promo">🎁 code promo</span>' : '') + '</div>'
        + '<div class="sim-part-b">'+esc(texte)+'</div>'
      + '</div>'
      + '<span class="sim-part-cta">'
        + (p.tease ? 'Prochainement' : esc(p.nom)+' →')+'</span>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Onboarding conversationnel - au tout premier lancement
  // ---------------------------------------------------------------------------
  // Une question par écran. On lit la valeur au clic sur « Continuer » plutôt
  // que de re-rendre à chaque frappe (le focus reste dans le champ).
  // Valeur stockée (comprise par le profil et estMicro) / libellé affiché.
  var ONB_FORMES = [
    { v:'Micro-entreprise',    l:'Auto-entreprise' },
    { v:'EURL',                l:'EURL' },
    { v:'SARL',                l:'SARL' },
    { v:'SASU',                l:'SASU' },
    { v:'SAS',                 l:'SAS' },
    { v:'Je ne sais pas encore', l:'Je ne sais pas encore' },
  ];

  // Le nombre d'écrans « profil » avant les questions de ressenti. Assez pour
  // que les simulateurs soient justes, pas au point de refaire tout le profil.
  var ONB_PROFIL = 10;

  // Le corps seul (sans l'overlay) : c'est lui qu'on met à jour à chaque étape,
  // sans recréer l'overlay - sinon son animation d'apparition se rejoue et laisse
  // voir le dashboard derrière.
  function onbCorpsHtml(){
    var o = state.onboarding;
    var r = o.rep;
    var e = o.etape;
    // 9 étapes de profil, puis les questions de ressenti : elles alimentent
    // le score de sérénité affiché en fin de parcours.
    var total = ONB_PROFIL + SERENITE_Q.length;

    var dots = '';
    if(e >= 1 && e <= total){
      dots = '<div class="onb-dots">' + Array.apply(null, {length:total}).map(function(_, i){
        return '<span class="'+(i+1 <= e ? 'on' : '')+'"></span>'; }).join('') + '</div>';
    }

    // Le prénom vient du compte (saisi à l'inscription sur la landing).
    var prenom = (state.profil.prenom || '').trim();

    var corps;
    if(e === 0){
      corps = '<div class="onb-emoji">👋</div>'
        + '<div class="onb-q">'+(prenom ? 'Bienvenue '+esc(prenom)+' !' : 'Bienvenue sur FreeHub')+'</div>'
        + '<div class="onb-sub">Quelques questions pour personnaliser ton espace. '
          + 'Tu pourras tout modifier ensuite dans ton profil.</div>'
        + '<div class="onb-chrono">⏱ Rempli en 2 minutes chrono</div>'
        + '<div class="onb-actions"><button class="onb-primary" data-action="onb-next">C’est parti →</button></div>';
    } else if(e === 1){
      corps = dots + '<div class="onb-q">Tu fais quoi ?</div>'
        + '<div class="onb-sub">Ton activité principale, en quelques mots.</div>'
        + '<input class="onb-input" data-onb="activite" value="'+esc(r.activite||'')+'" placeholder="Ex : monteur vidéo, consultant marketing…">'
        + onbNav(true);
    } else if(e === 2){
      corps = dots + '<div class="onb-q">Quel type d’activité as-tu ?</div>'
        + '<div class="onb-sub">Si tu ne sais pas encore, ce n’est pas grave.</div>'
        + '<div class="onb-choix">' + ONB_FORMES.map(function(f){
            return '<button class="onb-opt'+(r.forme===f.v?' on':'')+'" data-action="onb-forme" data-v="'+esc(f.v)+'">'
              + esc(f.l)+'</button>'; }).join('') + '</div>'
        + onbNav(false);
    } else if(e === 3){
      // La catégorie fixe l'abattement et le taux du versement libératoire :
      // sans elle, tous les calculs partent d'un défaut arbitraire.
      corps = dots + '<div class="onb-q">Tu vends quoi, exactement ?</div>'
        + '<div class="onb-sub">Ça détermine ton abattement et tes taux.</div>'
        + '<div class="onb-choix">'
          + [['bnc','Des prestations intellectuelles','Conseil, design, développement, coaching…'],
             ['serviceBIC','Des services','Artisanat, réparation, transport, beauté…'],
             ['venteBIC','Des produits','Vente, restauration, hébergement…'],
             ['inconnu','Je ne sais pas','On te le dira dans un parcours']]
            .map(function(c){
              return '<button class="onb-opt onb-opt-x'+(r.categorieFiscale===c[0]?' on':'')+'"'
                + ' data-action="onb-categorie" data-v="'+c[0]+'">'
                + '<span class="onb-opt-t">'+esc(c[1])+'</span>'
                + '<span class="onb-opt-d">'+esc(c[2])+'</span></button>';
            }).join('')
        + '</div>'
        + onbNav(false);
    } else if(e === 4){
      corps = dots + '<div class="onb-q">Ton chiffre d’affaires, à peu près ?</div>'
        + '<div class="onb-ca">'
          + '<input class="onb-input" data-onb="ca" type="number" min="0" value="'+esc(r.ca||'')+'" placeholder="60 000">'
          + '<div class="onb-seg">'
            + '<button class="onb-seg-b'+(r.periodeCa!=='mensuel'?' on':'')+'" data-action="onb-periode" data-v="annuel">par an</button>'
            + '<button class="onb-seg-b'+(r.periodeCa==='mensuel'?' on':'')+'" data-action="onb-periode" data-v="mensuel">par mois</button>'
          + '</div>'
        + '</div>'
        + onbNav(true);
    } else if(e === 5){
      // La TVA conditionne le simulateur de provision et les échéances.
      corps = dots + '<div class="onb-q">Et la TVA, tu en es où ?</div>'
        + '<div class="onb-sub">C’est ce qui change le plus tes calculs.</div>'
        + '<div class="onb-choix">'
          + [['Je ne suis pas à la TVA (franchise en base)','Je n’en facture pas encore'],
             ['Je suis à la TVA','J’en facture à mes clients'],
             ['Je ne sais pas','Je ne sais pas']]
            .map(function(c){
              return '<button class="onb-opt'+(r.tva===c[0]?' on':'')+'"'
                + ' data-action="onb-tva" data-v="'+esc(c[0])+'">'+esc(c[1])+'</button>';
            }).join('')
        + '</div>'
        + onbNav(false);
    } else if(e === 6){
      // La périodicité conditionne tout le calendrier : sans elle, on n'invente
      // aucune échéance. « Je ne sais pas » est une réponse acceptable.
      var micro = /micro|auto/i.test(r.forme || '');
      corps = dots + '<div class="onb-q">'
          + (micro ? 'Tu déclares à l’URSSAF…' : 'Tu déclares ta TVA…')+'</div>'
        + '<div class="onb-sub">Ce choix va permettre de placer tes échéances dans le calendrier.</div>'
        + '<div class="onb-choix">'
          + ['mensuel','trimestriel'].map(function(v){
              var actif = (micro ? r.periodeUrssaf : r.periodeTva) === v;
              return '<button class="onb-opt'+(actif?' on':'')+'" data-action="onb-periodicite"'
                + ' data-v="'+v+'">'+(v === 'mensuel' ? 'Tous les mois' : 'Tous les trimestres')
                + '</button>';
            }).join('')
          + '<button class="onb-opt'+((micro ? r.periodeUrssaf : r.periodeTva) === 'nsp' ? ' on' : '')
            + '" data-action="onb-periodicite" data-v="nsp">Je ne sais pas encore</button>'
        + '</div>'
        + onbNav(false);
    } else if(e === 7){
      // Ce que la personne veut se verser : c'est le point de départ des
      // simulateurs de rémunération et du passage en société.
      corps = dots + '<div class="onb-q">Tu veux te verser combien par mois ?</div>'
        + '<div class="onb-sub">Net, dans ta poche. Une cible suffit.</div>'
        + '<div class="onb-ca">'
          + '<input class="onb-input" data-onb="remMensuelle" type="number" min="0"'
            + ' value="'+esc(r.remMensuelle||'')+'" placeholder="2 500">'
          + '<div class="onb-unite">€ / mois</div>'
        + '</div>'
        + onbNav(true);
    } else if(e === 8){
      // Le foyer fiscal : indispensable pour l'impôt, et souvent oublié.
      corps = dots + '<div class="onb-q">Ton foyer fiscal, c’est combien de parts ?</div>'
        + '<div class="onb-sub">Célibataire = 1 · Couple = 2 · + 0,5 par enfant.</div>'
        + '<div class="onb-choix onb-choix-l">'
          + ['1','1.5','2','2.5','3','4'].map(function(v){
              return '<button class="onb-opt onb-opt-c'+((r.parts||'1')===v?' on':'')+'"'
                + ' data-action="onb-parts" data-v="'+v+'">'+v.replace('.', ',')+'</button>';
            }).join('')
        + '</div>'
        + onbNav(false);
    } else if(e === 9){
      // La photo : facultative, mais proposée ici sinon personne n'y pense.
      var apercu = r.photo
        ? '<img class="onb-photo-img" src="'+esc(r.photo)+'" alt="">'
        : '<span class="onb-photo-vide">'+(prenom ? esc(prenom.charAt(0).toUpperCase()) : '🙂')+'</span>';
      corps = dots + '<div class="onb-q">Une photo pour ton profil ?</div>'
        + '<div class="onb-sub">Elle apparaît dans l’Entraide, à côté de tes messages.</div>'
        + '<div class="onb-photo">'+apercu+'</div>'
        + '<label class="onb-photo-cta">'
          + (r.photo ? 'Changer la photo' : 'Choisir une photo')
          + '<input type="file" accept="image/*" data-onb-photo hidden>'
        + '</label>'
        + '<div class="onb-nav">'
          + '<button class="onb-back" data-action="onb-prev">← Retour</button>'
          + '<button class="onb-primary" data-action="onb-next">'
            + (r.photo ? 'Continuer →' : 'Plus tard →')+'</button>'
        + '</div>';
    } else if(e === 10){
      var g = state.notif.genres && state.notif.genres.length
        ? state.notif.genres
        : [{id:'echeances', ico:'📅', titre:'Mes échéances',
            desc:'Un rappel avant chaque date qui te concerne'},
           {id:'entraide', ico:'💬', titre:'Les réponses à mes messages',
            desc:'Quand quelqu’un te répond dans l’Entraide'},
           {id:'recap', ico:'📮', titre:'Le récap du mois',
            desc:'Ce qui t’attend le mois prochain, en un e-mail'}];
      corps = dots + '<div class="onb-q">De quoi souhaites-tu être prévenu ?</div>'
        + '<div class="onb-sub">*Modifiable à tout moment dans ton espace</div>'
        + '<div class="onb-notifs">' + g.map(function(x){
            var on = !!(r.notif || {})[x.id];
            return '<button class="onb-notif'+(on?' on':'')+'" data-action="onb-notif"'
              + ' data-id="'+esc(x.id)+'">'
              + '<span class="onb-notif-i">'+x.ico+'</span>'
              + '<span class="onb-notif-x"><span class="onb-notif-t">'+esc(x.titre)+'</span>'
                + '<span class="onb-notif-d">'+esc(x.desc)+'</span></span>'
              + '<span class="notif-sw"><i></i></span></button>';
          }).join('') + '</div>'
        + onbNav(true);
    } else if(e >= ONB_PROFIL + 1 && e <= ONB_PROFIL + SERENITE_Q.length){
      // Les questions de ressenti : un curseur, même structure que le reste
      // (retour à gauche, « Continuer » à droite).
      var qs = SERENITE_Q[e - ONB_PROFIL - 1];
      var val = (r.serenite || {})[qs.id] || 5;
      corps = dots + '<div class="onb-q">'+esc(qs.q)+'</div>'
        + '<div class="onb-curseur" style="--p:'+((val - 1) / 9 * 100)+'%">'
          + '<div class="onb-cur-v">'+val+'</div>'
          + '<input type="range" min="1" max="10" step="1" value="'+val+'"'
            + ' data-serenite-curseur data-id="'+qs.id+'"'
            + ' aria-label="'+esc(qs.bas)+' à '+esc(qs.haut)+'">'
          + '<div class="onb-cur-l"><span>'+esc(qs.bas)+'</span><span>'+esc(qs.haut)+'</span></div>'
        + '</div>'
        + '<div class="onb-nav">'
          + '<button class="onb-back" data-action="onb-prev">← Retour</button>'
          + '<button class="onb-primary" data-action="onb-serenite" data-id="'+qs.id+'">'
            + 'Continuer →</button>'
        + '</div>';
    } else {
      // Le bilan : le score calculé, et le premier pas à faire tout de suite.
      var s = serenite();
      var niv = sereniteNiveau(s.score);
      var reco = objectifRecommande();
      corps = '<div class="onb-fete">'
          + '<span class="onb-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            + 'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'
            + '<path d="M4.5 12.5 10 18 19.5 6.5"/></svg></span>'
          + '<span class="onb-conf c1"></span><span class="onb-conf c2"></span>'
          + '<span class="onb-conf c3"></span><span class="onb-conf c4"></span>'
          + '<span class="onb-conf c5"></span><span class="onb-conf c6"></span>'
        + '</div>'
        + '<div class="onb-q">Ton espace est prêt'+(prenom ? ', '+esc(prenom) : '')+' !</div>'
        + '<div class="onb-score" style="--c:'+niv.c+'">'
          + anneauSection(s.score, niv.c, 132, true) + '</div>'
        + '<div class="onb-niveau" style="--c:'+niv.c+'">'+niv.em+' '+esc(niv.l)+'</div>'
        + '<div class="onb-sub">Ton score de sérénité de départ. Il montera à chaque chose '
          + 'que tu mettras en place.</div>'
        + (reco
            ? '<button class="onb-reco" data-action="onb-lancer" data-id="'+esc(reco.id)+'">'
              + '<span class="onb-reco-k">Le meilleur premier pas pour toi</span>'
              + '<span class="onb-reco-t">'+esc(reco.title)+'</span>'
              + '<span class="onb-reco-d">'+esc(reco.desc || '')+' · '
                + reco.steps.length+' étapes</span>'
            + '</button>'
            : '')
        + '<div class="onb-actions"><button class="onb-primary" data-action="onb-finish">'
          + (reco ? 'Plus tard, voir mon espace' : 'Découvrir FreeHub →')+'</button></div>';
    }

    return corps;
  }

  // Le parcours le plus utile à proposer en sortie d'onboarding : le premier du
  // catalogue que le profil rend pertinent et qui n'est pas déjà pris.
  function objectifRecommande(){
    var p = state.profil;
    var candidats = catalog.filter(function(o){
      return state.added.indexOf(o.id) < 0 && (!o.pertinent || o.pertinent(p));
    });
    // Un débutant sans statut commence par en choisir un ; sinon, le premier
    // parcours pertinent de la liste (elle est déjà ordonnée par priorité).
    var sansStatut = !p.forme || /je ne sais pas/i.test(p.forme);
    if(sansStatut){
      var choix = candidats.filter(function(o){ return o.id === 'statut' || o.id === 'creer-ae'; })[0];
      if(choix) return choix;
    }
    return candidats[0] || null;
  }

  // Met à jour l'onboarding sans recréer l'overlay : on ne remplace que le contenu
  // intérieur de la carte. L'overlay (et son animation d'apparition) n'est créé
  // qu'une seule fois, à la première apparition - plus aucun « flash » du dashboard
  // à chaque action du formulaire.
  function majOnboarding(){
    var root = document.getElementById('onb-root');
    if(!root) return;
    if(!state.onboarding.actif){ root.innerHTML = ''; return; }
    // On garde la trace de l'avancement : recharger ou fermer l'onglet ne
    // fait pas repartir de zéro, et ne permet pas de sauter les questions.
    try {
      localStorage.setItem('freehub_onb_cours', JSON.stringify({
        etape: state.onboarding.etape, rep: state.onboarding.rep }));
    } catch(e){}
    var card = root.querySelector('.onb-card');
    if(!card){
      root.innerHTML = '<div class="onb-overlay"><div class="onb-card"></div></div>';
      card = root.querySelector('.onb-card');
    }
    card.innerHTML = onbCorpsHtml();
    // On redonne le focus au champ de saisie de l'étape (pour taper / valider au clavier).
    var inp = card.querySelector('.onb-input');
    if(inp){ try { inp.focus(); if(inp.type !== 'number'){ var v = inp.value; inp.value=''; inp.value=v; } } catch(e){} }
  }

  function onbNav(avecContinuer, labelContinuer){
    return '<div class="onb-nav">'
      + '<button class="onb-back" data-action="onb-prev">← Retour</button>'
      + (avecContinuer
          ? '<button class="onb-primary" data-action="onb-next">'+(labelContinuer||'Continuer')+' →</button>'
          : '')
      + '</div>';
  }

  // Lit les champs texte de l'écran courant avant de changer d'étape.
  function onbLire(){
    [].forEach.call(document.querySelectorAll('[data-onb]'), function(inp){
      state.onboarding.rep[inp.getAttribute('data-onb')] = inp.value;
    });
  }

  function onbTerminer(){
    var r = state.onboarding.rep;
    var p = state.profil;
    // Le prénom/nom vient du compte : on ne le redemande pas dans l'onboarding.
    if((r.activite||'').trim()) p.activite = r.activite.trim();
    if(r.forme && r.forme !== 'Je ne sais pas encore'){
      p.forme = r.forme;
      // Le profil de départ est en SASU, donc à l'IS : sans ça, quelqu'un qui
      // déclare une micro à l'onboarding se retrouvait micro + IS, ce qui
      // n'existe pas et fausse tous les simulateurs.
      if(formeExclutIS(p.forme) && p.regime === REGIME_IS) p.regime = REGIME_IR;
    }
    if((r.ca||'').toString().trim()){ p.ca = r.ca; p.periodeCa = r.periodeCa || 'annuel'; }
    if(r.categorieFiscale) p.categorieFiscale = r.categorieFiscale;
    if(r.tva && r.tva !== 'Je ne sais pas') p.tva = r.tva;
    if((r.remMensuelle||'').toString().trim()) p.remMensuelle = r.remMensuelle;
    if(r.parts) p.parts = r.parts;
    if(r.photo) p.photo = r.photo;
    // « nsp » n'est pas une périodicité : on laisse vide plutôt que d'inventer.
    var micro = /micro|auto/i.test(p.forme || r.forme || '');
    var per = micro ? r.periodeUrssaf : r.periodeTva;
    if(per && per !== 'nsp'){
      if(micro) p.periodeUrssaf = per; else p.periodeTva = per;
    }
    saveProfil(p);
    appliquerProfil();
    // Les rappels choisis ici sont enregistrés côté serveur, comme depuis le profil.
    if(r.notif && state.compte){
      state.notif.choix = r.notif;
      notifEnregistrer();
    }
    // Le ressenti déclaré nourrit la moitié du score de sérénité.
    if(r.serenite){
      state.serenite.reponses = r.serenite;
      try { localStorage.setItem('freehub_serenite', JSON.stringify(r.serenite)); } catch(e){}
      pousserServeur();
    }
    try {
      localStorage.setItem('freehub_onboarded', '1');
      localStorage.removeItem('freehub_onb_cours');
    } catch(e){}
    state.onboarding.actif = false;
    // Arrivée terminée : si ce membre est venu par le lien de quelqu'un, le
    // parrainage se valide maintenant — pas à l'inscription, pour qu'un
    // compte jetable ne suffise pas à grimper au classement.
    if(state.compte) parrainageValider().then(function(){ parrainageCharger(); });
    // On atterrit sur le profil : c'est le moment où l'on est le plus enclin
    // à finir de le remplir, et il reste des champs utiles aux simulateurs.
    notifCharger(false);
    state.profilReturn = 'accueil';
    setState({ tab: 'profil' });
  }

  // ---------------------------------------------------------------------------
  // Calendrier - les échéances de l'année, tirées des objectifs et du statut
  // ---------------------------------------------------------------------------
  var MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août',
              'septembre','octobre','novembre','décembre'];

  // On rassemble les échéances des objectifs que l'utilisateur a pris ET de ceux
  // que son profil rend pertinents (même non pris) : c'est le « selon ton statut ».
  // Aucune date inventée : on ne prend que ce qui est déjà encodé dans le catalog.
  var JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var MOIS_COURTS = ['janv.','févr.','mars','avr.','mai','juin',
                     'juil.','août','sept.','oct.','nov.','déc.'];

  // Les échéances d'une année donnée. Contrairement à l'ancienne version qui
  // faisait rouler les dates passées sur l'année suivante, on date ici dans
  // l'année demandée : c'est ce qui permet de naviguer de 2026 à 2027.
  // Les déclarations récurrentes, déduites UNIQUEMENT de la périodicité que
  // l'utilisateur a renseignée. Rien de renseigné = rien d'affiché.
  function echeancesRecurrentes(annee){
    var p = state.profil, now = new Date(), out = [];
    var micro = estMicro(p);
    var pousse = function(mois, jour, quoi, domaine, note){
      var d = new Date(annee, mois, jour);
      out.push({ objId:null, quoi:quoi, dom:domaine, periode:null,
                 mois:mois, jour:jour, date:d,
                 jours:Math.ceil((d - now) / 86400000), pris:true, note:note });
    };
    var dUrssaf = DOMAINES.administratif, dTva = DOMAINES.tva;

    if(micro && p.periodeUrssaf === 'mensuel'){
      for(var m = 0; m < 12; m++){
        var fin = new Date(annee, m + 1, 0).getDate();
        pousse(m, fin, 'Déclaration URSSAF', dUrssaf,
          'Chiffre d’affaires du mois précédent, sur autoentrepreneur.urssaf.fr');
      }
    } else if(micro && p.periodeUrssaf === 'trimestriel'){
      [[3,30,1],[6,31,2],[9,31,3],[0,31,4]].forEach(function(t){
        pousse(t[0], t[1], 'Déclaration URSSAF · trimestre ' + t[2], dUrssaf,
          'Chiffre d’affaires du trimestre écoulé, sur autoentrepreneur.urssaf.fr');
      });
    }
    if(p.periodeTva === 'mensuel'){
      for(var k = 0; k < 12; k++){
        pousse(k, 21, 'Déclaration de TVA', dTva,
          'Formulaire CA3 sur impots.gouv.fr. Ta date limite exacte y figure.');
      }
    } else if(p.periodeTva === 'trimestriel'){
      [[3,1],[6,2],[9,3],[0,4]].forEach(function(t){
        pousse(t[0], 21, 'Déclaration de TVA · trimestre ' + t[1], dTva,
          'Formulaire CA3 sur impots.gouv.fr. Ta date limite exacte y figure.');
      });
    }
    return out;
  }

  function evenementsAnnee(annee){
    var p = state.profil, now = new Date();
    return echeancesRecurrentes(annee).concat(catalog.filter(function(o){
      if(!o.echeance) return false;
      return state.added.indexOf(o.id) >= 0 || (o.pertinent && o.pertinent(p)) || !o.pertinent;
    }).map(function(o){
      var e = o.echeance, dd = dom(o);
      var pris = state.added.indexOf(o.id) >= 0;
      if(e.periode){
        var md = (e.moisDebut || 1) - 1;
        return { objId:o.id, quoi:e.quoi, dom:dd, periode:e.periode,
                 mois:md, moisFin:(e.moisFin ? e.moisFin - 1 : md),
                 jour:null, date:null, jours:null, pris:pris };
      }
      var d = new Date(annee, e.mois - 1, e.jour);
      return { objId:o.id, quoi:e.quoi, dom:dd, periode:null,
               mois:e.mois - 1, jour:e.jour, date:d,
               jours:Math.ceil((d - now) / 86400000), pris:pris };
    })).sort(function(a, b){
      return a.mois - b.mois || ((a.jour || 0) - (b.jour || 0));
    });
  }

  // La prochaine échéance à venir, quelle que soit l'année affichée.
  // Nom distinct de prochaineEcheance() (accueil) : les deux coexistent dans la
  // même portée et la seconde déclaration écraserait la première.
  function prochaineEcheanceCal(){
    var now = new Date();
    var liste = evenementsAnnee(now.getFullYear())
      .concat(evenementsAnnee(now.getFullYear() + 1))
      .filter(function(e){ return e.date && e.date >= now; });
    liste.sort(function(a, b){ return a.date - b.date; });
    return liste[0] || null;
  }

  // Un événement concerne-t-il ce mois ? Les périodes s'étalent sur plusieurs.
  function couvreMois(e, m){
    return e.periode ? (m >= e.mois && m <= e.moisFin) : e.mois === m;
  }

  // --- Vue année : douze mini-calendriers ------------------------------------
  function calAnneeHtml(evts, annee){
    var now = new Date();
    var cases = [];
    for(var m = 0; m < 12; m++){
      var duMois = evts.filter(function(e){ return couvreMois(e, m); });
      var courant = annee === now.getFullYear() && m === now.getMonth();
      var premier = new Date(annee, m, 1);
      var decalage = (premier.getDay() + 6) % 7;
      var nbJours = new Date(annee, m + 1, 0).getDate();

      // Une vraie petite grille de jours : c'est ce qui fait « calendrier ».
      var jours = '';
      for(var v = 0; v < decalage; v++) jours += '<i class="mj vide"></i>';
      for(var d = 1; d <= nbJours; d++){
        var dessus = duMois.filter(function(e){
          if(e.periode) return true;
          return e.jour === d;
        });
        var exact = dessus.filter(function(e){ return !e.periode; })[0];
        var etale = !exact && dessus.length ? dessus[0] : null;
        var auj = annee === now.getFullYear() && m === now.getMonth() && d === now.getDate();
        var st = exact ? ' style="background:'+exact.dom.c+';color:#fff"'
               : (etale ? ' style="background:'+etale.dom.soft+';color:'+etale.dom.c+'"' : '');
        jours += '<i class="mj'+(exact ? ' pt' : (etale ? ' etale' : ''))
          + (auj ? ' auj' : '')+'"'+st+'>'+d+'</i>';
      }

      cases.push('<button class="cal-m'+(duMois.length ? ' actif' : '')
        + (courant ? ' present' : '')+'" data-action="cal-mois" data-m="'+m+'">'
        + '<span class="cal-m-h"><span class="cal-m-n">'+esc(MOIS[m])+'</span>'
          + (duMois.length ? '<span class="cal-m-nb">'+duMois.length+'</span>' : '')+'</span>'
        + '<span class="cal-m-jn">'+JOURS_COURTS.map(function(j){
            return '<i>'+j+'</i>'; }).join('')+'</span>'
        + '<span class="cal-m-g">'+jours+'</span>'
        + (duMois.length
            ? '<span class="cal-m-l">'+duMois.map(function(e){
                return '<span class="cal-m-e" style="--c:'+e.dom.c+'">'+esc(e.quoi)+'</span>';
              }).join('')+'</span>'
            : '')
      + '</button>');
    }
    return '<div class="cal-annee">'+cases.join('')+'</div>';
  }

  // --- Vue mois : une vraie grille de sept colonnes --------------------------
  function calMoisHtml(evts, annee, mois){
    var now = new Date();
    var premier = new Date(annee, mois, 1);
    // getDay() renvoie 0 pour dimanche : on décale pour démarrer le lundi.
    var decalage = (premier.getDay() + 6) % 7;
    var nbJours = new Date(annee, mois + 1, 0).getDate();
    var duMois = evts.filter(function(e){ return couvreMois(e, mois); });
    var periodes = duMois.filter(function(e){ return e.periode; });

    var entete = JOURS_COURTS.map(function(j){
      return '<div class="cal-jn">'+j+'</div>'; }).join('');

    var cellules = '';
    for(var i = 0; i < decalage; i++) cellules += '<div class="cal-c hors"></div>';
    for(var d = 1; d <= nbJours; d++){
      var duJour = duMois.filter(function(e){ return !e.periode && e.jour === d; });
      var auj = annee === now.getFullYear() && mois === now.getMonth() && d === now.getDate();
      // Les périodes teintent tous les jours qu'elles couvrent, au lieu d'être
      // reléguées dans un encart au-dessus de la grille.
      var fond = periodes.length
        ? ' style="background:'+periodes[0].dom.soft+'"' : '';
      cellules += '<div class="cal-c'+(duJour.length ? ' plein' : '')
        + (periodes.length ? ' etale' : '')+(auj ? ' auj' : '')+'"'+fond+'>'
        + '<span class="cal-c-n">'+d+'</span>'
        + duJour.map(function(e){
            return '<button class="cal-c-e" style="--c:'+e.dom.c+';--s:'+e.dom.soft+'"'
              + ' data-action="view" data-id="'+e.objId+'">'+esc(e.quoi)+'</button>';
          }).join('')
      + '</div>';
    }
    var reste = (7 - ((decalage + nbJours) % 7)) % 7;
    for(var k = 0; k < reste; k++) cellules += '<div class="cal-c hors"></div>';

    // Bandeau discret : il nomme la période qui teinte le mois, sans la sortir
    // de la grille.
    return (periodes.length
        ? '<div class="cal-bande">'+periodes.map(function(e){
            return '<button class="cal-bande-e" style="--c:'+e.dom.c+';--s:'+e.dom.soft+'"'
              + ' data-action="view" data-id="'+e.objId+'">'
              + '<span class="cal-bande-p"></span>'+esc(e.quoi)
              + '<span class="cal-bande-d">tout '+esc(e.periode)+'</span>'
            + '</button>'; }).join('')+'</div>'
        : '')
      + '<div class="cal-grille"><div class="cal-jns">'+entete+'</div>'
      + '<div class="cal-cs">'+cellules+'</div></div>';
  }

  // --- Vue semaine : sept colonnes, du lundi au dimanche ---------------------
  function calSemaineHtml(evts, debut){
    var now = new Date();
    var cols = '';
    for(var i = 0; i < 7; i++){
      var d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      var duJour = evts.filter(function(e){
        return !e.periode && e.jour === d.getDate() && e.mois === d.getMonth(); });
      var per = evts.filter(function(e){ return couvreMois(e, d.getMonth()) && e.periode; });
      var auj = d.toDateString() === now.toDateString();
      cols += '<div class="cal-sj'+(auj ? ' auj' : '')+(duJour.length ? ' plein' : '')
        + (per.length ? ' etale' : '')+'"'
        + (per.length ? ' style="background:'+per[0].dom.soft+'"' : '')+'>'
        + '<div class="cal-sj-h"><span class="cal-sj-n">'+JOURS_COURTS[i]+'</span>'
          + '<span class="cal-sj-d">'+d.getDate()+'</span></div>'
        + '<div class="cal-sj-b">'
          + duJour.map(function(e){
              return '<button class="cal-c-e" style="--c:'+e.dom.c+';--s:'+e.dom.soft+'"'
                + ' data-action="view" data-id="'+e.objId+'">'+esc(e.quoi)+'</button>';
            }).join('')
        + '</div>'
      + '</div>';
    }
    return '<div class="cal-semaine">'+cols+'</div>';
  }

  function calendrierHtml(){
    var c = state.cal, now = new Date();
    var evts = evenementsAnnee(c.annee);
    var prochaine = prochaineEcheanceCal();

    // --- Bandeau : on lit la phrase, pas un nombre isolé ---
    // Les années se choisissent ici, en pastilles, plutôt que dans une barre à
    // flèches où elles n'étaient ni visibles ni jolies.
    var annees = [];
    for(var a = now.getFullYear() - 1; a <= now.getFullYear() + 3; a++) annees.push(a);
    var chipsAnnees = annees.map(function(an){
      var nb = evenementsAnnee(an).length;
      return '<button class="cal-an'+(an === c.annee ? ' on' : '')+'"'
        + ' data-action="cal-annee" data-a="'+an+'">'+an
        + (nb ? '<span class="cal-an-n">'+nb+'</span>' : '')+'</button>';
    }).join('');

    var hero = '<div class="cal-hero">';
    if(prochaine){
      var j = prochaine.jours;
      var quand = j <= 0 ? 'aujourd’hui'
        : (j === 1 ? 'demain' : 'dans <strong>'+j+' jours</strong>');
      hero += '<div class="cal-hero-haut">'
        + '<div class="cal-hero-txt">'
          + '<div class="cal-hero-l">Prochaine échéance</div>'
          + '<div class="cal-hero-t">'+esc(prochaine.quoi)+', '+quand+'</div>'
          + '<div class="cal-hero-d">'
            + '<span class="cal-hero-pt"></span>'
            + prochaine.date.toLocaleDateString('fr-FR',
                { weekday:'long', day:'numeric', month:'long', year:'numeric' })
            + ' · '+esc(prochaine.dom.l)+'</div>'
        + '</div>'
        + '<button class="cal-hero-cta" data-action="view" data-id="'+prochaine.objId+'">'
          + 'Voir l’objectif →</button>'
      + '</div>';
    } else {
      hero += '<div class="cal-hero-haut"><div class="cal-hero-txt">'
        + '<div class="cal-hero-t">Aucune échéance en vue</div>'
        + '<div class="cal-hero-d">Elles apparaîtront selon ton statut '
          + 'et les objectifs que tu suis</div></div></div>';
    }
    hero += '<div class="cal-annees">'+chipsAnnees+'</div></div>';

    // --- Barre de navigation : période, vue, retour à aujourd'hui ---
    var libelle = c.vue === 'annee' ? String(c.annee)
      : (c.vue === 'mois' ? MOIS[c.mois] + ' ' + c.annee
        : (function(){
            var d = new Date(c.semaine);
            var f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6);
            return d.getDate()+' '+MOIS_COURTS[d.getMonth()]
                 + ' → '+f.getDate()+' '+MOIS_COURTS[f.getMonth()]+' '+f.getFullYear();
          })());

    var vues = [['annee','Année'], ['mois','Mois'], ['semaine','Semaine']].map(function(v){
      return '<button class="cal-vue'+(c.vue === v[0] ? ' on' : '')+'"'
        + ' data-action="cal-vue" data-v="'+v[0]+'">'+v[1]+'</button>';
    }).join('');

    var surAujourdhui = c.vue === 'annee' ? c.annee === now.getFullYear()
      : (c.vue === 'mois' ? (c.annee === now.getFullYear() && c.mois === now.getMonth())
        : (function(){
            var d = new Date(c.semaine);
            var f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
            return now >= d && now < f;
          })());

    var barre = '<div class="cal-barre">'
      + '<div class="cal-vues">'+vues+'</div>'
      + (c.vue === 'annee' ? ''
          : '<div class="cal-nav">'
            + '<button class="cal-fl" data-action="cal-prec" aria-label="Précédent">‹</button>'
            + '<span class="cal-periode">'+esc(libelle)+'</span>'
            + '<button class="cal-fl" data-action="cal-suiv" aria-label="Suivant">›</button>'
          + '</div>')
      + (surAujourdhui ? '' : '<button class="cal-auj" data-action="cal-auj">Aujourd’hui</button>')
    + '</div>';

    var corps = c.vue === 'annee' ? calAnneeHtml(evts, c.annee)
              : (c.vue === 'mois' ? calMoisHtml(evts, c.annee, c.mois)
                : calSemaineHtml(evts, new Date(c.semaine)));

    var rien = !evts.length
      ? '<div class="cal-rien">Aucune échéance connue pour '+c.annee+'. '
        + 'Elles apparaissent selon ton statut et les objectifs que tu suis.</div>'
      : '';

    return '<div class="view">'
      + hero + barre + rien + corps
      + '<div class="cal-note">Ces dates viennent de ton statut et des objectifs que tu suis. '
        + 'Les dates limites exactes (déclarations, département) sont sur les sites officiels.</div>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Hauts faits - la salle des trophées
  // ---------------------------------------------------------------------------
  // Des médailles, pas des cases : les paliers en grand avec leur progression
  // chiffrée, le reste de la collection en dessous. Tout est cliquable - la
  // fiche dit ce que le badge donne, et comment s'en approcher.

  function medailleHtml(id, grand){
    var b = badge(id);
    if(!b) return '';
    var on = state.badges.indexOf(id) >= 0;
    // Un badge non acquis ne peut pas être « porté », même si le stockage le
    // prétend (données importées d'un autre profil, par exemple).
    var porte = on && state.badgePorte === id;
    var pr = !on ? progresBadge(id) : null;
    var fam = BADGES_PALIERS.indexOf(id) >= 0 ? ' fam-parcours' : '';
    return '<button class="med'+(on ? ' on' : ' verrou')+(grand ? ' grand' : '')
      + (b.rang ? ' rang-'+b.rang+fam : '')+(porte ? ' porte' : '')+'"'
      + ' data-action="badge-fiche" data-id="'+id+'">'
      + '<span class="med-coin"><span class="med-ico">'+(on ? b.ico : '🔒')+'</span></span>'
      // Le nom reste lisible même verrouillé : c'est déjà un indice sur la
      // manière de l'obtenir, et ça donne envie de cliquer pour en savoir plus.
      + '<span class="med-n">'+esc(b.t)+'</span>'
      + (pr ? '<span class="med-prog">'+pr.n+' / '+pr.sur+'</span>' : '')
      + (porte ? '<span class="med-porte">porté</span>' : '')
    + '</button>';
  }

  function succesHtml(){
    var n = state.badges.length, total = BADGES.length;
    var pct = total ? Math.round(n / total * 100) : 0;

    var R = 30, C = 2 * Math.PI * R;
    var anneau = '<svg viewBox="0 0 72 72" width="72" height="72">'
      + '<circle cx="36" cy="36" r="'+R+'" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="6"/>'
      + '<circle cx="36" cy="36" r="'+R+'" fill="none" stroke="#fff" stroke-width="6" '
        + 'stroke-linecap="round" stroke-dasharray="'+(pct/100*C)+' '+C+'" '
        + 'transform="rotate(-90 36 36)"/>'
      + '<text x="36" y="42" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">'
        + n + '</text></svg>';

    // Les badges de parrainage se lisent ici aussi : sans ce relevé, quelqu'un
    // qui ne passe jamais par le Classement ne les verrait jamais tomber.
    if(state.compte && !state.parrainage.charge) parrainageCharger();

    var entete = '<div class="suc-tete">'
      + '<div class="obj-tete-r">'+anneau+'</div>'
      + '<div class="obj-tete-x">'
        + '<div class="obj-tete-t">'
          + (n ? n+' récompense'+(n>1?'s':'')+' sur '+total
               : 'Ta collection commence ici')+'</div>'
        + '<div class="obj-tete-s">Clique sur une médaille : chacune dit ce qu’elle '
          + 'donne, et comment s’en approcher</div>'
        + '<div class="obj-tete-c">'
          + '<span class="ochip on"><b>'+(total - n)+'</b> à débloquer</span>'
          + (state.badgePorte && state.badges.indexOf(state.badgePorte) >= 0
              ? '<span class="ochip ok"><b>'+esc((badge(state.badgePorte)||{}).t||'')
                + '</b> porté</span>'
              : '<span class="ochip">aucun badge porté pour l’instant</span>')
        + '</div>'
      + '</div>'
    + '</div>';

    var autres = BADGES.filter(function(b){
      return BADGES_SERIE.indexOf(b.id) < 0 && BADGES_PALIERS.indexOf(b.id) < 0;
    });

    return '<div class="view">'
      + entete
      + '<div class="suc-sec"><div class="suc-sec-t">Collection'
        + '<span class="suc-sec-h">plus tu débloques, plus tu montes</span></div>'
        + '<div class="suc-paliers">'
          + BADGES_SERIE.map(function(id){ return medailleHtml(id, true); }).join('')
        + '</div></div>'
      + '<div class="suc-sec"><div class="suc-sec-t">Parcours'
        + '<span class="suc-sec-h">des objectifs bouclés, du premier au dernier</span></div>'
        + '<div class="suc-paliers">'
          + BADGES_PALIERS.map(function(id){ return medailleHtml(id, true); }).join('')
        + '</div></div>'
      + '<div class="suc-sec"><div class="suc-sec-t">Toutes les récompenses</div>'
        + '<div class="suc-grille">'
          + autres.map(function(b){ return medailleHtml(b.id, false); }).join('')
        + '</div></div>'
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Réclamations - la file des demandes, côté admin
  // ---------------------------------------------------------------------------
  // Le compteur des demandes à traiter, pour la pastille de la barre latérale.
  // Relevé en fond : une réclamation qui arrive doit se voir sans ouvrir l'onglet.
  var SAV_VEILLE = 90000;
  var savVeilleTimer = null;
  function demandesNbCharger(){
    if(!(state.compte && state.compte.isAdmin)) return;
    apiJson('GET', '/api/admin/demandes/nb').then(function(r){
      if(!r.ok || !r.data) return;
      var n = r.data.n || 0;
      if(n === state.demandesNb) return;
      state.demandesNb = n;
      render();
    });
  }
  function demandesVeille(){
    if(savVeilleTimer) return;
    demandesNbCharger();
    savVeilleTimer = setInterval(function(){
      if(document.visibilityState === 'visible') demandesNbCharger();
    }, SAV_VEILLE);
  }

  // Relit la file : au premier affichage, puis après chaque réponse envoyée.
  function demandesRecharger(){
    return apiJson('GET', '/api/admin/demandes').then(function(r){
      setState({ demandes: Object.assign({}, state.demandes,
        { chargees:true, enCours:false, liste:(r.ok && r.data.demandes) || [] }) });
    });
  }

  function savAdminHtml(){
    if(!(state.compte && state.compte.isAdmin)){
      return '<div class="view"><div class="obj-vide">Réservé aux administrateurs.</div></div>';
    }
    var d = state.demandes;
    if(!d.chargees && !d.enCours){
      d.enCours = true;
      demandesRecharger();
    }
    var liste = (d.liste || []).filter(function(x){
      if(d.filtre === 'partenaire') return x.type === 'partenaire';
      if(d.filtre === 'sav') return x.type === 'sav';
      if(d.filtre === 'afaire') return !x.traite;
      return true;
    });
    var pastille = function(v, l){
      var n = v === null ? (d.liste || []).length
        : (d.liste || []).filter(function(x){
            return v === 'afaire' ? !x.traite : x.type === v; }).length;
      return '<button class="fpill'+(d.filtre === v ? ' on' : '')+'"'
        + ' data-action="dem-filtre" data-f="'+(v || '')+'">'+l
        + '<span class="fpill-n">'+n+'</span></button>';
    };
    // L'échange vit dans la carte de la réclamation, pas ailleurs : on garde
    // sous les yeux ce à quoi on répond.
    function demFilHtml(x){
      if(x.type !== 'sav') return '';
      var rep = x.reponses || [];
      var fil = rep.map(function(r){
        return '<div class="dem-r'+(r.admin ? ' nous' : '')+'">'
          + '<span class="dem-r-qui">'+(r.admin ? 'Nous' : esc(x.titre))+'</span>'
          + '<span class="dem-r-m">'+esc(r.message)+'</span>'
        + '</div>';
      }).join('');
      // Traité = clos : le serveur refuse les nouvelles réponses, l'interface
      // ne doit pas laisser croire le contraire.
      if(x.traite){
        return fil ? '<div class="dem-fil">'+fil
          + '<div class="dem-clos">Échange clos</div></div>' : '';
      }
      if(!x.repondable){
        return fil ? '<div class="dem-fil">'+fil+'</div>' : '';
      }
      return '<div class="dem-fil">'+fil
        + '<form class="dem-form" data-dem-form data-id="'+x.id+'">'
          + '<textarea data-dem-texte rows="2" maxlength="2000" required'
            + ' placeholder="Répondre à '+esc(x.titre)+'…"></textarea>'
          + '<button type="submit" class="dem-envoi">Envoyer</button>'
        + '</form>'
      + '</div>';
    }

    var cartes = liste.map(function(x){
      return '<div class="dem'+(x.traite ? ' fait' : '')+'">'
        + '<div class="dem-h">'
          + '<span class="dem-type '+x.type+'">'+(x.type === 'partenaire' ? '🤝 Partenariat' : '🛟 SAV')+'</span>'
          + '<span class="dem-t">'+esc(x.titre)+'</span>'
          + '<span class="ch-h">'+chatHeure(x.created)+'</span>'
          + '<button class="dem-ok'+(x.traite ? ' on' : '')+'" data-action="dem-traiter"'
            + ' data-type="'+x.type+'" data-id="'+x.id+'" data-v="'+(x.traite ? 0 : 1)+'">'
            + (x.traite ? '✓ Traité' : 'Marquer traité')+'</button>'
        + '</div>'
        + (x.detail ? '<div class="dem-d">'+esc(x.detail)+'</div>' : '')
        + '<div class="dem-m">'+esc(x.message || '')+'</div>'
        + (x.email ? '<a class="dem-mail" href="mailto:'+esc(x.email)+'">✉ '+esc(x.email)+'</a>' : '')
        + demFilHtml(x)
      + '</div>';
    }).join('');

    return '<div class="view">'
      + '<div class="fpills">'
        + pastille(null, 'Toutes') + pastille('afaire', 'À traiter')
        + pastille('partenaire', 'Partenariats') + pastille('sav', 'SAV')
      + '</div>'
      + (d.chargees
          ? (liste.length ? '<div class="dems">'+cartes+'</div>'
              : '<div class="obj-vide">Rien ici pour l’instant - c’est calme</div>')
          : '<div class="ch-info">Chargement…</div>')
      + '</div>';
  }

  // ---------------------------------------------------------------------------
  // La bulle d'aide - toujours là, en bas à droite
  // ---------------------------------------------------------------------------
  var SAV_TYPES = [
    { v:'suggestion', ico:'💡', l:'Une suggestion',
      d:'Une idée pour améliorer FreeHub' },
    { v:'bug', ico:'🐛', l:'Un bug',
      d:'Quelque chose ne marche pas comme prévu' },
    { v:'question', ico:'❓', l:'Autre chose',
      d:'Une question, un mot, ce que tu veux' },
  ];

  // ---------------------------------------------------------------------------
  // Première ouverture d'un simulateur : à quoi il sert, en trois lignes
  // ---------------------------------------------------------------------------
  // Montré une seule fois par simulateur (mémorisé dans les faits), pour que la
  // personne sache quelle question l'outil répond avant de saisir quoi que ce soit.
  var SIM_INTRO = {
    categorie: { ico:'🧭', t:'BIC ou BNC ?',
      p:'Tu ne sais pas dans quelle catégorie ranger ton activité, et ça change ta case de déclaration comme ton abattement.',
      q:'On lit ce que tu fais vraiment et on t’oriente, avec le raisonnement — pas juste une étiquette.',
      f:'Au moment de déclarer, ou quand ton activité évolue.' },
    cote: { ico:'🏦', t:'Combien mettre de côté ?',
      p:'Tu viens d’encaisser une somme et tu ne sais pas ce que tu peux réellement dépenser.',
      q:'On retire ce qui n’est pas à toi - TVA, cotisations, impôt - et on te dit ce qui reste.',
      f:'Utile chaque fois que tu es payé.' },
    depenses: { ico:'🧾', t:'Le guide des dépenses',
      p:'« Est-ce que je peux passer ça ? » Cette question revient à chaque achat.',
      q:'49 dépenses passées en revue, avec un verdict clair pour chacune selon ton régime.',
      f:'Un doute sur un achat ? Cherche-le ici avant de payer.' },
    vl: { ico:'⚖️', t:'Versement libératoire ou pas',
      p:'Payer ton impôt au fil de l’eau ou au barème : le mauvais choix coûte cher chaque année.',
      q:'On calcule les deux sur tes chiffres et on te dit lequel te laisse le plus.',
      f:'À revoir chaque année, avant le 30 septembre.' },
    tva: { ico:'🧮', t:'Passer à la TVA',
      p:'La franchise a des seuils, et parfois l’option volontaire est gagnante.',
      q:'On estime ce que tu récupérerais sur tes achats et ce que ça change pour tes clients.',
      f:'À regarder avant d’approcher les seuils.' },
    statut: { ico:'🏛', t:'Quand passer en société',
      p:'En micro, les charges ne se déduisent pas. À un moment, la société rapporte plus.',
      q:'On compare micro, EURL et SASU sur ton chiffre d’affaires et on trouve le point de bascule.',
      f:'À refaire dès que ton activité change d’échelle.' },
    optim: { ico:'🎛', t:'Optimiser ta société',
      p:'Rémunération, dividendes, trésorerie : chaque curseur change ce qu’il te reste.',
      q:'Tu bouges les réglages, tu vois l’effet en direct sur ton net.',
      f:'À ouvrir avant de fixer ta rémunération de l’année.' },
  };

  function simIntroHtml(){
    var k = state.simIntro;
    var d = k && SIM_INTRO[k];
    if(!d) return '';
    return '<div class="overlay" data-action="sim-intro-ok">'
      + '<div class="modal sim-intro" data-action="stop">'
        + '<div class="sim-intro-h"><span class="sim-intro-i">'+d.ico+'</span>'
          + '<div><div class="sim-intro-k">À quoi ça sert</div>'
          + '<div class="sim-intro-t">'+esc(d.t)+'</div></div></div>'
        + '<div class="sim-intro-b">'
          + '<div class="sim-intro-l"><span class="sim-intro-p">Le problème</span>'
            + '<span>'+esc(d.p)+'</span></div>'
          + '<div class="sim-intro-l"><span class="sim-intro-p">Ce que fait l’outil</span>'
            + '<span>'+esc(d.q)+'</span></div>'
          + '<div class="sim-intro-l"><span class="sim-intro-p">Quand l’ouvrir</span>'
            + '<span>'+esc(d.f)+'</span></div>'
        + '</div>'
        + '<button class="sim-intro-ok" data-action="sim-intro-ok">C’est clair, j’y vais →</button>'
      + '</div></div>';
  }

  function majSimIntro(){
    var r = document.getElementById('simintro-root');
    if(r) r.innerHTML = simIntroHtml();
  }

  // ---------------------------------------------------------------------------
  // « Ta suggestion a été retenue »
  // ---------------------------------------------------------------------------
  // Quand un retour marqué « suggestion » passe en traité côté admin, son
  // auteur l'apprend à sa visite suivante. Le texte d'origine est replié
  // derrière un bouton : plusieurs semaines après, on ne se souvient plus de
  // ce qu'on avait écrit.
  function annonceHtml(){
    var a = state.annonces && state.annonces.liste[0];
    if(!a) return '';
    var n = state.annonces.liste.length;
    return '<div class="overlay" data-action="annonce-ok">'
      + '<div class="modal annonce" data-action="stop">'
        + '<div class="annonce-ico">💡</div>'
        + '<div class="annonce-k">Ta suggestion a été retenue</div>'
        + '<div class="annonce-t">Merci, c’est en place&nbsp;!</div>'
        + '<div class="annonce-p">Tu nous avais signalé quelque chose à améliorer : '
          + 'on s’en est occupé. C’est exactement comme ça que FreeHub avance.</div>'
        + (state.annonces.deplie
            ? '<div class="annonce-msg">'+esc(a.message)+'</div>'
            : '<button class="annonce-voir" data-action="annonce-voir">'
              + 'Revoir ce que j’avais écrit</button>')
        + (n > 1 ? '<div class="annonce-reste">'+(n - 1)+' autre'+(n > 2 ? 's' : '')
                   + ' suggestion'+(n > 2 ? 's' : '')+' aussi retenue'+(n > 2 ? 's' : '')
                   + '</div>' : '')
        + '<button class="annonce-ok" data-action="annonce-ok">Super, merci&nbsp;!</button>'
      + '</div></div>';
  }
  function majAnnonce(){
    var r = document.getElementById('annonce-root');
    if(r) r.innerHTML = annonceHtml();
  }

  // Une combinaison fiscale impossible a été tentée : on explique pourquoi on
  // n'a pas suivi, plutôt que de corriger en douce sans rien dire.
  var PF_ALERTES = {
    'micro-is': {
      t:'La micro, c’est l’impôt sur le revenu',
      p:'Une micro-entreprise ne peut pas être à l’impôt sur les sociétés : ce régime '
        + 'suppose une société. Tes bénéfices sont imposés à ton nom, dans ta déclaration '
        + 'de revenus.',
      q:'Ce que tu peux choisir, c’est le versement libératoire : payer ton impôt en même '
        + 'temps que tes cotisations, à un taux fixe. Le simulateur « Versement libératoire '
        + 'ou impôt classique » compare les deux sur tes chiffres.',
    },
  };
  // Trois issues explicites plutôt qu'un « êtes-vous sûr ? » : enregistrer et
  // continuer, partir sans garder, ou rester.
  function profilQuitterHtml(){
    if(!state.profilQuitter) return '';
    return '<div class="overlay" data-action="pq-rester">'
      + '<div class="modal annonce" data-action="stop">'
        + '<div class="annonce-ico">💾</div>'
        + '<div class="annonce-k">Modifications non enregistrées</div>'
        + '<div class="annonce-t">Tu veux les garder&nbsp;?</div>'
        + '<div class="annonce-p">Tu as changé des informations de ton profil sans les '
          + 'enregistrer. Elles servent à tes simulateurs : sans elles, les calculs '
          + 'repartiront sur les anciennes valeurs.</div>'
        + '<button class="annonce-ok" data-action="pq-enregistrer">Enregistrer et continuer</button>'
        + '<button class="annonce-voir" data-action="pq-jeter">Continuer sans enregistrer</button>'
        + '<button class="annonce-voir" data-action="pq-rester">Rester sur le profil</button>'
      + '</div></div>';
  }

  function pfAlerteHtml(){
    var a = PF_ALERTES[state.pfAlerte];
    if(!a) return '';
    return '<div class="overlay" data-action="pf-alerte-ok">'
      + '<div class="modal annonce" data-action="stop">'
        + '<div class="annonce-ico">⚖️</div>'
        + '<div class="annonce-k">Impossible ensemble</div>'
        + '<div class="annonce-t">'+esc(a.t)+'</div>'
        + '<div class="annonce-p">'+esc(a.p)+'</div>'
        + '<div class="annonce-msg">'+esc(a.q)+'</div>'
        + '<button class="annonce-ok" data-action="pf-alerte-ok">J’ai compris</button>'
      + '</div></div>';
  }
  // Relevé une seule fois par chargement, après la vérification de session :
  // sans compte, il n'y a personne à prévenir.
  function annoncesCharger(){
    if(!state.compte) return;
    apiJson('GET', '/api/sav/annonces').then(function(r){
      if(!r.ok || !r.data || !r.data.annonces || !r.data.annonces.length) return;
      state.annonces.liste = r.data.annonces;
      majAnnonce();
    });
  }

  // Rafraîchit la seule bulle d'aide : la page derrière ne bouge pas.
  function majSavBulle(){
    var r = document.getElementById('sav-root');
    if(r) r.innerHTML = savBulleHtml();
  }

  // Un brouillon laissé de côté finit par ne plus rien vouloir dire : au-delà
  // d'une demi-heure sans y toucher, on repart de la page blanche plutôt que
  // de ressortir un début de phrase dont l'auteur ne se souvient plus.
  var SAV_PEREMPTION = 30 * 60 * 1000;
  function savPerimer(){
    var o = state.sav;
    if(!o.touche || !(o.texte || o.email)) return;
    if(Date.now() - o.touche < SAV_PEREMPTION) return;
    state.sav = Object.assign({}, o,
      { texte:'', email:'', type:null, grand:false, touche:0 });
    savBrouillonEcrire();
  }

  // Seul le contenu est gardé : ni l'ouverture de la bulle, ni son format,
  // qui n'ont pas à être restitués au chargement suivant.
  function savBrouillonEcrire(){
    try {
      var o = state.sav;
      if(!o.texte && !o.email){ localStorage.removeItem('freehub_sav_brouillon'); return; }
      localStorage.setItem('freehub_sav_brouillon', JSON.stringify(
        { texte:o.texte, email:o.email, type:o.type, touche:o.touche }));
    } catch(e){}
  }

  // Combien de réponses de l'équipe l'utilisateur n'a pas encore ouvertes.
  function savFilsNonLus(){
    return (state.savFils || []).reduce(function(n, f){
      return n + f.reponses.filter(function(r){ return r.admin && !r.lu; }).length;
    }, 0);
  }
  function savFilsCharger(){
    if(!state.compte) return;
    apiJson('GET', '/api/sav/fils').then(function(r){
      if(!r.ok || !r.data) return;
      state.savFils = r.data.fils || [];
      majSavBulle();
    });
  }
  // Ouvrir un fil vaut lecture : la pastille s'éteint sans geste supplémentaire.
  function savFilMarquerLu(id){
    var f = (state.savFils || []).filter(function(x){ return x.id === id; })[0];
    if(!f || !f.reponses.some(function(r){ return r.admin && !r.lu; })) return;
    f.reponses.forEach(function(r){ if(r.admin) r.lu = true; });
    apiJson('POST', '/api/sav/fil/vu', { id: id });
  }

  var SAV_LIB = { suggestion:'💡 Suggestion', bug:'🐛 Bug', question:'❓ Question' };

  function savFilsListeHtml(){
    return '<div class="bulle-choix">'
      + '<button type="button" class="bulle-retour" data-action="sav-fils-retour">'
        + '← Retour</button>'
      + (state.savFils || []).map(function(f){
          var nb = f.reponses.filter(function(r){ return r.admin && !r.lu; }).length;
          return '<button class="bulle-type" data-action="sav-fil-open" data-id="'+f.id+'">'
            + '<span class="bulle-type-i">'+(SAV_LIB[f.type] || '💬').slice(0, 2)+'</span>'
            + '<span><span class="bulle-type-l">'+esc(f.message.slice(0, 40))
              + (f.message.length > 40 ? '…' : '')
              + (nb ? ' <b class="bulle-nb">'+nb+'</b>' : '')+'</span>'
            + '<span class="bulle-type-d">'
              + (f.clos ? 'Échange clos' : f.reponses.length+' message'
                 + (f.reponses.length > 1 ? 's' : ''))+'</span></span>'
            + '<span class="bulle-type-f">→</span></button>';
        }).join('')
    + '</div>';
  }

  // Le fil vu par son auteur : son message, les réponses, et de quoi relancer
  // tant que l'équipe n'a pas clos l'échange.
  function savFilHtml(id){
    var f = (state.savFils || []).filter(function(x){ return x.id === id; })[0];
    if(!f) return '';
    var lignes = '<div class="bulle-fil-l moi"><span class="bulle-fil-qui">Toi</span>'
      + '<span class="bulle-fil-m">'+esc(f.message)+'</span></div>'
      + f.reponses.map(function(r){
          return '<div class="bulle-fil-l'+(r.admin ? ' eux' : ' moi')+'">'
            + '<span class="bulle-fil-qui">'+(r.admin ? 'FreeHub' : 'Toi')+'</span>'
            + '<span class="bulle-fil-m">'+esc(r.message)+'</span></div>';
        }).join('');
    return '<div class="bulle-fil">'
      + '<button type="button" class="bulle-retour" data-action="sav-fils-retour">'
        + '← Mes échanges</button>'
      + '<div class="bulle-fil-corps">'+lignes+'</div>'
      + (f.clos
          ? '<div class="bulle-fil-clos">Échange clos par l’équipe</div>'
          : '<form class="bulle-form" data-fil-form data-id="'+f.id+'">'
            + '<textarea data-fil-texte rows="3" maxlength="2000" required'
              + ' placeholder="Ta réponse…"></textarea>'
            + '<button type="submit" class="ch-envoi bulle-envoi">Répondre</button>'
          + '</form>')
    + '</div>';
  }

  function savBulleHtml(){
    if(state.tab === 'chat') return '';   // le salon a déjà sa conversation
    savPerimer();
    var o = state.sav;
    // Une icône dessinée, dans le trait de l'app - pas un emoji.
    var icone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
      + ' stroke-linecap="round" stroke-linejoin="round" width="22" height="22">'
      + '<path d="M20.5 11.8c0 3.9-3.8 7-8.5 7a10 10 0 0 1-2.6-.34L4.6 20l1.2-3.4'
      + 'A6.7 6.7 0 0 1 3.5 11.8c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>'
      + '<path d="M8.5 10.5h7M8.5 13.5h4"/></svg>';
    // Réponses de l'équipe pas encore lues : la pastille est le seul signal
    // qu'un échange attend, la bulle étant fermée la plupart du temps.
    var nonLus = savFilsNonLus();
    if(!o.ouvert){
      return '<button class="bulle-aide" data-action="sav-open" title="Un pépin, une idée ?">'
        + icone
        + (nonLus ? '<span class="bulle-pastille">'+nonLus+'</span>' : '')
        + '</button>';
    }
    var type = SAV_TYPES.filter(function(t){ return t.v === o.type; })[0] || null;
    var corps;
    if(o.envoye){
      // Une suggestion n'appelle pas de réponse : promettre un e-mail créerait
      // une attente qu'on ne tiendrait pas. Un bug ou une question, si.
      var merci = o.type === 'suggestion'
        ? '💡 Merci, c’est noté ! Ton idée part directement dans nos réflexions. '
          + 'Si on la retient, tu la verras arriver dans une prochaine mise à jour.'
        : '🙌 Bien reçu - merci ! On te répond '
          + (state.compte ? 'sur l’e-mail de ton compte' : 'sur l’adresse laissée')+'.';
      corps = '<div class="bulle-merci">'+merci
        + '<button class="btn-link" data-action="sav-encore">En envoyer un autre</button></div>';
    } else if(o.fil === 'liste'){
      corps = savFilsListeHtml();
    } else if(o.fil){
      corps = savFilHtml(o.fil);
    } else if(!type){
      var fils = (state.savFils || []);
      // D'abord dire de quoi il s'agit : la réponse arrive mieux rangée.
      corps = '<div class="bulle-choix">'
        + SAV_TYPES.map(function(t){
            return '<button class="bulle-type" data-action="sav-type" data-t="'+t.v+'">'
              + '<span class="bulle-type-i">'+t.ico+'</span>'
              + '<span><span class="bulle-type-l">'+t.l+'</span>'
              + '<span class="bulle-type-d">'+t.d+'</span></span>'
              + '<span class="bulle-type-f">→</span></button>';
          }).join('')
        // Les échanges en cours n'apparaissent que s'il y en a : pas d'entrée
        // morte dans le menu pour ceux qui n'ont jamais écrit.
        + (fils.length
            ? '<button class="bulle-type fils" data-action="sav-fils">'
              + '<span class="bulle-type-i">💬</span>'
              + '<span><span class="bulle-type-l">Mes échanges'
                + (nonLus ? ' <b class="bulle-nb">'+nonLus+'</b>' : '')+'</span>'
              + '<span class="bulle-type-d">'+fils.length+' demande'
                + (fils.length > 1 ? 's' : '')+' avec une réponse</span></span>'
              + '<span class="bulle-type-f">→</span></button>'
            : '')
      + '</div>';
    } else {
      corps = '<form class="bulle-form" data-sav-form>'
        + '<button type="button" class="bulle-retour" data-action="sav-type" data-t="">'
          + '← '+type.ico+' '+esc(type.l)+'</button>'
        + (state.compte ? ''
            : '<input type="email" data-sav-email placeholder="Ton e-mail pour la réponse"'
              + ' value="'+esc(o.email || '')+'" required>')
        + '<textarea data-sav-texte rows="'+(o.grand ? 12 : 4)+'" maxlength="2000" required'
          + ' placeholder="'
          + (o.type === 'bug' ? 'Qu’est-ce qui coince, et à quel endroit ?'
             : o.type === 'suggestion' ? 'Raconte ton idée…' : 'Dis-nous tout…')+'">'
          + esc(o.texte || '') + '</textarea>'
        + (o.erreur ? '<div class="bulle-erreur">'+esc(o.erreur)+'</div>' : '')
        + '<button type="submit" class="ch-envoi bulle-envoi"'
          + (o.envoi ? ' disabled' : '')+'>'+(o.envoi ? 'Envoi…' : 'Envoyer')+'</button>'
      + '</form>';
    }
    // Agrandir n'a de sens que devant le formulaire : ni sur le choix du type,
    // ni sur le remerciement.
    var agrandir = (type && !o.envoye)
      ? '<button class="bulle-agrandir" data-action="sav-grand"'
        + ' title="'+(o.grand ? 'Réduire' : 'Agrandir')+'"'
        + ' aria-label="'+(o.grand ? 'Réduire' : 'Agrandir')+'">'
        + (o.grand ? '⤡' : '⤢') + '</button>'
      : '';
    return '<div class="bulle-panneau'+(o.grand ? ' grand' : '')+'">'
      + '<div class="bulle-tete">'
        + '<div class="bulle-t">Un pépin, une idée&nbsp;?</div>'
        + '<div class="bulle-s">Retour sur l’alpha, question, bug : ça arrive direct chez Louis</div>'
        + agrandir
        + '<button class="cat-x" data-action="sav-close" aria-label="Fermer">✕</button>'
      + '</div>'
      + corps
    + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Entraide - le seul écran où l'on croise d'autres membres
  // ---------------------------------------------------------------------------
  // Volontairement simple pour l'alpha : un fil unique, rafraîchi par sondage
  // pendant qu'on est sur l'onglet. Pas de temps réel, pas de fils multiples :
  // on veut d'abord mesurer l'usage et la charge de modération.

  var CHAT_INTERVALLE = 6000;   // ms entre deux relevés
  var chatTimer = null;

  // Le rang du badge porté colore le nom : c'est ce qui rend la progression
  // visible par les autres, et donc désirable.
  function chatRang(auteur){
    if(!auteur || !auteur.badge) return null;
    var b = badge(auteur.badge);
    return b && b.rang ? b.rang : null;
  }

  function chatAuteurHtml(a){
    var rang = chatRang(a);
    // Les deux échelles ont chacune leur palette : un doré « collection » ne
    // se confond pas avec un palier de parcours.
    var fam = a.badge && BADGES_PALIERS.indexOf(a.badge) >= 0 ? ' fam-parcours' : '';
    return '<span class="ch-auteur'+(rang ? ' rang-'+rang+fam : '')+'">'
      + esc(a.nom || 'Membre')
      + (a.mercis ? '<span class="ch-mercis" title="Mercis reçus dans l’Entraide">🙏 '
          + a.mercis+'</span>' : '')
      + (a.admin ? '<span class="ch-role admin">Admin</span>' : '')
    + '</span>';
  }

  // Cinq réactions possibles, pas le clavier entier : des gestes, pas du bruit.
  var CHAT_EMOJIS = ['👍', '👎', '🙏', '❤️', '🔥'];

  function chatReactionsHtml(m){
    if(m.supprime || !(m.reactions || []).length) return '';
    var pastilles = m.reactions.map(function(x){
      return '<button class="ch-react'+(x.moi ? ' moi' : '')+'"'
        + (state.compte ? ' data-action="chat-react" data-id="'+m.id+'" data-e="'+x.e+'"'
                        : ' disabled')
        + ' title="'+esc((x.qui || []).join(', '))+'">'+x.e
        + '<span class="ch-react-n">'+x.n+'</span></button>';
    }).join('');
    return '<div class="ch-reacts">'+pastilles+'</div>';
  }

  // La barre de réactions : une pastille de verre qui se pose sur le message
  // au survol - les cinq gestes, celui déjà posé marqué.
  function chatPopHtml(m){
    if(m.supprime || !state.compte) return '';
    var mienne = null;
    (m.reactions || []).forEach(function(x){ if(x.moi) mienne = x.e; });
    return '<div class="ch-pop">'+CHAT_EMOJIS.map(function(e2){
      return '<button class="ch-pop-e'+(mienne === e2 ? ' on' : '')+'"'
        + ' data-action="chat-react" data-id="'+m.id+'" data-e="'+e2+'">'+e2+'</button>';
    }).join('')+'</div>';
  }

  function chatHeure(iso){
    var d = new Date(iso);
    if(isNaN(d)) return '';
    var auj = new Date();
    var memeJour = d.toDateString() === auj.toDateString();
    return memeJour
      ? d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
      : d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
        + ' · ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }

  // Avatar : la photo du profil si le membre en a une, sinon ses initiales sur
  // une couleur stable dérivée du nom - chacun garde la sienne.
  var CH_AV_COULEURS = ['#2f6bff', '#7c3aed', '#0f9d6e', '#b45309', '#e11d48', '#0891b2'];
  // Les photos (data URL) pèsent lourd : on ne les demande qu'une fois par
  // auteur, puis chaque relevé passe en mode léger. C'est ce qui fluidifie.
  var chatAvatars = {};
  function chatAvatarHtml(a){
    var av;
    if(a && a.photo){
      av = '<span class="ch-av"><img src="'+esc(a.photo)+'" alt=""></span>';
    } else {
      var nom = (a && a.nom) || 'M';
      var h = 0;
      for(var i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) % 997;
      var c = CH_AV_COULEURS[h % CH_AV_COULEURS.length];
      av = '<span class="ch-av" style="background:'+c+'">'
        + esc(nom.charAt(0).toUpperCase())+'</span>';
    }
    // Le badge porté vit dans une petite bulle accolée à la photo.
    var b = a && a.badge ? badge(a.badge) : null;
    return '<span class="ch-avw">'+av
      + (b ? '<span class="ch-av-badge" title="'+esc(b.t)+'">'+b.ico+'</span>' : '')
    + '</span>';
  }

  // ---------------------------------------------------------------------------
  // Score de sérénité - un seul chiffre qui résume « où j'en suis »
  // ---------------------------------------------------------------------------
  // Deux moitiés : le ressenti (ce que la personne déclare à l'onboarding) et
  // le concret (ce qu'elle a réellement mis en place). Le ressenti se répare en
  // agissant : c'est tout l'intérêt de le mesurer au départ.
  // Quatre questions courtes : une par peur identifiée. Pas de sous-texte, le
  // curseur et ses deux extrémités suffisent à se situer.
  var SERENITE_Q = [
    { id:'confiance', q:'L’administratif, tu le vis comment ?',
      bas:'Je subis', haut:'Je maîtrise' },
    { id:'charge', q:'Ça t’occupe l’esprit…',
      bas:'Tout le temps', haut:'Jamais' },
    { id:'apprehension', q:'L’administratif français, ça t’angoisse ?',
      bas:'Ça me bloque', haut:'Pas du tout' },
    { id:'dates', q:'Tes prochaines échéances déclaratives, tu les connais ?',
      bas:'Aucune idée', haut:'Toutes' },
  ];

  // Ce que la plateforme sait, sans rien demander.
  function serenitePreuves(){
    var p = state.profil;
    var secs = sectionsProfil();
    var faits = secs.reduce(function(a, x){ return a + x.faits; }, 0);
    var totalCh = secs.reduce(function(a, x){ return a + x.total; }, 0);
    var pctProfil = totalCh ? Math.round(faits / totalCh * 100) : 0;
    var objPris = state.added.length;
    var etapesFaites = Object.keys(state.checks || {}).filter(function(k){
      return state.checks[k]; }).length;
    var periodicite = !!(p.periodeUrssaf || p.periodeTva);
    var rappels = !!(state.notif.choix && Object.keys(state.notif.choix)
      .some(function(k){ return state.notif.choix[k]; }));

    return [
      { id:'profil', l:'Ton profil est renseigné', pct:pctProfil, poids:10,
        aide:'Chaque champ rend tes simulateurs plus justes' },
      { id:'objectifs', l:'Tu as pris des parcours en main',
        pct:Math.min(100, objPris * 34), poids:10,
        aide:'Trois parcours suffisent à couvrir l’essentiel' },
      { id:'etapes', l:'Tu avances concrètement',
        pct:Math.min(100, etapesFaites * 10), poids:10,
        aide:'Chaque étape cochée, c’est une chose de réglée' },
      { id:'dates', l:'Tes échéances sont dans ton calendrier',
        pct:periodicite ? 100 : 0, poids:10,
        aide:'Renseigne ta périodicité de déclaration dans ton profil' },
      { id:'rappels', l:'Tu es prévenu avant chaque date',
        pct:rappels ? 100 : 0, poids:10,
        aide:'Active les rappels par e-mail dans ton profil' },
    ];
  }

  // Le score : 50 % de ressenti déclaré, 50 % de preuves d'usage.
  function serenite(){
    var r = state.serenite.reponses || {};
    var repondu = SERENITE_Q.filter(function(q){ return r[q.id] != null; });
    // Sans questionnaire, on note uniquement le concret (sur 100).
    var preuves = serenitePreuves();
    var poidsTotal = preuves.reduce(function(a, x){ return a + x.poids; }, 0);
    var concret = preuves.reduce(function(a, x){ return a + x.pct * x.poids; }, 0) / poidsTotal;

    if(!repondu.length){
      return { score:Math.round(concret), concret:Math.round(concret),
               ressenti:null, preuves:preuves, repondu:false };
    }
    var ressenti = repondu.reduce(function(a, q){ return a + (r[q.id] - 1) / 9 * 100; }, 0)
                 / repondu.length;
    return { score:Math.round(ressenti * 0.5 + concret * 0.5),
             concret:Math.round(concret), ressenti:Math.round(ressenti),
             preuves:preuves, repondu:true };
  }

  // La carte de l'accueil : le chiffre, la jauge, et ce qui le ferait monter.
  // `rail` : version étroite pour la colonne de droite de l'accueil. Même
  // contenu, la mise en page passe en colonne (voir .ser.rail dans le CSS).
  function sereniteCarteHtml(rail){
    var s = serenite();
    var n = sereniteNiveau(s.score);
    // On ne montre que les leviers non acquis : une liste de choses à faire,
    // pas un tableau de bord de plus.
    var leviers = s.preuves.filter(function(x){ return x.pct < 100; })
      .sort(function(a, b){ return a.pct - b.pct; }).slice(0, 3);

    return '<div class="ser'+(rail ? ' rail' : '')+'" style="--c:'+n.c+'">'
      + '<div class="ser-h">'
        + '<div class="ser-jauge">'+anneauSection(s.score, n.c, rail ? 84 : 96, true)+'</div>'
        + '<div class="ser-x">'
          + '<div class="ser-k">Ton score de sérénité</div>'
          + '<div class="ser-t">'+n.em+' '+n.l+'</div>'
          + '<div class="ser-d">'
            + (s.repondu
                ? 'Moitié ce que tu ressens, moitié ce que tu as mis en place.'
                : 'Calculé sur ce que tu as mis en place. Réponds à 4 questions pour l’affiner.')
          + '</div>'
          + (s.repondu ? '' : '<button class="ser-cta" data-action="serenite-quiz">'
              + 'Répondre aux 4 questions →</button>')
        + '</div>'
        + '<button class="ser-plus" data-action="serenite-detail">'
          + (state.serenite.detail ? 'Masquer' : 'Ce qui le ferait monter')+'</button>'
      + '</div>'
      + (state.serenite.detail
          ? '<div class="ser-liste">' + leviers.map(function(l){
              return '<div class="ser-l">'
                + '<div class="ser-l-x"><span class="ser-l-t">'+esc(l.l)+'</span>'
                  + '<span class="ser-l-d">'+esc(l.aide)+'</span></div>'
                + '<span class="ser-l-p">'+l.pct+' %</span>'
              + '</div>'; }).join('')
            + (leviers.length ? '' : '<div class="ser-l"><div class="ser-l-x">'
                + '<span class="ser-l-t">Tout est en place, bravo</span></div></div>')
          + '</div>'
          : '')
    + '</div>';
  }

  function sereniteNiveau(s){
    if(s >= 80) return { l:'Serein', c:'#0f9d6e', em:'😌' };
    if(s >= 60) return { l:'Sur de bons rails', c:'#2563eb', em:'🙂' };
    if(s >= 40) return { l:'En chemin', c:'#b45309', em:'😐' };
    if(s >= 20) return { l:'Encore flou', c:'#c2410c', em:'😕' };
    return { l:'Dans le brouillard', c:'#b91c1c', em:'😰' };
  }

  // ---------------------------------------------------------------------------
  // Thème clair / sombre
  // ---------------------------------------------------------------------------
  // Le choix explicite prime ; sans choix, on suit le réglage du système.
  function appliquerTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t === 'sombre' ? '#0b1220' : '#f4f6fa');
  }

  function initTheme(){
    var choix = null;
    try { choix = localStorage.getItem('freehub_theme'); } catch(e){}
    if(!choix){
      var sombreSysteme = window.matchMedia
        && window.matchMedia('(prefers-color-scheme: dark)').matches;
      choix = sombreSysteme ? 'sombre' : 'clair';
    }
    appliquerTheme(choix);
  }

  // Le seuil où la barre latérale devient un tiroir (aligné sur app.css).
  function surMobile(){
    try { return window.matchMedia('(max-width:860px)').matches; } catch(e){ return false; }
  }

  // La saisie est une pilule tant qu'elle tient sur une ligne ; au-delà elle
  // s'arrondit en carte, sinon les coins ronds mangent le texte.
  function majFormeSaisie(champ){
    if(!champ) return;
    champ.classList.toggle('multi', champ.scrollHeight > 56);
  }

  function chatMessageHtml(m, c, dansAparte){
    // Un message retiré ne laisse qu'une trace discrète, pour tout le monde.
    if(m.supprime){
      return '<div class="ch-msg efface"><span class="ch-efface">'
        + (m.moi ? 'Tu as retiré ce message' : 'Message retiré')+'</span></div>';
    }
    // Un partage d'objectif bouclé : on le fête visuellement, et on n'y ouvre
    // pas de discussion — ce n'est pas un sujet, c'est une bonne nouvelle.
    var celebration = m.contenu.indexOf('🎉 Je viens de boucler «') === 0;
    var actions = ''
      + (!dansAparte && !celebration && state.compte && state.chat.fil !== m.id
          ? '<button class="ch-act" data-action="chat-aparte" data-id="'+m.id+'">Aparté</button>'
          : '')
      + (state.compte && !m.moi && !m.signale
          ? '<button class="ch-act" data-action="chat-signaler" data-id="'+m.id+'">Signaler</button>'
          : '')
      + (c.admin
          ? '<button class="ch-act sup" data-action="chat-supprimer" data-id="'+m.id+'">Retirer</button>'
          : '')
      + (c.admin && !m.moi && m.auteur.id
          ? '<button class="ch-act sup" data-action="chat-muet" data-id="'+m.auteur.id+'">Silence 24 h</button>'
          : '');
    return '<div class="ch-msg'+(m.moi ? ' moi' : '')+(celebration ? ' celebration' : '')+'">'
      + chatAvatarHtml(m.auteur)
      + '<div class="ch-bulle">'
        + '<div class="ch-tete">'+chatAuteurHtml(m.auteur)
          + '<span class="ch-h">'+chatHeure(m.created)+'</span>'
          + (m.signale ? '<span class="ch-tag signale">signalé</span>' : '')
        + '</div>'
        + '<div class="ch-txt">'+esc(m.contenu).replace(/\n/g, '<br>')+'</div>'
        + '<div class="ch-pied">'
          + (!dansAparte && !celebration && m.nbReponses
              ? '<button class="ch-fil-n" data-action="chat-aparte" data-id="'+m.id+'">'
                + '💬 Aparté ouvert · '+m.nbReponses+' message'+(m.nbReponses>1?'s':'')
                + ' <span class="ch-fil-go">'+(state.chat.fil === m.id ? 'fermer ×' : 'rejoindre →')
                + '</span></button>'
              : '')
          + chatReactionsHtml(m)
          // En bas à droite : la barre de réactions occupe le haut, les deux
          // ne se marchent plus dessus.
          + (actions ? '<span class="ch-survol">'+actions+'</span>' : '')
        + '</div>'
      + '</div>'
      + chatPopHtml(m)
    + '</div>';
  }

  // Un squelette plutôt qu'un « Chargement… » : la forme de ce qui arrive est
  // déjà là, l'attente paraît plus courte et rien ne saute au remplissage.
  function squeletteFilHtml(){
    return [72, 54, 88, 46, 64].map(function(l, i){
      return '<div class="sq-msg">'
        + '<span class="sq sq-av"></span>'
        + '<span class="sq-x"><span class="sq sq-n"></span>'
          + '<span class="sq sq-b" style="width:'+l+'%"></span></span>'
      + '</div>';
    }).join('');
  }

  function chatMessagesHtml(){
    var c = state.chat;
    if(c.erreur && !c.messages.length) return '<div class="ch-info erreur">'+esc(c.erreur)+'</div>';
    if(!c.charge) return squeletteFilHtml();
    if(!c.messages.length){
      return '<div class="ch-vide">'
        + '<img src="assets/illus/en-route.svg" alt="" class="illu-img">'
        + '<div class="obj-vide-t">Personne n’a encore écrit</div>'
        + '<div class="obj-vide-d">Lance-toi : une question, un retour d’expérience, '
          + 'un bon plan qui t’a servi</div>'
      + '</div>';
    }
    return c.messages.map(function(m){ return chatMessageHtml(m, c, false); }).join('');
  }

  // Le panneau d'aparté : le message d'origine, ses réponses, et sa saisie.
  function chatAparteHtml(){
    var c = state.chat;
    if(!c.fil) return '';
    var liste = c.filMessages || [];
    var corps = !c.filCharge
      ? '<div class="ch-info">Chargement…</div>'
      : liste.map(function(m, i){
          return chatMessageHtml(m, c, true) + (i === 0 && liste.length
            ? '<div class="ch-ap-sep">Les réponses</div>' : '');
        }).join('')
        + (liste.length <= 1
            ? '<div class="ch-ap-vide">Personne n’a encore répondu - à toi d’ouvrir</div>' : '');
    return '<aside class="ch-aparte">'
      + '<div class="ch-ap-tete">'
        + '<div class="ch-ap-t">Aparté</div>'
        + '<div class="ch-ap-s">Un fil à part, pour creuser sans envahir le salon</div>'
        + '<button class="cat-x" data-action="chat-aparte-close" aria-label="Fermer">✕</button>'
      + '</div>'
      + '<div class="ch-ap-fil" data-chat-fil-b>'+corps+'</div>'
      + (c.filErreur ? '<div class="ch-alerte ap">'+esc(c.filErreur)+'</div>' : '')
      + (c.filClos
          ? '<div class="ch-ap-clos">Aparté clôturé : plus personne n’y a écrit '
            + 'depuis 24 h</div>'
          : (state.compte && !c.muet
              ? '<form class="ch-form ap" data-chat-form-fil>'
                + '<textarea data-chat-fil-input rows="1" maxlength="800"'
                  + ' placeholder="Répondre dans l’aparté…"></textarea>'
                + '<button type="submit" class="ch-envoi" aria-label="Envoyer"'
                  + ' title="Envoyer">➤</button>'
              + '</form>'
              : ''))
    + '</aside>';
  }

  // La question de la semaine : épinglée au-dessus du fil, un clic pour voter.
  function chatSondageHtml(){
    var c = state.chat, sg = c.sondage;
    var formAdmin = c.admin && state.sondageForm
      ? '<form class="sond-form" data-sondage-form>'
        + '<input type="text" data-sond-q maxlength="140" placeholder="La question de la semaine…">'
        + '<input type="text" data-sond-o maxlength="40" placeholder="Réponse 1">'
        + '<input type="text" data-sond-o maxlength="40" placeholder="Réponse 2">'
        + '<input type="text" data-sond-o maxlength="40" placeholder="Réponse 3 (optionnelle)">'
        + '<input type="text" data-sond-o maxlength="40" placeholder="Réponse 4 (optionnelle)">'
        + '<button type="submit" class="ch-envoi">Épingler la question</button>'
      + '</form>' : '';
    if(!sg){
      return c.admin
        ? '<div class="sond vide">'
          + '<button class="btn-link" data-action="sondage-form">📊 Poser la question de la semaine</button>'
          + formAdmin + '</div>'
        : '';
    }
    // Replié par défaut : une ligne au-dessus du fil, pas un pavé.
    if(!state.sondageOuvert){
      // Sur mobile, la question elle-même attend le dépliage : la ligne se
      // réduit à une invitation, et le fil récupère la hauteur gagnée.
      var titreReplie = surMobile()
        ? '<span class="sond-q">La question de la semaine</span>'
        : '<span class="sond-q">'+esc(sg.question)+'</span>';
      return '<div class="sond plie" data-action="sondage-deplier" role="button">'
        + '<div class="sond-h"><span class="sond-pic">📊</span>'
          + titreReplie
          + '<span class="sond-t">'+sg.total+' vote'+(sg.total>1?'s':'')+'</span>'
          + '<span class="sond-dep">'+(sg.mien !== null && sg.mien !== undefined
              ? 'voir ▾' : 'voter ▾')+'</span>'
        + '</div>'
      + '</div>';
    }
    var aVote = sg.mien !== null && sg.mien !== undefined;
    var lignes = sg.options.map(function(opt, i){
      var n = sg.votes[i] || 0;
      var pct = sg.total ? Math.round(n / sg.total * 100) : 0;
      if(aVote || !state.compte){
        return '<div class="sond-l'+(sg.mien === i ? ' mien' : '')+'"'
          + (state.compte ? ' data-action="sondage-voter" data-i="'+i+'" role="button"' : '')+'>'
          + '<i style="width:'+pct+'%"></i>'
          + '<span class="sond-o">'+esc(opt)+(sg.mien === i ? ' ✓' : '')+'</span>'
          + '<span class="sond-n">'+pct+'%</span>'
        + '</div>';
      }
      return '<button class="sond-b" data-action="sondage-voter" data-i="'+i+'">'
        + esc(opt)+'</button>';
    }).join('');
    return '<div class="sond">'
      + '<div class="sond-h"><span class="sond-pic">📊</span>'
        + '<span class="sond-q">'+esc(sg.question)+'</span>'
        + '<span class="sond-t">'+sg.total+' vote'+(sg.total>1?'s':'')+'</span>'
        + (c.admin ? '<button class="ch-act sup" data-action="sondage-clore">Clore</button>' : '')
        + '<button class="sond-dep" data-action="sondage-deplier">replier ▴</button>'
      + '</div>'
      + '<div class="sond-corps">'+lignes+'</div>'
    + '</div>';
  }

  function chatHtml(){
    var c = state.chat;
    var muet = c.muet
      ? '<div class="ch-muet">Tu ne peux plus écrire pour le moment. '
        + 'Tu peux continuer à lire le fil.</div>'
      : '';

    // Le titre, les compteurs et la modération vivent maintenant dans la barre
    // de titre (titreOutilsHtml) : tout l'espace vertical revient au fil.
    return '<div class="view view-chat">'
      + '<div class="ch-corps'+(c.fil ? ' avec-aparte' : '')+'">'
        + '<div class="ch-principal">'
          + chatSondageHtml()
          + '<div class="ch-fil" data-chat-fil>'+chatMessagesHtml()+'</div>'
          + (c.erreur && c.messages.length ? '<div class="ch-alerte">'+esc(c.erreur)+'</div>' : '')
          + muet
          + '<form class="ch-form" data-chat-form'+(c.muet ? ' data-inactif' : '')+'>'
            + '<textarea data-chat-input rows="1" maxlength="800"'+(c.muet ? ' disabled' : '')
              + ' placeholder="'+(surMobile() ? 'Ta question…' : 'Une question, un retour d’expérience…')
              + '"></textarea>'
            + '<button type="submit" class="ch-envoi"'+(c.muet ? ' disabled' : '')
              + ' aria-label="Envoyer" title="Envoyer">➤</button>'
          + '</form>'
        + '</div>'
        + chatAparteHtml()
      + '</div>'
      // Les règles sont masquées sur mobile (CSS) : la charte d'accueil les a
      // déjà données, et l'espace vertical est précieux.
      + '<div class="ch-regles">Les messages sont publics et visibles par tous les membres. '
        + 'La modération peut retirer un message ou suspendre l’accès à l’écriture</div>'
      + '</div>';
  }

  // --- Réseau -----------------------------------------------------------------
  function chatCharger(silencieux){
    // On recharge toujours la fenêtre complète : les réactions et les retraits
    // touchent d'anciens messages, qu'un chargement incrémental ne verrait pas.
    // Mode léger dès qu'on connaît déjà les visages du fil.
    var leger = state.chat.charge ? '?leger=1' : '';
    var appels = [apiJson('GET', '/api/chat' + leger)];
    if(state.chat.fil) appels.push(apiJson('GET', '/api/chat?fil=' + state.chat.fil
      + (leger ? '&leger=1' : '')));
    Promise.all(appels).then(function(reps){
      var r = reps[0], rf = reps[1] || null;
      if(!r.ok){
        if(!silencieux) setState({ chat: Object.assign({}, state.chat,
          { charge:true, erreur:'Le fil n’a pas pu être chargé.' }) });
        return;
      }
      var neufs = r.data.messages || [];
      var filMsgs = rf && rf.ok ? (rf.data.messages || []) : state.chat.filMessages;
      // Mémorise les photos reçues, réinjecte celles déjà connues.
      neufs.concat(filMsgs).forEach(function(m){
        var a2 = m.auteur || {};
        if(a2.photo && a2.id) chatAvatars[a2.id] = a2.photo;
        else if(a2.id && chatAvatars[a2.id]) a2.photo = chatAvatars[a2.id];
      });
      // Rien n'a bougé ? On ne re-rend pas : c'est ce re-rendu périodique qui
      // vidait le champ de saisie en pleine frappe.
      var empreinte = JSON.stringify([neufs, filMsgs, r.data.muet || null,
        !!r.data.admin, r.data.enLigne, r.data.total,
        rf && rf.ok ? !!rf.data.clos : null, r.data.sondage || null]);
      if(state.chat.charge && empreinte === state.chat.empreinte) return;

      var dernierAvant = state.chat.messages.length
        ? state.chat.messages[state.chat.messages.length - 1].id : 0;
      var c = Object.assign({}, state.chat, {
        charge:true, erreur:null, messages:neufs, empreinte:empreinte,
        muet:r.data.muet || null, admin:!!r.data.admin,
        enLigne:r.data.enLigne || 0, total:r.data.total || 0,
        filMessages:filMsgs, filCharge:!!(rf && rf.ok) || state.chat.filCharge,
        filClos: rf && rf.ok ? !!rf.data.clos : state.chat.filClos,
        sondage: r.data.sondage || null,
        mesMercis: r.data.mesMercis || 0,
        nbSignales: neufs.filter(function(m){ return m.signale && !m.supprime; }).length,
      });
      // Le compteur se recalcule depuis le dernier message lu, mémorisé entre
      // les sessions : il tient donc dès le premier chargement, sans attendre
      // qu'on soit passé une fois sur l'onglet. Ses propres messages ne
      // comptent pas — on ne se notifie pas soi-même.
      if(state.tab !== 'chat'){
        var lu = chatDernierLu();
        c.nonLus = lu
          ? neufs.filter(function(m){
              return m.id > lu && !m.moi && !m.supprime;
            }).length
          : 0;
      }
      var enBas = chatEnBas();
      // Sur l'écran Entraide, on ne repasse pas par un rendu complet : on
      // remplace uniquement le fil et les compteurs. Sinon toute la page
      // clignote à chaque message envoyé ou reçu.
      var filDom = state.tab === 'chat' && document.querySelector('[data-chat-fil]');
      if(filDom){
        state.chat = c;
        majFilChat();
      } else {
        setState({ chat: c });
      }
      // chatDefilerFin plutôt qu'un simple chatDefiler : la hauteur du fil bouge
      // encore après ce rendu (sondage, aparté, emojis), et un unique
      // défilement laissait les derniers messages à moitié sous le bord.
      if(state.tab === 'chat' && (enBas || !dernierAvant)) chatDefilerFin();
      // Lu sur place : tant qu'on est sur l'Entraide, ce qui arrive est vu.
      if(state.tab === 'chat') chatMarquerLu();
    });
  }

  // Rafraîchissement ciblé de l'Entraide : le fil, l'aparté, le sondage et les
  // compteurs. Ni la saisie ni le reste de la page ne sont touchés.
  function majFilChat(){
    // Le sondage vit AU-DESSUS du fil : quand il apparaît ou change de taille,
    // il rogne la hauteur du fil et fait remonter les derniers messages hors
    // de vue. On note donc où l'on était avant de toucher à quoi que ce soit.
    var etaitEnBas = chatEnBas();
    var fil = document.querySelector('[data-chat-fil]');
    if(fil) fil.innerHTML = chatMessagesHtml();

    var sond = document.querySelector('.sond');
    var neufSond = chatSondageHtml();
    if(sond && neufSond) sond.outerHTML = neufSond;
    if(etaitEnBas) chatDefilerFin();

    var ap = document.querySelector('.ch-aparte');
    var neufAp = chatAparteHtml();
    if(ap && neufAp){
      // On ne remplace que le contenu : remplacer le panneau ferait perdre le
      // focus de la zone de réponse.
      var tmp = document.createElement('div');
      tmp.innerHTML = neufAp;
      var filAp = ap.querySelector('.ch-ap-fil');
      var filAp2 = tmp.querySelector('.ch-ap-fil');
      if(filAp && filAp2) filAp.innerHTML = filAp2.innerHTML;
    } else if(ap && !neufAp){
      ap.remove();
    }

    var stats = document.querySelector('.ptitre-stats');
    if(stats){
      stats.innerHTML = '<span class="ch-stat"><span class="ch-stat-pt"></span>'
        + (state.chat.enLigne || 0)+' en ligne</span>'
        + '<span class="ch-stat-sep">·</span>'
        + '<span class="ch-stat">'+(state.chat.total || 0)+' membre'
        + ((state.chat.total||0) > 1 ? 's' : '')+'</span>';
    }
    var modN = document.querySelector('.ch-mod .ch-mod-n');
    if(modN) modN.textContent = state.chat.nbSignales || '';
  }

  function chatEnBas(){
    var f = document.querySelector('[data-chat-fil]');
    if(!f) return true;
    return f.scrollHeight - f.scrollTop - f.clientHeight < 80;
  }
  function chatDefiler(){
    var f = document.querySelector('[data-chat-fil]');
    if(f) f.scrollTop = f.scrollHeight;
  }
  // À l'arrivée sur l'Entraide, un seul défilement ne suffit pas. Le sondage
  // s'insère AU-DESSUS du fil une fois chargé et lui prend une soixantaine de
  // pixels de hauteur ; le fil, lui, garde son scrollTop, et les derniers
  // messages passent sous le bord. Deviner le bon délai est un pari perdu : on
  // observe la taille du fil et on le recolle en bas tant qu'elle bouge.
  var chatColleJusqua = 0;
  var chatObs = null;
  function chatDefilerFin(){
    chatColleJusqua = Date.now() + 1500;
    chatDefiler();
    var f = document.querySelector('[data-chat-fil]');
    if(!f || typeof ResizeObserver === 'undefined'){
      // Pas d'observateur disponible : on retombe sur quelques relances.
      setTimeout(chatDefiler, 60);
      setTimeout(chatDefiler, 300);
      setTimeout(chatDefiler, 800);
      return;
    }
    if(!chatObs){
      chatObs = new ResizeObserver(function(){
        if(Date.now() < chatColleJusqua) chatDefiler();
      });
    }
    chatObs.disconnect();
    chatObs.observe(f);
    requestAnimationFrame(chatDefiler);
    setTimeout(chatDefiler, 300);
  }

  // Le sondage ne tourne QUE sur l'onglet entraide : inutile de solliciter le
  // serveur pendant qu'on remplit un simulateur.
  function chatSondage(){
    if(chatTimer){ clearInterval(chatTimer); chatTimer = null; }
    if(state.tab !== 'chat') return;
    chatTimer = setInterval(function(){ chatCharger(true); }, CHAT_INTERVALLE);
  }

  // Veille hors de l'Entraide : sans elle, le chat n'était jamais chargé tant
  // qu'on n'ouvrait pas l'onglet — donc pas de compteur de messages non lus, et
  // un sondage qui n'apparaissait qu'après coup en arrivant sur la page.
  // Rythme volontairement lent : on cherche à signaler, pas à suivre en direct.
  var CHAT_VEILLE = 90000;
  var chatVeilleTimer = null;
  function chatVeille(){
    if(chatVeilleTimer) return;
    chatVeilleTimer = setInterval(function(){
      if(state.tab !== 'chat' && document.visibilityState === 'visible') chatCharger(true);
    }, CHAT_VEILLE);
  }

  // Le dernier message lu survit au rechargement : sans ça, le compteur
  // repartait de zéro à chaque visite et ne signalait plus rien.
  function chatDernierLu(){
    try { return parseInt(localStorage.getItem('freehub_chat_lu'), 10) || 0; } catch(e){ return 0; }
  }
  function chatMarquerLu(){
    var m = state.chat.messages || [];
    if(!m.length) return;
    try { localStorage.setItem('freehub_chat_lu', String(m[m.length - 1].id)); } catch(e){}
  }

  function chatEnvoyer(texte, fil){
    texte = (texte || '').trim();
    if(!texte) return;
    var corps = fil ? { contenu: texte, fil: fil } : { contenu: texte };
    apiJson('POST', '/api/chat', corps).then(function(r){
      if(!r.ok){
        var msg = (r.data && r.data.error) || 'Envoi impossible.';
        // L'erreur s'affiche là où on vient d'écrire, pas ailleurs.
        setState({ chat: Object.assign({}, state.chat,
          fil ? { filErreur: msg } : { erreur: msg }) });
        return;
      }
      if(fil){
        state.chat = Object.assign({}, state.chat, { filErreur: null });
      }
      chatCharger(true);
    });
  }

  // ---------------------------------------------------------------------------
  // Lexique
  // ---------------------------------------------------------------------------
  function estEpingle(id){ return state.lexEpingles.indexOf(id) >= 0; }

  function lexCarteHtml(x){
    var d = DOMAINES[x.cat] || DOMAINES.administratif;
    var on = estEpingle(x.id);
    return '<div class="lx" style="--c:'+d.c+';--s:'+d.soft+'" data-action="lex-open" data-id="'+x.id+'">'
      + '<button class="lx-pin'+(on?' on':'')+'" data-action="lex-pin" data-id="'+x.id+'"'
        + ' title="'+(on?'Retirer de mon lexique':'Ajouter à mon lexique')+'">'+(on?'★':'☆')+'</button>'
      + '<div class="lx-cat" style="color:'+d.c+'">'+esc(d.l)+'</div>'
      + '<div class="lx-t">'+esc(x.t)+'</div>'
      + '<div class="lx-c">'+esc(x.court)+'</div>'
      + '</div>';
  }

  // Termes suggérés : ceux qui touchent aux domaines des objectifs pris, et au
  // statut déclaré. On propose au lieu de tout déverser.
  // Chaque objectif appelle deux ou trois mots précis - pas son domaine entier.
  // C'est cette carte qui rend la suggestion personnelle : un utilisateur qui a
  // tout épinglé n'a simplement plus rien à se voir proposer.
  var LEX_PAR_OBJECTIF = {
    'creer-ae':             ['micro', 'siret', 'guichet'],
    'obligations-creation': ['cfe', 'cotisations', 'siret'],
    'statut':               ['eurl', 'sasu', 'tns', 'assimile'],
    'creer-societe':        ['kbis', 'is', 'guichet'],
    'cfe':                  ['cfe'],
    'tva-comprendre':       ['franchise', 'tva-collectee', 'tva-deductible'],
    'tva-passer':           ['franchise', 'tva-intra', 'client-recup'],
    'vfl':                  ['vfl', 'rfr', 'bareme'],
    'mes-papiers':          ['kbis', 'siret'],
    'compte-pro':           ['siret', 'tresorerie'],
    'piloter':              ['deductible', 'amortissement', 'dividendes'],
    'domicilier':           ['domiciliation', 'kbis'],
    'facture-elec':         ['tva-collectee', 'autoliquidation'],
    'facturer-etranger':    ['tva-intra', 'autoliquidation', 'client-recup'],
    'urssaf-1':             ['cotisations', 'abattement'],
    'impot-ae':             ['abattement', 'ir', 'bareme', 'quotient'],
    'impot-societe':        ['is', 'dividendes', 'quotepart'],
    'droits-independant':   ['tns', 'assimile', 'acre'],
    'embaucher-alternant':  ['dpae'],
    'revenu-regulier':      ['dividendes', 'tresorerie', 'cotisations'],
  };
  var LEX_PAR_STATUT = {
    micro:   ['micro', 'abattement', 'franchise'],
    societe: ['is', 'pfu', 'assimile'],
  };

  function lexSuggestions(n){
    var vus = {}, ordre = [];
    var pousser = function(id){
      if(!vus[id] && terme(id) && !estEpingle(id)){ vus[id] = 1; ordre.push(id); }
    };
    // D'abord les objectifs mis en avant, puis les autres en cours.
    state.avant.concat(state.added).forEach(function(oid){
      if(etatObjectif(oid) === 'fait') return;
      (LEX_PAR_OBJECTIF[oid] || []).forEach(pousser);
    });
    (LEX_PAR_STATUT[estMicro(state.profil) ? 'micro' : 'societe'] || []).forEach(pousser);
    return ordre.slice(0, n || 6).map(terme);
  }

  function lexPastillesHtml(actif, action){
    var cats = ORDRE_DOMAINES.filter(function(k){
      return LEXIQUE.some(function(x){ return x.cat === k; });
    });
    return '<div class="fpills">'
      + '<button class="fpill'+(actif?'':' on')+'" data-action="'+action+'" data-dom="">Tous</button>'
      + cats.map(function(k){
          var d = DOMAINES[k], on = actif === k;
          var n = LEXIQUE.filter(function(x){ return x.cat === k; }).length;
          return '<button class="fpill'+(on?' on':'')+'" style="--c:'+d.c+'"'
            + ' data-action="'+action+'" data-dom="'+k+'">'+d.ico+' '+esc(d.l)
            + '<span class="fpill-n">'+n+'</span></button>';
        }).join('')
    + '</div>';
  }

  function lexiqueHtml(){
    var epingles = LEXIQUE.filter(function(x){
      return estEpingle(x.id)
        && (!state.lexFiltre || x.cat === state.lexFiltre);
    });
    var sugg = lexSuggestions(6).filter(function(x){
      return !state.lexFiltre || x.cat === state.lexFiltre;
    });
    var total = LEXIQUE.length, nbEp = state.lexEpingles.length;

    // Bandeau, dans la même famille que celui des objectifs.
    var entete = '<div class="lx-tete">'
      + '<div class="lx-tete-r">'+anneauSection(
          total ? Math.round(nbEp / total * 100) : 0, '#0891b2', 72)+'</div>'
      + '<div class="lx-tete-x">'
        + '<div class="lx-tete-t">'
          + (nbEp ? 'Ton lexique, '+nbEp+' mot'+(nbEp>1?'s':'')+' de côté'
                  : 'Ton lexique est encore vide')+'</div>'
        + '<div class="lx-tete-s">'
          + (nbEp ? 'Les mots que tu as mis de côté te suivent partout dans l’app'
                  : 'Mets de côté les mots que tu veux retenir, ils te suivront partout')+'</div>'
        + '<div class="lx-tete-c">'
          + '<button class="ochip on" data-action="lex-tous-open">'
            + '<b>'+total+'</b> mots au total</button>'
          + '<span class="ochip"><b>'+(total - nbEp)+'</b> à découvrir</span>'
        + '</div>'
      + '</div>'
    + '</div>';

    var blocEp = epingles.length
      ? '<div class="lx-sec"><div class="lx-sec-t">Mes mots</div>'
        + '<div class="lx-grid">'+epingles.map(lexCarteHtml).join('')+'</div></div>'
      : (state.lexFiltre ? ''
          : '<div class="obj-vide illu">'
            + '<img src="assets/illus/rien-en-cours.svg" alt="" class="illu-img">'
            + '<div class="obj-vide-t">Aucun mot de côté</div>'
            + '<div class="obj-vide-d">Ouvre un terme et clique sur l’étoile pour le garder ici</div>'
          + '</div>');

    var blocSugg = sugg.length
      ? '<div class="lx-sec"><div class="lx-sec-t">Sans doute utiles pour toi'
          + '<span class="lx-sec-h">d’après ton statut et tes objectifs</span></div>'
        + '<div class="lx-grid">'+sugg.map(lexCarteHtml).join('')+'</div></div>'
      : '';

    return '<div class="view">'
      + entete
      + lexPastillesHtml(state.lexFiltre, 'lex-filtre')
      + blocEp
      + blocSugg
      + '<button class="obj-plus" data-action="lex-tous-open">'
        + '<span class="obj-plus-c">🔎</span>'
        + '<span class="obj-plus-txt"><span class="obj-plus-t">Tous les mots</span>'
          + '<span class="obj-plus-d">'+total+' termes, avec la recherche et les filtres</span>'
        + '</span></button>'
      + '</div>';
  }

  // Le dictionnaire complet vit dans une pop-up : la page reste courte.
  function lexTousHtml(){
    var q = (state.lexRecherche || '').trim().toLowerCase();
    var liste = LEXIQUE.filter(function(x){
      if(state.lexFiltreModal && x.cat !== state.lexFiltreModal) return false;
      if(!q) return true;
      return (x.t + ' ' + x.court + ' ' + x.def).toLowerCase().indexOf(q) >= 0;
    });
    return '<div class="cat-head">'
        + '<div><div class="cat-t">Tous les mots</div>'
          + '<div class="cat-s">Cherche un terme, ou parcours par domaine</div></div>'
        + '<button class="cat-x" data-action="lex-tous-close" aria-label="Fermer">✕</button>'
      + '</div>'
      + '<div class="cat-filtres">'
        + '<div class="lx-search"><span class="lx-search-i">🔎</span>'
          + '<input type="text" data-lex-search placeholder="abattement, PFU, Kbis…" '
            + 'value="'+esc(state.lexRecherche)+'"></div>'
        + lexPastillesHtml(state.lexFiltreModal, 'lex-filtre-modal')
      + '</div>'
      + '<div class="cat-body lx-tous-body">'
        + (liste.length
            ? '<div class="lx-grid">'+liste.map(lexCarteHtml).join('')+'</div>'
            : '<div class="obj-vide">Aucun terme ne correspond</div>')
      + '</div>';
  }

  // Root persistant : taper dans la recherche ne doit pas recréer la pop-up,
  // sinon on perd le focus à chaque lettre.
  function majLexTous(){
    var root = document.getElementById('lex-root');
    if(!root) return;
    if(!state.lexTousOuvert){ root.innerHTML = ''; return; }
    var card = root.querySelector('.cat-modal');
    if(!card){
      root.innerHTML = '<div class="overlay" data-action="lex-tous-close">'
        + '<div class="modal cat-modal" data-action="stop"></div></div>';
      card = root.querySelector('.cat-modal');
    }
    var champ = card.querySelector('[data-lex-search]');
    var focus = champ === document.activeElement;
    var pos = focus ? champ.selectionStart : 0;
    var corps = card.querySelector('.cat-body');
    var y = corps ? corps.scrollTop : 0;
    card.innerHTML = lexTousHtml();
    var neuf = card.querySelector('.cat-body');
    if(neuf) neuf.scrollTop = y;
    if(focus){
      var c2 = card.querySelector('[data-lex-search]');
      if(c2){ c2.focus(); try { c2.setSelectionRange(pos, pos); } catch(e){} }
    }
  }

  // La recherche ne remplace que la grille : le champ garde son focus.
  function majLexique(){
    if(state.lexTousOuvert) majLexTous();
  }

  function lexModalHtml(){
    if(!state.lexOuvert) return '';
    var x = terme(state.lexOuvert);
    if(!x) return '';
    var d = DOMAINES[x.cat] || DOMAINES.administratif;
    var on = estEpingle(x.id);
    return '<div class="overlay" data-action="lex-close">'
      + '<div class="modal" style="width:520px;--c:'+d.c+';--s:'+d.soft+'" data-action="stop">'
        + '<div class="lx-modal-head">'
          + '<div><div class="lx-modal-cat">'+esc(d.l)+'</div>'
            + '<div class="lx-modal-t">'+esc(x.t)+'</div></div>'
          + '<button class="lx-modal-pin'+(on?' on':'')+'" data-action="lex-pin" data-id="'+x.id+'">'
            + (on?'★ Épinglé':'☆ Épingler')+'</button>'
        + '</div>'
        + '<div class="modal-body" style="background:'+d.soft+'">'
          + '<p class="lx-modal-def">'+esc(x.def)+'</p>'
        + '</div>'
        + '<div class="modal-foot" style="justify-content:flex-end">'
          + '<button class="btn-ghost" data-action="lex-close">Fermer</button>'
        + '</div>'
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // Dashboard admin - l'état de FreeHub, réservé aux administrateurs
  // ---------------------------------------------------------------------------
  function adminChargerStats(){
    if(state.admin.chargement) return;
    state.admin.chargement = true;
    apiJson('GET', 'api/admin/stats').then(function(res){
      state.admin.chargement = false;
      if(res.ok){ state.admin.stats = res.data; state.admin.erreur = ''; }
      else { state.admin.erreur = (res.data && res.data.error) || 'Chargement impossible.'; }
      render();
    }, function(){
      state.admin.chargement = false;
      state.admin.erreur = 'Serveur injoignable.';
      render();
    });
  }

  function admStat(valeur, libelle, teinte, aide){
    return '<div class="adm-stat'+(teinte?' '+teinte:'')+'">'
      + '<div class="adm-stat-v">'+esc(String(valeur))+'</div>'
      + '<div class="adm-stat-l">'+esc(libelle)+'</div>'
      + (aide ? '<div class="adm-stat-a">'+esc(aide)+'</div>' : '')
      + '</div>';
  }

  // Petite barre de répartition (deux parts), pour Google vs mot de passe.
  function admBarre(a, b, labelA, labelB){
    var total = a + b, pa = total ? Math.round(a / total * 100) : 0;
    return '<div class="adm-rep">'
      + '<div class="adm-rep-barre"><span style="width:'+pa+'%"></span></div>'
      + '<div class="adm-rep-legende">'
        + '<span><i class="p1"></i>'+esc(labelA)+' - <b>'+a+'</b> ('+pa+' %)</span>'
        + '<span><i class="p2"></i>'+esc(labelB)+' - <b>'+b+'</b> ('+(total?100-pa:0)+' %)</span>'
      + '</div></div>';
  }

  function adminHtml(){
    // Double sécurité : même si l'onglet fuitait, rien ne s'affiche sans le rôle.
    if(!(state.compte && state.compte.isAdmin)){
      return '<div class="view"><div class="adm-refus">🔒 Cet espace est réservé aux administrateurs.</div></div>';
    }
    var a = state.admin, s = a.stats;

    if(a.erreur) return '<div class="view"><div class="adm-refus">⚠️ '+esc(a.erreur)+'</div></div>';
    if(!s){
      if(!a.chargement) adminChargerStats();
      return '<div class="view"><div class="adm-vide">Chargement des statistiques…</div></div>';
    }

    var tauxActivation = s.total ? Math.round(s.avecDonnees / s.total * 100) : 0;

    // --- Comptes ---
    var blocComptes = '<div class="adm-bloc">'
      + '<div class="adm-titre">Comptes</div>'
      + '<div class="adm-stats">'
        + admStat(s.total, 'Utilisateurs', 'bleu')
        + admStat(s.admins, 'Administrateurs', 'or')
        + admStat(s.beta, 'Bêta testeurs', 'violet')
        + admStat('+' + s.j7, 'Sur 7 jours', '', 'et +' + s.j30 + ' sur 30 jours')
      + '</div></div>';

    // --- Connexion ---
    var blocConnexion = '<div class="adm-bloc">'
      + '<div class="adm-titre">Mode de connexion</div>'
      + admBarre(s.google, s.motDePasse, 'Google', 'Mot de passe')
      + '</div>';

    // --- Usage ---
    var formes = s.formes.length
      ? '<div class="adm-formes">' + s.formes.map(function(f){
          return '<div class="adm-forme"><span>'+esc(f[0])+'</span><b>'+f[1]+'</b></div>';
        }).join('') + '</div>'
      : '<div class="adm-vide-s">Aucun statut renseigné pour l’instant.</div>';

    var blocUsage = '<div class="adm-bloc">'
      + '<div class="adm-titre">Usage réel</div>'
      + '<div class="adm-stats">'
        + admStat(s.avecDonnees, 'Comptes actifs', 'vert', 'ont des données synchronisées')
        + admStat(tauxActivation + ' %', 'Taux d’activation', tauxActivation >= 50 ? 'vert' : 'orange')
        + admStat(s.profilRempli, 'Profils renseignés', '', 'activité déclarée')
        + admStat(s.demandesPartenaires, 'Demandes partenaires')
      + '</div>'
      + '<div class="adm-sous-titre">Répartition par statut juridique</div>'
      + formes
      + '</div>';

    // --- Codes d'accès ---
    var blocCodes = '<div class="adm-bloc">'
      + '<div class="adm-titre">Alpha privée</div>'
      + '<div class="adm-stats">'
        + admStat(s.codesActifs, 'Codes actifs')
        + admStat(s.codesUtilises, 'Codes consommés')
      + '</div>'
      + '<div class="adm-note">Les codes se gèrent en ligne de commande sur le serveur : '
        + '<code>python3 codes.py add --note "Prénom"</code></div>'
      + '</div>';

    // --- Gestion des admins ---
    var listeAdmins = s.listeAdmins.map(function(em){
      var soi = state.compte && state.compte.email === em;
      return '<div class="adm-ligne">'
        + '<span class="adm-mail">'+esc(em)+(soi?' <em>(toi)</em>':'')+'</span>'
        + (soi || s.listeAdmins.length <= 1
            ? '<span class="adm-verrou" title="'+(soi?'Tu ne peux pas te retirer toi-même':'Dernier administrateur')+'">🔒</span>'
            : '<button class="adm-retirer" data-action="adm-demote" data-email="'+esc(em)+'">Retirer</button>')
        + '</div>';
    }).join('');

    var message = a.msg
      ? '<div class="adm-msg'+(a.msgErr?' err':'')+'">'+esc(a.msg)+'</div>' : '';

    var blocAdmins = '<div class="adm-bloc">'
      + '<div class="adm-titre">Administrateurs</div>'
      + '<div class="adm-liste">'+listeAdmins+'</div>'
      + '<div class="adm-sous-titre">Ajouter un administrateur</div>'
      + '<div class="adm-ajout">'
        + '<input class="adm-input" data-adm="email" type="email" placeholder="adresse@exemple.fr" autocomplete="off">'
        + '<button class="adm-btn"'+(a.busy?' disabled':'')+' data-action="adm-promote">'
          + (a.busy?'…':'Promouvoir')+'</button>'
      + '</div>'
      + '<div class="adm-note">Le compte doit déjà exister. La personne devient admin '
        + 'à sa prochaine ouverture de FreeHub.</div>'
      + message
      + '</div>';

    // --- Dernières inscriptions ---
    var derniers = s.derniers.map(function(d){
      var quand = '';
      try {
        quand = new Date(d.created).toLocaleDateString('fr-FR',
                { day:'2-digit', month:'short', year:'2-digit' });
      } catch(e){}
      return '<div class="adm-ligne">'
        + '<span class="adm-mail">'+esc(d.email)
          + (d.nom ? ' <em>'+esc(d.nom)+'</em>' : '')+'</span>'
        + '<span class="adm-tags">'
          + (d.admin ? '<span class="adm-tag or">admin</span>' : '')
          + '<span class="adm-tag">'+(d.google?'Google':'mot de passe')+'</span>'
          + '<span class="adm-date">'+esc(quand)+'</span>'
        + '</span></div>';
    }).join('');

    var blocDerniers = '<div class="adm-bloc">'
      + '<div class="adm-titre">Dernières inscriptions</div>'
      + '<div class="adm-liste">'+(derniers || '<div class="adm-vide-s">Aucun compte.</div>')+'</div>'
      + '</div>';

    return '<div class="view">'
      + '<div class="adm-entete">'
        + '<div><div class="adm-entete-t">🛡️ Espace administrateur</div>'
        + '<div class="adm-entete-s">Ces chiffres viennent du serveur et ne sont visibles que par les admins.</div></div>'
        + '<button class="adm-refresh" data-action="adm-refresh">↻ Actualiser</button>'
      + '</div>'
      + blocComptes + blocConnexion + blocUsage + blocCodes + blocAdmins + blocDerniers
      + '</div>';
  }

  function partenairesHtml(){
    var neufs = partenairesNouveaux();
    var cards = PARTENAIRES.map(function(p, i){
      // La carte reste volontairement courte : 3 points, le reste est dans la fiche.
      var pts = p.points.slice(0, 3).map(function(pt){
        return '<li><span class="part-check" style="background:'+p.color+'">✓</span>'
          + '<span>'+esc(pt)+'</span></li>';
      }).join('');

      var inedit = neufs.indexOf(i) >= 0;
      return '<article class="part-card'+(p.promo?' a-promo':'')+(inedit?' inedit':'')
        + '" style="'+partVars(p)+'"'
        + ' data-action="part-open" data-i="'+i+'">'
        + '<div class="part-head">'
          + '<div class="part-coin">'
            // La cloche se range à côté du « + » plutôt qu'en dessous : le
            // bandeau est en overflow:hidden, une troisième ligne serait coupée.
            + '<div class="part-coin-h">'
              + (inedit ? '<span class="part-neuf" title="Nouveau partenaire">🔔</span>' : '')
              + '<button class="part-more" data-action="part-open" data-i="'+i+'"'
                + ' aria-label="En savoir plus sur '+esc(p.nom)+'">+</button>'
            + '</div>'
            + (p.promo ? '<span class="part-flag">🎁 Promo</span>' : '')
          + '</div>'
          + (p.tease
              ? '<div class="part-logo tease">?</div>'
                + '<div><div class="part-name">Prochainement…</div>'
                + '<div class="part-kind">'+esc(p.kind)+'</div></div>'
              : '<div class="part-logo"><img src="'+esc(p.img)+'" alt="Logo '+esc(p.nom)+'"></div>'
                + '<div><div class="part-name">'+esc(p.nom)+'</div>'
                + '<div class="part-kind">'+esc(p.kind)+'</div></div>')
        + '</div>'
        + '<p class="part-desc">'+esc(p.pitch)+'</p>'
        + '<ul class="part-pts">'+pts+'</ul>'
        + '<div class="part-foot"><span class="part-cta">En savoir plus →</span></div>'
        + '</article>';
    }).join('');

    return '<div class="view">'
      + '<div class="part-intro">'
        + '<div class="part-intro-emoji">🤝</div>'
        + '<div class="part-intro-s">FreeHub te dit quoi faire ; ces partenaires le font avec toi. '
        + 'Création de société, comptabilité, compte pro, accompagnement financier '
        + 'et d’autres restent encore à venir…</div>'
      + '</div>'
      + '<div class="part-grid">'+cards+'</div>'
      + '<div class="part-join">'
        + '<div class="part-join-txt">'
          + '<div class="part-join-h">Un outil, un service, un accompagnement pour les indépendants ?</div>'
          + '<div class="part-join-s">Propose ta structure : on regarde si ça a du sens pour la communauté FreeHub.</div>'
        + '</div>'
        + '<button class="part-join-btn" data-action="part-form-open">Devenir partenaire →</button>'
      + '</div>'
      + '<p class="part-legal">Partenaires indépendants de FreeHub. Les liens de leurs fiches sont '
      + 'des <strong>liens d’affiliation</strong> : FreeHub peut percevoir une commission si tu '
      + 'souscris, sans surcoût pour toi - les codes promo te font au contraire baisser le prix.</p>'
      + '</div>';
  }

  // Modal « devenir partenaire » : ouvert à tous, relié plus tard à un e-mail.
  function partFormModalHtml(){
    if(!state.partForm) return '';
    if(state.partFormDone){
      return '<div class="overlay" data-action="part-form-close">'
        + '<div class="modal" style="width:460px" data-action="stop">'
          + '<div class="modal-body" style="text-align:center;padding:38px 30px">'
            + '<div style="font-size:44px;line-height:1">🤝</div>'
            + '<div class="modal-title" style="margin-top:10px">Demande envoyée !</div>'
            + '<div class="modal-sub" style="margin-top:8px">Merci - on revient vers toi par e-mail '
              + 'si ça matche. À bientôt sur FreeHub.</div>'
          + '</div>'
          + '<div class="modal-foot" style="justify-content:center">'
            + '<button class="btn-confirm active" data-action="part-form-close">Fermer</button>'
          + '</div>'
        + '</div></div>';
    }
    return '<div class="overlay" data-action="part-form-close">'
      + '<div class="modal" style="width:500px" data-action="stop">'
        + '<div class="modal-head">'
          + '<div class="modal-title">Devenir partenaire</div>'
          + '<div class="modal-sub">Dis-nous qui tu es. Aucune obligation - on étudie chaque demande.</div>'
        + '</div>'
        + '<div class="modal-body">'
          + '<div class="pf"><label>Nom de la structure *</label>'
            + '<input data-pj="structure" type="text" placeholder="Ex : Ton Cabinet, Ta Startup…"></div>'
          + '<div class="pf" style="margin-top:12px"><label>E-mail de contact *</label>'
            + '<input data-pj="email" type="email" placeholder="contact@exemple.fr" autocomplete="email"></div>'
          + '<div class="pf" style="margin-top:12px"><label>Site web</label>'
            + '<input data-pj="site" type="text" placeholder="https://…"></div>'
          + '<div class="pf" style="margin-top:12px"><label>Type de service</label>'
            + '<input data-pj="categorie" type="text" placeholder="Ex : compta, banque pro, assurance, formation…"></div>'
          + '<div class="pf" style="margin-top:12px"><label>Message</label>'
            + '<textarea data-pj="message" rows="3" placeholder="Ce que tu proposes aux indépendants, en quelques mots."></textarea></div>'
          + (state.partFormErr ? '<div class="form-error" style="margin-top:12px">'+esc(state.partFormErr)+'</div>' : '')
        + '</div>'
        + '<div class="modal-foot">'
          + '<button class="btn-cancel" data-action="part-form-close">Annuler</button>'
          + '<button class="btn-confirm active"'+(state.partFormBusy?' disabled':'')
            + ' data-action="part-form-submit">'+(state.partFormBusy?'…':'Envoyer ma demande')+'</button>'
        + '</div>'
      + '</div></div>';
  }

  function partModalHtml(){
    if(state.partOpen === null) return '';
    var p = PARTENAIRES[state.partOpen];
    if(!p) return '';

    var pts = p.points.map(function(pt){
      return '<li><span class="part-check" style="background:'+p.color+'">✓</span>'
        + '<span>'+esc(pt)+'</span></li>';
    }).join('');

    // Le bouton vit dans l'en-tête, face au logo. Lien d'affiliation pas encore
    // connu → bouton inactif en attendant.
    var lien = p.tease
      ? '<span class="part-link soon">Bientôt dévoilé</span>'
      : (p.url
          // `cta` prime quand le partenaire en définit un : « Découvrir X »
          // ne donne aucune raison de cliquer à qui connaît déjà la maison.
          ? '<a class="part-link" href="'+esc(p.url)+'" target="_blank" rel="noopener sponsored"'
            + (p.fait ? ' data-action="part-lien" data-fait="'+esc(p.fait)+'"' : '') + '>'
            + esc(p.cta || ('Découvrir ' + p.nom)) + ' →</a>'
          : '<span class="part-link soon">Lien bientôt disponible</span>');

    // L'avantage occupe tout le pied : code, ce qu'il donne, clic pour copier.
    var avantage = p.promo
      ? '<div class="modal-foot part-offre" data-action="part-copy" data-code="'+esc(p.promo)+'"'
        + ' title="Cliquer pour copier le code">'
        + '<span class="part-offre-h">🎁 Avantage FreeHub</span>'
        + '<span class="part-promo-code">'+esc(p.promo)+'</span>'
        + '<span class="part-offre-d">'+esc(p.promoDetail || '')+'</span>'
        + '</div>'
      : '';

    return '<div class="overlay" data-action="part-close">'
      + '<div class="modal" style="width:560px;'+partVars(p)+'" data-action="stop">'
        + '<div class="part-modal-head">'
          + (p.tease
              ? '<div class="part-modal-logo part-logo tease">?</div>'
                + '<div class="part-modal-id"><div class="part-modal-name">Prochainement…</div>'
                + '<div class="part-modal-kind">'+esc(p.kind)+'</div></div>'
              : '<div class="part-modal-logo"><img src="'+esc(p.img)+'" alt="Logo '+esc(p.nom)+'"></div>'
                + '<div class="part-modal-id"><div class="part-modal-name">'+esc(p.nom)+'</div>'
                + '<div class="part-modal-kind">'+esc(p.kind)+'</div></div>')
          + lien
        + '</div>'
        + '<div class="modal-body" style="background:'+p.soft+'">'
          + '<p class="part-modal-desc">'+(p.tease
              ? 'Un nouveau partenaire arrive : un cabinet d’expertise comptable qui '
                + 'travaille au quotidien avec de jeunes entrepreneurs. On te le '
                + 'présente très bientôt - voilà déjà ce qu’il sait faire.'
              : p.desc)+'</p>'
          + '<div class="part-modal-label">Là où ils te débloquent</div>'
          + '<ul class="part-modal-pts">'+pts+'</ul>'
        + '</div>'
        + avantage
      + '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  // La coquille (sidebar + en-tête) est construite une seule fois : seuls les
  // textes, les classes actives et le contenu sont mis à jour ensuite. C'est ce
  // qui évite l'effet de « clignotement » à chaque clic.
  // En-tête de l'onglet Simulateur : il suit le simulateur réellement ouvert.
  var TITRES_SIM = {
    categorie: ['Orientation', 'BIC ou BNC ?',
               'La catégorie dont dépendent ta case de déclaration et ton abattement.'],
    depenses: ['Analyse', 'Guide des dépenses',
               'Ce que les indépendants peuvent passer sur leur société, et à quelles conditions.'],
    vl:       ['Analyse', 'Versement libératoire',
               'Compare les deux modes d’imposition de ta micro-entreprise.'],
    tva:      ['Analyse', 'Passage à la TVA',
               'Ce que tu récupérerais, ce que ça coûte à gérer, et le risque côté clients.'],
    statut:   ['Analyse', 'Passer en société ?',
               'À partir de quel chiffre d’affaires une société te rapporte plus.'],
    optim:    ['Analyse', 'Optimiser ma société',
               'Teste ta rémunération, tes dividendes et tes leviers, et vois ce qu’il te reste.'],
  };

  function shellHtml(){
    return '<div class="app">'
      + '<aside class="sidebar">'
        + '<div class="side-haut">'
          // Le vrai logo dès qu'il est déposé dans assets/ ; sinon le wordmark CSS.
          + '<div class="brand">'
            + '<img class="brand-logo" src="assets/freehub-logo-blanc.png" alt="Freehub">'
            + '<span class="brand-word">Freehub<span class="brand-dot">.</span></span>'
          + '</div>'
          + '<button class="side-repli" data-action="side-repli" aria-label="Replier le menu">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
            + ' stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 7 9.5 12l5 5"/></svg>'
          + '</button>'
        + '</div>'
        + '<nav>'+navHtml()+'</nav>'
        // Le profil vit désormais en haut à droite : la barre latérale ne garde
        // que la bascule de thème, et récupère toute la place.
        + '<div class="side-foot"><div class="side-divider"></div>'
          + '<button class="theme-sw" data-action="theme" aria-label="Changer de thème">'
            + '<span class="theme-o"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
              + 'stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/>'
              + '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4'
              + 'M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>Clair</span>'
            + '<span class="theme-l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
              + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
              + '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>Sombre</span>'
          + '</button>'
        + '</div>'
      + '</aside>'
      + '<main>'
        + '<div class="ptitre-zone"></div>'
        + '<div class="content"></div>'
      + '</main>'
      // Sur mobile la barre latérale devient un tiroir : ce bouton l'ouvre et
      // le voile la referme. Les deux sont masqués sur grand écran.
      + '<button class="side-burger" data-action="side-repli" aria-label="Ouvrir le menu">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
        + ' stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
      + '</button>'
      + '<div class="side-voile" data-action="side-repli"></div>'
      + '</div>'
      + '<div id="modal-root"></div>'
      + '<div id="cat-root"></div>'
      + '<div id="lex-root"></div>'
      + '<div id="sav-root"></div>'
      + '<div id="onb-root"></div>'
      + '<div id="tvo-root"></div>'
      + '<div id="dgo-root"></div>'
      + '<div id="vlo-root"></div>'
      + '<div id="simintro-root"></div>'
      + '<div id="annonce-root"></div>';
  }

  // Si assets/freehub-logo.png est absent, on bascule sur le wordmark CSS.
  function initBrand(){
    var img = document.querySelector('.brand-logo');
    if(!img) return;
    var replier = function(){
      img.remove();
      var mot = document.querySelector('.brand-word');
      if(mot) mot.classList.add('on');
    };
    img.addEventListener('error', replier);
    if(img.complete && img.naturalWidth === 0) replier();
  }

  var lastView = null;   // écran affiché, pour ne ré-animer qu'au vrai changement

  function render(){
    var app = document.getElementById('app');
    if(!app.querySelector('.app')){ app.innerHTML = shellHtml(); initBrand(); initTheme(); }

    // La nav n'est bâtie qu'une fois ; or le rôle admin arrive après coup (session
    // vérifiée en arrière-plan). On la reconstruit donc si l'onglet admin doit
    // apparaître ou disparaître.
    var navEl = app.querySelector('nav');
    var admVisible = !!app.querySelector('.nav-row[data-tab="admin"]');
    var admAttendu = !!(state.compte && state.compte.isAdmin);
    if(navEl && admVisible !== admAttendu) navEl.innerHTML = navHtml();

    // Navigation : on bascule les classes, sans reconstruire les boutons.
    [].forEach.call(app.querySelectorAll('.nav-row'), function(row){
      row.classList.toggle('on', row.getAttribute('data-tab') === state.tab);
    });
    // Badge « New » : il doit s'éteindre à l'instant où la découverte est faite,
    // sans attendre un rechargement. On le pose ou le retire à chaque rendu
    // plutôt que de reconstruire la nav entière.
    [['objectifs', objectifsNouveaux().length],
     ['partenaires', partenairesNouveaux().length],
     ['simulateur', simulateurNeuf() ? 1 : 0],
     ['parrainage', parrainageNeuf() ? 1 : 0],
     ['accueil', accueilNeuf() ? 1 : 0]].forEach(function(n){
      var row = app.querySelector('.nav-row[data-tab="'+n[0]+'"]');
      if(!row) return;
      var pastille = row.querySelector('.nav-badge:not(.alpha)');
      if(n[1] && !pastille){
        var s = document.createElement('span');
        s.className = 'nav-badge';
        s.textContent = 'New';
        row.appendChild(s);
      } else if(!n[1] && pastille){
        pastille.remove();
      }
    });
    // « Alpha » n'est qu'une étiquette : dès qu'une ligne porte une vraie
    // information — « New », ou un compteur — l'étiquette s'efface. Les deux
    // côte à côte se chevauchaient dans la largeur de la barre.
    [].forEach.call(app.querySelectorAll('.nav-row'), function(row){
      var alpha = row.querySelector('.nav-badge.alpha');
      if(!alpha) return;
      var occupe = row.querySelector('.nav-badge:not(.alpha)') || row.querySelector('.nav-pastille');
      alpha.style.display = occupe ? 'none' : '';
    });
    // Même chose pour les compteurs : la nav n'étant bâtie qu'une fois, ils
    // restaient figés sur leur valeur du premier rendu — un message non lu
    // affiché même après avoir ouvert l'Entraide, une réclamation invisible
    // jusqu'au rechargement suivant.
    // Sur l'onglet Récompenses, la pastille n'a plus de sens : on est en train
    // de regarder ce qu'elle annonce.
    [['chat', state.chat.nonLus || 0],
     ['succes', state.tab === 'succes' ? 0 : badgesNonVus()],
     ['sav', state.tab === 'sav' ? 0 : (state.demandesNb || 0)]].forEach(function(n){
      var ligne = app.querySelector('.nav-row[data-tab="'+n[0]+'"]');
      if(!ligne) return;
      var past = ligne.querySelector('.nav-pastille');
      if(n[1] && !past){
        var sp = document.createElement('span');
        sp.className = 'nav-pastille';
        sp.textContent = n[1];
        ligne.appendChild(sp);
      } else if(n[1] && past){
        past.textContent = n[1];
      } else if(!n[1] && past){
        past.remove();
      }
    });
    // Le bloc utilisateur est reconstruit par titreOutilsHtml() à chaque rendu :
    // rien à mettre à jour ici depuis que la barre latérale ne le porte plus.

    // Les deux réglages d'affichage vivent sur le conteneur en flex.
    var coquille = app.querySelector('.app');
    coquille.classList.toggle('side-plie', state.sidePlie);
    // Écran d'entraide : la page ne défile pas, seul le fil le fait.
    coquille.classList.toggle('sans-defilement', state.tab === 'chat');
    document.body.classList.toggle('fige', state.tab === 'chat');

    // Titre de page : masqué quand un objectif est ouvert, où le titre de
    // l'objectif et le bouton retour suffisent.
    var barre = app.querySelector('.ptitre-zone');
    barre.innerHTML = (state.tab === 'objectifs' && state.objectifOuvert)
                    ? '' : titrePageHtml();

    // Contenu.
    var content = app.querySelector('.content');
    // Un re-rendu ne doit jamais manger ce que l'utilisateur est en train de
    // taper dans l'Entraide : on capture le champ avant, on restaure après.
    var chAvant = document.querySelector('[data-chat-input]');
    var chVal = chAvant ? chAvant.value : '';
    var chFocus = chAvant && chAvant === document.activeElement;
    var chPos = chFocus ? chAvant.selectionStart : 0;
    var cfAvant = document.querySelector('[data-chat-fil-input]');
    var cfVal = cfAvant ? cfAvant.value : '';
    var cfFocus = cfAvant && cfAvant === document.activeElement;
    var cfPos = cfFocus ? cfAvant.selectionStart : 0;
    var filAv = document.querySelector('[data-chat-fil]');
    var filScroll = filAv ? filAv.scrollTop : null;
    var apAv = document.querySelector('[data-chat-fil-b]');
    var apScroll = apAv ? apAv.scrollTop : null;

    content.innerHTML = state.tab === 'accueil' ? accueilHtml()
                      : state.tab === 'objectifs' ? objectifsHtml()
                      : state.tab === 'calendrier' ? calendrierHtml()
                      : state.tab === 'lexique' ? lexiqueHtml()
                      : state.tab === 'partenaires' ? partenairesHtml()
                      : state.tab === 'profil' ? profilHtml()
                      : state.tab === 'chat' ? chatHtml()
                      : state.tab === 'parrainage' ? parrainageVueHtml()
                      : state.tab === 'succes' ? succesHtml()
                      : state.tab === 'sav' ? savAdminHtml()
                      : state.tab === 'admin' ? adminHtml()
                      : simulateurHtml();

    var chApres = document.querySelector('[data-chat-input]');
    if(chApres && chVal && !chApres.value){
      chApres.value = chVal;
      chApres.style.height = 'auto';
      chApres.style.height = Math.min(chApres.scrollHeight, 140) + 'px';
      majFormeSaisie(chApres);
      if(chFocus){
        chApres.focus();
        try { chApres.setSelectionRange(chPos, chPos); } catch(e){}
      }
    }
    var cfApres = document.querySelector('[data-chat-fil-input]');
    if(cfApres && cfVal && !cfApres.value){
      cfApres.value = cfVal;
      if(cfFocus){
        cfApres.focus();
        try { cfApres.setSelectionRange(cfPos, cfPos); } catch(e){}
      }
    }
    if(filScroll !== null){
      var filAp = document.querySelector('[data-chat-fil]');
      if(filAp) filAp.scrollTop = filScroll;
    }
    if(apScroll !== null){
      var apAp = document.querySelector('[data-chat-fil-b]');
      if(apAp) apAp.scrollTop = apScroll;
    }

    // On arrive sur l'Entraide : le fil doit s'ouvrir sur les derniers messages,
    // pas au début de l'histoire. Rien ne le faisait — le seul défilement
    // existant venait du chargement réseau, et il ne se déclenchait pas quand
    // les messages étaient déjà en mémoire.
    if(state.tab === 'chat' && lastView !== 'chat') chatDefilerFin();

    // Plus d'animation d'entrée : le fondu donnait l'impression que la page
    // se rechargeait à chaque clic d'onglet. L'affichage est immédiat.
    lastView = state.tab;

    // Débloque les badges nouvellement mérités (ne relance pas render()).
    evaluerBadges();
    // Un badge qui tombe pendant qu'on est sur la vitrine est vu sur-le-champ.
    if(state.tab === 'succes' && state.badgesInitialises) badgesMarquerVus();

    document.getElementById('modal-root').innerHTML =
      consentModalHtml() + loadingModalHtml() + partModalHtml() + partFormModalHtml()
      + lexModalHtml() + depFicheHtml() + simOutilModalHtml() + authModalHtml()
      + finisModalHtml() + suiteAjoutHtml() + chatCharteHtml() + chatModerationHtml() + badgeFicheHtml()
      + badgeCelebreHtml() + pfAlerteHtml() + profilQuitterHtml();

    // L'onboarding et le catalogue vivent dans leur propre root persistant : on
    // ne remplace que le contenu de leur carte, sans recréer l'overlay ni
    // rejouer leur animation.
    majCatalogue();
    majLexTous();
    var savRoot = document.getElementById('sav-root');
    if(savRoot) savRoot.innerHTML = savBulleHtml();
    majSimIntro();
    majAnnonce();
    majOnboarding();
    majTvaOnb();
    majDepOnb();
    majVlOnb();

    // Une pop-up ouverte fige le défilement de la page derrière.
    document.body.classList.toggle('pop-ouverte',
      !!document.querySelector('#modal-root .overlay, #cat-root .overlay, #lex-root .overlay,'
                             + ' #onb-root .tvo-overlay,'
                             + ' #tvo-root .tvo-overlay, #dgo-root .tvo-overlay,'
                             + ' #vlo-root .tvo-overlay'));

    // En dernier, et ici plutôt que dans setState : beaucoup d'actions
    // (ouvrir un simulateur, fermer un outil…) appellent render() directement.
    // L'URL suivrait sinon un écran sur deux.
    ecrireHash();
  }

  // ---------------------------------------------------------------------------
  // Actions (délégation d'événements)
  // Rafraîchir ou fermer l'onglet : seul le navigateur peut interrompre, et
  // uniquement avec sa propre boîte de dialogue. Le texte n'est pas
  // personnalisable, c'est une protection contre les abus.
  window.addEventListener('beforeunload', function(e){
    if(state.tab !== 'profil' || !state.profilDirty) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  // ---------------------------------------------------------------------------
  // Échap referme la fiche ouverte (partenaire ou terme du lexique).
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(state.partOpen !== null) setState({ partOpen: null });
    else if(state.depOuvert !== null) setState({ depOuvert: null });
    // La fiche d'abord, le dictionnaire ensuite : on remonte les couches dans
    // l'ordre où elles se sont empilées.
    else if(state.lexOuvert !== null) setState({ lexOuvert: null });
    else if(state.lexTousOuvert) setState({ lexTousOuvert: false });
  });

  // Entrée valide l'étape courante de l'onboarding (déclenche le bouton principal).
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' || !state.onboarding.actif) return;
    var root = document.getElementById('onb-root');
    if(!root) return;
    var btn = root.querySelector('.onb-primary');
    if(btn){ e.preventDefault(); btn.click(); }
  });

  // Entraide : envoi du formulaire, et Entrée pour publier (Maj+Entrée = saut
  // de ligne, comme partout ailleurs).
  document.addEventListener('submit', function(e){
    var qf = e.target.closest && e.target.closest('[data-sondage-form]');
    if(qf){
      e.preventDefault();
      var q = (qf.querySelector('[data-sond-q]') || {}).value || '';
      var opts = [...qf.querySelectorAll('[data-sond-o]')].map(function(x){ return x.value; });
      apiJson('POST', '/api/chat/sondage', { question:q, options:opts }).then(function(r){
        if(!r.ok) return;
        state.chat.empreinte = null;
        setState({ sondageForm:false });
        chatCharger(true);
      });
      return;
    }
    // Orientation BIC / BNC.
    var cf = e.target.closest && e.target.closest('[data-cat-form]');
    if(cf){
      e.preventDefault();
      var cAct = (cf.querySelector('[data-cat-activite]') || {}).value || '';
      var cDes = (cf.querySelector('[data-cat-description]') || {}).value || '';
      state.categorie = Object.assign({}, state.categorie,
        { activite:cAct, description:cDes, enCours:true, erreur:null });
      render();
      apiJson('POST', '/api/categorie', { activite:cAct, description:cDes })
        .then(function(r){
          state.categorie = Object.assign({}, state.categorie, {
            enCours:false,
            resultat: r.ok ? r.data : null,
            erreur: r.ok ? null : ((r.data && r.data.error) || 'Orientation indisponible.'),
          });
          if(r.ok) marquerFait('sim:categorie');
          render();
        });
      return;
    }
    // Relance de l'auteur dans son propre fil, depuis la bulle d'aide.
    var ff2 = e.target.closest && e.target.closest('[data-fil-form]');
    if(ff2){
      e.preventDefault();
      var fTexte = (ff2.querySelector('[data-fil-texte]') || {}).value || '';
      if(!fTexte.trim()) return;
      var fId = parseInt(ff2.getAttribute('data-id'), 10);
      var fBtn = ff2.querySelector('.bulle-envoi');
      if(fBtn){ fBtn.disabled = true; fBtn.textContent = 'Envoi…'; }
      apiJson('POST', '/api/sav/repondre', { id: fId, message: fTexte }).then(function(r){
        if(!r.ok){
          if(fBtn){ fBtn.disabled = false; fBtn.textContent = 'Répondre'; }
          return;
        }
        savFilsCharger();   // relit le fil, réponse comprise
      });
      return;
    }
    // Réponse de l'équipe à une réclamation, depuis la file admin.
    var df = e.target.closest && e.target.closest('[data-dem-form]');
    if(df){
      e.preventDefault();
      var dChamp = df.querySelector('[data-dem-texte]');
      var dTexte = (dChamp || {}).value || '';
      if(!dTexte.trim()) return;
      var dId = parseInt(df.getAttribute('data-id'), 10);
      var dBtn = df.querySelector('.dem-envoi');
      if(dBtn){ dBtn.disabled = true; dBtn.textContent = 'Envoi…'; }
      apiJson('POST', '/api/sav/repondre', { id: dId, message: dTexte }).then(function(r){
        if(!r.ok){
          if(dBtn){ dBtn.disabled = false; dBtn.textContent = 'Envoyer'; }
          return;
        }
        demandesRecharger();   // le fil se redessine avec sa nouvelle réponse
      });
      return;
    }
    var sf = e.target.closest && e.target.closest('[data-sav-form]');
    if(sf){
      e.preventDefault();
      var texte = (sf.querySelector('[data-sav-texte]') || {}).value || '';
      var mail = (sf.querySelector('[data-sav-email]') || {}).value || '';
      if(!texte.trim()) return;
      // La bulle vit dans son propre root : on la rafraîchit seule, sans
      // repasser par un rendu complet de la page.
      state.sav = Object.assign({}, state.sav, { envoi:true, erreur:null });
      majSavBulle();
      apiJson('POST', '/api/sav', { message:texte, email:mail,
        type: state.sav.type || 'question' }).then(function(r){
        state.sav = Object.assign({}, state.sav, {
          envoi:false,
          envoye:r.ok,
          erreur:r.ok ? null : ((r.data && r.data.error) || 'Envoi impossible.'),
          // Envoyé : le brouillon a fait son office. En cas d'échec on le
          // garde, sinon l'utilisateur perdrait son texte sur une coupure.
          texte: r.ok ? '' : state.sav.texte,
          grand: r.ok ? false : state.sav.grand,
          touche: r.ok ? 0 : state.sav.touche,
        });
        savBrouillonEcrire();   // envoyé : le brouillon stocké n'a plus lieu d'être
        majSavBulle();
      });
      return;
    }
    var ff = e.target.closest && e.target.closest('[data-chat-form-fil]');
    if(ff){
      e.preventDefault();
      var cf = ff.querySelector('[data-chat-fil-input]');
      if(!cf || !cf.value.trim()) return;
      chatEnvoyer(cf.value, state.chat.fil);
      cf.value = '';
      cf.style.height = 'auto';
      return;
    }
    var f = e.target.closest && e.target.closest('[data-chat-form]');
    if(!f) return;
    e.preventDefault();
    if(f.hasAttribute('data-inactif')) return;
    var champ = f.querySelector('[data-chat-input]');
    if(!champ || !champ.value.trim()) return;
    chatEnvoyer(champ.value);
    champ.value = '';
    champ.style.height = 'auto';
  });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' || e.shiftKey) return;
    var champFil = e.target.closest && e.target.closest('[data-chat-fil-input]');
    if(champFil){
      e.preventDefault();
      var ff = champFil.closest('[data-chat-form-fil]');
      if(ff) ff.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      return;
    }
    var champ = e.target.closest && e.target.closest('[data-chat-input]');
    if(!champ) return;
    e.preventDefault();
    var f = champ.closest('[data-chat-form]');
    if(f) f.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
  });

  // ---------------------------------------------------------------------------
  // Glisser-déposer des cartes d'objectifs
  // ---------------------------------------------------------------------------
  // Deux zones (« En avant » et le reste) et un ordre libre dans chacune. On
  // s'appuie sur l'API native : pas de dépendance, et le comportement reste
  // celui que le navigateur connaît déjà.
  (function brancherGlisser(){
    var app = document.getElementById('app');
    if(!app) return;

    // Pendant tout le glissement on ne touche qu'aux classes : un render() à
    // chaque survol reconstruisait la grille sous le curseur, d'où les à-coups.
    function marquer(zoneActive){
      var zones = app.querySelectorAll('.zone');
      for(var i = 0; i < zones.length; i++){
        zones[i].classList.toggle('survol', zones[i] === zoneActive);
      }
    }
    function reposer(){
      var d = app.querySelector('.tui-slot.drag');
      if(d) d.classList.remove('drag');
      marquer(null);
      var z = app.querySelector('.zone-avant');
      if(z) z.classList.remove('provisoire', 'plein');
      var slots = app.querySelectorAll('.tui-slot.avant-ici');
      for(var i = 0; i < slots.length; i++) slots[i].classList.remove('avant-ici');
    }

    app.addEventListener('dragstart', function(e){
      var slot = e.target.closest && e.target.closest('.tui-slot[draggable="true"]');
      if(!slot) return;
      var tui = slot.querySelector('.tui');
      state.drag = slot.getAttribute('data-id');
      e.dataTransfer.effectAllowed = 'move';
      // Firefox exige une donnée pour démarrer le glissement.
      try { e.dataTransfer.setData('text/plain', state.drag); } catch(err){}
      // La classe est posée au cycle suivant, sinon le navigateur capture
      // l'aperçu de la carte déjà estompée. setTimeout plutôt que
      // requestAnimationFrame : rAF est suspendu quand l'onglet n'est pas visible.
      var cible = slot;
      setTimeout(function(){ if(state.drag) cible.classList.add('drag'); }, 0);
      // La zone d'accueil apparaît le temps du glissement, sans re-render.
      var z = app.querySelector('.zone-avant');
      if(z && !z.querySelector('.tui')) z.classList.add('provisoire');
      if(z && state.avant.length >= MAX_AVANT && state.avant.indexOf(state.drag) < 0){
        z.classList.add('plein');
      }
    });

    app.addEventListener('dragend', function(){
      if(!state.drag) return;
      state.drag = null;
      reposer();
    });

    app.addEventListener('dragover', function(e){
      if(!state.drag) return;
      var zone = e.target.closest && e.target.closest('.zone');
      if(!zone) return;
      var nom = zone.getAttribute('data-zone');
      var complet = nom === 'avant'
        && state.avant.length >= MAX_AVANT && state.avant.indexOf(state.drag) < 0;
      if(complet){ e.dataTransfer.dropEffect = 'none'; marquer(null); return; }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      marquer(zone);
      // Repère d'insertion sur la carte visée.
      var slots = app.querySelectorAll('.tui-slot.avant-ici');
      for(var i = 0; i < slots.length; i++) slots[i].classList.remove('avant-ici');
      var slot = e.target.closest('.tui-slot');
      if(nom === 'avant' && slot) slot.classList.add('avant-ici');
    });

    app.addEventListener('drop', function(e){
      if(!state.drag) return;
      var zone = e.target.closest && e.target.closest('.zone');
      if(!zone) return;
      e.preventDefault();
      var id = state.drag, nom = zone.getAttribute('data-zone');
      var avant = state.avant.filter(function(x){ return x !== id; });

      if(nom === 'avant'){
        if(avant.length >= MAX_AVANT){ state.drag = null; reposer(); return; }
        // Position d'insertion : avant la carte survolée, sinon à la fin.
        var slot = e.target.closest('.tui-slot');
        var cible = slot && slot.getAttribute('data-zone') === 'avant'
                  ? slot.getAttribute('data-id') : null;
        var i = cible ? avant.indexOf(cible) : -1;
        if(i >= 0){
          // À gauche de la carte visée, ou à droite si on a dépassé son milieu.
          var r = slot.getBoundingClientRect();
          if(e.clientX > r.left + r.width / 2) i++;
          avant.splice(i, 0, id);
        } else {
          avant.push(id);
        }
      }
      // Déposer dans « le reste » revient simplement à retirer des favoris.
      state.avant = avant;
      state.drag = null;
      reposer();
      saveObjectifs();
      render();
    });
  })();

  // Le logo ramène à la page d'accueil du site - c'était la seule sortie
  // manquante. L'œuf de Pâques vit ailleurs : sept clics rapprochés sur
  // l'icône du titre de page.
  var secretClics = { n: 0, t: 0 };
  document.getElementById('app').addEventListener('click', function(e){
    // La bulle d'aide se referme dès qu'on clique ailleurs - la croix n'est
    // plus le seul chemin de sortie.
    if(state.sav.ouvert
       && !(e.target.closest && (e.target.closest('.bulle-panneau')
            || e.target.closest('.bulle-aide')))){
      // On referme, mais sans rien effacer : le type choisi et le brouillon
      // sont conservés. Aller copier un bout de texte ailleurs dans l'app ne
      // doit pas coûter le message qu'on était en train d'écrire. Le grand
      // format, lui, ne survit pas : il a été demandé pour écrire, pas pour
      // rouvrir la bulle en plein écran la fois d'après.
      state.sav = Object.assign({}, state.sav, { ouvert:false, grand:false });
      var sr = document.getElementById('sav-root');
      if(sr) sr.innerHTML = savBulleHtml();
    }
    var marque = e.target.closest && e.target.closest('.brand');
    if(marque){ window.location.href = '/'; return; }
    var icone = e.target.closest && e.target.closest('.ptitre-i');
    if(icone){
      var now = Date.now();
      if(now - secretClics.t > 4000) secretClics.n = 0;
      secretClics.n++; secretClics.t = now;
      if(secretClics.n >= 7 && !state.faits['secret:logo']){
        marquerFait('secret:logo');
        render();
      }
      return;
    }
    var el = e.target.closest('[data-action]');
    if(!el) return;
    var action = el.getAttribute('data-action');

    switch(action){
      case 'tab': {
        var target = el.getAttribute('data-tab');
        // Quitter le profil sans avoir enregistré : on demande d'abord.
        if(target !== 'profil' && profilGarde(function(){
             var b = document.querySelector('.nav-row[data-tab="'+target+'"]');
             if(b) b.click();
           })) break;
        if(target === 'chat'){
          state.chat.nonLus = 0;
          // Ce qui est déjà chargé est vu : on note le repère tout de suite,
          // sans attendre le rafraîchissement qui suit.
          chatMarquerLu();
          // Première visite : la charte d'accueil, une seule fois.
          var vuCharte = null;
          try { vuCharte = localStorage.getItem('freehub_chat_onb'); } catch(err){}
          if(!vuCharte) state.chatCharte = true;
          chatCharger(false);
        }
        // Le Classement est découvert : la pastille « New » peut s'éteindre.
        if(target === 'parrainage') marquerFait('parrainage-vu');
        // L'accueil est l'écran d'atterrissage : on n'éteint son « New » que sur
        // un vrai clic, sinon il disparaîtrait avant même d'avoir été vu.
        if(target === 'accueil') marquerFait('accueil-neuf-vu:' + ACC_NEUF);
        // Les badges débloqués sont vus dès qu'on ouvre la vitrine.
        if(target === 'succes') badgesMarquerVus();
        // La file des réclamations est relue à l'ouverture : le compteur doit
        // refléter ce qu'on est en train de regarder, pas l'état d'il y a 90 s.
        if(target === 'sav'){
          state.demandes.chargees = false;
          demandesRecharger().then(demandesNbCharger);
        }
        // Revenir sur l'onglet Simulateur ramène à la liste des simulateurs.
        if(target === 'simulateur') state.sim.open = null;
        if(target === 'objectifs') state.objectifOuvert = null;
        // Sur mobile, le menu est un tiroir : il se referme dès qu'on a choisi.
        if(surMobile()) state.sidePlie = true;
        setState({ tab: target, partOpen: null, lexOuvert: null });
        break;
      }
      case 'view': {
        // Un clic qui termine un glissement ne doit pas ouvrir l'objectif.
        if(state.drag) break;
        // Depuis l'accueil on peut viser un objectif pas encore choisi : on
        // l'ajoute au passage plutôt que d'ouvrir un écran vide.
        var vid = el.getAttribute('data-id');
        marquerNouveauVu(vid);
        if(obj(vid) && state.added.indexOf(vid) < 0){
          state.added = state.added.concat([vid]);
          saveObjectifs();
        }
        setState({ tab:'objectifs', objectifOuvert: vid, stepOuvert: null,
                   catOpen: false, objVoirFinis: false,
                   retourVers: state.tab === 'objectifs' ? null : state.tab });
        break;
      }
      case 'obj-close':
        // Retour à l'écran d'origine quand on venait d'ailleurs (calendrier,
        // accueil), sinon à la liste des objectifs.
        setState({ objectifOuvert: null, stepOuvert: null,
                   tab: state.retourVers || 'objectifs', retourVers: null });
        break;
      // Raccourcis depuis une étape d'objectif : c'est ce qui relie les trois
      // onglets entre eux plutôt que d'en faire des îlots.
      case 'goto-sim':
        e.stopPropagation();          // ne pas cocher l'étape au passage
        state.sim.open = el.getAttribute('data-sim');
        state.sim.step = 'form';
        appliquerProfil();
        setState({ tab:'simulateur' });
        break;
      case 'goto-part':
        e.stopPropagation();
        marquerFait('part:vu');
        setState({ tab:'partenaires', partOpen: parseInt(el.getAttribute('data-i'), 10) });
        break;
      case 'obj-add': {
        e.stopPropagation();
        var aid = el.getAttribute('data-id');
        marquerNouveauVu(aid);
        if(state.added.indexOf(aid) < 0) state.added = state.added.concat([aid]);
        saveObjectifs();
        // Depuis le catalogue, la tuile disparaît de la liste : on y reste pour
        // pouvoir en prendre plusieurs d'affilée.
        // On reste sur la liste : l'objectif remonte simplement dans « mes
        // objectifs ». Pour l'ouvrir, on clique une fois qu'il y est.
        render();
        break;
      }
      // Ajouter un objectif suggéré ne doit pas éjecter de la page en cours :
      // on confirme, puis c'est l'utilisateur qui choisit où il va.
      case 'suite-add': {
        e.stopPropagation();
        var sid = el.getAttribute('data-id');
        if(!obj(sid)) break;
        if(state.added.indexOf(sid) >= 0){
          // Déjà pris : rien à confirmer, on y va.
          setState({ tab:'objectifs', objectifOuvert: sid, stepOuvert: null });
          break;
        }
        state.added = state.added.concat([sid]);
        saveObjectifs();
        setState({ suiteAjout: { id: sid, retour: state.objectifOuvert } });
        break;
      }
      case 'suite-go': {
        var g = state.suiteAjout;
        setState({ suiteAjout: null, tab:'objectifs',
                   objectifOuvert: g ? g.id : state.objectifOuvert, stepOuvert: null });
        break;
      }
      case 'suite-rester':
        setState({ suiteAjout: null });
        break;
      case 'side-repli': {
        var plie = !state.sidePlie;
        // Sur mobile c'est un tiroir, pas une préférence : on ne l'enregistre
        // pas, sinon l'ordinateur hériterait d'un menu replié sans raison.
        if(!surMobile()){
          try { localStorage.setItem('freehub_side_plie', plie ? '1' : '0'); } catch(err){}
        }
        setState({ sidePlie: plie });
        break;
      }
      case 'sav-open':
        if(profilGarde(function(){
             var b = document.querySelector('[data-action="sav-open"]');
             if(b) b.click();
           })) break;
        setState({ sav: Object.assign({}, state.sav, { ouvert:true, envoye:false, erreur:null }) });
        break;
      case 'sav-close':
        // Le brouillon survit à la fermeture : on ne perd pas un texte écrit
        // parce qu'on a voulu vérifier quelque chose ailleurs dans l'app.
        setState({ sav: Object.assign({}, state.sav, { ouvert:false, grand:false }) });
        break;
      case 'pf-alerte-ok':
        setState({ pfAlerte: null });
        break;
      case 'parr-partager':
        if(navigator.share){
          navigator.share({
            title: 'FreeHub',
            text: 'FreeHub m’aide à comprendre l’administratif de mon activité. '
                + 'C’est gratuit, voici mon lien :',
            url: parrainageLien(),
          }).catch(function(){});   // partage annulé : rien à signaler
        }
        break;
      case 'parr-copier': {
        var champ = document.querySelector('[data-parr-lien]');
        if(!champ) break;
        var fini = function(){
          state.parrainage = Object.assign({}, state.parrainage, { copie:true });
          render();
          setTimeout(function(){
            state.parrainage = Object.assign({}, state.parrainage, { copie:false });
            render();
          }, 1800);
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(champ.value).then(fini, function(){
            champ.select(); document.execCommand('copy'); fini();
          });
        } else {
          champ.select(); document.execCommand('copy'); fini();
        }
        break;
      }
      case 'cat-refaire':
        // On garde ce qui a été saisi : on recommence rarement de zéro, on
        // vient plutôt préciser sa description.
        setState({ categorie: Object.assign({}, state.categorie,
          { resultat:null, erreur:null }) });
        break;
      case 'pq-enregistrer': {
        profilEnregistrer();
        var suiteE = state.profilQuitter;
        state.profilQuitter = null;
        render();
        if(suiteE) suiteE();
        break;
      }
      case 'pq-jeter': {
        // On repart des valeurs enregistrées : ce qui n'a pas été gardé est
        // vraiment abandonné, pas laissé en mémoire à l'insu de l'utilisateur.
        state.profil = loadProfil();
        state.profilDirty = false;
        appliquerProfil();
        var suiteJ = state.profilQuitter;
        state.profilQuitter = null;
        render();
        if(suiteJ) suiteJ();
        break;
      }
      case 'pq-rester':
        setState({ profilQuitter: null });
        break;
      case 'annonce-voir':
        state.annonces.deplie = true;
        majAnnonce();
        break;
      case 'annonce-ok': {
        // On acquitte tout le lot d'un coup : les autres suggestions retenues
        // sont résumées dans le même message, les rejouer serait pénible.
        var ids = state.annonces.liste.map(function(x){ return x.id; });
        state.annonces = { liste: [], deplie: false };
        majAnnonce();
        if(ids.length) apiJson('POST', '/api/sav/annonces/vu', { ids: ids });
        break;
      }
      case 'sav-fils': {
        // Un seul échange : on l'ouvre directement, la liste n'apprendrait rien.
        var fs = state.savFils || [];
        var cible = fs.length === 1 ? fs[0].id : 'liste';
        state.sav = Object.assign({}, state.sav, { fil: cible });
        if(cible !== 'liste') savFilMarquerLu(cible);
        majSavBulle();
        break;
      }
      case 'sav-fil-open': {
        var fid = parseInt(el.getAttribute('data-id'), 10);
        state.sav = Object.assign({}, state.sav, { fil: fid });
        savFilMarquerLu(fid);
        majSavBulle();
        break;
      }
      case 'sav-fils-retour': {
        // Depuis un fil on remonte à la liste, depuis la liste au menu.
        var versListe = state.sav.fil !== 'liste' && (state.savFils || []).length > 1;
        state.sav = Object.assign({}, state.sav, { fil: versListe ? 'liste' : null });
        majSavBulle();
        break;
      }
      case 'sav-grand': {
        var g = !state.sav.grand;
        setState({ sav: Object.assign({}, state.sav, { grand:g }) });
        // Le champ vient d'être recréé : on rend la main à l'écriture, curseur
        // en fin de texte plutôt qu'au début.
        var ta = document.querySelector('[data-sav-texte]');
        if(ta){ ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        break;
      }
      case 'sav-type':
        setState({ sav: Object.assign({}, state.sav,
          { type: el.getAttribute('data-t') || null, erreur:null }) });
        savBrouillonEcrire();
        break;
      case 'sav-encore':
        setState({ sav: Object.assign({}, state.sav,
          { envoye:false, erreur:null, type:null }) });
        break;
      case 'dem-filtre':
        setState({ demandes: Object.assign({}, state.demandes,
          { filtre: el.getAttribute('data-f') || null }) });
        break;
      case 'dem-traiter': {
        var dt = el.getAttribute('data-type'), di = parseInt(el.getAttribute('data-id'), 10);
        var dv = el.getAttribute('data-v') === '1';
        apiJson('POST', '/api/admin/demandes/traiter', { type:dt, id:di, traite:dv })
          .then(function(r){
            if(!r.ok) return;
            var liste = state.demandes.liste.map(function(x){
              return x.type === dt && x.id === di
                ? Object.assign({}, x, { traite:dv }) : x;
            });
            setState({ demandes: Object.assign({}, state.demandes, { liste:liste }) });
            demandesNbCharger();   // la pastille suit ce qui vient d'être coché
          });
        break;
      }
      case 'sondage-form':
        setState({ sondageForm: !state.sondageForm });
        break;
      case 'sondage-deplier':
        setState({ sondageOuvert: !state.sondageOuvert });
        break;
      case 'sondage-clore':
        apiJson('POST', '/api/chat/sondage', { clore:true }).then(function(){
          state.chat.empreinte = null; chatCharger(true);
        });
        break;
      case 'sondage-voter':
        apiJson('POST', '/api/chat/voter', { choix: parseInt(el.getAttribute('data-i'), 10) })
          .then(function(r){
            if(!r.ok) return;
            state.chat.empreinte = null; chatCharger(true);
          });
        break;
      case 'obj-partager': {
        // Partager un objectif bouclé dans l'Entraide, une seule fois.
        var oid2 = el.getAttribute('data-id');
        var o2 = obj(oid2);
        if(!o2 || state.faits['partage:'+oid2]) break;
        marquerFait('partage:'+oid2);
        chatEnvoyer('🎉 Je viens de boucler « '+o2.title+' » - '
          + o2.steps.length+' étapes, fait !');
        setState({ tab:'chat' });
        chatSondage();
        chatCharger(false);
        break;
      }
      case 'chat-charte-ok':
        try { localStorage.setItem('freehub_chat_onb', '1'); } catch(err){}
        marquerFait('chat:visite');
        setState({ chatCharte: false });
        break;
      case 'chat-aparte': {
        e.stopPropagation();
        var fid = parseInt(el.getAttribute('data-id'), 10);
        // Recliquer le même aparté le referme ; un autre y bascule.
        if(state.chat.fil === fid){
          setState({ chat: Object.assign({}, state.chat,
            { fil: null, filMessages: [], filCharge: false, empreinte: null,
              filErreur: null }) });
          break;
        }
        setState({ chat: Object.assign({}, state.chat,
          { fil: fid, filMessages: [], filCharge: false, empreinte: null,
            filErreur: null }) });
        chatCharger(true);
        break;
      }
      case 'chat-aparte-close':
        setState({ chat: Object.assign({}, state.chat,
          { fil: null, filMessages: [], filCharge: false, empreinte: null }) });
        break;
      case 'chat-react': {
        e.stopPropagation();
        apiJson('POST', '/api/chat/reagir', {
          id: parseInt(el.getAttribute('data-id'), 10),
          emoji: el.getAttribute('data-e'),
        }).then(function(r){
          if(!r.ok) return;
          state.chat.empreinte = null;   // forcer le rafraîchissement du fil
          chatCharger(true);
        });
        break;
      }
      case 'chat-signaler': {
        var sid = el.getAttribute('data-id');
        apiJson('POST', '/api/chat/signaler', { id: parseInt(sid, 10) })
          .then(function(){ chatCharger(true); });
        el.textContent = 'Signalé'; el.disabled = true;
        break;
      }
      case 'chat-supprimer': {
        var did = parseInt(el.getAttribute('data-id'), 10);
        apiJson('POST', '/api/chat/supprimer', { id: did }).then(function(r){
          if(r.ok) chatCharger(true);
        });
        break;
      }
      case 'chat-blanchir': {
        var bid = parseInt(el.getAttribute('data-id'), 10);
        apiJson('POST', '/api/chat/blanchir', { id: bid }).then(function(r){
          if(!r.ok) return;
          // Le message quitte la file : on la rafraîchit sans la refermer,
          // pour pouvoir enchaîner les signalements.
          var reste = (state.chat.moderation || []).filter(function(x){ return x.id !== bid; });
          state.chat = Object.assign({}, state.chat, { moderation: reste });
          chatCharger(true);
          render();
        });
        break;
      }
      case 'chat-muet': {
        var uid = parseInt(el.getAttribute('data-id'), 10);
        apiJson('POST', '/api/chat/muet', { userId: uid, heures: 24 })
          .then(function(){ chatCharger(true); });
        el.textContent = 'Réduit au silence'; el.disabled = true;
        break;
      }
      case 'chat-moderation':
        apiJson('GET', '/api/chat/moderation').then(function(r){
          setState({ chat: Object.assign({}, state.chat,
            { moderation: r.ok ? (r.data.messages || []) : [] }) });
        });
        break;
      case 'chat-moderation-close':
        setState({ chat: Object.assign({}, state.chat, { moderation: null }) });
        break;
      case 'badge-fiche':
        setState({ badgeOuvert: el.getAttribute('data-id') });
        break;
      case 'badge-fiche-close':
        setState({ badgeOuvert: null });
        break;
      case 'badge-porter': {
        var bid = el.getAttribute('data-id');
        var neuf = state.badgePorte === bid ? null : bid;
        try { neuf ? localStorage.setItem('freehub_badge_porte', neuf)
                   : localStorage.removeItem('freehub_badge_porte'); } catch(err){}
        setState({ badgePorte: neuf });
        // Sans cette poussée, le serveur garde l'ancien badge et le salon
        // continue d'afficher celui d'avant.
        pousserServeur();
        state.chat.empreinte = null;
        break;
      }
      case 'obj-epingle': {
        e.stopPropagation();
        var pid = el.getAttribute('data-id');
        if(state.avant.indexOf(pid) >= 0){
          state.avant = state.avant.filter(function(x){ return x !== pid; });
        } else {
          if(state.avant.length >= MAX_AVANT) break;   // trois au maximum
          state.avant = state.avant.concat([pid]);
        }
        saveObjectifs();
        render();
        break;
      }
      case 'obj-remove': {
        e.stopPropagation();
        var rid = el.getAttribute('data-id');
        state.added = state.added.filter(function(x){ return x !== rid; });
        state.avant = state.avant.filter(function(x){ return x !== rid; });
        saveObjectifs();
        render();
        break;
      }
      case 'cat-open':
        setState({ catOpen: true, objFiltre: null });
        break;
      case 'cat-close':
        setState({ catOpen: false });
        break;
      case 'obj-filtre':
        setState({ objFiltre: el.getAttribute('data-dom') || null });
        break;
      case 'cal-vue':
        setState({ cal: Object.assign({}, state.cal, { vue: el.getAttribute('data-v') }) });
        break;
      case 'cal-annee': {
        var an = parseInt(el.getAttribute('data-a'), 10);
        if(an !== new Date().getFullYear()) marquerFait('cal:autre-annee');
        setState({ cal: Object.assign({}, state.cal, { annee: an }) });
        break;
      }
      case 'cal-mois':
        // Depuis la vue année, cliquer un mois l'ouvre en grand.
        setState({ cal: Object.assign({}, state.cal,
          { vue:'mois', mois: parseInt(el.getAttribute('data-m'), 10) }) });
        break;
      case 'cal-prec':
      case 'cal-suiv': {
        var pas = action === 'cal-suiv' ? 1 : -1;
        var c = Object.assign({}, state.cal);
        if(c.vue === 'annee'){
          c.annee += pas;
        } else if(c.vue === 'mois'){
          var m = c.mois + pas;
          if(m < 0){ m = 11; c.annee--; } else if(m > 11){ m = 0; c.annee++; }
          c.mois = m;
        } else {
          var d = new Date(c.semaine);
          d.setDate(d.getDate() + 7 * pas);
          c.semaine = d.getTime();
          c.annee = d.getFullYear(); c.mois = d.getMonth();
        }
        setState({ cal: c });
        break;
      }
      case 'cal-auj': {
        var n = new Date();
        var lundi = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7));
        setState({ cal: Object.assign({}, state.cal,
          { annee:n.getFullYear(), mois:n.getMonth(), semaine:lundi.getTime() }) });
        break;
      }
      case 'obj-filtre-page':
        setState({ objFiltrePage: el.getAttribute('data-dom') || null });
        break;
      case 'obj-voir-finis':
        setState({ objVoirFinis: !state.objVoirFinis });
        break;
      case 'stop':
        e.stopPropagation();
        break;
      case 'part-open': {
        marquerFait('part:vu');
        var pi = parseInt(el.getAttribute('data-i'), 10);
        // Ouvrir la fiche vaut découverte : le halo doré s'éteint pour de bon,
        // comme sur une tuile d'objectif.
        var pn = PARTENAIRES[pi];
        if(pn && pn.neuf) marquerFait('part-neuf-vu:' + pn.nom);
        setState({ partOpen: pi });
        break;
      }
      case 'part-close':
        setState({ partOpen: null });
        break;
      // ----- Dashboard admin -----
      case 'adm-refresh':
        state.admin.stats = null; state.admin.erreur = ''; state.admin.msg = '';
        render();
        break;
      case 'adm-promote': {
        var champA = document.querySelector('[data-adm="email"]');
        var mailA = champA ? champA.value.trim().toLowerCase() : '';
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mailA)){
          state.admin.msg = 'Indique une adresse e-mail valide.';
          state.admin.msgErr = true; render(); break;
        }
        state.admin.busy = true; state.admin.msg = ''; render();
        apiJson('POST', 'api/admin/promote', { email: mailA }).then(function(res){
          state.admin.busy = false;
          state.admin.msgErr = !res.ok;
          state.admin.msg = res.ok ? mailA + ' est désormais administrateur.'
                                   : ((res.data && res.data.error) || 'Impossible.');
          if(res.ok) state.admin.stats = null;   // force le rechargement des chiffres
          render();
        }, function(){
          state.admin.busy = false; state.admin.msgErr = true;
          state.admin.msg = 'Serveur injoignable.'; render();
        });
        break;
      }
      case 'adm-demote': {
        var mailD = el.getAttribute('data-email');
        apiJson('POST', 'api/admin/demote', { email: mailD }).then(function(res){
          state.admin.msgErr = !res.ok;
          state.admin.msg = res.ok ? mailD + ' n’est plus administrateur.'
                                   : ((res.data && res.data.error) || 'Impossible.');
          if(res.ok) state.admin.stats = null;
          render();
        });
        break;
      }
      case 'part-form-open':
        setState({ partForm:true, partFormDone:false, partFormErr:'' });
        break;
      case 'part-form-close':
        setState({ partForm:false });
        break;
      case 'part-form-submit': {
        var champs = {};
        [].forEach.call(document.querySelectorAll('[data-pj]'), function(inp){
          champs[inp.getAttribute('data-pj')] = inp.value.trim();
        });
        if(!champs.structure){ setState({ partFormErr:'Indique le nom de ta structure.' }); break; }
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(champs.email||'')){
          setState({ partFormErr:'Adresse e-mail invalide.' }); break;
        }
        setState({ partFormBusy:true, partFormErr:'' });
        apiJson('POST', 'api/partenaire', champs).then(function(res){
          if(res.ok){ setState({ partFormBusy:false, partFormDone:true }); }
          else { setState({ partFormBusy:false, partFormErr:(res.data && res.data.error) || 'Envoi impossible. Réessaie.' }); }
        }, function(){
          setState({ partFormBusy:false, partFormErr:'Serveur injoignable. Réessaie.' });
        });
        break;
      }
      // ----- Badges -----
      case 'badge-close':
        state.badgeQueue.shift();
        render();
        break;
      // ----- Compte -----
      case 'auth-open':
        setState({ authOpen:true, authMode: el.getAttribute('data-mode') || 'login', authErr:'' });
        break;
      case 'auth-close':
        setState({ authOpen:false });
        break;
      case 'auth-switch':
        setState({ authMode: state.authMode === 'signup' ? 'login' : 'signup', authErr:'' });
        break;
      case 'auth-submit': {
        var email = (document.querySelector('[data-auth="email"]') || {}).value || '';
        var pw = (document.querySelector('[data-auth="password"]') || {}).value || '';
        var chemin = state.authMode === 'signup' ? 'api/auth/signup' : 'api/auth/login';
        var mode = state.authMode;
        setState({ authBusy:true, authErr:'' });
        apiJson('POST', chemin, { email:email, password:pw }).then(function(res){
          if(!res.ok){
            setState({ authBusy:false, authErr: res.data.error || 'Une erreur est survenue.' });
            return;
          }
          state.compte = { email: res.data.email, prenom: res.data.prenom, nom: res.data.nom,
                       isAdmin: !!res.data.isAdmin, beta: !!res.data.beta };
          identiteDepuisCompte(state.compte);
          state.authBusy = false; state.authOpen = false;
          // Signup : on ensemence le compte avec les données locales.
          // Login : on récupère les données du compte (source de vérité).
          if(mode === 'signup'){
            pousserServeur(); state.syncEtat = 'ok'; render();
          } else {
            apiJson('GET', 'api/data').then(function(d){
              if(d.ok && d.data.donnees && Object.keys(d.data.donnees).length){
                appliquerPaquet(d.data.donnees);
              } else { pousserServeur(); }
              state.syncEtat = 'ok'; render();
            });
          }
        }, function(){
          setState({ authBusy:false, authErr:'Serveur injoignable. Réessaie.' });
        });
        break;
      }
      case 'auth-logout':
        apiJson('POST', 'api/auth/logout').then(function(){
          state.compte = null; state.syncEtat = '';
          window.location.replace('./');   // retour à la landing publique
        });
        break;
      // ----- Onboarding -----
      // On met à jour l'onboarding tout seul (majOnboarding) : le dashboard
      // derrière l'overlay n'est jamais reconstruit tant qu'on est dans le form.
      case 'onb-next':
        onbLire();
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      case 'onb-prev':
        onbLire();
        state.onboarding.etape = Math.max(0, state.onboarding.etape - 1);
        majOnboarding();
        break;
      case 'onb-forme':
        state.onboarding.rep.forme = el.getAttribute('data-v');
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      case 'onb-periode':
        onbLire();
        state.onboarding.rep.periodeCa = el.getAttribute('data-v');
        majOnboarding();
        break;
      case 'onb-periodicite': {
        var rep = state.onboarding.rep;
        var estMicroOnb = /micro|auto/i.test(rep.forme || '');
        var v = el.getAttribute('data-v');
        if(estMicroOnb) rep.periodeUrssaf = v; else rep.periodeTva = v;
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      }
      // Les choix qui avancent d'eux-mêmes : un clic vaut réponse.
      case 'onb-categorie':
        state.onboarding.rep.categorieFiscale = el.getAttribute('data-v');
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      case 'onb-tva':
        state.onboarding.rep.tva = el.getAttribute('data-v');
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      case 'onb-parts':
        state.onboarding.rep.parts = el.getAttribute('data-v');
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      case 'onb-notif': {
        var nid = el.getAttribute('data-id');
        state.onboarding.rep.notif = state.onboarding.rep.notif || {};
        state.onboarding.rep.notif[nid] = !state.onboarding.rep.notif[nid];
        majOnboarding();
        break;
      }
      case 'onb-serenite': {
        var sq = el.getAttribute('data-id');
        var curseur = document.querySelector('[data-serenite-curseur]');
        state.onboarding.rep.serenite = state.onboarding.rep.serenite || {};
        state.onboarding.rep.serenite[sq] = curseur ? parseInt(curseur.value, 10) : 5;
        // Le ressenti est enregistré au fil de l'eau : le bilan final le lit.
        state.serenite.reponses = state.onboarding.rep.serenite;
        try { localStorage.setItem('freehub_serenite',
          JSON.stringify(state.serenite.reponses)); } catch(err){}
        state.onboarding.etape += 1;
        majOnboarding();
        break;
      }
      case 'theme': {
        var sombre = document.documentElement.getAttribute('data-theme') !== 'sombre';
        appliquerTheme(sombre ? 'sombre' : 'clair');
        try { localStorage.setItem('freehub_theme', sombre ? 'sombre' : 'clair'); } catch(err){}
        break;
      }
      case 'sim-intro-ok':
        state.simIntro = null;
        majSimIntro();
        break;
      case 'cote-montant':
        state.sim.coteMontant = el.getAttribute('data-v');
        render();
        break;
      case 'serenite-detail':
        setState({ serenite: Object.assign({}, state.serenite,
          { detail: !state.serenite.detail }) });
        break;
      case 'serenite-quiz':
        // Reprendre le questionnaire depuis l'accueil, sans refaire le profil.
        state.onboarding.rep = Object.assign({}, state.onboarding.rep,
          { serenite: state.serenite.reponses || {} });
        state.onboarding.actif = true;
        state.onboarding.etape = 6;
        render();
        break;
      case 'onb-lancer': {
        // Le quick win : on prend le parcours conseillé et on l'ouvre.
        var oid = el.getAttribute('data-id');
        if(state.added.indexOf(oid) < 0) state.added = state.added.concat([oid]);
        saveObjectifs();
        onbTerminer();
        setState({ tab:'objectifs', objectifOuvert: oid, stepOuvert: 0 });
        break;
      }
      // « onb-skip » n'existe plus : l'onboarding se termine, il ne se saute
      // pas. Sans ces réponses, la moitié de l'app fonctionne à l'aveugle.
      case 'onb-finish':
        onbTerminer();
        break;
      // ----- Lexique -----
      case 'lex-open':
        setState({ lexOuvert: el.getAttribute('data-id') });
        break;
      case 'lex-close':
        setState({ lexOuvert: null });
        break;
      case 'lex-pin': {
        e.stopPropagation();
        var lid = el.getAttribute('data-id');
        var i = state.lexEpingles.indexOf(lid);
        if(i >= 0) state.lexEpingles.splice(i, 1);
        else state.lexEpingles = state.lexEpingles.concat([lid]);
        saveLexique();
        render();
        break;
      }
      case 'lex-tous-open':
        setState({ lexTousOuvert: true, lexRecherche: '', lexFiltreModal: null });
        break;
      case 'lex-tous-close':
        setState({ lexTousOuvert: false });
        break;
      case 'lex-filtre':
        setState({ lexFiltre: el.getAttribute('data-dom') || null });
        break;
      case 'lex-filtre-modal':
        setState({ lexFiltreModal: el.getAttribute('data-dom') || null });
        break;
      // Pas de preventDefault : le lien doit s'ouvrir normalement. On se
      // contente de noter le passage, le badge tombe au rendu suivant.
      case 'part-lien':
        marquerFait(el.getAttribute('data-fait'));
        setState({});
        break;
      case 'part-copy': {
        var box = el, code = el.getAttribute('data-code');
        var val = box.querySelector('.part-promo-code');
        var flashPromo = function(msg){
          val.textContent = msg;
          setTimeout(function(){ val.textContent = code; }, 1600);
        };
        var fallbackPromo = function(){
          var ta = document.createElement('textarea');
          ta.value = code;
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch(err){}
          document.body.removeChild(ta);
          flashPromo(ok ? '✓ Copié' : code);
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(code).then(function(){ flashPromo('✓ Copié'); }, fallbackPromo);
        } else {
          fallbackPromo();
        }
        break;
      }
      case 'step-check': {
        e.stopPropagation();
        var curId = state.objectifOuvert || catalog[0].id;
        var key = curId + ':' + el.getAttribute('data-i');
        var checks = Object.assign({}, state.checks);
        checks[key] = !checks[key];
        state.checks = checks;
        saveObjectifs();
        // On rouvre l'étape en cours après avoir coché (stepOuvert repart en auto).
        setState({ checks: checks, stepOuvert: null });
        break;
      }
      case 'step-expand': {
        var idx = parseInt(el.getAttribute('data-i'), 10);
        setState({ stepOuvert: state.stepOuvert === idx ? -1 : idx });
        break;
      }

      // ----- Simulateur -----
      case 'sim-consent': {
        // Mise à jour directe du DOM : un re-render ferait clignoter la pop-up.
        state.sim.consent = !state.sim.consent;
        var box = el.closest('.sim-consent');
        if(box){
          box.classList.toggle('on', state.sim.consent);
          var check = box.querySelector('.sim-check');
          if(check) check.textContent = state.sim.consent ? '✓' : '';
          var confirm = document.querySelector('[data-action="consent-confirm"]');
          if(confirm) confirm.classList.toggle('active', state.sim.consent);
        } else render();
        break;
      }
      case 'sim-open': {
        var quel = el.getAttribute('data-sim') || 'depenses';
        // L'ouvrir vaut découverte : le « New » de la barre latérale s'éteint.
        if(quel === SIM_NEUF) marquerFait('sim-neuf-vu:' + SIM_NEUF);
        // Première visite de ce simulateur : on explique d'abord à quoi il sert.
        if(SIM_INTRO[quel] && !state.faits['sim-intro:'+quel]){
          state.simIntro = quel;
          marquerFait('sim-intro:'+quel);
        }
        state.sim.open = quel;
        state.sim.step = 'form';
        appliquerProfil();   // le simulateur part toujours des données du profil
        // Statut et cockpit produisent un résultat dès l'ouverture (temps réel).
        if(quel === 'statut' || quel === 'optim') marquerFait('sim:'+quel);
        if(quel === 'depenses'){
          // Le parcours d'accueil ne se joue qu'à la première visite.
          var vu = false;
          try { vu = !!localStorage.getItem('freehub_dep_onb'); } catch(err){}
          if(!vu) state.depOnb = { actif:true, etape:0 };
          marquerFait('sim:depenses');
        }
        // Le simulateur TVA s'ouvre directement sur son parcours guidé.
        // Comparateur et cockpit : on arrive directement sur le simulateur.
        if(quel === 'statut'){ state.statut.outil = null; marquerFait('sim:statut'); }
        if(quel === 'optim'){ state.optim.outil = null; marquerFait('sim:optim'); }
        if(quel === 'vl'){
          state.vl.step = 'form';
          var vuVl = false;
          try { vuVl = !!localStorage.getItem('freehub_vl_onb'); } catch(err){}
          if(!vuVl) state.vl.onb = { actif:true, etape:0 };
        }
        if(quel === 'tva'){
          // Une fois le parcours mené à son terme, on arrive directement sur la
          // page du simulateur, avec les simulations déjà enregistrées.
          var vuTva = false;
          try { vuTva = !!localStorage.getItem('freehub_tva_onb'); } catch(err){}
          state.tva.step = 'form';
          if(!vuTva) state.tva.onb = { actif:true, etape:0 };
        }
        render();
        break;
      }
      // ----- Outils compacts des simulateurs statut et cockpit -----
      case 'statut-outil':
        setState({ 'statut': Object.assign(state.statut, { outil: el.getAttribute('data-o') }) });
        break;
      case 'optim-outil':
        setState({ 'optim': Object.assign(state.optim, { outil: el.getAttribute('data-o') }) });
        break;
      case 'sim-outil-close':
        state.statut.outil = null; state.optim.outil = null;
        render();
        break;
      case 'sim-charge-freq': {
        var cleF = el.getAttribute('data-cle');
        var iCh = parseInt(el.getAttribute('data-i'), 10);
        var lst = cleF === 'statut' ? state.statut.charges : state.optim.charges;
        var chg = lst[iCh];
        if(chg){
          chg.frequence = chg.frequence === 'mensuelle' ? 'annuelle' : 'mensuelle';
          el.textContent = chg.frequence === 'mensuelle' ? '/mois' : '/an';
          if(chg.dansProfil) synchroniserChargeVersProfil(chg);
          if(cleF === 'statut') renderStatutResults(); else renderOptimResults();
        }
        break;
      }
      // ----- Parcours guidé du versement libératoire -----
      case 'vl-onb-start':
        state.vl.onb = { actif:true, etape:0 };
        if(!state.vl.essai) appliquerProfil();
        render();
        break;
      case 'vl-onb-next':
        state.vl.onb.etape = 1;
        majVlOnb();
        break;
      case 'vl-onb-prev':
        state.vl.onb.etape = 0;
        majVlOnb();
        break;
      case 'vl-onb-essai':
        // Mode essai : on part de valeurs neutres, sans toucher au profil.
        state.vl.essai = true;
        state.vl.form = Object.assign({}, state.vl.form, {
          categorie:'serviceBIC', ca:'', parts:'1', autresRevenus:'0', rfr:'' });
        state.vl.onb.etape = 1;
        majVlOnb();
        break;
      case 'vl-onb-quit-sims':
        state.vl.onb.actif = false;
        state.sim.open = null;
        try { localStorage.setItem('freehub_vl_onb', '1'); } catch(err){}
        render();
        break;
      case 'vl-onb-set':
        state.vl.form[el.getAttribute('data-champ')] = el.getAttribute('data-v');
        if(!state.vl.essai){
          state.profil.categorieFiscale = el.getAttribute('data-v');
          saveProfil(state.profil);
        }
        [].forEach.call(el.parentElement.querySelectorAll('.tvo-chip'), function(b){
          b.classList.toggle('on', b === el);
        });
        break;
      case 'vl-onb-lancer':
        state.vl.onb.actif = false;
        try { localStorage.setItem('freehub_vl_onb', '1'); } catch(err){}
        lancerComparaisonVL();
        break;
      // ----- Parcours guidé du simulateur TVA -----
      case 'tva-onb-start':
        state.tva.onb = { actif:true, etape:0 };
        appliquerProfil();
        render();
        break;
      case 'tvo-next': {
        var o = state.tva.onb;
        if(o.etape >= 3){ lancerSimulationTVA(); break; }
        o.etape += 1;
        majTvaOnb();
        break;
      }
      case 'tvo-prev':
        state.tva.onb.etape = Math.max(0, state.tva.onb.etape - 1);
        majTvaOnb();
        break;
      case 'tvo-quit':
        state.tva.onb.actif = false;
        render();
        break;
      case 'tvo-quit-sims':
        state.tva.onb.actif = false;
        state.sim.open = null;
        render();
        break;
      case 'tvo-profil':
        // On quitte le parcours pour aller corriger le profil, sans rien perdre.
        state.tva.onb.actif = false;
        setState({ tab:'profil', profilReturn:'simulateur' });
        break;
      // Édition des infos du profil depuis la pop-up : on écrit dans le profil,
      // pas seulement dans le simulateur, pour éviter toute redirection.
      case 'tvo-form-set': {
        var champF = el.getAttribute('data-champ');
        state.tva.form[champF] = el.getAttribute('data-v');
        if(champF === 'tauxVente') state.profil.tauxVente = el.getAttribute('data-v');
        saveProfil(state.profil);
        [].forEach.call(el.parentElement.querySelectorAll('.tvo-chip'), function(b){
          b.classList.toggle('on', b === el);
        });
        break;
      }
      // Charges reprises du profil, modifiables sans quitter le parcours.
      case 'tvo-charge-freq': {
        var iF = parseInt(el.getAttribute('data-i'), 10);
        var dF = state.tva.depenses[iF];
        if(dF){
          dF.frequence = dF.frequence === 'mensuelle' ? 'annuelle' : 'mensuelle';
          el.textContent = dF.frequence === 'mensuelle' ? '/mois' : '/an';
          synchroniserChargeProfil(iF);
        }
        break;
      }
      case 'tvo-charge-taux': {
        var iT = parseInt(el.getAttribute('data-i'), 10);
        var dT = state.tva.depenses[iT];
        if(dT){
          var cycle = ['0.2', '0.1', '0.055', '0.021'];
          var libelles = { '0.2':'20%', '0.1':'10%', '0.055':'5,5%', '0.021':'2,1%' };
          var pos = cycle.indexOf(String(dT.taux));
          dT.taux = cycle[(pos + 1) % cycle.length];
          el.textContent = libelles[dT.taux];
          synchroniserChargeProfil(iT);
        }
        break;
      }
      case 'tvo-charge-remove':
        state.tva.depenses.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        synchroniserChargesProfil();
        majTvaOnb();
        break;
      // Carte de saisie d'une nouvelle charge
      case 'tvo-brouillon-set':
        state.tva.brouillon[el.getAttribute('data-champ')] = el.getAttribute('data-v');
        [].forEach.call(el.parentElement.querySelectorAll('.tvo-seg-b'), function(b){
          b.classList.toggle('on', b === el);
        });
        break;
      case 'tvo-brouillon-valide': {
        var br = state.tva.brouillon;
        if(!(br.nom || '').trim()){ state.tva.brouillonErr = 'Donne un nom à cette charge'; majTvaOnb(); break; }
        if(!(parseFloat(br.montant) > 0)){ state.tva.brouillonErr = 'Indique un montant'; majTvaOnb(); break; }
        state.tva.ajoutees.push(Object.assign({}, br));
        state.tva.depenses.push({ nom:br.nom.trim(), montant:br.montant, frequence:br.frequence,
                                  taux:br.taux, recup:'100', categorie:'' });
        state.tva.brouillon = { nom:'', montant:'', frequence:'mensuelle', taux:'0.2' };
        state.tva.brouillonErr = '';
        majTvaOnb();
        break;
      }
      case 'tvo-aj-remove': {
        var iA = parseInt(el.getAttribute('data-i'), 10);
        var sup = state.tva.ajoutees.splice(iA, 1)[0];
        if(sup){
          for(var k = state.tva.depenses.length - 1; k >= 0; k--){
            if(state.tva.depenses[k].nom === sup.nom
               && String(state.tva.depenses[k].montant) === String(sup.montant)){
              state.tva.depenses.splice(k, 1); break;
            }
          }
        }
        majTvaOnb();
        break;
      }
      // ----- Parcours d'accueil du guide des dépenses -----
      case 'dep-onb-next':
        state.depOnb.etape = 1;
        majDepOnb();
        break;
      case 'dep-onb-profil':
        state.depOnb.actif = false;
        try { localStorage.setItem('freehub_dep_onb', '1'); } catch(err){}
        setState({ tab:'profil', profilReturn:'simulateur' });
        break;
      case 'dep-onb-fin':
        state.depOnb.actif = false;
        try { localStorage.setItem('freehub_dep_onb', '1'); } catch(err){}
        render();
        break;
      case 'dep-onb-open':
        state.depOnb.actif = false;
        try { localStorage.setItem('freehub_dep_onb', '1'); } catch(err){}
        setState({ depOuvert: el.getAttribute('data-id') });
        break;
      // ----- Guide des dépenses pro -----
      case 'sim-liste':
        state.sim.open = null;
        render();
        break;
      case 'dep-open':
        setState({ depOuvert: el.getAttribute('data-id') });
        break;
      case 'dep-close':
        setState({ depOuvert: null });
        break;
      case 'dep-fav': {
        e.stopPropagation();   // l'étoile vit sur une carte cliquable : ne pas ouvrir la fiche
        var idF = el.getAttribute('data-id');
        var pos = state.depFavoris.indexOf(idF);
        var actif = pos < 0;
        if(pos >= 0) state.depFavoris.splice(pos, 1);
        else state.depFavoris.push(idF);
        saveDepFavoris();
        // Bascule en place : l'étoile et le compteur suffisent, pas besoin de
        // reconstruire la grille (sauf si on filtre justement sur la sélection).
        [].forEach.call(document.querySelectorAll('[data-action="dep-fav"][data-id="'+idF+'"]'),
          function(b){ b.classList.toggle('on', actif); b.textContent = actif ? '★' : '☆'; });
        var pill = document.querySelector('.dg-pill[data-f="favoris"]');
        if(pill) pill.textContent = '★ Ma sélection'
          + (state.depFavoris.length ? ' (' + state.depFavoris.length + ')' : '');
        if(state.depFiltre === 'favoris') majGuideDep();
        break;
      }
      case 'dep-filtre':
        state.depFiltre = el.getAttribute('data-f');
        [].forEach.call(document.querySelectorAll('.dg-pill'), function(p){
          p.classList.toggle('on', p === el);
        });
        majGuideDep();
        break;
      case 'dep-ajout-ouvrir': {
        var dO = depGuide(el.getAttribute('data-id'));
        if(!dO) break;
        state.depAjout = { id:dO.id, nom:dO.multi ? '' : dO.n, frequence:'mensuelle',
                           montant:'', erreur:'', fait:false, dernier:'' };
        render();
        break;
      }
      case 'dep-ajout-set':
        // Bascule visuelle immédiate, sans reconstruire la page : c'est ce qui
        // provoquait le micro-clignotement à chaque clic.
        state.depAjout[el.getAttribute('data-champ')] = el.getAttribute('data-v');
        [].forEach.call(el.parentElement.querySelectorAll('.dga-seg-b'), function(b){
          b.classList.toggle('on', b === el);
        });
        break;
      case 'dep-ajout-annule':
        state.depAjout = { id:null, nom:'', frequence:'mensuelle', montant:'',
                           erreur:'', fait:false, dernier:'' };
        render();
        break;
      case 'dep-ajout-fin':
        // La fiche a déjà été lue : on renvoie directement au guide.
        state.depAjout = { id:null, nom:'', frequence:'mensuelle', montant:'',
                           erreur:'', fait:false, dernier:'' };
        setState({ depOuvert: null });
        break;
      case 'dep-ajout-encore': {
        var dE = depGuide(el.getAttribute('data-id'));
        state.depAjout = { id:dE ? dE.id : null, nom:'', frequence:'mensuelle',
                           montant:'', erreur:'', fait:false, dernier:'' };
        render();
        break;
      }
      case 'dep-ajout-valide': {
        var dV = depGuide(el.getAttribute('data-id'));
        var aj = state.depAjout;
        if(!dV) break;
        var nomV = (aj.nom || '').trim() || dV.n;
        if(!(parseFloat(aj.montant) > 0)){
          aj.erreur = 'Indique un montant'; render(); break;
        }
        // Les champs techniques (catégorie, TVA, déductibilité) sont déduits de
        // la fiche : l'utilisateur n'a que le nom, la période et le montant à donner.
        state.profil.charges = state.profil.charges || [];
        state.profil.charges.push({ nom:nomV, montant:String(aj.montant),
                                    frequence:aj.frequence, tauxTVA:dV.ptva || '0.2',
                                    deductible:'100', categorie:dV.pcat || 'fonctionnement' });
        saveProfil(state.profil);
        appliquerProfil();
        aj.erreur = ''; aj.fait = true; aj.dernier = nomV;
        render();
        break;
      }
      case 'sim-back':
        state.sim.step = 'form';
        state.sim.formError = null;
        render();
        break;
      case 'sim-new':
        state.sim.depenses = [ { nom:'', montant:'', motif:'' } ];
        state.sim.result = null; state.sim.formError = null;
        state.sim.step = 'form';
        render();
        break;
      // ----- Dépenses -----
      case 'dep-add':
        state.sim.depenses.push({ nom:'', montant:'', motif:'' });
        state.sim.formError = null;
        render();
        break;
      case 'dep-remove':
        state.sim.depenses.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        if(!state.sim.depenses.length) state.sim.depenses = [ { nom:'', montant:'', motif:'' } ];
        render();
        break;
      case 'dep-duplicate': {
        var di = parseInt(el.getAttribute('data-i'), 10);
        var src = state.sim.depenses[di];
        state.sim.depenses.splice(di + 1, 0, { nom:src.nom, montant:src.montant, motif:src.motif });
        render();
        break;
      }

      // ----- Résultats -----
      case 'res-toggle': {
        var ri = parseInt(el.getAttribute('data-i'), 10);
        state.sim.openResult = (state.sim.openResult === ri) ? -1 : ri;
        [].forEach.call(document.querySelectorAll('.res-item'), function(node, idx){
          node.classList.toggle('open', idx === state.sim.openResult);
        });
        break;
      }
      case 'sim-sync':
        appliquerVerdictsAuProfil();
        render();
        break;
      case 'sim-print':
        window.print();
        break;
      case 'sim-copy': {
        var btn = el, txt = recapText();
        var flash = function(msg){
          btn.textContent = msg;
          setTimeout(function(){ btn.textContent = 'Copier le compte-rendu'; }, 1800);
        };
        // Repli si l'API presse-papier est indisponible ou refusée.
        var fallback = function(){
          var ta = document.createElement('textarea');
          ta.value = txt;
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch(e){}
          document.body.removeChild(ta);
          flash(ok ? '✓ Copié' : 'Copie impossible');
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(txt).then(function(){ flash('✓ Copié'); }, fallback);
        } else {
          fallback();
        }
        break;
      }

      // ----- Profil -----
      case 'open-profil':
        if(state.tab !== 'profil') state.profilReturn = state.tab;
        // Ouvrir le profil n'est pas le modifier : on retire seulement le
        // bandeau « ✓ Enregistré » d'une visite précédente. Marquer l'écran
        // comme modifié ici déclenchait la question de sauvegarde en sortant,
        // sans que rien n'ait été touché.
        state.profilSaved = false;
        state.profilDirty = false;
        state.tab = 'profil';
        notifCharger(false);
        render();
        break;
      case 'notif-bascule': {
        var gid = el.getAttribute('data-id');
        state.notif.choix[gid] = !state.notif.choix[gid];
        notifEnregistrer();
        break;
      }
      case 'profil-back': {
        var retour = state.profilReturn || 'simulateur';
        if(profilGarde(function(){ setState({ tab: retour }); })) break;
        state.tab = retour;
        render();
        break;
      }
      case 'profil-save':
        profilEnregistrer();
        render();
        break;
      case 'profil-section': {
        // Une seule section ouverte à la fois : on bascule la classe sans
        // re-rendre, pour que l'animation CSS joue et que rien ne clignote.
        var idSec = el.getAttribute('data-id');
        state.profilSection = (state.profilSection === idSec) ? null : idSec;
        [].forEach.call(document.querySelectorAll('.prow'), function(row){
          var b = row.querySelector('[data-action="profil-section"]');
          var vise = !!b && b.getAttribute('data-id') === state.profilSection;
          row.classList.toggle('open', vise);
          // Clic depuis la jauge : on amène la section sous les yeux.
          if(vise && !el.closest('.prow')) row.scrollIntoView({ behavior:'smooth', block:'center' });
        });
        break;
      }
      case 'params-save':
        saveParams(state.statut.params);
        state.statut.paramsSaved = true;
        render();
        break;
      case 'acc-ca-reset': {
        var reel = caProfilAnnuel(state.profil);
        var sld = document.querySelector('[data-accueil-ca]');
        if(sld){ sld.value = reel; majAccueilProjection(reel); }
        break;
      }
      case 'export-donnees':
        exporterDonnees();
        break;
      case 'photo-remove':
        state.profil.photo = '';
        profilTouche();
        render();
        break;
      case 'pcharge-add':
        state.profil.charges = (state.profil.charges || []).concat([
          { nom:'', montant:'', frequence:'mensuelle', tauxTVA:'0.2',
            deductible:'100', categorie:'fonctionnement' } ]);
        profilTouche();
        render();
        break;
      case 'pcharge-remove':
        state.profil.charges.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        profilTouche();
        render();
        break;
      case 'sim-analyze': {
        var incomplet = state.sim.depenses.some(function(d){
          return !(d.nom && d.nom.trim()) || !(d.montant && String(d.montant).trim());
        });
        if(incomplet){
          state.sim.formError = state.sim.depenses.length > 1
            ? 'Chaque dépense doit avoir au moins un nom et un montant.'
            : 'Renseigne au moins le nom et le montant de la dépense.';
          render();
          break;
        }
        state.sim.formError = null;
        state.sim.consentOpen = true;   // l'avertissement s'affiche ici
        render();
        break;
      }
      case 'consent-close':
        state.sim.consentOpen = false;
        render();
        break;
      case 'consent-confirm':
        if(!state.sim.consent) break;   // case non cochée : on ne lance pas
        state.sim.consentOpen = false;
        state.sim.result = null; state.sim.error = null;
        state.sim.analyzing = true;     // le formulaire reste affiché derrière
        render();
        runAnalysis();
        break;

      // ----- Simulateur « Optimiser ma société » -----
      case 'optim-statut':
        state.optim.statut = el.getAttribute('data-s');
        render();
        break;
      case 'optim-toggle-ca':
        state.optim.form.caMensuel = !state.optim.form.caMensuel;
        state.optim.projection = null;
        render();
        break;
      case 'optim-reset-proj':
        state.optim.projection = null;
        render();
        break;
      case 'ocharge-add':
        state.optim.charges.push({ nouvelle:true, nom:'', montant:'', frequence:'mensuelle',
                                   tauxTVA:'0.2', deductible:'100', categorie:'fonctionnement' });
        render();
        break;
      case 'ocharge-remove':
        state.optim.charges.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        render();
        break;
      case 'optim-import': {
        var imp = depensesImportables();
        // On évite les doublons sur le nom.
        var existants = state.optim.charges.map(function(c){ return (c.nom||'').toLowerCase().trim(); });
        var ajoutes = 0;
        imp.forEach(function(d){
          if(existants.indexOf((d.nom||'').toLowerCase().trim()) !== -1) return;
          state.optim.charges.push(d); ajoutes++;
        });
        state.optim.importInfo = ajoutes
          ? ajoutes + ' dépense' + (ajoutes>1?'s importées':' importée') + ' depuis tes autres simulateurs.'
          : 'Ces dépenses sont déjà présentes ici.';
        render();
        break;
      }
      case 'levier-toggle': {
        var k = el.getAttribute('data-k');
        var L = OPTIM_LEVIERS.filter(function(x){ return x.v === k; })[0];
        state.optim.leviers[k] = (parseFloat(state.optim.leviers[k]) || 0) > 0 ? 0 : L.def;
        render();
        break;
      }
      case 'scen-save': {
        var rs = optimResultat();
        var nom = 'Scénario ' + new Date().toLocaleDateString('fr-FR',
                  { day:'2-digit', month:'short' }) + ' · ' + fmtEur(rs.argentPerso);
        state.optim.scenarios.unshift({
          nom: nom, date: Date.now(), statut: state.optim.statut, ca: rs.ca,
          argentPerso: rs.argentPerso,
          form: Object.assign({}, state.optim.form),
          charges: state.optim.charges.map(function(c){ return Object.assign({}, c); }),
          leviers: Object.assign({}, state.optim.leviers),
        });
        saveScenarios(state.optim.scenarios);
        render();
        break;
      }
      case 'scen-load': {
        var sc = state.optim.scenarios[parseInt(el.getAttribute('data-i'), 10)];
        if(sc){
          state.optim.statut = sc.statut;
          state.optim.form = Object.assign({}, sc.form);
          state.optim.charges = (sc.charges || []).map(function(c){ return Object.assign({}, c); });
          state.optim.leviers = Object.assign({}, sc.leviers);
          state.optim.projection = null;
          render();
        }
        break;
      }
      case 'scen-delete':
        state.optim.scenarios.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        saveScenarios(state.optim.scenarios);
        render();
        break;

      // ----- Simulateur « Quand passer en société ? » -----
      case 'statut-mode':
        state.statut.mode = el.getAttribute('data-mode');
        render();
        break;
      case 'statut-toggle-ca':
        state.statut.form.caMensuel = !state.statut.form.caMensuel;
        state.statut.projection = null;
        render();
        break;
      case 'statut-toggle-avance':
        state.statut.avance = !state.statut.avance;
        render();
        break;
      case 'statut-reset-proj':
        state.statut.projection = null;
        render();
        break;
      case 'charge-add':
        state.statut.charges.push({ nom:'', montant:'', frequence:'mensuelle', nouvelle:true });
        render();
        break;
      case 'charge-remove':
        state.statut.charges.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        render();
        break;

      // ----- Simulateur TVA -----
      case 'tva-toggle-ca':
        state.tva.form.caMensuel = !state.tva.form.caMensuel;
        render();
        break;
      case 'tvadep-add':
        state.tva.depenses.push({ nom:'', montant:'', frequence:'mensuelle', taux:'0.2', recup:'100', categorie:'' });
        render();
        break;
      case 'tvadep-remove':
        state.tva.depenses.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        if(!state.tva.depenses.length)
          state.tva.depenses = [{ nom:'', montant:'', frequence:'mensuelle', taux:'0.2', recup:'100', categorie:'' }];
        render();
        break;
      case 'tva-compute':
        lancerSimulationTVA();
        break;
      case 'tva-back':
      case 'tva-hist':
        state.tva.step = 'form';
        render();
        break;
      case 'tva-new':
        state.tva.result = null; state.tva.formError = null;
        state.tva.step = 'form';
        render();
        break;
      case 'tva-print':
        window.print();
        break;
      case 'tva-hist-view': {
        var th = state.tva.historique[parseInt(el.getAttribute('data-i'), 10)];
        if(th){
          state.tva.form = Object.assign({}, th.form);
          state.tva.depenses = (th.depenses || []).map(function(d){ return Object.assign({}, d); });
          if(!state.tva.depenses.length)
            state.tva.depenses = [{ nom:'', montant:'', frequence:'mensuelle', taux:'0.2', recup:'100', categorie:'' }];
          state.tva.result = calculerTVA(state.tva.form, state.tva.depenses);
          state.tva.step = 'result';
          render();
        }
        break;
      }
      case 'tva-hist-delete':
        state.tva.historique.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        saveHistTVA(state.tva.historique);
        render();
        break;

      // ----- Comparateur versement libératoire -----
      case 'vl-toggle-ca':
        state.vl.form.caMensuel = !state.vl.form.caMensuel;
        render();
        break;
      case 'vl-compare':
        lancerComparaisonVL();
        break;
      case 'vl-back':
        state.vl.step = 'form';
        render();
        break;
      case 'vl-new':
        state.vl.result = null;
        state.vl.formError = null;
        state.vl.step = 'form';
        render();
        break;
      case 'vl-print':
        window.print();
        break;
      case 'vl-hist-view': {
        var vh = state.vl.historique[parseInt(el.getAttribute('data-i'), 10)];
        if(vh){
          state.vl.form = Object.assign({}, vh.form);
          var c2 = Object.assign({}, vh.form);
          if(vh.form.caMensuel) c2.ca = String((parseFloat(vh.form.ca) || 0) * 12);
          state.vl.result = comparerVL(c2);
          state.vl.step = 'result';
          render();
        }
        break;
      }
      case 'vl-hist-delete':
        state.vl.historique.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        saveHistVL(state.vl.historique);
        render();
        break;

      // ----- Historique -----
      case 'hist-view': {
        var hv = state.historique[parseInt(el.getAttribute('data-i'), 10)];
        if(hv){
          state.sim.depenses = hv.depenses.map(function(d){
            return { nom:d.nom, montant:d.montant, motif:d.motif };
          });
          state.sim.result = hv.result;
          state.sim.openResult = 0;
          state.sim.syncFait = null;
          state.sim.step = 'result';
          render();
        }
        break;
      }
      case 'hist-delete':
        state.historique.splice(parseInt(el.getAttribute('data-i'), 10), 1);
        saveHistorique(state.historique);
        render();
        break;
    }
  });

  // Saisie des champs du simulateur : met à jour l'état sans re-render (pour ne
  // pas perdre le focus / le curseur pendant la frappe).
  function onSimField(e){
    // Champ d'une dépense : data-dep-field + data-i (index dans la liste)
    var dl = e.target.closest('[data-dep-field]');
    if(dl){
      var i = parseInt(dl.getAttribute('data-i'), 10);
      var d = state.sim.depenses[i];
      if(d){
        d[dl.getAttribute('data-dep-field')] = dl.value;
        // Tient le titre de la carte à jour pendant la frappe.
        if(dl.getAttribute('data-dep-field') === 'nom'){
          var card = dl.closest('.dep-card');
          var titre = card && card.querySelector('.dep-title');
          if(titre){
            var v = (dl.value || '').trim();
            titre.textContent = v || 'Nouvelle dépense';
            titre.classList.toggle('empty', !v);
          }
        }
      }
      return;
    }
    // Photo de profil : redimensionnée à 256 px avant d'aller en localStorage,
    // sinon une photo d'iPhone sature le quota du navigateur.
    // Curseur de projection de l'accueil : mise à jour directe, pas de re-render.
    var ac = e.target.closest('[data-accueil-ca]');
    if(ac){ majAccueilProjection(parseFloat(ac.value)); return; }
    // Recherche du lexique : on met à jour la grille sans re-render (focus gardé).
    // Le curseur de sérénité : la bulle et le remplissage suivent le doigt.
    var sc = e.target.closest('[data-serenite-curseur]');
    if(sc){
      var pere = sc.closest('.onb-curseur');
      pere.style.setProperty('--p', ((sc.value - 1) / 9 * 100) + '%');
      pere.querySelector('.onb-cur-v').textContent = sc.value;
      return;
    }
    // « Combien mettre de côté » : le résultat suit la frappe, sans re-render
    // complet (sinon le champ perdrait le focus à chaque chiffre).
    var cm = e.target.closest('[data-cote-input]');
    if(cm){
      state.sim.coteMontant = cm.value;
      majCote();
      return;
    }
    var ci = e.target.closest('[data-chat-input]');
    if(ci){
      // Le champ grandit avec le texte, jusqu'à une limite raisonnable.
      ci.style.height = 'auto';
      ci.style.height = Math.min(ci.scrollHeight, 140) + 'px';
      majFormeSaisie(ci);
      return;
    }
    var ls = e.target.closest('[data-lex-search]');
    if(ls){ state.lexRecherche = ls.value; majLexique(); return; }
    var ds = e.target.closest('[data-dep-search]');
    if(ds){ state.depRecherche = ds.value; majGuideDep(); return; }
    // Charge ajoutée depuis un simulateur : on ne l'écrit dans le profil que si
    // la case est cochée. Sans elle, la simulation reste un test.
    var garder = e.target.closest('[data-sim-garder]');
    if(garder){
      var iG = parseInt(garder.getAttribute('data-sim-garder'), 10);
      var lstG = garder.getAttribute('data-cle') === 'statut' ? state.statut.charges : state.optim.charges;
      var cG = lstG[iG];
      if(cG){
        cG.dansProfil = garder.checked;
        if(garder.checked) synchroniserChargeVersProfil(cG);
        else retirerChargeDuProfil(cG);
      }
      return;
    }
    var dga = e.target.closest('[data-dga]');
    if(dga){ state.depAjout[dga.getAttribute('data-dga')] = dga.value; return; }
    // Parcours TVA : la saisie alimente le simulateur ET le profil.
    var tf = e.target.closest('[data-tvo-form]');
    if(tf){
      var champT = tf.getAttribute('data-tvo-form');
      state.tva.form[champT] = tf.value;
      if(champT === 'ca'){ state.tva.form.caMensuel = false;
        state.profil.ca = tf.value; state.profil.periodeCa = 'annuel'; }
      if(champT === 'partRecup'){
        var r = Math.min(100, Math.max(0, parseFloat(tf.value) || 0));
        state.tva.form.partProNon = String(100 - r);
        state.profil.clientRecup = String(r);
        state.profil.clientProNon = String(100 - r);
        var aide = document.querySelector('.tvo-aide');
        if(aide) aide.textContent = 'Les ' + (100 - r) + '% restants ne la récupèrent pas : '
          + 'particuliers, auto-entrepreneurs en franchise, associations';
      }
      saveProfil(state.profil);
      return;
    }
    var tc = e.target.closest('[data-tvo-charge]');
    if(tc){
      var iC = parseInt(tc.getAttribute('data-i'), 10);
      var dC = state.tva.depenses[iC];
      if(dC){ dC[tc.getAttribute('data-tvo-charge')] = tc.value; synchroniserChargeProfil(iC); }
      return;
    }
    var tb = e.target.closest('[data-tvo-brouillon]');
    if(tb){ state.tva.brouillon[tb.getAttribute('data-tvo-brouillon')] = tb.value; return; }
    // Parcours VL : en mode essai, rien ne remonte au profil.
    var vlo = e.target.closest('[data-vl-onb]');
    if(vlo){
      var champV = vlo.getAttribute('data-vl-onb');
      state.vl.form[champV] = vlo.value;
      if(!state.vl.essai){
        var vers = { ca:'ca', parts:'parts', autresRevenus:'autresRevenus', rfr:'rfr' }[champV];
        if(vers){
          state.profil[vers] = vlo.value;
          if(champV === 'ca') state.profil.periodeCa = 'annuel';
          saveProfil(state.profil);
        }
      }
      return;
    }
    var imp = e.target.closest('[data-import-donnees]');
    if(imp){
      if(imp.files && imp.files[0]) importerDonnees(imp.files[0]);
      return;
    }
    // Même traitement que le profil, mais la photo atterrit dans les réponses
    // de l'onboarding (elle sera versée au profil à la fin).
    var pho = e.target.closest('[data-onb-photo]');
    if(pho){
      var f2 = pho.files && pho.files[0];
      if(!f2) return;
      var l2 = new FileReader();
      l2.onload = function(ev){
        var im = new Image();
        im.onload = function(){
          var c2 = Math.min(im.width, im.height);
          var cv2 = document.createElement('canvas');
          cv2.width = cv2.height = 256;
          cv2.getContext('2d').drawImage(im, (im.width - c2) / 2, (im.height - c2) / 2,
                                         c2, c2, 0, 0, 256, 256);
          state.onboarding.rep.photo = cv2.toDataURL('image/jpeg', 0.85);
          majOnboarding();
        };
        im.src = ev.target.result;
      };
      l2.readAsDataURL(f2);
      return;
    }
    var ph = e.target.closest('[data-profil-photo]');
    if(ph){
      var fichier = ph.files && ph.files[0];
      if(!fichier) return;
      var lecteur = new FileReader();
      lecteur.onload = function(ev){
        var img = new Image();
        img.onload = function(){
          var cote = Math.min(img.width, img.height);      // recadrage carré centré
          var cv = document.createElement('canvas');
          cv.width = cv.height = 256;
          cv.getContext('2d').drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2,
                                        cote, cote, 0, 0, 256, 256);
          state.profil.photo = cv.toDataURL('image/jpeg', 0.85);
          profilTouche();
          render();
        };
        img.src = ev.target.result;
      };
      lecteur.readAsDataURL(fichier);
      return;
    }
    var pl = e.target.closest('[data-profil-field]');
    if(pl){
      var kp = pl.getAttribute('data-profil-field');
      // L'IS n'existe pas en micro-entreprise : on refuse la combinaison au
      // lieu de la laisser fausser tous les simulateurs en silence.
      if(kp === 'regime' && formeExclutIS(state.profil.forme) && pl.value === REGIME_IS){
        state.profil.regime = REGIME_IR;
        state.pfAlerte = 'micro-is';
        profilTouche();
        render();
        return;
      }
      state.profil[kp] = pl.value;
      profilTouche();
      // La forme juridique ouvre/ferme des champs, et la répartition clientèle a
      // son total à recalculer. Les autres champs ne re-rendent pas : on garde le focus.
      if(kp === 'forme'){
        // Passer en micro rend l'IS impossible : on remet le seul régime
        // valable plutôt que de laisser une incohérence à l'écran.
        if(formeExclutIS(pl.value) && state.profil.regime === REGIME_IS){
          state.profil.regime = REGIME_IR;
        }
        render();
      }
      else if(/^client/.test(kp)) majTotalClientele();
      return;
    }
    // Charges du profil - partagées par 3 simulateurs.
    var pc = e.target.closest('[data-pcharge-field]');
    if(pc){
      var ic = parseInt(pc.getAttribute('data-i'), 10);
      var ligne = state.profil.charges[ic];
      if(ligne){
        ligne[pc.getAttribute('data-pcharge-field')] = pc.value;
        profilTouche();
        majTotalCharges();
      }
      return;
    }
    // Champs du comparateur. La catégorie et l'année changent l'affichage : on re-rend.
    var vl = e.target.closest('[data-vl-field]');
    if(vl){
      var nom = vl.getAttribute('data-vl-field');
      state.vl.form[nom] = vl.value;
      if(nom === 'categorie' || nom === 'annee') render();
      return;
    }
    // --- Simulateur « optimiser » : recalcul immédiat, sans re-render du formulaire ---
    var of = e.target.closest('[data-optim-field]');
    if(of){
      state.optim.form[of.getAttribute('data-optim-field')] = of.value;
      if(of.getAttribute('data-optim-field') === 'caAnnuel') state.optim.projection = null;
      renderOptimResults();
      return;
    }
    var oc = e.target.closest('[data-ocharge-field]');
    if(oc){
      var oi = parseInt(oc.getAttribute('data-i'), 10);
      if(state.optim.charges[oi]){
        state.optim.charges[oi][oc.getAttribute('data-ocharge-field')] = oc.value;
        renderOptimResults();
      }
      return;
    }
    var lf = e.target.closest('[data-levier-field]');
    if(lf){
      state.optim.leviers[lf.getAttribute('data-levier-field')] = lf.value;
      renderOptimResults();
      return;
    }
    var orange = e.target.closest('[data-optim-range]');
    if(orange){
      var quoi = orange.getAttribute('data-optim-range');
      if(quoi === 'projection'){
        state.optim.projection = parseFloat(orange.value) || 0;
        var opv = document.getElementById('optim-proj-value');
        if(opv) opv.textContent = fmtEur(state.optim.projection);
      } else {
        state.optim.form[quoi] = orange.value;
        // Met à jour l'intitulé du curseur sans reconstruire le formulaire.
        var lab = orange.closest('.field') && orange.closest('.field').querySelector('label strong');
        if(lab) lab.textContent = orange.value + ' %';
      }
      renderOptimResults();
      return;
    }
    // --- Simulateur « société » : recalcul immédiat, sans re-render du formulaire ---
    var sf = e.target.closest('[data-statut-field]');
    if(sf){
      state.statut.form[sf.getAttribute('data-statut-field')] = sf.value;
      if(sf.getAttribute('data-statut-field') === 'caAnnuel') state.statut.projection = null;
      renderStatutResults();
      return;
    }
    var cf = e.target.closest('[data-charge-field]');
    if(cf){
      var ci = parseInt(cf.getAttribute('data-i'), 10);
      if(state.statut.charges[ci]){
        state.statut.charges[ci][cf.getAttribute('data-charge-field')] = cf.value;
        var tot = document.querySelector('.charge-total');
        if(tot) tot.innerHTML = 'Total : <strong>' + fmtEur(totalCharges()) + '</strong> par an';
        renderStatutResults();
      }
      return;
    }
    var pf = e.target.closest('[data-param-field]');
    if(pf){
      var chemin = pf.getAttribute('data-param-field').split('.');
      var v = parseFloat(pf.value);
      if(!isNaN(v)){
        // Les taux sont saisis en %, sauf la CFE et le plafond d'IS (en €).
        var enEuros = (chemin[chemin.length-1] === 'cfe' || chemin[chemin.length-1] === 'plafondReduit');
        var cible = state.statut.params;
        for(var i = 0; i < chemin.length - 1; i++) cible = cible[chemin[i]];
        cible[chemin[chemin.length-1]] = enEuros ? v : v / 100;
        renderStatutResults();
      }
      return;
    }
    var rg = e.target.closest('[data-statut-range]');
    if(rg){
      state.statut.projection = parseFloat(rg.value) || 0;
      var pv = document.getElementById('proj-value');
      if(pv) pv.textContent = fmtEur(state.statut.projection);
      renderStatutResults();
      return;
    }
    // Champs du simulateur TVA.
    var tv = e.target.closest('[data-tva-field]');
    if(tv){
      var n2 = tv.getAttribute('data-tva-field');
      state.tva.form[n2] = tv.value;
      // Ces champs modifient l'affichage (encarts, champs conditionnels, total).
      if(['franchise','exoneree','partRecup','partProNon'].indexOf(n2) !== -1) render();
      return;
    }
    // Champs d'une dépense du simulateur TVA.
    var td = e.target.closest('[data-tvadep-field]');
    if(td){
      var i2 = parseInt(td.getAttribute('data-i'), 10);
      var dep = state.tva.depenses[i2];
      if(dep){
        var n3 = td.getAttribute('data-tvadep-field');
        dep[n3] = td.value;
        if(n3 === 'categorie'){ render(); return; }
        if(n3 === 'nom'){
          var carte = td.closest('.dep-card');
          var titre2 = carte && carte.querySelector('.dep-title');
          if(titre2){
            var v2 = (td.value || '').trim();
            titre2.textContent = v2 || 'Nouvelle dépense';
            titre2.classList.toggle('empty', !v2);
          }
        }
      }
    }
  }
  document.getElementById('app').addEventListener('input', onSimField);
  document.getElementById('app').addEventListener('change', onSimField);

  // Le brouillon de la bulle d'aide est recopié dans l'état à la frappe, sans
  // rendu : la bulle est reconstruite à chaque render(), et sans ça le texte
  // repartait à zéro dès qu'on cliquait ailleurs dans l'app.
  document.addEventListener('input', function(e){
    var t = e.target;
    if(!t || !t.getAttribute) return;
    if(t.hasAttribute('data-sav-texte')) state.sav.texte = t.value;
    else if(t.hasAttribute('data-sav-email')) state.sav.email = t.value;
    else return;
    state.sav.touche = Date.now();   // point de départ de la péremption
    savBrouillonEcrire();
  });

  // Exposé pour vérifier le moteur fiscal (tests, débogage).
  window.FreeHub = { comparerVL: comparerVL, impotBareme: impotBareme, FISCAL: FISCAL,
                     calculerTVA: calculerTVA, tvaDansTTC: tvaDansTTC, annualiser: annualiser };

  // Relevé AVANT le premier rendu : celui-ci enregistre des clés (badges) qui
  // feraient croire à un usage local préexistant chez un tout nouveau visiteur.
  var usageLocalInitial = localStorageOk('freehub_onboarded')
    || CLES_SAUVEGARDE.some(function(k){ return localStorageOk(k); });

  // L'écran d'où l'on vient, avant le premier rendu : l'onboarding, s'il doit
  // se jouer, reprend la main juste après (il teste state.onboarding.actif).
  lireHash();

  render();
  // Un objectif rouvert depuis l'URL n'a pas d'entrée d'historique à lui :
  // sans ça, la flèche « retour » sortirait de l'app au lieu de le refermer.
  majHistorique();
  // Après le 1er rendu, les badges déjà mérités sont marqués sans célébration ;
  // seuls les déblocages suivants déclenchent l'animation.
  state.badgesInitialises = true;
  // Première visite depuis l'arrivée de la pastille : les badges déjà en
  // vitrine ne sont pas des nouveautés. Sans ce calage, tout le monde verrait
  // d'un coup une pastille annonçant huit « nouveaux » badges vieux d'un mois.
  try {
    if(localStorage.getItem('freehub_badges_vus') === null) badgesMarquerVus();
  } catch(e){}
  // Session ouverte d'une visite précédente ? On la reprend et on synchronise.
  verifierSession();
})();
