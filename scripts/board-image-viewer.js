/* =========================================================================
   IMAGE VIEWER LOGIC
   ========================================================================= */

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

/**
 * Öffnet den Image Viewer für ein bestimmtes Bild eines Tasks
 * @param {number} taskId - Die ID des Tasks
 * @param {number} index - Der Index des Attachments
 */
function openImageViewer(taskId, index) {
  const task = findTask(taskId);
  if (!task || !task.attachments || task.attachments.length === 0) return;
  
  currentViewerTask = task;
  currentViewerIndex = index;
  
  if (!viewerEventsSetup) {
    setupViewerEvents();
    viewerEventsSetup = true;
  }
  resetViewerZoom();
  
  updateViewer();
  
  document.getElementById("image-viewer-overlay").classList.add("active");
  
  // Tastatur-Event-Listener hinzufügen
  document.addEventListener("keydown", handleViewerKeydown);
}

/**
 * Aktualisiert das Bild und die Metadaten im Viewer
 */
function updateViewer() {
  if (!currentViewerTask) return;
  
  const att = currentViewerTask.attachments[currentViewerIndex];
  if (!att) return;
  
  document.getElementById("viewer-image").src = att.data;
  document.getElementById("viewer-filename").textContent = att.name;
  
  let sizeText = "";
  if (att.size) {
    sizeText = formatFileSize(att.size);
  } else {
    sizeText = "Unknown size";
  }
  document.getElementById("viewer-filesize").textContent = sizeText;
}

/**
 * Formatiert eine Dateigröße in Bytes zu KB oder MB
 * @param {number} bytes 
 * @returns {string} formatierter String
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Schließt den Image Viewer
 * @param {Event} event - Optionales Event
 */
function closeImageViewer(event) {
  if (event) event.stopPropagation();
  document.getElementById("image-viewer-overlay").classList.remove("active");
  currentViewerTask = null;
  document.removeEventListener("keydown", handleViewerKeydown);
}

/**
 * Navigiert durch die Bilder im Viewer
 * @param {number} step - -1 für vorheriges, +1 für nächstes
 * @param {Event} event - Optionales Event
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
 * Lädt das aktuelle Bild herunter
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
 * Tastatursteuerung für den Image Viewer
 * @param {KeyboardEvent} e 
 */
function handleViewerKeydown(e) {
  if (e.key === "Escape") {
    closeImageViewer();
  } else if (e.key === "ArrowLeft") {
    navigateViewer(-1);
  } else if (e.key === "ArrowRight") {
    navigateViewer(1);
  }
}

/**
 * Resets the zoom and panning for the viewer
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
 * Changes the zoom level of the viewer image
 */
function changeViewerZoom(step) {
  viewerScale += step * 0.5;
  if (viewerScale < 1) viewerScale = 1;
  if (viewerScale > 5) viewerScale = 5;
  
  const img = document.getElementById("viewer-image");
  if (!img) return;

  if (viewerScale === 1) {
    viewerTranslateX = 0;
    viewerTranslateY = 0;
    img.classList.remove('zoomed');
  } else {
    img.classList.add('zoomed');
  }
  
  img.style.transform = `translate(${viewerTranslateX}px, ${viewerTranslateY}px) scale(${viewerScale})`;
}

/**
 * Sets up mouse events for zooming and panning the image
 */
function setupViewerEvents() {
  const img = document.getElementById("viewer-image");
  if (!img) return;
  
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * -0.5;
    changeViewerZoom(delta);
  }, { passive: false });
  
  img.addEventListener('mousedown', (e) => {
    if (viewerScale > 1) {
      isViewerDragging = true;
      viewerStartX = e.clientX;
      viewerStartY = e.clientY;
      viewerInitTranslateX = viewerTranslateX;
      viewerInitTranslateY = viewerTranslateY;
      img.classList.add('dragging');
      e.preventDefault();
    }
  });
  
  window.addEventListener('mousemove', (e) => {
    if (isViewerDragging) {
      const dx = e.clientX - viewerStartX;
      const dy = e.clientY - viewerStartY;
      viewerTranslateX = viewerInitTranslateX + dx;
      viewerTranslateY = viewerInitTranslateY + dy;
      img.style.transform = `translate(${viewerTranslateX}px, ${viewerTranslateY}px) scale(${viewerScale})`;
    }
  });
  
  window.addEventListener('mouseup', () => {
    if (isViewerDragging) {
      isViewerDragging = false;
      if (img) img.classList.remove('dragging');
    }
  });
}
