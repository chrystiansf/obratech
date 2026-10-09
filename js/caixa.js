// ═══════════════════════════════════════════
// CAIXA — Fluxo de caixa com aportes de investidores
// Entradas = aportes (DB.aportes) | Saídas = despesas do Financeiro (somente leitura)
// Não altera nenhum relatório financeiro existente.
// ═══════════════════════════════════════════
let _cxInvFiltro = null;   // id do investidor filtrado (clique na participação)
let _cxTab = 'aportes';    // 'aportes' | 'extrato'
const CX_FORMAS = ['PIX', 'TED/DOC', 'Dinheiro', 'Boleto', 'Cheque', 'Outro'];

function _cxInvNome(id) { return (DB.investidores || []).find(i => String(i.id) === String(id))?.nome || '—'; }
function _cxObraNome(id) { return DB.obras.find(o => String(o.id) === String(id))?.nome || '—'; }

function _cxFiltros() {
  return {
    obra: document.getElementById('cx-obra')?.value || '',
    de: document.getElementById('cx-de')?.value || '',
    ate: document.getElementById('cx-ate')?.value || '',
  };
}
function _cxAportesFiltrados(ignorarInv) {
  const f = _cxFiltros();
  return (DB.aportes || []).filter(a => {
    if (f.obra && String(a.obraId) !== String(f.obra)) return false;
    if (f.de && _dataISO(a.data) < f.de) return false;
    if (f.ate && _dataISO(a.data) > f.ate) return false;
    if (!ignorarInv && _cxInvFiltro && String(a.investidorId) !== String(_cxInvFiltro)) return false;
    return true;
  });
}
function _cxDespesasFiltradas() {
  const f = _cxFiltros();
  return DB.lancs.filter(l => {
    if (l.tipo !== 'Despesa') return false;
    if (f.obra && String(l.obraId) !== String(f.obra)) return false;
    if (f.de && _dataISO(l.data) < f.de) return false;
    if (f.ate && _dataISO(l.data) > f.ate) return false;
    return true;
  });
}

