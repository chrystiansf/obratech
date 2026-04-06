// COMPRAS — Solicitacoes, Cotacoes, Pedidos
// ═══════════════════════════════════════════

// ── Sub-abas ──────────────────────────────
function comprasTab(tab){
  ['solicitacoes','cotacoes','pedidos'].forEach(t=>{
    const el=document.getElementById('comp-panel-'+t);
    const btn=document.getElementById('comp-tab-'+t);
    if(el) el.style.display=t===tab?'block':'none';
    if(btn){btn.classList.toggle('pri',t===tab);btn.classList.toggle('btn',true);}
  });
  if(tab==='solicitacoes') renderSolicitacoes();
  else if(tab==='cotacoes') renderCotacoes();
  else if(tab==='pedidos') renderPedidos();
}

function renderCompras(){
  comprasTab('solicitacoes');
}

// ═══════════════════════════════════════════
// SOLICITACOES
// ═══════════════════════════════════════════

function renderSolicitacoes(){
  const obraF=document.getElementById('sol-obra-filter')?.value||'';
  const statusF=document.getElementById('sol-status-filter')?.value||'';
  const urgF=document.getElementById('sol-urg-filter')?.value||'';

  // Popular filtro de obras
  const selObra=document.getElementById('sol-obra-filter');
  if(selObra&&selObra.options.length<=1){
    DB.obras.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.nome;selObra.appendChild(opt);});
  }

  let sols=(DB.solicitacoes||[]).slice();
  if(obraF) sols=sols.filter(s=>String(s.obraId)===String(obraF));
  if(statusF) sols=sols.filter(s=>s.status===statusF);
  if(urgF) sols=sols.filter(s=>s.urgencia===urgF);
  sols.sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));

  // KPIs
  const total=(DB.solicitacoes||[]).length;
  const abertas=(DB.solicitacoes||[]).filter(s=>s.status==='aberta').length;
  const cotando=(DB.solicitacoes||[]).filter(s=>s.status==='cotando').length;
  const aprovadas=(DB.solicitacoes||[]).filter(s=>s.status==='aprovada').length;

  const _skAct=(v)=>statusF===v?'outline:2px solid var(--primary);outline-offset:-2px;border-radius:10px':'';
  document.getElementById('sol-kpis').innerHTML=`
    <div class="kpi" onclick="solFiltroKpi('')" style="cursor:pointer;${_skAct('')}"><div class="kl">Total</div><div class="kv">${total}</div><div class="kd neu">solicitacoes</div></div>
    <div class="kpi" onclick="solFiltroKpi('aberta')" style="cursor:pointer;${_skAct('aberta')}"><div class="kl">Abertas</div><div class="kv" style="color:var(--primary)">${abertas}</div><div class="kd neu">aguardando</div></div>
    <div class="kpi" onclick="solFiltroKpi('cotando')" style="cursor:pointer;${_skAct('cotando')}"><div class="kl">Em Cotacao</div><div class="kv" style="color:var(--yellow)">${cotando}</div><div class="kd neu">cotando</div></div>
    <div class="kpi" onclick="solFiltroKpi('aprovada')" style="cursor:pointer;${_skAct('aprovada')}"><div class="kl">Aprovadas</div><div class="kv" style="color:var(--green)">${aprovadas}</div><div class="kd up">prontas</div></div>`;

  const el=document.getElementById('sol-tbl');
  const URG_BADGE={normal:'<span class="b bn">Normal</span>',urgente:'<span class="b by">Urgente</span>',critico:'<span class="b br">Critico</span>'};
  const STATUS_BADGE={aberta:'<span class="b bb">Aberta</span>',cotando:'<span class="b by">Cotando</span>',aprovada:'<span class="b bg">Aprovada</span>',recebida:'<span class="b bg" style="background:var(--green)">Recebida</span>',cancelada:'<span class="b bn">Cancelada</span>'};

  if(!sols.length){
    el.innerHTML='<div class="t-empty">Nenhuma solicitacao. <button class="btn pri sm" onclick="openModal(\'solicitacao\')" style="margin-left:8px">+ Nova</button></div>';
    return;
  }

  el.innerHTML=`<table class="tbl">
    <tr><th>Item</th><th>Un.</th><th>Qtd</th><th>Obra</th><th>Urgencia</th><th>Status</th><th>Solicitante</th><th></th></tr>
    ${sols.map(s=>{
      const o=DB.obras.find(x=>String(x.id)===String(s.obraId));
      return`<tr>
        <td class="n">${s.item}</td>
        <td>${s.unidade||'—'}</td>
        <td style="text-align:right;font-weight:600">${s.quantidade||'—'}</td>
        <td style="font-size:11px">${o?.nome||'—'}</td>
        <td>${URG_BADGE[s.urgencia]||URG_BADGE.normal}</td>
        <td>${STATUS_BADGE[s.status]||STATUS_BADGE.aberta}</td>
        <td style="font-size:11px;color:var(--txt3)">${s.solicitante||'—'}</td>
        <td><div class="ta-actions">
          ${s.status==='aberta'?`<button class="btn sm" onclick="solMudarStatus('${s.id}','cotando');comprasTab('cotacoes')" title="Enviar para cotacao">Cotar</button>`:''}
          ${s.status==='cotando'?`<button class="btn sm" onclick="comprasTab('cotacoes')" title="Ver cotacoes">Ver Cotacoes</button>`:''}
          ${s.status==='cotando'||s.status==='aberta'?`<button class="btn sm" onclick="solMudarStatus('${s.id}','aprovada')" title="Aprovar" style="color:var(--green)">Aprovar</button>`:''}
          ${s.status==='aprovada'?`<button class="btn sm" onclick="solReceber('${s.id}')" title="Registrar recebimento">Receber</button>`:''}
          <button class="btn sm ico" onclick="openModalSolicitacao('${s.id}')">✏️</button>
          <button class="btn sm ico" onclick="solExcluir('${s.id}')" title="Excluir">🗑️</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}

