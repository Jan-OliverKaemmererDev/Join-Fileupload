/**
 * @fileoverview Logic for editing existing tasks in the Add Task form.
 */

/**
 * Checks whether the page was loaded in the editing mode
 */
async function checkForEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editTaskId = urlParams.get("edit");
  if (editTaskId) {
    await loadTaskForEdit(editTaskId);
  }
}

/**
 * Loads the data into tasks for editing
 * @param {string} taskId - The task ID.
 */
async function loadTaskForEdit(taskId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    const taskRef = window.fbDoc(
      window.firebaseDb,
      "users",
      currentUser.id,
      "tasks",
      taskId,
    );
    const docSnap = await window.fbGetDoc(taskRef);
    await processLoadedTask(docSnap, taskId);
  } catch (error) {
    console.error("Error loading task for edit:", error);
  }
}

/**
 * Processit the loaded task for the editing mode
 */
async function processLoadedTask(docSnap, taskId) {
  if (docSnap.exists()) {
    const task = docSnap.data();
    await fillFormWithTaskData(task);
    setupFormForEdit(taskId);
  }
}
/**
 * Populates the base text fields of the forms with task data
 * @param {Object} task - The task object.
 */
function fillBasicTaskFields(task) {
  document.getElementById("title").value = task.title;
  document.getElementById("description").value = task.description;
  const dateInput = document.getElementById("due-date");
  if (task.dueDate) dateInput.type = "date";
  dateInput.value = task.dueDate;
}
/**
 * Populates the category-field and the displaytext with task data
 * @param {Object} task - The task object.
 */
function fillCategoryField(task) {
  let mappedCategory = "technical";
  if (task.category === "user-story" || task.category === "User Story" || task.category === "User Story/Feature") {
    mappedCategory = "user-story";
  }

  const categoryInput = document.getElementById("category");
  if (categoryInput) categoryInput.value = mappedCategory;

  const categoryText = document.getElementById("selected-category-text");
  if (categoryText) {
    categoryText.textContent =
      mappedCategory === "user-story" ? "User Story" : "Technical Task";
  }
}

/**
 * Populates the form with task data (category, priority, contacts and subtasks)
 * @param {Object} task - The task object.
 */
async function fillFormWithTaskData(task) {
  fillBasicTaskFields(task);
  fillCategoryField(task);
  selectPriority(task.priority);
  loadAssigneesForEdit(task);
  subtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
  renderSubtasks();
  if (typeof loadExistingAttachments === 'function') {
    await loadExistingAttachments(task.attachments || []);
  }
  validateForm();
}

/**
 * Sets the form title to "Edit Task"
 */
function setEditFormTitle() {
  const titleHeader = document.querySelector(".add-task-title");
  if (titleHeader) titleHeader.textContent = "Edit Task";
}

/**
 * updates the Submit button to “Save Changes”
 */
function setEditFormButton() {
  const submitBtn = document.getElementById("create-task-btn");
  if (submitBtn) {
    submitBtn.innerHTML =
      'Save Changes <img src="./assets/icons/check-create-icon.svg" alt="Save Changes" />';
  }
}

/**
 * Sets the Submit-Handler of the forms for the editing mode
 * @param {string} taskId - The task ID.
 */
function setEditFormSubmitHandler(taskId) {
  const form = document.getElementById("add-task-form");
  if (form) {
    form.onsubmit = function (event) {
      handleEditTask(event, taskId);
    };
  }
}

/**
 * Hidit the Clear button in the editing mode
 */
function hideFormClearButton() {
  const clearBtn = document.querySelector(".btn-clear");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
}

/**
 * Configures the form for the editing and hides the Clear-Button from
 * @param {string} taskId - The task ID.
 */
function setupFormForEdit(taskId) {
  setEditFormTitle();
  setEditFormButton();
  setEditFormSubmitHandler(taskId);
  hideFormClearButton();
}

/**
 * Processit the updating a tasks and keeps the original status at
 * @param {Event} event - the submit event
 * @param {string} taskId - The task ID.
 */
async function handleEditTask(event, taskId) {
  event.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const task = await buildTask(currentUser);
  task.id = Number(taskId);
  await executeTaskUpdate(currentUser, taskId, task);
}

/**
 * Runs the actual Update of the Tasks in Firestore from
 */
async function executeTaskUpdate(currentUser, taskId, task) {
  try {
    const taskRef = getTaskRef(currentUser.id, taskId);
    task.status = await getOriginalTaskStatus(taskRef);
    await updateExistingTask(taskRef, task);
    showToast("Task updated successfully");
    redirectToBoard();
  } catch (error) {
    console.error("Error updating task:", error);
  }
}

/**
 * Create a reference to a Task in Firestore
 */
function getTaskRef(userId, taskId) {
  return window.fbDoc(
    window.firebaseDb,
    "users",
    userId,
    "tasks",
    String(taskId),
  );
}

/**
 * Retrievit the original status of a task
 */
async function getOriginalTaskStatus(taskRef) {
  const oldTaskSnap = await window.fbGetDoc(taskRef);
  if (oldTaskSnap.exists()) {
    return oldTaskSnap.data().status;
  }
  return "triage";
}

/**
 * Updates an existing task in Firestore
 */
async function updateExistingTask(taskRef, task) {
  await window.fbSetDoc(taskRef, task);
}
