// SUPABASE — Integração ObraTech
// ═══════════════════════════════════════════════════════════════
const SUPA_URL = 'https://vwpyhdriektadkpssyro.supabase.co';
const SUPA_KEY = 'sb_publishable_PQM35tyLIUZ-Lx9uGGyF2Q_Hd8KVLRs';

// ─────────────────────────────────────────────────────────────
// NOTA: Execute este SQL no Supabase para permitir cadastro:
// ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
// Ou adicione esta policy:
// CREATE POLICY "empresas_insert_publico" ON empresas
//   FOR INSERT WITH CHECK (true);
// ─────────────────────────────────────────────────────────────

let supa = null;
let _usuarioAtual = null;
let _empresaId = null;
let _papelAtual = null;
let _empresaLogo = null; // URL da logo da empresa (Supabase Storage)
let _empresaCor = '#0A193C'; // cor primaria dos relatorios (hex)

// Inicializar Supabase
function initSupabase(){
  if(window.supabase){
    supa = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('✓ Supabase conectado');
  } else {
    console.warn('Supabase CDN não carregou — modo offline');
  }
}

// ── Auth: login ───────────────────────────────────────────────
async function fazerLogin(){
  const email = document.getElementById('auth-email').value.trim();
  const senha = document.getElementById('auth-senha').value;
  if(!email||!senha){ authMsg('Preencha email e senha.','error'); return; }
  authMsg('Entrando...','info');
  try{
    const {data,error} = await supa.auth.signInWithPassword({email,password:senha});
    if(error) throw error;
    authMsg('Bem-vindo!','success');
    // Iniciar sessão diretamente para evitar depender apenas do listener
    if(data.session && !window._sessaoAtiva){
      window._sessaoAtiva=true;
      await iniciarSessao(data.session);
      iniciarRealtime();
      adicionarBotaoLogout();
    }
  } catch(e){
    authMsg(e.message.includes('Invalid')?'Email ou senha incorretos.':e.message,'error');
  }
}

// ── Auth: cadastro ────────────────────────────────────────────
async function fazerCadastro(){
  const nome    = document.getElementById('cad-nome').value.trim();
  const empresa = document.getElementById('cad-empresa').value.trim();
  const email   = document.getElementById('cad-email').value.trim();
  const senha   = document.getElementById('cad-senha').value;
  if(!nome||!empresa||!email||!senha){ authMsg('Preencha todos os campos.','error'); return; }
  if(senha.length < 6){ authMsg('Senha deve ter mínimo 6 caracteres.','error'); return; }
  authMsg('Criando conta...','info');
  try{
    // 1. Criar usuário primeiro (sem empresa_id ainda)
    const {data:signUpData, error:signUpErr} = await supa.auth.signUp({
      email, password:senha,
      options:{ data:{ nome, papel:'admin', empresa_nome:empresa } }
    });
    if(signUpErr) throw signUpErr;
    if(!signUpData.user) throw new Error('Erro ao criar usuário.');

    // 2. Fazer login imediatamente para ter sessão ativa
    const {data:loginData, error:loginErr} = await supa.auth.signInWithPassword({email, password:senha});
    if(loginErr){
      // Email precisa confirmação
      authMsg('Conta criada! Verifique seu email para confirmar antes de entrar.','success');
      return;
    }

    // 3. Com sessão ativa, criar a empresa
    const {data:empData, error:empErr} = await supa
      .from('empresas')
      .insert({nome:empresa})
      .select('id')
      .single();
    if(empErr) throw empErr;
    const empresaId = empData.id;

    // 4. Criar o perfil do usuário
    const {error:perfErr} = await supa
      .from('perfis')
      .insert({
        id: loginData.user.id,
        empresa_id: empresaId,
        nome: nome,
        papel: 'admin'
      });
    if(perfErr && !perfErr.message.includes('duplicate')) throw perfErr;

    // 5. Categorias padrão
    await supa.rpc('setup_empresa_padrao', {p_empresa_id: empresaId});

    authMsg('Conta criada com sucesso! Carregando...','success');
    // A sessão já está ativa — onAuthStateChange vai cuidar do resto

  } catch(e){
    console.error('Cadastro error:', e);
    authMsg(e.message || 'Erro ao criar conta. Tente novamente.','error');
  }
}

// ── Auth: reset senha ─────────────────────────────────────────
function mostrarTelaNovaSenha(session){
  window._aguardandoNovaSenha = true;
  // Ocultar tudo e mostrar tela de nova senha
  document.getElementById('app').style.display='none';
  document.getElementById('portal-cliente').style.display='none';
  document.getElementById('loading-screen').style.display='none';
  const authEl = document.getElementById('auth-screen');
  authEl.style.display='flex';
  authEl.innerHTML=`
  <div style="background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.4)">
    <div style="text-align:center;margin-bottom:28px">
      <div style="margin-bottom:12px"><img src="${document.querySelector('link[rel=apple-touch-icon]')?.href||''}" style="width:52px;height:52px;object-fit:contain" onerror="this.style.display='none'"></div>
      <div style="font-family:'Inter',sans-serif;font-weight:700;font-size:22px;color:#0a193c">Definir Nova Senha</div>
      <div style="font-size:13px;color:#666;margin-top:6px">Digite sua nova senha de acesso</div>
    </div>
    <div id="nova-senha-msg" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:8px;font-size:13px"></div>
    <div style="margin-bottom:14px">
      <label style="font-size:12px;font-weight:600;color:#444;display:block;margin-bottom:6px">Nova Senha</label>
      <input id="nova-senha-inp" type="password" placeholder="Mínimo 6 caracteres"
        style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;font-family:'Inter',sans-serif"
        onfocus="this.style.borderColor='#1a65d6'" onblur="this.style.borderColor='#ddd'"
        onkeydown="if(event.key==='Enter')confirmarNovaSenha()">
    </div>
    <div style="margin-bottom:20px">
      <label style="font-size:12px;font-weight:600;color:#444;display:block;margin-bottom:6px">Confirmar Senha</label>
      <input id="nova-senha-conf" type="password" placeholder="Digite novamente"
        style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;font-family:'Inter',sans-serif"
        onfocus="this.style.borderColor='#1a65d6'" onblur="this.style.borderColor='#ddd'"
        onkeydown="if(event.key==='Enter')confirmarNovaSenha()">
    </div>
    <button onclick="confirmarNovaSenha()"
      style="width:100%;padding:13px;background:#1a65d6;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif">
      ✅ Salvar Nova Senha
    </button>
  </div>`;
}