function solFiltroKpi(status){
  const sel=document.getElementById('sol-status-filter');
  if(sel){sel.value=sel.value===status?'':status;}
  renderSolicitacoes();
}

function solExcluir(id){
  if(!confirm('Excluir esta solicitação permanentemente?'))return;
  try{supaDelete('compras_solicitacoes',id);}catch(e){}
  // Excluir cotações e pedidos vinculados
  (DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(id)).forEach(c=>{
    try{supaDelete('compras_cotacoes',c.id);}catch(e){}
  });
  DB.cotacoes=(DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)!==String(id));
  (DB.pedidosCompra||[]).filter(p=>String(p.solicitacaoId)===String(id)).forEach(p=>{
    try{supaDelete('compras_pedidos',p.id);}catch(e){}
  });
  DB.pedidosCompra=(DB.pedidosCompra||[]).filter(p=>String(p.solicitacaoId)!==String(id));
  DB.solicitacoes=(DB.solicitacoes||[]).filter(s=>String(s.id)!==String(id));
  save();renderSolicitacoes();toast('🗑️','Solicitação excluída.');
}

function solMudarStatus(id,status){
  const s=(DB.solicitacoes||[]).find(x=>x.id===id);
  if(!s) return;
  if(status==='cancelada'&&!confirm('Cancelar esta solicitacao?')) return;
  s.status=status;
  supaUpdate('compras_solicitacoes',id,{status});
  save();renderSolicitacoes();
  if(status==='aprovada') _criarPedidoFromSolicitacao(s);
  toast('✅','Status atualizado!');
}

function _criarPedidoFromSolicitacao(sol){
  // Buscar cotacao vencedora
  const cotVenc=(DB.cotacoes||[]).find(c=>String(c.solicitacaoId)===String(sol.id)&&c.vencedor);
  const novoId=uuidv4();
  const pedido={
    id:novoId,
    solicitacaoId:sol.id,
    obraId:sol.obraId,
    fornecedor:cotVenc?.fornecedor||'',
    valorTotal:cotVenc?.valorTotal||0,
    previsaoEntrega:cotVenc?.prazoEntrega||'',
    status:'pendente',
    obs:'',
    _supa:true
  };
  if(!DB.pedidosCompra) DB.pedidosCompra=[];
  DB.pedidosCompra.push(pedido);
  supaInsert('compras_pedidos',{
    id:novoId,solicitacao_id:sol.id,obra_id:sol.obraId||null,
    fornecedor:pedido.fornecedor,valor_total:pedido.valorTotal,
    previsao_entrega:pedido.previsaoEntrega||null,status:'pendente',obs:''
  });
  save();
}

