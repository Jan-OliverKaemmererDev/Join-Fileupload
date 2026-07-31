/**
 * @fileoverview Main logic and initialization for the board view.
 */
let tasks = [];
let currentDraggedTaskId = null;
let isDragging = false;
let touchDragElement = null;
let touchDragClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchDragTaskId = null;

/**
 * Initializes the board and loads tasks and contacts (from addtask.js).
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
 * Sets up the event listener for added tasks.
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
 * Checks whether a user is logged in.
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
 * Clears all board columns.
 */
function clearAllColumns() {
  document.getElementById("triage-list").innerHTML = "";
  document.getElementById("todo-list").innerHTML = "";
  document.getElementById("inprogress-list").innerHTML = "";
  document.getElementById("awaitfeedback-list").innerHTML = "";
  document.getElementById("done-list").innerHTML = "";
}

/**
 * Renders all tasks on the board.
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
 * Renders a single task card.
 * @param {Object} task - The task object.
 * @param {Object} counts - The count object for task statuses.
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
 * Renders empty statit for all empty columns.
 * @param {Object} counts - The count object with task counts per status.
 */
function renderAllEmptyStates(counts) {
  renderEmptyState("triage", counts.triage, "No tasks in Triage");
  renderEmptyState("todo", counts.todo, "No tasks To do");
  renderEmptyState("inprogress", counts.inprogress, "No tasks In progress");
  renderEmptyState("awaitfeedback", counts.awaitfeedback, "No tasks Await feedback");
  renderEmptyState("done", counts.done, "No tasks Done");
}

/**
 * Renders an empty state for a column.
 * @param {string} status - The column status.
 * @param {number} count - The number of tasks in this column.
 * @param {string} message - The message to display.
 */
function renderEmptyState(status, count, message) {
  const list = document.getElementById(status + "-list");
  if (count === 0 && list) {
    list.innerHTML = getNoTasksTemplate(message);
  }
}

/**
 * Starts drag and drop for a task.
 * @param {number} id - The task ID.
 * @param {Event} ev - The drag event.
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
 * Ends drag and drop.
 */
function endDragging() {
  setTimeout(function () {
    isDragging = false;
  }, 0);
}

/**
 * Allows dropping a task.
 * @param {Event} ev - The drag event.
 */
function allowDrop(ev) {
  ev.preventDefault();
}

/**
 * Highlights a drop zone.
 * @param {string} id - The drop zone ID.
 */
function highlight(id) {
  document.getElementById(id).classList.add("drag-over");
}

/**
 * Remove the highlight from a drop zone.
 * @param {string} id - The drop zone ID.
 */
function removeHighlight(id) {
  document.getElementById(id).classList.remove("drag-over");
}

/**
 * Finds the index of a task by ID.
 * @param {number} taskId - The task ID.
 * @returns {number} The task index or -1.
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
 * Move a task to a new status.
 * @param {string} status - The new status.
 * @param {number|null} targetTaskId - The target task ID.
 * @param {string} relativePos - 'before' or 'after'.
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
 * updates the position and status of a task.
 * @param {Object} task - The task.
 * @param {string} status - The new status.
 * @param {number|null} targetTaskId - The target task.
 * @param {string} relativePos - Position relative to the target.
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
 * Checks and sends notifications on status change.
 * @param {Object} task - The task.
 * @param {string} oldStatus - The old status.
 * @param {string} status - The new status.
 */
function checkAndNotifyStatusChange(task, oldStatus, status) {
  const emailToNotify = task.creatorEmail ||
    (task.createdBy && task.createdBy.includes("@") ? task.createdBy : null);
  if (oldStatus !== status && emailToNotify) {
    notifyExternalCreatorOnStatusChange(task, oldStatus, status, emailToNotify);
  }
}

/**
 * Calculate the new position for a task at the end of a column.
 * @param {string} status - The status.
 * @returns {number} The new position.
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
 * Calculate the new position between two tasks.
 * @param {string} status - The status.
 * @param {number} targetTaskId - The target task ID.
 * @param {string} relativePos - 'before' or 'after'.
 * @returns {number} The new position.
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
 * Returns sorted tasks for a specific status.
 * @param {string} status - The status.
 * @returns {Array} Sorted tasks.
 */
function getSortedTasksByStatus(status) {
  return tasks
    .filter(t => t.status === status)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Calculate the position before the target task.
 * @param {Array} columnTasks - The column tasks.
 * @param {number} targetIndex - The target task index.
 * @returns {number} The new position.
 */
function calculatePositionBefore(columnTasks, targetIndex) {
  const prevTask = columnTasks[targetIndex - 1];
  const targetTask = columnTasks[targetIndex];
  if (!prevTask) return targetTask.position - 1024;
  return (prevTask.position + targetTask.position) / 2;
}

/**
 * Calculate the position after the target task.
 * @param {Array} columnTasks - The column tasks.
 * @param {number} targetIndex - The target task index.
 * @returns {number} The new position.
 */
function calculatePositionAfter(columnTasks, targetIndex) {
  const targetTask = columnTasks[targetIndex];
  const nextTask = columnTasks[targetIndex + 1];
  if (!nextTask) return targetTask.position + 1024;
  return (targetTask.position + nextTask.position) / 2;
}

/**
 * Handles the drop event for a task.
 * @param {Event} ev - The drop event.
 * @param {string} status - The new status.
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
 * Retrievit the dragged task ID from the event.
 * @param {Event} ev - The event.
 */
function resolveDraggedTaskId(ev) {
  if (currentDraggedTaskId === null && ev.dataTransfer) {
    const data = ev.dataTransfer.getData("text/plain");
    if (data) currentDraggedTaskId = Number(data);
  }
}

/**
 * Determine the drop target and relative position.
 * @param {Event} ev - The drop event.
 * @param {HTMLElement} targetCard - The targeted card element.
 * @returns {Object} The target task and relative position.
 */
function resolveDropTarget(ev, targetCard) {
  let targetTaskId = null;
  let relativePos = "after";
  if (targetCard) {
    targetTaskId = getTaskIdFromCard(targetCard);
    const rect = targetCard.getBoundingClientRect();
    const isMobile = window.innerWidth <= 780;
    const isBefore = isMobile ? ev.clientX < rect.left + rect.width / 2 : ev.clientY < rect.top + rect.height / 2;
    if (isBefore) relativePos = "before";
  }
  return { targetTaskId, relativePos };
}


/**
 * Finds a task by its ID.
 * @param {number} taskId - The task ID.
 * @returns {Object|null} The task object or null.
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
 * Reads the task ID from the data attribute of a card.
 * @param {HTMLElement} card - The task card element.
 * @returns {number|null} The task ID or null.
 */
function getTaskIdFromCard(card) {
  const id = card.getAttribute("data-task-id");
  return id ? Number(id) : null;
}