async function confirmarNovaSenha(){
  const senha = document.getElementById('nova-senha-inp')?.value;
  const conf = document.getElementById('nova-senha-conf')?.value;
  const msgEl = document.getElementById('nova-senha-msg');

  if(!senha || senha.length < 6){
    msgEl.style.display='block';
    msgEl.style.background='#fff0f0';
    msgEl.style.color='#c00';
    msgEl.textContent='A senha precisa ter ao menos 6 caracteres.';
    return;
  }
  if(senha !== conf){
    msgEl.style.display='block';
    msgEl.style.background='#fff0f0';
    msgEl.style.color='#c00';
    msgEl.textContent='As senhas não coincidem.';
    return;
  }

  const btn = document.querySelector('#auth-screen button');
  if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }

  try{
    const {error} = await supa.auth.updateUser({password: senha});
    if(error) throw error;

    msgEl.style.display='block';
    msgEl.style.background='#f0fff4';
    msgEl.style.color='#0a6';
    msgEl.textContent='✅ Senha atualizada com sucesso! Entrando no sistema...';

    window._aguardandoNovaSenha = false;

    // Fazer logout e login novo com nova senha
    setTimeout(async ()=>{
      try{ await supa.auth.signOut({scope:'local'}); }catch(e){ console.warn('signOut:',e.message); }
      mostrarLogin();
      authMsg('Senha atualizada! Faça login com sua nova senha.','success');
    }, 1500);

  }catch(e){
    if(btn){ btn.disabled=false; btn.textContent='✅ Salvar Nova Senha'; }
    msgEl.style.display='block';
    msgEl.style.background='#fff0f0';
    msgEl.style.color='#c00';
    msgEl.textContent='Erro: '+e.message;
  }
}

async function enviarReset(){
  const email = document.getElementById('reset-email').value.trim();
  if(!email){ authMsg('Digite seu email.','error'); return; }
  try{
    await supa.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?nova_senha=1'
    });
    authMsg('✅ Link enviado para '+email+'! Verifique seu email e clique no link para definir sua nova senha.','success');
  } catch(e){
    authMsg(e.message,'error');
  }
}

// ── Auth: logout ──────────────────────────────────────────────
async function logout(){
  window._sessaoAtiva = false;
  // Limpar cache de perfil
  localStorage.removeItem('_ot_empresa_id');
  localStorage.removeItem('_ot_papel');
  localStorage.removeItem('_ot_nome');
  localStorage.removeItem('_ot_user_id');
  localStorage.removeItem('_ot_permissoes');
  localStorage.removeItem('_ot_obras_ids');
  try{ await supa.auth.signOut({scope:'local'}); }catch(e){ console.warn('signOut:',e.message); }
  _usuarioAtual = null;
  _empresaId = null;
  _papelAtual = null;
  DB = {user:{nome:'',cargo:'',ini:''},obras:[],etapas:[],rdos:[],colabs:[],pontos:[],lancs:[],estoque:[],movs:[],ncs:[],contratos:[],pgtos:[],centros:[],categorias:['Mão de Obra','Materiais','Equipamentos','Serviços','Administração','Impostos','Outros'],fornecedores:[],unidades:['sc','m³','un','kg','lt','m²','ml','cx','pc','vb','gl','t','rl'],sel:null,nid:1};
  mostrarLogin();
}

// ── UI Auth helpers ───────────────────────────────────────────
function authTab(tab){
  document.getElementById('form-login').style.display   = tab==='login'   ?'block':'none';
  document.getElementById('form-cadastro').style.display= tab==='cadastro'?'block':'none';
  document.getElementById('form-reset').style.display   = tab==='reset'   ?'block':'none';
  document.getElementById('tab-login').style.background    = tab==='login'   ?'#0a193c':'transparent';
  document.getElementById('tab-login').style.color         = tab==='login'   ?'#fff':'#666';
  document.getElementById('tab-cadastro').style.background = tab==='cadastro'?'#0a193c':'transparent';
  document.getElementById('tab-cadastro').style.color      = tab==='cadastro'?'#fff':'#666';
  document.getElementById('auth-msg').style.display='none';
}

function authMsg(msg, tipo){
  const el = document.getElementById('auth-msg');
  el.style.display='block';
  el.textContent=msg;
  el.style.background = tipo==='error'?'#fee2e2':tipo==='success'?'#dcfce7':'#e0f2fe';
  el.style.color       = tipo==='error'?'#dc2626':tipo==='success'?'#16a34a':'#0369a1';
}

function mostrarLogin(){
  document.getElementById('loading-screen').style.display='none';
  const as=document.getElementById('auth-screen');as.style.display='flex';as.style.alignItems='center';as.style.justifyContent='center';
  document.getElementById('app').style.display='none';
}

function mostrarApp(){
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('loading-screen').style.display='none';
  if(_papelAtual==='cliente'){
    document.getElementById('app').style.display='none';
    document.getElementById('portal-cliente').style.display='flex';
  } else {
    document.getElementById('app').style.display='flex';
    document.getElementById('portal-cliente').style.display='none';
    if(!window._paginaAtual) window._paginaAtual='dashboard';
  }
}

