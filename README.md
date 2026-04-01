# Application Couple (Nanamoureux)

Application web pour faciliter l’organisation quotidienne d’un couple (courses, agenda, idées de dates, petits défis, etc.).

## Fonctionnalités (détaillées)

### 1) Connexion (Magic Link)

- Accès protégé par authentification.
- Connexion par lien magique (email) via Supabase Auth.
- Pages concernées:
  - `src/auth/LoginPage.jsx`
  - `src/auth/AuthCallback.jsx`
  - `src/auth/RequireAuth.jsx`
  - `src/auth/AuthProvider.jsx`

Variables utiles:
- `VITE_AUTH_REDIRECT_BASE_URL` (optionnel): base URL utilisée pour construire le callback (sinon `window.location.origin`).

### 2) Accueil / Dashboard

- Page d’accueil avec raccourcis vers les modules.
- Carte “Courses”: compteur dynamique = nombre d’articles *à acheter* (donc `completed = false`) mis à jour en temps réel.
  - Code: `src/HomePage.jsx`
  - Source: table Supabase `courses`.

### 3) Défi du jour / Défis de la semaine

- Objectif: se proposer des petites attentions, à faire aujourd’hui ou sur la semaine.
- Ajout / modification / suppression / validation (done).
- Deux “personnes” (P1 / P2) pour assigner et indiquer “créé par”.
- Catégories prédéfinies + catégorie personnalisée.
- Source: table Supabase `defis` (`src/Page1.jsx`).

Champs utilisés (attendus) côté BDD:
- `title` (text), `note` (text), `category` (text)
- `assigned_to` (text), `created_by` (text)
- `scope` (text: `day` | `week`)
- `target_date` (date, pour `day`)
- `week_start` (date, pour `week`)
- `completed` (bool)
- `created_at` (timestamptz)

### 4) Courses (liste + panier)

- Ajout d’un article avec catégorie.
- Modification (texte + catégorie).
- Suppression d’un article.
- “À acheter” vs “Déjà dans le panier” via `completed`.
- Bouton “Vider” = suppression de tous les `completed = true`.
- Mise à jour temps réel (subscription `postgres_changes`).
- Source: table Supabase `courses` (`src/Page2.jsx`).

Champs utilisés (attendus) côté BDD:
- `text` (text), `category` (text)
- `completed` (bool)
- `created_at` (timestamptz)

### 5) Agenda (mois / semaine / jour)

- Vues: mois, semaine, jour (affichage par défaut: **semaine**).
- Création d’un événement:
  - date
  - heure (optionnelle)
  - durée (si heure renseignée)
  - type (date/vacances/autre/pro)
  - répétition: aucune / jour / semaine / mois / année
- UX “grille horaire”: cliquer sur une case (ex: lundi 09:00) ouvre directement le modal avec:
  - la date cliquée
  - l’heure pré-remplie (arrondie à 00 ou 30)
  - une durée par défaut de 1h

Suppression:
- Événement non récurrent: confirmation simple puis suppression en BDD.
- Événement récurrent: choix au moment de supprimer:
  - supprimer **uniquement ce jour**
  - supprimer **toute la série**
  - annuler
- “Supprimer uniquement ce jour” ajoute la date (YYYY-MM-DD) dans `exceptions` (liste d’occurrences masquées).

All-day:
- Les événements sans heure (`time = null`) sont affichés dans une ligne “Toute la journée” en vue semaine/jour.

Synchronisation / export:
- Export `.ics` côté front (bouton de téléchargement).
- Flux `.ics` côté API pour s’abonner depuis Proton/Outlook/Apple Calendar:
  - Endpoint: `api/calendar.ics.js`
  - Optionnel: protection par token via `CALENDAR_FEED_TOKEN` (query `?token=...` ou header `x-calendar-token`)

Nettoyage automatique (anti-BDD qui grossit):
- Objectif: éviter d’accumuler des milliers de lignes d’événements passés **sans les supprimer immédiatement**.
- Stratégie mise en place:
  - on conserve les événements passés pendant **6 mois**
  - puis on supprime **uniquement** les événements **non récurrents** (`recurrence = 'none'` ou `NULL`)
  - les événements récurrents sont conservés (sinon ils finiraient par être supprimés un jour)
- Script: `supabase/agenda_cleanup.sql`
  - Crée une fonction `public.cleanup_old_calendar_events(interval '6 months')`
  - Planifie un cron quotidien via `pg_cron` (si disponible sur ton instance Supabase)

Scripts Supabase liés à l’agenda:
- Exceptions récurrences: `supabase/calendrier_evenements_exceptions.sql`
- Purge 6 mois: `supabase/agenda_cleanup.sql`

Champs utilisés (attendus) côté BDD (`calendrier_evenements`):
- `date` (date ou text `YYYY-MM-DD`)
- `title` (text)
- `type` (text)
- `time` (time ou text `HH:MM`, nullable)
- `duration` (numeric, nullable; en heures)
- `recurrence` (text: `none|daily|weekly|monthly|yearly`)
- `exceptions` (text[]; dates `YYYY-MM-DD` à masquer)
- `created_at` (timestamptz)

### 6) Idées de dates (romantique)

