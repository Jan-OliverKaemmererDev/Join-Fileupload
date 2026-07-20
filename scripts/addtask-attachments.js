/**
 * Globales Array für alle validen Bildanhänge.
 * @type {File[]}
 */
let taskAttachments = [];

/**
 * Lädt existierende Anhänge in die Liste (z.B. beim Bearbeiten).
 * @param {Array<{name: string, type: string, data: string}>} attachments - Anhänge.
 */
async function loadExistingAttachments(attachments) {
  taskAttachments = [];
  if (!attachments || attachments.length === 0) return updateAttachmentsPreview();
  for (const att of attachments) {
    await fetchAndAddAttachment(att);
  }
  updateAttachmentsPreview();
}

/**
 * Lädt einen einzelnen Anhang herunter und fügt ihn hinzu.
 * @param {Object} att - Das Anhang-Objekt.
 */
async function fetchAndAddAttachment(att) {
  try {
    const res = await fetch(att.data);
    const buf = await res.arrayBuffer();
    const file = new File([buf], att.name, { type: att.type });
    taskAttachments.push(file);
  } catch (e) {
    console.error("Failed to load attachment", e);
  }
}

/**
 * Verarbeitet ausgewählte oder abgelegte Dateien und validiert sie.
 * @param {FileList|File[]} files - Die zu verarbeitenden Dateien.
 */
function processFiles(files) {
  if (!files || files.length === 0) return;
  let state = { added: false, errorShown: false };
  for (const file of files) {
    processSingleFile(file, state);
  }
  if (state.added) updateAttachmentsPreview();
}

/**
 * Verarbeitet eine einzelne Datei und prüft das Format.
 * @param {File} file - Die Datei.
 * @param {Object} state - Der Verarbeitungsstatus.
 */
function processSingleFile(file, state) {
  if (file.size > (typeof MAX_FILE_SIZE !== 'undefined' ? MAX_FILE_SIZE : 2 * 1024 * 1024)) {
    if (!state.errorShown) {
      if (typeof showFileSizeError === "function") showFileSizeError();
      state.errorShown = true;
    }
    return;
  }

  if (isValidImage(file)) {
    taskAttachments.push(file);
    state.added = true;
  } else if (!state.errorShown) {
    if (typeof showFileFormatError === "function") showFileFormatError();
    state.errorShown = true;
  }
}

/**
 * Überprüft, ob eine Datei ein gültiges Bildformat hat.
 * @param {File} file - Die zu prüfende Datei.
 * @returns {boolean} True, wenn das Format gültig ist.
 */
function isValidImage(file) {
  return ['image/jpeg', 'image/png'].includes(file.type);
}

/**
 * Verarbeitet das Change-Event des File-Inputs.
 * @param {Event} event - Das Change-Event.
 */
function handleFileSelect(event) {
  processFiles(event.target.files);
  document.getElementById('file-upload').value = "";
}

/**
 * Initialisiert die Drag & Drop Listener für den Upload-Bereich.
 */
function initDragAndDrop() {
  const dropZone = document.getElementById('upload-area');
  if (!dropZone) return;
  bindDragEvents(dropZone, ['dragenter', 'dragover', 'dragleave', 'drop'], preventDefaults);
  bindDragEvents(dropZone, ['dragenter', 'dragover'], highlightDropZone);
  bindDragEvents(dropZone, ['dragleave', 'drop'], unhighlightDropZone);
  dropZone.addEventListener('drop', handleDrop, false);
}

/**
 * Bindet Event-Listener an ein DOM-Element.
 * @param {HTMLElement} element - Das DOM-Element.
 * @param {string[]} events - Die Event-Namen.
 * @param {Function} handler - Die Handler-Funktion.
 */
function bindDragEvents(element, events, handler) {
  events.forEach(eventName => element.addEventListener(eventName, handler, false));
}

/**
 * Verhindert das Standard-Verhalten des Browsers.
 * @param {Event} e - Das Event.
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Fügt dem Drop-Bereich die Highlight-Klasse hinzu.
 */
function highlightDropZone() {
  document.getElementById('upload-area').classList.add('drag-over');
}

/**
 * Entfernt die Highlight-Klasse vom Drop-Bereich.
 */
function unhighlightDropZone() {
  document.getElementById('upload-area').classList.remove('drag-over');
}

/**
 * Behandelt das Drop-Event für Dateien.
 * @param {DragEvent} e - Das Drop-Event.
 */
function handleDrop(e) {
  processFiles(e.dataTransfer.files);
}

document.addEventListener('DOMContentLoaded', initDragAndDrop);

/**
 * Verarbeitet Task-Anhänge, generiert Base64 und Thumbnails.
 * @returns {Promise<Array>} Verarbeitete Anhänge.
 */
async function processTaskAttachments() {
  const processed = [];
  for (const file of taskAttachments) {
    if (!(file instanceof File || file instanceof Blob)) {
      processed.push(file);
      continue;
    }
    processed.push(await processSingleAttachment(file));
  }
  return processed;
}

/**
 * Verarbeitet einen einzelnen Anhang inklusive Komprimierung.
 * @param {File} file - Das Datei-Objekt.
 * @returns {Promise<Object>} Der verarbeitete Anhang.
 */
