-- ObraTech — Pedidos de compra: previsão de entrega aceita texto ("Retirada", "5 dias", "15/10")
-- Antes a coluna só aceitava data, e o pedido não era gravado quando a cotação trazia texto.
-- Pode rodar mais de uma vez.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='compras_pedidos'
               and column_name='previsao_entrega' and data_type <> 'text') then
    alter table public.compras_pedidos alter column previsao_entrega type text using previsao_entrega::text;
  end if;
end $$;
