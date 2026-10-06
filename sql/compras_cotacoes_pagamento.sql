-- ObraTech — Compras: valores no PIX, no cartão e parcelas nas cotações
-- Execute uma única vez no Supabase: SQL Editor → New query → colar → Run
alter table public.compras_cotacoes add column if not exists valor_pix    numeric(14,2) default 0;
alter table public.compras_cotacoes add column if not exists valor_cartao numeric(14,2) default 0;
alter table public.compras_cotacoes add column if not exists parcelas     integer;
