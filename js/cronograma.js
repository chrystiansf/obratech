// ═══════════════════════════════════════════
// CRONOGRAMA
// ═══════════════════════════════════════════
// ── SEQUÊNCIA CONSTRUTIVA ESPERADA ──────────────────────────────────────
// Para cada etapa (pelo nome), define:
//   startPct: % do prazo total da obra em que essa etapa deveria COMEÇAR
//   endPct:   % do prazo total em que deveria TERMINAR
// Baseado em cronograma típico de obra residencial de médio porte.
const ENGENHARIA_SEQ = [
  {keys:['taxa','encargo','implurb','licença','aprovação','projeto'],     s:0,  e:5  },
  {keys:['canteiro','instalação do canteiro'],                            s:0,  e:5  },
  {keys:['fundaç','fundacao','sondagem','terraplan'],                     s:2,  e:12 },
  {keys:['estrutura','laje','pilar','viga','concret'],                    s:8,  e:35 },
  {keys:['alvenaria'],                                                    s:28, e:55 },
  {keys:['cobertura','telhado'],                                          s:45, e:62 },
  {keys:['hidráulic','hidraulic'],                                        s:30, e:70 },
  {keys:['elétric','eletric'],                                            s:30, e:72 },
  {keys:['ar-condicionado','ar condicionado','tubulação ar'],             s:50, e:75 },
  {keys:['revestimento e acabamento','reboco','argamass'],                s:55, e:85 },
  {keys:['piso','piscina','churrasqueira','itens especiais'],             s:65, e:88 },
  {keys:['pintura','selador','massa corrida'],                            s:75, e:95 },
  {keys:['forro'],                                                        s:60, e:85 },
  {keys:['mão de obra civil'],                                            s:0,  e:100},
  {keys:['administração'],                                                s:0,  e:100},
  {keys:['serviços gerais'],                                              s:0,  e:100},
];

function engSeq(nome){
  const n=nome.toLowerCase();
  for(const r of ENGENHARIA_SEQ){
    if(r.keys.some(k=>n.includes(k)))return{s:r.s,e:r.e};
  }
  return{s:0,e:100};
}

// Calcula % esperado hoje para uma etapa com base no prazo da obra
function pctEsperadoHoje(obra, etapa){
  // Somente valor manual definido pelo gestor via botão 🎯
  if(etapa.pctEsp!=null && etapa.pctEsp!=='') return Number(etapa.pctEsp);
  return null;
}

// Saúde da barra: compara pct real vs esperado
function ganttSaude(obra, etapa){
  const pct=Number(etapa.pct);
  if(pct>=100)return'done';
  const esp=pctEsperadoHoje(obra,etapa);
  if(esp===null)return pct>0?'ok':'future';
  if(esp===0) return pct>0?'ahead':'future';
  const diff=pct-esp;
  if(diff>=0) return diff>=5?'ahead':'ok';   // 5%+ acima = adiantado
  return'late';                               // abaixo = atrasado
}

// Cores e rótulos por saúde
const SAUDE_STYLE={
  done:   {bg:'#18a84d', track:'rgba(24,168,77,.15)',  glow:'rgba(24,168,77,.4)',  label:'Concluído',  txt:'#18a84d'},
  ahead:  {bg:'#5b8ff9', track:'rgba(91,143,249,.15)', glow:'rgba(91,143,249,.4)', label:'Adiantado',  txt:'#5b8ff9'},
  ok:     {bg:'#f4a623', track:'rgba(244,166,35,.15)', glow:'rgba(244,166,35,.4)', label:'No prazo',   txt:'#f4a623'},
  late:   {bg:'#d94040', track:'rgba(217,64,64,.15)',  glow:'rgba(217,64,64,.4)',  label:'Atrasado',   txt:'#d94040'},
  future: {bg:'#3a4260', track:'rgba(58,66,96,.2)',    glow:'transparent',         label:'Aguardando', txt:'#4a5278'},
};

