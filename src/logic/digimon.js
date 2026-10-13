// Lógica de datos: convierte las respuestas de la API en objetos limpios y listos para pintar.
// Aquí no hay fetch ni DOM, solo transformaciones con map / filter / reduce.
import { ATTRIBUTES, LEVELS, PAGE_SIZE } from '../config.js';

// Atributos con color propio. El resto (Unknown, No Data...) se agrupa como "Desconocido".
const MAIN_ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];

// La API a veces no manda un campo o manda null: así siempre trabajamos con un array
const toArray = (value) => (Array.isArray(value) ? value : []);

// [{ level: 'Child' }, { level: '' }] -> ['Child']
const pluck = (list, key) =>
  toArray(list)
    .map((item) => item?.[key])
    .filter(Boolean);

export const translateLevel = (level) => LEVELS[level] ?? level;
export const translateAttribute = (attribute) => ATTRIBUTES[attribute] ?? attribute;

// ---------- Listado ----------

export function normalizeList(data) {
  const items = toArray(data?.content)
    .filter((item) => item?.id)
    .map((item) => ({
      id: item.id,
      name: item.name || `Digimon ${item.id}`,
      image: item.image || '',
    }));

  const total = data?.pageable?.totalElements ?? 0;

  return {
    items,
    total,
    // No usamos pageable.totalPages: la API a veces devuelve el índice de la última página
    // en vez del número de páginas (con 48 resultados dice 1 cuando hay 2), así que lo calculamos
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ---------- Ficha de un Digimon ----------

// Prefiere la descripción en inglés; si no hay, la japonesa; si no hay ninguna, null
function pickDescription(descriptions) {
  const valid = toArray(descriptions).filter((item) => item?.description?.trim());
  const chosen = valid.find((item) => item.language === 'en_us') ?? valid[0];

  if (!chosen) return null;
  return { text: chosen.description.trim(), lang: chosen.language === 'jap' ? 'ja' : 'en' };
}

// Junta las evoluciones repetidas (el mismo Digimon con varias condiciones distintas)
function normalizeEvolutions(list) {
  const unique = toArray(list)
    .filter((evo) => evo?.id && evo?.digimon)
    .reduce((byId, evo) => {
      const saved = byId.get(evo.id) ?? {
        id: evo.id,
        name: evo.digimon,
        image: evo.image || '',
        conditions: [],
      };
      if (evo.condition) saved.conditions.push(evo.condition);
      return byId.set(evo.id, saved);
    }, new Map());

  return [...unique.values()];
}

// `fallback` son los datos del listado, por si la ficha viene incompleta
export function normalizeDigimon(raw, fallback = {}) {
  const image = pluck(raw?.images, 'href')[0];

  return {
    id: raw?.id ?? fallback.id ?? 0,
    name: raw?.name || fallback.name || 'Digimon sin nombre',
    image: image || fallback.image || '',
    levels: pluck(raw?.levels, 'level'),
    attributes: pluck(raw?.attributes, 'attribute'),
    types: pluck(raw?.types, 'type'),
    fields: toArray(raw?.fields)
      .filter((field) => field?.field)
      .map((field) => ({ name: field.field, image: field.image || '' })),
    year: raw?.releaseDate || '',
    xAntibody: raw?.xAntibody === true,
    description: pickDescription(raw?.descriptions),
    skills: toArray(raw?.skills)
      .filter((skill) => skill?.skill)
      .map((skill) => ({
        name: skill.skill,
        translation: skill.translation || '',
        description: skill.description || '',
      })),
    prior: normalizeEvolutions(raw?.priorEvolutions),
    next: normalizeEvolutions(raw?.nextEvolutions),
    complete: Boolean(raw),
  };
}

// Une el listado con el resultado de Promise.allSettled de las fichas.
// Si una ficha ha fallado, el Digimon se pinta igual con los datos básicos del listado.
export function mergeDetails(items, results) {
  return items.map((item, index) => {
    const result = results[index];
    return result?.status === 'fulfilled'
      ? normalizeDigimon(result.value, item)
      : normalizeDigimon(null, item);
  });
}

// ---------- Estadísticas ----------

// Cuenta los atributos de los Digimon en pantalla: { Vaccine: 9, Data: 6, ... }
export function countAttributes(digimons) {
  return digimons
    .flatMap((digimon) => (digimon.attributes.length ? digimon.attributes : ['Unknown']))
    .map((attribute) => (MAIN_ATTRIBUTES.includes(attribute) ? attribute : 'Unknown'))
    .reduce((counts, attribute) => {
      counts[attribute] = (counts[attribute] ?? 0) + 1;
      return counts;
    }, {});
}

// Lista ordenada (siempre el mismo orden) para pintar la barra y la leyenda
export function getAttributeStats(digimons) {
  const counts = countAttributes(digimons);

  return [...MAIN_ATTRIBUTES, 'Unknown']
    .filter((key) => counts[key] > 0)
    .map((key) => ({ key, label: translateAttribute(key), count: counts[key] }));
}

// ---------- Filtros y utilidades ----------

export const hasFilters = (filters) => Object.values(filters).some(Boolean);

// { name: 'agu', level: 'Child' } -> 'nombre «agu», nivel Infantil'
export function describeFilters({ name, level, attribute }) {
  return [
    name && `nombre «${name}»`,
    level && `nivel ${translateLevel(level)}`,
    attribute && `atributo ${translateAttribute(attribute)}`,
  ]
    .filter(Boolean)
    .join(', ');
}

export const getRandomId = (total) => Math.floor(Math.random() * total) + 1;
