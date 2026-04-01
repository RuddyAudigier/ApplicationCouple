-- Table: poesie_widget_messages
-- Objectif: 1 message "épinglé" par destinataire (affiché dans le widget).
-- Quand on envoie un nouveau texte au widget, il remplace l'ancien (upsert sur recipient_email).

create table if not exists public.poesie_widget_messages (
  recipient_email text primary key,
  content text not null,
  sender_email text not null,
  updated_at timestamptz not null default now()
);

create index if not exists poesie_widget_messages_updated_at_idx on public.poesie_widget_messages (updated_at desc);

-- Keep updated_at fresh on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
marche
drop trigger if exists set_poesie_widget_messages_updated_at on public.poesie_widget_messages;
create trigger set_poesie_widget_messages_updated_at
before update on public.poesie_widget_messages
for each row
execute function public.set_updated_at();

-- RLS (recommandé)
alter table public.poesie_widget_messages enable row level security;

-- Politiques simples (couple): accessible aux utilisateurs authentifiés.
drop policy if exists "poesie_widget_messages_select_authenticated" on public.poesie_widget_messages;
create policy "poesie_widget_messages_select_authenticated"
on public.poesie_widget_messages for select
to authenticated
using (true);

drop policy if exists "poesie_widget_messages_insert_authenticated" on public.poesie_widget_messages;
create policy "poesie_widget_messages_insert_authenticated"
on public.poesie_widget_messages for insert
to authenticated
with check (true);

drop policy if exists "poesie_widget_messages_update_authenticated" on public.poesie_widget_messages;
create policy "poesie_widget_messages_update_authenticated"
on public.poesie_widget_messages for update
to authenticated
using (true)
with check (true);

drop policy if exists "poesie_widget_messages_delete_authenticated" on public.poesie_widget_messages;
create policy "poesie_widget_messages_delete_authenticated"
on public.poesie_widget_messages for delete
to authenticated
using (true);

