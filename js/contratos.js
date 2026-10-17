// CONTRATOS
// ═══════════════════════════════════════════
function contStatus(ct){
  const total=Number(ct.valor)||0;
  const pago=_contPago(ct.id);
  if(pago>=total&&total>0) return 'quitado';
  const hoje=hojeISO();
  if(ct.prazo&&String(ct.prazo).slice(0,10)<hoje&&pago<total) return 'atrasado';
  return 'ativo';
}
function _contPago(ctId){
  return DB.pgtos.filter(p=>String(p.contratoId)===String(ctId)).reduce((a,p)=>a+Number(p.valor||0),0);
}
// Filtros da tela de contratos (busca, status, obra) — a tela e o PDF usam a mesma regra
function _contFiltrados(){
  const q=(document.getElementById('cont-search')?.value||'').toLowerCase().trim();
  const sf=document.getElementById('cont-status-filter')?.value||'';
  const of=document.getElementById('cont-obra-filter')?.value||'';
  return (DB.contratos||[]).filter(c=>{
    if(q&&![c.numero,c.descricao,c.forn].some(v=>String(v||'').toLowerCase().includes(q)))return false;
    if(sf&&contStatus(c)!==sf)return false;
    if(of&&String(c.obraId)!==String(of))return false;
    return true;
  });
}
function contStatusBadge(ct){
  const s=contStatus(ct);
  return s==='quitado'?'<span class="b bg"><svg class=ot-i><use href=#i-check></use></svg> Quitado</span>':s==='atrasado'?'<span class="b br"><svg class=ot-i><use href=#i-triangle-alert></use></svg> Atrasado</span>':'<span class="b bn">Em andamento</span>';
}

