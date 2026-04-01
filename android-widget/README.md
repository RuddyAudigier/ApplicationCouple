# Nanamoureux Widget (Android)

Ce dossier contient le code d’un **widget Android natif** (AppWidget) qui affiche le dernier “petit mot”.

⚠️ Note: ce template ne contient pas le **Gradle Wrapper** (`gradlew` + `gradle/wrapper/*`). Le plus simple est:

1) Ouvrir Android Studio → New Project → “Empty Activity”
2) Remplacer le contenu du projet `app/` par celui de `android-widget/app/`
3) Copier aussi les fichiers racine:
   - `android-widget/settings.gradle.kts`
   - `android-widget/build.gradle.kts`
   - `android-widget/gradle.properties`

## Config à faire côté serveur (Vercel)

Déployer l’app web et ajouter les variables d’environnement **serveur**:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secret)
- `POESIE_WIDGET_TOKEN` (secret)

API utilisée par le widget:
- `GET /api/poesie-widget?token=...&recipient=...`

## Config dans l’app Android

Lancer l’app Android, puis renseigner:
- URL de base (ex: `https://application-couple.vercel.app`)
- Token (la valeur de `POESIE_WIDGET_TOKEN`)
- Email du destinataire (l’email du téléphone qui doit voir le message)
- URL d’ouverture (ex: `https://application-couple.vercel.app/poesie-widget`)

Ensuite: appui long écran d’accueil → Widgets → “Nanamoureux”.
