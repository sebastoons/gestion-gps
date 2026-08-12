// Almacenamiento 100% local (sin backend). Cada "tabla" vive en su propia
// clave de localStorage, como un arreglo JSON de registros con id único.
const KEY = (name) => `servitrak_${name}`;

const readRaw = (name) => {
  try {
    const s = localStorage.getItem(KEY(name));
    if (!s) return [];
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`load ${name}:`, e);
    return [];
  }
};

const writeRaw = (name, items) => {
  try {
    localStorage.setItem(KEY(name), JSON.stringify(items));
    return null;
  } catch (e) {
    console.error(`save ${name}:`, e);
    return e;
  }
};

export const loadTable = async (name) => readRaw(name);

// Upsert: agrega o actualiza items por id. No borra nada (las bajas usan deleteFromTable).
// Retorna el error (si localStorage falla, p.ej. cuota excedida) o null si OK.
export const syncTable = async (name, items) => {
  if (!Array.isArray(items) || !items.length) return null;
  const current = readRaw(name);
  const byId = new Map(current.map(i => [i.id, i]));
  items.forEach(i => byId.set(i.id, i));
  return writeRaw(name, Array.from(byId.values()));
};

// Baja explícita: elimina uno o varios IDs.
export const deleteFromTable = async (name, ids) => {
  const list = Array.isArray(ids) ? ids : [ids];
  if (!list.length) return;
  const toDelete = new Set(list);
  const current = readRaw(name);
  writeRaw(name, current.filter(i => !toDelete.has(i.id)));
};

// ── Generador de IDs sin colisiones ─────────────────────────────────────────
// Los conteos tipo `array.filter(...).length + 1` se repiten después de borrar
// un registro (el largo del arreglo baja pero el máximo histórico no), lo que
// genera un id ya usado y el upsert de syncTable sobreescribe silenciosamente
// el registro viejo. nextId mantiene un contador persistente por clave que
// nunca decrece: al primer uso se autoinicializa buscando el número más alto
// ya presente entre los items existentes con ese mismo prefijo.
const nextId = (counterKey, existingItems, prefix) => {
  const storageKey = KEY(`counter_${counterKey}`);
  let n = parseInt(localStorage.getItem(storageKey), 10);
  if (!n || isNaN(n)) {
    n = (existingItems || []).reduce((max, it) => {
      if (typeof it?.id === 'string' && it.id.startsWith(prefix)) {
        const num = parseInt(it.id.slice(prefix.length), 10);
        if (!isNaN(num) && num > max) return num;
      }
      return max;
    }, 0);
  }
  n += 1;
  localStorage.setItem(storageKey, String(n));
  return `${prefix}${String(n).padStart(3, '0')}`;
};

// Prefijo de empresa: primera letra en mayúscula (E de Entel, U de UGPS, etc).
export const empresaPrefix = (empresa) => (empresa?.[0] || 'X').toUpperCase();

// IDs para trabajos: prefijo = letra de empresa (ej. "U004").
export const nextTrabajoId = (empresa, trabajosActuales) =>
  nextId(`trabajos_${empresa}`, trabajosActuales.filter(t => t.empresa === empresa), empresaPrefix(empresa));

// IDs para equipos/materiales: prefijo = letra de empresa + código de tipo (ej. "UN004", "UR004", "UM004").
export const nextEquipoId = (tabla, empresa, itemsActuales, tipoCodigo) =>
  nextId(`${tabla}_${empresa}`, itemsActuales.filter(it => it.empresa === empresa), `${empresaPrefix(empresa)}${tipoCodigo}`);

// ── Respaldo (exportar / importar todo) ─────────────────────────────────────
export const BACKUP_TABLES = [
  'trabajos', 'equipos_nuevos', 'equipos_retirados', 'equipos_malos',
  'clientes', 'materiales', 'ordenes_trabajo', 'ot_counters',
];

export const exportBackup = () => {
  const payload = {
    app: 'ServiTrak', version: 1, exportedAt: new Date().toISOString(),
    empresas: JSON.parse(localStorage.getItem('empresas') || '[]'),
    tablas: Object.fromEntries(BACKUP_TABLES.map(t => [t, readRaw(t)])),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = payload.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `servitrak_respaldo_${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Lee un archivo de respaldo y sobrescribe todas las tablas locales.
// Retorna una promesa que resuelve cuando termina de escribir en localStorage.
export const importBackup = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload || typeof payload !== 'object' || !payload.tablas) {
        reject(new Error('Archivo de respaldo inválido'));
        return;
      }
      BACKUP_TABLES.forEach(t => {
        const items = Array.isArray(payload.tablas[t]) ? payload.tablas[t] : [];
        writeRaw(t, items);
      });
      if (Array.isArray(payload.empresas) && payload.empresas.length) {
        localStorage.setItem('empresas', JSON.stringify(payload.empresas));
      }
      // Los contadores de nextId quedan obsoletos frente a los datos importados
      // (pueden ser más bajos que el máximo real importado y volver a chocar).
      // Se borran para que se re-inicialicen solos a partir de los ids importados.
      const counterPrefix = KEY('counter_');
      const staleCounterKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(counterPrefix)) staleCounterKeys.push(k);
      }
      staleCounterKeys.forEach(k => localStorage.removeItem(k));
      resolve();
    } catch (e) {
      reject(e);
    }
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});
