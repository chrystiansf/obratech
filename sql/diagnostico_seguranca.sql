-- ObraTech — DIAGNÓSTICO DE SEGURANÇA (somente leitura, não altera nada)
-- Supabase → SQL Editor → New query → colar → Run
-- O resultado é UMA célula de texto: clique nela, copie tudo e envie para análise.

select jsonb_pretty(jsonb_build_object(

  -- 1. Tabelas do sistema e se a segurança por linha (RLS) está ligada
  'tabelas', (select jsonb_agg(jsonb_build_object('tabela', c.relname, 'rls', c.relrowsecurity, 'rls_forcado', c.relforcerowsecurity) order by c.relname)
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relkind = 'r'),

  -- 2. Regras (policies) de cada tabela
  'policies', (select jsonb_agg(jsonb_build_object('tabela', tablename, 'nome', policyname, 'acao', cmd, 'papeis', roles,
                                                   'usando', qual, 'checando', with_check) order by tablename, policyname)
               from pg_policies where schemaname = 'public'),

  -- 3. Permissões dadas ao usuário anônimo (não logado)
  'acesso_anonimo', (select jsonb_agg(distinct table_name || ':' || privilege_type)
                     from information_schema.role_table_grants
                     where grantee = 'anon' and table_schema = 'public'),

  -- 4. Gatilhos que rodam quando alguém cria conta (auth.users)
  'gatilhos_cadastro', (select jsonb_agg(jsonb_build_object('gatilho', t.tgname, 'funcao', p.proname, 'codigo', pg_get_functiondef(p.oid)))
                        from pg_trigger t join pg_proc p on p.oid = t.tgfoid
                        join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal),

  -- 5. Funções do banco que usam dados enviados pelo próprio usuário no cadastro
  'funcoes_com_metadata', (select jsonb_agg(jsonb_build_object('funcao', p.proname, 'security_definer', p.prosecdef))
                           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ilike '%raw_user_meta_data%'),

  -- 6. Gatilhos nas tabelas do sistema (ex.: proteção de papel/permissões)
  'gatilhos_public', (select jsonb_agg(jsonb_build_object('tabela', c.relname, 'gatilho', t.tgname, 'funcao', p.proname))
                      from pg_trigger t join pg_proc p on p.oid = t.tgfoid
                      join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
                      where n.nspname = 'public' and not t.tgisinternal),

  -- 7. Colunas das tabelas de perfis e empresas
  'colunas_perfis', (select jsonb_agg(column_name || ' ' || data_type order by ordinal_position)
                     from information_schema.columns where table_schema = 'public' and table_name = 'perfis'),
  'colunas_empresas', (select jsonb_agg(column_name || ' ' || data_type order by ordinal_position)
                       from information_schema.columns where table_schema = 'public' and table_name = 'empresas'),

  -- 8. Tabelas que têm (ou não) as colunas empresa_id / obra_id
  'colunas_chave', (select jsonb_agg(jsonb_build_object('tabela', table_name, 'colunas', cols) order by table_name) from (
                      select table_name, jsonb_agg(column_name) as cols from information_schema.columns
                      where table_schema = 'public' and column_name in ('empresa_id','obra_id','cliente_id','contrato_id','solicitacao_id','estoque_id','colaborador_id','terceirizado_id','investidor_id')
                      group by table_name) x),

  -- 9. Armazenamento de arquivos (fotos, logos, documentos)
  'buckets', (select jsonb_agg(jsonb_build_object('bucket', id, 'publico', public)) from storage.buckets),
  'policies_arquivos', (select jsonb_agg(jsonb_build_object('nome', policyname, 'acao', cmd, 'usando', qual, 'checando', with_check))
                        from pg_policies where schemaname = 'storage' and tablename = 'objects'),

  -- 10. Quantidade de empresas e de usuários por papel (sem nomes nem e-mails)
  'contagem', (select jsonb_build_object(
                 'empresas', (select count(*) from public.empresas),
                 'perfis_por_papel', (select jsonb_object_agg(coalesce(papel,'(vazio)'), n) from (select papel, count(*) n from public.perfis group by papel) x),
                 'perfis_sem_empresa', (select count(*) from public.perfis where empresa_id is null)))
)) as diagnostico;
