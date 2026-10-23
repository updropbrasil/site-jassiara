-- Automações por gatilho (aplicado em 23/10/2026 no banco "Site Jassiara").
-- Regra de ouro: só responde quem acionar um gatilho; conversa normal fica com a Jassiara.
-- Tabelas: automacoes (gatilhos) e automacao_eventos (atividade); RLS só para usuário logado.
-- Chaves em site_config: auto_ligadas (sim|nao), auto_instagram_status, auto_whatsapp_status
-- (desconectado|aguardando|conectado), secretaria_quem/servicos/tom/nunca/passar.
-- Ver migration "automacoes_tabelas" no Supabase para o DDL completo.

create table if not exists public.automacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Novo gatilho',
  canal text not null default 'ig_comentario' check (canal in ('ig_comentario','ig_dm','whatsapp')),
  palavras text[] not null default '{}',
  modo text not null default 'contem' check (modo in ('contem','exata')),
  post_url text,                                  -- só comentário: vazio = qualquer post
  resp_publicas text[] not null default '{}',     -- só comentário: respostas públicas (sorteia uma)
  msg_texto text,                                 -- mensagem no direct (Instagram) ou no WhatsApp
  botao_tipo text not null default 'nenhum' check (botao_tipo in ('nenhum','whatsapp','imovel','link')),
  botao_texto text, botao_url text, botao_whats_msg text, imovel_codigo text,
  ia_assume boolean not null default false,       -- secretária IA continua a conversa depois do gatilho
  ia_horas int not null default 24 check (ia_horas between 1 and 72),
  uma_vez boolean not null default true,          -- mesma pessoa só dispara 1 vez neste gatilho
  atraso boolean not null default true,           -- espera 1–3 min para não parecer robô
  ativo boolean not null default false,
  ordem int not null default 0,
  disparos int not null default 0,
  ultimo_disparo timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.automacao_eventos (
  id uuid primary key default gen_random_uuid(),
  automacao_id uuid references public.automacoes(id) on delete set null,
  automacao_nome text, canal text not null, contato_id text, contato_nome text, texto text,
  acoes text[] not null default '{}', status text not null default 'ok',
  ia_ate timestamptz,                             -- até quando a secretária fala com essa pessoa
  criado_em timestamptz not null default now()
);
create index if not exists automacao_eventos_criado_idx on public.automacao_eventos (criado_em desc);
create index if not exists automacao_eventos_contato_idx on public.automacao_eventos (canal, contato_id, automacao_id);
alter table public.automacoes enable row level security;
alter table public.automacao_eventos enable row level security;
revoke all on public.automacoes, public.automacao_eventos from anon;
create policy automacoes_admin_all on public.automacoes for all to authenticated using (true) with check (true);
create policy automacao_eventos_admin_all on public.automacao_eventos for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.automacoes, public.automacao_eventos to authenticated;
create or replace function public.automacoes_set_updated() returns trigger language plpgsql set search_path = public as $f$ begin new.updated_at := now(); return new; end $f$;
create trigger automacoes_updated before update on public.automacoes for each row execute function public.automacoes_set_updated();
