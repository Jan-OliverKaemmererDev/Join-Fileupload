/**
 * @fileoverview Main logic for user registration on the signup page.
 */
/**
 * Initializes the signup page
 */
function initSignup() {
  attachSignupBlurValidators();
  checkFormValidity(false);
}

/**
 * Adds blur event listeners to the signup page input fields.
 */
function attachSignupBlurValidators() {
  const fields = ["name", "email", "password", "confirm-password"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => {
        const values = getSignupFormValues();
        const validity = validateSignupFields(values.name, values.email, values.pass, values.confirm);
        
        if (id === "name") showNameHint(values, validity, true);
        if (id === "email") showEmailHint(values, validity, true);
        if (id === "password") showPasswordHint(values, validity, true);
        if (id === "confirm-password") showConfirmHint(values, true);
      });
    }
  });
}

/**
 * Sets the error status to an input field and the associated hint.
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
 * Removes the error status from an input field and the associated hint.
 * @param {HTMLElement} input
 * @param {HTMLElement} hint
 */
function clearFieldError(input, hint) {
  input.classList.remove("input-error");
  hint.textContent = "";
  hint.style.display = "none";
}

/**
 * Shows or hides a hint under an input field.
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
 * Reads all form values ​​from the registration page.
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
 * Validates all fields of the registration form.
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
function showNameHint(values, validity, showErrors = false) {
  if (showErrors || validity.nameValid || values.name.length === 0) {
    setFieldHint("name", values.name.length > 0 && !validity.nameValid
      ? "Der Name muss mindestens 3 Buchstaben enthalten." : null);
  }
}

/**
 * @param {{email: string}} values
 * @param {{emailValid: boolean}} validity
 */
function showEmailHint(values, validity, showErrors = false) {
  if (showErrors || validity.emailValid || values.email.length === 0) {
    setFieldHint("email", values.email.length > 0 && !validity.emailValid
      ? "Bitte eine gültige E-Mail-Adresse eingeben." : null);
  }
}

/**
 * @param {{pass: string}} values
 * @param {{passValid: boolean}} validity
 */
function showPasswordHint(values, validity, showErrors = false) {
  if (showErrors || validity.passValid || values.pass.length === 0) {
    setFieldHint("password", values.pass.length > 0 && !validity.passValid
      ? "Das Passwort muss mindestens 6 Zeichen lang sein." : null);
  }
}

/**
 * @param {{pass: string, confirm: string}} values
 */
function showConfirmHint(values, showErrors = false) {
  if (showErrors || (values.pass === values.confirm) || values.confirm.length === 0) {
    setFieldHint("confirm-password", values.confirm.length > 0 && values.pass !== values.confirm
      ? "Die Passwörter stimmen nicht überein." : null);
  }
}

/**
 * Displays validation notes for all fields.
 * @param {Object} values
 * @param {Object} validity
 */
function showSignupFieldHints(values, validity, showErrors = false) {
  showNameHint(values, validity, showErrors);
  showEmailHint(values, validity, showErrors);
  showPasswordHint(values, validity, showErrors);
  showConfirmHint(values, showErrors);
}

/**
 * Enables or disables the submit button.
 * @param {boolean} allValid
 */
function updateSignupSubmitButton(allValid) {
  const btn = document.getElementById("signup-btn");
  btn.disabled = !allValid;
  btn.classList.toggle("btn-disabled", !allValid);
}

/**
 * Checks whether all mandatory fields are valid.
 * @param {Object} validity
 * @param {boolean} privacy
 * @returns {boolean}
 */
function isFormComplete(validity, privacy) {
  return validity.nameValid && validity.emailValid &&
    validity.passValid && validity.confirmComplete && privacy;
}

/**
 * Checks form validity and updates UI notes.
 */
function checkFormValidity(showErrors = false) {
  const values = getSignupFormValues();
  const validity = validateSignupFields(
    values.name, values.email, values.pass, values.confirm,
  );
  showSignupFieldHints(values, validity, showErrors);
  updateSignupSubmitButton(isFormComplete(validity, values.privacy));
}

/**
 * Reads the raw values ​​of the registration form.
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
 * Performs the actual registration attempt and processes the result.
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
 * Processes user registration.
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
 * Enables visual error message in case of password mismatch.
 * @param {HTMLElement|null} errorMsg
 * @param {HTMLElement} confirmInput
 */
function displayPasswordMismatchError(errorMsg, confirmInput) {
  if (errorMsg) errorMsg.classList.remove("v-none");
  confirmInput.classList.add("input-error");
}

/**
 * Displays a password error message and registers a reset listener.
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
 * Shows the error message and checks the email field if necessary.
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
 * Handles registration errors and displays appropriate messages.
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
 * Displays a success message and redirects to the login page.
 */
function showSuccessMessageAndRedirect() {
  const msg = document.getElementById("success-message");
  msg.classList.remove("d-none");
  setTimeout(function () {
    window.location.href = "index.html";
  }, 800);
}
