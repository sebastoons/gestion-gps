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
      resolve();
    } catch (e) {
      reject(e);
    }
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});
