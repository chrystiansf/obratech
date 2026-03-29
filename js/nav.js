// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
const TITLES={empresa:'Empresa',dashboard:'Dashboard',obras:'Obras',cronograma:'Cronograma',rdo:'RDO Diário',equipe:'Equipe / Folha',estoque:'Estoque',financeiro:'Financeiro',qualidade:'Qualidade',relatorios:'Relatórios',demandas:'Demandas',fornecedores:'Fornecedores',contratos:'Contratos',orcamento:'Orçamento'};
const NEW_ACTIONS={obras:()=>openMocModal(),cronograma:()=>openModal('etapa'),rdo:null,equipe:()=>{const tercsEl=document.getElementById('t-tercs');if(tercsEl&&tercsEl.style.display!=='none'){openModal('terceirizado')}else{openModal('colab')}},estoque:()=>{estSwTab('catalogo');openModal('material');},financeiro:()=>openModal('lanc'),qualidade:()=>openModal('nc'),contratos:()=>openModal('contrato')};

function goPage(id){
  // Bloquear se usuário não tem permissão para este módulo
  if(window._permsAtivas&&!window._permsAtivas.includes(id)){
    toast("⚠️","Sem acesso a este módulo.");
    return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
  document.querySelectorAll('.mni').forEach(n=>n.classList.remove('on'));
  document.getElementById('p-'+id)?.classList.add('on');
  document.querySelector(`[data-p="${id}"]`)?.classList.add('on');
  document.querySelector(`.mni[data-p="${id}"]`)?.classList.add('on');
  document.getElementById('ptitle').textContent=TITLES[id]||id;
  updateSbObra();fillSelects();
  const _renderFns={dashboard:renderDash,obras:renderObras,cronograma:renderCron,rdo:renderRDO,equipe:renderEquipe,estoque:renderEstoque,financeiro:renderFin,qualidade:renderQual,contratos:renderContratos,relatorios:()=>{},demandas:renderDemandas,fornecedores:renderFornecedores,empresa:renderClientes,orcamento:renderOrcamento};
  _renderFns[id]?.();
  window._paginaAtual=id;
}

// Re-renderiza a página atualmente visível (chamada após carregamento de dados)
function renderPaginaAtual(){
  const id=window._paginaAtual||'dashboard';
  fillSelects();
  const fns={dashboard:renderDash,obras:renderObras,cronograma:renderCron,rdo:renderRDO,
    equipe:renderEquipe,estoque:renderEstoque,financeiro:renderFin,qualidade:renderQual,
    contratos:renderContratos,demandas:renderDemandas,fornecedores:renderFornecedores,empresa:renderClientes,orcamento:renderOrcamento};
  fns[id]?.();
}
function mainNew(){const p=document.querySelector('.ni.on')?.dataset.p;NEW_ACTIONS[p]?.();}

function getObra(){return DB.obras.find(o=>String(o.id)===String(DB.sel))||DB.obras[0]||null;}
function obraPct(o){const et=DB.etapas.filter(e=>String(e.obraId)===String(o.id));return et.length?Math.round(et.reduce((a,e)=>a+Number(e.pct),0)/et.length):0;}
function obraStatus(o){
  const p=obraPct(o);
  if(p>=100) return 'concluida';                         // etapas 100% → automático
  if(o.statusManual==='finalizada') return 'concluida';  // marcado manualmente
  if(o.statusManual==='nao_iniciada') return 'nao_iniciada';
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  if(o.dataFim){const fim=new Date(o.dataFim);fim.setHours(0,0,0,0);if(hoje>fim)return 'atrasada';}
  if(o.dataIni){const ini=new Date(o.dataIni);ini.setHours(0,0,0,0);if(hoje>=ini)return 'andamento';}
  if(p>0||DB.lancs.some(l=>l.obraId===o.id)) return 'andamento';
  return 'nao_iniciada';
}
function obraColor(o){
  const s=obraStatus(o);
  if(s==='concluida') return 'fin';
  if(s==='atrasada')  return 'r';
  if(s==='andamento') return 'g';
  return 'n';
}
function obraLabel(o){
  const s=obraStatus(o);
  if(s==='concluida') return 'Finalizada';
  if(s==='atrasada')  return 'Atrasada';
  if(s==='andamento') return 'Em andamento';
  return 'Não iniciada';
}
function obraStatusBadge(o){
  const s=obraStatus(o);
  if(s==='concluida') return '<span class="status-badge sb-fin">✅ Finalizada</span>';
  if(s==='atrasada')  return '<span class="status-badge sb-atr">🔴 Atrasada</span>';
  if(s==='andamento') return '<span class="status-badge sb-and">▶ Em andamento</span>';
  return '<span class="status-badge sb-ni">○ Não iniciada</span>';
}

function updateSbObra(){
  const el=document.getElementById('sb-obra-txt');
  const tag=document.getElementById('obra-tag');
  if(_obrasFiltro===null||(DB.obras.length>0&&_obrasFiltro.length===DB.obras.length)){
    el.innerHTML='<span style="color:var(--txt3);font-weight:400">Todas as obras</span>';
    tag.textContent='';
  } else if(_obrasFiltro&&_obrasFiltro.length===1){
    const o=DB.obras.find(x=>x.id===_obrasFiltro[0]);
    if(o){const cor=obraColor(o);el.innerHTML=`${o.nome} <span class="dot dot-${cor==='fin'?'g':cor}"></span>`;tag.textContent=o.nome;}
    else{el.innerHTML='— Nenhuma —';tag.textContent='';}
  } else if(_obrasFiltro&&_obrasFiltro.length===0){
    el.innerHTML='<span style="color:var(--txt3)">Nenhuma selecionada</span>';
    tag.textContent='Nenhuma';
  } else {
    el.innerHTML=`<span style="color:var(--primary);font-weight:600">${_obrasFiltro?.length||0} obras</span>`;
    tag.textContent=(_obrasFiltro?.length||0)+' obras';
  }
  if(DB.user.nome){
    const avEl=document.getElementById('user-av');
    if(avEl){
      if(DB.user.foto) avEl.innerHTML=`<img src="${DB.user.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      else avEl.textContent=DB.user.ini||DB.user.nome?.charAt(0)||'?';
    }
    document.getElementById('user-name').textContent=DB.user.nome;
    document.getElementById('user-role').textContent=DB.user.cargo||'';
  }
}

function fillSelects(){
  const obs=DB.obras;
  ['rdo-obra','pt-obra','fol-obra','rel-obra','rel-obra-export','m2-obra-sel'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const hasAll=id!=='rdo-obra'&&id!=='pt-obra';
    const curr=el.value;
    el.innerHTML=(hasAll?'<option value="">Todas as obras</option>':'')+obs.map(o=>`<option value="${o.id}">${o.nome}</option>`).join('');
    el.value=curr;
  });
  const ptcolab=document.getElementById('pt-colab');
  if(ptcolab){const cv=ptcolab.value;ptcolab.innerHTML=DB.colabs.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');ptcolab.value=cv;}
  const ptf=document.getElementById('pt-filter');
  if(ptf){const cv=ptf.value;ptf.innerHTML='<option value="">Todos</option>'+DB.colabs.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');ptf.value=cv;}
  const rdoObra=document.getElementById('rdo-obra');
  if(rdoObra&&getObra())rdoObra.value=getObra().id;
}