function renderCaixa() {
  if (!DB.investidores) DB.investidores = [];
  if (!DB.aportes) DB.aportes = [];
  // Seletor de obras
  const sel = document.getElementById('cx-obra');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">Todas as obras</option>' + DB.obras.map(o => `<option value="${o.id}">${escHtml(o.nome)}</option>`).join('');
    sel.value = cur;
  }
  const todosAportes = _cxAportesFiltrados(true);
  const aportes = _cxAportesFiltrados(false);
  const despesas = _cxDespesasFiltradas();
  const totAp = todosAportes.reduce((s, a) => s + Number(a.valor || 0), 0);
  const totDesp = despesas.reduce((s, l) => s + Number(l.valor || 0), 0);
  const saldo = totAp - totDesp;
  const invComAporte = new Set(todosAportes.map(a => String(a.investidorId))).size;

  document.getElementById('cx-kpis').innerHTML = `
    <div class="kpi" onclick="cxFiltrarInvestidor(null)" style="cursor:pointer"><div class="kl"><svg class=ot-i><use href=#i-banknote></use></svg> Total Aportado</div><div class="kv" style="color:var(--green)">${fmtR(totAp)}</div><div class="kd up">${todosAportes.length} aporte${todosAportes.length !== 1 ? 's' : ''}</div></div>
    <div class="kpi" onclick="cxTab('extrato')" style="cursor:pointer"><div class="kl"><svg class=ot-i><use href=#i-receipt></use></svg> Saídas (Despesas)</div><div class="kv" style="color:var(--red)">${fmtR(totDesp)}</div><div class="kd dn">${despesas.length} lançamentos</div></div>
    <div class="kpi" onclick="cxTab('extrato')" style="cursor:pointer"><div class="kl"><svg class=ot-i><use href=#i-scale></use></svg> Saldo em Caixa</div><div class="kv" style="color:${saldo >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtR(saldo)}</div><div class="kd ${saldo >= 0 ? 'up' : 'dn'}">${saldo >= 0 ? 'Disponível' : 'Necessita aporte'}</div></div>
    <div class="kpi" onclick="cxAbrirInvestidores()" style="cursor:pointer"><div class="kl"><svg class=ot-i><use href=#i-handshake></use></svg> Investidores</div><div class="kv">${invComAporte}<span style="font-size:12px;color:var(--txt3);font-weight:400">/${DB.investidores.length}</span></div><div class="kd neu">com aportes / cadastrados</div></div>`;

  // Participação por investidor
  const porInv = {};
  todosAportes.forEach(a => { const k = String(a.investidorId || ''); porInv[k] = (porInv[k] || 0) + Number(a.valor || 0); });
  const lista = Object.entries(porInv).sort((a, b) => b[1] - a[1]);
  const partEl = document.getElementById('cx-participacao');
  partEl.innerHTML = lista.length ? lista.map(([id, v]) => {
    const pct = totAp > 0 ? v / totAp * 100 : 0;
    const on = _cxInvFiltro && String(_cxInvFiltro) === id;
    return `<div onclick="cxFiltrarInvestidor('${escHtml(id)}')" style="cursor:pointer;margin-bottom:9px;padding:6px 8px;border-radius:8px;${on ? 'outline:2px solid var(--primary);outline-offset:-2px;' : ''}" title="Clique para filtrar os aportes deste investidor">
      <div class="pl"><span style="font-size:12px;font-weight:600">${escHtml(_cxInvNome(id))}</span><span style="font-size:11px;font-weight:700">${fmtR(v)} · ${pct.toFixed(1)}%</span></div>
      <div class="pw"><div class="pb" style="width:${pct.toFixed(1)}%;background:var(--primary)"></div></div>
    </div>`;
  }).join('') : '<div class="t-empty" style="padding:16px">Nenhum aporte registrado.</div>';

  // Abas
  document.querySelectorAll('#p-caixa .cx-tab').forEach(t => t.classList.toggle('on', t.dataset.t === _cxTab));
  document.getElementById('cx-aportes').style.display = _cxTab === 'aportes' ? '' : 'none';
  document.getElementById('cx-extrato').style.display = _cxTab === 'extrato' ? '' : 'none';
  if (_cxTab === 'aportes') _cxRenderAportes(aportes); else _cxRenderExtrato(todosAportes, despesas);

  // Gráfico mensal: aportes x despesas + saldo acumulado
  setTimeout(() => {
    const ms = meses6();
    const noMes = (d, m) => { const dt = new Date(d + 'T12:00'); return dt.getMonth() === m.m && dt.getFullYear() === m.y; };
    const ent = ms.map(m => todosAportes.filter(a => a.data && noMes(a.data, m)).reduce((s, a) => s + Number(a.valor || 0), 0));
    const sai = ms.map(m => despesas.filter(l => l.data && noMes(l.data, m)).reduce((s, l) => s + Number(l.valor || 0), 0));
    // saldo acumulado considera tudo antes da janela também
    const iniJanela = ms[0].y + '-' + String(ms[0].m + 1).padStart(2, '0') + '-01';
    let acc = todosAportes.filter(a => a.data && a.data < iniJanela).reduce((s, a) => s + Number(a.valor || 0), 0)
            - despesas.filter(l => l.data && l.data < iniJanela).reduce((s, l) => s + Number(l.valor || 0), 0);
    const saldoAcum = ms.map((_, i) => (acc += ent[i] - sai[i]));
    mkChart('ch-cx-fluxo', { type: 'bar', data: { labels: ms.map(m => m.l), datasets: [
      { label: 'Aportes', data: ent, backgroundColor: CP.grnA, borderColor: CP.grn, borderWidth: 2, borderRadius: 3, order: 2 },
      { label: 'Despesas', data: sai, backgroundColor: CP.redA, borderColor: CP.red, borderWidth: 2, borderRadius: 3, order: 2 },
      { label: 'Saldo acumulado', data: saldoAcum, type: 'line', borderColor: CP.pri, backgroundColor: CP.priA, tension: .35, pointRadius: 3, order: 1 },
    ] }, options: BO });
  }, 50);
}

