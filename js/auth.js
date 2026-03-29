// Iniciar ObraTech (Supabase + auth)
// ════════════════════════════════════════════════
// GESTÃO DE CLIENTES (Portal)
// ════════════════════════════════════════════════
let _clientes = [];


// ═══════════════════════════════════════════════════════════
// EQUIPE / USUÁRIOS DO SISTEMA
// ═══════════════════════════════════════════════════════════

const MODULOS_SISTEMA=[
  {id:"dashboard",   label:"Dashboard",       ic:"📊"},
  {id:"obras",       label:"Obras",           ic:"🏗️"},
  {id:"cronograma",  label:"Cronograma",      ic:"📅"},
  {id:"rdo",         label:"RDO Diário",      ic:"📋"},
  {id:"equipe",      label:"Equipe / Folha",  ic:"👷"},
  {id:"estoque",     label:"Estoque",         ic:"📦"},
  {id:"financeiro",  label:"Financeiro",      ic:"💰"},
  {id:"contratos",   label:"Contratos",       ic:"📑"},
  {id:"orcamento",   label:"Orçamento",       ic:"💲"},
  {id:"qualidade",   label:"Qualidade",       ic:"✅"},
  {id:"demandas",    label:"Demandas",        ic:"📋"},
  {id:"fornecedores",label:"Fornecedores",    ic:"🏭"},
  {id:"empresa",    label:"Empresa",         ic:"🏢"},
  {id:"relatorios",  label:"Relatórios",      ic:"📈"},
];

const PAPEIS_PRESET={
  admin:     MODULOS_SISTEMA.map(m=>m.id),
  gestor:    ["dashboard","obras","cronograma","rdo","equipe","estoque","financeiro","contratos","orcamento","qualidade","demandas","fornecedores","relatorios"],
  financeiro:["dashboard","obras","financeiro","contratos","relatorios"],
  operacional:["dashboard","obras","cronograma","rdo","equipe","estoque","qualidade","demandas"],
  visualizador:["dashboard","obras","cronograma","rdo"],
};

function usrTab(tab){
  document.querySelectorAll(".usr-tab").forEach(t=>{
    const on=t.dataset.ut===tab;
    t.style.borderBottomColor=on?"var(--primary)":"transparent";
    t.style.color=on?"var(--primary)":"var(--txt3)";
  });
  document.getElementById("usr-panel-clientes").style.display=tab==="clientes"?"block":"none";
  document.getElementById("usr-panel-equipe").style.display=tab==="equipe"?"block":"none";
  const empPanel=document.getElementById("usr-panel-empresa");
  if(empPanel) empPanel.style.display=tab==="empresa"?"block":"none";
  document.getElementById("p-cadastros")?.querySelector(".usr-tab.on")?.classList;
  if(tab==="equipe") carregarEquipeUsuarios();
  if(tab==="empresa") renderBrandingEmpresa();
}

// ── Branding da Empresa (logo + cor dos relatorios) ──────────

async function _carregarBrandingEmpresa(){
  if(!supa||!_empresaId) return;
  try{
    const {data}=await supa.from('empresas').select('nome,logo_url,cor_primaria').eq('id',_empresaId).maybeSingle();
    if(data){
      if(data.logo_url) _empresaLogo=data.logo_url;
      if(data.cor_primaria) _empresaCor=data.cor_primaria;
      localStorage.setItem('_ot_logo',_empresaLogo||'');
      localStorage.setItem('_ot_cor',_empresaCor);
    }
  }catch(e){
    // Fallback: cache local
    _empresaLogo=localStorage.getItem('_ot_logo')||null;
    _empresaCor=localStorage.getItem('_ot_cor')||'#0A193C';
  }
}

function _atualizarSidebarEmpresa(){
  const nome=localStorage.getItem('_ot_empresa_nome')||'';
  const nameEl=document.getElementById('sb-empresa-name-el');
  if(nameEl) nameEl.textContent=nome;
  const logoEl=document.getElementById('sb-empresa-logo-el');
  if(logoEl&&_empresaLogo){
    logoEl.innerHTML='<img src="'+_empresaLogo+'" style="width:100%;height:100%;object-fit:contain">';
  } else if(logoEl&&nome){
    logoEl.textContent=nome.substring(0,2).toUpperCase();
  }
}

function renderBrandingEmpresa(){
  // Preview da logo
  const prev=document.getElementById('empresa-logo-preview');
  const ph=document.getElementById('empresa-logo-placeholder');
  if(prev&&_empresaLogo){
    prev.innerHTML='<img src="'+_empresaLogo+'" style="max-width:100%;max-height:100%;object-fit:contain">';
  } else if(prev&&ph){
    prev.innerHTML='<span id="empresa-logo-placeholder" style="font-size:11px;color:var(--txt3);text-align:center;padding:8px">Clique para enviar<br>sua logo</span>';
  }
  // Cor manual
  const corInput=document.getElementById('empresa-cor-manual');
  if(corInput) corInput.value=_empresaCor;
  // Preview do header
  atualizarPreviewHeader();
  // Extrair cores se tiver logo
  if(_empresaLogo) extrairCoresLogo(_empresaLogo);
  else renderCoresExtraidas(['#0A193C','#1A3A6C','#4A4A4A','#000000']);
}

function atualizarPreviewHeader(){
  const bar=document.getElementById('empresa-preview-bar');
  if(bar) bar.style.background=_empresaCor;
}

function extrairCoresLogo(url){
  var img=new Image();
  img.crossOrigin='anonymous';
  img.onload=function(){
    var canvas=document.createElement('canvas');
    var ctx=canvas.getContext('2d');
    var size=80;
    canvas.width=size;canvas.height=size;
    ctx.drawImage(img,0,0,size,size);
    var data=ctx.getImageData(0,0,size,size).data;
    var cores={};
    for(var i=0;i<data.length;i+=4){
      var r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
      if(a<128) continue;
      // Ignorar quase-branco (fundo claro)
      if(r>230&&g>230&&b>230) continue;
      // Ignorar quase-preto (fundo escuro)
      if(r<30&&g<30&&b<30) continue;
      // Ignorar cinza puro (sem saturacao)
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      var sat=(mx===0)?0:(mx-mn)/mx;
      // Quantizar com passo menor para preservar tons
      var qr=Math.round(r/24)*24,qg=Math.round(g/24)*24,qb=Math.round(b/24)*24;
      var key=qr+','+qg+','+qb;
      // Dar peso extra para cores saturadas (coloridas)
      var peso=sat>0.2?(1+sat*3):1;
      cores[key]=(cores[key]||0)+peso;
    }
    // Ordenar por peso (frequencia x saturacao)
    var sorted=Object.entries(cores).sort(function(a,b){return b[1]-a[1];}).slice(0,6);
    var hexCores=sorted.map(function(e){
      var p=e[0].split(',');
      return '#'+[p[0],p[1],p[2]].map(function(c){return ('0'+parseInt(c).toString(16)).slice(-2);}).join('');
    });
    // Remover duplicatas visuais muito proximas
    var filtered=[hexCores[0]];
    for(var j=1;j<hexCores.length;j++){
      var dup=false;
      var c1=hexToRgb(hexCores[j]);
      for(var k=0;k<filtered.length;k++){
        var c2=hexToRgb(filtered[k]);
        var dist=Math.abs(c1[0]-c2[0])+Math.abs(c1[1]-c2[1])+Math.abs(c1[2]-c2[2]);
        if(dist<60){dup=true;break;}
      }
      if(!dup) filtered.push(hexCores[j]);
    }
    // Sempre incluir preto como opcao
    if(filtered.indexOf('#000000')===-1) filtered.push('#000000');
    renderCoresExtraidas(filtered.slice(0,6));
  };
  img.onerror=function(){renderCoresExtraidas(['#0A193C','#000000']);};
  img.src=url;
}

