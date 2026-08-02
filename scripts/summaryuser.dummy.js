/**
 * @fileoverview Logic for the user summary dashboard view.
 */
/**
 * Initializes the summary page for logged-in users.
 */
async function initSummaryUser() {
  await waitForFirebase();
  const user = getCurrentUser();
  if (!user) return redirectUnauthenticated();
  
  updateUserName(user);
  updateUserInitials(user);
  updateGreeting();
  await handleTaskMetrics(user);
  checkMobileGreeting();
}

/**
 * Redirects unauthenticated users
 */
function redirectUnauthenticated() {
  window.location.href = "index.html";
}

/**
 * Handles task metrics logic
 */
async function handleTaskMetrics(user) {
  if (typeof updateTaskMetrics === "function") {
    await updateTaskMetrics(user);
  } else if (typeof renderTaskMetrics === "function") {
    renderTaskMetrics();
  }
}

/**
 * updates the username on the page.
 * @param {Object} user - The user object.
 */
function updateUserName(user) {
  const userNameElement = document.getElementById("user-name");
  if (userNameElement) {
    userNameElement.textContent = user.name;
  }
}

/**
 * updates the user initials in the header.
 * @param {Object} user - The user object.
 */
function updateUserInitials(user) {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement || !user) return;
  if (user.profileImageSmall && user.profileImageSmall.base64) {
    if (typeof showHeaderProfileImage === "function") {
      showHeaderProfileImage(user.profileImageSmall.base64);
    }
    return;
  }
  const initials = getInitials(user.name);
  initialsElement.textContent = initials;
}

/**
 * Generates initials from a name
 * @param {string} name - The full name.
 * @returns {string} The generated initials
 */
function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  }
}

/**
 * updates the greeting message based on the time of day
 */
function updateGreeting() {
  const isGuest = getCurrentUser()?.isGuest === true;
  let greeting = getGreetingTime();
  greeting += isGuest ? "!" : ",";
  const el = document.getElementById("greeting-text");
  if (el) el.textContent = greeting;
}

/**
 * Gets the time-based greeting string
 */
function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Logs out the user and redirects to the login page
 */
async function logoutFromSummary() {
  await logoutUser();
  window.location.href = "index.html";
}
/**
 * Initializes the summary page (legacy support)
 */
function initSummary() {
  updateGreeting();
  renderTaskMetrics();
}

/**
 * Renders the task metrics on the page (Fallback or Guest View)
 */
function renderTaskMetrics() {
  const elements = {
    "count-todo": "0", "count-done": "0", "count-urgent": "0",
    "count-board": "0", "count-progress": "0", "count-awaiting": "0",
    "count-emails": "0", "next-deadline": "No upcoming deadline",
  };
  for (const [id, value] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) element.innerText = value;
  }
}

/**
 * Removes the welcome flag from the sessionStorage
 */
function removeMobileGreetingFlag() {
  sessionStorage.removeItem("showJoinGreeting");
}

/**
 * Starts the fade-out animation of the welcome overlay
 * @param {HTMLElement} greetingContainer - The greeting container element
 */
function startGreetingFadeOut(greetingContainer) {
  setTimeout(function () {
    greetingContainer.classList.add("fade-out");
    setTimeout(function () {
      greetingContainer.classList.remove("mobile-greeting-overlay");
      greetingContainer.classList.remove("fade-out");
    }, 500);
  }, 1500);
}

/**
 * Displays the mobile greeting overlay and starts the fade-out animation
 * @param {HTMLElement} greetingContainer - The greeting container element
 */
function showMobileGreetingOverlay(greetingContainer) {
  greetingContainer.classList.add("mobile-greeting-overlay");
  startGreetingFadeOut(greetingContainer);
}

/**
 * Checks whether the mobile greeting animation should be displayed. The sessionStorage flag is removed after the first call to prevent displaying it again on reload.
 */
function checkMobileGreeting() {
  const showGreeting = sessionStorage.getItem("showJoinGreeting");
  if (showGreeting !== "true") return;
  removeMobileGreetingFlag();
  if (window.innerWidth <= 780) {
    const greetingContainer = document.querySelector(".greeting-container");
    if (greetingContainer) {
      showMobileGreetingOverlay(greetingContainer);
    }
  }
}

/**
 * Redirects the user to the board page with a short animation
 * @param {Event} event - The click event.
 */
function redirectToBoard(event) {
  const card = event.currentTarget;
  card.classList.add("card-clicked");
  setTimeout(function () {
    window.location.href = "board.html";
  }, 120);
}

/**
 * Updates task metrics on the summary page
 * @param {Object} user - The user object
 */
async function updateTaskMetrics(user) {
  await syncExternalTasksToFirestore(user);
  const userTasks = await getUserTasks(user.id);
  const metrics = calculateTaskMetrics(userTasks);
  displayTaskMetrics(metrics);
}

/**
 * Displays the calculated task metrics in the summary page
 * @param {Object} metrics - The metrics object
 */
