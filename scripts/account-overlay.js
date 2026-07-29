/**
 * @fileoverview Logic for the account overlay UI.
 */
/**
 * Closes the user dropdown menu.
 */
function closeUserDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.remove("active");
}

/**
 * Ensures that the account overlay DOM exists.
 * @returns {HTMLElement} The account overlay element.
 */
function ensureAccountOverlayExists() {
  let overlay = document.getElementById("account-overlay");
  if (!overlay) {
    createAccountOverlay();
    overlay = document.getElementById("account-overlay");
  }
  return overlay;
}

/**
 * Opens the account overlay and displays user data.
 */
function openAccountOverlay() {
  closeUserDropdown();
  const overlay = ensureAccountOverlayExists();
  populateAccountData();
  setAccountViewMode();
  overlay.classList.add("active");
  setTimeout(() => {
    document.getElementById("account-dialog").classList.add("active");
  }, 10);
}

/**
 * Closes account overlay with slide-out animation.
 */
function closeAccountOverlay() {
  const overlay = document.getElementById("account-overlay");
  if (!overlay) return;
  overlay.querySelectorAll(".slide-in-dialog").forEach(d => d.classList.remove("active"));
  if (typeof cancelPendingProfileImage === "function") cancelPendingProfileImage();
  setTimeout(() => {
    overlay.classList.remove("active");
    setAccountViewMode();
  }, 400);
}

/**
 * Creates the account overlay DOM and inserts it into the body.
 */
function createAccountOverlay() {
  const html = getAccountOverlayTemplate();
  document.body.insertAdjacentHTML("beforeend", html);
}

/**
 * Reads the current user from the session.
 * @returns {Object|null} The user object or null.
 */
function getAccountUserData() {
  if (typeof getCurrentUser === "function") return getCurrentUser();
  return null;
}

/**
 * Populates the account overlay with current user data.
 */
function populateAccountData() {
  const currentUser = getAccountUserData();
  const name = currentUser?.name || "Guest";
  document.getElementById("account-name").value = name;
  document.getElementById("account-email").value = currentUser?.email || "";
  document.getElementById("account-phone").value = currentUser?.phone || "";
  updateAccountInitials(name);
  loadAccountProfileImage(currentUser);
}

/**
 * Updated the initials in the avatar circle.
 * @param {string} name - The username.
 */
function updateAccountInitials(name) {
  const el = document.getElementById("account-initials");
  if (!el) return;
  const img = document.getElementById("account-profile-img");
  if (img) img.style.display = "none";
  const initials = typeof getInitialsFromName === "function" ? getInitialsFromName(name) : name.substring(0, 1).toUpperCase();
  setAccountInitialsText(el, initials);
}

/**
 * Sets the initials text in the avatar element.
 * @param {HTMLElement} el - The avatar element.
 * @param {string} text - The initials text.
 */
function setAccountInitialsText(el, text) {
  let textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = text;
  } else {
    el.insertBefore(document.createTextNode(text), el.firstChild);
  }
}

/**
 * Loads and displays profile picture in account overlay.
 * @param {Object} currentUser - The current User object.
 */
function loadAccountProfileImage(currentUser) {
  if (!currentUser || !currentUser.profileImage) return;
  const base64 = currentUser.profileImage.base64;
  if (!base64) return;
  if (typeof showAccountProfileImage === "function") showAccountProfileImage(base64);
}

/**
 * Sets the form fields to readonly.
 */
function setAccountFieldsReadonly() {
  document.getElementById("account-name").readOnly = true;
  document.getElementById("account-email").readOnly = true;
  document.getElementById("account-phone").readOnly = true;
}

/**
 * Sets the form fields to editable.
 */
function setAccountFieldsEditable() {
  document.getElementById("account-name").readOnly = false;
  document.getElementById("account-email").readOnly = false;
  document.getElementById("account-phone").readOnly = false;
}

/**
 * Sets the account overlay to view mode (readonly).
 */
function setAccountViewMode() {
  resetAccountViewUI();
  if (typeof cancelPendingProfileImage === "function") cancelPendingProfileImage();
  loadCurrentUserProfile();
  setupEditAccountButton();
}

/**
 * Resets the UI elements for view mode.
 */
function resetAccountViewUI() {
  document.getElementById("account-dialog-title").textContent = "My account";
  setAccountFieldsReadonly();
  document.getElementById("account-camera-badge").style.display = "none";
  if (typeof clearAccountFormErrors === "function") clearAccountFormErrors();
}

/**
 * Loads the current user's profile information.
 */
function loadCurrentUserProfile() {
  const currentUser = getAccountUserData();
  if (currentUser) {
    if (typeof updateAccountInitials === "function") updateAccountInitials(currentUser.name);
    loadAccountProfileImage(currentUser);
  }
}

/**
 * Configures the view mode button.
 */
function setupEditAccountButton() {
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = "Edit";
  actionBtn.onclick = toggleEditAccount;
}

/**
 * Switches the account overlay to edit mode.
 */
