/**
 * Öffnet das Add-Task-Overlay. Auf mobilen Geräten (≤780px) erfolgt eine Weiterleitung zu addtask.html, auf Desktop wird das Overlay eingeblendet.
 */
function openAddTaskOverlay() {
  if (window.innerWidth <= 780) {
    window.location.href = "addtask.html";
    return;
  }

  document.getElementById("add-task-overlay").classList.add("active");
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
}

/**
 * Schließt das Add-Task-Overlay
 */
function closeAddTaskOverlay() {
  document.getElementById("add-task-overlay").classList.remove("active");
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
  resetFormToAddMode();
}

/**
 * Öffnet die Task-Detailansicht
 * @param {number} taskId - Die ID des Tasks
 */
function openTaskDetails(taskId) {
  if (isDragging) return;
  const task = findTask(taskId);
  if (!task) return;
  document.getElementById("task-details-content").innerHTML =
    buildTaskDetailsHtml(task);
  document.getElementById("task-details-overlay").classList.add("active");
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
}

/**
 * Baut das vollständige HTML für die Task-Detailansicht
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das HTML für die Detailansicht
 */
function buildTaskDetailsHtml(task) {
  return getTaskDetailsTemplate(
    task,
    buildSubtasksHtml(task),
    getPriorityIcon(task.priority),
    getCategoryClass(task.category),
    getCategoryLabel(task.category),
    buildAssignedToDetailsHtml(task),
  );
}

/**
 * Schließt die Task-Detailansicht
 */
function closeTaskDetails() {
  document.getElementById("task-details-overlay").classList.remove("active");
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
}

/**
 * Schaltet die Checkbox-Klasse eines Subtask-Elements im DOM um
 * @param {NodeList} subtaskItems - Die Subtask-Elemente im Detail-View
 * @param {number} subtaskIndex - Der Index des Subtasks
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
 * Invertiert den completed-Status eines Subtasks im Task-Objekt
 * @param {Object} task - Das Task-Objekt
 * @param {number} subtaskIndex - Der Index des Subtasks
 */
function updateSubtaskCompletedState(task, subtaskIndex) {
  task.subtasks[subtaskIndex].completed =
    !task.subtasks[subtaskIndex].completed;
}

/**
 * Schaltet den Status eines Subtasks um. Verwendet Optimistisches Update: Checkbox und Fortschrittsbalken werden sofort aktualisiert, Speichern erfolgt im Hintergrund.
 * @param {number} taskId - Die ID des Tasks
 * @param {number} subtaskIndex - Der Index des Subtasks
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
 * Berechnet die Fortschrittsdaten für die Subtasks eines Tasks
 * @param {Array} subtasks - Die Subtask-Liste des Tasks
 * @returns {Object} Objekt mit completed, total und percent
 */
function getSubtaskProgressData(subtasks) {
  const completed = countCompletedSubtasks(subtasks);
  const total = subtasks.length;
  const percent = (completed / total) * 100;
  return { completed, total, percent };
}

/**
 * Setzt die Breite des Fortschrittsbalkens
 * @param {HTMLElement} progressBar - Das Fortschrittsbalken-Element
 * @param {number} percent - Der Prozentwert (0-100)
 */
function applyProgressBarWidth(progressBar, percent) {
  if (progressBar) progressBar.style.width = `${percent}%`;
}

/**
 * Setzt den Fortschrittstext einer Task-Karte
 * @param {HTMLElement} progressText - Das Text-Element
 * @param {number} completed - Anzahl erledigter Subtasks
 * @param {number} total - Gesamtzahl der Subtasks
 */
function applyProgressText(progressText, completed, total) {
  if (progressText) progressText.innerText = `${completed}/${total} Subtasks`;
}

/**
 * Aktualisiert den Fortschrittsbalken einer Task-Karte auf dem Board
 * @param {Object} task - Das Task-Objekt
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
 * Löscht einen Task aus Firestore
 * @param {number} taskId - Die ID des zu löschenden Tasks
 * @param {string} userId - Die ID des Benutzers
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
 * Entfernt einen Task aus dem lokalen Array, rendert das Board und schließt die Detailansicht
 * @param {number} taskId - Die ID des Tasks
 */
function removeTaskFromBoard(taskId) {
  tasks = filterOutTask(taskId);
  renderTasks();
  closeTaskDetails();
}

/**
 * Löscht einen Task
 * @param {number} taskId - Die ID des zu löschenden Tasks
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
 * Filtert einen Task aus dem Tasks-Array
 * @param {number} taskId - Die ID des zu entfernenden Tasks
 * @returns {Array} Das gefilterte Tasks-Array
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
 * Durchsucht Tasks anhand einer Suchanfrage
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
 * Filtert eine Task-Karte basierend auf der Suchanfrage
 * @param {HTMLElement} card - Das Task-Karten-Element
 * @param {string} query - Die Suchanfrage
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
 * Öffnet das Bearbeitungs-Overlay für einen Task auf dem Desktop
 * @param {Object} task - Das Task-Objekt
 * @param {number} taskId - Die ID des Tasks
 */
