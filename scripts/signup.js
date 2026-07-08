/**
 * Initialisiert die Signup-Seite
 */
function initSignup() {
  checkFormValidity();
}

/**
 * Setzt den Fehler-Zustand auf ein Input-Feld und den zugehörigen Hint.
 * @param {HTMLElement} input
 * @param {HTMLElement} hint
 * @param {string} message
 */
function applyFieldError(input, hint, message) {
  input.classList.add("input-error");
  hint.textContent = message;
  hint.style.display = "block";
}

/**
 * Entfernt den Fehler-Zustand von einem Input-Feld und dem zugehörigen Hint.
 * @param {HTMLElement} input
 * @param {HTMLElement} hint
 */
function clearFieldError(input, hint) {
  input.classList.remove("input-error");
  hint.textContent = "";
  hint.style.display = "none";
}

/**
 * Zeigt oder versteckt einen Hinweis unter einem Input-Feld.
 * @param {string} inputId
 * @param {string|null} message
 */
function setFieldHint(inputId, message) {
  const input = document.getElementById(inputId);
  const hint = document.getElementById("hint-" + inputId);
  if (!input || !hint) return;
  if (message) {
    applyFieldError(input, hint, message);
  } else {
    clearFieldError(input, hint);
  }
}

/**
 * Liest alle Formularwerte der Registrierungsseite aus.
 * @returns {{name: string, email: string, pass: string, confirm: string, privacy: boolean}}
 */
function getSignupFormValues() {
  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    pass: document.getElementById("password").value,
    confirm: document.getElementById("confirm-password").value,
    privacy: document.getElementById("privacy-check").checked,
  };
}

/**
 * Validiert alle Felder des Registrierungsformulars.
 * @param {string} name
 * @param {string} email
 * @param {string} pass
 * @param {string} confirm
 * @returns {{nameValid: boolean, emailValid: boolean, passValid: boolean, confirmComplete: boolean}}
 */
function validateSignupFields(name, email, pass, confirm) {
  const nameLetters = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
  return {
    nameValid: nameLetters.length >= 3,
    emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
    passValid: pass.length >= 6,
    confirmComplete: confirm.length >= 1 && pass === confirm,
  };
}

/**
 * @param {{name: string}} values
 * @param {{nameValid: boolean}} validity
 */
function showNameHint(values, validity) {
  setFieldHint("name", values.name.length > 0 && !validity.nameValid
    ? "Der Name muss mindestens 3 Buchstaben enthalten." : null);
}

/**
 * @param {{email: string}} values
 * @param {{emailValid: boolean}} validity
 */
function showEmailHint(values, validity) {
  setFieldHint("email", values.email.length > 0 && !validity.emailValid
    ? "Bitte eine gültige E-Mail-Adresse eingeben." : null);
}

/**
 * @param {{pass: string}} values
 * @param {{passValid: boolean}} validity
 */
function showPasswordHint(values, validity) {
  setFieldHint("password", values.pass.length > 0 && !validity.passValid
    ? "Das Passwort muss mindestens 6 Zeichen lang sein." : null);
}

/**
 * @param {{pass: string, confirm: string}} values
 */
function showConfirmHint(values) {
  setFieldHint("confirm-password", values.confirm.length > 0 && values.pass !== values.confirm
    ? "Die Passwörter stimmen nicht überein." : null);
}

/**
 * Zeigt Validierungshinweise für alle Felder an.
 * @param {Object} values
 * @param {Object} validity
 */
function showSignupFieldHints(values, validity) {
  showNameHint(values, validity);
  showEmailHint(values, validity);
  showPasswordHint(values, validity);
  showConfirmHint(values);
}

/**
 * Aktiviert oder deaktiviert den Submit-Button.
 * @param {boolean} allValid
 */
function updateSignupSubmitButton(allValid) {
  const btn = document.getElementById("signup-btn");
  btn.disabled = !allValid;
  btn.classList.toggle("btn-disabled", !allValid);
}

/**
 * Prüft ob alle Pflichtfelder gültig sind.
 * @param {Object} validity
 * @param {boolean} privacy
 * @returns {boolean}
 */
