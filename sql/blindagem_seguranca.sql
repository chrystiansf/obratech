-- ═══════════════════════════════════════════════════════════════════════
-- ObraTech — BLINDAGEM DE SEGURANÇA DO BANCO
-- Supabase → SQL Editor → New query → colar TUDO → Run
-- Roda dentro de uma transação: se qualquer parte falhar, NADA é alterado.
--
-- O que faz:
--  1. Liga a segurança por linha (RLS) em todas as tabelas
--  2. Remove todo acesso de quem não está logado (anon) e o TRUNCATE de todos
--  3. Cada empresa só enxerga os próprios dados
--  4. Funcionário só acessa os módulos e obras liberados pelo administrador
--  5. Cliente do portal só LÊ as obras liberadas para ele (não altera nada)
--  6. Ninguém consegue mudar o próprio papel, permissões ou empresa
--  7. Cadastro não confia mais em dados enviados pelo navegador
--  8. Arquivos: cada empresa só grava/apaga na própria pasta
-- ═══════════════════════════════════════════════════════════════════════
begin;

-- ── 0. Empresas: quem criou (necessário para o cadastro seguro) ─────────
alter table public.empresas add column if not exists criado_por uuid;      -- empresas antigas ficam em branco
alter table public.empresas alter column criado_por set default auth.uid();  -- novas: quem criou

-- ── 1. Funções de apoio (rodam com privilégio, sem recursão de RLS) ─────
create or replace function public.ot_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from public.perfis where id = auth.uid()
$$;

create or replace function public.ot_papel() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(papel, '') from public.perfis where id = auth.uid()
$$;

create or replace function public.ot_eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.perfis where id = auth.uid()), false)
$$;

-- Usuário tem acesso a algum dos módulos? (admin: tudo; cliente: nenhum; sem lista: tudo)
create or replace function public.ot_modulo(mods text[]) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare p record;
begin
  select papel, permissoes into p from public.perfis where id = auth.uid();
  if not found then return false; end if;
  if p.papel = 'admin' then return true; end if;
  if p.papel = 'cliente' then return false; end if;
  if 'todos' = any(mods) then return true; end if;
  if p.permissoes is null or btrim(p.permissoes) in ('', 'null', '[]') then return true; end if;
  return exists (select 1 from jsonb_array_elements_text(p.permissoes::jsonb) x where x = any(mods));
exception when others then return false;
end $$;

