# Nanamoureux (APK unique Android)

Ce dossier contient une **seule app Android** qui inclut :
- l’app web Nanamoureux (dans une WebView)
- le widget “Poésie” (écran d’accueil Android)

## Prérequis

- Android Studio installé
- Ton app web déployée (ex: Vercel)
- Variables serveur Vercel pour l’API widget:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `POESIE_WIDGET_TOKEN`

## Build / install APK

1) Ouvre `android-app/` dans Android Studio.
2) Attends la synchro Gradle.
3) Run sur ton téléphone (USB debug) ou génère un APK:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
4) Désinstalle l’ancienne app “widget only” si tu l’avais installée, pour n’avoir qu’une seule app.

## Config widget

1) Ouvre l’app “Nanamoureux” (l’APK unique).
2) Clique l’icône ⚙️ (en haut à droite) → renseigne:
   - URL app web (ex: `https://application-couple.vercel.app`)
   - URL base API (souvent pareil)
   - `POESIE_WIDGET_TOKEN`
   - Email destinataire (le téléphone qui doit afficher le widget)
3) Ajoute le widget:
   - appui long sur l’écran d’accueil → Widgets → Nanamoureux → déposer

## Connexion (magic link) dans l’APK

Le magic link doit ouvrir l’app Android (pas uniquement le site web).

- L’APK déclare un deep link vers:
  - `https://application-couple.vercel.app/auth/callback`
- Dans Supabase → Authentication → URL Configuration:
  - ajoute `https://application-couple.vercel.app/auth/callback` dans “Additional Redirect URLs”

Astuce:
- après le clic dans l’email, Android peut te proposer “Ouvrir avec Nanamoureux”. Choisis Nanamoureux.