function isFormComplete(validity, privacy) {
  return validity.nameValid && validity.emailValid &&
    validity.passValid && validity.confirmComplete && privacy;
}

/**
 * Überprüft die Gültigkeit des Formulars und aktualisiert UI-Hinweise.
 */
function checkFormValidity() {
  const values = getSignupFormValues();
  const validity = validateSignupFields(
    values.name, values.email, values.pass, values.confirm,
  );
  showSignupFieldHints(values, validity);
  updateSignupSubmitButton(isFormComplete(validity, values.privacy));
}

/**
 * Liest die Rohwerte des Registrierungsformulars aus.
 * @returns {{name: string, email: string, pass: string, confirm: string}}
 */
function getRegistrationFormValues() {
  return {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    pass: document.getElementById("password").value,
    confirm: document.getElementById("confirm-password").value,
  };
}

/**
 * Führt den eigentlichen Registrierungsversuch durch und verarbeitet das Ergebnis.
 * @param {string} name
 * @param {string} email
 * @param {string} pass
 */
async function attemptSignUp(name, email, pass) {
  const result = await signUpUser(name, email, pass);
  if (result.success) {
    console.log("Benutzer erfolgreich registriert:", email);
    showSuccessMessageAndRedirect();
  } else {
    console.error("Registrierungsfehler:", result.error, result.message);
    handleRegistrationError(result);
  }
}

/**
 * Verarbeitet die Benutzerregistrierung.
 * @param {Event} event
 */
async function handleRegistration(event) {
  event.preventDefault();
  await waitForFirebase();
  const values = getRegistrationFormValues();
  if (values.pass !== values.confirm) {
    showPasswordError();
    return;
  }
  await attemptSignUp(values.name, values.email, values.pass);
}

/**
 * Aktiviert die visuelle Fehlermeldung bei Passwort-Mismatch.
 * @param {HTMLElement|null} errorMsg
 * @param {HTMLElement} confirmInput
 */
function displayPasswordMismatchError(errorMsg, confirmInput) {
  if (errorMsg) errorMsg.classList.remove("v-none");
  confirmInput.classList.add("input-error");
}

/**
 * Zeigt eine Passwort-Fehlermeldung an und registriert einen Reset-Listener.
 */
function showPasswordError() {
  const errorMsg = document.getElementById("error-message");
  const confirmPassInput = document.getElementById("confirm-password");
  displayPasswordMismatchError(errorMsg, confirmPassInput);
  const resetError = function () {
    if (errorMsg) errorMsg.classList.add("v-none");
    confirmPassInput.classList.remove("input-error");
    confirmPassInput.removeEventListener("input", resetError);
  };
  confirmPassInput.addEventListener("input", resetError);
}

/**
 * Zeigt die Fehlermeldung und markiert ggf. das E-Mail-Feld.
 * @param {HTMLElement|null} errorMsg
 * @param {HTMLElement} emailInput
 * @param {{error: string, message: string}} result
 */
function displayRegistrationError(errorMsg, emailInput, result) {
  if (errorMsg) {
    errorMsg.textContent = result.message;
    errorMsg.classList.remove("v-none");
  }
  if (result.error === "duplicate-email" || result.error === "invalid-email") {
    emailInput.classList.add("input-error");
  }
}

/**
 * Verarbeitet Registrierungsfehler und zeigt entsprechende Meldungen.
 * @param {{error: string, message: string}} result
 */
function handleRegistrationError(result) {
  const errorMsg = document.getElementById("error-message");
  const emailInput = document.getElementById("email");
  displayRegistrationError(errorMsg, emailInput, result);
  const resetError = function () {
    if (errorMsg) errorMsg.classList.add("v-none");
    emailInput.classList.remove("input-error");
    emailInput.removeEventListener("input", resetError);
  };
  emailInput.addEventListener("input", resetError);
}

/**
 * Zeigt eine Erfolgsmeldung an und leitet zur Login-Seite weiter.
 */
function showSuccessMessageAndRedirect() {
  const msg = document.getElementById("success-message");
  msg.classList.remove("d-none");
  setTimeout(function () {
    window.location.href = "index.html";
  }, 800);
}
