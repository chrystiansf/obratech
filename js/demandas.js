// DEMANDAS
// ═══════════════════════════════════════════════════════════════
function renderDemandas(){
  // Popular filtro de obras
  const of=document.getElementById('dem-obra-filter');
  if(of){
    const cv=of.value;
    of.innerHTML='<option value="">Todas as obras</option>'+DB.obras.map(o=>`<option value="${o.id}"${cv===String(o.id)?' selected':''}>${o.nome}</option>`).join('');
  }
  const obraF=document.getElementById('dem-obra-filter')?.value||'';
  const statusF=document.getElementById('dem-status-filter')?.value||'';
  const priorF=document.getElementById('dem-prior-filter')?.value||'';

  let demandas=DB.demandas||[];
  if(obraF) demandas=demandas.filter(d=>String(d.obraId)===String(obraF));
  if(statusF) demandas=demandas.filter(d=>d.status===statusF);
  if(priorF) demandas=demandas.filter(d=>d.prioridade===priorF);

  // KPIs
  const total=DB.demandas?.length||0;
  const pendentes=(DB.demandas||[]).filter(d=>d.status==='pendente').length;
  const andamento=(DB.demandas||[]).filter(d=>d.status==='andamento').length;
  const concluidas=(DB.demandas||[]).filter(d=>d.status==='concluida').length;
  document.getElementById('dem-kpis').innerHTML=`
    <div class="kpi"><div class="kl">📋 Total</div><div class="kv">${total}</div><div class="kd neu">demandas</div></div>
    <div class="kpi"><div class="kl">⏳ Pendentes</div><div class="kv" style="color:var(--yellow)">${pendentes}</div><div class="kd ${pendentes?'dn':'neu'}">aguardando</div></div>
    <div class="kpi"><div class="kl">🔄 Em andamento</div><div class="kv" style="color:var(--primary)">${andamento}</div><div class="kd neu">em execução</div></div>
    <div class="kpi"><div class="kl">✅ Concluídas</div><div class="kv" style="color:var(--green)">${concluidas}</div><div class="kd up">finalizadas</div></div>`;

  const el=document.getElementById('dem-tbl');
  if(!demandas.length){
    el.innerHTML='<div class="t-empty">Nenhuma demanda encontrada. <button class="btn pri sm" onclick="openModal(\'demanda\')" style="margin-left:8px">＋ Criar demanda</button></div>';
    return;
  }

  const PRIOR_COR={alta:'br',media:'by',baixa:'bn'};
  const PRIOR_LABEL={alta:'Alta',media:'Média',baixa:'Baixa'};
  const STATUS_COR={pendente:'by',andamento:'bb',concluida:'bg'};
  const STATUS_LABEL={pendente:'Pendente',andamento:'Em andamento',concluida:'Concluída'};

  const demCards=demandas.sort((a,b)=>{
    const po={alta:0,media:1,baixa:2};
    return (po[a.prioridade]||1)-(po[b.prioridade]||1);
  }).map(d=>{
    const obra=DB.obras.find(o=>String(o.id)===String(d.obraId));
    const venc=d.prazo&&new Date(d.prazo)<new Date()&&d.status!=='concluida';
    const prCor={alta:'var(--red)',media:'var(--yellow)',baixa:'var(--green)'};
    return`<div class="dem-card" onclick="this.classList.toggle('open')" style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;cursor:pointer;transition:.2s;border-left:4px solid ${prCor[d.prioridade]||'var(--border)'};opacity:${d.status==='concluida'?'.65':'1'}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div style="font-weight:600;font-size:13px;color:var(--txt)">${d.numero?'#'+d.numero+' — ':''}${d.titulo}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:3px">${obra?.nome||'Sem obra'}${d.responsavel?' · '+d.responsavel:''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <span class="b ${PRIOR_COR[d.prioridade]||'bn'}" style="font-size:10px">${PRIOR_LABEL[d.prioridade]||'—'}</span>
          <select class="sel" style="height:28px;font-size:10px;padding:0 6px;width:auto;min-height:28px;border-radius:6px" onclick="event.stopPropagation()" onchange="event.stopPropagation();demMudarStatus('${d.id}',this.value)">
            <option value="pendente"${d.status==='pendente'?' selected':''}>⏳ Pendente</option>
            <option value="andamento"${d.status==='andamento'?' selected':''}>🔄 Em andamento</option>
            <option value="concluida"${d.status==='concluida'?' selected':''}>✅ Concluída</option>
          </select>
          ${venc?'<span style="color:var(--red);font-size:11px;font-weight:600">⚠ Vencida</span>':''}
          <span style="font-size:11px;color:var(--txt3);transition:.2s" class="dem-arrow">▸</span>
        </div>
      </div>
      <div class="dem-detail" style="max-height:0;overflow:hidden;transition:max-height .3s ease">
        <div style="padding-top:12px;border-top:1px solid var(--border);margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          ${d.desc?`<div style="grid-column:span 2"><span style="color:var(--txt3)">Descrição:</span> ${d.desc}</div>`:''}
          <div><span style="color:var(--txt3)">Categoria:</span> ${d.categoria||'—'}</div>
          <div><span style="color:var(--txt3)">Prazo:</span> <span style="color:${venc?'var(--red)':'inherit'}">${d.prazo?fmtDt(d.prazo):'—'}</span></div>
          ${d.obs?`<div style="grid-column:span 2"><span style="color:var(--txt3)">Obs:</span> ${d.obs}</div>`:''}
          <div style="grid-column:span 2;text-align:right;padding-top:6px;display:flex;gap:6px;justify-content:flex-end">
            <button class="btn sm pri" onclick="event.stopPropagation();openModal('demanda','${d.id}')" style="font-size:11px">✏️ Editar</button>
            <button class="btn sm" onclick="event.stopPropagation();delDemanda('${d.id}')" style="color:var(--red);font-size:11px">🗑️ Excluir</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML=`<style>.dem-card.open .dem-detail{max-height:300px!important}.dem-card.open .dem-arrow{transform:rotate(90deg)}.dem-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.08)}</style>
  <div style="display:flex;flex-direction:column;gap:8px">${demCards}</div>`;
}

function demMudarStatus(id,status){
  const d=DB.demandas.find(x=>String(x.id)===String(id));
  if(!d) return;
  d.status=status;
  supaUpdate('demandas',d.id,{status});
  renderDemandas();
  toast('✅','Status atualizado!');
}

function delDemanda(id){
  if(!confirm('Excluir demanda?')) return;
  const d=DB.demandas.find(x=>String(x.id)===String(id));
  if(d&&typeof d.id==='string'&&d.id.includes('-')) supaDelete('demandas',d.id);
  DB.demandas=DB.demandas.filter(x=>String(x.id)!==String(id));
  save();renderDemandas();toast('🗑️','Demanda excluída.');
}

