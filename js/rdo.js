// RDO
// ═══════════════════════════════════════════
let rdoClima='Ensolarado',rdoFotos=[];
function setClima(btn,c){rdoClima=c;document.querySelectorAll('#wbtns .btn').forEach(b=>{b.style.cssText='';});btn.style.borderColor='var(--primary)';btn.style.color='var(--primary)';}
// ── RDO: presença do dia ────────────────────────────────────────────────────
// ── TERCEIRIZADOS ──────────────────────────────────────────
function renderTerceirizados(){
  const el=document.getElementById('tercs-tbl');
  if(!el)return;
  if(!DB.terceirizados.length){
    el.innerHTML='<div class="t-empty">Nenhum terceirizado cadastrado. Clique em "＋ Terceirizado" para começar.</div>';
    return;
  }
  const empresas={};
  DB.terceirizados.forEach(t=>{const emp=t.empresa||'Sem empresa';if(!empresas[emp])empresas[emp]=[];empresas[emp].push(t);});
  el.innerHTML=Object.keys(empresas).sort().map(emp=>{
    const tercs=empresas[emp];
    return`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:0;margin-bottom:14px;overflow:hidden">
      <div style="background:var(--primary);color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-weight:700;font-size:14px">${emp}</span>
        <span style="font-size:11px;opacity:.85">${tercs.length} profissiona${tercs.length>1?'is':'l'}</span>
      </div>
      <table class="tbl" style="margin:0">
        <tr><th>Nome</th><th>Função</th><th>CPF</th><th>Telefone</th><th></th></tr>
        ${tercs.map(t=>`<tr>
          <td style="font-weight:600">${t.nome}</td>
          <td style="color:var(--txt3)">${t.funcao||'—'}</td>
          <td style="font-size:11px">${t.cpf||'—'}</td>
          <td style="font-size:11px">${t.celular||'—'}</td>
          <td><div class="ta-actions">
            <button class="btn sm ico" onclick="openModal('terceirizado','${t.id}')">✏️</button>
            <button class="btn sm ico" onclick="delTerceirizado('${t.id}')">🗑️</button>
          </div></td>
        </tr>`).join('')}
      </table>
    </div>`;
  }).join('');
}

function delTerceirizado(id){
  if(!confirm('Excluir terceirizado?'))return;
  supaDelete('terceirizados',id);
  DB.terceirizados=DB.terceirizados.filter(t=>t.id!==id);
  save();renderTerceirizados();toast('🗑️','Terceirizado excluído.');
}

// ── RDO: presença terceirizados ─────────────────────────────
function rdoRenderPresencaTercs(){
  const oId=document.getElementById('rdo-obra')?.value;
  const data=document.getElementById('rdo-data')?.value;
  const el=document.getElementById('rdo-presenca-tercs');
  if(!el)return;

  // Mostrar todos os terceirizados (sem filtro por obra)
  const tercs=DB.terceirizados;
  if(!tercs.length){
    el.innerHTML='<div style="padding:10px 13px;font-size:11px;color:var(--txt3)">Nenhum terceirizado cadastrado.</div>';
    return;
  }

  el.innerHTML=tercs.map(t=>{
    const pt=data?DB.pontosTercs?.find(p=>p.tercId===t.id&&p.data===data):null;
    const presente=!!pt?.presente;
    const btnStyle=(ativo,cor)=>`padding:3px 10px;font-size:10px;font-weight:700;border-radius:5px;cursor:pointer;border:1px solid ${ativo?cor:'var(--border)'};background:${ativo?cor:'var(--bg3)'};color:${ativo?'#fff':'var(--txt3)'}`;
    return`<div style="display:flex;align-items:center;gap:8px;padding:7px 13px;border-bottom:1px solid var(--border)">
      <button onclick="rdoSetPresencaTerc('${t.id}',true)" style="${btnStyle(presente,'#16a34a')}">✓ Presente</button>
      <button onclick="rdoSetPresencaTerc('${t.id}',false)" style="${btnStyle(!presente,'#dc2626')}">✗ Falta</button>
      <span style="flex:1;font-size:12px;font-weight:600;color:var(--txt)">${t.nome}</span>
      <span style="font-size:10px;color:var(--txt3)">${t.funcao||''}</span>
    </div>`;
  }).join('');
}