function _cxRenderAportes(aportes) {
  const el = document.getElementById('cx-aportes');
  const chip = _cxInvFiltro ? `<div style="margin-bottom:10px"><span class="b bn" style="cursor:pointer" onclick="cxFiltrarInvestidor(null)"><svg class=ot-i><use href=#i-handshake></use></svg> ${escHtml(_cxInvNome(_cxInvFiltro))} <svg class=ot-i><use href=#i-x></use></svg></span></div>` : '';
  if (!aportes.length) {
    el.innerHTML = chip + '<div class="t-empty">Nenhum aporte encontrado. <button class="btn pri sm" onclick="cxAbrirAporte()" style="margin-left:8px">＋ Registrar aporte</button></div>';
    return;
  }
  const tot = aportes.reduce((s, a) => s + Number(a.valor || 0), 0);
  el.innerHTML = chip + `<div style="overflow-x:auto"><table class="tbl">
    <tr><th>Data</th><th>Investidor</th><th>Obra</th><th>Forma</th><th>Descrição</th><th style="text-align:right">Valor</th><th></th></tr>` +
    [...aportes].sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))).map(a => `<tr>
      <td style="white-space:nowrap">${fmtDt(a.data)}</td>
      <td style="font-weight:600">${escHtml(_cxInvNome(a.investidorId))}</td>
      <td style="font-size:11px">${escHtml(_cxObraNome(a.obraId))}</td>
      <td><span class="b bn" style="font-size:10px">${escHtml(a.forma || '—')}</span></td>
      <td style="font-size:11px;color:var(--txt3)">${escHtml(a.desc || '—')}</td>
      <td style="text-align:right;font-weight:700;color:var(--green);white-space:nowrap">${fmtR(a.valor)}</td>
      <td><div class="ta-actions">
        <button class="btn sm ico" onclick="cxAbrirAporte('${escHtml(a.id)}')" title="Editar"><svg class=ot-i><use href=#i-pencil></use></svg></button>
        <button class="btn sm ico" onclick="cxExcluirAporte('${escHtml(a.id)}')" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
      </div></td>
    </tr>`).join('') +
    `<tr style="font-weight:700;background:var(--bg3)"><td colspan="5">TOTAL</td><td style="text-align:right;color:var(--green)">${fmtR(tot)}</td><td></td></tr></table></div>`;
}

function _cxMovimentos(aportes, despesas) {
  const movs = [
    ...aportes.map(a => ({ data: a.data || '', tipo: 'Entrada', desc: 'Aporte — ' + _cxInvNome(a.investidorId) + (a.desc ? ' (' + a.desc + ')' : ''), obra: _cxObraNome(a.obraId), valor: Number(a.valor || 0) })),
    ...despesas.map(l => ({ data: l.data || '', tipo: 'Saída', desc: l.desc || '—', obra: _cxObraNome(l.obraId), valor: -Number(l.valor || 0) })),
  ].sort((a, b) => a.data.localeCompare(b.data) || (b.valor - a.valor));
  let s = 0;
  movs.forEach(m => { s += m.valor; m.saldo = s; });
  return movs;
}

function _cxRenderExtrato(aportes, despesas) {
  const el = document.getElementById('cx-extrato');
  const movs = _cxMovimentos(aportes, despesas);
  if (!movs.length) { el.innerHTML = '<div class="t-empty">Sem movimentações no período.</div>'; return; }
  el.innerHTML = `<div style="overflow-x:auto"><table class="tbl">
    <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Obra</th><th style="text-align:right">Valor</th><th style="text-align:right">Saldo</th></tr>` +
    [...movs].reverse().map(m => `<tr>
      <td style="white-space:nowrap">${fmtDt(m.data)}</td>
      <td><span class="b ${m.valor >= 0 ? 'bg' : 'br'}" style="font-size:10px">${m.tipo}</span></td>
      <td style="font-size:12px">${escHtml(m.desc)}</td>
      <td style="font-size:11px">${escHtml(m.obra)}</td>
      <td style="text-align:right;font-weight:600;white-space:nowrap;color:${m.valor >= 0 ? 'var(--green)' : 'var(--red)'}">${m.valor >= 0 ? '+' : '−'} ${fmtR(Math.abs(m.valor))}</td>
      <td style="text-align:right;font-weight:700;white-space:nowrap;color:${m.saldo >= 0 ? 'var(--txt)' : 'var(--red)'}">${fmtR(m.saldo)}</td>
    </tr>`).join('') + '</table></div>';
}

