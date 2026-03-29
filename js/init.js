// ════════════════════════════════════════════════════════════
// TEMA CLARO / ESCURO
// ════════════════════════════════════════════════════════════
function toggleTheme(){
  document.body.classList.toggle('light');
  localStorage.setItem('og_theme',document.body.classList.contains('light')?'light':'dark');
}
function initTheme(){
  if(localStorage.getItem('og_theme')==='light') document.body.classList.add('light');
}

// ── Inicialização do ObraTech ─────────────────────────────────

// ── Formatar campos de valor com 2 casas decimais ──
document.addEventListener('blur',function(e){
  if(e.target&&e.target.type==='number'&&e.target.step==='0.01'&&e.target.value){
    e.target.value=parseFloat(e.target.value).toFixed(2);
  }
},true);
async function initObraTech(){
  initTheme();
  initSupabase();
  
  if(!supa){
    load();
    mostrarApp();
    renderDash(); fillSelects(); renderObras();
    return;
  }

  // Verificar cache local IMEDIATAMENTE — sem esperar Supabase
  const cachedEmpresa = localStorage.getItem('_ot_empresa_id');
  const cachedPapel = localStorage.getItem('_ot_papel');
  const cachedNome = localStorage.getItem('_ot_nome');

  if(cachedEmpresa && cachedPapel && cachedNome){
    // Restaurar DB do localStorage ANTES de tudo (preserva foto, ini, etc)
    load();
    // Temos cache: mostrar app INSTANTANEAMENTE
    _empresaId = cachedEmpresa;
    _papelAtual = cachedPapel;
    // Preservar foto/ini que vieram do load(), só atualizar nome/cargo se necessario
    if(!DB.user.nome) DB.user.nome = cachedNome;
    if(!DB.user.cargo) DB.user.cargo = localStorage.getItem('_ot_cargo') || cachedPapel;
    // Restaurar branding da empresa (logo + cor)
    _empresaLogo = localStorage.getItem('_ot_logo') || null;
    _empresaCor = localStorage.getItem('_ot_cor') || '#0A193C';
    _atualizarSidebar(DB.user.nome, cachedPapel);
    window._sessaoAtiva = true;

    if(cachedPapel==='cliente'){
      mostrarApp();
      const unEl=document.getElementById('pc-user-nome');
      if(unEl) unEl.textContent=DB.user.nome||cachedNome;
    } else {
      mostrarApp();
      renderDash(); fillSelects(); renderObras();
    }
    // Restaurar avatar (foto do DB.user carregado pelo load())
    _restaurarAvatar();

    // Validar sessão em background — com retry para mobile
    const _validarSessao=async(tentativa=1)=>{
      try{
        const {data:{session}}=await supa.auth.getSession();
        if(!session){
          if(tentativa<3){
            // Mobile pode demorar para restaurar sessão — tentar novamente
            await new Promise(r=>setTimeout(r,600*tentativa));
            return _validarSessao(tentativa+1);
          }
          // Sessão expirou após 3 tentativas
          localStorage.removeItem('_ot_empresa_id');
          localStorage.removeItem('_ot_papel');
          localStorage.removeItem('_ot_nome');
          localStorage.removeItem('_ot_user_id');
          window._sessaoAtiva=false;
          mostrarLogin();
          return;
        }
        _usuarioAtual=session.user;
        toast('👋','Bem-vindo, '+cachedNome.split(' ')[0]+'!');
        if(cachedPapel==='cliente'){
          carregarDadosCliente(session.user.id);
        } else {
          carregarDadosSupabase().then(()=>{
            renderDash();renderObras();
            renderPaginaAtual();
          });
          iniciarRealtime();
          adicionarBotaoLogout();
        }
        _atualizarPerfilBackground(session.user.id);
        _carregarBrandingEmpresa();
      }catch(e){
        console.warn('getSession:',e.message);
        if(tentativa<2) setTimeout(()=>_validarSessao(tentativa+1),1000);
      }
    };
    _validarSessao();

    // Escutar logout e recovery
    supa.auth.onAuthStateChange((event, session)=>{
      if(window._ignorarAuthEvent) return; // Ignorar eventos durante convite de equipe
      if(event==='SIGNED_OUT'){
        window._sessaoAtiva=false;
        localStorage.removeItem('_ot_empresa_id');
        localStorage.removeItem('_ot_papel');
        localStorage.removeItem('_ot_nome');
        mostrarLogin();
      }
      if(event==='PASSWORD_RECOVERY'){
        window._sessaoAtiva=false;
        mostrarTelaNovaSenha(session);
      }
    });
    return;
  }

  // Sem cache: registrar listener para recovery/logout
  supa.auth.onAuthStateChange(async (event, session) => {
    if(event==='TOKEN_REFRESHED'){
      if(session) _usuarioAtual=session.user;
      return;
    }
    if(event==='PASSWORD_RECOVERY'){
      window._sessaoAtiva=false;
      mostrarTelaNovaSenha(session);
      return;
    }
    if(event==='SIGNED_IN'){
      if(window._aguardandoNovaSenha) return;
      if(window._sessaoAtiva) return;
      window._sessaoAtiva=true;
      await iniciarSessao(session);
      iniciarRealtime();
      adicionarBotaoLogout();
    } else if(event==='SIGNED_OUT'){
      window._sessaoAtiva=false;
      mostrarLogin();
    }
  });

  // getSession() é a fonte primária — mais confiável no mobile
  try{
    const {data:{session},error}=await supa.auth.getSession();
    if(error) throw error;
    if(session){
      if(!window._sessaoAtiva){ // evitar duplo iniciarSessao
        window._sessaoAtiva=true;
        await iniciarSessao(session);
        iniciarRealtime();
        adicionarBotaoLogout();
      }
    } else {
      // Sem sessão ativa — aguardar um pouco pelo onAuthStateChange
      // (mobile às vezes demora para restaurar a sessão do storage)
      await new Promise(r=>setTimeout(r,800));
      if(!window._sessaoAtiva){
        mostrarLogin();
      }
    }
  }catch(e){
    console.error('Erro ao verificar sessão:', e);
    mostrarLogin();
  }
}

