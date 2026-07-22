/**
 * @fileoverview Templates für das mobile Board-Edit Overlay.
 */

/**
 * Gibt das HTML für eine Kontakt-Option im Assigned-To-Dropdown zurück.
 * @param {Object} contact - Das Kontakt-Objekt
 * @param {boolean} isSelected - Ob der Kontakt ausgewählt ist
 * @param {string} selectedClass - CSS-Klasse für den Auswahlstatus
 * @param {string} nameSuffix - Suffix für den Namen (z.B. " (You)")
 * @param {string} avatarInner - Inner-HTML des Avatars
 * @param {string} avatarStyle - Inline-Style des Avatars
 * @returns {string} HTML-String
 */
function getMobileEditContactOptionHtml(contact, selectedClass, nameSuffix, avatarInner, avatarStyle) {
  return `
    <label class="contact-option ${selectedClass}" onclick="toggleMobileEditContactSelection('${contact.id}', event)" tabindex="0" role="button" aria-label="Toggle selection for ${contact.name}">
      <span class="contact-info">
        <span class="contact-avatar" style="${avatarStyle}">${avatarInner}</span>
        <span class="contact-name">${contact.name}${nameSuffix}</span>
      </span>
      <span class="contact-checkbox">
        <img src="./assets/icons/check-icon.png" class="check-icon" alt="Check">
      </span>
    </label>
  `;
}

/**
 * Gibt das HTML für einen ausgewählten Kontakt-Avatar zurück.
 * @param {string} avatarInner - Inner-HTML des Avatars
 * @param {string} avatarStyle - Inline-Style des Avatars
 * @returns {string} HTML-String
 */
function getMobileEditSelectedAvatarHtml(avatarInner, avatarStyle) {
  return `<span class="selected-avatar" style="${avatarStyle}">${avatarInner}</span>`;
}

/**
 * Gibt das HTML für einen Subtask-Listeneintrag zurück.
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} HTML-String
 */
function getMobileEditSubtaskItemHtml(subtask) {
  return `
    <li class="subtask-item" id="mobile-edit-subtask-item-${subtask.id}" ondblclick="editMobileEditSubtask(${subtask.id})">
      <span class="subtask-content"><span class="subtask-text">${subtask.text}</span></span>
      <span class="subtask-icons">
        <img src="./assets/icons/edit.svg" class="subtask-icon-small" onclick="editMobileEditSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Edit subtask" alt="Edit">
        <hr class="subtask-icon-divider">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeMobileEditSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Delete subtask" alt="Delete">
      </span>
    </li>
  `;
}

/**
 * Gibt das HTML für einen Subtask im Bearbeitungsmodus zurück.
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} HTML-String
 */
function getMobileEditSubtaskEditHtml(subtask) {
  return `
    <li class="subtask-item-edit">
      <input type="text" class="subtask-edit-input" id="mobile-edit-subtask-input-${subtask.id}" value="${subtask.text}" aria-label="Edit subtask text" onkeydown="handleMobileEditSubtaskEditKeydown(${subtask.id}, event)">
      <span class="subtask-icons" style="display: flex;">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeMobileEditSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Delete subtask" alt="Delete">
        <hr class="subtask-icon-divider">
        <img src="./assets/icons/check-create-icon-black.svg" class="subtask-icon-small" onclick="saveMobileEditSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Save subtask" alt="Save">
      </span>
    </li>
  `;
}

/**
 * Gibt das HTML für eine Attachment-Thumbnail-Vorschau zurück.
 * @param {Object} att - Das Attachment-Objekt
 * @param {number} index - Der Index des Attachments
 * @returns {string} HTML-String
 */
function getMobileEditAttachmentThumbnailHtml(att, index) {
  return `
    <figure class="thumbnail-container">
      <div class="thumbnail-image-wrapper">
        <img src="${att.data || att.preview || att.url}" alt="Attachment ${att.name}" />
        <div class="thumbnail-overlay">
          <button class="btn-delete-thumbnail" onclick="removeMobileEditAttachment(event, ${index})" aria-label="Delete attachment ${att.name}">
            <img src="./assets/icons/delete-white.svg" alt="Delete" />
          </button>
        </div>
      </div>
      <figcaption class="thumbnail-name">${att.name}</figcaption>
    </figure>
  `;
}
