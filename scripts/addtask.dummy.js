/**
 * @fileoverview Main logic for the add task page.
 */
let selectedPriority = "medium";
let subtasks = [];
let allContacts = [];
let selectedContacts = [];

/**
 * Initializes the add task page.
 */
async function initAddTask() {
  const currentUser = getCurrentUser();
  if (currentUser) updateHeaderInitials(currentUser);
  await waitForFirebase();
  if (redirectIfNotLoggedIn(currentUser)) return;
  await initAddTaskPage();
}

/**
 * Redirects if user is not logged in
 * @param {Object} user - The user object
 * @returns {boolean} True if redirected
 */
function redirectIfNotLoggedIn(user) {
  if (!user) {
    window.location.href = "index.html";
    return true;
  }
  return false;
}

/**
 * Initializes the rest of the add task page
 */
async function initAddTaskPage() {
  setMinimumDate();
  await loadContacts();
  validateForm();
  checkForEditMode();
}

/**
 * Validate the form and enables/disablit the submit button.
 */
function validateForm() {
  const isValid = getFormValidityState();
  const isDirtyValid = checkDirtyState(isValid);
  const submitBtn = document.getElementById("create-task-btn");
  if (submitBtn) {
    submitBtn.disabled = !isDirtyValid;
  }
}

/**
 * Checks basic form fields validity
 * @returns {boolean} True if required fields are filled
 */
function getFormValidityState() {
  const title = document.getElementById("title").value.trim();
  const dueDate = document.getElementById("due-date").value;
  const category = document.getElementById("category").value;
  return !!(title && dueDate && category);
}

/**
 * Checks if the task is dirty when in board
 * @param {boolean} currentValid - The current validity state
 * @returns {boolean} The new validity state
 */
function checkDirtyState(currentValid) {
  if (typeof isTaskDirty === 'function' && window.location.pathname.includes('board.html')) {
    if (!isTaskDirty()) return false;
  }
  return currentValid;
}

/**
 * Processit the Add a new Tasks
 * @param {Event} event - the Submit Event of the forms
 */
async function handleAddTask(event) {
  event.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return alert("Please log in to create tasks");
  const submitBtn = disableSubmitButton();
  try {
    const task = await buildTask(currentUser);
    await saveTask(currentUser.id, task);
    handleAddTaskSuccess(task);
  } catch (error) {
    handleAddTaskError(error, submitBtn);
  }
}

/**
 * Disables the submit button
 * @returns {HTMLElement} The submit button element
 */
function disableSubmitButton() {
  const submitBtn = document.getElementById("create-task-btn");
  if (submitBtn) submitBtn.disabled = true;
  return submitBtn;
}

/**
 * Handles successful task creation
 * @param {Object} task - The created task
 */
function handleAddTaskSuccess(task) {
  showToast("Task added to board");
  dispatchTaskAddedEvent(task);
  clearForm();
  redirectToBoard();
}

/**
 * Handles task creation error
 * @param {Error} error - The error object
 * @param {HTMLElement} submitBtn - The submit button
 */
function handleAddTaskError(error, submitBtn) {
  console.error("Error creating task:", error);
  if (submitBtn) submitBtn.disabled = false;
}

/**
 * Redirects the user to the board after a delay
 */
function redirectToBoard() {
  if (!window.location.pathname.includes("board.html")) {
    setTimeout(function () {
      window.location.href = "board.html";
    }, 1000);
  }
}

/**
 * Create a Task object from the form data
 * @param {Object} currentUser - the current logged in user
 * @returns {Object} The task object.
 */
async function buildTask(currentUser) {
  const assignedToIds = selectedContacts.map(function (c) {
    return c.id;
  });
  const formData = getTaskFormData();
  const attachments = typeof processTaskAttachments === 'function' ? await processTaskAttachments() : [];
  return createTaskObject(currentUser, assignedToIds, formData, attachments);
}