function solReceber(id){
  const s=(DB.solicitacoes||[]).find(x=>x.id===id);
  if(!s||!confirm('Confirmar recebimento? Sera lancado no financeiro.')) return;
  s.status='recebida';
  supaUpdate('compras_solicitacoes',id,{status:'recebida'});

  // Buscar pedido vinculado
  const ped=(DB.pedidosCompra||[]).find(p=>String(p.solicitacaoId)===String(id));

  // Lancar despesa financeira
  if(ped&&ped.valorTotal>0){
    const lancId=uuidv4();
    DB.lancs.push({id:lancId,obraId:s.obraId,tipo:'Despesa',desc:'[COMPRA] '+s.item,cat:'Materiais',cc:'',valor:ped.valorTotal,data:new Date().toISOString().split('T')[0],forn:ped.fornecedor||'',nf:'',_supa:true});
    supaInsert('lancamentos',{id:lancId,tipo:'Despesa',descricao:'[COMPRA] '+s.item,categoria:'Materiais',centro_custo:'',valor:ped.valorTotal,data:new Date().toISOString().split('T')[0],fornecedor:ped.fornecedor||'',nota_fiscal:'',obra_id:s.obraId||null});
  }

  save();renderSolicitacoes();renderPedidos();
  toast('✅','Material recebido! Lançamento financeiro registrado.');
}

// ═══════════════════════════════════════════
// COTACOES
// ═══════════════════════════════════════════

function renderCotacoes(){
  const sols=(DB.solicitacoes||[]).filter(s=>s.status==='cotando'||s.status==='aberta');
  const el=document.getElementById('cot-tbl');
  if(!sols.length){
    el.innerHTML='<div class="t-empty">Nenhuma solicitacao em cotacao. Mude o status de uma solicitacao para "Cotando".</div>';
    return;
  }

  el.innerHTML=sols.map(s=>{
    const o=DB.obras.find(x=>String(x.id)===String(s.obraId));
    const cots=(DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(s.id));
    const menorValor=cots.length?Math.min(...cots.filter(c=>c.valorTotal>0).map(c=>c.valorTotal)):0;

    return`<div class="card" style="margin-bottom:12px">
      <div class="ch">
        <div>
          <div class="ct">${s.item}</div>
          <div class="cs">${s.quantidade||'—'} ${s.unidade||'un'} — ${o?.nome||'Sem obra'}</div>
        </div>
        <div class="ca">
          <button class="btn sm pri" onclick="openModalCotacao(null,'${s.id}')">+ Cotacao</button>
          ${cots.length>=2?`<button class="btn sm" onclick="gerarMapaCotacaoPDF('${s.id}')">Mapa PDF</button>`:''}
        </div>
      </div>
      ${cots.length?`<table class="tbl" style="margin-top:10px">
        <tr><th>Fornecedor</th><th style="text-align:right">Valor Unit.</th><th style="text-align:right">Valor Total</th><th>Prazo</th><th>Obs</th><th></th></tr>
        ${cots.map(c=>{
          const isMenor=c.valorTotal>0&&c.valorTotal===menorValor;
          return`<tr style="${isMenor?'background:rgba(22,163,74,.08);':''}${c.vencedor?'border-left:3px solid var(--green);':''}">
            <td class="n">${c.fornecedor||'—'}${c.vencedor?' <span class="b bg" style="font-size:9px">Vencedor</span>':''}</td>
            <td style="text-align:right">${fmtR(c.valorUnit||0)}</td>
            <td style="text-align:right;font-weight:600;${isMenor?'color:var(--green)':''}">${fmtR(c.valorTotal||0)}</td>
            <td style="font-size:11px">${c.prazoEntrega||'—'}</td>
            <td style="font-size:11px;color:var(--txt3)">${c.obs||'—'}</td>
            <td><div class="ta-actions">
              ${!c.vencedor?`<button class="btn sm" onclick="cotSelecionar('${c.id}','${s.id}')" title="Selecionar vencedor" style="color:var(--green)">Selecionar</button>`:''}
              <button class="btn sm ico" onclick="cotDel('${c.id}')">🗑️</button>
            </div></td>
          </tr>`;
        }).join('')}
      </table>`:`<div class="t-empty" style="margin-top:10px">Nenhuma cotacao. Clique em "+ Cotacao" para adicionar.</div>`}
    </div>`;
  }).join('');
}

