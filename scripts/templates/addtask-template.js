/**
 * Generiert das HTML-Template für ein Subtask-Element (Normalansicht)
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} Das HTML-Template
 */
function getSubtaskItemTemplate(subtask) {
  return `
    <div class="subtask-item" id="subtask-item-${subtask.id}" ondblclick="editSubtask(${subtask.id})">
      <div class="subtask-content">
        <span class="subtask-text">${subtask.text}</span>
      </div>
      <div class="subtask-icons">
        <img src="./assets/icons/edit.svg" class="subtask-icon-small" onclick="editSubtask(${subtask.id})" alt="Edit">
        <div class="subtask-icon-divider"></div>
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeSubtask(${subtask.id})" alt="Delete">
      </div>
    </div>
  `;
}


/**
 * Generiert das HTML-Template für ein Subtask-Element (Bearbeitungsmodus)
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} Das HTML-Template
 */
function getSubtaskEditTemplate(subtask) {
  return `
    <div class="subtask-item-edit">
      <input type="text" class="subtask-edit-input" id="subtask-input-${subtask.id}" value="${subtask.text}" onkeydown="handleSubtaskEditKeydown(${subtask.id}, event)">
      <div class="subtask-icons" style="display: flex;">
        <img src="./assets/icons/delete.svg" class="subtask-icon-small" onclick="removeSubtask(${subtask.id})" alt="Delete">
        <div class="subtask-icon-divider"></div>
        <img src="./assets/icons/check-create-icon-black.svg" class="subtask-icon-small" onclick="saveEditSubtask(${subtask.id})" alt="Save">
      </div>
    </div>
  `;
}


/**
 * Generiert das HTML-Template für eine Kontakt-Option im Dropdown
 * @param {Object} contact - Das Kontakt-Objekt
 * @param {boolean} isSelected - Ob der Kontakt ausgewählt ist
 * @returns {string} Das HTML-Template für die Kontakt-Option
 */
function getContactOptionTemplate(contact, isSelected) {
  const selectedClass = isSelected ? "selected" : "";
  const nameSuffix = contact.isYou ? " (You)" : "";

  return `
    <div class="contact-option ${selectedClass}" onclick="toggleContactSelection('${contact.id}', event)">
      <div class="contact-info">
        <div class="contact-avatar" style="background-color: ${contact.color}">
          ${contact.initials}
        </div>
        <span class="contact-name">${contact.name}${nameSuffix}</span>
      </div>
      <div class="contact-checkbox"></div>
    </div>
  `;
}


/**
 * Generiert das HTML-Template für die Initialen einer ausgewählten Person
 * @param {Object} contact - Das Kontakt-Objekt
 * @returns {string} Das HTML-Template für den Initialen-Kreis
 */
function getSelectedContactInitialsTemplate(contact) {
  return `
    <div class="selected-avatar" style="background-color: ${contact.color}">
      ${contact.initials}
    </div>
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
