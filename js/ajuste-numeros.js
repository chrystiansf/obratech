// ObraTech — números sempre legíveis (celular e computador)
// Valores grandes (ex.: R$1.029.535,63) nunca vazam do card: a fonte reduz só o necessário.
// Se mesmo assim ficarem pequenos demais no celular, o card passa a ocupar a linha inteira.
(function(){
  const ALVOS='.kv,.pc-kv,.pcx-big,.pcx-fin-big,.ocat-resumo b,.ocat-row > .ocat-num';
  const MIN_FONTE=18;      // abaixo disso o card ganha a linha inteira (celular)
  let agendado=false;

  function caberNum(el){
    el.style.fontSize='';
    const base=parseFloat(getComputedStyle(el).fontSize)||16;
    const livre=el.clientWidth;
    if(!livre) return null;
    const preciso=el.scrollWidth;
    if(preciso<=livre+1) return base;
    const tam=Math.max(12,Math.floor(base*livre/preciso*10)/10);
    el.style.fontSize=tam+'px';
    return tam;
  }

  function ajustar(){
    agendado=false;
    const celular=innerWidth<=768;
    document.querySelectorAll('.kpi[data-ot-sobra]').forEach(c=>{c.style.gridColumn='';delete c.dataset.otSobra;});
    document.querySelectorAll(ALVOS).forEach(el=>{
      if(!el.offsetParent) return;
      const card=el.closest('.kpi');
      const grade=card&&card.parentElement;
      if(card&&card.dataset.otLinha&&!celular){card.style.gridColumn='';delete card.dataset.otLinha;}
      let tam=caberNum(el);
      // Celular: card de indicador numa grade de 2 colunas ganha a linha toda se o número ficou pequeno demais
      if(celular&&tam!==null&&card&&grade&&getComputedStyle(grade).display==='grid'){
        if(card.dataset.otLinha){
          card.style.gridColumn='';delete card.dataset.otLinha;tam=caberNum(el);
        }
        if(tam<MIN_FONTE&&getComputedStyle(grade).gridTemplateColumns.split(' ').length>1){
          card.style.gridColumn='1 / -1';card.dataset.otLinha='1';caberNum(el);
        }
      }
    });
    // Celular: card que sobrou sozinho numa linha (ao lado de um buraco) também ocupa a linha toda
    if(celular){
      const grades=new Set([...document.querySelectorAll('.kpi[data-ot-linha]')].map(c=>c.parentElement));
      grades.forEach(g=>{
        const soltos=[...g.children].filter(c=>c.offsetParent&&!c.dataset.otLinha);
        if(soltos.length%2===1){const c=soltos[soltos.length-1];if(c.classList.contains('kpi')){c.style.gridColumn='1 / -1';c.dataset.otSobra='1';}}
      });
    }
  }

  function agendar(){ if(agendado) return; agendado=true; requestAnimationFrame(ajustar); }
  window.otAjustarNumeros=agendar;

  function iniciar(){
    new MutationObserver(agendar).observe(document.body,{childList:true,subtree:true,characterData:true});
    addEventListener('resize',agendar);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(agendar);
    agendar();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
