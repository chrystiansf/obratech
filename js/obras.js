// ═══════════════════════════════════════════
// OBRAS
// ═══════════════════════════════════════════
function renderObras(){
  const obras=DB.obras;
  document.getElementById('obras-empty').style.display=obras.length?'none':'block';
  document.getElementById('obras-grid').innerHTML=obras.map(o=>{
    const p=obraPct(o);const c=obraColor(o);
    const dep=DB.lancs.filter(l=>String(l.obraId)===String(o.id)&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
    const orcM2=o.m2&&o.orc?o.orc/o.m2:0;
    const realM2=o.m2&&dep?dep/o.m2:0;
    const acima=orcM2&&realM2>orcM2;
    const pbColor=c==='r'?'var(--red2)':c==='fin'||c==='g'?'var(--green2)':'var(--primary)';
    return`<div class="oc ${c}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px">
        <div class="oc-name" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.nome}</div>
        <div style="display:flex;gap:3px;align-items:center;flex-shrink:0">
          ${obraStatusBadge(o)}
          <button class="btn sm ico" onclick="event.stopPropagation();openModal('obra','${o.id}')" title="Editar">✏️</button>
          <button class="btn sm ico" onclick="event.stopPropagation();delObra('${o.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
      <div class="oc-loc">📍 ${o.local||'—'}</div>
      <div class="pl"><span style="font-size:10px;color:var(--txt3)">Avanço físico</span><span style="font-weight:700">${p}%</span></div>
      <div class="pw" style="margin-bottom:9px"><div class="pb" style="width:${p}%;background:${pbColor}"></div></div>
      <div class="oc-stats">
        <div class="oc-st"><div class="oc-stl">Orçamento Total</div><div class="oc-stv">${fmtR(o.orc||0)}</div></div>
        <div class="oc-st"><div class="oc-stl">Área</div><div class="oc-stv">${o.m2?o.m2+' m²':'—'}</div></div>
        <div class="oc-st" style="${orcM2?'border-bottom:2px solid var(--accent)':''}">
          <div class="oc-stl">📐 Orçado/m²</div>
          <div class="oc-stv" style="color:var(--accent)">${orcM2?fmtR(orcM2)+'/m²':'—'}</div>
        </div>
        <div class="oc-st" style="${realM2?(acima?'border-bottom:2px solid var(--red)':'border-bottom:2px solid var(--green)'):''}">
          <div class="oc-stl">📊 Realizado/m²</div>
          <div class="oc-stv" style="color:${realM2?(acima?'var(--red)':'var(--green)'):'var(--txt3)'}">${realM2?fmtR(realM2)+'/m²':'—'}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function renderMovsPanel(){
  const selObra=document.getElementById('mov-filtro-obra');
  if(selObra&&selObra.options.length<=1){
    DB.obras.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.nome;selObra.appendChild(opt);});
  }
  const oId=selObra?.value||'';
  const tipo=document.getElementById('mov-filtro-tipo')?.value||'';
  const mat=(document.getElementById('mov-filtro-mat')?.value||'').toLowerCase();
  let movs=DB.movs.slice();
  if(oId) movs=movs.filter(m=>String(m.obraId)===oId);
  if(tipo) movs=movs.filter(m=>m.tipo===tipo);
  if(mat) movs=movs.filter(m=>(DB.estoque.find(x=>x.id===m.estId)?.material||'').toLowerCase().includes(mat));
  movs.sort((a,b)=>b.data.localeCompare(a.data));
  const el=document.getElementById('mov-panel-tbl');if(!el)return;
  if(!movs.length){el.innerHTML='<div class="t-empty">Nenhuma movimentação encontrada para os filtros selecionados.</div>';return;}
  const totEnt=movs.filter(m=>m.tipo==='Entrada').reduce((a,m)=>a+Number(m.qtd),0);
  const totSai=movs.filter(m=>m.tipo==='Saida').reduce((a,m)=>a+Number(m.qtd),0);
  const cards=movs.map(m=>{
    const est=DB.estoque.find(x=>x.id===m.estId);
    const obra=DB.obras.find(x=>String(x.id)===String(m.obraId));
    const isEnt=m.tipo==='Entrada';
    return `<div class="mov-card" onclick="this.classList.toggle('open')" style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;cursor:pointer;transition:.2s;border-left:4px solid ${isEnt?'var(--green)':'var(--red)'}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;color:var(--txt)">${est?.material||'—'}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${fmtDt(m.data)} · ${obra?.nome||'—'}</div>
        </div>
        <span class="b ${isEnt?'bg':'br'}" style="font-size:10px;white-space:nowrap">${isEnt?'↑ Entrada':'↓ Saída'}</span>
        <div style="font-weight:700;font-size:14px;color:${isEnt?'var(--green)':'var(--red)'};white-space:nowrap;font-feature-settings:'tnum'">${isEnt?'+':'-'}${Number(m.qtd).toFixed(2)} ${est?.un||'un'}</div>
        <span style="font-size:11px;color:var(--txt3);transition:.2s" class="mov-arrow">▸</span>
      </div>
      <div class="mov-detail" style="max-height:0;overflow:hidden;transition:max-height .25s ease">
        <div style="padding-top:12px;border-top:1px solid var(--border);margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div><span style="color:var(--txt3)">NF / Ref.:</span> ${m.nf||'—'}</div>
          <div><span style="color:var(--txt3)">Unidade:</span> ${est?.un||'—'}</div>
          <div style="grid-column:span 2"><span style="color:var(--txt3)">Observação:</span> ${m.obs||'—'}</div>
          <div style="grid-column:span 2;text-align:right;padding-top:6px">
            <button class="btn sm" onclick="event.stopPropagation();delMov('${m.id}')" style="color:var(--red);font-size:11px">🗑️ Excluir</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML=`
  <style>.mov-card.open .mov-detail{max-height:200px!important}.mov-card.open .mov-arrow{transform:rotate(90deg)}.mov-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.08)}</style>
  <div class="g g3" style="margin-bottom:12px">
    <div class="kpi"><div class="kl">Total Movimentos</div><div class="kv">${movs.length}</div></div>
    <div class="kpi"><div class="kl">Total Entradas</div><div class="kv" style="color:var(--green)">+${totEnt.toFixed(2)} un</div></div>
    <div class="kpi"><div class="kl">Total Saídas</div><div class="kv" style="color:var(--red)">-${totSai.toFixed(2)} un</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">${cards}</div>`;
}
function delMov(id){if(!confirm('Excluir movimentação?'))return;const mov=DB.movs.find(m=>String(m.id)===String(id));DB.movs=DB.movs.filter(m=>String(m.id)!==String(id));if(mov&&typeof mov.id==='string'&&mov.id.includes('-'))supaDelete('movimentacoes',mov.id);save();renderMovsPanel();renderEstoqueSaldo();toast('🗑️','Movimentação excluída.');}

function delObra(id){
  if(!confirm('Excluir esta obra e todos os dados relacionados?'))return;
  if(typeof id==='string'&&id.includes('-')&&supa&&_empresaId){
    // Deletar registros filhos antes (FK constraints)
    (async()=>{
      const eq=t=>supa.from(t).delete().eq('empresa_id',_empresaId).eq('obra_id',id);
      await eq('pontos');
      await eq('rdos');
      await eq('lancamentos');
      await eq('etapas');
      await eq('movimentacoes');
      await eq('nao_conformidades');
      await eq('contratos');
      await supa.from('obras').delete().eq('empresa_id',_empresaId).eq('id',id);
    })();
  }
  // Limpar DB local
  DB.obras=DB.obras.filter(o=>String(o.id)!==String(id));
  ['etapas','rdos','lancs','estoque','movs','ncs','contratos'].forEach(k=>{
    if(k==='lancs') DB.lancs=DB.lancs.filter(l=>String(l.obraId)!==String(id));
    else if(k==='etapas') DB.etapas=DB.etapas.filter(e=>String(e.obraId)!==String(id));
    else if(k==='rdos') DB.rdos=DB.rdos.filter(r=>String(r.obraId)!==String(id));
    else if(k==='movs') DB.movs=DB.movs.filter(m=>String(m.obraId)!==String(id));
    else if(k==='ncs') DB.ncs=DB.ncs.filter(n=>String(n.obraId)!==String(id));
    else if(k==='contratos') DB.contratos=DB.contratos.filter(c=>String(c.obraId)!==String(id));
  });['etapas','rdos','lancs','estoque','movs','ncs'].forEach(k=>{DB[k]=DB[k].filter(x=>x.obraId!==id);});DB.pontos=DB.pontos.filter(p=>p.obraId!==id);if(DB.sel===id)DB.sel=null;save();renderObras();toast('🗑️','Obra excluída.');}