// ── Escutar mudanças de sessão ────────────────────────────────
async function iniciarSessao(session){
  if(!session){ mostrarLogin(); return; }
  try{
    _usuarioAtual = session.user;

    // PASSO 1: Tentar usar dados do JWT (instantâneo, sem query)
    const meta = session.user.user_metadata || {};
    const appMeta = session.user.app_metadata || {};
    
    // Verificar se temos empresa_id no cache local
    const cachedEmpresa = localStorage.getItem('_ot_empresa_id');
    const cachedPapel = localStorage.getItem('_ot_papel');
    const cachedNome = localStorage.getItem('_ot_nome');

    // Se temos cache válido para este usuário, usar imediatamente
    const cachedUserId = localStorage.getItem('_ot_user_id');
    const cacheValido = cachedEmpresa && cachedPapel && cachedNome && 
      (!cachedUserId || cachedUserId === session.user.id);
    // Se cache não pertence a este user, limpar e forçar novo load
    if(cachedUserId && cachedUserId !== session.user.id){
      localStorage.removeItem('_ot_empresa_id');
      localStorage.removeItem('_ot_papel');
      localStorage.removeItem('_ot_nome');
      localStorage.removeItem('_ot_user_id');
      localStorage.removeItem('_ot_permissoes');
      console.log('Cache de outro usuário detectado — limpando e recarregando perfil');
    }
    if(cacheValido){
      // Restaurar DB do localStorage (preserva foto, ini, dados locais)
      load();
      _empresaId = cachedEmpresa;
      _papelAtual = cachedPapel;
      if(!DB.user.nome) DB.user.nome = cachedNome;
      if(!DB.user.cargo) DB.user.cargo = localStorage.getItem('_ot_cargo') || cachedPapel;
      // Restaurar branding
      _empresaLogo = localStorage.getItem('_ot_logo') || null;
      _empresaCor = localStorage.getItem('_ot_cor') || '#0A193C';

      // Mostrar app IMEDIATAMENTE com dados do cache
      _atualizarSidebar(DB.user.nome, cachedPapel);
      _restaurarAvatar();
      if(cachedPapel==='cliente'){
        mostrarApp();
        const unEl=document.getElementById('pc-user-nome');
        if(unEl) unEl.textContent=cachedNome;
        toast('👋','Bem-vindo, '+cachedNome.split(' ')[0]+'!');
        carregarDadosCliente(session.user.id);
      } else {
        mostrarApp();
        renderDash(); fillSelects(); renderObras();
        // Aplicar permissões do cache imediatamente
        const cachedPerms=localStorage.getItem('_ot_permissoes');
        if(cachedPapel==='admin'){
          window._permsAtivas=null;
          window._obrasPermitidas=null;
          document.querySelectorAll('.ni[data-p],.mni[data-p],.mni-more-item[data-p]').forEach(el=>el.style.display='');
        } else {
          // Carregar obras do cache
          const cachedObras=localStorage.getItem('_ot_obras_ids');
          let obrasIds=null;
          if(cachedObras){
            try{ obrasIds=JSON.parse(cachedObras); window._obrasPermitidas=obrasIds; }catch(e){}
          }
          if(cachedPerms){
            try{ setTimeout(()=>aplicarRestricoesPerfil(JSON.parse(cachedPerms),obrasIds),100); }catch(e){}
          } else {
            const preset=PAPEIS_PRESET[cachedPapel]||['dashboard','obras','cronograma','rdo'];
            setTimeout(()=>aplicarRestricoesPerfil(preset,obrasIds),100);
          }
        }
        toast('👋','Bem-vindo, '+cachedNome.split(' ')[0]+'!');
        carregarDadosSupabase().then(()=>{
          renderDash();renderObras();
          renderPaginaAtual();
        });
      }
      
      // Atualizar perfil e branding em background
      _atualizarPerfilBackground(session.user.id);
      _carregarBrandingEmpresa();
      return;
    }

    // PASSO 2: Sem cache — buscar perfil (primeira vez ou cache expirado)
    document.getElementById('loading-screen').style.display='flex';
    document.getElementById('auth-screen').style.display='none';

    const perfPromise = supa.from('perfis').select('id,nome,papel,cargo,empresa_id,permissoes,obras_ids,email').eq('id', session.user.id).maybeSingle();
    const timeoutPromise = new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),20000));
    const {data:perfil, error:perfErr} = await Promise.race([perfPromise, timeoutPromise]);

    if(perfErr) console.warn('Perfil erro:', perfErr?.message);

    if(perfil && perfil.empresa_id){
      _empresaId  = perfil.empresa_id;
      _papelAtual = perfil.papel;
      DB.user.nome  = perfil.nome;
      DB.user.cargo = perfil.cargo || perfil.papel;
      // Aplicar restrições de módulos
      if(perfil.papel==='admin'){
        // Admin: sem restrições — garantir visibilidade total
        window._permsAtivas=null;
        window._obrasPermitidas=null;
        localStorage.removeItem('_ot_permissoes');
        localStorage.removeItem('_ot_obras_ids');
        // Restaurar todos os itens de nav (pode ter ficado hidden de sessão anterior)
        document.querySelectorAll('.ni[data-p],.mni[data-p],.mni-more-item[data-p]').forEach(el=>el.style.display='');
      } else {
        // Carregar filtro de obras
        let obrasIds=null;
        if(perfil.obras_ids){
          try{
            obrasIds=JSON.parse(perfil.obras_ids);
            window._obrasPermitidas=obrasIds;
            localStorage.setItem('_ot_obras_ids', perfil.obras_ids);
          }catch(e){}
        } else {
          localStorage.removeItem('_ot_obras_ids');
        }

        if(perfil.permissoes){
          try{
            const perms=JSON.parse(perfil.permissoes);
            localStorage.setItem('_ot_permissoes', perfil.permissoes);
            setTimeout(()=>aplicarRestricoesPerfil(perms, obrasIds),200);
          }catch(e){}
        } else {
          const presetPerms=PAPEIS_PRESET[perfil.papel]||['dashboard','obras','cronograma','rdo'];
          localStorage.setItem('_ot_permissoes', JSON.stringify(presetPerms));
          setTimeout(()=>aplicarRestricoesPerfil(presetPerms, obrasIds),200);
        }
      }

      // Salvar no cache local para próximos logins serem instantâneos
      localStorage.setItem('_ot_empresa_id', perfil.empresa_id);
      localStorage.setItem('_ot_papel', perfil.papel);
      localStorage.setItem('_ot_nome', perfil.nome);
      localStorage.setItem('_ot_cargo', perfil.cargo||'');
      localStorage.setItem('_ot_user_id', perfil.id);

      _atualizarSidebar(perfil.nome, perfil.papel);

      // Carregar branding da empresa (logo + cor)
      _carregarBrandingEmpresa();

      if(perfil.papel==='cliente'){
        mostrarApp();
        const unEl=document.getElementById('pc-user-nome');
        if(unEl) unEl.textContent=perfil.nome;
        toast('👋','Bem-vindo ao Portal, '+perfil.nome.split(' ')[0]+'!');
        carregarDadosCliente(perfil.id);
      } else {
        mostrarApp();
        renderDash(); fillSelects(); renderObras();
        toast('👋','Bem-vindo, '+perfil.nome.split(' ')[0]+'!');
        carregarDadosSupabase().then(()=>{
          renderDash();renderObras();
          renderPaginaAtual();
        });
      }

    } else {
      console.warn('Perfil não encontrado:', perfErr?.message);
      mostrarLogin();
      authMsg('Perfil não encontrado. Entre em contato com o suporte.','error');
    }
  } catch(e){
    console.error('Erro em iniciarSessao:', e.message);
    // Timeout ou erro de rede — NUNCA mostrar login se sessão é válida
    if(e.message==='timeout'||e.message?.includes('fetch')||e.message?.includes('network')){
      // Tentar usar cache local antes de desistir
      const cachedEmpresa = localStorage.getItem('_ot_empresa_id');
      const cachedPapel = localStorage.getItem('_ot_papel');
      const cachedNome = localStorage.getItem('_ot_nome');
      const cachedUserId = localStorage.getItem('_ot_user_id');
    const cacheValido = cachedEmpresa && cachedPapel && cachedNome && 
      (!cachedUserId || cachedUserId === session.user.id);
    // Se cache não pertence a este user, limpar e forçar novo load
    if(cachedUserId && cachedUserId !== session.user.id){
      localStorage.removeItem('_ot_empresa_id');
      localStorage.removeItem('_ot_papel');
      localStorage.removeItem('_ot_nome');
      localStorage.removeItem('_ot_user_id');
      localStorage.removeItem('_ot_permissoes');
      console.log('Cache de outro usuário detectado — limpando e recarregando perfil');
    }
    if(cacheValido){
        _empresaId = cachedEmpresa;
        _papelAtual = cachedPapel;
        DB.user.nome = cachedNome;
        _atualizarSidebar(cachedNome, cachedPapel);
        if(cachedPapel==='cliente'){
          mostrarApp();
          const unEl=document.getElementById('pc-user-nome');
          if(unEl) unEl.textContent=cachedNome;
          toast('👋','Bem-vindo, '+cachedNome.split(' ')[0]+'!');
          carregarDadosCliente(_usuarioAtual?.id);
        } else {
          mostrarApp();
          renderDash(); fillSelects(); renderObras();
          toast('⚠️','Conexão lenta — usando dados locais.');
          carregarDadosSupabase().then(()=>{
          renderDash();renderObras();
          renderPaginaAtual();
        });
        }
        return;
      }
      // Sem cache: mostrar loading e tentar de novo
      toast('⚠️','Conexão lenta, aguarde...');
      setTimeout(()=>iniciarSessao(_usuarioAtual?{user:_usuarioAtual}:null), 3000);
      return;
    } else {
      mostrarLogin();
      authMsg('Erro ao carregar perfil: '+e.message,'error');
    }
  }
}

