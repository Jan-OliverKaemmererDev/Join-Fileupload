/**
 * @fileoverview HTML template generating functions for file uploads.
 */
/**
 * Returns the HTML for the file format error overlay.
 * @returns {string} HTML string
 */
function getFileFormatErrorTemplate() {
  return `
    <article class="error-content">
      <h3 class="error-title">This file format is not allowed!</h3>
      <p class="error-desc">You can only upload JPEG and PNG.</p>
    </article>
    <button class="error-close" onclick="document.getElementById('file-format-error').classList.remove('show')" aria-label="Close error message">
      <img src="./assets/icons/clear-X-icon-white.svg" alt="Close" />
    </button>
  `;
}

/**
 * Returns the HTML for the file size error overlay.
 * @returns {string} HTML string
 */
function getFileSizeErrorTemplate() {
  return `
    <article class="error-content">
      <h3 class="error-title">File is too large!</h3>
      <p class="error-desc">Max. 1MB allowed for Firebase.</p>
    </article>
    <button class="error-close" onclick="document.getElementById('file-size-error').classList.remove('show')" aria-label="Close error message">
      <img src="./assets/icons/clear-X-icon-white.svg" alt="Close" />
    </button>
  `;
}
