/**
 * @fileoverview User interactions logic for the board view.
 */
let currentEditTaskOriginalState = null;

/**
 * Compensates for scrollbar width when locking/unlocking scrolling.
 * Prevents layout from jumping when scroll bar is shown/hidden.
 * @param {boolean} lock - true to lock, false to unlock
 */
function toggleScrollLock(lock) {
  const mainContent = document.querySelector(".main-content");
  if (lock) {
    lockScrolling(mainContent);
  } else {
    unlockScrolling(mainContent);
  }
}

/**
 * Locks the scrolling
 */
function lockScrolling(mainContent) {
  const scrollbarWidth = mainContent ? mainContent.offsetWidth - mainContent.clientWidth : 0;
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
  if (mainContent && scrollbarWidth > 0) {
    mainContent.style.paddingRight = scrollbarWidth + "px";
  }
}

/**
 * Unlocks the scrolling
 */
function unlockScrolling(mainContent) {
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
  if (mainContent) mainContent.style.paddingRight = "";
}

/**
 * Opens the Add task overlay. On mobile devices (≤780px) you are redirected to addtask.html; on desktop the overlay is displayed.
 */
function openAddTaskOverlay() {
  if (window.innerWidth <= 780) {
    window.location.href = "addtask.html";
    return;
  }

  if (typeof initDragScroll === 'function') {
    const uploadPreview = document.getElementById('upload-preview');
    if (uploadPreview) initDragScroll(uploadPreview);
  }

  document.getElementById("add-task-overlay").classList.add("active");
  toggleScrollLock(true);
}

/**
 * Closes the add task overlay
 */
function closeAddTaskOverlay() {
  document.getElementById("add-task-overlay").classList.remove("active");
  toggleScrollLock(false);
  resetFormToAddMode();
}

/**
 * Opens the task detail view
 * @param {number} taskId - The ID of the task
 */
function openTaskDetails(taskId) {
  if (isDragging) return;
  const task = findTask(taskId);
  if (!task) return;
  const contentElement = document.getElementById("task-details-content");
  contentElement.innerHTML = buildTaskDetailsHtml(task);
  
  if (typeof initDragScroll === 'function') {
    const attachmentsContainer = contentElement.querySelector('.attachments-list-details');
    if (attachmentsContainer) initDragScroll(attachmentsContainer);
  }

  document.getElementById("task-details-overlay").classList.add("active");
}

/**
 * Builds the full HTML for the task detail view
 * @param {Object} task - The task object
 * @returns {string} The HTML for the detailed view
 */
function buildTaskDetailsHtml(task) {
  return getTaskDetailsTemplate(
    task,
    buildSubtasksHtml(task),
    getPriorityIcon(task.priority),
    getCategoryClass(task.category),
    getCategoryLabel(task.category),
    buildAssignedToDetailsHtml(task),
    buildTaskAttachmentsHtml(task)
  );
}

/**
 * Closes the task detail view
 */
function closeTaskDetails() {
  document.getElementById("task-details-overlay").classList.remove("active");
}

/**
 * Toggles the checkbox class of a subtask element in the DOM
 * @param {NodeList} subtaskItems - The subtask items in the detail view
 * @param {number} subtaskIndex - The index of the subtask
 */
function toggleSubtaskCheckboxInDom(subtaskItems, subtaskIndex) {
  if (subtaskItems[subtaskIndex]) {
    const checkbox =
      subtaskItems[subtaskIndex].querySelector(".subtask-checkbox");
    if (checkbox) {
      checkbox.classList.toggle("checked");
    }
  }
}

/**
 * Inverts the completed status of a subtask in the task object
 * @param {Object} task - The task object
 * @param {number} subtaskIndex - The index of the subtask
 */
function updateSubtaskCompletedState(task, subtaskIndex) {
  task.subtasks[subtaskIndex].completed =
    !task.subtasks[subtaskIndex].completed;
}

/**
 * Toggles the status of a subtask. Uses Optimistic Update: Checkbox and progress bar are updated immediately, saving takes place in the background.
 * @param {number} taskId - The ID of the task
 * @param {number} subtaskIndex - The index of the subtask
 */
