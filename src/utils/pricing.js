// Precios por empresa — valor UF, valor por km, y las tablas de precio de
// cada servicio/accesorio. Antes eran valores fijos compartidos por toda la
// app (un solo valor UF, un solo precio por servicio/accesorio sin importar
// la empresa); ahora cada empresa tiene su propia configuración, guardada en
// Supabase (tabla precios_empresa) igual que el resto de los datos, editable
// desde "Valor de Trabajos" con un selector de empresa.

export const SERVICIOS = ['Instalación', 'Desinstalación', 'Mantención', 'Reinstalación', 'Visita Fallida', 'Sin Servicio'];

// Un solo listado de accesorios para toda la app — antes Trabajos.js y
// ValidacionWhatsapp.js tenían cada uno el suyo con nombres distintos para
// lo mismo (ej. "Sensor Puerta" vs "sensor puerta"), así que un precio
// editado para un accesorio en una pantalla no tenía cómo aplicarse en la
// otra. "Cipia"/"Dashcam"/"Básico" sólo se usaban antes en Validación
// WhatsApp, sin precio asignado (quedaban en $0, se mantiene ese default).
export const ACCESORIOS = [
  'ON BATT', 'Edata', 'Dallas', 'Buzzer', 'SOS', 'Inmovilizador 12v', 'Inmovilizador 24v',
  'GPS Externo', 'Sensor T°', 'Sensor Puerta', 'Cipia', 'Dashcam', 'Básico',
];

const DEFAULT_SERVICIOS = {
  'Instalación': 0.8, 'Desinstalación': 0.5, 'Mantención': 0.7,
  'Reinstalación': 0.8, 'Visita Fallida': 0.5, 'Sin Servicio': 0,
};
const DEFAULT_ACCESORIOS = {
  'ON BATT': 0.6, 'Edata': 0.6, 'Dallas': 0.4, 'Buzzer': 0.4, 'SOS': 0.4,
  'Inmovilizador 12v': 0.4, 'Inmovilizador 24v': 0.4, 'GPS Externo': 0.3,
  'Sensor T°': 0.4, 'Sensor Puerta': 0.6, 'Cipia': 0, 'Dashcam': 0, 'Básico': 0,
};

// Config "de fábrica" para una empresa que todavía no tiene precios propios
// guardados — son los mismos valores que usaba toda la app antes de este
// cambio, así que nada se altera para nadie hasta que alguien entre a
// "Valor de Trabajos" y los personalice para su empresa.
export const preciosPorDefecto = (empresa) => ({
  valorUF: 40000,
  valorKm: empresa === 'Entel' ? 200 : 250,
  servicios: { ...DEFAULT_SERVICIOS },
  accesorios: { ...DEFAULT_ACCESORIOS },
});

// Precios de una empresa, completando con los valores por defecto cualquier
// servicio/accesorio que le falte (ej. si se agrega un accesorio nuevo a la
// lista después de que esa empresa ya guardó los suyos).
export const preciosDe = (empresa, preciosEmpresas) => {
  const base = preciosPorDefecto(empresa);
  const guardado = preciosEmpresas?.[empresa];
  if (!guardado) return base;
  return {
    valorUF: typeof guardado.valorUF === 'number' ? guardado.valorUF : base.valorUF,
    valorKm: typeof guardado.valorKm === 'number' ? guardado.valorKm : base.valorKm,
    servicios: { ...base.servicios, ...guardado.servicios },
    accesorios: { ...base.accesorios, ...guardado.accesorios },
  };
};

// "ON BATT" en una Instalación no es un accesorio que se SUMA al valor base:
// es un tipo de instalación alternativo con su propio precio total (el que
// tenga configurado "ON BATT" para esa empresa) — igual para Trabajos del
// Mes y Validación WhatsApp, las dos pantallas que cobran un trabajo.
export const calcularUF = (servicio, accesorios, precios) => {
  const tieneOnBatt = accesorios.includes('ON BATT');
  const usaInstOnBatt = servicio === 'Instalación' && tieneOnBatt;
  const costoServicio = usaInstOnBatt ? (precios.accesorios['ON BATT'] || 0) : (precios.servicios[servicio] || 0);
  const costoAccesorios = accesorios
    .filter(acc => !(usaInstOnBatt && acc === 'ON BATT'))
    .reduce((sum, acc) => sum + (precios.accesorios[acc] || 0), 0);
  return costoServicio + costoAccesorios;
};
