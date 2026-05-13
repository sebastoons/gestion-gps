import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wxezsuvvwbjntnalqrzh.supabase.co',
  'sb_publishable_izV0HxOqymo4wFebrCPU-g_k0P1LA7G'
);

export const loadTable = async (name) => {
  const { data, error } = await supabase.from(name).select('data');
  if (error) { console.error(`load ${name}:`, error); return null; }
  return data.map(r => r.data);
};

// Tombstone: registra IDs eliminados para que syncTable no los restaure desde otro dispositivo
const getDeletedIds = (tableName) => {
  try { return new Set(JSON.parse(localStorage.getItem(`_del_${tableName}`) || '[]')); }
  catch { return new Set(); }
};

export const markDeleted = (tableName, ids) => {
  try {
    const key = `_del_${tableName}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const toAdd = Array.isArray(ids) ? ids : [ids];
    const merged = [...new Set([...list, ...toAdd])];
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {}
};

export const syncTable = async (name, items) => {
  if (!Array.isArray(items)) return;

  // Leer estado remoto para preservar datos de otros dispositivos,
  // pero excluir IDs que este dispositivo eliminó explícitamente (tombstone)
  const deletedIds = getDeletedIds(name);
  const { data: remote } = await supabase.from(name).select('id, data');
  const localIds = new Set(items.map(i => i.id));
  const remoteExtra = (remote || [])
    .map(r => r.data)
    .filter(r => !localIds.has(r.id) && !deletedIds.has(r.id));
  const merged = [...items, ...remoteExtra];

  if (!merged.length) {
    await supabase.from(name).delete().neq('id', '__x__');
    return;
  }
  const { error: de } = await supabase.from(name).delete().neq('id', '__x__');
  if (de) { console.error(`delete ${name}:`, de); return; }
  const { error: ie } = await supabase.from(name)
    .upsert(merged.map(i => ({ id: i.id, data: i })), { onConflict: 'id' });
  if (ie) console.error(`upsert ${name}:`, ie);
};