function cotSelecionar(cotId,solId){
  // Desmarcar todas as cotacoes desta solicitacao
  (DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(solId)).forEach(c=>{
    c.vencedor=false;
    supaUpdate('compras_cotacoes',c.id,{vencedor:false});
  });
  // Marcar vencedor
  const cot=(DB.cotacoes||[]).find(c=>c.id===cotId);
  if(cot){
    cot.vencedor=true;
    supaUpdate('compras_cotacoes',cotId,{vencedor:true});
  }
  save();renderCotacoes();toast('✅','Fornecedor selecionado!');
}

function cotDel(id){
  if(!confirm('Excluir cotacao?')) return;
  supaDelete('compras_cotacoes',id);
  DB.cotacoes=(DB.cotacoes||[]).filter(c=>c.id!==id);
  save();renderCotacoes();toast('🗑️','Cotacao excluida.');
}

// ═══════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════

function renderPedidos(){
  let peds=(DB.pedidosCompra||[]).slice();
  peds.sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));

  const el=document.getElementById('ped-tbl');
  const STATUS_BADGE={pendente:'<span class="b bn">Pendente</span>',enviado:'<span class="b bb">Enviado</span>',recebido:'<span class="b bg">Recebido</span>'};

  if(!peds.length){
    el.innerHTML='<div class="t-empty">Nenhum pedido de compra. Aprove uma solicitacao para gerar um pedido.</div>';
    return;
  }

  el.innerHTML=`<table class="tbl">
    <tr><th>Fornecedor</th><th>Item</th><th>Obra</th><th style="text-align:right">Valor</th><th>Prev. Entrega</th><th>Status</th><th></th></tr>
    ${peds.map(p=>{
      const sol=(DB.solicitacoes||[]).find(s=>String(s.id)===String(p.solicitacaoId));
      const o=DB.obras.find(x=>String(x.id)===String(p.obraId));
      return`<tr>
        <td class="n">${p.fornecedor||'—'}</td>
        <td style="font-size:11px">${sol?.item||'—'}</td>
        <td style="font-size:11px">${o?.nome||'—'}</td>
        <td style="text-align:right;font-weight:600">${fmtR(p.valorTotal||0)}</td>
        <td style="font-size:11px">${p.previsaoEntrega?fmtDt(p.previsaoEntrega):'—'}</td>
        <td>${STATUS_BADGE[p.status]||STATUS_BADGE.pendente}</td>
        <td><div class="ta-actions">
          ${p.status==='pendente'?`<button class="btn sm" onclick="pedMudarStatus('${p.id}','enviado')">Enviar</button>`:''}
          ${p.status==='enviado'?`<button class="btn sm" onclick="pedReceber('${p.id}')" style="color:var(--green)">Receber</button>`:''}
          <button class="btn sm" onclick="gerarOrdemCompraPDF('${p.id}')">PDF</button>
          ${p.status!=='recebido'?`<button class="btn sm ico" onclick="pedDel('${p.id}')">🗑️</button>`:''}
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}

function pedMudarStatus(id,status){
  const p=(DB.pedidosCompra||[]).find(x=>x.id===id);
  if(!p) return;
  p.status=status;
  supaUpdate('compras_pedidos',id,{status});
  save();renderPedidos();toast('✅','Status atualizado!');
}

