/**
 * @fileoverview Dummy data and logic for the add task page testing.
 */
let selectedPriority = "medium";
let subtasks = [];
let allContacts = [];
let selectedContacts = [];

/**
 * Initializes the add task page
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
 * Validates the form and enables/disables the submit button
 */
function validateForm() {
  const title = document.getElementById("title").value.trim();
  const dueDate = document.getElementById("due-date").value;
  const category = document.getElementById("category").value;
  const submitBtn = document.getElementById("create-task-btn");
  if (title && dueDate && category) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

/**
 * Handles the addition of a new task
 * @param {Event} event - The submit event of the form
 */
async function handleAddTask(event) {
  event.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please log in to create tasks");
    return;
  }
  const task = buildTask(currentUser);
  await saveTask(currentUser.id, task);
  showToast("Task added to board");
  dispatchTaskAddedEvent(task);
  clearForm();
  redirectToBoard();
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
 * Creates a Task object from the form data
 * @param {Object} currentUser - The currently logged in user
 * @returns {Object} The task object
 */
function buildTask(currentUser) {
  const assignedToIds = selectedContacts.map(function (c) {
    return c.id;
  });
  const formData = getTaskFormData();
  return createTaskObject(currentUser, assignedToIds, formData);
}

/**
 * Gets the task data from the form fields
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
 * Creates the final task object
 */
function createTaskObject(currentUser, assignedToIds, formData) {
  const task = buildBaseTaskObject(currentUser, assignedToIds);
  return Object.assign(task, formData);
}

/**
 * Builds the base properties for a new task
 * @param {Object} currentUser - The current user
 * @param {Array} assignedToIds - Array of contact IDs
 * @returns {Object} Base task object
 */
function buildBaseTaskObject(currentUser, assignedToIds) {
  return {
    id: Date.now(),
    priority: selectedPriority,
    assignedTo: assignedToIds,
    subtasks: copySubtasks(),
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
 * Raises a taskAdded event
 * @param {Object} task - The added task object
 */
function dispatchTaskAddedEvent(task) {
  window.dispatchEvent(
    new CustomEvent("taskAdded", { detail: { task: task } }),
  );
}

/**
 * Saves a task in Firestore
 * @param {string} userId - The user's ID
 * @param {Object} task - The task object to save
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
 * Resets the form
 */
function clearForm() {
  const form = document.getElementById("add-task-form");
  if (form) form.reset();
  selectPriority("medium");
  subtasks = [];
  selectedContacts = [];
  renderAssignedToOptions();
  renderSelectedInitials();
  renderSubtasks();
  validateForm();
}

/**
 * Checks whether the page was loaded in edit mode
 */
async function checkForEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editTaskId = urlParams.get("edit");
  if (editTaskId) {
    await loadTaskForEdit(editTaskId);
  }
}

/**
 * Loads a task's data for editing
 * @param {string} taskId - The ID of the task
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
    processLoadedTask(docSnap, taskId);
  } catch (error) {
    console.error("Error loading task for edit:", error);
  }
}

/**
 * Processes the loaded task for edit mode
 */
function processLoadedTask(docSnap, taskId) {
  if (docSnap.exists()) {
    const task = docSnap.data();
    fillFormWithTaskData(task);
    setupFormForEdit(taskId);
  }
}

/**
 * Populates the form's base text fields with task data
 * @param {Object} task - The task object
 */
function fillBasicTaskFields(task) {
  document.getElementById("title").value = task.title;
  document.getElementById("description").value = task.description;
  document.getElementById("due-date").value = task.dueDate;
}

/**
 * Populates the category field and display text with task data
 * @param {Object} task - The task object
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
 * @param {Object} task - The task object
 */
function fillFormWithTaskData(task) {
  fillBasicTaskFields(task);
  fillCategoryField(task);
  selectPriority(task.priority);
  loadAssigneesForEdit(task);
  subtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
  renderSubtasks();
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
 * Updates the submit button to "Save Changes"
 */
function setEditFormButton() {
  const submitBtn = document.getElementById("create-task-btn");
  if (submitBtn) {
    submitBtn.innerHTML =
      'Save Changes <img src="./assets/icons/check-create-icon.svg" alt="Save Changes" />';
  }
}

/**
 * Sets the form's submit handler for edit mode
 * @param {string} taskId - The ID of the task
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
 * Hides the Clear button in edit mode
 */
function hideFormClearButton() {
  const clearBtn = document.querySelector(".btn-clear");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
}

/**
 * Configures the form for editing and hides the Clear button
 * @param {string} taskId - The ID of the task
 */
function setupFormForEdit(taskId) {
  setEditFormTitle();
  setEditFormButton();
  setEditFormSubmitHandler(taskId);
  hideFormClearButton();
}

/**
 * Processes the update of a task and maintains the original status
 * @param {Event} event - The submit event
 * @param {string} taskId - The ID of the task
 */
async function handleEditTask(event, taskId) {
  event.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const task = buildTask(currentUser);
  task.id = Number(taskId);
  await executeTaskUpdate(currentUser, taskId, task);
}

/**
 * Runs the actual update of the task in Firestore
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
 * Creates a reference to a task in Firestore
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
 * Gets the original status of a task
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

