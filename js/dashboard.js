// ═══════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════
const CH={};
function mkChart(id,cfg){if(CH[id])CH[id].destroy();const el=document.getElementById(id);if(!el)return;CH[id]=new Chart(el,cfg);}
const CP={g:'rgba(42,48,80,.8)',t:'rgba(136,146,184,1)',pri:'rgba(91,143,249,1)',priA:'rgba(91,143,249,.25)',grn:'rgba(34,211,99,1)',grnA:'rgba(34,211,99,.2)',red:'rgba(242,92,92,1)',redA:'rgba(242,92,92,.2)',yel:'rgba(246,201,14,1)',yelA:'rgba(246,201,14,.15)',pur:'rgba(155,116,245,1)',cya:'rgba(34,212,212,1)'};
const BO={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:CP.t,font:{family:'DM Sans',size:10},boxWidth:8,padding:7}}},scales:{x:{grid:{color:CP.g},ticks:{color:CP.t,font:{size:10}}},y:{grid:{color:CP.g},ticks:{color:CP.t,font:{size:10}}}}};

function meses6(){const M=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],n=new Date();return Array.from({length:6},(_,i)=>{const d=new Date(n.getFullYear(),n.getMonth()-5+i,1);return{l:M[d.getMonth()],y:d.getFullYear(),m:d.getMonth()};});}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
// ── Estado do filtro de obras ─────────────────────────────────────
let _obrasFiltro=null; // null = todas; array de ids = seleção

function toggleObraDropdown(e){
  e.stopPropagation();
  const dd=document.getElementById('d-obra-dropdown');
  dd.classList.toggle('open');
  if(dd.classList.contains('open')){
    document.getElementById('d-filter-search').value='';
    filterObraDropdown('');
    document.getElementById('d-filter-search').focus();
  }
}
document.addEventListener('click',e=>{
  if(!document.getElementById('d-obra-filter')?.contains(e.target))
    document.getElementById('d-obra-dropdown')?.classList.remove('open');
});

function buildObraDropdown(){
  const items=document.getElementById('d-filter-items');
  if(!items)return;
  items.innerHTML=DB.obras.map(o=>{
    const checked=_obrasFiltro===null||_obrasFiltro.includes(o.id);
    const cor=obraColor(o);
    const bg=cor==='g'?'var(--green)':cor==='r'?'var(--red)':cor==='b'?'var(--primary)':'var(--txt3)';
    return `<div class="d-filter-item" onclick="toggleObraCheck('${o.id}',event)">
      <input type="checkbox" id="d-chk-${o.id}" ${checked?'checked':''} onclick="toggleObraCheck('${o.id}',event)">
      <span class="d-filter-dot" style="background:${bg}"></span>
      <span style="flex:1">${o.nome}</span>
    </div>`;
  }).join('');
  updateFilterLabel();
}

function filterObraDropdown(q){
  const items=document.querySelectorAll('#d-filter-items .d-filter-item');
  items.forEach(el=>{
    const name=el.textContent.toLowerCase();
    el.style.display=name.includes(q.toLowerCase())?'':'none';
  });
}

function toggleObraCheck(id,e){
  e.stopPropagation();
  if(_obrasFiltro===null) _obrasFiltro=DB.obras.map(o=>o.id);
  const idx=_obrasFiltro.indexOf(id);
  if(idx>=0) _obrasFiltro.splice(idx,1);
  else _obrasFiltro.push(id);
  if(_obrasFiltro.length===DB.obras.length) _obrasFiltro=null;
  const chk=document.getElementById('d-chk-'+id);
  if(chk) chk.checked=(_obrasFiltro===null||_obrasFiltro.includes(id));
  const allChk=document.getElementById('d-chk-all');
  if(allChk) allChk.checked=_obrasFiltro===null;
  updateFilterLabel();
  updateSbObra();
  dashSelecionarObra();
}

function toggleAllObras(){
  const allChk=document.getElementById('d-chk-all');
  if(!allChk)return;
  if(_obrasFiltro===null){
    // Desmarcar tudo
    _obrasFiltro=[];
    allChk.checked=false;
  } else {
    // Marcar tudo
    _obrasFiltro=null;
    allChk.checked=true;
  }
  buildObraDropdown();
  updateSbObra();
  dashSelecionarObra();
}

