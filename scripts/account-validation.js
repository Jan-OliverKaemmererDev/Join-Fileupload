/**
 * Überprüft die Formularwerte des Account-Overlays.
 */
function checkAccountFormValidity(showErrors = false) {
  const name = document.getElementById("account-name").value.trim();
  const email = document.getElementById("account-email").value.trim();
  const phone = formatAccountPhoneInput();
  const nameValid = validateAccountName(name, showErrors);
  const emailValid = validateAccountEmail(email, showErrors);
  const phoneValid = validateAccountPhone(phone, showErrors);
  updateAccountSaveButton(nameValid, emailValid, phoneValid);
}

/**
 * Fügt blur-Event-Listener zu den Eingabefeldern im Account-Overlay hinzu.
 */
function attachAccountBlurValidators() {
  const nameEl = document.getElementById("account-name");
  const emailEl = document.getElementById("account-email");
  const phoneEl = document.getElementById("account-phone");
  
  if (nameEl) nameEl.addEventListener('blur', () => validateAccountName(nameEl.value.trim(), true));
  if (emailEl) emailEl.addEventListener('blur', () => validateAccountEmail(emailEl.value.trim(), true));
  if (phoneEl) phoneEl.addEventListener('blur', () => validateAccountPhone(formatAccountPhoneInput(), true));
}

/**
 * Formatiert die Telefonnummerneingabe im Account-Overlay.
 * @returns {string} Die bereinigte Telefonnummer.
 */
function formatAccountPhoneInput() {
  const phoneInput = document.getElementById("account-phone");
  const phone = phoneInput.value.replace(/[^0-9+]/g, "");
  if (phone !== phoneInput.value) {
    phoneInput.value = phone;
  }
  return phone;
}

/**
 * Validiert den Namen im Account-Overlay.
 * @param {string} name - Der zu prüfende Name.
 * @returns {boolean} True, wenn der Name gültig ist.
 */
function validateAccountName(name, showErrors = false) {
  const nameLetters = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
  const isValid = nameLetters.length >= 3;
  if (showErrors || isValid || name.length === 0) {
    const msg = name.length > 0 && !isValid ? "Der Name muss mindestens 3 Buchstaben enthalten." : null;
    setAccountFieldHint("account-name", msg);
  }
  return isValid;
}

/**
 * Validiert die E-Mail im Account-Overlay.
 * @param {string} email - Die zu prüfende E-Mail-Adresse.
 * @returns {boolean} True, wenn die E-Mail gültig ist.
 */
function validateAccountEmail(email, showErrors = false) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (showErrors || isValid || email.length === 0) {
    const msg = email.length > 0 && !isValid ? "Bitte eine gültige E-Mail-Adresse eingeben." : null;
    setAccountFieldHint("account-email", msg);
  }
  return isValid;
}

/**
 * Validiert die Telefonnummer im Account-Overlay.
 * @param {string} phone - Die zu prüfende Telefonnummer.
 * @returns {boolean} True, wenn die Telefonnummer gültig ist.
 */
function validateAccountPhone(phone, showErrors = false) {
  const isValid = phone.length === 0 || phone.length >= 11;
  if (showErrors || isValid || phone.length === 0) {
    const msg = phone.length > 0 && !isValid ? "Die Telefonnummer muss mindestens 11 Zahlen haben." : null;
    setAccountFieldHint("account-phone", msg);
  }
  return isValid;
}

/**
 * Aktualisiert den Speichern-Button im Account-Overlay.
 * @param {boolean} nameValid - Gültigkeit des Namens.
 * @param {boolean} emailValid - Gültigkeit der E-Mail.
 * @param {boolean} phoneValid - Gültigkeit der Telefonnummer.
 */
function updateAccountSaveButton(nameValid, emailValid, phoneValid) {
  const actionBtn = document.getElementById("account-action-btn");
  if (!actionBtn || !actionBtn.textContent.includes("Save")) return;
  if (nameValid && emailValid && phoneValid) {
    actionBtn.disabled = false;
    actionBtn.classList.remove("btn-disabled");
  } else {
    actionBtn.disabled = true;
    actionBtn.classList.add("btn-disabled");
  }
}

/**
 * Zeigt oder versteckt einen Hinweis unter einem Account-Input-Feld.
 * @param {string} inputId - Die ID des Eingabefeldes.
 * @param {string|null} message - Die anzuzeigende Nachricht.
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
    clearSingleAccountError(input, hint);
  }
}

/**
 * Entfernt den Fehlerzustand eines einzelnen Account-Feldes.
 * @param {HTMLElement} input - Das Eingabefeld.
 * @param {HTMLElement} hint - Das Hinweis-Element.
 */
function clearSingleAccountError(input, hint) {
  input.classList.remove("input-error");
  hint.textContent = "";
  hint.style.display = "none";
}

/**
 * Entfernt alle Fehlerzustände aus dem Account-Formular.
 */
function clearAccountFormErrors() {
  const fields = ["account-name", "account-email", "account-phone"];
  fields.forEach(id => setAccountFieldHint(id, null));
  const actionBtn = document.getElementById("account-action-btn");
  if (actionBtn) {
    actionBtn.disabled = false;
    actionBtn.classList.remove("btn-disabled");
  }
}
