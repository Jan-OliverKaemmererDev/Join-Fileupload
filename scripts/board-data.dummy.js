/**
 * @fileooverview Dummy data for the board view.
 */
/**
 * Normalizes subtasks from various Firebase formats to board format.
 * @param {*} raw - The raw subtask data from Firebase
 * @returns {Array} Array of {text, completed} objects
 */
function parseSubtasks(raw) {
  if (!raw) return [];
  let items = extractSubtaskItems(raw);
  return items.map(normalizeSubtaskItem).filter(Boolean);
}

/**
 * Extracts raw subtask entries into an array.
 * @param {*} raw - raw data (array, string or object)
 * @returns {Array} Array of items
 */
function extractSubtaskItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return parseSubtasksFromString(raw);
  if (typeof raw === "object") return parseSubtasksFromObject(raw);
  return [];
}

/**
 * Parses subtasks from a string (JSON or comma separated).
 * @param {string} raw - The string
 * @returns {Array} Extracted items
 */
function parseSubtasksFromString(raw) {
  try {
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Parses subtasks from an object.
 * @param {Object} raw - The object
 * @returns {Array} Extracted items
 */
function parseSubtasksFromObject(raw) {
  let items = [];
  let keys = Object.keys(raw);
  for (let i = 0; i < keys.length; i++) {
    items.push(raw[keys[i]]);
  }
  return items;
}

/**
 * Normalizes a single subtask item to a standard object.
 * @param {*} st - The item
 * @returns {Object|null} Normalized object or null
 */
function normalizeSubtaskItem(st) {
  if (typeof st === "string") {
    return { id: Date.now() + Math.floor(Math.random() * 1000), text: st, completed: false };
  }
  if (st && typeof st === "object" && st.text) {
    return { id: st.id || (Date.now() + Math.floor(Math.random() * 1000)), text: st.text, completed: !!st.completed };
  }
  return null;
}

/**
 * Synchronizes external stakeholder tasks from the real-time database.
 * @param {Object} currentUser - The current user
 * @returns {Promise<boolean>} Whether new tasks have been synchronized
 */
async function syncStakeholderTasks(currentUser) {
  if (currentUser.email !== "jowsds@gmail.com") return false;
  const token = "YOUR_FIREBASE_AUTH_TOKEN";
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks.json?auth=${token}`;
  try {
    const data = await fetchExternalTasks(url);
    if (!data) return false;
    return await processAllExternalTasks(currentUser, data, token);
  } catch (err) {
    console.error("Error syncing external tasks:", err);
    return false;
  }
}

/**
 * Gets external tasks from the API.
 * @param {string} url - The URL
 * @returns {Promise<Object|null>} The tasks or null
 */
async function fetchExternalTasks(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Processes all external tasks found.
 * @param {Object} currentUser - The current user
 * @param {Object} data - The task data
 * @param {string} token - The auth token
 * @returns {Promise<boolean>}
 */
async function processAllExternalTasks(currentUser, data, token) {
  let hasNewTasks = false;
  for (const key in data) {
    await processSingleExternalTask(currentUser, data[key], key, token);
    hasNewTasks = true;
  }
  return hasNewTasks;
}

/**
 * Processes a single external task.
 * @param {Object} currentUser - The user
 * @param {Object} taskData - The data
 * @param {string} key - The task key
 * @param {string} token - The token
 */
async function processSingleExternalTask(currentUser, taskData, key, token) {
  const newTask = createExternalTaskObject(taskData);
  await saveSingleTask(newTask);
  tasks.push(newTask);
  await ensureTaskCreatorInContacts(currentUser, newTask.creatorEmail, newTask.creatorName);
  await deleteExternalTask(key, token);
}

/**
 * Creates the Task object for an external task.
 * @param {Object} taskData - The data from Firebase
 * @returns {Object} The created task object
 */
function createExternalTaskObject(taskData) {
  return {
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
    createdBy: taskData.creatorType || "extern",
    creatorEmail: taskData.creator || "",
    creatorName: taskData.creatorName || "Externer Benutzer",
  };
}

/**
 * Deletes an external task from the Realtime Database.
 * @param {string} key - The key
 * @param {string} token - The token
 */
async function deleteExternalTask(key, token) {
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json?auth=${token}`;
  await fetch(url, { method: "DELETE" });
}

/**
 * Ensures the creator exists in contacts.
 * @param {Object} currentUser - The user
 * @param {string} email - The email
 * @param {string} name - The name
 */
async function ensureTaskCreatorInContacts(currentUser, email, name) {
  if (!email) return;
  try {
    const exists = await checkIfContactExists(currentUser.id, email);
    if (!exists) {
      await createNewExternalContact(currentUser.id, email, name);
    }
  } catch (error) {
    console.error("Error ensuring task creator in contacts:", error);
  }
}

/**
 * Checks whether an email already exists in contacts.
 * @param {string} userId - The user ID
 * @param {string} email - The email
 * @returns {Promise<boolean>} Whether the contact exists
 */
async function checkIfContactExists(userId, email) {
  const contactsRef = window.fbCollection(window.firebaseDb, "users", userId, "contacts");
  const snapshot = await window.fbGetDocs(contactsRef);
  let exists = false;
  snapshot.forEach((doc) => {
    if (doc.data().email === email) exists = true;
  });
  return exists;
}

/**
 * Creates a new external contact.
 * @param {string} userId - The user ID
 * @param {string} email - The email
 * @param {string} name - The name
 */
async function createNewExternalContact(userId, email, name) {
  const newContact = buildNewContactObject(email, name);
  const contactRef = window.fbDoc(window.firebaseDb, "users", userId, "contacts", newContact.id);
  await window.fbSetDoc(contactRef, newContact);
}

/**
 * Builds the object for a new contact.
 * @param {string} email - The email
 * @param {string} name - The name
 * @returns {Object} The contact object
 */
function buildNewContactObject(email, name) {
  const colors = ["#AB47BC", "#FF9800", "#5C6BC0", "#26A69A"];
  const randomColor = colors[Math.floor(Math.random() * 4)];
  const displayName = name || "Externer Benutzer";
  return {
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    name: displayName,
    email: email,
    phone: "",
    color: randomColor,
    initials: generateInitialsForName(displayName),
  };
}

/**
 * Generates the initials from a name.
 * @param {string} name - The name
 * @returns {string} The initials
 */
function generateInitialsForName(name) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
  return initials || "EX";
}

/**
 * Notifies an external creator of a status change.
 * @param {Object} task - The task
 * @param {string} oldStatus - Old status
 * @param {string} newStatus - New status
 * @param {string} creatorEmail - The email
 */
function notifyExternalCreatorOnStatusChange(task, oldStatus, newStatus, creatorEmail) {
  const webhookUrl = "https://jan-oliver91.app.n8n.cloud/webhook-test/join-status-update";
  const payload = buildWebhookPayload(task, oldStatus, newStatus, creatorEmail);
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => console.error("Failed to notify external creator:", err));
}

/**
 * Builds the payload for the webhook.
 * @param {Object} task - The task
 * @param {string} oldStatus - Old status
 * @param {string} newStatus - New status
 * @param {string} creatorEmail - The email
 * @returns {Object} The payload
 */
function buildWebhookPayload(task, oldStatus, newStatus, creatorEmail) {
  return {
    creator: creatorEmail,
    creatorName: task.creatorName || "Externer Benutzer",
    title: task.title,
    oldStatus: oldStatus,
    newStatus: newStatus,
  };
}