/**
 * Retrievit the task data from the form fields
 */
function getTaskFormData() {
  return {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("due-date").value,
    category: document.getElementById("category").value,
  };
}

/**
 * Create the final task object
 */
function createTaskObject(currentUser, assignedToIds, formData, attachments = []) {
  const task = buildBaseTaskObject(currentUser, assignedToIds, attachments);
  return Object.assign(task, formData);
}

/**
 * Builds the base properties for a new task
 * @param {Object} currentUser - The current user
 * @param {Array} assignedToIds - Array of contact IDs
 * @param {Array} attachments - Array of attachments
 * @returns {Object} Base task object
 */
function buildBaseTaskObject(currentUser, assignedToIds, attachments) {
  return {
    id: Date.now(),
    priority: selectedPriority,
    assignedTo: assignedToIds,
    subtasks: copySubtasks(),
    attachments: attachments,
    status: "triage",
    position: Date.now(),
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
    creatorName: currentUser.name || "Unknown",
    creatorEmail: currentUser.email || "",
    creatorType: "internal-user"
  };
}

/**
 * Raises a taskAdded event from
 * @param {Object} task - the added task object
 */
function dispatchTaskAddedEvent(task) {
  window.dispatchEvent(
    new CustomEvent("taskAdded", { detail: { task: task } }),
  );
}

/**
 * Saves a Task in Firestore
 * @param {string} userId - The ID of the user
 * @param {Object} task - the task object to save
 */
async function saveTask(userId, task) {
  try {
    await saveTaskToFirestore(userId, task);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email !== "jowsds@gmail.com") {
      const taskCopy = buildExternalTaskCopy(task, currentUser);
      await sendTaskToRTDB(taskCopy);
    }
  } catch (error) {
    console.error("Error saving task:", error);
  }
}

/**
 * Saves task data to Firestore
 * @param {string} userId - The user ID
 * @param {Object} task - The task object
 */
async function saveTaskToFirestore(userId, task) {
  const taskRef = window.fbDoc(window.firebaseDb, "users", userId, "tasks", String(task.id));
  await window.fbSetDoc(taskRef, task);
}

/**
 * Builds a copy of the task for external syncing
 * @param {Object} task - The task object
 * @param {Object} currentUser - The current user object
 * @returns {Object} External task copy
 */
function buildExternalTaskCopy(task, currentUser) {
  return {
    title: task.title || "",
    description: task.description || "",
    category: task.category || "user-story",
    priority: task.priority || "medium",
    deadline: task.dueDate || "",
    creator: currentUser.email || "unknown",
    creatorName: currentUser.name || "Unknown",
    receiver: "jowsds@gmail.com",
    creatorType: "internal-user",
    status: "triage"
  };
}

/**
 * Sends a task copy to the Realtime Database
 * @param {Object} taskCopy - The task copy object
 */
async function sendTaskToRTDB(taskCopy) {
  const token = "YOUR_FIREBASE_RTDB_AUTH_TOKEN";
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks.json?auth=${token}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskCopy)
  });
}

/**
 * Sets the form to the back
 */
function clearForm() {
  const form = document.getElementById("add-task-form");
  if (form) form.reset();
  const dateInput = document.getElementById("due-date");
  if (dateInput) dateInput.type = "text";
  selectPriority("medium");
  subtasks = [];
  selectedContacts = [];
  if (typeof clearAllAttachments === 'function') clearAllAttachments();
  renderAssignedToOptions();
  renderSelectedInitials();
  renderSubtasks();
  validateForm();
}

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
  const categoryInput = document.getElementById("category");
  if (categoryInput) categoryInput.value = task.category;

  const categoryText = document.getElementById("selected-category-text");
  if (categoryText) {
    categoryText.textContent =
      task.category === "user-story" ? "User Story" : "Technical Task";
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
 * updates the Submit button to â€œSave Changesâ€
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