function _restaurarAvatar(){
  const av=document.getElementById('user-av');
  if(!av) return;
  if(DB.user.foto) av.innerHTML='<img src="'+DB.user.foto+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  else av.textContent=DB.user.ini||DB.user.nome?.charAt(0)||'?';
  const nameEl=document.getElementById('user-name');
  if(nameEl&&DB.user.nome) nameEl.textContent=DB.user.nome;
  const roleEl=document.getElementById('user-role');
  if(roleEl) roleEl.textContent=DB.user.cargo||'';
}

function _atualizarSidebar(nome, papel){
  const sbUser = document.getElementById('sb-user');
  const sbNome = document.getElementById('sb-user-nome');
  const sbPapel = document.getElementById('sb-user-papel');
  if(sbNome) sbNome.textContent = nome;
  if(sbPapel){
    const pl={admin:'Administrador',gestor:'Gestor',financeiro:'Financeiro',operacional:'Operacional',visualizador:'Visualizador',cliente:'Cliente'};
    sbPapel.textContent = pl[papel]||papel;
  }
}

async function _atualizarPerfilBackground(userId){
  try{
    const {data:perfil}=await supa.from('perfis')
      .select('id,nome,papel,cargo,empresa_id,permissoes,obras_ids')
      .eq('id',userId).maybeSingle();
    if(perfil){
      localStorage.setItem('_ot_empresa_id', perfil.empresa_id);
      localStorage.setItem('_ot_papel', perfil.papel);
      localStorage.setItem('_ot_nome', perfil.nome);
      localStorage.setItem('_ot_user_id', perfil.id);
      if(perfil.permissoes) localStorage.setItem('_ot_permissoes', perfil.permissoes);
      else localStorage.removeItem('_ot_permissoes');
      if(perfil.obras_ids) localStorage.setItem('_ot_obras_ids', perfil.obras_ids);
      else localStorage.removeItem('_ot_obras_ids');
      // Aplicar restrições imediatamente
      if(perfil.papel==='admin'){
        window._permsAtivas=null;
        window._obrasPermitidas=null;
        localStorage.removeItem('_ot_permissoes');
        localStorage.removeItem('_ot_obras_ids');
      } else {
        let obrasIds=null;
        if(perfil.obras_ids){
          try{
            obrasIds=JSON.parse(perfil.obras_ids);
            window._obrasPermitidas=obrasIds;
            localStorage.setItem('_ot_obras_ids',perfil.obras_ids);
          }catch(e){}
        }
        if(perfil.permissoes){
          try{
            const perms=JSON.parse(perfil.permissoes);
            aplicarRestricoesPerfil(perms, obrasIds);
          }catch(e){}
        } else {
          const preset=PAPEIS_PRESET[perfil.papel]||['dashboard','obras','cronograma','rdo'];
          aplicarRestricoesPerfil(preset, obrasIds);
        }
      }
      // Se papel mudou, recarregar
      if(perfil.papel!==_papelAtual){
        console.log('Papel mudou, recarregando...');
        location.reload();
      }
    }
  }catch(e){ console.warn('Atualização perfil background:', e.message); }
}

