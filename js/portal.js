// ════════════════════════════════════════════════
// PORTAL DO CLIENTE — visão do dono da obra (somente leitura)
// Layout próprio, pensado primeiro para celular.
// ════════════════════════════════════════════════

let _pcObraId = null;
let _pcObras = [];
let _pcDados = {};
let _pcTabAtiva = 'inicio';
const _pcCache = {};

const PC_TABS = [
  { id: 'inicio',     label: 'Início',     icon: 'layout-dashboard' },
  { id: 'etapas',     label: 'Etapas',     icon: 'calendar-range' },
  { id: 'diario',     label: 'Diário',     icon: 'clipboard-list' },
  { id: 'fotos',      label: 'Fotos',      icon: 'camera' },
  { id: 'financeiro', label: 'Financeiro', icon: 'wallet' },
];

const pcEsc = s => escHtml(s == null ? '' : String(s));
const pcDt = d => d ? fmtDt(String(d).slice(0, 10)) : '—';
function pcDiasAte(d) { if (!d) return null; const h = new Date(); h.setHours(0, 0, 0, 0); return Math.round((new Date(d + 'T12:00') - h) / 864e5); }
function pcFotoSrc(f) { return typeof f === 'string' ? f : (f && (f.url || f.data || f.src)) || ''; }

// ── Montagem da tela (abas no topo no computador; barra inferior no celular) ──
function _pcMontarNavegacao() {
  const tabs = PC_TABS.map(t => `<button class="pcx-tab${t.id === _pcTabAtiva ? ' on' : ''}" data-tab="${t.id}" onclick="pcTab('${t.id}')">${ic(t.icon)}<span>${t.label}</span></button>`).join('');
  const nav = document.getElementById('pc-nav'); if (nav) nav.innerHTML = tabs;
  const bot = document.getElementById('pc-bottom'); if (bot) bot.innerHTML = tabs;
}

