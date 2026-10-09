// ═══════════════════════════════════════════
// COMPRAS — Cotação de fornecedor com vários itens
// Grade única por fornecedor + importação gratuita (foto/OCR, PDF, planilha)
// Tudo roda no navegador: Tesseract.js (OCR) e PDF.js, sem serviço pago.
// ═══════════════════════════════════════════

// Bibliotecas carregadas só quando usadas (podem ser trocadas em window.OT_LIBS para testes)
const _CL_LIBS = Object.assign({
  tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  tessWorker: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  tessCore: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
  tessLang: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por@1.0.0/4.0.0_best_int',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
}, window.OT_LIBS || {});

function _clLoadScript(src) {
  return new Promise((ok, err) => {
    if ([...document.scripts].some(s => s.src === src)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok;
    s.onerror = () => err(new Error('Não foi possível carregar ' + src.split('/').slice(-1)[0] + '. Verifique a internet.'));
    document.head.appendChild(s);
  });
}

// ── Texto → números ───────────────────────────────────────────
// Valores em reais: 1.234,56 | 1234,56 | 1234.56 (OCR às vezes troca vírgula por ponto)
// Números no padrão brasileiro: 1.234,56 | 6.400,0000 | 512,000 | 12,500000 | 1234.56 (OCR troca vírgula por ponto)
// Não pega medidas como "5.0 MM" ou "12.5" (ponto com 1 casa), nem códigos inteiros.
const _CL_RE_MONEY = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,6})?|\d+,\d{1,6}|\d+\.\d{2})(?![\d.,]*\d)/g;
function _clNum(s) {
  if (s == null) return 0;
  s = String(s).trim().replace(/R\$\s*/i, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s.replace(/[^\d.\-]/g, ''));
  return isFinite(n) ? n : 0;
}
function _clNorm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

// ── Interpretar o texto de um orçamento ───────────────────────
// Retorna {itens:[{desc,qtd,unit,total,raw}], total, produtos, desconto, pix, cartao, parcelas, frete, prazo, aVista}
function clParseOrcamento(texto) {
  const res = { itens: [], total: 0, produtos: 0, desconto: 0, pix: 0, cartao: 0, parcelas: 0, frete: 0, prazo: '', aVista: false };
  let totalForte = false; // "TOTAL DO ORÇAMENTO"/"TOTAL GERAL"/"TOTAL A PAGAR" vence outros totais
  const linhas = String(texto || '').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const raw of linhas) {
    const n = _clNorm(raw);
    const money = [...raw.matchAll(_CL_RE_MONEY)].map(m => ({ v: _clNum(m[1]), i: m.index, len: m[0].length }));
    const ultimo = money.length ? money[money.length - 1].v : 0;
    const parc = raw.match(/(\d{1,2})\s*[xX](?![a-z])/);

    // Totais e condições (testados antes de qualquer descarte)
    if (/total (do )?orcamento|total geral|total a pagar|valor a pagar|total liquido/.test(n) && ultimo) { res.total = ultimo; totalForte = true; continue; }
    if (/valor (dos )?produtos|total (dos )?produtos|sub ?total|total (dos )?itens|total bruto/.test(n) && ultimo) { res.produtos = ultimo; continue; }
    if (/\bdesconto\b/.test(n) && !/unitario/.test(n)) { if (ultimo) res.desconto = ultimo; continue; }
    if (/acrescimo|\bjuros\b/.test(n) && !/unitario/.test(n) && money.length <= 1) continue;
    if (/\bpix\b|a vista|avista|\bdinheiro\b|\bespecie\b/.test(n)) {
      if (/a vista|avista|\bdinheiro\b|\bpix\b/.test(n)) res.aVista = true;
      if (ultimo) res.pix = ultimo;
      continue;
    }
    if (/cart.{0,2}o\b|cartao|cr.{0,2}dito|\bcredito\b/.test(n)) {
      if (ultimo) res.cartao = ultimo;
      if (parc) res.parcelas = parseInt(parc[1]);
      continue;
    }
    if (/\bparcel/.test(n) && parc) { res.parcelas = parseInt(parc[1]); continue; }
    if (/\bfrete\b/.test(n) && ultimo) { res.frete = ultimo; continue; }
    if (/\bprazo\b|\bentrega\b/.test(n) && !money.length) { res.prazo = raw.replace(/^.*?(prazo( de entrega)?|entrega)\s*[:\-]?\s*/i, '').slice(0, 60); continue; }
    if (/\btotal\b/.test(n) && ultimo && !/unitario/.test(n) && money.length <= 2) { if (!totalForte) res.total = ultimo; continue; }
    if (/\bcnpj\b|\bcpf\b|\btelefone\b|\bfone\b|\bvalidade\b|\bcep\b|\bvencimento\b/.test(n)) continue;

    // Linha de item: texto + valor total no fim
    if (!money.length || !/[a-z]{3,}/.test(n)) continue;
    let resto = raw;
    for (let k = money.length - 1; k >= 0; k--) resto = resto.slice(0, money[k].i) + ' '.repeat(money[k].len) + resto.slice(money[k].i + money[k].len);
    const soltos = [...resto.matchAll(/(?:^|\s)(\d{1,5})(?=\s|$)/g)].map(m => ({ v: +m[1], i: m.index }));
    const total = ultimo;
    let qtd = 0, unit = 0;
    // Procura o par quantidade × unitário que explica o total (ignora colunas de desconto/acréscimo)
    // candidatos na ordem em que aparecem na linha (quantidade costuma vir antes do unitário)
    const cands = [...money.slice(0, -1).map(m => ({ v: m.v, i: m.i })), ...soltos].filter(c => c.v > 0).sort((a, b) => a.i - b.i);
    const tol = v => Math.max(0.06, v * 0.01);
    outer: for (let a = 0; a < cands.length; a++) for (let b = a + 1; b < cands.length; b++) {
      if (Math.abs(cands[a].v * cands[b].v - total) <= tol(total)) { qtd = cands[a].v; unit = cands[b].v; break outer; }
    }
    if (!qtd && money.length >= 2) {
      unit = money[money.length - 2].v;
      if (unit) { const q = total / unit; if (Math.abs(q - Math.round(q)) < 0.02) qtd = Math.round(q); }
    }
    if (!qtd && !unit && soltos.length) { qtd = soltos[soltos.length - 1].v; if (qtd) unit = total / qtd; }
    let desc = resto.replace(/(?:^|\s)\d+(?=\s|$)/g, ' ')
      .replace(/^\s*(?:item|cod\.?|código)?\s*[\d.\-\/]*\s*/i, '')
      .replace(/\b(un|und|unid|pc|pç|sc|kg|m2|m3|m²|m³|mt|ml|lt|cx|rl|gl|br|barra|vb|par|metro|peca|peça)\b\.?\s*$/i, '')
      .replace(/R\$/g, '').replace(/[|_*•—–]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (desc.length < 3 || /^(codigo|produto|descri)/i.test(_clNorm(desc))) continue;
    res.itens.push({ desc, qtd, unit: +(unit || 0).toFixed(4), total, raw });
  }
  const somaItens = +res.itens.reduce((a, i) => a + (i.total || 0), 0).toFixed(2);
  if (!res.produtos && somaItens) res.produtos = somaItens;
  if (!res.total) res.total = res.produtos ? +(res.produtos - res.desconto + res.frete).toFixed(2) : 0;
  // "Pagamento à vista" sem valor separado: o à vista é o total do orçamento
  if (res.aVista && !res.pix) res.pix = res.total;
  return res;
}

