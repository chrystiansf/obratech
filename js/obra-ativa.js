// ObraTech — Obra ativa ("perfil da obra")
// Ao abrir o sistema o usuário escolhe a obra em que vai trabalhar. A partir daí todas as abas
// (financeiro, estoque, compras, contratos…) e todos os formulários enxergam só essa obra.
// Os dados das outras obras ficam guardados em _otTudo e voltam ao trocar de obra ou escolher
// "Todas as obras". O localStorage sempre recebe o banco completo (ver save()).
let _obraAtiva = null;          // id da obra ativa; null = todas as obras
let _otTudo = {};               // cópia completa das listas filtradas
let _otPerguntou = false;       // já mostrou a escolha nesta abertura

const _OT_LISTAS_OBRA = ['etapas','lancs','rdos','movs','ncs','contratos','medicoes','checklists','pontos','demandas',
  'solicitacoes','pedidosCompra','aportes','pontosTercs','pgtos'];

function _otPertence(k, x, solIds) {
  if (!x) return false;
  if (k === 'obras') return String(x.id) === String(_obraAtiva);
  if (k === 'cotacoes') return solIds.has(String(x.solicitacaoId));
  return String(x.obraId) === String(_obraAtiva);
}
function _otSolIdsAtiva(base) {
  return new Set((base || []).filter(s => String(s.obraId) === String(_obraAtiva)).map(s => String(s.id)));
}
// Junta a cópia completa com a visão atual: a visão manda em tudo que é da obra ativa
// (inclusive exclusões); o resto vem da cópia completa.
function _otJuntar(k, solIds) {
  const tudo = _otTudo[k], vis = DB[k];
  if (!Array.isArray(tudo) || !Array.isArray(vis)) return vis;
  const ids = new Set(vis.map(x => String(x && x.id)));
  return tudo.filter(x => !_otPertence(k, x, solIds) && !ids.has(String(x && x.id))).concat(vis);
}
function _otChaves() { return ['obras', 'cotacoes'].concat(_OT_LISTAS_OBRA); }

// Banco completo (para salvar no aparelho e para trocar de obra)
function _otDbCompleto() {
  if (!_obraAtiva) return DB;
  const solTudo = _otJuntar('solicitacoes', null);
  const solIds = _otSolIdsAtiva(solTudo);
  const c = Object.assign({}, DB);
  _otChaves().forEach(k => { c[k] = k === 'solicitacoes' ? solTudo : _otJuntar(k, solIds); });
  return c;
}

// Aplica o filtro da obra ativa. frescos: chaves que acabaram de vir completas do banco ('todos' = todas).
function _otFiltrar(frescos) {
  if (!_obraAtiva) { _otTudo = {}; return; }
  const fresco = k => frescos === 'todos' || (Array.isArray(frescos) && frescos.includes(k));
  // 1) monta a cópia completa
  const novo = {};
  _otChaves().forEach(k => { if (Array.isArray(DB[k])) novo[k] = fresco(k) || !_otTudo[k] ? DB[k].slice() : null; });
  if (novo.solicitacoes === null) novo.solicitacoes = _otJuntar('solicitacoes', null);
  const solIds = _otSolIdsAtiva(novo.solicitacoes);
  _otChaves().forEach(k => { if (novo[k] === null) novo[k] = _otJuntar(k, solIds); });
  // A obra ativa deixou de existir (excluída ou sem permissão): volta para todas
  if (novo.obras && !novo.obras.some(o => String(o.id) === String(_obraAtiva))) {
    Object.keys(novo).forEach(k => { DB[k] = novo[k]; });
    _otTudo = {}; _obraAtiva = null; _otGuardar(); _otAtualizarChip(); return;
  }
  // 2) a visão fica só com a obra ativa
  _otTudo = novo;
  Object.keys(novo).forEach(k => { DB[k] = novo[k].filter(x => _otPertence(k, x, solIds)); });
  DB.sel = _obraAtiva;
}

function _otGuardar() {
  try {
    if (_obraAtiva) { sessionStorage.setItem('ot_obra_ativa', _obraAtiva); localStorage.setItem('ot_obra_ultima', _obraAtiva); }
    else { sessionStorage.setItem('ot_obra_ativa', '*'); }
  } catch (e) {}
}

// Troca a obra ativa (null = todas)
function otDefinirObra(id) {
  const completo = _otDbCompleto();
  _otChaves().forEach(k => { if (Array.isArray(completo[k])) DB[k] = completo[k]; });
  _otTudo = {};
  _obraAtiva = id ? String(id) : null;
  if (_obraAtiva && !DB.obras.some(o => String(o.id) === _obraAtiva)) _obraAtiva = null;
  _otFiltrar('todos');
  if (typeof _obrasFiltro !== 'undefined') _obrasFiltro = null;
  _otGuardar(); save();
  document.getElementById('ot-obra-escolha')?.remove();
  _otAtualizarChip();
  try { fillSelects(); updateSbObra(); renderPaginaAtual(); } catch (e) { console.warn(e); }
  const o = DB.obras.find(x => String(x.id) === _obraAtiva);
  toast('hard-hat', o ? 'Trabalhando na obra ' + o.nome : 'Visão geral: todas as obras');
}

