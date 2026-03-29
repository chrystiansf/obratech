
// ═══════════════════════════════════════════
// PDF / EXCEL
// ═══════════════════════════════════════════
const {jsPDF}=window.jspdf;
// ═══════════════════════════════════════════════════════════════
// PDF DESIGN SYSTEM CORPORATIVO — ObraTech v1
// Paleta, utilitários de layout e tipografia profissional
// ═══════════════════════════════════════════════════════════════
// hexToRgb e corEmpresa estão em utils.js

const PX = {
  blue:   [25, 70, 150],
  ink:    [15, 15, 15],
  gray:   [100, 106, 120],
  lgray:  [170, 175, 185],
  silver: [218, 220, 225],
  bg:     [246, 247, 249],
  white:  [255, 255, 255],
  green:  [30, 120, 60],
  amber:  [160, 100, 10],
  red:    [160, 30, 30],
  // aliases para compatibilidade
  cyan:   [25, 70, 150],
  purple: [25, 70, 150],
  light:  [246, 247, 249],
  muted:  [218, 220, 225],
  border: [218, 220, 225],
  pale:   [170, 175, 185],
};
// navy e dark sao dinamicos — seguem a cor da empresa
Object.defineProperty(PX,'navy',{get:function(){return corEmpresa();},enumerable:true});
Object.defineProperty(PX,'dark',{get:function(){return corEmpresa();},enumerable:true});

// ── Cabeçalho corporativo — cor da empresa, logo se disponivel
function pHdr(doc, title, sub, _accent) {
  title=title||'Relatório'; sub=sub||'';
  const W = doc.internal.pageSize.getWidth();
  const ce = corEmpresa();
  // Fundo com cor da empresa
  doc.setFillColor(...ce); doc.rect(0, 0, W, 28, 'F');
  // Linha accent (cor mais clara)
  const accentRgb = [Math.min(ce[0]+30,255), Math.min(ce[1]+50,255), Math.min(ce[2]+100,255)];
  doc.setFillColor(...accentRgb); doc.rect(0, 28, W, 1.2, 'F');
  // Logo da empresa ou texto fallback
  let logoX = 9;
  if (_empresaLogo) {
    try { doc.addImage(_empresaLogo, 'PNG', 9, 4, 20, 20, '', 'FAST'); logoX = 33; } catch(e) { logoX = 9; }
  }
  if (logoX === 9) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.setTextColor(255, 255, 255); doc.text('OBRATECH', 9, 11);
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255, 180);
  doc.text('SISTEMA DE GESTAO DE OBRAS', logoX, _empresaLogo ? 11 : 17);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
  doc.text('Emitido em ' + new Date().toLocaleDateString('pt-BR'), logoX, _empresaLogo ? 17 : 23.5);
  // Separador vertical
  doc.setDrawColor(...accentRgb); doc.setLineWidth(0.5);
  doc.line(W * 0.42, 6, W * 0.42, 24);
  // Título
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), W - 9, 12, { align: 'right' });
  // Subtítulo
  if (sub) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255, 180);
    doc.text(String(sub).substring(0, 70), W - 9, 20, { align: 'right' });
  }
  doc.setTextColor(...PX.ink); doc.setLineWidth(0.2);
  return 36;
}

// ── Rodapé discreto — linha fina + texto cinza pequeno
function pFtr(doc) {
  const n = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
    doc.line(9, 285, W - 9, 285);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(...PX.lgray);
    doc.text('ObraTech — Sistema de Gestão de Obras', 9, 290);
    doc.text('Pag. ' + i + ' / ' + n, W / 2, 290, { align: 'center' });
    doc.text(new Date().toLocaleDateString('pt-BR'), W - 9, 290, { align: 'right' });
    doc.setLineWidth(0.2);
  }
}

// ── hStyle: cabeçalho de tabela — cor da empresa, texto branco
function hStyle(_c) {
  return {
    fillColor: corEmpresa(),
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 8,
    cellPadding: { top: 2.2, bottom: 2.2, left: 4, right: 4 }
  };
}
// ── bStyle: corpo de tabela — texto preto, padding compacto
function bStyle() {
  return {
    fontSize: 8,
    cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 5 },
    textColor: PX.ink,
    lineColor: PX.silver,
    lineWidth: 0.2
  };
}
function altRow()  { return { fillColor: PX.bg }; }
function totRow()  { return { fillColor: corEmpresa(), textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 }; }

// ── pKpi: card de indicador — borda cinza, topo azul escuro, valores em preto
function pKpi(doc, x, y, w, h, label, value, sub, _valColor) {
  label=label||''; value=value||'—'; sub=sub||'';
  doc.setFillColor(...PX.white);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(...PX.silver); doc.setLineWidth(0.25);
  doc.rect(x, y, w, h, 'S');
  // topo com cor da empresa
  doc.setFillColor(...corEmpresa()); doc.rect(x, y, w, 1.5, 'F');
  // label
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.setTextColor(...PX.gray);
  doc.text(label.toUpperCase(), x + 4, y + 8);
  // valor
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.setTextColor(...PX.ink);
  doc.text(String(value), x + 4, y + 17);
  // sub
  if (sub) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(...PX.lgray);
    doc.text(String(sub).substring(0, 22), x + 4, y + 23);
  }
  doc.setTextColor(...PX.ink); doc.setLineWidth(0.2);
}

