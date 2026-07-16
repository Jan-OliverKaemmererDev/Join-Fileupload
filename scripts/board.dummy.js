let tasks = [];
let currentDraggedTaskId = null;
let isDragging = false;
let touchDragElement = null;
let touchDragClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchDragTaskId = null;

/**
 * Initialisiert das Board und lädt die Tasks sowie Kontakte (aus addtask.js).
 */
async function initBoard() {
  checkUser();
  await waitForFirebase();
  initSideMenu("board");
  await loadTasks();
  await loadContacts();
  renderTasks();
  setupTaskAddedListener();
  initTouchDragDrop();
}

/**
 * Richtet den Event-Listener für hinzugefügte Tasks ein.
 */
function setupTaskAddedListener() {
  window.addEventListener("taskAdded", function () {
    closeAddTaskOverlay();
    loadTasks().then(function () {
      renderTasks();
    });
  });
}

/**
 * Überprüft ob ein Benutzer angemeldet ist.
 */
function checkUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }
  if (document.getElementById("user-initials")) {
    updateHeaderInitials(currentUser);
  }
}

/**
 * Lädt die Tasks des aktuellen Benutzers aus Firestore.
 */
async function loadTasks() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    const tasksRef = getTasksRef(currentUser.id);
    const snapshot = await window.fbGetDocs(tasksRef);
    processTasksSnapshot(snapshot);
    syncExternalTasksAndRender(currentUser);
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasks = [];
  }
}

/**
 * Synchronisiert externe Tasks und rendert neu, falls erforderlich.
 * @param {Object} currentUser - Der Benutzer
 */
function syncExternalTasksAndRender(currentUser) {
  syncStakeholderTasks(currentUser).then(function (hasNewTasks) {
    if (hasNewTasks) renderTasks();
  });
}

/**
 * Erstellt die Referenz auf die Tasks-Collection.
 * @param {string} userId - Die Benutzer-ID
 * @returns {Object} Firestore-Referenz
 */
function getTasksRef(userId) {
  return window.fbCollection(window.firebaseDb, "users", userId, "tasks");
}

/**
 * Verarbeitet den Snapshot der Tasks.
 * @param {Object} snapshot - Der Firestore Snapshot
 */
function processTasksSnapshot(snapshot) {
  tasks = [];
  snapshot.forEach(function (doc) {
    const data = doc.data();
    if (data.position === undefined) {
      data.position = data.id || Date.now();
    }
    tasks.push(data);
  });
}

/**
 * Leert alle Board-Spalten.
 */
function clearAllColumns() {
  document.getElementById("triage-list").innerHTML = "";
  document.getElementById("todo-list").innerHTML = "";
  document.getElementById("inprogress-list").innerHTML = "";
  document.getElementById("awaitfeedback-list").innerHTML = "";
  document.getElementById("done-list").innerHTML = "";
}

/**
 * Rendert alle Tasks auf dem Board.
 */
function renderTasks() {
  tasks.sort((a, b) => (a.position || 0) - (b.position || 0));
  clearAllColumns();
  let counts = { triage: 0, todo: 0, inprogress: 0, awaitfeedback: 0, done: 0 };
  for (let i = 0; i < tasks.length; i++) {
    renderTaskCard(tasks[i], counts);
  }
  renderAllEmptyStates(counts);
}

/**
 * Rendert eine einzelne Task-Karte.
 * @param {Object} task - Das Task-Objekt
 * @param {Object} counts - Die Zähl-Objekt für Task-Stati
 */
function renderTaskCard(task, counts) {
  const cardHtml = generateTaskCardHtml(task);
  const listId = task.status + "-list";
  const listElement = document.getElementById(listId);
  if (listElement) {
    listElement.innerHTML += cardHtml;
    counts[task.status]++;
  }
}

/**
 * Rendert Empty-States für alle leeren Spalten.
 * @param {Object} counts - Die Zähl-Objekt mit Task-Anzahlen pro Status
 */
function renderAllEmptyStates(counts) {
  renderEmptyState("triage", counts.triage, "No tasks in Triage");
  renderEmptyState("todo", counts.todo, "No tasks To do");
  renderEmptyState("inprogress", counts.inprogress, "No tasks In progress");
  renderEmptyState("awaitfeedback", counts.awaitfeedback, "No tasks Await feedback");
  renderEmptyState("done", counts.done, "No tasks Done");
}

/**
 * Rendert einen Empty-State für eine Spalte.
 * @param {string} status - Der Status der Spalte
 * @param {number} count - Die Anzahl der Tasks in dieser Spalte
 * @param {string} message - Die anzuzeigende Nachricht
 */
