/**
 * Global array storing all valid image attachments.
 * @type {File[]}
 */
let taskAttachments = [];

/**
 * Global flag tracking if the preview container is being dragged.
 * @type {boolean}
 */
let isPreviewDragging = false;

/**
 * Starting X coordinate for preview drag scrolling.
 * @type {number}
 */
let previewStartX;

/**
 * Initial scrollLeft value when drag scrolling starts.
 * @type {number}
 */
let previewScrollLeft;

/**
 * Reference to the upload-preview DOM element.
 * @type {HTMLElement}
 */
let previewContainerRef;

/**
 * Loads existing attachments (e.g. when editing a task) into the attachments list.
 * @param {Array<{name: string, type: string, data: string}>} attachments 
 */
async function loadExistingAttachments(attachments) {
  taskAttachments = [];
  if (!attachments || attachments.length === 0) {
    updateAttachmentsPreview();
    return;
  }
  for (let i = 0; i < attachments.length; i++) {
    try {
      const att = attachments[i];
      const res = await fetch(att.data);
      const buf = await res.arrayBuffer();
      const file = new File([buf], att.name, { type: att.type });
      taskAttachments.push(file);
    } catch (e) {
      console.error("Failed to load attachment", e);
    }
  }
  updateAttachmentsPreview();
}

/**
 * Processes selected or dropped files, validating and adding them to the attachments list.
 * @param {FileList|File[]} files - The files to process.
 */
function processFiles(files) {
  if (!files || files.length === 0) return;
  let added = false;
  let errorShown = false;
  for (let i = 0; i < files.length; i++) {
    if (isValidImage(files[i])) {
      taskAttachments.push(files[i]);
      added = true;
    } else {
      if (!errorShown) {
        showFileFormatError();
        errorShown = true;
      }
    }
  }
  if (added) updateAttachmentsPreview();
}

/**
 * Checks if a file is a valid image type (JPEG or PNG).
 * @param {File} file - The file to check.
 * @returns {boolean} True if the file is a valid image, false otherwise.
 */
function isValidImage(file) {
  return ['image/jpeg', 'image/png'].includes(file.type);
}

/**
 * Handles the file input change event.
 * @param {Event} event - The change event from the file input.
 */
function handleFileSelect(event) {
  processFiles(event.target.files);
  document.getElementById('file-upload').value = "";
}

/**
 * Initializes drag and drop event listeners for the upload area.
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
 * Binds multiple event listeners to a DOM element.
 * @param {HTMLElement} element - The target DOM element.
 * @param {string[]} events - Array of event names.
 * @param {Function} handler - The event handler function.
 */
function bindDragEvents(element, events, handler) {
  events.forEach(eventName => element.addEventListener(eventName, handler, false));
}

/**
 * Prevents default browser behavior and event propagation.
 * @param {Event} e - The triggered event.
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Adds the highlight class to the drop zone.
 */
function highlightDropZone() {
  document.getElementById('upload-area').classList.add('drag-over');
}

/**
 * Removes the highlight class from the drop zone.
 */
function unhighlightDropZone() {
  document.getElementById('upload-area').classList.remove('drag-over');
}

/**
 * Handles the drop event on the upload area.
 * @param {DragEvent} e - The drop event.
 */
function handleDrop(e) {
  processFiles(e.dataTransfer.files);
}

document.addEventListener('DOMContentLoaded', initDragAndDrop);

/**
 * Processes task attachments and converts them to base64.
 * Generates a thumbnail preview and retains the original size.
 * @returns {Promise<{name: string, type: string, size: number, data: string, preview: string}[]>} Processed attachments.
 */
