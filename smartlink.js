// Routage du smart link : envoie le visiteur vers SON store, en transportant le
// nom de canal pour que les installs soient attribuées.
//
// Fichier partagé par `index.html` et `404.html` : c'est le seul endroit à
// modifier. (Avant, la logique était dupliquée dans les deux pages — modifier
// l'une en oubliant l'autre était un piège.)
(function () {
  var APP_STORE_ID = '6754876390';
  var PLAY_PACKAGE = 'app.hiddenside';

  // Provider token Apple, issu du générateur de liens de campagne
  // (App Store Connect → App Analytics). Sans lui, Apple ignore le nom de
  // campagne `ct` et les installs iOS ne sont pas ventilées par canal.
  var APPLE_PT = '128269806';

  // `?s=` identifie le canal (?s=story, ?s=invite, ?s=reddit…) et devient le
  // `ct` d'Apple et l'`utm_source` de Google. Filtré et tronqué : la valeur
  // vient de l'URL, part dans un lien, et Apple limite `ct` à 40 caractères.
  var source = (new URLSearchParams(location.search).get('s') || 'share')
    .replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'share';

  // Forme `/app/apple-store/id…` : celle que produit le générateur d'Apple pour
  // les liens de campagne.
  var ios = 'https://apps.apple.com/app/apple-store/id' + APP_STORE_ID;
  if (APPLE_PT) {
    ios += '?pt=' + encodeURIComponent(APPLE_PT) +
           '&ct=' + encodeURIComponent(source) + '&mt=8';
  }

  // Le `referrer` de Google Play doit contenir une chaîne utm elle-même encodée.
  var play = 'https://play.google.com/store/apps/details?id=' + PLAY_PACKAGE +
    '&referrer=' + encodeURIComponent(
      'utm_source=' + source + '&utm_medium=app&utm_campaign=share');

  var iosLink = document.getElementById('ios');
  var playLink = document.getElementById('play');
  if (iosLink) iosLink.href = ios;
  if (playLink) playLink.href = play;

  var ua = navigator.userAgent || '';
  var platform = /iPhone|iPad|iPod/i.test(ua) ? 'ios'
    : /Android/i.test(ua) ? 'android'
    : 'desktop';

  // Envoi de la mesure AVANT la redirection.
  //
  // `sendBeacon` n'est pas une optimisation, c'est la seule façon d'y arriver :
  // un `location.replace` immédiat annule les requêtes XHR en vol, donc un
  // `capture` normal serait perdu précisément sur les visiteurs qui comptent
  // (ceux qu'on redirige). Le beacon, lui, est remis au système et part même
  // si la page disparaît dans la milliseconde.
  //
  // `countClick` (posthog.js) ne lève jamais d'exception : un bloqueur de
  // publicité peut faire échouer l'envoi, et aucun problème de mesure ne doit
  // empêcher quelqu'un d'arriver sur le store.
  if (window.countClick) {
    window.countClick('smartlink_opened', {
      // `s` est le canal (`story`, `duel`, `ig-bio`, `tt-bio`…, voir le
      // README) : c'est lui qui distingue une boucle virale ou un réseau qui
      // marche d'un canal qu'on croit actif. Il est le même que le `ct`
      // d'Apple et l'`utm_source` de Google dans les liens ci-dessus, donc les
      // rapports des stores et PostHog parlent de la même chose.
      s: source,
      platform: platform,
      // `desktop` n'est pas une anomalie : c'est le cas d'un lien ouvert
      // depuis WhatsApp Web ou un ordinateur, où aucune install ne peut
      // suivre. Le compter à part évite de conclure à un mauvais taux de
      // conversion alors que le problème est le canal de partage.
      sent_to: platform === 'desktop' ? 'choice' : 'store',
      // Le domaine seul (instagram.com, l.tiktok.com…) : l'adresse complète
      // n'apporte rien de plus à la mesure du canal.
      referrer: window.referrerHost ? window.referrerHost() : undefined
    });
  }

  // `replace` et non `href` : le bouton retour du destinataire ne reste pas
  // piégé sur cette page.
  if (platform === 'ios') location.replace(ios);
  else if (platform === 'android') location.replace(play);
  // Ordinateur : on ne devine pas l'appareil, les deux boutons restent
  // affichés (cas courant d'un lien ouvert depuis WhatsApp Web). On mesure
  // alors lequel est choisi — c'est la seule page où le visiteur tranche
  // lui-même, et donc la seule mesure honnête de la préférence de plateforme.
  var tapped = function (store) {
    return function () {
      if (window.countClick) window.countClick('smartlink_store_tapped', { s: source, store: store, platform: platform });
    };
  };
  if (iosLink) iosLink.addEventListener('click', tapped('ios'));
  if (playLink) playLink.addEventListener('click', tapped('play'));
})();
