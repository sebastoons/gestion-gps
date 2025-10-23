import * as XLSX from 'xlsx';

/**
 * EXPORTACIÓN HÍBRIDA: Excel con Diseño Visual
 * Combina la funcionalidad de Excel con el diseño visual de la app
 */

// Función para calcular totales (igual que en la app)
const calcularTotales = (trabajos, valorKm = 150) => {
  const totalUF = trabajos.reduce((sum, t) => sum + (parseFloat(t.valorUF) || 0), 0);
  const totalPesos = trabajos.reduce((sum, t) => sum + (parseFloat(t.valorPesos) || 0), 0);
  const totalKm = trabajos.reduce((sum, t) => sum + (parseFloat(t.km) || 0), 0);
  const totalValorKm = totalKm * valorKm;
  const subtotal = totalPesos + totalValorKm;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return { totalUF, totalPesos, totalKm, totalValorKm, subtotal, iva, total };
};

export const exportToStyledExcel = (trabajos, filename, empresaSeleccionada, mesSeleccionado, valorKmPorEmpresa = 150) => {
  if (trabajos.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    // Calcular totales
    const totales = calcularTotales(trabajos, valorKmPorEmpresa);

    // Preparar los datos de la tabla
    const tableData = trabajos.map(t => ({
      'ID': t.id,
      'Cliente': t.nombreCliente,
      'Fecha': t.fecha,
      'Servicio': t.servicio,
      'Accesorios': (t.accesorios && t.accesorios.length > 0) ? t.accesorios.join(', ') : '-',
      'PPU IN': t.ppuIn || '-',
      'PPU OUT': t.ppuOut || '-',
      'IMEI IN': t.imeiIn || '-',
      'IMEI OUT': t.imeiOut || '-',
      'KM': t.km || '0',
      'UF': t.valorUF || '0',
      'Valor $': `$${Number(t.valorPesos || 0).toLocaleString('es-CL')}`
    }));

    // Crear filas del encabezado
    const headerRows = [
      ['TRABAJOS DEL MES'], // Título principal
      [`${empresaSeleccionada} - ${mesSeleccionado}`], // Subtítulo
      [], // Fila vacía
      [] // Fila para headers de tabla
    ];

    // Agregar los datos de la tabla
    const dataWithHeaders = [
      ...headerRows,
      ...XLSX.utils.sheet_to_json(XLSX.utils.json_to_sheet(tableData), { header: 1 })
    ];

    // Agregar filas de totales
    const totalRows = [
      [], // Fila vacía
      ['RESUMEN DEL MES'],
      [],
      ['Concepto', 'Valor'],
      ['Total UF', totales.totalUF],
      ['Total Pesos', `$${totales.totalPesos.toLocaleString('es-CL')}`],
      ['Total KM', totales.totalKm],
      ['Valor KM', `$${totales.totalValorKm.toLocaleString('es-CL')}`],
      [],
      ['Subtotal', `$${totales.subtotal.toLocaleString('es-CL')}`],
      ['IVA (19%)', `$${Math.round(totales.iva).toLocaleString('es-CL')}`],
      ['TOTAL', `$${Math.round(totales.total).toLocaleString('es-CL')}`]
    ];

    // Combinar todo
    const allData = [...dataWithHeaders, ...totalRows];

    // Crear el worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Calcular el rango
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Estilos para el título principal (fila 0)
    const titleCell = 'A1';
    if (ws[titleCell]) {
      ws[titleCell].s = {
        font: { 
          bold: true, 
          size: 18,
          color: { rgb: "FFFFFF" }
        },
        fill: { fgColor: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Estilos para el subtítulo (fila 1)
    const subtitleCell = 'A2';
    if (ws[subtitleCell]) {
      ws[subtitleCell].s = {
        font: { 
          bold: true, 
          size: 14,
          color: { rgb: "4B5563" }
        },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Estilos para headers de la tabla (fila 4)
    const headerRow = 4;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    // Estilos para las celdas de datos (filas 5 en adelante hasta antes de los totales)
    for (let row = headerRow + 1; row < headerRow + 1 + trabajos.length; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "D1D5DB" } },
              bottom: { style: "thin", color: { rgb: "D1D5DB" } },
              left: { style: "thin", color: { rgb: "D1D5DB" } },
              right: { style: "thin", color: { rgb: "D1D5DB" } }
            }
          };
          
          // Alternar colores de fila
          if (row % 2 === 0) {
            ws[cellAddress].s.fill = { fgColor: { rgb: "F9FAFB" } };
          }
        }
      }
    }

    // Buscar la fila donde empiezan los totales
    const totalStartRow = headerRow + trabajos.length + 2;

    // Estilos para el título "RESUMEN DEL MES"
    const resumenTitleCell = XLSX.utils.encode_cell({ r: totalStartRow, c: 0 });
    if (ws[resumenTitleCell]) {
      ws[resumenTitleCell].s = {
        font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Estilos para headers de totales
    const headersTotalesRow = totalStartRow + 2;
    for (let col = 0; col < 2; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headersTotalesRow, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "6B7280" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Estilos para filas de totales
    for (let i = 0; i < 4; i++) {
      const row = headersTotalesRow + 1 + i;
      for (let col = 0; col < 2; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: { horizontal: col === 0 ? "left" : "right", vertical: "center" },
            font: { bold: col === 1 }
          };
          
          // Colores específicos para cada total
          if (i === 0) ws[cellAddress].s.font.color = { rgb: "3B82F6" }; // UF - azul
          if (i === 1) ws[cellAddress].s.font.color = { rgb: "16A34A" }; // Pesos - verde
          if (i === 2) ws[cellAddress].s.font.color = { rgb: "9333EA" }; // KM - morado
          if (i === 3) ws[cellAddress].s.font.color = { rgb: "EA580C" }; // Valor KM - naranja
        }
      }
    }

    // Estilos para Subtotal, IVA y TOTAL (destacados)
    const subtotalRow = headersTotalesRow + 6;
    for (let i = 0; i < 3; i++) {
      const row = subtotalRow + i;
      for (let col = 0; col < 2; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: col === 0 ? "left" : "right", vertical: "center" }
          };
          
          // Destacar el TOTAL en color azul fuerte
          if (i === 2) {
            ws[cellAddress].s.fill = { fgColor: { rgb: "3B82F6" } };
            ws[cellAddress].s.font.color = { rgb: "FFFFFF" };
            ws[cellAddress].s.font.size = 14;
          }
        }
      }
    }

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 10 },  // ID
      { wch: 25 },  // Cliente
      { wch: 12 },  // Fecha
      { wch: 15 },  // Servicio
      { wch: 30 },  // Accesorios
      { wch: 12 },  // PPU IN
      { wch: 12 },  // PPU OUT
      { wch: 18 },  // IMEI IN
      { wch: 18 },  // IMEI OUT
      { wch: 8 },   // KM
      { wch: 8 },   // UF
      { wch: 15 }   // Valor $
    ];
    ws['!cols'] = columnWidths;

    // Merge cells para el título principal
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Subtítulo
      { s: { r: totalStartRow, c: 0 }, e: { r: totalStartRow, c: 1 } } // "RESUMEN DEL MES"
    ];

    // Crear el libro y agregar la hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trabajos');

    // Guardar el archivo
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    alert('✓ Excel exportado con formato visual de la app');
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('❌ Error al generar el Excel. Por favor intenta nuevamente.');
  }
};