async function toggleSubtask(taskId, subtaskIndex) {
  const task = findTask(taskId);
  if (!task) return;
  const subtaskItems = document.querySelectorAll(".subtask-item-detail");
  toggleSubtaskCheckboxInDom(subtaskItems, subtaskIndex);
  updateSubtaskCompletedState(task, subtaskIndex);
  updateTaskCardProgress(task);
  await saveSingleTask(task);
}

/**
 * Calculates the progress data for the subtasks of a task
 * @param {Array} subtasks - The task's subtask list
 * @returns {Object} Object with completed, total and percent
 */
function getSubtaskProgressData(subtasks) {
  const completed = countCompletedSubtasks(subtasks);
  const total = subtasks.length;
  const percent = (completed / total) * 100;
  return { completed, total, percent };
}

/**
 * Sets the width of the progress bar
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {number} percent - The percentage value (0-100)
 */
function applyProgressBarWidth(progressBar, percent) {
  if (progressBar) progressBar.style.width = `${percent}%`;
}

/**
 * Sets the progress text of a task card
 * @param {HTMLElement} progressText - The text element
 * @param {number} completed - Number of subtasks completed
 * @param {number} total - Total number of subtasks
 */
function applyProgressText(progressText, completed, total) {
  if (progressText) progressText.innerText = `${completed}/${total} Subtasks`;
}

/**
 * Updates the progress bar of a task card on the board
 * @param {Object} task - The task object
 */
function updateTaskCardProgress(task) {
  const card = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
  if (!card) return;

  const subtaskContainer = card.querySelector(".task-subtasks");
  if (!subtaskContainer) return;

  const { completed, total, percent } = getSubtaskProgressData(task.subtasks);
  const progressBar = subtaskContainer.querySelector(".progress-bar");
  const progressText = subtaskContainer.querySelector("span");

  applyProgressBarWidth(progressBar, percent);
  applyProgressText(progressText, completed, total);
}

/**
 * Deletes a task from Firestore
 * @param {number} taskId - The ID of the task to delete
 * @param {string} userId - The user's ID
 */
async function deleteTaskFromFirestore(taskId, userId) {
  const taskRef = window.fbDoc(
    window.firebaseDb,
    "users",
    userId,
    "tasks",
    String(taskId),
  );
  await window.fbDeleteDoc(taskRef);
}

/**
 * Removes a task from the local array, renders the board and closes the details view
 * @param {number} taskId - The ID of the task
 */
function removeTaskFromBoard(taskId) {
  tasks = filterOutTask(taskId);
  renderTasks();
  closeTaskDetails();
}

/**
 * Deletes a task
 * @param {number} taskId - The ID of the task to delete
 */
async function deleteTask(taskId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    await deleteTaskFromFirestore(taskId, currentUser.id);
  } catch (error) {
    console.error("Error deleting task:", error);
  }
  removeTaskFromBoard(taskId);
}

/**
 * Filters a task from the tasks array
 * @param {number} taskId - The ID of the task to remove
 * @returns {Array} The filtered tasks array
 */
function filterOutTask(taskId) {
  const filtered = [];
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id !== taskId) {
      filtered.push(tasks[i]);
    }
  }
  return filtered;
}

/**
 * Searches tasks based on a search query
 */
function searchTasks() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const cards = document.querySelectorAll(".task-card");
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    filterCard(card, query);
  }
}

/**
 * Filters a task card based on the search query
 * @param {HTMLElement} card - The task card element
 * @param {string} query - The search query
 */
function filterCard(card, query) {
  const title = card.querySelector(".task-title").innerText.toLowerCase();
  const desc = card.querySelector(".task-description").innerText.toLowerCase();
  if (title.includes(query) || desc.includes(query)) {
    card.style.display = "flex";
  } else {
    card.style.display = "none";
  }
}

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
  currentEditTaskOriginalState = JSON.stringify({
    title: task.title, description: task.description, dueDate: task.dueDate,
    category: task.category, priority: task.priority,
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
  document.getElementById("category").value = task.category;
  const categoryText = document.getElementById("selected-category-text");
  if (categoryText) {
    categoryText.textContent = task.category === "user-story" ? "User Story" : "Technical Task";
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


