// ═══════════════════════════════════════════
// MODALS — CRUD
// ═══════════════════════════════════════════
function openModal(type,editId=null,editId2=null){
  const root=document.getElementById('modal-root');
  let title='',body='',onSave=null;

  // Portal clientes modals
  if(type==='permissoes-cliente'){
    const cliente=_clientes?.find(c=>c.id===editId);
    if(!cliente){toast('⚠️','Cliente não encontrado.');return;}
    if(!supa||!_empresaId) return;
    supa.from('cliente_obras').select('obra_id').eq('cliente_id',editId).eq('empresa_id',_empresaId)
      .then(({data:perms})=>{
        const liberadas=new Set((perms||[]).map(p=>p.obra_id));
        const obrasOpts=DB.obras.map(o=>`
          <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px">
            <input type="checkbox" class="perm-obra-chk" value="${o.id}" ${liberadas.has(o.id)?'checked':''} style="width:16px;height:16px">
            ${o.nome}
          </label>`).join('');
        root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()">
          <div class="mo">
            <div class="moh"><div class="mot">🏗️ Obras de ${cliente.nome}</div><div class="mox" onclick="closeModal()">✕</div></div>
            <div class="mob">
              <p style="font-size:12px;color:var(--txt3);margin-bottom:12px">Selecione quais obras este cliente pode visualizar:</p>
              <div style="background:var(--bg3);border-radius:8px;padding:10px;max-height:260px;overflow-y:auto">${obrasOpts||'<div style="color:var(--txt3);font-size:12px">Nenhuma obra cadastrada</div>'}</div>
            </div>
            <div class="mof">
              <button class="btn" onclick="closeModal()">Cancelar</button>
              <button class="btn pri" onclick="salvarPermissoesCliente('${editId}')">✅ Salvar Permissões</button>
            </div>
          </div></div>`;
      });
    return;
  }

  if(type==='obra'){
    const o=editId?DB.obras.find(x=>String(x.id)===String(editId)):null;
    title=o?'Editar Obra':'🏗️ Nova Obra';
    const autoFin=o?obraPct(o)>=100:false;
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Nome da Obra *</label><input class="inp" id="m-nome" value="${o?.nome||''}" placeholder="Ex: Residencial Aurora"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="sel" id="m-tipo"><option ${o?.tipo==='Residencial'?'selected':''}>Residencial</option><option ${o?.tipo==='Comercial'?'selected':''}>Comercial</option><option ${o?.tipo==='Industrial'?'selected':''}>Industrial</option><option ${o?.tipo==='Infraestrutura'?'selected':''}>Infraestrutura</option></select></div>
      <div class="fg">
        <label class="lbl">🚦 Status</label>
        <select class="sel" id="m-status-manual" ${autoFin?'disabled':''}>
          <option value="" ${!o?.statusManual?'selected':''}>— Automático (por prazo) —</option>
          <option value="nao_iniciada" ${o?.statusManual==='nao_iniciada'?'selected':''}>○ Não iniciada</option>
          <option value="andamento" ${o?.statusManual==='andamento'?'selected':''}>▶ Em andamento</option>
          <option value="finalizada" ${o?.statusManual==='finalizada'||autoFin?'selected':''}>✅ Finalizada</option>
        </select>
        <div style="font-size:10px;margin-top:3px;color:${autoFin?'var(--green)':'var(--txt3)'}">
          ${autoFin?'✓ Finalizada automaticamente — todas as etapas em 100%':'Deixe Automático para calcular pelo prazo'}
        </div>
      </div>
      <div class="fg"><label class="lbl">Orçamento Total (R$)</label><input type="number" class="inp" id="m-orc" value="${o?.orc||''}" placeholder="0.00"></div>
      <div class="fg"><label class="lbl">📐 Área Total (m²)</label><input type="number" class="inp" id="m-m2" value="${o?.m2||''}" placeholder="Ex: 280" min="0" step="0.01"><div style="font-size:10px;color:var(--txt3);margin-top:2px">Para calcular custo por m²</div></div>
      <div class="fg"><label class="lbl">Início</label><input type="date" class="inp" id="m-ini" value="${o?.dataIni||''}"></div>
      <div class="fg"><label class="lbl">Entrega Prevista</label><input type="date" class="inp" id="m-fim" value="${o?.dataFim||''}"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Endereço / Local</label><input class="inp" id="m-local" value="${o?.local||''}" placeholder="Rua, bairro, cidade"></div>
      <div class="fg"><label class="lbl">Responsável Técnico</label><input class="inp" id="m-resp" value="${o?.resp||''}" placeholder="Nome do engenheiro"></div>
      <div class="fg"><label class="lbl">Cliente</label><input class="inp" id="m-cli" value="${o?.cli||''}" placeholder="Nome do cliente"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label><textarea class="ta" id="m-obs" style="min-height:50px">${o?.obs||''}</textarea></div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('m-nome').value.trim();if(!nome){toast('⚠️','Nome obrigatório!');return false;}
      const sm=document.getElementById('m-status-manual')?.value||null;
      const dados={nome,tipo:document.getElementById('m-tipo').value,statusManual:sm||null,orc:parseFloat(document.getElementById('m-orc').value)||0,m2:parseFloat(document.getElementById('m-m2').value)||0,dataIni:document.getElementById('m-ini').value,dataFim:document.getElementById('m-fim').value,local:document.getElementById('m-local').value.trim(),resp:document.getElementById('m-resp').value.trim(),cli:document.getElementById('m-cli').value.trim(),obs:document.getElementById('m-obs').value.trim()};
      if(o){
        Object.assign(o,dados);
        supaUpdate('obras',o.id,{nome:dados.nome,tipo:dados.tipo,status_manual:dados.statusManual||null,orcamento:dados.orc,area_m2:dados.m2,data_ini:dados.dataIni||null,data_fim:dados.dataFim||null,local:dados.local,responsavel:dados.resp,cliente:dados.cli,obs:dados.obs});
      } else {
        const novoId=uuidv4();
        const newObra={id:novoId,...dados,_supa:true};
        DB.obras.push(newObra);
        if(!DB.sel) DB.sel=novoId;
        supaInsert('obras',{id:novoId,nome:dados.nome,tipo:dados.tipo,status_manual:dados.statusManual||null,orcamento:dados.orc,area_m2:dados.m2,data_ini:dados.dataIni||null,data_fim:dados.dataFim||null,local:dados.local,responsavel:dados.resp,cliente:dados.cli,obs:dados.obs});
      }
      save();renderObras();updateSbObra();renderDash();toast('✅',o?'Obra atualizada!':'Obra cadastrada!');return true;
    };
  }
  else if(type==='etapa'){
    const e=editId?DB.etapas.find(x=>String(x.id)===String(editId)):null;
    const cronSel=document.getElementById('cron-obra-sel');
    const obra=cronSel&&cronSel.value?DB.obras.find(o=>String(o.id)===String(cronSel.value)):getObra();
    title=e?'Editar Etapa':'📅 Nova Etapa';
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Nome da Etapa *</label><input class="inp" id="e-nome" value="${e?.nome||''}" placeholder="Ex: Fundações, Alvenaria..."></div>
      <div class="fg"><label class="lbl">Obra</label><select class="sel" id="e-obra">${DB.obras.map(o=>`<option value="${o.id}" ${String(e?.obraId||obra?.id||'')==String(o.id)?'selected':''}>${o.nome}</option>`).join('')}</select></div>
      <div class="fg"><label class="lbl">Status</label><select class="sel" id="e-status"><option value="plan" ${e?.status==='plan'?'selected':''}>Planejado</option><option value="prog" ${e?.status==='prog'?'selected':''}>Em andamento</option><option value="done" ${e?.status==='done'?'selected':''}>Concluído</option><option value="late" ${e?.status==='late'?'selected':''}>Atrasado</option></select></div>
      <div class="fg"><label class="lbl">Início</label><input type="date" class="inp" id="e-ini" value="${e?.inicio||''}"></div>
      <div class="fg"><label class="lbl">Fim Previsto</label><input type="date" class="inp" id="e-fim" value="${e?.fim||''}"></div>
      <div class="fg"><label class="lbl">% Concluído (0-100)</label><input type="number" class="inp" id="e-pct" min="0" max="100" value="${e?.pct||0}"></div>
      <div class="fg"><label class="lbl">Orçamento da Etapa (R$)</label><input type="number" class="inp" id="e-orc" value="${e?.orc||''}" min="0" step="0.01" placeholder="Valor previsto para esta etapa"></div>
      <div class="fg"><label class="lbl">Responsável</label><input class="inp" id="e-resp" value="${e?.resp||''}" placeholder="Nome do responsável"></div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('e-nome').value.trim();if(!nome){toast('⚠️','Nome obrigatório!');return false;}
      const pct=Math.min(100,Math.max(0,parseInt(document.getElementById('e-pct').value)||0));
      const status=document.getElementById('e-status').value;
      const obraId=document.getElementById('e-obra').value;
      const totalEts=DB.etapas.filter(et=>String(et.obraId)===String(obraId));
      const idx=totalEts.findIndex(et=>et.id===editId);
      const n=totalEts.length+(editId?0:1);const sp=editId?totalEts[idx].sp:Math.round(totalEts.length/n*100)||0;const wp=Math.round(100/Math.max(n,1));
      const dados={nome,obraId,status,inicio:document.getElementById('e-ini').value,fim:document.getElementById('e-fim').value,pct,orc:parseFloat(document.getElementById('e-orc')?.value)||0,resp:document.getElementById('e-resp').value.trim(),sp,wp};
      if(e){
        Object.assign(e,dados);
        supaUpdate('etapas',e.id,{obra_id:dados.obraId||null,nome:dados.nome,status:dados.status,pct:dados.pct,pct_esperado:dados.pctEsp??null,orcamento:dados.orc||0,responsavel:dados.resp,inicio:dados.inicio||null,fim:dados.fim||null,sp:dados.sp,wp:dados.wp});
      } else {
        const newE={id:uuidv4(),...dados,_supa:true};
        DB.etapas.push(newE);
        // Inserir no Supabase — obra_id já é UUID válido
        const obraIdSupa = typeof dados.obraId==='string'&&dados.obraId.includes('-')?dados.obraId:null;
        supaInsert('etapas',{id:newE.id,nome:dados.nome,obra_id:obraIdSupa,status:dados.status,pct:dados.pct,orcamento:dados.orc||0,responsavel:dados.resp,inicio:dados.inicio||null,fim:dados.fim||null,sp:dados.sp,wp:dados.wp});
        const allEts=DB.etapas.filter(et=>String(et.obraId)===String(obraId));
        allEts.forEach((et,i)=>{et.sp=Math.round(i/allEts.length*100);et.wp=Math.round(100/allEts.length);});
        // Removido: supaSync redundante que causava duplicação via segundo INSERT
      }
      save();renderCron();toast('✅',e?'Etapa atualizada!':'Etapa adicionada!');return true;
    };
  }
  else if(type==='colab'){
    const c=editId?DB.colabs.find(x=>x.id===editId):null;
    title=c?'Editar Colaborador':'👷 Novo Colaborador';
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Nome Completo *</label><input class="inp" id="c-nome" value="${c?.nome||''}" placeholder="Nome completo"></div>
      <div class="fg"><label class="lbl">Função / Cargo</label><input class="inp" id="c-func" value="${c?.funcao||''}" placeholder="Ex: Pedreiro, Eletricista..."></div>
      <div class="fg"><label class="lbl">CPF</label><input class="inp" id="c-cpf" value="${c?.cpf||''}" placeholder="000.000.000-00"></div>
      <div class="fg"><label class="lbl">Data de Admissão</label><input type="date" class="inp" id="c-adm" value="${c?.admissao||''}"></div>
      <div class="fg">
        <label class="lbl">💰 Valor da Diária (R$) *</label>
        <input type="number" class="inp" id="c-diaria" value="${c?.diaria||c?.salario||''}" placeholder="Ex: 150.00" min="0" step="0.01">
        <div style="font-size:10px;color:var(--txt3);margin-top:3px">Valor pago por dia trabalhado</div>
      </div>
      <div class="fg"><label class="lbl">Telefone</label><input class="inp" id="c-tel" value="${c?.tel||''}" placeholder="(00) 00000-0000"></div>
      <div class="fg"><label class="lbl">PIS / PASEP</label><input class="inp" id="c-pis" value="${c?.pis||''}" placeholder="000.0000.000-0"></div>
      <div class="fg"><label class="lbl">Observação</label><input class="inp" id="c-obs" value="${c?.obs||''}" placeholder="Ex: diarista, contratado..."></div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('c-nome').value.trim();if(!nome){toast('⚠️','Nome obrigatório!');return false;}
      const diaria=parseFloat(document.getElementById('c-diaria').value)||0;
      if(!diaria){toast('⚠️','Informe o valor da diária!');return false;}
      const dados={nome,funcao:document.getElementById('c-func').value.trim(),cpf:document.getElementById('c-cpf').value.trim(),admissao:document.getElementById('c-adm').value,diaria,salario:diaria,pis:document.getElementById('c-pis').value.trim(),tel:document.getElementById('c-tel').value.trim(),obs:document.getElementById('c-obs').value.trim()};
      if(c){
        Object.assign(c,dados);
        supaUpdate('colaboradores',c.id,{nome:dados.nome,funcao:dados.funcao,cpf:dados.cpf,admissao:dados.admissao||null,diaria:dados.diaria,salario:dados.salario,pis:dados.pis,telefone:dados.tel,obs:dados.obs});
      } else {
        const novoId=uuidv4();
        const nc={id:novoId,...dados,_supa:true};
        DB.colabs.push(nc);
        supaInsert('colaboradores',{id:novoId,nome:dados.nome,funcao:dados.funcao,cpf:dados.cpf,admissao:dados.admissao||null,diaria:dados.diaria,salario:dados.salario,pis:dados.pis,telefone:dados.tel,obs:dados.obs});
      }
      save();renderColabs();fillSelects();toast('✅',c?'Colaborador atualizado!':'Colaborador cadastrado!');return true;
    };
  }
  else if(type==='lanc'){
    const l=editId?DB.lancs.find(x=>String(x.id)===String(editId)):null;const obra=getObra();
    title=l?'Editar Lançamento':'💰 Novo Lançamento';
    // Opções dinâmicas dos cadastros
    const catOpts=(DB.categorias||[]).map(x=>`<option${l?.cat===x?' selected':''}>${x}</option>`).join('');
    const ccOpts='<option value="">— Selecionar —</option>'+(DB.centros||[]).map(x=>`<option${l?.cc===x?' selected':''}>${x}</option>`).join('');
    const fornOpts='<option value="">— Selecionar —</option>'+(DB.fornecedores||[]).map(x=>{const nome=typeof x==='object'?x.nome:x;return`<option${l?.forn===nome?' selected':''}>${nome}</option>`;}).join('');
    body=`<div class="g g2">
      <div class="fg"><label class="lbl">Tipo *</label>
        <select class="sel" id="l-tipo">
          <option${!l||l.tipo==='Despesa'?' selected':''}>Despesa</option>
          <option${l?.tipo==='Receita'?' selected':''}>Receita</option>
        </select>
      </div>
      <div class="fg"><label class="lbl">Categoria
        <button type="button" onclick="cadastroAddInline('categoria','l-cat')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer" title="Nova categoria">＋ nova</button>
      </label>
        <select class="sel" id="l-cat">${catOpts}</select>
      </div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Descrição *</label>
        <input class="inp" id="l-desc" value="${l?.desc||''}" placeholder="Ex: NF Cimento Supremo #00123">
      </div>
      <div class="fg"><label class="lbl">Valor (R$) *</label>
        <input type="number" class="inp" id="l-valor" value="${l?.valor||''}" placeholder="0.00" min="0" step="0.01">
      </div>
      <div class="fg"><label class="lbl">Data</label>
        <input type="date" class="inp" id="l-data" value="${l?.data||new Date().toISOString().split('T')[0]}">
      </div>
      <div class="fg"><label class="lbl">Obra</label>
        <select class="sel" id="l-obra" onchange="_refreshLancEtapas(this.value)">${DB.obras.map(o=>`<option value="${o.id}"${(l?.obraId||obra?.id)==o.id?' selected':''}>${o.nome}</option>`).join('')}</select>
      </div>
      <div class="fg"><label class="lbl">Etapa</label>
        <select class="sel" id="l-etapa"><option value="">— Selecionar —</option>${DB.etapas.filter(e=>!obra||e.obraId==obra.id).map(e=>`<option value="${e.nome}"${l?.etapa===e.nome?' selected':''}>${e.nome}</option>`).join('')}</select>
      </div>
      <div class="fg"><label class="lbl">Fornecedor
        <button type="button" onclick="closeModal();goPage('fornecedores')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer" title="Cadastrar fornecedor">＋ cadastrar</button>
      </label>
        <select class="sel" id="l-forn-sel" onchange="document.getElementById('l-forn-txt').value=this.value==='— Selecionar —'?'':this.value">${fornOpts}</select>
        <input class="inp" id="l-forn-txt" value="${l?.forn||''}" placeholder="Ou digitar manualmente..." style="margin-top:5px;font-size:12px">
      </div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Nota Fiscal / Referência</label>
        <input class="inp" id="l-nf" value="${l?.nf||''}" placeholder="NF 00123">
      </div>
    </div>`;
    onSave=()=>{
      const desc=document.getElementById('l-desc').value.trim();
      const valor=parseFloat(document.getElementById('l-valor').value);
      if(!desc||!valor){toast('⚠️','Descrição e valor obrigatórios!');return false;}
      const fornTxt=document.getElementById('l-forn-txt').value.trim();
      const fornSel=document.getElementById('l-forn-sel').value;
      const dados={
        desc,tipo:document.getElementById('l-tipo').value,
        cat:document.getElementById('l-cat').value,
        etapa:document.getElementById('l-etapa')?.value||'',
        valor,data:document.getElementById('l-data').value,
        obraId:document.getElementById('l-obra').value||null,
        forn:fornTxt||fornSel||'',
        nf:document.getElementById('l-nf').value.trim()
      };
      if(l){
        Object.assign(l,dados);
        supaUpdate('lancamentos',l.id,{tipo:dados.tipo,descricao:dados.desc,categoria:dados.cat,centro_custo:dados.etapa||'',valor:dados.valor,data:dados.data,fornecedor:dados.forn,nota_fiscal:dados.nf,obra_id:dados.obraId||null});
      } else {
        const novoId=uuidv4();
        const nl={id:novoId,...dados,_supa:true};
        DB.lancs.push(nl);
        supaInsert('lancamentos',{id:novoId,tipo:dados.tipo,descricao:dados.desc,categoria:dados.cat,centro_custo:dados.etapa||'',valor:dados.valor,data:dados.data,fornecedor:dados.forn,nota_fiscal:dados.nf,obra_id:dados.obraId||null});
      }
      save();renderFin();toast('✅',l?'Lançamento atualizado!':'Lançamento registrado!');return true;
    };
  }
  else if(type==='material'){
    const m=editId?DB.estoque.find(x=>String(x.id)===String(editId)):null;const obra=getObra();
    title=m?'Editar Material':'📦 Novo Material';
    // Unidades disponíveis — padrão + custom
    if(!DB.unidades)DB.unidades=['sc','m³','un','kg','lt','m²','ml','cx','pc','vb','gl','t','rl'];
    const unOpts=DB.unidades.map(u=>`<option value="${u}"${m?.un===u?' selected':''}>${u}</option>`).join('');
    const fornOpts2=(DB.fornecedores||[]).map(x=>{const nome=typeof x==='object'?x.nome:x;return`<option value="${nome}"${m?.forn===nome?' selected':''}>${nome}</option>`;}).join('');
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Material *</label><input class="inp" id="mat-nome" value="${m?.material||''}" placeholder="Ex: Cimento CP-II 50kg"></div>
      <div class="fg"><label class="lbl">Unidade de Medida *
        <button type="button" onclick="(()=>{const v=prompt('Nova unidade (ex: m³, cx, vb):');if(!v?.trim())return;if(DB.unidades.includes(v.trim())){toast('⚠️','Já existe!');return;}DB.unidades.push(v.trim());save();const sel=document.getElementById('mat-un');const o=document.createElement('option');o.value=v.trim();o.textContent=v.trim();o.selected=true;sel.appendChild(o);toast('✅','Unidade adicionada!');})()" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ nova</button>
      </label>
        <select class="sel" id="mat-un">${unOpts}</select>
      </div>
      <div class="fg"><label class="lbl">Estoque Mínimo</label><input type="number" class="inp" id="mat-min" value="${m?.min||0}" min="0"></div>
      <div class="fg"><label class="lbl">Preço Unitário (R$)</label><input type="number" class="inp" id="mat-preco" value="${m?.preco||0}" min="0" step="0.01"></div>
      <div class="fg"><label class="lbl">Fornecedor
        <button type="button" onclick="closeModal();goPage('fornecedores')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ cadastrar</button>
      </label>
        <select class="sel" id="mat-forn-sel" onchange="document.getElementById('mat-forn-txt').value=this.value">
          <option value="">— Selecionar —</option>${fornOpts2}
        </select>
        <input class="inp" id="mat-forn-txt" value="${m?.forn||''}" placeholder="Ou digitar..." style="margin-top:4px;font-size:12px">
      </div>
      <div class="fg"><label class="lbl"><small style="color:var(--txt3)">📦 Catálogo global — a obra é definida ao movimentar o estoque</small></label></div>
    </div>`;
    onSave=()=>{
      const material=document.getElementById('mat-nome').value.trim();if(!material){toast('⚠️','Nome obrigatório!');return false;}
      const fornTxt=document.getElementById('mat-forn-txt').value.trim()||document.getElementById('mat-forn-sel').value||'';
      const dados={material,un:document.getElementById('mat-un').value,qtd:0,min:parseFloat(document.getElementById('mat-min').value)||0,preco:parseFloat(document.getElementById('mat-preco').value)||0,obraId:null,forn:fornTxt};
      if(m){
        Object.assign(m,dados);
        supaUpdate('estoque',m.id,{material:dados.material,unidade:dados.un,estoque_min:dados.min,preco:dados.preco,fornecedor:dados.forn});
      } else {
        const novoId=uuidv4();
        const nm={id:novoId,...dados,_supa:true};
        DB.estoque.push(nm);
        supaInsert('estoque',{id:novoId,material:dados.material,unidade:dados.un,estoque_min:dados.min,preco:dados.preco,fornecedor:dados.forn});
      }
      save();renderEstoque();toast('✅',m?'Material atualizado!':'Material cadastrado!');return true;
    };
  }
  else if(type==='mov'){
    const est=DB.estoque.find(x=>String(x.id)===String(editId));if(!est){toast('aviso','Material nao encontrado!');return;}
    title='🔄 Movimentar Estoque';
    const obraAtual=getObra();
    // Calcular saldo desta obra especificamente
    const calcSaldoObra=(obraId)=>{
      const movsObra=DB.movs.filter(m=>m.estId===est.id&&m.obraId===obraId);
      return movsObra.reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);
    };
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2">
        <div class="lbl" style="margin-bottom:4px">Material</div>
        <div style="font-size:14px;font-weight:600;color:var(--txt)">${est.material}</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:2px">Qtd cadastrada: <strong>${est.qtd} ${est.un}</strong></div>
      </div>
      <div class="fg" style="grid-column:span 2">
        <label class="lbl">Obra *</label>
        <select class="sel" id="mv-obra" onchange="
          const oId=this.value;
          const saldo=${JSON.stringify(DB.obras.map(o=>{return {id:o.id,s:calcSaldoObra(o.id)};}).reduce((acc,x)=>{acc[x.id]=x.s;return acc;},{}))};
          const s=saldo[oId]||0;
          document.getElementById('mv-saldo-info').textContent='Saldo nesta obra: '+s+' ${est.un}';
        ">
          ${DB.obras.map(o=>`<option value="${o.id}" ${obraAtual?.id===o.id?'selected':''}>${o.nome}</option>`).join('')}
        </select>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px" id="mv-saldo-info">
          Saldo nesta obra: ${calcSaldoObra(obraAtual?.id)} ${est.un}
        </div>
      </div>
      <div class="fg"><label class="lbl">Tipo *</label><select class="sel" id="mv-tipo"><option>Entrada</option><option>Saída</option></select></div>
      <div class="fg"><label class="lbl">Quantidade *</label><input type="number" class="inp" id="mv-qtd" min="0" step="0.1" placeholder="0"></div>
      <div class="fg"><label class="lbl">Data</label><input type="date" class="inp" id="mv-data" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="fg"><label class="lbl">Nota Fiscal</label><input class="inp" id="mv-nf" placeholder="NF 00123"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observação</label><input class="inp" id="mv-obs" placeholder="Obs opcional"></div>
    </div>`;
    onSave=()=>{
      const qtd=parseFloat(document.getElementById('mv-qtd').value);if(!qtd||qtd<=0){toast('⚠️','Informe a quantidade!');return false;}
      const tipoRaw=document.getElementById('mv-tipo').value;
      const tipo=tipoRaw==='Saída'?'Saida':tipoRaw;
      const obraId=document.getElementById('mv-obra').value||null;
      const saldoObra=DB.movs.filter(m=>String(m.estId)===String(est.id)&&String(m.obraId)===String(obraId)).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);
      if(tipo==='Saída'&&qtd>saldoObra){toast('⚠️',`Saldo insuficiente nessa obra! Disponível: ${saldoObra} ${est.un}`);return false;}
      const mvData=document.getElementById('mv-data').value;
      const mvNf=document.getElementById('mv-nf').value.trim();
      const mvObs=document.getElementById('mv-obs').value.trim();
      const novoMovId=uuidv4();
      const newMov={id:novoMovId,estId:est.id,obraId,tipo,qtd,data:mvData,nf:mvNf,obs:mvObs,_supa:true};
      DB.movs.push(newMov);
      // Garantir UUID do estoque antes de salvar movimentação
      (async()=>{
        let estSupaId = (typeof est.id === 'string' && est.id.includes('-')) ? est.id : null;
        if(!estSupaId && supa && _empresaId){
          const {data:estRow} = await supa.from('estoque').select('id').eq('empresa_id',_empresaId).eq('material',est.material).maybeSingle();
          if(estRow) estSupaId = estRow.id;
        }
        if(estSupaId){
          await supaInsert('movimentacoes',{id:novoMovId,estoque_id:estSupaId,obra_id:obraId||null,tipo,quantidade:qtd,data:mvData,nota_fiscal:mvNf,obs:mvObs});
        }
      })();
      save();renderEstoque();toast('✅',`${tipo} de ${qtd} ${est.un} registrada${obraId?' para '+DB.obras.find(o=>String(o.id)===String(obraId))?.nome:''}!`);return true;
    };
  }
  else if(type==='contrato'){
    const ct=editId?DB.contratos.find(x=>String(x.id)===String(editId)):null;
    title=ct?'Editar Contrato':'📑 Novo Contrato';
    const catOpts=(DB.categorias||[]).map(x=>`<option value="${x}"${ct?.cat===x?' selected':''}>${x}</option>`).join('');
    const ccOpts=(DB.centros||[]).map(x=>`<option value="${x}"${ct?.cc===x?' selected':''}>${x}</option>`).join('');
    const fornOpts=(DB.fornecedores||[]).map(x=>{const nome=typeof x==='object'?x.nome:x;return`<option value="${nome}"${ct?.forn===nome?' selected':''}>${nome}</option>`;}).join('');
    const etapasFilt=DB.etapas.filter(e=>!ct?.obraId||e.obraId==ct?.obraId);
    const etapasOpts=etapasFilt.map(e=>`<option value="${e.nome}"${ct?.etapa===e.nome?' selected':''}>${e.nome}</option>`).join('');
    body=`<div class="g g2">
      <div class="fg"><label class="lbl">Número do Contrato</label><input class="inp" id="ct-num" value="${ct?.numero||''}" placeholder="Ex: CT-2025-001"></div>
      <div class="fg"><label class="lbl">Fornecedor *
        <button type="button" onclick="closeModal();goPage('fornecedores')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ cadastrar</button>
      </label>
        <select class="sel" id="ct-forn-sel" onchange="document.getElementById('ct-forn-txt').value=this.value">
          <option value="">— Selecionar —</option>${fornOpts}
        </select>
        <input class="inp" id="ct-forn-txt" value="${ct?.forn||''}" placeholder="Ou digitar..." style="margin-top:4px;font-size:12px">
      </div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Descrição do Objeto *</label><textarea class="ta" id="ct-desc" style="height:55px" placeholder="Descreva o objeto do contrato...">${ct?.descricao||''}</textarea></div>
      <div class="fg"><label class="lbl">Data de Assinatura</label><input type="date" class="inp" id="ct-assin" value="${ct?.assinatura||''}"></div>
      <div class="fg"><label class="lbl">Prazo de Entrega</label><input type="date" class="inp" id="ct-prazo" value="${ct?.prazo||''}"></div>
      <div class="fg"><label class="lbl">Valor do Contrato (R$) *</label><input type="number" class="inp" id="ct-valor" value="${ct?.valor||''}" min="0" step="0.01" placeholder="0.00"></div>
      <div class="fg"><label class="lbl">Tipo de Despesa</label>
        <select class="sel" id="ct-tipo">
          <option value="Despesa"${!ct||ct.tipo==='Despesa'?' selected':''}>Despesa</option>
          <option value="Receita"${ct?.tipo==='Receita'?' selected':''}>Receita</option>
        </select>
      </div>
      <div class="fg"><label class="lbl">Categoria
        <button type="button" onclick="cadastroAddInline('categoria','ct-cat')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ nova</button>
      </label>
        <select class="sel" id="ct-cat"><option value="">— Selecionar —</option>${catOpts}</select>
      </div>
      <div class="fg"><label class="lbl">Centro de Custo
        <button type="button" onclick="cadastroAddInline('centro','ct-cc')" style="margin-left:6px;font-size:9px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;color:var(--txt3);cursor:pointer">＋ novo</button>
      </label>
        <select class="sel" id="ct-cc"><option value="">— Selecionar —</option>${ccOpts}</select>
      </div>
      <div class="fg"><label class="lbl">Obra Vinculada</label>
        <select class="sel" id="ct-obra" onchange="_refreshCtEtapas(this.value)">
          <option value="">Sem vínculo</option>
          ${DB.obras.map(o=>`<option value="${o.id}"${ct?.obraId==o.id?' selected':''}>${o.nome}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label class="lbl">Etapa</label>
        <select class="sel" id="ct-etapa"><option value="">— Selecionar —</option>${etapasOpts}</select>
      </div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label><input class="inp" id="ct-obs" value="${ct?.obs||''}" placeholder="Obs. adicionais"></div>
    </div>`;
    onSave=()=>{
      const descricao=document.getElementById('ct-desc').value.trim();if(!descricao){toast('⚠️','Descrição obrigatória!');return false;}
      const valor=parseFloat(document.getElementById('ct-valor').value)||0;if(!valor){toast('⚠️','Informe o valor!');return false;}
      const fornTxt=document.getElementById('ct-forn-txt').value.trim()||document.getElementById('ct-forn-sel').value;
      if(!fornTxt){toast('⚠️','Informe o fornecedor!');return false;}
      const dados={numero:document.getElementById('ct-num').value.trim(),descricao,forn:fornTxt,
        tipo:document.getElementById('ct-tipo').value||'Despesa',
        cat:document.getElementById('ct-cat').value||'',
        cc:document.getElementById('ct-cc').value||'',
        assinatura:document.getElementById('ct-assin').value,prazo:document.getElementById('ct-prazo').value,valor,
        obraId:document.getElementById('ct-obra').value||null,
        etapa:document.getElementById('ct-etapa').value||'',
        obs:document.getElementById('ct-obs').value.trim()};
      if(ct){
        Object.assign(ct,dados);
        supaUpdate('contratos',ct.id,{obra_id:dados.obraId||null,numero:dados.numero,descricao:dados.descricao,fornecedor:dados.forn,tipo:dados.tipo,categoria:dados.cat,centro_custo:dados.cc,valor:dados.valor,assinatura:dados.assinatura||null,prazo:dados.prazo||null,obs:dados.obs});
      } else {
        const novoId=uuidv4();
        const newCt={id:novoId,...dados,_supa:true};
        DB.contratos.push(newCt);
        supaInsert('contratos',{id:novoId,obra_id:dados.obraId||null,numero:dados.numero,descricao:dados.descricao,fornecedor:dados.forn,tipo:dados.tipo,categoria:dados.cat,centro_custo:dados.cc,valor:dados.valor,assinatura:dados.assinatura||null,prazo:dados.prazo||null,obs:dados.obs});
      }
      save();renderContratos();toast('✅',ct?'Contrato atualizado!':'Contrato cadastrado!');return true;
    };
  }
  else if(type==='pgto'||type==='pgto-edit'){
    const isEdit=type==='pgto-edit';
    const pgtoEx=isEdit?DB.pgtos.find(x=>x.id===editId):null;
    const contratoId=isEdit?pgtoEx?.contratoId:editId;
    const ct=DB.contratos.find(x=>x.id===contratoId);
    title=isEdit?'Editar Pagamento':'💳 Registrar Pagamento';
    const pago=_contPago(contratoId);
    const devedor=Number(ct?.valor||0)-pago;
    body=`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:6px">${ct?.numero||'—'} — ${ct?.descricao||'—'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:11px;margin-bottom:4px">
        <span>💼 ${ct?.forn||'—'}</span>
        ${ct?.cat?'<span>📂 '+ct.cat+'</span>':''}
        ${ct?.cc?'<span>🏷️ '+ct.cc+'</span>':''}
        ${ct?.obraId?'<span>🏗️ '+(DB.obras.find(o=>o.id==ct.obraId)?.nome||'—')+'</span>':''}
        ${ct?.etapa?'<span>⚙️ '+ct.etapa+'</span>':''}
      </div>
      <div style="display:flex;gap:18px;font-size:11px;margin-top:5px;padding-top:5px;border-top:1px solid var(--border)">
        <span>Contrato: <strong>${fmtR(Number(ct?.valor||0))}</strong></span>
        <span style="color:var(--green)">Pago: <strong>${fmtR(pago)}</strong></span>
        <span style="color:${devedor>0?'var(--red)':'var(--green)'}">Saldo: <strong>${fmtR(devedor)}</strong></span>
      </div>
    </div>
    <div class="g g2">
      <div class="fg"><label class="lbl">Data do Pagamento *</label>
        <input type="date" class="inp" id="pg-data" value="${pgtoEx?.data||new Date().toISOString().split('T')[0]}">
      </div>
      <div class="fg"><label class="lbl">Valor (R$) *</label>
        <input type="number" class="inp" id="pg-valor" value="${pgtoEx?.valor||''}" min="0" step="0.01" placeholder="0.00"
          oninput="document.getElementById('pg-pct-lbl').textContent=this.value&&${ct?.valor}?'≈ '+Math.round(this.value/${ct?.valor||1}*100)+'% do contrato':''">
        <div id="pg-pct-lbl" style="font-size:10px;color:var(--primary);margin-top:2px"></div>
      </div>
      <div class="fg" style="grid-column:span 2">
        <label class="lbl">Ou informe % do contrato</label>
        <div style="display:flex;gap:7px;align-items:center">
          <input type="number" class="inp" id="pg-pct" placeholder="Ex: 30" min="0" max="100" style="width:80px"
            oninput="const v=this.value;if(v&&${ct?.valor||0}){document.getElementById('pg-valor').value=(v/100*${ct?.valor||0}).toFixed(2);document.getElementById('pg-pct-lbl').textContent='≈ '+fmtR(v/100*${ct?.valor||0});}">
          <span style="font-size:11px;color:var(--txt3)">% do contrato → preenche valor</span>
        </div>
      </div>
      <div class="fg"><label class="lbl">Nota Fiscal</label>
        <input class="inp" id="pg-nf" value="${pgtoEx?.nf||''}" placeholder="NF 00001">
      </div>
      <div class="fg"><label class="lbl">Descrição do Pagamento</label>
        <input class="inp" id="pg-desc" value="${pgtoEx?.desc||''}" placeholder="Ex: Medição 01, Adiantamento...">
      </div>
    </div>
    <div style="font-size:10px;color:var(--txt3);margin-top:6px;padding:7px 10px;background:var(--bg3);border-radius:6px;border:1px solid var(--border)">
      ℹ️ Fornecedor, Tipo, Categoria, C.Custo, Obra e Etapa já definidos no cadastro do contrato e serão conciliados automaticamente no Financeiro.
    </div>`;
    onSave=()=>{
      const valor=parseFloat(document.getElementById('pg-valor').value);if(!valor||valor<=0){toast('⚠️','Informe o valor!');return false;}
      const data=document.getElementById('pg-data').value;if(!data){toast('⚠️','Informe a data!');return false;}
      const pgData={contratoId,data,valor,
        desc:document.getElementById('pg-desc').value.trim()||ct?.descricao||'',
        nf:document.getElementById('pg-nf').value.trim(),
        // Herdar dados do contrato para conciliação
        forn:ct?.forn||'',tipo:ct?.tipo||'Despesa',cat:ct?.cat||'',
        cc:ct?.cc||'',obraId:ct?.obraId||null,etapa:ct?.etapa||''};
      if(isEdit&&pgtoEx){
        DB.lancs=DB.lancs.filter(l=>l._pgtoId!==pgtoEx.id);
        Object.assign(pgtoEx,pgData);
      } else {
        pgData.id=uuidv4();
        pgData._supa=true;
        DB.pgtos.push(pgData);
        supaInsert('pagamentos',{id:pgData.id,contrato_id:pgData.contratoId,obra_id:pgData.obraId||null,data:pgData.data,valor:pgData.valor,descricao:pgData.desc,nota_fiscal:pgData.nf,fornecedor:pgData.forn,tipo:pgData.tipo,categoria:pgData.cat,centro_custo:pgData.cc});
        // Removido supaSync redundante que causava duplicação
      }
      const pgId=isEdit?pgtoEx.id:pgData.id;
      const lancNovoId=uuidv4();
      const lancData={id:lancNovoId,obraId:pgData.obraId,tipo:pgData.tipo,
        desc:(ct?.numero?'['+ct.numero+'] ':'')+pgData.desc,
        cat:pgData.cat,cc:pgData.cc,valor,data,
        forn:pgData.forn,nf:pgData.nf,etapa:pgData.etapa,_pgtoId:pgId,_supa:true};
      DB.lancs.push(lancData);
      // Persistir lançamento conciliado no Supabase
      if(!isEdit){
        supaInsert('lancamentos',{id:lancNovoId,tipo:lancData.tipo,descricao:lancData.desc,
          categoria:lancData.cat,centro_custo:lancData.cc,valor:lancData.valor,
          data:lancData.data,fornecedor:lancData.forn,nota_fiscal:lancData.nf,
          obra_id:lancData.obraId||null});
      }
      save();renderContratos();toast('✅',isEdit?'Pagamento atualizado!':'Pagamento registrado e conciliado no Financeiro!');return true;
    };
  }
  else if(type==='terceirizado'){
    const t=editId?DB.terceirizados.find(x=>x.id===editId):null;
    title=t?'Editar Terceirizado':'🏢 Novo Terceirizado';
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2">
        <label class="lbl">Nome completo *</label>
        <input class="inp" id="terc-nome" value="${t?.nome||''}" placeholder="Ex: Francisco da Silva">
      </div>
      <div class="fg" style="grid-column:span 2">
        <label class="lbl">Empresa *</label>
        <input class="inp" id="terc-empresa" value="${t?.empresa||''}" placeholder="Ex: Elétrica Silva Ltda">
      </div>
      <div class="fg">
        <label class="lbl">Função / Cargo *</label>
        <input class="inp" id="terc-funcao" value="${t?.funcao||''}" placeholder="Ex: Eletricista, Encanador...">
      </div>
      <div class="fg">
        <label class="lbl">CPF</label>
        <input class="inp" id="terc-cpf" value="${t?.cpf||''}" placeholder="000.000.000-00">
      </div>
      <div class="fg" style="grid-column:span 2">
        <label class="lbl">Telefone</label>
        <input class="inp" id="terc-celular" value="${t?.celular||''}" placeholder="(00) 00000-0000">
      </div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('terc-nome').value.trim();
      const empresa=document.getElementById('terc-empresa').value.trim();
      const funcao=document.getElementById('terc-funcao').value.trim();
      const cpf=document.getElementById('terc-cpf').value.trim();
      const celular=document.getElementById('terc-celular').value.trim();
      if(!nome){toast('⚠️','Nome obrigatório!');return false;}
      if(!empresa){toast('⚠️','Empresa obrigatória!');return false;}
      if(!funcao){toast('⚠️','Função obrigatória!');return false;}
      const dados={nome,empresa,funcao,cpf,celular};
      if(t){
        Object.assign(t,dados);
        supaUpdate('terceirizados',t.id,{nome,empresa,funcao,cpf:cpf||null,celular:celular||null});
      }else{
        const newId=uuidv4();
        const newT={id:newId,...dados,obraId:null,_supa:true};
        DB.terceirizados.push(newT);
        supaInsert('terceirizados',{id:newId,empresa_id:_empresaId,nome,empresa,funcao,cpf:cpf||null,celular:celular||null,obra_id:null});
      }
      save();renderTerceirizados();toast('✅',t?'Atualizado!':'Terceirizado cadastrado!');return true;
    };
  }
  else if(type==='checklist'){
    const chk=editId?DB.checklists.find(x=>x.id===editId):null;
    title=chk?'Editar Item de Checklist':'✅ Novo Item de Checklist';
    window._chkFotos=chk?.fotos?[...chk.fotos]:[];

    // Opções de etapa filtradas pela obra selecionada
    const obraAtual=chk?.obraId||DB.obras[0]?.id||'';
    const etapasObraAtual=DB.etapas.filter(e=>String(e.obraId)===String(obraAtual));
    const etapaNomes=[...new Set(etapasObraAtual.map(e=>e.nome))];

    const renderFotosChk=()=>{
      const grid=document.getElementById('chk-foto-grid');
      if(!grid) return;
      let html='';
      (window._chkFotos||[]).forEach((f,i)=>{
        const btn='<button onclick="chkRemoveFoto('+i+')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:10px">x</button>';
        html+='<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">'+
          '<img src="'+f.src+'" style="width:100%;height:100%;object-fit:cover">'+btn+
          '</div>';
      });
      html+='<label style="width:80px;height:80px;border-radius:8px;border:2px dashed var(--border2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:4px;flex-shrink:0">'+
        '<span style="font-size:20px">📷</span>'+
        '<span style="font-size:9px;color:var(--txt3)">Adicionar</span>'+
        '<input type="file" accept="image/*" multiple style="display:none" onchange="chkAddFotos(event)">'+
        '</label>';
      grid.innerHTML=html;
    };

    body=`<div style="display:flex;flex-direction:column;gap:14px">
      <div class="g g2">
        <div class="fg"><label class="lbl">Obra *</label>
          <select class="sel" id="chk-obra" onchange="chkFiltrarEtapas(this.value)">${DB.obras.map(o=>'<option value="'+o.id+'"'+(String(chk?.obraId||obraAtual)===String(o.id)?' selected':'')+'>'+o.nome+'</option>').join('')}</select></div>
        <div class="fg"><label class="lbl">Etapa *</label>
          <input class="inp" id="chk-etapa" value="${chk?.etapaNome||''}" list="chk-etapa-list" placeholder="Selecione ou digite a etapa">
          <datalist id="chk-etapa-list">${etapaNomes.map(n=>`<option value="${n}">${n}</option>`).join('')}</datalist></div>
        <div class="fg" style="grid-column:span 2"><label class="lbl">Item de Verificação *</label>
          <input class="inp" id="chk-item" value="${chk?.item||''}" placeholder="Ex: Verificar espaçamento das armaduras conforme projeto"></div>
        <div class="fg"><label class="lbl">Responsável</label>
          <input class="inp" id="chk-resp" value="${chk?.resp||''}" placeholder="Nome do responsável"></div>
        <div class="fg"><label class="lbl">Data</label>
          <input type="date" class="inp" id="chk-data" value="${chk?.data||''}"></div>
        <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label>
          <textarea class="ta" id="chk-obs" style="min-height:60px" placeholder="Critérios de aceitação, normas aplicáveis, condições observadas...">${chk?.obs||''}</textarea></div>
      </div>
      <!-- Fotos -->
      <div>
        <label class="lbl" style="margin-bottom:8px;display:block">📷 Fotos de Evidência</label>
        <div id="chk-foto-grid" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start"
          onchange="(()=>{const g=document.getElementById('chk-foto-grid');if(g){const fn=g._renderFn;if(fn)fn();}})()">
        </div>
      </div>
    </div>`;

    onSave=()=>{
      const obraId=document.getElementById('chk-obra').value;
      const etapaNome=document.getElementById('chk-etapa').value.trim();
      const item=document.getElementById('chk-item').value.trim();
      const resp=document.getElementById('chk-resp').value.trim();
      const data=document.getElementById('chk-data').value;
      const obs=document.getElementById('chk-obs').value.trim();
      const fotos=window._chkFotos||[];
      if(!etapaNome){toast('⚠️','Selecione a etapa!');return false;}
      if(!item){toast('⚠️','Informe o item de verificação!');return false;}
      const dados={obraId,etapaNome,item,resp,data,obs,fotos};
      const fotosJson=JSON.stringify(fotos);
      if(chk){
        Object.assign(chk,dados);
        supaUpdate('checklists',chk.id,{obra_id:obraId,etapa_nome:etapaNome,item,responsavel:resp,data:data||null,obs});
        // Salvar fotos localmente (coluna fotos precisa de: ALTER TABLE checklists ADD COLUMN IF NOT EXISTS fotos TEXT DEFAULT '[]')
        try{ supaUpdate('checklists',chk.id,{fotos:fotosJson}); }catch(e){ console.warn('fotos col missing'); }
      } else {
        const newId=uuidv4();
        const newChk={id:newId,...dados,status:'pendente',_supa:true};
        DB.checklists.push(newChk);
        supaInsert('checklists',{id:newId,empresa_id:_empresaId,obra_id:obraId,etapa_nome:etapaNome,item,responsavel:resp,data:data||null,obs,status:'pendente'});
        // Salvar fotos após inserção (requer coluna fotos na tabela)
        if(fotos.length>0){ setTimeout(()=>{ try{ supaUpdate('checklists',newId,{fotos:fotosJson}); }catch(e){ console.warn('fotos col missing - execute: ALTER TABLE checklists ADD COLUMN IF NOT EXISTS fotos TEXT'); } },500); }
      }
      window._chkFotos=[];
      save();renderChecklist();toast('✅',chk?'Item atualizado!':'Item criado!');return true;
    };

    // Renderizar fotos após o modal abrir
    setTimeout(()=>{
      const grid=document.getElementById('chk-foto-grid');
      if(grid){
        grid._renderFn=renderFotosChk;
        renderFotosChk();
        grid.addEventListener('change',renderFotosChk);
      }
    },50);
  }
  else if(type==='medicao'){
    const contratoIdPre=editId2||null; // editId2 = contrato pré-selecionado
    const med=editId?DB.medicoes.find(x=>x.id===editId):null;
    title=med?'Editar Medição':'📐 Nova Medição';
    const ctOpts=DB.contratos.map(c=>`<option value="${c.id}" ${(med?.contratoId||contratoIdPre)===c.id?'selected':''}>${c.numero||c.descricao?.substring(0,30)} — ${c.forn||'—'}</option>`).join('');
    // Calcular próximo número de medição
    const proxNum=med?.numero||((DB.medicoes||[]).length+1);
    window._medFotos=med?.fotos?[...med.fotos]:[];
    const renderMedFotos=()=>{
      const g=document.getElementById('med-foto-grid');if(!g)return;
      let h='';
      (window._medFotos||[]).forEach((f,i)=>{
        h+='<div style="position:relative;width:72px;height:72px;border-radius:6px;overflow:hidden;border:1px solid var(--border)">'+
          '<img src="'+f.src+'" style="width:100%;height:100%;object-fit:cover">'+
          '<button onclick="window._medFotos.splice('+i+',1);document.getElementById("med-foto-grid")._rf()" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:16px;height:16px;cursor:pointer;font-size:9px">x</button></div>';
      });
      h+='<label style="width:72px;height:72px;border-radius:6px;border:2px dashed var(--border2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:3px;flex-shrink:0">'+
        '<span style="font-size:18px">📷</span><span style="font-size:8px;color:var(--txt3)">Adicionar</span>'+
        '<input type="file" accept="image/*" multiple style="display:none" onchange="medAddFotos(event)"></label>';
      g.innerHTML=h;
    };
    const ctValor=DB.contratos.find(c=>c.id===(med?.contratoId||contratoIdPre||DB.contratos[0]?.id))?.valor||0;
    body=`<div style="display:flex;flex-direction:column;gap:14px">
      <div class="g g2">
        <!-- Linha 1: Contrato + Nº -->
        <div class="fg"><label class="lbl">Contrato *</label>
          <select class="sel" id="med-ct" onchange="medCalcAcum()">${ctOpts}</select></div>
        <div class="fg"><label class="lbl">Nº da Medição</label>
          <input type="number" class="inp" id="med-num" value="${proxNum}" min="1"></div>
        <!-- Linha 2: Período + Obra -->
        <div class="fg"><label class="lbl">Período de Referência *</label>
          <input type="month" class="inp" id="med-periodo" value="${med?.periodo?.substring(0,7)||new Date().toISOString().substring(0,7)}"></div>
        <div class="fg"><label class="lbl">Obra</label>
          <select class="sel" id="med-obra">${DB.obras.map(o=>'<option value="'+o.id+'"'+(String(med?.obraId||DB.contratos.find(c=>c.id===(med?.contratoId||contratoIdPre))?.obraId)===String(o.id)?' selected':'')+'>'+o.nome+'</option>').join('')}</select></div>
        <!-- Linha 3: Modo de medição -->
        <div class="fg" style="grid-column:span 2">
          <label class="lbl">Forma de Medição</label>
          <div style="display:flex;gap:8px;margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;flex:1;padding:8px 12px;border:1px solid var(--border2);border-radius:8px;background:var(--bg3)" id="med-modo-r-lbl">
              <input type="radio" name="med-modo" id="med-modo-r" value="real" ${!med||!med.pctMedido?'checked':''} onchange="medModoChange()">
              <span><strong>Valor em R$</strong><br><span style="font-size:10px;color:var(--txt3)">Digite o valor exato</span></span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;flex:1;padding:8px 12px;border:1px solid var(--border2);border-radius:8px;background:var(--bg3)" id="med-modo-p-lbl">
              <input type="radio" name="med-modo" id="med-modo-p" value="pct" ${med?.pctMedido?'checked':''} onchange="medModoChange()">
              <span><strong>Porcentagem do Contrato</strong><br><span style="font-size:10px;color:var(--txt3)">Ex: 30% = calcula o valor</span></span>
            </label>
          </div>
        </div>
        <!-- Linha 4: Campos de valor (muda conforme modo) -->
        <div class="fg" id="med-campo-real" style="${med?.pctMedido?'display:none':''}">
          <label class="lbl">Valor desta Medição (R$) *</label>
          <input type="number" class="inp" id="med-valor" value="${med?.valorMedido||''}" min="0" step="0.01" placeholder="0.00" oninput="medCalcAcum()">
        </div>
        <div class="fg" id="med-campo-pct" style="${med?.pctMedido?'':'display:none'}">
          <label class="lbl">% desta Medição no Contrato *</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="number" class="inp" id="med-pct" value="${med?.pctMedido||''}" min="0.1" max="100" step="0.1" placeholder="Ex: 30" oninput="medPctToValor()" style="flex:1">
            <span style="font-size:12px;color:var(--txt3);white-space:nowrap">% do contrato</span>
          </div>
          <div style="font-size:10px;color:var(--primary);margin-top:4px" id="med-pct-preview"></div>
        </div>
        <div class="fg">
          <label class="lbl">Valor Acumulado até esta medição</label>
          <input type="number" class="inp" id="med-acum" value="${med?.valorAcumulado||''}" min="0" step="0.01" placeholder="Calculado automaticamente" readonly style="background:var(--bg3);color:var(--txt3)">
        </div>
        <!-- Serviços executados -->
        <div class="fg" style="grid-column:span 2"><label class="lbl">Serviços Executados nesta Medição *</label>
          <textarea class="ta" id="med-exec" style="min-height:70px" placeholder="Descreva o que foi executado: serviços, etapas concluídas, quantidades, locais...">${med?.exec||''}</textarea></div>
        <div class="fg" style="grid-column:span 2"><label class="lbl">Pendências / Observações</label>
          <textarea class="ta" id="med-obs" style="min-height:36px" placeholder="Ressalvas, pendências, condições especiais...">${med?.obs||''}</textarea></div>
      </div>
      <!-- Fotos -->
      <div>
        <label class="lbl" style="margin-bottom:8px;display:block">📷 Fotos do Executado</label>
        <div id="med-foto-grid" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;min-height:80px;padding:8px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <div style="color:var(--txt3);font-size:11px;align-self:center" id="med-foto-empty">Clique em + para adicionar fotos</div>
        </div>
      </div>
    </div>`;
    window._postModalRender=()=>{
      const g=document.getElementById('med-foto-grid');
      if(!g)return;
      const rf=()=>{ renderMedFotos(); const e=document.getElementById('med-foto-empty'); if(e)e.style.display=(window._medFotos||[]).length?'none':'block'; };
      g._rf=rf; rf();
      if(document.getElementById('med-modo-p')?.checked) medPctToValor();
    };
    onSave=()=>{
      const ctId=document.getElementById('med-ct').value;
      const isMedPct=document.getElementById('med-modo-p')?.checked;
      const pctMedido=isMedPct?(parseFloat(document.getElementById('med-pct')?.value)||0):0;
      const valor=parseFloat(document.getElementById('med-valor').value)||0;
      const acum=parseFloat(document.getElementById('med-acum').value)||valor;
      const periodo=document.getElementById('med-periodo').value+'-01';
      const obraId=document.getElementById('med-obra').value;
      const num=parseInt(document.getElementById('med-num').value)||proxNum;
      const obs=document.getElementById('med-obs').value.trim();
      const exec=document.getElementById('med-exec')?.value.trim()||'';
      const fotos=window._medFotos||[];
      const fotosJson=JSON.stringify(fotos);
      if(!ctId){toast('⚠️','Selecione um contrato!');return false;}
      if(!valor){toast('⚠️','Informe o valor da medição!');return false;}
      const dados={contratoId:ctId,obraId,numero:num,periodo,valorMedido:valor,valorAcumulado:acum,pctMedido,status:med?.status||'pendente',exec,obs,fotos};
      if(med){
        Object.assign(med,dados);
        supaUpdate('medicoes',med.id,{contrato_id:ctId,obra_id:obraId,numero:num,periodo,valor_medido:valor,valor_acumulado:acum,obs,exec});
        setTimeout(()=>{try{supaUpdate('medicoes',med.id,{fotos:fotosJson});}catch(e){}},300);
      } else {
        const newId=uuidv4();
        const newMed={id:newId,...dados,_supa:true};
        DB.medicoes.push(newMed);
        supaInsert('medicoes',{id:newId,empresa_id:_empresaId,contrato_id:ctId,obra_id:obraId,numero:num,periodo,valor_medido:valor,valor_acumulado:acum,status:'pendente',exec,obs});
        setTimeout(()=>{try{supaUpdate('medicoes',newId,{fotos:fotosJson});}catch(e){}},500);
      }
      window._medFotos=[];
      save();renderContratos();toast('✅',med?'Medição atualizada!':'Medição registrada!');return true;
    };
  }
  else if(type==='nc'){
    const n=editId?DB.ncs.find(x=>String(x.id)===String(editId)):null;const obra=getObra();
    title=n?'Editar NC':'❌ Nova Não Conformidade';
    body=`<div class="g g2">
      <div class="fg"><label class="lbl">Obra</label><select class="sel" id="nc-obra">${DB.obras.map(o=>`<option value="${o.id}" ${(n?.obraId||obra?.id)==o.id?'selected':''}>${o.nome}</option>`).join('')}</select></div>
      <div class="fg"><label class="lbl">Etapa</label><input class="inp" id="nc-etapa" value="${n?.etapa||''}" placeholder="Ex: Alvenaria, Estrutura..."></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Descrição *</label><textarea class="ta" id="nc-desc" placeholder="Descreva a não conformidade...">${n?.desc||''}</textarea></div>
      <div class="fg"><label class="lbl">Criticidade</label><select class="sel" id="nc-grau"><option ${n?.grau==='Alta'?'selected':''}>Alta</option><option ${n?.grau==='Média'?'selected':''}>Média</option><option ${n?.grau==='Baixa'?'selected':''}>Baixa</option></select></div>
      <div class="fg"><label class="lbl">Prazo para Resolução</label><input type="date" class="inp" id="nc-prazo" value="${n?.prazo||''}"></div>
      <div class="fg"><label class="lbl">Responsável</label><input class="inp" id="nc-resp" value="${n?.resp||''}" placeholder="Quem vai resolver?"></div>
      <div class="fg"><label class="lbl">Status</label><select class="sel" id="nc-status"><option ${n?.status==='Aberta'?'selected':''}>Aberta</option><option ${n?.status==='Em andamento'?'selected':''}>Em andamento</option><option ${n?.status==='Fechada'?'selected':''}>Fechada</option></select></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Plano de Ação</label><textarea class="ta" id="nc-acao" placeholder="Ação corretiva...">${n?.acao||''}</textarea></div>
    </div>`;
    onSave=()=>{
      const desc=document.getElementById('nc-desc').value.trim();if(!desc){toast('⚠️','Descrição obrigatória!');return false;}
      const dados={desc,obraId:document.getElementById('nc-obra').value||null,etapa:document.getElementById('nc-etapa').value.trim(),grau:document.getElementById('nc-grau').value,prazo:document.getElementById('nc-prazo').value,resp:document.getElementById('nc-resp').value.trim(),status:document.getElementById('nc-status').value,acao:document.getElementById('nc-acao').value.trim()};
      if(n){
        Object.assign(n,dados);
        supaUpdate('nao_conformidades',n.id,{obra_id:dados.obraId||null,etapa:dados.etapa,descricao:dados.desc,grau:dados.grau,prazo:dados.prazo||null,responsavel:dados.resp,status:dados.status,acao:dados.acao});
      } else {
        const novoId=uuidv4();
        const maxNumNC=Math.max(0,...(DB.ncs||[]).map(x=>Number(x.numero||0)));
        const numeroNC=maxNumNC+1;
        const newN={id:novoId,numero:numeroNC,...dados,_supa:true};
        DB.ncs.push(newN);
        supaInsert('nao_conformidades',{id:novoId,numero:numeroNC,obra_id:dados.obraId||null,etapa:dados.etapa,descricao:dados.desc,grau:dados.grau,prazo:dados.prazo||null,responsavel:dados.resp,status:dados.status,acao:dados.acao});
      }
      save();renderQual();toast('✅',n?'NC atualizada!':'NC registrada!');return true;
    };
  }
  else if(type==='user'){
    title='⚙️ Configurações';
    const fotoAtual=DB.user.foto||'';
    body=`<div style="display:flex;flex-direction:column;gap:16px">
      <!-- Foto de perfil -->
      <div style="display:flex;align-items:center;gap:16px">
        <div style="position:relative;flex-shrink:0">
          <div id="u-foto-preview" style="width:72px;height:72px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;overflow:hidden;border:3px solid var(--border2)">
            ${fotoAtual?`<img src="${fotoAtual}" style="width:100%;height:100%;object-fit:cover">`:(DB.user.ini||DB.user.nome?.charAt(0)||'?')}
          </div>
          <label style="position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--bg2)" title="Alterar foto">
            📷
            <input type="file" accept="image/*" style="display:none" onchange="(e=>{const f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024){toast('⚠️','Foto muito grande. Máximo 2MB.');return;}const r=new FileReader();r.onload=ev=>{const src=ev.target.result;document.getElementById('u-foto-preview').innerHTML='<img src='+JSON.stringify(src)+' style=width:100%;height:100%;object-fit:cover>';window._novaFoto=src;};r.readAsDataURL(f);})(event)">
          </label>
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--txt)">${DB.user.nome||'Usuário'}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${DB.user.cargo||_papelAtual||''}</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:4px">Clique no 📷 para alterar a foto</div>
        </div>
      </div>
      <!-- Campos -->
      <div class="g g2">
        <div class="fg" style="grid-column:span 2"><label class="lbl">Nome completo</label><input class="inp" id="u-nome" value="${DB.user.nome||''}" placeholder="Ex: Carlos Ferreira"></div>
        <div class="fg"><label class="lbl">Cargo / Função</label><input class="inp" id="u-cargo" value="${DB.user.cargo||''}" placeholder="Ex: Engenheiro, Diretor..."></div>
        <div class="fg"><label class="lbl">Iniciais (avatar)</label><input class="inp" id="u-ini" value="${DB.user.ini||''}" maxlength="3" placeholder="CF"></div>
      </div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('u-nome').value.trim();
      const cargo=document.getElementById('u-cargo').value.trim();
      const ini=document.getElementById('u-ini').value.trim().toUpperCase();
      const foto=window._novaFoto||DB.user.foto||'';
      DB.user={nome,cargo,ini,foto};
      window._novaFoto=null;
      localStorage.setItem('_ot_cargo', cargo);
      save();
      // Atualizar avatar no sidebar
      const av=document.getElementById('user-av');
      if(av){
        if(foto) av.innerHTML=`<img src="${foto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        else av.textContent=ini||nome.charAt(0)||'?';
      }
      // Atualizar nome/cargo no perfil Supabase
      if(supa&&_usuarioAtual){
        supa.from('perfis').update({nome,cargo}).eq('id',_usuarioAtual.id).then(({error})=>{
          if(error) console.warn('Perfil update:',error.message);
          else { localStorage.setItem('_ot_nome',nome); }
        });
      }
      updateSbObra();
      toast('✅','Perfil atualizado!');
      return true;
    };
  }

  else if(type==='demanda'){
    const d=editId?DB.demandas.find(x=>String(x.id)===String(editId)):null;
    title=d?'Editar Demanda':'📋 Nova Demanda';
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Tarefa / Título *</label><input class="inp" id="dem-titulo" value="${d?.titulo||''}" placeholder="Ex: Comprar revestimento do piso geral"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Descrição</label><textarea class="ta" id="dem-desc" style="min-height:50px" placeholder="Detalhes adicionais...">${d?.desc||''}</textarea></div>
      <div class="fg"><label class="lbl">Obra</label>
        <select class="sel" id="dem-obra">${DB.obras.map(o=>`<option value="${o.id}"${String(d?.obraId)===String(o.id)?' selected':''}>${o.nome}</option>`).join('')}</select>
      </div>
      <div class="fg"><label class="lbl">Categoria</label>
        <input class="inp" id="dem-cat" value="${d?.categoria||''}" placeholder="Ex: Materiais, Serviços, Elétrica..."></div>
      <div class="fg"><label class="lbl">Responsável</label><input class="inp" id="dem-resp" value="${d?.responsavel||''}" placeholder="Nome do responsável"></div>
      <div class="fg"><label class="lbl">Prazo</label><input type="date" class="inp" id="dem-prazo" value="${d?.prazo||''}"></div>
      <div class="fg"><label class="lbl">Prioridade</label>
        <select class="sel" id="dem-prior">
          <option value="baixa"${d?.prioridade==='baixa'?' selected':''}>🟢 Baixa</option>
          <option value="media"${(!d||d?.prioridade==='media')?' selected':''}>🟡 Média</option>
          <option value="alta"${d?.prioridade==='alta'?' selected':''}>🔴 Alta</option>
        </select>
      </div>
      <div class="fg"><label class="lbl">Status</label>
        <select class="sel" id="dem-status">
          <option value="pendente"${(!d||d?.status==='pendente')?' selected':''}>⏳ Pendente</option>
          <option value="andamento"${d?.status==='andamento'?' selected':''}>🔄 Em andamento</option>
          <option value="concluida"${d?.status==='concluida'?' selected':''}>✅ Concluída</option>
        </select>
      </div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label><textarea class="ta" id="dem-obs" style="min-height:40px">${d?.obs||''}</textarea></div>
    </div>`;
    onSave=()=>{
      const titulo=document.getElementById('dem-titulo').value.trim();
      if(!titulo){toast('⚠️','Título obrigatório!');return false;}
      const dados={titulo,desc:document.getElementById('dem-desc').value.trim(),obraId:document.getElementById('dem-obra').value||null,categoria:document.getElementById('dem-cat').value.trim(),responsavel:document.getElementById('dem-resp').value.trim(),prazo:document.getElementById('dem-prazo').value||null,prioridade:document.getElementById('dem-prior').value,status:document.getElementById('dem-status').value,obs:document.getElementById('dem-obs').value.trim()};
      if(d){
        Object.assign(d,dados);
        supaUpdate('demandas',d.id,{titulo:dados.titulo,descricao:dados.desc,obra_id:dados.obraId||null,categoria:dados.categoria,responsavel:dados.responsavel,prazo:dados.prazo||null,prioridade:dados.prioridade,status:dados.status,obs:dados.obs});
      } else {
        const novoId=uuidv4();
        // Gerar número sequencial baseado no maior número existente
        const maxNum=Math.max(0,...(DB.demandas||[]).map(x=>Number(x.numero||0)));
        const numero=maxNum+1;
        const nd={id:novoId,numero,...dados,_supa:true};
        if(!DB.demandas) DB.demandas=[];
        DB.demandas.push(nd);
        supaInsert('demandas',{id:novoId,titulo:dados.titulo,descricao:dados.desc,obra_id:dados.obraId||null,categoria:dados.categoria,responsavel:dados.responsavel,prazo:dados.prazo||null,prioridade:dados.prioridade,status:dados.status,obs:dados.obs});
      }
      save();renderDemandas();toast('✅',d?'Demanda atualizada!':'Demanda criada!');return true;
    };
  }
  else if(type==='fornecedor'){
    const f=editId?DB.fornecedores.find(x=>typeof x==='object'&&String(x.id)===String(editId)):null;
    title=f?'Editar Fornecedor':'🏭 Novo Fornecedor';
    body=`<div class="g g2">
      <div class="fg" style="grid-column:span 2"><label class="lbl">Nome / Razão Social *</label><input class="inp" id="forn-nome" value="${f?.nome||''}" placeholder="Nome da empresa ou pessoa"></div>
      <div class="fg"><label class="lbl">Tipo</label>
        <select class="sel" id="forn-tipo">
          <option value="">— Selecione —</option>
          <option value="Material"${f?.tipo==='Material'?' selected':''}>📦 Material</option>
          <option value="Serviço"${f?.tipo==='Serviço'?' selected':''}>🔧 Serviço</option>
          <option value="Equipamento"${f?.tipo==='Equipamento'?' selected':''}>🚜 Equipamento</option>
          <option value="Outro"${f?.tipo==='Outro'?' selected':''}>📌 Outro</option>
        </select>
      </div>
      <div class="fg"><label class="lbl">CNPJ / CPF</label><input class="inp" id="forn-cnpj" value="${f?.cnpj||''}" placeholder="00.000.000/0000-00"></div>
      <div class="fg"><label class="lbl">Nome do Contato</label><input class="inp" id="forn-contato" value="${f?.contato||''}" placeholder="Nome do responsável"></div>
      <div class="fg"><label class="lbl">Telefone / WhatsApp</label><input class="inp" id="forn-tel" value="${f?.telefone||''}" placeholder="(00) 00000-0000"></div>
      <div class="fg"><label class="lbl">Email</label><input type="email" class="inp" id="forn-email" value="${f?.email||''}" placeholder="email@empresa.com"></div>
      <div class="fg"><label class="lbl">Endereço</label><input class="inp" id="forn-end" value="${f?.endereco||''}" placeholder="Rua, número, bairro"></div>
      <div class="fg"><label class="lbl">Cidade / Estado</label><input class="inp" id="forn-cidade" value="${f?.cidade||''}" placeholder="Cidade - UF"></div>
      <div class="fg" style="grid-column:span 2"><label class="lbl">Observações</label><textarea class="ta" id="forn-obs" style="min-height:50px">${f?.obs||''}</textarea></div>
    </div>`;
    onSave=()=>{
      const nome=document.getElementById('forn-nome').value.trim();
      if(!nome){toast('⚠️','Nome obrigatório!');return false;}
      const dados={nome,tipo:document.getElementById('forn-tipo').value,cnpj:document.getElementById('forn-cnpj').value.trim(),contato:document.getElementById('forn-contato').value.trim(),telefone:document.getElementById('forn-tel').value.trim(),email:document.getElementById('forn-email').value.trim(),endereco:document.getElementById('forn-end').value.trim(),cidade:document.getElementById('forn-cidade').value.trim(),obs:document.getElementById('forn-obs').value.trim()};
      if(f){
        Object.assign(f,dados);
        supaUpdate('fornecedores_cadastro',f.id,dados);
      } else {
        const novoId=uuidv4();
        const nf={id:novoId,...dados,_supa:true};
        // Substituir string duplicada se existir
        const idxStr=DB.fornecedores.findIndex(x=>typeof x==='string'&&x===nome);
        if(idxStr>-1) DB.fornecedores[idxStr]=nf;
        else DB.fornecedores.push(nf);
        supaInsert('fornecedores_cadastro',{id:novoId,...dados});
      }
      save();renderFornecedores();fillSelects();toast('✅',f?'Fornecedor atualizado!':'Fornecedor cadastrado!');return true;
    };
  }

  if(!title)return;
  root.innerHTML=`<div class="ov" onmouseup="if(event.target===this&&!window._modalMousedownInside)closeModal()"><div class="mo"><div class="moh"><div class="mot">${title}</div><div class="mox" onclick="closeModal()">✕</div></div><div class="mob">${body}</div><div class="mof"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" onclick="if(window._mSave&&window._mSave())closeModal()">✅ Salvar</button></div></div></div>`;
  window._mSave=onSave;
  // Executar callback pós-render (ex: grids de fotos)
  if(window._postModalRender){
    const cb=window._postModalRender;
    window._postModalRender=null;
    setTimeout(cb,30);
  }
}
function _refreshLancEtapas(obraVal){
  const sel=document.getElementById('l-etapa');if(!sel)return;
  let opts='<option value="">— Selecionar —</option>';
  // Etapas do cronograma (se existirem)
  const etapasCron=DB.etapas.filter(e=>!obraVal||String(e.obraId)==String(obraVal));
  if(etapasCron.length){
    etapasCron.forEach(e=>{opts+=`<option value="${e.nome}">${e.nome}</option>`;});
  }
  // Itens do orçamento (grupos + subitens com valor)
  if(obraVal){
    const orcGrupos=typeof _orcGet==='function'?_orcGet(obraVal):[];
    const gruposComValor=orcGrupos.filter(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));
    if(gruposComValor.length){
      gruposComValor.forEach(g=>{
        const gNome=g.cod+' - '+g.nome;
        opts+=`<option disabled style="font-weight:700;color:var(--primary)">── ${gNome} ──</option>`;
        g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0).forEach(s=>{
          opts+=`<option value="${s.cod} - ${s.desc}">&nbsp;&nbsp;${s.cod} - ${s.desc}</option>`;
        });
      });
    }
  }
  sel.innerHTML=opts;
}
function _refreshCtEtapas(obraVal){
  const sel=document.getElementById('ct-etapa');if(!sel)return;
  let opts='<option value="">— Selecionar —</option>';
  DB.etapas.filter(e=>!obraVal||String(e.obraId)==String(obraVal)).forEach(e=>{
    opts+=`<option value="${e.nome}">${e.nome}</option>`;
  });
  if(obraVal){
    const orcGrupos=typeof _orcGet==='function'?_orcGet(obraVal):[];
    const gruposComValor=orcGrupos.filter(g=>g.subs.some(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0));
    if(gruposComValor.length){
      gruposComValor.forEach(g=>{
        const gNome=g.cod+' - '+g.nome;
        opts+=`<option disabled style="font-weight:700">── ${gNome} ──</option>`;
        g.subs.filter(s=>(Number(s.qtd)||0)>0&&(Number(s.unit)||0)>0).forEach(s=>{
          opts+=`<option value="${s.cod} - ${s.desc}">&nbsp;&nbsp;${s.cod} - ${s.desc}</option>`;
        });
      });
    }
  }
  sel.innerHTML=opts;
}
function closeModal(){document.getElementById('modal-root').innerHTML='';window._mSave=null;}

// Previne fechamento do modal ao arrastar texto para fora
document.addEventListener('mousedown',e=>{
  window._modalMousedownInside=!!e.target.closest('.mo,.mio-box');
});
// Enter para salvar em qualquer modal aberto
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.altKey){
    const root=document.getElementById('modal-root');
    if(!root||!root.innerHTML.trim())return;
    // Não disparar se o foco está em textarea
    if(document.activeElement&&document.activeElement.tagName==='TEXTAREA')return;
    // Não disparar se está em select
    if(document.activeElement&&document.activeElement.tagName==='SELECT')return;
    if(window._mSave){e.preventDefault();if(window._mSave())closeModal();}
  }
});
function openUserModal(){openModal('user');}