// ── Carregar todos os dados da empresa ────────────────────────
async function diagnosticarSupabase(){
  if(!supa||!_empresaId) return;
  // Primeiro: garantir que colunas necessárias existem via SQL
  // Se não existirem, supaInsert vai falhar com "Could not find column"
  const tabelasTeste=['obras','demandas','fornecedores_cadastro','nao_conformidades','categorias'];
  const erros=[];
  for(const t of tabelasTeste){
    try{
      // Tenta SELECT primeiro
      const {data,error}=await supa.from(t).select('id').eq('empresa_id',_empresaId).limit(1);
      if(error){erros.push(`${t}: ${error.message} (${error.code})`);}
    }catch(e){erros.push(`${t}: ${e.message}`);}
  }
  if(erros.length>0){
    console.error('PROBLEMAS SUPABASE:\n'+erros.join('\n'));
    // Mostrar alerta detalhado
    setTimeout(()=>{
      const msg=`⚠️ Problema de acesso ao banco de dados:\n\n${erros.join('\n')}\n\nAcesse o Supabase → SQL Editor e execute:\nGRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;`;
      console.warn(msg);
      toast('⚠️','Problema de acesso ao banco. Veja o console para detalhes.');
    },1000);
  } else {
    console.log('✓ Acesso a todas as tabelas OK');
    // Testar ESCRITA
    try{
      const testId=uuidv4();
      const {error:wErr}=await supa.from('demandas').insert({id:testId,empresa_id:_empresaId,titulo:'__teste__',status:'pendente',prioridade:'baixa'});
      if(wErr){
        console.error('TESTE ESCRITA FALHOU:',wErr.message,wErr.code);
        toast('🔒','Escrita bloqueada no banco (RLS). Veja o console.');
      } else {
        // Apagar o registro de teste
        await supa.from('demandas').delete().eq('id',testId).eq('empresa_id',_empresaId);
        console.log('✓ Teste escrita OK — banco funcionando corretamente');
      }
    }catch(e){console.error('Teste escrita exception:',e.message);}
  }
}
async function carregarDadosSupabase(){
  if(!supa||!_empresaId) return;
  try{
    // Carregar cada tabela individualmente para não falhar tudo se uma der erro
    const safe = async (query) => { try { const r = await query; return r; } catch(e) { return {data:null}; }};
    // Filtrar EXPLICITAMENTE por empresa_id — não depender só do RLS
    const eid = _empresaId;
    const [obras, etapas, colaboradores, lancamentos, rdos, estoque, movs, contratos, pgtos, ncs, cats, ccs, forns, dems, medicoes, checklists, terceirizados, pontosTercs, pontos] = await Promise.all([
      safe(supa.from('obras').select('*').eq('empresa_id',eid).order('criado_em')),
      safe(supa.from('etapas').select('*').eq('empresa_id',eid).order('criado_em')),
      safe(supa.from('colaboradores').select('*').eq('empresa_id',eid).order('nome')),
      safe(supa.from('lancamentos').select('*').eq('empresa_id',eid).order('data',{ascending:false})),
      safe(supa.from('rdos').select('id,obra_id,data,clima,previsto,realizado,servicos,materiais,obs,status').eq('empresa_id',eid).order('data',{ascending:false})),
      safe(supa.from('estoque').select('*').eq('empresa_id',eid).order('material')),
      safe(supa.from('movimentacoes').select('*').eq('empresa_id',eid).order('data',{ascending:false})),
      safe(supa.from('contratos').select('*').eq('empresa_id',eid).order('criado_em')),
      safe(supa.from('pagamentos').select('*').eq('empresa_id',eid).order('data',{ascending:false})),
      safe(supa.from('nao_conformidades').select('*').eq('empresa_id',eid).order('criado_em')),
      safe(supa.from('categorias').select('nome').eq('empresa_id',eid).order('nome')),
      safe(supa.from('centros_custo').select('nome').eq('empresa_id',eid).order('nome')),
      safe(supa.from('fornecedores_cadastro').select('*').eq('empresa_id',eid).order('nome')),
      safe(supa.from('demandas').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false})),
      safe(supa.from('medicoes').select('*').eq('empresa_id',eid).order('numero',{ascending:false})),
      safe(supa.from('checklists').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false})),
      safe(supa.from('terceirizados').select('*').eq('empresa_id',eid).order('nome')),
      safe(supa.from('pontos_terceirizados').select('*').eq('empresa_id',eid)),
      safe(supa.from('pontos').select('*').eq('empresa_id',eid).order('data',{ascending:false})),
    ]);

    // Mapear para o formato interno do ObraTech
    if(obras.data){
      DB.obras = obras.data.map(mapObra);
      // Filtrar obras se usuário tiver restrição
      if(window._obrasPermitidas&&Array.isArray(window._obrasPermitidas)){
        DB.obras=DB.obras.filter(o=>window._obrasPermitidas.includes(String(o.id)));
      }
    }
    if(etapas.data)      DB.etapas     = etapas.data.map(mapEtapa);
    if(colaboradores.data) DB.colabs   = colaboradores.data.map(mapColab);
    if(lancamentos.data) DB.lancs      = lancamentos.data.map(mapLanc);
    if(rdos.data)        DB.rdos       = rdos.data.map(mapRdo);
    if(estoque.data)     DB.estoque    = estoque.data.map(mapEstoque);
    if(movs.data)        DB.movs       = movs.data.map(mapMov);
    if(contratos.data)   DB.contratos  = contratos.data.map(mapContrato);
    if(pgtos.data)       DB.pgtos      = pgtos.data.map(mapPgto);
    if(ncs.data)         DB.ncs        = ncs.data.map(mapNc);
    if(cats.data){
      const supaCats=cats.data.map(r=>r.nome);
      // Mesclar: manter locais que nao estao no Supabase e sincroniza-las
      const locais=(DB.categorias||[]).filter(c=>!supaCats.includes(c));
      DB.categorias=[...new Set([...supaCats,...locais])];
      // Sync categorias locais que nao estavam no Supabase
      locais.forEach(c=>supaInsert('categorias',{id:uuidv4(),nome:c}));
    }
    if(ccs.data){
      const supaCcs=ccs.data.map(r=>r.nome);
      const locaisCc=(DB.centros||[]).filter(c=>!supaCcs.includes(c));
      DB.centros=[...new Set([...supaCcs,...locaisCc])];
      locaisCc.forEach(c=>supaInsert('centros_custo',{id:uuidv4(),nome:c}));
    }
    if(forns.data)       DB.fornecedores = forns.data.map(r=>({id:r.id,nome:r.nome,tipo:r.tipo,cnpj:r.cnpj,contato:r.contato,email:r.email,telefone:r.telefone}));
    if(dems.data)        DB.demandas     = dems.data.map(r=>({id:r.id,numero:r.numero,titulo:r.titulo,desc:r.descricao,obraId:r.obra_id,categoria:r.categoria,responsavel:r.responsavel,prazo:r.prazo,prioridade:r.prioridade,status:r.status,obs:r.obs,_supa:true}));
    if(medicoes.data)    DB.medicoes     = medicoes.data.map(mapMedicao);
    if(checklists.data)  DB.checklists   = checklists.data.map(mapChecklist);
    if(terceirizados.data) DB.terceirizados = terceirizados.data.map(mapTerceirizado);
    if(pontosTercs.data)   DB.pontosTercs   = pontosTercs.data.map(mapPontoTerc);
    if(pontos.data)        DB.pontos        = pontos.data.map(row=>({id:row.id,colabId:row.colaborador_id,obraId:row.obra_id,data:row.data,presente:row.presente,tipo:row.tipo,_supa:true}));

    console.log('✓ Dados carregados:', DB.obras.length, 'obras,', DB.lancs.length, 'lançamentos,', (DB.demandas||[]).length, 'demandas,', (DB.fornecedores||[]).length, 'fornecedores,', (DB.terceirizados||[]).length, 'terceirizados');
  } catch(e){
    console.error('Erro ao carregar dados:', e);
    toast('⚠️','Erro ao carregar dados. Verifique a conexão.');
  }
}

