// FINANCEIRO
// ═══════════════════════════════════════════
// ── Financeiro: alternância de abas ─────────────────────────────────────
function swFinTab(tab){
  const isLanc=tab==='lanc';
  document.getElementById('fin-panel-lanc').style.display=isLanc?'block':'none';
  document.getElementById('fin-panel-cad').style.display=isLanc?'none':'block';
  document.getElementById('fintab-lanc').className='btn'+(isLanc?' pri':'');
  document.getElementById('fintab-cad').className='btn'+(isLanc?'':' pri');
  if(!isLanc)renderCadastros();
}

// ── Renderiza listas de cadastros ────────────────────────────────────────
function renderCadastros(){
  const PAD_DEFAULT=7; // primeiras 7 categorias são padrão, não deletáveis
  const renderList=(arrKey,elId,icon,padroes)=>{
    const el=document.getElementById(elId);if(!el)return;
    const arr=DB[arrKey];
    el.innerHTML=arr.length
      ? arr.map((x,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px">${icon}</span>
          <span style="flex:1;font-size:12px;color:var(--txt)">${x}</span>
          <button class="btn sm ico" onclick="cadastroEdit('${arrKey}',${i})" title="Editar"><svg class=ot-i><use href=#i-pencil></use></svg></button>
          <button class="btn sm ico" onclick="cadastroDel('${arrKey}',${i})" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
        </div>`).join('')
      : `<div class="t-empty" style="padding:16px 0">Nenhum cadastrado ainda.</div>`;
  };
  renderList('centros',   'cad-centros-list',    '<svg class=ot-i><use href=#i-tag></use></svg>', 0);
  renderList('categorias','cad-categorias-list', '<svg class=ot-i><use href=#i-folder-open></use></svg>', 7);
  // Fornecedores gerenciados na aba Fornecedores — não renderizar aqui
}

function cadastroAdd(tipo){
  document.getElementById(`cad-${tipo}s-form`).style.display='block';
  document.getElementById(`cad-${tipo}s-inp`).focus();
}
function cadastroCancel(tipo){
  document.getElementById(`cad-${tipo}s-form`).style.display='none';
  document.getElementById(`cad-${tipo}s-inp`).value='';
}
function cadastroSave(tipo){
  const inp=document.getElementById(`cad-${tipo}s-inp`);
  const v=inp.value.trim();if(!v){inp.focus();return;}
  const key=tipo==='centro'?'centros':tipo==='categoria'?'categorias':'fornecedores';
  if(DB[key].includes(v)){toast('⚠️',`"${v}" já existe!`);return;}
  DB[key].push(v);
  save();
  // Sync com Supabase
  const tabela=tipo==='centro'?'centros_custo':'categorias';
  supaInsert(tabela,{id:uuidv4(),nome:v});
  renderCadastros();
  document.getElementById(`cad-${tipo}s-form`).style.display='none';
  inp.value='';
  toast('✅',`"${v}" adicionado!`);
}
function cadastroEdit(arrKey,idx){
  const antigo=DB[arrKey][idx];
  const novo=prompt('Renomear "'+antigo+'" para:',antigo);
  if(!novo||!novo.trim()||novo.trim()===antigo)return;
  const novoNome=novo.trim();
  if(DB[arrKey].includes(novoNome)){toast('⚠️','"'+novoNome+'" já existe!');return;}
  DB[arrKey][idx]=novoNome;
  // Atualizar lançamentos que usam o nome antigo
  if(arrKey==='categorias'){
    DB.lancs.forEach(l=>{if(l.cat===antigo)l.cat=novoNome;});
    DB.contratos.forEach(c=>{if(c.cat===antigo)c.cat=novoNome;});
    // Atualizar no Supabase
    if(supa&&_empresaId){
      supa.from('lancamentos').update({categoria:novoNome}).eq('empresa_id',_empresaId).eq('categoria',antigo).then(()=>{});
      supa.from('contratos').update({categoria:novoNome}).eq('empresa_id',_empresaId).eq('categoria',antigo).then(()=>{});
      supa.from('categorias').update({nome:novoNome}).eq('empresa_id',_empresaId).eq('nome',antigo).then(()=>{});
    }
  } else if(arrKey==='centros'){
    DB.lancs.forEach(l=>{if(l.cc===antigo)l.cc=novoNome;});
    if(supa&&_empresaId){
      supa.from('lancamentos').update({centro_custo:novoNome}).eq('empresa_id',_empresaId).eq('centro_custo',antigo).then(()=>{});
      supa.from('centros_custo').update({nome:novoNome}).eq('empresa_id',_empresaId).eq('nome',antigo).then(()=>{});
    }
  }
  save();renderCadastros();renderFin();
  toast('✅','"'+antigo+'" renomeado para "'+novoNome+'"');
}
function cadastroDel(arrKey,idx){
  if(!confirm(`Excluir "${DB[arrKey][idx]}"?`))return;
  const nome=DB[arrKey][idx];
  DB[arrKey].splice(idx,1);save();renderCadastros();
  // Deletar no Supabase
  if(supa&&_empresaId){
    const tabela=arrKey==='categorias'?'categorias':'centros_custo';
    supa.from(tabela).delete().eq('empresa_id',_empresaId).eq('nome',nome).then(()=>{});
  }
  toast('🗑️','Excluído.');
}
// Adiciona inline direto do modal de lançamento
function cadastroAddInline(tipo,selId){
  const labels={centro:'Centro de Custo',categoria:'Categoria',fornecedor:'Fornecedor'};
  const v=prompt(`Novo ${labels[tipo]}:`);if(!v?.trim())return;
  const val=v.trim();
  const key=tipo==='centro'?'centros':tipo==='categoria'?'categorias':'fornecedores';
  if(DB[key].includes(val)){toast('⚠️','Já existe!');return;}
  DB[key].push(val);save();
  // Salvar no Supabase
  const tabela=tipo==='centro'?'centros_custo':tipo==='categoria'?'categorias':'fornecedores_cadastro';
  const dados=tipo==='fornecedor'?{id:uuidv4(),nome:val}:{id:uuidv4(),nome:val};
  supaInsert(tabela,dados);
  const sel=document.getElementById(selId);
  if(sel){const o=document.createElement('option');o.value=val;o.textContent=val;o.selected=true;sel.appendChild(o);}
  toast('✅',`"${val}" adicionado!`);
}

// ── Tabela de lançamentos ────────────────────────────────────────────────
// ── FILTROS DE COLUNA ─────────────────────────────────────────────────────
// Estado: null = tudo selecionado; Set de valores = filtrado
const _finFiltros={
  obra: null,       // Set de obraId (int)
  tipo: null,       // Set de strings: 'Receita'|'Despesa'
  cat: null,        // Set de strings
  cc: null,         // Set de strings
  forn: null,       // Set de strings
  dataIni: '',
  dataFim: '',
};
let _finDropAberto=null; // id do drop aberto

// id da caixa de seleção de cada opção (o mesmo na criação e na busca; aceita qualquer texto e ids UUID)
function _finChkId(campo,v){return 'cf-chk-'+campo+'-'+Array.from(String(v)).map(c=>/[a-zA-Z0-9_-]/.test(c)?c:'_'+c.codePointAt(0)+'_').join('');}
const _alfa=(a,b)=>String(a).localeCompare(String(b),'pt-BR',{sensitivity:'base',numeric:true});

function _finOpcoes(campo){
  // Retorna valores únicos existentes nos lançamentos para o campo
  const vals=new Set();
  DB.lancs.forEach(l=>{
    if(campo==='obra'){if(l.obraId){const o=DB.obras.find(x=>String(x.id)===String(l.obraId));vals.add(JSON.stringify({id:String(l.obraId),nome:o?.nome||'Sem obra'}));}}
    else if(campo==='tipo')vals.add(l.tipo||'—');
    else if(campo==='cat')vals.add(l.cat||'—');
    else if(campo==='cc')vals.add(l.cc||'—');
    else if(campo==='forn')vals.add(l.forn||'—');
  });
  if(campo==='obra') return [...vals].map(v=>JSON.parse(v)).sort((a,b)=>_alfa(a.nome,b.nome));
  return [...vals].sort(_alfa);
}

function _finToggleDrop(campo,e){
  e.stopPropagation();
  const dropId='cf-drop-'+campo;
  const drop=document.getElementById(dropId);
  if(!drop)return;
  if(_finDropAberto&&_finDropAberto!==dropId){
    const prev=document.getElementById(_finDropAberto);
    if(prev)prev.classList.remove('open');
  }
  drop.classList.toggle('open');
  _finDropAberto=drop.classList.contains('open')?dropId:null;
  if(drop.classList.contains('open')){
    // Inicializar pendente com cópia do filtro atual
    if(!window._finPendente) window._finPendente={};
    const isObra2=campo==='obra';
    const f=_finFiltros[campo];
    const opcoes2=_finOpcoes(campo);
    const todos2=isObra2?opcoes2.map(o=>String(o.id)):opcoes2;
    window._finPendente[campo]=f===null?new Set(todos2):new Set(f);
    const inp=drop.querySelector('input[type=text]');
    if(inp){inp.value='';_finFilterSearch(campo,'');}
    inp?.focus();
    // Keydown Enter no dropdown aplica filtro
    drop._enterHandler&&drop.removeEventListener('keydown',drop._enterHandler);
    drop._enterHandler=function(ev){if(ev.key==='Enter'){ev.stopPropagation();_finAplicarFiltro(campo,isObra2);const d=document.getElementById('cf-drop-'+campo);if(d)d.classList.remove('open');_finDropAberto=null;}};
    drop.addEventListener('keydown',drop._enterHandler);
  } else {
    // Cancelado sem aplicar — descartar pendente
    if(window._finPendente) delete window._finPendente[campo];
  }
}
document.addEventListener('click',()=>{
  if(_finDropAberto){
    const d=document.getElementById(_finDropAberto);
    if(d)d.classList.remove('open');
    // Descartar pendente ao fechar sem aplicar
    const campo2=_finDropAberto.replace('cf-drop-','');
    if(window._finPendente) delete window._finPendente[campo2];
    _finDropAberto=null;
  }
});

function _finFilterSearch(campo,q){
  const items=document.querySelectorAll(`#cf-drop-${campo} .cf-item:not(.all)`);
  items.forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q.toLowerCase())?'flex':'none');
}

function _finCheckItem(campo,val,isObra){
  // Trabalha no estado PENDENTE — não aplica ainda
  if(!window._finPendente) window._finPendente={};
  if(window._finPendente[campo]===undefined){
    // Inicializar pendente como cópia do atual
    const f=_finFiltros[campo];
    const opcoes=_finOpcoes(campo);
    const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
    window._finPendente[campo]=f===null?new Set(todos):new Set(f);
  }
  const pend=window._finPendente[campo];
  const key=isObra?String(val):val;
  if(pend.has(key)){pend.delete(key);}
  else{pend.add(key);}
  // Atualizar checkbox visualmente
  const chk=document.getElementById(_finChkId(campo,key));
  if(chk)chk.checked=pend.has(key);
  // Atualizar "Selecionar Tudo"
  const opcoes=_finOpcoes(campo);
  const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
  const allChk=document.getElementById('cf-all-'+campo);
  if(allChk)allChk.checked=pend.size===todos.length;
}

function _finCheckAll(campo,isObra){
  if(!window._finPendente) window._finPendente={};
  const opcoes=_finOpcoes(campo);
  const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
  // Estado pendente atual ou derivado do filtro real
  const pend=window._finPendente[campo];
  const f=_finFiltros[campo];
  const atualSize=pend?pend.size:(f===null?todos.length:f.size);
  if(atualSize===todos.length){
    // Desmarcar tudo
    window._finPendente[campo]=new Set();
  } else {
    // Marcar tudo
    window._finPendente[campo]=new Set(todos);
  }
  _finAtualizarChkDropPendente(campo,isObra);
}

function _finAtualizarChkDrop(campo,isObra){
  const filtro=_finFiltros[campo];
  const opcoes=_finOpcoes(campo);
  const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
  const allChk=document.getElementById(`cf-all-${campo}`);
  if(allChk)allChk.checked=(filtro===null||filtro.size===todos.length);
  todos.forEach(v=>{
    const chk=document.getElementById(_finChkId(campo,v));
    if(chk)chk.checked=filtro===null||filtro.has(v);
  });
}
function _finAtualizarChkDropPendente(campo,isObra){
  if(!window._finPendente) return;
  const pend=window._finPendente[campo];if(!pend)return;
  const opcoes=_finOpcoes(campo);
  const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
  const allChk=document.getElementById('cf-all-'+campo);
  if(allChk)allChk.checked=pend.size===todos.length;
  todos.forEach(v=>{
    const chk=document.getElementById(_finChkId(campo,v));
    if(chk)chk.checked=pend.has(v);
  });
}
function _finAplicarFiltro(campo,isObra){
  // Aplica o estado pendente como filtro real e fecha
  if(window._finPendente&&window._finPendente[campo]!==undefined){
    const pend=window._finPendente[campo];
    const opcoes=_finOpcoes(campo);
    const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
    _finFiltros[campo]=pend.size===todos.length?null:pend;
    delete window._finPendente[campo];
  }
  renderFin();
}

function _finBuildDrop(campo){
  // Constrói o HTML do dropdown de filtro para um campo
  const isObra=campo==='obra';
  const opcoes=_finOpcoes(campo);
  const filtro=_finFiltros[campo];
  const todos=isObra?opcoes.map(o=>String(o.id)):opcoes;
  const allCheck=filtro===null||filtro.size===todos.length;

  const CORES_TIPO={Receita:'var(--green)',Despesa:'var(--red)'};
  const items=isObra
    ? opcoes.map(o=>{
        const checked=filtro===null||filtro.has(String(o.id));
        const c=obraColor(DB.obras.find(x=>String(x.id)===String(o.id))||{});
        const dotC=c==='g'?'var(--green)':c==='r'?'var(--red)':c==='fin'?'var(--green)':'var(--txt3)';
        return `<div class="cf-item" data-campo="${campo}" data-val="${o.id}" data-isobra="1" onclick="_finItemClick(this);event.stopPropagation()">
          <input type="checkbox" id="${_finChkId(campo,o.id)}" ${checked?'checked':''} onclick="_finItemClick(this.parentElement);event.stopPropagation()">
          <span class="cf-dot" style="background:${dotC}"></span>
          <span style="flex:1">${escHtml(o.nome)}</span>
        </div>`;
      }).join('')
    : opcoes.map(v=>{
        const checked=filtro===null||filtro.has(v);
        const dot=campo==='tipo'?`<span class="cf-dot" style="background:${CORES_TIPO[v]||'var(--txt3)'}"></span>`:'';
        return `<div class="cf-item" data-campo="${campo}" data-val="${v.replace(/"/g,'&quot;')}" data-isobra="0" onclick="_finItemClick(this);event.stopPropagation()">
          <input type="checkbox" id="${_finChkId(campo,v)}" ${checked?'checked':''} onclick="_finItemClick(this.parentElement);event.stopPropagation()">
          ${dot}<span style="flex:1">${escHtml(v)}</span>
        </div>`;
      }).join('');

  return `<div class="cf-drop" id="cf-drop-${campo}" onclick="event.stopPropagation()">
    <div class="cf-search"><input type="text" placeholder="Pesquisar..." oninput="_finFilterSearch('${campo}',this.value)"></div>
    <div class="cf-item all" onclick="_finCheckAll('${campo}',${isObra});event.stopPropagation()">
      <input type="checkbox" id="cf-all-${campo}" ${allCheck?'checked':''} onclick="_finCheckAll('${campo}',${isObra});event.stopPropagation()">
      <span>Selecionar Tudo</span>
    </div>
    ${items}
    <div class="cf-footer"><button onclick="event.stopPropagation();_finAplicarFiltro('${campo}',${isObra});(()=>{const d=document.getElementById('cf-drop-${campo}');if(d)d.classList.remove('open');_finDropAberto=null;})()"><svg class=ot-i><use href=#i-check></use></svg> Aplicar</button></div>
  </div>`;
}
function _finItemClick(el){
  const campo=el.dataset.campo;
  const val=el.dataset.val;
  const isObra=el.dataset.isobra==='1';
  _finCheckItem(campo,val,isObra);
}

function _finThBtn(campo,label){
  const filtro=_finFiltros[campo];
  const opcoes=_finOpcoes(campo);
  const todos=campo==='obra'?opcoes.map(o=>String(o.id)):opcoes;
  const ativo=filtro!==null&&filtro.size<todos.length;
  const cnt=ativo?(todos.length-filtro.size):0;
  return `<div class="cf-wrap" onclick="event.stopPropagation()">
    <button class="cf-btn ${ativo?'active':''}" onclick="_finToggleDrop('${campo}',event)">
      ${label}${ativo?` <span class="cf-cnt">${cnt}</span>`:''} <span class="cf-arr">▾</span>
    </button>
    ${_finBuildDrop(campo)}
  </div>`;
}

function finLimparFiltros(){
  Object.keys(_finFiltros).forEach(k=>_finFiltros[k]=k==='dataIni'||k==='dataFim'?'':null);
  ['fin-obra-rapido','fin-busca-desc','fin-busca-valor','fin-periodo','fin-data-ini','fin-data-fim'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  window._finBuscaValorInput='';
  renderFin();
}

// Período rápido (Hoje, 7/30 dias, este mês, mês passado, este ano)
function finPeriodo(v){
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const h=new Date();let ini='',fim='';
  if(v==='hoje'){ini=fim=iso(h);}
  else if(v==='7'||v==='30'){const d=new Date(h);d.setDate(d.getDate()-(Number(v)-1));ini=iso(d);fim=iso(h);}
  else if(v==='mes'){ini=iso(new Date(h.getFullYear(),h.getMonth(),1));fim=iso(new Date(h.getFullYear(),h.getMonth()+1,0));}
  else if(v==='mesant'){ini=iso(new Date(h.getFullYear(),h.getMonth()-1,1));fim=iso(new Date(h.getFullYear(),h.getMonth(),0));}
  else if(v==='ano'){ini=h.getFullYear()+'-01-01';fim=h.getFullYear()+'-12-31';}
  else if(v==='custom'){document.getElementById('fin-data-ini')?.focus();return;}
  _finFiltros.dataIni=ini;_finFiltros.dataFim=fim;
  const a=document.getElementById('fin-data-ini'),b=document.getElementById('fin-data-fim');
  if(a)a.value=ini;if(b)b.value=fim;
  renderFin();
}


// Regra única de filtro do financeiro (tela, PDF e Excel usam a mesma)
function _finPassa(l){
  const desc=(document.getElementById('fin-busca-desc')?.value||'').toLowerCase().trim();
  const val=(window._finBuscaValorInput||'').replace(/[^\d.,]/g,'').trim();
  if(desc&&!((l.desc||'')+' '+(l.forn||'')+' '+(l.nf||'')).toLowerCase().includes(desc)) return false;
  if(val){const vs=String(l.valor||0);const vf=fmtR(l.valor||0);if(!vs.includes(val)&&!vf.includes(val)&&!String(Number(l.valor).toFixed(2)).includes(val)) return false;}
  if(_finFiltros.obra!==null&&!_finFiltros.obra.has(String(l.obraId))) return false;
  if(_finFiltros.tipo!==null&&!_finFiltros.tipo.has(l.tipo||'—')) return false;
  if(_finFiltros.cat!==null&&!_finFiltros.cat.has(l.cat||'—')) return false;
  if(_finFiltros.cc!==null&&!_finFiltros.cc.has(l.cc||'—')) return false;
  if(_finFiltros.forn!==null&&!_finFiltros.forn.has(l.forn||'—')) return false;
  const d=_dataISO(l.data);
  if(_finFiltros.dataIni&&(!d||d<_finFiltros.dataIni)) return false;
  if(_finFiltros.dataFim&&(!d||d>_finFiltros.dataFim)) return false;
  return true;
}

// Filtro rápido de obra no financeiro
function finFiltrarObra(obraId){
  if(!obraId){
    _finFiltros.obra = null;
  } else {
    _finFiltros.obra = new Set([String(obraId)]);
  }
  renderFin();
}

function renderFin(){
  fillSelects();
  // Popular seletor rápido de obra
  const finObraRapido = document.getElementById('fin-obra-rapido');
  if(finObraRapido){
    const curVal = _finFiltros.obra&&_finFiltros.obra.size===1 ? [..._finFiltros.obra][0] : '';
    finObraRapido.innerHTML = '<option value="">Todas as obras</option>' +
      DB.obras.slice().sort((a,b)=>_alfa(a.nome,b.nome)).map(o=>`<option value="${o.id}"${curVal===String(o.id)?' selected':''}>${escHtml(o.nome)}</option>`).join('');
  }
  const isObra=true;
  const _finBuscaDesc=(document.getElementById('fin-busca-desc')?.value||'').toLowerCase().trim();
  const _finBuscaValor=(window._finBuscaValorInput||'').replace(/[^\d.,]/g,'').trim();
  const lans=DB.lancs.filter(_finPassa);
  const dep=lans.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
  // Orçamento das obras no filtro (ou todas)
  const _obrasOrc=_finFiltros.obra!==null?DB.obras.filter(o=>_finFiltros.obra.has(String(o.id))):DB.obras;
  const orc=_obrasOrc.reduce((a,o)=>a+Number(o.orc||0),0);
  const saldoOrc=orc-dep;
  const _fkAct=(v)=>_finFiltros.tipo!==null&&_finFiltros.tipo.size===1&&_finFiltros.tipo.has(v)?'outline:2px solid var(--primary);outline-offset:-2px;border-radius:10px':'';
  const _fkAll=_finFiltros.tipo===null?'outline:2px solid var(--primary);outline-offset:-2px;border-radius:10px':'';
  document.getElementById('fin-kpis').innerHTML=`
    <div class="kpi" onclick="finFiltroKpi('Despesa')" style="cursor:pointer;${_fkAct('Despesa')}"><div class="kl"><svg class=ot-i><use href=#i-receipt></use></svg> Despesas</div><div class="kv" style="color:var(--red)">${fmtR(dep)}</div><div class="kd dn">${lans.filter(l=>l.tipo==='Despesa').length} lançamentos</div></div>
    <div class="kpi"><div class="kl"><svg class=ot-i><use href=#i-clipboard-list></use></svg> Orçamento</div><div class="kv">${fmtR(orc)}</div><div class="kd neu">${orc>0?Math.round(dep/orc*100)+'% utilizado':'não informado'}</div></div>
    <div class="kpi"><div class="kl"><svg class=ot-i><use href=#i-scale></use></svg> Saldo Orçamentário</div><div class="kv" style="color:${saldoOrc>=0?'var(--green)':'var(--red)'}">${fmtR(saldoOrc)}</div><div class="kd ${saldoOrc>=0?'up':'dn'}">${saldoOrc>=0?'Dentro do orçado':'Acima do orçado'}</div></div>
    <div class="kpi" onclick="finFiltroKpi('')" style="cursor:pointer;${_fkAll}"><div class="kl"><svg class=ot-i><use href=#i-chart-column></use></svg> Total</div><div class="kv">${lans.length}</div><div class="kd neu">Lançamentos</div></div>`;
  // Chips de filtros ativos
  const temFiltro=Object.entries(_finFiltros).some(([k,v])=>k==='dataIni'||k==='dataFim'?v!=='':v!==null)||!!_finBuscaDesc||!!_finBuscaValor;
  const limparBtn=document.getElementById('fin-limpar-btn');
  if(limparBtn)limparBtn.style.display=temFiltro?'inline-flex':'none';
  const chipsEl=document.getElementById('fin-chips');
  if(chipsEl){
    const chips=[];
    if(_finFiltros.dataIni||_finFiltros.dataFim)chips.push(`<span class="fin-fchip"><svg class=ot-i><use href=#i-calendar></use></svg> ${_finFiltros.dataIni?fmtDt(_finFiltros.dataIni):'início'} → ${_finFiltros.dataFim?fmtDt(_finFiltros.dataFim):'fim'}<button onclick="_finFiltros.dataIni='';_finFiltros.dataFim='';['fin-periodo','fin-data-ini','fin-data-fim'].forEach(i=>{const e=document.getElementById(i);if(e)e.value=''});renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    if(_finFiltros.obra!==null)chips.push(`<span class="fin-fchip"><svg class=ot-i><use href=#i-hard-hat></use></svg> ${_finFiltros.obra.size} obra(s)<button onclick="_finFiltros.obra=null;renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    if(_finFiltros.tipo!==null)chips.push(`<span class="fin-fchip">${[..._finFiltros.tipo].join(' + ')}<button onclick="_finFiltros.tipo=null;renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    if(_finFiltros.cat!==null)chips.push(`<span class="fin-fchip"><svg class=ot-i><use href=#i-folder-open></use></svg> ${_finFiltros.cat.size} categ.<button onclick="_finFiltros.cat=null;renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    if(_finFiltros.cc!==null)chips.push(`<span class="fin-fchip"><svg class=ot-i><use href=#i-tag></use></svg> ${_finFiltros.cc.size} CC<button onclick="_finFiltros.cc=null;renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    if(_finFiltros.forn!==null)chips.push(`<span class="fin-fchip"><svg class=ot-i><use href=#i-building-2></use></svg> ${_finFiltros.forn.size} forn.<button onclick="_finFiltros.forn=null;renderFin()"><svg class=ot-i><use href=#i-x></use></svg></button></span>`);
    chipsEl.innerHTML=chips.join('');
  }

  const el=document.getElementById('lanc-tbl');
  {
    el.innerHTML=`<table class="tbl tbl-filter-hdr">
      <tr>
        <th>DATA</th>
        <th>DESCRIÇÃO</th>
        <th>${_finThBtn('obra','OBRA')}</th>
        <th>${_finThBtn('tipo','TIPO')}</th>
        <th>${_finThBtn('cat','CATEGORIA')}</th>
        <th>${_finThBtn('cc','C. CUSTO')}</th>
        <th>${_finThBtn('forn','FORNECEDOR')}</th>
        <th style="text-align:right">VALOR</th>
        <th></th>
      </tr>`
      +(lans.length?'':'<tr><td colspan="9" class="t-empty">Nenhum lançamento com os filtros atuais. <button class="btn sm" onclick="finLimparFiltros()" style="margin-left:8px"><svg class=ot-i><use href=#i-x></use></svg> Limpar filtros</button></td></tr>')
      +lans.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).map(l=>{
        const o=DB.obras.find(x=>x.id==l.obraId);
        const neg=l.tipo==='Despesa';
        return`<tr>
          <td>${fmtDt(l.data)}</td>
          <td class="n">${l.desc}</td>
          <td>${o?.nome||'—'}</td>
          <td><span class="b ${neg?'br':'bg'}">${l.tipo}</span></td>
          <td>${l.cat||'—'}</td>
          <td>${l.cc?`<span class="b bn">${l.cc}</span>`:'—'}</td>
          <td style="font-size:11px;color:var(--txt2)">${l.forn||'—'}</td>
          <td style="text-align:right;font-weight:600;color:${neg?'var(--red)':'var(--green)'}">${neg?'−':'+'}${fmtR(Number(l.valor))}</td>
          <td><div class="ta-actions">
            <button class="btn sm ico" onclick="openModal('lanc','${String(l.id).replace(/'/g,"\\'")}')"><svg class=ot-i><use href=#i-pencil></use></svg></button>
            <button class="btn sm ico" onclick="delLanc('${String(l.id).replace(/'/g,"\\'")}')"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
          </div></td>
        </tr>`;
      }).join('')+'</table>';
  // Mobile: garantir scroll horizontal e vertical na tabela
  const wrap=document.getElementById('fin-tbl-wrap');
  if(wrap){wrap.style.overflowX='auto';wrap.style.webkitOverflowScrolling='touch';}
  }
  // Categorias com lançamentos, ordenadas do maior para o menor
  const catSet=new Set([...(DB.categorias||[]),...lans.map(l=>l.cat).filter(Boolean)]);
  const catVals=[...catSet].map(ct=>{const v=lans.filter(l=>l.cat===ct&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);return{nome:ct,valor:v};}).filter(c=>c.valor>0).sort((a,b)=>b.valor-a.valor);
  document.getElementById('fin-resumo').innerHTML='<div class="ct" style="margin-bottom:9px">Por Categoria</div>'
    +catVals.map(c=>`<div style="margin-bottom:7px"><div class="pl"><span style="font-size:11px">${c.nome}</span><span style="font-size:11px;font-weight:600">${fmtR(c.valor)}</span></div><div class="pw"><div class="pb" style="width:${dep?Math.round(c.valor/dep*100):0}%;background:var(--primary)"></div></div></div>`).join('');
  setTimeout(()=>{
    mkChart('ch-rv',{type:'doughnut',data:{labels:['Gasto','Saldo do orçamento'],datasets:[{data:[dep||0.01,Math.max(saldoOrc,0)||0.01],backgroundColor:[CP.redA,CP.grnA],borderColor:[CP.red,CP.grn],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:CP.t,font:{size:9}}}}}});
    const ms=meses6();
    mkChart('ch-fin-mensal',{type:'bar',data:{labels:ms.map(m=>m.l),datasets:[{label:'Despesas',data:ms.map(m=>lans.filter(l=>l.tipo==='Despesa'&&dataLocal(l.data)?.getMonth()===m.m&&dataLocal(l.data)?.getFullYear()===m.y).reduce((a,l)=>a+Number(l.valor),0)),backgroundColor:CP.redA,borderColor:CP.red,borderWidth:2,borderRadius:3}]},options:BO});
  },50);
}
function finFiltroKpi(tipo){
  if(!tipo){_finFiltros.tipo=null;}
  else if(_finFiltros.tipo!==null&&_finFiltros.tipo.size===1&&_finFiltros.tipo.has(tipo)){_finFiltros.tipo=null;}
  else{_finFiltros.tipo=new Set([tipo]);}
  renderFin();
}
function delLanc(id){
  if(!confirm('Excluir lançamento?'))return;
  const idStr=String(id);
  const idx=DB.lancs.findIndex(l=>String(l.id)===idStr);
  if(idx===-1){toast('⚠️','Lançamento não encontrado.');return;}
  const lanc=DB.lancs[idx];
  // Deletar no Supabase se for UUID
  try{if(lanc&&typeof lanc.id==='string'&&lanc.id.includes('-'))supaDelete('lancamentos',lanc.id);}catch(e){}
  DB.lancs.splice(idx,1);
  save();renderFin();toast('🗑️','Lançamento excluído.');
}