function pedReceber(id){
  const p=(DB.pedidosCompra||[]).find(x=>x.id===id);
  if(!p||!confirm('Confirmar recebimento?')) return;
  p.status='recebido';
  supaUpdate('compras_pedidos',id,{status:'recebido'});

  // Buscar solicitacao vinculada
  const sol=(DB.solicitacoes||[]).find(s=>String(s.id)===String(p.solicitacaoId));
  if(sol){
    sol.status='recebida';
    supaUpdate('compras_solicitacoes',sol.id,{status:'recebida'});

    // Lancar despesa financeira
    if(p.valorTotal>0){
      const lancId=uuidv4();
      DB.lancs.push({id:lancId,obraId:p.obraId,tipo:'Despesa',desc:'[COMPRA] '+sol.item,cat:'Materiais',cc:'',valor:p.valorTotal,data:new Date().toISOString().split('T')[0],forn:p.fornecedor||'',nf:'',_supa:true});
      supaInsert('lancamentos',{id:lancId,tipo:'Despesa',descricao:'[COMPRA] '+sol.item,categoria:'Materiais',centro_custo:'',valor:p.valorTotal,data:new Date().toISOString().split('T')[0],fornecedor:p.fornecedor||'',nota_fiscal:'',obra_id:p.obraId||null});
    }
  }

  save();renderPedidos();renderSolicitacoes();
  toast('✅','Pedido recebido! Lançamento financeiro registrado.');
}

function pedDel(id){
  if(!confirm('Excluir pedido?')) return;
  supaDelete('compras_pedidos',id);
  DB.pedidosCompra=(DB.pedidosCompra||[]).filter(p=>p.id!==id);
  save();renderPedidos();toast('🗑️','Pedido excluido.');
}

// ═══════════════════════════════════════════
// MODAIS — Solicitacao e Cotacao
// ═══════════════════════════════════════════

