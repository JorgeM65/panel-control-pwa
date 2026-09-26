// Backup completo del storage local. Conserva cada valor exactamente como lo
// devuelve getItem(key).value (string crudo, sea JSON o no) — nunca lo
// re-interpreta ni lo normaliza. Ver Fase 5, Bloque 1, para el diseño completo.

import { getItem, setItem } from '../storage/storage';
import { DEFAULT_ENTRETENIMIENTO, DEFAULT_TIEMPO, DEFAULT_NOTIFICACIONES } from '../constants';

const APP_ID = 'panel-control-pwa';
const BACKUP_VERSION = 1;

// Las 14 claves reales del storage actual. No añadir/quitar sin auditar el
// código real primero — este archivo debe reflejar exactamente lo que
// App.jsx y JuegoTab.jsx persisten, no lo que "debería" existir.
export const BACKUP_KEYS = [
  'tareas', 'calendario', 'entretenimiento', 'habitos', 'compra',
  'capsulas', 'notas', 'tiempo', 'ruleta', 'notificaciones',
  'fechas', 'predicciones', 'gastos', 'juego_best',
];

// Única clave sin formato JSON — todas las demás llevan JSON.stringify.
const NON_JSON_KEYS = new Set(['juego_best']);

// Valor real que usa la app cuando una clave todavía no existe en storage
// (instalación nueva o módulo nunca usado) — los mismos defaults que ya usa
// App.jsx, reutilizados aquí sin duplicarlos.
const DEFAULT_VALUES = {
  tareas: '[]',
  calendario: '[]',
  entretenimiento: JSON.stringify(DEFAULT_ENTRETENIMIENTO),
  habitos: '[]',
  compra: '[]',
  capsulas: '[]',
  notas: '[]',
  tiempo: JSON.stringify(DEFAULT_TIEMPO),
  ruleta: '[]',
  notificaciones: JSON.stringify(DEFAULT_NOTIFICACIONES),
  fechas: '[]',
  predicciones: '[]',
  gastos: '[]',
  // JuegoTab.jsx inicializa su estado en memoria con useState(0) y solo
  // escribe en storage la primera vez que se supera un récord — "sin
  // récord todavía" se representa como 0, igual que en memoria.
  juego_best: '0',
};

function formatDateForFilename(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Lee las 14 claves y construye el objeto de backup. Si una clave existe,
// usa exactamente su string almacenado, sin tocarlo. Si no existe todavía
// (instalación nueva o módulo nunca usado), usa el mismo default real que
// usaría la propia app — nunca inventa un valor distinto al que la app ya
// utilizaría en memoria.
export async function exportBackup() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    try {
      const res = await getItem(key);
      data[key] = (res && typeof res.value === 'string') ? res.value : DEFAULT_VALUES[key];
    } catch (e) {
      // La clave no existe todavía — no es un error real, es el estado
      // esperado de un módulo sin usar.
      data[key] = DEFAULT_VALUES[key];
    }
  }
  const backup = {
    app: APP_ID,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(backup, null, 2);
}

// Descarga un string como archivo .json, sin dependencias externas.
// filenamePrefix distingue el backup normal del backup de seguridad previo
// a una restauración.
export function downloadBackupFile(jsonString, filenamePrefix = 'panel-control-backup') {
  const filename = `${filenamePrefix}-${formatDateForFilename(new Date())}.json`;
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

// Valida un objeto ya parseado (JSON.parse ya hecho por el llamador).
// Devuelve { valid: true } o { valid: false, error }.
export function validateBackup(parsed) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'El archivo no es un backup válido.' };
  }
  if (parsed.app !== APP_ID) {
    return { valid: false, error: 'Este archivo no pertenece a Panel de Control.' };
  }
  if (typeof parsed.backupVersion !== 'number') {
    return { valid: false, error: 'El backup no indica una versión válida.' };
  }
  if (parsed.backupVersion > BACKUP_VERSION) {
    return { valid: false, error: 'Este backup fue creado con una versión más reciente de la aplicación.' };
  }
  if (parsed.backupVersion < BACKUP_VERSION) {
    return { valid: false, error: 'Este backup es de una versión anterior no compatible.' };
  }
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    return { valid: false, error: 'El backup no contiene datos.' };
  }
  for (const key of BACKUP_KEYS) {
    if (!(key in parsed.data)) {
      return { valid: false, error: `Falta la clave "${key}". La importación ha sido cancelada.` };
    }
    if (typeof parsed.data[key] !== 'string') {
      return { valid: false, error: 'El backup contiene datos con un formato no compatible.' };
    }
  }
  // Validación superficial de contenido — solo para detectar un backup
  // corrupto antes de escribir, sin duplicar la lógica de cada dominio (eso
  // ya lo hace load() con su propio try/catch al leer, igual que siempre).
  for (const key of BACKUP_KEYS) {
    const value = parsed.data[key];
    if (NON_JSON_KEYS.has(key)) {
      if (value !== '' && Number.isNaN(Number(value))) {
        return { valid: false, error: 'El backup contiene datos con un formato no compatible.' };
      }
    } else {
      try {
        JSON.parse(value);
      } catch (e) {
        return { valid: false, error: 'El backup contiene datos con un formato no compatible.' };
      }
    }
  }
  return { valid: true };
}

// Resumen legible del contenido, solo para mostrar antes de confirmar — el
// parseo aquí es temporal, nunca se usa para restaurar (eso escribe el
// string original tal cual, ver importBackup).
export function summarizeBackup(parsed) {
  const summary = {};
  for (const key of BACKUP_KEYS) {
    const raw = parsed.data[key];
    if (NON_JSON_KEYS.has(key)) {
      summary[key] = raw ? Number(raw) : 0;
      continue;
    }
    try {
      const value = JSON.parse(raw);
      summary[key] = Array.isArray(value) ? value.length : 'Configurado';
    } catch (e) {
      summary[key] = 'Configurado';
    }
  }
  return summary;
}

// Escribe las 14 claves secuencialmente, deteniéndose en el primer fallo.
// No hay transacciones en window.storage — si algo falla, no sigue
// escribiendo, y devuelve qué clave falló y cuáles sí se llegaron a escribir.
export async function importBackup(parsed) {
  const written = [];
  for (const key of BACKUP_KEYS) {
    try {
      const res = await setItem(key, parsed.data[key]);
      if (!res) {
        return { ok: false, failedKey: key, written };
      }
      written.push(key);
    } catch (e) {
      return { ok: false, failedKey: key, written };
    }
  }
  return { ok: true, written };
}
