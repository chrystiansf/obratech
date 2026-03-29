// ESTOQUE
// ═══════════════════════════════════════════
// ── ESTOQUE: estado do filtro de obras ──────────────────────────────────────
let _estObrasFiltro = null; // null = todas; Set de ids

function estSwTab(tab){
  ['catalogo','saldo','movs'].forEach(t=>{
    const panel=document.getElementById('est-panel-'+t);
    const tabEl=document.getElementById('est-tab-'+t);
    if(panel) panel.style.display=(t===tab)?'block':'none';
    if(tabEl) tabEl.className='est-tab'+(t===tab?' active':'');
  });
  if(tab==='catalogo') renderCatalogo();
  else if(tab==='saldo') renderEstoqueSaldo();
  else renderMovsPanel();
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL 1: CATÁLOGO GLOBAL
// ─────────────────────────────────────────────────────────────────────────────
function renderCatalogo(){
  const q = (document.getElementById('est-cat-search')?.value || '').toLowerCase();
  const items = DB.estoque.filter(e => !q || e.material.toLowerCase().includes(q));
  // KPIs
  const totalItens = DB.estoque.length;
  const totalMovs  = DB.movs.length;
  const fornSet    = new Set(DB.estoque.map(e=>e.forn).filter(Boolean));
  document.getElementById('est-kpis-cat').innerHTML = `
    <div class="kpi"><div class="kl">📦 Materiais</div><div class="kv">${totalItens}</div><div class="kd neu">no catálogo</div></div>
    <div class="kpi"><div class="kl">🔄 Movimentações</div><div class="kv">${totalMovs}</div><div class="kd neu">registradas</div></div>
    <div class="kpi"><div class="kl">🏢 Fornecedores</div><div class="kv">${fornSet.size}</div><div class="kd neu">diferentes</div></div>`;
  const el = document.getElementById('est-tbl');
  if (!items.length) {
    el.innerHTML = '<div class="t-empty">Nenhum material' + (q ? ' encontrado.' : '. ') + (!q ? '<button class="btn pri sm" onclick="openModal(&apos;material&apos;)" style="margin-left:8px">＋ Cadastrar</button>' : '') + '</div>';
    return;
  }
  // Para cada material mostra em quais obras tem saldo
  el.innerHTML = `<table class="tbl">
    <tr><th>Material</th><th>Un.</th><th>Qtd Inicial</th><th>Mín.</th><th>Preço Un.</th><th>Fornecedor</th><th>Obras com saldo</th><th></th></tr>` +
    items.map(e => {
      const obrasComSaldo = DB.obras.filter(o => {
        const s = DB.movs.filter(m=>m.estId===e.id&&m.obraId===o.id).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);
        return s > 0;
      });
      const badges = obrasComSaldo.map(o=>`<span class="est-catalog-badge" style="margin-right:3px">${o.nome}</span>`).join('');
      return `<tr>
        <td class="n">${e.material}</td>
        <td>${e.un}</td>
        <td style="font-weight:600">${e.qtd}</td>
        <td>${e.min}</td>
        <td>${fmtR(e.preco||0)}</td>
        <td style="font-size:11px;color:var(--txt2)">${e.forn||'—'}</td>
        <td style="font-size:11px">${badges||'<span style="color:var(--txt3)">Nenhuma</span>'}</td>
        <td><div class="ta-actions">
          <button class="btn sm" onclick="openModal('mov','${e.id}')" title="Movimentar este material">🔄 Lançar</button>
          <button class="btn sm ico" onclick="openModal('material','${e.id}')" title="Editar">✏️</button>
          <button class="btn sm ico" onclick="delMat('${e.id}')" title="Excluir">🗑️</button>
        </div></td>
      </tr>`;
    }).join('') + '</table>';
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL 2: DROPDOWN MULTI-OBRA
// ─────────────────────────────────────────────────────────────────────────────
function estToggleObrasDrop(e){
  e.stopPropagation();
  const dd = document.getElementById('est-obra-dropdown');
  dd.classList.toggle('open');
  if (dd.classList.contains('open')){
    document.getElementById('est-obra-search').value = '';
    estFiltrarDropObras('');
    estBuildObrasDrop();
    document.getElementById('est-obra-search').focus();
  }
}
document.addEventListener('click', e => {
  if (!document.getElementById('est-obra-filter')?.contains(e.target))
    document.getElementById('est-obra-dropdown')?.classList.remove('open');
});
function estFiltrarDropObras(q){
  document.querySelectorAll('#est-obra-items .d-filter-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function estBuildObrasDrop(){
  const obras = DB.obras;
  const el = document.getElementById('est-obra-items');
  if (!el) return;
  el.innerHTML =
    // Selecionar Tudo
    `<div class="d-filter-item all" onclick="estToggleTodasObras(event)">
      <input type="checkbox" id="est-chk-all" ${_estObrasFiltro===null?'checked':''} onclick="estToggleTodasObras(event)">
      <span>Selecionar Tudo</span>
    </div>` +
    obras.map(o => {
      const checked = _estObrasFiltro===null || _estObrasFiltro.has(o.id);
      const cor = obraColor(o);
      const dotC = cor==='g'?'var(--green)':cor==='r'?'var(--red)':cor==='fin'?'var(--green)':'var(--txt3)';
      return `<div class="d-filter-item" onclick="estToggleObra('${o.id}',event)">
        <input type="checkbox" id="est-chk-${o.id}" ${checked?'checked':''} onclick="estToggleObra('${o.id}',event)">
        <span class="d-filter-dot" style="background:${dotC}"></span>
        <span style="flex:1">${o.nome}</span>
      </div>`;
    }).join('');
  estAtualizarLblObras();
}
function estToggleObra(id, e){
  e.stopPropagation();
  if (_estObrasFiltro===null) _estObrasFiltro = new Set(DB.obras.map(o=>o.id));
  if (_estObrasFiltro.has(id)) _estObrasFiltro.delete(id);
  else _estObrasFiltro.add(id);
  if (_estObrasFiltro.size === DB.obras.length) _estObrasFiltro = null;
  const chk = document.getElementById('est-chk-'+id);
  if (chk) chk.checked = _estObrasFiltro===null || _estObrasFiltro.has(id);
  const all = document.getElementById('est-chk-all');
  if (all) all.checked = _estObrasFiltro===null;
  estAtualizarLblObras();
  renderEstoqueSaldo();
}
function estToggleTodasObras(e){
  e.stopPropagation();
  const all = document.getElementById('est-chk-all');
  if (_estObrasFiltro===null){ _estObrasFiltro = new Set(); if(all)all.checked=false; }
  else { _estObrasFiltro = null; if(all)all.checked=true; }
  estBuildObrasDrop();
  renderEstoqueSaldo();
}
function estAtualizarLblObras(){
  const lbl = document.getElementById('est-obra-lbl');
  const cnt = document.getElementById('est-obra-cnt');
  if (!lbl||!cnt) return;
  if (_estObrasFiltro===null||_estObrasFiltro.size===DB.obras.length){
    lbl.textContent='Todas as obras'; cnt.style.display='none';
  } else if (_estObrasFiltro.size===0){
    lbl.textContent='Nenhuma obra'; cnt.style.display='none';
  } else if (_estObrasFiltro.size===1){
    const id=[..._estObrasFiltro][0];
    lbl.textContent=DB.obras.find(o=>o.id===id)?.nome||'1 obra'; cnt.style.display='none';
  } else {
    lbl.textContent=_estObrasFiltro.size+' obras'; cnt.textContent=_estObrasFiltro.size; cnt.style.display='inline';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL 2: ESTOQUE POR OBRA (saldos calculados das movimentações)
// ─────────────────────────────────────────────────────────────────────────────
function _estSaldo(estId, obraId){
  return DB.movs.filter(m=>String(m.estId)===String(estId)&&String(m.obraId)===String(obraId)).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd), 0);
}
function _estObrasAtivas(){
  if (_estObrasFiltro===null) return DB.obras;
  return DB.obras.filter(o=>_estObrasFiltro.has(o.id));
}

function renderEstoqueSaldo(){
  estBuildObrasDrop();
  const q = (document.getElementById('est-saldo-search')?.value||'').toLowerCase();
  const obras = _estObrasAtivas();
  const itens = DB.estoque.filter(e=>!q||e.material.toLowerCase().includes(q));

  // KPIs globais do filtro atual
  let totalEntradas=0,totalSaidas=0,itensAbaixoMin=0;
  itens.forEach(e=>obras.forEach(o=>{
    const s=_estSaldo(e.id,o.id);
    if(s>0) totalEntradas+=s; if(s<0) totalSaidas+=Math.abs(s);
    if(s<=Number(e.min)&&s>0) itensAbaixoMin++;
  }));
  document.getElementById('est-kpis-saldo').innerHTML=`
    <div class="kpi"><div class="kl">🏗️ Obras</div><div class="kv">${obras.length}</div><div class="kd neu">selecionadas</div></div>
    <div class="kpi"><div class="kl">📦 Materiais</div><div class="kv">${itens.length}</div><div class="kd neu">no catálogo</div></div>
    <div class="kpi"><div class="kl">⚠️ Abaixo Mín.</div><div class="kv" style="color:${itensAbaixoMin?'var(--yellow)':'var(--green)'}">${itensAbaixoMin}</div><div class="kd ${itensAbaixoMin?'dn':'up'}">${itensAbaixoMin?'Repor':'OK'}</div></div>
    <div class="kpi"><div class="kl">🔄 Movimentações</div><div class="kv">${DB.movs.filter(m=>obras.some(o=>o.id===m.obraId)).length}</div><div class="kd neu">total</div></div>`;

  const el = document.getElementById('est-saldo-tbl');
  if (!itens.length || !obras.length){
    el.innerHTML='<div class="t-empty">Selecione ao menos uma obra e cadastre materiais.</div>';
    return;
  }

  // Colunas: Material | Un | Mín | [coluna por obra selecionada] | Total
  const th = obras.map(o=>`<th style="text-align:center">${o.nome}</th>`).join('');
  const rows = itens.map(e=>{
    const saldosPorObra = obras.map(o=>_estSaldo(e.id,o.id));
    const total = saldosPorObra.reduce((a,s)=>a+s,0);
    const baixo = saldosPorObra.some((s,i)=>s>0&&s<=Number(e.min));
    const tds = obras.map((o,i)=>{
      const s=saldosPorObra[i];
      const low=s>0&&s<=Number(e.min);
      return `<td style="text-align:center;font-weight:600;color:${s>0?(low?'var(--yellow)':'var(--green)'):s===0?'var(--txt3)':'var(--red)'}">${s>0?'+':''}${s}</td>`;
    }).join('');
    return `<tr>
      <td class="n">${e.material}</td>
      <td>${e.un}</td>
      <td>${e.min}</td>
      ${tds}
      <td style="text-align:center;font-weight:700;color:${total>0?'var(--txt)':'var(--red)'};border-left:1px solid var(--border2)">${total}</td>
      <td><button class="btn sm" onclick="openModal('mov','${e.id}')" title="Lançar movimentação">🔄 Lançar</button></td>
    </tr>`;
  }).join('');

  el.innerHTML=`<table class="tbl">
    <tr>
      <th>Material</th><th>Un.</th><th>Mín.</th>
      ${th}
      <th style="text-align:center;border-left:1px solid var(--border2)">Total</th>
      <th></th>
    </tr>${rows}</table>`;

  // Gráfico: top 8 materiais com maior saldo total
  setTimeout(()=>{
    const top = [...itens].map(e=>({e,total:_estObrasAtivas().reduce((a,o)=>a+_estSaldo(e.id,o.id),0)}))
      .sort((a,b)=>b.total-a.total).slice(0,8);
    mkChart('ch-estoque',{type:'bar',data:{
      labels:top.map(x=>x.e.material.substring(0,12)),
      datasets:[
        {label:'Saldo',data:top.map(x=>x.total),backgroundColor:top.map(x=>x.total<=Number(x.e.min)?CP.redA:CP.grnA),borderColor:top.map(x=>x.total<=Number(x.e.min)?CP.red:CP.grn),borderWidth:2,borderRadius:3},
        {label:'Mínimo',data:top.map(x=>Number(x.e.min)),type:'line',borderColor:CP.yel,borderWidth:1.5,pointRadius:3,backgroundColor:'transparent'}
      ]},options:BO});
  },50);

  // Movimentações recentes filtradas por obras selecionadas
  const movs = DB.movs.filter(m=>obras.some(o=>o.id===m.obraId)).sort((a,b)=>b.data.localeCompare(a.data)).slice(0,10);
  document.getElementById('est-movs').innerHTML = movs.length
    ? `<table class="tbl"><tr><th>Data</th><th>Material</th><th>Obra</th><th>Tipo</th><th>Qtd</th><th>NF</th><th></th></tr>`
      + movs.map(m=>{
          const e=DB.estoque.find(x=>x.id==m.estId);
          const o=DB.obras.find(x=>x.id===m.obraId);
          return`<tr>
            <td>${fmtDt(m.data)}</td>
            <td class="n">${e?.material||'—'}</td>
            <td style="font-size:11px;color:var(--txt2)">${o?.nome||'—'}</td>
            <td><span class="b ${m.tipo==='Entrada'?'bg':'br'}">${m.tipo}</span></td>
            <td style="font-weight:600;color:${m.tipo==='Entrada'?'var(--green)':'var(--red)'}">
              ${m.tipo==='Saída'?'−':'+'}${m.qtd} ${e?.un||''}
            </td>
            <td style="font-size:11px">${m.nf||'—'}</td>
            <td><div class="ta-actions">
              <button class="btn sm ico" onclick="editMov('${m.id}')">✏️</button>
              <button class="btn sm ico" onclick="delMov('${m.id}')">🗑️</button>
            </div></td>
          </tr>`;
        }).join('')+'</table>'
    : '<div class="t-empty">Nenhuma movimentação nas obras selecionadas.</div>';
}

// Ponto de entrada principal — abre sempre no catálogo
function renderEstoque(){
  fillSelects();
  const tab = document.getElementById('est-tab-catalogo');
  if (tab?.classList.contains('active')) renderCatalogo();
  else renderEstoqueSaldo();
}
function delMov(id){
  const m=DB.movs.find(x=>x.id===id);if(!m)return;
  if(!confirm(`Excluir ${m.tipo} de ${m.qtd} unidades? O estoque será revertido.`))return;
  const est=DB.estoque.find(x=>x.id===m.estId);
  if(est){est.qtd=m.tipo==='Entrada'?est.qtd-m.qtd:est.qtd+m.qtd;}
  DB.movs=DB.movs.filter(x=>x.id!==id);
  save();renderEstoque();toast('🗑️','Movimentação excluída e estoque revertido.');
}
function editMov(id){
  const m=DB.movs.find(x=>x.id===id);if(!m)return;
  const est=DB.estoque.find(x=>x.id===m.estId);if(!est)return;
  // Cria modal de edição inline
  const old=m.tipo,oldQtd=m.qtd;
  const nTipo=prompt(`Tipo (Entrada/Saída) [atual: ${m.tipo}]:`,m.tipo);
  if(!nTipo||!['Entrada','Saída'].includes(nTipo)){toast('⚠️','Tipo inválido. Use "Entrada" ou "Saída"');return;}
  const nQtd=parseFloat(prompt(`Nova quantidade [atual: ${m.qtd}]:`,m.qtd));
  if(!nQtd||nQtd<=0){toast('⚠️','Quantidade inválida!');return;}
  // Reverter movimentação antiga
  est.qtd=old==='Entrada'?est.qtd-oldQtd:est.qtd+oldQtd;
  // Aplicar nova
  if(nTipo==='Saída'&&nQtd>est.qtd){toast('⚠️',`Estoque insuficiente! Disponível: ${est.qtd}`);est.qtd=old==='Entrada'?est.qtd+oldQtd:est.qtd-oldQtd;return;}
  est.qtd=nTipo==='Entrada'?est.qtd+nQtd:est.qtd-nQtd;
  m.tipo=nTipo;m.qtd=nQtd;
  const nObs=prompt('Observação (opcional):',m.obs||'');
  m.obs=nObs||m.obs||'';
  save();renderEstoque();toast('✅','Movimentação atualizada!');
}
function delMat(id){if(!confirm('Excluir material?'))return;if(typeof id==='string'&&id.includes('-'))supaDelete('estoque',id);DB.estoque=DB.estoque.filter(e=>String(e.id)!==String(id));save();renderEstoque();toast('🗑️','Excluído.');}
