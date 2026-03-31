-- Ajoute une liste d'exceptions pour les événements récurrents.
-- Exemple: supprimer uniquement "cette occurrence" = ajouter la date (YYYY-MM-DD) dans exceptions.

alter table public.calendrier_evenements
add column if not exists exceptions text[] not null default '{}';

