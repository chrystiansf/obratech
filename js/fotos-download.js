// ObraTech — Baixar fotos dos RDOs (originais, sem a compressão do PDF)
// • otBaixarFotosRDO(id)   → .zip com as fotos do dia (pastas Serviços / Materiais)
// • otBaixarFotosLote()    → .zip com uma pasta por RDO do período escolhido em Relatórios
// • otVerFoto(...)         → foto ampliada com botão Baixar (sistema); otBaixarFoto(src,nome) baixa uma só

const _otFotoSrc = f => f && (f.url || f.data || f.src || '');
const _otNomeSeguro = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 80);
const _otDtArq = d => d ? String(d).slice(0, 10).split('-').reverse().join('-') : '';

let _otJSZipProm = null;
function _otCarregarJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (_otJSZipProm) return _otJSZipProm;
  _otJSZipProm = new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload = () => ok(window.JSZip);
    s.onerror = () => { _otJSZipProm = null; erro(new Error('Não foi possível carregar o compactador.')); };
    document.head.appendChild(s);
  });
  return _otJSZipProm;
}

async function _otFotoBlob(src) {
  const r = await fetch(src, { mode: 'cors', cache: 'force-cache' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.blob();
}
const _otExt = (blob, src) => {
  const t = (blob && blob.type) || '';
  if (/png/.test(t)) return 'png'; if (/webp/.test(t)) return 'webp'; if (/heic/.test(t)) return 'heic';
  const m = /\.(jpe?g|png|webp|heic)(\?|$)/i.exec(String(src)); return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
};
function _otSalvarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Coloca as fotos de um RDO numa pasta do zip (subpastas Serviços / Materiais quando houver as duas)
async function _otAddFotosRDO(zip, rdo, pastaBase, prog) {
  const num = typeof rdoNumero === 'function' ? rdoNumero(rdo) : '';
  const fotos = (rdo.fotos || []).filter(f => _otFotoSrc(f));
  const grupos = [['Servicos', fotos.filter(f => f.tipo !== 'material')], ['Materiais', fotos.filter(f => f.tipo === 'material')]].filter(([, l]) => l.length);
  let ok = 0, falhas = 0;
  for (const [pasta, lista] of grupos) {
    const dir = grupos.length > 1 ? (pastaBase ? pastaBase + '/' : '') + pasta : pastaBase;
    for (let k = 0; k < lista.length; k++) {
      const f = lista[k], src = _otFotoSrc(f);
      try {
        const blob = await _otFotoBlob(src);
        const nome = _otNomeSeguro('RDO ' + String(num).padStart(2, '0') + ' - ' + String(k + 1).padStart(2, '0') + (f.desc ? ' - ' + f.desc : '')) + '.' + _otExt(blob, src);
        (dir ? zip.folder(dir) : zip).file(nome, blob);
        ok++;
      } catch (e) { falhas++; console.warn('Foto não baixada', src, e.message); }
      if (prog) prog();
    }
  }
  return { ok, falhas };
}

async function otBaixarFotosRDO(id) {
  const rdo = (DB.rdos || []).find(x => String(x.id) === String(id)); if (!rdo) return;
  const n = (rdo.fotos || []).filter(f => _otFotoSrc(f)).length;
  if (!n) { toast('⚠️', 'Este RDO não tem fotos.'); return; }
  try {
    toast('⏳', 'Preparando ' + n + ' foto(s)...');
    const JSZip = await _otCarregarJSZip(); const zip = new JSZip();
    const r = await _otAddFotosRDO(zip, rdo, '');
    if (!r.ok) { toast('❌', 'Não foi possível baixar as fotos.'); return; }
    const obra = DB.obras.find(o => String(o.id) === String(rdo.obraId));
    const blob = await zip.generateAsync({ type: 'blob' });
    _otSalvarBlob(blob, _otNomeSeguro('Fotos RDO ' + String(rdoNumero(rdo)).padStart(2, '0') + ' ' + (obra?.nome || '').toUpperCase() + ' ' + _otDtArq(rdo.data)) + '.zip');
    toast('✅', r.ok + ' foto(s) baixada(s)' + (r.falhas ? ' (' + r.falhas + ' não puderam ser baixadas)' : '') + '.');
  } catch (e) { toast('❌', 'Erro ao baixar fotos: ' + e.message); }
}

async function otBaixarFotosLote() {
  const oId = document.getElementById('rel-obra')?.value || '';
  const de = document.getElementById('rel-de')?.value || '', ate = document.getElementById('rel-ate')?.value || '';
  const rdos = (DB.rdos || []).filter(r => (!oId || String(r.obraId) === String(oId)) && (!de || String(r.data || '') >= de) && (!ate || String(r.data || '') <= ate)
    && r.status === 'finalizado' && (r.fotos || []).some(f => _otFotoSrc(f))).sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')));
  if (!rdos.length) { toast('⚠️', 'Nenhum RDO finalizado com fotos no período.'); return; }
  const total = rdos.reduce((a, r) => a + (r.fotos || []).filter(f => _otFotoSrc(f)).length, 0);
  try {
    const JSZip = await _otCarregarJSZip(); const zip = new JSZip();
    let feitas = 0, ok = 0, falhas = 0;
    const prog = () => { feitas++; if (feitas % 5 === 0 || feitas === total) toast('⏳', 'Baixando fotos ' + feitas + ' de ' + total + '...'); };
    for (const rdo of rdos) {
      const obra = DB.obras.find(o => String(o.id) === String(rdo.obraId));
      const pasta = _otNomeSeguro((oId ? '' : (obra?.nome || 'Obra') + '/') + 'RDO ' + String(rdoNumero(rdo)).padStart(2, '0') + ' - ' + _otDtArq(rdo.data));
      const r = await _otAddFotosRDO(zip, rdo, pasta, prog); ok += r.ok; falhas += r.falhas;
    }
    if (!ok) { toast('❌', 'Não foi possível baixar as fotos.'); return; }
    toast('⏳', 'Compactando...');
    const blob = await zip.generateAsync({ type: 'blob' });
    const ob = oId ? DB.obras.find(o => String(o.id) === String(oId)) : null;
    _otSalvarBlob(blob, _otNomeSeguro('Fotos RDOs ' + (ob ? ob.nome.toUpperCase() + ' ' : '') + (de || ate ? _otDtArq(de) + (ate ? ' a ' + _otDtArq(ate) : '') : '')) + '.zip');
    toast('✅', ok + ' foto(s) de ' + rdos.length + ' RDO(s) baixadas' + (falhas ? ' (' + falhas + ' com falha)' : '') + '.');
  } catch (e) { toast('❌', 'Erro ao baixar fotos: ' + e.message); }
}

// Uma foto só, na resolução original
async function otBaixarFoto(src, nome) {
  try { const blob = await _otFotoBlob(src); _otSalvarBlob(blob, _otNomeSeguro(nome || 'foto') + '.' + _otExt(blob, src)); }
  catch (e) { window.open(src, '_blank'); }   // se o navegador bloquear, abre a foto para salvar manualmente
}

// Foto ampliada no sistema (RDO), com navegação e botão Baixar
function otVerFoto(lista, k, titulo) {
  lista = (lista || []).filter(f => _otFotoSrc(f)); if (!lista.length) return;
  k = Math.max(0, Math.min(k || 0, lista.length - 1));
  let el = document.getElementById('ot-foto-ampliada');
  if (!el) { el = document.createElement('div'); el.id = 'ot-foto-ampliada'; document.body.appendChild(el); }
  const draw = () => {
    const f = lista[k], src = _otFotoSrc(f);
    el.innerHTML = `<div class="pcx-lightbox" onclick="if(event.target===this)document.getElementById('ot-foto-ampliada').remove()">
      <button class="pcx-lb-x" onclick="document.getElementById('ot-foto-ampliada').remove()" aria-label="Fechar">${ic('x')}</button>
      ${lista.length > 1 ? `<button class="pcx-lb-nav esq" onclick="window._otFotoNav(-1)" aria-label="Anterior">‹</button><button class="pcx-lb-nav dir" onclick="window._otFotoNav(1)" aria-label="Próxima">›</button>` : ''}
      <img src="${src}" alt="">
      <div class="pcx-lb-cap"><span class="ot-num">${k + 1}/${lista.length}</span>${f.desc ? ' — ' + escHtml(f.desc) : ''}
        <button class="btn sm pri ot-lb-baixar" onclick="otBaixarFoto(window._otFotoAtual,window._otFotoNome)">${ic('download')} Baixar</button></div>
    </div>`;
    window._otFotoAtual = src;
    window._otFotoNome = (titulo ? titulo + ' - ' : '') + String(k + 1).padStart(2, '0') + (f.desc ? ' - ' + f.desc : '');
  };
  window._otFotoNav = s => { k = (k + s + lista.length) % lista.length; draw(); };
  draw();
}
