-- Site Jassiara (Facilite): mesma estrutura do banco do site Jason Dias (cteahzplamqnjkuxnkva, lida em 22/10/2026),
-- + temporada / imóvel na planta, campos de parceria entre os dois sites e a página inicial (pré-site) editável.
create extension if not exists pgcrypto;

create type public.finalidade_tp as enum ('aluguel','venda','temporada');
create type public.mobilia_tp as enum ('mobiliado','semi','sem','planejados');
create type public.status_tp as enum ('ativo','pausado');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  comissao_pct numeric(5,2) default 0,
  observacoes text,
  created_at timestamptz default now()
);

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null unique,
  descricao text,
  finalidade public.finalidade_tp not null,
  categoria text not null,
  mobilia public.mobilia_tp not null default 'sem',
  bairro text not null,
  cidade text not null default 'João Pessoa',
  estado text not null default 'PB',
  referencia text,
  endereco text,
  quartos integer default 0,
  suites integer default 0,
  banheiros integer default 0,
  vagas integer default 0,
  area_m2 numeric(8,2),
  preco_cents bigint not null default 0,
  condominio_cents bigint default 0,
  iptu_cents bigint default 0,
  youtube_url text,
  video_id text,
  capa_url text,
  parceiro_id uuid references public.parceiros(id) on delete set null,
  parceiro_pct numeric(5,2),
  status public.status_tp not null default 'ativo',
  destaque boolean default false,
  ordem integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  video_file_url text,
  andar text,
  codigo text,
  cep text,
  zap_ativo boolean default true,
  zap_destaque text default 'STANDARD',
  numero text,
  complemento text,
  features jsonb default '[]'::jsonb,
  ano_construcao integer,
  condominio_tipo text default 'valor',
  iptu_tipo text default 'valor',
  contato_interno text,
  condominio_inclui text,
  agua_tipo text default 'nao_informado',
  gas_tipo text default 'nao_informado',
  captacao text default 'propria',
  parceiro_nome text,
  parceiro_whatsapp text,
  posicao_solar text,
  -- novos (Jassiara)
  estagio text check (estagio in ('pronto','planta')),           -- venda: pronto ou na planta
  previsao_entrega text,                                         -- na planta: ex. "dez/2028"
  compartilhar_parceria boolean not null default false,          -- aparece também no site Jason Dias
  origem_site text not null default 'jassiara' check (origem_site in ('jassiara','jason')),
  origem_id uuid                                                 -- id do imóvel no banco de origem (sincronização da parceria)
);
create unique index imoveis_codigo_uniq on public.imoveis (codigo) where codigo is not null;
create unique index imoveis_origem_uniq on public.imoveis (origem_site, origem_id) where origem_id is not null;
create index idx_imoveis_status on public.imoveis (status);
create index idx_imoveis_finalidade on public.imoveis (finalidade);
create index idx_imoveis_bairro on public.imoveis (bairro);
create index idx_imoveis_categoria on public.imoveis (categoria);
create index idx_imoveis_mobilia on public.imoveis (mobilia);
create index idx_imoveis_preco on public.imoveis (preco_cents);
create trigger trg_imoveis_updated before update on public.imoveis for each row execute function public.set_updated_at();

create table public.imovel_fotos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  path text,
  url text not null,
  ordem integer default 0,
  created_at timestamptz default now(),
  thumb_url text,
  wide_url text
);
create index idx_fotos_imovel on public.imovel_fotos (imovel_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references public.imoveis(id) on delete set null,
  origem text default 'whatsapp',
  created_at timestamptz default now(),
  webhook_status text default 'pendente',
  webhook_erro text,
  webhook_enviado_em timestamptz,
  webhook_tentativas integer default 0,
  origin_lead_id text unique,
  canal text,
  temperatura text,
  transacao text,
  nome text,
  email text,
  telefone text,
  mensagem text,
  codigo_imovel text,
  payload jsonb
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_webhook_status_idx on public.leads (webhook_status);

create table public.site_config (
  key text primary key,
  value text
);

-- Página inicial (pré-site): um botão por serviço, editável pelo painel
create table public.presite_botoes (
  id uuid primary key default gen_random_uuid(),
  ordem integer not null default 0,
  rotulo text not null,
  subtitulo text,
  icone text,                                                    -- emoji ou nome de ícone
  tipo text not null default 'whatsapp' check (tipo in ('site','whatsapp','link')),
  destino text,                                                  -- site: filtro (ex. "temporada"); link: URL
  mensagem text,                                                 -- whatsapp: mensagem pronta
  ativo boolean not null default true,
  cliques integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_presite_botoes_updated before update on public.presite_botoes for each row execute function public.set_updated_at();

-- RLS (igual ao site Jason Dias)
alter table public.imoveis enable row level security;
alter table public.imovel_fotos enable row level security;
alter table public.leads enable row level security;
alter table public.site_config enable row level security;
alter table public.parceiros enable row level security;
alter table public.presite_botoes enable row level security;

create policy imoveis_public_read on public.imoveis for select using (status = 'ativo');
create policy imoveis_admin_all on public.imoveis for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy fotos_public_read on public.imovel_fotos for select using (true);
create policy fotos_admin_all on public.imovel_fotos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy leads_insert_any on public.leads for insert with check (true);
create policy leads_admin_read on public.leads for select using (auth.role() = 'authenticated');
create policy leads_admin_write on public.leads for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy config_public_read on public.site_config for select using (true);
create policy config_admin_write on public.site_config for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy parceiros_admin_all on public.parceiros for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy presite_public_read on public.presite_botoes for select using (ativo);
create policy presite_admin_all on public.presite_botoes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- contador de cliques do pré-site (público, só incrementa)
create or replace function public.presite_clique(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.presite_botoes set cliques = cliques + 1 where id = p_id and ativo;
$$;
grant execute on function public.presite_clique(uuid) to anon, authenticated;

-- Storage (fotos e vídeos públicos para leitura; escrita só logado)
insert into storage.buckets (id, name, public) values ('imoveis-fotos','imoveis-fotos',true), ('imoveis-videos','imoveis-videos',true), ('presite','presite',true)
on conflict (id) do nothing;
create policy fotos_read on storage.objects for select using (bucket_id in ('imoveis-fotos','imoveis-videos','presite'));
create policy fotos_write on storage.objects for insert with check (bucket_id in ('imoveis-fotos','imoveis-videos','presite') and auth.role() = 'authenticated');
create policy fotos_update on storage.objects for update using (bucket_id in ('imoveis-fotos','imoveis-videos','presite') and auth.role() = 'authenticated');
create policy fotos_delete on storage.objects for delete using (bucket_id in ('imoveis-fotos','imoveis-videos','presite') and auth.role() = 'authenticated');