// ── pSec: título de seção — linha azul + rótulo caixa alta preto
function pSec(doc, y, title, _color, pw) {
  const W = pw || 210;
  doc.setFillColor(...corEmpresa()); doc.rect(9, y, 3, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setTextColor(...PX.ink);
  doc.text(title.toUpperCase(), 15, y + 6);
  doc.setDrawColor(...PX.silver); doc.setLineWidth(0.25);
  doc.line(9, y + 9, W - 9, y + 9);
  doc.setTextColor(...PX.ink); doc.setLineWidth(0.2);
  return y + 14;
}

// ── pBar: barra de progresso limpa — cinza/azul, % ao lado
function pBar(doc, x, y, w, h, pct, _color) {
  const p = Math.min(Math.max(pct, 0), 100);
  doc.setFillColor(...PX.silver); doc.rect(x, y, w, h, 'F');
  if (p > 0) { doc.setFillColor(...PX.blue); doc.rect(x, y, w * p / 100, h, 'F'); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.setTextColor(...PX.ink);
  doc.text(p + '%', x + w + 4, y + h - 0.5);
}

// ─────────────────────────────────────────────────────────────────
// 1. RDO — Relatorio Diario de Obra
// ─────────────────────────────────────────────────────────────────

async function gerarRDOPDF(rdo) {
  if (!rdo) { toast('⚠️', 'Sem RDO selecionado!'); return; }
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const M = 14; // margem lateral padrao
  const CW = W - M * 2; // largura util
  const obra = DB.obras.find(o => o.id == rdo.obraId);
  const finalizado = rdo.status === 'finalizado';

  // Helper: checar paginacao
  const checkPage = (need, hdrTitle) => {
    if (y + need > 275) { doc.addPage(); y = pHdr(doc, 'Relatorio Diario de Obra', (obra?.nome||'-') + '  -  ' + fmtDt(rdo.data)) + 6; }
  };

  // Helper: presenca didParseCell com cores + maiuscula em labels
  const presStyle = function(data) {
    if (data.section === 'body') {
      const lastCol = data.table.columns.length - 1;
      if (data.column.index === lastCol) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        if (data.cell.raw === 'PRESENTE') data.cell.styles.textColor = [22, 130, 60];
        else if (data.cell.raw === 'FALTA') data.cell.styles.textColor = [200, 30, 30];
        else if (data.cell.raw === 'MEIA DIARIA') data.cell.styles.textColor = [180, 90, 0];
      }
      if (data.row.index % 2 === 0) data.cell.styles.fillColor = [250, 251, 253];
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  let y = pHdr(doc, 'Relatorio Diario de Obra', (obra?.nome || '-') + '  -  ' + fmtDt(rdo.data));
  y += 2;

  // ── Badge de status
  const statusTxt = finalizado ? 'FINALIZADO' : 'RASCUNHO';
  const statusColor = finalizado ? [22, 130, 60] : [180, 90, 0];
  doc.setFillColor(...statusColor);
  const stW = doc.getTextWidth(statusTxt) * 0.36 + 12;
  doc.roundedRect(M, y, stW, 5.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
  doc.text(statusTxt, M + stW / 2, y + 4, { align: 'center' });
  // Data de emissao ao lado
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
  doc.text('EMISSAO: ' + new Date().toLocaleDateString('pt-BR'), M + stW + 5, y + 4);
  y += 10;

  // ═══════════════════════════════════════════════════════════════
  // DADOS GERAIS — grid 2x2
  // ═══════════════════════════════════════════════════════════════
  const drawInfoBox = (bx, by, bw, bh, label, value) => {
    doc.setFillColor(250, 251, 253); doc.rect(bx, by, bw, bh, 'F');
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.2); doc.rect(bx, by, bw, bh, 'S');
    doc.setFillColor(...PX.navy); doc.rect(bx, by, bw, 1.2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...PX.gray);
    doc.text(label.toUpperCase(), bx + 5, by + 7);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PX.ink);
    doc.text(String(value).substring(0, 35), bx + 5, by + 14.5);
  };
  const bw1 = CW * 0.5 - 1.5, bw2 = CW * 0.25 - 1, bw3 = CW * 0.25 - 0.5;
  const bh = 19;
  drawInfoBox(M, y, bw1, bh, 'Obra', obra?.nome || '-');
  drawInfoBox(M + bw1 + 3, y, bw2, bh, 'Data', fmtDt(rdo.data));
  drawInfoBox(M + bw1 + bw2 + 6, y, bw3, bh, 'Clima', rdo.clima || '-');
  y += bh + 3;
  // Segunda linha: Local + Responsavel
  const bwHalf = CW * 0.5 - 1.5;
  drawInfoBox(M, y, bwHalf, bh, 'Localizacao', obra?.local || '-');
  drawInfoBox(M + bwHalf + 3, y, bwHalf, bh, 'Responsavel Tecnico', obra?.resp || '-');
  y += bh + 8;

  // ═══════════════════════════════════════════════════════════════
  // EXECUCAO DO DIA
  // ═══════════════════════════════════════════════════════════════
  y = pSec(doc, y, 'Execucao do Dia');
  const execData = [
    ['SERVICOS EXECUTADOS', rdo.serv || 'Nao informado.'],
    ['OCORRENCIAS / OBS', rdo.obs || 'Nenhuma ocorrencia.'],
    ['MATERIAIS RECEBIDOS', rdo.mat || 'Sem recebimentos.']
  ];
  doc.autoTable({
    startY: y,
    head: [['CAMPO', 'DESCRICAO']],
    body: execData,
    theme: 'plain',
    headStyles: hStyle(),
    bodyStyles: { ...bStyle(), minCellHeight: 10, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', fillColor: [240, 242, 246], textColor: PX.gray },
      1: { fillColor: [255, 255, 255] }
    },
    margin: { left: M, right: M },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 1 && data.cell.raw && data.cell.raw.indexOf('Nao informado') === -1 && data.cell.raw.indexOf('Nenhuma') === -1 && data.cell.raw.indexOf('Sem ') === -1) {
        data.cell.styles.textColor = PX.ink;
      } else if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.textColor = PX.lgray;
        data.cell.styles.fontStyle = 'italic';
      }
    }
  });
  y = doc.lastAutoTable.finalY + 8;

  // ═══════════════════════════════════════════════════════════════
  // LISTA DE PRESENCA — MAO DE OBRA CIVIL
  // ═══════════════════════════════════════════════════════════════
  const colabsOrdenados = [...DB.colabs].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  const presColabRows = [];
  colabsOrdenados.forEach(col => {
    const pt = DB.pontos.find(p => String(p.colabId) === String(col.id) && p.data === rdo.data && p.presente);
    let status = 'FALTA';
    if (pt && pt.tipo === 'meia_diaria') status = 'MEIA DIARIA';
    else if (pt) status = 'PRESENTE';
    presColabRows.push([(col.nome||'').toUpperCase(), (col.funcao||'-').toUpperCase(), status]);
  });
  if (presColabRows.length) {
    checkPage(20 + presColabRows.length * 7);
    y = pSec(doc, y, 'Lista de Presenca - Mao de Obra Civil (' + presColabRows.length + ')');
    doc.autoTable({
      startY: y,
      head: [['N', 'NOME', 'FUNCAO / CARGO', 'PRESENCA']],
      body: presColabRows.map((r, i) => [i + 1, ...r]),
      theme: 'plain',
      headStyles: hStyle(),
      bodyStyles: { ...bStyle(), lineColor: [235, 237, 240], lineWidth: 0.15 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: PX.gray },
        1: { cellWidth: 65, fontStyle: 'bold' },
        2: { textColor: PX.gray },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: M, right: M },
      didParseCell: presStyle
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTA DE PRESENCA — TERCEIRIZADOS
  // ═══════════════════════════════════════════════════════════════
  const tercsOrdenados = [...DB.terceirizados].sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '') || (a.nome || '').localeCompare(b.nome || ''));
  const presTercRows = [];
  tercsOrdenados.forEach(t => {
    const pt = (DB.pontosTercs || []).find(p => p.tercId === t.id && p.data === rdo.data);
    const status = pt && pt.presente ? 'PRESENTE' : 'FALTA';
    presTercRows.push([(t.nome||'').toUpperCase(), (t.funcao||'-').toUpperCase(), (t.empresa||'-').toUpperCase(), status]);
  });
  if (presTercRows.length) {
    checkPage(20 + presTercRows.length * 7);
    y = pSec(doc, y, 'Lista de Presenca - Terceirizados (' + presTercRows.length + ')');
    doc.autoTable({
      startY: y,
      head: [['N', 'NOME', 'FUNCAO', 'EMPRESA', 'PRESENCA']],
      body: presTercRows.map((r, i) => [i + 1, ...r]),
      theme: 'plain',
      headStyles: hStyle(),
      bodyStyles: { ...bStyle(), lineColor: [235, 237, 240], lineWidth: 0.15 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: PX.gray },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 35, textColor: PX.gray },
        3: { cellWidth: 40, textColor: PX.blue, fontStyle: 'bold' },
        4: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: M, right: M },
      didParseCell: presStyle
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ═══════════════════════════════════════════════════════════════
  // REGISTRO FOTOGRAFICO
  // ═══════════════════════════════════════════════════════════════
  if (rdo.fotos && rdo.fotos.length) {
    // Pré-carregar fotos (converter URL para base64 se necessário)
    const fotosCarregadas = [];
    for (const foto of rdo.fotos) {
      const imgSrc = foto.data || foto.url || '';
      if (!imgSrc) { fotosCarregadas.push(null); continue; }
      if (imgSrc.startsWith('data:')) {
        fotosCarregadas.push(imgSrc);
      } else {
        // URL — carregar como Image e converter para base64
        try {
          const imgData = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width; canvas.height = img.height;
              canvas.getContext('2d').drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error('Falha ao carregar'));
            img.src = imgSrc;
          });
          fotosCarregadas.push(imgData);
        } catch (e) { fotosCarregadas.push(null); }
      }
    }

    checkPage(60);
    y = pSec(doc, y, 'Registro Fotografico (' + rdo.fotos.length + ' foto' + (rdo.fotos.length > 1 ? 's' : '') + ')');
    const cols = 3, imgW = (CW - 6) / 3, imgH = 44, gapF = 3;
    let photoY = y;
    rdo.fotos.forEach((foto, i) => {
      const imgData = fotosCarregadas[i];
      if (!imgData) return;
      const col = i % cols;
      if (col === 0 && i > 0) photoY += imgH + 12;
      if (photoY + imgH > 268) {
        doc.addPage(); photoY = pHdr(doc, 'Relatorio Diario de Obra', (obra?.nome||'-') + '  -  ' + fmtDt(rdo.data)) + 8;
      }
      const x = M + col * (imgW + gapF);
      doc.setFillColor(230, 232, 236); doc.rect(x + 0.5, photoY + 0.5, imgW, imgH, 'F');
      doc.setFillColor(255, 255, 255); doc.rect(x, photoY, imgW, imgH, 'F');
      doc.setDrawColor(...PX.silver); doc.setLineWidth(0.2); doc.rect(x, photoY, imgW, imgH, 'S');
      try { doc.addImage(imgData, 'JPEG', x + 0.8, photoY + 0.8, imgW - 1.6, imgH - 1.6, '', 'FAST'); }
      catch (e) {
        doc.setFontSize(7); doc.setTextColor(...PX.gray);
        doc.text('[Foto ' + (i + 1) + ']', x + imgW / 2, photoY + imgH / 2, { align: 'center' });
      }
      doc.setFillColor(...PX.navy); doc.roundedRect(x + 2, photoY + 2, 11, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(255, 255, 255);
      doc.text('#' + String(i + 1).padStart(2, '0'), x + 7.5, photoY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...PX.ink);
      const fLabel = (foto.desc || foto.name || 'Foto ' + (i + 1)).substring(0, 32);
      doc.text(fLabel, x + imgW / 2, photoY + imgH + 5, { align: 'center' });
    });
    y = photoY + imgH + 12;
  }

  // ═══════════════════════════════════════════════════════════════
  // ATESTO E ASSINATURA
  // ═══════════════════════════════════════════════════════════════
  checkPage(40);
  y = pSec(doc, y, 'Atesto e Assinatura');
  const sigW = (CW - 4) / 2, sigH = 30;
  const drawSigBox = (bx, by, bw, bh, titulo, conteudo) => {
    doc.setFillColor(250, 251, 253); doc.rect(bx, by, bw, bh, 'F');
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.2); doc.rect(bx, by, bw, bh, 'S');
    doc.setFillColor(...PX.navy); doc.rect(bx, by, bw, 5.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
    doc.text(titulo, bx + 5, by + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...PX.ink);
    doc.text(conteudo, bx + 5, by + 14);
    // Linha de assinatura
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
    doc.line(bx + 5, by + bh - 6, bx + bw - 5, by + bh - 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...PX.lgray);
    doc.text('ASSINATURA', bx + bw / 2, by + bh - 2, { align: 'center' });
  };
  drawSigBox(M, y, sigW, sigH, 'RESPONSAVEL TECNICO', obra?.resp || '-');
  drawSigBox(M + sigW + 4, y, sigW, sigH, 'LOCAL E DATA', (obra?.local || '-') + ',  ' + fmtDt(rdo.data));
  doc.setLineWidth(0.2);

  pFtr(doc);
  doc.save('RDO_' + (obra?.nome || 'obra').replace(/\s/g, '_') + '_' + rdo.data + '.pdf');
  toast('📄', 'RDO exportado (' + (rdo.fotos?.length || 0) + ' foto(s))!');
}
// ─────────────────────────────────────────────────────────────────
// 2. CRONOGRAMA / GANTT
// ─────────────────────────────────────────────────────────────────
function exportGanttPDF() {
  const cronSel=document.getElementById('cron-obra-sel');
  const obraId=cronSel&&cronSel.value?cronSel.value:null;
  const obra = obraId ? DB.obras.find(o=>o.id===obraId) : getObra();
  const ets  = obra ? DB.etapas.filter(e => e.obraId === obra.id) : DB.etapas;
  if (!ets.length) { toast('⚠️', 'Nenhuma etapa cadastrada para a obra selecionada!'); return; }
  const doc = new jsPDF('landscape');
  const PW  = doc.internal.pageSize.getWidth();
  const conc = ets.filter(e => e.pct >= 100).length;
  const pm   = ets.length ? Math.round(ets.reduce((a,e) => a + Number(e.pct||0), 0) / ets.length) : 0;
  const atrs = ets.filter(e => e.status === 'late').length;
  let y = pHdr(doc, 'Cronograma de Obra', (obra?.nome||'Todas as Obras') + '   —   ' + ets.length + ' etapas');
  y += 4;

  // ── 4 KPIs
  const cw = 67, ch = 24, gap = 3;
  pKpi(doc, 9,              y, cw, ch, 'Total de Etapas', String(ets.length), 'planejadas');
  pKpi(doc, 9+cw+gap,       y, cw, ch, 'Avanco Medio',    pm+'%',            'fisico acumulado');
  pKpi(doc, 9+2*(cw+gap),   y, cw, ch, 'Concluidas',      conc+' / '+ets.length, '100% executadas');
  pKpi(doc, 9+3*(cw+gap),   y, cw, ch, 'Com Atraso',      String(atrs),      atrs ? 'requerem atencao' : 'sem atrasos');
  y += ch + 7;

  // ── Barra de progresso geral
  y = pSec(doc, y, 'Progresso Geral da Obra', null, PW);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
  doc.text('Avanco fisico medio: ' + pm + '%', 9, y);
  pBar(doc, 9, y+3, PW-30, 5, pm);
  y += 14;

  // ── Tabela de etapas
  y = pSec(doc, y, 'Detalhamento das Etapas', null, PW);
  const SM = { plan:'Planejado', prog:'Em Andamento', done:'Concluido', late:'Atrasado' };
  doc.autoTable({
    startY: y,
    head: [['No.','Etapa / Atividade','Status','%','Inicio','Termino','Responsavel','Observacoes']],
    body: ets.map((e,i) => [
      i+1, e.nome, SM[e.status]||'—', e.pct+'%',
      e.inicio ? fmtDt(e.inicio) : '—',
      e.fim    ? fmtDt(e.fim)    : '—',
      e.resp||'—', e.obs||'—'
    ]),
    foot: [['','MEDIA GERAL','',pm+'%','','','','']],
    theme: 'striped',
    headStyles: hStyle(),
    footStyles: { ...totRow() },
    bodyStyles: bStyle(),
    alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', textColor: PX.gray },
      1: { cellWidth: 75, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 45 },
      7: { cellWidth: 57 }
    },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 2) {
        const t = d.cell.text[0];
        if      (t === 'Atrasado')     { d.cell.styles.textColor = PX.red;   d.cell.styles.fontStyle = 'bold'; }
        else if (t === 'Concluido')    { d.cell.styles.textColor = PX.green; d.cell.styles.fontStyle = 'bold'; }
        else if (t === 'Em Andamento') { d.cell.styles.textColor = PX.blue; }
      }
      if (d.section === 'body' && d.column.index === 3) {
        const v = parseInt(d.cell.text[0]);
        d.cell.styles.textColor = v >= 100 ? PX.green : v >= 50 ? PX.ink : PX.amber;
      }
    },
    margin: { left: 9, right: 9 }
  });

  pFtr(doc);
  doc.save('Cronograma_' + (obra?.nome?.replace(/\s/g,'_')||'Obras') + '.pdf');
  toast('📄', 'Cronograma exportado com sucesso!');
}
// ─────────────────────────────────────────────────────────────────
// 3. FOLHA DE PAGAMENTO
// ─────────────────────────────────────────────────────────────────
function exportFolhaPDF() {
  const rows = window._folhaRows;
  if (!rows?.length) { toast('⚠️', 'Calcule a folha primeiro!'); goPage('equipe'); return; }
  const p     = window._folhaPer;
  const obraId = document.getElementById('fol-obra')?.value;
  const oNome  = obraId ? DB.obras.find(x => x.id == obraId)?.nome : 'Todas as Obras';
  const totDias = rows.reduce((a,r) => a + r.totalDias, 0);
  const totVal  = rows.reduce((a,r) => a + r.total,    0);
  const doc = new jsPDF();
  let y = pHdr(doc, 'Folha de Pagamento', fmtDt(p?.de||'') + ' a ' + fmtDt(p?.ate||'') + '   —   ' + oNome);
  y += 4;

  // ── 4 KPIs
  const cw = 45, ch = 24, gap = 2;
  pKpi(doc, 9,             y, cw, ch, 'Colaboradores',  String(rows.length),            'no periodo');
  pKpi(doc, 9+cw+gap,      y, cw, ch, 'Total de Diarias', totDias%1===0?String(totDias):totDias.toFixed(1), 'dias trabalhados');
  pKpi(doc, 9+2*(cw+gap),  y, cw, ch, 'Media por Diaria', rows.length&&totDias ? fmtR(totVal/totDias) : '—', 'valor medio');
  pKpi(doc, 9+3*(cw+gap),  y, cw, ch, 'Total a Pagar',  fmtR(totVal),                  'valor bruto');
  y += ch + 8;

  // ── Tabela de colaboradores
  y = pSec(doc, y, 'Detalhamento por Colaborador');
  doc.autoTable({
    startY: y,
    head: [['No.','Nome','Funcao','CPF','Diaria','Dias','Meias','Total']],
    body: rows.map((r,i) => [
      i+1, r.col.nome, r.col.funcao||'—', r.col.cpf||'—',
      fmtR(r.diaria), String(r.diasInt||0),
      r.meias ? r.meias+'x 1/2' : '—',
      fmtR(r.total)
    ]),
    foot: [['','TOTAL GERAL','','','',String(totDias%1===0?totDias:totDias.toFixed(1)),'',fmtR(totVal)]],
    theme: 'striped',
    headStyles: hStyle(),
    footStyles: { ...totRow() },
    bodyStyles: bStyle(),
    alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', textColor: PX.gray },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 9, right: 9 }
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Recibos de assinatura
  if (y > 228) { doc.addPage(); y = pHdr(doc, 'Folha — Recibos de Pagamento', oNome) + 10; }
  y = pSec(doc, y, 'Recibos de Pagamento');
  const sigW = 89, sigH = 28, sigGap = 13;
  let recY = y;
  rows.forEach((r, i) => {
    if (i > 0 && i % 8 === 0) {
      doc.addPage(); recY = pHdr(doc, 'Folha — Recibos (cont.)', oNome) + 12;
      recY = pSec(doc, recY, 'Recibos (continuacao)');
    }
    const col = i % 2;
    if (col === 0 && i > 0) recY += sigH + 5;
    const rx = col === 0 ? 9 : 9 + sigW + sigGap;
    doc.setFillColor(...PX.bg);  doc.rect(rx, recY, sigW, sigH, 'F');
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.25); doc.rect(rx, recY, sigW, sigH, 'S');
    doc.setFillColor(...PX.navy); doc.rect(rx, recY, sigW, 5.5, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
    doc.text(r.col.nome.substring(0,24), rx+4, recY+4.2);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
    doc.text((r.col.funcao||'—') + '  |  ' + (r.diasInt||0) + ' dias + ' + (r.meias||0) + ' meias', rx+4, recY+12);
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...PX.ink);
    doc.text('Total: ' + fmtR(r.total), rx+4, recY+20);
    doc.setDrawColor(...PX.lgray); doc.setLineWidth(0.4);
    doc.line(rx+4, recY+sigH-3, rx+sigW-4, recY+sigH-3);
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...PX.lgray);
    doc.text('Assinatura', rx+4, recY+sigH-0.5);
    doc.setLineWidth(0.2);
  });

  pFtr(doc);
  doc.save('Folha_Pagamento_' + (p?.de||'periodo') + '.pdf');
  toast('📄', 'Folha de Pagamento gerada com sucesso!');
}
// ─────────────────────────────────────────────────────────────────
// 4. DRE — DEMONSTRATIVO FINANCEIRO
// ─────────────────────────────────────────────────────────────────
function exportFinPDF() {
  const lans = DB.lancs.filter(l => {
    if (_finFiltros.obra !== null && !_finFiltros.obra.has(String(l.obraId))) return false;
    if (_finFiltros.tipo !== null && !_finFiltros.tipo.has(l.tipo||'—'))       return false;
    if (_finFiltros.cat  !== null && !_finFiltros.cat.has(l.cat||'—'))         return false;
    if (_finFiltros.cc   !== null && !_finFiltros.cc.has(l.cc||'—'))           return false;
    if (_finFiltros.forn !== null && !_finFiltros.forn.has(l.forn||'—'))       return false;
    if (_finFiltros.dataIni && l.data < _finFiltros.dataIni) return false;
    if (_finFiltros.dataFim && l.data > _finFiltros.dataFim) return false;
    return true;
  });
  if (!lans.length) { toast('⚠️', 'Nenhum lancamento nos filtros atuais!'); return; }

  const dep   = lans.filter(l => l.tipo==='Despesa').reduce((a,l) => a+Number(l.valor), 0);
  const nDep  = lans.filter(l => l.tipo==='Despesa').length;
  const nTotal = lans.length;

  const doc = new jsPDF();
  let y = pHdr(doc, 'Relatorio Financeiro de Obra', nTotal + ' lancamentos   —   ' + new Date().toLocaleDateString('pt-BR'));
  y += 4;

  // ── 3 KPIs
  const cw = 62, ch = 24, gap = 2;
  pKpi(doc, 9,           y, cw, ch, 'Total de Despesas', fmtR(dep),   nDep+' lancamentos');
  const obraFiltro = _finFiltros.obra ? DB.obras.find(o=>_finFiltros.obra.has(String(o.id))) : null;
  const orc = obraFiltro ? obraFiltro.orc||0 : DB.obras.reduce((a,o)=>a+Number(o.orc||0),0);
  const saldoOrc = orc - dep;
  pKpi(doc, 9+cw+gap,    y, cw, ch, 'Orcamento', fmtR(orc),  orc>0 ? 'previsto' : 'nao informado');
  pKpi(doc, 9+2*(cw+gap),y, cw, ch, 'Saldo Orcamentario',  fmtR(saldoOrc), saldoOrc>=0 ? 'Dentro do orcado' : 'Acima do orcado');
  y += ch + 8;

  // ── Resumo por categoria
  y = pSec(doc, y, 'Resumo por Categoria');
  const m2Obra = obraFiltro ? Number(obraFiltro.m2||0) : DB.obras.reduce((a,o)=>a+Number(o.m2||0),0);
  const catsData = [...new Set(lans.filter(l=>l.tipo==='Despesa').map(l => l.cat||'Sem Categoria'))].map(cat => {
    const d2 = lans.filter(l => l.cat===cat && l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
    const custoM2 = m2Obra>0 ? d2/m2Obra : 0;
    return {cat, d2, custoM2};
  }).sort((a,b) => b.d2 - a.d2);
  doc.autoTable({
    startY: y,
    head: [['Categoria', 'Valor (R$)', 'R$/m²', '% do Total']],
    body: [
      ...catsData.map(c => [c.cat, fmtR(c.d2), m2Obra>0 ? fmtR(c.custoM2) : '—', dep>0 ? (c.d2/dep*100).toFixed(2)+'%' : '0.00%']),
      ['TOTAL GERAL', fmtR(dep), m2Obra>0 ? fmtR(dep/m2Obra) : '—', '100.00%']
    ],
    theme: 'striped',
    headStyles: hStyle(),
    bodyStyles: bStyle(),
    alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' }
    },
    didParseCell: (d) => {
      if (d.section === 'body' && d.row.index === catsData.length) {
        d.cell.styles.fillColor   = PX.navy;
        d.cell.styles.textColor   = [255,255,255];
        d.cell.styles.fontStyle   = 'bold';
      }
    },
    margin: { left: 9, right: 9 }
  });
  y = doc.lastAutoTable.finalY + 9;

  // ── Lançamentos detalhados
  if (y > 215) { doc.addPage(); y = pHdr(doc, 'Relatorio Financeiro — Lancamentos', 'Continuacao') + 8; }
  y = pSec(doc, y, 'Lancamentos Detalhados');
  doc.autoTable({
    startY: y,
    head: [['Data', 'Descricao', 'Obra', 'Categoria', 'Fornecedor', 'Valor (R$)']],
    body: lans.filter(l=>l.tipo==='Despesa').sort((a,b) => b.data.localeCompare(a.data)).map(l => {
      const o = DB.obras.find(x => x.id == l.obraId);
      return [
        fmtDt(l.data),
        (l.desc||'—').substring(0,40),
        (o?.nome||'—').substring(0,18),
        (l.cat||'—').substring(0,18),
        (l.forn||'—').substring(0,18),
        fmtR(Number(l.valor))
      ];
    }),
    theme: 'striped',
    headStyles: hStyle(),
    bodyStyles: bStyle(),
    alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 9, right: 9 }
  });

  pFtr(doc);
  doc.save('DRE_Financeiro_ObraTech.pdf');
  toast('📄', 'DRE Financeiro exportado com sucesso!');
}
// ─────────────────────────────────────────────────────────────────
// 5. QUALIDADE — NAO CONFORMIDADES
// ─────────────────────────────────────────────────────────────────
function exportQualPDF() {
  if (!DB.ncs.length) { toast('⚠️', 'Nenhuma NC registrada!'); return; }
  const total = DB.ncs.length;
  const ab    = DB.ncs.filter(n => n.status !== 'Fechada').length;
  const alta  = DB.ncs.filter(n => n.grau === 'Alta').length;
  const venc  = DB.ncs.filter(n => n.status !== 'Fechada' && n.prazo && new Date(n.prazo) < new Date()).length;
  const doc   = new jsPDF();
  let y = pHdr(doc, 'Relatorio de Qualidade', total + ' nao conformidades   —   ' + new Date().toLocaleDateString('pt-BR'));
  y += 4;

  // ── 4 KPIs
  const cw = 45, ch = 24, gap = 2;
  pKpi(doc, 9,             y, cw, ch, 'Total de NCs',  String(total), 'registradas');
  pKpi(doc, 9+cw+gap,      y, cw, ch, 'NCs Abertas',   String(ab),   ab ? 'pendentes de acao' : 'nenhuma pendente');
  pKpi(doc, 9+2*(cw+gap),  y, cw, ch, 'Grau Alto',     String(alta), alta ? 'criticas' : 'nenhuma critica');
  pKpi(doc, 9+3*(cw+gap),  y, cw, ch, 'Prazo Vencido', String(venc), venc ? 'atencao imediata' : 'todos no prazo');
  y += ch + 8;

  // ── NCs criticas abertas
  const ncsAlta = DB.ncs.filter(n => n.grau === 'Alta' && n.status !== 'Fechada');
  if (ncsAlta.length) {
    y = pSec(doc, y, 'NCs Criticas — Grau Alto (Abertas)');
    doc.autoTable({
      startY: y,
      head: [['No.','Obra','Etapa','Descricao','Prazo','Responsavel','Status']],
      body: ncsAlta.map(n => {
        const o = DB.obras.find(x => x.id == n.obraId);
        return [String(n.numero||'—'), (o?.nome||'—').substring(0,14), (n.etapa||'—').substring(0,12),
          (n.desc||'—').substring(0,40), n.prazo ? fmtDt(n.prazo) : '—',
          (n.resp||'—').substring(0,14), n.status];
      }),
      theme: 'plain',
      headStyles: hStyle(),
      bodyStyles: { ...bStyle(), minCellHeight: 10 },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center', textColor: PX.gray },
        1: { cellWidth: 28 },
        2: { cellWidth: 24 },
        3: { cellWidth: 52 },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 28 },
        6: { cellWidth: 28, halign: 'center' }
      },
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index === 6) {
          if (d.cell.text[0] === 'Aberta')       d.cell.styles.textColor = PX.red;
          if (d.cell.text[0] === 'Em andamento') d.cell.styles.textColor = PX.amber;
        }
      },
      margin: { left: 9, right: 9 }
    });
    y = doc.lastAutoTable.finalY + 9;
  }

  // ── Listagem completa
  if (y > 200) { doc.addPage(); y = pHdr(doc, 'Qualidade — Listagem Completa', 'Continuacao') + 8; }
  y = pSec(doc, y, 'Listagem Completa de Nao Conformidades');
  doc.autoTable({
    startY: y,
    head: [['No.','Obra','Etapa','Descricao','Prazo','Grau','Responsavel','Status']],
    body: DB.ncs.map(n => {
      const o = DB.obras.find(x => x.id == n.obraId);
      return [String(n.numero||'—'), (o?.nome||'—').substring(0,13), (n.etapa||'—').substring(0,11),
        (n.desc||'—').substring(0,36), n.prazo ? fmtDt(n.prazo) : '—',
        n.grau||'Baixa', (n.resp||'—').substring(0,13), n.status];
    }),
    theme: 'striped',
    headStyles: hStyle(),
    bodyStyles: bStyle(),
    alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', textColor: PX.gray },
      1: { cellWidth: 27 },
      2: { cellWidth: 23 },
      3: { cellWidth: 47 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 27 },
      7: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (d) => {
      if (d.section === 'body') {
        if (d.column.index === 5) {
          if (d.cell.text[0]==='Alta')  { d.cell.styles.textColor = PX.red;   d.cell.styles.fontStyle = 'bold'; }
          if (d.cell.text[0]==='Media')   d.cell.styles.textColor = PX.amber;
        }
        if (d.column.index === 7) {
          if (d.cell.text[0]==='Fechada')  { d.cell.styles.textColor = PX.green; d.cell.styles.fontStyle = 'bold'; }
          if (d.cell.text[0]==='Aberta')     d.cell.styles.textColor = PX.red;
        }
      }
    },
    margin: { left: 9, right: 9 }
  });

  pFtr(doc);
  doc.save('Qualidade_NCs_ObraTech.pdf');
  toast('📄', 'Relatorio de Qualidade exportado com sucesso!');
}
function exportRDOsLote(){
  const oId  = document.getElementById('rel-obra').value;
  const de   = document.getElementById('rel-de').value;
  const ate  = document.getElementById('rel-ate').value;
  const rdos = DB.rdos.filter(r =>
    (!oId || r.obraId == oId) &&
    (!de  || r.data >= de)    &&
    (!ate || r.data <= ate)   &&
    r.status === 'finalizado'
  );
  if (!rdos.length) { toast('⚠️','Nenhum RDO finalizado no periodo!'); return; }

  const doc = new jsPDF(); let first = true;
  rdos.slice().sort((a,b) => a.data.localeCompare(b.data)).forEach(rdo => {
    if (!first) doc.addPage(); first = false;
    const obra = DB.obras.find(o => o.id == rdo.obraId);
    let y = pHdr(doc, 'Relatorio Diario de Obra', (obra?.nome||'—') + '   —   ' + fmtDt(rdo.data));
    y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
    doc.text('Clima: ' + (rdo.clima||'—') + '     Responsavel: ' + (obra?.resp||'—'), 9, y+4);
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3); doc.line(9, y+7, 201, y+7);
    y += 13;
    doc.autoTable({
      startY: y,
      head: [['Campo', 'Informacao']],
      body: [
        ['Servicos Executados',     rdo.serv||'Nao informado.'],
        ['Ocorrencias / Observacoes', rdo.obs||'Nenhuma.'],
        ['Materiais Recebidos',     rdo.mat||'Sem recebimentos.'],
      ],
      theme: 'plain', headStyles: hStyle(), bodyStyles: { ...bStyle(), minCellHeight: 10, valign: 'top' },
      columnStyles: { 0: { cellWidth: 50, fontStyle:'bold', fillColor: PX.bg, textColor: PX.gray }, 1: { cellWidth: 142 } },
      margin: { left: 9, right: 9 }
    });
  });
  pFtr(doc);
  doc.save('RDOs_' + (de||'todos') + '_' + (ate||'hoje') + '.pdf');
  toast('📄', rdos.length + ' RDO(s) exportados com sucesso!');
}
// ══════════════════════════════════════════════
// CUSTO POR M²
// ══════════════════════════════════════════════
function abrirRelCustoM2(){
  goPage('relatorios');
  const painel=document.getElementById('rel-m2-painel');
  if(painel)painel.style.display='block';
  setTimeout(()=>{
    const sel=document.getElementById('m2-obra-sel');
    if(sel){
      sel.innerHTML='<option value="">— Selecione a obra —</option>'+
        DB.obras.map(o=>`<option value="${o.id}">${o.nome}${o.m2?' ('+o.m2+' m²)':' ⚠ sem m²'}</option>`).join('');
      if(DB.sel)sel.value=DB.sel;
    }
    renderCustoM2();
  },80);
}