// ════════════════════════════════════════════════════════════
// MODAL DE ESCOLHA — NOVA OBRA vs IMPORTAR OBRA
// ════════════════════════════════════════════════════════════
function openMocModal(){
  document.getElementById('modal-obra-choice').classList.add('open');
}
function closeMoc(){
  document.getElementById('modal-obra-choice').classList.remove('open');
}
function closeMocAndOpen(tipo){
  closeMoc();
  if(tipo==='nova'){setTimeout(()=>openModal('obra'),60);}
  else if(tipo==='importar'){setTimeout(()=>openMioModal(),60);}
}

// ════════════════════════════════════════════════════════════
// MODAL IMPORTAR OBRA
// ════════════════════════════════════════════════════════════
let _importLancs=[];

function openMioModal(){
  _importLancs=[];
  document.getElementById('mio-preview').classList.remove('show');
  document.getElementById('mio-preview-rows').innerHTML='';
  document.getElementById('modal-import-obra').classList.add('open');
}
function closeMioModal(){
  document.getElementById('modal-import-obra').classList.remove('open');
  _importLancs=[];
}

// Fechar ao clicar fora
document.addEventListener('click',e=>{
  if(e.target===document.getElementById('modal-obra-choice'))closeMoc();
  if(e.target===document.getElementById('modal-import-obra'))closeMioModal();
});

