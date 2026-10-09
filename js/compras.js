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
  const STATUS_BADGE={aberta:'<span class="b bb">Aberta</span>',cotando:'<span class="b by">Cotando</span>',aprovada:'<span class="b bg">Aprovada</span>',recebida:'<span class="b" style="background:var(--green);color:#fff">Recebida</span>',cancelada:'<span class="b bn">Cancelada</span>'};

  if(!sols.length){
    el.innerHTML='<div class="t-empty">Nenhuma solicitacao. <button class="btn pri sm" onclick="openModalSolicitacao()" style="margin-left:8px">+ Nova</button></div>';
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
          <button class="btn sm ico" onclick="openModalSolicitacao('${s.id}')"><svg class=ot-i><use href=#i-pencil></use></svg></button>
          <button class="btn sm ico" onclick="solExcluir('${s.id}')" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
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
    valorTotal:cotVenc?(cotVenc.valorTotal||_cotMelhor(cotVenc)):0,
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

// Melhor preço de uma cotação = menor valor informado entre total, PIX e cartão
function _cotMelhor(c){const v=[c.valorTotal,c.valorPix,c.valorCartao].map(Number).filter(x=>x>0);return v.length?Math.min(...v):0;}
function _cotParcela(c){return c.valorCartao>0&&c.parcelas>1?c.valorCartao/c.parcelas:0;}

function renderCotacoes(){
  const filtro=document.getElementById('cot-filtro')?.value||'ativas';
  const temCot=id=>(DB.cotacoes||[]).some(c=>String(c.solicitacaoId)===String(id));
  const sols=(DB.solicitacoes||[]).filter(s=>s.status==='cotando'||s.status==='aberta'||(filtro==='todas'&&temCot(s.id)));
  const el=document.getElementById('cot-tbl');
  if(!sols.length){
    el.innerHTML='<div class="t-empty">'+(filtro==='todas'?'Nenhuma cotacao registrada.':'Nenhuma cotacao em andamento.')+' <button class="btn pri sm" onclick="abrirNovaCotacao()" style="margin-left:8px">+ Nova cotacao</button></div>';
    return;
  }
  el.innerHTML=sols.map(s=>{
    const o=DB.obras.find(x=>String(x.id)===String(s.obraId));
    const cots=(DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(s.id));
    const melhores=cots.map(_cotMelhor).filter(v=>v>0);
    const menorValor=melhores.length?Math.min(...melhores):0;
    const fechada=!(s.status==='cotando'||s.status==='aberta');
    const stLbl={aprovada:'Aprovada',recebida:'Recebida',cancelada:'Cancelada'}[s.status]||'';
    const v=x=>Number(x)>0?fmtR(x):'—';
    return`<div class="card" style="margin-bottom:12px">
      <div class="ch">
        <div>
          <div class="ct">${escHtml(s.item)}${fechada&&stLbl?` <span class="b bn" style="font-size:11px;vertical-align:2px">${stLbl}</span>`:''}</div>
          <div class="cs">${o?.nome?escHtml(o.nome):'Sem obra'}${s.quantidade?' — '+s.quantidade+' '+escHtml(s.unidade||''):''} · ${cots.length} orcamento${cots.length!==1?'s':''}</div>
        </div>
        <div class="ca">
          ${!fechada?`<button class="btn sm pri" onclick="openModalCotacao(null,'${s.id}')">+ Orcamento</button>`:''}
          ${cots.length?`<button class="btn sm" onclick="gerarMapaCotacaoPDF('${s.id}')"><svg class=ot-i><use href=#i-file-text></use></svg> Mapa de precos</button>`:''}
        </div>
      </div>
      ${cots.length?`<div style="overflow-x:auto"><table class="tbl">
        <tr><th>Fornecedor</th><th style="text-align:right">Valor total</th><th style="text-align:right">A vista / PIX</th><th style="text-align:right">No cartao</th><th style="text-align:center">Parcelas</th><th>Prazo</th><th style="text-align:center">Itens</th><th></th></tr>
        ${cots.sort((a,b)=>(_cotMelhor(a)||1e15)-(_cotMelhor(b)||1e15)).map(c=>{
          const melhor=_cotMelhor(c);
          const isMenor=melhor>0&&melhor===menorValor&&cots.length>1;
          const dest=x=>isMenor&&Number(x)>0&&Number(x)===melhor?'color:var(--green);font-weight:700':'';
          const parc=_cotParcela(c);
          const it=(c.detalhe&&c.detalhe.itens)||[];
          return`<tr style="${isMenor?'background:var(--ot-ok-soft);':''}${c.vencedor?'box-shadow:inset 3px 0 0 var(--green);':''}">
            <td class="n">${escHtml(c.fornecedor||'—')}${c.vencedor?' <span class="b bg" style="font-size:10px">Vencedor</span>':''}${isMenor?' <span class="b bg" style="font-size:10px">Menor preco</span>':''}${c.detalhe?.desconto?`<div style="font-size:11px;color:var(--txt3);font-weight:400">desconto ${fmtR(c.detalhe.desconto)}</div>`:''}</td>
            <td style="text-align:right;${dest(c.valorTotal)}" class="ot-num">${v(c.valorTotal)}</td>
            <td style="text-align:right;${dest(c.valorPix)}" class="ot-num">${v(c.valorPix)}</td>
            <td style="text-align:right;${dest(c.valorCartao)}" class="ot-num">${v(c.valorCartao)}</td>
            <td style="text-align:center;white-space:nowrap">${c.parcelas>1?c.parcelas+'x'+(parc?` <span style="font-size:11px;color:var(--txt3)">de ${fmtR(parc)}</span>`:''):(c.valorCartao?'1x':'—')}</td>
            <td style="font-size:12px">${escHtml(c.prazoEntrega||'—')}</td>
            <td style="text-align:center">${it.length?`<button class="btn sm" onclick="cotToggleItens('${c.id}')">${it.length} ▾</button>`:'—'}</td>
            <td><div class="ta-actions">
              ${!c.vencedor&&!fechada?`<button class="btn sm" onclick="cotSelecionar('${c.id}','${s.id}')" title="Selecionar vencedor" style="color:var(--green)">Selecionar</button>`:''}
              <button class="btn sm ico" onclick="openModalCotacao('${c.id}','${s.id}')" title="Editar"><svg class=ot-i><use href=#i-pencil></use></svg></button>
              <button class="btn sm ico" onclick="cotDel('${c.id}')" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
            </div></td>
          </tr>
          ${it.length?`<tr id="cot-it-${c.id}" style="display:none"><td colspan="8" style="background:var(--ot-surface-sunken);padding:8px 14px;height:auto">
            <table style="width:100%;font-size:12px;border-collapse:collapse">${it.map(i=>`<tr><td style="padding:3px 6px">${escHtml(i.desc)}</td><td style="padding:3px 6px;text-align:right;white-space:nowrap" class="ot-num">${i.qtd||''}</td><td style="padding:3px 6px;text-align:right;white-space:nowrap" class="ot-num">${i.unit?fmtR(i.unit):''}</td><td style="padding:3px 6px;text-align:right;white-space:nowrap" class="ot-num">${fmtR(i.total||0)}</td></tr>`).join('')}</table>
            ${c.obs?`<div style="font-size:12px;color:var(--txt3);margin-top:6px">Obs.: ${escHtml(c.obs)}</div>`:''}
          </td></tr>`:''}`;
        }).join('')}
      </table></div>`:`<div class="t-empty" style="margin-top:6px">Nenhum orcamento ainda. Clique em "+ Orcamento" e importe a foto ou PDF da loja.</div>`}
    </div>`;
  }).join('');
}
function cotToggleItens(id){const r=document.getElementById('cot-it-'+id);if(r)r.style.display=r.style.display==='none'?'':'none';}

// Nova cotação = uma compra (ex.: "Aço para estrutura") que vai receber orçamentos de várias lojas
function abrirNovaCotacao(){
  const obrasOpts=DB.obras.map(o=>`<option value="${o.id}"${String(DB.sel)===String(o.id)?' selected':''}>${escHtml(o.nome)}</option>`).join('');
  document.getElementById('modal-root').innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${ic('clipboard-list')} Nova cotacao</div><div class="mox" onclick="closeModal()">${ic('x')}</div></div><div class="mob">
    <div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">O que vai ser comprado? *</label><input class="inp" id="nc-desc" placeholder="Ex: Aco para estrutura, Material eletrico do 2o pavimento"></div>
      <div class="fg"><label class="lbl">Obra</label><select class="sel" id="nc-obra">${obrasOpts}</select></div>
      <div class="fg"><label class="lbl">Urgencia</label><select class="sel" id="nc-urg"><option value="normal">Normal</option><option value="urgente">Urgente</option><option value="critico">Critico</option></select></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observacoes</label><input class="inp" id="nc-obs" placeholder="Opcional"></div>
    </div>
  </div><div class="mof"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="salvarNovaCotacao()">Criar e adicionar orcamento</button></div></div></div>`;
  setTimeout(()=>document.getElementById('nc-desc')?.focus(),50);
}
function salvarNovaCotacao(){
  const item=document.getElementById('nc-desc').value.trim();
  if(!item){toast('⚠️','Descreva o que vai ser comprado.');return;}
  const id=uuidv4();
  const s={id,obraId:document.getElementById('nc-obra').value||null,item,unidade:'',quantidade:0,urgencia:document.getElementById('nc-urg').value,status:'cotando',solicitante:DB.user.nome||'',obs:document.getElementById('nc-obs').value.trim(),_supa:true};
  (DB.solicitacoes=DB.solicitacoes||[]).unshift(s);
  supaInsert('compras_solicitacoes',{id,obra_id:s.obraId,item,unidade:'',quantidade:0,urgencia:s.urgencia,status:'cotando',solicitante:s.solicitante,obs:s.obs});
  save();closeModal();comprasTab('cotacoes');openModalCotacao(null,id);
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
        <td style="font-size:11px">${p.previsaoEntrega||'—'}</td>
        <td>${STATUS_BADGE[p.status]||STATUS_BADGE.pendente}</td>
        <td><div class="ta-actions">
          ${p.status==='pendente'?`<button class="btn sm" onclick="pedMudarStatus('${p.id}','enviado')">Enviar</button>`:''}
          ${p.status==='enviado'?`<button class="btn sm" onclick="pedReceber('${p.id}')" style="color:var(--green)">Receber</button>`:''}
          <button class="btn sm" onclick="gerarOrdemCompraPDF('${p.id}')">PDF</button>
          ${p.status!=='recebido'?`<button class="btn sm ico" onclick="pedDel('${p.id}')"><svg class=ot-i><use href=#i-trash-2></use></svg></button>`:''}
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
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${title}</div><div class="mox" onclick="closeModal()"><svg class=ot-i><use href=#i-x></use></svg></div></div><div class="mob">
    <div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Item / descricao da compra *</label><input class="inp" id="sol-item" value="${s?.item||''}" placeholder="Ex: Cimento CP-II 50kg"></div>
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

// ── Orçamento de um fornecedor (valor global + itens como detalhe) ──
let _orc=null;
function openModalCotacao(editId, solId){
  const c=editId?(DB.cotacoes||[]).find(x=>x.id===editId):null;
  const sId=solId||c?.solicitacaoId||'';
  const sol=(DB.solicitacoes||[]).find(s=>s.id===sId);
  _orc={editId:editId||'',solId:sId,itens:JSON.parse(JSON.stringify(c?.detalhe?.itens||[])),texto:''};
  const fornOpts='<option value="">— Selecionar —</option>'+(DB.fornecedores||[]).map(f=>{const nome=typeof f==='object'?f.nome:f;return`<option${c?.fornecedor===nome?' selected':''}>${escHtml(nome)}</option>`;}).join('');
  const val=x=>Number(x)>0?x:'';
  document.getElementById('modal-root').innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo" style="width:820px;max-width:97vw"><div class="moh"><div class="mot">${c?'Editar orcamento':'Novo orcamento'}${sol?' — '+escHtml(sol.item):''}</div><div class="mox" onclick="closeModal()">${ic('x')}</div></div><div class="mob">
    <div style="border:1px dashed var(--ot-border-strong);border-radius:var(--ot-radius-md);padding:12px 14px;margin-bottom:14px;background:var(--ot-surface-sunken)">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <strong style="font-size:13px;margin-right:4px">Importar orcamento da loja:</strong>
        <label class="btn sm" style="cursor:pointer">${ic('camera')} Tirar foto<input type="file" accept="image/*" capture="environment" style="display:none" onchange="orcImportar(this.files[0]);this.value=''"></label>
        <label class="btn sm" style="cursor:pointer">${ic('image')} Imagem<input type="file" accept="image/*" style="display:none" onchange="orcImportar(this.files[0]);this.value=''"></label>
        <label class="btn sm" style="cursor:pointer">${ic('file-text')} PDF<input type="file" accept="application/pdf" style="display:none" onchange="orcImportar(this.files[0]);this.value=''"></label>
        <label class="btn sm" style="cursor:pointer">${ic('chart-column')} Planilha<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="orcImportar(this.files[0]);this.value=''"></label>
      </div>
      <div style="font-size:12px;color:var(--txt3);margin-top:6px">Os campos preenchidos pela leitura ficam em <span style="background:var(--ot-brand-soft);padding:0 4px;border-radius:4px">laranja</span>: confira antes de salvar.</div>
      <div id="cl-prog" style="display:none;margin-top:10px"></div>
    </div>
    <div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Fornecedor *</label><div style="display:flex;gap:6px"><select class="sel" id="cot-forn">${fornOpts}</select><button type="button" class="btn sm" onclick="orcNovoFornecedor()" title="Cadastrar fornecedor">${ic('plus')}</button></div></div>
      <div class="fg"><label class="lbl">Valor total do orcamento (R$) *</label><input type="number" class="inp ot-num" id="cot-vtotal" value="${val(c?.valorTotal)}" min="0" step="0.01" placeholder="0,00"></div>
      <div class="fg"><label class="lbl">Total a vista / PIX (R$)</label><input type="number" class="inp ot-num" id="cot-vpix" value="${val(c?.valorPix)}" min="0" step="0.01" placeholder="0,00"></div>
      <div class="fg"><label class="lbl">Total no cartao de credito (R$)</label><input type="number" class="inp ot-num" id="cot-vcartao" value="${val(c?.valorCartao)}" min="0" step="0.01" placeholder="0,00" oninput="_cotCalcParcela()"></div>
      <div class="fg"><label class="lbl">Parcelas sem juros</label><input type="number" class="inp ot-num" id="cot-parcelas" value="${val(c?.parcelas)}" min="1" max="48" step="1" placeholder="Ex: 10" oninput="_cotCalcParcela()"><div id="cot-parcela-info" style="font-size:12px;color:var(--txt3);min-height:16px"></div></div>
      <div class="fg"><label class="lbl">Desconto concedido (R$)</label><input type="number" class="inp ot-num" id="cot-desc" value="${val(c?.detalhe?.desconto)}" min="0" step="0.01" placeholder="0,00"></div>
      <div class="fg"><label class="lbl">Prazo de entrega</label><input class="inp" id="cot-prazo" value="${escHtml(c?.prazoEntrega||'')}" placeholder="Ex: 2 dias uteis"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observacoes</label><input class="inp" id="cot-obs" value="${escHtml(c?.obs||'')}" placeholder="Validade, frete, condicoes..."></div>
    </div>
    <div style="margin-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><strong style="font-size:14px">Itens do orcamento <span style="font-weight:400;color:var(--txt3);font-size:12px">(detalhe, opcional)</span></strong><button type="button" class="btn sm" onclick="_orc.itens.push({desc:'',qtd:'',unit:'',total:''});_orcRenderItens()">${ic('plus')} Item</button></div>
      <div id="orc-itens"></div>
    </div>
    <details id="cl-texto-box" style="margin-top:10px;display:none"><summary style="cursor:pointer;font-size:12px;color:var(--txt3)">Ver texto lido do orcamento</summary><pre id="cl-texto" style="white-space:pre-wrap;font-family:var(--ot-font-mono);font-size:11px;background:var(--ot-surface-sunken);padding:10px;border-radius:8px;max-height:200px;overflow:auto;margin-top:6px"></pre></details>
  </div><div class="mof"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="salvarCotacao()">${ic('save')} Salvar orcamento</button></div></div></div>`;
  _orcRenderItens();_cotCalcParcela();
}
function _orcRenderItens(){
  const el=document.getElementById('orc-itens');if(!el)return;
  if(!_orc.itens.length){el.innerHTML='<div style="font-size:12px;color:var(--txt3);padding:8px 0">Nenhum item. Importe o orcamento ou adicione manualmente (opcional).</div>';return;}
  const soma=_orc.itens.reduce((a,i)=>a+(Number(i.total)||0),0);
  el.innerHTML=`<div style="overflow-x:auto"><table class="tbl"><tr><th>Descricao</th><th style="width:110px;text-align:right">Qtd.</th><th style="width:120px;text-align:right">Unitario</th><th style="width:130px;text-align:right">Total</th><th style="width:40px"></th></tr>
    ${_orc.itens.map((i,k)=>`<tr>
      <td><input class="inp" style="min-height:34px" value="${escHtml(i.desc||'')}" oninput="_orc.itens[${k}].desc=this.value"></td>
      <td><input type="number" class="inp ot-num" style="min-height:34px;text-align:right" value="${i.qtd||''}" oninput="_orcItem(${k},'qtd',this.value)"></td>
      <td><input type="number" class="inp ot-num" style="min-height:34px;text-align:right" value="${i.unit||''}" step="0.01" oninput="_orcItem(${k},'unit',this.value)"></td>
      <td><input type="number" class="inp ot-num" style="min-height:34px;text-align:right" value="${i.total||''}" step="0.01" id="orc-it-t-${k}" oninput="_orcItem(${k},'total',this.value)"></td>
      <td><button type="button" class="btn sm ico" onclick="_orc.itens.splice(${k},1);_orcRenderItens()" title="Remover">${ic('x')}</button></td></tr>`).join('')}
    <tr><td colspan="3" style="text-align:right;font-weight:600;color:var(--txt)">Soma dos itens</td><td style="text-align:right;font-weight:600" class="ot-num" id="orc-soma">${fmtR(soma)}</td><td></td></tr></table></div>`;
}
function _orcItem(k,campo,v){
  const i=_orc.itens[k];i[campo]=v===''?'':Number(v);
  if((campo==='qtd'||campo==='unit')&&Number(i.qtd)&&Number(i.unit)){i.total=+(i.qtd*i.unit).toFixed(2);const t=document.getElementById('orc-it-t-'+k);if(t)t.value=i.total;}
  const s=document.getElementById('orc-soma');if(s)s.textContent=fmtR(_orc.itens.reduce((a,x)=>a+(Number(x.total)||0),0));
}
function orcNovoFornecedor(){
  const nome=(prompt('Nome do novo fornecedor:')||'').trim();if(!nome)return;
  if(!(DB.fornecedores||[]).some(f=>(typeof f==='object'?f.nome:f)===nome)){
    const id=uuidv4();(DB.fornecedores=DB.fornecedores||[]).push({id,nome,tipo:'Material'});
    supaInsert('fornecedores_cadastro',{id,nome,tipo:'Material'});save();
  }
  const sel=document.getElementById('cot-forn');sel.insertAdjacentHTML('beforeend',`<option>${escHtml(nome)}</option>`);sel.value=nome;
}
// Importa foto/PDF/planilha e preenche o orçamento (leitura gratuita no navegador)
async function orcImportar(file){
  if(!file)return;
  try{
    const nome=file.name.toLowerCase();let texto='',r;
    if(/\.(xlsx|xls|csv)$/.test(nome)){
      const p=_clLerPlanilha(await file.arrayBuffer());texto=p.texto;
      r=clParseOrcamento(texto);if(p.itens&&p.itens.length)r.itens=p.itens;
    }else if(file.type==='application/pdf'||nome.endsWith('.pdf')){texto=await _clLerPDF(file);r=clParseOrcamento(texto);}
    else{_clProgresso('Preparando imagem...',3);texto=await _clOCR(await _clPrepararImagem(file));r=clParseOrcamento(texto);}
    _clProgresso('');
    const box=document.getElementById('cl-texto-box');if(box){box.style.display='block';document.getElementById('cl-texto').textContent=texto;}
    const set=(id,v)=>{if(!v)return;const e=document.getElementById(id);if(e){e.value=+(+v).toFixed(2);e.style.background='var(--ot-brand-soft)';}};
    set('cot-vtotal',r.total);set('cot-vpix',r.pix);set('cot-vcartao',r.cartao);set('cot-parcelas',r.parcelas);set('cot-desc',r.desconto);
    if(r.prazo){const e=document.getElementById('cot-prazo');e.value=r.prazo;e.style.background='var(--ot-brand-soft)';}
    if(r.frete){const e=document.getElementById('cot-obs');if(!/frete/i.test(e.value)){e.value=(e.value?e.value+' · ':'')+'Frete '+fmtR(r.frete);e.style.background='var(--ot-brand-soft)';}}
    if(r.itens.length){_orc.itens=r.itens.map(i=>({desc:i.desc,qtd:i.qtd||'',unit:i.unit?+i.unit.toFixed(4):'',total:i.total||''}));_orcRenderItens();}
    _cotCalcParcela();
    // Tenta reconhecer o fornecedor pelo nome no texto
    const sel=document.getElementById('cot-forn');
    if(sel&&!sel.value){const tn=_clNorm(texto);const f=(DB.fornecedores||[]).map(f=>typeof f==='object'?f.nome:f).find(n=>n&&_clNorm(n).length>=3&&tn.includes(_clNorm(n)));if(f){sel.value=f;sel.style.background='var(--ot-brand-soft)';}}
    if(!r.total&&!r.itens.length) toast('⚠️','Nao consegui identificar valores. Confira o texto lido e preencha manualmente.');
    else toast('✅','Orcamento lido'+(r.total?': total '+fmtR(r.total):'')+(r.itens.length?' · '+r.itens.length+' itens':'')+'. Confira os campos em laranja.');
  }catch(e){console.error('Importar orcamento',e);_clProgresso('');toast('❌','Nao foi possivel ler o arquivo: '+(e.message||e));}
}
function _cotCalcParcela(){
  const v=parseFloat(document.getElementById('cot-vcartao')?.value)||0;
  const n=parseInt(document.getElementById('cot-parcelas')?.value)||0;
  const el=document.getElementById('cot-parcela-info');
  if(el) el.textContent=v>0&&n>1?n+'x de '+fmtR(v/n):'';
}
function salvarCotacao(){
  const editId=_orc.editId, solId=_orc.solId;
  const forn=document.getElementById('cot-forn').value;
  if(!forn){toast('⚠️','Selecione o fornecedor!');return;}
  const itens=_orc.itens.filter(i=>(i.desc||'').trim()||Number(i.total)).map(i=>({desc:(i.desc||'').trim(),qtd:Number(i.qtd)||0,unit:Number(i.unit)||0,total:Number(i.total)||0}));
  const somaItens=+itens.reduce((a,i)=>a+i.total,0).toFixed(2);
  let total=parseFloat(document.getElementById('cot-vtotal').value)||0;
  const desconto=parseFloat(document.getElementById('cot-desc').value)||0;
  if(!total&&somaItens) total=+(somaItens-desconto).toFixed(2);
  const dados={
    fornecedor:forn,
    valorUnit:itens.length===1?itens[0].unit:0,
    valorTotal:total,
    valorPix:parseFloat(document.getElementById('cot-vpix').value)||0,
    valorCartao:parseFloat(document.getElementById('cot-vcartao').value)||0,
    parcelas:parseInt(document.getElementById('cot-parcelas').value)||0,
    prazoEntrega:document.getElementById('cot-prazo').value.trim(),
    obs:document.getElementById('cot-obs').value.trim(),
    detalhe:(itens.length||desconto)?{itens,produtos:somaItens,desconto}:null,
  };
  if(!dados.valorTotal&&!dados.valorPix&&!dados.valorCartao){toast('⚠️','Informe o valor do orcamento (total, PIX ou cartao)!');return;}
  if(dados.parcelas>1&&!dados.valorCartao){toast('⚠️','Informe o total no cartao para usar parcelas.');return;}
  const row={fornecedor:dados.fornecedor,valor_unit:dados.valorUnit,valor_total:dados.valorTotal,valor_pix:dados.valorPix,valor_cartao:dados.valorCartao,parcelas:dados.parcelas||null,prazo_entrega:dados.prazoEntrega,obs:dados.obs,detalhe:dados.detalhe};
  if(editId){
    const c=(DB.cotacoes||[]).find(x=>x.id===editId);
    if(c){Object.assign(c,dados);_cotSupaSalvar(editId,row,false);}
  } else {
    const novoId=uuidv4();
    (DB.cotacoes=DB.cotacoes||[]).push({id:novoId,solicitacaoId:solId,...dados,vencedor:false,_supa:true});
    _cotSupaSalvar(novoId,{...row,solicitacao_id:solId,vencedor:false},true);
    const s=(DB.solicitacoes||[]).find(x=>x.id===solId);
    if(s&&s.status==='aberta'){s.status='cotando';supaUpdate('compras_solicitacoes',s.id,{status:'cotando'});}
  }
  save();closeModal();renderCotacoes();toast('✅',editId?'Orcamento atualizado!':'Orcamento de '+forn+' adicionado!');
}

// Salva no Supabase; se as colunas novas (PIX/cartao/parcelas) ainda nao existirem,
// salva o restante e avisa para rodar o SQL (sql/compras_cotacoes_pagamento.sql)
async function _cotSupaSalvar(id,row,novo){
  if(!supa||!_empresaId) return;
  const tentar=async r=>novo
    ? await supa.from('compras_cotacoes').insert({...r,id,empresa_id:_empresaId})
    : await supa.from('compras_cotacoes').update({...r,atualizado_em:new Date().toISOString()}).eq('id',id).eq('empresa_id',_empresaId);
  try{
    let {error}=await tentar(row);
    if(error&&/atualizado_em/.test(error.message||'')){({error}=await (novo?tentar(row):supa.from('compras_cotacoes').update(row).eq('id',id).eq('empresa_id',_empresaId)));}
    if(error&&/valor_pix|valor_cartao|parcelas|detalhe/.test(error.message||'')){
      const {valor_pix,valor_cartao,parcelas,detalhe,...base}=row;
      ({error}=await (novo?tentar(base):supa.from('compras_cotacoes').update(base).eq('id',id).eq('empresa_id',_empresaId)));
      toast('⚠️','Orcamento salvo, mas PIX/cartao/itens so ficam no banco apos rodar o SQL de atualizacao no Supabase.');
    }
    if(error){console.error('cotacao supa',error.message);toast('❌','Erro ao salvar cotacao: '+error.message.substring(0,70));}
  }catch(e){console.error('cotacao supa',e.message);}
}

// ═══════════════════════════════════════════
// PDFs
// ═══════════════════════════════════════════

function gerarMapaCotacaoPDF(solId){
  const sol=(DB.solicitacoes||[]).find(s=>s.id===solId);
  if(!sol){toast('⚠️','Solicitacao nao encontrada.');return;}
  const cots=(DB.cotacoes||[]).filter(c=>String(c.solicitacaoId)===String(solId));
  if(!cots.length){toast('⚠️','Nenhum orcamento registrado.');return;}
  const o=DB.obras.find(x=>String(x.id)===String(sol.obraId));
  const doc=new jsPDF();
  const W=doc.internal.pageSize.getWidth();
  const M=9;

  let y=pHdr(doc,'Mapa de Cotacao',sol.item+'  —  '+(o?.nome||''));
  y+=4;

  // Dados da compra
  y=pSec(doc,y,'Compra');
  doc.autoTable({
    startY:y,
    head:[['Descricao','Obra','Urgencia','Orcamentos']],
    body:[[sol.item+(sol.quantidade?' ('+sol.quantidade+' '+(sol.unidade||'')+')':''),o?.nome||'—',sol.urgencia||'normal',String(cots.length)]],
    headStyles:{fillColor:corEmpresa(),textColor:[255,255,255],fontStyle:'bold',fontSize:8,halign:'center',cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
    bodyStyles:{...bStyle(),halign:'center',cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Comparativo de valores globais
  y=pSec(doc,y,'Comparativo de Orcamentos');
  const ord=[...cots].sort((a,b)=>(_cotMelhor(a)||1e15)-(_cotMelhor(b)||1e15));
  const melhores=ord.map(_cotMelhor).filter(v=>v>0);
  const menorValor=melhores.length?Math.min(...melhores):0;
  const v=x=>Number(x)>0?fmtR(x):'—';
  doc.autoTable({
    startY:y,
    head:[['Fornecedor','Valor Total','A vista / PIX','No Cartao','Parcelas','Desconto','Prazo','Resultado']],
    body:ord.map(c=>{
      const parc=_cotParcela(c);
      return [c.fornecedor||'—',v(c.valorTotal),v(c.valorPix),v(c.valorCartao),
        c.parcelas>1?c.parcelas+'x'+(parc?' de '+fmtR(parc):''):(c.valorCartao?'1x':'—'),
        v(c.detalhe?.desconto),c.prazoEntrega||'—',
        c.vencedor?'VENCEDOR':(_cotMelhor(c)===menorValor&&menorValor>0&&cots.length>1?'Menor preco':'—')];
    }),
    headStyles:{fillColor:corEmpresa(),textColor:[255,255,255],fontStyle:'bold',fontSize:7,halign:'center',cellPadding:{top:1.8,bottom:1.8,left:2,right:2}},
    bodyStyles:{...bStyle(),fontSize:7,halign:'center',cellPadding:{top:1.8,bottom:1.8,left:2,right:2}},
    alternateRowStyles:altRow(),
    columnStyles:{0:{cellWidth:34,halign:'left'},1:{cellWidth:22},2:{cellWidth:22},3:{cellWidth:22},4:{cellWidth:24},5:{cellWidth:18},6:{cellWidth:24},7:{cellWidth:26}},
    didParseCell(d){
      if(d.section!=='body') return;
      const c=ord[d.row.index]; if(!c) return;
      if(d.column.index===7&&(d.cell.raw==='VENCEDOR'||d.cell.raw==='Menor preco')){d.cell.styles.textColor=[22,101,52];d.cell.styles.fontStyle='bold';}
      const val={1:c.valorTotal,2:c.valorPix,3:c.valorCartao}[d.column.index];
      if(val!==undefined&&Number(val)>0&&Number(val)===menorValor&&cots.length>1){d.cell.styles.textColor=[22,101,52];d.cell.styles.fontStyle='bold';}
    },
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Itens de cada orçamento (detalhe)
  ord.filter(c=>c.detalhe?.itens?.length||c.obs).forEach(c=>{
    if(y>235){doc.addPage();y=pHdr(doc,'Mapa de Cotacao',sol.item)+6;}
    y=pSec(doc,y,'Itens — '+(c.fornecedor||''));
    const it=c.detalhe?.itens||[];
    if(it.length){
      doc.autoTable({startY:y,head:[['Descricao','Qtd.','Unitario','Total']],
        body:it.map(i=>[i.desc,i.qtd||'—',i.unit?fmtR(i.unit):'—',fmtR(i.total||0)]),
        foot:[[{content:'Soma dos itens'+(c.detalhe.desconto?'  (desconto '+fmtR(c.detalhe.desconto)+')':''),colSpan:3,styles:{halign:'right'}},{content:fmtR(c.detalhe.produtos||it.reduce((a,i)=>a+(i.total||0),0))}]],
        headStyles:{fillColor:corEmpresa(),textColor:[255,255,255],fontStyle:'bold',fontSize:7.5,cellPadding:{top:1.5,bottom:1.5,left:3,right:3}},
        bodyStyles:{...bStyle(),fontSize:7.5,cellPadding:{top:1.5,bottom:1.5,left:3,right:3}},footStyles:{fillColor:[240,241,244],textColor:[30,30,30],fontStyle:'bold',fontSize:7.5,halign:'right'},
        columnStyles:{0:{cellWidth:102},1:{cellWidth:22,halign:'right'},2:{cellWidth:32,halign:'right'},3:{cellWidth:36,halign:'right'}},margin:{left:M,right:M}});
      y=doc.lastAutoTable.finalY+3;
    }
    if(c.obs){doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(90,90,90);doc.text('Obs.: '+String(c.obs).substring(0,140),M,y+3);y+=6;}
    y+=4;
  });
  y+=6;

  // Assinaturas
  if(y>262){doc.addPage();y=pHdr(doc,'Mapa de Cotacao',sol.item)+20;}
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

async function gerarOrdemCompraPDF(pedId){
  const p=(DB.pedidosCompra||[]).find(x=>x.id===pedId);
  if(!p){toast('⚠️','Pedido não encontrado.');return;}
  const sol=(DB.solicitacoes||[]).find(s=>String(s.id)===String(p.solicitacaoId));
  const o=DB.obras.find(x=>String(x.id)===String(p.obraId));
  const cot=(DB.cotacoes||[]).find(c=>String(c.solicitacaoId)===String(p.solicitacaoId)&&c.vencedor);
  const doc=new jsPDF();
  await _pdfUsarFontesMarca(doc);                 // Manrope + Tenor Sans, como no RDO (Helvetica se não carregar)
  const FS=doc.__fonte?'Manrope':'helvetica';
  const M=9;

  let y=pHdr(doc,'Ordem de Compra',(o?.nome||'')+'  —  '+(p.fornecedor||''));
  y+=4;

  // Dados do fornecedor
  y=pSec(doc,y,'Dados do Fornecedor');
  const fornObj=(DB.fornecedores||[]).find(f=>(typeof f==='object'?f.nome:f)===p.fornecedor);
  doc.autoTable({
    startY:y,
    styles:{font:FS},
    body:[
      ['Fornecedor',p.fornecedor||'—'],
      ['CNPJ',fornObj?.cnpj||'—'],
      ['Contato',fornObj?.contato||fornObj?.telefone||'—'],
      ['Previsão de Entrega',p.previsaoEntrega||'—'],
    ],
    bodyStyles:{...bStyle(),fontSize:8,cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
    columnStyles:{0:{cellWidth:50,fontStyle:'bold',textColor:corEmpresa(),halign:'center'},1:{cellWidth:142,halign:'center'}},
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Itens
  y=pSec(doc,y,'Itens do Pedido');
  doc.autoTable({
    startY:y,
    styles:{font:FS},
    head:[['Item','Unidade','Quantidade','Valor Unit.','Valor Total']],
    body:(cot?.detalhe?.itens?.length?cot.detalhe.itens.map(i=>[i.desc,'',i.qtd||'—',i.unit?fmtR(i.unit):'—',fmtR(i.total||0)]):[[sol?.item||'—',sol?.unidade||'un',sol?.quantidade||'—',fmtR(cot?.valorUnit||0),fmtR(p.valorTotal||0)]])
      .concat(cot?.detalhe?.desconto?[['Desconto','','','','- '+fmtR(cot.detalhe.desconto)]]:[]),
    foot:[[{colSpan:4,content:'TOTAL',styles:{halign:'right'}},{content:fmtR(p.valorTotal||0)}]],
    headStyles:{fillColor:corEmpresa(),textColor:[255,255,255],fontStyle:'bold',fontSize:8,halign:'center',cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
    bodyStyles:{...bStyle(),halign:'center',cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
    footStyles:totRow(),
    columnStyles:{0:{cellWidth:65,halign:'center'},1:{cellWidth:22,halign:'center'},2:{cellWidth:28,halign:'center'},3:{cellWidth:35,halign:'center'},4:{cellWidth:42,halign:'center',fontStyle:'bold'}},
    margin:{left:M,right:M},
  });
  y=doc.lastAutoTable.finalY+6;

  // Condicoes de pagamento cotadas pelo fornecedor vencedor
  if(cot&&(cot.valorPix||cot.valorCartao)){
    const linhas=[];
    if(cot.valorTotal) linhas.push(['Valor total cotado',fmtR(cot.valorTotal)]);
    if(cot.valorPix) linhas.push(['No PIX',fmtR(cot.valorPix)]);
    if(cot.valorCartao) linhas.push(['No cartão de crédito',fmtR(cot.valorCartao)+(cot.parcelas>1?'  ('+cot.parcelas+'x de '+fmtR(cot.valorCartao/cot.parcelas)+')':'')]);
    y=pSec(doc,y,'Condições de Pagamento');
    doc.autoTable({startY:y,body:linhas,styles:{font:FS},
      bodyStyles:{...bStyle(),cellPadding:{top:1.8,bottom:1.8,left:3,right:3}},
      columnStyles:{0:{cellWidth:50,fontStyle:'bold',textColor:corEmpresa(),halign:'center'},1:{cellWidth:142,halign:'center'}},
      margin:{left:M,right:M}});
    y=doc.lastAutoTable.finalY+6;
  }

  if(p.obs){
    y=pSec(doc,y,'Observações');
    doc.autoTable({startY:y,body:[[p.obs]],styles:{font:FS},bodyStyles:{...bStyle(),fontSize:8},margin:{left:M,right:M}});
    y=doc.lastAutoTable.finalY+6;
  }

  // Assinaturas
  y=Math.max(y+10,240);
  const W=doc.internal.pageSize.getWidth();
  const assinW=(W-M*2)/2;
  [['Comprador',DB.user.nome||''],['Fornecedor',p.fornecedor||'']].forEach((a,i)=>{
    const ax=M+i*assinW;
    doc.setDrawColor(150,150,150);doc.line(ax+4,y+8,ax+assinW-6,y+8);
    _pdfSans(doc,'bold');doc.setFontSize(7);doc.setTextColor(40,40,40);
    doc.text(a[0].toUpperCase(),ax+assinW/2,y+12,{align:'center'});
    _pdfSans(doc,'normal');doc.setFontSize(6.5);doc.setTextColor(100,100,100);
    doc.text(a[1],ax+assinW/2,y+16,{align:'center'});
  });

  pFtr(doc);
  doc.save('OC_'+(p.fornecedor||'pedido').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  toast('📄','Ordem de compra gerada!');
}
