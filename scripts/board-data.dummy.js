/**
 * Normalisiert Subtasks aus verschiedenen Firebase-Formaten in das Board-Format.
 * @param {*} raw - Die rohen Subtask-Daten aus Firebase
 * @returns {Array} Array von {text, completed} Objekten
 */
function parseSubtasks(raw) {
  if (!raw) return [];
  let items = extractSubtaskItems(raw);
  return items.map(normalizeSubtaskItem).filter(Boolean);
}

/**
 * Extrahiert rohe Subtask-EintrÃ¤ge in ein Array.
 * @param {*} raw - Rohdaten (Array, String oder Object)
 * @returns {Array} Array von Items
 */
function extractSubtaskItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return parseSubtasksFromString(raw);
  if (typeof raw === "object") return parseSubtasksFromObject(raw);
  return [];
}

/**
 * Parst Subtasks aus einem String (JSON oder kommagetrennt).
 * @param {string} raw - Der String
 * @returns {Array} Extrahierte Items
 */
function parseSubtasksFromString(raw) {
  try {
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Parst Subtasks aus einem Objekt.
 * @param {Object} raw - Das Objekt
 * @returns {Array} Extrahierte Items
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
 * Normalisiert ein einzelnes Subtask-Item in ein Standardobjekt.
 * @param {*} st - Das Item
 * @returns {Object|null} Normalisiertes Objekt oder null
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
 * Synchronisiert externe Stakeholder-Tasks aus der Realtime Database.
 * @param {Object} currentUser - Der aktuelle Benutzer
 * @returns {Promise<boolean>} Ob neue Tasks synchronisiert wurden
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
 * Holt externe Tasks von der API.
 * @param {string} url - Die URL
 * @returns {Promise<Object|null>} Die Tasks oder null
 */
async function fetchExternalTasks(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Verarbeitet alle gefundenen externen Tasks.
 * @param {Object} currentUser - Der aktuelle Benutzer
 * @param {Object} data - Die Task-Daten
 * @param {string} token - Das Auth-Token
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
 * Verarbeitet einen einzelnen externen Task.
 * @param {Object} currentUser - Der Benutzer
 * @param {Object} taskData - Die Daten
 * @param {string} key - Der Task-Key
 * @param {string} token - Das Token
 */
async function processSingleExternalTask(currentUser, taskData, key, token) {
  const newTask = createExternalTaskObject(taskData);
  await saveSingleTask(newTask);
  tasks.push(newTask);
  await ensureTaskCreatorInContacts(currentUser, newTask.creatorEmail, newTask.creatorName);
  await deleteExternalTask(key, token);
}

/**
 * Erstellt das Task-Objekt fÃ¼r einen externen Task.
 * @param {Object} taskData - Die Daten von Firebase
 * @returns {Object} Das erstellte Task-Objekt
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
 * LÃ¶scht einen externen Task aus der Realtime Database.
 * @param {string} key - Der Key
 * @param {string} token - Das Token
 */
async function deleteExternalTask(key, token) {
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json?auth=${token}`;
  await fetch(url, { method: "DELETE" });
}

/**
 * Stellt sicher, dass der Ersteller in den Kontakten existiert.
 * @param {Object} currentUser - Der Benutzer
 * @param {string} email - Die E-Mail
 * @param {string} name - Der Name
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
 * PrÃ¼ft, ob eine E-Mail bereits in den Kontakten existiert.
 * @param {string} userId - Die Benutzer-ID
 * @param {string} email - Die E-Mail
 * @returns {Promise<boolean>} Ob der Kontakt existiert
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
 * Erstellt einen neuen externen Kontakt.
 * @param {string} userId - Die Benutzer-ID
 * @param {string} email - Die E-Mail
 * @param {string} name - Der Name
 */
async function createNewExternalContact(userId, email, name) {
  const newContact = buildNewContactObject(email, name);
  const contactRef = window.fbDoc(window.firebaseDb, "users", userId, "contacts", newContact.id);
  await window.fbSetDoc(contactRef, newContact);
}

/**
 * Baut das Objekt fÃ¼r einen neuen Kontakt.
 * @param {string} email - Die E-Mail
 * @param {string} name - Der Name
 * @returns {Object} Das Kontakt-Objekt
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
 * Generiert die Initialen aus einem Namen.
 * @param {string} name - Der Name
 * @returns {string} Die Initialen
 */
function generateInitialsForName(name) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
  return initials || "EX";
}

/**
 * Benachrichtigt einen externen Ersteller Ã¼ber einen Statuswechsel.
 * @param {Object} task - Der Task
 * @param {string} oldStatus - Alter Status
 * @param {string} newStatus - Neuer Status
 * @param {string} creatorEmail - Die E-Mail
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
 * Baut das Payload fÃ¼r den Webhook.
 * @param {Object} task - Der Task
 * @param {string} oldStatus - Alter Status
 * @param {string} newStatus - Neuer Status
 * @param {string} creatorEmail - Die E-Mail
 * @returns {Object} Das Payload
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


