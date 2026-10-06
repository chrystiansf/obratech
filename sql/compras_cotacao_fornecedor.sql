-- ObraTech — Compras: cotação de fornecedor com vários itens
-- Execute uma única vez no Supabase: SQL Editor → New query → colar → Run
-- (inclui também as colunas de PIX/cartão/parcelas, caso ainda não tenham sido criadas)

alter table public.compras_cotacoes add column if not exists valor_pix    numeric(14,2) default 0;
alter table public.compras_cotacoes add column if not exists valor_cartao numeric(14,2) default 0;
alter table public.compras_cotacoes add column if not exists parcelas     integer;
alter table public.compras_cotacoes add column if not exists orcamento_id uuid;
alter table public.compras_cotacoes add column if not exists detalhe      jsonb;

create table if not exists public.compras_orcamentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null,
  fornecedor    text not null,
  data          date,
  valor_total   numeric(14,2) default 0,
  valor_pix     numeric(14,2) default 0,
  valor_cartao  numeric(14,2) default 0,
  parcelas      integer,
  frete         numeric(14,2) default 0,
  prazo_entrega text,
  obs           text,
  origem        text,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);
create index if not exists compras_orcamentos_empresa_idx on public.compras_orcamentos(empresa_id);

alter table public.compras_orcamentos enable row level security;
drop policy if exists compras_orcamentos_empresa on public.compras_orcamentos;
create policy compras_orcamentos_empresa on public.compras_orcamentos for all
  using      (empresa_id in (select empresa_id from public.perfis where id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.perfis where id = auth.uid()));

do $$ begin
  begin alter publication supabase_realtime add table public.compras_orcamentos; exception when duplicate_object then null; end;
end $$;
