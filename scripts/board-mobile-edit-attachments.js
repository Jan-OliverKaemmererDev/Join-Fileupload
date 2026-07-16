/**
 * @fileoverview Attachment-Handling für das mobile Board-Edit Overlay.
 * Verwaltet Dateiauswahl, Vorschau-Rendering und Entfernen von Attachments.
 */

/**
 * Behandelt die Dateiauswahl im mobilen Edit-Overlay.
 * Übergibt die ausgewählten Dateien zur Verarbeitung und setzt das Input zurück.
 * @param {Event} event - Das Change-Event des File-Inputs
 */
function handleMobileEditFileSelect(event) {
  processMobileEditFiles(event.target.files);
  document.getElementById("mobile-edit-file-upload").value = "";
}

/**
 * Verarbeitet eine Liste von Dateien für das mobile Edit-Overlay.
 * Validiert jede Datei und liest sie als Data-URL ein.
 * @param {FileList} files - Die zu verarbeitenden Dateien
 */
function processMobileEditFiles(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (typeof isValidImage === "function" && !isValidImage(file)) {
      if (typeof showFileFormatError === "function") {
        showFileFormatError();
      }
      continue;
    }
    readAndStoreMobileEditFile(file);
  }
}

/**
 * Liest eine einzelne Datei als Data-URL ein und speichert sie als Attachment.
 * @param {File} file - Die einzulesende Datei
 */
function readAndStoreMobileEditFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    mobileEditAttachments.push({
      name: file.name,
      type: file.type,
      data: e.target.result,
      size: file.size
    });
    updateMobileEditAttachmentsPreview();
  };
  reader.readAsDataURL(file);
}

/**
 * Aktualisiert die Vorschau aller Attachments im mobilen Edit-Overlay.
 * Rendert Thumbnails und steuert den "Alle löschen"-Button sowie Scroll-Status.
 */
function updateMobileEditAttachmentsPreview() {
  const previewContainer = document.getElementById("mobile-edit-upload-preview");
  const btnDeleteAll = document.getElementById("mobile-edit-delete-all-attachments");
  if (!previewContainer) return;
  previewContainer.innerHTML = "";
  if (mobileEditAttachments.length === 0) {
    toggleMobileEditDeleteAllButton(btnDeleteAll, true);
    previewContainer.classList.remove("can-scroll");
    return;
  }
  toggleMobileEditDeleteAllButton(btnDeleteAll, false);
  renderMobileEditThumbnails(previewContainer);
  updateMobileEditPreviewScrollState(previewContainer);
}

/**
 * Schaltet die Sichtbarkeit des "Alle löschen"-Buttons um.
 * @param {HTMLElement|null} btnDeleteAll - Der Button zum Löschen aller Attachments
 * @param {boolean} hide - Ob der Button versteckt werden soll
 */
function toggleMobileEditDeleteAllButton(btnDeleteAll, hide) {
  if (!btnDeleteAll) return;
  if (hide) {
    btnDeleteAll.classList.add("d-none");
  } else {
    btnDeleteAll.classList.remove("d-none");
  }
}

/**
 * Rendert alle Attachment-Thumbnails in den Vorschau-Container.
 * @param {HTMLElement} previewContainer - Der Container für die Thumbnails
 */
function renderMobileEditThumbnails(previewContainer) {
  mobileEditAttachments.forEach((att, index) => {
    previewContainer.innerHTML += getMobileEditAttachmentThumbnailHtml(att, index);
  });
}

/**
 * Aktualisiert den Scroll-Status des Vorschau-Containers basierend auf der Attachment-Anzahl.
 * @param {HTMLElement} container - Der Vorschau-Container
 */
function updateMobileEditPreviewScrollState(container) {
  if (mobileEditAttachments.length > 3) {
    container.classList.add("can-scroll");
  } else {
    container.classList.remove("can-scroll");
  }
}

/**
 * Entfernt ein einzelnes Attachment anhand seines Index.
 * @param {Event} event - Das Klick-Event
 * @param {number} index - Der Index des zu entfernenden Attachments
 */
function removeMobileEditAttachment(event, index) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  mobileEditAttachments.splice(index, 1);
  updateMobileEditAttachmentsPreview();
}

/**
 * Entfernt alle Attachments im mobilen Edit-Overlay.
 */
function clearMobileEditAttachments() {
  mobileEditAttachments = [];
  updateMobileEditAttachmentsPreview();
}
