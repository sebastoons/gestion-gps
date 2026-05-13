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

// Upsert: agrega o actualiza items. No borra nada (las bajas usan deleteFromTable).
export const syncTable = async (name, items) => {
  if (!Array.isArray(items) || !items.length) return;
  const { error } = await supabase.from(name)
    .upsert(items.map(i => ({ id: i.id, data: i })), { onConflict: 'id' });
  if (error) console.error(`sync ${name}:`, error);
};

// Baja explícita: elimina uno o varios IDs de Supabase.
export const deleteFromTable = async (name, ids) => {
  const list = Array.isArray(ids) ? ids : [ids];
  if (!list.length) return;
  const { error } = await supabase.from(name).delete().in('id', list);
  if (error) console.error(`delete ${name}:`, error);
};