function renderCron(){
  // Popular seletor
  const cronSel=document.getElementById('cron-obra-sel');
  if(cronSel){
    const prev=cronSel.value;
    cronSel.innerHTML=DB.obras.map(o=>`<option value="${o.id}">${o.nome}</option>`).join('');
    if(prev&&DB.obras.find(o=>o.id===prev)) cronSel.value=prev;
    else if(DB.sel) cronSel.value=DB.sel;
    else if(DB.obras.length) cronSel.value=DB.obras[0].id;
  }
  const selId=cronSel?cronSel.value:null;
  const obra=selId?DB.obras.find(o=>o.id===selId):null;
  document.getElementById('cron-empty').style.display=obra?'none':'flex';
  if(!obra)return;
  document.getElementById('cron-sub').textContent=obra.nome;
  const ets=DB.etapas.filter(e=>String(e.obraId)===String(obra.id));
  // Calcular avanço considerando orçamento se disponível
  const _orcG=typeof _orcGet==='function'?_orcGet(obra.id):[];
  const _temOrcKpi=_orcG.some(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));
  let pm,conc,ahead,atrasadas;
  if(_temOrcKpi){
    const pctS=_orcLoadPct(obra.id);
    const allSubs=_orcG.flatMap(g=>g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));
    const pcts=allSubs.map(s=>Number(pctS[s.cod]||0));
    pm=pcts.length?Math.round(pcts.reduce((a,p)=>a+p,0)/pcts.length):0;
    conc=pcts.filter(p=>p>=100).length;
    ahead=0;atrasadas=0;
  } else {
    pm=ets.length?Math.round(ets.reduce((a,e)=>a+Number(e.pct),0)/ets.length):0;
    conc=ets.filter(e=>Number(e.pct)>=100).length;
    ahead=ets.filter(e=>ganttSaude(obra,e)==='ahead').length;
    atrasadas=ets.filter(e=>ganttSaude(obra,e)==='late').length;
  }
  const totalEtapas=_temOrcKpi?_orcG.flatMap(g=>g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0)).length:ets.length;

  // Financeiro da obra
  const orcTotal=ets.reduce((a,e)=>a+Number(e.orc||0),0);
  const orcRealizado=ets.reduce((a,e)=>a+Number(e.orc||0)*Number(e.pct||0)/100,0);
  const gastoReal=DB.lancs.filter(l=>String(l.obraId)===String(obra.id)&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor||0),0);
  const orcObra=orcTotal||Number(obra.orc||0); // soma das etapas (prioridade) ou orc da obra
  const saldoObra=orcObra-gastoReal;
  const pctGasto=orcObra>0?Math.round(gastoReal/orcObra*100):0;
  const corSaldo=saldoObra<0?'var(--red)':saldoObra<orcObra*0.1?'var(--yellow)':'var(--green)';

  document.getElementById('cron-kpis').innerHTML=`
    <div class="kpi"><div class="kl">📊 Avanço Geral</div><div class="kv">${pm}%</div><div class="kd ${pm>=50?'up':'neu'}">Média das etapas</div></div>
    <div class="kpi"><div class="kl">✅ Concluídas</div><div class="kv">${conc}/${totalEtapas}</div><div class="kd up">100% executadas</div></div>
    <div class="kpi"><div class="kl">⬆️ Adiantadas</div><div class="kv" style="color:${ahead?'var(--green)':'var(--txt3)'}">${ahead}</div><div class="kd ${ahead?'up':'neu'}">Acima do esperado</div></div>
    <div class="kpi"><div class="kl">🔴 Atrasadas</div><div class="kv" style="color:${atrasadas?'var(--red)':'var(--green)'}">${atrasadas}</div><div class="kd ${atrasadas?'dn':'up'}">${atrasadas?'Requer ação':'Tudo OK'}</div></div>
    <div class="kpi"><div class="kl">💰 Orçado</div><div class="kv" style="font-size:14px">${orcObra>0?fmtR(orcObra):'Não definido'}</div><div class="kd neu">${orcObra>0?'orçamento total':orcTotal>0?'defina em Obras':'cadastre nas etapas'}</div></div>
    <div class="kpi"><div class="kl">💸 Gasto Real</div><div class="kv" style="font-size:14px;color:${gastoReal>orcObra&&orcObra>0?'var(--red)':'var(--txt)'}">${fmtR(gastoReal)}</div><div class="kd ${pctGasto>100?'dn':pctGasto>80?'neu':'up'}">${orcObra>0?pctGasto+'% do orçado':gastoReal>0?'lançamentos financeiros':'sem lançamentos'}</div></div>
    ${orcObra>0?`<div class="kpi"><div class="kl">📊 Saldo</div><div class="kv" style="font-size:14px;color:${corSaldo}">${fmtR(Math.abs(saldoObra))}</div><div class="kd ${saldoObra<0?'dn':'up'}">${saldoObra<0?'⚠ Acima do orçamento':'disponível'}</div></div>`:''}`;

  // ── Gantt: etapas tradicionais + orçamento ──
  const orcGrupos=typeof _orcGet==='function'?_orcGet(obra.id):[];
  const temOrc=orcGrupos.some(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));

  // Montar lista de itens do Gantt
  let ganttItems=[];
  if(temOrc){
    // Usar orçamento como fonte — cada grupo = etapa, subitens = sub-etapas
    const pctStore=_orcLoadPct(obra.id);

    orcGrupos.filter(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0)).forEach(g=>{
      const subsComValor=g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0);
      const subTotal=subsComValor.reduce((a,s)=>a+(Number(s.qtd)||0)*(Number(s.unit)||0),0);
      // Calcular pct médio do grupo baseado nos subitens
      const subPcts=subsComValor.map(s=>Number(pctStore[s.cod]||0));
      const grupoPct=subPcts.length?Math.round(subPcts.reduce((a,p)=>a+p,0)/subPcts.length):0;

      // Grupo (header)
      ganttItems.push({tipo:'grupo',cod:g.cod,nome:g.nome,pct:grupoPct,valor:subTotal,subs:subsComValor.length});

      // Subitens
      const isOpen=_orcExpandidos[obra.id]&&_orcExpandidos[obra.id].has(g.cod);
      if(isOpen){
        subsComValor.forEach(s=>{
          const sPct=Number(pctStore[s.cod]||0);
          const sVal=(Number(s.qtd)||0)*(Number(s.unit)||0);
          ganttItems.push({tipo:'sub',cod:s.cod,nome:s.desc,pct:sPct,valor:sVal,grupoCod:g.cod});
        });
      }
    });
  } else {
    // Sem orçamento — usar etapas tradicionais
    ets.forEach(e=>ganttItems.push({tipo:'etapa',id:e.id,nome:e.nome,pct:Number(e.pct),orc:e.orc,etapa:e}));
  }

  const totalItems=ganttItems.filter(i=>i.tipo!=='grupo').length||ganttItems.length;
  document.getElementById('gantt-empty').style.display=ganttItems.length?'none':'block';

  let ganttRows='';
  ganttItems.forEach(item=>{
    const pct=item.pct;
    const saude=pct>=100?'done':pct>=50?'ok':pct>0?'late':'future';
    const st=SAUDE_STYLE[saude]||SAUDE_STYLE.future;

    if(item.tipo==='grupo'){
      // Header de grupo (clicável para expandir)
      const isOpen=_orcExpandidos[obra.id]&&_orcExpandidos[obra.id].has(item.cod);
      ganttRows+=`<div class="gr" style="min-height:32px;margin-bottom:2px;align-items:center;background:var(--bg3);border-radius:6px;padding:2px 0;cursor:pointer" onclick="orcToggleGrupo('${obra.id}','${item.cod}');renderCron()">
        <div class="gn" style="font-size:11px;font-weight:700;color:var(--primary)">
          <span style="font-size:10px;margin-right:4px">${isOpen?'▼':'▶'}</span>${item.cod} - ${item.nome}
          <div style="font-size:9px;color:var(--txt3);font-weight:400">${fmtR(item.valor)} · ${item.subs} subitens</div>
        </div>
        <div style="flex:1;position:relative;height:18px">
          <div style="position:absolute;inset:0;background:${st.track};border-radius:4px;border:1px solid ${st.bg}30"></div>
          <div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:${st.bg};border-radius:${pct>=100?'4px':'4px 0 0 4px'};transition:width .6s ease;display:flex;align-items:center;justify-content:center;min-width:${pct>0?'20px':'0'}">
            ${pct>5?`<span style="font-size:9px;font-weight:800;color:#fff">${pct}%</span>`:''}
          </div>
        </div>
        <div style="width:80px;flex-shrink:0;text-align:center;margin-left:8px">
          <span style="font-size:9px;font-weight:700;color:#fff;background:${st.bg};padding:2px 8px;border-radius:8px">${pct}%</span>
        </div>
      </div>`;
    } else if(item.tipo==='sub'){
      // Subitem com input de %
      ganttRows+=`<div class="gr" style="min-height:26px;margin-bottom:1px;align-items:center;padding-left:20px">
        <div class="gn" style="font-size:10px;color:var(--txt2)">
          ${item.cod} - ${item.nome.substring(0,45)}${item.nome.length>45?'...':''}
          <div style="font-size:9px;color:var(--txt3)">${fmtR(item.valor)}</div>
        </div>
        <div style="flex:1;position:relative;height:14px">
          <div style="position:absolute;inset:0;background:${st.track};border-radius:4px;border:1px solid ${st.bg}30"></div>
          <div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:${st.bg};border-radius:${pct>=100?'4px':'4px 0 0 4px'};transition:width .6s ease;min-width:${pct>0?'14px':'0'}"></div>
        </div>
        <div style="width:80px;flex-shrink:0;display:flex;align-items:center;gap:4px;margin-left:8px">
          <input type="number" class="inp" value="${pct}" min="0" max="100" step="5" style="width:50px;height:24px;font-size:10px;text-align:center;padding:0 4px" onchange="orcSetPct('${obra.id}','${item.cod}',this.value)">
          <span style="font-size:10px;color:var(--txt3)">%</span>
        </div>
      </div>`;
    } else {
      // Etapa tradicional (sem orçamento)
      const e=item.etapa;
      const saude2=ganttSaude(obra,e);
      const st2=SAUDE_STYLE[saude2];
      const esp=pctEsperadoHoje(obra,e);
      const marca=(esp!==null&&esp>0&&esp<100)?esp:null;
      ganttRows+=`<div class="gr" style="min-height:28px;margin-bottom:6px;align-items:center">
        <div class="gn" style="font-size:11px;font-weight:600;color:var(--txt)">${e.nome}${e.orc>0?`<div style="font-size:9px;color:var(--txt3);font-weight:400">${fmtR(e.orc)}</div>`:''}</div>
        <div style="flex:1;position:relative;height:16px">
          <div style="position:absolute;inset:0;background:${st2.track};border-radius:4px;border:1px solid ${st2.bg}30"></div>
          <div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:${st2.bg};border-radius:${pct>=100?'4px':'4px 0 0 4px'};transition:width .6s ease;display:flex;align-items:center;justify-content:center;min-width:${pct>0?'18px':'0'}">
            ${pct>8?`<span style="font-size:8px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)">${pct>=100?'✓':pct+'%'}</span>`:''}
          </div>
          ${marca!==null?`<div style="position:absolute;left:${marca}%;top:-2px;bottom:-2px;width:2px;background:rgba(255,255,255,.95);z-index:3;border-radius:1px"></div>`:''}
        </div>
        <div style="width:130px;flex-shrink:0;display:flex;align-items:center;gap:3px;margin-left:8px">
          <span style="font-size:9px;font-weight:700;color:#fff;background:${st2.bg};padding:2px 6px;border-radius:8px;white-space:nowrap;flex:1;text-align:center">${st2.label}</span>
          <button class="btn sm ico" onclick="editarEspEtapa('${e.id}')" title="Definir % esperado" style="padding:2px 5px;font-size:11px">🎯</button>
          <button class="btn sm ico" onclick="openModal('etapa','${e.id}')" style="padding:2px 5px">✏️</button>
          <button class="btn sm ico" onclick="delEtapa('${e.id}')" style="padding:2px 5px">🗑️</button>
        </div>
      </div>`;
    }
  });

  document.getElementById('gantt-area').innerHTML=`
    <div style="display:flex;margin-left:163px;margin-right:80px;margin-bottom:10px;position:relative;height:16px">
      ${[0,25,50,75,100].map(p=>`<div style="position:absolute;left:${p}%;transform:translateX(-50%);font-size:9px;color:var(--txt3);text-align:center"><div style="width:1px;height:4px;background:var(--border2);margin:0 auto 2px"></div>${p}%</div>`).join('')}
    </div>
    ${ganttRows||'<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">Preencha o orçamento da obra para ver as etapas aqui.</div>'}
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:10px;border-top:1px solid var(--border);font-size:10px;color:var(--txt3);align-items:center">
      ${Object.entries(SAUDE_STYLE).map(([,v])=>`<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:10px;background:${v.bg};border-radius:2px;flex-shrink:0"></span><span style="color:var(--txt2);font-size:11px">${v.label}</span></span>`).join('')}
    </div>`;

  // Orçado x Realizado KPIs
  const orcSection=document.getElementById('cron-orc-section');
  if(orcSection){
    const orcGrupos=typeof _orcGet==='function'?_orcGet(obra.id):[];
    const totalOrcado=orcGrupos.reduce((a,g)=>a+g.subs.reduce((b,s)=>b+(Number(s.qtd)||0)*(Number(s.unit)||0),0),0);
    const totalRealizado=DB.lancs.filter(l=>String(l.obraId)===String(obra.id)&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor||0),0);
    const saldo=totalOrcado-totalRealizado;

    if(totalOrcado>0){
      orcSection.style.display='block';
      document.getElementById('cron-orc-kpis').innerHTML=`
        <div class="kpi"><div class="kl">💰 Orçado</div><div class="kv" style="color:var(--primary)">${fmtR(totalOrcado)}</div></div>
        <div class="kpi"><div class="kl">✅ Realizado</div><div class="kv" style="color:var(--green)">${fmtR(totalRealizado)}</div></div>
        <div class="kpi"><div class="kl">📊 Saldo</div><div class="kv" style="color:${saldo>=0?'var(--green)':'var(--red)'}">${fmtR(saldo)}</div><div class="kd ${saldo>=0?'up':'dn'}">${totalOrcado>0?((totalRealizado/totalOrcado)*100).toFixed(1)+'% executado':'—'}</div></div>
      `;
      renderCurvaOrcRealizado(obra.id);
    } else {
      orcSection.style.display='none';
    }
  }

  // ── CURVA S FINANCEIRA ─────────────────────────────────────
  setTimeout(()=>{
    const emptyEl=document.getElementById('ch-curvas-empty');
    const canvasEl=document.getElementById('ch-curvas');

    // Verificar se tem dados financeiros ou orçamento
    const orcTotal=ets.reduce((a,e)=>a+Number(e.orc||0),0);
    const lancObra=DB.lancs.filter(l=>String(l.obraId)===String(obra.id)&&l.tipo==='Despesa'&&l.data);
    const medObra=(DB.medicoes||[]).filter(m=>String(m.obraId)===String(obra.id)&&m.status==='aprovado'&&m.periodo);

    if(!orcTotal&&!lancObra.length&&!medObra.length){
      if(emptyEl) emptyEl.style.display='block';
      if(canvasEl) canvasEl.style.display='none';
      return;
    }
    if(emptyEl) emptyEl.style.display='none';
    if(canvasEl) canvasEl.style.display='block';

    // Determinar período da obra (meses)
    let dIni,dFim;
    if(obra.dataIni) dIni=new Date(obra.dataIni);
    else if(lancObra.length) dIni=new Date(lancObra.reduce((a,l)=>l.data<a?l.data:a,lancObra[0].data));
    else dIni=new Date();
    if(obra.dataFim) dFim=new Date(obra.dataFim);
    else { dFim=new Date(); dFim.setMonth(dFim.getMonth()+3); }

    // Gerar array de meses do período
    const meses=[];
    const cur=new Date(dIni.getFullYear(),dIni.getMonth(),1);
    const fim=new Date(dFim.getFullYear(),dFim.getMonth(),1);
    while(cur<=fim){ meses.push(new Date(cur)); cur.setMonth(cur.getMonth()+1); }
    if(!meses.length){meses.push(new Date());}

    const labels=meses.map(m=>m.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
    const nMeses=meses.length;

    // CURVA ORÇADA: distribuição linear do orçamento total ao longo dos meses
    // (idealmente viria das datas das etapas ponderadas pelo orçamento)
    const orcPorMes=[];
    const orcAcum=[];
    let orcAcc=0;
    ets.forEach(e=>{
      if(!e.orc||!e.inicio||!e.fim) return;
      const eIni=new Date(e.inicio);
      const eFim=new Date(e.fim);
      const eDur=Math.max(1,(eFim.getFullYear()-eIni.getFullYear())*12+(eFim.getMonth()-eIni.getMonth())+1);
      const orcMensal=Number(e.orc)/eDur;
      meses.forEach((m,i)=>{
        if(m>=new Date(eIni.getFullYear(),eIni.getMonth(),1)&&m<=new Date(eFim.getFullYear(),eFim.getMonth(),1)){
          orcPorMes[i]=(orcPorMes[i]||0)+orcMensal;
        }
      });
    });
    // Se não tem datas nas etapas, distribuir uniformemente
    if(orcPorMes.filter(Boolean).length===0&&orcTotal>0){
      const mensal=orcTotal/nMeses;
      meses.forEach((_,i)=>orcPorMes[i]=mensal);
    }
    for(let i=0;i<nMeses;i++){ orcAcc+=(orcPorMes[i]||0); orcAcum.push(orcAcc); }

    // CURVA REALIZADA: lançamentos de despesa acumulados por mês
    const realAcum=[];
    let realAcc=0;
    meses.forEach(m=>{
      const mesStr=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
      const soma=lancObra.filter(l=>l.data&&l.data.substring(0,7)===mesStr).reduce((a,l)=>a+Number(l.valor||0),0);
      realAcc+=soma;
      realAcum.push(realAcc);
    });

    // CURVA MEDIDA: medições aprovadas acumuladas por mês
    const medAcum=[];
    let medAcc=0;
    const temMedicoes=medObra.length>0;
    if(temMedicoes){
      meses.forEach(m=>{
        const mesStr=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
        const soma=medObra.filter(med=>med.periodo&&med.periodo.substring(0,7)===mesStr).reduce((a,med)=>a+Number(med.valorMedido||0),0);
        medAcc+=soma;
        medAcum.push(medAcc);
      });
    }

    // Formatar valores em R$ para tooltips
    const fmtK=v=>v>=1000000?'R$'+(v/1000000).toFixed(1)+'M':v>=1000?'R$'+(v/1000).toFixed(0)+'K':'R$'+Math.round(v);

    const datasets=[
      {label:'Orçado Acumulado',data:orcAcum,borderColor:'#5b8ff9',backgroundColor:'rgba(91,143,249,.08)',borderWidth:2.5,pointRadius:3,pointBackgroundColor:'#5b8ff9',fill:true,tension:0.3},
      {label:'Realizado Acumulado',data:realAcum,borderColor:'#18a84d',backgroundColor:'rgba(24,168,77,.08)',borderWidth:2.5,pointRadius:3,pointBackgroundColor:'#18a84d',fill:false,tension:0.3},
    ];
    if(temMedicoes){
      datasets.push({label:'Medido Acumulado',data:medAcum,borderColor:'#f4a623',backgroundColor:'transparent',borderWidth:2,borderDash:[5,3],pointRadius:3,pointBackgroundColor:'#f4a623',fill:false,tension:0.3});
    }

    mkChart('ch-curvas',{
      type:'line',
      data:{labels,datasets},
      options:{
        ...BO,
        plugins:{...BO.plugins,tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${fmtK(ctx.parsed.y)}`}}},
        scales:{
          x:{ticks:{color:'rgba(180,190,220,.8)',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}},
          y:{ticks:{color:'rgba(180,190,220,.8)',font:{size:9},callback:v=>fmtK(v)},grid:{color:'rgba(255,255,255,.06)'},beginAtZero:true}
        }
      }
    });
  },50);
}
// Salvar % executado de um subitem do orçamento no cronograma
function orcSetPct(obraId,cod,valor){
  if(!window._orcPct) window._orcPct={};
  if(!window._orcPct[obraId]) window._orcPct[obraId]={};
  window._orcPct[obraId][cod]=Math.max(0,Math.min(100,Number(valor)||0));
  localStorage.setItem('orcPct_'+obraId,JSON.stringify(window._orcPct[obraId]));
  renderCron();
}