function renderEmptyState(status, count, message) {
  const list = document.getElementById(status + "-list");
  if (count === 0 && list) {
    list.innerHTML = getNoTasksTemplate(message);
  }
}

/**
 * Startet das Drag-and-Drop für einen Task.
 * @param {number} id - Die ID des Tasks
 * @param {Event} ev - Das Drag-Event
 */
function startDragging(id, ev) {
  isDragging = true;
  currentDraggedTaskId = id;
  if (ev && ev.dataTransfer) {
    ev.dataTransfer.setData("text/plain", String(id));
    ev.dataTransfer.effectAllowed = "move";
  }
}

/**
 * Beendet das Drag-and-Drop.
 */
function endDragging() {
  setTimeout(function () {
    isDragging = false;
  }, 0);
}

/**
 * Erlaubt das Ablegen eines Tasks.
 * @param {Event} ev - Das Drag-Event
 */
function allowDrop(ev) {
  ev.preventDefault();
}

/**
 * Hebt eine Drop-Zone hervor.
 * @param {string} id - Die ID der Drop-Zone
 */
function highlight(id) {
  document.getElementById(id).classList.add("drag-over");
}

/**
 * Entfernt die Hervorhebung einer Drop-Zone.
 * @param {string} id - Die ID der Drop-Zone
 */
function removeHighlight(id) {
  document.getElementById(id).classList.remove("drag-over");
}

/**
 * Findet den Index eines Tasks anhand der ID.
 * @param {number} taskId - Die ID des Tasks
 * @returns {number} Der Index des Tasks oder -1
 */
function findTaskById(taskId) {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) {
      return i;
    }
  }
  return -1;
}

/**
 * Verschiebt einen Task zu einem neuen Status.
 * @param {string} status - Der neue Status
 * @param {number|null} targetTaskId - Die ID des Ziels
 * @param {string} relativePos - 'before' oder 'after'
 */
async function moveTo(status, targetTaskId = null, relativePos = "after") {
  const taskIndex = findTaskById(currentDraggedTaskId);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const oldStatus = task.status;
    updateTaskPosition(task, status, targetTaskId, relativePos);
    renderTasks();
    await saveSingleTask(task);
    checkAndNotifyStatusChange(task, oldStatus, status);
  }
  currentDraggedTaskId = null;
}

/**
 * Aktualisiert die Position und den Status eines Tasks.
 * @param {Object} task - Der Task
 * @param {string} status - Der neue Status
 * @param {number|null} targetTaskId - Ziel-Task
 * @param {string} relativePos - Position relativ zum Ziel
 */
function updateTaskPosition(task, status, targetTaskId, relativePos) {
  task.status = status;
  if (targetTaskId !== null && targetTaskId !== currentDraggedTaskId) {
    task.position = calculateNewPosition(status, targetTaskId, relativePos);
  } else if (targetTaskId === null) {
    task.position = getNewPositionAtEnd(status);
  }
}

/**
 * Prüft und sendet Benachrichtigungen bei Statusänderung.
 * @param {Object} task - Der Task
 * @param {string} oldStatus - Alter Status
 * @param {string} status - Neuer Status
 */
function checkAndNotifyStatusChange(task, oldStatus, status) {
  const emailToNotify = task.creatorEmail ||
    (task.createdBy && task.createdBy.includes("@") ? task.createdBy : null);
  if (oldStatus !== status && emailToNotify) {
    notifyExternalCreatorOnStatusChange(task, oldStatus, status, emailToNotify);
  }
}

/**
 * Berechnet die neue Position für einen Task am Ende einer Spalte.
 * @param {string} status - Der Status
 * @returns {number} Die neue Position
 */
function getNewPositionAtEnd(status) {
  const columnTasks = tasks.filter(t => t.status === status);
  if (columnTasks.length === 0) return Date.now();
  let maxPos = 0;
  for (let i = 0; i < columnTasks.length; i++) {
    if ((columnTasks[i].position || 0) > maxPos) {
      maxPos = columnTasks[i].position;
    }
  }
  return maxPos + 1024;
}

/**
 * Berechnet die neue Position zwischen zwei Tasks.
 * @param {string} status - Der Status
 * @param {number} targetTaskId - Ziel-Task-ID
 * @param {string} relativePos - 'before' oder 'after'
 * @returns {number} Die neue Position
 */
function calculateNewPosition(status, targetTaskId, relativePos) {
  const columnTasks = getSortedTasksByStatus(status);
  const targetIndex = columnTasks.findIndex(t => t.id === targetTaskId);
  if (targetIndex === -1) return getNewPositionAtEnd(status);
  
  if (relativePos === "before") {
    return calculatePositionBefore(columnTasks, targetIndex);
  } else {
    return calculatePositionAfter(columnTasks, targetIndex);
  }
}

