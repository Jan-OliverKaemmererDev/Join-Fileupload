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
    <div class="contact-option ${selectedClass}" onclick="toggleMobileEditContactSelection('${contact.id}', event)">
      <div class="contact-info">
        <div class="contact-avatar" style="${avatarStyle}">${avatarInner}</div>
        <span class="contact-name">${contact.name}${nameSuffix}</span>
      </div>
      <div class="contact-checkbox"></div>
    </div>
  `;
}

/**
 * Gibt das HTML für einen ausgewählten Kontakt-Avatar zurück.
 * @param {string} avatarInner - Inner-HTML des Avatars
 * @param {string} avatarStyle - Inline-Style des Avatars
 * @returns {string} HTML-String
 */
function getMobileEditSelectedAvatarHtml(avatarInner, avatarStyle) {
  return `<div class="selected-avatar" style="${avatarStyle}">${avatarInner}</div>`;
}

/**
 * Gibt das HTML für einen Subtask-Listeneintrag zurück.
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} HTML-String
 */
function getMobileEditSubtaskItemHtml(subtask) {
  return `
    <div class="subtask-item" id="mobile-edit-subtask-item-${subtask.id}" ondblclick="editMobileEditSubtask(${subtask.id})">
      <div class="subtask-content"><span class="subtask-text">${subtask.text}</span></div>
      <div class="subtask-icons">
        <img src="./assets/icons/edit.svg" class="subtask-icon-small" onclick="editMobileEditSubtask(${subtask.id})" alt="Edit">
        <div class="subtask-icon-divider"></div>
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeMobileEditSubtask(${subtask.id})" alt="Delete">
      </div>
    </div>
  `;
}

/**
 * Gibt das HTML für einen Subtask im Bearbeitungsmodus zurück.
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} HTML-String
 */
function getMobileEditSubtaskEditHtml(subtask) {
  return `
    <div class="subtask-item-edit">
      <input type="text" class="subtask-edit-input" id="mobile-edit-subtask-input-${subtask.id}" value="${subtask.text}" onkeydown="handleMobileEditSubtaskEditKeydown(${subtask.id}, event)">
      <div class="subtask-icons" style="display: flex;">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeMobileEditSubtask(${subtask.id})" alt="Delete">
        <div class="subtask-icon-divider"></div>
        <img src="./assets/icons/check-create-icon-black.svg" class="subtask-icon-small" onclick="saveMobileEditSubtask(${subtask.id})" alt="Save">
      </div>
    </div>
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
    <div class="thumbnail-container">
      <div class="thumbnail-image-wrapper">
        <img src="${att.data || att.preview || att.url}" alt="${att.name}" />
        <div class="thumbnail-overlay">
          <button class="btn-delete-thumbnail" onclick="removeMobileEditAttachment(event, ${index})">
            <img src="./assets/icons/delete-white.svg" alt="Delete" />
          </button>
        </div>
      </div>
      <div class="thumbnail-name">${att.name}</div>
    </div>
  `;
}