function calcCustoM2Data(obraId){
  const obra=DB.obras.find(o=>o.id==obraId);
  if(!obra)return null;
  const m2=Number(obra.m2)||0;
  const lancs=DB.lancs.filter(l=>l.obraId==obraId&&l.tipo==='Despesa');
  const totalGeral=lancs.reduce((a,l)=>a+Number(l.valor),0);

  // Por Categoria
  const catSet=[...new Set(lancs.map(l=>l.cat||'Sem Categoria'))].sort();
  const porCat=catSet.map(cat=>{
    const vs=lancs.filter(l=>(l.cat||'Sem Categoria')===cat);
    const total=vs.reduce((a,l)=>a+Number(l.valor),0);
    return{cat,total,pct:totalGeral?Math.round(total/totalGeral*100):0,m2val:m2?total/m2:0,qtd:vs.length};
  }).sort((a,b)=>b.total-a.total);

  // Por Etapa
  const etapas=DB.etapas.filter(e=>e.obraId==obraId);
  const porEtapa=etapas.map(et=>{
    const vs=lancs.filter(l=>l.etapa===et.nome||l.etapa===String(et.id));
    const total=vs.reduce((a,l)=>a+Number(l.valor),0);
    return{etapa:et.nome,total,pct:totalGeral?Math.round(total/totalGeral*100):0,m2val:m2?total/m2:0,pctFisico:et.pct||0};
  }).filter(e=>e.total>0).sort((a,b)=>b.total-a.total);

  return{obra,m2,totalGeral,porCat,porEtapa,custoM2Geral:m2?totalGeral/m2:0};
}

