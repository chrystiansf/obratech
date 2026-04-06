function qualTab(tab){
  document.querySelectorAll('.qual-tab').forEach(t=>{
    const isOn=t.dataset.qt===tab;
    t.style.borderBottomColor=isOn?'var(--primary)':'transparent';
    t.style.color=isOn?'var(--primary)':'var(--txt3)';
  });
  document.getElementById('qual-panel-nc').style.display=tab==='nc'?'block':'none';
  document.getElementById('qual-panel-chk').style.display=tab==='chk'?'block':'none';
  if(tab==='chk') renderChecklist();
  else renderQual();
}

function renderChecklist(){
  const obraFiltro=document.getElementById('chk-obra-filter')?.value||'';
  const statusFiltro=document.getElementById('chk-status-filter')?.value||'';

  const chkObraFilter=document.getElementById('chk-obra-filter');
  if(chkObraFilter&&chkObraFilter.options.length<=1){
    DB.obras.forEach(o=>{const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.nome;chkObraFilter.appendChild(opt);});
  }

  if(!DB.checklists) DB.checklists=[];
  let items=[...DB.checklists];
  if(obraFiltro) items=items.filter(c=>String(c.obraId)===String(obraFiltro));
  if(statusFiltro) items=items.filter(c=>c.status===statusFiltro);

  const el=document.getElementById('chk-tbl');
  if(!el) return;

  if(!items.length){
    el.innerHTML='<div class="t-empty">Nenhum item de checklist. Clique em "＋ Item" para adicionar.</div>';
    return;
  }

  // Agrupar por etapa
  const grupos={};
  items.forEach(c=>{
    const key=(c.obraId||'')+'|'+(c.etapaNome||'Geral');
    if(!grupos[key]) grupos[key]={obraId:c.obraId,etapa:c.etapaNome||'Geral',items:[]};
    grupos[key].items.push(c);
  });

  const statusBadge=s=>({
    pendente:'<span class="b by">⏳ Pendente</span>',
    ok:'<span class="b bg">✓ Conforme</span>',
    nok:'<span class="b br">✕ Não Conforme</span>'
  }[s]||'<span class="b bn">—</span>');

  el.innerHTML=Object.values(grupos).map(g=>{
    const o=DB.obras.find(x=>String(x.id)===String(g.obraId));
    const tot=g.items.length;
    const ok=g.items.filter(i=>i.status==='ok').length;
    const pct=tot?Math.round(ok/tot*100):0;
    return`<div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-weight:700;font-size:13px;color:var(--txt)">${g.etapa}</div>
        <div style="font-size:11px;color:var(--txt3)">${o?.nome||'—'}</div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;font-weight:600;color:${pct>=100?'var(--green)':pct>=50?'var(--yellow)':'var(--txt3)'}">${ok}/${tot} OK</span>
          <div style="width:80px;background:var(--bg3);border-radius:3px;height:5px"><div style="width:${pct}%;height:100%;background:${pct>=100?'var(--green)':'var(--primary)'};border-radius:3px"></div></div>
        </div>
      </div>
      <table class="tbl">
        <tr><th>Item de Verificação</th><th>Responsável</th><th>Data</th><th>Status</th><th>Obs</th><th></th></tr>
        ${g.items.map(i=>`<tr>
          <td class="n">
            <div style="font-weight:600">${i.item}</div>
            ${i.obs?`<div style="font-size:10px;color:var(--txt3);margin-top:2px">${i.obs}</div>`:''}
            ${i.fotos?.length?`<div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
              ${i.fotos.slice(0,4).map((f,fi)=>`<img src="${f.src}" onclick="chkVerFoto('${i.id}',${fi})" style="width:36px;height:36px;object-fit:cover;border-radius:4px;cursor:pointer;border:1px solid var(--border)" title="Ver foto">`).join('')}
              ${i.fotos.length>4?`<div style="width:36px;height:36px;background:var(--bg3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--txt3)">+${i.fotos.length-4}</div>`:''}
            </div>`:''}
          </td>
          <td style="font-size:11px">${i.resp||'—'}</td>
          <td style="font-size:11px">${i.data?fmtDt(i.data):'—'}</td>
          <td>${statusBadge(i.status)}</td>
          <td><div class="ta-actions">
            ${i.status==='pendente'?`<button class="btn sm" onclick="chkAprovar('${i.id}','ok')" title="Conforme" style="color:var(--green)">✓</button>
            <button class="btn sm" onclick="chkAprovar('${i.id}','nok')" title="Não conforme" style="color:var(--red)">✕</button>`:''}
            <button class="btn sm ico" onclick="openModal('checklist','${i.id}')">✏️</button>
            <button class="btn sm ico" onclick="delChecklist('${i.id}')">🗑️</button>
          </div></td>
        </tr>`).join('')}
      </table>
    </div>`;
  }).join('');
}