function displayTaskMetrics(metrics) {
  const todo = document.getElementById("count-todo");
  if (todo) todo.textContent = metrics.todo;
  const done = document.getElementById("count-done");
  if (done) done.textContent = metrics.done;
  const urgent = document.getElementById("count-urgent");
  if (urgent) urgent.textContent = metrics.urgent;
  const board = document.getElementById("count-board");
  if (board) board.textContent = metrics.board;
  const progress = document.getElementById("count-progress");
  if (progress) progress.textContent = metrics.progress;
  const awaiting = document.getElementById("count-awaiting");
  if (awaiting) awaiting.textContent = metrics.awaiting;
  const emailsElement = document.getElementById("count-emails");
  if (emailsElement) {
    emailsElement.textContent = metrics.emails || 0;
  }
  const deadlineElement = document.getElementById("next-deadline");
  if (deadlineElement) {
    if (metrics.nextDeadline) {
      deadlineElement.textContent = metrics.nextDeadline;
    } else {
      deadlineElement.textContent = "No upcoming deadline";
    }
  }
}

/**
 * Syncs external tasks from RTDB to Firestore so the summary reflects them immediately.
 * @param {Object} user - The current user object
 */
async function syncExternalTasksToFirestore(user) {
  const token = "DEIN_FIREBASE_TOKEN_HIER_EINTRAGEN";
  const url = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks.json?auth=${token}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data) return false;
    let hasNewTasks = false;
    for (const key in data) {
      await processExternalTask(user, key, data[key], token);
      hasNewTasks = true;
    }
    return hasNewTasks;
  } catch (err) {
    console.error("Error syncing external tasks:", err);
    return false;
  }
}

/**
 * Processes a single external task
 */
async function processExternalTask(user, key, taskData, token) {
  const newTask = createExternalTaskObject(taskData);
  const taskRef = window.fbDoc(window.firebaseDb, "users", user.id, "tasks", String(newTask.id));
  await window.fbSetDoc(taskRef, newTask);
  await ensureContactExistsFromSummary(user, newTask.creatorEmail, newTask.creatorName);
  const delUrl = `https://join-4e7df-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json?auth=${token}`;
  await fetch(delUrl, { method: "DELETE" });
}

/**
 * Creates a task object for the external task
 */
function createExternalTaskObject(taskData) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: taskData.title || "External Task", description: taskData.description || "",
    category: taskData.category || "user-story", priority: taskData.priority || "medium",
    dueDate: taskData.deadline || "", assignedTo: [],
    subtasks: parseSubtasks(taskData.subtasks), status: taskData.status || "triage",
    position: Date.now(), createdAt: new Date().toISOString(),
    createdBy: taskData.creatorType || "extern", creatorEmail: taskData.creator || "",
    creatorName: taskData.creatorName || "Externer Benutzer"
  };
}

/**
 * Normalizes subtasks from various Firebase formats to board format
 * @param {*} raw - The raw subtask data from Firebase
 * @returns {Array} Array of {text, completed} objects
 */
function parseSubtasks(raw) {
  if (!raw) return [];
  const items = extractSubtaskItems(raw);
  return items.map(formatSingleSubtask).filter(Boolean);
}

/**
 * Extracts subtask items from raw data
 */
function extractSubtaskItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return parseStringSubtasks(raw);
  if (typeof raw === "object") return Object.values(raw);
  return [];
}

/**
 * Parses subtasks from string
 */
function parseStringSubtasks(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Formats a single subtask
 */
function formatSingleSubtask(st) {
  if (typeof st === "string") {
    return { id: Date.now() + Math.floor(Math.random() * 1000), text: st, completed: false };
  }
  if (st && typeof st === "object" && st.text) {
    return { id: st.id || (Date.now() + Math.floor(Math.random() * 1000)), text: st.text, completed: !!st.completed };
  }
  return null;
}

/**
 * Ensures the creator of the external task is added to contacts.
 * @param {Object} user - The current user object
 * @param {string} email - Creator's email
 * @param {string} name - Creator's name
 */
async function ensureContactExistsFromSummary(user, email, name) {
  if (!email) return;
  try {
    const exists = await checkContactExists(user, email);
    if (!exists) {
      const newContact = createExternalContactObject(email, name);
      const contactRef = window.fbDoc(window.firebaseDb, "users", user.id, "contacts", newContact.id);
      await window.fbSetDoc(contactRef, newContact);
    }
  } catch (error) {
    console.error("Error ensuring contact exists:", error);
  }
}

/**
 * Checks if a contact already exists
 */
async function checkContactExists(user, email) {
  const contactsRef = window.fbCollection(window.firebaseDb, "users", user.id, "contacts");
  const snapshot = await window.fbGetDocs(contactsRef);
  let exists = false;
  snapshot.forEach(doc => { if (doc.data().email === email) exists = true; });
  return exists;
}

/**
 * Creates a contact object for external users
 */
function createExternalContactObject(email, name) {
  const colors = ["#AB47BC", "#FF9800", "#5C6BC0", "#26A69A"];
  const randomColor = colors[Math.floor(Math.random() * 4)];
  const displayName = name || "Externer Benutzer";
  const initials = displayName.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().substring(0, 2);
  return {
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    name: displayName, email: email, phone: "",
    color: randomColor, initials: initials || "EX"
  };
}



/**
 * Initializes the summary page for guests.
 */
async function initSummaryGuest() {
  updateGreeting();
  if (typeof updateTaskMetrics === "function") {
    await updateTaskMetrics({ id: "guest", isGuest: true });
  } else {
    renderTaskMetrics();
  }
}

