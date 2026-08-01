/**
 * @fileoverview Form handling logic for managing contacts.
 */
/**
 * Sets the HTML of the overlay, activates it and locks scrolling
 * @param {string} html - The HTML for the overlay content
 */
function activateContactOverlay(html) {
  const overlay = document.getElementById("add-contact-overlay");
  overlay.innerHTML = html;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    overlay.querySelectorAll(".slide-in-dialog").forEach(d => d.classList.add("active"));
  }, 10);
}

/**
 * Opens the dialog for adding a contact
 */
function openAddContactDialog() {
  const html = getAddContactHTML();
  activateContactOverlay(html);
  initAddContactForm();
}

/**
 * Returns HTML for the add contact dialog
 * @returns {string} The HTML string
 */
function getAddContactHTML() {
  return window.innerWidth <= 780 ? getMobileAddContactTemplate() : getDesktopAddContactTemplate();
}

/**
 * Initializes the add contact form fields
 */
function initAddContactForm() {
  attachBlurValidators("new-contact-name", "new-contact-email", "new-contact-phone");
  checkContactFormValidity("new-contact-name", "new-contact-email", "new-contact-phone", "add-contact-submit");
  if (typeof initContactFileUpload === "function") initContactFileUpload();
}

/**
 * Opens the dialog for editing a contact
 * @param {string|number} id - The contact ID
 */
function openEditContactDialog(id) {
  const contact = findContactById(id);
  const html = getEditContactHTML(contact);
  activateContactOverlay(html);
  initEditContactForm();
}

/**
 * Returns HTML for the edit contact dialog
 * @param {Object} contact - The contact
 * @returns {string} The HTML string
 */
function getEditContactHTML(contact) {
  const { avatarInnerHtml, avatarStyle } = getContactAvatarData(contact, false);
  return window.innerWidth <= 780 ? getMobileEditContactTemplate(contact, avatarInnerHtml, avatarStyle) : getDesktopEditContactTemplate(contact, avatarInnerHtml, avatarStyle);
}

/**
 * Initializes the edit contact form fields
 */
function initEditContactForm() {
  attachBlurValidators("edit-contact-name", "edit-contact-email", "edit-contact-phone");
  checkContactFormValidity("edit-contact-name", "edit-contact-email", "edit-contact-phone", "edit-contact-submit");
  if (typeof initContactFileUpload === "function") initContactFileUpload();
}

/**
 * Closes the contact dialog
 */
function closeAddContactDialog() {
  deactivateContactOverlay();
  document.body.style.overflow = "auto";
  if (typeof cancelPendingContactProfileImage === "function") {
    cancelPendingContactProfileImage();
  }
}

/**
 * Deactivates and clears the contact overlay
 */
function deactivateContactOverlay() {
  const overlay = document.getElementById("add-contact-overlay");
  overlay.classList.remove("active");
  overlay.querySelectorAll(".slide-in-dialog").forEach(d => d.classList.remove("active"));
  setTimeout(() => overlay.innerHTML = "", 400);
}

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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
    emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
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
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
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

/**
 * Creates a new contact from the form
 * @param {Event} e - The submit event
 */
async function createContact(e) {
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const ids = ["new-contact-name", "new-contact-email", "new-contact-phone"];
  if (!validateContactForm(ids[0], ids[1], ids[2])) return;
  const name = document.getElementById(ids[0]).value.trim();
  
  const newContact = buildNewContactObject(name);
  await attachImageToContact(newContact);
  saveNewContactToFirestore(currentUser, newContact);
}

/**
 * Attaches a pending profile image to the contact
 * @param {Object} contact - The contact object
 */
async function attachImageToContact(contact) {
  if (typeof hasPendingContactProfileImage === 'function' && hasPendingContactProfileImage()) {
    try {
      const images = await processPendingContactProfileImage();
      if (images) {
        contact.profileImage = images.profileImage;
        contact.profileImageSmall = images.profileImageSmall;
      }
    } catch (err) {
      console.error("Fehler beim Verarbeiten des Bildes:", err);
    }
  }
}

/**
 * Builds the object for a new contact
 * @param {string} name - The name of the contact
 * @returns {Object} The contact object
 */
function buildNewContactObject(name) {
  const colors = ["#AB47BC", "#FF9800", "#5C6BC0", "#26A69A"];
  const randomColor = colors[Math.floor(Math.random() * 4)];
  return {
    id: String(Date.now()),
    name: name,
    email: document.getElementById("new-contact-email").value,
    phone: document.getElementById("new-contact-phone").value,
    color: randomColor,
    initials: getInitials(name),
  };
}

/**
 * Completes the build and updates the UI
 * @param {Object} newContact - The new contact
 */
function finalizeContactCreation(newContact) {
  contacts.push(newContact);
  renderContactList();
  closeAddContactDialog();
  showSuccessAlert();
}

/**
 * Saves changes to an existing contact
 * @param {Event} e - The submit event
 * @param {string|number} id - The ID of the contact
 */
async function saveContact(e, id) {
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const ids = ["edit-contact-name", "edit-contact-email", "edit-contact-phone"];
  if (!validateContactForm(ids[0], ids[1], ids[2])) return;
  const contact = findContactById(id);
  if (!contact) return;
  
  updateContactFromForm(contact);
  await attachImageToContact(contact);
  persistContactToFirestore(currentUser, contact, id);
}

/**
 * Updates a contact's information based on form input
 * @param {Object} contact - The contact object
 */
function updateContactFromForm(contact) {
  contact.name = document.getElementById("edit-contact-name").value;
  contact.email = document.getElementById("edit-contact-email").value;
  contact.phone = document.getElementById("edit-contact-phone").value;
  contact.initials = getInitials(contact.name);
}

/**
 * Completes the update and updates the UI
 * @param {Object} contact - The updated contact
 */
function finalizeContactUpdate(contact) {
  renderContactList();
  const content = document.getElementById("contact-details-content");
  if (window.innerWidth <= 780) {
    content.innerHTML = getMobileContactDetailsTemplate(contact);
  } else {
    content.innerHTML = getDesktopContactDetailsTemplate(contact);
  }
  closeAddContactDialog();
  showSuccessAlert("Contact successfully updated");
}

/**
 * Deletes a contact
 * @param {string|number} id - The ID of the contact to delete
 */
function deleteContact(id) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  removeContactFromFirestore(currentUser, id);
}

/**
 * Completes deletion in the UI
 * @param {string|number} id - The contact ID
 */
function finalizeContactDeletion(id) {
  removeContactFromLocal(id);
  renderContactList();
  closeContactDetails();
}

/**
 * Removes a contact from the local array
 * @param {string|number} id - The contact ID
 */
function removeContactFromLocal(id) {
  contacts = contacts.filter(function (c) {
    return String(c.id) !== String(id);
  });
}
