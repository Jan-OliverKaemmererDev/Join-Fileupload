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
    if (currentUser && currentUser.email !== "janoliverwieja@gmail.com") {
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
    receiver: "janoliverwieja@gmail.com",
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
