import * as XLSX from 'xlsx';

// Mapeo de nombres de columnas para mejorar la presentación
const columnNames = {
  // Trabajos
  id: 'ID',
  nombreCliente: 'Nombre Cliente',
  fecha: 'Fecha',
  servicio: 'Servicio',
  accesorios: 'Accesorios',
  ppuIn: 'PPU IN',
  ppuOut: 'PPU OUT',
  imeiIn: 'IMEI IN',
  imeiOut: 'IMEI OUT',
  km: 'Kilómetros',
  valorUF: 'Valor UF',
  valorPesos: 'Valor Pesos',
  empresa: 'Empresa',
  mes: 'Mes',
  
  // Equipos
  fechaRecepcion: 'Fecha Recepción',
  imei: 'IMEI',
  asignado: 'Asignado',
  estado: 'Estado',
  cliente: 'Cliente',
  
  // Clientes
  nombreContacto1: 'Contacto 1',
  telefono1: 'Teléfono 1',
  nombreContacto2: 'Contacto 2',
  telefono2: 'Teléfono 2',
  region: 'Región',
  ciudad: 'Ciudad',
  comuna: 'Comuna',
  direccion: 'Dirección',
  tipoVehiculo: 'Tipo Vehículo'
};

// Función para formatear valores
const formatValue = (value, key) => {
  if (value === null || value === undefined || value === '') return '-';
  
  // Formatear arrays (accesorios)
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  // Formatear booleanos
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  
  // Formatear números de pesos
  if (key === 'valorPesos' && typeof value === 'string') {
    const num = parseInt(value);
    return isNaN(num) ? value : `$${num.toLocaleString('es-CL')}`;
  }
  
  // Formatear estados
  if (key === 'estado') {
    const estados = {
      'disponible': 'Disponible',
      'asignado': 'Asignado',
      'perdido': 'Perdido'
    };
    return estados[value] || value;
  }
  
  return value;
};

// Exportar a Excel con formato mejorado
export const exportToCSV = (data, filename) => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Preparar los datos con nombres de columnas en español
  const headers = Object.keys(data[0]);
  const headerNames = headers.map(h => columnNames[h] || h);
  
  // Formatear los datos
  const formattedData = data.map(row => {
    const formattedRow = {};
    headers.forEach(key => {
      const headerName = columnNames[key] || key;
      formattedRow[headerName] = formatValue(row[key], key);
    });
    return formattedRow;
  });

  // Crear el libro de Excel
  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  // Ajustar ancho de columnas automáticamente
  const colWidths = headerNames.map(header => {
    const maxLength = Math.max(
      header.length,
      ...formattedData.map(row => {
        const value = row[header];
        return value ? value.toString().length : 0;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Máximo 50 caracteres de ancho
  });
  ws['!cols'] = colWidths;

  // Aplicar estilo a los encabezados (primera fila)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Generar el archivo Excel
  XLSX.writeFile(wb, `${filename}.xlsx`);
  
  alert('✓ Archivo Excel exportado correctamente');
};