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
 * Öffnet den Image Viewer für ein bestimmtes Bild eines Tasks.
 * @param {number} taskId - Die ID des Tasks.
 * @param {number} index - Der Index des Attachments.
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
 * Initialisiert die Event-Listener des Viewers einmalig.
 */
function initViewerEvents() {
  if (!viewerEventsSetup) {
    setupViewerEvents();
    viewerEventsSetup = true;
  }
}

/**
 * Aktualisiert das Bild und die Metadaten im Viewer.
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
 * Aktualisiert die Dateigrößenanzeige im Viewer.
 * @param {Object} att - Das Attachment-Objekt.
 */
function updateViewerFileSize(att) {
  const sizeText = att.size ? formatFileSize(att.size) : "Unknown size";
  document.getElementById("viewer-filesize").textContent = sizeText;
}

/**
 * Formatiert eine Dateigröße in Bytes zu KB oder MB.
 * @param {number} bytes - Die Dateigröße in Bytes.
 * @returns {string} Formatierter Dateigrößen-String.
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Schließt den Image Viewer.
 * @param {Event} [event] - Optionales DOM-Event.
 */
function closeImageViewer(event) {
  if (event) event.stopPropagation();
  document.getElementById("image-viewer-overlay").classList.remove("active");
  currentViewerTask = null;
  document.removeEventListener("keydown", handleViewerKeydown);
}

/**
 * Navigiert durch die Bilder im Viewer.
 * @param {number} step - -1 für vorheriges, +1 für nächstes.
 * @param {Event} [event] - Optionales DOM-Event.
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
 * Lädt das aktuelle Bild herunter.
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
 * Tastatursteuerung für den Image Viewer.
 * @param {KeyboardEvent} e - Das Tastatur-Event.
 */
function handleViewerKeydown(e) {
  if (e.key === "Escape") closeImageViewer();
  else if (e.key === "ArrowLeft") navigateViewer(-1);
  else if (e.key === "ArrowRight") navigateViewer(1);
}

/**
 * Setzt den Zoom und die Verschiebung des Viewers zurück.
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
 * Ändert den Zoom-Faktor des Viewer-Bildes.
 * @param {number} step - Der Zoom-Schritt.
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
 * Wendet die CSS-Transformation auf das Bild an.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function applyViewerTransform(img) {
  img.style.transform = `translate(${viewerTranslateX}px, ${viewerTranslateY}px) scale(${viewerScale})`;
}

/**
 * Richtet alle Maus- und Touch-Events für den Viewer ein.
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
 * Richtet das Wheel-Event für den Zoom ein.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function setupViewerWheelEvent(img) {
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    changeViewerZoom(Math.sign(e.deltaY) * -0.5);
  }, { passive: false });
}

/**
 * Richtet das MouseDown-Event für das Panning ein.
 * @param {HTMLElement} img - Das Bild-Element.
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
 * Richtet das MouseMove-Event für das Panning ein.
 * @param {HTMLElement} img - Das Bild-Element.
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
 * Richtet das MouseUp-Event für das Panning ein.
 * @param {HTMLElement} img - Das Bild-Element.
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
 * Richtet die Touch-Events für Pinch-to-Zoom und Panning ein.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function setupViewerTouchEvents(img) {
  img.addEventListener('touchstart', (e) => handleTouchStart(e, img), { passive: false });
  img.addEventListener('touchmove', (e) => handleTouchMove(e, img), { passive: false });
  img.addEventListener('touchend', () => handleTouchEnd(img));
}

/**
 * Behandelt den TouchStart-Event (Pinch oder Pan).
 * @param {TouchEvent} e - Das Touch-Event.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function handleTouchStart(e, img) {
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
 * Behandelt den TouchMove-Event (Pinch oder Pan).
 * @param {TouchEvent} e - Das Touch-Event.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function handleTouchMove(e, img) {
  if (e.touches.length === 2) {
    e.preventDefault();
    handlePinchZoom(e.touches, img);
  } else if (e.touches.length === 1 && isViewerDragging) {
    e.preventDefault();
    handleTouchPan(e.touches[0], img);
  }
}

/**
 * Behandelt den Pinch-Zoom während eines TouchMoves.
 * @param {TouchList} touches - Die Touch-Punkte.
 * @param {HTMLElement} img - Das Bild-Element.
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
 * Behandelt das Touch-Panning während eines TouchMoves.
 * @param {Touch} touch - Der Touch-Punkt.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function handleTouchPan(touch, img) {
  viewerTranslateX = viewerInitTranslateX + (touch.clientX - viewerStartX);
  viewerTranslateY = viewerInitTranslateY + (touch.clientY - viewerStartY);
  constrainTranslation(img);
  applyViewerTransform(img);
}

/**
 * Behandelt das Ende eines Touch-Events.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function handleTouchEnd(img) {
  isViewerDragging = false;
  img.classList.remove('dragging');
}

/**
 * Berechnet die Distanz zwischen zwei Touch-Punkten.
 * @param {TouchList} touches - Die Touch-Punkte.
 * @returns {number} Die Distanz in Pixeln.
 */
function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Begrenzt die Verschiebung, damit das Bild nicht aus dem Viewport verschwindet.
 * @param {HTMLElement} img - Das Bild-Element.
 */
function constrainTranslation(img) {
  const maxTx = (img.clientWidth * viewerScale - img.clientWidth) / 2;
  const maxTy = (img.clientHeight * viewerScale - img.clientHeight) / 2;
  viewerTranslateX = Math.max(-maxTx, Math.min(maxTx, viewerTranslateX));
  viewerTranslateY = Math.max(-maxTy, Math.min(maxTy, viewerTranslateY));
}
