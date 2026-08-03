/**
 * @fileoverview Subtask management for the mobile board edit overlay.
 */

/**
 * Shows the subtask icons in mobile edit.
 */
function showMobileEditSubtaskIcons() {
  const icons = document.getElementById("mobile-edit-subtask-icons-active");
  if (icons) icons.classList.remove("v-hidden");
}

/**
 * Empties the subtask input field in mobile edit and sets the focus.
 */
function clearMobileEditSubtaskInput() {
  const input = document.getElementById("mobile-edit-subtask-input");
  if (input) {
    input.value = "";
    input.focus();
  }
}

/**
 * Adds a new subtask in mobile edit.
 * Reads the text from the input field, creates a new Subtask object and renders the list.
 */
function addMobileEditSubtask() {
  const input = document.getElementById("mobile-edit-subtask-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const id = Date.now();
  mobileEditSubtasks.push({ id: id, text: text, completed: false });
  input.value = "";
  renderMobileEditSubtasks();
  
  if (typeof validateMobileEditForm === 'function') {
    validateMobileEditForm();
  }
}

/**
 * Handles keystrokes in the subtask input field.
 * Enter adds a subtask, Escape clears the field.
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleMobileEditSubtaskKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addMobileEditSubtask();
  }
  if (event.key === "Escape") {
    clearMobileEditSubtaskInput();
  }
}

/**
 * Switches a subtask in mobile edit to edit mode.
 * @param {number} id - The ID of the subtask
 */
function editMobileEditSubtask(id) {
  const subtask = findMobileSubtaskById(id);
  if (!subtask) return;
  const container = document.getElementById(`mobile-edit-subtask-item-${id}`);
  if (container) {
    container.innerHTML = getMobileEditSubtaskEditTemplate(subtask);
    setupMobileSubtaskEditFocus(id);
  }
}

/**
 * Sets focus and cursor position to the subtask edit input field.
 * @param {number} id - The ID of the subtask
 */
function setupMobileSubtaskEditFocus(id) {
  const input = document.getElementById(`mobile-edit-subtask-input-${id}`);
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

/**
 * Finds a subtask in mobile edit by its ID.
 * @param {number} id - The ID of the subtask
 * @returns {Object|undefined} The subtask object found or undefined
 */
function findMobileSubtaskById(id) {
  return mobileEditSubtasks.find(function (s) {
    return s.id === id;
  });
}

/**
 * Generates the HTML template for a subtask in edit mode.
 * Delegated to the HTML template function in board-mobile-template.js.
 * @param {Object} subtask - The subtask object
 * @returns {string} HTML string of the edit template
 */
function getMobileEditSubtaskEditTemplate(subtask) {
  return getMobileEditSubtaskEditHtml(subtask);
}

/**
 * Saves the editing of a subtask in mobile edit.
 * Removes the subtask if the text is empty, otherwise updates the text.
 * @param {number} id - The ID of the subtask
 */
function saveMobileEditSubtask(id) {
  const input = document.getElementById(`mobile-edit-subtask-input-${id}`);
  if (!input) return;
  const newText = input.value.trim();
  if (newText === "") {
    removeMobileEditSubtask(id);
    return;
  }
  updateMobileSubtaskText(id, newText);
  
  if (typeof validateMobileEditForm === 'function') {
    validateMobileEditForm();
  }
}

/**
 * Updates the text of a subtask and re-renders the list.
 * @param {number} id - The ID of the subtask
 * @param {string} newText - The new text of the subtask
 */
function updateMobileSubtaskText(id, newText) {
  const subtask = findMobileSubtaskById(id);
  if (subtask) {
    subtask.text = newText;
    renderMobileEditSubtasks();
  }
}

/**
 * Handles keystrokes in the subtask edit field.
 * Enter saves the subtask, Escape aborts processing.
 * @param {number} id - The ID of the subtask
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleMobileEditSubtaskEditKeydown(id, event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveMobileEditSubtask(id);
  } else if (event.key === "Escape") {
    renderMobileEditSubtasks();
  }
}

/**
 * Renders the complete subtask list in mobile edit.
 */
function renderMobileEditSubtasks() {
  const list = document.getElementById("mobile-edit-subtask-list");
  if (!list) return;
  list.innerHTML = "";
  mobileEditSubtasks.forEach(function (subtask) {
    list.innerHTML += getMobileEditSubtaskItemHtml(subtask);
  });
}

/**
 * Removes a subtask by its ID and re-renders the list.
 * @param {number} id - The ID of the subtask to remove
 */
function removeMobileEditSubtask(id) {
  mobileEditSubtasks = mobileEditSubtasks.filter(function (s) {
    return s.id !== id;
  });
  renderMobileEditSubtasks();
  
  if (typeof validateMobileEditForm === 'function') {
    validateMobileEditForm();
  }
}
