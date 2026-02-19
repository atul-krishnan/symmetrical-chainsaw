alter table if exists public.learning_campaigns
add column if not exists flow_version int not null default 1;

alter table if exists public.learning_campaigns
drop constraint if exists learning_campaigns_flow_version_check;

alter table if exists public.learning_campaigns
add constraint learning_campaigns_flow_version_check
check (flow_version in (1, 2));

alter table if exists public.learning_modules
add column if not exists media_embeds_json jsonb not null default '[]'::jsonb;

alter table if exists public.learning_modules
add column if not exists quiz_sync_hash text;

alter table if exists public.assignments
add column if not exists material_acknowledged_at timestamptz;

insert into storage.buckets (id, name, public)
values ('module-media', 'module-media', false)
on conflict (id) do nothing;

create policy if not exists "Module media readable by org members"
on storage.objects
for select
using (
  bucket_id = 'module-media'
  and public.is_org_member((storage.foldername(name))[2]::uuid)
);

create policy if not exists "Module media writable by org admins"
on storage.objects
for insert
with check (
  bucket_id = 'module-media'
  and public.is_org_admin((storage.foldername(name))[2]::uuid)
);

create policy if not exists "Module media deletable by org admins"
on storage.objects
for delete
using (
  bucket_id = 'module-media'
  and public.is_org_admin((storage.foldername(name))[2]::uuid)
);
