/**
 * @fileoverview Logic for initializing default user data (contacts, tasks) upon registration or login.
 */

/**
 * Initializes user profile, default contacts and default tasks in one batch
 * @param {string} uid
 * @param {string} name
 * @param {string} email
 */
async function initializeUserData(uid, name, email) {
  const batch = window.fbWriteBatch(window.firebaseDb);
  await Promise.all([
    saveUserProfile(uid, name, email, batch),
    initDefaultContacts(uid, batch),
    initDefaultTasks(uid, batch),
  ]);
  await batch.commit();
}

/**
 * Saves user profile in Firestore
 * @param {string} uid
 * @param {string} name
 * @param {string} email
 * @param {Object} batch
 */
async function saveUserProfile(uid, name, email, batch) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  const data = {
    name: name,
    email: email,
    isGuest: false,
    createdAt: new Date().toISOString(),
  };
  if (batch) {
    batch.set(userRef, data);
  } else {
    await window.fbSetDoc(userRef, data);
  }
}

/**
 * Returns a contact's data object
 * @param {Object} contact
 * @returns {Object}
 */
function getContactData(contact) {
  return { name: contact.name, email: contact.email, phone: contact.phone, color: contact.color, initials: contact.initials };
}

/**
 * Writes a single contact to Firestore
 * @param {string} uid
 * @param {Object} contact
 * @param {Object} batch
 */
async function writeContact(uid, contact, batch) {
  const contactRef = window.fbDoc(window.firebaseDb, "users", uid, "contacts", String(contact.id));
  const data = getContactData(contact);
  if (batch) {
    batch.set(contactRef, data);
  } else {
    await window.fbSetDoc(contactRef, data);
  }
}

/**
 * Writes the default contacts for a new user in Firestore
 * @param {string} uid
 * @param {Object} batch
 */
async function initDefaultContacts(uid, batch) {
  for (let i = 0; i < DEFAULT_CONTACTS.length; i++) {
    await writeContact(uid, DEFAULT_CONTACTS[i], batch);
  }
}

/**
 * Writes a single task to Firestore
 * @param {string} uid
 * @param {Object} task
 * @param {Object} batch
 */
async function writeTask(uid, task, batch) {
  const taskRef = window.fbDoc(window.firebaseDb, "users", uid, "tasks", String(task.id));
  if (batch) {
    batch.set(taskRef, task);
  } else {
    await window.fbSetDoc(taskRef, task);
  }
}

/**
 * Writes the default tasks for a new user in Firestore
 * @param {string} uid
 * @param {Object} batch
 */
async function initDefaultTasks(uid, batch) {
  for (let i = 0; i < DEFAULT_TASKS.length; i++) {
    await writeTask(uid, DEFAULT_TASKS[i], batch);
  }
}
