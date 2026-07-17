/**
 * @fileoverview Subtask-Handling für das mobile Board-Edit Overlay.
 * Verwaltet Hinzufügen, Bearbeiten, Löschen und Rendern von Subtasks.
 */

/**
 * Zeigt die Subtask-Icons im mobilen Edit an.
 */
function showMobileEditSubtaskIcons() {
  const icons = document.getElementById("mobile-edit-subtask-icons-active");
  if (icons) icons.classList.remove("v-hidden");
}

/**
 * Leert das Subtask-Eingabefeld im mobilen Edit und setzt den Fokus.
 */
function clearMobileEditSubtaskInput() {
  const input = document.getElementById("mobile-edit-subtask-input");
  if (input) {
    input.value = "";
    input.focus();
  }
}

/**
 * Fügt einen neuen Subtask im mobilen Edit hinzu.
 * Liest den Text aus dem Eingabefeld, erstellt ein neues Subtask-Objekt und rendert die Liste.
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
 * Behandelt Tasteneingaben im Subtask-Eingabefeld.
 * Enter fügt einen Subtask hinzu, Escape leert das Feld.
 * @param {KeyboardEvent} event - Das Keyboard-Event
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
 * Wechselt einen Subtask im mobilen Edit in den Bearbeitungsmodus.
 * @param {number} id - Die ID des Subtasks
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
 * Setzt Fokus und Cursor-Position auf das Subtask-Edit-Eingabefeld.
 * @param {number} id - Die ID des Subtasks
 */
function setupMobileSubtaskEditFocus(id) {
  const input = document.getElementById(`mobile-edit-subtask-input-${id}`);
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

/**
 * Findet einen Subtask im mobilen Edit anhand seiner ID.
 * @param {number} id - Die ID des Subtasks
 * @returns {Object|undefined} Das gefundene Subtask-Objekt oder undefined
 */
function findMobileSubtaskById(id) {
  return mobileEditSubtasks.find(function (s) {
    return s.id === id;
  });
}

/**
 * Generiert das HTML-Template für einen Subtask im Bearbeitungsmodus.
 * Delegiert an die HTML-Template-Funktion in board-mobile-template.js.
 * @param {Object} subtask - Das Subtask-Objekt
 * @returns {string} HTML-String des Edit-Templates
 */
function getMobileEditSubtaskEditTemplate(subtask) {
  return getMobileEditSubtaskEditHtml(subtask);
}

/**
 * Speichert die Bearbeitung eines Subtasks im mobilen Edit.
 * Entfernt den Subtask bei leerem Text, aktualisiert sonst den Text.
 * @param {number} id - Die ID des Subtasks
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
 * Aktualisiert den Text eines Subtasks und rendert die Liste neu.
 * @param {number} id - Die ID des Subtasks
 * @param {string} newText - Der neue Text des Subtasks
 */
function updateMobileSubtaskText(id, newText) {
  const subtask = findMobileSubtaskById(id);
  if (subtask) {
    subtask.text = newText;
    renderMobileEditSubtasks();
  }
}

/**
 * Behandelt Tasteneingaben im Subtask-Edit-Feld.
 * Enter speichert den Subtask, Escape bricht die Bearbeitung ab.
 * @param {number} id - Die ID des Subtasks
 * @param {KeyboardEvent} event - Das Keyboard-Event
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
 * Rendert die komplette Subtask-Liste im mobilen Edit.
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
 * Entfernt einen Subtask anhand seiner ID und rendert die Liste neu.
 * @param {number} id - Die ID des zu entfernenden Subtasks
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
