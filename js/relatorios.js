// ════════════════════════════════════════════════════════════
// RELATÓRIOS — seleção múltipla
// ════════════════════════════════════════════════════════════
function exportEstoqueXLS(){
  const obraIdSel = document.getElementById('rel-obra-export')?.value || '';
  const obrasAlvo = obraIdSel ? DB.obras.filter(o => o.id == obraIdSel) : DB.obras;
  if (!DB.estoque.length) { toast('⚠️', 'Nenhum material no estoque!'); return; }
  const wb = XLSX.utils.book_new();
  const catHead = [['Material','Unidade','Preco Unit. (R$)','Fornecedor','Qtd Minima']];
  const catBody = DB.estoque.map(e => [e.material||'--',e.un||'--',Number(e.preco||0),e.forn||'--',Number(e.min||0)]);
  const wsCat = XLSX.utils.aoa_to_sheet([...catHead,...catBody]);
  wsCat['!cols']=[{wch:30},{wch:10},{wch:16},{wch:28},{wch:12}];
  XLSX.utils.book_append_sheet(wb,wsCat,'Catalogo');
  const sldHead = [['Material','Un',...obrasAlvo.map(o=>o.nome),'TOTAL']];
  const sldBody = DB.estoque.map(e=>{
    const saldos=obrasAlvo.map(o=>{
      const ent=DB.movs.filter(m=>m.estId===e.id&&m.obraId==o.id&&m.tipo==='Entrada').reduce((a,m)=>a+Number(m.qtd||0),0);
      const sai=DB.movs.filter(m=>m.estId===e.id&&m.obraId==o.id&&m.tipo==='Saida').reduce((a,m)=>a+Number(m.qtd||0),0);
      return ent-sai;
    });
    return [e.material||'--',e.un||'--',...saldos,saldos.reduce((a,v)=>a+v,0)];
  });
  const wsSld=XLSX.utils.aoa_to_sheet([...sldHead,...sldBody]);
  wsSld['!cols']=[{wch:30},{wch:8},...obrasAlvo.map(()=>({wch:18})),{wch:12}];
  XLSX.utils.book_append_sheet(wb,wsSld,'Saldos por Obra');
  const movHead=[['Data','Material','Obra','Tipo','Qtd','NF','Obs']];
  const movBody=DB.movs.filter(m=>!obraIdSel||m.obraId==obraIdSel).sort((a,b)=>b.data.localeCompare(a.data)).map(m=>{
    const e=DB.estoque.find(x=>x.id===m.estId);
    const o=DB.obras.find(x=>x.id==m.obraId);
    return[m.data||'--',e?.material||'--',o?.nome||'--',m.tipo||'--',Number(m.qtd||0),m.nf||'--',m.obs||'--'];
  });
  const wsMov=XLSX.utils.aoa_to_sheet([...movHead,...movBody]);
  wsMov['!cols']=[{wch:12},{wch:30},{wch:25},{wch:10},{wch:8},{wch:14},{wch:25}];
  XLSX.utils.book_append_sheet(wb,wsMov,'Movimentacoes');
  const nomeObra=obraIdSel?(obrasAlvo[0]?.nome||'Obra').replace(/\s+/g,'_'):'Todas';
  XLSX.writeFile(wb,'Estoque_'+nomeObra+'_'+new Date().toISOString().split('T')[0]+'.xlsx');
  toast('📊','Planilha de estoque exportada com 3 abas!');
}

const REL_MAP={
  gerencial:{fn:()=>gerarRelGerencial(),label:'Gerencial'},
  dre:{fn:()=>exportFinPDF(),label:'DRE'},
  folha:{fn:()=>exportFolhaPDF(),label:'Folha'},
  cronograma:{fn:()=>exportGanttPDF(),label:'Cronograma'},
  qualidade:{fn:()=>exportQualPDF(),label:'Qualidade'},
  estoque:{fn:()=>exportEstoqueXLS(),label:'Estoque'},
  m2:{fn:()=>exportCustoM2PDF(),label:'Custo m²'},
};
let _relSel=new Set();

function relToggle(id){
  if(_relSel.has(id))_relSel.delete(id);else _relSel.add(id);
  const card=document.getElementById('rc-'+id);
  if(card)card.classList.toggle('sel',_relSel.has(id));
  updateRelBar();
}
function relSelectAll(){
  Object.keys(REL_MAP).forEach(id=>{
    _relSel.add(id);
    document.getElementById('rc-'+id)?.classList.add('sel');
  });
  updateRelBar();
}
function relClearAll(){
  _relSel.clear();
  Object.keys(REL_MAP).forEach(id=>document.getElementById('rc-'+id)?.classList.remove('sel'));
  updateRelBar();
}
function updateRelBar(){
  const n=_relSel.size;
  const countEl=document.getElementById('rel-count');
  const btn=document.getElementById('rel-export-btn');
  if(countEl)countEl.textContent=n?n+' selecionado'+(n>1?'s':''):' Nenhum selecionado';
  if(btn){btn.disabled=n===0;btn.style.opacity=n?'1':'.5';}
}
async function exportarSelecionados(){
  if(!_relSel.size){toast('⚠️','Selecione ao menos um relatório!');return;}
  const obraId=document.getElementById('rel-obra-export')?.value;
  // Propagar obra selecionada para todos os seletores relevantes
  function forcarObra(id){
    if(!id) return;
    const oid=parseInt(id);
    DB.sel=oid;
    // Cronograma
    const cs=document.getElementById('cron-obra-sel');
    if(cs) cs.value=oid;
    // Custo m²
    const ms=document.getElementById('m2-obra-sel');
    if(ms) ms.value=oid;
    // RDO
    const rs=document.getElementById('rdo-obra');
    if(rs) rs.value=oid;
    // Financeiro / outros
    const fs=document.getElementById('rel-obra');
    if(fs) fs.value=oid;
  }
  const prevSel=DB.sel;
  if(obraId) forcarObra(obraId);
  let ok=0, erros=0;
  const ids=[..._relSel];
  toast('⏳','Gerando '+ids.length+' relatório(s)...');
  for(const id of ids){
    try{
      const fn=REL_MAP[id]?.fn;
      if(fn) await fn();
      ok++;
    }catch(e){
      console.warn('Erro no relatório '+id+':',e);
      erros++;
    }
    await new Promise(r=>setTimeout(r,600));
  }
  DB.sel=prevSel;
  if(erros===0) toast('✅',ok+' relatório(s) exportado(s) com sucesso!');
  else toast('⚠️',ok+' ok, '+erros+' com erro. Verifique os dados de cada módulo.');
}