function openModalSolicitacao(editId){
  const s=editId?(DB.solicitacoes||[]).find(x=>x.id===editId):null;
  const title=s?'Editar Solicitacao':'Nova Solicitacao de Compra';
  const obrasOpts=DB.obras.map(o=>`<option value="${o.id}"${s?.obraId==o.id?' selected':''}>${o.nome}</option>`).join('');
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${title}</div><div class="mox" onclick="closeModal()">✕</div></div><div class="mob">
    <div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Item / Material *</label><input class="inp" id="sol-item" value="${s?.item||''}" placeholder="Ex: Cimento CP-II 50kg"></div>
      <div class="fg"><label class="lbl">Unidade</label><input class="inp" id="sol-un" value="${s?.unidade||''}" placeholder="sc, m3, un..."></div>
      <div class="fg"><label class="lbl">Quantidade</label><input type="number" class="inp" id="sol-qtd" value="${s?.quantidade||''}" min="0" step="0.01" placeholder="0"></div>
      <div class="fg"><label class="lbl">Obra</label><select class="sel" id="sol-obra">${obrasOpts}</select></div>
      <div class="fg"><label class="lbl">Urgencia</label><select class="sel" id="sol-urg"><option value="normal"${s?.urgencia==='normal'?' selected':''}>Normal</option><option value="urgente"${s?.urgencia==='urgente'?' selected':''}>Urgente</option><option value="critico"${s?.urgencia==='critico'?' selected':''}>Critico</option></select></div>
      <div class="fg"><label class="lbl">Solicitante</label><input class="inp" id="sol-solicitante" value="${s?.solicitante||DB.user.nome||''}" placeholder="Nome"></div>
      <div class="fg"><label class="lbl">Observacoes</label><input class="inp" id="sol-obs" value="${s?.obs||''}" placeholder="Obs..."></div>
    </div>
  </div><div class="mof"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="salvarSolicitacao('${editId||''}')">Salvar</button></div></div></div>`;
}

function salvarSolicitacao(editId){
  const item=document.getElementById('sol-item').value.trim();
  if(!item){toast('⚠️','Informe o item!');return;}
  const dados={
    item,
    unidade:document.getElementById('sol-un').value.trim(),
    quantidade:parseFloat(document.getElementById('sol-qtd').value)||0,
    obraId:document.getElementById('sol-obra').value||null,
    urgencia:document.getElementById('sol-urg').value||'normal',
    solicitante:document.getElementById('sol-solicitante').value.trim(),
    obs:document.getElementById('sol-obs').value.trim(),
  };
  if(editId){
    const s=(DB.solicitacoes||[]).find(x=>x.id===editId);
    if(s){Object.assign(s,dados);supaUpdate('compras_solicitacoes',editId,{item:dados.item,unidade:dados.unidade,quantidade:dados.quantidade,obra_id:dados.obraId||null,urgencia:dados.urgencia,solicitante:dados.solicitante,obs:dados.obs});}
  } else {
    const novoId=uuidv4();
    const novo={id:novoId,...dados,status:'aberta',criadoEm:new Date().toISOString(),_supa:true};
    if(!DB.solicitacoes) DB.solicitacoes=[];
    DB.solicitacoes.push(novo);
    supaInsert('compras_solicitacoes',{id:novoId,item:dados.item,unidade:dados.unidade,quantidade:dados.quantidade,obra_id:dados.obraId||null,urgencia:dados.urgencia,solicitante:dados.solicitante,obs:dados.obs,status:'aberta'});
  }
  save();closeModal();renderSolicitacoes();toast('✅',editId?'Solicitacao atualizada!':'Solicitacao criada!');
}

function openModalCotacao(editId, solId){
  const c=editId?(DB.cotacoes||[]).find(x=>x.id===editId):null;
  const sId=solId||c?.solicitacaoId||'';
  const sol=(DB.solicitacoes||[]).find(s=>s.id===sId);
  const title=c?'Editar Cotacao':'Nova Cotacao';
  const fornOpts='<option value="">— Selecionar —</option>'+(DB.fornecedores||[]).map(f=>{const nome=typeof f==='object'?f.nome:f;return`<option${c?.fornecedor===nome?' selected':''}>${nome}</option>`;}).join('');
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${title}${sol?' — '+sol.item:''}</div><div class="mox" onclick="closeModal()">✕</div></div><div class="mob">
    <div class="g g2">
      <div class="fg"><label class="lbl">Fornecedor *</label><select class="sel" id="cot-forn">${fornOpts}</select></div>
      <div class="fg"><label class="lbl">Valor Unitario (R$)</label><input type="number" class="inp" id="cot-vunit" value="${c?.valorUnit||''}" min="0" step="0.01" placeholder="0.00" oninput="_cotCalcTotal()"></div>
      <div class="fg"><label class="lbl">Valor Total (R$)</label><input type="number" class="inp" id="cot-vtotal" value="${c?.valorTotal||''}" min="0" step="0.01" placeholder="0.00"></div>
      <div class="fg"><label class="lbl">Prazo de Entrega</label><input class="inp" id="cot-prazo" value="${c?.prazoEntrega||''}" placeholder="Ex: 5 dias uteis"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observacoes</label><input class="inp" id="cot-obs" value="${c?.obs||''}" placeholder="Condicoes, frete..."></div>
    </div>
  </div><div class="mof"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="salvarCotacao('${editId||''}','${sId}')">Salvar</button></div></div></div>`;
  // Calcular total se tiver qtd
  if(sol&&sol.quantidade) window._cotQtd=sol.quantidade;
}

function _cotCalcTotal(){
  const vunit=parseFloat(document.getElementById('cot-vunit')?.value)||0;
  const qtd=window._cotQtd||0;
  if(vunit&&qtd){document.getElementById('cot-vtotal').value=(vunit*qtd).toFixed(2);}
}

