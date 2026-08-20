import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://nqrlapfucxanwkegdyac.supabase.co',
  'sb_publishable_NekdeBITxpK5_jmQPEmsQA_ujT4f8_H'
);

export const loadTable = async (name) => {
  const { data, error } = await supabase.from(name).select('data');
  if (error) { console.error(`load ${name}:`, error); return []; }
  return data.map(r => r.data);
};

// Upsert: agrega o actualiza items por id. No borra nada (las bajas usan deleteFromTable).
export const syncTable = async (name, items) => {
  if (!Array.isArray(items) || !items.length) return null;
  const { error } = await supabase.from(name)
    .upsert(items.map(i => ({ id: i.id, data: i })), { onConflict: 'id' });
  if (error) { console.error(`sync ${name}:`, error); return error; }
  return null;
};

// Baja explícita: elimina uno o varios IDs.
export const deleteFromTable = async (name, ids) => {
  const list = Array.isArray(ids) ? ids : [ids];
  if (!list.length) return;
  const { error } = await supabase.from(name).delete().in('id', list);
  if (error) console.error(`delete ${name}:`, error);
};

// ── Generador de IDs sin colisiones (multi-dispositivo) ─────────────────────
// Usa la función Postgres next_counter (UPSERT atómico) para que dos
// dispositivos escribiendo casi al mismo tiempo nunca reciban el mismo id.
// p_seed sólo se usa la primera vez que se ve esa clave: se calcula del
// máximo id ya presente entre los items actuales, para no chocar con datos
// preexistentes.
export const empresaPrefix = (empresa) => (empresa?.[0] || 'X').toUpperCase();

const nextId = async (counterKey, existingItems, prefix) => {
  const seed = (existingItems || []).reduce((max, it) => {
    if (typeof it?.id === 'string' && it.id.startsWith(prefix)) {
      const num = parseInt(it.id.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) return num;
    }
    return max;
  }, 0);
  const { data, error } = await supabase.rpc('next_counter', { p_key: counterKey, p_seed: seed });
  if (error) { console.error(`nextId ${counterKey}:`, error); throw error; }
  return `${prefix}${String(data).padStart(3, '0')}`;
};

// IDs para trabajos: prefijo = letra de empresa (ej. "U004").
export const nextTrabajoId = (empresa, trabajosActuales) =>
  nextId(`trabajos_${empresa}`, trabajosActuales.filter(t => t.empresa === empresa), empresaPrefix(empresa));

// IDs para equipos/materiales: prefijo = letra de empresa + código de tipo (ej. "UN004").
export const nextEquipoId = (tabla, empresa, itemsActuales, tipoCodigo) =>
  nextId(`${tabla}_${empresa}`, itemsActuales.filter(it => it.empresa === empresa), `${empresaPrefix(empresa)}${tipoCodigo}`);

// IDs para clientes: prefijo fijo "CL" (compartido entre todas las empresas).
export const nextClienteId = (clientesActuales) =>
  nextId('clientes', clientesActuales, 'CL');

// ── Respaldo (exportar / importar todo) ─────────────────────────────────────
export const BACKUP_TABLES = [
  'trabajos', 'equipos_nuevos', 'equipos_retirados', 'equipos_malos',
  'clientes', 'materiales', 'ordenes_trabajo', 'ot_counters',
];

export const exportBackup = async () => {
  const tablas = {};
  for (const t of BACKUP_TABLES) tablas[t] = await loadTable(t);
  const payload = {
    app: 'ServiTrak', version: 1, exportedAt: new Date().toISOString(),
    empresas: JSON.parse(localStorage.getItem('empresas') || '[]'),
    tablas,
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

// Lee un archivo de respaldo y sobrescribe (upsert) las tablas en Supabase.
export const importBackup = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload || typeof payload !== 'object' || !payload.tablas) {
        reject(new Error('Archivo de respaldo inválido'));
        return;
      }
      for (const t of BACKUP_TABLES) {
        const items = Array.isArray(payload.tablas[t]) ? payload.tablas[t] : [];
        if (items.length) await syncTable(t, items);
      }
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