function renderCoresExtraidas(cores){
  const el=document.getElementById('empresa-cores-extraidas');
  if(!el) return;
  el.innerHTML=cores.map(function(c){
    const sel=c.toLowerCase()===_empresaCor.toLowerCase();
    return '<div onclick="selecionarCorEmpresa(\''+c+'\')" style="width:40px;height:40px;border-radius:8px;cursor:pointer;background:'+c+';border:3px solid '+(sel?'var(--primary)':'var(--border)')+';display:flex;align-items:center;justify-content:center;transition:border .2s">'+(sel?'<span style="color:#fff;font-size:14px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.5)">&#10003;</span>':'')+'</div>';
  }).join('');
}

async function selecionarCorEmpresa(hex){
  _empresaCor=hex;
  localStorage.setItem('_ot_cor',hex);
  atualizarPreviewHeader();
  if(_empresaLogo) extrairCoresLogo(_empresaLogo);
  else renderCoresExtraidas(['#0A193C','#1A3A6C','#4A4A4A','#000000']);
  const corInput=document.getElementById('empresa-cor-manual');
  if(corInput) corInput.value=hex;
  if(supa&&_empresaId){
    await supa.from('empresas').update({cor_primaria:hex}).eq('id',_empresaId);
  }
  toast('🎨','Cor atualizada!');
}

async function uploadLogoEmpresa(e){
  const file=e.target.files[0];
  if(!file) return;
  if(file.size>2*1024*1024){toast('⚠️','Logo deve ter no maximo 2MB.');return;}
  toast('⏳','Enviando logo...');
  try{
    const ext=file.name.split('.').pop().toLowerCase();
    const path=_empresaId+'/logo.'+ext;
    // Remover logo anterior se existir
    await supa.storage.from('drive-obras').remove([_empresaId+'/logo.png',_empresaId+'/logo.jpg',_empresaId+'/logo.jpeg',_empresaId+'/logo.webp']);
    const {error:upErr}=await supa.storage.from('drive-obras').upload(path,file,{upsert:true,contentType:file.type});
    if(upErr) throw upErr;
    const {data:urlData}=supa.storage.from('drive-obras').getPublicUrl(path);
    const logoUrl=urlData.publicUrl+'?t='+Date.now();
    _empresaLogo=logoUrl;
    localStorage.setItem('_ot_logo',logoUrl);
    await supa.from('empresas').update({logo_url:logoUrl}).eq('id',_empresaId);
    renderBrandingEmpresa();
    toast('✅','Logo atualizada!');
  }catch(err){
    console.error('Upload logo:',err);
    toast('❌','Erro ao enviar logo: '+err.message);
  }
  e.target.value='';
}

async function removerLogoEmpresa(){
  if(!confirm('Remover a logomarca?')) return;
  _empresaLogo=null;
  localStorage.removeItem('_ot_logo');
  if(supa&&_empresaId){
    await supa.from('empresas').update({logo_url:null}).eq('id',_empresaId);
    await supa.storage.from('drive-obras').remove([_empresaId+'/logo.png',_empresaId+'/logo.jpg',_empresaId+'/logo.jpeg',_empresaId+'/logo.webp']);
  }
  renderBrandingEmpresa();
  toast('🗑️','Logo removida.');
}

async function carregarEquipeUsuarios(){
  const el=document.getElementById("equipe-usuarios-lista");
  if(!el)return;
  if(!supa||!_empresaId){el.innerHTML='<div class="t-empty">Sem conexão.</div>';return;}
  el.innerHTML='<div class="t-empty">Carregando...</div>';
  const {data,error}=await supa.from("perfis")
    .select("*").eq("empresa_id",_empresaId)
    .not("papel","eq","cliente")
    .order("nome");
  if(error||!data){el.innerHTML='<div class="t-empty">Erro ao carregar usuários.</div>';return;}
  DB.equipeUsuarios=data;
  renderEquipeUsuarios(data);
}

