// ORÇAMENTO
// ═══════════════════════════════════════════

const ORC_TEMPLATE=[
{cod:"1",nome:"SERVIÇOS PRELIMINARES",subs:[
{cod:"1.1",desc:"Limpeza e remoção da camada vegetal",un:"m²",qtd:0,unit:0},
{cod:"1.2",desc:"Ligação de água provisória",un:"vb",qtd:0,unit:0},
{cod:"1.3",desc:"Montagem do canteiro de obras (tapumes, depósitos, banheiro, etc)",un:"vb",qtd:0,unit:0},
{cod:"1.4",desc:"Topografia - Marcação de pontos",un:"vb",qtd:0,unit:0},
{cod:"1.5",desc:"Marcação do Gabarito",un:"vb",qtd:0,unit:0}
]},
{cod:"2",nome:"INFRAESTRUTURA",subs:[
{cod:"2.1",desc:"Armação de tela metálica de sapatas",un:"kg",qtd:0,unit:0},
{cod:"2.2",desc:"Locação das sapatas",un:"un",qtd:0,unit:0},
{cod:"2.3",desc:"Escavação das sapatas",un:"m³",qtd:0,unit:0},
{cod:"2.4",desc:"Armação de arranques de pilares",un:"kg",qtd:0,unit:0},
{cod:"2.5",desc:"Fabricação de formas para sapatas (com reutilização)",un:"m²",qtd:0,unit:0},
{cod:"2.6",desc:"Fabricação de formas para arranques de pilares (com reutilização)",un:"m²",qtd:0,unit:0},
{cod:"2.7",desc:"Lastro de concreto magro para sapatas",un:"m³",qtd:0,unit:0},
{cod:"2.8",desc:"Locação de armaduras de sapatas",un:"un",qtd:0,unit:0},
{cod:"2.9",desc:"Concretagem de sapatas",un:"m³",qtd:0,unit:0},
{cod:"2.10",desc:"Concretagem dos arranques de pilares",un:"m³",qtd:0,unit:0},
{cod:"2.11",desc:"Armação de vigas baldrame",un:"kg",qtd:0,unit:0},
{cod:"2.12",desc:"Aplicação de betume impermeabilizantes nas sapatas e arranques de pilares e posterior reaterro das valas",un:"m²",qtd:0,unit:0},
{cod:"2.12b",desc:"Fabricação de painéis de madeira para formas de vigas baldrame",un:"m²",qtd:0,unit:0},
{cod:"2.13",desc:"Locação de formas de viga baldrame",un:"m",qtd:0,unit:0},
{cod:"2.14",desc:"Concretagem de vigas baldrame",un:"m³",qtd:0,unit:0}
]},
{cod:"3",nome:"SUPERESTRUTURA",subs:[
{cod:"3.1",desc:"Armação de pilares do térreo",un:"kg",qtd:0,unit:0},
{cod:"3.2",desc:"Locação de armaduras dos pilares do térreo",un:"un",qtd:0,unit:0},
{cod:"3.3",desc:"Fabricação de formas para pilares",un:"m²",qtd:0,unit:0},
{cod:"3.4",desc:"Locação de formas dos pilares do térreo",un:"un",qtd:0,unit:0},
{cod:"3.5",desc:"Concretagem de pilares do térreo",un:"m³",qtd:0,unit:0},
{cod:"3.6",desc:"Armação das vigas da laje do primeiro pavimento",un:"kg",qtd:0,unit:0},
{cod:"3.7",desc:"Montagem dos fundos de viga do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"3.8",desc:"Superior - Armação de pilares utilizando aço CA-50",un:"kg",qtd:0,unit:0},
{cod:"3.9",desc:"Locação das formas de vigas do primeiro pavimento",un:"m",qtd:0,unit:0},
{cod:"3.10",desc:"Armação das vigas da laje da cobertura",un:"kg",qtd:0,unit:0},
{cod:"3.11",desc:"Locação das armaduras das vigas do primeiro pavimento",un:"un",qtd:0,unit:0},
{cod:"3.12",desc:"Armação dos pilares do primeiro pavimento",un:"kg",qtd:0,unit:0},
{cod:"3.13",desc:"Armação das vigas da laje de cobertura",un:"kg",qtd:0,unit:0},
{cod:"3.14",desc:"Montagem da laje do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"3.15",desc:"Concretagem da laje do primeiro pavimento",un:"m³",qtd:0,unit:0},
{cod:"3.16",desc:"Desforma da laje do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"3.17",desc:"Locação de formas dos pilares do primeiro pavimento",un:"un",qtd:0,unit:0},
{cod:"3.18",desc:"Concretagem dos pilares do primeiro pavimento",un:"m³",qtd:0,unit:0},
{cod:"3.19",desc:"Montagem dos fundos de viga da cobertura",un:"m²",qtd:0,unit:0},
{cod:"3.20",desc:"Locação das formas de vigas da laje de cobertura",un:"m",qtd:0,unit:0},
{cod:"3.21",desc:"Locação das armaduras das vigas da cobertura",un:"un",qtd:0,unit:0},
{cod:"3.22",desc:"Montagem da laje da cobertura",un:"m²",qtd:0,unit:0},
{cod:"3.23",desc:"Concretagem da laje da cobertura",un:"m³",qtd:0,unit:0}
]},
{cod:"4",nome:"PAREDES E PAINÉIS",subs:[
{cod:"4.1",desc:"Marcação de paredes do térreo",un:"m",qtd:0,unit:0},
{cod:"4.2",desc:"Assentamento de blocos cerâmicos",un:"m²",qtd:0,unit:0},
{cod:"4.3",desc:"Impermeabilização da alvenaria de embasamento e das três primeiras fiadas de alvenaria do térreo",un:"m²",qtd:0,unit:0},
{cod:"4.4",desc:"Chapisco do térreo",un:"m²",qtd:0,unit:0},
{cod:"4.5",desc:"Taliscamento de paredes do térreo",un:"m²",qtd:0,unit:0},
{cod:"4.6",desc:"Reboco das paredes do térreo",un:"m²",qtd:0,unit:0},
{cod:"4.7",desc:"Marcação das paredes do primeiro pavimento",un:"m",qtd:0,unit:0},
{cod:"4.8",desc:"Chapisco do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"4.9",desc:"Taliscamento de paredes do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"4.10",desc:"Reboco das paredes do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"4.11",desc:"Requadro/reboco das vigas externas da laje do primeiro pavimento",un:"m",qtd:0,unit:0},
{cod:"4.12",desc:"Reboco externo",un:"m²",qtd:0,unit:0}
]},
{cod:"5",nome:"IMPERMEABILIZAÇÃO",subs:[
{cod:"5.1",desc:"Impermeabilização dos banheiros",un:"m²",qtd:0,unit:0},
{cod:"5.2",desc:"Impermeabilização da laje de cobertura",un:"m²",qtd:0,unit:0}
]},
{cod:"6",nome:"PAVIMENTAÇÃO",subs:[
{cod:"6.1",desc:"Concretagem piso do térreo",un:"m²",qtd:0,unit:0},
{cod:"6.2",desc:"Contrapiso térreo",un:"m²",qtd:0,unit:0},
{cod:"6.3",desc:"Contrapiso do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"6.4",desc:"Concretagem piso entorno piscina",un:"m²",qtd:0,unit:0},
{cod:"6.5",desc:"Piso da garagem",un:"m²",qtd:0,unit:0}
]},
{cod:"7",nome:"ESCADA",subs:[
{cod:"7.1",desc:"Escavação para sapata da escada",un:"m³",qtd:0,unit:0},
{cod:"7.2",desc:"Armação de sapata e estribos para escada",un:"kg",qtd:0,unit:0},
{cod:"7.3",desc:"Montagem de escada plissada",un:"vb",qtd:0,unit:0},
{cod:"7.4",desc:"Concretagem de sapata da escada",un:"m³",qtd:0,unit:0},
{cod:"7.5",desc:"Concretagem do arraque da escada",un:"m³",qtd:0,unit:0},
{cod:"7.6",desc:"Impermeabilização da infraestrutura da escada",un:"m²",qtd:0,unit:0},
{cod:"7.7",desc:"Reaterro da infraestrutura da escada",un:"m³",qtd:0,unit:0},
{cod:"7.8",desc:"Locação de armadura da escada",un:"kg",qtd:0,unit:0},
{cod:"7.9",desc:"Concretagem da escada",un:"m³",qtd:0,unit:0},
{cod:"7.10",desc:"Revestimento da escada",un:"m²",qtd:0,unit:0}
]},
{cod:"8",nome:"INSTALAÇÕES HIDROSSANITÁRIAS",subs:[
{cod:"8.1",desc:"Marcação e cortes para passagem de tubos e conexões",un:"vb",qtd:0,unit:0},
{cod:"8.2",desc:"Instalação de pontos sanitários (vaso, ralos, pias e lavatórios)",un:"un",qtd:0,unit:0},
{cod:"8.3",desc:"Escavação para tubos de drenagem e esgoto e caixas de passagem",un:"m",qtd:0,unit:0},
{cod:"8.4",desc:"Ligação da caixa d'água",un:"vb",qtd:0,unit:0},
{cod:"8.5",desc:"Montagem e instalação de tubulações de água fria",un:"m",qtd:0,unit:0}
]},
{cod:"9",nome:"INSTALAÇÕES ELÉTRICAS",subs:[
{cod:"9.1",desc:"Corte para passagem de conduítes e caixas",un:"vb",qtd:0,unit:0},
{cod:"9.2",desc:"Passagem de eletrodutos e conduítes para o cabeamento elétrico",un:"m",qtd:0,unit:0},
{cod:"9.3",desc:"Passagem de cabos",un:"m",qtd:0,unit:0},
{cod:"9.4",desc:"Instalação de pontos de iluminação nos forros",un:"un",qtd:0,unit:0},
{cod:"9.5",desc:"Instalação de quadro de distribuição principal",un:"un",qtd:0,unit:0},
{cod:"9.6",desc:"Instalação das TUG's e interruptores",un:"un",qtd:0,unit:0},
{cod:"9.7",desc:"Ligação do poste para a mureta e ligação do disjuntor do ramal de entrada e conexão do barramento",un:"vb",qtd:0,unit:0},
{cod:"9.8",desc:"Iluminação do muro",un:"vb",qtd:0,unit:0}
]},
{cod:"10",nome:"INSTALAÇÕES HVAC",subs:[
{cod:"10.1",desc:"Corte para passagem dos drenos dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.2",desc:"Passagem dos drenos dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.3",desc:"Chumbamento dos drenos dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.4",desc:"Corte para passagem das tubulações de cobre dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.5",desc:"Passagem das tubulações de cobre dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.6",desc:"Chumbamento das tubulações de cobre dos ar condicionados",un:"m",qtd:0,unit:0},
{cod:"10.7",desc:"Instalação das caixas polares",un:"un",qtd:0,unit:0},
{cod:"10.8",desc:"Impermeabilização e reforço dos furos em lajes, feitos para passagem da infraestrutura de AC",un:"un",qtd:0,unit:0}
]},
{cod:"11",nome:"MURO",subs:[
{cod:"11.1",desc:"Escavação de sapatas",un:"m³",qtd:0,unit:0},
{cod:"11.2",desc:"Armação de sapatas e arranques de pilares",un:"kg",qtd:0,unit:0},
{cod:"11.3",desc:"Montagem de forma para sapatas",un:"m²",qtd:0,unit:0},
{cod:"11.4",desc:"Lastro de concreto magro base sapata",un:"m³",qtd:0,unit:0},
{cod:"11.5",desc:"Concretagem de sapatas",un:"m³",qtd:0,unit:0},
{cod:"11.6",desc:"Montagem de forma dos arraques de pilares",un:"m²",qtd:0,unit:0},
{cod:"11.7",desc:"Concretagem dos arraques de pilares",un:"m³",qtd:0,unit:0},
{cod:"11.8",desc:"Lastro de concreto magro base vigas baldrame",un:"m³",qtd:0,unit:0},
{cod:"11.9",desc:"Montagem de forma das vigas baldrame",un:"m²",qtd:0,unit:0},
{cod:"11.10",desc:"Armação das vigas baldrame",un:"kg",qtd:0,unit:0},
{cod:"11.11",desc:"Concretagem das vigas baldrame",un:"m³",qtd:0,unit:0},
{cod:"11.12",desc:"Impermeabilização das vigas baldrame",un:"m²",qtd:0,unit:0},
{cod:"11.13",desc:"Assentamento de blocos",un:"m²",qtd:0,unit:0},
{cod:"11.14",desc:"Concretagem de pilares",un:"m³",qtd:0,unit:0},
{cod:"11.15",desc:"Armação e montagem de viga de amarração do muro",un:"kg",qtd:0,unit:0},
{cod:"11.16",desc:"Concretagem das vigas intermediárias do muro",un:"m³",qtd:0,unit:0},
{cod:"11.17",desc:"Concretagem vigas de amarração",un:"m³",qtd:0,unit:0},
{cod:"11.18",desc:"Chapisco do muro",un:"m²",qtd:0,unit:0},
{cod:"11.19",desc:"Reboco do muro",un:"m²",qtd:0,unit:0},
{cod:"11.20",desc:"Pingadeira do muro",un:"m",qtd:0,unit:0}
]},
{cod:"12",nome:"REVESTIMENTOS",subs:[
{cod:"12.3",desc:"Assentamento piso banheiros primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"12.4",desc:"Revestimentos paredes banheiros primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"12.5",desc:"Assentamento piso suítes, varandas e corredor do primeiro pavimento",un:"m²",qtd:0,unit:0},
{cod:"12.6",desc:"Assentamento piso lavabo e banheiros do térreo",un:"m²",qtd:0,unit:0},
{cod:"12.7",desc:"Assentamento piso e revestimento de parede (onde houver) quarto hóspede, despensa e outros ambientes pequenos do térreo",un:"m²",qtd:0,unit:0},
{cod:"12.8",desc:"Rejunte de pisos e revestimentos de paredes",un:"m²",qtd:0,unit:0},
{cod:"12.9",desc:"Assentamento piso e revestimentos de parede (onde houver) na sala, cozinha, área gourmet",un:"m²",qtd:0,unit:0},
{cod:"12.10",desc:"Revestimento externo (onde houver)",un:"m²",qtd:0,unit:0},
{cod:"12.11",desc:"Revestimento fachada",un:"m²",qtd:0,unit:0},
{cod:"12.12",desc:"Soleiras e Peitoris",un:"m",qtd:0,unit:0}
]},
{cod:"13",nome:"PISCINA",subs:[
{cod:"13.1",desc:"Marcação com pontaletes para escavação mecânica da piscina",un:"vb",qtd:0,unit:0},
{cod:"13.2",desc:"Escavação mecânica da piscina",un:"m³",qtd:0,unit:0},
{cod:"13.3",desc:"Marcação e escavação manual de sapatas",un:"m³",qtd:0,unit:0},
{cod:"13.4",desc:"Armação de sapatas e arraque de pilares (com locação)",un:"kg",qtd:0,unit:0},
{cod:"13.5",desc:"Concretagem de sapatas",un:"m³",qtd:0,unit:0},
{cod:"13.6",desc:"Armação e locação de vigas",un:"kg",qtd:0,unit:0},
{cod:"13.7",desc:"Montagem de formas das vigas e registro do fundo 01",un:"m²",qtd:0,unit:0},
{cod:"13.8",desc:"Reaterro e nivelamento do fundo 01",un:"m³",qtd:0,unit:0},
{cod:"13.9",desc:"Instalação dos pontos de hidráulica da piscina",un:"un",qtd:0,unit:0},
{cod:"13.10",desc:"Locação das telas e caranguejos do piso do fundo 01",un:"m²",qtd:0,unit:0},
{cod:"13.11",desc:"Concretagem do piso e vigas do fundo 01",un:"m³",qtd:0,unit:0},
{cod:"13.12",desc:"Montagem de formas das vigas e registro do fundo 02",un:"m²",qtd:0,unit:0},
{cod:"13.13",desc:"Assentamento de blocos estruturais",un:"m²",qtd:0,unit:0},
{cod:"13.14",desc:"Concretagem do piso e vigas do fundo 02",un:"m³",qtd:0,unit:0},
{cod:"13.15",desc:"Instalação pontos de LED",un:"un",qtd:0,unit:0},
{cod:"13.16",desc:"Concretagem das vigas do topo",un:"m³",qtd:0,unit:0},
{cod:"13.17",desc:"Primeira camada de impermeabilização",un:"m²",qtd:0,unit:0},
{cod:"13.18",desc:"Chapisco",un:"m²",qtd:0,unit:0},
{cod:"13.19",desc:"Reboco da piscina",un:"m²",qtd:0,unit:0},
{cod:"13.20",desc:"Contrapiso fundos da piscina",un:"m²",qtd:0,unit:0},
{cod:"13.21",desc:"Segunda camada de impermeabilização",un:"m²",qtd:0,unit:0},
{cod:"13.22",desc:"Reboco borda da piscina",un:"m",qtd:0,unit:0},
{cod:"13.23",desc:"Revestimento da piscina",un:"m²",qtd:0,unit:0}
]},
{cod:"14",nome:"COBERTURA",subs:[
{cod:"14.1",desc:"Assentamento blocos platibanda",un:"m²",qtd:0,unit:0},
{cod:"14.2",desc:"Assentamento blocos para área técnica (caixa d'água)",un:"m²",qtd:0,unit:0},
{cod:"14.3",desc:"Locação de pilares",un:"un",qtd:0,unit:0},
{cod:"14.4",desc:"Montagem de formas para vigas",un:"m²",qtd:0,unit:0},
{cod:"14.5",desc:"Fabricação de armaduras de vigas",un:"kg",qtd:0,unit:0},
{cod:"14.6",desc:"Chapisco e reboco da platibanda",un:"m²",qtd:0,unit:0},
{cod:"14.9",desc:"Contrapiso da cobertura",un:"m²",qtd:0,unit:0},
{cod:"14.10",desc:"Pingadeira",un:"m",qtd:0,unit:0}
]},
{cod:"15",nome:"FORRO",subs:[
{cod:"15.1",desc:"Colagem de baguetes para forro",un:"m",qtd:0,unit:0},
{cod:"15.2",desc:"Instalação das placas de gesso",un:"m²",qtd:0,unit:0}
]},
{cod:"16",nome:"PINTURA",subs:[
{cod:"16.1",desc:"Aplicação de selador",un:"m²",qtd:0,unit:0},
{cod:"16.2",desc:"Aplicação de massa corrida",un:"m²",qtd:0,unit:0},
{cod:"16.3",desc:"Lixamento de massa corrida",un:"m²",qtd:0,unit:0},
{cod:"16.4",desc:"Primeira demão de pintura",un:"m²",qtd:0,unit:0}
]},
{cod:"17",nome:"PORTAS E ESQUADRIAS",subs:[
{cod:"17.1",desc:"Instalação de contramarcos, marcos e trilhos das esquadrias",un:"un",qtd:0,unit:0},
{cod:"17.2",desc:"Instalação dos painéis de vidro",un:"m²",qtd:0,unit:0},
{cod:"17.3",desc:"Instalação das portas",un:"un",qtd:0,unit:0}
]},
{cod:"18",nome:"PAISAGISMO",subs:[
{cod:"18.1",desc:"Preparação das áreas que receberão o paisagismo",un:"m²",qtd:0,unit:0},
{cod:"18.2",desc:"Locação e organização de gramas e plantas",un:"m²",qtd:0,unit:0}
]},
{cod:"19",nome:"LOUÇAS E METAIS",subs:[
{cod:"19.1",desc:"Instalações dos vasos",un:"un",qtd:0,unit:0},
{cod:"19.2",desc:"Instalação das bancadas",un:"un",qtd:0,unit:0},
{cod:"19.3",desc:"Instalação das torneiras",un:"un",qtd:0,unit:0}
]}
];

let _orcDados={}; // {obraId: [{cod,nome,subs:[{cod,desc,un,qtd,unit}]},...]}
let _orcExpandidos={}; // {obraId: Set of expanded group cods}

function _orcKey(){
  const sel=document.getElementById('orc-obra-sel');
  return sel?.value||'';
}

function _orcGet(obraId){
  if(!obraId) return [];
  if(!_orcDados[obraId]){
    // Try load from localStorage
    const saved=localStorage.getItem('orc_'+obraId);
    if(saved){try{_orcDados[obraId]=JSON.parse(saved);}catch(e){}}
    if(!_orcDados[obraId]) _orcDados[obraId]=JSON.parse(JSON.stringify(ORC_TEMPLATE));
  }
  return _orcDados[obraId];
}

function _orcSave(obraId){
  if(!obraId) return;
  localStorage.setItem('orc_'+obraId,JSON.stringify(_orcDados[obraId]));
}

function orcMudarObra(){renderOrcamento();}

function renderOrcamento(){
  const sel=document.getElementById('orc-obra-sel');
  if(!sel) return;
  // Fill select
  const cur=sel.value;
  sel.innerHTML='<option value="">— Selecione uma obra —</option>'+DB.obras.map(o=>`<option value="${o.id}"${String(o.id)===String(cur)?' selected':''}>${o.nome}</option>`).join('');

  const obraId=_orcKey();
  const kpis=document.getElementById('orc-kpis');
  const content=document.getElementById('orc-content');

  if(!obraId){
    kpis.innerHTML='';
    content.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3)">Selecione uma obra para gerenciar o orçamento.</div>';
    return;
  }

  const grupos=_orcGet(obraId);
  if(!_orcExpandidos[obraId]) _orcExpandidos[obraId]=new Set();
  const expandidos=_orcExpandidos[obraId];

  // Calculate totals
  let totalGeral=0;
  const grupoTotais=grupos.map(g=>{
    const total=g.subs.reduce((a,s)=>a+(Number(s.qtd)||0)*(Number(s.unit)||0),0);
    totalGeral+=total;
    return total;
  });
  const itensPreenchidos=grupos.reduce((a,g)=>a+g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0).length,0);
  const itensTotal=grupos.reduce((a,g)=>a+g.subs.length,0);

  const obra=DB.obras.find(o=>String(o.id)===String(obraId));
  const m2=obra?Number(obra.m2||0):0;

  // KPIs
  kpis.innerHTML=`
    <div class="kpi"><div class="kl">Total Geral</div><div class="kv" style="color:#1a7a3a">${fmtR(totalGeral)}</div><div class="kd neu">${grupos.length} grupos</div></div>
    <div class="kpi"><div class="kl">Custo/m²</div><div class="kv">${m2>0?fmtR(totalGeral/m2):'—'}</div><div class="kd neu">${m2>0?m2.toLocaleString('pt-BR')+' m²':'Área não informada'}</div></div>
    <div class="kpi"><div class="kl">Itens Preenchidos</div><div class="kv">${itensPreenchidos}</div><div class="kd neu">de ${itensTotal} itens</div></div>
  `;

  // Table
  let html='';
  grupos.forEach((g,gi)=>{
    const gTotal=grupoTotais[gi];
    const isOpen=expandidos.has(g.cod);
    const pct=totalGeral>0?(gTotal/totalGeral*100).toFixed(1):'0.0';

    html+=`<div style="margin-bottom:2px">
      <div onclick="orcToggleGrupo('${obraId}','${g.cod}')" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;cursor:pointer;user-select:none;transition:.15s${isOpen?';border-color:#1a7a3a':''}">
        <span style="font-size:12px;transition:.2s;transform:rotate(${isOpen?'90':'0'}deg)">▶</span>
        <span style="font-weight:700;font-size:12px;color:#1a7a3a;min-width:28px">${g.cod}</span>
        <span style="font-weight:600;font-size:12px;flex:1">${g.nome}</span>
        <span style="font-size:10px;color:var(--txt3);margin-right:4px">${pct}%</span>
        <span style="font-weight:700;font-size:12px;color:#1a7a3a;min-width:90px;text-align:right">${fmtR(gTotal)}</span>
        <button class="btn sm ico" onclick="event.stopPropagation();orcAdicionarItem('${obraId}',${gi})" title="Adicionar subitem" style="font-size:10px">＋</button>
        <button class="btn sm ico" onclick="event.stopPropagation();orcRemoverGrupo('${obraId}',${gi})" title="Remover grupo" style="font-size:10px;color:var(--red)">🗑️</button>
      </div>`;

    if(isOpen){
      html+=`<div style="border:1px solid var(--border);border-top:none;border-radius:0 0 8px 8px;overflow-x:auto">
        <table class="tbl" style="min-width:650px">
          <thead><tr>
            <th style="width:55px">Cód.</th>
            <th>Descrição</th>
            <th style="width:55px;text-align:center">Unid.</th>
            <th style="width:80px;text-align:right">Qtd.</th>
            <th style="width:100px;text-align:right">Valor Unit.</th>
            <th style="width:100px;text-align:right">Total</th>
            <th style="width:35px"></th>
          </tr></thead>
          <tbody>`;
      g.subs.forEach((s,si)=>{
        const subTotal=(Number(s.qtd)||0)*(Number(s.unit)||0);
        html+=`<tr>
          <td style="font-size:11px;color:var(--txt3)">${s.cod}</td>
          <td style="font-size:11px">${s.desc}</td>
          <td style="text-align:center;font-size:11px">${s.un}</td>
          <td><input type="number" class="inp" value="${s.qtd||''}" min="0" step="any" style="width:70px;height:28px;font-size:11px;text-align:right;padding:0 6px" onchange="orcUpdateItem('${obraId}',${gi},${si},'qtd',this.value)"></td>
          <td><input type="number" class="inp" value="${s.unit||''}" min="0" step="any" style="width:90px;height:28px;font-size:11px;text-align:right;padding:0 6px" onchange="orcUpdateItem('${obraId}',${gi},${si},'unit',this.value)"></td>
          <td style="text-align:right;font-weight:600;font-size:11px;color:${subTotal>0?'#1a7a3a':'var(--txt3)'}">${subTotal>0?fmtR(subTotal):'—'}</td>
          <td><button class="btn sm ico" onclick="orcRemoverItem('${obraId}',${gi},${si})" title="Remover" style="font-size:10px;color:var(--red)">✕</button></td>
        </tr>`;
      });
      html+=`<tr style="background:var(--bg3);font-weight:700">
        <td colspan="5" style="text-align:right;font-size:12px">Subtotal ${g.nome}</td>
        <td style="text-align:right;font-size:12px;color:#1a7a3a">${fmtR(gTotal)}</td>
        <td></td>
      </tr></tbody></table></div>`;
    }
    html+=`</div>`;
  });

  // Total geral row
  html+=`<div style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:14px 16px;margin-top:8px;background:#1a7a3a;border-radius:8px;color:#fff">
    <span style="font-size:14px;font-weight:600">TOTAL GERAL DO ORÇAMENTO</span>
    <span style="font-size:18px;font-weight:800">${fmtR(totalGeral)}</span>
  </div>`;

  content.innerHTML=html;
}

function orcToggleGrupo(obraId,cod){
  if(!_orcExpandidos[obraId]) _orcExpandidos[obraId]=new Set();
  if(_orcExpandidos[obraId].has(cod)) _orcExpandidos[obraId].delete(cod);
  else _orcExpandidos[obraId].add(cod);
  renderOrcamento();
}

function orcExpandirTodos(){
  const obraId=_orcKey();if(!obraId) return;
  const grupos=_orcGet(obraId);
  _orcExpandidos[obraId]=new Set(grupos.map(g=>g.cod));
  renderOrcamento();
}

function orcRecolherTodos(){
  const obraId=_orcKey();if(!obraId) return;
  _orcExpandidos[obraId]=new Set();
  renderOrcamento();
}

function orcUpdateItem(obraId,gi,si,field,value){
  const grupos=_orcGet(obraId);
  grupos[gi].subs[si][field]=Number(value)||0;
  _orcSave(obraId);
  renderOrcamento();
}

function orcRemoverItem(obraId,gi,si){
  if(!confirm('Remover este subitem?')) return;
  const grupos=_orcGet(obraId);
  grupos[gi].subs.splice(si,1);
  _orcSave(obraId);
  renderOrcamento();
  toast('🗑️','Subitem removido.');
}

function orcRemoverGrupo(obraId,gi){
  const grupos=_orcGet(obraId);
  if(!confirm('Remover o grupo "'+grupos[gi].nome+'" e todos os subitens?')) return;
  grupos.splice(gi,1);
  _orcSave(obraId);
  renderOrcamento();
  toast('🗑️','Grupo removido.');
}

function orcAdicionarItem(obraId,gi){
  const grupos=_orcGet(obraId);
  const g=grupos[gi];
  const lastCod=g.subs.length?g.subs[g.subs.length-1].cod:'';
  // Generate next code
  let nextNum=g.subs.length+1;
  const newCod=g.cod+'.'+nextNum;

  const desc=prompt('Descrição do novo subitem:');
  if(!desc) return;
  const un=prompt('Unidade (ex: m², kg, un, vb, m, m³):','un')||'un';

  g.subs.push({cod:newCod,desc:desc,un:un,qtd:0,unit:0});
  if(!_orcExpandidos[obraId]) _orcExpandidos[obraId]=new Set();
  _orcExpandidos[obraId].add(g.cod);
  _orcSave(obraId);
  renderOrcamento();
  toast('✅','Subitem adicionado.');
}

function orcAdicionarGrupo(){
  const obraId=_orcKey();
  if(!obraId){toast('⚠️','Selecione uma obra.');return;}
  const nome=prompt('Nome do novo grupo (ex: LIMPEZA FINAL):');
  if(!nome) return;
  const grupos=_orcGet(obraId);
  const nextCod=String(Math.max(...grupos.map(g=>parseInt(g.cod)||0),0)+1);
  grupos.push({cod:nextCod,nome:nome.toUpperCase(),subs:[]});
  _orcSave(obraId);
  renderOrcamento();
  toast('✅','Grupo adicionado.');
}

function orcGerarPDF(){
  const obraId=_orcKey();
  if(!obraId){toast('⚠️','Selecione uma obra.');return;}
  const grupos=_orcGet(obraId);
  const obra=DB.obras.find(o=>String(o.id)===String(obraId));
  if(!obra){toast('⚠️','Obra não encontrada.');return;}

  // Filter only items with values
  const gruposFiltrados=grupos.map(g=>{
    const subsComValor=g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0);
    return {...g,subs:subsComValor};
  }).filter(g=>g.subs.length>0);

  if(!gruposFiltrados.length){toast('⚠️','Nenhum item com valor preenchido.');return;}

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF();
  const pw=doc.internal.pageSize.getWidth();
  const ph=doc.internal.pageSize.getHeight();
  const accent=corEmpresa();
  const accentHex=_empresaCor||'#0A193C';
  let totalGeral=0;

  // ── HEADER
  let y=12;
  // Logo
  if(_empresaLogo){
    try{doc.addImage(_empresaLogo,'PNG',9,y,22,22);}catch(e){}
  }
  const logoX=_empresaLogo?35:9;
  doc.setFontSize(18);doc.setFont(undefined,'bold');doc.setTextColor(...accent);
  doc.text('ORÇAMENTO DE OBRA',logoX,y+8);
  doc.setFontSize(10);doc.setFont(undefined,'normal');doc.setTextColor(100,100,100);
  doc.text(obra.nome||'',logoX,y+15);

  // Empresa info right-aligned
  const empresaNome=document.getElementById('sb-empresa-nome')?.textContent||'';
  if(empresaNome){
    doc.setFontSize(9);doc.setTextColor(80,80,80);
    doc.text(empresaNome,pw-9,y+5,{align:'right'});
  }
  doc.text('Data: '+new Date().toLocaleDateString('pt-BR'),pw-9,y+10,{align:'right'});
  if(obra.cli){doc.text('Cliente: '+obra.cli,pw-9,y+15,{align:'right'});}

  y+=28;
  // Line
  doc.setDrawColor(...accent);doc.setLineWidth(0.8);
  doc.line(9,y,pw-9,y);
  y+=6;

  // Info boxes
  doc.setFontSize(8);doc.setTextColor(100,100,100);
  const infos=[];
  if(obra.local) infos.push('Local: '+obra.local);
  if(obra.m2) infos.push('Área: '+Number(obra.m2).toLocaleString('pt-BR')+' m²');
  if(obra.resp) infos.push('Resp. Técnico: '+obra.resp);
  if(infos.length){
    doc.text(infos.join('   |   '),9,y);
    y+=6;
  }

  // ── TABLE
  gruposFiltrados.forEach((g,gi)=>{
    const gTotal=g.subs.reduce((a,s)=>a+(Number(s.qtd)||0)*(Number(s.unit)||0),0);
    totalGeral+=gTotal;

    // Check page break
    const neededH=12+(g.subs.length+1)*7;
    if(y+neededH>ph-25){doc.addPage();y=15;}

    // Group header
    doc.setFillColor(...accent);
    doc.rect(9,y,pw-18,8,'F');
    doc.setFontSize(9);doc.setFont(undefined,'bold');doc.setTextColor(255,255,255);
    doc.text(g.cod+' — '+g.nome,12,y+5.5);
    doc.text(fmtR(gTotal),pw-12,y+5.5,{align:'right'});
    y+=10;

    // Column headers
    doc.setFillColor(240,240,240);
    doc.rect(9,y,pw-18,6,'F');
    doc.setFontSize(7);doc.setFont(undefined,'bold');doc.setTextColor(80,80,80);
    doc.text('CÓD.',11,y+4);
    doc.text('DESCRIÇÃO',30,y+4);
    doc.text('UNID.',115,y+4);
    doc.text('QTD.',130,y+4,{align:'right'});
    doc.text('VL. UNIT.',155,y+4,{align:'right'});
    doc.text('TOTAL',pw-12,y+4,{align:'right'});
    y+=7;

    // Items
    g.subs.forEach((s,si)=>{
      if(y>ph-22){doc.addPage();y=15;}
      const subTotal=(Number(s.qtd)||0)*(Number(s.unit)||0);
      if(si%2===0){doc.setFillColor(248,249,250);doc.rect(9,y-1,pw-18,6.5,'F');}
      doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(60,60,60);
      doc.text(s.cod,11,y+3);
      // Truncate long descriptions
      const descTxt=s.desc.length>65?s.desc.substring(0,62)+'...':s.desc;
      doc.text(descTxt,30,y+3);
      doc.text(s.un,117,y+3,{align:'center'});
      doc.text(String(Number(s.qtd).toLocaleString('pt-BR',{maximumFractionDigits:2})),130,y+3,{align:'right'});
      doc.text(fmtR(Number(s.unit)),155,y+3,{align:'right'});
      doc.setFont(undefined,'bold');doc.setTextColor(...accent);
      doc.text(fmtR(subTotal),pw-12,y+3,{align:'right'});
      y+=6.5;
    });

    // Subtotal row
    doc.setFillColor(230,235,240);
    doc.rect(9,y-1,pw-18,7,'F');
    doc.setFontSize(7.5);doc.setFont(undefined,'bold');doc.setTextColor(60,60,60);
    doc.text('Subtotal '+g.nome,12,y+3.5);
    doc.setTextColor(...accent);
    doc.text(fmtR(gTotal),pw-12,y+3.5,{align:'right'});
    y+=10;
  });

  // ── TOTAL GERAL
  if(y+18>ph-25){doc.addPage();y=15;}
  y+=2;
  doc.setFillColor(...accent);
  doc.rect(9,y,pw-18,12,'F');
  doc.setFontSize(11);doc.setFont(undefined,'bold');doc.setTextColor(255,255,255);
  doc.text('TOTAL GERAL DO ORÇAMENTO',12,y+8);
  doc.setFontSize(13);
  doc.text(fmtR(totalGeral),pw-12,y+8,{align:'right'});
  y+=16;

  // Custo/m²
  const m2=Number(obra.m2||0);
  if(m2>0){
    doc.setFontSize(8);doc.setFont(undefined,'normal');doc.setTextColor(100,100,100);
    doc.text('Custo por m²: '+fmtR(totalGeral/m2)+' (área: '+m2.toLocaleString('pt-BR')+' m²)',9,y+2);
    y+=8;
  }

  // ── SIGNATURE AREA
  if(y+30>ph-15){doc.addPage();y=15;}
  y=Math.max(y+15,ph-45);
  doc.setDrawColor(180,180,180);doc.setLineWidth(0.3);
  const sigW=70;
  doc.line(25,y,25+sigW,y);
  doc.line(pw-25-sigW,y,pw-25,y);
  doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(120,120,120);
  doc.text('Contratante',25+sigW/2,y+4,{align:'center'});
  doc.text('Contratada',pw-25-sigW/2,y+4,{align:'center'});

  // ── FOOTER on all pages
  const totalPages=doc.internal.getNumberOfPages();
  for(let p=1;p<=totalPages;p++){
    doc.setPage(p);
    doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(150,150,150);
    doc.text('Orçamento gerado em '+new Date().toLocaleDateString('pt-BR')+' — '+( empresaNome||'ObraTech'),9,ph-6);
    doc.text('Página '+p+'/'+totalPages,pw-9,ph-6,{align:'right'});
    doc.setDrawColor(200,200,200);doc.setLineWidth(0.2);
    doc.line(9,ph-10,pw-9,ph-10);
  }

  doc.save('Orcamento_'+(obra.nome||'obra').replace(/\s+/g,'_')+'.pdf');
  toast('📄','Orçamento PDF gerado com sucesso!');
}

function orcGerarExcel(){
  const obraId=_orcKey();
  if(!obraId){toast('⚠️','Selecione uma obra.');return;}
  const grupos=_orcGet(obraId);
  const obra=DB.obras.find(o=>String(o.id)===String(obraId));

  // Filter only items with values
  const gruposFiltrados=grupos.map(g=>{
    const subsComValor=g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0);
    return {...g,subs:subsComValor};
  }).filter(g=>g.subs.length>0);

  if(!gruposFiltrados.length){toast('⚠️','Nenhum item com valor preenchido.');return;}

  let csv='\uFEFF"Código";"Descrição";"Unidade";"Quantidade";"Valor Unitário";"Total"\n';
  let totalGeral=0;

  gruposFiltrados.forEach(g=>{
    const gTotal=g.subs.reduce((a,s)=>a+(Number(s.qtd)||0)*(Number(s.unit)||0),0);
    totalGeral+=gTotal;
    csv+=`"${g.cod}";"${g.nome}";"";"";"";${gTotal.toFixed(2).replace('.',',')}\n`;
    g.subs.forEach(s=>{
      const subTotal=(Number(s.qtd)||0)*(Number(s.unit)||0);
      csv+=`"${s.cod}";"${s.desc}";"${s.un}";${String(s.qtd).replace('.',',')};${String(s.unit).replace('.',',')};${subTotal.toFixed(2).replace('.',',')}\n`;
    });
  });
  csv+=`"";"TOTAL GERAL";"";"";"";${totalGeral.toFixed(2).replace('.',',')}\n`;

  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='Orcamento_'+(obra?.nome||'obra').replace(/\s+/g,'_')+'.csv';
  a.click();URL.revokeObjectURL(url);
  toast('📊','Orçamento Excel exportado!');
}

