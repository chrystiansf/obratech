-- ObraTech — Financeiro: forma de pagamento dos lançamentos
-- (PIX, Cartão de crédito, Boleto, Cheque, Transferência). Pode rodar mais de uma vez.
alter table public.lancamentos add column if not exists forma_pagamento text;
