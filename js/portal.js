// ════════════════════════════════════════════════
// PORTAL DO CLIENTE
// ════════════════════════════════════════════════

let _pcObraId = null;
let _pcObras = [];
let _pcDados = {};
let _pcTabAtiva = 'resumo';

// Cache dos dados do portal para evitar recargas desnecessárias
const _pcCache = {};

async function carregarDadosCliente(clienteId){
  if(!supa||!_empresaId) return;
  // Mostrar UI imediatamente
  const userEl=document.getElementById('pc-user-nome');
  if(userEl) userEl.textContent = DB.user.nome;
  try{
    // Paralelizar: permissões + empresa ao mesmo tempo
    const [permRes, empRes] = await Promise.all([
      supa.from('cliente_obras').select('obra_id').eq('cliente_id',clienteId).eq('empresa_id',_empresaId),
      supa.from('empresas').select('nome').eq('id',_empresaId).maybeSingle()
    ]);

    if(empRes.data) document.getElementById('pc-empresa-nome').textContent = empRes.data.nome;

    if(!permRes.data?.length){
      toast('ℹ️','Nenhuma obra liberada. Contate a construtora.');
      return;
    }

    const obraIds = permRes.data.map(p=>p.obra_id);
    const {data:obras} = await supa.from('obras').select('*').in('id',obraIds).eq('empresa_id',_empresaId);
    _pcObras = obras||[];

    const sel = document.getElementById('pc-obra-sel');
    sel.innerHTML = '<option value="">Selecionar obra...</option>' +
      _pcObras.map(o=>`<option value="${o.id}">${o.nome}</option>`).join('');

    // Auto-selecionar única obra ou primeira
    if(_pcObras.length>=1){
      sel.value = _pcObras[0].id;
      pcCarregarObra(_pcObras[0].id);
    }
  }catch(e){ console.error('carregarDadosCliente', e.message); }
}

