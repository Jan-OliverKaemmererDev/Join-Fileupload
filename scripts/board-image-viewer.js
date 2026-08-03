/**
 * @fileoverview Image viewer logic for task attachments in the board.
 */

let currentViewerTask = null;
let currentViewerIndex = 0;

let viewerScale = 1;
let viewerTranslateX = 0;
let viewerTranslateY = 0;
let isViewerDragging = false;
let viewerStartX = 0;
let viewerStartY = 0;
let viewerInitTranslateX = 0;
let viewerInitTranslateY = 0;
let viewerEventsSetup = false;
let viewerPinchStartDist = 0;
let viewerPinchStartScale = 1;

/**
 * Opens the Image Viewer for a specific image of a task.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The index of the attachment.
 */
function openImageViewer(taskId, index) {
  const task = typeof findTask === "function" ? findTask(taskId) : null;
  if (!task || !task.attachments || task.attachments.length === 0) return;
  currentViewerTask = task;
  currentViewerIndex = index;
  initViewerEvents();
  resetViewerZoom();
  updateViewer();
  document.getElementById("image-viewer-overlay").classList.add("active");
  document.addEventListener("keydown", handleViewerKeydown);
}

/**
 * Initializes the viewer's event listeners once.
 */
function initViewerEvents() {
  if (!viewerEventsSetup) {
    setupViewerEvents();
    viewerEventsSetup = true;
  }
}

/**
 * Updates the image and metadata in the viewer.
 */
function updateViewer() {
  if (!currentViewerTask) return;
  const att = currentViewerTask.attachments[currentViewerIndex];
  if (!att) return;
  document.getElementById("viewer-image").src = att.data;
  document.getElementById("viewer-filename").textContent = att.name;
  updateViewerFileSize(att);
}

/**
 * Updates the file size display in the viewer.
 * @param {Object} att - The attachment object.
 */
function updateViewerFileSize(att) {
  const sizeText = att.size ? formatFileSize(att.size) : "Unknown size";
  document.getElementById("viewer-filesize").textContent = sizeText;
}

/**
 * Formats a file size in bytes to KB or MB.
 * @param {number} bytes - The file size in bytes.
 * @returns {string} Formatted file size string.
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Closes the Image Viewer.
 * @param {Event} [event] - Optional DOM event.
 */
function closeImageViewer(event) {
  if (event) event.stopPropagation();
  document.getElementById("image-viewer-overlay").classList.remove("active");
  currentViewerTask = null;
  document.removeEventListener("keydown", handleViewerKeydown);
}

/**
 * Navigates through the images in the viewer.
 * @param {number} step - -1 for previous, +1 for next.
 * @param {Event} [event] - Optional DOM event.
 */
function navigateViewer(step, event) {
  if (event) event.stopPropagation();
  if (!currentViewerTask || !currentViewerTask.attachments) return;
  const total = currentViewerTask.attachments.length;
  currentViewerIndex = (currentViewerIndex + step + total) % total;
  resetViewerZoom();
  updateViewer();
}

/**
 * Downloads the current image.
 */
function downloadViewerImage() {
  if (!currentViewerTask) return;
  const att = currentViewerTask.attachments[currentViewerIndex];
  if (!att) return;
  const a = document.createElement("a");
  a.href = att.data;
  a.download = att.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Keyboard controls for the image viewer.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleViewerKeydown(e) {
  if (e.key === "Escape") closeImageViewer();
  else if (e.key === "ArrowLeft") navigateViewer(-1);
  else if (e.key === "ArrowRight") navigateViewer(1);
}

/**
 * Resets viewer zoom and pan.
 */
function resetViewerZoom() {
  viewerScale = 1;
  viewerTranslateX = 0;
  viewerTranslateY = 0;
  const img = document.getElementById("viewer-image");
  if (img) {
    img.style.transform = `translate(0px, 0px) scale(1)`;
    img.classList.remove('zoomed', 'dragging');
  }
}

/**
 * Changes the zoom factor of the viewer image.
 * @param {number} step - The zoom step.
 */
function changeViewerZoom(step) {
  viewerScale = Math.min(5, Math.max(1, viewerScale + step * 0.5));
  const img = document.getElementById("viewer-image");
  if (!img) return;
  if (viewerScale === 1) {
    viewerTranslateX = 0;
    viewerTranslateY = 0;
    img.classList.remove('zoomed');
  } else {
    img.classList.add('zoomed');
    constrainTranslation(img);
  }
  applyViewerTransform(img);
}

/**
 * Applies CSS transform to the image.
 * @param {HTMLElement} img - The image element.
 */
function applyViewerTransform(img) {
  img.style.transform = `translate(${viewerTranslateX}px, ${viewerTranslateY}px) scale(${viewerScale})`;
}

/**
 * Sets up all mouse and touch events for the viewer.
 */
function setupViewerEvents() {
  const img = document.getElementById("viewer-image");
  if (!img) return;
  setupViewerWheelEvent(img);
  setupViewerMouseDownEvent(img);
  setupViewerMouseMoveEvent(img);
  setupViewerMouseUpEvent(img);
  setupViewerTouchEvents(img);
}

/**
 * Sets up the wheel event for zoom.
 * @param {HTMLElement} img - The image element.
 */
function setupViewerWheelEvent(img) {
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    changeViewerZoom(Math.sign(e.deltaY) * -0.5);
  }, { passive: false });
}

