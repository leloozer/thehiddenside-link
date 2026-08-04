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
  // `replace` et non `href` : le bouton retour du destinataire ne reste pas
  // piégé sur cette page.
  if (/iPhone|iPad|iPod/i.test(ua)) location.replace(ios);
  else if (/Android/i.test(ua)) location.replace(play);
  // Ordinateur : on ne devine pas l'appareil, les deux boutons restent
  // affichés (cas courant d'un lien ouvert depuis WhatsApp Web).
})();
