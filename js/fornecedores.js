// ═══════════════════════════════════════════════════════════════
// FORNECEDORES
// ═══════════════════════════════════════════════════════════════
function renderFornecedores(){
  const q=(document.getElementById('forn-search')?.value||'').toLowerCase();
  const tipoF=document.getElementById('forn-tipo-filter')?.value||'';

  let forns=(DB.fornecedores||[]).map(f=>typeof f==='string'?{id:f,nome:f,tipo:'',cnpj:'',telefone:'',email:'',contato:'',obs:'',_legado:true}:f);

  if(q) forns=forns.filter(f=>(f.nome||'').toLowerCase().includes(q)||(f.contato||'').toLowerCase().includes(q)||(f.cnpj||'').includes(q));
  if(tipoF) forns=forns.filter(f=>(f.tipo||'')===(tipoF));
  // "Todos os tipos" = tipoF vazio = sem filtro = mostra todos

  // KPIs
  const total=(DB.fornecedores||[]).length;
  const comEmail=(DB.fornecedores||[]).filter(f=>typeof f==='object'&&f.email).length;
  const tipos=['Material','Serviço','Equipamento','Outro'];
  document.getElementById('forn-kpis').innerHTML=`
    <div class="kpi"><div class="kl">🏭 Total</div><div class="kv">${total}</div><div class="kd neu">cadastrados</div></div>
    <div class="kpi"><div class="kl">📧 Com email</div><div class="kv">${comEmail}</div><div class="kd neu">contatos</div></div>
    <div class="kpi"><div class="kl">🔧 Serviços</div><div class="kv">${(DB.fornecedores||[]).filter(f=>typeof f==='object'&&f.tipo==='Serviço').length}</div><div class="kd neu">fornecedores</div></div>
    <div class="kpi"><div class="kl">📦 Materiais</div><div class="kv">${(DB.fornecedores||[]).filter(f=>typeof f==='object'&&f.tipo==='Material').length}</div><div class="kd neu">fornecedores</div></div>`;

  const el=document.getElementById('forn-tbl');
  if(!forns.length){
    el.innerHTML='<div class="t-empty">Nenhum fornecedor encontrado. <button class="btn pri sm" onclick="openModal(\'fornecedor\')" style="margin-left:8px">＋ Cadastrar</button></div>';
    return;
  }

  el.innerHTML=`<table class="tbl">
    <tr>
      <th>Nome / Empresa</th><th>Tipo</th><th>CNPJ/CPF</th>
      <th>Contato</th><th>Telefone</th><th>Email</th>
      <th>Cidade</th><th></th>
    </tr>`+
    forns.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')).map(f=>`<tr>
      <td>
        <div style="font-weight:600">${f.nome||'—'}</div>
        ${f.obs?`<div style="font-size:10px;color:var(--txt3)">${f.obs}</div>`:''}
      </td>
      <td><span class="b bn" style="font-size:10px">${f.tipo||'—'}</span></td>
      <td style="font-size:11px;color:var(--txt3)">${f.cnpj||'—'}</td>
      <td style="font-size:11px">${f.contato||'—'}</td>
      <td style="font-size:11px">${f.telefone?`<a href="tel:${f.telefone}" style="color:var(--primary)">${f.telefone}</a>`:'—'}</td>
      <td style="font-size:11px">${f.email?`<a href="mailto:${f.email}" style="color:var(--primary)">${f.email}</a>`:'—'}</td>
      <td style="font-size:11px;color:var(--txt3)">${f.cidade||'—'}</td>
      <td>
        <div class="ta-actions">
          <button class="btn sm ico" onclick="openModal('fornecedor','${f.id}')" title="Editar">✏️</button>
          <button class="btn sm ico" onclick="delFornecedor('${f.id}')" title="Excluir">🗑️</button>
        </div>
      </td>
    </tr>`).join('')+'</table>';
}

function delFornecedor(id){
  if(!confirm('Excluir fornecedor?')) return;
  const f=DB.fornecedores.find(x=>typeof x==='object'&&String(x.id)===String(id));
  if(f&&typeof f.id==='string'&&f.id.includes('-')) supaDelete('fornecedores_cadastro',f.id);
  DB.fornecedores=DB.fornecedores.filter(x=>typeof x==='string'?true:String(x.id)!==String(id));
  save();renderFornecedores();toast('🗑️','Fornecedor excluído.');
}


function gerarChecklistPDF(){
  const obraFiltro=document.getElementById('chk-obra-filter')?.value||'';
  const statusFiltro=document.getElementById('chk-status-filter')?.value||'';
  let items=[...(DB.checklists||[])];
  if(obraFiltro) items=items.filter(c=>String(c.obraId)===String(obraFiltro));
  if(statusFiltro) items=items.filter(c=>c.status===statusFiltro);
  if(!items.length){toast('⚠️','Nenhum item para gerar.');return;}
  if(!window.jspdf?.jsPDF){toast('⚠️','PDF não disponível.');return;}

  try{
  const doc=new jsPDF();
  const obra=DB.obras.find(x=>String(x.id)===String(obraFiltro))||DB.obras[0];
  const obraNome=obra?.nome||'Todas as Obras';
  const tot=items.length;
  const ok=items.filter(i=>i.status==='ok').length;
  const nok=items.filter(i=>i.status==='nok').length;
  const pend=items.filter(i=>i.status==='pendente').length;
  const pct=tot?Math.round(ok/tot*100):0;

  let y=pHdr(doc,'Checklist de Inspecao e Qualidade',obraNome);
  y+=2;

  // KPIs resumo
  const cw=43,ch=24,gap=2;
  pKpi(doc,9,y,cw,ch,'Total de Itens',String(tot),'verificacoes');
  pKpi(doc,9+(cw+gap),y,cw,ch,'Conformes',String(ok),pct+'% de conformidade');
  pKpi(doc,9+2*(cw+gap),y,cw,ch,'Nao Conformes',String(nok),'requerem acao');
  pKpi(doc,9+3*(cw+gap),y,cw,ch,'Pendentes',String(pend),'aguardando verificacao');
  y+=ch+6;

  // Barra de conformidade geral
  const W=doc.internal.pageSize.getWidth();
  doc.setFillColor(230,232,236);doc.rect(9,y,W-18,6,'F');
  const barColor=pct>=100?PX.green:pct>=70?[120,53,15]:PX.red;
  doc.setFillColor(...barColor);doc.rect(9,y,(W-18)*pct/100,6,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(255,255,255);
  if(pct>8) doc.text('Conformidade: '+pct+'%',12,y+4.3);
  y+=10;

  // Agrupar por etapa
  const grupos={};
  items.forEach(c=>{
    const k=(c.obraId||'')+'||'+(c.etapaNome||'Geral');
    if(!grupos[k]) grupos[k]={etapa:c.etapaNome||'Geral',items:[]};
    grupos[k].items.push(c);
  });

  // Uma tabela por etapa
  Object.values(grupos).forEach(g=>{
    const gOk=g.items.filter(i=>i.status==='ok').length;
    const gTot=g.items.length;
    const gPct=gTot?Math.round(gOk/gTot*100):0;
    const etapaStr=g.etapa.toUpperCase()+' — '+gOk+'/'+gTot+' conformes ('+gPct+'%)';
    y=pSec(doc,y,etapaStr);

    const rows=g.items.map((item,idx)=>{
      const fotoInfo=item.fotos?.length?'['+item.fotos.length+' foto(s) em anexo]':'';
      const obsComFoto=(item.obs||'')+(fotoInfo?'\n'+fotoInfo:'');
      return [
        String(idx+1).padStart(2,'0'),
        item.item||'—',
        item.resp||'—',
        item.data?fmtDt(item.data):'—',
        item.status==='ok'?'CONFORME':item.status==='nok'?'NAO CONFORME':'PENDENTE',
        obsComFoto||'—',
      ];
    });

    // Guardar referência das fotos para inserir após a tabela
    const itensFotos=g.items.filter(i=>i.fotos?.length>0);

    doc.autoTable({
      startY:y,
      head:[['Nº','Item de Verificacao','Responsavel','Data','Status','Obs']],
      body:rows,
      headStyles:{...hStyle(),fontSize:7,cellPadding:{top:3,bottom:3,left:3,right:3}},
      bodyStyles:{...bStyle(),fontSize:7,cellPadding:{top:2.5,bottom:2.5,left:3,right:3},minCellHeight:0,overflow:'linebreak'},
      alternateRowStyles:altRow(),
      columnStyles:{
        0:{cellWidth:8,halign:'center',overflow:'hidden'},
        1:{cellWidth:66,overflow:'linebreak'},
        2:{cellWidth:26,overflow:'linebreak'},
        3:{cellWidth:18,halign:'center',overflow:'hidden'},
        4:{cellWidth:25,halign:'center',fontStyle:'bold',overflow:'hidden'},
        5:{cellWidth:49,overflow:'linebreak'},
      },
      didParseCell(data){
        if(data.column.index===4&&data.section==='body'){
          const v=data.cell.raw;
          if(v==='CONFORME') data.cell.styles.textColor=PX.green;
          else if(v==='NAO CONFORME') data.cell.styles.textColor=PX.red;
          else data.cell.styles.textColor=[120,53,15];
        }
      },
      margin:{left:9,right:9},
    });
    y=doc.lastAutoTable.finalY+4;

    // Inserir fotos de evidência abaixo da tabela da etapa
    if(itensFotos.length>0){
      itensFotos.forEach(item=>{
        if(!item.fotos?.length) return;
        if(y>260) doc.addPage();
        doc.setFillColor(...PX.bg);doc.rect(9,y,W-18,6,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...PX.navy);
        doc.text('Evidencias fotograficas — '+item.item.substring(0,50),11,y+4);
        y+=8;
        let fx=9, fy=y, fcount=0;
        item.fotos.forEach(foto=>{
          if(!foto?.src||!foto.src.startsWith('data:')) return;
          if(fx+32>W-9){fx=9;fy+=34;y=fy+34;}
          if(fy>255){doc.addPage();fy=20;y=fy+34;fx=9;}
          try{
            const fmt=foto.src.includes('data:image/png')?'PNG':'JPEG';
            doc.addImage(foto.src,fmt,fx,fy,30,28);
          }catch(e){ console.warn('foto pdf:',e.message); }
          fx+=32;fcount++;
        });
        y=fy+32;
      });
      y+=4;
    }
  });

  // Resumo final por etapa
  y=pSec(doc,y,'Resumo de Conformidade por Etapa');
  const resumoRows=Object.values(grupos).map(g=>{
    const gOk=g.items.filter(i=>i.status==='ok').length;
    const gNok=g.items.filter(i=>i.status==='nok').length;
    const gPend=g.items.filter(i=>i.status==='pendente').length;
    const gTot=g.items.length;
    const gPct=gTot?Math.round(gOk/gTot*100):0;
    return[g.etapa,String(gTot),String(gOk),String(gNok),String(gPend),gPct+'%',gPct>=100?'LIBERADO':gPct>=70?'PARCIAL':'PENDENTE'];
  });
  doc.autoTable({
    startY:y,
    head:[['Etapa','Total','Conformes','Nao Conf.','Pendentes','Conform.','Situacao']],
    body:resumoRows,
    foot:[[{colSpan:1,content:'TOTAL GERAL'},String(tot),String(ok),String(nok),String(pend),pct+'%',pct>=100?'APROVADO':pct>=70?'PARCIAL':'PENDENTE']],
    headStyles:{...hStyle(),fontSize:7,cellPadding:{top:3,bottom:3,left:3,right:3}},
    bodyStyles:{...bStyle(),fontSize:7.5,cellPadding:{top:2.5,bottom:2.5,left:3,right:3},overflow:'linebreak'},
    alternateRowStyles:altRow(),footStyles:totRow(),
    columnStyles:{0:{cellWidth:58,overflow:'linebreak'},1:{cellWidth:13,halign:'center',overflow:'hidden'},2:{cellWidth:18,halign:'center',overflow:'hidden'},3:{cellWidth:18,halign:'center',overflow:'hidden'},4:{cellWidth:18,halign:'center',overflow:'hidden'},5:{cellWidth:20,halign:'center',overflow:'hidden'},6:{cellWidth:22,halign:'center',fontStyle:'bold',overflow:'hidden'}},
    didParseCell(data){
      if(data.column.index===6&&data.section==='body'){
        const v=data.cell.raw;
        data.cell.styles.textColor=v==='LIBERADO'?PX.green:v==='PARCIAL'?[120,53,15]:PX.red;
      }
    },
    margin:{left:9,right:9},
  });

  // Assinatura
  const assinY=doc.lastAutoTable.finalY+10;
  if(assinY<260){
    const aW=(W-18)/2;
    [['Responsavel pela Inspecao',DB.user.nome||'—'],['Aprovacao / Visto','Gerente de Obras']].forEach((a,i)=>{
      const ax=9+i*aW;
      doc.setDrawColor(120,120,120);doc.line(ax+4,assinY+12,ax+aW-6,assinY+12);
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(...PX.gray);
      doc.text(a[0],ax+aW/2,assinY+16,{align:'center'});
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...PX.ink);
      doc.text(a[1].substring(0,30),ax+aW/2,assinY+20,{align:'center'});
    });
  }

  pFtr(doc);
  const arq='Checklist_'+obraNome.replace(/[^a-zA-Z0-9]/g,'_').substring(0,20)+'_'+new Date().toISOString().split('T')[0]+'.pdf';
  doc.save(arq);
  toast('📄','Relatorio de Inspecao gerado!');
  }catch(err){console.error('Checklist PDF erro:',err);toast('❌','Erro ao gerar PDF: '+err.message.substring(0,60));}
}

