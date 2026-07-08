/**
 * Fügt einen neuen Subtask hinzu
 */
function addSubtask() {
  const input = document.getElementById("subtask-input");
  const subtaskText = input.value.trim();
  if (subtaskText === "") {
    hideSubtaskIcons();
    return;
  }
  processNewSubtask(subtaskText);
  input.value = "";
  renderSubtasks();
  hideSubtaskIcons();
}

/**
 * Verarbeitet die Erstellung eines neuen Subtasks
 * @param {string} text - Der Text des Subtasks
 */
function processNewSubtask(text) {
  const subtask = createSubtask(text);
  subtasks.push(subtask);
}

/**
 * Zeigt die Subtask-Icons (Clear & Save) an und entfernt alle Ausblend-Klassen
 */
function showSubtaskIcons() {
  const activeIcons = document.getElementById("subtask-icons-active");
  if (activeIcons) {
    activeIcons.classList.remove("v-hidden");
    activeIcons.classList.remove("d-none");
  }
}

/**
 * Blendet die Subtask-Icons (Clear & Save) aus
 */
function hideSubtaskIcons() {
  const activeIcons = document.getElementById("subtask-icons-active");
  if (activeIcons) activeIcons.classList.add("v-hidden");
}

/**
 * Leert das Subtask-Eingabefeld und blendet die Icons aus
 */
function clearSubtaskInput() {
  const input = document.getElementById("subtask-input");
  if (input) input.value = "";
  hideSubtaskIcons();
}

// Globaler Klick-Handler zum Zurücksetzen des Subtask-Inputs bei Klick außerhalb
document.addEventListener("click", function (event) {
  const wrapper = document.getElementById("subtask-wrapper");
  const input = document.getElementById("subtask-input");
  if (wrapper && input && !wrapper.contains(event.target)) {
    if (input.value.trim() === "") {
      hideSubtaskIcons();
    }
  }
});

/**
 * Verhindert das Absenden des Formulars bei Enter im Subtask-Feld
 * @param {KeyboardEvent} event - Das Tastatur-Event
 */
function handleSubtaskKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addSubtask();
  }
}

/**
 * Erstellt ein Subtask-Objekt
 * @param {string} text - Der Subtask-Text
 * @returns {Object} Das Subtask-Objekt
 */
function createSubtask(text) {
  return {
    id: Date.now(),
    text: text,
    completed: false,
  };
}

/**
 * Rendert die Liste der Subtasks
 */
function renderSubtasks() {
  const list = document.getElementById("subtask-list");
  if (!list) return;
  list.innerHTML = "";
  for (let i = 0; i < subtasks.length; i++) {
    const li = document.createElement("li");
    li.innerHTML = getSubtaskItemTemplate(subtasks[i]);
    list.appendChild(li);
  }
}

/**
 * Wechselt ein Subtask in den Bearbeitungsmodus
 * @param {number} id - Die ID des Subtasks
 */
function editSubtask(id) {
  const subtask = findSubtaskById(id);
  if (!subtask) return;
  const container = document.getElementById(`subtask-item-${id}`);
  if (container && container.parentElement) {
    container.parentElement.innerHTML = getSubtaskEditTemplate(subtask);
    setupSubtaskEditFocus(id);
  }
}

/**
 * Setzt den Fokus auf das Subtask-Edit-Feld
 */
function setupSubtaskEditFocus(id) {
  const input = document.getElementById(`subtask-input-${id}`);
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

/**
 * Speichert die Bearbeitung eines Subtasks
 * @param {number} id - Die ID des Subtasks
 */
function saveEditSubtask(id) {
  const input = document.getElementById(`subtask-input-${id}`);
  if (!input) return;
  const newText = input.value.trim();
  if (newText === "") {
    removeSubtask(id);
    return;
  }
  updateSubtaskText(id, newText);
}

/**
 * Aktualisiert den Text eines Subtasks
 */
function updateSubtaskText(id, newText) {
  const subtask = findSubtaskById(id);
  if (subtask) {
    subtask.text = newText;
    renderSubtasks();
  }
}

/**
 * Verarbeitet Tasteneingaben im Subtask-Edit-Feld
 * @param {number} id - Die ID des Subtasks
 * @param {KeyboardEvent} event - Das Keyboard-Event
 */
function handleSubtaskEditKeydown(id, event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveEditSubtask(id);
  } else if (event.key === "Escape") {
    renderSubtasks();
  }
}

/**
 * Entfernt einen Subtask anhand der ID
 * @param {number} id - Die ID des zu entfernenden Subtasks
 */
function removeSubtask(id) {
  subtasks = subtasks.filter(function (s) {
    return s.id !== id;
  });
  renderSubtasks();
}

/**
 * Erstellt eine Kopie des Subtasks-Arrays
 * @returns {Array} Die Kopie des Subtasks-Arrays
 */
function copySubtasks() {
  const copy = [];
  for (let i = 0; i < subtasks.length; i++) {
    copy.push(subtasks[i]);
  }
  return copy;
}

/**
 * Findet einen Subtask anhand seiner ID
 */
function findSubtaskById(id) {
  return subtasks.find(function (s) {
    return s.id === id;
  });
}