- Interface “romantique” pour stocker des idées de dates.
- Ajout / modification / suppression.
- Tags d’ambiance (Jazz / Romantique / Cozy / Aventure).
- Suggestion de base quand la liste est vide: “Aller à un bar de jazz”.
- Mise à jour temps réel (subscription `postgres_changes`).
- Source: table Supabase `idees_dates` (`src/Page5.jsx`).
- Script de création + RLS: `supabase/idees_dates.sql`

Champs utilisés:
- `title` (text)
- `mood` (text)
- `place` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### 7) Poésie (petits mots)

- Un espace pour écrire des petits mots / phrases à partager.
- Deux modes:
  - **Partagé**: visible par le couple (recipient vide)
  - **À mon amour**: adressé à un email (destinataire) — pratique pour “envoyer à l’autre”
- Option **📌 Widget** dans l’éditeur:
  - envoie un texte “épinglé” au widget
  - remplace automatiquement le précédent (pour ne pas brouiller les messages)
- Mise à jour temps réel (subscription `postgres_changes`).
- Source: table Supabase `petits_mots` (`src/Page4.jsx`).
- Script de création + RLS: `supabase/petits_mots.sql`
- “Mode widget” (plein écran) à épingler sur l’écran d’accueil: route ` /poesie-widget `.

Champs utilisés:
- `content` (text)
- `sender_email` (text)
- `recipient_email` (text, nullable)
- `created_at` (timestamptz)

### 8) Budget (répartition)

- Calcul local (sans BDD) pour répartir des dépenses selon les revenus.
- Page: `src/Page6.jsx`

## Schéma BDD (simplifié)

```
auth.users
  └─ (utilisé par Supabase Auth)

public.defis
  - id, created_at
  - title, note, category
  - assigned_to, created_by
  - scope (day|week)
  - target_date, week_start
  - completed

public.courses
  - id, created_at
  - text, category
  - completed

public.calendrier_evenements
  - id, created_at
  - date, title, type
  - time (nullable), duration (nullable)
  - recurrence (none|daily|weekly|monthly|yearly)
  - exceptions (text[]; occurrences masquées)

public.idees_dates
  - id, created_at
  - title, mood
  - place (nullable), notes (nullable)

public.petits_mots
  - id, created_at
  - content
  - sender_email
  - recipient_email (nullable; NULL = partagé)

public.poesie_widget_messages
  - recipient_email (PK)
  - content
  - sender_email
  - updated_at
```

## Outils technologiques utilisés

- Frontend: React + Vite
- Routing: `react-router-dom`
- UI/icons: `lucide-react` + CSS custom
- BDD + temps réel + auth: Supabase (`@supabase/supabase-js`)
- API `.ics` (serverless): `api/calendar.ics.js` (prévu pour déploiement type Vercel)

## Pourquoi j’ai fait cette application

Je suis en couple et je voulais une app simple (et jolie) pour faciliter ma vie quotidienne avec ma partenaire: s’organiser, penser aux petites attentions, planifier, et garder des idées de sorties.

## Installation / Configuration (recommandé)

1) Installer les dépendances:
   - `npm install`
2) Configurer l’accès Supabase côté client:
   - créer `.env` à partir de `.env.example`
   - renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3) Créer/mettre à jour les tables Supabase:
   - `supabase/idees_dates.sql`
   - `supabase/petits_mots.sql`
   - `supabase/poesie_widget_messages.sql`
   - `supabase/calendrier_evenements_exceptions.sql`
   - `supabase/agenda_cleanup.sql`
4) Lancer en dev:
   - `npm run dev`

### Installation sur téléphone (PWA)

L’app est installable comme une PWA:
- iPhone (Safari): Partager → “Sur l’écran d’accueil”
- Android (Chrome): menu → “Installer l’application”

Astuce “widget” (sans app native):
- ouvre ` /poesie-widget ` puis “Ajouter à l’écran d’accueil” pour avoir un raccourci plein écran qui affiche le dernier petit mot.

### Widget Android (natif)

Un vrai widget Android nécessite une app Android. Un projet minimal est fourni dans `android-widget/`.

1) Déployer l’app (ex: Vercel) et configurer les variables serveur:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POESIE_WIDGET_TOKEN` (secret de ton choix)
2) Le widget lit l’API:
   - `GET /api/poesie-widget?token=...&recipient=...`
3) Ouvrir `android-widget/` dans Android Studio, lancer l’app, puis renseigner:
   - URL de base (ex: `https://application-couple.vercel.app`)
   - token (`POESIE_WIDGET_TOKEN`)
   - email du destinataire (le téléphone qui doit voir le mot)
   - URL d’ouverture de l’app (ex: `https://application-couple.vercel.app/poesie-widget`)
4) Sur Android: appui long sur l’écran d’accueil → Widgets → “Nanamoureux” → ajouter.

Note: `android-widget/` est un template à importer dans Android Studio (voir `android-widget/README.md`).

Variables côté serveur (pour `api/calendar.ics.js`) — à mettre sur Vercel/serveur, pas dans le client:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ne jamais exposer au navigateur)
- `CALENDAR_FEED_TOKEN` (optionnel)
