// Estados de la interfaz: cargando, error y vacío.
// Así el usuario siempre sabe qué está pasando mientras esperamos a la API.
import { escapeHTML } from './render.js';

// Tarjetas "fantasma" mientras llega el listado
export function showSkeleton(container, count) {
  const cards = Array.from(
    { length: count },
    () => `
      <li class="card card-skeleton">
        <span class="skeleton-block skeleton-img"></span>
        <span class="skeleton-block skeleton-line"></span>
        <span class="skeleton-block skeleton-line short"></span>
      </li>`,
  ).join('');

  container.setAttribute('aria-busy', 'true');
  container.innerHTML = `<ul class="grid" aria-hidden="true">${cards}</ul>`;
}

export function showLoadingMessage(container, text) {
  container.innerHTML = `
    <div class="state" role="status">
      <span class="pixel-loader" aria-hidden="true"><i></i><i></i><i></i></span>
      <p>${escapeHTML(text)}</p>
    </div>`;
}

// Mensaje con un botón de acción (Reintentar, Limpiar filtros...)
function showMessage(container, { title, text, actionLabel, onAction, isError }) {
  container.innerHTML = `
    <div class="state ${isError ? 'state-error' : ''}" ${isError ? 'role="alert"' : ''}>
      <h2 class="state-title">${escapeHTML(title)}</h2>
      <p>${escapeHTML(text)}</p>
      ${actionLabel ? `<button class="button" type="button">${escapeHTML(actionLabel)}</button>` : ''}
    </div>`;

  container.querySelector('button')?.addEventListener('click', onAction);
}

export function showError(container, text, onRetry) {
  showMessage(container, {
    title: 'No se han podido cargar los datos',
    text,
    actionLabel: 'Reintentar',
    onAction: onRetry,
    isError: true,
  });
}

export function showEmpty(container, text, actionLabel, onAction) {
  showMessage(container, { title: 'Ningún Digimon coincide', text, actionLabel, onAction });
}