function renderEquipeUsuarios(usuarios){
  const el=document.getElementById("equipe-usuarios-lista");
  if(!el)return;
  if(!usuarios?.length){
    el.innerHTML='<div class="t-empty">Nenhum usuário cadastrado além de você. Clique em "✉️ Convidar Funcionário" para começar.</div>';
    return;
  }
  const papelLabel={admin:"Administrador",gestor:"Gestor",financeiro:"Financeiro",operacional:"Operacional",visualizador:"Visualizador",cliente:"Cliente"};
  const papelCor={admin:"var(--primary)",gestor:"var(--green)",financeiro:"var(--yellow)",operacional:"var(--txt2)",visualizador:"var(--txt3)"};
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">'+
    usuarios.map(u=>{
      const pems=u.permissoes?JSON.parse(u.permissoes):PAPEIS_PRESET[u.papel]||[];
      const modAtivos=MODULOS_SISTEMA.filter(m=>pems.includes(m.id));
      const isSelf=u.id===_usuarioAtual?.id;
      return '<div class="card" style="padding:14px;position:relative">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
          '<div style="width:40px;height:40px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0">'+
            (u.nome?.charAt(0)||"?").toUpperCase()+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:700;font-size:13px;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+( u.nome||"—")+'</div>'+
            '<div style="font-size:11px;color:var(--txt3)">'+
            (u.cargo?u.cargo+' · ':'')+
            (u.email?'<span style="color:var(--txt3)">'+u.email+'</span>':u.papel||'—')+
            (isSelf?' <span style="color:var(--primary)">(você)</span>':'')+
          '</div>'+
          '</div>'+
          '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:var(--bg3);color:'+( papelCor[u.papel]||"var(--txt2)")+'">'+( papelLabel[u.papel]||u.papel)+'</span>'+
        '</div>'+
        (()=>{
          const obIds=u.obras_ids?JSON.parse(u.obras_ids):null;
          const obrasStr=obIds===null?'Todas as obras':
            obIds.length===0?'<span style="color:var(--red);font-size:10px">Nenhuma obra liberada</span>':
            obIds.map(id=>DB.obras.find(o=>o.id===id)?.nome||'—').join(', ');
          return '<div style="font-size:10px;color:var(--txt3);margin-bottom:4px">🏗️ Obras: <span style="color:var(--txt2)">'+(obrasStr)+'</span></div>';
        })()+
        '<div style="font-size:10px;color:var(--txt3);margin-bottom:8px">🔐 Módulos:</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">'+
          modAtivos.map(m=>'<span style="font-size:10px;padding:2px 6px;background:var(--bg3);border-radius:4px;border:1px solid var(--border)">'+m.ic+" "+m.label+'</span>').join("")+
          (modAtivos.length===0?'<span style="font-size:10px;color:var(--txt3);font-style:italic">Sem permissões</span>':'')+
        '</div>'+
        (!isSelf && u.papel!=='admin'?
          '<div style="display:flex;gap:6px">'+
            '<button class="btn sm" style="flex:1" onclick="abrirEditarPermissoes(\''+u.id+'\')">⚙️ Permissões</button>'+
            '<button class="btn sm ico" onclick="removerAcessoUsuario(\''+u.id+'\',\''+u.nome+'\')">🗑️</button>'+
          '</div>'
        :(!isSelf&&u.papel==='admin'?'<div style="font-size:10px;color:var(--txt3);text-align:center;padding:4px">Administrador — acesso total</div>':""))+
      '</div>';
    }).join("")+'</div>';
}

