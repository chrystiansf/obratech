-- ObraTech — Diagnóstico: itens dos orçamentos (cotações) — somente leitura, não altera nada
-- Supabase → SQL Editor → New query → colar → Run

-- 1) A coluna "detalhe" (onde ficam os itens de cada orçamento) existe?
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'compras_cotacoes' and column_name = 'detalhe'
) as coluna_detalhe_existe;

-- 2) Orçamentos das solicitações de TAPUME e quantos itens cada um tem salvo no banco
select s.item                                   as solicitacao,
       c.fornecedor,
       c.valor_total,
       c.criado_em,
       jsonb_array_length(coalesce(to_jsonb(c)->'detalhe'->'itens', '[]'::jsonb)) as itens_salvos
from public.compras_cotacoes c
join public.compras_solicitacoes s on s.id = c.solicitacao_id
where s.item ilike '%tapume%'
order by s.item, c.fornecedor;
