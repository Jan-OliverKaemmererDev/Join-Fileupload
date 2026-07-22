/**
 * Generiert das HTML-Template für ein Subtask-Element (Normalansicht)
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} Das HTML-Template
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
 * Generiert das HTML-Template für ein Subtask-Element (Bearbeitungsmodus)
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} Das HTML-Template
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
 * Generiert das HTML-Template für eine Kontakt-Option im Dropdown
 * @param {string} contactId - Die ID des Kontakts
 * @param {string} contactName - Der Name des Kontakts
 * @param {string} selectedClass - CSS-Klasse für Auswahl
 * @param {string} nameSuffix - Suffix für den Namen (z.B. " (You)")
 * @param {string} avatarStyle - Inline-Style für den Avatar
 * @param {string} avatarInner - Inhalt des Avatars (Initialen oder Bild)
 * @returns {string} Das HTML-Template für die Kontakt-Option
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
 * Generiert das HTML-Template für die Initialen einer ausgewählten Person
 * @param {string} avatarStyle - Inline-Style für den Avatar
 * @param {string} avatarInner - Inhalt des Avatars (Initialen oder Bild)
 * @returns {string} Das HTML-Template für den Initialen-Kreis
 */
function getSelectedContactInitialsTemplate(avatarStyle, avatarInner) {
  return `
    <span class="selected-avatar" style="${avatarStyle}">
      ${avatarInner}
    </span>
  `;
}


/**
 * Generiert das HTML-Template für eine Toast-Nachricht
 * @param {string} message - Die anzuzeigende Nachricht
 * @returns {string} Das HTML-Template für die Toast-Nachricht
 */
function getToastTemplate(message) {
  return `
    <span>${message}</span>
    <img src="./assets/summary-page/board-icon.svg" style="filter: brightness(0) invert(1); margin-left: 20px;" alt="">
  `;
}
