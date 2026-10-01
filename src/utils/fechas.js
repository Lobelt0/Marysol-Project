export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS_LETRA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function armarClave(anio, mes, dia) {
  return `${anio}-${pad(mes + 1)}-${pad(dia)}`;
}

export function claveDia(fecha) {
  const d = new Date(fecha);
  return armarClave(d.getFullYear(), d.getMonth(), d.getDate());
}

export function letraDia(fecha) {
  return DIAS_LETRA[new Date(fecha).getDay()];
}

export function horaCorta(fecha) {
  const d = new Date(fecha);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatearMoneda(n) {
  const v = Math.round(Number(n) || 0);
  return '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatoCorto(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(Math.round(v));
}

export function formatoFecha(fecha) {
  const d = new Date(fecha);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}