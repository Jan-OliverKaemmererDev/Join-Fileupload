/* =========================================================================
   IMAGE VIEWER LOGIC
   ========================================================================= */

let currentViewerTask = null;
let currentViewerIndex = 0;

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
