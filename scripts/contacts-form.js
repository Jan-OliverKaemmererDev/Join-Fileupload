/**
 * Setzt das HTML des Overlays, aktiviert es und sperrt das Scrollen
 * @param {string} html - Das HTML für den Overlay-Inhalt
 */
function activateContactOverlay(html) {
  const overlay = document.getElementById("add-contact-overlay");
  overlay.innerHTML = html;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Öffnet den Dialog zum Hinzufügen eines Kontakts
 */
function openAddContactDialog() {
  activateContactOverlay(getAddContactDialogTemplate());
  checkContactFormValidity(
    "new-contact-name",
    "new-contact-email",
    "new-contact-phone",
    "add-contact-submit",
  );
}

/**
 * Öffnet den Dialog zum Bearbeiten eines Kontakts
 * @param {string|number} id - Die Kontakt-ID
 */
function openEditContactDialog(id) {
  activateContactOverlay(getEditContactDialogTemplate(findContactById(id)));
  checkContactFormValidity(
    "edit-contact-name",
    "edit-contact-email",
    "edit-contact-phone",
    "edit-contact-submit",
  );
}

/**
 * Schließt den Kontakt-Dialog
 */
function closeAddContactDialog() {
  const overlay = document.getElementById("add-contact-overlay");
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
  setTimeout(function () {
    overlay.innerHTML = "";
  }, 300);
}

/**
 * Validiert das Name-Feld eines Kontaktformulars
 * @param {string} nameId - Die ID des Name-Eingabefelds
 * @returns {boolean} True wenn das Feld gültig ist
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
 * Validiert das E-Mail-Feld eines Kontaktformulars
 * @param {string} emailId - Die ID des E-Mail-Eingabefelds
 * @returns {boolean} True wenn das Feld gültig ist
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
 * Validiert das Telefon-Feld eines Kontaktformulars
 * @param {string} phoneId - Die ID des Telefon-Eingabefelds
 * @returns {boolean} True wenn das Feld gültig ist
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
 * Validiert das Kontaktformular (Name min. 3 Buchstaben, gültiges E-Mail-Format, Telefon min. 6 Ziffern)
 * @param {string} nameId - Die ID des Name-Eingabefelds
 * @param {string} emailId - Die ID des E-Mail-Eingabefelds
 * @param {string} phoneId - Die ID des Telefon-Eingabefelds
 * @returns {boolean} True wenn alle Felder gültig sind
 */
function validateContactForm(nameId, emailId, phoneId) {
  const nameValid = validateNameField(nameId);
  const emailValid = validateEmailField(emailId);
  const phoneValid = validatePhoneField(phoneId);
  return nameValid && emailValid && phoneValid;
}

/**
 * Zeigt einen Fehlerhinweis für ein Feld an
 * @param {string} inputId - Die ID des Eingabefelds
 * @param {string} message - Die Fehlermeldung
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
 * Entfernt den Fehlerhinweis eines Felds
 * @param {string} inputId - Die ID des Eingabefelds
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
 * Überprüft die Validität des gesamten Kontaktformulars und aktualisiert den Button-Status
 * @param {string} nameId - ID des Namensfeldes
 * @param {string} emailId - ID des E-Mail-Feldes
 * @param {string} phoneId - ID des Telefonfeldes
 * @param {string} buttonId - ID des Buttons
 */
function checkContactFormValidity(nameId, emailId, phoneId, buttonId) {
  const name = document.getElementById(nameId).value.trim();
  const email = document.getElementById(emailId).value.trim();
  const phone = document.getElementById(phoneId).value.trim();
  const nameValid = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const phoneValid = phone.length >= 11;
  updateContactFieldFeedback(
    nameId,
    name,
    nameValid,
    "Der Name muss mindestens 3 Buchstaben enthalten.",
  );
  updateContactFieldFeedback(
    emailId,
    email,
    emailValid,
    "Bitte eine gültige E-Mail-Adresse eingeben.",
  );
  updateContactFieldFeedback(
    phoneId,
    phone,
    phoneValid,
    "Bitte eine gültige Telefonnummer eingeben (mind. 11 Ziffern).",
  );
  const allValid = nameValid && emailValid && phoneValid;
  const btn = document.getElementById(buttonId);
  btn.disabled = !allValid;
  btn.classList.toggle("btn-disabled", !allValid);
}

/**
 * Aktualisiert das visuelle Feedback für ein Eingabefeld
 * @param {string} inputId - ID des Eingabefeldes
 * @param {string} value - Der aktuelle Wert
 * @param {boolean} isValid - Ob der Wert gültig ist
 * @param {string} errorMessage - Die anzuzeigende Fehlermeldung
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
 * Erstellt einen neuen Kontakt aus dem Formular
 * @param {Event} e - Das Submit-Event
 */
function createContact(e) {
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const ids = ["new-contact-name", "new-contact-email", "new-contact-phone"];
  if (!validateContactForm(ids[0], ids[1], ids[2])) return;
  const name = document.getElementById(ids[0]).value.trim();
  saveNewContactToFirestore(currentUser, buildNewContactObject(name));
}

/**
 * Baut das Objekt für einen neuen Kontakt
 * @param {string} name - Der Name des Kontakts
 * @returns {Object} Das Kontakt-Objekt
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
 * Schließt die Erstellung ab und aktualisiert die UI
 * @param {Object} newContact - Der neue Kontakt
 */
function finalizeContactCreation(newContact) {
  contacts.push(newContact);
  renderContactList();
  closeAddContactDialog();
  showSuccessAlert();
}

/**
 * Speichert Änderungen an einem bestehenden Kontakt
 * @param {Event} e - Das Submit-Event
 * @param {string|number} id - Die ID des Kontakts
 */
function saveContact(e, id) {
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const ids = ["edit-contact-name", "edit-contact-email", "edit-contact-phone"];
  if (!validateContactForm(ids[0], ids[1], ids[2])) return;
  const contact = findContactById(id);
  if (!contact) return;
  updateContactFromForm(contact);
  persistContactToFirestore(currentUser, contact, id);
}

/**
 * Aktualisiert die Daten eines Kontakts basierend auf Formulareingaben
 * @param {Object} contact - Das Kontakt-Objekt
 */
function updateContactFromForm(contact) {
  contact.name = document.getElementById("edit-contact-name").value;
  contact.email = document.getElementById("edit-contact-email").value;
  contact.phone = document.getElementById("edit-contact-phone").value;
  contact.initials = getInitials(contact.name);
}

/**
 * Schließt das Update ab und aktualisiert die UI
 * @param {Object} contact - Der aktualisierte Kontakt
 */
function finalizeContactUpdate(contact) {
  renderContactList();
  const content = document.getElementById("contact-details-content");
  content.innerHTML = getContactDetailsTemplate(contact);
  closeAddContactDialog();
}

/**
 * Löscht einen Kontakt
 * @param {string|number} id - Die ID des zu löschenden Kontakts
 */
function deleteContact(id) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  removeContactFromFirestore(currentUser, id);
}

/**
 * Schließt die Löschung in der UI ab
 * @param {string|number} id - Die Kontakt-ID
 */
function finalizeContactDeletion(id) {
  removeContactFromLocal(id);
  renderContactList();
  closeContactDetails();
}

/**
 * Entfernt einen Kontakt aus dem lokalen Array
 * @param {string|number} id - Die Kontakt-ID
 */
function removeContactFromLocal(id) {
  contacts = contacts.filter(function (c) {
    return String(c.id) !== String(id);
  });
}
