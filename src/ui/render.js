// Render: funciones que pintan en el DOM a partir de datos ya transformados.
import placeholderImage from '../assets/digiegg.svg';
import { translateLevel, translateAttribute } from '../logic/digimon.js';

// Los textos vienen de la API: los escapamos para que nunca se interpreten como HTML
export const escapeHTML = (text) =>
  String(text ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const formatNumber = (id) => `#${String(id).padStart(4, '0')}`;

// 'No Data' -> 'attr-no-data' (cada clase tiene su color en el CSS)
const attributeClass = (attribute) => `attr-${attribute.toLowerCase().replace(/\s+/g, '-')}`;

const imageOrPlaceholder = (url) => escapeHTML(url || placeholderImage);

// ---------- Tarjetas del listado ----------

// En las etiquetas no hay título, así que "Desconocido" a secas sería ambiguo
const levelLabel = (level) => (level === 'Unknown' ? 'Sin nivel' : translateLevel(level));
const attributeLabel = (attribute) => (attribute === 'Unknown' ? 'Sin atributo' : translateAttribute(attribute));

function tagsTemplate(digimon) {
  const levels = digimon.levels.length ? digimon.levels : ['Unknown'];
  const attributes = digimon.attributes.length ? digimon.attributes : ['Unknown'];

  const levelTags = levels.map((level) => `<span class="tag">${escapeHTML(levelLabel(level))}</span>`);
  const attributeTags = attributes.map(
    (attribute) => `
      <span class="tag">
        <span class="swatch ${attributeClass(attribute)}" aria-hidden="true"></span>
        ${escapeHTML(attributeLabel(attribute))}
      </span>`,
  );

  return [...levelTags, ...attributeTags].join('');
}

function cardTemplate(digimon) {
  return `
    <li>
      <button class="card" type="button" data-id="${digimon.id}">
        <span class="card-number">${formatNumber(digimon.id)}</span>
        <img class="card-img" src="${imageOrPlaceholder(digimon.image)}" alt="" width="320" height="320" loading="lazy">
        <span class="card-name">${escapeHTML(digimon.name)}</span>
        <span class="tags">${tagsTemplate(digimon)}</span>
      </button>
    </li>`;
}

export function renderCards(container, digimons) {
  container.innerHTML = `<ul class="grid">${digimons.map(cardTemplate).join('')}</ul>`;
}

// ---------- Barra de atributos ----------

export function renderStats(container, stats) {
  if (stats.length === 0) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const segments = stats
    .map(
      (stat) => `
        <span class="bar-segment ${attributeClass(stat.key)}" style="flex-grow: ${stat.count}"
          title="${escapeHTML(stat.label)}: ${stat.count}"></span>`,
    )
    .join('');

  const legend = stats
    .map(
      (stat) => `
        <li>
          <span class="swatch ${attributeClass(stat.key)}" aria-hidden="true"></span>
          ${escapeHTML(stat.label)} <strong>${stat.count}</strong>
        </li>`,
    )
    .join('');

  container.hidden = false;
  container.innerHTML = `
    <h2 class="stats-title">Atributos en esta página</h2>
    <div class="bar" aria-hidden="true">${segments}</div>
    <ul class="legend">${legend}</ul>`;
}

// ---------- Paginación, filtros y caché ----------

export function renderPagination({ pagination, prevButton, nextButton, pageInfo }, page, totalPages) {
  pagination.hidden = totalPages <= 1; // con una sola página no hace falta paginar
  prevButton.disabled = page <= 0;
  nextButton.disabled = page >= totalPages - 1;
  pageInfo.textContent = `Página ${page + 1} de ${totalPages}`;
}

// Rellena un <select> a partir de un objeto { valorApi: 'Texto' }
export function renderFilterOptions(select, options) {
  const html = Object.entries(options)
    .map(([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`)
    .join('');
  select.insertAdjacentHTML('beforeend', html);
}

export function renderCacheInfo(element, { entries, kilobytes }) {
  element.textContent =
    entries === 0
      ? 'La caché local está vacía.'
      : `Caché local: ${entries} respuestas guardadas (unos ${kilobytes} KB). Caducan a las 24 horas.`;
}

// ---------- Ficha (ventana de detalle) ----------

const fact = (label, value) => `<div><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>`;

// Las "fields" de la API son las familias a las que pertenece el Digimon
function fieldsTemplate(fields) {
  if (fields.length === 0) return '';

  const items = fields
    .map(
      (field) => `
        <li>
          <img class="field-icon" src="${escapeHTML(field.image)}" alt="" width="20" height="20">
          ${escapeHTML(field.name)}
        </li>`,
    )
    .join('');

  return `<div><dt>Familias</dt><dd><ul class="fields">${items}</ul></dd></div>`;
}

function descriptionTemplate(description) {
  if (!description) {
    return '<p class="muted">La Digi-API no tiene descripción para este Digimon.</p>';
  }

  const note = description.lang === 'ja' ? 'Solo está disponible en japonés.' : 'Texto original en inglés.';
  return `
    <p lang="${description.lang}">${escapeHTML(description.text)}</p>
    <p class="note">${note}</p>`;
}

function skillTemplate(skill) {
  const translation = skill.translation ? ` <span class="muted">(${escapeHTML(skill.translation)})</span>` : '';
  return `
    <li>
      <strong>${escapeHTML(skill.name)}</strong>${translation}
      <span class="skill-text" lang="en">${escapeHTML(skill.description)}</span>
    </li>`;
}

function skillsTemplate(skills) {
  if (skills.length === 0) {
    return '<p class="muted">No hay técnicas registradas.</p>';
  }

  const visible = skills.slice(0, 4).map(skillTemplate).join('');
  const hidden = skills.slice(4).map(skillTemplate).join('');
  const more = hidden
    ? `<details><summary>Ver ${skills.length - 4} técnicas más</summary><ul class="skills">${hidden}</ul></details>`
    : '';

  return `<ul class="skills">${visible}</ul>${more}`;
}

function evolutionTemplate(evo) {
  const condition = evo.conditions.length
    ? `<span class="evo-condition" lang="en">${escapeHTML(evo.conditions.join(' / '))}</span>`
    : '';

  return `
    <li>
      <button class="evo" type="button" data-id="${evo.id}">
        <img src="${imageOrPlaceholder(evo.image)}" alt="" width="64" height="64" loading="lazy">
        <span class="evo-name">${escapeHTML(evo.name)}</span>
        ${condition}
      </button>
    </li>`;
}

// Algunos Digimon tienen muchísimas evoluciones (Agumon tiene más de 80):
// se enseñan las primeras y el resto queda plegado
const VISIBLE_EVOLUTIONS = 12;

function evolutionsTemplate(evolutions, emptyText) {
  if (evolutions.length === 0) return `<p class="muted">${emptyText}</p>`;

  const visible = evolutions.slice(0, VISIBLE_EVOLUTIONS).map(evolutionTemplate).join('');
  const hidden = evolutions.slice(VISIBLE_EVOLUTIONS).map(evolutionTemplate).join('');
  const more = hidden
    ? `<details><summary>Ver ${evolutions.length - VISIBLE_EVOLUTIONS} más</summary><ul class="evo-list">${hidden}</ul></details>`
    : '';

  return `<ul class="evo-list">${visible}</ul>${more}`;
}

export function renderDetail(container, digimon, { animate = false } = {}) {
  container.innerHTML = `
    <article class="detail">
      <header class="detail-head">
        <div class="detail-screen ${animate ? 'is-evolving' : ''}">
          <img src="${imageOrPlaceholder(digimon.image)}" alt="${escapeHTML(digimon.name)}" width="320" height="320">
        </div>
        <div class="detail-info">
          <p class="detail-number">${formatNumber(digimon.id)}</p>
          <h2 id="detail-title" class="detail-title" tabindex="-1">${escapeHTML(digimon.name)}</h2>
          <div class="tags">${tagsTemplate(digimon)}</div>
          <dl class="facts">
            ${fact('Tipo', digimon.types.join(', ') || 'Desconocido')}
            ${fact('Debut', digimon.year || 'Desconocido')}
            ${fact('X-Antibody', digimon.xAntibody ? 'Sí' : 'No')}
            ${fieldsTemplate(digimon.fields)}
          </dl>
        </div>
      </header>

      <section class="detail-section">
        <h3>Descripción</h3>
        ${descriptionTemplate(digimon.description)}
      </section>

      <section class="detail-section">
        <h3>Técnicas</h3>
        ${skillsTemplate(digimon.skills)}
      </section>

      <section class="detail-section">
        <h3>Viene de</h3>
        ${evolutionsTemplate(digimon.prior, 'No viene de ningún Digimon registrado.')}
      </section>

      <section class="detail-section">
        <h3>Digievoluciona a</h3>
        ${evolutionsTemplate(digimon.next, 'No tiene digievoluciones registradas.')}
      </section>
    </article>`;
}

// ---------- Imágenes rotas ----------

// Si una imagen de la API no carga, se pone el huevo de reserva (o se quita si es un icono).
// El evento "error" no burbujea, por eso se escucha en fase de captura.
export function enableImageFallback(root = document) {
  root.addEventListener(
    'error',
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return;

      if (img.classList.contains('field-icon')) {
        img.remove();
        return;
      }
      img.dataset.fallback = 'true';
      img.src = placeholderImage;
    },
    true,
  );
}