function cxTab(t) { _cxTab = t; renderCaixa(); }
function cxFiltrarInvestidor(id) {
  _cxInvFiltro = (!id || String(_cxInvFiltro) === String(id)) ? null : id;
  _cxTab = 'aportes';
  renderCaixa();
}
function cxLimparFiltros() {
  ['cx-obra', 'cx-de', 'cx-ate'].forEach(i => { const e = document.getElementById(i); if (e) e.value = ''; });
  _cxInvFiltro = null; renderCaixa();
}

// ── Modal: Aporte ─────────────────────────────────────────────
function _cxModal(title, body, onSave, saveLabel) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${title}</div><div class="mox" onclick="closeModal()"><svg class=ot-i><use href=#i-x></use></svg></div></div><div class="mob">${body}</div><div class="mof"><button class="btn" onclick="closeModal()">${onSave ? 'Cancelar' : 'Fechar'}</button>${onSave ? `<button class="btn pri" onclick="if(window._mSave&&window._mSave())closeModal()">${saveLabel || '<svg class=ot-i><use href=#i-circle-check></use></svg> Salvar'}</button>` : ''}</div></div></div>`;
  window._mSave = onSave;
}

function cxAbrirAporte(editId) {
  const a = editId ? (DB.aportes || []).find(x => String(x.id) === String(editId)) : null;
  const obraPadrao = a?.obraId || document.getElementById('cx-obra')?.value || DB.sel || '';
  const invOpts = '<option value="">— Selecionar —</option>' + (DB.investidores || []).slice().sort((x, y) => (x.nome || '').localeCompare(y.nome || ''))
    .map(i => `<option value="${escHtml(i.id)}"${String(a?.investidorId || _cxInvFiltro || '') === String(i.id) ? ' selected' : ''}>${escHtml(i.nome)}</option>`).join('');
  const obraOpts = '<option value="">— Selecionar —</option>' + DB.obras.map(o => `<option value="${o.id}"${String(obraPadrao) === String(o.id) ? ' selected' : ''}>${escHtml(o.nome)}</option>`).join('');
  const formaOpts = CX_FORMAS.map(f => `<option${(a?.forma || 'PIX') === f ? ' selected' : ''}>${f}</option>`).join('');
  const body = `<div class="g g2">
    <div class="fg" style="grid-column:span 2"><label class="lbl">Investidor *
      <button type="button" onclick="cxNovoInvestidorInline()" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ novo</button></label>
      <select class="sel" id="ap-inv">${invOpts}</select>
      <div id="ap-inv-novo" style="display:none;margin-top:6px;gap:6px">
        <input class="inp" id="ap-inv-nome" placeholder="Nome do novo investidor" style="flex:1">
        <button type="button" class="btn sm pri" onclick="cxSalvarInvestidorInline()">Adicionar</button>
      </div>
    </div>
    <div class="fg" style="grid-column:span 2"><label class="lbl">Obra *</label><select class="sel" id="ap-obra">${obraOpts}</select></div>
    <div class="fg"><label class="lbl">Data *</label><input type="date" class="inp" id="ap-data" value="${a?.data || hojeISO()}"></div>
    <div class="fg"><label class="lbl">Valor (R$) *</label><input type="number" class="inp" id="ap-valor" min="0" step="0.01" value="${a?.valor || ''}" placeholder="0,00"></div>
    <div class="fg"><label class="lbl">Forma</label><select class="sel" id="ap-forma">${formaOpts}</select></div>
    <div class="fg"><label class="lbl">Descrição</label><input class="inp" id="ap-desc" value="${escHtml(a?.desc || '')}" placeholder="Ex: 1ª parcela"></div>
  </div>`;
  _cxModal(a ? '<svg class=ot-i><use href=#i-pencil></use></svg> Editar Aporte' : '<svg class=ot-i><use href=#i-banknote></use></svg> Novo Aporte', body, () => {
    const dados = {
      investidorId: document.getElementById('ap-inv').value,
      obraId: document.getElementById('ap-obra').value,
      data: document.getElementById('ap-data').value,
      valor: Number(document.getElementById('ap-valor').value || 0),
      forma: document.getElementById('ap-forma').value,
      desc: document.getElementById('ap-desc').value.trim(),
    };
    if (!dados.investidorId) { toast('⚠️', 'Selecione o investidor!'); return false; }
    if (!dados.obraId) { toast('⚠️', 'Selecione a obra!'); return false; }
    if (!dados.data) { toast('⚠️', 'Informe a data!'); return false; }
    if (!(dados.valor > 0)) { toast('⚠️', 'Informe um valor maior que zero!'); return false; }
    const row = { investidor_id: dados.investidorId, obra_id: dados.obraId, data: dados.data, valor: dados.valor, forma: dados.forma, descricao: dados.desc };
    if (a) {
      Object.assign(a, dados);
      supaUpdate('aportes', a.id, row);
    } else {
      const id = uuidv4();
      DB.aportes.push({ id, ...dados, _supa: true });
      supaInsert('aportes', { id, ...row });
    }
    save(); renderCaixa(); toast('✅', a ? 'Aporte atualizado!' : 'Aporte registrado!');
    return true;
  });
}

