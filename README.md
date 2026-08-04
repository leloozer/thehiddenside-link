# thehiddenside-link — smart link de The Hidden Side

Page de redirection statique hébergée sur GitHub Pages. Elle route le
destinataire d'un partage vers **son** store (App Store sur iOS, Google Play sur
Android, les deux boutons sur ordinateur) et transporte les paramètres de
campagne qui permettent d'attribuer les installs, gratuitement, sans SDK.

Dépôt volontairement **séparé et public** : GitHub Pages sur un dépôt privé
demande un plan payant, et le code de l'app n'a pas à devenir public pour ça.

- URL publique : `https://leloozer.github.io/thehiddenside-link/`
- Aucun secret dans ce dépôt. Ne rien y ajouter d'autre que la page.

## Publier (une seule fois)

1. Créer un dépôt **public** nommé `thehiddenside-link` sur GitHub, **vide**
   (sans README, sans .gitignore, sans licence).
2. Pousser :
   ```bash
   cd /home/doctreen/Perso/project/thehiddenside-link
   git remote add origin https://github.com/leloozer/thehiddenside-link.git
   git push -u origin main
   ```
3. Dépôt → **Settings → Pages** → *Source* : « Deploy from a branch », branche
   `main`, dossier `/ (root)` → *Save*. La mise en ligne prend une à deux
   minutes.
4. Vérifier depuis un téléphone : l'URL doit ouvrir directement le bon store.

## Brancher dans l'app

Rien à faire : `AppConfig` (dépôt de l'app) compose les deux liens à partir de
cette URL, qui est sa valeur par défaut. Aucun `--dart-define` n'est *nécessaire*
pour que le partage fonctionne.

| Bouton de l'app | Lien produit | Campagne |
|---|---|---|
| Partager une énigme | `…/?s=story` | `story` |
| Invite un ami | `…/?s=invit` | `invit` |

Surcharges disponibles au build si besoin (test, changement d'hébergement) :
`SMART_LINK_BASE` pour changer la base, `SHARE_LINK` / `INVITE_LINK` pour
imposer une URL complète par canal.

```bash
flutter build appbundle \
  --dart-define=STORE_URL_ANDROID=https://play.google.com/store/apps/details?id=app.hiddenside \
  --dart-define=POSTHOG_API_KEY=phc_...
```

Autres canaux, hors app : ajouter le `?s=` voulu à la main (`?s=reddit`,
`?s=insta`…). Le `404.html` étant une copie de la page, n'importe quel chemin
fonctionne aussi (`/go`, `/s/story_12`…) — mais pour un lien partagé, préférer
l'URL racine : les robots d'aperçu peuvent ignorer les balises `og:` servies
avec un statut 404.

## Attribution des installs

Active sur les deux plateformes.

| Plateforme | Mécanisme | Où le lire |
|---|---|---|
| iOS | `?pt=128269806&ct=<canal>&mt=8` | App Store Connect → App Analytics → campagnes |
| Android | `&referrer=utm_source=<canal>&…` | Play Console → acquisition |

Le canal vient du `?s=` de l'URL partagée. Apple limite `ct` à 40 caractères :
la valeur est filtrée et tronquée par le script.

Le `pt` (*provider token*) provient du générateur de liens de campagne d'App
Store Connect. Toute la logique vit dans **`smartlink.js`**, chargé par
`index.html` et `404.html` : c'est le seul fichier à modifier.

## Où lire les résultats

| Étape | Où |
|---|---|
| Partages émis depuis l'app | PostHog : `story_shared`, `referral_invite_sent` |
| Clics sur le lien | GitHub Pages n'expose pas de statistiques — voir ci-dessous |
| Installs par canal | App Store Connect → App Analytics ; Play Console → acquisition |

GitHub Pages ne fournit aucune statistique de trafic. Pour connaître le nombre
de clics (et donc le ratio partages → clics → installs), deux options : passer
l'hébergement sur Cloudflare Pages (gratuit, statistiques incluses), ou ajouter
le snippet web PostHog à la page — au prix d'une bannière de consentement, la
page étant publique et hors app.

## Mettre à jour l'image d'aperçu

`preview.jpg` fait 1200×630 (format attendu par les messageries) et pèse 64 Ko
pour se charger vite. Il a été composé à partir de `assets/images/logo_blanc.png`
et `assets/images/presentation.png` du dépôt de l'app.

Les messageries mettent l'aperçu en cache longtemps : après un remplacement,
changer aussi le nom du fichier (`preview-2.jpg`) dans les balises `og:image`,
sinon l'ancienne image continuera de s'afficher.
