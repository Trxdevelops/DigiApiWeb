// Configuración general de la app.
// Todo lo que se puede ajustar está aquí para no tener "números mágicos" repartidos por el código.

export const API_URL = 'https://digi-api.com/api/v1';

// Digimon que se piden por página (24 cuadra bien en rejillas de 2, 3, 4 y 6 columnas)
export const PAGE_SIZE = 24;

// Tiempo máximo de espera de cada petición, en milisegundos
export const REQUEST_TIMEOUT = 8000;

// La caché de localStorage caduca a las 24 horas
export const CACHE_TTL = 24 * 60 * 60 * 1000;
export const CACHE_PREFIX = 'digiarchivo:';

// Total de Digimon de la API. Se sustituye por el dato real en cuanto llega el listado.
export const DEFAULT_TOTAL = 1488;

// La API usa los nombres japoneses de los niveles. Clave = valor de la API, valor = texto en pantalla.
export const LEVELS = {
  'Baby I': 'Bebé I',
  'Baby II': 'Bebé II',
  Child: 'Infantil',
  Adult: 'Adulto',
  Perfect: 'Perfecto',
  Ultimate: 'Definitivo',
  Armor: 'Armadura',
  Hybrid: 'Híbrido',
  Unknown: 'Desconocido',
};

export const ATTRIBUTES = {
  Vaccine: 'Vacuna',
  Data: 'Datos',
  Virus: 'Virus',
  Free: 'Libre',
  Variable: 'Variable',
  Unknown: 'Desconocido',
  'No Data': 'Sin datos',
};