function toggleEditAccount() {
  document.getElementById("account-dialog-title").textContent = "Edit account";
  setAccountFieldsEditable();
  document.getElementById("account-camera-badge").style.display = "flex";
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = `Save <img src="./assets/icons/check-icon.png" alt="Save" class="check-icon-white">`;
  actionBtn.onclick = saveAccountChanges;
  if (typeof initFileUpload === "function") initFileUpload();
  attachAccountBlurValidators();
}

/**
 * Saves account changes in Firebase and updates the session.
 */
async function saveAccountChanges() {
  let currentUser = getAccountUserData();
  if (!currentUser) return setAccountViewMode();
  currentUser = await handleProfileImageUpload(currentUser);
  await handleAccountDataSave(currentUser);
}

/**
 * Processes the upload of a new profile picture.
 * @param {Object} currentUser - The current User object.
 * @returns {Promise<Object>} The updated User object.
 */
async function handleProfileImageUpload(currentUser) {
  try {
    if (typeof hasPendingProfileImage === "function" && hasPendingProfileImage()) {
      await processPendingProfileImage();
      return getAccountUserData();
    }
  } catch (error) {
    console.error("Fehler beim Profilbild Upload:", error);
    alert("Das Profilbild konnte nicht gespeichert werden.");
  }
  return currentUser;
}

/**
 * Saves the form data and updates the UI.
 * @param {Object} currentUser - The current User object.
 */
async function handleAccountDataSave(currentUser) {
  const data = getAccountInputData();
  try {
    await updateFirebaseAccount(currentUser.id, data);
    updateLocalAccountSession(currentUser, data);
    const updatedUser = getAccountUserData();
    updateAccountUI(updatedUser);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
  }
}

/**
 * Reads the input data from the account overlay.
 * @returns {Object} The form data as an object.
 */
function getAccountInputData() {
  return {
    name: document.getElementById("account-name").value.trim(),
    email: document.getElementById("account-email").value.trim(),
    phone: document.getElementById("account-phone").value.trim()
  };
}

/**
 * Updates the user document in Firebase.
 * @param {string} uid - The user ID.
 * @param {Object} data - The data to store.
 */
async function updateFirebaseAccount(uid, data) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  await window.fbUpdateDoc(userRef, data);
}

/**
 * Updates local session data.
 * @param {Object} user - The user object.
 * @param {Object} data - The new data.
 */
function updateLocalAccountSession(user, data) {
  user.name = data.name;
  user.email = data.email;
  user.phone = data.phone;
  sessionStorage.setItem("join_current_user", JSON.stringify(user));
}

/**
 * Updates UI after saving account details.
 * @param {Object} user - The current User object.
 */
function updateAccountUI(user) {
  if (typeof updateHeaderInitials === "function") updateHeaderInitials(user);
  if (typeof updateUserName === "function") updateUserName(user);
  updateAccountInitials(user.name);
  loadAccountProfileImage(user);
  if (user.profileImageSmall && typeof showHeaderProfileImage === "function") {
    showHeaderProfileImage(user.profileImageSmall.base64);
  }
  setAccountViewMode();
}

/**
 * Displays the account deletion confirmation overlay.
 */
function showDeleteConfirmOverlay() {
  const accountDialog = document.getElementById("account-dialog");
  if (accountDialog) accountDialog.classList.remove("active");
  setTimeout(() => {
    const confirmDialog = document.getElementById("delete-confirm-dialog");
    if (confirmDialog) confirmDialog.classList.add("active");
  }, 400);
}

/**
 * Closes the confirmation overlay and shows the account dialog again.
 */
function closeDeleteConfirmOverlay() {
  const confirmDialog = document.getElementById("delete-confirm-dialog");
  if (confirmDialog) confirmDialog.classList.remove("active");
  setTimeout(() => {
    const accountDialog = document.getElementById("account-dialog");
    if (accountDialog) accountDialog.classList.add("active");
  }, 400);
}

/**
 * Deletes the user's entire account and logs him out.
 */
async function confirmDeleteAccount() {
  const currentUser = getAccountUserData();
  const firebaseUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  if (currentUser && firebaseUser && !currentUser.isGuest) {
    await deleteUserAndData(currentUser, firebaseUser);
  }
}

/**
 * Executes the deletion of the data and the auth account.
 * @param {Object} currentUser - The current User object.
 * @param {Object} firebaseUser - The Firebase Auth User.
 */
async function deleteUserAndData(currentUser, firebaseUser) {
  try {
    if (typeof deleteUserData === "function") await deleteUserData(currentUser.id);
    await firebaseUser.delete();
    if (typeof clearUserSession === "function") clearUserSession();
    else sessionStorage.removeItem("join_current_user");
    window.location.href = "index.html";
  } catch (error) {
    handleDeleteError(error);
  }
}

/**
 * Handles account deletion errors.
 * @param {Error} error - The error object that occurred.
 */
async function handleDeleteError(error) {
  console.error("Fehler beim Löschen des Accounts:", error);
  if (typeof logoutUser === "function") {
    await logoutUser();
    window.location.href = "index.html";
  }
}