function salvarCotacao(editId,solId){
  const forn=document.getElementById('cot-forn').value;
  if(!forn){toast('⚠️','Selecione o fornecedor!');return;}
  const dados={
    fornecedor:forn,
    valorUnit:parseFloat(document.getElementById('cot-vunit').value)||0,
    valorTotal:parseFloat(document.getElementById('cot-vtotal').value)||0,
    prazoEntrega:document.getElementById('cot-prazo').value.trim(),
    obs:document.getElementById('cot-obs').value.trim(),
  };
  if(editId){
    const c=(DB.cotacoes||[]).find(x=>x.id===editId);
    if(c){Object.assign(c,dados);supaUpdate('compras_cotacoes',editId,{fornecedor:dados.fornecedor,valor_unit:dados.valorUnit,valor_total:dados.valorTotal,prazo_entrega:dados.prazoEntrega,obs:dados.obs});}
  } else {
    const novoId=uuidv4();
    const novo={id:novoId,solicitacaoId:solId,...dados,vencedor:false,_supa:true};
    if(!DB.cotacoes) DB.cotacoes=[];
    DB.cotacoes.push(novo);
    supaInsert('compras_cotacoes',{id:novoId,solicitacao_id:solId,fornecedor:dados.fornecedor,valor_unit:dados.valorUnit,valor_total:dados.valorTotal,prazo_entrega:dados.prazoEntrega,obs:dados.obs,vencedor:false});
  }
  save();closeModal();renderCotacoes();toast('✅',editId?'Cotacao atualizada!':'Cotacao adicionada!');
}

// ═══════════════════════════════════════════
// PDFs
// ═══════════════════════════════════════════