function cxExcluirAporte(id) {
  const i = (DB.aportes || []).findIndex(x => String(x.id) === String(id));
  if (i < 0) return;
  const a = DB.aportes[i];
  if (!confirm('Excluir o aporte de ' + fmtR(a.valor) + ' de ' + _cxInvNome(a.investidorId) + '?')) return;
  DB.aportes.splice(i, 1);
  try { supaDelete('aportes', id); } catch (e) {}
  save(); renderCaixa(); toast('🗑️', 'Aporte excluído.');
}

function cxNovoInvestidorInline() {
  const box = document.getElementById('ap-inv-novo');
  if (box) { box.style.display = 'flex'; document.getElementById('ap-inv-nome')?.focus(); }
}
function cxSalvarInvestidorInline() {
  const nome = document.getElementById('ap-inv-nome')?.value.trim();
  if (!nome) { toast('⚠️', 'Informe o nome!'); return; }
  const inv = _cxCriarInvestidor({ nome });
  const sel = document.getElementById('ap-inv');
  if (sel) { sel.insertAdjacentHTML('beforeend', `<option value="${escHtml(inv.id)}">${escHtml(nome)}</option>`); sel.value = inv.id; }
  document.getElementById('ap-inv-novo').style.display = 'none';
  toast('✅', 'Investidor cadastrado!');
}

// ── Investidores ──────────────────────────────────────────────
function _cxCriarInvestidor(d) {
  if (!DB.investidores) DB.investidores = [];
  const id = uuidv4();
  const inv = { id, nome: d.nome, documento: d.documento || '', telefone: d.telefone || '', email: d.email || '', obs: d.obs || '', _supa: true };
  DB.investidores.push(inv);
  supaInsert('investidores', { id, nome: inv.nome, documento: inv.documento, telefone: inv.telefone, email: inv.email, obs: inv.obs });
  save();
  return inv;
}

