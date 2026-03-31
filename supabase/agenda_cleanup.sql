-- Nettoyage automatique de la table calendrier_evenements.
-- Objectif: éviter que la BDD grossisse, sans supprimer "dès que ça passe".
--
-- Stratégie simple:
-- - on garde les événements passés pendant 6 mois
-- - puis on supprime uniquement les événements non-récurrents (recurrence = 'none' ou NULL)
-- - les événements récurrents restent (sinon ils disparaîtraient un jour automatiquement)
--
-- Note: nécessite l'extension pg_cron pour la planification automatique.

create extension if not exists pg_cron;

create or replace function public.cleanup_old_calendar_events(retention_interval interval default interval '6 months')
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.calendrier_evenements
  where (recurrence is null or recurrence = 'none')
    and ((date::text)::date) < ((current_date - retention_interval)::date);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Planification: tous les jours à 03:15 (heure DB).
-- Si tu as une erreur de permissions sur cron.schedule, supprime ce bloc et exécute la fonction via un cron externe.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup_old_calendar_events_daily') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'cleanup_old_calendar_events_daily' limit 1));
  end if;
exception
  when undefined_table then
    null;
end;
$$;

select
  cron.schedule(
    'cleanup_old_calendar_events_daily',
    '15 3 * * *',
    $$select public.cleanup_old_calendar_events(interval '6 months');$$
  );
