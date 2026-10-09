// ═══════════════════════════════════════════
// DATAS NO PADRÃO BRASILEIRO (dd/mm/aaaa) em todos os campos de data
// O <input type="date"> segue o idioma do navegador (em inglês mostra mm/dd/aaaa).
// Aqui o texto nativo fica oculto e uma camada mostra a data em dd/mm/aaaa.
// O valor do campo continua no formato padrão (aaaa-mm-dd): nada muda nos dados.
// ═══════════════════════════════════════════
(function () {
  const fmt = v => { if (!v) return ''; const [y, m, d] = String(v).split('-'); return d && m && y ? `${d}/${m}/${y}` : ''; };

  function atualizar(el) {
    const t = el.__otTxt; if (!t) return;
    const v = el.value;
    t.textContent = v ? fmt(v) : 'dd/mm/aaaa';
    t.classList.toggle('vazio', !v);
  }

  function aplicar(el) {
    if (el.__otTxt || el.type !== 'date' || !el.parentNode) return;
    const cs = getComputedStyle(el);
    const wrap = document.createElement('span');
    wrap.className = 'ot-data-wrap';
    if (el.style.width) { wrap.style.width = el.style.width; wrap.style.display = 'inline-block'; el.style.width = '100%'; }
    else if (el.classList.contains('inp') || cs.width === '100%' || cs.display === 'block') wrap.style.display = 'block';
    if (el.style.flex) { wrap.style.flex = el.style.flex; }
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    const txt = document.createElement('span');
    txt.className = 'ot-data-txt';
    txt.style.fontSize = cs.fontSize;
    txt.style.paddingLeft = cs.paddingLeft;
    wrap.appendChild(txt);
    el.__otTxt = txt;
    el.classList.add('ot-data');
    el.addEventListener('input', () => atualizar(el));
    el.addEventListener('change', () => atualizar(el));
    // Digitação no campo nativo seguiria a ordem americana: abrimos o calendário em vez disso
    el.addEventListener('keydown', e => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') return;
      e.preventDefault();
      if (e.key === 'Backspace' || e.key === 'Delete') {
        el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      try { el.showPicker(); } catch (_) {}
    });
    el.addEventListener('click', () => { try { el.showPicker(); } catch (_) {} });
    atualizar(el);
  }

  // Valor definido pelo código (ex.: ao abrir um RDO salvo) também atualiza o texto
  const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  Object.defineProperty(HTMLInputElement.prototype, 'value', {
    configurable: true, enumerable: d.enumerable,
    get() { return d.get.call(this); },
    set(v) { d.set.call(this, v); if (this.__otTxt) atualizar(this); }
  });

  const varrer = raiz => { if (raiz.querySelectorAll) raiz.querySelectorAll('input[type=date]').forEach(aplicar); };
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.matches && n.matches('input[type=date]')) aplicar(n); else varrer(n);
  }))).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => varrer(document)); else varrer(document);
  window.otDatasBR = varrer;
})();
