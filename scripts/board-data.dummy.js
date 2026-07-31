/**
 * @fileoverview Dummy data for the board view.
 */
/**
 * Normalize subtasks from various Firebase formats into the board format.
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
 * @param {*} raw - Raw data (Array, String or Object)
 * @returns {Array} Array of items
 */
function extractSubtaskItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return parseSubtasksFromString(raw);
  if (typeof raw === "object") return parseSubtasksFromObject(raw);
  return [];
}

/**
 * Parses subtasks from a String (JSON or comma separated).
 * @param {string} raw - the String
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
 * @param {Object} raw - the object
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
 * Normalizes a single subtask item into a standard object.
 * @param {*} st - the Item
 * @returns {Object|null} Normalizedit object or null
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
 * Synchronizes external stakeholder tasks from the Realtime Database.
 * @param {Object} currentUser - the current user
 * @returns {Promise<boolean>} whether new tasks were synchronized
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
 * Retrievit external tasks from the API.
 * @param {string} url - the URL
 * @returns {Promise<Object|null>} the tasks or null
 */
async function fetchExternalTasks(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Processes all external tasks found.
 * @param {Object} currentUser - the current user
 * @param {Object} data - the task data
 * @param {string} token - the Auth token
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
 * @param {Object} currentUser - the user
 * @param {Object} taskData - the data
 * @param {string} key - The task. Key
 * @param {string} token - the token
 */
async function processSingleExternalTask(currentUser, taskData, key, token) {
  const newTask = createExternalTaskObject(taskData);
  await saveSingleTask(newTask);
  tasks.push(newTask);
  await ensureTaskCreatorInContacts(currentUser, newTask.creatorEmail, newTask.creatorName);
  await deleteExternalTask(key, token);
}

/**
 * Create the Task object for an external task.
 * @param {Object} taskData - the data from Firebase
 * @returns {Object} the creates Task object
 */
function createExternalTaskObject(taskData) {
  return {
    ...createExternalTaskBaseInfo(taskData),
    ...createExternalTaskMetaInfo(taskData),
    subtasks: parseSubtasks(taskData.subtasks),
    assignedTo: []
  };
}

/**
 * Creates the base info for external task.
 */
function createExternalTaskBaseInfo(taskData) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: taskData.title || "External Task",
    description: taskData.description || "",
    category: taskData.category || "user-story",
    priority: taskData.priority || "medium",
    dueDate: taskData.deadline || ""
  };
}

/**
 * Creates the meta info for external task.
 */
function createExternalTaskMetaInfo(taskData) {
  return {
    status: taskData.status || "triage",
    position: Date.now(),
    createdAt: new Date().toISOString(),
    createdBy: taskData.creatorType || "extern",
    creatorEmail: taskData.creator || "",
    creatorName: taskData.creatorName || "Externer Benutzer"
  };
}

/**
 * Deletes an external task from the Realtime Database.
 * @param {string} key - the Key
 * @param {string} token - the token
 */
async function deleteExternalTask(key, token) {
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json?auth=${token}`;
  await fetch(url, { method: "DELETE" });
}

/**
 * Ensures that the creator exists in the contacts.
 * @param {Object} currentUser - the user
 * @param {string} email - the email
 * @param {string} name - the name
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
 * Checks whether an email already exists in the contacts.
 * @param {string} userId - the user ID
 * @param {string} email - the email
 * @returns {Promise<boolean>} whether the contact exists
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
 * @param {string} userId - the user ID
 * @param {string} email - the email
 * @param {string} name - the Name
 */
async function createNewExternalContact(userId, email, name) {
  const newContact = buildNewContactObject(email, name);
  const contactRef = window.fbDoc(window.firebaseDb, "users", userId, "contacts", newContact.id);
  await window.fbSetDoc(contactRef, newContact);
}

/**
 * Builds the object for a new contact.
 * @param {string} email - the email
 * @param {string} name - the name
 * @returns {Object} The contact object.
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
 * Generates the initials from a names.
 * @param {string} name - the name
 * @returns {string} The initials.
 */
function generateInitialsForName(name) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
  return initials || "EX";
}

/**
 * Notifies an external creator of a status change.
 * @param {Object} task - The task.
 * @param {string} oldStatus - The old status.
 * @param {string} newStatus - The new status.
 * @param {string} creatorEmail - the email
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
 * @param {Object} task - The task.
 * @param {string} oldStatus - The old status.
 * @param {string} newStatus - The new status.
 * @param {string} creatorEmail - the email
 * @returns {Object} the payload
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

/**
 * Loads the Tasks of the current users from Firestore.
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
 * Resynchronizes external tasks and renders if necessary.
 * @param {Object} currentUser - the user
 */
function syncExternalTasksAndRender(currentUser) {
  syncStakeholderTasks(currentUser).then(function (hasNewTasks) {
    if (hasNewTasks) renderTasks();
  });
}

/**
 * Create the reference to the Tasks Collection.
 * @param {string} userId - the user ID
 * @returns {Object} Firestore reference
 */
function getTasksRef(userId) {
  return window.fbCollection(window.firebaseDb, "users", userId, "tasks");
}

/**
 * Process the snapshot of the tasks.
 * @param {Object} snapshot - The Firestore snapshot.
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
 * Saves all tasks in Firestore.
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
 * Iterates over all tasks and saves them.
 * @param {string} userId - the user ID
 */
async function saveAllTasksToFirestore(userId) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskRef = getTaskRefForUser(userId, task.id);
    await window.fbSetDoc(taskRef, task);
  }
}

/**
 * Saves a single task in Firestore.
 * @param {Object} task - the task object to be saved
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
 * Create a document reference for a specific task.
 * @param {string} userId - the user ID
 * @param {number} taskId - the task ID
 * @returns {Object} Firestore reference
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
