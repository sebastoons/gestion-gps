// Los inputs <input type="date"> guardan y devuelven siempre "YYYY-MM-DD"
// (formato ISO) — eso no se toca, porque de ahí dependen el date-math, los
// filtros por mes y el orden. formatFecha SOLO transforma el texto que se
// le muestra al usuario, a "DD/MM/YYYY".
export const formatFecha = (iso) => {
  if (!iso || typeof iso !== 'string') return iso || '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
};
