// Valor de la UF en pesos, compartido entre Trabajos del Mes, Validación
// WhatsApp y Valor de Trabajos — antes cada pantalla tenía su propio número
// (40000, 39000 y 38500 respectivamente) así que el mismo trabajo quedaba
// facturado distinto según por dónde se hubiera ingresado.
export const VALOR_UF_KEY = 'valorUFActual';
export const getValorUFActual = () => Number(localStorage.getItem(VALOR_UF_KEY)) || 40000;
export const setValorUFActual = (valor) => localStorage.setItem(VALOR_UF_KEY, String(valor));