// ── Mappers Supabase → formato interno ───────────────────────
function mapObra(r){return{id:r.id,nome:r.nome,tipo:r.tipo,statusManual:r.status_manual,orc:Number(r.orcamento||0),m2:Number(r.area_m2||0),dataIni:r.data_ini,dataFim:r.data_fim,local:r.local,resp:r.responsavel,cli:r.cliente,obs:r.obs,_supa:true};}
function mapEtapa(r){return{id:r.id,obraId:r.obra_id,nome:r.nome,status:r.status,pct:r.pct,pctEsp:r.pct_esperado,orc:Number(r.orcamento||0),resp:r.responsavel,inicio:r.inicio,fim:r.fim,sp:r.sp,wp:r.wp,_supa:true};}
function mapColab(r){return{id:r.id,nome:r.nome,funcao:r.funcao,cpf:r.cpf,admissao:r.admissao,diaria:Number(r.diaria||0),salario:Number(r.salario||0),pis:r.pis,tel:r.telefone,obs:r.obs,_supa:true};}
function mapLanc(r){return{id:r.id,obraId:r.obra_id,tipo:r.tipo,desc:r.descricao,cat:r.categoria,cc:r.centro_custo,valor:Number(r.valor||0),data:r.data,forn:r.fornecedor,nf:r.nota_fiscal,etapa:r.etapa_id,_supa:true};}
function mapRdo(r){return{id:r.id,obraId:r.obra_id,data:r.data,clima:r.clima,prev:r.previsto,real:r.realizado,serv:r.servicos,obs:r.obs,mat:r.materiais,status:r.status,fotos:r.fotos||[],_supa:true};}
function mapEstoque(r){return{id:r.id,material:r.material,un:r.unidade,qtd:0,min:Number(r.estoque_min||0),preco:Number(r.preco||0),forn:r.fornecedor,_supa:true};}
function mapMov(r){return{id:r.id,estId:r.estoque_id,obraId:r.obra_id,tipo:r.tipo,qtd:Number(r.quantidade||0),data:r.data,nf:r.nota_fiscal,obs:r.obs,_supa:true};}
function mapContrato(r){return{id:r.id,obraId:r.obra_id,numero:r.numero,descricao:r.descricao,forn:r.fornecedor,tipo:r.tipo,cat:r.categoria,cc:r.centro_custo,valor:Number(r.valor||0),assinatura:r.assinatura,prazo:r.prazo,obs:r.obs,_supa:true};}
function mapChecklist(r){return{id:r.id,obraId:r.obra_id,etapaNome:r.etapa_nome,item:r.item,status:r.status||'pendente',obs:r.obs,resp:r.responsavel,data:r.data,fotos:r.fotos?JSON.parse(r.fotos):([]),_supa:true};}
function mapTerceirizado(r){return{id:r.id,nome:r.nome,empresa:r.empresa,funcao:r.funcao||'',cpf:r.cpf||'',celular:r.celular||'',obraId:r.obra_id,_supa:true};}
function mapPontoTerc(r){return{id:r.id,tercId:r.terceirizado_id,obraId:r.obra_id,data:r.data,presente:r.presente,_supa:true};}
function mapMedicao(r){return{id:r.id,contratoId:r.contrato_id,obraId:r.obra_id,numero:r.numero,periodo:r.periodo,valorMedido:Number(r.valor_medido||0),valorAcumulado:Number(r.valor_acumulado||0),status:r.status||'pendente',exec:r.exec||'',obs:r.obs,fotos:r.fotos?JSON.parse(r.fotos):[],aprovadoPor:r.aprovado_por,aprovadoEm:r.aprovado_em,_supa:true};}
function mapPgto(r){return{id:r.id,contratoId:r.contrato_id,obraId:r.obra_id,data:r.data,valor:Number(r.valor||0),desc:r.descricao,nf:r.nota_fiscal,forn:r.fornecedor,tipo:r.tipo,cat:r.categoria,cc:r.centro_custo,_supa:true};}
function mapNc(r){return{id:r.id,numero:r.numero,obraId:r.obra_id,etapa:r.etapa,desc:r.descricao,grau:r.grau,prazo:r.prazo,resp:r.responsavel,status:r.status,acao:r.acao,_supa:true};}

// ── Save: salvar no Supabase ──────────────────────────────────
// Override da função save() para persistir no Supabase
// O localStorage ainda é usado como cache local
async function saveSupabase(tabela, dados, id){
  if(!supa||!_empresaId) return null;
  const payload = {...dados, empresa_id:_empresaId};
  if(id){
    const {data,error} = await supa.from(tabela).upsert({id,...payload}).select().single();
    if(error) console.error('Erro upsert:', tabela, error);
    return data;
  } else {
    const {data,error} = await supa.from(tabela).insert(payload).select().single();
    if(error) console.error('Erro insert:', tabela, error);
    return data;
  }
}

async function deleteSupabase(tabela, id){
  if(!supa||!_empresaId) return;
  const {error} = await supa.from(tabela).delete().eq('id', id);
  if(error) console.error('Erro delete:', tabela, error);
}

// Retorna o UUID real do Supabase para um item local (pode ter id numérico)
async function getSupaId(tabela, localId, matchField, matchValue){
  if(!supa||!_empresaId) return null;
  if(typeof localId === 'string' && localId.includes('-')) return localId; // já é UUID
  const {data} = await supa.from(tabela).select('id').eq('empresa_id',_empresaId).eq(matchField,matchValue).maybeSingle();
  return data?.id || null;
}

