// Punto de entrada: guarda el estado de la app, escucha los eventos
// y coordina los módulos de API, lógica y render.
import './styles/main.css';
import { DEFAULT_TOTAL, LEVELS, ATTRIBUTES, PAGE_SIZE } from './config.js';
import { ApiError, getDigimon, getDigimonList, getManyDigimon } from './api/digimonApi.js';
import { clearCache, getCacheInfo, removeExpired } from './api/cache.js';
import {
  describeFilters,
  getAttributeStats,
  getRandomId,
  hasFilters,
  mergeDetails,
  normalizeDigimon,
  normalizeList,
} from './logic/digimon.js';
import {
  enableImageFallback,
  renderCacheInfo,
  renderCards,
  renderDetail,
  renderFilterOptions,
  renderPagination,
  renderStats,
} from './ui/render.js';
import { showEmpty, showError, showLoadingMessage, showSkeleton } from './ui/states.js';

const $ = (selector) => document.querySelector(selector);

const elements = {
  form: $('#search-form'),
  nameInput: $('#search-name'),
  levelSelect: $('#filter-level'),
  attributeSelect: $('#filter-attribute'),
  clearButton: $('#clear-filters'),
  status: $('#status'),
  stats: $('#stats'),
  results: $('#results'),
  pagination: $('#pagination'),
  prevButton: $('#prev-page'),
  nextButton: $('#next-page'),
  pageInfo: $('#page-info'),
  dialog: $('#detail'),
  dialogContent: $('#detail-content'),
  closeDialog: $('#close-detail'),
  egg: $('#egg'),
  eggButton: $('#egg-button'),
  totalCount: $('#total-count'),
  cacheInfo: $('#cache-info'),
  clearCacheButton: $('#clear-cache'),
};

const EMPTY_FILTERS = { name: '', level: '', attribute: '' };

const state = {
  page: 0,
  totalPages: 0,
  total: DEFAULT_TOTAL,
  filters: { ...EMPTY_FILTERS },
};

// Cada carga tiene un número. Si llega tarde la respuesta de una carga antigua
// (por ejemplo, al pasar páginas muy rápido) se ignora y no pisa a la nueva.
let lastListRequest = 0;
let lastDetailRequest = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Los errores de la API ya traen un mensaje para el usuario; el resto son fallos nuestros
function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  console.error(error);
  return 'Ha ocurrido un error inesperado al mostrar los datos.';
}

// ---------- Listado ----------

function buildStatusText(list, digimons) {
  const filters = hasFilters(state.filters) ? ` con ${describeFilters(state.filters)}` : '';
  const failed = digimons.filter((digimon) => !digimon.complete).length;

  let failedText = '';
  if (failed === 1) failedText = ' Una ficha no se ha podido cargar y se muestra con datos básicos.';
  if (failed > 1) failedText = ` ${failed} fichas no se han podido cargar y se muestran con datos básicos.`;

  return `${list.total} Digimon${filters}. Página ${state.page + 1} de ${list.totalPages}.${failedText}`;
}

function showNoResults() {
  if (hasFilters(state.filters)) {
    showEmpty(
      elements.results,
      `No hay resultados con ${describeFilters(state.filters)}. Prueba con otro nombre o quita algún filtro.`,
      'Limpiar filtros',
      clearFilters,
    );
  } else {
    // Sin filtros solo pasa si la página ya no existe (o si la API devuelve una lista vacía)
    showEmpty(elements.results, 'Esta página no tiene Digimon.', 'Volver a la primera página', clearFilters);
  }

  renderStats(elements.stats, []);
  renderPagination(elements, 0, 0);
  elements.status.textContent = 'La búsqueda no ha devuelto ningún Digimon.';
}