async function processSingleAttachment(file) {
  let images = await generateAttachmentImages(file);
  
  // Calculate size in bytes from base64 (approx string length * 0.75)
  const base64Size = images.original.length * 0.75;
  if (base64Size > 1024 * 1024) { // 1 MB
    if (typeof showFileSizeError === "function") showFileSizeError();
    throw new Error("File too large for Firebase after compression");
  }

  return {
    name: file.name || "unnamed",
    type: file.type || "application/octet-stream",
    size: file.size || 0,
    data: images.original || "",
    preview: images.preview || ""
  };
}

/**
 * Generiert die Base64-Strings für Original und Preview.
 * @param {File} file - Die Datei.
 * @returns {Promise<{original: string, preview: string}>} Base64 Strings.
 */
async function generateAttachmentImages(file) {
  try {
    if (canCompress(file)) return await compressImageAttachment(file);
    const b64 = await fileToBase64(file);
    return { original: b64, preview: b64 };
  } catch (e) {
    console.error("Failed to generate base64", e);
    const b64 = await fileToBase64(file);
    return { original: b64, preview: b64 };
  }
}

/**
 * Prüft, ob eine Datei komprimiert werden kann.
 * @param {File} file - Die Datei.
 * @returns {boolean} True, wenn komprimierbar.
 */
function canCompress(file) {
  return typeof compressBlob === "function" && 
         typeof blobToBase64 === "function" && 
         file.type.startsWith("image/");
}

/**
 * Komprimiert ein Bild für Original und Preview.
 * @param {File} file - Die Datei.
 * @returns {Promise<{original: string, preview: string}>} Komprimierte Bilder.
 */
async function compressImageAttachment(file) {
  const largeBlob = await compressBlob(file, 800, 800, 0.6);
  const original = await blobToBase64(largeBlob);
  const smallBlob = await compressBlob(file, 200, 200, 0.7);
  const preview = await blobToBase64(smallBlob);
  return { original, preview };
}

/**
 * Konvertiert ein File-Objekt in einen Base64-String.
 * @param {File} file - Die Datei.
 * @returns {Promise<string>} Der Base64-String.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Rendert die Thumbnails für alle Anhänge.
 */
function updateAttachmentsPreview() {
  const container = document.getElementById('upload-preview');
  const deleteBtn = document.getElementById('delete-all-attachments');
  if (!container) return;
  container.innerHTML = '';
  if (taskAttachments.length > 0) {
    deleteBtn.classList.remove('d-none');
    taskAttachments.forEach((f, i) => container.appendChild(createThumbnail(f, i)));
  } else {
    deleteBtn.classList.add('d-none');
  }
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Erstellt den Thumbnail-Container.
 * @param {File} file - Die Datei.
 * @param {number} index - Der Index.
 * @returns {HTMLElement} Das Container-Element.
 */
function createThumbnail(file, index) {
  const container = document.createElement('div');
  container.className = 'thumbnail-container';
  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'thumbnail-image-wrapper';
  imgWrapper.appendChild(createImgElement(file));
  imgWrapper.appendChild(createOverlayElement(index));
  container.appendChild(imgWrapper);
  container.appendChild(createNameTag(file.name));
  return container;
}

/**
 * Erstellt das Bild-Element für den Thumbnail.
 * @param {File} file - Die Datei.
 * @returns {HTMLImageElement} Das Bild-Element.
 */
function createImgElement(file) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  return img;
}

/**
 * Erstellt das Overlay-Element mit Lösch-Button.
 * @param {number} index - Der Index.
 * @returns {HTMLElement} Das Overlay-Element.
 */
function createOverlayElement(index) {
  const overlay = document.createElement('div');
  overlay.className = 'thumbnail-overlay';
  overlay.appendChild(createDeleteButton(index));
  return overlay;
}

/**
 * Erstellt den Lösch-Button für einen Thumbnail.
 * @param {number} index - Der Index.
 * @returns {HTMLButtonElement} Der Lösch-Button.
 */
function createDeleteButton(index) {
  const btn = document.createElement('button');
  btn.className = 'btn-delete-thumbnail';
  btn.innerHTML = '<img src="./assets/icons/delete-white.svg" alt="Delete" />';
  btn.type = 'button';
  btn.addEventListener('mousedown', e => e.stopPropagation());
  btn.addEventListener('click', e => { e.stopPropagation(); deleteAttachment(index); });
  return btn;
}

/**
 * Erstellt das Namensschild für den Thumbnail.
 * @param {string} name - Der Dateiname.
 * @returns {HTMLElement} Das Namensschild.
 */
function createNameTag(name) {
  const tag = document.createElement('div');
  tag.className = 'thumbnail-name';
  tag.textContent = name;
  return tag;
}

/**
 * Löscht einen bestimmten Anhang.
 * @param {number} index - Der Index.
 */
function deleteAttachment(index) {
  taskAttachments.splice(index, 1);
  updateAttachmentsPreview();
}

/**
 * Leert die Liste der Anhänge komplett.
 */
function clearAllAttachments() {
  taskAttachments = [];
  updateAttachmentsPreview();
}

/**
 * Gibt die Liste aller Anhänge zurück.
 * @returns {File[]} Die Anhänge.
 */
function getTaskAttachments() {
  return taskAttachments;
}