function abrirModalConviteEquipe(){
  if(!supa||!_empresaId){toast("⚠️","Sem conexão.");return;}
  const root=document.getElementById("modal-root");
  const chks=MODULOS_SISTEMA.map(m=>
    `<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-radius:6px;hover:background:var(--bg3)">
      <input type="checkbox" class="perm-chk" value="${m.id}" style="width:15px;height:15px" checked>
      <span style="font-size:12px">${m.ic} ${m.label}</span>
    </label>`
  ).join("");

  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:560px">
      <div class="moh"><div class="mot">👷 Convidar Funcionário</div><div class="mox" onclick="closeModal()">✕</div></div>
      <div class="mob" style="max-height:75vh;overflow-y:auto">
        <div class="g g2" style="margin-bottom:14px">
          <div class="fg"><label class="lbl">Nome completo *</label>
            <input class="inp" id="eq-nome" placeholder="Ex: Carlos Ferreira"></div>
          <div class="fg"><label class="lbl">Email *</label>
            <input class="inp" id="eq-email" type="email" placeholder="email@empresa.com"></div>
          <div class="fg"><label class="lbl">Cargo / Função</label>
            <input class="inp" id="eq-cargo" placeholder="Ex: Encarregado, Técnico..."></div>
          <div class="fg"><label class="lbl">Perfil de acesso base</label>
            <select class="sel" id="eq-papel" onchange="eqAplicarPreset(this.value)">
              <option value="operacional">Operacional</option>
              <option value="gestor">Gestor</option>
              <option value="financeiro">Financeiro</option>
              <option value="visualizador">Visualizador</option>
              <option value="admin">Administrador</option>
            </select></div>
        </div>
        <!-- Seleção de obras -->
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <label class="lbl" style="margin:0">🏗️ Obras que pode acessar</label>
            <div style="display:flex;gap:6px">
              <button class="btn sm" onclick="eqSelecionarObras(true)">Todas</button>
              <button class="btn sm" onclick="eqSelecionarObras(false)">Nenhuma</button>
            </div>
          </div>
          <div id="eq-obras-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--bg3);border-radius:8px;padding:8px">
            <div style="font-size:11px;color:var(--txt3);padding:6px">Carregando obras...</div>
          </div>
        </div>
        <!-- Módulos -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <label class="lbl" style="margin:0">🔐 Módulos com acesso</label>
          <div style="display:flex;gap:6px">
            <button class="btn sm" onclick="eqSelecionarTodos(true)">Todos</button>
            <button class="btn sm" onclick="eqSelecionarTodos(false)">Nenhum</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--bg3);border-radius:8px;padding:8px;margin-bottom:14px">
          ${chks}
        </div>
      </div>
      <div class="mof">
        <button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn pri" onclick="enviarConviteEquipe()">✉️ Enviar Convite</button>
      </div>
    </div></div>`;
  // Aplicar preset inicial
  eqAplicarPreset("operacional");

  // Popular obras — busca direto do Supabase se DB.obras ainda não carregou
  const _renderObrasGrid=async()=>{
    const g=document.getElementById('eq-obras-grid');
    if(!g)return;
    let obras=DB.obras;
    if(!obras.length&&supa&&_empresaId){
      g.innerHTML='<div style="font-size:11px;color:var(--txt3);padding:6px">Carregando...</div>';
      const {data}=await supa.from('obras').select('id,nome').eq('empresa_id',_empresaId).order('nome');
      if(data&&data.length){
        DB.obras=data.map(mapObra||((r)=>({id:r.id,nome:r.nome})));
        obras=data;
      }
    }
    if(!obras.length){
      g.innerHTML='<div style="font-size:11px;color:var(--txt3);padding:6px">Nenhuma obra cadastrada.</div>';
      return;
    }
    g.innerHTML=obras.map(o=>
      '<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;cursor:pointer;border-radius:6px;background:var(--bg2);margin-bottom:2px">'+
        '<input type="checkbox" class="obra-chk" value="'+(o.id||o)+'" style="width:15px;height:15px" checked>'+
        '<span style="font-size:12px;font-weight:500">🏗️ '+(o.nome||o)+'</span>'+
      '</label>'
    ).join('');
  };
  setTimeout(_renderObrasGrid, 50);
}

function eqAplicarPreset(papel){
  const preset=PAPEIS_PRESET[papel]||[];
  document.querySelectorAll(".perm-chk").forEach(chk=>{
    chk.checked=preset.includes(chk.value);
  });
}

function eqSelecionarTodos(sel){
  document.querySelectorAll(".perm-chk").forEach(chk=>chk.checked=sel);
}
function eqSelecionarObras(sel){
  document.querySelectorAll(".obra-chk").forEach(chk=>chk.checked=sel);
}
function eqSelecionarObrasEdit(sel){
  document.querySelectorAll(".obra-edit-chk").forEach(chk=>chk.checked=sel);
}

async function enviarConviteEquipe(){
  const nome=document.getElementById("eq-nome")?.value.trim();
  const email=document.getElementById("eq-email")?.value.trim().toLowerCase();
  const cargo=document.getElementById("eq-cargo")?.value.trim();
  const papel=document.getElementById("eq-papel")?.value||"operacional";
  const permissoes=[...document.querySelectorAll(".perm-chk:checked")].map(c=>c.value);
  const obrasIds=[...document.querySelectorAll(".obra-chk:checked")].map(c=>c.value);

  if(!nome){toast("⚠️","Informe o nome.");return;}
  if(!email||!email.includes("@")){toast("⚠️","Email inválido.");return;}
  if(!permissoes.length){toast("⚠️","Selecione ao menos um módulo.");return;}

  const btnEnviar=document.querySelector(".mof .btn.pri");
  if(btnEnviar){btnEnviar.disabled=true;btnEnviar.textContent="Enviando...";}

  try{
    // Gerar senha provisória
    const palavras=["Obra","Torre","Vila","Casa","Bloco","Piso","Muro","Viga"];
    const palavra=palavras[Math.floor(Math.random()*palavras.length)];
    const num=Math.floor(100+Math.random()*900);
    const senha=palavra+num+"!";

    // Criar usuário via SDK signUp — salvar sessão atual antes para restaurar depois
    const {data:sessaoAtual} = await supa.auth.getSession();
    window._ignorarAuthEvent = true; // flag para não disparar iniciarSessao no listener

    const {data:signUpData, error:signUpErr} = await supa.auth.signUp({
      email, password: senha,
      options: { data: {nome, papel, empresa_id: _empresaId} }
    });

    // Restaurar sessão do admin imediatamente
    if(sessaoAtual?.session){
      await supa.auth.setSession({
        access_token: sessaoAtual.session.access_token,
        refresh_token: sessaoAtual.session.refresh_token
      });
    }
    window._ignorarAuthEvent = false;

    if(signUpErr && !signUpErr.message?.includes('already registered')){
      toast("❌","Erro ao criar acesso: "+String(signUpErr.message).substring(0,80));
      if(btnEnviar){btnEnviar.disabled=false;btnEnviar.textContent="✉️ Enviar Convite";}
      return;
    }

    let userId = signUpData?.user?.id;

    if(!userId){
      // Email já existe — buscar ID pelo email na tabela perfis
      const {data:perfExist}=await supa.from("perfis")
        .select("id").eq("empresa_id",_empresaId).eq("email",email).maybeSingle();
      if(perfExist?.id){
        userId=perfExist.id;
        toast("ℹ️","Usuário já existe — permissões atualizadas.");
      } else {
        toast("⚠️","Não foi possível obter o ID do usuário. Tente novamente.");
        if(btnEnviar){btnEnviar.disabled=false;btnEnviar.textContent="✉️ Enviar Convite";}
        return;
      }
    }

    // Criar perfil com permissões
    const permJson=JSON.stringify(permissoes);
    const obrasJson=JSON.stringify(obrasIds);
    await supa.from("perfis").upsert({
      id:userId,empresa_id:_empresaId,
      nome,cargo,papel,permissoes:permJson,obras_ids:obrasJson,email
    },{onConflict:"id"});

    closeModal();

    // Mostrar credenciais para copiar
    const rootC=document.getElementById("modal-root");
    rootC.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
      <div class="mo" style="max-width:440px">
        <div class="moh"><div class="mot">✅ Funcionário Cadastrado!</div><div class="mox" onclick="closeModal()">✕</div></div>
        <div class="mob">
          <p style="font-size:13px;color:var(--txt);margin-bottom:14px">Acesso criado para <strong>${nome}</strong>. Envie as credenciais abaixo:</p>
          <div style="background:var(--bg3);border-radius:8px;padding:14px;font-size:12px;line-height:2;border:1px solid var(--border)">
            <div>🌐 <strong>Site:</strong> obratech.eng.br</div>
            <div>📧 <strong>Email:</strong> ${email}</div>
            <div>🔑 <strong>Senha:</strong> <strong style="color:var(--primary);font-size:15px;letter-spacing:1px">${senha}</strong></div>
          </div>
          <div style="margin-top:10px;padding:10px 12px;background:rgba(244,166,35,.12);border-radius:8px;border:1px solid rgba(244,166,35,.3)">
            <div style="font-size:11px;color:var(--yellow);font-weight:600;margin-bottom:4px">⚠️ Importante — Confirmação de email</div>
            <div style="font-size:11px;color:var(--txt2);line-height:1.6">
              O funcionário receberá um <strong>email de confirmação</strong> do Supabase antes de conseguir logar.<br>
              Se quiser que ele acesse sem confirmar o email, vá em:<br>
              <strong>Supabase → Authentication → Providers → Email → desative "Confirm email"</strong>
            </div>
          </div>
          <div style="margin-top:10px;font-size:11px;color:var(--txt3)">
            🔐 Módulos: ${permissoes.map(p=>MODULOS_SISTEMA.find(m=>m.id===p)?.label||p).join(" · ")}
          </div>
        </div>
        <div class="mof">
          <button class="btn pri" onclick="navigator.clipboard.writeText('Acesso ObraTech\nSite: obratech.eng.br\nEmail: ${email}\nSenha: ${senha}\n\nObs: Confirme o email antes de logar.').then(()=>toast('✅','Copiado para WhatsApp!'))">📋 Copiar para WhatsApp</button>
          <button class="btn" onclick="closeModal()">Fechar</button>
        </div>
      </div></div>`;

    // Recarregar lista
    await carregarEquipeUsuarios();
    toast("✅","Funcionário cadastrado! Compartilhe as credenciais.");
  }catch(err){
    console.error("Erro convite equipe:",err);
    toast("❌","Erro: "+err.message?.substring(0,60));
    if(btnEnviar){btnEnviar.disabled=false;btnEnviar.textContent="✉️ Enviar Convite";}
  }
}

