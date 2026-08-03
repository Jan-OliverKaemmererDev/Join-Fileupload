/**
 * @fileoverview Logic for validating user accounts.
 */

/**
 * Checks account overlay form values.
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
 * Adds blur event listeners to input fields in the account overlay.
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
 * Formats phone number input in account overlay.
 * @returns {string} The cleaned phone number.
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
 * Validates name in account overlay.
 * @param {string} name - The name to check.
 * @returns {boolean} True if the name is valid.
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
 * Validates the email in the account overlay.
 * @param {string} email - The email address to check.
 * @returns {boolean} True if the email is valid.
 */
function validateAccountEmail(email, showErrors = false) {
  const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(email);
  if (showErrors || isValid || email.length === 0) {
    const msg = email.length > 0 && !isValid ? "Bitte eine gültige E-Mail-Adresse eingeben." : null;
    setAccountFieldHint("account-email", msg);
  }
  return isValid;
}

/**
 * Validates phone number in account overlay.
 * @param {string} phone - The phone number to check.
 * @returns {boolean} True if the phone number is valid.
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
 * Updates the save button in the account overlay.
 * @param {boolean} nameValid - Validity of the name.
 * @param {boolean} emailValid - Validity of the email.
 * @param {boolean} phoneValid - Phone number validity.
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
 * Shows or hides a note under an account input field.
 * @param {string} inputId - The ID of the input field.
 * @param {string|null} message - The message to display.
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
 * Removes the error condition of a single account field.
 * @param {HTMLElement} input - The input field.
 * @param {HTMLElement} hint - The hint element.
 */
function clearSingleAccountError(input, hint) {
  input.classList.remove("input-error");
  hint.textContent = "";
  hint.style.display = "none";
}

/**
 * Removes all error states from the account form.
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