async function carregarDadosCliente(clienteId) {
  _pcMontarNavegacao();
  const userEl = document.getElementById('pc-user-nome');
  if (userEl) userEl.textContent = (DB.user.nome || '').split(' ')[0];
  const av = document.getElementById('pc-avatar');
  if (av) av.textContent = (DB.user.nome || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  if (!supa || !_empresaId) return;
  try {
    const [permRes, empRes] = await Promise.all([
      supa.from('cliente_obras').select('obra_id').eq('cliente_id', clienteId).eq('empresa_id', _empresaId),
      supa.from('empresas').select('nome,logo_url').eq('id', _empresaId).maybeSingle()
    ]);
    if (empRes.data) {
      document.getElementById('pc-empresa-nome').textContent = empRes.data.nome || 'Construtora';
      const logo = document.getElementById('pc-logo');
      if (logo) logo.innerHTML = empRes.data.logo_url
        ? `<img src="${pcEsc(empRes.data.logo_url)}" alt="">`
        : pcEsc((empRes.data.nome || 'C').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase());
    }
    if (!permRes.data?.length) {
      _pcVazio('Nenhuma obra liberada para você ainda.', 'Fale com a construtora para liberar o acesso.');
      return;
    }
    const obraIds = permRes.data.map(p => p.obra_id);
    const { data: obras } = await supa.from('obras').select('*').in('id', obraIds).eq('empresa_id', _empresaId);
    _pcObras = (obras || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const sel = document.getElementById('pc-obra-sel');
    sel.innerHTML = _pcObras.map(o => `<option value="${o.id}">${pcEsc(o.nome)}</option>`).join('');
    document.getElementById('pc-obrabar').style.display = _pcObras.length > 1 ? '' : 'none';
    if (_pcObras.length) { sel.value = _pcObras[0].id; pcCarregarObra(_pcObras[0].id); }
  } catch (e) { console.error('carregarDadosCliente', e.message); _pcVazio('Não foi possível carregar seus dados.', 'Verifique sua conexão e tente novamente.'); }
}

function _pcVazio(titulo, sub) {
  document.getElementById('pc-main').innerHTML = `<div class="pcx-vazio">${ic('hard-hat')}<strong>${pcEsc(titulo)}</strong><span>${pcEsc(sub || '')}</span></div>`;
}

async function pcCarregarObra(obraId) {
  if (!obraId) return;
  _pcObraId = obraId;
  const main = document.getElementById('pc-main');
  main.innerHTML = `<div class="pcx-skel"><div></div><div></div><div></div></div>`;
  const c = _pcCache[obraId];
  if (c && Date.now() - c.ts < 60000) { _pcDados = c.dados; pcRenderTab(_pcTabAtiva); return; }
  const eid = _empresaId, q = t => supa.from(t);
  try {
    const [etapas, lancs, rdos, ncs, contratos, pgtos] = await Promise.all([
      q('etapas').select('id,nome,status,pct,inicio,fim,responsavel').eq('empresa_id', eid).eq('obra_id', obraId).order('inicio'),
      q('lancamentos').select('id,tipo,descricao,categoria,valor,data,fornecedor').eq('empresa_id', eid).eq('obra_id', obraId).order('data', { ascending: false }),
      q('rdos').select('*').eq('empresa_id', eid).eq('obra_id', obraId).order('data', { ascending: false }),
      q('nao_conformidades').select('id,numero,descricao,grau,prazo,status,etapa').eq('empresa_id', eid).eq('obra_id', obraId),
      q('contratos').select('id,numero,descricao,fornecedor,valor,prazo').eq('empresa_id', eid).eq('obra_id', obraId),
      q('pagamentos').select('id,contrato_id,valor,data').eq('empresa_id', eid).eq('obra_id', obraId),
    ]);
    _pcDados = {
      obra: _pcObras.find(o => o.id === obraId),
      etapas: etapas.data || [],
      lancs: (lancs.data || []).filter(l => l.tipo !== 'Receita'),
      rdos: (rdos.data || []).filter(r => r.status === 'finalizado' || !r.status),
      ncs: ncs.data || [], contratos: contratos.data || [], pgtos: pgtos.data || []
    };
    _pcCache[obraId] = { dados: _pcDados, ts: Date.now() };
    pcRenderTab(_pcTabAtiva);
  } catch (e) {
    console.error('pcCarregarObra', e.message);
    _pcVazio('Erro ao carregar a obra.', e.message);
  }
}

function pcTab(tab) {
  _pcTabAtiva = tab;
  document.querySelectorAll('.pcx-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  document.getElementById('pc-content')?.scrollTo({ top: 0 });
  if (_pcObraId) pcRenderTab(tab);
}

function _pcAvanco(et) { return et.length ? Math.round(et.reduce((a, e) => a + Number(e.pct || 0), 0) / et.length) : 0; }

function pcRenderTab(tab) {
  const el = document.getElementById('pc-main');
  const d = _pcDados, o = d.obra;
  if (!o) { el.innerHTML = ''; return; }
  try {
    const fn = { inicio: _pcInicio, etapas: _pcEtapas, diario: _pcDiario, fotos: _pcFotos, financeiro: _pcFinanceiro }[tab] || _pcInicio;
    el.innerHTML = fn(d, o);
  } catch (err) {
    console.error('pcRenderTab', err);
    el.innerHTML = `<div class="al e">Erro ao exibir: ${pcEsc(err.message)}</div>`;
  }
}

// ── Início ───────────────────────────────────────────────────
function _pcInicio(d, o) {
  const pct = _pcAvanco(d.etapas);
  const dias = pcDiasAte(o.data_fim);
  const orc = Number(o.orcamento || 0);
  const gasto = d.lancs.reduce((a, l) => a + Number(l.valor || 0), 0);
  const ult = d.rdos[0];
  const fotosUlt = ult ? (ult.fotos || []).map(pcFotoSrc).filter(Boolean) : [];
  const emAnd = d.etapas.filter(e => Number(e.pct || 0) > 0 && Number(e.pct || 0) < 100).slice(0, 3);
  const ncsAb = d.ncs.filter(n => n.status !== 'Fechada');
  const prazoTxt = dias == null ? 'Prazo não informado' : dias > 0 ? `${dias} dia${dias !== 1 ? 's' : ''} para a entrega` : dias === 0 ? 'Entrega prevista para hoje' : `${-dias} dia${dias !== -1 ? 's' : ''} após o prazo`;
  return `
  <section class="pcx-hero">
    <div class="pcx-hero-top">
      <div>
        <div class="ot-label">Sua obra</div>
        <h1>${pcEsc(o.nome)}</h1>
        ${o.local ? `<div class="pcx-muted">${ic('map-pin', 'sm')} ${pcEsc(o.local)}</div>` : ''}
      </div>
      <div class="pcx-ring" style="--p:${pct}"><span class="ot-num">${pct}%</span><small>concluída</small></div>
    </div>
    <div class="pcx-bar"><span style="width:${pct}%"></span></div>
    <div class="pcx-hero-meta">
      <div><span class="ot-label">Início</span><b class="ot-num">${pcDt(o.data_ini)}</b></div>
      <div><span class="ot-label">Entrega</span><b class="ot-num">${pcDt(o.data_fim)}</b></div>
      <div class="pcx-prazo ${dias != null && dias < 0 ? 'atr' : ''}">${ic('clock', 'sm')} ${prazoTxt}</div>
    </div>
  </section>

  <div class="pcx-grid2">
    <div class="pcx-mini"><span class="ot-label">Etapas concluídas</span><b class="ot-num">${d.etapas.filter(e => Number(e.pct || 0) >= 100).length}/${d.etapas.length}</b></div>
    <div class="pcx-mini"><span class="ot-label">Diários publicados</span><b class="ot-num">${d.rdos.length}</b></div>
    ${orc ? `<div class="pcx-mini"><span class="ot-label">Investido</span><b class="ot-num">${fmtR(gasto)}</b><small>${Math.round(gasto / orc * 100)}% do orçamento</small></div>` : ''}
    <div class="pcx-mini"><span class="ot-label">Pendências de qualidade</span><b class="ot-num" style="color:${ncsAb.length ? 'var(--ot-err)' : 'var(--ot-ok)'}">${ncsAb.length}</b></div>
  </div>

  ${ult ? `<section class="pcx-card">
    <div class="pcx-card-h"><h2>${ic('clipboard-list')} Último diário de obra</h2><button class="pcx-link" onclick="pcTab('diario')">Ver todos</button></div>
    <div class="pcx-rdo-meta"><b class="ot-num">${pcDt(ult.data)}</b>${ult.clima ? `<span class="pcx-chip">${climaIco(ult.clima)} ${pcEsc(ult.clima)}</span>` : ''}</div>
    ${ult.servicos ? `<p class="pcx-txt">${pcEsc(ult.servicos)}</p>` : '<p class="pcx-muted">Sem descrição de serviços.</p>'}
    ${fotosUlt.length ? `<div class="pcx-thumbs">${fotosUlt.slice(0, 4).map((s, i) => `<img src="${pcEsc(s)}" loading="lazy" onclick="pcAbrirFoto('${ult.id}',${i})" alt="">`).join('')}${fotosUlt.length > 4 ? `<button class="pcx-thumb-mais" onclick="pcAbrirFoto('${ult.id}',4)">+${fotosUlt.length - 4}</button>` : ''}</div>` : ''}
  </section>` : ''}

  ${emAnd.length ? `<section class="pcx-card">
    <div class="pcx-card-h"><h2>${ic('calendar-range')} Em andamento</h2><button class="pcx-link" onclick="pcTab('etapas')">Todas as etapas</button></div>
    ${emAnd.map(_pcEtapaLinha).join('')}
  </section>` : ''}

  ${ncsAb.length ? `<section class="pcx-card">
    <div class="pcx-card-h"><h2>${ic('triangle-alert')} Pendências de qualidade</h2></div>
    ${ncsAb.slice(0, 5).map(n => `<div class="pcx-item"><div><b>${pcEsc(n.descricao || '—')}</b><div class="pcx-muted">${pcEsc(n.etapa || '')}${n.prazo ? ' · prazo ' + pcDt(n.prazo) : ''}</div></div><span class="b ${n.grau === 'Alta' ? 'br' : n.grau === 'Média' ? 'by' : 'bn'}">${pcEsc(n.grau || n.status || '')}</span></div>`).join('')}
  </section>` : ''}

  <div class="pcx-acoes"><button class="btn" onclick="pcGerarPdf('resumo')">${ic('file-text')} Baixar resumo em PDF</button></div>`;
}

function _pcEtapaLinha(e) {
  const p = Math.min(100, Number(e.pct || 0));
  const fim = pcDiasAte(e.fim);
  const atras = p < 100 && fim != null && fim < 0;
  const st = p >= 100 ? ['Concluída', 'bg'] : atras ? ['Atrasada', 'br'] : p > 0 ? ['Em andamento', 'bb'] : ['Aguardando', 'bn'];
  return `<div class="pcx-etapa">
    <div class="pcx-etapa-h"><b>${pcEsc(e.nome)}</b><span class="b ${st[1]}">${st[0]}</span></div>
    <div class="pcx-bar sm"><span style="width:${p}%;${p >= 100 ? 'background:var(--ot-ok)' : atras ? 'background:var(--ot-err)' : ''}"></span></div>
    <div class="pcx-etapa-f"><span class="ot-num">${pcDt(e.inicio)} → ${pcDt(e.fim)}</span><span class="ot-num">${p}%</span></div>
  </div>`;
}

// ── Etapas ───────────────────────────────────────────────────
function _pcEtapas(d, o) {
  if (!d.etapas.length) return `<div class="pcx-vazio">${ic('calendar-range')}<strong>Cronograma ainda não publicado</strong></div>`;
  const pct = _pcAvanco(d.etapas);
  return `<section class="pcx-card">
    <div class="pcx-card-h"><h2>${ic('calendar-range')} Etapas da obra</h2><span class="ot-num pcx-big">${pct}%</span></div>
    <div class="pcx-bar"><span style="width:${pct}%"></span></div>
  </section>
  <section class="pcx-card">${d.etapas.map(_pcEtapaLinha).join('')}</section>
  <div class="pcx-acoes"><button class="btn" onclick="pcGerarPdf('etapas')">${ic('file-text')} Baixar cronograma em PDF</button></div>`;
}

// ── Diário de obra ───────────────────────────────────────────
function _pcDiario(d, o) {
  if (!d.rdos.length) return `<div class="pcx-vazio">${ic('clipboard-list')}<strong>Nenhum diário publicado ainda</strong><span>Os registros diários da obra aparecerão aqui.</span></div>`;
  return d.rdos.map(r => {
    const fotos = (r.fotos || []).map(pcFotoSrc).filter(Boolean);
    return `<article class="pcx-card pcx-rdo">
      <div class="pcx-card-h"><h2 class="ot-num">${pcDt(r.data)}</h2>${r.clima ? `<span class="pcx-chip">${climaIco(r.clima)} ${pcEsc(r.clima)}</span>` : ''}</div>
      ${r.servicos ? `<div class="pcx-sec"><span class="ot-label">Serviços executados</span><p class="pcx-txt">${pcEsc(r.servicos)}</p></div>` : ''}
      ${r.materiais ? `<div class="pcx-sec"><span class="ot-label">Materiais recebidos</span><p class="pcx-txt">${pcEsc(r.materiais)}</p></div>` : ''}
      ${r.obs ? `<div class="pcx-sec"><span class="ot-label">Ocorrências</span><p class="pcx-txt">${pcEsc(r.obs)}</p></div>` : ''}
      ${fotos.length ? `<div class="pcx-thumbs">${fotos.slice(0, 6).map((s, i) => `<img src="${pcEsc(s)}" loading="lazy" onclick="pcAbrirFoto('${r.id}',${i})" alt="">`).join('')}${fotos.length > 6 ? `<button class="pcx-thumb-mais" onclick="pcAbrirFoto('${r.id}',6)">+${fotos.length - 6}</button>` : ''}</div>` : ''}
      <div class="pcx-card-f"><button class="pcx-link" onclick="pcRdoPdf('${r.id}')">${ic('download', 'sm')} PDF deste dia</button></div>
    </article>`;
  }).join('');
}

// ── Fotos ────────────────────────────────────────────────────
function _pcFotos(d, o) {
  const grupos = d.rdos.map(r => ({ r, fotos: (r.fotos || []).map(pcFotoSrc).filter(Boolean) })).filter(g => g.fotos.length);
  if (!grupos.length) return `<div class="pcx-vazio">${ic('camera')}<strong>Nenhuma foto publicada ainda</strong><span>As fotos dos diários de obra aparecerão aqui.</span></div>`;
  return grupos.map(g => `<section class="pcx-fotos-dia">
    <div class="ot-label">${pcDt(g.r.data)}</div>
    <div class="pcx-galeria">${g.fotos.map((s, i) => `<img src="${pcEsc(s)}" loading="lazy" onclick="pcAbrirFoto('${g.r.id}',${i})" alt="">`).join('')}</div>
  </section>`).join('');
}

function pcAbrirFoto(rdoId, i) {
  const r = (_pcDados.rdos || []).find(x => String(x.id) === String(rdoId)); if (!r) return;
  const lista = (r.fotos || []).filter(f => pcFotoSrc(f));
  if (!lista.length) return;
  let k = Math.max(0, Math.min(i, lista.length - 1));
  const root = document.getElementById('modal-root');
  const draw = () => {
    const f = lista[k];
    root.innerHTML = `<div class="pcx-lightbox" onclick="if(event.target===this)closeModal()">
      <button class="pcx-lb-x" onclick="closeModal()" aria-label="Fechar">${ic('x')}</button>
      ${lista.length > 1 ? `<button class="pcx-lb-nav esq" onclick="window._pcLb(-1)" aria-label="Anterior">‹</button><button class="pcx-lb-nav dir" onclick="window._pcLb(1)" aria-label="Próxima">›</button>` : ''}
      <img src="${pcEsc(pcFotoSrc(f))}" alt="">
      <div class="pcx-lb-cap"><span class="ot-num">${pcDt(r.data)} · ${k + 1}/${lista.length}</span>${f.desc ? ' — ' + pcEsc(f.desc) : ''}</div>
    </div>`;
  };
  window._pcLb = s => { k = (k + s + lista.length) % lista.length; draw(); };
  draw();
}

// ── Financeiro ───────────────────────────────────────────────
function _pcFinanceiro(d, o) {
  const orc = Number(o.orcamento || 0);
  const gasto = d.lancs.reduce((a, l) => a + Number(l.valor || 0), 0);
  const saldo = orc - gasto;
  const p = orc ? Math.min(100, Math.round(gasto / orc * 100)) : 0;
  const cats = {};
  d.lancs.forEach(l => { const k = l.categoria || 'Outros'; cats[k] = (cats[k] || 0) + Number(l.valor || 0); });
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const pagoPor = id => d.pgtos.filter(x => x.contrato_id === id).reduce((a, x) => a + Number(x.valor || 0), 0);
  return `
  <section class="pcx-hero">
    <div class="ot-label">Investimento na obra</div>
    <div class="pcx-fin-big ot-num">${fmtR(gasto)}</div>
    ${orc ? `<div class="pcx-muted">de ${fmtR(orc)} orçados · <b>${p}%</b></div>
    <div class="pcx-bar"><span style="width:${p}%;${gasto > orc ? 'background:var(--ot-err)' : ''}"></span></div>
    <div class="pcx-muted" style="margin-top:6px">${saldo >= 0 ? 'Saldo do orçamento: <b class="ot-num">' + fmtR(saldo) + '</b>' : '<span style="color:var(--ot-err)">Acima do orçado em <b class="ot-num">' + fmtR(-saldo) + '</b></span>'}</div>` : ''}
  </section>

  ${catList.length ? `<section class="pcx-card"><div class="pcx-card-h"><h2>${ic('chart-pie')} Por categoria</h2></div>
    ${catList.map(([c, v]) => `<div class="pcx-cat"><div class="pcx-cat-h"><span>${pcEsc(c)}</span><b class="ot-num">${fmtR(v)}</b></div><div class="pcx-bar sm"><span style="width:${gasto ? Math.round(v / gasto * 100) : 0}%"></span></div></div>`).join('')}
  </section>` : ''}

  ${d.contratos.length ? `<section class="pcx-card"><div class="pcx-card-h"><h2>${ic('file-pen-line')} Contratos</h2></div>
    ${d.contratos.map(c => { const pg = pagoPor(c.id), v = Number(c.valor || 0); return `<div class="pcx-item"><div><b>${pcEsc(c.descricao || c.numero || 'Contrato')}</b><div class="pcx-muted">${pcEsc(c.fornecedor || '')}</div><div class="pcx-bar sm" style="margin-top:6px"><span style="width:${v ? Math.min(100, Math.round(pg / v * 100)) : 0}%"></span></div></div><div class="pcx-item-v"><b class="ot-num">${fmtR(v)}</b><small class="ot-num">pago ${fmtR(pg)}</small></div></div>`; }).join('')}
  </section>` : ''}

  <section class="pcx-card"><div class="pcx-card-h"><h2>${ic('receipt')} Lançamentos</h2><span class="pcx-muted">${d.lancs.length}</span></div>
    ${d.lancs.length ? d.lancs.slice(0, 60).map(l => `<div class="pcx-item"><div><b>${pcEsc(l.descricao || '—')}</b><div class="pcx-muted">${pcDt(l.data)}${l.categoria ? ' · ' + pcEsc(l.categoria) : ''}</div></div><b class="ot-num pcx-item-v">${fmtR(l.valor)}</b></div>`).join('')
      + (d.lancs.length > 60 ? `<div class="pcx-muted" style="padding-top:8px">Mostrando os 60 mais recentes. O PDF traz a lista completa.</div>` : '')
      : '<div class="pcx-muted">Nenhum lançamento.</div>'}
  </section>
  <div class="pcx-acoes"><button class="btn" onclick="pcGerarPdf('financeiro')">${ic('file-text')} Baixar financeiro em PDF</button></div>`;
}

// ── PDFs (mesma identidade dos relatórios do sistema) ───────
function pcRdoPdf(id) {
  const r = (_pcDados.rdos || []).find(x => String(x.id) === String(id)); if (!r) return;
  const o = _pcDados.obra;
  DB.obras = [{ id: o.id, nome: o.nome, local: o.local, resp: o.responsavel }];
  gerarRDOPDF({ id: r.id, obraId: o.id, data: r.data, clima: r.clima, serv: r.servicos, obs: r.obs, mat: r.materiais, status: r.status, fotos: r.fotos || [], autor: r.autor || '' });
}

function pcGerarPdf(tab) {
  const d = _pcDados, o = d.obra; if (!o) return;
  const doc = new jsPDF(); const M = 9;
  const tit = { resumo: 'Resumo da Obra', etapas: 'Cronograma da Obra', financeiro: 'Financeiro da Obra' }[tab] || 'Portal do Cliente';
  let y = pHdr(doc, tit, o.nome) + 4;
  const tbl = (head, body, cs) => { doc.autoTable({ startY: y, head: [head], body, theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(), columnStyles: cs || {}, margin: { left: M, right: M } }); y = doc.lastAutoTable.finalY + 8; };
  const gasto = d.lancs.reduce((a, l) => a + Number(l.valor || 0), 0), orc = Number(o.orcamento || 0);
  if (tab === 'resumo') {
    y = pSec(doc, y, 'Dados da obra');
    tbl(['Campo', 'Informação'], [['Obra', o.nome], ['Local', o.local || '—'], ['Início', pcDt(o.data_ini)], ['Entrega prevista', pcDt(o.data_fim)], ['Avanço físico', _pcAvanco(d.etapas) + '%'], ['Diários publicados', String(d.rdos.length)], ...(orc ? [['Orçamento', fmtR(orc)], ['Investido', fmtR(gasto)]] : [])], { 0: { cellWidth: 60, fontStyle: 'bold' } });
    if (d.etapas.length) { y = pSec(doc, y, 'Etapas'); tbl(['Etapa', 'Início', 'Fim', 'Avanço'], d.etapas.map(e => [e.nome, pcDt(e.inicio), pcDt(e.fim), (e.pct || 0) + '%']), { 3: { halign: 'center' } }); }
  } else if (tab === 'etapas') {
    y = pSec(doc, y, 'Etapas — avanço geral ' + _pcAvanco(d.etapas) + '%');
    tbl(['Etapa', 'Início', 'Fim', 'Avanço'], d.etapas.map(e => [e.nome, pcDt(e.inicio), pcDt(e.fim), (e.pct || 0) + '%']), { 3: { halign: 'center' } });
  } else if (tab === 'financeiro') {
    y = pSec(doc, y, 'Resumo');
    tbl(['Item', 'Valor'], [['Investido', fmtR(gasto)], ...(orc ? [['Orçamento', fmtR(orc)], ['Saldo do orçamento', fmtR(orc - gasto)]] : [])], { 1: { halign: 'right', fontStyle: 'bold' } });
    y = pSec(doc, y, 'Lançamentos');
    tbl(['Data', 'Descrição', 'Categoria', 'Valor'], d.lancs.map(l => [pcDt(l.data), l.descricao || '—', l.categoria || '—', fmtR(l.valor)]), { 0: { cellWidth: 24 }, 3: { halign: 'right', cellWidth: 32 } });
  }
  pFtr(doc);
  doc.save(tit.replace(/\s+/g, '_') + '_' + (o.nome || 'obra').replace(/[^a-zA-Z0-9]/g, '_') + '.pdf');
  toast('📄', 'PDF gerado!');
}