function cxAbrirInvestidores() {
  const invs = (DB.investidores || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  const totGeral = (DB.aportes || []).reduce((s, a) => s + Number(a.valor || 0), 0);
  const linhas = invs.map(i => {
    const ap = (DB.aportes || []).filter(a => String(a.investidorId) === String(i.id));
    const v = ap.reduce((s, a) => s + Number(a.valor || 0), 0);
    return `<tr>
      <td><div style="font-weight:600">${escHtml(i.nome)}</div><div style="font-size:10px;color:var(--txt3)">${escHtml([i.documento, i.telefone, i.email].filter(Boolean).join(' · ') || '—')}</div></td>
      <td style="text-align:center">${ap.length}</td>
      <td style="text-align:right;font-weight:700;white-space:nowrap">${fmtR(v)}</td>
      <td style="text-align:center">${totGeral > 0 ? (v / totGeral * 100).toFixed(1) + '%' : '—'}</td>
      <td><div class="ta-actions">
        <button class="btn sm ico" onclick="cxEditarInvestidor('${escHtml(i.id)}')" title="Editar"><svg class=ot-i><use href=#i-pencil></use></svg></button>
        <button class="btn sm ico" onclick="cxExcluirInvestidor('${escHtml(i.id)}')" title="Excluir"><svg class=ot-i><use href=#i-trash-2></use></svg></button>
      </div></td></tr>`;
  }).join('');
  const body = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn sm pri" onclick="cxEditarInvestidor()">＋ Novo investidor</button></div>
    ${invs.length ? `<div style="overflow-x:auto"><table class="tbl"><tr><th>Investidor</th><th style="text-align:center">Aportes</th><th style="text-align:right">Total</th><th style="text-align:center">Part.</th><th></th></tr>${linhas}</table></div>`
      : '<div class="t-empty">Nenhum investidor cadastrado.</div>'}`;
  _cxModal('<svg class=ot-i><use href=#i-handshake></use></svg> Investidores', body, null);
}

function cxEditarInvestidor(id) {
  const i = id ? (DB.investidores || []).find(x => String(x.id) === String(id)) : null;
  const body = `<div class="g g2">
    <div class="fg" style="grid-column:span 2"><label class="lbl">Nome *</label><input class="inp" id="inv-nome" value="${escHtml(i?.nome || '')}" placeholder="Nome completo ou razão social"></div>
    <div class="fg"><label class="lbl">CPF / CNPJ</label><input class="inp" id="inv-doc" value="${escHtml(i?.documento || '')}"></div>
    <div class="fg"><label class="lbl">Telefone</label><input class="inp" id="inv-tel" value="${escHtml(i?.telefone || '')}"></div>
    <div class="fg" style="grid-column:span 2"><label class="lbl">E-mail</label><input class="inp" id="inv-email" value="${escHtml(i?.email || '')}"></div>
    <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label><input class="inp" id="inv-obs" value="${escHtml(i?.obs || '')}"></div>
  </div>`;
  _cxModal(i ? '<svg class=ot-i><use href=#i-pencil></use></svg> Editar Investidor' : '<svg class=ot-i><use href=#i-handshake></use></svg> Novo Investidor', body, () => {
    const d = {
      nome: document.getElementById('inv-nome').value.trim(),
      documento: document.getElementById('inv-doc').value.trim(),
      telefone: document.getElementById('inv-tel').value.trim(),
      email: document.getElementById('inv-email').value.trim(),
      obs: document.getElementById('inv-obs').value.trim(),
    };
    if (!d.nome) { toast('⚠️', 'Informe o nome!'); return false; }
    if (i) {
      Object.assign(i, d);
      supaUpdate('investidores', i.id, d);
      save();
    } else {
      _cxCriarInvestidor(d);
    }
    toast('✅', i ? 'Investidor atualizado!' : 'Investidor cadastrado!');
    renderCaixa();
    setTimeout(cxAbrirInvestidores, 0); // volta para a lista
    return false;
  });
}

function cxExcluirInvestidor(id) {
  const i = (DB.investidores || []).find(x => String(x.id) === String(id));
  if (!i) return;
  const n = (DB.aportes || []).filter(a => String(a.investidorId) === String(id)).length;
  if (n) { toast('⚠️', i.nome + ' possui ' + n + ' aporte(s). Exclua os aportes antes.'); return; }
  if (!confirm('Excluir o investidor ' + i.nome + '?')) return;
  DB.investidores = DB.investidores.filter(x => x !== i);
  try { supaDelete('investidores', id); } catch (e) {}
  save(); renderCaixa(); cxAbrirInvestidores();
  toast('🗑️', 'Investidor excluído.');
}

// ── Exportações ───────────────────────────────────────────────
function exportCaixaXLS() {
  if (typeof XLSX === 'undefined') { toast('⚠️', 'Biblioteca de Excel ainda carregando. Tente novamente.'); return; }
  const aportes = _cxAportesFiltrados(true), despesas = _cxDespesasFiltradas();
  if (!aportes.length && !despesas.length) { toast('⚠️', 'Sem dados para exportar!'); return; }
  const wb = XLSX.utils.book_new();
  const fmtNum = (ws, col, n) => { for (let r = 1; r <= n; r++) { const c = ws[XLSX.utils.encode_cell({ r, c: col })]; if (c && typeof c.v === 'number') c.z = '#,##0.00'; } };

  const totAp = aportes.reduce((s, a) => s + Number(a.valor || 0), 0);
  const porInv = {};
  aportes.forEach(a => { const k = _cxInvNome(a.investidorId); porInv[k] = porInv[k] || { n: 0, v: 0 }; porInv[k].n++; porInv[k].v += Number(a.valor || 0); });
  const invRows = Object.entries(porInv).sort((a, b) => b[1].v - a[1].v).map(([k, o]) => [k, o.n, o.v, totAp > 0 ? +(o.v / totAp * 100).toFixed(2) : 0]);
  const wsInv = XLSX.utils.aoa_to_sheet([['Investidor', 'Nº Aportes', 'Total Aportado (R$)', '% Participação'], ...invRows, [], ['TOTAL', aportes.length, totAp, 100]]);
  wsInv['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 20 }, { wch: 15 }];
  fmtNum(wsInv, 2, invRows.length + 2);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Investidores');

  const apRows = [...aportes].sort((a, b) => String(a.data).localeCompare(String(b.data)))
    .map(a => [fmtDt(a.data), _cxInvNome(a.investidorId), _cxObraNome(a.obraId), a.forma || '', a.desc || '', Number(a.valor || 0)]);
  const wsAp = XLSX.utils.aoa_to_sheet([['Data', 'Investidor', 'Obra', 'Forma', 'Descrição', 'Valor (R$)'], ...apRows]);
  wsAp['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];
  fmtNum(wsAp, 5, apRows.length);
  XLSX.utils.book_append_sheet(wb, wsAp, 'Aportes');

  const movs = _cxMovimentos(aportes, despesas);
  const exRows = movs.map(m => [fmtDt(m.data), m.tipo, m.desc, m.obra, m.valor, m.saldo]);
  const wsEx = XLSX.utils.aoa_to_sheet([['Data', 'Tipo', 'Descrição', 'Obra', 'Valor (R$)', 'Saldo (R$)'], ...exRows]);
  wsEx['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 45 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
  fmtNum(wsEx, 4, exRows.length); fmtNum(wsEx, 5, exRows.length);
  XLSX.utils.book_append_sheet(wb, wsEx, 'Fluxo de Caixa');

  XLSX.writeFile(wb, 'Caixa_ObraTech_' + hojeISO() + '.xlsx');
  toast('📊', 'Planilha do caixa exportada!');
}

function exportCaixaPDF() {
  const aportes = _cxAportesFiltrados(true), despesas = _cxDespesasFiltradas();
  if (!aportes.length && !despesas.length) { toast('⚠️', 'Sem dados para exportar!'); return; }
  const totAp = aportes.reduce((s, a) => s + Number(a.valor || 0), 0);
  const totDesp = despesas.reduce((s, l) => s + Number(l.valor || 0), 0);
  const f = _cxFiltros();
  const sub = (f.obra ? _cxObraNome(f.obra) : 'Todas as obras') + (f.de || f.ate ? '   —   ' + (f.de ? fmtDt(f.de) : '...') + ' a ' + (f.ate ? fmtDt(f.ate) : 'hoje') : '');
  const doc = new jsPDF();
  let y = pHdr(doc, 'Fluxo de Caixa', sub) + 4;
  const cw = 62, ch = 24, gap = 2;
  pKpi(doc, 9, y, cw, ch, 'Total Aportado', fmtR(totAp), aportes.length + ' aportes');
  pKpi(doc, 9 + cw + gap, y, cw, ch, 'Saidas (Despesas)', fmtR(totDesp), despesas.length + ' lancamentos');
  pKpi(doc, 9 + 2 * (cw + gap), y, cw, ch, 'Saldo em Caixa', fmtR(totAp - totDesp), totAp - totDesp >= 0 ? 'disponivel' : 'necessita aporte');
  y += ch + 8;

  y = pSec(doc, y, 'Participacao por Investidor');
  const porInv = {};
  aportes.forEach(a => { const k = _cxInvNome(a.investidorId); porInv[k] = porInv[k] || { n: 0, v: 0 }; porInv[k].n++; porInv[k].v += Number(a.valor || 0); });
  const invRows = Object.entries(porInv).sort((a, b) => b[1].v - a[1].v);
  doc.autoTable({
    startY: y,
    head: [['Investidor', 'Aportes', 'Total Aportado (R$)', '% Participacao']],
    body: [...invRows.map(([k, o]) => [k, o.n, fmtR(o.v), totAp > 0 ? (o.v / totAp * 100).toFixed(2) + '%' : '—']), ['TOTAL', aportes.length, fmtR(totAp), '100.00%']],
    theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
    columnStyles: { 0: { cellWidth: 82 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }, 3: { cellWidth: 40, halign: 'center' } },
    didParseCell: d => { if (d.section === 'body' && d.row.index === invRows.length) { d.cell.styles.fillColor = PX.navy; d.cell.styles.textColor = [255, 255, 255]; d.cell.styles.fontStyle = 'bold'; } },
    margin: { left: 9, right: 9 }
  });
  y = doc.lastAutoTable.finalY + 9;

  if (aportes.length) {
    if (y > 230) { doc.addPage(); y = pHdr(doc, 'Fluxo de Caixa — Aportes', 'Continuacao') + 8; }
    y = pSec(doc, y, 'Aportes');
    doc.autoTable({
      startY: y,
      head: [['Data', 'Investidor', 'Obra', 'Forma', 'Descricao', 'Valor (R$)']],
      body: [...aportes].sort((a, b) => String(a.data).localeCompare(String(b.data)))
        .map(a => [fmtDt(a.data), _cxInvNome(a.investidorId).substring(0, 26), _cxObraNome(a.obraId).substring(0, 22), a.forma || '—', (a.desc || '—').substring(0, 30), fmtR(a.valor)]),
      theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
      columnStyles: { 0: { cellWidth: 22, halign: 'center' }, 1: { cellWidth: 42 }, 2: { cellWidth: 36 }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 42 }, 5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } },
      margin: { left: 9, right: 9 }
    });
    y = doc.lastAutoTable.finalY + 9;
  }

  if (y > 230) { doc.addPage(); y = pHdr(doc, 'Fluxo de Caixa — Extrato', 'Continuacao') + 8; }
  y = pSec(doc, y, 'Extrato (Entradas e Saidas)');
  const movs = _cxMovimentos(aportes, despesas);
  doc.autoTable({
    startY: y,
    head: [['Data', 'Tipo', 'Descricao', 'Obra', 'Valor (R$)', 'Saldo (R$)']],
    body: movs.map(m => [fmtDt(m.data), m.tipo, m.desc.substring(0, 42), m.obra.substring(0, 20), (m.valor < 0 ? '- ' : '+ ') + fmtR(Math.abs(m.valor)), fmtR(m.saldo)]),
    theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
    columnStyles: { 0: { cellWidth: 22, halign: 'center' }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 62 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30, halign: 'right' }, 5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } },
    didParseCell: d => {
      if (d.section !== 'body') return;
      const m = movs[d.row.index];
      if (d.column.index === 4) d.cell.styles.textColor = m.valor < 0 ? PX.red : PX.green;
      if (d.column.index === 5 && m.saldo < 0) d.cell.styles.textColor = PX.red;
    },
    margin: { left: 9, right: 9 }
  });
  pFtr(doc);
  doc.save('Fluxo_Caixa_ObraTech_' + hojeISO() + '.pdf');
  toast('📄', 'Relatório de fluxo de caixa exportado!');
}
