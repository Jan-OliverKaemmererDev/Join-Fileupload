let tasks = [];
let currentDraggedTaskId = null;
let isDragging = false;
let touchDragElement = null;
let touchDragClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchDragTaskId = null;

/**
 * Initialisiert das Board und lädt die Tasks sowie Kontakte (aus addtask.js)
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
 * Richtet den Event-Listener für hinzugefügte Tasks ein
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
 * Überprüft ob ein Benutzer angemeldet ist
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
 * Lädt die Tasks des aktuellen Benutzers aus Firestore
 */
async function loadTasks() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    const tasksRef = getTasksRef(currentUser.id);
    const snapshot = await window.fbGetDocs(tasksRef);
    processTasksSnapshot(snapshot);
    
    syncStakeholderTasks(currentUser).then(function(hasNewTasks) {
      if (hasNewTasks) {
        renderTasks();
      }
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasks = [];
  }
}

/**
 * Erstellt die Referenz auf die Tasks-Collection
 */
function getTasksRef(userId) {
  return window.fbCollection(window.firebaseDb, "users", userId, "tasks");
}

/**
 * Verarbeitet den Snapshot der Tasks
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
 * Normalisiert Subtasks aus verschiedenen Firebase-Formaten in das Board-Format
 * Handles: Array of strings, Array of objects, Firebase object with numeric keys, comma-separated string, JSON string
 * @param {*} raw - Die rohen Subtask-Daten aus Firebase
 * @returns {Array} Array von {text, completed} Objekten
 */
function parseSubtasks(raw) {
  if (!raw) return [];
  var items = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "string") {
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else {
        items = raw.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      }
    } catch (e) {
      items = raw.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
    }
  } else if (typeof raw === "object") {
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i++) {
      items.push(raw[keys[i]]);
    }
  }
  return items.map(function(st) {
    if (typeof st === "string") {
      return { id: Date.now() + Math.floor(Math.random() * 1000), text: st, completed: false };
    }
    if (st && typeof st === "object" && st.text) {
      return { id: st.id || (Date.now() + Math.floor(Math.random() * 1000)), text: st.text, completed: !!st.completed };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Synchronisiert externe Stakeholder-Tasks aus der Realtime Database
 */
async function syncStakeholderTasks(currentUser) {
  if (currentUser.email !== "jowieja22@gmail.com") return false;
  const token = "YOUR_FIREBASE_AUTH_TOKEN";
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks.json?auth=${token}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data) return false;
    
    let hasNewTasks = false;
    for (const key in data) {
      const taskData = data[key];
      const newTask = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: taskData.title || "External Task",
        description: taskData.description || "",
        category: taskData.category || "user-story",
        priority: taskData.priority || "medium",
        dueDate: taskData.deadline || "",
        assignedTo: [],
        subtasks: parseSubtasks(taskData.subtasks),
        status: taskData.status || "triage",
        position: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: taskData.creator || "extern",
      };
      
      await saveSingleTask(newTask);
      tasks.push(newTask);
      
      await fetch(`https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json?auth=${token}`, {
        method: "DELETE"
      });
      hasNewTasks = true;
    }
    return hasNewTasks;
  } catch (err) {
    console.error("Error syncing external tasks:", err);
    return false;
  }
}

/**
 * Leert alle Board-Spalten
 */
function clearAllColumns() {
  document.getElementById("triage-list").innerHTML = "";
  document.getElementById("todo-list").innerHTML = "";
  document.getElementById("inprogress-list").innerHTML = "";
  document.getElementById("awaitfeedback-list").innerHTML = "";
  document.getElementById("done-list").innerHTML = "";
}

/**
 * Rendert alle Tasks auf dem Board
 */
function renderTasks() {
  tasks.sort(function (a, b) {
    return (a.position || 0) - (b.position || 0);
  });
  clearAllColumns();
  let counts = { triage: 0, todo: 0, inprogress: 0, awaitfeedback: 0, done: 0 };
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    renderTaskCard(task, counts);
  }
  renderAllEmptyStates(counts);
}

/**
 * Rendert eine einzelne Task-Karte
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
 * Rendert Empty-States für alle leeren Spalten
 * @param {Object} counts - Die Zähl-Objekt mit Task-Anzahlen pro Status
 */
function renderAllEmptyStates(counts) {
  renderEmptyState("triage", counts.triage, "No tasks in Triage");
  renderEmptyState("todo", counts.todo, "No tasks To do");
  renderEmptyState("inprogress", counts.inprogress, "No tasks In progress");
  renderEmptyState(
    "awaitfeedback",
    counts.awaitfeedback,
    "No tasks Await feedback",
  );
  renderEmptyState("done", counts.done, "No tasks Done");
}

/**
 * Rendert einen Empty-State für eine Spalte
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
 * Startet das Drag-and-Drop für einen Task
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
 * Beendet das Drag-and-Drop
 */
function endDragging() {
  setTimeout(function () {
    isDragging = false;
  }, 0);
}

/**
 * Erlaubt das Ablegen eines Tasks
 * @param {Event} ev - Das Drag-Event
 */
function allowDrop(ev) {
  ev.preventDefault();
}