function chkFiltrarEtapas(obraId){
  const ets=DB.etapas.filter(e=>String(e.obraId)===String(obraId));
  const dl=document.getElementById('chk-etapa-list');
  if(dl) dl.innerHTML=ets.map(e=>'<option value="'+e.nome+'">'+e.nome+'</option>').join('');
}

function chkRemoveFoto(idx){
  if(!window._chkFotos) return;
  window._chkFotos.splice(idx,1);
  const g=document.getElementById('chk-foto-grid');
  if(g&&g._renderFn) g._renderFn();
}

function chkAddFotos(e){
  const files=[...e.target.files];
  let done=0;
  if(!files.length) return;
  files.forEach(f=>{
    if(f.size>3*1024*1024){
      toast('⚠️','Foto muito grande. Máx 3MB.');
      done++;
      if(done===files.length){
        const g=document.getElementById('chk-foto-grid');
        if(g&&g._renderFn) g._renderFn();
      }
      return;
    }
    const r=new FileReader();
    r.onload=ev=>{
      if(!window._chkFotos) window._chkFotos=[];
      window._chkFotos.push({src:ev.target.result});
      done++;
      if(done===files.length){
        const g=document.getElementById('chk-foto-grid');
        if(g&&g._renderFn) g._renderFn();
      }
    };
    r.readAsDataURL(f);
  });
}

