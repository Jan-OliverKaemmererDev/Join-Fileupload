/**
 * @fileoverview HTML templates for the mobile board view overlay.
 */
/**
 * Returns the HTML for a Contact option in the Assigned To dropdown.
 * @param {Object} contact - The contact object
 * @param {boolean} isSelected - Whether the contact is selected
 * @param {string} selectedClass - CSS class for selection state
 * @param {string} nameSuffix - Suffix for the name (e.g. " (You)")
 * @param {string} avatarInner - Inner HTML of the avatar
 * @param {string} avatarStyle - Inline style of the avatar
 * @returns {string} HTML string
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
 * Returns the HTML for a selected contact avatar.
 * @param {string} avatarInner - Inner HTML of the avatar
 * @param {string} avatarStyle - Inline style of the avatar
 * @returns {string} HTML string
 */
function getMobileEditSelectedAvatarHtml(avatarInner, avatarStyle) {
  return `<span class="selected-avatar" style="${avatarStyle}">${avatarInner}</span>`;
}

/**
 * Returns the HTML for a subtask list entry.
 * @param {Object} subtask - The subtask object
 * @returns {string} HTML string
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
 * Returns the HTML for a subtask in edit mode.
 * @param {Object} subtask - The subtask object
 * @returns {string} HTML string
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
 * Returns the HTML for an attachment thumbnail preview.
 * @param {Object} att - The attachment object
 * @param {number} index - The index of the attachment
 * @returns {string} HTML string
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
