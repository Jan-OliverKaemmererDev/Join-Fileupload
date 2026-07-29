/**
 * @fileoview HTML template generating functions for the add task page.
 */
/**
 * Generates the HTML template for a subtask element (normal view)
 * @param {Object} subtask - The subtask object
 * @returns {string} The HTML template
 */
function getSubtaskItemTemplate(subtask) {
  return `
    <li class="subtask-item" id="subtask-item-${subtask.id}" ondblclick="editSubtask(${subtask.id})">
      <span class="subtask-content">
        <span class="subtask-text">${subtask.text}</span>
      </span>
      <span class="subtask-icons">
        <img src="./assets/icons/edit.svg" class="subtask-icon-small" onclick="editSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Edit subtask" alt="Edit">
        <hr class="subtask-icon-divider">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Delete subtask" alt="Delete">
      </span>
    </li>
  `;
}


/**
 * Generates the HTML template for a subtask element (edit mode)
 * @param {Object} subtask - The subtask object
 * @returns {string} The HTML template
 */
function getSubtaskEditTemplate(subtask) {
  return `
    <li class="subtask-item-edit">
      <input type="text" class="subtask-edit-input" id="subtask-input-${subtask.id}" value="${subtask.text}" aria-label="Edit subtask text" onkeydown="handleSubtaskEditKeydown(${subtask.id}, event)">
      <span class="subtask-icons" style="display: flex;">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Delete subtask" alt="Delete">
        <hr class="subtask-icon-divider">
        <img src="./assets/icons/check-create-icon-black.svg" class="subtask-icon-small" onclick="saveEditSubtask(${subtask.id})" role="button" tabindex="0" aria-label="Save subtask" alt="Save">
      </span>
    </li>
  `;
}


/**
 * Generates the HTML template for a contact option in the dropdown
 * @param {string} contactId - The ID of the contact
 * @param {string} contactName - The name of the contact
 * @param {string} selectedClass - CSS class for selection
 * @param {string} nameSuffix - Suffix for the name (e.g. " (You)")
 * @param {string} avatarStyle - Inline style for the avatar
 * @param {string} avatarInner - content of the avatar (initials or image)
 * @returns {string} The HTML template for the contact option
 */
function getContactOptionTemplate(contactId, contactName, selectedClass, nameSuffix, avatarStyle, avatarInner) {
  return `
    <label class="contact-option ${selectedClass}" onclick="toggleContactSelection('${contactId}', event)" tabindex="0" role="button" aria-label="Toggle selection for ${contactName}">
      <span class="contact-info">
        <span class="contact-avatar" style="${avatarStyle}">
          ${avatarInner}
        </span>
        <span class="contact-name">${contactName}${nameSuffix}</span>
      </span>
      <span class="contact-checkbox">
        <img src="./assets/icons/check-icon.png" class="check-icon" alt="Check">
      </span>
    </label>
  `;
}


/**
 * Generates the HTML template for a selected person's initials
 * @param {string} avatarStyle - Inline style for the avatar
 * @param {string} avatarInner - content of the avatar (initials or image)
 * @returns {string} The HTML template for the initials circle
 */
function getSelectedContactInitialsTemplate(avatarStyle, avatarInner) {
  return `
    <span class="selected-avatar" style="${avatarStyle}">
      ${avatarInner}
    </span>
  `;
}


/**
 * Generates the HTML template for a toast message
 * @param {string} message - The message to display
 * @returns {string} The HTML template for the toast message
 */
function getToastTemplate(message) {
  return `
    <span>${message}</span>
    <img src="./assets/summary-page/board-icon.svg" style="filter: brightness(0) invert(1); margin-left: 20px;" alt="">
  `;
}
