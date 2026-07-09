/**
 * Schließt das User-Dropdown-Menü
 */
function closeUserDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.remove("active");
}


/**
 * Stellt sicher, dass das Account-Overlay-DOM existiert
 * @returns {HTMLElement} Das Account-Overlay-Element
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
 * Öffnet das Account-Overlay und zeigt die Benutzerdaten an
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
 * Schließt das Account-Overlay mit Slide-Out-Animation
 */
function closeAccountOverlay() {
  const overlay = document.getElementById("account-overlay");
  if (!overlay) return;
  const dialogs = overlay.querySelectorAll(".slide-in-dialog");
  dialogs.forEach(d => d.classList.remove("active"));
  setTimeout(() => {
    overlay.classList.remove("active");
    setAccountViewMode();
  }, 400);
}


/**
 * Erstellt das Account-Overlay-DOM und fügt es in den Body ein
 */
function createAccountOverlay() {
  const html = getAccountOverlayTemplate();
  document.body.insertAdjacentHTML("beforeend", html);
}


/**
 * Liest den aktuellen Benutzer aus der Session
 * @returns {Object|null} Das Benutzer-Objekt oder null
 */
function getAccountUserData() {
  if (typeof getCurrentUser === "function") {
    return getCurrentUser();
  }
  return null;
}


/**
 * Befüllt das Account-Overlay mit den aktuellen Benutzerdaten
 */
function populateAccountData() {
  const currentUser = getAccountUserData();
  const name = currentUser?.name || "Guest";
  const email = currentUser?.email || "";
  const phone = currentUser?.phone || "";
  document.getElementById("account-name").value = name;
  document.getElementById("account-email").value = email;
  document.getElementById("account-phone").value = phone;
  updateAccountInitials(name);
}


/**
 * Aktualisiert die Initialen im Avatar-Kreis
 * @param {string} name - Der Benutzername
 */
function updateAccountInitials(name) {
  const el = document.getElementById("account-initials");
  if (typeof getInitialsFromName === "function") {
    el.textContent = getInitialsFromName(name);
  } else {
    el.textContent = name.substring(0, 1).toUpperCase();
  }
}


/**
 * Setzt die Formularfelder auf readonly
 */
function setAccountFieldsReadonly() {
  document.getElementById("account-name").readOnly = true;
  document.getElementById("account-email").readOnly = true;
  document.getElementById("account-phone").readOnly = true;
}


/**
 * Setzt die Formularfelder auf bearbeitbar
 */
function setAccountFieldsEditable() {
  document.getElementById("account-name").readOnly = false;
  document.getElementById("account-email").readOnly = false;
  document.getElementById("account-phone").readOnly = false;
}


/**
 * Setzt das Account-Overlay in den Ansichtsmodus (readonly)
 */
function setAccountViewMode() {
  document.getElementById("account-dialog-title").textContent = "My account";
  setAccountFieldsReadonly();
  document.getElementById("account-camera-badge").style.display = "none";
  clearAccountFormErrors();
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = "Edit";
  actionBtn.onclick = toggleEditAccount;
}


/**
 * Wechselt das Account-Overlay in den Bearbeitungsmodus
 */
function toggleEditAccount() {
  document.getElementById("account-dialog-title").textContent = "Edit account";
  setAccountFieldsEditable();
  document.getElementById("account-camera-badge").style.display = "flex";
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = `Save <img src="./assets/icons/check-icon.png" alt="Save" class="check-icon-white">`;
  actionBtn.onclick = saveAccountChanges;
}


/**
 * Speichert Account-Änderungen in Firebase und aktualisiert die Session.
 */
async function saveAccountChanges() {
  const currentUser = getAccountUserData();
  if (!currentUser || currentUser.isGuest) return setAccountViewMode();
  const data = getAccountInputData();
  try {
    await updateFirebaseAccount(currentUser.id, data);
    updateLocalAccountSession(currentUser, data);
    updateAccountUI(currentUser);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
  }
}


