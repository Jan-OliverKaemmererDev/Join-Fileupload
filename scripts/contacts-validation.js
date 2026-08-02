/**
 * @fileoverview Validation logic for the contacts forms.
 */

/**
 * Validates the name field of a contact form
 * @param {string} nameId - The ID of the name input field
 * @returns {boolean} True if the field is valid
 */
function validateNameField(nameId) {
  const name = document.getElementById(nameId).value.trim();
  const nameLetters = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
  if (nameLetters.length < 3) {
    showFieldError(nameId, "Der Name muss mindestens 3 Buchstaben enthalten.");
    return false;
  }
  clearFieldError(nameId);
  return true;
}

/**
 * Validates the email field of a contact form
 * @param {string} emailId - The ID of the email input field
 * @returns {boolean} True if the field is valid
 */
function validateEmailField(emailId) {
  const email = document.getElementById(emailId).value.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    showFieldError(emailId, "Bitte eine gültige E-Mail-Adresse eingeben.");
    return false;
  }
  clearFieldError(emailId);
  return true;
}

/**
 * Validates the phone field of a contact form
 * @param {string} phoneId - The ID of the phone input field
 * @returns {boolean} True if the field is valid
 */
function validatePhoneField(phoneId) {
  const phone = document.getElementById(phoneId).value.trim();
  if (phone.length < 6) {
    showFieldError(
      phoneId,
      "Bitte eine gültige Telefonnummer eingeben (mind. 6 Ziffern).",
    );
    return false;
  }
  clearFieldError(phoneId);
  return true;
}

/**
 * Validates the contact form (name at least 3 letters, valid email format, telephone at least 6 digits)
 * @param {string} nameId - The ID of the name input field
 * @param {string} emailId - The ID of the email input field
 * @param {string} phoneId - The ID of the phone input field
 * @returns {boolean} True if all fields are valid
 */
function validateContactForm(nameId, emailId, phoneId) {
  const nameValid = validateNameField(nameId);
  const emailValid = validateEmailField(emailId);
  const phoneValid = validatePhoneField(phoneId);
  return nameValid && emailValid && phoneValid;
}

/**
 * Displays an error message for a field
 * @param {string} inputId - The ID of the input field
 * @param {string} message - The error message
 */
function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const group = input.closest(".input-group");
  input.classList.add("input-error");
  let errorEl = group.querySelector(".field-error-msg");
  if (!errorEl) {
    errorEl = document.createElement("span");
    errorEl.className = "field-error-msg";
    group.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

/**
 * Removes the error notice from a field
 * @param {string} inputId - The ID of the input field
 */
function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  const group = input.closest(".input-group");
  input.classList.remove("input-error");
  if (group) {
    const errorEl = group.querySelector(".field-error-msg");
    if (errorEl) errorEl.remove();
  }
}

/**
 * Checks the validity of the entire contact form and updates the button status
 * @param {string} nameId - ID of the name field
 * @param {string} emailId - ID of the email field
 * @param {string} phoneId - ID of the phone field
 * @param {string} buttonId - ID of the button
 */
function checkContactFormValidity(nameId, emailId, phoneId, buttonId, showErrors = false) {
  const vals = getContactFieldValues(nameId, emailId, phoneId);
  const valids = getContactFieldValidities(vals.name, vals.email, vals.phone);
  
  if (showErrors) showContactFormErrors(nameId, emailId, phoneId, vals, valids);
  else clearValidContactErrors(nameId, emailId, phoneId, vals, valids);
  
  const allValid = valids.nameValid && valids.emailValid && valids.phoneValid;
  const btn = document.getElementById(buttonId);
  btn.disabled = !allValid;
  btn.classList.toggle("btn-disabled", !allValid);
}

/**
 * Gets the current values of contact fields
 */
function getContactFieldValues(nameId, emailId, phoneId) {
  return {
    name: document.getElementById(nameId).value.trim(),
    email: document.getElementById(emailId).value.trim(),
    phone: document.getElementById(phoneId).value.trim()
  };
}

/**
 * Gets validity for contact fields
 */
function getContactFieldValidities(name, email, phone) {
  return {
    nameValid: name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").length >= 3,
    emailValid: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(email),
    phoneValid: phone.length >= 11
  };
}

/**
 * Shows errors for all fields
 */
function showContactFormErrors(nId, eId, pId, vals, valids) {
  updateContactFieldFeedback(nId, vals.name, valids.nameValid, "Der Name muss mindestens 3 Buchstaben enthalten.");
  updateContactFieldFeedback(eId, vals.email, valids.emailValid, "Bitte eine gültige E-Mail-Adresse eingeben.");
  updateContactFieldFeedback(pId, vals.phone, valids.phoneValid, "Bitte eine gültige Telefonnummer eingeben (mind. 11 Ziffern).");
}

/**
 * Clears errors for valid fields
 */
function clearValidContactErrors(nId, eId, pId, vals, valids) {
  if (valids.nameValid || vals.name.length === 0) clearFieldError(nId);
  if (valids.emailValid || vals.email.length === 0) clearFieldError(eId);
  if (valids.phoneValid || vals.phone.length === 0) clearFieldError(pId);
}

/**
 * Adds blur event listeners to input fields to show exit errors
 */
function attachBlurValidators(nameId, emailId, phoneId) {
  addNameBlurValidator(nameId);
  addEmailBlurValidator(emailId);
  addPhoneBlurValidator(phoneId);
}

/**
 * Adds a blur validator for the name field
 */
function addNameBlurValidator(nameId) {
  const el = document.getElementById(nameId);
  if (el) el.addEventListener('blur', () => {
    const val = el.value.trim();
    const valid = val.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").length >= 3;
    updateContactFieldFeedback(nameId, val, valid, "Der Name muss mindestens 3 Buchstaben enthalten.");
  });
}

/**
 * Adds a blur validator for the email field
 */
function addEmailBlurValidator(emailId) {
  const el = document.getElementById(emailId);
  if (el) el.addEventListener('blur', () => {
    const val = el.value.trim();
    const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(val);
    updateContactFieldFeedback(emailId, val, valid, "Bitte eine gültige E-Mail-Adresse eingeben.");
  });
}

/**
 * Adds a blur validator for the phone field
 */
function addPhoneBlurValidator(phoneId) {
  const el = document.getElementById(phoneId);
  if (el) el.addEventListener('blur', () => {
    const val = el.value.trim();
    const valid = val.length >= 11;
    updateContactFieldFeedback(phoneId, val, valid, "Bitte eine gültige Telefonnummer eingeben (mind. 11 Ziffern).");
  });
}

/**
 * Updates visual feedback for an input field
 * @param {string} inputId - ID of the input field
 * @param {string} value - The current value
 * @param {boolean} isValid - Whether the value is valid
 * @param {string} errorMessage - The error message to display
 */
function updateContactFieldFeedback(inputId, value, isValid, errorMessage) {
  if (value.length > 0) {
    if (isValid) {
      clearFieldError(inputId);
    } else {
      showFieldError(inputId, errorMessage);
    }
  } else {
    clearFieldError(inputId);
  }
}
