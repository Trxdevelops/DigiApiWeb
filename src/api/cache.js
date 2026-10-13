// BONUS: caché en localStorage para no repetir peticiones que ya se han hecho.
// Cada respuesta se guarda con la hora en la que llegó y se descarta cuando caduca.
import { CACHE_PREFIX, CACHE_TTL } from '../config.js';

// Devuelve los datos guardados para esa clave, o null si no hay (o han caducado)
export function readCache(key) {
  try {
    const saved = localStorage.getItem(CACHE_PREFIX + key);
    if (!saved) return null;

    const entry = JSON.parse(saved);
    const isExpired = Date.now() - entry.time > CACHE_TTL;

    if (isExpired) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    // localStorage bloqueado (modo privado) o JSON roto: hacemos como si no hubiera caché
    return null;
  }
}

export function writeCache(key, data) {
  const entry = JSON.stringify({ time: Date.now(), data });

  try {
    localStorage.setItem(CACHE_PREFIX + key, entry);
  } catch {
    // Lo normal es que localStorage esté lleno: vaciamos nuestra caché y lo intentamos otra vez
    clearCache();
    try {
      localStorage.setItem(CACHE_PREFIX + key, entry);
    } catch {
      // Si aun así no cabe, la app sigue funcionando, solo que sin caché
    }
  }
}

// Claves de localStorage que son de esta app (otras webs del mismo origen no se tocan)
function getCacheKeys() {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX));
  } catch {
    return [];
  }
}

export function clearCache() {
  getCacheKeys().forEach((key) => localStorage.removeItem(key));
}

// Al arrancar borramos lo caducado (readCache ya elimina la entrada si ha caducado)
export function removeExpired() {
  getCacheKeys().forEach((key) => readCache(key.slice(CACHE_PREFIX.length)));
}

// Resumen para el pie de página: cuántas respuestas hay guardadas y cuánto ocupan
export function getCacheInfo() {
  const keys = getCacheKeys();
  const characters = keys.reduce(
    (total, key) => total + key.length + (localStorage.getItem(key)?.length ?? 0),
    0,
  );

  return { entries: keys.length, kilobytes: Math.round(characters / 1024) };
}