function renderContratos(){
  // KPIs
  const cts=DB.contratos;
  const totalValor=cts.reduce((a,c)=>a+Number(c.valor||0),0);
  const totalPago=cts.reduce((a,c)=>a+_contPago(c.id),0);
  const devedor=totalValor-totalPago;
  const atrasados=cts.filter(c=>contStatus(c)==='atrasado').length;
  const _ckF=document.getElementById('cont-status-filter')?.value||'';
  const _ckAct=(v)=>_ckF===v?'outline:2px solid var(--primary);outline-offset:-2px;border-radius:10px':'';
  document.getElementById('cont-kpis').innerHTML=`
    <div class="kpi" onclick="contFiltroKpi('')" style="cursor:pointer;${_ckAct('')}"><div class="kl"><svg class=ot-i><use href=#i-file-pen-line></use></svg> Contratos</div><div class="kv">${cts.length}</div><div class="kd neu">cadastrados</div></div>
    <div class="kpi" onclick="contFiltroKpi('quitado')" style="cursor:pointer;${_ckAct('quitado')}"><div class="kl"><svg class=ot-i><use href=#i-circle-check></use></svg> Total Pago</div><div class="kv" style="color:var(--green);font-size:15px">${fmtR(totalPago)}</div><div class="kd up">${totalValor?Math.round(totalPago/totalValor*100):0}% quitado</div></div>
    <div class="kpi" onclick="contFiltroKpi('atrasado')" style="cursor:pointer;${_ckAct('atrasado')}"><div class="kl"><svg class=ot-i><use href=#i-triangle-alert></use></svg> Atrasados</div><div class="kv" style="color:${atrasados?'var(--red)':'var(--green)'};font-size:15px">${atrasados}</div><div class="kd ${atrasados?'dn':'neu'}">${atrasados?'com atraso':'Tudo OK'}</div></div>
    <div class="kpi" onclick="contFiltroKpi('ativo')" style="cursor:pointer;${_ckAct('ativo')}"><div class="kl"><svg class=ot-i><use href=#i-hourglass></use></svg> Em andamento</div><div class="kv" style="color:var(--primary);font-size:15px">${cts.filter(c=>contStatus(c)==='ativo').length}</div><div class="kd neu">contratos</div></div>`;

  // Filtros
  const q=(document.getElementById('cont-search')?.value||'').toLowerCase();
  const sf=document.getElementById('cont-status-filter')?.value||'';
  // Popular filtro de obras
  const ctObraFilter=document.getElementById('cont-obra-filter');
  otPreencherObras(ctObraFilter);
  const filtrados=_contFiltrados();

  const el=document.getElementById('cont-tbl');
  if(!filtrados.length){
    el.innerHTML='<div class="t-empty">Nenhum contrato'+( cts.length?' com esses filtros.':'. <button class="btn pri sm" onclick="openModal(&apos;contrato&apos;)" style="margin-left:8px">＋ Cadastrar</button>')+'</div>';
  } else {
    el.innerHTML=`<div style="overflow-x:auto"><table class="tbl">
      <tr><th>Nº</th><th>Descrição</th><th>Fornecedor</th><th>Obra</th><th>Assinatura</th><th>Prazo</th><th style="text-align:right">Valor</th><th style="text-align:right">Pago</th><th style="text-align:right">Saldo Dev.</th><th style="text-align:center">Status</th><th></th></tr>`
      +filtrados.map(ct=>{
        const pago=_contPago(ct.id);
        const dev=Number(ct.valor||0)-pago;
        const pct=ct.valor?Math.round(pago/Number(ct.valor)*100):0;
        return`<tr>
          <td style="font-weight:600;color:var(--primary)">${ct.numero||'—'}</td>
          <td class="n">${ct.descricao||'—'}</td>
          <td style="font-size:11px;color:var(--txt2)">${ct.forn||'—'}</td>
          <td style="font-size:11px;color:var(--txt3)">${DB.obras.find(o=>String(o.id)===String(ct.obraId))?.nome||'—'}</td>
          <td style="font-size:11px">${ct.assinatura?fmtDt(ct.assinatura):'—'}</td>
          <td style="font-size:11px;color:${ct.prazo&&ct.prazo<hojeISO()&&pago<Number(ct.valor||0)?'var(--red)':'var(--txt)'}">${ct.prazo?fmtDt(ct.prazo):'—'}</td>
          <td style="text-align:right;font-weight:600">${fmtR(Number(ct.valor||0))}</td>
          <td style="text-align:right;color:var(--green);font-weight:600">${fmtR(pago)}</td>
          <td style="text-align:right;color:${dev>0?'var(--red)':'var(--green)'};font-weight:600">${fmtR(dev)}</td>
          <td style="text-align:center">${contStatusBadge(ct)}</td>
          <td><div class="ta-actions">
            <button class="btn sm" onclick="openModal('medicao',null,'${ct.id}')" title="Nova medição"><svg class=ot-i><use href=#i-ruler></use></svg> Medir</button>
            <button class="btn sm" onclick="openModal('pgto','${ct.id}')" title="Registrar pagamento"><svg class=ot-i><use href=#i-credit-card></use></svg> Pagar</button>
            <button class="btn sm ico" onclick="openModal('contrato','${ct.id}')"><svg class=ot-i><use href=#i-pencil></use></svg></button>
            <button class="btn sm ico" onclick="delContrato('${ct.id}')"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
          </div></td>
        </tr>
        <tr style="background:var(--bg2)"><td colspan="10" style="padding:4px 12px 8px">
          <div class="pw" style="margin-top:2px"><div class="pb" style="width:${Math.min(pct,100)}%;background:${pct>=100?'var(--green)':pct>=50?'var(--primary)':'var(--yellow)'}"></div></div>
          <span style="font-size:10px;color:var(--txt3)">${pct}% pago</span>
        </td></tr>`;
      }).join('')+'</table></div>';
  }

  // Tabela de pagamentos
  // Medições sempre atualizadas (antes não renderizava quando ainda não havia pagamentos)
  renderMedicoes();
  const pgtos=[...DB.pgtos].sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  const el2=document.getElementById('cont-pgtos-tbl');
  if(!pgtos.length){el2.innerHTML='<div class="t-empty">Nenhum pagamento registrado.</div>';return;}
  el2.innerHTML=`<table class="tbl">
    <tr><th>Data</th><th>Contrato</th><th>Fornecedor</th><th>Descrição</th><th>Obra</th><th>Categoria</th><th>C. Custo</th><th style="text-align:right">Valor</th><th></th></tr>`
    +pgtos.map(p=>{
      const ct=DB.contratos.find(x=>x.id===p.contratoId);
      const o=DB.obras.find(x=>x.id==p.obraId);
      return`<tr>
        <td>${fmtDt(p.data)}</td>
        <td style="font-weight:600;color:var(--primary)">${ct?.numero||'—'}</td>
        <td style="font-size:11px;color:var(--txt2)">${p.forn||ct?.forn||'—'}</td>
        <td class="n">${p.desc||ct?.descricao||'—'}</td>
        <td style="font-size:11px">${o?.nome||'—'}</td>
        <td>${p.cat||'—'}</td>
        <td>${p.cc?`<span class="b bn">${p.cc}</span>`:'—'}</td>
        <td style="text-align:right;font-weight:600;color:var(--red)">−${fmtR(Number(p.valor||0))}</td>
        <td><div class="ta-actions">
          <button class="btn sm ico" onclick="openModal('pgto-edit','${p.id}')"><svg class=ot-i><use href=#i-pencil></use></svg></button>
          <button class="btn sm ico" onclick="delPgto('${p.id}')"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
        </div></td>
      </tr>`;
    }).join('')+'</table>';
}