function updateFilterLabel(){
  const lbl=document.getElementById('d-filter-label');
  const cnt=document.getElementById('d-filter-count');
  if(!lbl||!cnt)return;
  if(_obrasFiltro===null||_obrasFiltro.length===DB.obras.length){
    lbl.textContent='Todas as obras';
    cnt.style.display='none';
  } else if(_obrasFiltro.length===0){
    lbl.textContent='Nenhuma obra';
    cnt.style.display='none';
  } else if(_obrasFiltro.length===1){
    const o=DB.obras.find(x=>x.id===_obrasFiltro[0]);
    lbl.textContent=o?.nome||'1 obra';
    cnt.style.display='none';
  } else {
    lbl.textContent=_obrasFiltro.length+' obras';
    cnt.textContent=_obrasFiltro.length;
    cnt.style.display='inline';
  }
  // Atualizar checkboxes
  document.querySelectorAll('#d-filter-items .d-filter-item input[type=checkbox]').forEach(chk=>{
    const id=parseInt(chk.id.replace('d-chk-',''));
    chk.checked=_obrasFiltro===null||_obrasFiltro.includes(id);
  });
  const allChk=document.getElementById('d-chk-all');
  if(allChk)allChk.checked=_obrasFiltro===null;
}

function getObrasAtivas(){
  if(_obrasFiltro===null) return DB.obras;
  return DB.obras.filter(o=>_obrasFiltro.includes(o.id));
}