async function abrirEditarPermissoes(userId){
  const u=DB.equipeUsuarios?.find(x=>x.id===userId);
  if(!u)return;
  const permAtivas=u.permissoes?JSON.parse(u.permissoes):(PAPEIS_PRESET[u.papel]||[]);
  const obrasAtivas=u.obras_ids?JSON.parse(u.obras_ids):DB.obras.map(o=>o.id); // null = todas
  const root=document.getElementById("modal-root");

  const chks=MODULOS_SISTEMA.map(m=>
    `<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-radius:6px">
      <input type="checkbox" class="perm-edit-chk" value="${m.id}" style="width:15px;height:15px" ${permAtivas.includes(m.id)?"checked":""}>
      <span style="font-size:12px">${m.ic} ${m.label}</span>
    </label>`
  ).join("");

  // obrasChks gerado na hora (DB.obras disponível no editar pois usuario já está na tela)
  const obrasChks=DB.obras.length?DB.obras.map(o=>
    '<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-radius:6px">'+
      '<input type="checkbox" class="obra-edit-chk" value="'+o.id+'" style="width:15px;height:15px" '+(obrasAtivas.includes(o.id)?"checked":"")+'>'+
      '<span style="font-size:12px">🏗️ '+o.nome+'</span>'+
    '</label>'
  ).join(""):'<div style="font-size:11px;color:var(--txt3);padding:6px">Nenhuma obra cadastrada</div>';

  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:520px">
      <div class="moh">
        <div>
          <div class="mot">⚙️ Editar Acesso — ${u.nome}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${u.cargo||u.papel||""} ${u.email?"· "+u.email:""}</div>
        </div>
        <div class="mox" onclick="closeModal()">✕</div>
      </div>
      <div class="mob" style="max-height:72vh;overflow-y:auto">

        <!-- Obras -->
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <label class="lbl" style="margin:0;font-size:12px">🏗️ Obras com acesso</label>
            <div style="display:flex;gap:6px">
              <button class="btn sm" onclick="eqSelecionarObrasEdit(true)">Todas</button>
              <button class="btn sm" onclick="eqSelecionarObrasEdit(false)">Nenhuma</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--bg3);border-radius:8px;padding:8px">
            ${obrasChks||'<div style="font-size:11px;color:var(--txt3);padding:6px">Nenhuma obra cadastrada</div>'}
          </div>
        </div>

        <!-- Módulos -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <label class="lbl" style="margin:0;font-size:12px">🔐 Módulos com acesso</label>
            <div style="display:flex;gap:6px">
              <select class="sel" id="perm-papel-sel" style="width:160px;height:28px;font-size:11px" onchange="eqAplicarPresetEdit(this.value)">
                <option value="">— Preset rápido —</option>
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="financeiro">Financeiro</option>
                <option value="operacional">Operacional</option>
                <option value="visualizador">Visualizador</option>
              </select>
              <button class="btn sm" onclick="document.querySelectorAll('.perm-edit-chk').forEach(c=>c.checked=true)">Todos</button>
              <button class="btn sm" onclick="document.querySelectorAll('.perm-edit-chk').forEach(c=>c.checked=false)">Nenhum</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--bg3);border-radius:8px;padding:8px">
            ${chks}
          </div>
        </div>
      </div>
      <div class="mof">
        <button class="btn ico" onclick="removerAcessoUsuario('${userId}','${u.nome}')" style="color:var(--red)" title="Remover acesso">🗑️</button>
        <button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn pri" onclick="salvarPermissoes('${userId}')">✅ Salvar</button>
      </div>
    </div></div>`;
}

function eqAplicarPresetEdit(papel){
  if(!papel)return;
  const preset=PAPEIS_PRESET[papel]||[];
  document.querySelectorAll(".perm-edit-chk").forEach(chk=>{
    chk.checked=preset.includes(chk.value);
  });
}

async function salvarPermissoes(userId){
  const permissoes=[...document.querySelectorAll(".perm-edit-chk:checked")].map(c=>c.value);
  const obrasIds=[...document.querySelectorAll(".obra-edit-chk:checked")].map(c=>c.value);
  const permJson=JSON.stringify(permissoes);
  const obrasJson=JSON.stringify(obrasIds);
  const {error}=await supa.from("perfis")
    .update({permissoes:permJson,obras_ids:obrasJson})
    .eq("id",userId).eq("empresa_id",_empresaId);
  if(error){toast("❌","Erro ao salvar: "+error.message?.substring(0,50));return;}
  const u=DB.equipeUsuarios?.find(x=>x.id===userId);
  if(u){u.permissoes=permJson;u.obras_ids=obrasJson;}
  closeModal();
  renderEquipeUsuarios(DB.equipeUsuarios);
  toast("✅","Acesso de "+u?.nome?.split(" ")[0]+" atualizado!");
}

async function removerAcessoUsuario(userId,nome){
  if(!confirm("Remover acesso de "+nome+"? O usuário não conseguirá mais entrar no sistema."))return;
  await supa.from("perfis").update({empresa_id:null}).eq("id",userId);
  DB.equipeUsuarios=DB.equipeUsuarios?.filter(u=>u.id!==userId)||[];
  renderEquipeUsuarios(DB.equipeUsuarios);
  toast("✅",nome+" removido do sistema.");
}

// Aplicar restrições de acesso baseadas nas permissões do usuário logado
function aplicarRestricoesPerfil(permissoes, obrasIds){
  if(!permissoes||!Array.isArray(permissoes))return;
  window._permsAtivas=permissoes;

  // Aplicar filtro de obras se fornecido
  const obrasIdsParam=obrasIds||window._obrasPermitidas;
  if(obrasIdsParam!==undefined) aplicarFiltroObras(obrasIdsParam);

  // Esconder sidebar desktop
  document.querySelectorAll(".ni[data-p]").forEach(el=>{
    const pg=el.dataset.p;
    if(pg) el.style.display=permissoes.includes(pg)?"":"none";
  });

  // Esconder nav mobile (bottom bar + painel Mais)
  document.querySelectorAll(".mni[data-p],.mni-more-item[data-p]").forEach(el=>{
    const pg=el.dataset.p;
    if(pg) el.style.display=permissoes.includes(pg)?"":"none";
  });

  // Redirecionar se página atual não tem permissão
  const atual=window._paginaAtual||"dashboard";
  if(!permissoes.includes(atual)){
    goPage(permissoes[0]||"dashboard");
  }
}

function aplicarFiltroObras(obrasIds){
  // null = todas as obras (admin ou sem restrição)
  // [] = nenhuma obra
  // ['id1','id2'] = apenas essas obras
  window._obrasPermitidas=obrasIds;
  if(!obrasIds||!Array.isArray(obrasIds)) return; // sem restrição

  // Filtrar DB.obras para mostrar apenas as permitidas
  if(DB.obras&&DB.obras.length){
    DB.obras=DB.obras.filter(o=>obrasIds.includes(String(o.id)));
    fillSelects();
    renderDash();
    // Re-renderizar página atual com dados filtrados
    renderPaginaAtual&&renderPaginaAtual();
  }
}

// Bloqueio de goPage feito dentro da própria função

async function renderClientes(){
  if(!supa||!_empresaId) return;
  const el=document.getElementById('clientes-lista');
  if(!el) return;
  el.innerHTML='<div style="color:var(--txt3);font-size:12px;padding:8px">Carregando...</div>';
  try{
    // Buscar usuários com papel cliente desta empresa
    const {data:clientes} = await supa.from('perfis')
      .select('*').eq('empresa_id',_empresaId).eq('papel','cliente').order('nome');
    _clientes = clientes||[];

    if(!_clientes.length){
      // Verificar se existem usuários com papel cliente no auth metadata
      el.innerHTML=`<div class="t-empty" style="padding:20px">
        <div style="margin-bottom:12px">Nenhum cliente encontrado na tabela perfis.</div>
        <div style="font-size:11px;color:var(--txt3);margin-bottom:12px">
          Se você convidou clientes recentemente, clique em Sincronizar para verificar.
        </div>
        <button class="btn sm" onclick="sincronizarClientes()">🔄 Sincronizar</button>
      <button class="btn sm pri" onclick="abrirModalConvite()">✉️ Convidar Cliente</button>
        <button class="btn sm" onclick="sincronizarClientes()" style="margin-left:8px">🔄 Sincronizar</button>
      </div>`;
      return;
    }

    // Para cada cliente, buscar obras liberadas
    const {data:permissoes} = await supa.from('cliente_obras')
      .select('cliente_id,obra_id').eq('empresa_id',_empresaId);
    const permMap={};
    (permissoes||[]).forEach(p=>{
      if(!permMap[p.cliente_id]) permMap[p.cliente_id]=[];
      permMap[p.cliente_id].push(p.obra_id);
    });

    // Buscar emails dos usuários via auth metadata
    const emailMap={};
    for(const c of _clientes){
      try{
        const {data:ud}=await supa.from('perfis').select('id,nome,papel').eq('id',c.id).maybeSingle();
        // email vem do user_metadata ou do próprio registro auth
        emailMap[c.id]=c.email||'—';
      }catch(e){}
    }

    el.innerHTML=`
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--txt3);margin-bottom:10px">
        ${_clientes.length} cliente(s) com acesso ao portal
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${_clientes.map(c=>{
        const obras=(permMap[c.id]||[]).map(oid=>DB.obras.find(o=>o.id===oid)?.nome||'—');
        const qtdObras=obras.length;
        return`<div class="card" style="padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:38px;height:38px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;flex-shrink:0">
                ${c.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-weight:600;font-size:13px">${c.nome}</div>
                <div style="font-size:11px;color:var(--txt3);margin-top:2px">
                  ${qtdObras>0
                    ?'🏗️ '+obras.join(' · ')
                    :'<span style="color:var(--yellow)">⚠️ Nenhuma obra liberada</span>'}
                </div>
              </div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn sm" onclick="openModal('permissoes-cliente','${c.id}')" title="Gerenciar obras">🏗️ Obras</button>
              <button class="btn sm ico" onclick="revogarCliente('${c.id}')" title="Remover acesso" style="color:var(--red)">🗑️</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }catch(e){
    el.innerHTML='<div class="al e">Erro ao carregar clientes: '+e.message+'</div>';
  }
}

async function sincronizarClientes(){
  if(!supa||!_empresaId){toast('⚠️','Sem conexão com banco.');return;}
  toast('⏳','Verificando clientes...');
  try{
    // Buscar todos os perfis da empresa para debug
    const {data:todos,error} = await supa.from('perfis')
      .select('*').eq('empresa_id',_empresaId);
    if(error) throw error;

    console.log('Todos os perfis da empresa:', todos);
    const papeis=todos.map(p=>`${p.nome}: ${p.papel}`).join(', ');
    console.log('Papéis:', papeis);

    // Verificar quantos têm papel cliente
    const clientes=todos.filter(p=>p.papel==='cliente');
    console.log('Clientes encontrados:', clientes.length);

    if(clientes.length>0){
      toast('✅', clientes.length+' cliente(s) encontrado(s). Recarregando...');
      renderClientes();
    } else {
      toast('ℹ️','Nenhum perfil com papel "cliente" encontrado. Total de perfis: '+todos.length);
      // Mostrar diagnóstico
      const el=document.getElementById('clientes-lista');
      if(el) el.innerHTML+=`<div class="al i" style="margin-top:12px">
        <div style="font-size:12px">
          <strong>Diagnóstico:</strong> ${todos.length} perfil(s) encontrado(s) nesta empresa.<br>
          Papéis: ${[...new Set(todos.map(p=>p.papel))].join(', ')||'nenhum'}<br>
          <br>Se você enviou convites, verifique se o upsert na tabela "perfis" foi bem-sucedido abrindo o Supabase → Table Editor → perfis.
        </div>
      </div>`;
    }
  }catch(e){
    console.error('Erro sincronizar:', e);
    toast('❌','Erro: '+e.message);
  }
}

async function revogarCliente(clienteId){
  if(!confirm('Remover acesso deste cliente?')) return;
  await supa.from('cliente_obras').delete().eq('cliente_id',clienteId).eq('empresa_id',_empresaId);
  // Não deletar o usuário, só remover permissões
  toast('✅','Acesso do cliente removido.');
  renderClientes();
}

// Modal de convite de cliente
function abrirModalConvite(){
  const type='convite-cliente';
  if(true){
    const root=document.getElementById('modal-root');
    const obrasOpts=DB.obras.map(o=>`
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px">
        <input type="checkbox" class="convite-obra-chk" value="${o.id}" style="width:16px;height:16px">
        ${o.nome}
      </label>`).join('');
    root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)document.getElementById('modal-root').innerHTML=''">
      <div class="mo">
        <div class="moh"><div class="mot">✉️ Convidar Cliente</div><div class="mox" onclick="closeModal()">✕</div></div>
        <div class="mob">
          <div class="g g1" style="gap:12px">
            <div class="fg"><label class="lbl">Nome do Cliente *</label><input class="inp" id="convite-nome" placeholder="Ex: João Silva"></div>
            <div class="fg"><label class="lbl">Email *</label><input type="email" class="inp" id="convite-email" placeholder="cliente@email.com"></div>
            <div class="fg"><label class="lbl">Obras que este cliente pode ver</label>
              <div style="background:var(--bg3);border-radius:8px;padding:10px;max-height:200px;overflow-y:auto">${obrasOpts||'<div style="color:var(--txt3);font-size:12px">Nenhuma obra cadastrada</div>'}</div>
            </div>
          </div>
        </div>
        <div class="mof">
          <button class="btn" onclick="closeModal()">Cancelar</button>
          <button class="btn pri" onclick="enviarConviteCliente()">✉️ Enviar Convite</button>
        </div>
      </div></div>`;
    return;
  }
  if(type==='permissoes-cliente'){
    const cliente=_clientes.find(c=>c.id===editId);
    if(!cliente){return;}
    const root=document.getElementById('modal-root');
    supa.from('cliente_obras').select('obra_id').eq('cliente_id',editId).eq('empresa_id',_empresaId)
      .then(({data:perms})=>{
        const liberadas=new Set((perms||[]).map(p=>p.obra_id));
        const obrasOpts=DB.obras.map(o=>`
          <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px">
            <input type="checkbox" class="perm-obra-chk" value="${o.id}" ${liberadas.has(o.id)?'checked':''} style="width:16px;height:16px">
            ${o.nome}
          </label>`).join('');
        root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)document.getElementById('modal-root').innerHTML=''">
          <div class="mo">
            <div class="moh"><div class="mot">🏗️ Obras de ${cliente.nome}</div><div class="mox" onclick="closeModal()">✕</div></div>
            <div class="mob">
              <p style="font-size:12px;color:var(--txt3);margin-bottom:12px">Selecione quais obras este cliente pode visualizar:</p>
              <div style="background:var(--bg3);border-radius:8px;padding:10px;max-height:260px;overflow-y:auto">${obrasOpts||'Nenhuma obra'}</div>
            </div>
            <div class="mof">
              <button class="btn" onclick="closeModal()">Cancelar</button>
              <button class="btn pri" onclick="salvarPermissoesCliente('${editId}')">✅ Salvar Permissões</button>
            </div>
          </div></div>`;
      });
    return;
  }
  // outros tipos tratados pelo openModal principal
}

async function enviarConviteCliente(){
  const nome=document.getElementById('convite-nome')?.value.trim();
  const email=document.getElementById('convite-email')?.value.trim();
  const obrasSel=[...document.querySelectorAll('.convite-obra-chk:checked')].map(c=>c.value);

  if(!nome){toast('⚠️','Informe o nome do cliente!');return;}
  if(!email||!email.includes('@')){toast('⚠️','Informe um email válido!');return;}
  if(!obrasSel.length){toast('⚠️','Selecione ao menos uma obra!');return;}

  closeModal();
  toast('⏳','Criando acesso do cliente...');

  try{
    // Gerar senha provisória legível
    const palavras=['Obra','Casa','Torre','Plaza','Vila','Rio','Sol','Mar'];
    const palavra=palavras[Math.floor(Math.random()*palavras.length)];
    const num=Math.floor(Math.random()*900)+100;
    const senhaTemp=palavra+num+'!';
    const url=window.location.origin;

    // ETAPA 1: Criar usuário no Supabase Auth
    // Salvar sessão atual do admin para restaurar depois
    const {data:sessaoAdmin} = await supa.auth.getSession();
    window._ignorarAuthEvent = true;

    const {data:authData, error:authErr} = await supa.auth.signUp({
      email,
      password: senhaTemp,
      options:{
        data:{nome, papel:'cliente', empresa_id:_empresaId},
        emailRedirectTo: url
      }
    });

    // Restaurar sessão do admin imediatamente
    if(sessaoAdmin?.session){
      await supa.auth.setSession({
        access_token: sessaoAdmin.session.access_token,
        refresh_token: sessaoAdmin.session.refresh_token
      });
    }
    window._ignorarAuthEvent = false;

    // Tratar erros específicos do signUp
    if(authErr){
      console.error('signUp erro:', authErr.status, authErr.message);
      if(authErr.message?.includes('already registered')||authErr?.status===409){
        toast('⚠️','Email já cadastrado. Use o botão 🏗️ Obras para gerenciar permissões.');
        renderClientes(); return;
      }
      if(authErr.status===422||authErr.message?.includes('confirm')||authErr.message?.includes('422')){
        // Mostrar instrução clara para desativar confirmação
        const root=document.getElementById('modal-root');
        root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
          <div class="mo" style="max-width:460px">
            <div class="moh"><div class="mot">⚙️ Configuração Necessária</div><div class="mox" onclick="closeModal()">✕</div></div>
            <div class="mob">
              <div style="background:var(--yglow);border:1px solid var(--yellow);border-radius:10px;padding:16px;margin-bottom:16px">
                <div style="font-weight:700;margin-bottom:8px;color:var(--txt)">⚠️ Confirmação de email está ativada no Supabase</div>
                <div style="font-size:12px;color:var(--txt2);line-height:1.7">
                  Para que os convites funcionem com senha imediata, você precisa desativar a confirmação de email no Supabase.
                </div>
              </div>
              <div style="background:var(--bg3);border-radius:10px;padding:14px">
                <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--txt)">Siga estes passos:</div>
                <div style="font-size:12px;color:var(--txt2);line-height:2">
                  1. Acesse <strong>app.supabase.com</strong><br>
                  2. Vá em <strong>Authentication → Providers → Email</strong><br>
                  3. Desmarque <strong>"Enable email confirmations"</strong><br>
                  4. Clique em <strong>Save</strong><br>
                  5. Volte aqui e tente convidar novamente
                </div>
              </div>
            </div>
            <div class="mof">
              <button class="btn pri" onclick="window.open('https://app.supabase.com','_blank')">🔗 Abrir Supabase</button>
              <button class="btn" onclick="closeModal()">Fechar</button>
            </div>
          </div></div>`;
        return;
      }
      throw authErr;
    }

    const userId=authData?.user?.id;
    if(!userId) throw new Error('Usuário não criado. Verifique se desativou "Confirm email" no Supabase.');

    // ETAPA 2: Criar perfil do cliente
    await new Promise(r=>setTimeout(r,500));
    const {error:pe}=await supa.from('perfis').upsert(
      {id:userId, empresa_id:_empresaId, nome, papel:'cliente'},
      {onConflict:'id'}
    );
    if(pe) console.error('Perfil erro:',pe.message);

    // ETAPA 3: Liberar obras
    for(const obraId of obrasSel){
      await supa.from('cliente_obras').upsert(
        {empresa_id:_empresaId, cliente_id:userId, obra_id:obraId},
        {onConflict:'cliente_id,obra_id'}
      );
    }

    // ETAPA 4: Enviar email de boas-vindas via resetPasswordForEmail
    // Isso envia um link mágico que confirma o email E permite acesso direto
    await supa.auth.resetPasswordForEmail(email, {
      redirectTo: url+'?portal=cliente'
    });

    // ETAPA 5: Mostrar credenciais + mensagem para o gestor
    const obrasSelecionadas=obrasSel.map(id=>DB.obras.find(o=>o.id===id)?.nome||'').filter(Boolean).join(', ');
    const root=document.getElementById('modal-root');
    const msgTexto=`Olá, ${nome}!

Seu acesso ao Portal do Cliente foi criado.

🌐 Acesse: ${url}
📧 Email: ${email}
🔑 Senha: ${senhaTemp}

Obras disponíveis: ${obrasSelecionadas}

⚠️ IMPORTANTE: Se receber um email do sistema pedindo confirmação, ignore-o. Use apenas as credenciais acima para acessar.

Após o primeiro acesso, recomendamos trocar a senha em Configurações.`;

    root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
      <div class="mo" style="max-width:500px">
        <div class="moh">
          <div class="mot">✅ Acesso Criado com Sucesso</div>
          <div class="mox" onclick="closeModal()">✕</div>
        </div>
        <div class="mob">
          <!-- Credenciais -->
          <div style="background:linear-gradient(135deg,var(--primary),#7b5cf0);border-radius:12px;padding:18px;margin-bottom:14px;color:white">
            <div style="font-size:11px;opacity:.8;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Credenciais de acesso — ${nome}</div>
            <div style="display:grid;gap:8px">
              <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px">
                <span style="font-size:11px;opacity:.8">🌐 Endereço</span>
                <span style="font-size:12px;font-weight:700">${url}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px">
                <span style="font-size:11px;opacity:.8">📧 Email</span>
                <span style="font-size:13px;font-weight:700">${email}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 12px">
                <span style="font-size:11px;opacity:.8">🔑 Senha</span>
                <span style="font-size:16px;font-weight:800;letter-spacing:2px">${senhaTemp}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px">
                <span style="font-size:11px;opacity:.8">🏗️ Obras</span>
                <span style="font-size:11px;font-weight:600">${obrasSelecionadas}</span>
              </div>
            </div>
          </div>
          <!-- Mensagem pronta -->
          <div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;color:var(--txt3);margin-bottom:6px;font-weight:600">📋 Mensagem pronta para WhatsApp/Email:</div>
            <div id="msg-convite" style="font-size:12px;line-height:1.7;color:var(--txt2);white-space:pre-line">${msgTexto}</div>
          </div>
          <div style="background:var(--yglow);border:1px solid var(--yellow);border-radius:8px;padding:10px;font-size:11px;color:var(--txt2)">
            ⚠️ <strong>Importante:</strong> Vá em <strong>Supabase → Authentication → Providers → Email</strong> e desmarque <strong>"Confirm email"</strong> para que a senha funcione imediatamente.
          </div>
        </div>
        <div class="mof">
          <button class="btn pri" onclick="(()=>{const t=document.getElementById('msg-convite').innerText;navigator.clipboard?.writeText(t).then(()=>toast('📋','Mensagem copiada! Cole no WhatsApp ou email.'));})()">
            📋 Copiar Mensagem
          </button>
          <button class="btn" onclick="closeModal();renderClientes()">✓ Fechar</button>
        </div>
      </div></div>`;

  }catch(e){
    console.error('Erro convite:', e);
    toast('❌','Erro: '+e.message.substring(0,100));
  }
}

async function salvarPermissoesCliente(clienteId){
  const obrasSel=[...document.querySelectorAll('.perm-obra-chk:checked')].map(c=>c.value);
  closeModal();
  try{
    // Remover permissões antigas
    await supa.from('cliente_obras').delete().eq('cliente_id',clienteId).eq('empresa_id',_empresaId);
    // Adicionar novas
    for(const obraId of obrasSel){
      await supa.from('cliente_obras').insert({empresa_id:_empresaId, cliente_id:clienteId, obra_id:obraId});
    }
    toast('✅','Permissões atualizadas!');
    renderClientes();
  }catch(e){
    toast('❌','Erro ao salvar: '+e.message);
  }
}

// ── Pull-to-refresh no celular ─────────────────────────────
(function(){
  let _ptrStartY=0, _ptrEl=null, _ptrAtivo=false;
  const MIN_PULL=130;      // distância mínima para ativar (era 70)
  const DEAD_ZONE=20;      // zona morta — ignora movimentos pequenos
  const MIN_VELOCIDADE=3;  // só ativa se arrastar rápido o suficiente

  document.addEventListener('touchstart',e=>{
    // Só ativa se estiver no topo da página E toque com 1 dedo
    if(window.scrollY>5||e.touches.length>1) return;
    _ptrStartY=e.touches[0].clientY;
    _ptrAtivo=false;
    if(!_ptrEl){
      _ptrEl=document.createElement('div');
      _ptrEl.id='ptr-indicator';
      _ptrEl.style.cssText='position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-50px);z-index:99999;background:var(--primary);color:#fff;border-radius:0 0 20px 20px;padding:8px 24px;font-size:12px;font-weight:600;transition:transform .15s;pointer-events:none;font-family:Inter,sans-serif';
      _ptrEl.textContent='↓ Puxe para atualizar';
      document.body.appendChild(_ptrEl);
    }
  },{passive:true});

  document.addEventListener('touchmove',e=>{
    if(!_ptrStartY) return;
    const dy=e.touches[0].clientY-_ptrStartY;
    // Zona morta — movimentos pequenos não fazem nada
    if(dy<DEAD_ZONE){return;}
    if(dy<0){_ptrStartY=0;return;}
    _ptrAtivo=true;
    if(_ptrEl){
      const prog=Math.min((dy-DEAD_ZONE)/(MIN_PULL-DEAD_ZONE),1);
      const offset=-50+prog*62;
      _ptrEl.style.transform=`translateX(-50%) translateY(${offset}px)`;
      _ptrEl.textContent=dy>=MIN_PULL?'↑ Solte para atualizar':'↓ Continue puxando...';
      _ptrEl.style.background=dy>=MIN_PULL?'var(--green)':'var(--primary)';
    }
  },{passive:true});

  document.addEventListener('touchend',e=>{
    if(!_ptrStartY||!_ptrAtivo){_ptrStartY=0;return;}
    const dy=e.changedTouches[0].clientY-_ptrStartY;
    _ptrStartY=0;
    _ptrAtivo=false;
    if(_ptrEl){
      _ptrEl.style.transform='translateX(-50%) translateY(-50px)';
      _ptrEl.style.background='var(--primary)';
    }
    if(dy>=MIN_PULL){ setTimeout(()=>location.reload(),350); }
  });
})();

document.addEventListener("DOMContentLoaded", initObraTech);

// ── Mobile Navigation ──────────────────────────────────────────
function toggleMobileMore(){
  const p=document.getElementById('mni-more-panel');
  if(p) p.classList.toggle('open');
}
function closeMobileMore(){
  const p=document.getElementById('mni-more-panel');
  if(p) p.classList.remove('open');
}
function toggleMobileSidebar(){
  // No mobile, abre o painel "mais" como menu completo
  toggleMobileMore();
}
// Fechar painel mais ao clicar fora
document.addEventListener('click', e=>{
  const panel=document.getElementById('mni-more-panel');
  const moreBtn=document.querySelector('.mni:last-child');
  if(panel?.classList.contains('open') && !panel.contains(e.target) && !moreBtn?.contains(e.target)){
    panel.classList.remove('open');
  }
});