// ═══════════════════════════════════════════
// MEDIÇÕES DE CONTRATOS
// ═══════════════════════════════════════════
function renderMedicoes(){
  const obraFiltro=document.getElementById('med-obra-filter')?.value||'';
  const statusFiltro=document.getElementById('med-status-filter')?.value||'';

  // Popular filtro de obras
  const mObraFilter=document.getElementById('med-obra-filter');
  otPreencherObras(mObraFilter);

  if(!DB.medicoes) DB.medicoes=[];
  let meds=[...DB.medicoes];
  if(obraFiltro) meds=meds.filter(m=>String(m.obraId)===String(obraFiltro));
  if(statusFiltro) meds=meds.filter(m=>m.status===statusFiltro);
  meds.sort((a,b)=>(b.periodo||'').localeCompare(a.periodo||''));

  const el=document.getElementById('med-tbl');
  if(!el) return;
  if(!meds.length){
    el.innerHTML='<div class="t-empty">Nenhuma medição registrada. Clique em "＋ Nova Medição" para começar.</div>';
    return;
  }

  const statusBadge=s=>({
    pendente:'<span class="b by"><svg class=ot-i><use href=#i-hourglass></use></svg> Pendente</span>',
    aprovado:'<span class="b bg"><svg class=ot-i><use href=#i-check></use></svg> Aprovado</span>',
    reprovado:'<span class="b br"><svg class=ot-i><use href=#i-x></use></svg> Reprovado</span>'
  }[s]||'<span class="b bn">—</span>');

  el.innerHTML=`<table class="tbl">
    <tr><th>Nº</th><th>Contrato</th><th>Fornecedor</th><th>Obra</th><th>Período</th><th style="text-align:right">Valor Medido</th><th style="text-align:right">Acumulado</th><th>Status</th><th></th></tr>
    ${meds.map(m=>{
      const ct=DB.contratos.find(c=>c.id===m.contratoId);
      const o=DB.obras.find(x=>String(x.id)===String(m.obraId));
      const pctAcum=ct?.valor?Math.round(Number(m.valorAcumulado)/Number(ct.valor)*100):0;
      return`<tr style="cursor:pointer" onclick="previewBoletimPDF('${m.id}')">
        <td style="font-weight:600;color:var(--primary)">#${m.numero||'—'}</td>
        <td class="n">${ct?.numero?`<span style="font-size:10px;color:var(--txt3)">${ct.numero}</span> `:''}${ct?.descricao||'—'}</td>
        <td style="font-size:11px;color:var(--txt2)">${ct?.forn||'—'}</td>
        <td style="font-size:11px">${o?.nome||'—'}</td>
        <td style="font-size:11px">${m.periodo?fmtDt(m.periodo).substring(3):'—'}</td>
        <td style="text-align:right;font-weight:600">${fmtR(m.valorMedido)}</td>
        <td style="text-align:right">
          <span style="font-weight:600">${fmtR(m.valorAcumulado)}</span>
          ${ct?.valor?`<div style="font-size:9px;color:var(--txt3)">${pctAcum}% do contrato</div>`:''}
        </td>
        <td>${statusBadge(m.status)}</td>
        <td onclick="event.stopPropagation()"><div class="ta-actions">
          ${m.status==='pendente'?`<button class="btn sm" onclick="aprovarMedicao('${m.id}')" title="Aprovar"><svg class=ot-i><use href=#i-check></use></svg></button>`:''}
          ${m.status==='pendente'?`<button class="btn sm ico" onclick="reprovarMedicao('${m.id}')" title="Reprovar" style="color:var(--red)"><svg class=ot-i><use href=#i-x></use></svg></button>`:''}
          <button class="btn sm ico" onclick="openModal('medicao','${m.id}')" title="Editar"><svg class=ot-i><use href=#i-pencil></use></svg></button>
          <button class="btn sm ico" onclick="delMedicao('${m.id}')" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
          <button class="btn sm" onclick="gerarBoletimPDF('${m.id}')" title="Baixar PDF"><svg class=ot-i><use href=#i-download></use></svg></button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}

async function aprovarMedicao(id){
  const m=DB.medicoes.find(x=>x.id===id);
  if(!m||!confirm('Aprovar esta medição? Isso gerará um lançamento financeiro e um pagamento no contrato.'))return;
  m.status='aprovado';
  m.aprovadoPor=DB.user.nome;
  m.aprovadoEm=hojeISO();
  supaUpdate('medicoes',id,{status:'aprovado',aprovado_por:DB.user.nome,aprovado_em:m.aprovadoEm});

  const ct=DB.contratos.find(c=>c.id===m.contratoId);
  const descricao=`[BM-${String(m.numero||'1').padStart(3,'0')}] ${ct?.descricao||ct?.numero||'Medição'} — ${ct?.forn||''}`.trim();

  // 1. Lançamento financeiro (aparece na aba Financeiro)
  const lancId=uuidv4();
  const lanc={id:lancId,empresa_id:_empresaId,obraId:m.obraId,tipo:'Despesa',
    desc:descricao,cat:ct?.cat||'Serviços',cc:ct?.cc||'',
    valor:m.valorMedido,data:m.aprovadoEm,forn:ct?.forn||'',_supa:true,_medicaoId:id};
  DB.lancs.push(lanc);
  supaInsert('lancamentos',{id:lancId,empresa_id:_empresaId,tipo:'Despesa',
    descricao:lanc.desc,categoria:lanc.cat,centro_custo:lanc.cc,
    valor:lanc.valor,data:lanc.data,fornecedor:lanc.forn,obra_id:lanc.obraId||null})
    .then(()=>supaVincular('lancamentos',lancId,{medicao_id:id}));

  // 2. Pagamento do contrato (aparece na aba Contratos)
  const pgtoId=uuidv4();
  const pgto={id:pgtoId,contratoId:m.contratoId,obraId:m.obraId,
    data:m.aprovadoEm,valor:m.valorMedido,desc:descricao,
    forn:ct?.forn||'',cat:ct?.cat||'Serviços',cc:ct?.cc||'',
    medicaoId:id,_supa:true};
  lanc._pgtoId=pgtoId;
  DB.pgtos.push(pgto);
  supaInsert('pagamentos',{id:pgtoId,empresa_id:_empresaId,
    contrato_id:m.contratoId,obra_id:m.obraId,data:m.aprovadoEm,
    valor:m.valorMedido,descricao:descricao,fornecedor:ct?.forn||'',
    categoria:ct?.cat||'Serviços',centro_custo:ct?.cc||''})
    .then(()=>{supaVincular('pagamentos',pgtoId,{medicao_id:id});supaVincular('lancamentos',lancId,{pagamento_id:pgtoId,medicao_id:id});});

  save();

  // Re-renderizar tudo imediatamente
  renderContratos();
  renderMedicoes();
  if(document.getElementById('p-financeiro')?.classList.contains('on')) renderFin();

  toast('✅',`Medição #${m.numero} aprovada! Lançamento de ${fmtR(m.valorMedido)} adicionado.`);
}

function reprovarMedicao(id){
  const m=DB.medicoes.find(x=>x.id===id);
  if(!m||!confirm('Reprovar esta medição?'))return;
  m.status='reprovado';
  supaUpdate('medicoes',id,{status:'reprovado'});
  save();renderContratos();renderMedicoes();toast('⚠️','Medição reprovada.');
}

function medAddFotos(e){
  const files=[...e.target.files];
  if(!files.length)return;
  files.forEach(f=>{
    if(f.size>5*1024*1024){toast('⚠️','Foto muito grande. Max 5MB.');return;}
    const r=new FileReader();
    r.onload=ev=>{
      if(!window._medFotos)window._medFotos=[];
      window._medFotos.push({src:ev.target.result});
      const g=document.getElementById('med-foto-grid');
      if(g&&g._rf)g._rf();
    };
    r.readAsDataURL(f);
  });
}

function medModoChange(){
  const isPct=document.getElementById('med-modo-p')?.checked;
  const campoReal=document.getElementById('med-campo-real');
  const campoPct=document.getElementById('med-campo-pct');
  if(campoReal) campoReal.style.display=isPct?'none':'';
  if(campoPct) campoPct.style.display=isPct?'':'none';
  if(isPct) medPctToValor();
  else medCalcAcum();
}

function medPctToValor(){
  const pct=parseFloat(document.getElementById('med-pct')?.value)||0;
  const ctId=document.getElementById('med-ct')?.value;
  const ct=DB.contratos.find(c=>c.id===ctId);
  const ctValor=Number(ct?.valor||0);
  const valorCalc=ctValor*pct/100;
  // Atualizar campo de valor oculto
  const vEl=document.getElementById('med-valor');
  if(vEl) vEl.value=valorCalc.toFixed(2);
  // Preview
  const prev=document.getElementById('med-pct-preview');
  if(prev) prev.textContent=pct>0?'= '+fmtR(valorCalc)+(ctValor?' de '+fmtR(ctValor):''):'';
  medCalcAcum();
}

// Ao trocar o contrato na medição: obra do contrato e próximo número daquele contrato
function medContratoChange(){
  const ctId=document.getElementById('med-ct')?.value;
  const ct=DB.contratos.find(c=>c.id===ctId);
  const ob=document.getElementById('med-obra');
  if(ct&&ob&&ct.obraId) ob.value=ct.obraId;
  if(!window._medEditId){
    const n=document.getElementById('med-num');
    if(n) n.value=Math.max(0,...DB.medicoes.filter(m=>m.contratoId===ctId).map(m=>Number(m.numero||0)))+1;
  }
  if(document.getElementById('med-modo-p')?.checked) medPctToValor(); else medCalcAcum();
}

function medCalcAcum(){
  const ctId=document.getElementById('med-ct')?.value;
  const valor=parseFloat(document.getElementById('med-valor')?.value)||0;
  if(!ctId||!valor) return;
  // Somar medições aprovadas anteriores deste contrato
  const pago=DB.medicoes
    .filter(m=>m.contratoId===ctId&&m.status!=='reprovado'&&m.id!==window._medEditId)
    .reduce((a,m)=>a+Number(m.valorMedido||0),0);
  const acumEl=document.getElementById('med-acum');
  if(acumEl) acumEl.value=(pago+valor).toFixed(2);
}

function delMedicao(id){
  const m=DB.medicoes.find(x=>x.id===id); if(!m) return;
  // Pagamento/lançamento gerados na aprovação têm a descrição "[BM-001] ..." e o mesmo valor
  const pref='[BM-'+String(m.numero||'1').padStart(3,'0')+']';
  const mesmoValor=x=>Math.abs(Number(x.valor)-Number(m.valorMedido))<0.01;
  const pgs=m.status==='aprovado'?DB.pgtos.filter(p=>String(p.medicaoId)===String(id)||(!p.medicaoId&&String(p.contratoId)===String(m.contratoId)&&String(p.desc||'').startsWith(pref)&&mesmoValor(p))):[];
  const pgIds=new Set(pgs.map(p=>String(p.id)));
  const lcs=m.status==='aprovado'?DB.lancs.filter(l=>String(l._medicaoId)===String(id)||pgIds.has(String(l._pgtoId))||(!l._medicaoId&&String(l.desc||'').startsWith(pref)&&String(l.obraId)===String(m.obraId)&&mesmoValor(l))):[];
  const msg=m.status==='aprovado'
    ?'Esta medição já foi aprovada. Excluir também '+(pgs.length?'o pagamento ':'')+(pgs.length&&lcs.length?'e ':'')+(lcs.length?'o lançamento financeiro ':'')+'gerados na aprovação?'
    :'Excluir medição?';
  if(!confirm(msg))return;
  pgs.forEach(p=>{if(typeof p.id==='string'&&p.id.includes('-'))supaDelete('pagamentos',p.id);});
  lcs.forEach(l=>{if(typeof l.id==='string'&&l.id.includes('-'))supaDelete('lancamentos',l.id);});
  DB.pgtos=DB.pgtos.filter(p=>!pgs.includes(p)); DB.lancs=DB.lancs.filter(l=>!lcs.includes(l));
  supaDelete('medicoes',id);
  DB.medicoes=DB.medicoes.filter(m=>m.id!==id);
  save();renderContratos();renderMedicoes();toast('🗑️','Medição excluída.');
}

function previewBoletimPDF(medicaoId){
  // Preview HTML instantâneo (sem gerar PDF)
  const m=DB.medicoes.find(x=>x.id===medicaoId);
  if(!m){toast('⚠️','Medição não encontrada.');return;}
  const ct=DB.contratos.find(c=>c.id===m.contratoId);
  const o=DB.obras.find(x=>String(x.id)===String(m.obraId));
  const pctAcum=ct?.valor?Math.round(Number(m.valorAcumulado)/Number(ct.valor)*100):0;
  const pctEsta=ct?.valor?Math.round(Number(m.valorMedido)/Number(ct.valor)*100):0;
  const saldo=Math.max(0,Number(ct?.valor||0)-Number(m.valorAcumulado||0));
  const periodoStr=m.periodo?fmtDt(m.periodo).substring(3):'—';

  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:95vw;max-height:95vh;padding:0;width:800px;display:flex;flex-direction:column">
      <div class="moh" style="flex-shrink:0"><div class="mot"><svg class=ot-i><use href=#i-file-text></use></svg> Boletim de Medição Nº ${String(m.numero||'1').padStart(3,'0')}</div><div class="mox" onclick="closeModal()"><svg class=ot-i><use href=#i-x></use></svg></div></div>
      <div class="mob" style="flex:1;overflow-y:auto;background:#f7f8fc">
        <div style="background:#fff;padding:24px;border-radius:8px;color:#1a2040;font-family:var(--ot-font-sans)">
          <h3 style="margin:0 0 14px 0;font-size:16px;border-bottom:2px solid ${_empresaCor||'#0A193C'};padding-bottom:8px">Dados do Contrato</h3>
          <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:18px">
            <thead><tr style="background:${_empresaCor||'#0A193C'};color:#fff"><th style="padding:8px;text-align:center">Contrato</th><th style="padding:8px;text-align:center">Fornecedor</th><th style="padding:8px;text-align:center">Valor do Contrato</th><th style="padding:8px;text-align:center">Período</th></tr></thead>
            <tbody><tr style="border:1px solid #ddd"><td style="padding:7px;text-align:center;font-weight:600">${ct?.numero||'—'}</td><td style="padding:7px;text-align:center;font-weight:600">${ct?.forn||'—'}</td><td style="padding:7px;text-align:center;font-weight:600">${fmtR(Number(ct?.valor||0))}</td><td style="padding:7px;text-align:center;font-weight:600">${periodoStr}</td></tr></tbody>
          </table>

          <h3 style="margin:0 0 14px 0;font-size:16px;border-bottom:2px solid ${_empresaCor||'#0A193C'};padding-bottom:8px">Resumo Financeiro da Medição</h3>
          <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:18px">
            <thead><tr style="background:${_empresaCor||'#0A193C'};color:#fff"><th style="padding:8px;text-align:left">Descrição</th><th style="padding:8px;text-align:right">Valor (R$)</th><th style="padding:8px;text-align:center">%</th></tr></thead>
            <tbody>
              <tr style="border:1px solid #ddd"><td style="padding:7px">Valor do contrato</td><td style="padding:7px;text-align:right">${fmtR(Number(ct?.valor||0))}</td><td style="padding:7px;text-align:center">100%</td></tr>
              <tr style="border:1px solid #ddd;background:#f7f8fc"><td style="padding:7px">Medições anteriores</td><td style="padding:7px;text-align:right">${fmtR(Number(m.valorAcumulado||0)-Number(m.valorMedido||0))}</td><td style="padding:7px;text-align:center">${pctAcum-pctEsta}%</td></tr>
              <tr style="border:1px solid #ddd"><td style="padding:7px;font-weight:700">Esta medição (Nº ${String(m.numero||'1').padStart(2,'0')})</td><td style="padding:7px;text-align:right;font-weight:700">${fmtR(Number(m.valorMedido||0))}</td><td style="padding:7px;text-align:center;font-weight:700">${pctEsta}%</td></tr>
              <tr style="border:1px solid #ddd;background:#eef1f4"><td style="padding:7px;font-weight:700">Total acumulado</td><td style="padding:7px;text-align:right;font-weight:700">${fmtR(Number(m.valorAcumulado||0))}</td><td style="padding:7px;text-align:center;font-weight:700">${pctAcum}%</td></tr>
              <tr style="background:${_empresaCor||'#0A193C'};color:#fff"><td style="padding:7px;font-weight:700">Saldo remanescente</td><td style="padding:7px;text-align:right;font-weight:700">${fmtR(saldo)}</td><td style="padding:7px;text-align:center;font-weight:700">${100-pctAcum}%</td></tr>
            </tbody>
          </table>

          ${m.descricao?`<h3 style="margin:0 0 10px 0;font-size:16px;border-bottom:2px solid ${_empresaCor||'#0A193C'};padding-bottom:8px">Descrição da Medição</h3><div style="font-size:13px;line-height:1.5;white-space:pre-wrap;margin-bottom:18px">${m.descricao}</div>`:''}
          ${m.obs?`<h3 style="margin:0 0 10px 0;font-size:16px;border-bottom:2px solid ${_empresaCor||'#0A193C'};padding-bottom:8px">Observações</h3><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${m.obs}</div>`:''}
        </div>
      </div>
      <div class="mof" style="flex-shrink:0">
        <button class="btn" onclick="closeModal()">Fechar</button>
        <button class="btn pri" onclick="gerarBoletimPDF('${medicaoId}')"><svg class=ot-i><use href=#i-download></use></svg> Baixar PDF</button>
      </div>
    </div></div>`;
}

async function gerarBoletimPDF(medicaoId){
  const m=DB.medicoes.find(x=>x.id===medicaoId);
  if(!m){toast('⚠️','Medição não encontrada.');return;}
  // Fontes da marca e fotos recortadas (4:3) prontas antes de montar, como no RDO
  await _pdfCarregarFontes();
  const fotosSrc=(m.fotos||[]).map(f=>f&&(f.src||f.url||f.data)).filter(v=>v&&(/^data:/.test(v)||/^https?:/.test(v)));
  const fotosProntas=await Promise.all(fotosSrc.map(src=>_pdfRecorteCover(src,4/3,1050,0.85).catch(()=>null)));
  const doc=_buildBoletimPDF(medicaoId,fotosProntas.filter(Boolean));
  if(!doc) return;
  const ct=DB.contratos.find(c=>c.id===m.contratoId);
  const nome=String(ct?.numero||'Contrato').toUpperCase().replace(/[\\/:*?"<>|]+/g,' ').trim();
  doc.save('BM '+String(m.numero||'1').padStart(2,'0')+' '+nome+(m.periodo?' '+fmtDt(m.periodo).substring(3).replace('/','-'):'')+'.pdf');
  toast('📄','Boletim baixado!');
}

// Boletim de Medição no padrão visual do RDO (fontes da marca, cor da empresa, quadros de assinatura)
function _buildBoletimPDF(medicaoId,fotosProntas){
  const m=DB.medicoes.find(x=>x.id===medicaoId);
  if(!m){toast('⚠️','Medição não encontrada.');return null;}
  const ct=DB.contratos.find(c=>c.id===m.contratoId);
  const o=DB.obras.find(x=>String(x.id)===String(m.obraId));
  let doc;
  try{doc=new jsPDF();}catch(e){toast('⚠️','PDF não disponível.');return null;}
  _pdfUsarFontesMarcaSync(doc);
  const FS=doc.__fonte?'Manrope':'helvetica';
  const W=doc.internal.pageSize.getWidth();
  const M=14, CW=W-M*2;
  const COR=corEmpresa();
  const claro=f=>COR.map(c=>Math.round(255-(255-c)*f));
  const valorCt=Number(ct?.valor||0);
  const pctAcum=valorCt?Math.round(Number(m.valorAcumulado)/valorCt*100):0;
  const pctEsta=valorCt?Math.round(Number(m.valorMedido)/valorCt*100):0;
  const saldo=Math.max(0,valorCt-Number(m.valorAcumulado||0));
  const periodoStr=m.periodo?fmtDt(m.periodo).substring(3):'—';
  const num=String(m.numero||'1').padStart(2,'0');
  const TIT='Boletim de Medição Nº '+num;
  const SUB=(o?.nome||'—')+'  -  '+(ct?.forn||'—')+'  -  Período: '+periodoStr;
  let y=pHdr(doc,TIT,SUB)+2;
  const checkPage=need=>{if(y+need>275){doc.addPage();y=pHdr(doc,TIT,SUB)+6;}};
  const tab=(opts)=>{doc.autoTable({theme:'plain',styles:{font:FS},tableWidth:CW,margin:{left:M,right:M},headStyles:hStyle(),
    bodyStyles:{...bStyle(),lineColor:[235,237,240],lineWidth:0.15,cellPadding:{top:3,bottom:3,left:5,right:5}},...opts});y=doc.lastAutoTable.finalY+8;};

  // ── Dados do contrato
  y=pSec(doc,y,'Dados do Contrato');
  tab({startY:y,head:[['CONTRATO','FORNECEDOR','VALOR DO CONTRATO','PERÍODO']],
    body:[[ct?.numero||'—',ct?.forn||'—',fmtR(valorCt),periodoStr]],
    columnStyles:{0:{fontStyle:'bold'},1:{},2:{halign:'right'},3:{halign:'center',cellWidth:30}}});

  // ── Resumo financeiro
  checkPage(60);
  y=pSec(doc,y,'Resumo Financeiro da Medição');
  tab({startY:y,head:[['DESCRIÇÃO','VALOR (R$)','%']],
    body:[
      ['Valor do contrato',fmtR(valorCt),'100%'],
      ['Medições anteriores',fmtR(Number(m.valorAcumulado||0)-Number(m.valorMedido||0)),(pctAcum-pctEsta)+'%'],
      ['Esta medição (Nº '+num+')',fmtR(Number(m.valorMedido||0)),pctEsta+'%'],
      ['Total acumulado',fmtR(Number(m.valorAcumulado||0)),pctAcum+'%'],
      ['Saldo remanescente',fmtR(saldo),(100-pctAcum)+'%'],
    ],
    columnStyles:{0:{},1:{halign:'right',cellWidth:55},2:{halign:'center',cellWidth:28}},
    didParseCell(d){if(d.section!=='body')return;
      if(d.row.index===2) d.cell.styles.fontStyle='bold';
      if(d.row.index===3){d.cell.styles.fillColor=claro(0.10);d.cell.styles.fontStyle='bold';}
      if(d.row.index===4){d.cell.styles.fillColor=COR;d.cell.styles.textColor=[255,255,255];d.cell.styles.fontStyle='bold';}}});
  // Barra de avanço financeiro na cor da empresa
  y-=4;
  doc.setFillColor(...PX.silver);doc.roundedRect(M,y,CW,5,1.2,1.2,'F');
  if(pctAcum>0){doc.setFillColor(...COR);doc.roundedRect(M,y,CW*Math.min(pctAcum,100)/100,5,1.2,1.2,'F');}
  _pdfSans(doc,'bold');doc.setFontSize(6.5);
  const txt=pctAcum+'% medido';
  if(pctAcum>14){doc.setTextColor(255,255,255);doc.text(txt,M+3,y+3.6);}else{doc.setTextColor(...PX.gray);doc.text(txt,M+CW*Math.min(pctAcum,100)/100+3,y+3.6);}
  y+=12;

  // ── Serviços executados
  checkPage(30);
  y=pSec(doc,y,'Serviços Executados nesta Medição');
  const execTexto=m.exec&&m.exec.trim()?m.exec:'Não informado.';
  tab({startY:y,body:[[execTexto]],bodyStyles:{...bStyle(),cellPadding:{top:4,bottom:4,left:5,right:5},minCellHeight:12,textColor:m.exec?PX.ink:PX.lgray,fontStyle:m.exec?'normal':'italic'}});

  // ── Etapas da obra
  const etapas=DB.etapas.filter(e=>String(e.obraId)===String(m.obraId)&&Number(e.pct)>0);
  if(etapas.length){
    checkPage(20+etapas.length*7);
    y=pSec(doc,y,'Avanço das Etapas');
    tab({startY:y,head:[['ETAPA','%','SITUAÇÃO']],
      body:etapas.map(e=>[e.nome,(e.pct||0)+'%',Number(e.pct)>=100?'Concluída':'Em andamento']),
      columnStyles:{0:{fontStyle:'bold'},1:{halign:'center',cellWidth:24},2:{halign:'center',cellWidth:40}},
      didParseCell(d){if(d.section==='body'&&d.column.index===2&&d.cell.raw==='Concluída'){d.cell.styles.textColor=PX.green;d.cell.styles.fontStyle='bold';}
        if(d.section==='body'&&d.row.index%2===0)d.cell.styles.fillColor=[250,251,253];}});
  }

  // ── Observações
  if(m.obs&&m.obs.trim()){
    checkPage(30);
    y=pSec(doc,y,'Pendências e Observações');
    tab({startY:y,body:[[m.obs]]});
  }

  // ── Registro fotográfico (mesmo layout do RDO: 2 por linha, 4:3, etiqueta #01)
  const fotos=fotosProntas||[];
  if(fotos.length){
    const GAP=3.7, fw=(CW-GAP)/2, fh=fw*3/4, passo=fh+10;
    checkPage(14+fh);
    y=pSec(doc,y,'Registro Fotográfico ('+fotos.length+' foto'+(fotos.length>1?'s':'')+')');
    fotos.forEach((img,k)=>{
      const col=k%2;
      if(col===0&&k>0) y+=passo;
      if(col===0&&y+fh>275){doc.addPage();y=pHdr(doc,TIT,SUB)+8;}
      const x=M+col*(fw+GAP);
      try{doc.addImage(img,'JPEG',x,y,fw,fh,'','FAST');}catch(e){doc.setFillColor(240,241,244);doc.rect(x,y,fw,fh,'F');}
      doc.setDrawColor(...PX.silver);doc.setLineWidth(0.2);doc.rect(x,y,fw,fh,'S');
      const tag='#'+String(k+1).padStart(2,'0');
      doc.setFont(FS,'bold');doc.setFontSize(7.5);
      const tw=doc.getTextWidth(tag)+3.4, th=4.8;
      doc.setFillColor(...COR);doc.roundedRect(x+2.6,y+2.6,tw,th,0.9,0.9,'F');
      doc.setTextColor(255,255,255);doc.text(tag,x+2.6+tw/2,y+2.6+th/2,{align:'center',baseline:'middle'});
    });
    y+=fh+10;
    doc.setTextColor(...PX.ink);
  }

  // ── Atesto e assinaturas (quadros como no RDO)
  checkPage(44);
  y=pSec(doc,y,'Atesto e Assinaturas');
  const fiscal=o?.resp||'—';
  const usuarioCompleto=DB.user?.nome||'';
  // Nome completo do perfil (se o salvo na aprovação for uma versão curta do nome atual, usa o atual)
  let aprovador=m.aprovadoPor||usuarioCompleto||'—';
  if(usuarioCompleto&&aprovador&&usuarioCompleto.toLowerCase().startsWith(aprovador.toLowerCase())) aprovador=usuarioCompleto;
  const sigW=(CW-8)/3, sigH=32;
  const quadro=(bx,titulo,nome,rodape)=>{
    doc.setFillColor(250,251,253);doc.rect(bx,y,sigW,sigH,'F');
    doc.setDrawColor(...PX.silver);doc.setLineWidth(0.2);doc.rect(bx,y,sigW,sigH,'S');
    doc.setFillColor(...COR);doc.rect(bx,y,sigW,5.5,'F');
    doc.setFont(FS,'bold');doc.setFontSize(6.5);doc.setTextColor(255,255,255);doc.text(titulo,bx+4,y+4);
    doc.setFont(FS,'normal');doc.setFontSize(8);doc.setTextColor(...PX.ink);
    doc.text(doc.splitTextToSize(String(nome||'—').toUpperCase(),sigW-8).slice(0,2),bx+4,y+12);
    if(rodape){doc.setFont(FS,'bold');doc.setFontSize(6.5);doc.setTextColor(...PX.green);doc.text(rodape,bx+4,y+21);}
    doc.setDrawColor(...PX.silver);doc.setLineWidth(0.3);doc.line(bx+4,y+sigH-6,bx+sigW-4,y+sigH-6);
    doc.setFont(FS,'normal');doc.setFontSize(5.5);doc.setTextColor(...PX.lgray);doc.text('ASSINATURA',bx+sigW/2,y+sigH-2,{align:'center'});
  };
  quadro(M,'ELABORADO POR',ct?.forn||'—');
  quadro(M+sigW+4,'FISCALIZADO POR',fiscal);
  quadro(M+(sigW+4)*2,'APROVADO POR',aprovador,m.status==='aprovado'?'APROVADO'+(m.aprovadoEm?' EM '+fmtDt(m.aprovadoEm):''):'');
  y+=sigH+6;
  doc.setTextColor(...PX.ink);doc.setLineWidth(0.2);

  pFtr(doc);
  return doc;
}



function contFiltroKpi(status){
  const sel=document.getElementById('cont-status-filter');
  if(sel){sel.value=sel.value===status?'':status;}
  renderContratos();
}
function delContrato(id){
  if(!confirm('Excluir contrato? Os pagamentos, os lançamentos vinculados e as medições deste contrato também serão removidos.'))return;
  if(typeof id==='string'&&id.includes('-')) supaDelete('contratos',id);
  const pgIdsCt=new Set(DB.pgtos.filter(p=>String(p.contratoId)===String(id)).map(p=>String(p.id)));
  DB.lancs.filter(l=>pgIdsCt.has(String(l._pgtoId))).forEach(l=>{if(typeof l.id==='string'&&l.id.includes('-'))supaDelete('lancamentos',l.id);});
  DB.lancs=DB.lancs.filter(l=>!pgIdsCt.has(String(l._pgtoId)));
  DB.pgtos.filter(p=>String(p.contratoId)===String(id)).forEach(p=>{if(typeof p.id==='string'&&p.id.includes('-'))supaDelete('pagamentos',p.id);});
  DB.pgtos=DB.pgtos.filter(p=>String(p.contratoId)!==String(id));
  (DB.medicoes||[]).filter(m=>String(m.contratoId)===String(id)).forEach(m=>{if(typeof m.id==='string'&&m.id.includes('-'))supaDelete('medicoes',m.id);});
  DB.medicoes=(DB.medicoes||[]).filter(m=>String(m.contratoId)!==String(id));
  DB.contratos=DB.contratos.filter(c=>String(c.id)!==String(id));
  save();renderContratos();toast('🗑️','Contrato excluído.');
}
function delPgto(id){
  if(!confirm('Excluir pagamento? O lançamento financeiro vinculado também será removido.'))return;
  const pgto=DB.pgtos.find(p=>String(p.id)===String(id));
  // Excluir lançamento vinculado do Supabase
  const lancVinc=DB.lancs.find(l=>String(l._pgtoId)===String(id));
  if(lancVinc&&typeof lancVinc.id==='string'&&lancVinc.id.includes('-')) supaDelete('lancamentos',lancVinc.id);
  // Excluir pagamento do Supabase
  if(pgto&&typeof pgto.id==='string'&&pgto.id.includes('-')) supaDelete('pagamentos',pgto.id);
  DB.lancs=DB.lancs.filter(l=>String(l._pgtoId)!==String(id));
  DB.pgtos=DB.pgtos.filter(p=>String(p.id)!==String(id));
  save();renderContratos();toast('🗑️','Pagamento excluído.');
}
