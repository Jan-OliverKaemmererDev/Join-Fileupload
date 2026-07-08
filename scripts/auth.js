/**
 * Wartet darauf, dass Firebase initialisiert ist
 * @returns {Promise}
 */
function waitForFirebase() {
  return new Promise(function (resolve) {
    if (window.firebaseReady) {
      resolve();
      return;
    }
    window.addEventListener("firebaseReady", function () {
      resolve();
    });
  });
}

/**
 * Erstellt einen Firebase Auth-Benutzer und aktualisiert sein Profil
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} Firebase User-Objekt
 */
async function createFirebaseUser(name, email, password) {
  const userCredential = await window.fbCreateUser(window.firebaseAuth, email, password);
  const user = userCredential.user;
  await window.fbUpdateProfile(user, { displayName: name });
  return user;
}

/**
 * Registriert einen neuen Benutzer über Firebase Authentication
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} Ergebnis-Objekt mit success und message
 */
async function signUpUser(name, email, password) {
  try {
    const user = await createFirebaseUser(name, email, password);
    await initializeUserData(user.uid, name, email);
    return { success: true, message: "Registrierung erfolgreich" };
  } catch (error) {
    console.error("Signup error:", error);
    return handleFirebaseError(error);
  }
}

/**
 * Initialisiert Benutzerprofil, Standardkontakte und Standard-Tasks in einem Batch
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
 * Speichert das Benutzerprofil in Firestore
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
 * Gibt das Daten-Objekt eines Kontakts zurück
 * @param {Object} contact
 * @returns {Object}
 */
function getContactData(contact) {
  return { name: contact.name, email: contact.email, phone: contact.phone, color: contact.color, initials: contact.initials };
}

/**
 * Schreibt einen einzelnen Kontakt in Firestore
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
 * Schreibt die Standard-Kontakte für einen neuen Benutzer in Firestore
 * @param {string} uid
 * @param {Object} batch
 */
async function initDefaultContacts(uid, batch) {
  for (let i = 0; i < DEFAULT_CONTACTS.length; i++) {
    await writeContact(uid, DEFAULT_CONTACTS[i], batch);
  }
}

/**
 * Schreibt einen einzelnen Task in Firestore
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
 * Schreibt die Standard-Tasks für einen neuen Benutzer in Firestore
 * @param {string} uid
 * @param {Object} batch
 */
async function initDefaultTasks(uid, batch) {
  for (let i = 0; i < DEFAULT_TASKS.length; i++) {
    await writeTask(uid, DEFAULT_TASKS[i], batch);
  }
}

/**
 * Verarbeitet den angemeldeten Firebase-Benutzer und erstellt eine Session
 * @param {Object} user - Firebase Auth-Objekt
 * @returns {Object} Session-Benutzer-Objekt
 */
async function processLoginUser(user) {
  const profile = await loadUserProfile(user.uid);
  const userName = resolveUserName(profile, user);
  const userEmail = resolveUserEmail(profile, user);
  if (profile.name === "User" || !profile.email) {
    await initializeUserData(user.uid, userName, userEmail);
  }
  return buildSessionUser(user.uid, userName, userEmail);
}

/**
 * Meldet einen Benutzer über Firebase Authentication an
 * @param {string} email
 * @param {string} password
 * @returns {Object} Ergebnis-Objekt mit success und user
 */
async function loginUser(email, password) {
  try {
    const userCredential = await window.fbSignIn(window.firebaseAuth, email, password);
    const sessionUser = await processLoginUser(userCredential.user);
    storeUserSession(sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    console.error("Login error:", error);
    return handleFirebaseError(error);
  }
}

/**
 * Ermittelt den anzuzeigenden Benutzernamen aus Profil und Auth-Objekt
 * @param {Object} profile
 * @param {Object} authUser
 * @returns {string}
 */
function resolveUserName(profile, authUser) {
  return profile.name !== "User" ? profile.name : authUser.displayName || profile.name;
}

/**
 * Ermittelt die anzuzeigende E-Mail aus Profil und Auth-Objekt
 * @param {Object} profile
 * @param {Object} authUser
 * @returns {string}
 */
function resolveUserEmail(profile, authUser) {
  return profile.email || authUser.email;
}

/**
 * Erstellt ein Session-Benutzer-Objekt
 * @param {string} uid
 * @param {string} name
 * @param {string} email
 * @returns {Object}
 */
function buildSessionUser(uid, name, email) {
  return { id: uid, name: name, email: email, isGuest: false };
}

/**
 * Speichert den angemeldeten Benutzer in der Session
 * @param {Object} sessionUser
 */
function storeUserSession(sessionUser) {
  sessionStorage.setItem("join_current_user", JSON.stringify(sessionUser));
  sessionStorage.setItem("showJoinGreeting", "true");
}

/**
 * Lädt das Benutzerprofil aus Firestore
 * @param {string} uid
 * @returns {Object} Das Benutzerprofil
 */
async function loadUserProfile(uid) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  const docSnap = await window.fbGetDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { name: "User", email: "" };
}

/**
 * Erstellt das Gast-Session-Objekt
 * @param {string} uid
 * @returns {Object}
 */
function buildGuestSession(uid) {
  return { id: uid, name: "Gast", email: "guest@join.com", isGuest: true };
}

/**
 * Meldet einen Gast-Benutzer über Firebase Anonymous Auth an
 * @returns {Object} Ergebnis-Objekt mit success und user
 */
