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
  const { avatarInnerHtml, avatarStyle } = getContactAvatarData(contact, false);
  const content = document.getElementById("contact-details-content");
  if (window.innerWidth <= 780) {
    content.innerHTML = getMobileContactDetailsTemplate(contact, avatarInnerHtml, avatarStyle);
  } else {
    content.innerHTML = getDesktopContactDetailsTemplate(contact, avatarInnerHtml, avatarStyle);
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