function openEditOverlay(task, taskId) {
  closeTaskDetails();
  fillFormWithTaskData(task);
  openAddTaskOverlay();
  setupFormForEdit(taskId);
}

/**
 * Öffnet den Bearbeitungsmodus für einen Task
 * @param {number} taskId - Die ID des Tasks
 */
function editTask(taskId) {
  if (window.innerWidth <= 780) {
    openMobileEditOverlay(taskId);
    return;
  }
  const task = findTask(taskId);
  if (!task) return;
  openEditOverlay(task, taskId);
}

/**
 * Füllt das Formular mit den Daten eines Tasks
 * @param {Object} task - Das Task-Objekt
 */
function fillFormWithTaskData(task) {
  document.getElementById("title").value = task.title;
  document.getElementById("description").value = task.description;
  document.getElementById("due-date").value = task.dueDate;
  loadAssigneesForEdit(task);
  document.getElementById("category").value = task.category;
  selectPriority(task.priority);
  subtasks =
    task.subtasks && task.subtasks.length > 0
      ? JSON.parse(JSON.stringify(task.subtasks))
      : [];
  renderSubtasks();
  validateForm();
}

/**
 * Lädt die zugewiesenen Kontakte in den Formularzustand
 * @param {Object} task - Das Task-Objekt
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
 * Sucht einen Kontakt und fügt ihn zu den selektierten Kontakten hinzu
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
 * Setzt den Formulartitel auf "Edit Task"
 */
function setBoardEditTitle() {
  const title = document.querySelector(".add-task-title");
  title.textContent = "Edit Task";
}

/**
 * Aktualisiert den Submit-Button auf "Save Changes"
 */
function setBoardEditButton() {
  const submitBtn = document.getElementById("create-task-btn");
  submitBtn.innerHTML = `Save Changes <img src="./assets/icons/check-create-icon.svg" alt="Save Changes" />`;
}

/**
 * Setzt den Submit-Handler des Formulars für den Board-Bearbeitungsmodus
 * @param {number} taskId - Die ID des Tasks
 */
function setBoardEditSubmitHandler(taskId) {
  const form = document.getElementById("add-task-form");
  form.onsubmit = function (event) {
    event.preventDefault();
    updateTask(taskId);
  };
}

/**
 * Konfiguriert das Formular für die Bearbeitung
 * @param {number} taskId - Die ID des zu bearbeitenden Tasks
 */
function setupFormForEdit(taskId) {
  setBoardEditTitle();
  setBoardEditButton();
  setBoardEditSubmitHandler(taskId);
}

/**
 * Überträgt die Formulardaten in das Task-Objekt
 * @param {Object} task - Das zu aktualisierende Task-Objekt
 */
function applyFormDataToTask(task) {
  task.title = document.getElementById("title").value.trim();
  task.description = document.getElementById("description").value.trim();
  task.dueDate = document.getElementById("due-date").value;
  task.priority = selectedPriority;
  task.assignedTo = selectedContacts.map(function (c) {
    return c.id;
  });
  task.category = document.getElementById("category").value;
  task.subtasks = JSON.parse(JSON.stringify(subtasks));
}

/**
 * Schließt das Overlay, setzt das Formular zurück und zeigt eine Erfolgsmeldung
 */
function finalizeTaskUpdate() {
  renderTasks();
  resetFormToAddMode();
  closeAddTaskOverlay();
  showToast("Task updated successfully");
}

/**
 * Aktualisiert einen vorhandenen Task
 * @param {number} taskId - Die ID des zu aktualisierenden Tasks
 */
async function updateTask(taskId) {
  const taskIndex = findTaskById(taskId);
  if (taskIndex === -1) return;
  applyFormDataToTask(tasks[taskIndex]);
  await saveSingleTask(tasks[taskIndex]);
  finalizeTaskUpdate();
}

/**
 * Setzt den Formulartitel auf "Add Task"
 */
function setAddFormTitle() {
  const title = document.querySelector(".add-task-title");
  title.textContent = "Add Task";
}

/**
 * Setzt den Submit-Button zurück auf "Create Task"
 */
function setAddFormButton() {
  const submitBtn = document.getElementById("create-task-btn");
  submitBtn.innerHTML = `Create Task <img src="./assets/icons/check-create-icon.svg" alt="Create Task" />`;
}

/**
 * Setzt den Submit-Handler des Formulars auf den Standard-Add-Handler
 */
function setAddFormSubmitHandler() {
  const form = document.getElementById("add-task-form");
  form.onsubmit = handleAddTask;
}

/**
 * Setzt das Formular zurück in den Add-Modus
 */
function resetFormToAddMode() {
  setAddFormTitle();
  setAddFormButton();
  setAddFormSubmitHandler();
  clearForm();
  resetBoardDropdowns();
}