// Depois de carregar os dados do banco: pergunta a obra (uma vez por abertura) ou reaplica
function otAposCarregar() {
  const obras = (_otTudo.obras || DB.obras || []);
  if (!_otPerguntou && obras.length) {
    _otPerguntou = true;
    let sess = null; try { sess = sessionStorage.getItem('ot_obra_ativa'); } catch (e) {}
    if (sess) { otDefinirObra(sess === '*' ? null : sess); return; }    // recarregou a página: mantém
    if (obras.length === 1) { otDefinirObra(obras[0].id); return; }
    if (obras.length > 1) { otEscolherObra(true); return; }
  }
  _otAtualizarChip();
}

// Tela de escolha da obra
function otEscolherObra(inicial) {
  const obras = (_otTudo.obras || DB.obras || []).slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  if (!obras.length) return;
  let ultima = null; try { ultima = localStorage.getItem('ot_obra_ultima'); } catch (e) {}
  document.getElementById('ot-obra-escolha')?.remove();
  const el = document.createElement('div');
  el.id = 'ot-obra-escolha';
  const st = o => { try { return obraLabel(o); } catch (e) { return ''; } };
  const cor = o => { try { const c = obraColor(o); return c === 'r' ? 'atr' : c === 'g' ? 'and' : c === 'fin' ? 'fin' : 'ni'; } catch (e) { return 'ni'; } };
  const card = o => `<button class="oto-card${String(o.id) === String(_obraAtiva || ultima) ? ' ultima' : ''}" onclick="otDefinirObra('${o.id}')">
      <span class="oto-nome">${escHtml(o.nome || '—')}</span>
      <span class="oto-sub">${escHtml(o.local || o.tipo || '')}</span>
      <span class="oto-st oto-${cor(o)}">${st(o)}</span>
      ${String(o.id) === String(_obraAtiva || ultima) ? '<span class="oto-tag">' + (_obraAtiva ? 'Atual' : 'Última usada') + '</span>' : ''}
    </button>`;
  el.innerHTML = `<div class="oto-box" role="dialog" aria-modal="true" aria-labelledby="oto-tit">
    <div class="oto-head">
      <div class="oto-eyebrow"><i></i>${inicial ? 'Bem-vindo' : 'Trocar de obra'}</div>
      <h2 id="oto-tit">Em qual obra você vai trabalhar?</h2>
      <p>Tudo o que você ver e lançar fica nesta obra. Para trocar, toque no nome da obra no topo da tela.</p>
      ${!inicial ? '<button class="oto-x" onclick="document.getElementById(\'ot-obra-escolha\').remove()" aria-label="Fechar"><svg class=ot-i><use href=#i-x></use></svg></button>' : ''}
    </div>
    ${obras.length > 6 ? '<input class="inp oto-busca" placeholder="Buscar obra..." oninput="otFiltrarEscolha(this.value)">' : ''}
    <div class="oto-lista">${obras.map(card).join('')}</div>
    <button class="oto-todas" onclick="otDefinirObra(null)"><svg class=ot-i><use href=#i-layout-dashboard></use></svg> Ver todas as obras (visão geral)</button>
  </div>`;
  document.body.appendChild(el);
}
function otFiltrarEscolha(q) {
  q = String(q || '').toLowerCase();
  document.querySelectorAll('#ot-obra-escolha .oto-card').forEach(b => { b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}

// Botão da obra ativa no topo (todas as telas)
function _otAtualizarChip() {
  const tb = document.getElementById('topbar'); if (!tb) return;
  let b = document.getElementById('ot-obra-chip');
  if (!b) {
    b = document.createElement('button'); b.id = 'ot-obra-chip'; b.type = 'button';
    b.onclick = () => otEscolherObra(false);
    const ref = document.getElementById('theme-toggle'); tb.insertBefore(b, ref);
  }
  const o = _obraAtiva && DB.obras.find(x => String(x.id) === String(_obraAtiva));
  const n = (_otTudo.obras || DB.obras || []).length;
  b.style.display = n ? '' : 'none';
  b.className = o ? 'fixa' : '';
  b.title = 'Trocar de obra';
  b.innerHTML = `<svg class=ot-i><use href=#i-hard-hat></use></svg><span>${o ? escHtml(o.nome) : 'Todas as obras'}</span><svg class="ot-i oto-seta"><use href=#i-chevron-down></use></svg>`;
  document.body.classList.toggle('obra-fixa', !!o);
  const tag = document.getElementById('obra-tag'); if (tag && o) tag.textContent = '';
}

// Formulários: com obra ativa, o campo "Obra" já vem preenchido e travado
(function () {
  function travar(root) {
    if (!_obraAtiva) return;
    root.querySelectorAll('select[id$="-obra"], select#cl-sobra-obra').forEach(s => {
      if (s.closest('#topbar')) return;
      const opt = [...s.options].find(op => String(op.value) === String(_obraAtiva));
      if (!opt) return;
      if (s.value !== String(_obraAtiva)) { s.value = String(_obraAtiva); s.dispatchEvent(new Event('change', { bubbles: true })); }
      s.disabled = true; s.title = 'Obra ativa — para trocar, toque no nome da obra no topo';
    });
  }
  let ag = false;
  const obs = new MutationObserver(() => { if (ag || !_obraAtiva) return; ag = true; requestAnimationFrame(() => { ag = false; travar(document); }); });
  const ini = () => obs.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ini); else ini();
})();