function rdoSetPresencaTerc(tercId,presente){
  const oId=document.getElementById('rdo-obra')?.value||null;
  const data=document.getElementById('rdo-data')?.value;
  if(!data){toast('⚠️','Informe a data primeiro!');return;}
  if(!DB.pontosTercs)DB.pontosTercs=[];
  const prev=DB.pontosTercs.findIndex(p=>p.tercId===tercId&&p.data===data&&(!oId||p.obraId===oId));
  if(prev!==-1)DB.pontosTercs.splice(prev,1);
  const newId=uuidv4();
  const newPt={id:newId,tercId,obraId:oId,data,presente,_supa:true};
  DB.pontosTercs.push(newPt);
  supaInsert('pontos_terceirizados',{id:newId,empresa_id:_empresaId,terceirizado_id:tercId,obra_id:oId||null,data,presente});
  save();rdoRenderPresencaTercs();
}

function rdoMarcarTodosTercs(pres){
  const oId=document.getElementById('rdo-obra')?.value;
  const data=document.getElementById('rdo-data')?.value;
  if(!data){toast('⚠️','Informe a data primeiro!');return;}
  DB.terceirizados.forEach(t=>rdoSetPresencaTerc(t.id,pres));
}

function rdoRenderPresenca(){
  const oId=document.getElementById('rdo-obra')?.value;
  const data=document.getElementById('rdo-data')?.value;
  const el=document.getElementById('rdo-presenca-lista');
  if(!el)return;
  if(!DB.colabs.length){
    el.innerHTML='<div style="padding:10px 13px;font-size:11px;color:var(--txt3)">Nenhum colaborador cadastrado em Equipe.</div>';return;
  }
  el.innerHTML=DB.colabs.map(col=>{
    const pt=data?DB.pontos.find(p=>p.colabId===col.id&&p.data===data&&(!oId||p.obraId===oId)&&p.presente):null;
    const tipo=pt?pt.tipo||'Presenca':'';
    const meia=tipo==='meia_diaria';
    const presente=!!pt;
    const diaria=Number(col.diaria||col.salario||0);
    const valorHoje=presente?(meia?diaria/2:diaria):0;
    const btnStyle=(ativo,cor)=>`padding:3px 10px;font-size:10px;font-weight:700;border-radius:5px;cursor:pointer;border:1px solid ${ativo?cor:'var(--border)'};background:${ativo?cor:'var(--bg3)'};color:${ativo?'#fff':'var(--txt3)'}`;
    return`<div style="display:flex;align-items:center;gap:8px;padding:7px 13px;border-bottom:1px solid var(--border)">
      <button onclick="rdoSetPresenca('${col.id}','P')" title="Dia inteiro" style="${btnStyle(!meia&&presente,'#16a34a')}">Dia</button>
      <button onclick="rdoSetPresenca('${col.id}','M')" title="Meia diaria" style="${btnStyle(meia,'#d97706')}">1/2</button>
      <button onclick="rdoSetPresenca('${col.id}','')" title="Marcar falta" style="${btnStyle(!presente,'#dc2626')}">X</button>
      <span style="flex:1;font-size:12px;font-weight:600;color:var(--txt)">${col.nome}</span>
      <span style="font-size:10px;color:var(--txt3)">${col.funcao||''}</span>
      ${diaria?`<span style="font-size:11px;font-weight:600;color:${valorHoje?'var(--green)':'var(--txt3)'}">${valorHoje?fmtR(valorHoje)+'/dia':'--'}</span>`:''}
    </div>`;
  }).join('');
}
function rdoSetPresenca(colabId,tipo){
  const oId=document.getElementById('rdo-obra')?.value||null;
  const data=document.getElementById('rdo-data')?.value;
  if(!data){toast('⚠️','Informe a data do RDO primeiro!');return;}
  const prev=DB.pontos.findIndex(p=>p.colabId===colabId&&p.data===data&&(!oId||p.obraId===oId));
  if(prev!==-1)DB.pontos.splice(prev,1);
  if(tipo==='P'){ const novoIdPt=uuidv4();
    const newPt={id:novoIdPt,colabId,obraId:oId,data,presente:true,tipo:'Presenca',_supa:true};
    DB.pontos.push(newPt);
    supaInsert('pontos',{id:novoIdPt,colaborador_id:colabId,obra_id:oId||null,data,presente:true,tipo:'Presenca'}); }
  else if(tipo==='M'){ const novoIdPt2=uuidv4();
    const newPt2={id:novoIdPt2,colabId,obraId:oId,data,presente:true,tipo:'meia_diaria',_supa:true};
    DB.pontos.push(newPt2);
    supaInsert('pontos',{id:novoIdPt2,colaborador_id:colabId,obra_id:oId||null,data,presente:true,tipo:'meia_diaria'}); }
  save();rdoRenderPresenca();
  const n=DB.pontos.filter(p=>p.presente&&p.data===data&&(!oId||p.obraId===oId)).length;
  // rdo-real removido
}
function rdoMarcarTodos(estado){
  const oId=document.getElementById('rdo-obra')?.value||null;
  const data=document.getElementById('rdo-data')?.value;
  if(!data){toast('⚠️','Informe a data primeiro!');return;}
  DB.colabs.forEach(col=>{
    const prev=DB.pontos.findIndex(p=>p.colabId===col.id&&p.data===data&&(!oId||p.obraId===oId));
    if(prev!==-1){
      const old=DB.pontos[prev];
      if(old&&typeof old.id==='string'&&old.id.includes('-'))supaDelete('pontos',old.id);
      DB.pontos.splice(prev,1);
    }
    if(estado){
      const newId=uuidv4();
      DB.pontos.push({id:newId,colabId:col.id,obraId:oId,data,presente:true,tipo:'Presenca',_supa:true});
      supaInsert('pontos',{id:newId,colaborador_id:col.id,obra_id:oId||null,data,presente:true,tipo:'Presenca'});
    }
  });
  save();rdoRenderPresenca();
  const presentes=estado?DB.colabs.length:0;
  const realEl=document.getElementById('rdo-real');if(realEl)realEl.value=presentes;
  toast('✅',estado?`${presentes} presenças marcadas!`:'Presenças removidas!');
}

