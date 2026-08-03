/**
 * @fileoverview Attachment handling for the mobile board edit overlay.
 */

/**
 * Handles file selection in mobile edit overlay.
 * Submits the selected files for processing and resets the input.
 * @param {Event} event - The change event of the file input
 */
function handleMobileEditFileSelect(event) {
  processMobileEditFiles(event.target.files);
  document.getElementById("mobile-edit-file-upload").value = "";
}


/**
 * Processes a list of files for the mobile edit overlay.
 * Validates each file and reads it as a data URL.
 * @param {FileList} files - The files to process
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
 * Reads a single file as a data URL and saves it as an attachment.
 * @param {File} file - The file to read
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
 * Updates the preview of all attachments in the mobile edit overlay.
 * Renders thumbnails and controls the "Delete all" button and scroll status.
 */
function updateMobileEditAttachmentsPreview() {
  const previewContainer = document.getElementById("mobile-edit-upload-preview");
  const btnDeleteAll = document.getElementById("mobile-edit-delete-all-attachments");
  if (!previewContainer) return;
  previewContainer.innerHTML = "";
  
  if (mobileEditAttachments.length === 0) {
    handleEmptyMobileEditPreview(previewContainer, btnDeleteAll);
    return;
  }
  
  handleFilledMobileEditPreview(previewContainer, btnDeleteAll);
}

/**
 * Handles the state when there are no attachments
 */
function handleEmptyMobileEditPreview(previewContainer, btnDeleteAll) {
  toggleMobileEditDeleteAllButton(btnDeleteAll, true);
  previewContainer.classList.remove("can-scroll");
  if (typeof validateMobileEditForm === 'function') validateMobileEditForm();
}

/**
 * Handles the state when there are attachments
 */
function handleFilledMobileEditPreview(previewContainer, btnDeleteAll) {
  toggleMobileEditDeleteAllButton(btnDeleteAll, false);
  renderMobileEditThumbnails(previewContainer);
  updateMobileEditPreviewScrollState(previewContainer);
  if (typeof validateMobileEditForm === 'function') validateMobileEditForm();
}

/**
 * Toggles the visibility of the "Delete All" button.
 * @param {HTMLElement|null} btnDeleteAll - The button to delete all attachments
 * @param {boolean} hide - Whether the button should be hidden
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
 * Renders all attachment thumbnails into the preview container.
 * @param {HTMLElement} previewContainer - The container for the thumbnails
 */
function renderMobileEditThumbnails(previewContainer) {
  mobileEditAttachments.forEach((att, index) => {
    previewContainer.innerHTML += getMobileEditAttachmentThumbnailHtml(att, index);
  });
}

/**
 * Updates preview container scroll status based on attachment count.
 * @param {HTMLElement} container - The preview container
 */
function updateMobileEditPreviewScrollState(container) {
  if (mobileEditAttachments.length > 3) {
    container.classList.add("can-scroll");
  } else {
    container.classList.remove("can-scroll");
  }
}

/**
 * Removes a single attachment based on its index.
 * @param {Event} event - The click event
 * @param {number} index - The index of the attachment to remove
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
 * Removes all attachments in the mobile edit overlay.
 */
function clearMobileEditAttachments() {
  mobileEditAttachments = [];
  updateMobileEditAttachmentsPreview();
}