// ── Baixar planilha modelo ──────────────────────────────────
function downloadModeloPlanilha(){
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([
    ['Data','Descricao','Categoria','Tipo','Valor (R$)','Etapa','Fornecedor','NF'],
    ['01/03/2025','Argamassa colante','Materiais','Despesa',850.00,'Alvenaria','Leroy Merlin','NF001'],
    ['05/03/2025','Folha semanal pedreiros','Mão de Obra','Despesa',3200.00,'Estrutura','—','—'],
    ['10/03/2025','Entrada do cliente','Receita','Receita',50000.00,'—','—','—'],
    ['15/03/2025','Cimento CP-II 50kg x 80sc','Materiais','Despesa',3040.00,'Fundação','—','—'],
    ['20/03/2025','Instalação elétrica','Serviços','Despesa',4500.00,'Instalações','Eletro Total','NF045'],
  ]);
  ws['!cols']=[{wch:12},{wch:35},{wch:20},{wch:12},{wch:14},{wch:22},{wch:22},{wch:12}];
  // Linha de instrução na linha 1 (acima do header)
  XLSX.utils.book_append_sheet(wb,ws,'Custos da Obra');
  // Aba de instruções
  const wsInst=XLSX.utils.aoa_to_sheet([
    ['INSTRUÇÕES DE PREENCHIMENTO — ObraTech'],
    [''],
    ['Coluna','Formato','Observação'],
    ['Data','DD/MM/AAAA ou AAAA-MM-DD','Data do lançamento'],
    ['Descricao','Texto livre','Descrição do item ou serviço'],
    ['Categoria','Texto','Ex: Materiais, Mão de Obra, Serviços, Equipamentos, Admin'],
    ['Tipo','Despesa ou Receita','Apenas estes dois valores são aceitos'],
    ['Valor (R$)','Número (sem R$ ou pontos)','Ex: 1250.50 ou 1250,50'],
    ['Etapa','Texto (opcional)','Ex: Fundação, Alvenaria, Estrutura...'],
    ['Fornecedor','Texto (opcional)','Nome do fornecedor'],
    ['NF','Texto (opcional)','Número da nota fiscal'],
    [''],
    ['DICA: Não altere os cabeçalhos da aba "Custos da Obra". Apenas preencha os dados abaixo da linha 1.'],
  ]);
  wsInst['!cols']=[{wch:15},{wch:28},{wch:45}];
  XLSX.utils.book_append_sheet(wb,wsInst,'Instrucoes');
  XLSX.writeFile(wb,'ObraTech_Modelo_Importacao.xlsx');
  toast('📋','Planilha modelo baixada!');
}

