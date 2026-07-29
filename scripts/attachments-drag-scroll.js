/**
 * @fileoverview Logic for drag-scrolling attachments.
 */
/**
 * Initializes drag scrolling for a container.
 * @param {HTMLElement} container - The scrollable DOM element.
 */
function initDragScroll(container) {
  if (!container || container.dataset.dragInitialized) return;
  container.dataset.dragInitialized = "true";
  const state = { isDragging: false, startX: 0, scrollLeft: 0 };
  setupDragScrollMouseEvents(container, state);
  setupDragScrollObserver(container);
}

/**
 * Configures the mouse events for drag scrolling.
 * @param {HTMLElement} container - The DOM element.
 * @param {Object} state - The scroll state.
 */
function setupDragScrollMouseEvents(container, state) {
  container.addEventListener("mousedown", (e) => startDragScroll(e, container, state));
  container.addEventListener("mouseleave", () => stopDragScroll(container, state));
  container.addEventListener("mouseup", () => stopDragScroll(container, state));
  container.addEventListener("mousemove", (e) => handleDragScroll(e, container, state));
}

/**
 * Starts the dragging process.
 * @param {MouseEvent} e - The MouseEvent.
 * @param {HTMLElement} container - The DOM element.
 * @param {Object} state - The scroll state.
 */
function startDragScroll(e, container, state) {
  state.isDragging = true;
  container.classList.add("active");
  state.startX = e.pageX - container.offsetLeft;
  state.scrollLeft = container.scrollLeft;
}

/**
 * Ends the dragging process.
 * @param {HTMLElement} container - The DOM element.
 * @param {Object} state - The scroll state.
 */
function stopDragScroll(container, state) {
  state.isDragging = false;
  container.classList.remove("active");
}

/**
 * Performs scrolling based on mouse movement.
 * @param {MouseEvent} e - The MouseEvent.
 * @param {HTMLElement} container - The DOM element.
 * @param {Object} state - The scroll state.
 */
function handleDragScroll(e, container, state) {
  if (!state.isDragging) return;
  e.preventDefault();
  const x = e.pageX - container.offsetLeft;
  container.scrollLeft = state.scrollLeft - (x - state.startX) * 2;
}

/**
 * Updates scroll class depending on width.
 * @param {HTMLElement} container - The DOM element.
 */
function updateDragScrollClass(container) {
  if (container.scrollWidth > container.clientWidth) {
    container.classList.add("can-scroll");
  } else {
    container.classList.remove("can-scroll");
  }
}

/**
 * Monitors DOM and window changes for the Scroll class.
 * @param {HTMLElement} container - The DOM element.
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
