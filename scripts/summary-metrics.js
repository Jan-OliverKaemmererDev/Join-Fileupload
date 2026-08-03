/**
 * @fileoverview Logic for calculating and formatting task metrics on the summary dashboard.
 */

/**
 * Gets a task collection reference
 * @param {string} userId - User ID
 * @returns {Object} Collection reference
 */
function getTaskCollection(userId) {
  return window.fbCollection(window.firebaseDb, "users", userId, "tasks");
}

/**
 * Retrieves a user's tasks from Firestore
 * @param {string} userId - The user's ID
 * @returns {Array} Array with the user's tasks
 */
async function getUserTasks(userId) {
  try {
    const tasksRef = getTaskCollection(userId);
    const snapshot = await window.fbGetDocs(tasksRef);
    const tasks = [];
    snapshot.forEach(doc => tasks.push(doc.data()));
    return tasks;
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
}

/**
 * Calculates task metrics from a task array
 * @param {Array} tasks - Array with tasks
 * @returns {Object} Object with calculated metrics
 */
function calculateTaskMetrics(tasks) {
  const metrics = createInitialMetrics();
  if (!tasks || tasks.length === 0) return metrics;
  let nearestDeadline = null;
  tasks.forEach(task => {
    processTaskStatus(task, metrics);
    countUrgentTasks(task, metrics);
    if (task.status !== "done") nearestDeadline = trackNearestDeadline(task, nearestDeadline);
  });
  metrics.board = tasks.length;
  if (nearestDeadline) metrics.nextDeadline = formatDeadline(nearestDeadline);
  return metrics;
}

/**
 * Creates and returns the initial metrics object with all counters set to zero.
 * @returns {Object} Object containing initial empty metrics.
 */
function createInitialMetrics() {
  return {
    todo: 0,
    done: 0,
    urgent: 0,
    board: 0,
    progress: 0,
    awaiting: 0,
    emails: 0,
    nextDeadline: null,
  };
}

/**
 * Handles incrementing metrics for active tasks
 * @param {string} status - Task status
 * @param {Object} metrics - Metrics object
 */
function handleActiveTaskStatus(status, metrics) {
  if (status === "todo") metrics.todo++;
  else if (status === "done") metrics.done++;
  else if (status === "inprogress") metrics.progress++;
  else if (status === "awaitfeedback") metrics.awaiting++;
}

/**
 * Processes the status of a task and updates the metrics
 * @param {Object} task - The task object
 * @param {Object} metrics - The metrics object
 */
function processTaskStatus(task, metrics) {
  handleActiveTaskStatus(task.status, metrics);
  if (task.status === "triage" && task.createdBy === "extern") {
    metrics.emails++;
  }
}

/**
 * Counts urgent tasks in metrics
 * @param {Object} task - The task object
 * @param {Object} metrics - The metrics object
 */
function countUrgentTasks(task, metrics) {
  if (task.priority === "urgent") {
    metrics.urgent++;
  }
}

/**
 * Tracks the next deadline
 * @param {Object} task - The task object
 * @param {string|null} nearestDeadline - The current next deadline
 * @returns {string|null} The updated next deadline
 */
function trackNearestDeadline(task, nearestDeadline) {
  if (task.dueDate) {
    const taskDate = new Date(task.dueDate);
    if (!nearestDeadline || taskDate < new Date(nearestDeadline)) {
      nearestDeadline = task.dueDate;
    }
  }
  return nearestDeadline;
}

/**
 * Formats a deadline for the ad
 * @param {string} deadline - The deadline as a string
 * @returns {string} The formatted deadline
 */
function formatDeadline(deadline) {
  const date = new Date(deadline);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}