/**
 * Hebt eine Drop-Zone hervor
 * @param {string} id - Die ID der Drop-Zone
 */
function highlight(id) {
  document.getElementById(id).classList.add("drag-over");
}

/**
 * Entfernt die Hervorhebung einer Drop-Zone
 * @param {string} id - Die ID der Drop-Zone
 */
function removeHighlight(id) {
  document.getElementById(id).classList.remove("drag-over");
}

/**
 * Findet den Index eines Tasks anhand der ID
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
 * Verschiebt einen Task zu einem neuen Status. Aktualisiert die UI sofort (Optimistisches Update) und speichert im Hintergrund.
 * @param {string} status - Der neue Status
 */
async function moveTo(status, targetTaskId = null, relativePos = "after") {
  const taskIndex = findTaskById(currentDraggedTaskId);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const oldStatus = task.status;
    task.status = status;
    if (targetTaskId !== null && targetTaskId !== currentDraggedTaskId) {
      task.position = calculateNewPosition(status, targetTaskId, relativePos);
    } else if (targetTaskId === null) {
      task.position = getNewPositionAtEnd(status);
    }
    renderTasks();
    await saveSingleTask(task);

    // dummy implementation uses createdBy as email when from firebase
    const emailToNotify = task.creatorEmail || (task.createdBy && task.createdBy.includes('@') ? task.createdBy : null);
    if (oldStatus !== status && emailToNotify) {
      notifyExternalCreatorOnStatusChange(task, oldStatus, status, emailToNotify);
    }
  }
  currentDraggedTaskId = null;
}

/**
 * Notifies an external creator via n8n Webhook when their task changes status
 */
function notifyExternalCreatorOnStatusChange(task, oldStatus, newStatus, creatorEmail) {
  const webhookUrl = "https://jan-oliver.app.n8n.cloud/webhook-test/join-status-update";
  
  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      creator: creatorEmail,
      creatorName: task.creatorName || "Externer Benutzer",
      title: task.title,
      oldStatus: oldStatus,
      newStatus: newStatus
    })
  }).catch(err => console.error("Failed to notify external creator:", err));
}

/**
 * Berechnet die neue Position für einen Task am Ende einer Spalte
 */
function getNewPositionAtEnd(status) {
  const columnTasks = tasks.filter(function (t) {
    return t.status === status;
  });
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
 * Berechnet die neue Position zwischen zwei Tasks oder an den Rändern
 */
function calculateNewPosition(status, targetTaskId, relativePos) {
  const columnTasks = tasks
    .filter(function (t) {
      return t.status === status;
    })
    .sort(function (a, b) {
      return (a.position || 0) - (b.position || 0);
    });
  const targetIndex = columnTasks.findIndex(function (t) {
    return t.id === targetTaskId;
  });
  if (targetIndex === -1) return getNewPositionAtEnd(status);
  if (relativePos === "before") {
    const prevTask = columnTasks[targetIndex - 1];
    const targetTask = columnTasks[targetIndex];
    if (!prevTask) return targetTask.position - 1024;
    return (prevTask.position + targetTask.position) / 2;
  } else {
    const targetTask = columnTasks[targetIndex];
    const nextTask = columnTasks[targetIndex + 1];
    if (!nextTask) return targetTask.position + 1024;
    return (targetTask.position + nextTask.position) / 2;
  }
}

/**
 * Behandelt das Drop-Event für einen Task
 * @param {Event} ev - Das Drop-Event
 * @param {string} status - Der neue Status
 */
function drop(ev, status) {
  ev.preventDefault();
  removeHighlight(status + "-list");
  if (currentDraggedTaskId === null && ev.dataTransfer) {
    const data = ev.dataTransfer.getData("text/plain");
    if (data) {
      currentDraggedTaskId = Number(data);
    }
  }
  const targetCard = ev.target.closest(".task-card");
  let targetTaskId = null;
  let relativePos = "after";
  if (targetCard) {
    targetTaskId = getTaskIdFromCard(targetCard);
    const rect = targetCard.getBoundingClientRect();
    if (window.innerWidth <= 780) {
      const midX = rect.left + rect.width / 2;
      if (ev.clientX < midX) relativePos = "before";
    } else {
      const midY = rect.top + rect.height / 2;
      if (ev.clientY < midY) relativePos = "before";
    }
  }
  moveTo(status, targetTaskId, relativePos);
}

/**
 * Speichert alle Tasks in Firestore
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
 * Iteriert über alle Tasks und speichert sie
 */
async function saveAllTasksToFirestore(userId) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskRef = getTaskRefForUser(userId, task.id);
    await window.fbSetDoc(taskRef, task);
  }
}

/**
 * Speichert einen einzelnen Task in Firestore
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
 * Erstellt eine Dokument-Referenz für einen spezifischen Task
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
 * Findet einen Task anhand der ID
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
 * Liest die Task-ID aus dem data-Attribut einer Karte
 * @param {HTMLElement} card - Das Task-Karten-Element
 * @returns {number|null} Die Task-ID oder null
 */
function getTaskIdFromCard(card) {
  const id = card.getAttribute("data-task-id");
  return id ? Number(id) : null;
}