function dashSelecionarObra(){
  const obras=getObrasAtivas();
  if(obras.length===1){DB.sel=obras[0].id;save();}
  renderDash();
}
function _dashObraLegacy(obras){
  // Mantido apenas para compatibilidade — lógica migrada para renderDashCharts
  if(obras.length===1){
    // ── Modo de obra única: exibe nome e status ──────────────────
    const obra=obras[0];
    const m2=Number(obra.m2)||0;
    const orcM2=m2&&obra.orc?obra.orc/m2:0;
    const realM2=m2&&dep?dep/m2:0;
    const acimaBudget=orcM2&&realM2>orcM2;
    if(nomeEl)nomeEl.textContent=obra.nome;
    if(subEl)subEl.innerHTML=`<span class="b ${obraColor(obra)==='r'?'br':obraColor(obra)==='g'?'bg':obraColor(obra)==='fin'?'bg':'bn'}">${obraLabel(obra)}</span>&nbsp;&nbsp;${obra.local?'📍 '+obra.local:''}`;
    if(kpisEl)kpisEl.innerHTML=`
      <div class="kpi"><div class="kl">📐 Orçado/m²</div><div class="kv" style="color:var(--accent)">${orcM2?fmtR(orcM2)+'/m²':'—'}</div><div class="kd neu">${m2?m2+' m² total':'Cadastre o m²'}</div></div>
      <div class="kpi" style="border-color:${acimaBudget?'rgba(217,64,64,.4)':'rgba(34,211,99,.3)'}">
        <div class="kl">📊 Realizado/m²</div>
        <div class="kv" style="color:${realM2?(acimaBudget?'var(--red)':'var(--green)'):'var(--txt3)'}">${realM2?fmtR(realM2)+'/m²':'—'}</div>
        <div class="kd ${acimaBudget?'dn':'up'}">${realM2?(acimaBudget?'⚠ Acima do orçado':'✓ Dentro do orçado'):'Sem lançamentos'}</div>
      </div>
      <div class="kpi"><div class="kl">💸 Total Gasto</div><div class="kv" style="color:var(--red)">${fmtR(dep)}</div><div class="kd neu">de ${fmtR(obra.orc||0)} orçados</div></div>
      <div class="kpi"><div class="kl">🏗️ Avanço Físico</div><div class="kv" style="color:var(--primary)">${pctMedio}%</div><div class="kd ${pctMedio>=50?'up':'neu'}">${DB.etapas.filter(e=>String(e.obraId)===String(obra.id)).length} etapas</div></div>`;
    // Barra m²
    if(barEl&&m2&&(orcM2||realM2)){
      barEl.style.display='block';
      const maxVal=Math.max(orcM2,realM2)*1.1||1;
      const fillPct=Math.min(100,realM2/maxVal*100);
      const fill=document.getElementById('d-m2-bar-fill');
      const pctLabel=document.getElementById('d-m2-pct-label');
      const barLabels=document.getElementById('d-m2-bar-labels');
      if(fill){fill.style.width=fillPct+'%';fill.style.background=acimaBudget?'var(--red)':'var(--green)';}
      if(pctLabel)pctLabel.textContent=orcM2?`${Math.round(realM2/orcM2*100)}% do orçado/m²`:'';
      if(barLabels)barLabels.innerHTML=`<span style="color:${acimaBudget?'var(--red)':'var(--green)'}">Realizado: <strong>${fmtR(realM2)}/m²</strong></span>&nbsp;&nbsp;<span style="color:var(--txt3)">Orçado: ${fmtR(orcM2)}/m²</span>`;
    } else if(barEl)barEl.style.display='none';
  } else {
    // ── Modo multi-obra: KPIs consolidados ──────────────────────
    const orcM2Total=totalM2&&totalOrc?totalOrc/totalM2:0;
    const realM2Total=totalM2&&dep?dep/totalM2:0;
    const acima=orcM2Total&&realM2Total>orcM2Total;
    const nAt=obras.filter(o=>obraStatus(o)==='andamento').length;
    const nAt2=obras.filter(o=>obraStatus(o)==='atrasada').length;
    const nCon=obras.filter(o=>obraStatus(o)==='concluida').length;
    if(nomeEl)nomeEl.textContent=`${obras.length} obras selecionadas`;
    if(subEl)subEl.innerHTML=obras.map(o=>`<span class="b ${obraColor(o)==='r'?'br':obraColor(o)==='g'?'bg':obraColor(o)==='fin'?'bg':'bn'}" style="margin-right:4px">${o.nome}</span>`).join('');
    if(kpisEl)kpisEl.innerHTML=`
      <div class="kpi"><div class="kl">💰 Orçamento Total</div><div class="kv" style="color:var(--accent)">${fmtR(totalOrc)}</div><div class="kd neu">${totalM2?totalM2+' m² total':'—'}</div></div>
      <div class="kpi" style="border-color:${acima?'rgba(217,64,64,.4)':'rgba(34,211,99,.3)'}">
        <div class="kl">💸 Total Gasto</div>
        <div class="kv" style="color:var(--red)">${fmtR(dep)}</div>
        <div class="kd ${acima?'dn':'up'}">${totalOrc?Math.round(dep/totalOrc*100)+'% do orçado':''}</div>
      </div>
      <div class="kpi"><div class="kl">📊 Avanço Médio</div><div class="kv" style="color:var(--primary)">${pctMedio}%</div><div class="kd neu">${obras.length} obras</div></div>
      <div class="kpi"><div class="kl">📋 Status</div>
        <div class="kv" style="font-size:14px;gap:8px;display:flex;align-items:center">
          ${nCon?`<span style="color:var(--primary)">${nCon}✓</span>`:''}
          ${nAt?`<span style="color:var(--green)">${nAt}▶</span>`:''}
          ${nAt2?`<span style="color:var(--red)">${nAt2}!</span>`:''}
        </div>
        <div class="kd neu">${nCon} concl · ${nAt} andamento · ${nAt2} atrasada</div>
      </div>`;
    if(barEl){
      if(totalM2&&(orcM2Total||realM2Total)){
        barEl.style.display='block';
        const maxVal=Math.max(orcM2Total,realM2Total)*1.1||1;
        const fillPct=Math.min(100,realM2Total/maxVal*100);
        const fill=document.getElementById('d-m2-bar-fill');
        const pctLabel=document.getElementById('d-m2-pct-label');
        const barLabels=document.getElementById('d-m2-bar-labels');
        if(fill){fill.style.width=fillPct+'%';fill.style.background=acima?'var(--red)':'var(--green)';}
        if(pctLabel)pctLabel.textContent=orcM2Total?`${Math.round(realM2Total/orcM2Total*100)}% do orçado/m² consolidado`:'';
        if(barLabels)barLabels.innerHTML=`<span style="color:${acima?'var(--red)':'var(--green)'}">Realizado: <strong>${fmtR(realM2Total)}/m²</strong></span>&nbsp;&nbsp;<span style="color:var(--txt3)">Orçado: ${fmtR(orcM2Total)}/m²</span>`;
      } else barEl.style.display='none';
    }
  }
  renderDashCharts(obras);
}

