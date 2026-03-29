// CONTRATOS
// ═══════════════════════════════════════════
function contStatus(ct){
  const total=Number(ct.valor)||0;
  const pago=_contPago(ct.id);
  if(pago>=total&&total>0) return 'quitado';
  const hoje=new Date().toISOString().split('T')[0];
  if(ct.prazo&&ct.prazo<hoje&&pago<total) return 'atrasado';
  return 'ativo';
}
function _contPago(ctId){
  return DB.pgtos.filter(p=>String(p.contratoId)===String(ctId)).reduce((a,p)=>a+Number(p.valor||0),0);
}
function contStatusBadge(ct){
  const s=contStatus(ct);
  return s==='quitado'?'<span class="b bg">✓ Quitado</span>':s==='atrasado'?'<span class="b br">⚠ Atrasado</span>':'<span class="b bn">Em andamento</span>';
}

function renderContratos(){
  // KPIs
  const cts=DB.contratos;
  const totalValor=cts.reduce((a,c)=>a+Number(c.valor||0),0);
  const totalPago=cts.reduce((a,c)=>a+_contPago(c.id),0);
  const devedor=totalValor-totalPago;
  const atrasados=cts.filter(c=>contStatus(c)==='atrasado').length;
  document.getElementById('cont-kpis').innerHTML=`
    <div class="kpi"><div class="kl">📑 Contratos</div><div class="kv">${cts.length}</div><div class="kd neu">cadastrados</div></div>
    <div class="kpi"><div class="kl">💰 Valor Total</div><div class="kv" style="font-size:15px">${fmtR(totalValor)}</div><div class="kd neu">contratado</div></div>
    <div class="kpi"><div class="kl">✅ Total Pago</div><div class="kv" style="color:var(--green);font-size:15px">${fmtR(totalPago)}</div><div class="kd up">${totalValor?Math.round(totalPago/totalValor*100):0}% quitado</div></div>
    <div class="kpi"><div class="kl">⏳ Saldo Devedor</div><div class="kv" style="color:${devedor>0?'var(--red)':'var(--green)'};font-size:15px">${fmtR(devedor)}</div><div class="kd ${atrasados?'dn':'neu'}">${atrasados?atrasados+' atrasado(s)':'Tudo OK'}</div></div>`;

  // Filtros
  const q=(document.getElementById('cont-search')?.value||'').toLowerCase();
  const sf=document.getElementById('cont-status-filter')?.value||'';
  // Popular filtro de obras
  const ctObraFilter=document.getElementById('cont-obra-filter');
  if(ctObraFilter&&ctObraFilter.options.length<=1){
    DB.obras.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.nome;ctObraFilter.appendChild(opt);});
  }
  const obraFiltro=ctObraFilter?.value||'';
  const filtrados=cts.filter(c=>{
    if(q&&!c.numero?.toLowerCase().includes(q)&&!c.descricao?.toLowerCase().includes(q)&&!c.forn?.toLowerCase().includes(q))return false;
    if(sf&&contStatus(c)!==sf)return false;
    if(obraFiltro&&String(c.obraId)!==String(obraFiltro))return false;
    return true;
  });

  const el=document.getElementById('cont-tbl');
  if(!filtrados.length){
    el.innerHTML='<div class="t-empty">Nenhum contrato'+( cts.length?' com esses filtros.':'. <button class="btn pri sm" onclick="openModal(&apos;contrato&apos;)" style="margin-left:8px">＋ Cadastrar</button>')+'</div>';
  } else {
    el.innerHTML=`<table class="tbl">
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
          <td style="font-size:11px;color:${ct.prazo&&ct.prazo<new Date().toISOString().split('T')[0]&&pago<Number(ct.valor||0)?'var(--red)':'var(--txt)'}">${ct.prazo?fmtDt(ct.prazo):'—'}</td>
          <td style="text-align:right;font-weight:600">${fmtR(Number(ct.valor||0))}</td>
          <td style="text-align:right;color:var(--green);font-weight:600">${fmtR(pago)}</td>
          <td style="text-align:right;color:${dev>0?'var(--red)':'var(--green)'};font-weight:600">${fmtR(dev)}</td>
          <td style="text-align:center">${contStatusBadge(ct)}</td>
          <td><div class="ta-actions">
            <button class="btn sm" onclick="openModal('medicao',null,'${ct.id}')" title="Nova medição">📐 Medir</button>
            <button class="btn sm" onclick="openModal('pgto','${ct.id}')" title="Registrar pagamento">💳 Pagar</button>
            <button class="btn sm ico" onclick="openModal('contrato','${ct.id}')">✏️</button>
            <button class="btn sm ico" onclick="delContrato('${ct.id}')">🗑️</button>
          </div></td>
        </tr>
        <tr style="background:var(--bg2)"><td colspan="10" style="padding:4px 12px 8px">
          <div class="pw" style="margin-top:2px"><div class="pb" style="width:${Math.min(pct,100)}%;background:${pct>=100?'var(--green)':pct>=50?'var(--primary)':'var(--yellow)'}"></div></div>
          <span style="font-size:10px;color:var(--txt3)">${pct}% pago</span>
        </td></tr>`;
      }).join('')+'</table>';
  }

  // Tabela de pagamentos
  const pgtos=DB.pgtos.sort((a,b)=>b.data.localeCompare(a.data));
  const el2=document.getElementById('cont-pgtos-tbl');
  if(!pgtos.length){el2.innerHTML='<div class="t-empty">Nenhum pagamento registrado.</div>';return;}
  renderMedicoes();
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
          <button class="btn sm ico" onclick="openModal('pgto-edit','${p.id}')">✏️</button>
          <button class="btn sm ico" onclick="delPgto('${p.id}')">🗑️</button>
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
  if(mObraFilter&&mObraFilter.options.length<=1){
    DB.obras.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.nome;mObraFilter.appendChild(opt);});
  }

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
    pendente:'<span class="b by">⏳ Pendente</span>',
    aprovado:'<span class="b bg">✓ Aprovado</span>',
    reprovado:'<span class="b br">✕ Reprovado</span>'
  }[s]||'<span class="b bn">—</span>');

  el.innerHTML=`<table class="tbl">
    <tr><th>Nº</th><th>Contrato</th><th>Fornecedor</th><th>Obra</th><th>Período</th><th style="text-align:right">Valor Medido</th><th style="text-align:right">Acumulado</th><th>Status</th><th></th></tr>
    ${meds.map(m=>{
      const ct=DB.contratos.find(c=>c.id===m.contratoId);
      const o=DB.obras.find(x=>String(x.id)===String(m.obraId));
      const pctAcum=ct?.valor?Math.round(Number(m.valorAcumulado)/Number(ct.valor)*100):0;
      return`<tr>
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
        <td><div class="ta-actions">
          ${m.status==='pendente'?`<button class="btn sm" onclick="aprovarMedicao('${m.id}')" title="Aprovar">✓</button>`:''}
          ${m.status==='pendente'?`<button class="btn sm ico" onclick="reprovarMedicao('${m.id}')" title="Reprovar" style="color:var(--red)">✕</button>`:''}
          <button class="btn sm ico" onclick="openModal('medicao','${m.id}')" title="Editar">✏️</button>
          <button class="btn sm ico" onclick="delMedicao('${m.id}')" title="Excluir">🗑️</button>
          <button class="btn sm" onclick="gerarBoletimPDF('${m.id}')" title="PDF do boletim">📄 PDF</button>
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
  m.aprovadoEm=new Date().toISOString().split('T')[0];
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
    valor:lanc.valor,data:lanc.data,fornecedor:lanc.forn,obra_id:lanc.obraId||null});

  // 2. Pagamento do contrato (aparece na aba Contratos)
  const pgtoId=uuidv4();
  const pgto={id:pgtoId,contratoId:m.contratoId,obraId:m.obraId,
    data:m.aprovadoEm,valor:m.valorMedido,desc:descricao,
    forn:ct?.forn||'',cat:ct?.cat||'Serviços',cc:ct?.cc||'',
    _pgtoId:lancId,_supa:true};
  DB.pgtos.push(pgto);
  supaInsert('pagamentos',{id:pgtoId,empresa_id:_empresaId,
    contrato_id:m.contratoId,obra_id:m.obraId,data:m.aprovadoEm,
    valor:m.valorMedido,descricao:descricao,fornecedor:ct?.forn||'',
    categoria:ct?.cat||'Serviços',centro_custo:ct?.cc||''});

  save();

  // Re-renderizar ambas as abas
  if(document.getElementById('p-contratos')?.classList.contains('on')) renderContratos();
  if(document.getElementById('p-financeiro')?.classList.contains('on')) renderFin();
  renderContratos(); // sempre atualiza contratos pois estamos nela

  toast('✅',`Medição #${m.numero} aprovada! Lançamento de ${fmtR(m.valorMedido)} adicionado no Financeiro e Contratos.`);
}

