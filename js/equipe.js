// ═══════════════════════════════════════════
// EQUIPE
// ═══════════════════════════════════════════
function swTab(btn,id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));btn.classList.add('on');
  ['t-colab','t-ponto','t-folha','t-tercs'].forEach(t=>{const el=document.getElementById(t);if(el)el.style.display=t===id?'block':'none';});
  if(id==='t-ponto'){
    // Inicializa semana atual
    const sw=document.getElementById('pt-semana');
    if(sw&&!sw.value)sw.value=new Date().toISOString().split('T')[0];
    renderGradePresenca();renderPontos();
    sw?.addEventListener('change',renderGradePresenca);
    document.getElementById('pt-obra')?.addEventListener('change',renderGradePresenca);
  }
}
function renderEquipe(){fillSelects();renderColabs();renderPontos();}
function renderColabs(){
  const el=document.getElementById('colab-tbl');
  if(!DB.colabs.length){el.innerHTML='<div class="t-empty">Nenhum colaborador. <button class="btn pri sm" style="margin-left:8px" onclick="openModal(&apos;colab&apos;)">＋ Cadastrar</button></div>';return;}
  el.innerHTML=`<table class="tbl">
    <tr><th>Nome</th><th>Função</th><th>CPF</th><th>Admissão</th><th>💰 Diária</th><th>Obs</th><th></th></tr>`
    +DB.colabs.map(c=>`<tr>
      <td class="n">${c.nome}</td>
      <td>${c.funcao||'—'}</td>
      <td>${c.cpf||'—'}</td>
      <td>${c.admissao?fmtDt(c.admissao):'—'}</td>
      <td style="font-weight:700;color:var(--green)">${fmtR(c.diaria||c.salario||0)}</td>
      <td style="font-size:11px;color:var(--txt3)">${c.obs||'—'}</td>
      <td><div class="ta-actions">
        <button class="btn sm ico" onclick="openModal('colab','${c.id}')">✏️</button>
        <button class="btn sm ico" onclick="delColab('${c.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')+'</table>';
}
function delColab(id){if(!confirm('Excluir colaborador?'))return;if(typeof id==='string'&&id.includes('-'))supaDelete('colaboradores',id);DB.colabs=DB.colabs.filter(c=>String(c.id)!==String(id));DB.pontos=DB.pontos.filter(p=>p.colabId!==id);save();renderColabs();toast('🗑️','Excluído.');}
// ── Semana: pega segunda-feira da semana do dia informado ────────────────
function semanaIni(dateStr){
  const d=new Date(dateStr+'T12:00:00');
  const dow=d.getDay();// 0=dom
  const diff=dow===0?-6:1-dow;
  d.setDate(d.getDate()+diff);
  return d;
}
function addDias(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function toISO(d){return d.toISOString().split('T')[0];}
const DIAS_SEMANA=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

// ── Grade de presenças ────────────────────────────────────────────────────
function renderGradePresenca(){
  const semanaEl=document.getElementById('pt-semana');
  if(!semanaEl||!semanaEl.value)return;
  const obraId=parseInt(document.getElementById('pt-obra').value)||null;
  const seg=semanaIni(semanaEl.value);
  const diasISO=Array.from({length:7},(_,i)=>toISO(addDias(seg,i)));

  if(!DB.colabs.length){
    document.getElementById('presenca-grade').innerHTML='<div class="t-empty">Nenhum colaborador cadastrado.</div>';return;
  }

  // Cabeçalho dos dias
  let html=`<div style="overflow-x:auto">
  <table class="tbl" style="min-width:600px">
    <thead><tr>
      <th style="width:160px">Colaborador</th>
      <th style="text-align:center;font-size:10px;width:40px">Diária</th>
      ${diasISO.map((d,i)=>{
        const dt=new Date(d+'T12:00:00');
        const fds=i>=5;
        return`<th style="text-align:center;min-width:52px;color:${fds?'var(--txt3)':'var(--txt2)'}">
          <div style="font-size:10px;font-weight:600">${DIAS_SEMANA[i]}</div>
          <div style="font-size:9px;color:var(--txt3)">${dt.getDate()}/${dt.getMonth()+1}</div>
        </th>`;
      }).join('')}
      <th style="text-align:center">Dias</th>
      <th style="text-align:right">Subtotal</th>
    </tr></thead>
    <tbody>`;

  DB.colabs.forEach(col=>{
    const diaria=Number(col.diaria||col.salario||0);
    // Verificar presenças já salvas
    const presentes=diasISO.map(d=>{
      return DB.pontos.some(p=>p.colabId===col.id&&p.data===d&&(!obraId||p.obraId===obraId)&&p.presente===true);
    });
    html+=`<tr>
      <td class="n" style="font-size:12px">${col.nome}<div style="font-size:10px;color:var(--txt3)">${col.funcao||''}</div></td>
      <td style="text-align:center;font-size:11px;color:var(--green);font-weight:600">${fmtR(diaria)}</td>
      ${diasISO.map((d,i)=>{
        const fds=i>=5;
        const pt=DB.pontos.find(p=>p.colabId===col.id&&p.data===d&&(!obraId||p.obraId===obraId)&&p.presente);
        const val=pt?(pt.tipo==='meia_diaria'?'M':'P'):'';
        const bg=val==='P'?'#16a34a':val==='M'?'#d97706':'var(--bg3)';
        const clr=val?'#fff':'var(--txt3)';
        return`<td style="text-align:center;background:${fds?'rgba(255,255,255,.02)':''}">
          <select data-colab="${col.id}" data-data="${d}"
            onchange="atualizarSubtotal(${col.id},'${diasISO.join(',')}')"
            style="width:52px;height:24px;font-size:10px;font-weight:700;border-radius:5px;border:1px solid var(--border);background:${bg};color:${clr};cursor:pointer;text-align:center">
            <option value="" ${!val?'selected':''}>--</option>
            <option value="P" ${val==='P'?'selected':''}>Dia</option>
            <option value="M" ${val==='M'?'selected':''}>Meio</option>
          </select>
        </td>`;
      }).join('')}
      <td style="text-align:center;font-weight:700;font-size:13px" id="dias-${col.id}">
        ${presentes.filter(Boolean).length}
      </td>
      <td style="text-align:right;font-weight:700;color:var(--green)" id="sub-${col.id}">
        ${fmtR(presentes.filter(Boolean).length*diaria)}
      </td>
    </tr>`;
  });

  html+=`</tbody></table></div>`;
  document.getElementById('presenca-grade').innerHTML=html;
}

function atualizarSubtotal(colabId, diasStr){
  const dias=diasStr.split(',');
  const col=DB.colabs.find(x=>x.id===colabId);
  const diaria=Number(col?.diaria||col?.salario||0);
  let diasInt=0,meios=0,totalVal=0;
  dias.forEach(d=>{
    const v=document.querySelector(`select[data-colab="${colabId}"][data-data="${d}"]`)?.value||'';
    if(v==='P'){diasInt++;totalVal+=diaria;}
    else if(v==='M'){meios++;totalVal+=diaria/2;}
  });
  const tot=diasInt+(meios*0.5);
  const dEl=document.getElementById(`dias-${colabId}`);
  const sEl=document.getElementById(`sub-${colabId}`);
  if(dEl)dEl.textContent=tot%1===0?String(tot):tot.toFixed(1);
  if(sEl){sEl.textContent=fmtR(totalVal);sEl.style.color=totalVal>0?'var(--green)':'var(--txt3)';}
}

function marcarTodos(val){
  document.querySelectorAll('#presenca-grade select[data-colab]').forEach(cb=>{
    cb.value=val?'P':'';
    const colabId=parseInt(cb.dataset.colab);
    const semanaEl=document.getElementById('pt-semana');
    if(semanaEl&&semanaEl.value){
      const seg=semanaIni(semanaEl.value);
      const diasISO=Array.from({length:7},(_,i)=>toISO(addDias(seg,i)));
      atualizarSubtotal(colabId,diasISO.join(','));
    }
  });
}

function salvarPresenca(){
  const semanaEl=document.getElementById('pt-semana');
  if(!semanaEl||!semanaEl.value){toast('⚠️','Selecione uma data!');return;}
  const obraId=parseInt(document.getElementById('pt-obra').value)||null;
  const seg=semanaIni(semanaEl.value);
  const diasISO=Array.from({length:7},(_,i)=>toISO(addDias(seg,i)));

  let salvos=0,removidos=0;
  DB.colabs.forEach(col=>{
    diasISO.forEach(d=>{
      const cb=document.querySelector(`select[data-colab="${col.id}"][data-data="${d}"]`);
      if(!cb)return;
      const prev=DB.pontos.findIndex(p=>p.colabId===col.id&&p.data===d&&(!obraId||p.obraId===obraId));
      if(prev!==-1){
        const old=DB.pontos[prev];
        if(old&&typeof old.id==='string'&&old.id.includes('-'))supaDelete('pontos',old.id);
        DB.pontos.splice(prev,1);
      }
      if(cb.value==='P'){
        const newId=uuidv4();
        DB.pontos.push({id:newId,colabId:col.id,obraId,data:d,presente:true,tipo:'Presenca',_supa:true});
        supaInsert('pontos',{id:newId,colaborador_id:col.id,obra_id:obraId||null,data:d,presente:true,tipo:'Presenca'});
        salvos++;
      } else if(cb.value==='M'){
        const newId=uuidv4();
        DB.pontos.push({id:newId,colabId:col.id,obraId,data:d,presente:true,tipo:'meia_diaria',_supa:true});
        supaInsert('pontos',{id:newId,colaborador_id:col.id,obra_id:obraId||null,data:d,presente:true,tipo:'meia_diaria'});
        salvos++;
      } else removidos++;
    });
  });
  save();renderPontos();
  toast('✅',`${salvos} presença(s) salva(s)!`);
}

function renderPontos(){
  const filt=document.getElementById('pt-filter')?.value;
  const pts=DB.pontos.filter(p=>p.presente&&(!filt||p.colabId==filt)).sort((a,b)=>b.data.localeCompare(a.data)).slice(0,40);
  const el=document.getElementById('ponto-tbl');
  if(!pts.length){el.innerHTML='<div class="t-empty">Nenhuma presença registrada.</div>';return;}
  el.innerHTML=`<table class="tbl">
    <tr><th>Data</th><th>Dia</th><th>Colaborador</th><th>Obra</th><th>Diária</th><th></th></tr>`
    +pts.map(p=>{
      const col=DB.colabs.find(x=>x.id==p.colabId);
      const o=DB.obras.find(x=>x.id==p.obraId);
      const dt=new Date(p.data+'T12:00:00');
      const diaSem=DIAS_SEMANA[dt.getDay()===0?6:dt.getDay()-1];
      const diaria=Number(col?.diaria||col?.salario||0);
      return`<tr>
        <td>${fmtDt(p.data)}</td>
        <td><span class="b bn" style="font-size:10px">${diaSem}</span></td>
        <td class="n">${col?.nome||'—'}</td>
        <td>${o?.nome||'—'}</td>
        <td style="color:${p.tipo==='meia_diaria'?'#d97706':'var(--green)'};font-weight:600">${p.tipo==='meia_diaria'?'½ '+fmtR(diaria/2):fmtR(diaria)}</td>
        <td><span class="b ${p.tipo==='meia_diaria'?'by':'bg'}" style="font-size:9px">${p.tipo==='meia_diaria'?'½ Diária':'Dia'}</span></td>
        <td><button class="btn sm ico" onclick="delPonto('${p.id}')">🗑️</button></td>
      </tr>`;
    }).join('')+'</table>';
}
function delPonto(id){if(!confirm('Excluir presença?'))return;DB.pontos=DB.pontos.filter(p=>String(p.id)!==String(id));save();renderPontos();toast('🗑️','Removido.');}

function calcFolha(){
  const de=document.getElementById('fol-de').value;
  const ate=document.getElementById('fol-ate').value;
  if(!de||!ate){toast('⚠️','Informe o período!');return;}
  const oId=document.getElementById('fol-obra').value;
  // Pegar todas as presenças do período
  const pts=DB.pontos.filter(p=>p.presente&&p.data>=de&&p.data<=ate&&(!oId||p.obraId==oId));

  // Agrupar por colaborador
  const res={};
  pts.forEach(p=>{
    if(!res[p.colabId])res[p.colabId]={dias:[],meias:[],obras:{}};
    const meia=p.tipo==='meia_diaria';
    if(meia)res[p.colabId].meias.push(p.data);
    else res[p.colabId].dias.push(p.data);
    const oNome=DB.obras.find(o=>o.id==p.obraId)?.nome||'Geral';
    if(!res[p.colabId].obras[oNome])res[p.colabId].obras[oNome]=0;
    res[p.colabId].obras[oNome]+=(meia?0.5:1);
  });

  const rows=Object.entries(res).map(([cid,d])=>{
    const col=DB.colabs.find(x=>x.id==cid);if(!col)return null;
    const diaria=Number(col.diaria||col.salario||0);
    const diasInt=d.dias.length;
    const meias=d.meias.length;
    const totalDias=diasInt+(meias*0.5);
    const total=(diasInt*diaria)+(meias*(diaria/2));
    const obrasStr=Object.entries(d.obras).map(([n,q])=>`${n}(${q}d)`).join(', ');
    return{col,diasInt,meias,totalDias,diaria,total,obrasStr};
  }).filter(Boolean).sort((a,b)=>b.total-a.total);

  window._folhaRows=rows;
  window._folhaPer={de,ate};
  document.getElementById('folha-res').style.display='block';
  document.getElementById('folha-periodo').textContent=`${fmtDt(de)} → ${fmtDt(ate)}`;

  const totDias=rows.reduce((a,r)=>a+r.totalDias,0);
  const totVal=rows.reduce((a,r)=>a+r.total,0);

  document.getElementById('folha-tbl').innerHTML=rows.length
    ?`<table class="tbl">
        <tr>
          <th>Colaborador</th><th>Função</th><th style="text-align:right">Diária</th>
          <th style="text-align:center">Dias</th><th style="text-align:center">½ Meias</th>
          <th>Obras</th><th style="text-align:right">Total a Pagar</th>
        </tr>`
      +rows.map(r=>`<tr>
        <td class="n">${r.col.nome}</td>
        <td>${r.col.funcao||'—'}</td>
        <td style="text-align:right;color:var(--txt2)">${fmtR(r.diaria)}</td>
        <td style="text-align:center">
          <span style="font-size:14px;font-weight:700;color:var(--primary)">${r.diasInt||0}</span>
          <span style="font-size:10px;color:var(--txt3)"> d</span>
        </td>
        <td style="text-align:center">
          ${r.meias?`<span style="font-size:13px;font-weight:700;color:#d97706">${r.meias}</span><span style="font-size:10px;color:var(--txt3)">x</span>`:'<span style="color:var(--txt3)">—</span>'}
        </td>
        <td style="font-size:11px;color:var(--txt3)">${r.obrasStr||'—'}</td>
        <td style="text-align:right;font-size:14px;font-weight:700;color:var(--green)">${fmtR(r.total)}</td>
      </tr>`).join('')+'</table>'
    :'<div class="t-empty">Nenhuma presença no período.</div>';

  document.getElementById('folha-total').innerHTML=`
    <span style="color:var(--txt2)">${rows.length} colaborador(es) · ${totDias%1===0?totDias:totDias.toFixed(1)} diárias no período</span>
    <span>Total: <strong style="color:var(--green);font-size:15px">${fmtR(totVal)}</strong></span>`;
}

