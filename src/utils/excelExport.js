// Export de "Trabajos del Mes" a Excel con ExcelJS — se cambió desde la
// librería "xlsx" porque su versión gratuita no escribe estilos de celda
// (bordes/relleno quedaban ignorados al abrir el archivo) y no soporta
// insertar imágenes, así que el logo por empresa era imposible con ella.
// Import dinámico: ExcelJS agrega ~260KB al bundle, y sólo hace falta
// cuando alguien realmente aprieta "Excel" — no en cada carga de la app.

// Mismo criterio de logo por empresa que usa OrdenesTrabajo.js (EmpresaLogos):
// coincide sin importar mayúsculas/espacios ("Mega GPS", "MEGAGPS", etc.).
const normEmpresa = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
const LOGO_POR_EMPRESA = { ugps: 'ugps.png', megagps: 'megagps.png', mavigps: 'mavigps.png' };

const COLUMNAS = [
  { header: 'ID', key: 'id', width: 9 },
  { header: 'Cliente', key: 'nombreCliente', width: 24 },
  { header: 'Fecha', key: 'fecha', width: 12 },
  { header: 'Servicio', key: 'servicio', width: 15 },
  { header: 'Accesorios', key: 'accesorios', width: 28 },
  { header: 'PPU IN', key: 'ppuIn', width: 10 },
  { header: 'PPU OUT', key: 'ppuOut', width: 10 },
  { header: 'IMEI IN', key: 'imeiIn', width: 16 },
  { header: 'IMEI OUT', key: 'imeiOut', width: 16 },
  { header: 'KM', key: 'km', width: 8 },
  { header: 'UF', key: 'uf', width: 8 },
  { header: 'Valor $', key: 'valorPesos', width: 14 },
];

const bordeFino = (color = 'D1D5DB') => ({
  top: { style: 'thin', color: { argb: `FF${color}` } },
  bottom: { style: 'thin', color: { argb: `FF${color}` } },
  left: { style: 'thin', color: { argb: `FF${color}` } },
  right: { style: 'thin', color: { argb: `FF${color}` } },
});

// Descarga el logo como base64 + sus proporciones reales, para insertarlo
// sin deformarlo. Si la empresa no tiene logo asignado, no agrega nada.
const cargarLogo = (empresa) => new Promise((resolve) => {
  const archivo = LOGO_POR_EMPRESA[normEmpresa(empresa)];
  if (!archivo) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    resolve({ base64, ratio: img.naturalWidth / img.naturalHeight });
  };
  img.onerror = () => resolve(null);
  img.src = `/logos/${archivo}`;
});

export const exportTrabajosToExcel = async (trabajos, filename, { empresa, mes, totales, tipoDocumento }) => {
  if (!trabajos.length) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    const { default: ExcelJS } = await import('exceljs/dist/exceljs.min.js');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Trabajos', { views: [{ showGridLines: false }] });
    ws.columns = COLUMNAS;

    const numCols = COLUMNAS.length;
    const finCol = String.fromCharCode(64 + numCols); // ej. 'L' para 12 columnas

    // ── Título ──
    ws.mergeCells(`A1:${finCol}1`);
    ws.getCell('A1').value = 'TRABAJOS DEL MES';
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 26;

    ws.mergeCells(`A2:${finCol}2`);
    ws.getCell('A2').value = `${empresa} — ${mes}`;
    ws.getCell('A2').font = { bold: true, size: 12, color: { argb: 'FF4B5563' } };
    ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    // ── Logo, esquina superior derecha (si la empresa tiene uno asignado) ──
    const logo = await cargarLogo(empresa);
    if (logo) {
      const imageId = wb.addImage({ base64: logo.base64, extension: 'png' });
      const alto = 42;
      const ancho = alto * logo.ratio;
      ws.addImage(imageId, {
        tl: { col: numCols - (ancho / 64), row: 0.05 },
        ext: { width: ancho, height: alto },
        editAs: 'oneCell',
      });
    }

    // ── Encabezados de la tabla (fila 4) ──
    const filaHeader = 4;
    const header = ws.getRow(filaHeader);
    header.values = COLUMNAS.map(c => c.header);
    header.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = bordeFino('1F2937');
    });

    // ── Filas de datos — el marco (borde) sólo va en las celdas con trabajos ──
    trabajos.forEach((t, i) => {
      const fila = ws.getRow(filaHeader + 1 + i);
      fila.values = [
        t.id, t.nombreCliente, t.fecha, t.servicio,
        (t.accesorios && t.accesorios.length) ? t.accesorios.join(', ') : '-',
        t.ppuIn || '-', t.ppuOut || '-', t.imeiIn || '-', t.imeiOut || '-',
        Number(t.km) || 0, Number(t.valorUF) || 0, Number(t.valorPesos) || 0,
      ];
      fila.eachCell({ includeEmpty: false }, cell => {
        cell.border = bordeFino();
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      fila.getCell('valorPesos').numFmt = '"$"#,##0';
      fila.getCell('valorPesos').alignment = { horizontal: 'right', vertical: 'middle' };
      if (i % 2 === 1) {
        fila.eachCell({ includeEmpty: false }, cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
    });

    // ── Resumen del mes ──
    let r = filaHeader + trabajos.length + 2;
    ws.mergeCells(r, 1, r, 2);
    ws.getCell(r, 1).value = 'RESUMEN DEL MES';
    ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    ws.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    r += 1;

    const filasResumen = [
      ['Total UF', totales.totalUF],
      ['Total Pesos', `$${Math.round(totales.totalPesos).toLocaleString('es-CL')}`],
      ['Total KM', totales.totalKm],
      ['Valor KM', `$${Math.round(totales.totalValorKm).toLocaleString('es-CL')}`],
    ];
    filasResumen.forEach(([label, val]) => {
      ws.getCell(r, 1).value = label;
      ws.getCell(r, 1).font = { bold: true };
      ws.getCell(r, 2).value = val;
      ws.getCell(r, 2).alignment = { horizontal: 'right' };
      r += 1;
    });
    r += 1;

    const esBoleta = tipoDocumento === 'boleta';
    const filasFinales = esBoleta
      ? [['Líquido', totales.subtotal], ['Retención (15.25%)', totales.retencion], ['Total Boleta', totales.totalBoleta]]
      : [['Subtotal', totales.subtotal], ['IVA (19%)', totales.iva], ['Total', totales.total]];
    filasFinales.forEach(([label, val], i) => {
      const destacado = i === 2;
      ws.getCell(r, 1).value = label;
      ws.getCell(r, 2).value = `$${Math.round(val).toLocaleString('es-CL')}`;
      [1, 2].forEach(c => {
        const cell = ws.getCell(r, c);
        cell.font = { bold: true, size: destacado ? 13 : 11, color: { argb: destacado ? 'FFFFFFFF' : 'FF1F2937' } };
        cell.alignment = { horizontal: c === 1 ? 'left' : 'right', vertical: 'middle' };
        if (destacado) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      });
      r += 1;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✓ Archivo Excel exportado correctamente');
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('❌ Error al generar el Excel. Por favor intenta nuevamente.');
  }
};