async function guestLoginUser() {
  try {
    const userCredential = await window.fbSignInAnon(window.firebaseAuth);
    const user = userCredential.user;
    const guestSession = buildGuestSession(user.uid);
    await ensureGuestProfile(user.uid);
    storeUserSession(guestSession);
    return { success: true, user: guestSession };
  } catch (error) {
    console.error("Guest login error:", error);
    return handleFirebaseError(error);
  }
}

/**
 * Erstellt ein neues Gast-Profil in Firestore mit Standarddaten
 * @param {string} uid
 */
async function createGuestProfile(uid) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  const batch = window.fbWriteBatch(window.firebaseDb);
  batch.set(userRef, { name: "Gast", email: "guest@join.com", isGuest: true, createdAt: new Date().toISOString() });
  await Promise.all([initDefaultContacts(uid, batch), initDefaultTasks(uid, batch)]);
  await batch.commit();
}

/**
 * Stellt sicher, dass ein Gast-Profil in Firestore existiert
 * @param {string} uid
 */
async function ensureGuestProfile(uid) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  const docSnap = await window.fbGetDoc(userRef);
  if (!docSnap.exists()) {
    await createGuestProfile(uid);
  }
}

/**
 * Ruft den aktuell angemeldeten Benutzer ab
 * @returns {Object|null}
 */
function getCurrentUser() {
  const userJson = sessionStorage.getItem("join_current_user");
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Prüft ob der aktuelle Benutzer ein anonymer Gast ist
 * @param {Object} currentUser
 * @param {Object} firebaseUser
 * @returns {boolean}
 */
function isGuestUser(currentUser, firebaseUser) {
  return currentUser && currentUser.isGuest && firebaseUser && firebaseUser.isAnonymous;
}

/**
 * Meldet den aktuellen Benutzer ab und löscht Gast-Daten falls zutreffend
 */
async function logoutUser() {
  const currentUser = getCurrentUser();
  const firebaseUser = window.firebaseAuth.currentUser;
  if (isGuestUser(currentUser, firebaseUser)) {
    await deleteGuestAccount(currentUser, firebaseUser);
  }
  try {
    await window.fbSignOut(window.firebaseAuth);
  } catch (error) {
    console.error("Logout error:", error);
  }
  clearUserSession();
}

/**
 * Löscht die Daten und den Auth-Account eines Gast-Benutzers
 * @param {Object} currentUser
 * @param {Object} firebaseUser
 */
async function deleteGuestAccount(currentUser, firebaseUser) {
  await deleteUserData(currentUser.id);
  try {
    await firebaseUser.delete();
  } catch (e) {
    console.warn("Could not delete anonymous auth user:", e);
  }
}

/**
 * Entfernt den angemeldeten Benutzer aus der Session
 */
function clearUserSession() {
  sessionStorage.removeItem("join_current_user");
}

/**
 * Löscht alle Dokumente einer Subcollection in einem Batch
 * @param {Object} batch
 * @param {string} uid
 * @param {string} collectionName
 */
async function addCollectionDeletesToBatch(batch, uid, collectionName) {
  const ref = window.fbCollection(window.firebaseDb, "users", uid, collectionName);
  const snap = await window.fbGetDocs(ref);
  snap.forEach((doc) => batch.delete(doc.ref));
}

/**
 * Fügt alle Lösch-Operationen für Benutzer-Collections dem Batch hinzu
 * @param {Object} batch
 * @param {string} uid
 */
async function batchDeleteUserCollections(batch, uid) {
  await addCollectionDeletesToBatch(batch, uid, "tasks");
  await addCollectionDeletesToBatch(batch, uid, "contacts");
  batch.delete(window.fbDoc(window.firebaseDb, "users", uid));
}

/**
 * Löscht alle Daten eines Benutzers aus Firestore
 * @param {string} uid
 */
async function deleteUserData(uid) {
  try {
    const batch = window.fbWriteBatch(window.firebaseDb);
    await batchDeleteUserCollections(batch, uid);
    await batch.commit();
  } catch (error) {
    console.error("Error deleting guest data:", error);
  }
}

/**
 * Prüft ob ein Benutzer angemeldet ist
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Gibt die Fehlerdetails für einen Firebase-Fehlercode zurück
 * @param {string} code
 * @returns {Array|null}
 */
function getFirebaseErrorDetails(code) {
  const errors = {
    "auth/email-already-in-use": ["This email address is already registered", "duplicate-email"],
    "auth/invalid-email": ["Invalid email address", "invalid-email"],
    "auth/weak-password": ["The password is too weak (at least 6 characters)", "weak-password"],
    "auth/user-not-found": ["User not found", "user-not-found"],
    "auth/wrong-password": ["Wrong password", "wrong-password"],
    "auth/invalid-credential": ["Email or password is incorrect", "invalid-credential"],
  };
  return errors[code] || null;
}

/**
 * Erstellt ein Fehler-Ergebnis-Objekt aus einem Firebase-Fehler
 * @param {Object} error
 * @returns {Object}
 */
function handleFirebaseError(error) {
  const details = getFirebaseErrorDetails(error.code);
  if (details) {
    return { success: false, error: details[1], message: details[0] };
  }
  return { success: false, error: error.code || "unknown", message: "An error occurred: " + error.message };
}

/**
 * Erstellt ein Fehler-Ergebnis-Objekt
 * @param {string} error
 * @param {string} message
 * @returns {Object}
 */
function createErrorResult(error, message) {
  return { success: false, error: error, message: message };
}