// Carregar % executados salvos do localStorage
function _orcLoadPct(obraId){
  if(!window._orcPct) window._orcPct={};
  if(!window._orcPct[obraId]){
    const saved=localStorage.getItem('orcPct_'+obraId);
    if(saved){try{window._orcPct[obraId]=JSON.parse(saved);}catch(e){window._orcPct[obraId]={};}}
    else window._orcPct[obraId]={};
  }
  return window._orcPct[obraId];
}

function editarEspEtapa(id){
  const e=DB.etapas.find(x=>String(x.id)===String(id));
  if(!e)return;
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
    <div class="mo" style="max-width:380px">
      <div class="moh"><div class="mot">🎯 % Esperado — ${e.nome}</div><div class="mox" onclick="closeModal()">✕</div></div>
      <div class="mob">
        <p style="font-size:12px;color:var(--txt3);margin-bottom:14px">
          Define quanto desta etapa deveria estar concluído <strong>hoje</strong>.<br>
          Isso determina se está: <span style="color:#d94040">Atrasado</span>, <span style="color:#f4a623">No prazo</span>, <span style="color:#5b8ff9">Adiantado</span> ou <span style="color:#18a84d">Concluído</span>.
        </p>
        <div class="fg">
          <label class="lbl">% Esperado hoje (0–100)</label>
          <input type="number" class="inp" id="esp-val" min="0" max="100" value="${e.pctEsp??''}" placeholder="Ex: 50 (deixe vazio para calcular automaticamente)">
          <div style="font-size:11px;color:var(--txt3);margin-top:4px">
            Atual: <strong>${e.pct||0}%</strong> realizado · 
            ${e.inicio&&e.fim?`Período: ${e.inicio} → ${e.fim}`:'Sem datas definidas'}
          </div>
        </div>
      </div>
      <div class="mof">
        <button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn pri" onclick="(()=>{
          const v=document.getElementById('esp-val').value;
          const n=v===''?null:Math.min(100,Math.max(0,Number(v)));
          const e2=DB.etapas.find(x=>String(x.id)==='${id}');
          if(e2){e2.pctEsp=n;supaUpdate('etapas','${id}',{pct_esperado:n});save();renderCron();closeModal();toast('🎯','% esperado atualizado!');}
        })()">✅ Salvar</button>
      </div>
    </div></div>`;
  window._mSave=null;
}

function renderCurvaOrcRealizado(obraId){
  const grupos=typeof _orcGet==='function'?_orcGet(obraId):[];
  if(!grupos.length) return;

  const gruposComValor=grupos.filter(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));
  if(!gruposComValor.length) return;

  const labels=gruposComValor.map(g=>g.cod+' '+g.nome.substring(0,20));
  const orcado=gruposComValor.map(g=>g.subs.reduce((a,s)=>a+(Number(s.qtd)||0)*(Number(s.unit)||0),0));
  const realizado=gruposComValor.map(g=>{
    const nomeMatch=g.cod+' - '+g.nome;
    return DB.lancs.filter(l=>String(l.obraId)===String(obraId)&&l.tipo==='Despesa'&&(l.etapa===nomeMatch||l.etapa===g.nome||l.cat===g.nome)).reduce((a,l)=>a+Number(l.valor||0),0);
  });

  mkChart('ch-orc-real',{
    type:'bar',
    data:{
      labels:labels,
      datasets:[
        {label:'Orçado',data:orcado,backgroundColor:'rgba(91,143,249,0.7)',borderRadius:4},
        {label:'Realizado',data:realizado,backgroundColor:'rgba(45,212,122,0.7)',borderRadius:4}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{size:11}}},
        tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': R$ '+Number(ctx.raw).toLocaleString('pt-BR',{minimumFractionDigits:2})}}
      },
      scales:{
        x:{ticks:{font:{size:9},maxRotation:45}},
        y:{ticks:{font:{size:10},callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(0)+'k':v)}}
      }
    }
  });
}

function delEtapa(id){if(!confirm('Excluir etapa?'))return;if(typeof id==='string'&&id.includes('-'))supaDelete('etapas',id);DB.etapas=DB.etapas.filter(e=>String(e.id)!==String(id));save();renderCron();toast('🗑️','Etapa excluída.');}
function diasR(dt){return Math.max(0,Math.ceil((new Date(dt)-new Date())/86400000));}