/**
 * Gibt sortierte Tasks für einen bestimmten Status zurück.
 * @param {string} status - Der Status
 * @returns {Array} Sortierte Tasks
 */
function getSortedTasksByStatus(status) {
  return tasks
    .filter(t => t.status === status)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Berechnet die Position vor dem Ziel-Task.
 * @param {Array} columnTasks - Tasks der Spalte
 * @param {number} targetIndex - Index des Ziel-Tasks
 * @returns {number} Neue Position
 */
function calculatePositionBefore(columnTasks, targetIndex) {
  const prevTask = columnTasks[targetIndex - 1];
  const targetTask = columnTasks[targetIndex];
  if (!prevTask) return targetTask.position - 1024;
  return (prevTask.position + targetTask.position) / 2;
}

/**
 * Berechnet die Position nach dem Ziel-Task.
 * @param {Array} columnTasks - Tasks der Spalte
 * @param {number} targetIndex - Index des Ziel-Tasks
 * @returns {number} Neue Position
 */
function calculatePositionAfter(columnTasks, targetIndex) {
  const targetTask = columnTasks[targetIndex];
  const nextTask = columnTasks[targetIndex + 1];
  if (!nextTask) return targetTask.position + 1024;
  return (targetTask.position + nextTask.position) / 2;
}

/**
 * Behandelt das Drop-Event für einen Task.
 * @param {Event} ev - Das Drop-Event
 * @param {string} status - Der neue Status
 */
function drop(ev, status) {
  ev.preventDefault();
  removeHighlight(status + "-list");
  resolveDraggedTaskId(ev);
  const targetCard = ev.target.closest(".task-card");
  const dropTarget = resolveDropTarget(ev, targetCard);
  moveTo(status, dropTarget.targetTaskId, dropTarget.relativePos);
}

/**
 * Holt die verschobene Task-ID aus dem Event.
 * @param {Event} ev - Das Event
 */
function resolveDraggedTaskId(ev) {
  if (currentDraggedTaskId === null && ev.dataTransfer) {
    const data = ev.dataTransfer.getData("text/plain");
    if (data) currentDraggedTaskId = Number(data);
  }
}

/**
 * Bestimmt das Drop-Ziel und die relative Position.
 * @param {Event} ev - Das Drop-Event
 * @param {HTMLElement} targetCard - Das anvisierte Kartenelement
 * @returns {Object} Ziel-Task und relative Position
 */
function resolveDropTarget(ev, targetCard) {
  let targetTaskId = null;
  let relativePos = "after";
  if (targetCard) {
    targetTaskId = getTaskIdFromCard(targetCard);
    const rect = targetCard.getBoundingClientRect();
    if (window.innerWidth <= 780) {
      if (ev.clientX < rect.left + rect.width / 2) relativePos = "before";
    } else {
      if (ev.clientY < rect.top + rect.height / 2) relativePos = "before";
    }
  }
  return { targetTaskId, relativePos };
}

/**
 * Speichert alle Tasks in Firestore.
 */
async function saveTasks() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    await saveAllTasksToFirestore(currentUser.id);
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

/**
 * Iteriert über alle Tasks und speichert sie.
 * @param {string} userId - Die Benutzer-ID
 */
async function saveAllTasksToFirestore(userId) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskRef = getTaskRefForUser(userId, task.id);
    await window.fbSetDoc(taskRef, task);
  }
}

/**
 * Speichert einen einzelnen Task in Firestore.
 * @param {Object} task - Das zu speicherende Task-Objekt
 */
async function saveSingleTask(task) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    const taskRef = getTaskRefForUser(currentUser.id, task.id);
    await window.fbSetDoc(taskRef, task);
  } catch (error) {
    console.error("Error saving single task:", error);
  }
}

/**
 * Erstellt eine Dokument-Referenz für einen spezifischen Task.
 * @param {string} userId - Die Benutzer-ID
 * @param {number} taskId - Die Task-ID
 * @returns {Object} Firestore-Referenz
 */
function getTaskRefForUser(userId, taskId) {
  return window.fbDoc(
    window.firebaseDb,
    "users",
    userId,
    "tasks",
    String(taskId),
  );
}

/**
 * Findet einen Task anhand der ID.
 * @param {number} taskId - Die ID des Tasks
 * @returns {Object|null} Das Task-Objekt oder null
 */
function findTask(taskId) {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) {
      return tasks[i];
    }
  }
  return null;
}

/**
 * Liest die Task-ID aus dem data-Attribut einer Karte.
 * @param {HTMLElement} card - Das Task-Karten-Element
 * @returns {number|null} Die Task-ID oder null
 */
function getTaskIdFromCard(card) {
  const id = card.getAttribute("data-task-id");
  return id ? Number(id) : null;
}