/**
 * Liest die Eingabedaten aus dem Account-Overlay aus.
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
 */
async function updateFirebaseAccount(uid, data) {
  const userRef = window.fbDoc(window.firebaseDb, "users", uid);
  await window.fbUpdateDoc(userRef, data);
}


/**
 * Aktualisiert die lokalen Session-Daten.
 */
function updateLocalAccountSession(user, data) {
  user.name = data.name;
  user.email = data.email;
  user.phone = data.phone;
  sessionStorage.setItem("join_current_user", JSON.stringify(user));
}


/**
 * Aktualisiert die UI nach dem Speichern der Account-Daten.
 */
function updateAccountUI(user) {
  if (typeof updateHeaderInitials === "function") {
    updateHeaderInitials(user);
  }
  if (typeof updateUserName === "function") {
    updateUserName(user);
  }
  updateAccountInitials(user.name);
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
    try {
      if (typeof deleteUserData === "function") {
        await deleteUserData(currentUser.id);
      }
      await firebaseUser.delete();
      
      if (typeof clearUserSession === "function") {
        clearUserSession();
      } else {
        sessionStorage.removeItem("join_current_user");
      }
      
      window.location.href = "index.html";
    } catch (error) {
      console.error("Fehler beim Löschen des Accounts:", error);
      
      if (typeof logoutUser === "function") {
        await logoutUser();
        window.location.href = "index.html";
      }
    }
  }
}


/**
 * Überprüft die Formularwerte des Account-Overlays.
 */
function checkAccountFormValidity() {
  const nameInput = document.getElementById("account-name");
  const emailInput = document.getElementById("account-email");
  const phoneInput = document.getElementById("account-phone");
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  
  let phone = phoneInput.value;
  phone = phone.replace(/[^0-9+]/g, "");
  if (phone !== phoneInput.value) {
    phoneInput.value = phone;
  }

  const nameLetters = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
  const nameValid = nameLetters.length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const phoneValid = phone.length === 0 || phone.length >= 11;

  setAccountFieldHint("account-name", name.length > 0 && !nameValid 
    ? "Der Name muss mindestens 3 Buchstaben enthalten." : null);

  setAccountFieldHint("account-email", email.length > 0 && !emailValid 
    ? "Bitte eine gültige E-Mail-Adresse eingeben." : null);

  setAccountFieldHint("account-phone", phone.length > 0 && !phoneValid 
    ? "Die Telefonnummer muss mindestens 11 Zahlen haben." : null);

  const actionBtn = document.getElementById("account-action-btn");
  if (actionBtn && actionBtn.textContent.includes("Save")) {
    if (nameValid && emailValid && phoneValid) {
      actionBtn.disabled = false;
      actionBtn.classList.remove("btn-disabled");
    } else {
      actionBtn.disabled = true;
      actionBtn.classList.add("btn-disabled");
    }
  }
}


/**
 * Zeigt oder versteckt einen Hinweis unter einem Account-Input-Feld.
 * @param {string} inputId 
 * @param {string|null} message 
 */
function setAccountFieldHint(inputId, message) {
  const input = document.getElementById(inputId);
  const hint = document.getElementById("hint-" + inputId);
  if (!input || !hint) return;
  if (message) {
    input.classList.add("input-error");
    hint.textContent = message;
    hint.style.display = "block";
  } else {
    input.classList.remove("input-error");
    hint.textContent = "";
    hint.style.display = "none";
  }
}


/**
 * Entfernt alle Fehlerzustände aus dem Account-Formular
 */
function clearAccountFormErrors() {
  const fields = ["account-name", "account-email", "account-phone"];
  fields.forEach(id => {
    setAccountFieldHint(id, null);
  });
  
  const actionBtn = document.getElementById("account-action-btn");
  if (actionBtn) {
    actionBtn.disabled = false;
    actionBtn.classList.remove("btn-disabled");
  }
}