-- A obra está liberada para o usuário? (admin ou sem restrição: todas)
create or replace function public.ot_obra_ok(o uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare p record;
begin
  if o is null then return true; end if;
  select papel, obras_ids into p from public.perfis where id = auth.uid();
  if not found then return false; end if;
  if p.papel = 'admin' then return true; end if;
  if p.obras_ids is null or btrim(p.obras_ids) in ('', 'null', '[]') then return true; end if;
  return (p.obras_ids::jsonb) ? o::text;
exception when others then return false;
end $$;

-- Cliente do portal tem acesso a esta obra?
create or replace function public.ot_cliente_ve(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select o is not null and exists (select 1 from public.cliente_obras where cliente_id = auth.uid() and obra_id = o)
$$;

-- ── 2. Acesso: ninguém sem login; ninguém pode TRUNCATE ─────────────────
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke all on tables from anon;

-- ── 3. Liga RLS e apaga as regras antigas (permissivas/duplicadas) ──────
do $$
declare t text; pol record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' loop
    execute format('alter table public.%I enable row level security', t);
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
  end loop;
end $$;

-- ── 4. Regras das tabelas de dados ─────────────────────────────────────
-- tabela | módulos que dão acesso | tem obra_id? | cliente do portal pode ler?
do $$
declare r record; cond text;
begin
  for r in select * from (values
    ('obras',               array['todos'],                                              'id',      true),
    ('etapas',              array['todos'],                                              'obra_id', true),
    ('drive_arquivos',      array['todos'],                                              'obra_id', false),
    ('categorias',          array['todos'],                                              null,      false),
    ('centros_custo',       array['todos'],                                              null,      false),
    ('rdos',                array['rdo','relatorios','obras','dashboard'],               'obra_id', true),
    ('rdo_fotos',           array['rdo','relatorios','obras'],                           null,      false),
    ('colaboradores',       array['equipe','rdo'],                                       null,      false),
    ('pontos',              array['equipe','rdo'],                                       'obra_id', false),
    ('terceirizados',       array['equipe','rdo'],                                       'obra_id', false),
    ('pontos_terceirizados',array['equipe','rdo'],                                       'obra_id', false),
    ('lancamentos',         array['financeiro','contratos','compras','caixa','relatorios','cronograma'], 'obra_id', true),
    ('aportes',             array['caixa'],                                              'obra_id', false),
    ('investidores',        array['caixa'],                                              null,      false),
    ('contratos',           array['contratos','financeiro','relatorios'],                'obra_id', true),
    ('pagamentos',          array['contratos','financeiro','relatorios'],                'obra_id', true),
    ('medicoes',            array['contratos','financeiro','cronograma'],                'obra_id', false),
    ('estoque',             array['estoque','compras','relatorios'],                     null,      true),
    ('movimentacoes',       array['estoque','compras','relatorios'],                     'obra_id', true),
    ('nao_conformidades',   array['qualidade','relatorios','dashboard'],                 'obra_id', true),
    ('checklists',          array['qualidade'],                                          'obra_id', false),
    ('demandas',            array['demandas'],                                           'obra_id', false),
    ('compras_solicitacoes',array['compras'],                                            'obra_id', false),
    ('compras_cotacoes',    array['compras'],                                            null,      false),
    ('compras_pedidos',     array['compras'],                                            'obra_id', false),
    ('compras_orcamentos',  array['compras'],                                            null,      false),
    ('orcamento_itens',     array['orcamento','cronograma','financeiro'],                'obra_id', false),
    ('fornecedores_cadastro',array['fornecedores','financeiro','compras','estoque','contratos'], null, false),
    ('fornecedores',        array['fornecedores','financeiro','compras','estoque','contratos'], null, false)
  ) as v(tabela, mods, col_obra, cliente_le)
  loop
    if to_regclass('public.' || r.tabela) is null then continue; end if;
    -- Equipe da empresa (admin, gestor, funcionários): módulo + obra liberados
    cond := format('empresa_id = (select public.ot_empresa()) and (select public.ot_papel()) <> %L and (select public.ot_modulo(%L::text[]))',
                   'cliente', r.mods);
    if r.col_obra is not null then cond := cond || format(' and public.ot_obra_ok(%I)', r.col_obra); end if;
    execute format('create policy ot_equipe on public.%I for all to authenticated using (%s) with check (%s)', r.tabela, cond, cond);
    -- Cliente do portal: somente leitura das obras liberadas para ele
    if r.cliente_le then
      if r.col_obra is not null then
        cond := format('empresa_id = (select public.ot_empresa()) and (select public.ot_papel()) = %L and public.ot_cliente_ve(%I)', 'cliente', r.col_obra);
      else
        cond := format('empresa_id = (select public.ot_empresa()) and (select public.ot_papel()) = %L', 'cliente');
      end if;
      execute format('create policy ot_cliente_leitura on public.%I for select to authenticated using (%s)', r.tabela, cond);
    end if;
  end loop;
end $$;

-- ── 5. cliente_obras: admin gerencia; cliente só lê as próprias ────────
create policy ot_admin on public.cliente_obras for all to authenticated
  using (empresa_id = (select public.ot_empresa()) and (select public.ot_eh_admin()))
  with check (empresa_id = (select public.ot_empresa()) and (select public.ot_eh_admin()));
create policy ot_cliente_proprio on public.cliente_obras for select to authenticated
  using (cliente_id = auth.uid());

-- ── 6. empresas ─────────────────────────────────────────────────────────
create policy ot_ler on public.empresas for select to authenticated
  using (id = (select public.ot_empresa()) or criado_por = auth.uid());
create policy ot_criar on public.empresas for insert to authenticated
  with check (criado_por = auth.uid());
create policy ot_editar on public.empresas for update to authenticated
  using (id = (select public.ot_empresa()) and (select public.ot_eh_admin()))
  with check (id = (select public.ot_empresa()));

-- plano/ativo da empresa só mudam pelo painel do Supabase (para cobrança futura)
create or replace function public.ot_protege_empresa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and (new.plano is distinct from old.plano or new.ativo is distinct from old.ativo
      or new.criado_por is distinct from old.criado_por) then
    raise exception 'Alteração não permitida';
  end if;
  return new;
end $$;
drop trigger if exists ot_protege_empresa on public.empresas;
create trigger ot_protege_empresa before update on public.empresas for each row execute function public.ot_protege_empresa();

-- ── 7. perfis ───────────────────────────────────────────────────────────
-- Ler: o próprio perfil; equipe vê colegas da mesma empresa; cliente só a si
create policy ot_ler on public.perfis for select to authenticated
  using (id = auth.uid() or (empresa_id = (select public.ot_empresa()) and (select public.ot_papel()) <> 'cliente'));
-- Criar: (a) no cadastro, o próprio perfil de admin da empresa que ELE criou;
--        (b) admin cria perfis de funcionários/clientes da própria empresa
create policy ot_criar on public.perfis for insert to authenticated
  with check (
    (id = auth.uid() and papel = 'admin' and empresa_id in (select id from public.empresas where criado_por = auth.uid()))
    or (id <> auth.uid() and empresa_id = (select public.ot_empresa()) and (select public.ot_eh_admin()))
  );
-- Editar: o próprio (só nome/cargo/foto — ver gatilho) ou admin na própria empresa
create policy ot_editar on public.perfis for update to authenticated
  using (id = auth.uid() or (empresa_id = (select public.ot_empresa()) and (select public.ot_eh_admin())))
  with check (id = auth.uid() or empresa_id = (select public.ot_empresa()) or empresa_id is null);
-- Excluir: admin, na própria empresa, nunca a si mesmo
create policy ot_excluir on public.perfis for delete to authenticated
  using (id <> auth.uid() and empresa_id = (select public.ot_empresa()) and (select public.ot_eh_admin()));

-- Gatilho: ninguém muda o próprio papel/permissões/obras/empresa;
-- admin só mexe em perfis da própria empresa
create or replace function public.ot_protege_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare eu record;
begin
  if auth.uid() is null then return new; end if;  -- painel do Supabase / servidor
  select papel, empresa_id into eu from public.perfis where id = auth.uid();
  if new.id = auth.uid() and coalesce(eu.papel, '') <> 'admin' then
    if new.papel is distinct from old.papel or new.permissoes is distinct from old.permissoes
       or new.obras_ids is distinct from old.obras_ids or new.empresa_id is distinct from old.empresa_id
       or new.ativo is distinct from old.ativo then
      raise exception 'Você não pode alterar suas próprias permissões';
    end if;
  end if;
  if new.id = auth.uid() and eu.papel = 'admin' and new.empresa_id is distinct from old.empresa_id then
    raise exception 'Não é permitido trocar de empresa';
  end if;
  if new.id <> auth.uid() then
    if old.empresa_id is distinct from eu.empresa_id then raise exception 'Perfil de outra empresa'; end if;
    if new.empresa_id is not null and new.empresa_id is distinct from eu.empresa_id then raise exception 'Empresa inválida'; end if;
  end if;
  return new;
end $$;
drop trigger if exists ot_protege_perfil on public.perfis;
create trigger ot_protege_perfil before update on public.perfis for each row execute function public.ot_protege_perfil();

-- Remover acesso de funcionário/cliente (usado pelo app): só admin, só na própria empresa
create or replace function public.ot_remover_acesso(p_usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ot_eh_admin() then raise exception 'Somente o administrador pode remover acessos'; end if;
  if p_usuario = auth.uid() then raise exception 'Você não pode remover o próprio acesso'; end if;
  if not exists (select 1 from public.perfis where id = p_usuario and empresa_id = public.ot_empresa()) then
    raise exception 'Usuário não pertence à sua empresa';
  end if;
  delete from public.cliente_obras where cliente_id = p_usuario;
  update public.perfis set empresa_id = null, permissoes = null, obras_ids = null where id = p_usuario;
end $$;
revoke all on function public.ot_remover_acesso(uuid) from public, anon;
grant execute on function public.ot_remover_acesso(uuid) to authenticated;

-- ── 8. Cadastro: não confiar em empresa_id/papel enviados pelo navegador ─
-- (o perfil passa a ser criado pelo app com as regras acima)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  return new;
end $$;

-- ── 9. Arquivos: cada empresa só mexe na própria pasta (empresa_id/...) ─
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
             and (policyname like 'drive%' or policyname like 'rdo_fotos%' or policyname like 'ot_%') loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;
create policy ot_arquivos_ler on storage.objects for select to authenticated
  using (bucket_id in ('drive-obras','drive','rdo-fotos') and (storage.foldername(name))[1] = (select public.ot_empresa())::text);
create policy ot_arquivos_enviar on storage.objects for insert to authenticated
  with check (bucket_id in ('drive-obras','drive','rdo-fotos') and (storage.foldername(name))[1] = (select public.ot_empresa())::text
              and (select public.ot_papel()) <> 'cliente');
create policy ot_arquivos_alterar on storage.objects for update to authenticated
  using (bucket_id in ('drive-obras','drive','rdo-fotos') and (storage.foldername(name))[1] = (select public.ot_empresa())::text
         and (select public.ot_papel()) <> 'cliente');
create policy ot_arquivos_apagar on storage.objects for delete to authenticated
  using (bucket_id in ('drive-obras','drive','rdo-fotos') and (storage.foldername(name))[1] = (select public.ot_empresa())::text
         and (select public.ot_papel()) <> 'cliente');

commit;
