let selectedPriority = "medium";
let subtasks = [];
let allContacts = [];
let selectedContacts = [];

/**
 * Initialisiert die Add-Task-Seite
 */
async function initAddTask() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    updateHeaderInitials(currentUser);
  }
  await waitForFirebase();
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }
  setMinimumDate();
  await loadContacts();
  validateForm();
  checkForEditMode();
}

/**
 * Validiert das Formular und aktiviert/deaktiviert den Submit-Button
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
 * Verarbeitet das HinzufÃ¼gen eines neuen Tasks
 * @param {Event} event - Das Submit-Event des Formulars
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
 * Leitet den Benutzer zum Board weiter nach einer VerzÃ¶gerung
 */
function redirectToBoard() {
  if (!window.location.pathname.includes("board.html")) {
    setTimeout(function () {
      window.location.href = "board.html";
    }, 1000);
  }
}

/**
 * Erstellt ein Task-Objekt aus den Formulardaten
 * @param {Object} currentUser - Der aktuell angemeldete Benutzer
 * @returns {Object} Das Task-Objekt
 */
function buildTask(currentUser) {
  const assignedToIds = selectedContacts.map(function (c) {
    return c.id;
  });
  const formData = getTaskFormData();
  return createTaskObject(currentUser, assignedToIds, formData);
}

/**
 * Holt die Task-Daten aus den Formularfeldern
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
 * Erstellt das finale Task-Objekt
 */
function createTaskObject(currentUser, assignedToIds, formData) {
  const task = {
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
  return Object.assign(task, formData);
}

/**
 * LÃ¶st ein taskAdded-Event aus
 * @param {Object} task - Das hinzugefÃ¼gte Task-Objekt
 */
function dispatchTaskAddedEvent(task) {
  window.dispatchEvent(
    new CustomEvent("taskAdded", { detail: { task: task } }),
  );
}

/**
 * Speichert einen Task in Firestore
 * @param {string} userId - Die ID des Benutzers
 * @param {Object} task - Das zu speichernde Task-Objekt
 */
async function saveTask(userId, task) {
  try {
    const taskRef = window.fbDoc(
      window.firebaseDb,
      "users",
      userId,
      "tasks",
      String(task.id),
    );
    await window.fbSetDoc(taskRef, task);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email !== "jowsds@gmail.com") {
      const token = "YOUR_FIREBASE_RTDB_AUTH_TOKEN";
      const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks.json?auth=${token}`;
      const taskCopy = {
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
      
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(taskCopy)
      });
    }
  } catch (error) {
    console.error("Error saving task:", error);
  }
}

/**
 * Setzt das Formular zurÃ¼ck
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
 * PrÃ¼ft, ob die Seite im Bearbeitungsmodus geladen wurde
 */
async function checkForEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editTaskId = urlParams.get("edit");
  if (editTaskId) {
    await loadTaskForEdit(editTaskId);
  }
}

/**
 * LÃ¤dt die Daten eines Tasks zur Bearbeitung
 * @param {string} taskId - Die ID des Tasks
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
 * Verarbeitet den geladenen Task fÃ¼r den Bearbeitungsmodus
 */
function processLoadedTask(docSnap, taskId) {
  if (docSnap.exists()) {
    const task = docSnap.data();
    fillFormWithTaskData(task);
    setupFormForEdit(taskId);
  }
}

/**
 * FÃ¼llt die Basis-Textfelder des Formulars mit Task-Daten
 * @param {Object} task - Das Task-Objekt
 */
function fillBasicTaskFields(task) {
  document.getElementById("title").value = task.title;
  document.getElementById("description").value = task.description;
  document.getElementById("due-date").value = task.dueDate;
}

/**
 * FÃ¼llt das Kategorie-Feld und den Anzeigetext mit Task-Daten
 * @param {Object} task - Das Task-Objekt
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
 * FÃ¼llt das Formular mit Task-Daten (Kategorie, PrioritÃ¤t, Kontakte und Subtasks)
 * @param {Object} task - Das Task-Objekt
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
 * Setzt den Formulartitel auf "Edit Task"
 */
function setEditFormTitle() {
  const titleHeader = document.querySelector(".add-task-title");
  if (titleHeader) titleHeader.textContent = "Edit Task";
}

/**
 * Aktualisiert den Submit-Button auf "Save Changes"
 */
function setEditFormButton() {
  const submitBtn = document.getElementById("create-task-btn");
  if (submitBtn) {
    submitBtn.innerHTML =
      'Save Changes <img src="./assets/icons/check-create-icon.svg" alt="Save Changes" />';
  }
}

/**
 * Setzt den Submit-Handler des Formulars fÃ¼r den Bearbeitungsmodus
 * @param {string} taskId - Die ID des Tasks
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
 * Blendet den Clear-Button im Bearbeitungsmodus aus
 */
function hideFormClearButton() {
  const clearBtn = document.querySelector(".btn-clear");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
}

/**
 * Konfiguriert das Formular fÃ¼r die Bearbeitung und blendet den Clear-Button aus
 * @param {string} taskId - Die ID des Tasks
 */
function setupFormForEdit(taskId) {
  setEditFormTitle();
  setEditFormButton();
  setEditFormSubmitHandler(taskId);
  hideFormClearButton();
}

/**
 * Verarbeitet die Aktualisierung eines Tasks und behÃ¤lt den ursprÃ¼nglichen Status bei
 * @param {Event} event - Das Submit-Event
 * @param {string} taskId - Die ID des Tasks
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
 * FÃ¼hrt das eigentliche Update des Tasks in Firestore aus
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
 * Erstellt eine Referenz auf einen Task in Firestore
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
 * Holt den ursprÃ¼nglichen Status eines Tasks
 */
async function getOriginalTaskStatus(taskRef) {
  const oldTaskSnap = await window.fbGetDoc(taskRef);
  if (oldTaskSnap.exists()) {
    return oldTaskSnap.data().status;
  }
  return "triage";
}

/**
 * Aktualisiert einen bestehenden Task in Firestore
 */
async function updateExistingTask(taskRef, task) {
  await window.fbSetDoc(taskRef, task);
}

