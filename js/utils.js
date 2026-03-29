// ═══════════════════════════════════════════
// UTILS — Funções utilitárias globais
// ═══════════════════════════════════════════

function fmtR(v){return 'R$'+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtDt(d){if(!d)return'—';try{const[y,m,day]=d.split('-');return`${day}/${m}/${y}`;}catch{return d;}}
let _tT;
function toast(ico,msg){document.getElementById('t-ico').textContent=ico;document.getElementById('t-msg').textContent=msg;const t=document.getElementById('toast');t.style.display='block';clearTimeout(_tT);_tT=setTimeout(()=>t.style.display='none',3500);}

// Helper: hex para RGB array
function hexToRgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.substring(0,2),16),parseInt(hex.substring(2,4),16),parseInt(hex.substring(4,6),16)];
}
// Retorna a cor primaria da empresa como RGB array
function corEmpresa(){return hexToRgb(_empresaCor||'#0A193C');}