async function processTaskAttachments() {
  const processed = [];
  for (const file of taskAttachments) {
    if (!(file instanceof File || file instanceof Blob)) {
      // It's already processed and loaded from DB
      processed.push(file);
      continue;
    }

    let originalBase64 = null;
    let previewBase64 = null;
    try {
      if (typeof compressBlob === 'function' && typeof blobToBase64 === 'function' && file.type.startsWith('image/')) {
        // Compress original to max 1024x1024 at 60% quality to prevent Firestore 1MB limit errors with multiple images
        const largeBlob = await compressBlob(file, 1024, 1024, 0.6);
        originalBase64 = await blobToBase64(largeBlob);
        
        // Create a 200x200 compressed preview
        const smallBlob = await compressBlob(file, 200, 200, 0.7);
        previewBase64 = await blobToBase64(smallBlob);
      } else {
        originalBase64 = await fileToBase64(file);
        previewBase64 = originalBase64;
      }
    } catch (e) {
      console.error("Failed to generate base64 for attachment", e);
      originalBase64 = await fileToBase64(file);
      previewBase64 = originalBase64;
    }
    processed.push({
      name: file.name,
      type: file.type,
      size: file.size,
      data: originalBase64,
      preview: previewBase64
    });
  }
  return processed;
}

/**
 * Converts a File object to a Base64 string.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} Base64 representation of the file.
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
 * Renders the preview thumbnails for all attachments.
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
}

/**
 * Creates a thumbnail container element.
 * @param {File} file - The file object.
 * @param {number} index - The index of the attachment.
 * @returns {HTMLElement} The created thumbnail container.
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
 * Creates an image element for a thumbnail.
 * @param {File} file - The file object.
 * @returns {HTMLImageElement} The created image element.
 */
function createImgElement(file) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  return img;
}

/**
 * Creates an overlay element with a delete button.
 * @param {number} index - The index of the attachment.
 * @returns {HTMLElement} The created overlay element.
 */
function createOverlayElement(index) {
  const overlay = document.createElement('div');
  overlay.className = 'thumbnail-overlay';
  overlay.appendChild(createDeleteButton(index));
  return overlay;
}

/**
 * Creates a delete button for an individual thumbnail.
 * @param {number} index - The index of the attachment.
 * @returns {HTMLButtonElement} The created delete button.
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
 * Creates a name tag element for a thumbnail.
 * @param {string} name - The name of the file.
 * @returns {HTMLElement} The created name tag element.
 */
function createNameTag(name) {
  const tag = document.createElement('div');
  tag.className = 'thumbnail-name';
  tag.textContent = name;
  return tag;
}

/**
 * Deletes a specific attachment by index.
 * @param {number} index - The index of the attachment to delete.
 */
function deleteAttachment(index) {
  taskAttachments.splice(index, 1);
  updateAttachmentsPreview();
}

/**
 * Clears all attachments from the list.
 */
function clearAllAttachments() {
  taskAttachments = [];
  updateAttachmentsPreview();
}

/**
 * Returns the current list of attachments.
 * @returns {File[]} Array of file objects.
 */
function getTaskAttachments() {
  return taskAttachments;
}



/**
 * Initializes mouse event listeners for drag-to-scroll functionality on a container.
 * @param {HTMLElement} container - The container element to make scrollable by dragging.
 */
function initDragScroll(container) {
  if (!container || container.dataset.dragInitialized) return;
  container.dataset.dragInitialized = "true";

  let isDragging = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    container.classList.add('active');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  const stopDrag = () => {
    isDragging = false;
    container.classList.remove('active');
  };

  container.addEventListener('mouseleave', stopDrag);
  container.addEventListener('mouseup', stopDrag);

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    container.scrollLeft = scrollLeft - (x - startX) * 2;
  });

  const checkScrollableLocal = () => {
    if (container.scrollWidth > container.clientWidth) {
      container.classList.add('can-scroll');
    } else {
      container.classList.remove('can-scroll');
    }
  };

  window.addEventListener('resize', checkScrollableLocal);
  
  // Observe DOM changes to recalculate scrollability when attachments are added/removed
  const observer = new MutationObserver(() => {
    setTimeout(checkScrollableLocal, 0);
  });
  observer.observe(container, { childList: true, subtree: true });

  setTimeout(checkScrollableLocal, 0);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize drag scroll for the addtask upload preview if it exists on load
  const uploadPreview = document.getElementById('upload-preview');
  if (uploadPreview) initDragScroll(uploadPreview);
});
