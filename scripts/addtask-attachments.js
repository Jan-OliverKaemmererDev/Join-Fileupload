/**
 * @fileoverview Attachment handling for the add task page.
 */
/**
 * Global array for all valid image attachments.
 * @type {File[]}
 */
let taskAttachments = [];

/**
 * Loads existing attachments into the list (e.g. when editing).
 * @param {Array<{name: string, type: string, data: string}>} attachments - Attachments.
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
 * Downloads and adds a single attachment.
 * @param {Object} att - The attachment object.
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
 * Processes selected or dropped files and validates them.
 * @param {FileList|File[]} files - The files to process.
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
 * Processes a single file and checks the format.
 * @param {File} file - The file.
 * @param {Object} state - The processing status.
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
 * Checks whether a file has a valid image format.
 * @param {File} file - The file to check.
 * @returns {boolean} True if the format is valid.
 */
function isValidImage(file) {
  return ['image/jpeg', 'image/png'].includes(file.type);
}

/**
 * Processes the change event of the file input.
 * @param {Event} event - The change event.
 */
function handleFileSelect(event) {
  processFiles(event.target.files);
  document.getElementById('file-upload').value = "";
}

/**
 * Initializes the drag and drop listeners for the upload area.
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
 * Binds event listeners to a DOM element.
 * @param {HTMLElement} element - The DOM element.
 * @param {string[]} events - The event names.
 * @param {Function} handler - The handler function.
 */
function bindDragEvents(element, events, handler) {
  events.forEach(eventName => element.addEventListener(eventName, handler, false));
}

/**
 * Prevents default browser behavior.
 * @param {Event} e - The event.
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Adds highlight class to drop area.
 */
function highlightDropZone() {
  document.getElementById('upload-area').classList.add('drag-over');
}

/**
 * Removes the highlight class from the drop area.
 */
function unhighlightDropZone() {
  document.getElementById('upload-area').classList.remove('drag-over');
}

/**
 * Handles file drop event.
 * @param {DragEvent} e - The drop event.
 */
function handleDrop(e) {
  processFiles(e.dataTransfer.files);
}

document.addEventListener('DOMContentLoaded', initDragAndDrop);

/**
 * Processes task attachments, generates base64 and thumbnails.
 * @returns {Promise<Array>} Processed attachments.
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
 * Processes a single attachment including compression.
 * @param {File} file - The file object.
 * @returns {Promise<Object>} The processed attachment.
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
 * Generates the Base64 strings for Original and Preview.
 * @param {File} file - The file.
 * @returns {Promise<{original: string, preview: string}>} Base64 strings.
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
 * Checks whether a file can be compressed.
 * @param {File} file - The file.
 * @returns {boolean} True if compressible.
 */
function canCompress(file) {
  return typeof compressBlob === "function" && 
         typeof blobToBase64 === "function" && 
         file.type.startsWith("image/");
}

/**
 * Compresses an image for original and preview.
 * @param {File} file - The file.
 * @returns {Promise<{original: string, preview: string}>} Compressed images.
 */
async function compressImageAttachment(file) {
  const largeBlob = await compressBlob(file, 800, 800, 0.6);
  const original = await blobToBase64(largeBlob);
  const smallBlob = await compressBlob(file, 200, 200, 0.7);
  const preview = await blobToBase64(smallBlob);
  return { original, preview };
}

/**
 * Converts a File object to a Base64 string.
 * @param {File} file - The file.
 * @returns {Promise<string>} The base64 string.
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
 * Renders the thumbnails for all attachments.
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
 * Creates the thumbnail container.
 * @param {File} file - The file.
 * @param {number} index - The index.
 * @returns {HTMLElement} The container element.
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
 * Creates the image element for the thumbnail.
 * @param {File} file - The file.
 * @returns {HTMLImageElement} The image element.
 */
function createImgElement(file) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  return img;
}

/**
 * Created the overlay element with delete button.
 * @param {number} index - The index.
 * @returns {HTMLElement} The overlay element.
 */
function createOverlayElement(index) {
  const overlay = document.createElement('div');
  overlay.className = 'thumbnail-overlay';
  overlay.appendChild(createDeleteButton(index));
  return overlay;
}

/**
 * Creates the delete button for a thumbnail.
 * @param {number} index - The index.
 * @returns {HTMLButtonElement} The delete button.
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
 * Creates the nameplate for the thumbnail.
 * @param {string} name - The file name.
 * @returns {HTMLElement} The nametag.
 */
function createNameTag(name) {
  const tag = document.createElement('div');
  tag.className = 'thumbnail-name';
  tag.textContent = name;
  return tag;
}

/**
 * Deletes a specific attachment.
 * @param {number} index - The index.
 */
function deleteAttachment(index) {
  taskAttachments.splice(index, 1);
  updateAttachmentsPreview();
}

/**
 * Clears the attachment list completely.
 */
function clearAllAttachments() {
  taskAttachments = [];
  updateAttachmentsPreview();
}

/**
 * Returns the list of all attachments.
 * @returns {File[]} The attachments.
 */
function getTaskAttachments() {
  return taskAttachments;
}