function chkVerFoto(chkId, fotoIdx){
  const chk=DB.checklists.find(x=>x.id===chkId);
  if(!chk||!chk.fotos?.length) return;
  let idx=fotoIdx;
  const root=document.getElementById('modal-root');
  const render=()=>{
    const f=chk.fotos[idx];
    root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()" style="background:rgba(0,0,0,.85)">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;max-width:92vw">
        <div style="color:#fff;font-size:12px;font-weight:600">${chk.item} — Foto ${idx+1}/${chk.fotos.length}</div>
        <img src="${f.src}" style="max-width:88vw;max-height:78vh;border-radius:10px;object-fit:contain;display:block">
        <div style="display:flex;gap:12px">
          ${idx>0?`<button class="btn" onclick="window._chkFotoIdx=${idx-1};window._chkVerFotoRender()" style="background:rgba(255,255,255,.15);color:#fff">‹ Anterior</button>`:''}
          <button class="btn" onclick="closeModal()" style="background:rgba(255,255,255,.15);color:#fff">✕ Fechar</button>
          ${idx<chk.fotos.length-1?`<button class="btn" onclick="window._chkFotoIdx=${idx+1};window._chkVerFotoRender()" style="background:rgba(255,255,255,.15);color:#fff">Próxima ›</button>`:''}
        </div>
      </div>
    </div>`;
    window._chkVerFotoRender=render;
  };
  render();
}

function chkAprovar(id, status){
  const item=DB.checklists.find(x=>x.id===id);
  if(!item) return;
  item.status=status;
  item.data=new Date().toISOString().split('T')[0];
  item.resp=item.resp||DB.user.nome;
  supaUpdate('checklists',id,{status,data:item.data||null,responsavel:item.resp||null});
  save();renderChecklist();
  toast(status==='ok'?'✅':'⚠️',status==='ok'?'Item conforme!':'Item não conforme registrado.');
}

function delChecklist(id){
  if(!confirm('Excluir item?'))return;
  supaDelete('checklists',id);
  DB.checklists=DB.checklists.filter(x=>x.id!==id);
  save();renderChecklist();toast('🗑️','Item excluído.');
}

function renderQual(){
  // Popular filtro de obras
  const qof=document.getElementById('qual-obra-filter');
  if(qof){
    const curVal=qof.value;
    qof.innerHTML='<option value="">Todas as obras</option>'+DB.obras.map(o=>`<option value="${o.id}"${curVal===String(o.id)?' selected':''}>${o.nome}</option>`).join('');
  }
  const qualObraFiltro=qof?.value||'';
  let ncs=qualObraFiltro?DB.ncs.filter(n=>String(n.obraId)===String(qualObraFiltro)):DB.ncs.slice();
  const ab=ncs.filter(n=>n.status!=='Fechada').length;const vc=ncs.filter(n=>n.status!=='Fechada'&&n.prazo&&new Date(n.prazo)<new Date()).length;
  // Filtro por KPI clicado
  const _qkF=window._qualFiltroKpi||'';
  if(_qkF==='abertas') ncs=ncs.filter(n=>n.status!=='Fechada');
  else if(_qkF==='vencidas') ncs=ncs.filter(n=>n.status!=='Fechada'&&n.prazo&&new Date(n.prazo)<new Date());
  const _qkF=window._qualFiltroKpi||'';
  const _qkAct=(v)=>_qkF===v?'outline:2px solid var(--primary);outline-offset:-2px;border-radius:10px':'';
  document.getElementById('qual-kpis').innerHTML=`
    <div class="kpi" onclick="qualFiltroKpi('')" style="cursor:pointer;${_qkAct('')}"><div class="kl">📋 Total NCs</div><div class="kv">${ncs.length}</div><div class="kd neu">Registradas</div></div>
    <div class="kpi" onclick="qualFiltroKpi('abertas')" style="cursor:pointer;${_qkAct('abertas')}"><div class="kl">🔴 Abertas</div><div class="kv" style="color:${ab?'var(--yellow)':'var(--green)'}">${ab}</div><div class="kd ${ab?'dn':'up'}">${ab?'Pendentes':'Tudo OK'}</div></div>
    <div class="kpi" onclick="qualFiltroKpi('vencidas')" style="cursor:pointer;${_qkAct('vencidas')}"><div class="kl">⏰ Vencidas</div><div class="kv" style="color:${vc?'var(--red)':'var(--green)'}">${vc}</div><div class="kd ${vc?'dn':'up'}">${vc?'Urgente':'Nenhuma'}</div></div>`;
  const el=document.getElementById('nc-tbl');
  if(!ncs.length){el.innerHTML='<div class="t-empty">Nenhuma NC. <button class="btn pri sm" onclick="openModal(&apos;nc&apos;)" style="margin-left:8px">＋ Registrar</button></div>';}
  else el.innerHTML=`<table class="tbl"><tr><th>Nº</th><th>Obra</th><th>Etapa</th><th>Descrição</th><th>Prazo</th><th>Grau</th><th>Status</th><th></th></tr>`+ncs.sort((a,b)=>String(b.id).localeCompare(String(a.id))).map((n,i)=>{const o=DB.obras.find(x=>String(x.id)===String(n.obraId));const vend=n.prazo&&new Date(n.prazo)<new Date()&&n.status!=='Fechada';return`<tr><td style="font-weight:600;color:var(--primary)">#${n.numero||String(i+1).padStart(2,'0')}</td><td>${o?.nome||'—'}</td><td>${n.etapa||'—'}</td><td class="n">${n.desc}</td><td style="color:${vend?'var(--red)':'inherit'}">${n.prazo?fmtDt(n.prazo):'—'}${vend?' ⚠':''}</td><td><span class="b ${n.grau==='Alta'?'br':n.grau==='Média'?'by':'bn'}">${n.grau||'Baixa'}</span></td><td><span class="b ${n.status==='Fechada'?'bg':'by'}">${n.status}</span></td><td><div class="ta-actions">${n.status!=='Fechada'?`<button class="btn sm" onclick="fecharNC('${n.id}')" title="Fechar NC">✓</button>`:''}<button class="btn sm ico" onclick="openModal('nc','${n.id}')">✏️</button><button class="btn sm ico" onclick="delNC('${n.id}')">🗑️</button></div></td></tr>`;}).join('')+'</table>';
  setTimeout(()=>{
    const ets=[...new Set(ncs.map(n=>n.etapa).filter(Boolean))];
    const vals=ets.map(et=>{const t=ncs.filter(n=>n.etapa===et).length;const f=ncs.filter(n=>n.etapa===et&&n.status==='Fechada').length;return t?Math.round(f/t*100):100;});
    mkChart('ch-qual',{type:'radar',data:{labels:ets.length?ets:['Nenhuma'],datasets:[{label:'% Resolvido',data:ets.length?vals:[100],backgroundColor:CP.grnA,borderColor:CP.grn,borderWidth:2,pointBackgroundColor:CP.grn}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:CP.t,font:{size:10}}}},scales:{r:{grid:{color:CP.g},ticks:{color:CP.t,backdropColor:'transparent',font:{size:9}},pointLabels:{color:CP.t,font:{size:10}}}}}});
  },50);
}
function qualFiltroKpi(filtro){
  window._qualFiltroKpi=window._qualFiltroKpi===filtro?'':filtro;
  renderQual();
}
function fecharNC(id){const n=DB.ncs.find(x=>x.id===id);if(n){n.status='Fechada';save();if(typeof id==='string'&&id.includes('-'))supaUpdate('nao_conformidades',id,{status:'Fechada'});renderQual();toast('✅','NC fechada!');}}
function delNC(id){if(!confirm('Excluir NC?'))return;if(typeof id==='string'&&id.includes('-'))supaDelete('nao_conformidades',id);DB.ncs=DB.ncs.filter(n=>String(n.id)!==String(id));save();renderQual();toast('🗑️','NC excluída.');}
