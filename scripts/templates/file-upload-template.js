/**
 * @fileoverview Template für den File-Upload Fehler.
 */

/**
 * Gibt das HTML für das File-Format-Error Overlay zurück.
 * @returns {string} HTML-String
 */
function getFileFormatErrorTemplate() {
  return `
    <div class="error-content">
      <span class="error-title">This file format is not allowed!</span>
      <span class="error-desc">You can only upload JPEG and PNG.</span>
    </div>
    <button class="error-close" onclick="document.getElementById('file-format-error').classList.remove('show')">
      <img src="./assets/icons/clear-X-icon-white.svg" alt="Close" />
    </button>
  `;
}

/**
 * Gibt das HTML für das File-Size-Error Overlay zurück.
 * @returns {string} HTML-String
 */
function getFileSizeErrorTemplate() {
  return `
    <div class="error-content">
      <span class="error-title">File is too large!</span>
      <span class="error-desc">Max. 1MB allowed for Firebase.</span>
    </div>
    <button class="error-close" onclick="document.getElementById('file-size-error').classList.remove('show')">
      <img src="./assets/icons/clear-X-icon-white.svg" alt="Close" />
    </button>
  `;
}
