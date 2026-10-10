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

// Senha provisória legível e segura o suficiente para o 1º acesso (ex.: Obra-K7P4-38).
// No primeiro login o sistema obriga a pessoa a criar a própria senha.
function gerarSenhaLegivel(){
  const P=['Obra','Torre','Casa','Viga','Laje','Bloco','Piso','Muro'],C='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;};
  let m='';for(let i=0;i<4;i++)m+=C[rnd(C.length)];
  return P[rnd(P.length)]+'-'+m+'-'+String(10+rnd(90));
}

// Datas no fuso local (o toISOString usa UTC: depois das 21h no Brasil já seria "amanhã")
function hojeISO(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
// Converte 'aaaa-mm-dd' em Date local (new Date('aaaa-mm-dd') seria meia-noite UTC = dia anterior no Brasil)
function dataLocal(v){if(!v)return null;const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));if(m)return new Date(+m[1],+m[2]-1,+m[3]);const b=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(v));if(b)return new Date(+b[3],+b[2]-1,+b[1]);const d=new Date(v);return isNaN(d)?null:d;}

// Ordem alfabética (pt-BR, ignora acento e maiúscula, números em ordem natural)
function ordAlfa(a,b){return String(a??'').localeCompare(String(b??''),'pt-BR',{sensitivity:'base',numeric:true});}
// Preenche um filtro de obra: mantém a 1ª opção ("Todas as obras"), obras em ordem alfabética e o valor escolhido
function otPreencherObras(sel){
  if(!sel) return;
  const atual=sel.value, primeira=sel.options[0]&&sel.options[0].value===''?sel.options[0].outerHTML:'';
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  sel.innerHTML=primeira+DB.obras.slice().sort((a,b)=>ordAlfa(a.nome,b.nome)).map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join('');
  sel.value=[...sel.options].some(o=>o.value===atual)?atual:'';
}

// Listas de cadastro sempre em ordem alfabética: todas as listas de seleção do sistema saem em ordem
function otOrdenarListas(){
  if(typeof DB==='undefined'||!DB) return;
  const porCampo=(k,c)=>{if(Array.isArray(DB[k]))DB[k].sort((a,b)=>ordAlfa(a&&a[c],b&&b[c]));};
  const texto=k=>{if(Array.isArray(DB[k]))DB[k].sort(ordAlfa);};
  porCampo('obras','nome');porCampo('fornecedores','nome');porCampo('colabs','nome');porCampo('terceirizados','nome');
  porCampo('investidores','nome');porCampo('estoque','material');
  texto('categorias');texto('centros');texto('unidades');
  if(Array.isArray(DB.fornecedores)&&DB.fornecedores.some(f=>typeof f==='string')) DB.fornecedores.sort((a,b)=>ordAlfa(typeof a==='object'?a.nome:a,typeof b==='object'?b.nome:b));
}

// Data em aaaa-mm-dd (aceita dd/mm/aaaa e data com hora) para comparar períodos
function _dataISO(v){
  if(!v) return '';
  const s=String(v).trim();
  const br=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if(br) return br[3]+'-'+br[2]+'-'+br[1];
  return s.slice(0,10);
}

// Campo numérico selecionado + roda do mouse/touchpad: o navegador somava/subtraía 0,01 a cada giro
// (ex.: R$ 60,00 virava 59,97 ao rolar a tela). Ao rolar sobre o campo, ele perde o foco e a página rola normalmente.
document.addEventListener('wheel',e=>{
  const el=document.activeElement;
  if(el&&el.tagName==='INPUT'&&el.type==='number'&&(e.target===el||el.contains(e.target))) el.blur();
},{passive:true,capture:true});
