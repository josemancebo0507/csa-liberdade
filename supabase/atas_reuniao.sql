-- Execute este SQL no painel do Supabase → SQL Editor
-- Idempotente: pode ser executado mais de uma vez sem erro

-- 1. Bucket de storage
insert into storage.buckets (id, name, public)
values ('atas', 'atas', true)
on conflict (id) do nothing;

-- 2. Políticas de storage (objects)
drop policy if exists "atas_leitura_publica"   on storage.objects;
drop policy if exists "atas_upload_autenticado" on storage.objects;
drop policy if exists "atas_delete_autenticado" on storage.objects;

create policy "atas_leitura_publica"
  on storage.objects for select
  using (bucket_id = 'atas');

create policy "atas_upload_autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'atas');

create policy "atas_delete_autenticado"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'atas');

-- 3. Tabela de atas
create table if not exists atas_reuniao (
  id            uuid primary key default uuid_generate_v4(),
  titulo        varchar(200)  not null,
  data_reuniao  date          not null,
  descricao     text,
  storage_path  text          not null,
  arquivo_nome  varchar(300)  not null,
  tamanho_bytes bigint,
  criado_em     timestamptz   not null default now(),
  atualizado_em timestamptz   not null default now()
);

-- 4. RLS da tabela
alter table atas_reuniao enable row level security;

drop policy if exists "publico_le_atas"   on atas_reuniao;
drop policy if exists "auth_gerencia_atas" on atas_reuniao;

create policy "publico_le_atas"
  on atas_reuniao for select
  using (true);

create policy "auth_gerencia_atas"
  on atas_reuniao for all
  to authenticated
  using (true) with check (true);
