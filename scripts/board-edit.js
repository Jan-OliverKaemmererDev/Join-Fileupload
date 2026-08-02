/**
 * @fileoverview Logic for the Edit Task overlay on the board view.
 */

/**
 * Opens the editing overlay for a task on the desktop
 * @param {Object} task - The task object
 * @param {number} taskId - The ID of the task
 */
async function openEditOverlay(task, taskId) {
  closeTaskDetails();
  await fillFormWithTaskData(task);
  openAddTaskOverlay();
  setupFormForEdit(taskId);
}

/**
 * Opens editing mode for a task
 * @param {number} taskId - The ID of the task
 */
async function editTask(taskId) {
  if (window.innerWidth <= 780) {
    openMobileEditOverlay(taskId);
    return;
  }
  const task = findTask(taskId);
  if (!task) return;
  await openEditOverlay(task, taskId);
}

/**
 * Fills the form with the data of a task
 * @param {Object} task - The task object
 */
async function fillFormWithTaskData(task) {
  saveOriginalEditState(task);
  fillBasicTaskFields(task);
  loadAssigneesForEdit(task);
  fillCategoryAndPriority(task);
  
  subtasks = task.subtasks && task.subtasks.length > 0 
    ? JSON.parse(JSON.stringify(task.subtasks)) : [];
  renderSubtasks();
  
  if (typeof loadExistingAttachments === 'function') {
    await loadExistingAttachments(task.attachments || []);
  }
  validateForm();
}

/**
 * Saves the original task state to check for dirtiness later
 */
function saveOriginalEditState(task) {
  let mappedCategory = "technical";
  if (task.category === "user-story" || task.category === "User Story" || task.category === "User Story/Feature") {
    mappedCategory = "user-story";
  }

  currentEditTaskOriginalState = JSON.stringify({
    title: task.title, description: task.description, dueDate: task.dueDate,
    category: mappedCategory, priority: task.priority,
    assignedTo: task.assignedTo ? [...task.assignedTo].sort() : [],
    subtasks: task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [],
    attachments: task.attachments ? task.attachments.length : 0
  });
}

/**
 * Fills basic text fields and dates
 */
function fillBasicTaskFields(task) {
  document.getElementById("title").value = task.title;
  document.getElementById("description").value = task.description;
  const dateInput = document.getElementById("due-date");
  if (task.dueDate) dateInput.type = "date";
  dateInput.value = task.dueDate;
}

/**
 * Fills category and priority UI elements
 */
function fillCategoryAndPriority(task) {
  let mappedCategory = "technical";
  if (task.category === "user-story" || task.category === "User Story" || task.category === "User Story/Feature") {
    mappedCategory = "user-story";
  }

  const catElement = document.getElementById("category");
  if (catElement) catElement.value = mappedCategory;

  const categoryText = document.getElementById("selected-category-text");
  if (categoryText) {
    categoryText.textContent = mappedCategory === "user-story" ? "User Story" : "Technical Task";
  }
  selectPriority(task.priority);
}

/**
 * Checks whether the form has changed since the task was loaded.
 * @returns {boolean} True if changes were made.
 */
function isTaskDirty() {
  if (!currentEditTaskOriginalState) return true;
  const currentStateObj = buildCurrentEditState();
  return JSON.stringify(currentStateObj) !== currentEditTaskOriginalState;
}

/**
 * Builds the current form state for comparison
 */
function buildCurrentEditState() {
  const currentAssignedTo = selectedContacts ? [...selectedContacts].map(c => typeof c === 'object' ? c.id : c).sort() : [];
  return {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("due-date").value,
    category: document.getElementById("category").value,
    priority: typeof selectedPriority !== 'undefined' ? selectedPriority : "medium",
    assignedTo: currentAssignedTo,
    subtasks: subtasks ? subtasks : [],
    attachments: typeof taskAttachments !== 'undefined' ? taskAttachments.length : 0
  };
}

/**
 * Loads the assigned contacts into the form state
 * @param {Object} task - The task object
 */
function loadAssigneesForEdit(task) {
  selectedContacts = [];
  if (Array.isArray(task.assignedTo)) {
    for (let i = 0; i < task.assignedTo.length; i++) {
      findAndAddContactForEdit(task.assignedTo[i]);
    }
  }
  renderAssignedToOptions();
  renderSelectedInitials();
}

/**
 * Searches for a contact and adds it to the selected contacts
 */
function findAndAddContactForEdit(contactId) {
  const contact = allContacts.find(function (c) {
    return String(c.id) === String(contactId);
  });
  if (contact) {
    selectedContacts.push(contact);
  }
}

/**
 * Sets the form title to "Edit Task"
 */
function setBoardEditTitle() {
  const title = document.querySelector(".add-task-title");
  title.textContent = "Edit Task";
}

/**
 * Updates the submit button to "Save Changes"
 */
function setBoardEditButton() {
  const submitBtn = document.getElementById("create-task-btn");
  submitBtn.innerHTML = `Save Changes <img src="./assets/icons/check-create-icon.svg" alt="Save Changes" />`;
}

/**
 * Sets the form's submit handler for board edit mode
 * @param {number} taskId - The ID of the task
 */
function setBoardEditSubmitHandler(taskId) {
  const form = document.getElementById("add-task-form");
  form.onsubmit = function (event) {
    event.preventDefault();
    updateTask(taskId);
  };
}

/**
 * Configures the form for editing
 * @param {number} taskId - The ID of the task to process
 */
function setupFormForEdit(taskId) {
  setBoardEditTitle();
  setBoardEditButton();
  setBoardEditSubmitHandler(taskId);
}

/**
 * Transfers the form data to the task object
 * @param {Object} task - The task object to update
 */
async function applyFormDataToTask(task) {
  task.title = document.getElementById("title").value.trim();
  task.description = document.getElementById("description").value.trim();
  task.dueDate = document.getElementById("due-date").value;
  task.priority = selectedPriority;
  task.assignedTo = selectedContacts.map(c => c.id);
  task.category = document.getElementById("category").value;
  task.subtasks = JSON.parse(JSON.stringify(subtasks));
  
  if (typeof processTaskAttachments === 'function') {
    task.attachments = await processTaskAttachments();
  }
}

/**
 * Closes the overlay, resets the form and shows a success message
 */
function finalizeTaskUpdate() {
  renderTasks();
  resetFormToAddMode();
  closeAddTaskOverlay();
  showToast("Task updated successfully");
}

/**
 * Updates an existing task
 * @param {number} taskId - The ID of the task to update
 */
async function updateTask(taskId) {
  const taskIndex = findTaskById(taskId);
  if (taskIndex === -1) return;
  await applyFormDataToTask(tasks[taskIndex]);
  await saveSingleTask(tasks[taskIndex]);
  finalizeTaskUpdate();
}

/**
 * Sets the form title to "Add Task"
 */
function setAddFormTitle() {
  const title = document.querySelector(".add-task-title");
  title.textContent = "Add Task";
}

/**
 * Resets the submit button to "Create Task"
 */
function setAddFormButton() {
  const submitBtn = document.getElementById("create-task-btn");
  submitBtn.innerHTML = `Create Task <img src="./assets/icons/check-create-icon.svg" alt="Create Task" />`;
}

/**
 * Sets the form's submit handler to the default add handler
 */
function setAddFormSubmitHandler() {
  const form = document.getElementById("add-task-form");
  form.onsubmit = handleAddTask;
}

/**
 * Sets the form back to add mode
 */
function resetFormToAddMode() {
  setAddFormTitle();
  setAddFormButton();
  setAddFormSubmitHandler();
  clearForm();
  resetBoardDropdowns();
}
