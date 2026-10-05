-- ObraTech — Aba CAIXA: investidores e aportes
-- Execute uma única vez no Supabase: SQL Editor → New query → colar → Run

create table if not exists public.investidores (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null,
  nome          text not null,
  documento     text,
  telefone      text,
  email         text,
  obs           text,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table if not exists public.aportes (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null,
  investidor_id uuid references public.investidores(id) on delete restrict,
  obra_id       uuid,
  data          date not null,
  valor         numeric(14,2) not null default 0,
  forma         text,
  descricao     text,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists investidores_empresa_idx on public.investidores(empresa_id);
create index if not exists aportes_empresa_idx      on public.aportes(empresa_id);
create index if not exists aportes_investidor_idx   on public.aportes(investidor_id);

-- Segurança: cada empresa só enxerga os próprios dados
alter table public.investidores enable row level security;
alter table public.aportes      enable row level security;

drop policy if exists investidores_empresa on public.investidores;
create policy investidores_empresa on public.investidores for all
  using      (empresa_id in (select empresa_id from public.perfis where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.perfis where id = auth.uid()));

drop policy if exists aportes_empresa on public.aportes;
create policy aportes_empresa on public.aportes for all
  using      (empresa_id in (select empresa_id from public.perfis where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.perfis where id = auth.uid()));

-- Atualizações em tempo real entre usuários
do $$ begin
  begin alter publication supabase_realtime add table public.investidores; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.aportes;      exception when duplicate_object then null; end;
end $$;
