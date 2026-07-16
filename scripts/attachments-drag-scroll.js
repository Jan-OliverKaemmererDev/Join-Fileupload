/**
 * Initialisiert das Drag-Scrolling für einen Container.
 * @param {HTMLElement} container - Das scrollbare DOM-Element.
 */
function initDragScroll(container) {
  if (!container || container.dataset.dragInitialized) return;
  container.dataset.dragInitialized = "true";
  const state = { isDragging: false, startX: 0, scrollLeft: 0 };
  setupDragScrollMouseEvents(container, state);
  setupDragScrollObserver(container);
}

/**
 * Konfiguriert die Mouse-Events für das Drag-Scrolling.
 * @param {HTMLElement} container - Das DOM-Element.
 * @param {Object} state - Der Scroll-Status.
 */
function setupDragScrollMouseEvents(container, state) {
  container.addEventListener("mousedown", (e) => startDragScroll(e, container, state));
  container.addEventListener("mouseleave", () => stopDragScroll(container, state));
  container.addEventListener("mouseup", () => stopDragScroll(container, state));
  container.addEventListener("mousemove", (e) => handleDragScroll(e, container, state));
}

/**
 * Startet den Drag-Vorgang.
 * @param {MouseEvent} e - Das MouseEvent.
 * @param {HTMLElement} container - Das DOM-Element.
 * @param {Object} state - Der Scroll-Status.
 */
function startDragScroll(e, container, state) {
  state.isDragging = true;
  container.classList.add("active");
  state.startX = e.pageX - container.offsetLeft;
  state.scrollLeft = container.scrollLeft;
}

/**
 * Beendet den Drag-Vorgang.
 * @param {HTMLElement} container - Das DOM-Element.
 * @param {Object} state - Der Scroll-Status.
 */
function stopDragScroll(container, state) {
  state.isDragging = false;
  container.classList.remove("active");
}

/**
 * Führt das Scrolling basierend auf der Mausbewegung aus.
 * @param {MouseEvent} e - Das MouseEvent.
 * @param {HTMLElement} container - Das DOM-Element.
 * @param {Object} state - Der Scroll-Status.
 */
function handleDragScroll(e, container, state) {
  if (!state.isDragging) return;
  e.preventDefault();
  const x = e.pageX - container.offsetLeft;
  container.scrollLeft = state.scrollLeft - (x - state.startX) * 2;
}

/**
 * Aktualisiert die Scroll-Klasse abhängig von der Breite.
 * @param {HTMLElement} container - Das DOM-Element.
 */
function updateDragScrollClass(container) {
  if (container.scrollWidth > container.clientWidth) {
    container.classList.add("can-scroll");
  } else {
    container.classList.remove("can-scroll");
  }
}

/**
 * Überwacht DOM- und Fenster-Änderungen für die Scroll-Klasse.
 * @param {HTMLElement} container - Das DOM-Element.
 */
function setupDragScrollObserver(container) {
  const check = () => updateDragScrollClass(container);
  window.addEventListener("resize", check);
  const observer = new MutationObserver(() => setTimeout(check, 0));
  observer.observe(container, { childList: true, subtree: true });
  setTimeout(check, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const uploadPreview = document.getElementById("upload-preview");
  if (uploadPreview) initDragScroll(uploadPreview);
});