/**
 * Sets up the MouseDown event for panning.
 * @param {HTMLElement} img - The image element.
 */
function setupViewerMouseDownEvent(img) {
  img.addEventListener('mousedown', (e) => {
    if (viewerScale <= 1) return;
    isViewerDragging = true;
    viewerStartX = e.clientX;
    viewerStartY = e.clientY;
    viewerInitTranslateX = viewerTranslateX;
    viewerInitTranslateY = viewerTranslateY;
    img.classList.add('dragging');
    e.preventDefault();
  });
}

/**
 * Sets up the MouseMove event for panning.
 * @param {HTMLElement} img - The image element.
 */
function setupViewerMouseMoveEvent(img) {
  window.addEventListener('mousemove', (e) => {
    if (!isViewerDragging) return;
    viewerTranslateX = viewerInitTranslateX + (e.clientX - viewerStartX);
    viewerTranslateY = viewerInitTranslateY + (e.clientY - viewerStartY);
    constrainTranslation(img);
    applyViewerTransform(img);
  });
}

/**
 * Sets up the MouseUp event for panning.
 * @param {HTMLElement} img - The image element.
 */
function setupViewerMouseUpEvent(img) {
  window.addEventListener('mouseup', () => {
    if (isViewerDragging) {
      isViewerDragging = false;
      img.classList.remove('dragging');
    }
  });
}

/**
 * Sets up the touch events for pinch-to-zoom and panning.
 * @param {HTMLElement} img - The image element.
 */
function setupViewerTouchEvents(img) {
  img.addEventListener('touchstart', (e) => handleViewerTouchStart(e, img), { passive: false });
  img.addEventListener('touchmove', (e) => handleViewerTouchMove(e, img), { passive: false });
  img.addEventListener('touchend', () => handleViewerTouchEnd(img));
}

/**
 * Handles the TouchStart event (pinch or pan).
 * @param {TouchEvent} e - The touch event.
 * @param {HTMLElement} img - The image element.
 */
function handleViewerTouchStart(e, img) {
  if (e.touches.length === 2) {
    e.preventDefault();
    viewerPinchStartDist = getTouchDistance(e.touches);
    viewerPinchStartScale = viewerScale;
  } else if (e.touches.length === 1 && viewerScale > 1) {
    isViewerDragging = true;
    viewerStartX = e.touches[0].clientX;
    viewerStartY = e.touches[0].clientY;
    viewerInitTranslateX = viewerTranslateX;
    viewerInitTranslateY = viewerTranslateY;
    img.classList.add('dragging');
  }
}

/**
 * Handles the TouchMove event (pinch or pan).
 * @param {TouchEvent} e - The touch event.
 * @param {HTMLElement} img - The image element.
 */
function handleViewerTouchMove(e, img) {
  if (e.touches.length === 2) {
    e.preventDefault();
    handlePinchZoom(e.touches, img);
  } else if (e.touches.length === 1 && isViewerDragging) {
    e.preventDefault();
    handleTouchPan(e.touches[0], img);
  }
}

/**
 * Handles pinch zoom during a TouchMove.
 * @param {TouchList} touches - The touch points.
 * @param {HTMLElement} img - The image element.
 */
function handlePinchZoom(touches, img) {
  const ratio = getTouchDistance(touches) / viewerPinchStartDist;
  viewerScale = Math.min(5, Math.max(1, viewerPinchStartScale * ratio));
  if (viewerScale === 1) {
    viewerTranslateX = 0;
    viewerTranslateY = 0;
    img.classList.remove('zoomed');
  } else {
    img.classList.add('zoomed');
    constrainTranslation(img);
  }
  applyViewerTransform(img);
}

/**
 * Handles touch panning during a TouchMove.
 * @param {Touch} touch - The touch point.
 * @param {HTMLElement} img - The image element.
 */
function handleTouchPan(touch, img) {
  viewerTranslateX = viewerInitTranslateX + (touch.clientX - viewerStartX);
  viewerTranslateY = viewerInitTranslateY + (touch.clientY - viewerStartY);
  constrainTranslation(img);
  applyViewerTransform(img);
}

/**
 * Handles the end of a touch event.
 * @param {HTMLElement} img - The image element.
 */
function handleViewerTouchEnd(img) {
  isViewerDragging = false;
  img.classList.remove('dragging');
}

/**
 * Calculates the distance between two touch points.
 * @param {TouchList} touches - The touch points.
 * @returns {number} The distance in pixels.
 */
function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Limits the displacement so that the image does not disappear from the viewport.
 * @param {HTMLElement} img - The image element.
 */
function constrainTranslation(img) {
  const maxTx = (img.clientWidth * viewerScale - img.clientWidth) / 2;
  const maxTy = (img.clientHeight * viewerScale - img.clientHeight) / 2;
  viewerTranslateX = Math.max(-maxTx, Math.min(maxTx, viewerTranslateX));
  viewerTranslateY = Math.max(-maxTy, Math.min(maxTy, viewerTranslateY));
}