// ── Casar item lido com item da solicitação ───────────────────
function _clTokens(s) {
  return _clNorm(s).split(' ').filter(t => t.length >= 2 && !['de', 'do', 'da', 'com', 'para', 'em', 'un', 'und', 'pc', 'cx'].includes(t));
}
function clSimilaridade(a, b) {
  const A = _clTokens(a), B = _clTokens(b);
  if (!A.length || !B.length) return 0;
  const usado = new Set(); let hit = 0;
  for (const t of A) {
    const j = B.findIndex((u, k) => !usado.has(k) && (u === t || (t.length >= 3 && u.length >= 3 && (u.startsWith(t) || t.startsWith(u)))));
    if (j >= 0) { usado.add(j); hit += /\d/.test(t) ? 1.3 : 1; }
  }
  return (2 * hit) / (A.length + B.length);
}
// Para cada item lido, escolhe a solicitação mais parecida (sem repetir)
function clCasarItens(lidos, sols) {
  const pares = [];
  lidos.forEach((l, i) => sols.forEach(s => {
    const sc = clSimilaridade(l.desc, s.item + ' ' + (s.unidade || ''));
    if (sc >= 0.34) pares.push({ i, sid: s.id, sc });
  }));
  pares.sort((a, b) => b.sc - a.sc);
  const mapa = {}, usadosL = new Set(), usadosS = new Set();
  for (const p of pares) {
    if (usadosL.has(p.i) || usadosS.has(p.sid)) continue;
    usadosL.add(p.i); usadosS.add(p.sid); mapa[p.sid] = { idx: p.i, sc: p.sc };
  }
  return { mapa, sobras: lidos.filter((_, i) => !usadosL.has(i)) };
}

