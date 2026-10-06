// ═══════════════════════════════════════════
// UTILS — Funções utilitárias globais
// ═══════════════════════════════════════════

function fmtR(v){return 'R$'+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtDt(d){if(!d)return'—';try{const[y,m,day]=d.split('-');return`${day}/${m}/${y}`;}catch{return d;}}
// toast() está em js/icons.js (mostra ícone de traço)

// Helper: hex para RGB array
function hexToRgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.substring(0,2),16),parseInt(hex.substring(2,4),16),parseInt(hex.substring(4,6),16)];
}
// Retorna a cor primaria da empresa como RGB array
function corEmpresa(){return hexToRgb(_empresaCor||'#0A193C');}

// Sanitizar HTML para prevenir XSS
function escHtml(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

// Debounce genérico
let _debounceTimers={};
function debounce(key,fn,ms){clearTimeout(_debounceTimers[key]);_debounceTimers[key]=setTimeout(fn,ms||300);}

// ── Segurança ─────────────────────────────────────────────────
// Senha provisória aleatória (criptográfica), 12 caracteres, fácil de digitar
function gerarSenhaForte(){
  const L='ABCDEFGHJKLMNPQRSTUVWXYZ',l='abcdefghijkmnopqrstuvwxyz',N='23456789',S='!@#$%*';
  const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;};
  const pick=t=>t[rnd(t.length)];
  const ch=[pick(L),pick(l),pick(N),pick(S)];
  const todos=L+l+N;
  while(ch.length<12) ch.push(pick(todos));
  for(let i=ch.length-1;i>0;i--){const j=rnd(i+1);[ch[i],ch[j]]=[ch[j],ch[i]];}
  return ch.join('');
}
// Remove < e > de textos para impedir que alguém injete código (HTML/script) pelos campos
function _semTags(v){
  if(typeof v==='string') return v.indexOf('<')<0&&v.indexOf('>')<0?v:v.replace(/[<>]/g,'');
  if(Array.isArray(v)) return v.map(_semTags);
  if(v&&typeof v==='object'&&!(v instanceof Date)&&!(typeof Blob!=='undefined'&&v instanceof Blob)){
    const o={};for(const k in v)o[k]=typeof v[k]==='string'&&/^(data:|https?:|blob:)/.test(v[k])?v[k]:_semTags(v[k]);return o;}
  return v;
}