// ── Processar arquivo enviado ───────────────────────────────
function handleImportObraFile(e){
  const file=e.target.files[0];if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      let rows=[];
      if(ext==='csv'){
        // Parse CSV simples
        const text=ev.target.result;
        const lines=text.split(/\r?\n/).filter(l=>l.trim());
        const header=lines[0].split(/[;,\t]/).map(h=>h.trim().replace(/"/g,'').toLowerCase());
        rows=lines.slice(1).map(line=>{
          const vals=line.split(/[;,\t]/).map(v=>v.trim().replace(/"/g,''));
          const obj={};header.forEach((h,i)=>obj[h]=vals[i]||'');
          return obj;
        });
      } else {
        // XLSX
        const data=new Uint8Array(ev.target.result);
        const wb=XLSX.read(data,{type:'array',cellDates:true});
        const ws=wb.Sheets[wb.SheetNames[0]];
        rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      }
      parseImportRows(rows);
    }catch(err){
      toast('⚠️','Erro ao ler arquivo: '+err.message);
    }
  };
  if(ext==='csv')reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
  e.target.value='';
}

function parseImportRows(rows){
  // Normaliza nomes de colunas
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function findCol(obj,variants){
    const keys=Object.keys(obj);
    for(const v of variants){const k=keys.find(k=>norm(k).includes(norm(v)));if(k)return obj[k];}
    return '';
  }
  function parseData(v){
    // Aceita Date (xlsx), DD/MM/AAAA, AAAA-MM-DD, MM/DD/AAAA
    if(v instanceof Date){return v.toISOString().split('T')[0];}
    const s=String(v||'').trim();
    if(!s||s==='0')return new Date().toISOString().split('T')[0];
    const d1=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if(d1){const y=d1[3].length===2?'20'+d1[3]:d1[3];const m=d1[2].padStart(2,'0');const d=d1[1].padStart(2,'0');return `${y}-${m}-${d}`;}
    const d2=s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    if(d2)return s.replace(/\//g,'-');
    return new Date().toISOString().split('T')[0];
  }
  function parseVal(v){
    // Se já é número (xlsx retorna numeric), usar direto
    if(typeof v==='number') return Math.abs(v);
    let s=String(v||'0').replace(/R\$|\s/g,'').trim();
    if(!s||s==='0')return 0;
    // Detectar formato brasileiro (1.234,56) vs americano (1,234.56) vs simples (1234.56)
    const temVirgula=s.includes(',');
    const temPonto=s.includes('.');
    if(temVirgula && temPonto){
      // Ambos presentes: verificar qual é o último (separador decimal)
      const lastComma=s.lastIndexOf(',');
      const lastDot=s.lastIndexOf('.');
      if(lastComma>lastDot){
        // Formato brasileiro: 1.234,56
        s=s.replace(/\./g,'').replace(',','.');
      } else {
        // Formato americano: 1,234.56
        s=s.replace(/,/g,'');
      }
    } else if(temVirgula && !temPonto){
      // Só vírgula: pode ser decimal (1234,56) ou milhar (1,234)
      // Se tem exatamente 3 dígitos após vírgula, é milhar americano; senão, decimal BR
      const afterComma=s.split(',')[1];
      if(afterComma && afterComma.length===3 && !afterComma.includes(' ')){
        s=s.replace(/,/g,''); // milhar americano
      } else {
        s=s.replace(',','.'); // decimal brasileiro
      }
    } else if(temPonto && !temVirgula){
      // Só ponto: pode ser decimal (1234.56) ou milhar BR (1.234)
      // Se tem exatamente 3 dígitos após ÚLTIMO ponto e mais pontos, é milhar
      const parts=s.split('.');
      if(parts.length>2){
        // Múltiplos pontos = milhar BR sem centavos: 1.234.567
        s=s.replace(/\./g,'');
      }
      // Se tem 1 ponto com 3 dígitos depois e valor > possível (ex: 1.500 = R$ 1500, não R$ 1.5)
      // Manter como decimal americano (padrão XLSX)
    }
    return Math.abs(parseFloat(s)||0);
  }

  _importLancs=rows.map(row=>{
    const tipo=String(findCol(row,['tipo','type'])||'Despesa').trim();
    const tipoNorm=tipo.toLowerCase().includes('rec')?'Receita':'Despesa';
    return{
      data:parseData(findCol(row,['data','date','dt'])),
      desc:String(findCol(row,['descricao','descri','desc','item','historico','discriminacao'])||'Sem descrição').trim(),
      cat:String(findCol(row,['categoria','cat','group','grupo'])||'Sem Categoria').trim(),
      tipo:tipoNorm,
      valor:parseVal(findCol(row,['valor','value','preco','custo','amount'])),
      etapa:String(findCol(row,['etapa','stage','fase'])||'').trim(),
      forn:String(findCol(row,['fornecedor','forn','supplier','vendor'])||'').trim(),
      nf:String(findCol(row,['nf','nota','invoice','nota fiscal'])||'').trim(),
    };
  }).filter(r=>r.valor>0||r.desc);

  // Mostrar preview
  const prev=document.getElementById('mio-preview');
  const rows2=document.getElementById('mio-preview-rows');
  const count=document.getElementById('mio-preview-count');
  prev.classList.add('show');
  count.textContent=_importLancs.length+' registros encontrados';
  const show=_importLancs.slice(0,6);
  rows2.innerHTML=show.map(l=>`
    <div class="import-row">
      <span style="color:var(--txt3);min-width:80px;font-size:11px">${fmtDt(l.data)}</span>
      <span style="flex:1;color:var(--txt)">${l.desc.substring(0,38)}</span>
      <span style="color:var(--txt3);font-size:11px;margin-right:6px">${l.cat}</span>
      <span style="color:${l.tipo==='Despesa'?'var(--red)':'var(--green)'};font-weight:600;font-size:11px;white-space:nowrap">${l.tipo==='Despesa'?'-':'+'}${fmtR(l.valor)}</span>
      <span class="${l.valor>0?'import-row-ok':'import-row-warn'}">${l.valor>0?'OK':'Verificar'}</span>
    </div>`).join('')+(_importLancs.length>6?`<div style="text-align:center;padding:8px;font-size:11px;color:var(--txt3)">... e mais ${_importLancs.length-6} registros</div>`:'');
  toast('📄',`${_importLancs.length} lançamentos lidos da planilha`);
}

function executarImportObra(){
  const nome=document.getElementById('mio-nome').value.trim();
  if(!nome){toast('⚠️','Informe o nome da obra!');return;}
  if(!_importLancs.length){toast('⚠️','Carregue uma planilha com os custos!');return;}
  // Criar obra
  const novaObra={
    id:uuidv4(),nome,
    tipo:document.getElementById('mio-tipo').value,
    orc:parseFloat(document.getElementById('mio-orc').value)||0,
    m2:parseFloat(document.getElementById('mio-m2').value)||0,
    dataIni:document.getElementById('mio-ini').value,
    dataFim:document.getElementById('mio-fim').value,
    local:document.getElementById('mio-local').value.trim(),
    resp:document.getElementById('mio-resp').value.trim(),
    cli:document.getElementById('mio-cli').value.trim(),
    obs:'Importada via planilha em '+new Date().toLocaleDateString('pt-BR')
  };
  DB.obras.push(novaObra);
  if(!DB.sel)DB.sel=novaObra.id;
  // Auto-criar categorias novas da planilha
  _importLancs.forEach(l=>{
    if(l.cat && !DB.categorias.includes(l.cat)){
      DB.categorias.push(l.cat);
      supaInsert('categorias',{id:uuidv4(),nome:l.cat});
    }
  });
  // Inserir lançamentos no DB local E no Supabase
  let okCount=0;
  const lancsParaSupa=[];
  _importLancs.forEach(l=>{
    const novoId=uuidv4();
    const novoLanc={
      id:novoId,obraId:novaObra.id,
      tipo:l.tipo,desc:l.desc,cat:l.cat||'Sem Categoria',
      valor:l.valor,data:l.data,
      etapa:l.etapa||'',forn:l.forn||'',nf:l.nf||'',cc:'',_supa:true
    };
    DB.lancs.push(novoLanc);
    lancsParaSupa.push({
      id:novoId,obra_id:novaObra.id,tipo:l.tipo,descricao:l.desc,
      categoria:l.cat||'Sem Categoria',centro_custo:l.etapa||'',
      valor:l.valor,data:l.data,fornecedor:l.forn||'',nota_fiscal:l.nf||''
    });
    okCount++;
  });
  save();
  closeMioModal();
  fillSelects();
  renderObras();
  toast('✅',`Obra "${nome}" importada com ${okCount} lançamentos!`);
  _importLancs=[];

  // Enviar obra e lançamentos ao Supabase em background
  if(supa&&_empresaId){
    (async()=>{
      try{
        await supaInsert('obras',{id:novaObra.id,nome:novaObra.nome,tipo:novaObra.tipo,
          orcamento:novaObra.orc,area_m2:novaObra.m2,data_ini:novaObra.dataIni||null,
          data_fim:novaObra.dataFim||null,local:novaObra.local,responsavel:novaObra.resp,
          cliente:novaObra.cli,obs:novaObra.obs});
        // Inserir lançamentos em lotes de 50
        for(let i=0;i<lancsParaSupa.length;i+=50){
          const batch=lancsParaSupa.slice(i,i+50);
          await supa.from('lancamentos').insert(batch.map(l=>({...l,empresa_id:_empresaId})));
        }
        toast('☁️',`${okCount} lançamentos sincronizados com o Supabase`);
      }catch(e){console.error('Erro sync importação:',e);}
    })();
  }
}

// ── Importar Planilha direto na aba Financeiro ──────────────
function abrirImportFinanceiro(){
  const root=document.getElementById('modal-root');
  const obrasOpts=DB.obras.map(o=>`<option value="${o.id}">${o.nome}</option>`).join('');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:520px">
      <div class="moh"><div class="mot">📥 Importar Lançamentos</div><div class="mox" onclick="closeModal()">✕</div></div>
      <div class="mob">
        <div style="background:var(--pglow);border:1px solid var(--primary);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-size:12px;color:var(--txt2);line-height:1.7">
            Importe lançamentos financeiros de uma planilha <strong>.xlsx</strong> ou <strong>.csv</strong>.<br>
            Os dados serão <strong>adicionados</strong> aos lançamentos existentes (nada será apagado).
          </div>
        </div>
        <div class="g g1" style="gap:12px">
          <div class="fg"><label class="lbl">Obra vinculada *</label>
            <select class="sel" id="impfin-obra">${obrasOpts||'<option value="">Nenhuma obra</option>'}</select>
          </div>
          <div class="fg"><label class="lbl">Arquivo (.xlsx ou .csv) *</label>
            <button class="btn" onclick="document.getElementById('import-fin-file').click()" id="impfin-btn-file" style="width:100%;text-align:left">📁 Selecionar arquivo...</button>
          </div>
          <div class="fg"><label class="lbl">Planilha modelo</label>
            <button class="btn sm" onclick="baixarPlanilhaModelo()" style="font-size:11px">📋 Baixar modelo .xlsx</button>
          </div>
          <div id="impfin-preview" style="display:none">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--txt)" id="impfin-count"></div>
            <div style="max-height:200px;overflow-y:auto;background:var(--bg3);border-radius:8px;padding:8px" id="impfin-rows"></div>
          </div>
        </div>
      </div>
      <div class="mof">
        <button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn pri" id="impfin-btn-exec" onclick="executarImportFinanceiro()" disabled>📥 Importar Lançamentos</button>
      </div>
    </div></div>`;
}

let _importFinLancs=[];

function handleImportFinFile(e){
  const file=e.target.files[0];if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      let rows=[];
      if(ext==='csv'){
        const text=ev.target.result;
        const lines=text.split(/\r?\n/).filter(l=>l.trim());
        const header=lines[0].split(/[;,\t]/).map(h=>h.trim().replace(/"/g,'').toLowerCase());
        rows=lines.slice(1).map(line=>{
          const vals=line.split(/[;,\t]/).map(v=>v.trim().replace(/"/g,''));
          const obj={};header.forEach((h,i)=>obj[h]=vals[i]||'');
          return obj;
        });
      } else {
        const data=new Uint8Array(ev.target.result);
        const wb=XLSX.read(data,{type:'array',cellDates:true});
        const ws=wb.Sheets[wb.SheetNames[0]];
        rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      }
      // Reusar parseImportRows internamente
      _importFinLancs=_parseImportLancs(rows);
      // Mostrar preview
      const prev=document.getElementById('impfin-preview');
      const rowsEl=document.getElementById('impfin-rows');
      const count=document.getElementById('impfin-count');
      if(prev){prev.style.display='block';}
      if(count){count.textContent=_importFinLancs.length+' lançamentos encontrados';}
      const show=_importFinLancs.slice(0,8);
      if(rowsEl){rowsEl.innerHTML=show.map(l=>`
        <div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:11px">
          <span style="color:var(--txt3);min-width:70px">${fmtDt(l.data)}</span>
          <span style="flex:1;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.desc}</span>
          <span style="color:${l.tipo==='Despesa'?'var(--red)':'var(--green)'};font-weight:600;white-space:nowrap">${l.tipo==='Despesa'?'-':'+'}${fmtR(l.valor)}</span>
        </div>`).join('')+(_importFinLancs.length>8?`<div style="text-align:center;padding:6px;font-size:11px;color:var(--txt3)">... e mais ${_importFinLancs.length-8}</div>`:'');}
      const btn=document.getElementById('impfin-btn-exec');
      if(btn){btn.disabled=false;}
      const btnFile=document.getElementById('impfin-btn-file');
      if(btnFile){btnFile.textContent='📁 '+file.name;}
      toast('📄',_importFinLancs.length+' lançamentos lidos');
    }catch(err){
      toast('⚠️','Erro ao ler arquivo: '+err.message);
    }
  };
  if(ext==='csv')reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
  e.target.value='';
}

// Parser compartilhado entre importação de obra e financeiro
function _parseImportLancs(rows){
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function findCol(obj,variants){
    const keys=Object.keys(obj);
    for(const v of variants){const k=keys.find(k=>norm(k).includes(norm(v)));if(k)return obj[k];}
    return '';
  }
  function parseData(v){
    if(v instanceof Date){return v.toISOString().split('T')[0];}
    const s=String(v||'').trim();
    if(!s||s==='0')return new Date().toISOString().split('T')[0];
    const d1=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if(d1){const y=d1[3].length===2?'20'+d1[3]:d1[3];const m=d1[2].padStart(2,'0');const d=d1[1].padStart(2,'0');return `${y}-${m}-${d}`;}
    const d2=s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    if(d2)return s.replace(/\//g,'-');
    return new Date().toISOString().split('T')[0];
  }
  function parseVal(v){
    if(typeof v==='number') return Math.abs(v);
    let s=String(v||'0').replace(/R\$|\s/g,'').trim();
    if(!s||s==='0')return 0;
    const temVirgula=s.includes(',');
    const temPonto=s.includes('.');
    if(temVirgula && temPonto){
      const lastComma=s.lastIndexOf(',');
      const lastDot=s.lastIndexOf('.');
      if(lastComma>lastDot){s=s.replace(/\./g,'').replace(',','.');}
      else{s=s.replace(/,/g,'');}
    } else if(temVirgula && !temPonto){
      const afterComma=s.split(',')[1];
      if(afterComma && afterComma.length===3 && !afterComma.includes(' ')){s=s.replace(/,/g,'');}
      else{s=s.replace(',','.');}
    } else if(temPonto && !temVirgula){
      const parts=s.split('.');
      if(parts.length>2){s=s.replace(/\./g,'');}
    }
    return Math.abs(parseFloat(s)||0);
  }
  return rows.map(row=>{
    const tipo=String(findCol(row,['tipo','type'])||'Despesa').trim();
    const tipoNorm=tipo.toLowerCase().includes('rec')?'Receita':'Despesa';
    return{
      data:parseData(findCol(row,['data','date','dt'])),
      desc:String(findCol(row,['descricao','descri','desc','item','historico','discriminacao'])||'Sem descrição').trim(),
      cat:String(findCol(row,['categoria','cat','group','grupo'])||'Sem Categoria').trim(),
      tipo:tipoNorm,
      valor:parseVal(findCol(row,['valor','value','preco','custo','amount'])),
      etapa:String(findCol(row,['etapa','stage','fase'])||'').trim(),
      forn:String(findCol(row,['fornecedor','forn','supplier','vendor'])||'').trim(),
      nf:String(findCol(row,['nf','nota','invoice','nota fiscal'])||'').trim(),
    };
  }).filter(r=>r.valor>0||r.desc);
}

async function executarImportFinanceiro(){
  const obraId=document.getElementById('impfin-obra')?.value;
  if(!obraId){toast('⚠️','Selecione uma obra!');return;}
  if(!_importFinLancs.length){toast('⚠️','Carregue uma planilha primeiro!');return;}

  closeModal();
  toast('⏳','Importando '+_importFinLancs.length+' lançamentos...');

  // Auto-criar categorias novas da planilha
  const catsNovas=new Set();
  _importFinLancs.forEach(l=>{
    if(l.cat && !DB.categorias.includes(l.cat)){
      DB.categorias.push(l.cat);
      catsNovas.add(l.cat);
    }
  });
  if(catsNovas.size){
    save();
    for(const cat of catsNovas){
      supaInsert('categorias',{id:uuidv4(),nome:cat});
    }
    console.log('Categorias criadas:',catsNovas.size);
  }

  let okCount=0;
  const lancsParaSupa=[];

  _importFinLancs.forEach(l=>{
    const novoId=uuidv4();
    DB.lancs.push({
      id:novoId,obraId:obraId,
      tipo:l.tipo,desc:l.desc,cat:l.cat||'Sem Categoria',
      valor:l.valor,data:l.data,
      etapa:l.etapa||'',forn:l.forn||'',nf:l.nf||'',cc:'',_supa:true
    });
    lancsParaSupa.push({
      id:novoId,obra_id:obraId,tipo:l.tipo,descricao:l.desc,
      categoria:l.cat||'Sem Categoria',centro_custo:l.etapa||'',
      valor:l.valor,data:l.data,fornecedor:l.forn||'',nota_fiscal:l.nf||''
    });
    okCount++;
  });

  save();
  renderFin();

  // Enviar ao Supabase em lotes
  if(supa&&_empresaId){
    try{
      for(let i=0;i<lancsParaSupa.length;i+=50){
        const batch=lancsParaSupa.slice(i,i+50);
        await supa.from('lancamentos').insert(batch.map(l=>({...l,empresa_id:_empresaId})));
      }
      toast('✅',okCount+' lançamentos importados e sincronizados!');
    }catch(e){
      console.error('Erro sync importação financeiro:',e);
      toast('⚠️','Importado localmente, erro no sync: '+e.message);
    }
  } else {
    toast('✅',okCount+' lançamentos importados!');
  }
  _importFinLancs=[];
}

window.addEventListener('load',()=>{
  initTheme();updateSbObra();fillSelects();renderDash();
  // Set default dates
  const hoje=new Date().toISOString().split('T')[0];
  const ini=new Date();ini.setDate(1);
  if(document.getElementById('pt-data'))document.getElementById('pt-data').value=hoje;
  if(document.getElementById('fol-de'))document.getElementById('fol-de').value=ini.toISOString().split('T')[0];
  if(document.getElementById('fol-ate'))document.getElementById('fol-ate').value=hoje;
  if(document.getElementById('rel-de'))document.getElementById('rel-de').value=ini.toISOString().split('T')[0];
  if(document.getElementById('rel-ate'))document.getElementById('rel-ate').value=hoje;
  if(document.getElementById('rdo-data'))document.getElementById('rdo-data').value=hoje;
});
