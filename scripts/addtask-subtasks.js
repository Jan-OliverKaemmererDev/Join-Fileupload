/**
 * @fileooverview Subtask management for the add task page.
 */
/**
 * Adds a new subtask
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
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Handles the creation of a new subtask
 * @param {string} text - The text of the subtask
 */
function processNewSubtask(text) {
  const subtask = createSubtask(text);
  subtasks.push(subtask);
}

/**
 * Shows the subtask icons (Clear & Save) and removes all hide classes
 */
function showSubtaskIcons() {
  const activeIcons = document.getElementById("subtask-icons-active");
  if (activeIcons) {
    activeIcons.classList.remove("v-hidden");
    activeIcons.classList.remove("d-none");
  }
}

/**
 * Hides the subtask icons (Clear & Save).
 */
function hideSubtaskIcons() {
  const activeIcons = document.getElementById("subtask-icons-active");
  if (activeIcons) activeIcons.classList.add("v-hidden");
}

/**
 * Empties the subtask input field and hides the icons
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
 * Prevents form submission on Enter in the subtask field
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleSubtaskKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addSubtask();
  }
}

/**
 * Creates a Subtask object
 * @param {string} text - The subtask text
 * @returns {Object} The subtask object
 */
function createSubtask(text) {
  return {
    id: Date.now(),
    text: text,
    completed: false,
  };
}

/**
 * Renders the list of subtasks
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
 * Switches a subtask to edit mode
 * @param {number} id - The ID of the subtask
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
 * Sets focus on the subtask edit field
 */
function setupSubtaskEditFocus(id) {
  const input = document.getElementById(`subtask-input-${id}`);
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

/**
 * Saves the processing of a subtask
 * @param {number} id - The ID of the subtask
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
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Updates the text of a subtask
 */
function updateSubtaskText(id, newText) {
  const subtask = findSubtaskById(id);
  if (subtask) {
    subtask.text = newText;
    renderSubtasks();
  }
}

/**
 * Processes keystrokes in the subtask edit field
 * @param {number} id - The ID of the subtask
 * @param {KeyboardEvent} event - The keyboard event
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
 * Removes a subtask by ID
 * @param {number} id - The ID of the subtask to remove
 */
function removeSubtask(id) {
  subtasks = subtasks.filter(function (s) {
    return s.id !== id;
  });
  renderSubtasks();
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Creates a copy of the subtasks array
 * @returns {Array} The copy of the subtasks array
 */
function copySubtasks() {
  const copy = [];
  for (let i = 0; i < subtasks.length; i++) {
    copy.push(subtasks[i]);
  }
  return copy;
}

/**
 * Finds a subtask by its ID
 */
function findSubtaskById(id) {
  return subtasks.find(function (s) {
    return s.id === id;
  });
}
