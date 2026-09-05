import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile, ClubSettings, UniformOrder, MonthlyFeeRecord, Payment } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper to convert hex color to RGB tuple
function hexToRgbTuple(hex?: string): [number, number, number] {
  if (!hex) return [37, 99, 235]; // default royal blue
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  }
  return [37, 99, 235];
}

// ---------------------------------------------------------------------------
// 1. FICHA OFICIAL DEL JUGADOR (PDF A4 CORPORATIVO FORMAL)
// ---------------------------------------------------------------------------
export function generatePlayerRegistrationPDF(player: UserProfile, settings: ClubSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryRgb = hexToRgbTuple(settings.primaryColor || '#1e3a8a');
  const clubName = (settings.appName || 'CLUB DEPORTIVO').toUpperCase();
  const slogan = settings.slogan || 'Pasión, Disciplina y Excelencia Deportiva';

  // 1. Header Banner & Top Border Accent
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 18, 'F');

  doc.setFillColor(245, 158, 11); // Amber accent thin strip
  doc.rect(0, 18, 210, 2.5, 'F');

  // Header Title in Top Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(clubName, 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('FEDERACIÓN Y REGISTRO INSTITUCIONAL OFICIAL', 195, 12, { align: 'right' });

  // Institutional Subheader
  let currentY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('FICHA OFICIAL DE REGISTRO E INSCRIPCIÓN DE ATLETA', 105, currentY, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`"${slogan}" - Expediente Deportivo Confidencial`, 105, currentY, { align: 'center' });

  // Background Watermark Logo
  if (settings.logoUrl) {
    try {
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
      // Center a large watermark
      doc.addImage(settings.logoUrl, 'PNG', 45, 100, 120, 120);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch (e) {
      console.warn("Could not draw watermark", e);
    }
  }

  // Header Logo (Top Right or Left)
  if (settings.logoUrl) {
    try {
      // Small logo in the header
      doc.addImage(settings.logoUrl, 'PNG', 15, 23, 20, 20);
    } catch (e) {
      console.warn("Could not draw header logo", e);
    }
  }


  // Document metadata box
  currentY += 6;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, currentY, 180, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('CÓDIGO DE FICHA:', 20, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`ATH-${(player.dni || player.id.substring(0, 6)).toUpperCase()}`, 52, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE EMISIÓN:', 95, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), "dd 'de' MMMM, yyyy", { locale: es }), 130, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORÍA:', 160, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text((player.category || 'FORMATIVA').toUpperCase(), 182, currentY + 6.5);

  // Section 1: DATOS PERSONALES & FOTO
  currentY += 15;
  
  // Section Title 1
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(15, currentY, 4, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('1. DATOS PERSONALES Y DE IDENTIFICACIÓN', 22, currentY + 4.8);

  currentY += 8;

  // Photo Frame (on the right)
  const photoX = 160;
  const photoY = currentY;
  const photoW = 35;
  const photoH = 42;

  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFillColor(245, 245, 248);
  doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'FD');

  if (player.photoURL && player.photoURL.startsWith('data:image')) {
    try {
      doc.addImage(player.photoURL, 'JPEG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text('FOTO OFICIAL', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text('FOTO TAMAÑO CARNET', photoX + photoW / 2, photoY + photoH / 2 - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('(Fondo Blanco / Club)', photoX + photoW / 2, photoY + photoH / 2 + 3, { align: 'center' });
  }

  // Personal Data Table (Left of Photo)
  const personalData = [
    ['Nombres y Apellidos:', (player.name || 'No especificado').toUpperCase()],
    ['Documento (DNI/CE):', player.dni || 'Sin registrar'],
    ['Fecha de Nacimiento:', player.dateOfBirth ? format(new Date(player.dateOfBirth + 'T00:00:00'), "dd/MM/yyyy") : 'Sin registrar'],
    ['Teléfono / WhatsApp:', player.phone || 'Sin registrar'],
    ['Correo Electrónico:', player.email || 'Sin registrar'],
    ['Rol Institucional:', (player.clubRole || 'Jugador').toUpperCase()]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15 },
    tableWidth: 140,
    theme: 'grid',
    head: [],
    body: personalData,
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252], textColor: [70, 70, 70] },
      1: { fontStyle: 'normal', cellWidth: 95 }
    }
  });

  // Section 2: PERFIL DEPORTIVO Y TÉCNICO
  currentY = Math.max((doc as any).lastAutoTable.finalY + 6, photoY + photoH + 6);

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(15, currentY, 4, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('2. PARÁMETROS TÉCNICOS Y BIOMÉTRICOS', 22, currentY + 4.8);

  currentY += 7;

  const sportsData = [
    ['Dorsal / Camiseta:', player.jerseyNumber ? `#${player.jerseyNumber}` : 'S/N', 'Posición en Cancha:', player.position || 'Por definir'],
    ['Estatura Oficial:', player.height || '--', 'Peso Corporal:', player.weight || '--'],
    ['Mano Dominante:', player.dominantHand || 'No especificada', 'Alcance de Salto:', player.jumpReach || '--'],
    ['Año de Ingreso:', player.joinedYear || format(new Date(), 'yyyy'), 'Categoría Asignada:', player.category || 'General']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    head: [],
    body: sportsData,
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, fillColor: [248, 250, 252] },
      1: { cellWidth: 55, fontStyle: 'bold', textColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]] },
      2: { fontStyle: 'bold', cellWidth: 35, fillColor: [248, 250, 252] },
      3: { cellWidth: 55 }
    }
  });

  // Section 3: INFORMACIÓN MÉDICA Y CONTACTOS DE EMERGENCIA
  currentY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(15, currentY, 4, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('3. FICHA MÉDICA Y PROTOCOLO DE EMERGENCIA', 22, currentY + 4.8);

  currentY += 7;

  const medicalData = [
    ['Grupo Sanguíneo:', player.bloodType || 'Por determinar', 'Contacto de Emergencia:', player.emergencyContact || 'Sin registrar'],
    ['Teléfono de Emergencia:', player.emergencyPhone || 'Sin registrar', 'Condición / Alergias:', player.medicalInfo || 'Ninguna alergia o condición reportada']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    head: [],
    body: medicalData,
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] },
      3: { cellWidth: 50 }
    }
  });

  // Section 4: DATOS DEL APODERADO / TUTOR LEGAL (Para Menores de Edad)
  currentY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(15, currentY, 4, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('4. DATOS DEL APODERADO / TUTOR LEGAL (Menores de Edad)', 22, currentY + 4.8);

  currentY += 7;

  const guardianData = [
    ['Padre / Madre / Apoderado:', (player.guardianName || player.emergencyContact || '__________________________________').toUpperCase(), 'DNI del Apoderado:', player.guardianDni || '__________________'],
    ['Teléfono del Apoderado:', player.guardianPhone || player.emergencyPhone || '__________________', 'Parentesco:', player.guardianRelationship || 'Padre / Madre / Tutor Legal']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    head: [],
    body: guardianData,
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35, fillColor: [248, 250, 252] },
      3: { cellWidth: 45 }
    }
  });

  // Section 5: DECLARACIÓN Y COMPROMISO
  currentY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 100, 100);
  const declarationText = 
    "DECLARACIÓN JURADA: El atleta y/o su apoderado legal declaran bajo juramento que los datos aquí consignados son verdaderos, autorizan la participación activa en los entrenamientos y competencias oficiales del club, y se comprometen a respetar el reglamento interno de disciplina y puntualidad de la institución deportiva.";
  doc.text(declarationText, 15, currentY, { maxWidth: 180, align: 'justify' });

  // Section 6: SECCIÓN FORMAL DE FIRMAS
  currentY += 12;

  // Box 1: Firma del Jugador
  const boxW = 54;
  const boxH = 26;
  const startX = 15;
  const gap = 9;

  // Firma 1: Jugador
  doc.setDrawColor(180, 180, 180);
  doc.roundedRect(startX, currentY, boxW, boxH, 1.5, 1.5, 'D');
  doc.line(startX + 4, currentY + boxH - 8, startX + boxW - 4, currentY + boxH - 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('FIRMA DEL JUGADOR / ATLETA', startX + boxW / 2, currentY + boxH - 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`DNI: ${player.dni || '........................'}`, startX + boxW / 2, currentY + boxH - 1.5, { align: 'center' });

  // Firma 2: Apoderado (Obligatorio menores)
  const gX = startX + boxW + gap;
  doc.setDrawColor(180, 180, 180);
  doc.roundedRect(gX, currentY, boxW, boxH, 1.5, 1.5, 'D');
  doc.line(gX + 4, currentY + boxH - 8, gX + boxW - 4, currentY + boxH - 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('FIRMA DEL APODERADO / TUTOR', gX + boxW / 2, currentY + boxH - 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`DNI: ${player.guardianDni || '........................'} (Si es Menor)`, gX + boxW / 2, currentY + boxH - 1.5, { align: 'center' });

  // Firma 3: Dirección del Club
  const dirX = gX + boxW + gap;
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(dirX, currentY, boxW, boxH, 1.5, 1.5, 'D');
  doc.line(dirX + 4, currentY + boxH - 8, dirX + boxW - 4, currentY + boxH - 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('DIRECCIÓN DEL CLUB', dirX + boxW / 2, currentY + boxH - 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Sello y Conformidad Oficial', dirX + boxW / 2, currentY + boxH - 1.5, { align: 'center' });

  // Bottom Footer
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 290, 210, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`${clubName} • Documento Oficial de Registro Deportivo • Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 105, 294.5, { align: 'center' });

  // Save the document
  const fileName = `Ficha_Oficial_${(player.name || 'Jugador').replace(/\s+/g, '_')}_${player.dni || 'ATH'}.pdf`;
  doc.save(fileName);
}

// ---------------------------------------------------------------------------
// 2. ORDEN DE LOTE DE UNIFORMES PARA CONFECCIÓN TEXTIL (PDF A4)
// ---------------------------------------------------------------------------
export function generateUniformBatchPDF(orders: UniformOrder[], batchName: string, settings: ClubSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryRgb = hexToRgbTuple(settings.primaryColor || '#1e3a8a');
  const clubName = (settings.appName || 'CLUB DEPORTIVO').toUpperCase();

  // Header Banner
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 20, 'F');

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 20, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(clubName, 15, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ORDEN DE CONFECCIÓN TEXTIL E INDUMENTARIA OFICIAL', 195, 13, { align: 'right' });

  let currentY = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`LOTE DE CONFECCIÓN: ${batchName.toUpperCase()}`, 105, currentY, { align: 'center' });

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Documento de Especificaciones Técnicas para Taller de Confección - Emitido: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, 105, currentY, { align: 'center' });

  currentY += 8;

  // Table of uniform items
  const tableData = orders.map((o, idx) => [
    idx + 1,
    o.userName.toUpperCase(),
    o.type === 'completo' ? 'COMPLETO (Camiseta + Short)' : 'SÓLO CAMISETA',
    o.size.toUpperCase(),
    `#${o.jerseyNumber || 'S/N'}`,
    (o.alias || o.userName).toUpperCase(),
    o.paymentStatus === 'pagado' ? 'PAGADO' : 'PENDIENTE'
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 12, right: 12 },
    head: [['#', 'INTEGRANTE / JUGADOR', 'TIPO DE PRENDA', 'TALLA', 'NÚMERO', 'ESTAMPADO ESPALDA (ALIAS)', 'ESTADO PAGO']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      halign: 'left'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 42 },
      2: { halign: 'center', cellWidth: 42 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 16, textColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]] },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 38 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 22 }
    }
  });

  // Calculation of Summary Metrics
  const totalCompleto = orders.filter(o => o.type === 'completo').length;
  const totalCamiseta = orders.filter(o => o.type === 'camiseta').length;
  const totalGeneral = orders.length;

  const sizeSummary: Record<string, number> = {};
  orders.forEach(o => {
    const s = (o.size || 'M').toUpperCase();
    sizeSummary[s] = (sizeSummary[s] || 0) + 1;
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Summary Box
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 186, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('RESUMEN CONSOLIDADO DE PRODUCCIÓN PARA EL TALLER:', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`• Total Conjuntos Completos (Camiseta + Short): ${totalCompleto} unidades`, 18, currentY + 14);
  doc.text(`• Total Sólo Camisetas Oficiales: ${totalCamiseta} unidades`, 18, currentY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`• TOTAL DE PRENDAS A CONFECCIONAR: ${totalGeneral} unidades`, 18, currentY + 26);

  // Breakdown by sizes on the right
  const sizeText = Object.entries(sizeSummary)
    .map(([sz, qty]) => `${sz}: ${qty}`)
    .join('  |  ');
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose por Tallas:', 110, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(sizeText || 'Sin especificar', 110, currentY + 20, { maxWidth: 80 });

  // Signatures at bottom
  currentY += 42;
  doc.line(25, currentY + 12, 85, currentY + 12);
  doc.line(125, currentY + 12, 185, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RESPONSABLE DE INDUMENTARIA DEL CLUB', 55, currentY + 16, { align: 'center' });
  doc.text('RECEPCIÓN Y CONFORMIDAD DEL TALLER', 155, currentY + 16, { align: 'center' });

  // Footer
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 290, 210, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`${clubName} • Control de Tesorería e Indumentaria • Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 105, 294.5, { align: 'center' });

  doc.save(`Lote_Confeccion_${batchName.replace(/\s+/g, '_')}.pdf`);
}

// ---------------------------------------------------------------------------
// 3. ESTADO DE CUENTA INDIVIDUAL DE MENSUALIDADES POR JUGADOR (PDF A4)
// ---------------------------------------------------------------------------
export function generatePlayerFeeStatementPDF(
  player: UserProfile,
  feeRecords: MonthlyFeeRecord[],
  paymentsOrSettings: Payment[] | ClubSettings,
  settingsOrYear?: ClubSettings | number,
  optionalYear?: number
) {
  let payments: Payment[] = [];
  let settings: ClubSettings;
  let year: number = new Date().getFullYear();

  if (Array.isArray(paymentsOrSettings)) {
    payments = paymentsOrSettings;
    settings = (settingsOrYear as ClubSettings) || { appName: 'Club de Voleibol', logoUrl: '' };
    if (typeof optionalYear === 'number') year = optionalYear;
  } else {
    payments = [];
    settings = paymentsOrSettings || { appName: 'Club de Voleibol', logoUrl: '' };
    if (typeof settingsOrYear === 'number') year = settingsOrYear;
    else if (typeof optionalYear === 'number') year = optionalYear;
  }
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryRgb = hexToRgbTuple(settings.primaryColor || '#1e3a8a');
  const clubName = (settings.appName || 'CLUB DEPORTIVO').toUpperCase();

  // Top header banner
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 18, 'F');

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 18, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(clubName, 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('ESTADO DE CUENTA DE CUOTAS Y MENSUALIDADES', 195, 12, { align: 'right' });

  let currentY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`ESTADO DE CUENTA INDIVIDUAL - TEMPORADA ${year}`, 105, currentY, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Historial Oficial de Pagos, Cuotas Canceladas y Saldos Pendientes`, 105, currentY, { align: 'center' });

  // Player Summary Info Card
  currentY += 6;
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, 180, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('INTEGRANTE / ATLETA:', 20, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text((player.name || 'Sin nombre').toUpperCase(), 65, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('DNI:', 20, currentY + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.text(player.dni || 'Sin registrar', 30, currentY + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORÍA:', 75, currentY + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.text(player.category || 'General', 100, currentY + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DORSAL:', 140, currentY + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.text(player.jerseyNumber ? `#${player.jerseyNumber}` : 'S/N', 158, currentY + 13.5);

  currentY += 26;

  // Standard 12 months definition
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  let totalPagado = 0;
  let totalPendiente = 0;

  const monthRows = MONTHS.map((m, idx) => {
    // Find if paid in feeRecords or general payments
    const monthFee = feeRecords.find(f => f.userId === player.id && f.month.toLowerCase() === m.toLowerCase() && f.year === year);
    const monthPayment = payments.find(p => p.userId === player.id && p.period && p.period.includes(`${year}-${String(idx + 1).padStart(2, '0')}`) && p.concept.toLowerCase().includes('mensual'));

    const isPaid = (monthFee && monthFee.status === 'paid') || Boolean(monthPayment);
    const amount = monthFee?.amount || monthPayment?.amount || 120.00;
    const dateStr = monthFee?.paidAt ? format(monthFee.paidAt.toDate ? monthFee.paidAt.toDate() : new Date(monthFee.paidAt), "dd/MM/yyyy") : (monthPayment?.createdAt ? format(monthPayment.createdAt.toDate ? monthPayment.createdAt.toDate() : new Date(), "dd/MM/yyyy") : '--');
    const methodStr = monthFee?.paymentMethod || 'Efectivo / Transferencia';
    const receiptStr = monthFee?.receiptNumber || monthPayment?.id?.substring(0, 8).toUpperCase() || '--';

    if (isPaid) {
      totalPagado += amount;
    } else {
      totalPendiente += amount;
    }

    return [
      m,
      `S/ ${amount.toFixed(2)}`,
      isPaid ? 'PAGADO' : 'PENDIENTE',
      isPaid ? dateStr : '--',
      isPaid ? methodStr : '--',
      isPaid ? receiptStr : '--'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    head: [['MES', 'CUOTA', 'ESTADO', 'FECHA PAGO', 'MÉTODO', 'N° RECIBO']],
    body: monthRows,
    theme: 'grid',
    headStyles: {
      fillColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 32 },
      1: { fontStyle: 'bold', cellWidth: 26 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 36 },
      5: { fontStyle: 'bold', cellWidth: 30 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'PAGADO') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald green
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Financial Balance Box
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, 180, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('RESUMEN FINANCIERO DEL ATLETA:', 20, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`• Total Abonado en el Año: `, 20, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`S/ ${totalPagado.toFixed(2)}`, 70, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`• Saldo Pendiente por Pagar: `, 20, currentY + 19.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(totalPendiente > 0 ? 239 : 16, totalPendiente > 0 ? 68 : 185, totalPendiente > 0 ? 68 : 129);
  doc.text(`S/ ${totalPendiente.toFixed(2)}`, 70, currentY + 19.5);

  // Status Badge on Right
  const isUpToDate = totalPendiente === 0;
  doc.setDrawColor(isUpToDate ? 16 : 239, isUpToDate ? 185 : 68, isUpToDate ? 129 : 68);
  doc.setFillColor(isUpToDate ? 236 : 254, isUpToDate ? 253 : 242, isUpToDate ? 245 : 242);
  doc.roundedRect(125, currentY + 5, 62, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isUpToDate ? 16 : 239, isUpToDate ? 185 : 68, isUpToDate ? 129 : 68);
  doc.text(isUpToDate ? 'CONDICIÓN: AL DÍA' : 'CONDICIÓN: CUOTAS PENDIENTES', 156, currentY + 13.5, { align: 'center' });

  // Signature
  currentY += 34;
  doc.line(75, currentY + 10, 135, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('TESORERÍA Y ADMINISTRACIÓN DEL CLUB', 105, currentY + 14.5, { align: 'center' });

  // Footer
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 290, 210, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`${clubName} • Estado de Cuenta Individual • Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 105, 294.5, { align: 'center' });

  
  currentY += 20;
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 30;
  }
  
  // Director Signature
  if (settings.directorSignatureUrl) {
    try {
      doc.addImage(settings.directorSignatureUrl, 'PNG', 135, currentY - 15, 45, 15);
    } catch (e) {}
  }
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.line(130, currentY, 190, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('FIRMA ALTA DIRECCIÓN', 160, currentY + 5, { align: 'center' });
  
  // Club Stamp
  if (settings.clubStampUrl) {
    try {
      doc.setGState(new (doc as any).GState({ opacity: 0.7 }));
      doc.addImage(settings.clubStampUrl, 'PNG', 85, currentY - 15, 40, 40);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch (e) {}
  }

  doc.save(`Estado_Cuenta_${(player.name || 'Atleta').replace(/\s+/g, '_')}_${year}.pdf`);
}

// ---------------------------------------------------------------------------
// 4. REPORTE GENERAL CONSOLIDADO DE RECAUDACIÓN Y MENSUALIDADES (PDF A4)
// ---------------------------------------------------------------------------
export function generateGeneralTreasuryReportPDF(
  users: UserProfile[],
  feeRecords: MonthlyFeeRecord[],
  payments: Payment[],
  settings: ClubSettings,
  year: number = new Date().getFullYear()
) {
  const doc = new jsPDF({
    orientation: 'landscape', // Horizontal for wide tables
    unit: 'mm',
    format: 'a4'
  });

  const primaryRgb = hexToRgbTuple(settings.primaryColor || '#1e3a8a');
  const clubName = (settings.appName || 'CLUB DEPORTIVO').toUpperCase();

  // Top header banner
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 297, 18, 'F');

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 18, 297, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(clubName, 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  /doc\.text\(`INFORME GENERAL DE TESORERÍA Y RECAUDACIÓN • TEMPORADA \$\{year\}(.+)\}\);/

  // Background Watermark Logo
  if (settings.logoUrl) {
    try {
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
      // Center a large watermark
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      doc.addImage(settings.logoUrl, 'PNG', w/2 - 60, h/2 - 60, 120, 120);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch (e) {
      console.warn("Could not draw watermark", e);
    }
  }

  // Header Logo (Top Right or Left)
  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', 15, 20, 15, 15);
    } catch (e) {
      console.warn("Could not draw header logo", e);
    }
  }


  let currentY = 28;

  // Filter athletes
  const athletes = users.filter(u => u.role !== 'admin' && u.clubRole !== 'entrenador');

  let globalRecaudado = 0;
  let globalPendiente = 0;

  const tableRows = athletes.map((u, idx) => {
    const userPayments = payments.filter(p => p.userId === u.id && p.concept.toLowerCase().includes('mensual'));
    const userFeeRecords = feeRecords.filter(f => f.userId === u.id && f.status === 'paid');

    const totalPaid = userPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const monthsPaidCount = Math.min(12, Math.max(userFeeRecords.length, userPayments.length));
    const estimatedTotalYear = 12 * 120.00;
    const pendingBalance = Math.max(0, estimatedTotalYear - totalPaid);

    globalRecaudado += totalPaid;
    globalPendiente += pendingBalance;

    return [
      idx + 1,
      (u.name || u.email).toUpperCase(),
      u.dni || '--',
      (u.category || 'Formativa').toUpperCase(),
      u.jerseyNumber ? `#${u.jerseyNumber}` : '--',
      `${monthsPaidCount} / 12 meses`,
      `S/ ${totalPaid.toFixed(2)}`,
      `S/ ${pendingBalance.toFixed(2)}`,
      pendingBalance === 0 ? 'AL DÍA' : 'PENDIENTE'
    ];
  });

  // Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 12, right: 12 },
    head: [['#', 'ATLETA / INTEGRANTE', 'DNI', 'CATEGORÍA', 'DORSAL', 'MESES PAGADOS', 'TOTAL ABONADO', 'SALDO DEUDOR', 'ESTADO']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', halign: 'left', cellWidth: 62 },
      2: { cellWidth: 26 },
      3: { fontStyle: 'bold', cellWidth: 35 },
      4: { cellWidth: 20 },
      5: { cellWidth: 32 },
      6: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 30 },
      7: { fontStyle: 'bold', textColor: [239, 68, 68], cellWidth: 30 },
      8: { fontStyle: 'bold', cellWidth: 28 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Executive Summary Strip
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 273, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('TOTALES GLOBALES:', 18, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text(`• Total Atletas Registrados: ${athletes.length}`, 60, currentY + 10);
  doc.text(`• Total Recaudado: `, 120, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`S/ ${globalRecaudado.toFixed(2)}`, 150, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`• Saldo Total por Cobrar: `, 190, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68);
  doc.text(`S/ ${globalPendiente.toFixed(2)}`, 230, currentY + 10);

  // Footer
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 203, 297, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`${clubName} • Reporte General de Recaudación Consolidada • Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 148, 207.5, { align: 'center' });

  
  currentY += 20;
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 30;
  }
  
  // Director Signature
  if (settings.directorSignatureUrl) {
    try {
      doc.addImage(settings.directorSignatureUrl, 'PNG', 135, currentY - 15, 45, 15);
    } catch (e) {}
  }
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.line(130, currentY, 190, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('FIRMA ALTA DIRECCIÓN', 160, currentY + 5, { align: 'center' });
  
  // Club Stamp
  if (settings.clubStampUrl) {
    try {
      doc.setGState(new (doc as any).GState({ opacity: 0.7 }));
      doc.addImage(settings.clubStampUrl, 'PNG', 85, currentY - 15, 40, 40);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch (e) {}
  }

  doc.save(`Resumen_General_Mensualidades_${year}.pdf`);
}