function gerarMapaCotacaoPDF(solId){
  const sol=(DB.solicitacoes||[]).find(s=>s.id===solId);
  if(!sol){toast('⚠️','Solicitacao nao encontrada.');return;}
  const cots=(DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(solId));
  if(cots.length<2){toast('⚠️','Adicione ao menos 2 cotacoes.');return;}
  const o=DB.obras.find(x=>String(x.id)===String(sol.obraId));
  const doc=new jsPDF();
  const W=doc.internal.pageSize.getWidth();
  const M=9;

  let y=pHdr(doc,'Mapa de Cotacao',sol.item+'  —  '+(o?.nome||''));
  y+=4;

  // Dados do item
  y=pSec(doc,y,'Item Solicitado');
  doc.autoTable({
    startY:y,
    head:[['Item','Unidade','Quantidade','Obra','Urgencia']],
    body:[[sol.item,sol.unidade||'—',sol.quantidade||'—',o?.nome||'—',sol.urgencia||'normal']],
    headStyles:{fillColor:[70,75,90],textColor:[255,255,255],fontStyle:'bold',fontSize:8,cellPadding:{top:2.2,bottom:2.2,left:4,right:4}},
    bodyStyles:bStyle(),
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Tabela comparativa
  y=pSec(doc,y,'Cotacoes Recebidas');
  const menorValor=Math.min(...cots.filter(c=>c.valorTotal>0).map(c=>c.valorTotal));
  doc.autoTable({
    startY:y,
    head:[['Fornecedor','Valor Unit.','Valor Total','Prazo','Obs','Resultado']],
    body:cots.map(c=>[
      c.fornecedor||'—',
      fmtR(c.valorUnit||0),
      fmtR(c.valorTotal||0),
      c.prazoEntrega||'—',
      (c.obs||'—').substring(0,30),
      c.vencedor?'VENCEDOR':c.valorTotal===menorValor?'Menor preco':'—'
    ]),
    headStyles:{fillColor:[70,75,90],textColor:[255,255,255],fontStyle:'bold',fontSize:7.5,cellPadding:{top:2.2,bottom:2.2,left:4,right:4}},
    bodyStyles:bStyle(),
    alternateRowStyles:altRow(),
    columnStyles:{0:{cellWidth:40},1:{cellWidth:26,halign:'right'},2:{cellWidth:28,halign:'right',fontStyle:'bold'},3:{cellWidth:28},4:{cellWidth:35},5:{cellWidth:28,halign:'center'}},
    didParseCell(d){
      if(d.section==='body'){
        if(d.column.index===5){
          if(d.cell.raw==='VENCEDOR'){d.cell.styles.textColor=[22,101,52];d.cell.styles.fontStyle='bold';}
          else if(d.cell.raw==='Menor preco'){d.cell.styles.textColor=[22,101,52];}
        }
        if(d.column.index===2){
          const val=cots[d.row.index]?.valorTotal;
          if(val===menorValor&&val>0) d.cell.styles.textColor=[22,101,52];
        }
      }
    },
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+15;

  // Assinaturas
  const assinW=(W-M*2)/2;
  [['Solicitante',sol.solicitante||DB.user.nome||''],['Aprovacao','']].forEach((a,i)=>{
    const ax=M+i*assinW;
    doc.setDrawColor(150,150,150);doc.line(ax+4,y+8,ax+assinW-6,y+8);
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(40,40,40);
    doc.text(a[0].toUpperCase(),ax+assinW/2,y+12,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);
    doc.text(a[1],ax+assinW/2,y+16,{align:'center'});
  });

  pFtr(doc);
  doc.save('Mapa_Cotacao_'+sol.item.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  toast('📄','Mapa de cotacao gerado!');
}

function gerarOrdemCompraPDF(pedId){
  const p=(DB.pedidosCompra||[]).find(x=>x.id===pedId);
  if(!p){toast('⚠️','Pedido nao encontrado.');return;}
  const sol=(DB.solicitacoes||[]).find(s=>String(s.id)===String(p.solicitacaoId));
  const o=DB.obras.find(x=>String(x.id)===String(p.obraId));
  const cot=(DB.cotacoes||[]).find(c=>String(c.solicitacaoId)===String(p.solicitacaoId)&&c.vencedor);
  const doc=new jsPDF();
  const M=9;

  let y=pHdr(doc,'Ordem de Compra',(o?.nome||'')+'  —  '+(p.fornecedor||''));
  y+=4;

  // Dados do fornecedor
  y=pSec(doc,y,'Dados do Fornecedor');
  const fornObj=(DB.fornecedores||[]).find(f=>(typeof f==='object'?f.nome:f)===p.fornecedor);
  doc.autoTable({
    startY:y,
    body:[
      ['Fornecedor',p.fornecedor||'—'],
      ['CNPJ',fornObj?.cnpj||'—'],
      ['Contato',fornObj?.contato||fornObj?.telefone||'—'],
      ['Previsao de Entrega',p.previsaoEntrega?fmtDt(p.previsaoEntrega):'—'],
    ],
    bodyStyles:{...bStyle(),fontSize:8},
    columnStyles:{0:{cellWidth:50,fontStyle:'bold',textColor:[70,75,90]},1:{cellWidth:142}},
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Itens
  y=pSec(doc,y,'Itens do Pedido');
  doc.autoTable({
    startY:y,
    head:[['Item','Unidade','Quantidade','Valor Unit.','Valor Total']],
    body:[[sol?.item||'—',sol?.unidade||'un',sol?.quantidade||'—',fmtR(cot?.valorUnit||0),fmtR(p.valorTotal||0)]],
    foot:[[{colSpan:4,content:'TOTAL',styles:{halign:'right'}},{content:fmtR(p.valorTotal||0)}]],
    headStyles:{fillColor:[70,75,90],textColor:[255,255,255],fontStyle:'bold',fontSize:8,cellPadding:{top:2.2,bottom:2.2,left:4,right:4}},
    bodyStyles:bStyle(),
    footStyles:totRow(),
    columnStyles:{0:{cellWidth:65},1:{cellWidth:22,halign:'center'},2:{cellWidth:28,halign:'center'},3:{cellWidth:35,halign:'right'},4:{cellWidth:42,halign:'right',fontStyle:'bold'}},
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  if(p.obs){
    y=pSec(doc,y,'Observacoes');
    doc.autoTable({startY:y,body:[[p.obs]],bodyStyles:{...bStyle(),fontSize:8},margin:{left:M,right:M}});
    y=doc.lastAutoTable.finalY+6;
  }

  // Assinaturas
  y=Math.max(y+10,240);
  const W=doc.internal.pageSize.getWidth();
  const assinW=(W-M*2)/2;
  [['Comprador',DB.user.nome||''],['Fornecedor',p.fornecedor||'']].forEach((a,i)=>{
    const ax=M+i*assinW;
    doc.setDrawColor(150,150,150);doc.line(ax+4,y+8,ax+assinW-6,y+8);
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(40,40,40);
    doc.text(a[0].toUpperCase(),ax+assinW/2,y+12,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);
    doc.text(a[1],ax+assinW/2,y+16,{align:'center'});
  });

  pFtr(doc);
  doc.save('OC_'+(p.fornecedor||'pedido').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  toast('📄','Ordem de compra gerada!');
}
