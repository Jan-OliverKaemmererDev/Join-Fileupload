/**
 * @fileoverview Authentication logic for user login and sessions.
 */
/**
 * Waiting for Firebase to initialize
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
 * Creates a Firebase Auth user and updates their profile
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} Firebase User object
 */
async function createFirebaseUser(name, email, password) {
  const userCredential = await window.fbCreateUser(window.firebaseAuth, email, password);
  const user = userCredential.user;
  await window.fbUpdateProfile(user, { displayName: name });
  return user;
}

/**
 * Registers a new user via Firebase Authentication
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} Result object with success and message
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

/**
 * Processes the logged in Firebase user and creates a session
 * @param {Object} user - Firebase Auth object
 * @returns {Object} Session user object
 */
async function processLoginUser(user) {
  const profile = await loadUserProfile(user.uid);
  const userName = resolveUserName(profile, user);
  const userEmail = resolveUserEmail(profile, user);
  if (profile.name === "User" || !profile.email) {
    await initializeUserData(user.uid, userName, userEmail);
  }
  return buildSessionUser(user.uid, userName, userEmail, profile.phone, profile.profileImage, profile.profileImageSmall);
}

/**
 * Signs in a user via Firebase Authentication
 * @param {string} email
 * @param {string} password
 * @returns {Object} Result object with success and user
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
 * Determines the username to display from the profile and auth object
 * @param {Object} profile
 * @param {Object} authUser
 * @returns {string}
 */
function resolveUserName(profile, authUser) {
  return profile.name !== "User" ? profile.name : authUser.displayName || profile.name;
}

/**
 * Determines the email to be displayed from the profile and auth object
 * @param {Object} profile
 * @param {Object} authUser
 * @returns {string}
 */
function resolveUserEmail(profile, authUser) {
  return profile.email || authUser.email;
}

/**
 * Creates a session user object
 * @param {string} uid
 * @param {string} name
 * @param {string} email
 * @returns {Object}
 */
function buildSessionUser(uid, name, email, phone = "", profileImage, profileImageSmall) {
  const user = { id: uid, name: name, email: email, phone: phone, isGuest: false };
  if (profileImage) user.profileImage = profileImage;
  if (profileImageSmall) user.profileImageSmall = profileImageSmall;
  return user;
}

/**
 * Saves the logged in user in the session
 * @param {Object} sessionUser
 */
function storeUserSession(sessionUser) {
  sessionStorage.setItem("join_current_user", JSON.stringify(sessionUser));
  sessionStorage.setItem("showJoinGreeting", "true");
}

/**
 * Loads the user profile from Firestore
 * @param {string} uid
 * @returns {Object} The user profile
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
 * Creates the guest session object
 * @param {string} uid
 * @returns {Object}
 */
function buildGuestSession(uid) {
  return { id: uid, name: "Gast", email: "guest@join.com", phone: "", isGuest: true };
}

/**
 * Logs in a guest user via Firebase Anonymous Auth
 * @returns {Object} Result object with success and user
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
 * Creates a new guest profile in Firestore with default details
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
 * Ensures a guest profile exists in Firestore
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
 * Gets the currently logged in user
 * @returns {Object|null}
 */
function getCurrentUser() {
  const userJson = sessionStorage.getItem("join_current_user");
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Checks whether the current user is an anonymous guest
 * @param {Object} currentUser
 * @param {Object} firebaseUser
 * @returns {boolean}
 */
function isGuestUser(currentUser, firebaseUser) {
  return currentUser && currentUser.isGuest && firebaseUser && firebaseUser.isAnonymous;
}

/**
 * Logs out the current user and deletes guest data if applicable
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
 * Deletes a guest user's data and auth account
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
 * Removes the logged in user from the session
 */
function clearUserSession() {
  sessionStorage.removeItem("join_current_user");
}

/**
 * Deletes all documents in a subcollection in one batch
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
 * Adds all user collection delete operations to the batch
 * @param {Object} batch
 * @param {string} uid
 */
async function batchDeleteUserCollections(batch, uid) {
  await addCollectionDeletesToBatch(batch, uid, "tasks");
  await addCollectionDeletesToBatch(batch, uid, "contacts");
  batch.delete(window.fbDoc(window.firebaseDb, "users", uid));
}

/**
 * Deletes all a user's data from Firestore
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
 * Checks whether a user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Returns the error details for a Firebase error code
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
 * Creates an error result object from a Firebase error
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
 * Creates an error result object
 * @param {string} error
 * @param {string} message
 * @returns {Object}
 */
function createErrorResult(error, message) {
  return { success: false, error: error, message: message };
}
