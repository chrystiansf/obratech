-- ObraTech — vínculo entre pagamento de contrato, lançamento financeiro e medição
-- Execute uma única vez no Supabase: SQL Editor → New query → colar → Run
alter table public.lancamentos add column if not exists pagamento_id uuid;
alter table public.lancamentos add column if not exists medicao_id   uuid;
alter table public.pagamentos  add column if not exists medicao_id   uuid;
create index if not exists lancamentos_pagamento_idx on public.lancamentos(pagamento_id);