function reprovarMedicao(id){
  const m=DB.medicoes.find(x=>x.id===id);
  if(!m||!confirm('Reprovar esta medição?'))return;
  m.status='reprovado';
  supaUpdate('medicoes',id,{status:'reprovado'});
  save();renderContratos();toast('⚠️','Medição reprovada.');
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

function medCalcAcum(){
  const ctId=document.getElementById('med-ct')?.value;
  const valor=parseFloat(document.getElementById('med-valor')?.value)||0;
  if(!ctId||!valor) return;
  // Somar medições aprovadas anteriores deste contrato
  const pago=DB.medicoes
    .filter(m=>m.contratoId===ctId&&m.status!=='reprovado')
    .reduce((a,m)=>a+Number(m.valorMedido||0),0);
  const acumEl=document.getElementById('med-acum');
  if(acumEl) acumEl.value=(pago+valor).toFixed(2);
}

function delMedicao(id){
  if(!confirm('Excluir medição?'))return;
  supaDelete('medicoes',id);
  DB.medicoes=DB.medicoes.filter(m=>m.id!==id);
  save();renderContratos();toast('🗑️','Medição excluída.');
}

function gerarBoletimPDF(medicaoId){
  const m=DB.medicoes.find(x=>x.id===medicaoId);
  if(!m){toast('⚠️','Medição não encontrada.');return;}
  const ct=DB.contratos.find(c=>c.id===m.contratoId);
  const o=DB.obras.find(x=>String(x.id)===String(m.obraId));
  let doc;
  try{doc=new jsPDF();}catch(e){toast('⚠️','PDF não disponível.');return;}
  const W=doc.internal.pageSize.getWidth();
  const H=doc.internal.pageSize.getHeight();
  const pctAcum=ct?.valor?Math.round(Number(m.valorAcumulado)/Number(ct.valor)*100):0;
  const pctEsta=ct?.valor?Math.round(Number(m.valorMedido)/Number(ct.valor)*100):0;
  const saldo=Math.max(0,Number(ct?.valor||0)-Number(m.valorAcumulado||0));
  const periodoStr=m.periodo?fmtDt(m.periodo).substring(3):'—';

  let y=pHdr(doc,'Boletim de Medicao No '+String(m.numero||'1').padStart(3,'0'),
    (o?.nome||'—')+'  —  '+(ct?.forn||'—')+'  —  Periodo: '+periodoStr);
  y+=4;

  // ── BLOCO 1: DADOS FINANCEIROS
  y=pSec(doc,y,'1. Valor da Medicao em Relacao ao Contrato');
  doc.autoTable({
    startY:y,
    head:[['','Descricao','Valor','%']],
    body:[
      ['CT',ct?.descricao||ct?.numero||'—',fmtR(Number(ct?.valor||0)),'100%'],
      ['ANT','Medicoes anteriores acumuladas',fmtR(Number(m.valorAcumulado||0)-Number(m.valorMedido||0)),(pctAcum-pctEsta)+'%'],
      ['ESTA','Esta medicao — Periodo: '+periodoStr,fmtR(Number(m.valorMedido||0)),pctEsta+'%'],
      ['ACUM','Total acumulado incluindo esta medicao',fmtR(Number(m.valorAcumulado||0)),pctAcum+'%'],
      ['SALDO','Saldo remanescente do contrato',fmtR(saldo),(100-pctAcum)+'%'],
    ],
    foot:[[{colSpan:2,content:'Fornecedor: '+(ct?.forn||'—')+'  |  Contrato: '+(ct?.numero||'—')},{content:fmtR(Number(ct?.valor||0))},{content:'100%'}]],
    headStyles:{...hStyle(),fontSize:7.5},
    bodyStyles:{...bStyle(),fontSize:8},
    alternateRowStyles:altRow(),
    footStyles:{...totRow(),fontSize:7.5},
    columnStyles:{0:{cellWidth:14,halign:'center',fontStyle:'bold',textColor:PX.blue},1:{cellWidth:90},2:{cellWidth:40,halign:'right',fontStyle:'bold'},3:{cellWidth:22,halign:'center'}},
    didParseCell(d){
      if(d.section==='body'&&d.row.index===2){
        d.cell.styles.fillColor=[235,245,255];
        if(d.column.index===2||d.column.index===3) d.cell.styles.textColor=PX.blue;
      }
    },
    margin:{left:9,right:9},
  });
  y=doc.lastAutoTable.finalY+4;

  // Barra de progresso
  doc.setFillColor(220,225,235);doc.rect(9,y,W-18,7,'F');
  doc.setFillColor(...PX.blue);doc.rect(9,y,(W-18)*pctAcum/100,7,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(255,255,255);
  if(pctAcum>10) doc.text(pctAcum+'% acumulado',13,y+5);
  else{doc.setTextColor(...PX.blue);doc.text(pctAcum+'%',13+(W-18)*pctAcum/100,y+5);}
  y+=12;

  // ── BLOCO 2: O QUE FOI EXECUTADO
  y=pSec(doc,y,'2. Servicos Executados nesta Medicao');
  const execTexto=m.exec&&m.exec.trim()?m.exec:'(Servicos executados nao informados na medicao)';
  doc.autoTable({startY:y,body:[[execTexto]],bodyStyles:{...bStyle(),fontSize:8,minCellHeight:14,fontStyle:m.exec?'normal':'italic',textColor:m.exec?PX.ink:PX.lgray},margin:{left:9,right:9}});
  y=doc.lastAutoTable.finalY+4;

  // Etapas da obra
  const etapas=DB.etapas.filter(e=>String(e.obraId)===String(m.obraId)&&Number(e.pct)>0);
  if(etapas.length){
    doc.autoTable({
      startY:y,
      head:[['Etapa / Servico','% Concluido','Situacao']],
      body:etapas.map(e=>[e.nome,(e.pct||0)+'%',Number(e.pct)>=100?'Concluida':Number(e.pct)>0?'Em andamento':'Nao iniciada']),
      headStyles:{...hStyle(),fontSize:7},bodyStyles:{...bStyle(),fontSize:7.5},alternateRowStyles:altRow(),
      columnStyles:{0:{cellWidth:110},1:{cellWidth:30,halign:'center'},2:{cellWidth:40,halign:'center'}},
      didParseCell(d){if(d.section==='body'&&d.column.index===2){if(d.cell.raw==='Concluida')d.cell.styles.textColor=PX.green;else if(d.cell.raw==='Em andamento')d.cell.styles.textColor=PX.blue;}},
      margin:{left:9,right:9},
    });
    y=doc.lastAutoTable.finalY+4;
  }

  // Observações
  if(m.obs&&m.obs.trim()){
    doc.autoTable({startY:y,head:[['Pendencias e Observacoes']],body:[[m.obs]],headStyles:{...hStyle(),fontSize:7.5,fillColor:PX.amber},bodyStyles:{...bStyle(),fontSize:8},margin:{left:9,right:9}});
    y=doc.lastAutoTable.finalY+4;
  }

  // ── BLOCO 3: FOTOS DO EXECUTADO
  const fotos=(m.fotos||[]).filter(f=>f&&f.src&&f.src.startsWith('data:'));
  if(fotos.length>0){
    doc.addPage();
    let y2=pHdr(doc,'Registro Fotografico — Medicao No '+String(m.numero||'1').padStart(3,'0'),
      periodoStr+'  —  '+(o?.nome||'—')+'  —  '+(ct?.forn||'—'));
    y2+=6;
    const cols=3,imgW=58,imgH=50,gapX=4,gapY=12,startX=9;
    let col=0,curRow=0;
    fotos.forEach((foto,fi)=>{
      const fy=y2+curRow*(imgH+gapY);
      if(fy+imgH+gapY>H-15){doc.addPage();pHdr(doc,'Registro Fotografico (cont.)','Medicao No '+String(m.numero||'1').padStart(3,'0'));y2=36;curRow=0;col=0;}
      const fx=startX+col*(imgW+gapX);
      const fyCur=y2+curRow*(imgH+gapY);
      try{
        const fmt=foto.src.includes('data:image/png')?'PNG':'JPEG';
        doc.addImage(foto.src,fmt,fx,fyCur,imgW,imgH);
        doc.setFillColor(...PX.navy);doc.rect(fx,fyCur,imgW,5,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(255,255,255);
        doc.text('Foto '+(fi+1)+'/'+fotos.length,fx+imgW/2,fyCur+3.5,{align:'center'});
        doc.setDrawColor(...PX.silver);doc.setLineWidth(0.3);doc.rect(fx,fyCur,imgW,imgH,'S');
      }catch(e){
        doc.setFillColor(245,245,245);doc.rect(fx,fyCur,imgW,imgH,'F');
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...PX.lgray);
        doc.text('Foto '+(fi+1),fx+imgW/2,fyCur+imgH/2,{align:'center'});
      }
      col++;
      if(col>=cols){col=0;curRow++;}
    });
  }

  // ── ASSINATURAS
  let assinY=260;
  if(!fotos.length){
    const lastY=doc.lastAutoTable?.finalY||y;
    assinY=Math.max(lastY+12,245);
    if(assinY>265){doc.addPage();assinY=240;}
  } else {
    doc.addPage();assinY=240;
  }
  const assinW=(W-18)/3;
  [['Elaborado por','Empreiteiro / Contratado'],['Fiscalizado por',DB.user.nome||'Engenheiro Responsavel'],['Aprovado por',m.status==='aprovado'?(m.aprovadoPor||'Gestor'):'']].forEach((a,i)=>{
    const ax=9+i*assinW;
    doc.setFillColor(...PX.bg);doc.rect(ax,assinY,assinW-2,22,'F');
    doc.setDrawColor(...PX.silver);doc.rect(ax,assinY,assinW-2,22,'S');
    doc.setFillColor(...PX.navy);doc.rect(ax,assinY,assinW-2,5,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(255,255,255);
    doc.text(a[0].toUpperCase(),ax+(assinW-2)/2,assinY+3.5,{align:'center'});
    doc.setDrawColor(150,150,150);doc.line(ax+4,assinY+14,ax+assinW-6,assinY+14);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(...PX.ink);
    doc.text((a[1]||'').substring(0,24),ax+(assinW-2)/2,assinY+18,{align:'center'});
    if(i===2&&m.status==='aprovado'){
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(...PX.green);
      doc.text('APROVADO'+(m.aprovadoEm?' em '+fmtDt(m.aprovadoEm):''),ax+(assinW-2)/2,assinY+21,{align:'center'});
    }
  });

  pFtr(doc);
  const arq='BM_'+String(m.numero||'01').padStart(3,'0')+'_'+(ct?.numero||'CT').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';
  doc.save(arq);
  toast('📄','Boletim gerado!');
}



function delContrato(id){
  if(!confirm('Excluir contrato? Os pagamentos associados também serão removidos.'))return;
  if(typeof id==='string'&&id.includes('-')) supaDelete('contratos',id);
  DB.pgtos.filter(p=>String(p.contratoId)===String(id)).forEach(p=>{if(typeof p.id==='string'&&p.id.includes('-'))supaDelete('pagamentos',p.id);});
  DB.pgtos=DB.pgtos.filter(p=>String(p.contratoId)!==String(id));
  DB.lancs=DB.lancs.filter(l=>!l._pgtoId||String(l._pgtoId)!==String(id));
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