function renderRDO(){
  document.getElementById('rdo-date-lbl').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('rdo-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('rdo-no-obra').style.display=DB.obras.length?'none':'flex';
  rdoFotos=[];renderFotoGrid();renderRDOHist();rdoRenderPresenca();rdoRenderPresencaTercs();
  // Re-renderizar presença ao mudar obra ou data
  document.getElementById('rdo-obra')?.addEventListener('change',()=>{rdoRenderPresenca();rdoRenderPresencaTercs();});
  document.getElementById('rdo-data')?.addEventListener('change',()=>{rdoRenderPresenca();rdoRenderPresencaTercs();});
}
function renderFotoGrid(){
  document.getElementById('rdo-fotos').innerHTML=rdoFotos.map((f,i)=>{
    const imgSrc=f.url||f.data||'';
    return`<div class="pc" style="flex-direction:column;height:auto;padding:0;overflow:hidden;border-radius:7px;border:1px solid var(--border)"><div style="position:relative;width:100%;height:90px;overflow:hidden"><img src="${imgSrc}" style="width:100%;height:90px;object-fit:cover;display:block"><button class="rm" onclick="rdoFotos.splice(${i},1);renderFotoGrid()" style="top:4px;right:4px">×</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.5);padding:2px 5px"><span style="font-size:9px;color:#fff">#${i+1}</span></div></div><input type="text" value="${(f.desc||'').replace(/"/g,'&quot;')}" placeholder="Descrição da foto..." oninput="rdoFotos[${i}].desc=this.value" style="width:100%;box-sizing:border-box;border:none;border-top:1px solid var(--border);padding:4px 6px;font-size:10px;color:var(--txt);background:var(--bg2);outline:none;border-radius:0 0 6px 6px"></div>`;
  }).join('')+`<div class="pc add" onclick="document.getElementById('rdo-foto-in').click()"><span>📷</span><span style="font-size:9px">Foto</span></div>`;
}
function addFotos(e){Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>{rdoFotos.push({name:f.name,data:ev.target.result});renderFotoGrid();};r.readAsDataURL(f);});e.target.value='';}
async function rdoSaveClick(status){
  const btns=document.getElementById('rdo-save-btns');
  const st=document.getElementById('rdo-save-status');
  if(btns)btns.style.display='none';
  if(st){st.style.display='block';st.textContent=status==='finalizado'?'⏳ Finalizando e gerando PDF...':'⏳ Salvando RDO...';}
  try{
    await saveRDO(status);
  }catch(e){
    console.error('Erro saveRDO:',e);
    toast('❌','Erro ao salvar: '+e.message);
  }finally{
    if(btns)btns.style.display='flex';
    if(st)st.style.display='none';
  }
}
async function saveRDO(status){
  const oId=document.getElementById('rdo-obra').value;if(!oId){toast('⚠️','Selecione uma obra!');return;}
  const data=document.getElementById('rdo-data').value;if(!data){toast('⚠️','Informe a data!');return;}
  const prev=0;
  const real=0;
  const serv=document.getElementById('rdo-servicos').value.trim();
  const obs=document.getElementById('rdo-obs').value.trim();
  const mat=document.getElementById('rdo-mat').value.trim();
  const editingId=window._rdoEditId||null;
  const existingById=editingId?DB.rdos.find(x=>x.id===editingId):null;
  const rdoId=existingById?existingById.id:uuidv4();
  const isEdit=!!existingById;

  // Upload fotos para Supabase Storage e converter base64 → URL
  const fotosFinais=[];
  for(const f of rdoFotos){
    if(f.data&&f.data.startsWith('data:')){
      // Base64 — fazer upload
      if(supa&&_empresaId){
        try{
          const ext=f.name?.split('.').pop()||'jpg';
          const path=`${_empresaId}/rdos/${rdoId}/${Date.now()}_${Math.random().toString(36).substr(2,6)}.${ext}`;
          const base64=f.data.split(',')[1];
          const byteStr=atob(base64);
          const ab=new ArrayBuffer(byteStr.length);
          const ia=new Uint8Array(ab);
          for(let i=0;i<byteStr.length;i++)ia[i]=byteStr.charCodeAt(i);
          const blob=new Blob([ab],{type:f.data.split(';')[0].split(':')[1]||'image/jpeg'});
          const {error:upErr}=await supa.storage.from('drive-obras').upload(path,blob,{upsert:true});
          if(!upErr){
            const {data:urlData}=supa.storage.from('drive-obras').getPublicUrl(path);
            fotosFinais.push({name:f.name,url:urlData.publicUrl,desc:f.desc||''});
          } else {
            console.error('Upload foto RDO erro:',upErr.message);
            fotosFinais.push({name:f.name,data:f.data,desc:f.desc||''});
          }
        }catch(e){
          console.error('Upload foto RDO exception:',e);
          fotosFinais.push({name:f.name,data:f.data,desc:f.desc||''});
        }
      } else {
        fotosFinais.push({name:f.name,data:f.data,desc:f.desc||''});
      }
    } else if(f.url){
      // Já é URL do Storage
      fotosFinais.push({name:f.name,url:f.url,desc:f.desc||''});
    } else {
      fotosFinais.push(f);
    }
  }

  const rdo={id:rdoId,obraId:oId,data,clima:rdoClima,prev,real,serv,obs,mat,status,fotos:fotosFinais,_supa:true};
  // Fotos para salvar no Supabase (sem base64, só URLs)
  const fotosParaSupa=fotosFinais.map(f=>({name:f.name,url:f.url||'',desc:f.desc||''}));
  const dadosSupa={obra_id:rdo.obraId,data:rdo.data,clima:rdo.clima,previsto:rdo.prev,realizado:rdo.real,servicos:rdo.serv,obs:rdo.obs,materiais:rdo.mat,status:rdo.status};

  // Salvar local primeiro (garante dados mesmo offline)
  if(isEdit){
    Object.assign(existingById,rdo);
  } else {
    DB.rdos.push(rdo);
  }
  save();renderRDOHist();

  // Salvar no Supabase com await (critico para mobile)
  try{
    // Incluir autor do RDO
    const autor=localStorage.getItem('_ot_nome')||'';
    const dadosComFotos={...dadosSupa,fotos:fotosParaSupa};
    if(autor) dadosComFotos.autor=autor;
    if(isEdit){
      await supaUpdate('rdos',rdo.id,dadosComFotos);
    } else {
      const {error}=await supa.from('rdos').insert({id:rdo.id,...dadosComFotos,empresa_id:_empresaId}).select('id').single();
      if(error){
        console.warn('Insert com fotos falhou, tentando sem:',error.message);
        const dadosSem={...dadosSupa};
        if(autor) dadosSem.autor=autor;
        await supaInsert('rdos',{id:rdo.id,...dadosSem});
      }
    }
    console.log('✓ RDO salvo no Supabase:',rdo.id);
    toast('☁️','RDO sincronizado!');
  }catch(e){
    console.error('Erro sync RDO:',e);
    toast('⚠️','RDO salvo localmente. Sync pendente.');
  }

  window._rdoEditId=null;
  const sb=document.getElementById('rdo-edit-status');if(sb)sb.style.display='none';
  if(status==='finalizado'){
    await gerarRDOPDF(rdo);
    ['rdo-servicos','rdo-obs','rdo-mat'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('rdo-data').value=new Date().toISOString().split('T')[0];
    rdoClima='Ensolarado';
    document.querySelectorAll('.clima-btn').forEach(b=>{b.style.background='transparent';b.style.borderColor='';b.style.color='';});
    rdoFotos=[];renderFotoGrid();rdoRenderPresenca();
    toast('✅','RDO finalizado e PDF gerado!');
  } else toast('💾','RDO salvo!');
}
function renderRDOHist(){
  const oId=document.getElementById('rdo-obra')?.value||getObra()?.id;
  const filtro=window._rdoHistFiltro||'obra';
  const rdos=(filtro==='todos'?DB.rdos:DB.rdos.filter(r=>!oId||String(r.obraId)===String(oId))).sort((a,b)=>b.data.localeCompare(a.data));
  const el=document.getElementById('rdo-hist');
  if(!rdos.length){el.innerHTML='<div class="t-empty">Nenhum RDO registrado.</div>';return;}
  const btnSt=(v)=>filtro===v?'background:var(--primary);color:#fff':'';
  el.innerHTML=`<div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px"><div style="display:flex;gap:4px"><button class="btn sm" style="${btnSt('obra')}" onclick="window._rdoHistFiltro='obra';renderRDOHist()">Esta obra</button><button class="btn sm" style="${btnSt('todos')}" onclick="window._rdoHistFiltro='todos';renderRDOHist()">Todas as obras</button></div><span style="font-size:11px;color:var(--txt3)">${rdos.length} relatório(s)</span>`
    +`<button class="btn sm" onclick="exportRDOsLote()" title="Exportar todos em lote">📄 Exportar Lote</button></div>`
    +`<div style="display:flex;flex-direction:column;gap:6px">`
    +rdos.map(r=>{
      const obra=DB.obras.find(o=>String(o.id)===String(r.obraId));
      return `<div onclick="visualizarRDO('${r.id}')" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;flex-wrap:wrap;cursor:pointer;transition:.15s" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
        <span style="font-weight:600;font-size:12px;min-width:75px">${fmtDt(r.data)}</span>
        <span style="font-size:13px">${climaIco(r.clima)}</span>
        <span style="font-size:11px;color:var(--txt2);flex:1;min-width:60px">${obra?.nome||''}</span>
        ${r.autor?`<span style="font-size:10px;color:var(--txt3)">por ${r.autor}</span>`:''}
        <span class="b ${r.status==='finalizado'?'bg':'by'}" style="font-size:10px">${r.status==='finalizado'?'✓ Final.':'📝 Rasc.'}</span>
        <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
          <button class="btn sm ico" onclick="carregarRDO('${r.id}')" title="Editar">✏️</button>
          <button class="btn sm" onclick="gerarRDOPDF(DB.rdos.find(x=>x.id==='${r.id}'))" title="Baixar PDF" style="font-size:11px">⬇ PDF</button>
          <button class="btn sm ico" onclick="delRDO('${r.id}')" title="Excluir">🗑️</button>
        </div>
      </div>`;
    }).join('')+'</div>';
}
function climaIco(c){return{Ensolarado:'☀️',Nublado:'🌤️',Chuva:'🌧️',Temporal:'⛈️'}[c]||'☀️';}
function delRDO(id){if(!confirm('Excluir RDO?'))return;const rdo=DB.rdos.find(r=>String(r.id)===String(id));if(rdo&&typeof rdo.id==='string'&&rdo.id.includes('-'))supaDelete('rdos',rdo.id);DB.rdos=DB.rdos.filter(r=>String(r.id)!==String(id));save();renderRDOHist();toast('🗑️','RDO excluído.');}

async function visualizarRDO(id){
  const rdo=DB.rdos.find(x=>x.id===id);
  if(!rdo){toast('⚠️','RDO não encontrado!');return;}
  const obra=DB.obras.find(o=>String(o.id)===String(rdo.obraId));
  const nomeArq='RDO_'+(obra?.nome||'obra').replace(/\s/g,'_')+'_'+rdo.data+'.pdf';

  // HTML preview instantâneo (sem gerar PDF)
  let ov=document.getElementById('rdo-preview-overlay');
  if(!ov){
    ov=document.createElement('div');
    ov.id='rdo-preview-overlay';
    document.body.appendChild(ov);
  }
  ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;padding:12px;overflow-y:auto';

  const climaIcoMap={Ensolarado:'☀️',Nublado:'🌤️',Chuva:'🌧️',Temporal:'⛈️'};
  const climaIc=climaIcoMap[rdo.clima]||'☀️';

  // Presença de colaboradores
  const presencas=(DB.pontos||[]).filter(p=>String(p.rdoId)===String(rdo.id)||(String(p.obraId)===String(rdo.obraId)&&p.data===rdo.data));
  const colabsPresentes=presencas.map(p=>{
    const c=(DB.colabs||[]).find(c=>String(c.id)===String(p.colabId));
    return c?{nome:c.nome,cargo:c.cargo,tipo:p.meia?'1/2':'Dia'}:null;
  }).filter(Boolean);

  // Fotos (URL ou base64)
  const fotos=(rdo.fotos||[]).filter(f=>f.url||f.data);

  ov.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;width:100%;max-width:900px;justify-content:space-between;flex-shrink:0;position:sticky;top:0;background:rgba(0,0,0,.7);padding:8px 4px;backdrop-filter:blur(8px);z-index:10">
      <span style="font-weight:700;font-size:14px;color:#fff">${fmtDt(rdo.data)} — ${obra?.nome||'Obra'}${rdo.autor?' (por '+rdo.autor+')':''}</span>
      <div style="display:flex;gap:6px">
        <button class="btn pri sm" onclick="_baixarRDOPDF('${id}')" style="font-size:12px">⬇ Baixar PDF</button>
        <button class="btn sm" onclick="carregarRDO('${id}');document.getElementById('rdo-preview-overlay').style.display='none'" style="font-size:12px">✏️ Editar</button>
        <button class="btn sm" onclick="this.closest('#rdo-preview-overlay').style.display='none'" style="font-size:12px;background:rgba(255,255,255,.15);color:#fff">✕ Fechar</button>
      </div>
    </div>
    <div style="width:100%;max-width:900px;background:#fff;border-radius:8px;padding:24px;color:#1a2040;font-family:'Inter',sans-serif">
      <h2 style="margin:0 0 4px 0;font-size:20px;color:#1a2040">Relatório Diário de Obra</h2>
      <div style="font-size:12px;color:#666;margin-bottom:16px">${obra?.nome||'—'} • ${fmtDt(rdo.data)} • ${climaIc} ${rdo.clima||'—'}</div>

      ${rdo.prev?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:4px">Previsto</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${rdo.prev}</div></div>`:''}

      ${rdo.real?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:4px">Realizado</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${rdo.real}</div></div>`:''}

      ${rdo.serv?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:4px">Serviços</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${rdo.serv}</div></div>`:''}

      ${rdo.mat?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:4px">Materiais</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${rdo.mat}</div></div>`:''}

      ${rdo.obs?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:4px">Observações</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${rdo.obs}</div></div>`:''}

      ${colabsPresentes.length?`<div style="margin-bottom:14px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:6px">Equipe Presente (${colabsPresentes.length})</div><div style="display:flex;flex-wrap:wrap;gap:6px">${colabsPresentes.map(c=>`<span style="font-size:11px;padding:3px 8px;background:#eef2ff;border:1px solid #ccd5f0;border-radius:4px">${c.nome}${c.cargo?' • '+c.cargo:''}${c.tipo==='1/2'?' (1/2)':''}</span>`).join('')}</div></div>`:''}

      ${fotos.length?`<div style="margin-top:18px"><div style="font-weight:700;font-size:12px;color:#3060d0;text-transform:uppercase;margin-bottom:8px">Registro Fotográfico (${fotos.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
        ${fotos.map((f,i)=>`<div style="border:1px solid #ddd;border-radius:6px;overflow:hidden;cursor:pointer" onclick="_rdoFotoLightbox(${i},'${id}')">
          <img src="${f.url||f.data}" style="width:100%;height:140px;object-fit:cover;display:block" loading="lazy">
          ${f.desc?`<div style="padding:5px 7px;font-size:10px;color:#666;background:#f7f8fc">${f.desc}</div>`:''}
        </div>`).join('')}
        </div></div>`:''}
    </div>`;
}

function _baixarRDOPDF(id){
  const rdo=DB.rdos.find(x=>x.id===id);
  if(!rdo)return;
  gerarRDOPDF(rdo);
}

function _rdoFotoLightbox(idx,rdoId){
  const rdo=DB.rdos.find(x=>x.id===rdoId);
  if(!rdo||!rdo.fotos)return;
  const fotos=rdo.fotos.filter(f=>f.url||f.data);
  let cur=idx;
  let lb=document.getElementById('rdo-foto-lightbox');
  if(!lb){lb=document.createElement('div');lb.id='rdo-foto-lightbox';document.body.appendChild(lb);}
  const render=()=>{
    const f=fotos[cur];
    lb.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px';
    lb.innerHTML=`
      <div style="position:absolute;top:16px;right:16px;display:flex;gap:8px">
        <span style="color:#fff;font-size:13px;padding:6px 12px;background:rgba(255,255,255,.1);border-radius:6px">${cur+1} / ${fotos.length}</span>
        <button onclick="document.getElementById('rdo-foto-lightbox').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:6px;cursor:pointer;font-size:16px">✕</button>
      </div>
      ${cur>0?`<button onclick="event.stopPropagation();window._rdoLbPrev()" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:20px">‹</button>`:''}
      ${cur<fotos.length-1?`<button onclick="event.stopPropagation();window._rdoLbNext()" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:20px">›</button>`:''}
      <img src="${f.url||f.data}" style="max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px">
      ${f.desc?`<div style="margin-top:12px;color:#fff;font-size:13px;background:rgba(0,0,0,.5);padding:8px 14px;border-radius:6px;max-width:80vw;text-align:center">${f.desc}</div>`:''}`;
  };
  window._rdoLbPrev=()=>{if(cur>0){cur--;render();}};
  window._rdoLbNext=()=>{if(cur<fotos.length-1){cur++;render();}};
  render();
}
function carregarRDO(id){
  const rdo=DB.rdos.find(x=>x.id===id);if(!rdo)return;
  // Navegar para aba RDO e carregar dados
  goPage('rdo');
  setTimeout(()=>{
    // Selecionar obra
    const rdoObraEl=document.getElementById('rdo-obra');
    if(rdoObraEl&&rdo.obraId){rdoObraEl.value=rdo.obraId;}
    // Preencher campos
    const setVal=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
    setVal('rdo-data',rdo.data);
    // Não há prev/real para terceirizados - presença é by day
    setVal('rdo-servicos',rdo.serv||'');
    setVal('rdo-obs',rdo.obs||'');
    setVal('rdo-mat',rdo.mat||'');
    // Clima
    rdoClima=rdo.clima||'Ensolarado';
    document.querySelectorAll('.clima-btn').forEach(b=>{
      b.style.background=b.dataset.clima===rdoClima?'var(--primary)':'transparent';
    });
    // Fotos
    rdoFotos=rdo.fotos?rdo.fotos.map(f=>({...f})):[];
    renderFotoGrid();
    rdoRenderPresenca();
  rdoRenderPresencaTercs();
    // Indicar que está em modo edição
    const statusBar=document.getElementById('rdo-edit-status');
    if(statusBar){
      statusBar.innerHTML=`<div class="al ${rdo.status==='finalizado'?'w':'i'}" style="margin-bottom:9px">
        <span>${rdo.status==='finalizado'?'⚠️':'ℹ️'}</span>
        <span>Editando RDO do dia <strong>${fmtDt(rdo.data)}</strong> — Status: <strong>${rdo.status==='finalizado'?'Finalizado':'Rascunho'}</strong>. Salve para atualizar.</span>
      </div>`;
      statusBar.style.display='block';
    }
    // Guardar ID para sobrescrever no save
    window._rdoEditId=id;
    toast('✏️',`RDO de ${fmtDt(rdo.data)} carregado para edição.`);
  },120);
}