// ── Leitura de arquivos ───────────────────────────────────────
function _clProgresso(txt, pct) {
  const el = document.getElementById('cl-prog'); if (!el) return;
  el.style.display = txt ? 'block' : 'none';
  el.innerHTML = txt ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>${txt}</span><span class="ot-num">${pct != null ? Math.round(pct) + '%' : ''}</span></div><div class="pw"><div class="pb" style="width:${pct || 5}%;background:var(--ot-brand)"></div></div>` : '';
}

// Melhora a foto para o OCR: escala, tons de cinza e contraste
function _clPrepararImagem(file) {
  return new Promise((ok, err) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const alvo = 2200, esc = Math.min(2.5, Math.max(1, alvo / Math.max(img.width, img.height)));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * esc); cv.height = Math.round(img.height * esc);
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const d = ctx.getImageData(0, 0, cv.width, cv.height), p = d.data;
      let min = 255, max = 0; const g = new Uint8ClampedArray(p.length / 4);
      for (let i = 0, j = 0; i < p.length; i += 4, j++) { const v = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; g[j] = v; if (v < min) min = v; if (v > max) max = v; }
      const r = Math.max(1, max - min);
      for (let i = 0, j = 0; i < p.length; i += 4, j++) { const v = Math.max(0, Math.min(255, (g[j] - min) * 255 / r)); p[i] = p[i + 1] = p[i + 2] = v; }
      ctx.putImageData(d, 0, 0); URL.revokeObjectURL(url); ok(cv);
    };
    img.onerror = () => { URL.revokeObjectURL(url); err(new Error('Imagem inválida')); };
    img.src = url;
  });
}

let _clWorker = null;
async function _clOCR(canvasOuImg, rotulo) {
  await _clLoadScript(_CL_LIBS.tesseract);
  if (!_clWorker) {
    _clProgresso('Preparando leitor de texto (só na primeira vez)...', 5);
    _clWorker = await Tesseract.createWorker('por', 1, {
      workerPath: _CL_LIBS.tessWorker, corePath: _CL_LIBS.tessCore, langPath: _CL_LIBS.tessLang,
      logger: m => { if (m.status === 'recognizing text') _clProgresso(rotulo || 'Lendo orçamento...', 10 + m.progress * 90); }
    });
    await _clWorker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
  }
  const { data } = await _clWorker.recognize(canvasOuImg);
  return data.text || '';
}

async function _clLerPDF(file) {
  await _clLoadScript(_CL_LIBS.pdfjs);
  pdfjsLib.GlobalWorkerOptions.workerSrc = _CL_LIBS.pdfWorker;
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let texto = '';
  for (let pg = 1; pg <= Math.min(pdf.numPages, 10); pg++) {
    _clProgresso('Lendo PDF (página ' + pg + ' de ' + pdf.numPages + ')...', pg / pdf.numPages * 100);
    const page = await pdf.getPage(pg);
    const tc = await page.getTextContent();
    // Agrupa os pedaços de texto por linha (mesma altura) e ordena da esquerda para a direita
    const linhas = [];
    tc.items.forEach(it => {
      if (!it.str || !it.str.trim()) return;
      const y = it.transform[5], x = it.transform[4], h = Math.abs(it.transform[3]) || it.height || 8;
      // mesma linha: diferença de altura menor que ~meia letra (colunas às vezes ficam 1-3pt desalinhadas)
      let l = linhas.find(L => Math.abs(L.y - y) < Math.max(3, Math.min(L.h, h) * 0.55));
      if (!l) { l = { y, h, partes: [] }; linhas.push(l); }
      l.partes.push({ x, s: it.str });
    });
    linhas.sort((a, b) => b.y - a.y).forEach(l => { texto += l.partes.sort((a, b) => a.x - b.x).map(p => p.s).join('  ') + '\n'; });
    // PDF escaneado (sem texto): renderiza a página e usa OCR
    if (tc.items.filter(i => i.str && i.str.trim()).length < 5) {
      const vp = page.getViewport({ scale: 2.5 });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      texto += await _clOCR(cv, 'Lendo PDF escaneado (página ' + pg + ')...') + '\n';
    }
  }
  return texto;
}

// Planilha: tenta achar as colunas pelo cabeçalho; se não achar, vira texto
function _clLerPlanilha(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
  const hi = rows.findIndex(r => r.some(c => /descri|produto|material|item/i.test(String(c))) && r.some(c => /total|pre[cç]o|valor|unit/i.test(String(c))));
  if (hi >= 0) {
    const h = rows[hi].map(c => _clNorm(c));
    const col = re => h.findIndex(c => re.test(c));
    const cD = col(/descri|produto|material|^item/), cQ = col(/^qt|quant/), cU = col(/unit|preco|valor un|vl un/), cT = col(/total|valor$/);
    const itens = [];
    for (const r of rows.slice(hi + 1)) {
      const desc = String(r[cD] ?? '').trim(); if (!desc || desc.length < 3) continue;
      const num = v => typeof v === 'number' ? v : _clNum(v);
      const qtd = cQ >= 0 ? num(r[cQ]) : 0, unit = cU >= 0 ? num(r[cU]) : 0;
      let total = cT >= 0 && cT !== cU ? num(r[cT]) : 0;
      if (!total && qtd && unit) total = qtd * unit;
      if (!total && !unit) continue;
      itens.push({ desc, qtd, unit: unit || (qtd ? total / qtd : 0), total, raw: r.join(' | ') });
    }
    const texto = rows.map(r => r.join('  ')).join('\n');
    const cond = clParseOrcamento(rows.slice(hi + 1).filter(r => !String(r[cD] ?? '').trim() || /pix|cart|frete|total|parcel/i.test(r.join(' '))).map(r => r.map(c => typeof c === 'number' ? c.toFixed(2).replace('.', ',') : c).join('  ')).join('\n'));
    return { itens, texto, cond };
  }
  const texto = rows.map(r => r.map(c => typeof c === 'number' ? (Number.isInteger(c) ? String(c) : c.toFixed(2).replace('.', ',')) : c).join('  ')).join('\n');
  return { texto };
}

// ── Estado da tela ────────────────────────────────────────────
let _cl = null;
function _clSolsAbertas() {
  const f = _cl?.obra || '';
  return (DB.solicitacoes || []).filter(s => (s.status === 'aberta' || s.status === 'cotando') && (!f || String(s.obraId) === String(f)));
}

function abrirCotacaoLote(fornInicial) {
  _cl = { forn: fornInicial || '', obra: '', linhas: {}, sobras: [], texto: '', origem: 'manual', cond: { pix: '', cartao: '', parcelas: '', prazo: '', frete: '', obs: '' } };
  if (!(DB.solicitacoes || []).some(s => s.status === 'aberta' || s.status === 'cotando')) {
    toast('⚠️', 'Nenhum item em cotação. Cadastre as solicitações primeiro (ou importe o orçamento e adicione os itens lidos).');
  }
  const fornOpts = '<option value="">— Selecionar —</option>' + (DB.fornecedores || []).map(f => { const n = typeof f === 'object' ? f.nome : f; return `<option${n === _cl.forn ? ' selected' : ''}>${escHtml(n)}</option>`; }).join('');
  const obraOpts = '<option value="">Todas as obras</option>' + DB.obras.map(o => `<option value="${o.id}">${escHtml(o.nome)}</option>`).join('');
  document.getElementById('modal-root').innerHTML = `<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
  <div class="mo" style="width:1080px;max-width:97vw">
    <div class="moh"><div class="mot">${ic('clipboard-list')} Cotação de fornecedor</div><div class="mox" onclick="closeModal()">${ic('x')}</div></div>
    <div class="mob">
      <div class="g" style="grid-template-columns:2fr 1.4fr;gap:12px;margin-bottom:12px">
        <div class="fg"><label class="lbl">Fornecedor *</label><div style="display:flex;gap:6px"><select class="sel" id="cl-forn" onchange="_cl.forn=this.value">${fornOpts}</select>
          <button type="button" class="btn sm" onclick="clNovoFornecedor()" title="Cadastrar fornecedor">${ic('plus')}</button></div></div>
        <div class="fg"><label class="lbl">Obra</label><select class="sel" id="cl-obra" onchange="_cl.obra=this.value;_clRender()">${obraOpts}</select></div>
      </div>
      <div style="border:1px dashed var(--ot-border-strong);border-radius:var(--ot-radius-md);padding:12px 14px;margin-bottom:12px;background:var(--ot-surface-sunken)">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <strong style="font-size:13px;margin-right:4px">Importar orçamento da loja:</strong>
          <label class="btn sm" style="cursor:pointer">${ic('camera')} Tirar foto<input type="file" accept="image/*" capture="environment" style="display:none" onchange="clImportar(this.files[0]);this.value=''"></label>
          <label class="btn sm" style="cursor:pointer">${ic('image')} Imagem<input type="file" accept="image/*" style="display:none" onchange="clImportar(this.files[0]);this.value=''"></label>
          <label class="btn sm" style="cursor:pointer">${ic('file-text')} PDF<input type="file" accept="application/pdf" style="display:none" onchange="clImportar(this.files[0]);this.value=''"></label>
          <label class="btn sm" style="cursor:pointer">${ic('chart-column')} Planilha<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="clImportar(this.files[0]);this.value=''"></label>
          <span style="font-size:12px;color:var(--txt3)">Os valores lidos aparecem em <span style="background:var(--ot-brand-soft);padding:0 4px;border-radius:4px">laranja</span>: confira antes de salvar.</span>
        </div>
        <div id="cl-prog" style="display:none;margin-top:10px"></div>
      </div>
      <div id="cl-grade"></div>
      <div id="cl-sobras"></div>
      <div class="g" style="grid-template-columns:repeat(6,1fr);gap:10px;margin-top:14px" id="cl-cond">
        <div class="fg"><label class="lbl">Total no PIX</label><input type="number" step="0.01" min="0" class="inp" id="cl-pix" oninput="_cl.cond.pix=this.value"></div>
        <div class="fg"><label class="lbl">Total no cartão</label><input type="number" step="0.01" min="0" class="inp" id="cl-cartao" oninput="_cl.cond.cartao=this.value;_clParcInfo()"></div>
        <div class="fg"><label class="lbl">Parcelas</label><input type="number" step="1" min="1" max="48" class="inp" id="cl-parcelas" oninput="_cl.cond.parcelas=this.value;_clParcInfo()"><div id="cl-parc-info" style="font-size:11px;color:var(--txt3);min-height:14px"></div></div>
        <div class="fg"><label class="lbl">Frete</label><input type="number" step="0.01" min="0" class="inp" id="cl-frete" oninput="_cl.cond.frete=this.value;_clResumo()"></div>
        <div class="fg" style="grid-column:span 2"><label class="lbl">Prazo de entrega</label><input class="inp" id="cl-prazo" placeholder="Ex: 3 dias úteis" oninput="_cl.cond.prazo=this.value"></div>
        <div class="fg" style="grid-column:span 6"><label class="lbl">Observações</label><input class="inp" id="cl-obs" placeholder="Validade, condições..." oninput="_cl.cond.obs=this.value"></div>
      </div>
      <details id="cl-texto-box" style="margin-top:10px;display:none"><summary style="cursor:pointer;font-size:12px;color:var(--txt3)">Ver texto lido do orçamento</summary><pre id="cl-texto" style="white-space:pre-wrap;font-family:var(--ot-font-mono);font-size:11px;background:var(--ot-surface-sunken);padding:10px;border-radius:8px;max-height:220px;overflow:auto;margin-top:6px"></pre></details>
    </div>
    <div class="mof" style="justify-content:space-between;flex-wrap:wrap">
      <div id="cl-resumo" style="font-size:13px"></div>
      <div style="display:flex;gap:8px"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="salvarCotacaoLote()">${ic('save')} Salvar cotação</button></div>
    </div>
  </div></div>`;
  _clRender();
}

function _clRender() {
  const sols = _clSolsAbertas();
  const el = document.getElementById('cl-grade'); if (!el) return;
  if (!sols.length) {
    el.innerHTML = '<div class="t-empty" style="padding:20px">Nenhum item em cotação' + (_cl.obra ? ' nesta obra' : '') + '. Importe o orçamento: os itens lidos poderão ser adicionados.</div>';
  } else {
    const porObra = {};
    sols.forEach(s => { (porObra[s.obraId || ''] = porObra[s.obraId || ''] || []).push(s); });
    el.innerHTML = `<div style="overflow-x:auto"><table class="tbl">
      <tr><th>Item solicitado</th><th style="text-align:right">Qtd.</th><th style="width:150px;text-align:right">Preço unit. (R$)</th><th style="width:160px;text-align:right">Total (R$)</th><th>Lido no orçamento</th></tr>
      ${Object.entries(porObra).map(([oid, lista]) => `
        ${Object.keys(porObra).length > 1 || !_cl.obra ? `<tr><td colspan="5" style="background:var(--ot-surface-sunken);font-size:12px;font-weight:600;color:var(--txt2);height:auto;padding:6px 14px">${ic('hard-hat', 'sm')} ${escHtml(DB.obras.find(o => String(o.id) === String(oid))?.nome || 'Sem obra')}</td></tr>` : ''}
        ${lista.map(s => {
          const L = _cl.linhas[s.id] || {};
          const auto = L.fonte === 'auto' ? 'background:var(--ot-brand-soft);' : '';
          return `<tr>
            <td class="n">${escHtml(s.item)}</td>
            <td style="text-align:right;white-space:nowrap" class="ot-num">${s.quantidade || '—'} ${escHtml(s.unidade || '')}</td>
            <td><input type="number" step="0.01" min="0" class="inp ot-num" style="text-align:right;min-height:36px;${auto}" value="${L.unit ?? ''}" oninput="_clEdit('${s.id}','unit',this.value)" id="cl-u-${s.id}"></td>
            <td><input type="number" step="0.01" min="0" class="inp ot-num" style="text-align:right;min-height:36px;${auto}" value="${L.total ?? ''}" oninput="_clEdit('${s.id}','total',this.value)" id="cl-t-${s.id}"></td>
            <td style="font-size:11px;color:var(--txt3);max-width:260px">${L.lido ? escHtml(L.lido) + (L.sc ? ` <span class="b ${L.sc > .6 ? 'bg' : 'by'}" style="font-size:10px">${L.sc > .6 ? 'confere' : 'verificar'}</span>` : '') : '—'}</td>
          </tr>`;
        }).join('')}`).join('')}
    </table></div>`;
  }
  _clRenderSobras(); _clResumo();
}

function _clEdit(sid, campo, v) {
  const s = (DB.solicitacoes || []).find(x => x.id === sid);
  const L = _cl.linhas[sid] = _cl.linhas[sid] || {};
  L[campo] = v === '' ? '' : Number(v); L.fonte = 'manual';
  const q = Number(s?.quantidade) || 0;
  if (campo === 'unit' && q && v !== '') { L.total = +(Number(v) * q).toFixed(2); const t = document.getElementById('cl-t-' + sid); if (t) t.value = L.total; }
  if (campo === 'total' && q && v !== '' && !L.unit) { L.unit = +(Number(v) / q).toFixed(4); const u = document.getElementById('cl-u-' + sid); if (u) u.value = L.unit; }
  ['cl-u-', 'cl-t-'].forEach(p => { const e = document.getElementById(p + sid); if (e) e.style.background = ''; });
  _clResumo();
}

function _clRenderSobras() {
  const el = document.getElementById('cl-sobras'); if (!el) return;
  if (!_cl.sobras.length) { el.innerHTML = ''; return; }
  const obraSel = _cl.obra || DB.sel || DB.obras[0]?.id || '';
  el.innerHTML = `<div style="margin-top:14px;padding:12px;border:1px solid var(--ot-border);border-radius:var(--ot-radius-md)">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">${ic('triangle-alert', 'sm')} Itens lidos sem correspondência (${_cl.sobras.length})</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:8px">Adicione como novo item em cotação${DB.obras.length > 1 ? ' na obra <select class="sel" id="cl-sobra-obra" style="display:inline-block;width:auto;min-height:30px;height:30px;font-size:12px;padding:0 8px">' + DB.obras.map(o => `<option value="${o.id}"${String(o.id) === String(obraSel) ? ' selected' : ''}>${escHtml(o.nome)}</option>`).join('') + '</select>' : ''} ou ignore.</div>
    <table class="tbl"><tr><th>Descrição lida</th><th style="text-align:right">Qtd.</th><th style="text-align:right">Unit.</th><th style="text-align:right">Total</th><th></th></tr>
    ${_cl.sobras.map((l, i) => `<tr><td><input class="inp" style="min-height:32px" value="${escHtml(l.desc)}" oninput="_cl.sobras[${i}].desc=this.value"></td>
      <td style="text-align:right" class="ot-num">${l.qtd || '—'}</td><td style="text-align:right" class="ot-num">${l.unit ? fmtR(l.unit) : '—'}</td><td style="text-align:right" class="ot-num">${l.total ? fmtR(l.total) : '—'}</td>
      <td><div class="ta-actions"><button class="btn sm" onclick="clAdicionarSobra(${i})">${ic('plus')} Adicionar</button><button class="btn sm ico" title="Ignorar" onclick="_cl.sobras.splice(${i},1);_clRenderSobras()">${ic('x')}</button></div></td></tr>`).join('')}
    </table>
    ${_cl.sobras.length > 1 ? `<div style="margin-top:8px;text-align:right"><button class="btn sm" onclick="clAdicionarTodasSobras()">${ic('plus')} Adicionar todos</button></div>` : ''}
  </div>`;
}

function _clCriarSolicitacao(l, obraId) {
  const id = uuidv4();
  const s = { id, obraId: obraId || null, item: l.desc.slice(0, 120), unidade: '', quantidade: l.qtd || 1, urgencia: 'normal', status: 'cotando', solicitante: DB.user.nome || '', obs: 'Criado a partir do orçamento importado', _supa: true };
  if (!DB.solicitacoes) DB.solicitacoes = [];
  DB.solicitacoes.unshift(s);
  supaInsert('compras_solicitacoes', { id, obra_id: s.obraId, item: s.item, unidade: '', quantidade: s.quantidade, urgencia: 'normal', status: 'cotando', solicitante: s.solicitante, obs: s.obs });
  _cl.linhas[id] = { unit: l.unit ? +l.unit.toFixed(2) : '', total: l.total || '', lido: l.raw, fonte: 'auto' };
  return s;
}
function clAdicionarSobra(i) {
  const obraId = document.getElementById('cl-sobra-obra')?.value || _cl.obra || DB.sel || DB.obras[0]?.id;
  _clCriarSolicitacao(_cl.sobras[i], obraId); _cl.sobras.splice(i, 1);
  if (_cl.obra && String(_cl.obra) !== String(obraId)) { _cl.obra = ''; document.getElementById('cl-obra').value = ''; }
  save(); _clRender();
}
function clAdicionarTodasSobras() {
  const obraId = document.getElementById('cl-sobra-obra')?.value || _cl.obra || DB.sel || DB.obras[0]?.id;
  _cl.sobras.forEach(l => _clCriarSolicitacao(l, obraId)); _cl.sobras = [];
  if (_cl.obra && String(_cl.obra) !== String(obraId)) { _cl.obra = ''; document.getElementById('cl-obra').value = ''; }
  save(); _clRender(); toast('✅', 'Itens adicionados à cotação.');
}

function _clSoma() {
  return Object.entries(_cl.linhas).reduce((a, [sid, L]) => _clSolsAbertas().some(s => s.id === sid) ? a + (Number(L.total) || 0) : a, 0);
}
function _clResumo() {
  const el = document.getElementById('cl-resumo'); if (!el) return;
  const sols = _clSolsAbertas();
  const n = sols.filter(s => Number(_cl.linhas[s.id]?.total) > 0).length;
  const soma = _clSoma(), frete = Number(_cl.cond.frete) || 0;
  el.innerHTML = `<span style="color:var(--txt3)">Itens cotados</span> <strong class="ot-num">${n}/${sols.length}</strong> &nbsp;·&nbsp; <span style="color:var(--txt3)">Soma</span> <strong class="ot-num">${fmtR(soma)}</strong>${frete ? ` &nbsp;·&nbsp; <span style="color:var(--txt3)">c/ frete</span> <strong class="ot-num">${fmtR(soma + frete)}</strong>` : ''}`;
}
function _clParcInfo() {
  const v = Number(_cl.cond.cartao) || 0, n = parseInt(_cl.cond.parcelas) || 0;
  const el = document.getElementById('cl-parc-info'); if (el) el.textContent = v && n > 1 ? n + 'x de ' + fmtR(v / n) : '';
}

function clNovoFornecedor() {
  const nome = (prompt('Nome do novo fornecedor:') || '').trim(); if (!nome) return;
  if (!(DB.fornecedores || []).some(f => (typeof f === 'object' ? f.nome : f) === nome)) {
    const id = uuidv4(); (DB.fornecedores = DB.fornecedores || []).push({ id, nome, tipo: 'Material' });
    supaInsert('fornecedores_cadastro', { id, nome, tipo: 'Material' }); save();
  }
  const sel = document.getElementById('cl-forn');
  sel.insertAdjacentHTML('beforeend', `<option>${escHtml(nome)}</option>`); sel.value = nome; _cl.forn = nome;
}

// ── Importar arquivo ──────────────────────────────────────────
async function clImportar(file) {
  if (!file) return;
  try {
    let r, texto = '';
    const nome = file.name.toLowerCase();
    if (/\.(xlsx|xls|csv)$/.test(nome)) {
      _cl.origem = 'planilha';
      const p = _clLerPlanilha(await file.arrayBuffer());
      texto = p.texto;
      r = p.itens ? { ...clParseOrcamento(''), ...(p.cond || {}), itens: p.itens } : clParseOrcamento(texto);
      if (p.itens && p.cond) { r.pix = p.cond.pix; r.cartao = p.cond.cartao; r.parcelas = p.cond.parcelas; r.frete = p.cond.frete; }
    } else if (file.type === 'application/pdf' || nome.endsWith('.pdf')) {
      _cl.origem = 'pdf'; texto = await _clLerPDF(file); r = clParseOrcamento(texto);
    } else {
      _cl.origem = 'foto';
      _clProgresso('Preparando imagem...', 3);
      texto = await _clOCR(await _clPrepararImagem(file)); r = clParseOrcamento(texto);
    }
    _clProgresso('');
    _cl.texto = texto;
    const box = document.getElementById('cl-texto-box'); if (box) { box.style.display = 'block'; document.getElementById('cl-texto').textContent = texto; }
    if (!r.itens.length) { toast('⚠️', 'Não encontrei itens com preço no orçamento. Confira o texto lido e preencha a grade manualmente.'); return; }
    // Casa com os itens em cotação (todas as obras, se nenhuma filtrada)
    const sols = _clSolsAbertas();
    const { mapa, sobras } = clCasarItens(r.itens, sols);
    let n = 0;
    Object.entries(mapa).forEach(([sid, m]) => {
      const it = r.itens[m.idx]; const s = sols.find(x => x.id === sid); const q = Number(s?.quantidade) || 0;
      let unit = it.unit || (it.total && (it.qtd || q) ? it.total / (it.qtd || q) : 0);
      // Se a loja cotou quantidade diferente, recalcula o total para a quantidade solicitada
      const total = q && unit ? unit * q : it.total;
      _cl.linhas[sid] = { unit: unit ? +unit.toFixed(2) : '', total: total ? +total.toFixed(2) : '', lido: it.raw + (it.qtd && q && it.qtd !== q ? '  (loja cotou ' + it.qtd + ')' : ''), sc: m.sc, fonte: 'auto' };
      n++;
    });
    _cl.sobras = sobras;
    // Condições
    const setC = (k, id, v) => { if (v) { _cl.cond[k] = v; const e = document.getElementById(id); if (e) { e.value = v; e.style.background = 'var(--ot-brand-soft)'; } } };
    setC('pix', 'cl-pix', r.pix); setC('cartao', 'cl-cartao', r.cartao); setC('parcelas', 'cl-parcelas', r.parcelas);
    setC('frete', 'cl-frete', r.frete); setC('prazo', 'cl-prazo', r.prazo);
    _clParcInfo(); _clRender();
    toast('✅', n + ' item(ns) preenchido(s)' + (sobras.length ? ', ' + sobras.length + ' sem correspondência' : '') + '. Confira os valores em laranja.');
  } catch (e) {
    console.error('Importar orçamento', e); _clProgresso('');
    toast('❌', 'Não foi possível ler o arquivo: ' + (e.message || e));
  }
}

// ── Salvar ────────────────────────────────────────────────────
async function salvarCotacaoLote() {
  const forn = document.getElementById('cl-forn')?.value || _cl.forn;
  if (!forn) { toast('⚠️', 'Selecione o fornecedor!'); return; }
  const sols = _clSolsAbertas();
  const itens = sols.map(s => ({ s, L: _cl.linhas[s.id] || {} })).filter(x => Number(x.L.total) > 0 || Number(x.L.unit) > 0);
  if (!itens.length) { toast('⚠️', 'Preencha o preço de pelo menos um item.'); return; }
  const soma = itens.reduce((a, x) => a + (Number(x.L.total) || (Number(x.L.unit) * (Number(x.s.quantidade) || 1))), 0);
  const pix = Number(_cl.cond.pix) || 0, cartao = Number(_cl.cond.cartao) || 0, parcelas = parseInt(_cl.cond.parcelas) || 0;
  const frete = Number(_cl.cond.frete) || 0, prazo = (_cl.cond.prazo || '').trim(), obs = (_cl.cond.obs || '').trim();
  const orcId = uuidv4();
  const orc = { id: orcId, fornecedor: forn, data: hojeISO(), valorTotal: +soma.toFixed(2), valorPix: pix, valorCartao: cartao, parcelas, frete, prazoEntrega: prazo, obs, origem: _cl.origem, _supa: true };
  (DB.orcamentosCompra = DB.orcamentosCompra || []).unshift(orc);
  _clSupa('compras_orcamentos', orcId, { fornecedor: forn, data: orc.data, valor_total: orc.valorTotal, valor_pix: pix, valor_cartao: cartao, parcelas: parcelas || null, frete, prazo_entrega: prazo, obs, origem: _cl.origem }, true);
  // Cada item vira uma cotação (PIX e cartão rateados proporcionalmente ao valor do item)
  for (const { s, L } of itens) {
    const total = Number(L.total) || Number(L.unit) * (Number(s.quantidade) || 1);
    const prop = soma ? total / soma : 0;
    const dados = { fornecedor: forn, valorUnit: Number(L.unit) || 0, valorTotal: +total.toFixed(2), valorPix: pix ? +(pix * prop).toFixed(2) : 0, valorCartao: cartao ? +(cartao * prop).toFixed(2) : 0, parcelas, prazoEntrega: prazo, obs: obs || ('Orçamento ' + forn), orcamentoId: orcId };
    const row = { fornecedor: forn, valor_unit: dados.valorUnit, valor_total: dados.valorTotal, valor_pix: dados.valorPix, valor_cartao: dados.valorCartao, parcelas: parcelas || null, prazo_entrega: prazo, obs: dados.obs, orcamento_id: orcId };
    // Mesmo fornecedor já cotou este item? Atualiza em vez de duplicar
    const ex = (DB.cotacoes || []).find(c => String(c.solicitacaoId) === String(s.id) && c.fornecedor === forn);
    if (ex) { Object.assign(ex, dados); _clSupa('compras_cotacoes', ex.id, row, false); }
    else {
      const id = uuidv4(); (DB.cotacoes = DB.cotacoes || []).push({ id, solicitacaoId: s.id, ...dados, vencedor: false, _supa: true });
      _clSupa('compras_cotacoes', id, { ...row, solicitacao_id: s.id, vencedor: false }, true);
    }
    if (s.status === 'aberta') { s.status = 'cotando'; supaUpdate('compras_solicitacoes', s.id, { status: 'cotando' }); }
  }
  save(); closeModal();
  if (typeof comprasTab === 'function') comprasTab('cotacoes');
  toast('✅', 'Cotação de ' + forn + ' salva: ' + itens.length + ' item(ns).');
}

// Grava no Supabase tolerando colunas/tabela ainda não criadas (avisa para rodar o SQL)
let _clAvisouSQL = false;
async function _clSupa(tabela, id, row, novo) {
  if (!supa || !_empresaId) return;
  const run = r => novo ? supa.from(tabela).insert({ ...r, id, empresa_id: _empresaId }) : supa.from(tabela).update(r).eq('id', id).eq('empresa_id', _empresaId);
  try {
    let { error } = await run(row);
    if (error && tabela === 'compras_cotacoes' && /orcamento_id|valor_pix|valor_cartao|parcelas/.test(error.message || '')) {
      const { orcamento_id, valor_pix, valor_cartao, parcelas, ...base } = row;
      ({ error } = await run(base));
      if (!_clAvisouSQL) { _clAvisouSQL = true; toast('⚠️', 'Cotação salva. Para guardar PIX/cartão/orçamento no banco, rode o SQL de atualização no Supabase.'); }
    }
    if (error && tabela === 'compras_orcamentos') { console.warn('compras_orcamentos', error.message); if (!_clAvisouSQL) { _clAvisouSQL = true; toast('⚠️', 'Rode o SQL de atualização no Supabase para guardar os orçamentos.'); } return; }
    if (error) { console.error(tabela, error.message); toast('❌', 'Erro ao salvar (' + tabela + '): ' + error.message.slice(0, 60)); }
  } catch (e) { console.error(tabela, e.message); }
}

// ═══════════════════════════════════════════
// MAPA COMPARATIVO — itens × fornecedores
// ═══════════════════════════════════════════
function _clMapaDados(obraId, incluirFechadas) {
  const sols = (DB.solicitacoes || []).filter(s => (!obraId || String(s.obraId) === String(obraId)) &&
    (incluirFechadas || s.status === 'aberta' || s.status === 'cotando') &&
    (DB.cotacoes || []).some(c => String(c.solicitacaoId) === String(s.id)));
  const cots = (DB.cotacoes || []).filter(c => sols.some(s => String(s.id) === String(c.solicitacaoId)));
  const forns = [...new Set(cots.map(c => c.fornecedor))].sort();
  const cel = (sid, f) => cots.find(c => String(c.solicitacaoId) === String(sid) && c.fornecedor === f);
  const resumo = forns.map(f => {
    const cs = cots.filter(c => c.fornecedor === f);
    const orc = (DB.orcamentosCompra || []).find(o => o.fornecedor === f && cs.some(c => c.orcamentoId === o.id));
    const soma = cs.reduce((a, c) => a + (c.valorTotal || 0), 0);
    // Se todas as cotações do fornecedor vieram do mesmo orçamento, usa os totais exatos da loja
    const doOrc = orc && cs.every(c => c.orcamentoId === orc.id);
    const pix = doOrc ? orc.valorPix : cs.reduce((a, c) => a + (c.valorPix || 0), 0);
    const cartao = doOrc ? orc.valorCartao : cs.reduce((a, c) => a + (c.valorCartao || 0), 0);
    const parcelas = Math.max(0, ...cs.map(c => c.parcelas || 0));
    return { f, n: cs.length, soma, pix, cartao, parcelas, frete: orc?.frete || 0, prazo: orc?.prazoEntrega || cs.find(c => c.prazoEntrega)?.prazoEntrega || '' };
  });
  return { sols, forns, cel, resumo };
}

function abrirMapaComparativo() {
  const obraOpts = '<option value="">Todas as obras</option>' + DB.obras.map(o => `<option value="${o.id}"${String(o.id) === String(window._clMapaObra || '') ? ' selected' : ''}>${escHtml(o.nome)}</option>`).join('');
  document.getElementById('modal-root').innerHTML = `<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
  <div class="mo" style="width:1180px;max-width:97vw">
    <div class="moh"><div class="mot">${ic('scale')} Mapa comparativo de preços</div><div class="mox" onclick="closeModal()">${ic('x')}</div></div>
    <div class="mob">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
        <select class="sel" id="clm-obra" style="width:220px" onchange="window._clMapaObra=this.value;_clRenderMapa()">${obraOpts}</select>
        <label style="font-size:13px;display:flex;gap:6px;align-items:center"><input type="checkbox" id="clm-hist" onchange="_clRenderMapa()"> Incluir já aprovadas</label>
        <span style="flex:1"></span>
        <button class="btn sm" onclick="gerarMapaComparativoPDF()">${ic('file-text')} PDF</button>
      </div>
      <div id="clm-tbl"></div>
    </div>
  </div></div>`;
  _clRenderMapa();
}

function _clRenderMapa() {
  const obra = document.getElementById('clm-obra')?.value || '';
  const hist = document.getElementById('clm-hist')?.checked;
  const { sols, forns, cel, resumo } = _clMapaDados(obra, hist);
  const el = document.getElementById('clm-tbl');
  if (!forns.length) { el.innerHTML = '<div class="t-empty">Nenhuma cotação para comparar.</div>'; return; }
  const menorTot = Math.min(...resumo.filter(r => r.n === sols.length).map(r => r.soma + r.frete).concat([Infinity]));
  el.innerHTML = `<div style="overflow-x:auto"><table class="tbl" style="min-width:${300 + forns.length * 150}px">
    <tr><th>Item</th><th style="text-align:right">Qtd.</th>${forns.map(f => `<th style="text-align:right">${escHtml(f)}</th>`).join('')}</tr>
    ${sols.map(s => {
      const vals = forns.map(f => cel(s.id, f)?.valorTotal || 0).filter(v => v > 0);
      const min = vals.length ? Math.min(...vals) : 0;
      return `<tr><td class="n">${escHtml(s.item)}</td><td style="text-align:right;white-space:nowrap" class="ot-num">${s.quantidade || '—'} ${escHtml(s.unidade || '')}</td>
        ${forns.map(f => { const c = cel(s.id, f); if (!c || !c.valorTotal) return '<td style="text-align:right;color:var(--txt3)">—</td>';
          const best = c.valorTotal === min && vals.length > 1;
          return `<td style="text-align:right;white-space:nowrap;${best ? 'background:var(--ot-ok-soft);color:var(--ot-ok);font-weight:600' : ''}" class="ot-num">${fmtR(c.valorTotal)}${c.vencedor ? ' ' + ic('circle-check', 'sm') : ''}<div style="font-size:10px;color:var(--txt3);font-weight:400">${c.valorUnit ? fmtR(c.valorUnit) + '/un' : ''}</div></td>`; }).join('')}</tr>`;
    }).join('')}
    ${[['Itens cotados', r => r.n + '/' + sols.length],
       ['Soma dos itens', r => fmtR(r.soma)],
       ['Frete', r => r.frete ? fmtR(r.frete) : '—'],
       ['Total com frete', r => `<strong style="${r.n === sols.length && r.soma + r.frete === menorTot ? 'color:var(--ot-ok)' : ''}">${fmtR(r.soma + r.frete)}</strong>`],
       ['No PIX', r => r.pix ? fmtR(r.pix) : '—'],
       ['No cartão', r => r.cartao ? fmtR(r.cartao) + (r.parcelas > 1 ? `<div style="font-size:10px;color:var(--txt3)">${r.parcelas}x de ${fmtR(r.cartao / r.parcelas)}</div>` : '') : '—'],
       ['Prazo', r => escHtml(r.prazo || '—')]].map(([lbl, fn], i) =>
      `<tr style="background:var(--ot-surface-sunken)${i === 0 ? ';border-top:2px solid var(--ot-border-strong)' : ''}"><td colspan="2" style="font-weight:600;color:var(--txt)">${lbl}</td>${resumo.map(r => `<td style="text-align:right;white-space:nowrap" class="ot-num">${fn(r)}</td>`).join('')}</tr>`).join('')}
  </table></div>
  <div style="font-size:12px;color:var(--txt3);margin-top:8px">Verde = menor preço do item. O total em verde é o menor entre os fornecedores que cotaram todos os itens. PIX e cartão: valor final informado pela loja.</div>`;
}

function gerarMapaComparativoPDF() {
  const obra = document.getElementById('clm-obra')?.value || '';
  const hist = document.getElementById('clm-hist')?.checked;
  const { sols, forns, cel, resumo } = _clMapaDados(obra, hist);
  if (!forns.length) { toast('⚠️', 'Nada para exportar.'); return; }
  const doc = new jsPDF();
  const M = 9;
  let y = pHdr(doc, 'Mapa Comparativo de Precos', (obra ? DB.obras.find(o => String(o.id) === String(obra))?.nome : 'Todas as obras') + '  —  ' + forns.length + ' fornecedores') + 4;
  y = pSec(doc, y, 'Precos por Item');
  const mins = sols.map(s => { const v = forns.map(f => cel(s.id, f)?.valorTotal || 0).filter(x => x > 0); return v.length > 1 ? Math.min(...v) : -1; });
  const body = sols.map(s => [s.item, (s.quantidade || '—') + ' ' + (s.unidade || ''), ...forns.map(f => { const c = cel(s.id, f); return c && c.valorTotal ? fmtR(c.valorTotal) + (c.vencedor ? ' *' : '') : '—'; })]);
  const linhasRes = [
    ['Itens cotados', '', ...resumo.map(r => r.n + '/' + sols.length)],
    ['Soma dos itens', '', ...resumo.map(r => fmtR(r.soma))],
    ['Frete', '', ...resumo.map(r => r.frete ? fmtR(r.frete) : '—')],
    ['Total com frete', '', ...resumo.map(r => fmtR(r.soma + r.frete))],
    ['No PIX', '', ...resumo.map(r => r.pix ? fmtR(r.pix) : '—')],
    ['No cartao', '', ...resumo.map(r => r.cartao ? fmtR(r.cartao) + (r.parcelas > 1 ? ' (' + r.parcelas + 'x)' : '') : '—')],
    ['Prazo', '', ...resumo.map(r => r.prazo || '—')],
  ];
  doc.autoTable({
    startY: y, head: [['Item', 'Qtd.', ...forns]], body: [...body, ...linhasRes],
    theme: 'grid',
    headStyles: { fillColor: [70, 75, 90], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 } },
    bodyStyles: { ...bStyle(), fontSize: 7.5, halign: 'right', cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 } },
    columnStyles: { 0: { halign: 'left', cellWidth: 55 }, 1: { halign: 'center', cellWidth: 18 } },
    didParseCell(d) {
      if (d.section !== 'body') return;
      if (d.row.index >= sols.length) { d.cell.styles.fillColor = [240, 241, 244]; d.cell.styles.fontStyle = 'bold'; return; }
      if (d.column.index >= 2) { const c = cel(sols[d.row.index].id, forns[d.column.index - 2]); if (c && c.valorTotal === mins[d.row.index]) { d.cell.styles.textColor = [22, 101, 52]; d.cell.styles.fontStyle = 'bold'; } }
    },
    margin: { left: M, right: M },
  });
  const fy = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(7); doc.setTextColor(110, 110, 110);
  doc.text('Verde = menor preco do item.  * = fornecedor vencedor selecionado.', M, fy);
  pFtr(doc);
  doc.save('Mapa_Comparativo_' + hojeISO() + '.pdf');
  toast('📄', 'Mapa comparativo gerado!');
}
