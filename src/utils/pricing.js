// Valor de la UF en pesos, compartido entre Trabajos del Mes, Validación
// WhatsApp y Valor de Trabajos — antes cada pantalla tenía su propio número
// (40000, 39000 y 38500 respectivamente) así que el mismo trabajo quedaba
// facturado distinto según por dónde se hubiera ingresado.
export const VALOR_UF_KEY = 'valorUFActual';
export const getValorUFActual = () => {
  // "!== null" en vez de "||": un valor guardado en 0 (campo vaciado sin
  // querer) no debe coincidir con "no hay nada guardado todavía" — con "||"
  // un 0 legítimo se pisaba con el default 40000 en cada lectura, y encima
  // el efecto que persiste valorUFMes en Trabajos.js lo reescribía así al
  // toque en localStorage.
  const guardado = localStorage.getItem(VALOR_UF_KEY);
  if (guardado === null) return 40000;
  const num = Number(guardado);
  return isNaN(num) ? 40000 : num;
};
export const setValorUFActual = (valor) => localStorage.setItem(VALOR_UF_KEY, String(valor));
