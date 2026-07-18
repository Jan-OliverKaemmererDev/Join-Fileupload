/**
 * Schließt das User-Dropdown-Menü.
 */
function closeUserDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.remove("active");
}

/**
 * Stellt sicher, dass das Account-Overlay-DOM existiert.
 * @returns {HTMLElement} Das Account-Overlay-Element.
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
 * Öffnet das Account-Overlay und zeigt die Benutzerdaten an.
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
 * Schließt das Account-Overlay mit Slide-Out-Animation.
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
 * Erstellt das Account-Overlay-DOM und fügt es in den Body ein.
 */
function createAccountOverlay() {
  const html = getAccountOverlayTemplate();
  document.body.insertAdjacentHTML("beforeend", html);
}

/**
 * Liest den aktuellen Benutzer aus der Session aus.
 * @returns {Object|null} Das Benutzer-Objekt oder null.
 */
function getAccountUserData() {
  if (typeof getCurrentUser === "function") return getCurrentUser();
  return null;
}

/**
 * Befüllt das Account-Overlay mit den aktuellen Benutzerdaten.
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
 * Aktualisiert die Initialen im Avatar-Kreis.
 * @param {string} name - Der Benutzername.
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
 * Setzt den Initialen-Text im Avatar-Element.
 * @param {HTMLElement} el - Das Avatar-Element.
 * @param {string} text - Der Initialen-Text.
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
 * Lädt und zeigt das Profilbild im Account-Overlay.
 * @param {Object} currentUser - Das aktuelle User-Objekt.
 */
function loadAccountProfileImage(currentUser) {
  if (!currentUser || !currentUser.profileImage) return;
  const base64 = currentUser.profileImage.base64;
  if (!base64) return;
  if (typeof showAccountProfileImage === "function") showAccountProfileImage(base64);
}

/**
 * Setzt die Formularfelder auf readonly.
 */
function setAccountFieldsReadonly() {
  document.getElementById("account-name").readOnly = true;
  document.getElementById("account-email").readOnly = true;
  document.getElementById("account-phone").readOnly = true;
}

/**
 * Setzt die Formularfelder auf bearbeitbar.
 */
function setAccountFieldsEditable() {
  document.getElementById("account-name").readOnly = false;
  document.getElementById("account-email").readOnly = false;
  document.getElementById("account-phone").readOnly = false;
}

/**
 * Setzt das Account-Overlay in den Ansichtsmodus (readonly).
 */
function setAccountViewMode() {
  resetAccountViewUI();
  if (typeof cancelPendingProfileImage === "function") cancelPendingProfileImage();
  loadCurrentUserProfile();
  setupEditAccountButton();
}

/**
 * Setzt die UI-Elemente für den Ansichtsmodus zurück.
 */
function resetAccountViewUI() {
  document.getElementById("account-dialog-title").textContent = "My account";
  setAccountFieldsReadonly();
  document.getElementById("account-camera-badge").style.display = "none";
  if (typeof clearAccountFormErrors === "function") clearAccountFormErrors();
}

/**
 * Lädt die Profildaten des aktuellen Benutzers.
 */
function loadCurrentUserProfile() {
  const currentUser = getAccountUserData();
  if (currentUser) {
    if (typeof updateAccountInitials === "function") updateAccountInitials(currentUser.name);
    loadAccountProfileImage(currentUser);
  }
}

/**
 * Konfiguriert den Button für den Ansichtsmodus.
 */
function setupEditAccountButton() {
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = "Edit";
  actionBtn.onclick = toggleEditAccount;
}

/**
 * Wechselt das Account-Overlay in den Bearbeitungsmodus.
 */
function toggleEditAccount() {
  document.getElementById("account-dialog-title").textContent = "Edit account";
  setAccountFieldsEditable();
  document.getElementById("account-camera-badge").style.display = "flex";
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = `Save <img src="./assets/icons/check-icon.png" alt="Save" class="check-icon-white">`;
  actionBtn.onclick = saveAccountChanges;
  if (typeof initFileUpload === "function") initFileUpload();
}

/**
 * Speichert Account-Änderungen in Firebase und aktualisiert die Session.
 */
async function saveAccountChanges() {
  let currentUser = getAccountUserData();
  if (!currentUser) return setAccountViewMode();
  currentUser = await handleProfileImageUpload(currentUser);
  await handleAccountDataSave(currentUser);
}

/**
 * Verarbeitet den Upload eines neuen Profilbilds.
 * @param {Object} currentUser - Das aktuelle User-Objekt.
 * @returns {Promise<Object>} Das aktualisierte User-Objekt.
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
 * Speichert die Formulardaten und aktualisiert die UI.
 * @param {Object} currentUser - Das aktuelle User-Objekt.
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
 * Liest die Eingabedaten aus dem Account-Overlay aus.
 * @returns {Object} Die Formulardaten als Objekt.
 */
function getAccountInputData() {
  return {
    name: document.getElementById("account-name").value.trim(),
    email: document.getElementById("account-email").value.trim(),
    phone: document.getElementById("account-phone").value.trim()
  };
}

/**
 * Aktualisiert das Benutzerdokument in Firebase.
 * @param {string} uid - Die User-ID.
 * @param {Object} data - Die zu speichernden Daten.
 */
async function updateFirebaseAccount(uid, data) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  await window.fbUpdateDoc(userRef, data);
}

/**
 * Aktualisiert die lokalen Session-Daten.
 * @param {Object} user - Das User-Objekt.
 * @param {Object} data - Die neuen Daten.
 */
function updateLocalAccountSession(user, data) {
  user.name = data.name;
  user.email = data.email;
  user.phone = data.phone;
  sessionStorage.setItem("join_current_user", JSON.stringify(user));
}

/**
 * Aktualisiert die UI nach dem Speichern der Account-Daten.
 * @param {Object} user - Das aktuelle User-Objekt.
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
 * Zeigt das Overlay zur Bestätigung der Account-Löschung an.
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
 * Schließt das Bestätigungs-Overlay und zeigt den Account-Dialog wieder.
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
 * Löscht den kompletten Account des Users und loggt ihn aus.
 */
async function confirmDeleteAccount() {
  const currentUser = getAccountUserData();
  const firebaseUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  if (currentUser && firebaseUser && !currentUser.isGuest) {
    await deleteUserAndData(currentUser, firebaseUser);
  }
}

/**
 * Führt die Löschung der Daten und des Auth-Accounts aus.
 * @param {Object} currentUser - Das aktuelle User-Objekt.
 * @param {Object} firebaseUser - Der Firebase Auth User.
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
 * Behandelt Fehler beim Löschen des Accounts.
 * @param {Error} error - Das aufgetretene Fehler-Objekt.
 */
async function handleDeleteError(error) {
  console.error("Fehler beim Löschen des Accounts:", error);
  if (typeof logoutUser === "function") {
    await logoutUser();
    window.location.href = "index.html";
  }
}