function renderDashCharts(obras){
  setTimeout(()=>{
    const ms=meses6();
    const recs=ms.map(m=>DB.lancs.filter(l=>obras.some(o=>o.id===l.obraId)&&l.tipo==='Receita'&&new Date(l.data).getMonth()===m.m&&new Date(l.data).getFullYear()===m.y).reduce((a,l)=>a+Number(l.valor),0));
    const deps=ms.map(m=>DB.lancs.filter(l=>obras.some(o=>o.id===l.obraId)&&l.tipo==='Despesa'&&new Date(l.data).getMonth()===m.m&&new Date(l.data).getFullYear()===m.y).reduce((a,l)=>a+Number(l.valor),0));
    mkChart('ch-fluxo',{type:'line',data:{labels:ms.map(m=>m.l),datasets:[{label:'Receitas',data:recs,borderColor:CP.grn,backgroundColor:CP.grnA,fill:true,tension:.4},{label:'Despesas',data:deps,borderColor:CP.red,backgroundColor:CP.redA,fill:true,tension:.4}]},options:BO});
    mkChart('ch-avancos',{type:'bar',data:{labels:obras.map(o=>o.nome.split(' ').slice(0,2).join(' ')),datasets:[{label:'Avanço %',data:obras.map(obraPct),backgroundColor:obras.map(o=>obraColor(o)==='r'?CP.redA:obraColor(o)==='g'?CP.grnA:CP.priA),borderColor:obras.map(o=>obraColor(o)==='r'?CP.red:obraColor(o)==='g'?CP.grn:CP.pri),borderWidth:2,borderRadius:3}]},options:{...BO,scales:{...BO.scales,y:{...BO.scales.y,max:100}}}});
    const cats=(DB.categorias||['Mão de Obra','Materiais','Equipamentos','Serviços','Administração','Impostos','Outros']);
    const catColors=['rgba(91,143,249,.7)','rgba(34,211,99,.7)','rgba(246,201,14,.7)','rgba(242,92,92,.7)','rgba(155,116,245,.7)','rgba(34,212,212,.7)','rgba(255,159,64,.7)'];
    const catBorders=[CP.pri,CP.grn,CP.yel,CP.red,CP.pur,CP.cya,'rgba(255,159,64,1)'];
    const cvals=cats.map(cat=>DB.lancs.filter(l=>obras.some(o=>o.id===l.obraId)&&l.cat===cat&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0));
    const catsFilt=cats.map((c,i)=>({nome:c,val:cvals[i],bg:catColors[i%catColors.length],border:catBorders[i%catBorders.length]})).filter(c=>c.val>0);
    mkChart('ch-categorias',{type:'doughnut',data:{labels:catsFilt.length?catsFilt.map(c=>c.nome):cats,datasets:[{data:catsFilt.length?catsFilt.map(c=>c.val):[1,1,1,1,1,1,1],backgroundColor:catsFilt.length?catsFilt.map(c=>c.bg):catColors,borderColor:catsFilt.length?catsFilt.map(c=>c.border):catBorders,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:CP.t,font:{size:9},boxWidth:8}}}}});
  },50);
}

