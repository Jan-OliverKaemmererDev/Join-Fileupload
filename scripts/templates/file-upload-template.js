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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
}
