// Mesure du smart link : un comptage anonyme, envoyé directement à PostHog.
//
// Pourquoi mesurer cette page. C'est le seul maillon manquant de la boucle
// virale et des réseaux sociaux : l'app sait combien d'énigmes sont partagées
// (`story_shared`, `referral_invite_sent`) et combien de gens l'ouvrent
// (`app_opened`), mais entre les deux, personne ne comptait les clics — ni ceux
// d'un partage, ni ceux d'un lien en bio Instagram ou TikTok (`?s=ig-bio`…).
// Sans ce chiffre, un lien qui ne convertit pas est indiscernable d'un lien que
// personne n'a cliqué, et ce sont deux problèmes opposés.
//
// Pourquoi pas le SDK PostHog. Il se charge en asynchrone ; or la page
// redirige vers le store dans la milliseconde. Sur mobile, le script du SDK
// n'a jamais le temps de s'exécuter : ses appels restent dans sa file
// d'attente et partent avec la page — c'est-à-dire nulle part. Un `sendBeacon`
// direct, lui, est remis au navigateur et part même si la page disparaît.
//
// Pourquoi anonyme. Aucun cookie, aucun stockage local, aucun identifiant
// conservé, aucun profil de personne (`$process_person_profile: false`) : un
// identifiant tiré au hasard à chaque visite, le canal et la plateforme. C'est
// un compteur de clics, pas un suivi — et c'est ce qui permet de l'envoyer
// avant que le visiteur ait pu répondre à quoi que ce soit, puisqu'il est
// redirigé aussitôt. Pour que PostHog ne garde pas non plus l'adresse IP :
// activer « Discard client IP data » dans les réglages du projet.
//
// Projet PostHog : `thehiddenside`, le même que l'app (cloud EU), pour que
// « clics → installations → premières parties » se lise dans un seul projet.
(function () {
  // Clé de projet publique par nature : elle ne permet que d'écrire des
  // événements, jamais d'en lire. ⚠️ Cloud EU : une mauvaise région n'échoue
  // pas bruyamment, les événements partent et n'arrivent jamais.
  var KEY = 'phc_n6voye2Kx8M8yRgnG4oHp94w2XrcPZTVvsKbHkhGJ87D';
  var ENDPOINT = 'https://eu.i.posthog.com/i/v0/e/';

  var randomId = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  };

  // Ne lève jamais d'exception : un bloqueur de publicité peut refuser
  // l'envoi, et aucun problème de mesure ne doit empêcher quelqu'un d'arriver
  // sur le store.
  window.countClick = function (event, props) {
    try {
      var properties = { $process_person_profile: false, $lib: 'smartlink' };
      for (var k in props) if (props[k] !== undefined) properties[k] = props[k];
      var body = JSON.stringify({
        api_key: KEY, event: event, distinct_id: randomId(),
        timestamp: new Date().toISOString(), properties: properties
      });
      // `text/plain` : seul type que `sendBeacon` envoie sans requête préalable
      // (CORS). PostHog lit le JSON quel que soit le type annoncé.
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
      // Repli : `keepalive` survit lui aussi à la navigation.
      fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } });
    } catch (e) { /* la mesure ne doit jamais bloquer une redirection */ }
  };

  // Le domaine d'où vient le clic (instagram.com, l.tiktok.com…), sans le
  // reste de l'adresse. `undefined` s'il n'y en a pas ou s'il est illisible.
  window.referrerHost = function () {
    try { return document.referrer ? new URL(document.referrer).hostname : undefined; } catch (e) { return undefined; }
  };
})();