function renderDash(){
  const obras=DB.obras;
  document.getElementById('d-empty').style.display=obras.length?'none':'block';
  document.getElementById('d-content').style.display=obras.length?'':'none';
  if(!obras.length)return;
  // Usar obras filtradas para KPIs e gráficos
  if(_obrasFiltro!==null)_obrasFiltro=_obrasFiltro.filter(id=>obras.some(o=>o.id===id));
  buildObraDropdown();
  const filtObras=getObrasAtivas();
  const filtLancs=DB.lancs.filter(l=>filtObras.some(o=>o.id===l.obraId));
  const filtRec=filtLancs.filter(l=>l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
  const filtDep=filtLancs.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
  const filtSaldo=filtRec-filtDep;
  const filtPm=filtObras.length?Math.round(filtObras.reduce((a,o)=>a+obraPct(o),0)/filtObras.length):0;
  const ncsAb=DB.ncs.filter(n=>n.status!=='Fechada').length;
  const filtLbl=_obrasFiltro===null?'Todas as obras':filtObras.length===1?filtObras[0]?.nome:(filtObras.length+' selecionadas');
  document.getElementById('d-kpis').innerHTML=`
    <div class="kpi"><div class="kl">🏗️ Obras</div><div class="kv">${filtObras.length}<span style="font-size:12px;color:var(--txt3);font-weight:400">/${obras.length}</span></div><div class="kd neu">Cadastradas</div></div>
    <div class="kpi"><div class="kl">📊 Avanço Médio</div><div class="kv" style="color:var(--primary)">${filtPm}%</div><div class="kd ${filtPm>=50?'up':'neu'}">${filtLbl}</div></div>
    <div class="kpi"><div class="kl">💰 Saldo Geral</div><div class="kv" style="color:${filtSaldo>=0?'var(--green)':'var(--red)'}">${fmtR(filtSaldo)}</div><div class="kd ${filtSaldo>=0?'up':'dn'}">Receitas − Despesas</div></div>
    <div class="kpi"><div class="kl">⚠️ NCs Abertas</div><div class="kv" style="color:${ncsAb?'var(--yellow)':'var(--green)'}">${ncsAb}</div><div class="kd ${ncsAb?'dn':'up'}">${ncsAb?'Atenção':'Tudo OK'}</div></div>`;
  // Alertas
  const alts=[];
  DB.ncs.filter(n=>n.status!=='Fechada'&&n.prazo&&new Date(n.prazo)<new Date()).forEach(n=>{const o=DB.obras.find(x=>x.id==n.obraId);alts.push({t:'r',msg:`NC vencida: ${n.desc.substring(0,35)} — ${o?.nome||''}`});});
  DB.estoque.forEach(e=>{const saldo=DB.movs.filter(m=>m.estId===e.id).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);if(saldo>0&&saldo<=Number(e.min))alts.push({t:'y',msg:`Estoque mínimo: ${e.material} (${saldo} ${e.un})`});});
  const hoje=new Date().toISOString().split('T')[0];
  obras.forEach(o=>{if(o.dataFim&&o.dataFim<hoje&&obraPct(o)<100)alts.push({t:'y',msg:`Prazo vencido: ${o.nome}`});});
  if(!alts.length)alts.push({t:'g',msg:'Nenhum alerta crítico no momento.'});
  document.getElementById('d-alertas').innerHTML='<div class="tl">'+alts.map(a=>`<div class="tli"><div class="tld ${a.t}"></div><div class="tltx">${a.msg}</div></div>`).join('')+'</div>';
  renderDashCharts(getObrasAtivas());
  // Tabela obras
  document.getElementById('d-obras-tbl').innerHTML=obras.length
    ?`<table class="tbl"><tr><th>Obra</th><th>Avanço</th><th>Status</th></tr>`+obras.map(o=>`<tr><td class="n">${o.nome}</td><td style="min-width:110px"><div class="pl"><span>${obraPct(o)}%</span></div><div class="pw"><div class="pb" style="width:${obraPct(o)}%;background:var(--${obraColor(o)==='r'?'red2':obraColor(o)==='g'?'green2':'primary'})"></div></div></td><td><span class="b ${obraColor(o)==='r'?'br':obraColor(o)==='g'?'bg':obraColor(o)==='fin'?'bg':'bn'}">${obraLabel(o)}</span></td></tr>`).join('')+'</table>'
    :'<div class="t-empty">Nenhuma obra.</div>';
}