async function loadPage() {
  const requestId = ++lastListRequest;

  showSkeleton(elements.results, PAGE_SIZE);
  elements.status.textContent = 'Cargando Digimon…';
  elements.prevButton.disabled = true;
  elements.nextButton.disabled = true;
  elements.clearButton.hidden = !hasFilters(state.filters);

  try {
    const list = normalizeList(await getDigimonList({ page: state.page, ...state.filters }));
    if (requestId !== lastListRequest) return;

    state.totalPages = list.totalPages;
    if (!hasFilters(state.filters) && list.total > 0) {
      state.total = list.total;
      elements.totalCount.textContent = list.total;
    }

    if (list.items.length === 0) {
      showNoResults();
      return;
    }

    // El listado solo trae nombre e imagen: pedimos las fichas en paralelo para saber nivel y atributo
    const results = await getManyDigimon(list.items.map((item) => item.id));
    if (requestId !== lastListRequest) return;

    const digimons = mergeDetails(list.items, results);
    renderCards(elements.results, digimons);
    renderStats(elements.stats, getAttributeStats(digimons));
    renderPagination(elements, state.page, state.totalPages);
    elements.status.textContent = buildStatusText(list, digimons);
  } catch (error) {
    if (requestId !== lastListRequest) return;

    showError(elements.results, getErrorMessage(error), loadPage);
    renderStats(elements.stats, []);
    renderPagination(elements, state.page, 0);
    elements.status.textContent = ''; // el propio mensaje de error ya avisa (role="alert")
  } finally {
    if (requestId === lastListRequest) {
      elements.results.removeAttribute('aria-busy');
      renderCacheInfo(elements.cacheInfo, getCacheInfo());
    }
  }
}

function search(event) {
  event.preventDefault();
  state.filters = {
    name: elements.nameInput.value.trim(),
    level: elements.levelSelect.value,
    attribute: elements.attributeSelect.value,
  };
  state.page = 0;
  loadPage();
}

function clearFilters() {
  elements.form.reset();
  state.filters = { ...EMPTY_FILTERS };
  state.page = 0;
  loadPage();
}

function changePage(step) {
  state.page += step;
  loadPage();
  elements.form.scrollIntoView({ block: 'start' });
}

// ---------- Ficha de un Digimon ----------

async function openDetail(id, options = {}) {
  const requestId = ++lastDetailRequest;
  const retry = options.retry ?? (() => openDetail(id, options));

  if (!elements.dialog.open) elements.dialog.showModal();
  showLoadingMessage(elements.dialogContent, 'Analizando los datos del Digimon…');

  try {
    const digimon = normalizeDigimon(await getDigimon(id));
    if (requestId !== lastDetailRequest) return;

    renderDetail(elements.dialogContent, digimon, { animate: options.animate });
    elements.dialog.scrollTop = 0;
    $('#detail-title')?.focus();
  } catch (error) {
    if (requestId !== lastDetailRequest) return;
    showError(elements.dialogContent, getErrorMessage(error), retry);
  } finally {
    renderCacheInfo(elements.cacheInfo, getCacheInfo());
  }
}

function closeDetail() {
  lastDetailRequest++; // si quedaba una petición en marcha, su respuesta se ignorará
  elements.dialog.close();
}

// Botón del huevo: abre un Digimon al azar. Si ese número no existe, "Reintentar" prueba otro.
async function hatchEgg() {
  elements.eggButton.disabled = true;

  if (!prefersReducedMotion()) {
    elements.egg.classList.add('is-hatching');
    await wait(700);
    elements.egg.classList.remove('is-hatching');
  }

  elements.eggButton.disabled = false;
  openRandomDigimon();
}

function openRandomDigimon() {
  openDetail(getRandomId(state.total), { animate: true, retry: openRandomDigimon });
}

// ---------- Eventos ----------

elements.form.addEventListener('submit', search);
elements.levelSelect.addEventListener('change', () => elements.form.requestSubmit());
elements.attributeSelect.addEventListener('change', () => elements.form.requestSubmit());
elements.clearButton.addEventListener('click', clearFilters);
elements.prevButton.addEventListener('click', () => changePage(-1));
elements.nextButton.addEventListener('click', () => changePage(1));
elements.eggButton.addEventListener('click', hatchEgg);

// Delegación de eventos: un solo listener para todas las tarjetas
elements.results.addEventListener('click', (event) => {
  const card = event.target.closest('.card[data-id]');
  if (card) openDetail(card.dataset.id);
});

// Dentro de la ficha se puede saltar a las evoluciones
elements.dialogContent.addEventListener('click', (event) => {
  const evolution = event.target.closest('.evo[data-id]');
  if (evolution) openDetail(evolution.dataset.id, { animate: true });
});

elements.closeDialog.addEventListener('click', closeDetail);
elements.dialog.addEventListener('cancel', () => lastDetailRequest++); // tecla Escape
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeDetail(); // clic fuera de la ficha
});

elements.clearCacheButton.addEventListener('click', () => {
  clearCache();
  renderCacheInfo(elements.cacheInfo, getCacheInfo());
});

// ---------- Arranque ----------

renderFilterOptions(elements.levelSelect, LEVELS);
renderFilterOptions(elements.attributeSelect, ATTRIBUTES);
enableImageFallback();
removeExpired();
loadPage();