// Recarregar uma tabela específica do Supabase
async function recarregarTabela(tabela){
  if(!supa||!_empresaId) return;
  const eid=_empresaId;
  const mappers={
    obras: r=>DB.obras=r.map(mapObra),
    etapas: r=>DB.etapas=r.map(mapEtapa),
    colaboradores: r=>DB.colabs=r.map(mapColab),
    lancamentos: r=>DB.lancs=r.map(mapLanc),
    rdos: r=>DB.rdos=r.map(mapRdo),
    estoque: r=>DB.estoque=r.map(mapEstoque),
    movimentacoes: r=>DB.movs=r.map(mapMov),
    contratos: r=>DB.contratos=r.map(mapContrato),
    pagamentos: r=>DB.pgtos=r.map(mapPgto),
    nao_conformidades: r=>DB.ncs=r.map(mapNc),
  };
  const orders={
    obras:'criado_em', etapas:'criado_em', colaboradores:'nome',
    lancamentos:'data', rdos:'data', estoque:'material',
    movimentacoes:'data', contratos:'criado_em', pagamentos:'data',
    nao_conformidades:'criado_em'
  };
  try{
    const {data,error}=await supa.from(tabela).select('*').eq('empresa_id',eid).order(orders[tabela]||'criado_em',{ascending:tabela==='lancamentos'||tabela==='movimentacoes'||tabela==='rdos'||tabela==='pagamentos'?false:true});
    if(error){console.error('recarregarTabela',tabela,error.message);return;}
    if(data&&mappers[tabela]) mappers[tabela](data);
    save();
  }catch(e){console.error('recarregarTabela error',tabela,e.message);}
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE SYNC — salvar/atualizar/excluir em tempo real
// ═══════════════════════════════════════════════════════════════
async function supaInsert(tabela, dados){
  if(!supa){console.warn('supaInsert: supa null');return dados.id||null;}
  if(!_empresaId){console.warn('supaInsert: _empresaId null');return dados.id||null;}
  try{
    const payload={...dados, id:dados.id||uuidv4(), empresa_id:_empresaId};
    const {data,error}=await supa.from(tabela).insert(payload).select('id').single();
    if(error){
      console.error('supaInsert ERRO',tabela,error.message,error.code,JSON.stringify(payload).substring(0,300));
      if(error.message&&error.message.includes('Could not find')){
        const col=error.message.match(/`([^`]+)` column/)?.[1]||'?';
        console.error('COLUNA FALTANDO:',col,'na tabela',tabela,'— Execute no Supabase SQL Editor: ALTER TABLE '+tabela+' ADD COLUMN IF NOT EXISTS '+col+' TEXT;');
        toast('⚠️','Coluna "'+col+'" não existe em "'+tabela+'". Execute o SQL no Supabase.');
      } else {
        toast('❌','Erro ao salvar ('+tabela+'): '+error.message.substring(0,80));
      }
      return dados.id||null;
    }
    console.log('supaInsert OK',tabela,data?.id);
    return data.id;
  }catch(e){
    console.error('supaInsert EXCEPTION',tabela,e.message);
    toast('❌','Erro crítico ao salvar ('+tabela+'): '+e.message.substring(0,50));
    return dados.id||null;
  }
}
async function supaUpdate(tabela, id, dados){
  if(!supa||!_empresaId||!id) return;
  if(typeof id !== 'string' || !id.includes('-')){
    console.warn('supaUpdate: id não é UUID, ignorando',tabela,id); return;
  }
  try{
    const semAtualizado=['pontos','rdo_fotos','checklists','medicoes','cliente_obras'];
    const payload=semAtualizado.includes(tabela)?{...dados}:{...dados,atualizado_em:new Date().toISOString()};
    const {error}=await supa.from(tabela).update(payload).eq('id',id).eq('empresa_id',_empresaId);
    if(error){
      console.error('supaUpdate ERRO',tabela,id,error.message,error.code);
      toast('❌','Erro ao atualizar ('+tabela+'): '+error.message.substring(0,60));
      return;
    }
    console.log('supaUpdate OK',tabela,id);
  }catch(e){
    console.error('supaUpdate EXCEPTION',tabela,e.message);
    toast('❌','Erro crítico ao atualizar ('+tabela+'): '+e.message.substring(0,50));
  }
}
async function supaDelete(tabela, id){
  if(!supa||!_empresaId||!id) return;
  if(typeof id !== 'string' || !id.includes('-')){
    console.warn('supaDelete: id não é UUID, ignorando',tabela,id); return;
  }
  try{
    const {error}=await supa.from(tabela).delete().eq('id',id).eq('empresa_id',_empresaId);
    if(error){console.error('supaDelete',tabela,error.message);return;}
  }catch(e){console.error('supaDelete error',tabela,e.message);}
}
// Legado — mantido para compatibilidade
async function supaSync(tabela,dados,isUpdate=false,supaId=null){
  if(isUpdate) return supaUpdate(tabela,supaId,dados);
  return supaInsert(tabela,dados);
}
// Retorna UUID real do Supabase para item com id numérico
async function getSupaId(tabela,localId,matchField,matchValue){
  if(!supa||!_empresaId) return null;
  if(typeof localId==='string'&&localId.includes('-')) return localId;
  const {data}=await supa.from(tabela).select('id').eq('empresa_id',_empresaId).eq(matchField,matchValue).maybeSingle();
  return data?.id||null;
}



// ── Realtime: escutar mudanças ────────────────────────────────
function iniciarRealtime(){
  if(!supa||!_empresaId) return;
  const eid=_empresaId;

  // Helper: recarrega tabela E atualiza a UI correspondente
  async function sync(tabela){
    try{
      const orders={obras:'criado_em',etapas:'criado_em',colaboradores:'nome',
        lancamentos:'data',rdos:'data',estoque:'material',movimentacoes:'data',
        contratos:'criado_em',pagamentos:'data',nao_conformidades:'criado_em',pontos:'data',
        demandas:'criado_em',fornecedores_cadastro:'nome',categorias:'nome',centros_custo:'nome',
        terceirizados:'nome',pontos_terceirizados:'data'};
      const asc={lancamentos:false,rdos:false,movimentacoes:false,pagamentos:false};
      const {data,error}=await supa.from(tabela).select('*').eq('empresa_id',eid)
        .order(orders[tabela]||'criado_em',{ascending:asc[tabela]!==false?true:false});
      if(error||!data) return;
      const m={obras:r=>{DB.obras=r.map(mapObra);renderDash();fillSelects();renderObras();renderPaginaAtual&&renderPaginaAtual();},
        etapas:r=>{DB.etapas=r.map(mapEtapa);renderCron&&renderCron();},
        colaboradores:r=>{DB.colabs=r.map(mapColab);renderPaginaAtual&&renderPaginaAtual();fillSelects();},
        lancamentos:r=>{DB.lancs=r.map(mapLanc);renderFin();},
        rdos:r=>{DB.rdos=r.map(mapRdo);},
        estoque:r=>{DB.estoque=r.map(mapEstoque);if(document.getElementById('p-estoque')?.style.display!=='none')renderEstoque();},
        movimentacoes:r=>{DB.movs=r.map(mapMov);if(document.getElementById('p-estoque')?.style.display!=='none')renderEstoqueSaldo();},
        contratos:r=>{DB.contratos=r.map(mapContrato);renderContratos();},
        medicoes:r=>{DB.medicoes=r.map(mapMedicao);if(document.getElementById('p-contratos')?.classList.contains('on'))renderContratos();},
        checklists:r=>{DB.checklists=r.map(mapChecklist);if(document.getElementById('qual-panel-chk')?.style.display!=='none')renderChecklist();},
        pagamentos:r=>{DB.pgtos=r.map(mapPgto);renderContratos();},
        nao_conformidades:r=>{DB.ncs=r.map(mapNc);renderQual&&renderQual();},
        demandas:r=>{DB.demandas=r.map(x=>({id:x.id,numero:x.numero,titulo:x.titulo,desc:x.descricao,obraId:x.obra_id,categoria:x.categoria,responsavel:x.responsavel,prazo:x.prazo,prioridade:x.prioridade,status:x.status,obs:x.obs,_supa:true}));if(document.getElementById('p-demandas')?.style.display!=='none')renderDemandas();},
        pontos:r=>{DB.pontos=r.map(row=>({id:row.id,colabId:row.colaborador_id,obraId:row.obra_id,data:row.data,presente:row.presente,tipo:row.tipo,_supa:true}));},
        fornecedores_cadastro:r=>{DB.fornecedores=r.map(x=>({id:x.id,nome:x.nome,tipo:x.tipo,cnpj:x.cnpj,contato:x.contato,email:x.email,telefone:x.telefone,_supa:true}));if(document.getElementById('p-fornecedores')?.style.display!=='none')renderFornecedores();fillSelects();},
        categorias:r=>{const supaCats=r.map(x=>x.nome);const locais=(DB.categorias||[]).filter(c=>!supaCats.includes(c));DB.categorias=[...new Set([...supaCats,...locais])];renderCadastros&&renderCadastros();},
        centros_custo:r=>{const supaCcs=r.map(x=>x.nome);const locais=(DB.centros||[]).filter(c=>!supaCcs.includes(c));DB.centros=[...new Set([...supaCcs,...locais])];renderCadastros&&renderCadastros();},
        terceirizados:r=>{DB.terceirizados=r.map(mapTerceirizado);renderTerceirizados();},
        pontos_terceirizados:r=>{DB.pontosTercs=r.map(mapPontoTerc);rdoRenderPresencaTercs();},
      };
      if(m[tabela]) m[tabela](data);
      save();
    }catch(e){console.error('Realtime sync error',tabela,e.message);}
  }

  const tabelas=['obras','etapas','colaboradores','lancamentos','rdos','estoque',
    'movimentacoes','contratos','pagamentos','nao_conformidades','pontos','demandas','fornecedores_cadastro','categorias','centros_custo','terceirizados','pontos_terceirizados'];

  const ch=supa.channel('obratech-realtime-'+eid);
  tabelas.forEach(t=>{
    ch.on('postgres_changes',{event:'*',schema:'public',table:t,filter:`empresa_id=eq.${eid}`},
      ()=>sync(t));
  });
  ch.subscribe((status)=>{
    if(status==='SUBSCRIBED') console.log('✓ Realtime ativo em',tabelas.length,'tabelas');
  });
  console.log('✓ Realtime ativo');
  console.log('✓ Realtime ativo');
}

// ── Adicionar botão Logout no sidebar ─────────────────────────
function adicionarBotaoLogout(){
  // Só adiciona uma vez
  if(document.getElementById('btn-logout')) return;
  const sb = document.getElementById('sb');
  if(!sb) return;
  const btn = document.createElement('div');
  btn.id = 'btn-logout';
  btn.style.cssText='padding:8px 0;margin:0 auto;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;color:#888;display:flex;flex-direction:column;align-items:center;gap:3px;transition:.15s;width:100%;justify-content:center';
  btn.innerHTML='<span style="font-size:15px">🚪</span><span class="sb-txt" style="font-size:10px">Sair</span>';
  btn.onmouseover=()=>btn.style.background='rgba(255,255,255,.08)';
  btn.onmouseout=()=>btn.style.background='transparent';
  btn.onclick=logout;
  sb.appendChild(btn);
}

// ═══════════════════════════════════════════
// SIDEBAR DRAG & DROP — Reordenar abas
// ═══════════════════════════════════════════
(function(){
  let _dragEl=null;
  function initSidebarDrag(){
    const nav=document.querySelector('#sb nav');
    if(!nav) return;
    // Restore saved order
    const saved=localStorage.getItem('obratech_nav_order');
    if(saved){
      try{
        const order=JSON.parse(saved);
        const items=[...nav.querySelectorAll('.ni[data-p]')];
        const map={};items.forEach(el=>map[el.dataset.p]=el);
        order.forEach(p=>{if(map[p])nav.appendChild(map[p]);});
        // Append any items not in saved order
        items.forEach(el=>{if(!order.includes(el.dataset.p))nav.appendChild(el);});
      }catch(e){}
    }
    nav.addEventListener('dragstart',e=>{
      const ni=e.target.closest('.ni[data-p]');
      if(!ni)return;
      _dragEl=ni;ni.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',ni.dataset.p);
    });
    nav.addEventListener('dragend',e=>{
      if(_dragEl)_dragEl.classList.remove('dragging');
      nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('drag-over'));
      _dragEl=null;
    });
    nav.addEventListener('dragover',e=>{
      e.preventDefault();e.dataTransfer.dropEffect='move';
      const ni=e.target.closest('.ni[data-p]');
      nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('drag-over'));
      if(ni&&ni!==_dragEl)ni.classList.add('drag-over');
    });
    nav.addEventListener('drop',e=>{
      e.preventDefault();
      const target=e.target.closest('.ni[data-p]');
      if(!target||!_dragEl||target===_dragEl)return;
      const items=[...nav.querySelectorAll('.ni[data-p]')];
      const dragIdx=items.indexOf(_dragEl);
      const dropIdx=items.indexOf(target);
      if(dragIdx<dropIdx)target.after(_dragEl);
      else nav.insertBefore(_dragEl,target);
      // Save order
      const newOrder=[...nav.querySelectorAll('.ni[data-p]')].map(n=>n.dataset.p);
      localStorage.setItem('obratech_nav_order',JSON.stringify(newOrder));
      nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('drag-over'));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSidebarDrag);
  else setTimeout(initSidebarDrag,100);
})();

// ═══════════════════════════════════════════
// BANCO DE DADOS — localStorage
// ═══════════════════════════════════════════
const KEY='obratech_v1';
let DB={user:{nome:'',cargo:'',ini:''},obras:[],etapas:[],rdos:[],colabs:[],pontos:[],lancs:[],estoque:[],movs:[],ncs:[],contratos:[],pgtos:[],centros:[],categorias:['Mão de Obra','Materiais','Equipamentos','Serviços','Administração','Impostos','Outros'],fornecedores:[],demandas:[],medicoes:[],checklists:[],terceirizados:[],pontosTercs:[],equipeUsuarios:[],sel:null,nid:1};
function load(){try{const s=localStorage.getItem(KEY);if(s){DB=Object.assign({},DB,JSON.parse(s));if(!DB.centros)DB.centros=[];if(!Array.isArray(DB.categorias)||!DB.categorias.length)DB.categorias=['Mão de Obra','Materiais','Equipamentos','Serviços','Administração','Impostos','Outros'];if(!DB.fornecedores)DB.fornecedores=[];if(!DB.contratos)DB.contratos=[];if(!DB.medicoes)DB.medicoes=[];if(!DB.checklists)DB.checklists=[];
  if(!DB.unidades)DB.unidades=['sc','m³','un','kg','lt','m²','ml','cx','pc','vb','gl','t','rl'];if(!DB.pgtos)DB.pgtos=[];}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){toast('⚠️','Erro ao salvar! Dados podem ser perdidos.');}}
function nid(){const id=DB.nid++;save();return id;}
function uuidv4(){
  if(crypto&&crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);
  });
}
