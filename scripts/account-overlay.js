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
  const dialog = overlay.querySelector(".slide-in-dialog");
  if (dialog) dialog.classList.remove("active");
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
  document.getElementById("account-name").value = name;
  document.getElementById("account-email").value = email;
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
  document.getElementById("account-camera-icon").style.display = "none";
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
  document.getElementById("account-camera-icon").style.display = "block";
  const actionBtn = document.getElementById("account-action-btn");
  actionBtn.innerHTML = `Save <img src="./assets/icons/check-icon.png" alt="Save" class="check-icon-white">`;
  actionBtn.onclick = saveAccountChanges;
}


/**
 * Speichert Account-Änderungen (Logik folgt noch)
 */
function saveAccountChanges() {
  // TODO: Implement save logic later
  setAccountViewMode();
}


/**
 * Löscht den Account (Logik folgt noch)
 */
function deleteMyAccount() {
  // TODO: Implement delete logic later
  console.log("Delete account clicked");
}