async function pcCarregarObra(obraId){
  if(!obraId){
    _pcObraId=null;
    document.getElementById('pc-no-obra').style.display='block';
    document.getElementById('pc-main').style.display='none';
    return;
  }
  _pcObraId = obraId;
  document.getElementById('pc-no-obra').style.display='none';
  document.getElementById('pc-main').style.display='block';

  // Mostrar skeleton enquanto carrega
  document.getElementById('pc-main').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:12px;animation:pulse 1.5s infinite">
      ${[1,2,3].map(()=>`<div style="height:80px;background:var(--bg3);border-radius:10px;opacity:.6"></div>`).join('')}
    </div>`;

  // Verificar cache (válido por 60s)
  const cacheKey = obraId;
  const cached = _pcCache[cacheKey];
  if(cached && Date.now()-cached.ts < 60000){
    _pcDados = cached.dados;
    pcRenderTab(_pcTabAtiva);
    return;
  }

  const eid = _empresaId;
  try{
    // Todas as queries em paralelo — tempo total = tempo da mais lenta
    const [etapas,lancs,rdos,estoque,movs,ncs,contratos,pgtos,colabs] = await Promise.all([
      supa.from('etapas').select('id,nome,status,pct,inicio,fim,responsavel').eq('empresa_id',eid).eq('obra_id',obraId),
      supa.from('lancamentos').select('id,tipo,descricao,categoria,valor,data,fornecedor').eq('empresa_id',eid).eq('obra_id',obraId).order('data',{ascending:false}),
      supa.from('rdos').select('id,data,clima,previsto,realizado,servicos,materiais,obs,status').eq('empresa_id',eid).eq('obra_id',obraId).order('data',{ascending:false}),
      supa.from('estoque').select('id,material,unidade,estoque_min').eq('empresa_id',eid),
      supa.from('movimentacoes').select('id,estoque_id,tipo,quantidade').eq('empresa_id',eid).eq('obra_id',obraId),
      supa.from('nao_conformidades').select('id,numero,descricao,grau,prazo,status,etapa').eq('empresa_id',eid).eq('obra_id',obraId),
      supa.from('contratos').select('id,numero,descricao,fornecedor,valor,prazo').eq('empresa_id',eid).eq('obra_id',obraId),
      supa.from('pagamentos').select('id,contrato_id,valor,data').eq('empresa_id',eid).eq('obra_id',obraId),
      supa.from('colaboradores').select('id,nome,funcao').eq('empresa_id',eid),
    ]);

    _pcDados = {
      obra: _pcObras.find(o=>o.id===obraId),
      etapas: etapas.data||[], lancs: lancs.data||[], rdos: rdos.data||[],
      estoque: estoque.data||[], movs: movs.data||[], ncs: ncs.data||[],
      contratos: contratos.data||[], pgtos: pgtos.data||[], colabs: colabs.data||[]
    };

    // Salvar no cache
    _pcCache[cacheKey] = {dados:_pcDados, ts:Date.now()};

    pcRenderTab(_pcTabAtiva);
  }catch(e){
    console.error('pcCarregarObra', e.message);
    document.getElementById('pc-main').innerHTML=`<div class="al e">Erro ao carregar dados: ${e.message}</div>`;
  }
}

function pcTab(tab){
  _pcTabAtiva = tab;
  document.querySelectorAll('.pc-tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===tab));
  if(_pcObraId) pcRenderTab(tab);
}

function pcRenderTab(tab){
  const el = document.getElementById('pc-main');
  const d = _pcDados;
  const o = d.obra;
  if(!o){ el.innerHTML=''; return; }

  let html='';
  if(tab==='resumo') html = pcHtmlResumo(d,o);
  else if(tab==='cronograma') html = pcHtmlCronograma(d,o);
  else if(tab==='financeiro') html = pcHtmlFinanceiro(d,o);
  else if(tab==='rdo') html = pcHtmlRdo(d,o);
  else if(tab==='estoque') html = pcHtmlEstoque(d,o);
  else if(tab==='qualidade') html = pcHtmlQualidade(d,o);
  else if(tab==='equipe') html = pcHtmlEquipe(d,o);
  else if(tab==='contratos') html = pcHtmlContratos(d,o);

  // Botão PDF
  const btnPdf = PC_PDF_TABS[tab]
    ? `<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="btn sm pri" onclick="pcGerarPdf('${tab}')">📄 Exportar PDF</button>
       </div>`
    : '';
  el.innerHTML = btnPdf + html;
}

function pcFmtR(v){return'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});}
function pcFmtDt(d){if(!d)return'—';const[y,m,dd]=d.split('-');return`${dd}/${m}/${y}`;}
function pcPct(et){return et.length?Math.round(et.reduce((a,e)=>a+Number(e.pct||0),0)/et.length):0;}

// ═══════════════════════════════════════════════════════════
// PORTAL DO CLIENTE — usa as mesmas funções do sistema principal
// A diferença é apenas: dados injetados no DB + botões removidos após render
// ═══════════════════════════════════════════════════════════

function pcInjetarDados(d, obraId){
  // Injeta os dados da obra no DB global temporariamente
  // para que as funções de render originais funcionem
  DB.sel = obraId;

  // Mapear dados da API para o formato interno
  if(d.etapas)   DB.etapas   = d.etapas.map(r=>({id:r.id,obraId:obraId,nome:r.nome,status:r.status,pct:r.pct,resp:r.responsavel,inicio:r.inicio,fim:r.fim,sp:r.sp||0,wp:r.wp||0,_supa:true}));
  if(d.lancs)    DB.lancs    = d.lancs.map(r=>({id:r.id,obraId:obraId,tipo:r.tipo,desc:r.descricao||r.desc,cat:r.categoria||r.cat,cc:r.centro_custo||r.cc,valor:Number(r.valor||0),data:r.data,forn:r.fornecedor||r.forn,nf:r.nota_fiscal||r.nf,_supa:true}));
  if(d.rdos)     DB.rdos     = d.rdos.map(r=>({id:r.id,obraId:obraId,data:r.data,clima:r.clima,prev:r.previsto||r.prev,real:r.realizado||r.real,serv:r.servicos||r.serv,obs:r.obs,mat:r.materiais||r.mat,status:r.status,fotos:r.fotos||[],_supa:true}));
  if(d.estoque)  DB.estoque  = d.estoque.map(r=>({id:r.id,material:r.material,un:r.unidade,qtd:0,min:Number(r.estoque_min||0),preco:Number(r.preco||0),forn:r.fornecedor,_supa:true}));
  if(d.movs)     DB.movs     = d.movs.map(r=>({id:r.id,estId:r.estoque_id,obraId:obraId,tipo:r.tipo,qtd:Number(r.quantidade||0),data:r.data,_supa:true}));
  if(d.ncs)      DB.ncs      = d.ncs.map(r=>({id:r.id,numero:r.numero,obraId:obraId,etapa:r.etapa,desc:r.descricao||r.desc,grau:r.grau,prazo:r.prazo,resp:r.responsavel,status:r.status,acao:r.acao,_supa:true}));
  if(d.contratos)DB.contratos= d.contratos.map(r=>({id:r.id,obraId:obraId,numero:r.numero,descricao:r.descricao,forn:r.fornecedor,tipo:r.tipo,cat:r.categoria,cc:r.centro_custo,valor:Number(r.valor||0),assinatura:r.assinatura,prazo:r.prazo,obs:r.obs,_supa:true}));
  if(d.pgtos)    DB.pgtos    = d.pgtos.map(r=>({id:r.id,contratoId:r.contrato_id,obraId:obraId,data:r.data,valor:Number(r.valor||0),desc:r.descricao,nf:r.nota_fiscal,forn:r.fornecedor,tipo:r.tipo,cat:r.categoria,cc:r.centro_custo,_supa:true}));
  if(d.colabs)   DB.colabs   = d.colabs.map(r=>({id:r.id,nome:r.nome,funcao:r.funcao,cpf:r.cpf,admissao:r.admissao,diaria:Number(r.diaria||0),_supa:true}));

  // Garantir obras no DB
  if(d.obra && !DB.obras.find(o=>o.id===d.obra.id)){
    DB.obras = [d.obra];
  }
}

function pcRenderTab(tab){
  const el = document.getElementById('pc-main');
  const d = _pcDados;
  const o = d.obra;
  if(!o){ el.innerHTML=''; return; }

  // Injetar dados no DB global
  pcInjetarDados(d, o.id);

  // Criar container temporário
  const tmp = document.createElement('div');
  tmp.style.cssText='position:absolute;left:-9999px;top:0;width:1200px';
  document.body.appendChild(tmp);

  // Redirecionar renders para container temporário
  const origContent = document.getElementById('content');
  const fakeContent = document.createElement('div');
  fakeContent.id = 'content';
  fakeContent.style.cssText='padding:15px';

  // Criar páginas temporárias que as funções de render precisam
  const pageIds=['p-cronograma','p-rdo','p-financeiro','p-estoque','p-qualidade','p-contratos','p-equipe','p-dashboard'];
  const origPages={};
  pageIds.forEach(id=>{
    const orig=document.getElementById(id);
    if(orig){
      origPages[id]=orig;
      const fake=document.createElement('div');
      fake.id=id;
      fake.className='page on';
      tmp.appendChild(fake);
    }
  });

  // Renderizar conforme aba
  try{
    if(tab==='resumo'){
      pcRenderResumo(el, d, o);
    } else if(tab==='cronograma'){
      renderCron();
      const ganttArea=document.getElementById('gantt-area');
      const kpisArea=document.getElementById('cron-kpis');
      el.innerHTML=`
        <div class="kpis" style="margin-bottom:14px">${kpisArea?.innerHTML||''}</div>
        <div class="card" style="overflow-x:auto">${ganttArea?.innerHTML||''}</div>`;
    } else if(tab==='rdo'){
      renderRDO();
      const rdoForm=document.getElementById('p-rdo');
      // Mostrar apenas histórico
      el.innerHTML=`<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="ct">📋 RDOs da Obra</div>
          <button class="btn sm pri" onclick="pcExportarRDOPdf()">📄 Exportar PDF</button>
        </div>
        <div id="pc-rdo-hist-wrap"></div>
      </div>`;
      renderRDOHist();
      const hist=document.getElementById('rdo-hist');
      const wrap=document.getElementById('pc-rdo-hist-wrap');
      if(hist&&wrap) wrap.innerHTML=hist.innerHTML;
    } else if(tab==='financeiro'){
      renderFin();
      const kpis=document.getElementById('fin-kpis');
      const tbl=document.getElementById('lanc-tbl');
      const resumo=document.getElementById('fin-resumo');
      el.innerHTML=`
        <div class="kpis" style="margin-bottom:14px">${kpis?.innerHTML||''}</div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
          <div class="card" style="overflow-x:auto">${tbl?.innerHTML||''}</div>
          <div class="card">${resumo?.innerHTML||''}</div>
        </div>`;
    } else if(tab==='estoque'){
      // Forçar renderização do catálogo
      renderCatalogo();
      renderEstoqueSaldo();
      const kpis=document.getElementById('est-kpis-cat');
      const tbl=document.getElementById('est-tbl');
      const saldo=document.getElementById('est-saldo-cards');
      el.innerHTML=`
        <div class="kpis" style="margin-bottom:14px">${kpis?.innerHTML||''}</div>
        <div class="card" style="overflow-x:auto;margin-bottom:12px">
          <div class="ct" style="margin-bottom:10px">📋 Catálogo de Materiais</div>
          ${tbl?.innerHTML||'<div class="t-empty">Nenhum material.</div>'}
        </div>
        <div class="card" style="overflow-x:auto">
          <div class="ct" style="margin-bottom:10px">🏗️ Estoque por Obra</div>
          ${saldo?.innerHTML||''}
        </div>`;
    } else if(tab==='qualidade'){
      renderQual();
      const kpis=document.getElementById('qual-kpis');
      const tbl=document.getElementById('nc-tbl');
      el.innerHTML=`<div class="kpis" style="margin-bottom:14px">${kpis?.innerHTML||''}</div>
        <div class="card" style="overflow-x:auto">${tbl?.innerHTML||''}</div>`;
    } else if(tab==='contratos'){
      renderContratos();
      const kpis=document.getElementById('cont-kpis');
      const tbl=document.getElementById('cont-tbl');
      const pgtos=document.getElementById('cont-pgtos-tbl');
      el.innerHTML=`
        <div class="kpis" style="margin-bottom:14px">${kpis?.innerHTML||''}</div>
        <div class="card" style="overflow-x:auto;margin-bottom:12px">
          <div class="ct" style="margin-bottom:10px">📑 Contratos</div>
          ${tbl?.innerHTML||'<div class="t-empty">Nenhum contrato.</div>'}
        </div>
        <div class="card" style="overflow-x:auto">
          <div class="ct" style="margin-bottom:10px">💳 Pagamentos</div>
          ${pgtos?.innerHTML||''}
        </div>`;
    } else if(tab==='equipe'){
      pcRenderEquipe(el, d);
      return;
    }
  }catch(err){
    console.error('pcRenderTab erro:', err);
    el.innerHTML=`<div class="al e">Erro ao renderizar: ${err.message}</div>`;
  }

  // Restaurar páginas originais
  pageIds.forEach(id=>{
    if(origPages[id]){
      const fake=document.getElementById(id);
      if(fake&&fake!==origPages[id]) fake.remove();
    }
  });
  document.body.removeChild(tmp);

  // Adicionar botão PDF e bloquear edição
  const btnPdf = PC_PDF_TABS[tab]
    ? `<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="btn sm pri" onclick="pcGerarPdf('${tab}')">📄 Exportar PDF</button>
       </div>`
    : '';
  el.innerHTML = btnPdf + el.innerHTML;
  pcBloquearEdicao(el);
}

function pcBloquearEdicao(container){
  // Remove todos os botões de edição/criação
  container.querySelectorAll('.btn-new,.btn[onclick*="openModal"],.btn[onclick*="openMocModal"]').forEach(b=>b.remove());
  // Remover botões com ícones de edição
  container.querySelectorAll('button').forEach(b=>{
    const txt=b.textContent.trim();
    const onclick=b.getAttribute('onclick')||'';
    if(txt==='✏️'||txt==='🗑️'||txt==='＋ Novo'||txt==='＋'||
       onclick.includes('openModal')||onclick.includes('delete')||
       onclick.includes('del')||onclick.includes('salvar')||
       onclick.includes('editar')||onclick.includes('supaInsert')||
       onclick.includes('supaUpdate')||onclick.includes('supaDelete')){
      b.remove();
    }
  });
  // Desabilitar inputs e selects (exceto filtros do portal)
  container.querySelectorAll('input:not([type=text][readonly]),select').forEach(el=>{
    if(!el.closest('#pc-topbar')&&!el.id?.startsWith('pc-')){
      el.disabled=true;
      el.style.pointerEvents='none';
    }
  });
}

function pcRenderResumo(el, d, o){
  const pct=d.etapas.length?Math.round(d.etapas.reduce((a,e)=>a+Number(e.pct||0),0)/d.etapas.length):0;
  const rec=d.lancs.filter(l=>l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
  const dep=d.lancs.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
  const orc=Number(o.orcamento||0);
  const ncsAb=d.ncs.filter(n=>n.status!=='Fechada').length;
  const rdoHoje=d.rdos[0];
  el.innerHTML=`
  <div class="kpis" style="margin-bottom:16px">
    <div class="kpi"><div class="kl">⚡ Avanço Físico</div><div class="kv" style="color:var(--primary)">${pct}%</div><div class="kd neu">${d.etapas.length} etapas</div></div>
    <div class="kpi"><div class="kl">💰 Orçamento</div><div class="kv">${fmtR(orc)}</div><div class="kd ${dep>orc?'dn':'neu'}">${orc?Math.round(dep/orc*100):0}% usado</div></div>
    <div class="kpi"><div class="kl">💸 Despesas</div><div class="kv" style="color:var(--red)">${fmtR(dep)}</div><div class="kd dn">${d.lancs.filter(l=>l.tipo==='Despesa').length} lançamentos</div></div>
    <div class="kpi"><div class="kl">💰 Receitas</div><div class="kv" style="color:var(--green)">${fmtR(rec)}</div><div class="kd up">${d.lancs.filter(l=>l.tipo==='Receita').length} lançamentos</div></div>
    <div class="kpi"><div class="kl">✅ NCs Abertas</div><div class="kv" style="color:${ncsAb?'var(--red)':'var(--green)'}">${ncsAb}</div><div class="kd ${ncsAb?'dn':'up'}">${d.ncs.length} total</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="card">
      <div class="ct" style="margin-bottom:10px">📊 Informações da Obra</div>
      ${[['Nome',o.nome],['Tipo',o.tipo||'—'],['Local',o.local||o.local||'—'],['Responsável',o.responsavel||'—'],['Cliente',o.cliente||'—'],['Início',fmtDt(o.data_ini||o.dataIni)],['Prazo',fmtDt(o.data_fim||o.dataFim)]].map(([k,v])=>`
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px">
          <span style="color:var(--txt3)">${k}</span><span style="font-weight:500">${v||'—'}</span>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="ct" style="margin-bottom:10px">📅 Cronograma Rápido</div>
      ${d.etapas.slice(0,6).map(e=>{
        const pct=Number(e.pct||0);
        const cor=pct>=100?'var(--green)':e.status==='late'?'var(--red)':'var(--primary)';
        return`<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span>${e.nome}</span><span style="color:${cor};font-weight:600">${pct}%</span>
          </div>
          <div style="background:var(--bg3);border-radius:3px;height:5px">
            <div style="width:${pct}%;height:100%;background:${cor};border-radius:3px"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
  ${rdoHoje?`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div class="ct">📋 Último RDO — ${fmtDt(rdoHoje.data)}</div>
      <span class="b ${rdoHoje.status==='finalizado'?'bg':'by'}">${rdoHoje.status==='finalizado'?'✓ Finalizado':'Rascunho'}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">
      <div class="kpi"><div class="kl">☁️ Clima</div><div class="kv" style="font-size:16px">${rdoHoje.clima||'—'}</div></div>

      <div class="kpi"><div class="kl">✅ Realizado</div><div class="kv" style="font-size:16px;color:var(--green)">${rdoHoje.real||rdoHoje.realizado||0}</div></div>
    </div>
    ${rdoHoje.serv||rdoHoje.servicos?`<div style="font-size:12px;color:var(--txt2)">${rdoHoje.serv||rdoHoje.servicos}</div>`:''}
  </div>`:''}`;
}

function pcRenderEquipe(el, d){
  el.innerHTML=`<div class="card" style="overflow-x:auto">
    <div class="ct" style="margin-bottom:12px">👷 Equipe da Obra</div>
    <table class="tbl"><tr><th>Colaborador</th><th>Função</th></tr>
    ${d.colabs.map(c=>`<tr><td class="n">${c.nome}</td><td>${c.funcao||'—'}</td></tr>`).join('')}
    </table></div>`;
}

function pcExportarRDOPdf(){
  // Usar a função original de PDF do sistema
  const rdos=DB.rdos.filter(r=>r.obraId===_pcObraId&&r.status==='finalizado');
  if(!rdos.length){toast('⚠️','Nenhum RDO finalizado.');return;}
  // Gerar PDF para o primeiro RDO finalizado ou abrir seletor
  if(rdos.length===1){gerarRDOPDF(rdos[0]);return;}
  // Múltiplos RDOs: mostrar seletor
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:420px">
      <div class="moh"><div class="mot">📄 Selecionar RDO para PDF</div><div class="mox" onclick="closeModal()">✕</div></div>
      <div class="mob" style="max-height:400px;overflow-y:auto">
        ${rdos.map((r,i)=>`<div class="card" style="margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="closeModal();gerarRDOPDF(DB.rdos.find(x=>x.id==='${r.id}'))">
          <div>
            <div style="font-weight:600">${fmtDt(r.data)}</div>
            <div style="font-size:11px;color:var(--txt3)">${r.clima||'—'}</div>
          </div>
          <span class="b bg">📄 PDF</span>
        </div>`).join('')}
      </div>
      <div class="mof"><button class="btn" onclick="closeModal()">Fechar</button></div>
    </div></div>`;
}

const PC_PDF_TABS={resumo:'Resumo Geral',cronograma:'Cronograma',financeiro:'Financeiro',estoque:'Estoque',qualidade:'Qualidade',equipe:'Equipe',contratos:'Contratos'};

function pcGerarPdf(tab){
  // Usar funções de PDF originais do sistema quando disponível
  if(tab==='cronograma'){exportGanttPDF();return;}
  if(tab==='rdo'){pcExportarRDOPdf();return;}

  // Para outras abas usar jsPDF com dados do portal
  if(!window.jspdf?.jsPDF){toast('⚠️','PDF não disponível.');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const d=_pcDados; const o=d.obra; if(!o) return;
  const W=doc.internal.pageSize.getWidth();
  const MAR=14;
  const PRI=[91,143,249],GRY=[100,110,140],DARK=[30,36,58],LIGHT=[240,243,255];
  let y=MAR;

  // Cabeçalho padrão
  doc.setFillColor(...PRI);doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(14);
  doc.text('ObraTech — '+( PC_PDF_TABS[tab]||tab),MAR,11);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text(o.nome,MAR,18);
  doc.text('Emitido em: '+new Date().toLocaleDateString('pt-BR')+' '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),W-MAR,24,{align:'right'});
  y=36;

  function secTitle(txt){
    doc.setFillColor(...LIGHT);doc.rect(MAR-2,y-4,W-MAR*2+4,8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...PRI);
    doc.text(txt,MAR,y+1);doc.setTextColor(...DARK);y+=10;
  }
  function checkPage(h=10){if(y+h>280){doc.addPage();y=MAR;}}
  function tRow(cols,widths,isHeader){
    checkPage(8);
    if(isHeader){doc.setFillColor(...PRI);doc.rect(MAR,y-5,W-MAR*2,7,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');}
    else{doc.setFont('helvetica','normal');doc.setTextColor(...DARK);doc.setDrawColor(220,224,240);doc.line(MAR,y+2,W-MAR,y+2);}
    doc.setFontSize(8);
    let x=MAR;cols.forEach((c,i)=>{const w=widths[i]||30;doc.text(String(c||'—').substring(0,Math.floor(w/2)),x+1,y);x+=w;});
    y+=7;
  }

  doc.setTextColor(...DARK);

  if(tab==='resumo'){
    const pct=d.etapas.length?Math.round(d.etapas.reduce((a,e)=>a+Number(e.pct||0),0)/d.etapas.length):0;
    const rec=d.lancs.filter(l=>l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
    const dep=d.lancs.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
    secTitle('Informações da Obra');
    [['Nome',o.nome],['Local',o.local||'—'],['Responsável',o.responsavel||'—'],['Início',fmtDt(o.data_ini||o.dataIni)],['Prazo',fmtDt(o.data_fim||o.dataFim)],['Avanço',pct+'%'],['Orçamento',fmtR(Number(o.orcamento||0))],['Receitas',fmtR(rec)],['Despesas',fmtR(dep)],['Saldo',fmtR(rec-dep)]].forEach(([k,v])=>{checkPage(7);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...GRY);doc.text(k+':',MAR,y);doc.setFont('helvetica','normal');doc.setTextColor(...DARK);doc.text(String(v||'—'),MAR+40,y);y+=7;});
  }
  else if(tab==='financeiro'){
    const rec=d.lancs.filter(l=>l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
    const dep=d.lancs.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
    secTitle('Resumo Financeiro');
    [['Receitas',fmtR(rec)],['Despesas',fmtR(dep)],['Saldo',fmtR(rec-dep)]].forEach(([k,v])=>{checkPage(7);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...GRY);doc.text(k+':',MAR,y);doc.setFont('helvetica','normal');doc.setTextColor(...DARK);doc.text(v,MAR+36,y);y+=7;});
    y+=4;secTitle('Lançamentos');
    tRow(['DATA','DESCRIÇÃO','CATEGORIA','TIPO','VALOR'],[22,60,32,20,32],true);
    d.lancs.sort((a,b)=>(b.data||'').localeCompare(a.data||'')).forEach(l=>tRow([fmtDt(l.data),l.desc||l.descricao||'—',l.cat||l.categoria||'—',l.tipo,(l.tipo==='Despesa'?'-':'+')+fmtR(l.valor)],[22,60,32,20,32],false));
  }
  else if(tab==='qualidade'){
    secTitle('Não Conformidades');
    tRow(['Nº','DESCRIÇÃO','GRAU','PRAZO','STATUS'],[14,84,18,24,26],true);
    d.ncs.forEach((n,ni)=>tRow(['#'+(n.numero||String(ni+1).padStart(2,'0')),n.desc||n.descricao||'—',n.grau||'—',fmtDt(n.prazo),n.status],[14,84,18,24,26],false));
  }
  else if(tab==='estoque'){
    secTitle('Estoque');
    const sal={};d.movs.forEach(m=>{sal[m.estId||m.estoque_id]=(sal[m.estId||m.estoque_id]||0)+(m.tipo==='entrada'?m.qtd||m.quantidade:-m.qtd||m.quantidade);});
    tRow(['MATERIAL','UN.','SALDO','MÍN.','STATUS'],[80,14,18,18,36],true);
    d.estoque.forEach(e=>{const q=sal[e.id]||0;tRow([e.material,e.un||e.unidade||'—',String(q),String(e.min||e.estoque_min||0),q>=(e.min||e.estoque_min||0)?'OK':'Baixo'],[80,14,18,18,36],false);});
  }
  else if(tab==='equipe'){
    secTitle('Equipe');
    tRow(['COLABORADOR','FUNÇÃO'],[100,66],true);
    d.colabs.forEach(c=>tRow([c.nome,c.funcao||'—'],[100,66],false));
  }
  else if(tab==='contratos'){
    secTitle('Contratos');
    tRow(['Nº','DESCRIÇÃO','FORNECEDOR','VALOR','PAGO','STATUS'],[14,55,32,24,24,17],true);
    d.contratos.forEach(c=>{
      const pago=d.pgtos.filter(p=>(p.contratoId||p.contrato_id)===c.id).reduce((a,p)=>a+Number(p.valor||0),0);
      tRow([c.numero||'—',c.descricao||'—',c.forn||c.fornecedor||'—',fmtR(c.valor),fmtR(pago),pago>=Number(c.valor||0)&&Number(c.valor)>0?'Quitado':'Aberto'],[14,55,32,24,24,17],false);
    });
  }

  // Rodapé
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...GRY);doc.text('ObraTech — Portal do Cliente | '+o.nome,MAR,290);doc.text('Página '+i+'/'+pages,W-MAR,290,{align:'right'});}
  doc.save('ObraTech_'+(o.nome||'obra').replace(/[^a-zA-Z0-9]/g,'_')+'_'+(PC_PDF_TABS[tab]||tab).replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  toast('📄','PDF gerado!');
}

