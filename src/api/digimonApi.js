// Acceso a la Digi-API (https://digi-api.com).
// Este módulo solo hace peticiones: no toca el DOM ni transforma los datos.
import { API_URL, PAGE_SIZE, REQUEST_TIMEOUT } from '../config.js';
import { readCache, writeCache } from './cache.js';

// Error propio para distinguir los fallos de la API de los errores de programación
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getHttpErrorMessage(status) {
  // La Digi-API responde 400 cuando el Digimon no existe
  if (status === 400 || status === 404) {
    return `La Digi-API no ha encontrado lo que buscabas (error ${status}).`;
  }
  if (status === 429) {
    return 'Has hecho demasiadas peticiones seguidas. Espera un momento y vuelve a intentarlo.';
  }
  if (status >= 500) {
    return `La Digi-API tiene problemas ahora mismo (error ${status}). Prueba dentro de un rato.`;
  }
  return `La Digi-API ha respondido con un error inesperado (${status}).`;
}

// GET a una URL de la API: mira primero la caché, comprueba response.ok y devuelve el JSON
async function getJSON(url) {
  const cached = readCache(url);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new ApiError(
        `La Digi-API ha tardado más de ${REQUEST_TIMEOUT / 1000} segundos en responder. Vuelve a intentarlo.`,
      );
    }
    // fetch solo falla así cuando no hay red o el servidor no contesta
    throw new ApiError('No se ha podido conectar con la Digi-API. Revisa tu conexión a internet.');
  }

  if (!response.ok) {
    throw new ApiError(getHttpErrorMessage(response.status), response.status);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('La Digi-API ha devuelto una respuesta que no es JSON válido.');
  }

  writeCache(url, data);
  return data;
}

// Listado paginado. Los filtros vacíos no se mandan.
export function getDigimonList({ page = 0, name = '', level = '', attribute = '' } = {}) {
  const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
  if (name) params.set('name', name);
  if (level) params.set('level', level);
  if (attribute) params.set('attribute', attribute);

  return getJSON(`${API_URL}/digimon?${params}`);
}

// Ficha completa de un Digimon (por id o por nombre)
export function getDigimon(id) {
  return getJSON(`${API_URL}/digimon/${encodeURIComponent(id)}`);
}

// Varias fichas en paralelo. Con allSettled, si una falla no se pierden las demás.
export function getManyDigimon(ids) {
  return Promise.allSettled(ids.map((id) => getDigimon(id)));
}
