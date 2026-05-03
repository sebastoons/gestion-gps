import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wxezsuvvwbjntnalqrzh.supabase.co',
  'sb_publishable_izV0HxOqymo4wFebrCPU-g_k0P1LA7G'
);

export const loadTable = async (name) => {
  const { data, error } = await supabase.from(name).select('data');
  if (error) { console.error(`load ${name}:`, error); return []; }
  return data.map(r => r.data);
};

export const syncTable = async (name, items) => {
  const { error: de } = await supabase.from(name).delete().neq('id', '__x__');
  if (de) { console.error(`delete ${name}:`, de); return; }
  if (!items.length) return;
  const { error: ie } = await supabase.from(name).insert(items.map(i => ({ id: i.id, data: i })));
  if (ie) console.error(`insert ${name}:`, ie);
};
