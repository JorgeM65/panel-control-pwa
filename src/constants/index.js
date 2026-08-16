// Constantes y configuración de datos, extraídas tal cual de App.jsx (Fase 2).
// Sin lógica, sin estado, sin dependencias de React — movimiento mecánico.

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DIAS_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const PRIORIDADES = {
  alta: { label: 'Alta', color: '#E2637A' },
  media: { label: 'Media', color: '#E3AC4C' },
  baja: { label: 'Baja', color: '#58D398' },
};

export const LIGAS_FUTBOL = [
  { id: 'laliga', name: 'LaLiga', apiName: 'Spanish La Liga', idTable: 4335 },
  { id: 'champions', name: 'Champions League', apiName: 'UEFA Champions League', idTable: null },
  { id: 'premier', name: 'Premier League', apiName: 'English Premier League', idTable: 4328 },
  { id: 'seriea', name: 'Serie A', apiName: 'Italian Serie A', idTable: 4332 },
  { id: 'bundesliga', name: 'Bundesliga', apiName: 'German Bundesliga', idTable: 4331 },
  { id: 'ligue1', name: 'Ligue 1', apiName: 'French Ligue 1', idTable: 4334 },
];

export const PLATAFORMAS = [
  { id: 8, name: 'Netflix' },
  { id: 337, name: 'Disney+' },
  { id: 119, name: 'Prime Video' },
  { id: 1899, name: 'Max' },
  { id: 149, name: 'Movistar Plus+' },
  { id: 63, name: 'Filmin' },
];

export const NAV_ITEMS = [
  { key: 'tareas', label: 'Tareas', icon: '✓' },
  { key: 'calendario', label: 'Calendario', icon: '📅' },
  { key: 'habitos', label: 'Hábitos', icon: '🔥' },
  { key: 'compra', label: 'Compra', icon: '🛒' },
  { key: 'notas', label: 'Notas', icon: '📝' },
  { key: 'fechas', label: 'Fechas', icon: '🎂' },
  { key: 'finanzas', label: 'Finanzas', icon: '💶' },
  { key: 'futbol', label: 'Fútbol', icon: '⚽' },
  { key: 'estrenos', label: 'Estrenos', icon: '🎬' },
  { key: 'capsula', label: 'Cápsula', icon: '⏳' },
  { key: 'ruleta', label: 'Ruleta', icon: '🎡' },
  { key: 'tiempo', label: 'Tiempo', icon: '🌤️' },
  { key: 'juego', label: 'Juego', icon: '🎮' },
  { key: 'datos', label: 'Datos', icon: '📊' },
  { key: 'ajustes', label: 'Ajustes', icon: '⚙' },
];

export const NAV_GROUPS = [
  { label: 'Productividad', items: ['tareas', 'calendario', 'habitos', 'compra', 'notas', 'fechas', 'finanzas'] },
  { label: 'Fútbol y ocio', items: ['futbol', 'estrenos', 'capsula', 'ruleta', 'tiempo', 'juego'] },
  { label: 'Sistema', items: ['datos', 'ajustes'] },
];

export const RULETA_COLORS = ['#4DD9CE', '#E3AC4C', '#E2637A', '#58D398', '#9C93E8'];

export const DEFAULT_ENTRETENIMIENTO = {
  futbol: { leagues: [], teams: [] },
  estrenos: { apiKey: '', providers: [] },
};

export const DEFAULT_TIEMPO = { city: '', lat: null, lon: null };

export const DEFAULT_NOTIFICACIONES = {
  manana: { activo: true, hora: '08:00' },
  noche: { activo: true, hora: '21:00' },
  capsula: true,
};

export const CATEGORIAS_GASTO = [
  { id: 'comida', label: 'Comida', icon: '🍽️' },
  { id: 'transporte', label: 'Transporte', icon: '🚗' },
  { id: 'ocio', label: 'Ocio', icon: '🎭' },
  { id: 'casa', label: 'Casa', icon: '🏠' },
  { id: 'otros', label: 'Otros', icon: '📦' },
];