function renderCustoM2(){
  const obraId=document.getElementById('m2-obra-sel')?.value;
  const el=document.getElementById('m2-content');
  if(!obraId){if(el)el.innerHTML='<div class="t-empty">Selecione uma obra acima.</div>';return;}
  const d=calcCustoM2Data(obraId);
  if(!d){if(el)el.innerHTML='<div class="t-empty">Obra não encontrada.</div>';return;}

  const semM2=!d.m2;
  const aviso=semM2?`<div class="al w" style="margin-bottom:11px"><span>⚠️</span><span>Esta obra não tem m² cadastrado. <button class="btn sm" onclick="openModal('obra','${d.obra.id}')">✏️ Editar obra</button></span></div>`:'';

  const barHtml=(pct,cor)=>`<div style="flex:1;background:var(--bg3);border-radius:3px;height:7px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${cor};border-radius:3px"></div></div>`;
  const CORES=['#5b8ff9','#f4a623','#18a84d','#d94040','#a855f7','#ec4899','#14b8a6','#f97316'];

  el.innerHTML=aviso+`
  <div class="g g4" style="margin-bottom:14px">
    <div class="kpi" style="border-color:rgba(244,166,35,.4)">
      <div class="kl">📐 Área Total</div>
      <div class="kv" style="color:var(--accent)">${d.m2?d.m2+' m²':'—'}</div>
      <div class="kd neu">${d.obra.tipo||'—'}</div>
    </div>
    <div class="kpi">
      <div class="kl">💸 Total Despesas</div>
      <div class="kv" style="color:var(--red)">${fmtR(d.totalGeral)}</div>
      <div class="kd neu">${d.porCat.length} categorias</div>
    </div>
    <div class="kpi" style="border-color:rgba(244,166,35,.4)">
      <div class="kl">📊 Custo/m² Realizado</div>
      <div class="kv" style="color:var(--accent)">${d.m2?fmtR(d.custoM2Geral)+'/m²':'—'}</div>
      <div class="kd neu">sobre ${d.totalGeral>0?d.porCat.reduce((a,r)=>a+r.qtd,0)+' lançamentos':'sem dados'}</div>
    </div>
    <div class="kpi">
      <div class="kl">🎯 Orçado/m²</div>
      <div class="kv" style="color:${d.obra.orc&&d.m2?(d.custoM2Geral>d.obra.orc/d.m2?'var(--red)':'var(--green)'):'var(--txt3)'}">${d.obra.orc&&d.m2?fmtR(d.obra.orc/d.m2)+'/m²':'—'}</div>
      <div class="kd ${d.obra.orc&&d.m2&&d.custoM2Geral>d.obra.orc/d.m2?'dn':'up'}">${d.obra.orc&&d.m2?(d.custoM2Geral<=d.obra.orc/d.m2?'✓ Dentro do orçamento':'⚠ Acima do orçado'):'—'}</div>
    </div>
  </div>

  <div class="g g2" style="margin-bottom:14px">
    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--txt)">🗂️ Por Categoria</div>
      ${d.porCat.map((r,i)=>`
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:11px;font-weight:600">${r.cat}</span>
            <span style="font-size:10px;color:var(--txt3)">${r.qtd} lanç. · ${r.pct}%</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            ${barHtml(r.pct,CORES[i%CORES.length])}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px">
            <span style="font-size:10px;color:var(--txt3)">${fmtR(r.total)}</span>
            <span style="font-size:11px;font-weight:700;color:var(--accent)">${d.m2?fmtR(r.m2val)+'/m²':'—'}</span>
          </div>
        </div>`).join('')}
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--txt)">🏗️ Por Etapa Construtiva</div>
      ${d.porEtapa.length?d.porEtapa.map((r,i)=>`
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:11px;font-weight:600">${r.etapa}</span>
            <span style="font-size:10px;color:var(--txt3)">${r.pct}% gasto · ${r.pctFisico}% físico</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            ${barHtml(r.pct,'var(--primary)')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px">
            <span style="font-size:10px;color:var(--txt3)">${fmtR(r.total)}</span>
            <span style="font-size:11px;font-weight:700;color:var(--accent)">${d.m2?fmtR(r.m2val)+'/m²':'—'}</span>
          </div>
        </div>`).join('')
      :'<div class="t-empty" style="padding:10px 0;font-size:11px">Nenhum lançamento vinculado a etapas.<br>Use o campo <strong>Etapa</strong> ao registrar despesas.</div>'}
    </div>
  </div>

`;
}


function exportCustoM2XLS(){
  const obraId=document.getElementById('m2-obra-sel')?.value;
  if(!obraId){toast('⚠️','Selecione uma obra!');return;}
  const d=calcCustoM2Data(obraId);if(!d){return;}
  const wb=XLSX.utils.book_new();
  // Aba 1 — Por Categoria
  const ws1=XLSX.utils.aoa_to_sheet([
    [`CUSTO POR M² — ${d.obra.nome}`],
    [`Área: ${d.m2||'—'} m²   |   Total: ${fmtR(d.totalGeral)}   |   Custo/m²: ${d.m2?fmtR(d.custoM2Geral):'—'}`],
    [],
    ['Categoria','Total Gasto (R$)','% do Total','Custo por m²','Qtd Lançamentos'],
    ...d.porCat.map(r=>[r.cat,r.total,r.pct/100,d.m2?r.m2val:0,r.qtd]),
    [],
    ['TOTAL',d.totalGeral,1,d.m2?d.custoM2Geral:0,d.porCat.reduce((a,r)=>a+r.qtd,0)]
  ]);
  ws1['!cols']=[{wch:24},{wch:16},{wch:12},{wch:16},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws1,'Por Categoria');
  // Aba 2 — Por Etapa
  if(d.porEtapa.length){
    const ws2=XLSX.utils.aoa_to_sheet([
      ['Etapa','Total Gasto (R$)','% do Total','Custo/m²','% Físico Concluído'],
      ...d.porEtapa.map(r=>[r.etapa,r.total,r.pct/100,d.m2?r.m2val:0,r.pctFisico/100])
    ]);
    ws2['!cols']=[{wch:28},{wch:16},{wch:12},{wch:16},{wch:20}];
    XLSX.utils.book_append_sheet(wb,ws2,'Por Etapa');
  }
  // Aba 3 — Lançamentos detalhados
  const lDet=DB.lancs.filter(l=>l.obraId==obraId&&l.tipo==='Despesa');
  const ws3=XLSX.utils.aoa_to_sheet([
    ['Data','Descrição','Categoria','Centro de Custo','Etapa','Fornecedor','NF','Valor (R$)','Custo/m²'],
    ...lDet.sort((a,b)=>a.data.localeCompare(b.data)).map(l=>[
      fmtDt(l.data),l.desc,l.cat||'—',l.cc||'—',l.etapa||'—',l.forn||'—',l.nf||'—',
      Number(l.valor),d.m2?Number(l.valor)/d.m2:0
    ])
  ]);
  ws3['!cols']=[{wch:10},{wch:30},{wch:18},{wch:16},{wch:20},{wch:18},{wch:10},{wch:14},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws3,'Lançamentos');
  XLSX.writeFile(wb,`CustoM2_${d.obra.nome.replace(/\s/g,'_')}.xlsx`);
  toast('📊','Excel gerado com 3 abas: Categoria, Etapa, Lançamentos!');
}


// ─────────────────────────────────────────────────────────────────
// 6. CUSTO POR M²
// ─────────────────────────────────────────────────────────────────
function exportCustoM2PDF() {
  const obraId = document.getElementById('m2-obra-sel')?.value;
  if (!obraId) { toast('⚠️','Selecione uma obra!'); return; }
  const d = calcCustoM2Data(obraId); if (!d) { return; }
  const orcM2 = d.m2 && d.obra.orc ? d.obra.orc / d.m2 : 0;
  const acima = orcM2 && d.custoM2Geral > orcM2;

  const doc = new jsPDF();
  let y = pHdr(doc, 'Analise de Custo por m2', d.obra.nome + '   —   ' + (d.m2||'—') + ' m2');
  y += 4;

  // ── 4 KPIs
  const cw = 45, ch = 24, gap = 2;
  pKpi(doc, 9,             y, cw, ch, 'Area Total',      (d.m2||'—')+' m2',       d.obra.tipo||'—');
  pKpi(doc, 9+cw+gap,      y, cw, ch, 'Total Despesas',  fmtR(d.totalGeral),       d.porCat.length+' categorias');
  pKpi(doc, 9+2*(cw+gap),  y, cw, ch, 'Custo Realiz./m2',d.m2 ? fmtR(d.custoM2Geral)+'/m2' : '—',
    acima ? 'Acima do orcado' : (orcM2 ? 'Dentro do orcado' : '—'));
  pKpi(doc, 9+3*(cw+gap),  y, cw, ch, 'Orcado/m2',       orcM2 ? fmtR(orcM2)+'/m2' : '—',
    d.obra.orc ? fmtR(d.obra.orc) : 'Orcamento nao informado');
  y += ch + 8;

  // ── Comparativo realizado vs orcado
  if (orcM2 && d.custoM2Geral) {
    y = pSec(doc, y, 'Comparativo Realizado vs Orcado por m2');
    const maxV = Math.max(orcM2, d.custoM2Geral) * 1.12;
    const bw   = 175;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
    doc.text('Orcado: ' + fmtR(orcM2) + '/m2', 9, y);
    pBar(doc, 9, y+3, bw*(orcM2/maxV), 5, 100);
    doc.text('Realizado: ' + fmtR(d.custoM2Geral) + '/m2', 9, y+12);
    pBar(doc, 9, y+15, bw*(d.custoM2Geral/maxV), 5, 100);
    y += 26;
  }

  // ── Por categoria — barras visuais + valor total
  y = pSec(doc, y, 'Custo por Categoria');
  const barW = 150;
  d.porCat.forEach(r => {
    if (y > 268) { doc.addPage(); y = pHdr(doc,'Analise de Custo por m2',d.obra.nome) + 8; }
    // Nome + lançamentos + custo/m²
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...PX.ink);
    doc.text(r.cat, 9, y+4);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...PX.gray);
    doc.text(r.qtd+' lanç. · '+r.pct+'%', 9+70, y+4);
    if(d.m2) doc.text(fmtR(r.m2val)+'/m²', 9+barW+14, y+4, {align:'right'});
    // Valor
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...PX.ink);
    doc.text(fmtR(r.total), 9, y+10);
    // Barra
    const pct = r.pct||0;
    doc.setFillColor(...PX.silver); doc.rect(9, y+12, barW, 3.5, 'F');
    if(pct>0){ doc.setFillColor(...PX.blue); doc.rect(9, y+12, barW*pct/100, 3.5, 'F'); }
    y += 20;
  });
  // Total geral em destaque
  y += 3;
  if(y > 272){ doc.addPage(); y = pHdr(doc,'Analise de Custo por m2',d.obra.nome) + 8; }
  doc.setFillColor(...PX.navy); doc.rect(9, y, 192, 11, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(255,255,255);
  doc.text('VALOR TOTAL GASTO', 14, y+8);
  doc.text(fmtR(d.totalGeral), 196, y+8, {align:'right'});
  if(d.m2){ doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...PX.lgray); doc.text(fmtR(d.custoM2Geral)+'/m²  ·  '+d.porCat.reduce((a,r)=>a+r.qtd,0)+' lançamentos', 125, y+8); }
  y += 17;

  // ── Por etapa
  if (d.porEtapa.length) {
    if (y > 215) { doc.addPage(); y = pHdr(doc, 'Custo/m2 — Por Etapa', d.obra.nome) + 8; }
    y = pSec(doc, y, 'Custo por Etapa Construtiva');
    doc.autoTable({
      startY: y,
      head: [['Etapa','Total Gasto (R$)','% do Total','Custo/m2','% Fisico']],
      body: d.porEtapa.map(r => [r.etapa, fmtR(r.total), r.pct+'%', d.m2 ? fmtR(r.m2val)+'/m2' : '—', r.pctFisico+'%']),
      theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 36, halign: 'right' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 9, right: 9 }
    });
    y = doc.lastAutoTable.finalY + 9;
  }

  doc.setFont('helvetica','italic'); doc.setFontSize(6.5); doc.setTextColor(...PX.lgray);
  doc.text('* Valores baseados nos lancamentos de despesa registrados. Area: '+(d.m2||'—')+' m2 conforme cadastro da obra.', 9, Math.min(y+4, 280));

  pFtr(doc);
  doc.save('CustoM2_' + d.obra.nome.replace(/\s/g,'_') + '.pdf');
  toast('📄', 'Analise Custo/m2 exportada com sucesso!');
}
// ─────────────────────────────────────────────────────────────────
// 7. RELATORIO GERENCIAL EXECUTIVO
// ─────────────────────────────────────────────────────────────────
function exportMovsPDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const PX={blue:[25,70,150],ink:[15,15,15],gray:[100,106,120],lgray:[170,175,185],silver:[218,220,225],bg:[246,247,249],white:[255,255,255],green:[22,101,52],amber:[120,53,15],red:[153,27,27]};Object.defineProperty(PX,'navy',{get:function(){return corEmpresa();},enumerable:true});
  const W=doc.internal.pageSize.getWidth();
  const H=doc.internal.pageSize.getHeight();
  const ml=14,mr=14,cw=W-ml-mr;

  // Filtros ativos na tela
  const oId=document.getElementById('mov-filtro-obra')?.value||'';
  const tipo=document.getElementById('mov-filtro-tipo')?.value||'';
  const mat=(document.getElementById('mov-filtro-mat')?.value||'').toLowerCase();
  let movs=DB.movs.slice();
  if(oId) movs=movs.filter(m=>String(m.obraId)===oId);
  if(tipo) movs=movs.filter(m=>m.tipo===tipo);
  if(mat) movs=movs.filter(m=>(DB.estoque.find(x=>x.id===m.estId)?.material||'').toLowerCase().includes(mat));
  movs.sort((a,b)=>b.data.localeCompare(a.data));

  if(!movs.length){toast('⚠️','Nenhuma movimentação para exportar!');return;}

  const obra=oId?DB.obras.find(o=>String(o.id)===oId):null;
  const totEnt=movs.filter(m=>m.tipo==='Entrada').reduce((a,m)=>a+Number(m.qtd),0);
  const totSai=movs.filter(m=>m.tipo==='Saida').reduce((a,m)=>a+Number(m.qtd),0);
  const today=new Date().toLocaleDateString('pt-BR');

  // ── CABEÇALHO ──────────────────────────────────────────────────
  function pHdr(pg){
    doc.setPage(pg);
    doc.setFillColor(...PX.navy);
    doc.rect(0,0,W,20,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...PX.white);
    doc.text('RELATÓRIO DE MOVIMENTAÇÕES DE ESTOQUE',ml,13);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...PX.lgray);
    doc.text(obra?obra.nome:'Todas as obras',W-mr,8,{align:'right'});
    doc.text('Emitido em '+today,W-mr,14,{align:'right'});
  }
  function pFtr(pg,tot){
    doc.setPage(pg);
    doc.setDrawColor(...PX.silver);doc.setLineWidth(0.3);
    doc.line(ml,H-8,W-mr,H-8);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(...PX.lgray);
    doc.text('ObraTech — Sistema de Gestão de Obras',ml,H-4);
    doc.text('Página '+pg+' de '+tot,W-mr,H-4,{align:'right'});
  }

  pHdr(1);
  let y=26;

  // ── KPIs ────────────────────────────────────────────────────────
  const kpis=[
    {l:'Total de Movimentos',v:String(movs.length),c:PX.ink},
    {l:'Entradas',v:totEnt.toFixed(2)+' un',c:PX.green},
    {l:'Saídas',v:totSai.toFixed(2)+' un',c:PX.red},
    {l:'Saldo Líquido',v:(totEnt-totSai).toFixed(2)+' un',c:(totEnt-totSai)>=0?PX.green:PX.red}
  ];
  const kw=(cw-9)/4;
  kpis.forEach((k,i)=>{
    const kx=ml+i*(kw+3);
    doc.setFillColor(...PX.white);doc.setDrawColor(...PX.silver);doc.setLineWidth(0.3);
    doc.rect(kx,y,kw,14,'FD');
    doc.setFillColor(...k.c);doc.rect(kx,y,kw,1.5,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...PX.gray);
    doc.text(k.l,kx+kw/2,y+6,{align:'center'});
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...k.c);
    doc.text(k.v,kx+kw/2,y+12,{align:'center'});
  });
  y+=19;

  // ── FILTROS APLICADOS ───────────────────────────────────────────
  if(obra||tipo||mat){
    doc.setFont('helvetica','italic');doc.setFontSize(7.5);doc.setTextColor(...PX.gray);
    let fText='Filtros: ';
    if(obra) fText+='Obra: '+obra.nome+'  ';
    if(tipo) fText+=tipo+'s apenas  ';
    if(mat) fText+='Material contém: "'+mat+'"';
    doc.text(fText,ml,y);
    y+=6;
  }

  // ── TABELA PRINCIPAL ─────────────────────────────────────────────
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...PX.ink);
  doc.setFillColor(...PX.navy);doc.rect(ml,y,cw,1.5,'F');
  doc.text('Detalhamento das Movimentações',ml,y-1.5);
  y+=4;

  // Cabeçalhos
  const cols=[
    {h:'Data',w:22,a:'center'},
    {h:'Material',w:52,a:'left'},
    {h:'Obra',w:42,a:'left'},
    {h:'Tipo',w:18,a:'center'},
    {h:'Qtd',w:18,a:'right'},
    {h:'Un',w:12,a:'center'},
    {h:'NF / Ref.',w:26,a:'left'},
    {h:'Observação',w:W-ml-mr-22-52-42-18-18-12-26-6,a:'left'}
  ];
  const hH=7;
  doc.setFillColor(...PX.navy);doc.rect(ml,y,cw,hH,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...PX.white);
  let cx=ml+2;
  cols.forEach(col=>{doc.text(col.h,col.a==='right'?cx+col.w-2:col.a==='center'?cx+col.w/2:cx,y+hH-1.5,{align:col.a});cx+=col.w;});
  y+=hH;

  // Linhas
  doc.setFont('helvetica','normal');doc.setFontSize(7);
  const rH=6.5;
  let pg=1;
  movs.forEach((m,idx)=>{
    if(y+rH>H-14){
      pFtr(pg,1);doc.addPage();pg++;pHdr(pg);y=26;
      // Repetir cabeçalho
      doc.setFillColor(...PX.navy);doc.rect(ml,y,cw,hH,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...PX.white);
      let cx2=ml+2;cols.forEach(col=>{doc.text(col.h,col.a==='right'?cx2+col.w-2:col.a==='center'?cx2+col.w/2:cx2,y+hH-1.5,{align:col.a});cx2+=col.w;});
      y+=hH;
      doc.setFont('helvetica','normal');doc.setFontSize(7);
    }
    const est=DB.estoque.find(x=>x.id===m.estId);
    const obra2=DB.obras.find(x=>String(x.id)===String(m.obraId));
    const isEnt=m.tipo==='Entrada';
    if(idx%2===0){doc.setFillColor(...PX.bg);doc.rect(ml,y,cw,rH,'F');}
    doc.setDrawColor(...PX.silver);doc.setLineWidth(0.15);
    doc.line(ml,y+rH,ml+cw,y+rH);
    // Linhas verticais
    let vx=ml;cols.forEach(col=>{vx+=col.w;doc.line(vx,y,vx,y+rH);});
    doc.setTextColor(...PX.ink);
    const vals=[
      m.data?new Date(m.data+'T12:00').toLocaleDateString('pt-BR'):'—',
      (est?.material||'—').substring(0,30),
      (obra2?.nome||'—').substring(0,24),
      m.tipo==='Entrada'?'↑ Entrada':'↓ Saída',
      Number(m.qtd).toFixed(2),
      est?.un||'—',
      (m.nf||'—').substring(0,16),
      (m.obs||'—').substring(0,28)
    ];
    // Cor do tipo
    cx=ml+2;
    vals.forEach((v,vi)=>{
      if(vi===3){
        doc.setTextColor(...(isEnt?PX.green:PX.red));
        doc.setFont('helvetica','bold');
      } else if(vi===4){
        doc.setTextColor(...(isEnt?PX.green:PX.red));
        doc.setFont('helvetica','bold');
      } else {
        doc.setTextColor(...PX.ink);
        doc.setFont('helvetica','normal');
      }
      const col=cols[vi];
      doc.text(v,col.a==='right'?cx+col.w-2:col.a==='center'?cx+col.w/2:cx,y+rH-1.5,{align:col.a});
      cx+=col.w;
    });
    doc.setFont('helvetica','normal');
    y+=rH;
  });

  // ── RODAPÉ TOTAL ─────────────────────────────────────────────────
  y+=3;
  if(y+8>H-14){pFtr(pg,1);doc.addPage();pg++;pHdr(pg);y=26;}
  doc.setFillColor(...PX.bg);doc.setDrawColor(...PX.silver);doc.setLineWidth(0.3);
  doc.rect(ml,y,cw,8,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...PX.navy);
  doc.text('RESUMO FINAL',ml+3,y+5.5);
  doc.setTextColor(...PX.green);
  doc.text('Total Entradas: '+totEnt.toFixed(2)+' un',ml+50,y+5.5);
  doc.setTextColor(...PX.red);
  doc.text('Total Saídas: '+totSai.toFixed(2)+' un',ml+110,y+5.5);
  doc.setTextColor(...((totEnt-totSai)>=0?PX.green:PX.red));
  doc.text('Saldo Líquido: '+(totEnt-totSai).toFixed(2)+' un',ml+170,y+5.5);

  // Corrigir total de páginas
  const totalPg=doc.getNumberOfPages();
  for(let p=1;p<=totalPg;p++) pFtr(p,totalPg);

  doc.save('Movimentacoes_Estoque_'+today.replace(/\//g,'-')+'.pdf');
  toast('📄','Relatório PDF gerado!');
}

function exportContratosPDF(){
  if(!DB.contratos.length){toast('⚠️','Nenhum contrato cadastrado!');return;}
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const W=297, H=210, ml=9, mr=9, cw=279;
  const today=new Date().toLocaleDateString('pt-BR');

  const totalValor=DB.contratos.reduce((a,ct)=>a+Number(ct.valor||0),0);
  const totalPago =DB.contratos.reduce((a,ct)=>a+_contPago(ct.id),0);
  const devedor   =totalValor-totalPago;
  const atrasados =DB.contratos.filter(ct=>contStatus(ct)==='atrasado').length;
  const pctPago   =totalValor>0?Math.round(totalPago/totalValor*100):0;

  let pg=1, y=0;

  function drawHdr(){
    doc.setFillColor(...PX.navy); doc.rect(0,0,W,22,'F');
    doc.setFillColor(...PX.blue); doc.rect(0,22,W,1.5,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(255,255,255);
    doc.text('RELATÓRIO DE CONTRATOS',ml,14);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.lgray);
    doc.text(DB.contratos.length+' contratos  ·  Emitido em '+today, W-mr, 10, {align:'right'});
    doc.text('ObraTech — Sistema de Gestão de Obras', W-mr, 17, {align:'right'});
    y=28;
  }

  function drawFtr(){
    const n=doc.getNumberOfPages();
    for(let i=1;i<=n;i++){
      doc.setPage(i);
      doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
      doc.line(ml,H-7,W-mr,H-7);
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...PX.lgray);
      doc.text('ObraTech — Gestão de Obras',ml,H-3);
      doc.text('Pág. '+i+' / '+n,W/2,H-3,{align:'center'});
      doc.text(today,W-mr,H-3,{align:'right'});
    }
  }

  function checkPage(need){
    if(y+need>H-12){doc.addPage();pg++;drawHdr();}
  }

  function secTitle(title){
    checkPage(18);
    doc.setFillColor(...PX.navy); doc.rect(ml,y,3,7,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...PX.ink);
    doc.text(title,ml+6,y+5.2);
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.25);
    doc.line(ml,y+8,W-mr,y+8);
    y+=12;
  }

  drawHdr();

  // ── KPIs ──────────────────────────────────────────────────────────
  const kw=(cw-9)/4, kh=22;
  [[ml+0*(kw+3),'Total Contratos',String(DB.contratos.length),'cadastrados',false],
   [ml+1*(kw+3),'Valor Total',String(fmtR(totalValor)),'contratado',false],
   [ml+2*(kw+3),'Total Pago',String(fmtR(totalPago)),pctPago+'% quitado',false],
   [ml+3*(kw+3),'Saldo Devedor',String(fmtR(devedor)),atrasados?atrasados+' em atraso':'Sem atrasos',atrasados>0]
  ].forEach(([kx,label,val,sub,warn])=>{
    doc.setFillColor(255,255,255); doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
    doc.rect(kx,y,kw,kh,'FD');
    doc.setFillColor(...(warn?PX.red:PX.navy)); doc.rect(kx,y,kw,2,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...PX.gray);
    doc.text(label,kx+kw/2,y+9,{align:'center'});
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...(warn?PX.red:PX.ink));
    doc.text(val,kx+kw/2,y+16,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...PX.gray);
    doc.text(sub,kx+kw/2,y+20.5,{align:'center'});
  });
  y+=kh+8;

  // ── Barra de progresso ────────────────────────────────────────────
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
  doc.text('Progresso de pagamento: '+pctPago+'%',ml,y);
  doc.setFillColor(...PX.silver); doc.rect(ml,y+2,cw,4,'F');
  if(pctPago>0){doc.setFillColor(...PX.blue); doc.rect(ml,y+2,cw*Math.min(pctPago,100)/100,4,'F');}
  y+=12;

  // ── TABELA CONTRATOS via autoTable ────────────────────────────────
  secTitle('CONTRATOS');

  const ST={ativo:'Ativo',quitado:'Quitado',atrasado:'Atrasado'};
  const ctRows=DB.contratos.sort((a,b)=>(a.obraId||0)-(b.obraId||0)||(a.id-b.id)).map(ct=>{
    const pago=_contPago(ct.id);
    const dev=Number(ct.valor||0)-pago;
    const obra=DB.obras.find(o=>o.id==ct.obraId);
    const st=contStatus(ct);
    return [
      String(ct.numero||'—'),
      String((ct.descricao||'—').substring(0,32)),
      String((ct.forn||'—').substring(0,22)),
      String((obra?.nome||'—').substring(0,20)),
      String((ct.cat||'—').substring(0,16)),
      String(ct.assinatura?new Date(ct.assinatura+'T12:00').toLocaleDateString('pt-BR'):'—'),
      String(ct.prazo?new Date(ct.prazo+'T12:00').toLocaleDateString('pt-BR'):'—'),
      String(ST[st]||'Ativo'),
      String(fmtR(Number(ct.valor||0))),
      String(fmtR(pago)),
      String(fmtR(dev)),
      {st, dev}
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['Nº','Descrição','Fornecedor','Obra','Categoria','Assinatura','Prazo','Status','Valor (R$)','Pago (R$)','Saldo Dev.']],
    body: ctRows.map(r=>r.slice(0,11)),
    foot: [['','','','','','','','TOTAL',fmtR(totalValor),fmtR(totalPago),fmtR(devedor)]],
    theme: 'striped',
    headStyles: hStyle(),
    footStyles: {...totRow(), halign:'right'},
    bodyStyles: {...bStyle(), fontSize:6.5},
    alternateRowStyles: altRow(),
    columnStyles:{
      0:{cellWidth:12, halign:'center'},
      1:{cellWidth:42},
      2:{cellWidth:34},
      3:{cellWidth:30},
      4:{cellWidth:26},
      5:{cellWidth:22, halign:'center'},
      6:{cellWidth:22, halign:'center'},
      7:{cellWidth:18, halign:'center'},
      8:{cellWidth:26, halign:'right', fontStyle:'bold'},
      9:{cellWidth:26, halign:'right', fontStyle:'bold'},
      10:{cellWidth:21, halign:'right', fontStyle:'bold'},
    },
    didParseCell:(d)=>{
      if(d.section==='body'){
        const meta=ctRows[d.row.index]?.[11];
        if(!meta) return;
        if(d.column.index===7){
          const stc=meta.st==='atrasado'?PX.red:meta.st==='quitado'?PX.green:PX.blue;
          d.cell.styles.textColor=stc; d.cell.styles.fontStyle='bold';
        }
        if(d.column.index===10){
          d.cell.styles.textColor=meta.dev>0?PX.red:PX.green;
        }
        if(d.column.index===9){d.cell.styles.textColor=PX.green;}
      }
      if(d.section==='foot'){
        if(d.column.index===10) d.cell.styles.textColor=devedor>0?[200,40,40]:[30,140,70];
        if(d.column.index===9)  d.cell.styles.textColor=[30,140,70];
      }
    },
    margin:{left:ml, right:mr},
  });
  y=doc.lastAutoTable.finalY+10;

  // ── HISTÓRICO DE PAGAMENTOS ───────────────────────────────────────
  if(DB.pgtos.length){
    checkPage(20);
    secTitle('HISTÓRICO DE PAGAMENTOS');

    const pgRows=DB.pgtos.sort((a,b)=>b.data.localeCompare(a.data)).map(p=>{
      const ctP=DB.contratos.find(x=>x.id===p.contratoId);
      const oP=DB.obras.find(x=>x.id==p.obraId);
      return[
        String(p.data?new Date(p.data+'T12:00').toLocaleDateString('pt-BR'):'—'),
        String(ctP?.numero||'—'),
        String((p.forn||ctP?.forn||'—').substring(0,24)),
        String((p.desc||'—').substring(0,34)),
        String((oP?.nome||'—').substring(0,22)),
        String((p.cat||ctP?.cat||'—').substring(0,18)),
        String((p.nf||'—').substring(0,14)),
        String(fmtR(Number(p.valor||0))),
      ];
    });
    const totalPgtos=DB.pgtos.reduce((a,p)=>a+Number(p.valor||0),0);

    doc.autoTable({
      startY: y,
      head: [['Data','Contrato','Fornecedor','Descrição','Obra','Categoria','NF','Valor (R$)']],
      body: pgRows,
      foot: [['','','','','','','TOTAL',fmtR(totalPgtos)]],
      theme: 'striped',
      headStyles: {...hStyle(), fillColor:PX.blue},
      footStyles: {...totRow(), halign:'right'},
      bodyStyles: {...bStyle(), fontSize:6.5},
      alternateRowStyles: altRow(),
      columnStyles:{
        0:{cellWidth:22, halign:'center'},
        1:{cellWidth:20, halign:'center'},
        2:{cellWidth:36},
        3:{cellWidth:50},
        4:{cellWidth:34},
        5:{cellWidth:28},
        6:{cellWidth:22},
        7:{cellWidth:67, halign:'right', fontStyle:'bold', textColor:PX.red},
      },
      margin:{left:ml, right:mr},
    });
    y=doc.lastAutoTable.finalY+10;
  }

  drawFtr();
  doc.save('Contratos_'+today.replace(/\//g,'-')+'.pdf');
  toast('📄','Relatório de Contratos gerado!');
}

function exportEstoquePDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const W=doc.internal.pageSize.getWidth();
  const H=doc.internal.pageSize.getHeight();
  const ml=9, mr=9, cw=W-ml-mr;
  const today=new Date().toLocaleDateString('pt-BR');

  // Filtros ativos — ler o filtro global do estoque (let, não window)
  const obras=(_estObrasFiltro===null||_estObrasFiltro.size===0)
    ? DB.obras
    : DB.obras.filter(o=>_estObrasFiltro.has(o.id));
  const obraIds=obras.map(o=>o.id);

  // Calcular saldo por material por obra
  function saldoObraItem(estId,obraId){
    return DB.movs.filter(m=>String(m.estId)===String(estId)&&m.obraId===obraId).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);
  }
  function saldoTotal(estId){
    return DB.movs.filter(m=>String(m.estId)===String(estId)&&obraIds.includes(m.obraId)).reduce((a,m)=>a+(m.tipo==='Entrada'?m.qtd:-m.qtd),0);
  }

  const itens=DB.estoque.filter(e=>{
    return obraIds.some(oId=>saldoObraItem(e.id,oId)>0)||saldoTotal(e.id)>0;
  });

  // ── CABEÇALHO ───────────────────────────────────────────────────
  function drawHdr(pg){
    doc.setPage(pg);
    doc.setFillColor(...PX.navy); doc.rect(0,0,W,20,'F');
    doc.setFillColor(...PX.blue); doc.rect(0,20,W,1,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(255,255,255);
    doc.text('RELATÓRIO DE ESTOQUE',ml,13);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...PX.lgray);
    doc.text(obras.length===DB.obras.length?'Todas as obras':obras.map(o=>o.nome).join(', ').substring(0,70), W-mr, 8, {align:'right'});
    doc.text('Emitido em '+today, W-mr, 14, {align:'right'});
  }
  function drawFtr(pg,tot){
    doc.setPage(pg);
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
    doc.line(ml,H-8,W-mr,H-8);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...PX.lgray);
    doc.text('ObraTech — Sistema de Gestão de Obras',ml,H-4);
    doc.text('Pág. '+pg+' de '+tot,W-mr,H-4,{align:'right'});
  }

  drawHdr(1);
  let y=26, pg=1;

  // ── KPIs ─────────────────────────────────────────────────────────
  const totalItens=DB.estoque.length;
  const itensCritcos=DB.estoque.filter(e=>{const s=saldoTotal(e.id);return s>0&&s<=Number(e.min||0);}).length;
  const totalMovs=DB.movs.filter(m=>obraIds.includes(m.obraId)).length;
  const totalEnt=DB.movs.filter(m=>obraIds.includes(m.obraId)&&m.tipo==='Entrada').reduce((a,m)=>a+Number(m.qtd),0);
  const kpis=[
    {l:'Materiais no Catálogo',v:String(totalItens)},{l:'Itens com Estoque',v:String(itens.length)},
    {l:'Abaixo do Mínimo',v:String(itensCritcos),warn:itensCritcos>0},{l:'Total de Movimentos',v:String(totalMovs)}
  ];
  const kw=(cw-9)/4;
  kpis.forEach((k,i)=>{
    const kx=ml+i*(kw+3);
    doc.setFillColor(255,255,255); doc.setDrawColor(...PX.silver); doc.setLineWidth(0.3);
    doc.rect(kx,y,kw,14,'FD');
    doc.setFillColor(...(k.warn?PX.red:PX.navy)); doc.rect(kx,y,kw,1.5,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...PX.gray);
    doc.text(k.l,kx+kw/2,y+6,{align:'center'});
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...(k.warn?PX.red:PX.ink));
    doc.text(k.v,kx+kw/2,y+12,{align:'center'});
  });
  y+=19;

  // ── POR OBRA ─────────────────────────────────────────────────────
  obras.forEach(obra=>{
    const itensObra=DB.estoque.filter(e=>saldoObraItem(e.id,obra.id)!==0);
    if(!itensObra.length) return;
    if(y>H-30){doc.addPage();pg++;drawHdr(pg);y=26;}
    // Seção por obra
    doc.setFillColor(...PX.navy); doc.rect(ml,y,3,8,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...PX.ink);
    doc.text(obra.nome.toUpperCase(),ml+6,y+5.5);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...PX.gray);
    doc.text(itensObra.length+' materiais com movimentação',ml+6,y+11);
    doc.setDrawColor(...PX.silver); doc.setLineWidth(0.25);
    doc.line(ml,y+13,W-mr,y+13);
    y+=17;
    // Cabeçalho tabela
    const cols=[
      {h:'Material',w:65,a:'left'},{h:'Unid.',w:15,a:'center'},
      {h:'Saldo Atual',w:28,a:'right'},{h:'Mínimo',w:22,a:'right'},
      {h:'Status',w:25,a:'center'},{h:'Entradas',w:24,a:'right'},
      {h:'Saídas',w:24,a:'right'},{h:'Últ. Movim.',w:30,a:'center'},
      {h:'Fornecedor',w:W-ml-mr-65-15-28-22-25-24-24-30,a:'left'}
    ];
    const hH=6.5;
    doc.setFillColor(...PX.navy); doc.rect(ml,y,cw,hH,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
    let cx=ml+1;
    cols.forEach(col=>{doc.text(col.h,col.a==='right'?cx+col.w-2:col.a==='center'?cx+col.w/2:cx,y+hH-1.5,{align:col.a});cx+=col.w;});
    y+=hH;
    const rH=5.8;
    itensObra.forEach((e,idx)=>{
      if(y+rH>H-14){doc.addPage();pg++;drawHdr(pg);y=26;
        doc.setFillColor(...PX.navy); doc.rect(ml,y,cw,hH,'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
        let cx2=ml+1; cols.forEach(col=>{doc.text(col.h,col.a==='right'?cx2+col.w-2:col.a==='center'?cx2+col.w/2:cx2,y+hH-1.5,{align:col.a});cx2+=col.w;}); y+=hH;
      }
      const saldo=saldoObraItem(e.id,obra.id);
      const entradas=DB.movs.filter(m=>m.estId===e.id&&m.obraId===obra.id&&m.tipo==='Entrada').reduce((a,m)=>a+Number(m.qtd),0);
      const saidas=DB.movs.filter(m=>m.estId===e.id&&m.obraId===obra.id&&m.tipo==='Saida').reduce((a,m)=>a+Number(m.qtd),0);
      const movList=DB.movs.filter(m=>m.estId===e.id&&m.obraId===obra.id).sort((a,b)=>b.data.localeCompare(a.data));
      const ultMov=movList[0]?.data?new Date(movList[0].data+'T12:00').toLocaleDateString('pt-BR'):'—';
      const abaixoMin=Number(e.min||0)>0&&saldo<=Number(e.min);
      const semSaldo=saldo===0;
      if(idx%2===0){doc.setFillColor(...PX.bg); doc.rect(ml,y,cw,rH,'F');}
      doc.setDrawColor(...PX.silver); doc.setLineWidth(0.1);
      doc.line(ml,y+rH,ml+cw,y+rH);
      const vals=[
        (e.material||'—').substring(0,34), e.un||'—',
        saldo.toFixed(2), Number(e.min||0).toFixed(0),
        abaixoMin?'⚠ Crítico':semSaldo?'Zerado':'OK',
        entradas.toFixed(2), saidas.toFixed(2), ultMov,
        (e.forn||'—').substring(0,22)
      ];
      const colors=[PX.ink,PX.gray,abaixoMin?PX.red:semSaldo?PX.gray:PX.green,PX.gray,
        abaixoMin?PX.red:semSaldo?PX.gray:PX.green,PX.green,PX.red,PX.gray,PX.gray];
      cx=ml+1;
      vals.forEach((v,vi)=>{
        doc.setFont('helvetica',vi===0||vi===2?'bold':'normal');
        doc.setFontSize(6.5); doc.setTextColor(...colors[vi]);
        const col=cols[vi];
        doc.text(String(v),col.a==='right'?cx+col.w-2:col.a==='center'?cx+col.w/2:cx,y+rH-1.5,{align:col.a});
        cx+=col.w;
      });
      y+=rH;
    });
    // Sub-total obra
    y+=2;
    const totalSaldoObra=itensObra.reduce((a,e)=>a+saldoObraItem(e.id,obra.id)*Number(e.preco||0),0);
    if(totalSaldoObra>0){
      doc.setFillColor(...PX.bg); doc.setDrawColor(...PX.silver); doc.setLineWidth(0.2);
      doc.rect(ml,y,cw,6,'FD');
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...PX.navy);
      doc.text('Valor Estoque '+obra.nome+':',ml+3,y+4.5);
      doc.text(fmtR(totalSaldoObra),W-mr-3,y+4.5,{align:'right'});
      y+=8;
    }
    y+=4;
  });

  const totalPg=doc.getNumberOfPages();
  for(let p=1;p<=totalPg;p++) drawFtr(p,totalPg);
  doc.save('Estoque_'+today.replace(/\//g,'-')+'.pdf');
  toast('📄','Relatório de Estoque gerado!');
}

function gerarRelGerencial() {
  const obras = DB.obras;
  if (!obras.length) { toast('⚠️','Nenhuma obra cadastrada!'); return; }

  const rec    = DB.lancs.filter(l=>l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
  const dep    = DB.lancs.filter(l=>l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
  const saldo  = rec - dep;
  const orc    = obras.reduce((a,o)=>a+Number(o.orc||0),0);
  const avMed  = obras.length ? Math.round(obras.reduce((a,o)=>a+obraPct(o),0)/obras.length) : 0;
  const ncsAb  = DB.ncs.filter(n=>n.status!=='Fechada').length;

  const doc = new jsPDF();
  let y = pHdr(doc, 'Relatorio Gerencial Executivo', obras.length+' obra(s)   —   '+new Date().toLocaleDateString('pt-BR'));
  y += 4;

  // ── 8 KPIs em 2 linhas de 4
  const cw = 46, ch = 24, gap = 2;
  const kpis = [
    { l:'Total de Obras',    v:String(obras.length),            s:'cadastradas' },
    { l:'Avanco Medio',      v:avMed+'%',                       s:'todas as obras' },
    { l:'Orcamento Total',   v:fmtR(orc),                       s:'soma dos orcamentos' },
    { l:'Total Despesas',    v:fmtR(dep),                       s: dep>orc ? 'acima orcado' : 'dentro orcado' },
    { l:'Total Receitas',    v:fmtR(rec),                       s:'lancadas' },
    { l:'Saldo Financeiro',  v:fmtR(saldo),                     s: saldo>=0 ? 'positivo' : 'negativo' },
    { l:'Colaboradores',     v:String(DB.colabs.length),        s:'equipe ativa' },
    { l:'NCs Abertas',       v:String(ncsAb),                   s: ncsAb ? 'requerem atencao' : 'nenhuma pendente' },
  ];
  kpis.forEach((k,i) => {
    const col = i%4, row = Math.floor(i/4);
    pKpi(doc, 9+col*(cw+gap), y+row*(ch+4), cw, ch, k.l, k.v, k.s);
  });
  y += 2*(ch+4) + 8;

  // ── Tabela de obras
  y = pSec(doc, y, 'Status das Obras');
  doc.autoTable({
    startY: y,
    head: [['Obra','Tipo','Orcamento','m2','Custo/m2','Avanco','Entrega','Status']],
    body: obras.map(o => {
      const odep = DB.lancs.filter(l=>String(l.obraId)===String(o.id)&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
      return [
        o.nome, o.tipo||'—', fmtR(o.orc||0),
        o.m2 ? o.m2+'m2' : '—',
        o.m2 && odep ? fmtR(odep/o.m2)+'/m2' : '—',
        obraPct(o)+'%', o.dataFim ? fmtDt(o.dataFim) : '—',
        obraLabel(o)
      ];
    }),
    theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
    columnStyles: {
      0: { cellWidth: 44, fontStyle:'bold' },
      1: { cellWidth: 20, halign:'center' },
      2: { cellWidth: 30, halign:'right' },
      3: { cellWidth: 14, halign:'center' },
      4: { cellWidth: 26, halign:'right' },
      5: { cellWidth: 16, halign:'center', fontStyle:'bold' },
      6: { cellWidth: 24, halign:'center' },
      7: { cellWidth: 18, halign:'center' }
    },
    didParseCell: (d) => {
      if (d.section==='body') {
        if (d.column.index===7) {
          const t = d.cell.text[0];
          if (t==='Atrasado')    { d.cell.styles.textColor = PX.red;   d.cell.styles.fontStyle = 'bold'; }
          else if (t==='Concluido') { d.cell.styles.textColor = PX.green; d.cell.styles.fontStyle = 'bold'; }
          else if (t==='Em andamento') d.cell.styles.textColor = PX.blue;
        }
        if (d.column.index===5) {
          const v = parseInt(d.cell.text[0]);
          d.cell.styles.textColor = v>=80 ? PX.green : v>=40 ? PX.ink : PX.amber;
        }
      }
    },
    margin: { left: 9, right: 9 }
  });
  y = doc.lastAutoTable.finalY + 9;

  // ── Resumo financeiro por categoria
  if (DB.lancs.length) {
    if (y > 215) { doc.addPage(); y = pHdr(doc, 'Gerencial — Financeiro', 'Continuacao') + 8; }
    y = pSec(doc, y, 'Resumo Financeiro por Categoria');
    const cats = [...new Set(DB.lancs.map(l=>l.cat||'Sem Categoria'))].sort();
    doc.autoTable({
      startY: y,
      head: [['Categoria','Receitas (R$)','Despesas (R$)','Saldo (R$)']],
      body: [
        ...cats.map(cat => {
          const r  = DB.lancs.filter(l=>l.cat===cat&&l.tipo==='Receita').reduce((a,l)=>a+Number(l.valor),0);
          const d2 = DB.lancs.filter(l=>l.cat===cat&&l.tipo==='Despesa').reduce((a,l)=>a+Number(l.valor),0);
          return [cat, fmtR(r), fmtR(d2), fmtR(r-d2)];
        }),
        ['TOTAL GERAL', fmtR(rec), fmtR(dep), fmtR(saldo)]
      ],
      theme: 'striped', headStyles: hStyle(), bodyStyles: bStyle(), alternateRowStyles: altRow(),
      columnStyles: {
        0: { cellWidth: 76 },
        1: { cellWidth: 38, halign:'right' },
        2: { cellWidth: 38, halign:'right' },
        3: { cellWidth: 40, halign:'right', fontStyle:'bold' }
      },
      didParseCell: (d) => {
        if (d.section==='body') {
          if (d.column.index===3) {
            const raw = typeof d.cell.raw==='number' ? d.cell.raw
              : parseFloat((d.cell.raw||'').toString().replace(/[^0-9\-.,]/g,'').replace(',','.')) || 0;
            d.cell.styles.textColor = raw < 0 ? PX.red : PX.green;
          }
          if (d.row.index===cats.length) {
            d.cell.styles.fillColor = PX.navy; d.cell.styles.textColor = [255,255,255]; d.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 9, right: 9 }
    });
    y = doc.lastAutoTable.finalY + 9;
  }

  // ── NCs criticas
  const ncsAlta = DB.ncs.filter(n=>n.status!=='Fechada'&&n.grau==='Alta');
  if (ncsAlta.length) {
    if (y > 228) { doc.addPage(); y = pHdr(doc, 'Gerencial — NCs Criticas', 'Continuacao') + 8; }
    y = pSec(doc, y, 'Nao Conformidades Criticas — Grau Alto');
    doc.autoTable({
      startY: y,
      head: [['Obra','Descricao','Prazo','Responsavel','Status']],
      body: ncsAlta.map(n => {
        const o = DB.obras.find(x=>x.id==n.obraId);
        return [(o?.nome||'—').substring(0,18), (n.desc||'—').substring(0,45),
          n.prazo ? fmtDt(n.prazo) : '—', (n.resp||'—').substring(0,18), n.status];
      }),
      theme: 'plain', headStyles: hStyle(), bodyStyles: bStyle(),
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 72 },
        2: { cellWidth: 26, halign:'center' },
        3: { cellWidth: 34 },
        4: { cellWidth: 20, halign:'center' }
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===4) {
          if (d.cell.text[0]==='Aberta')       d.cell.styles.textColor = PX.red;
          if (d.cell.text[0]==='Em andamento') d.cell.styles.textColor = PX.amber;
        }
      },
      margin: { left: 9, right: 9 }
    });
  }

  pFtr(doc);
  doc.save('Relatorio_Gerencial_ObraTech.pdf');
  toast('📄', 'Relatorio Gerencial Executivo exportado com sucesso!');
}
// BACKUP / RESTAURAR
// ═══════════════════════════════════════════



// fmtR, fmtDt, toast estão em utils.js

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
