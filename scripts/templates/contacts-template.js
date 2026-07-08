/**
 * Generiert das HTML-Template für ein Contact-Listen-Element
 */
function getContactItemTemplate(contact) {
  return `
    <div class="contact-item" onclick="showContactDetails(${contact.id})" data-id="${contact.id}">
      <div class="contact-avatar" style="background-color: ${contact.color};">
        ${contact.initials}
      </div>
      <div class="contact-info-list">
        <span class="contact-name-list">${contact.name}</span>
        <span class="contact-email-list">${contact.email}</span>
      </div>
    </div>
  `;
}

/**
 * --- DETAIL ANSICHT LOGIK ---
 */
function getContactDetailsTemplate(contact) {
  if (window.innerWidth <= 780) {
    return getMobileContactDetailsTemplate(contact);
  } else {
    return getDesktopContactDetailsTemplate(contact);
  }
}

function getDesktopContactDetailsTemplate(contact) {
  return `
    <div class="contact-header-details">
        <div class="contact-avatar-large" style="background-color: ${contact.color}">
            ${contact.initials}
        </div>
        <div class="contact-name-section">
            <h1 class="contact-name-details">${contact.name}</h1>
            <div class="contact-actions">
                <button class="btn-text-icon" onclick="openEditContactDialog(${contact.id})">
                    <img src="./assets/icons/edit.svg" alt="Edit"> Edit
                </button>
                <button class="btn-text-icon" onclick="deleteContact(${contact.id})">
                    <img src="./assets/icons/delete.svg" alt="Delete"> Delete
                </button>
            </div>
        </div>
    </div>

    <div class="contact-information-header">Contact Information</div>
    
    <div class="contact-info-details">
        <div class="info-group">
            <span class="info-label">Email</span>
            <a href="mailto:${contact.email}" target="_blank" class="contact-email-list">${contact.email}</a>
        </div>
        <div class="info-group">
            <span class="info-label">Phone</span>
            <span>${contact.phone}</span>
        </div>
    </div>
  `;
}

function getMobileContactDetailsTemplate(contact) {
  return `
    <div class="details-header-mobile">
        <div>
            <h1>Contacts</h1>
            <p>Better with a team</p>
            <div class="blue-line-horizontal"></div>
        </div>
        <img src="./assets/login-screen/arrow-left.svg" class="back-arrow-mobile" onclick="closeContactDetails()">
    </div>

    <div class="contact-view-title">
        <div class="initials-large" style="background-color: ${contact.color}">
            ${contact.initials}
        </div>
        <div class="contact-name-large">${contact.name}</div>
    </div>

    <div class="info-headline-container">
        <span>Kontakt Information</span>
    </div>

    <div class="info-label">Email</div>
    <a href="mailto:${contact.email}" target="_blank" class="info-value-email">${contact.email}</a>

    <div class="info-label">Phone</div>
    <div class="info-value">${contact.phone}</div>

    <div class="mobile-menu-btn" onclick="toggleContactMenu(event)">
        <img src="./assets/icons/more_vert.svg">
        <div id="contact-menu-box" class="contact-menu-box" onclick="event.stopPropagation()">
            <div class="menu-item" onclick="openEditContactDialog(${contact.id})">
                <img src="./assets/icons/edit.svg" alt="Edit"> Edit
            </div>
            <div class="menu-item" onclick="deleteContact(${contact.id}); closeContactDetails();">
                <img src="./assets/icons/delete.svg" alt="Delete"> Delete
            </div>
        </div>
    </div>
  `;
}

/**
 * --- EDIT DIALOG LOGIK (Screenshot Design) ---
 */
function getEditContactDialogTemplate(contact) {
  if (window.innerWidth <= 780) {
    return getMobileEditContactTemplate(contact);
  } else {
    return getDesktopEditContactTemplate(contact);
  }
}

function getDesktopEditContactTemplate(contact) {
  return `
    <div class="slide-in-dialog active" onclick="event.stopPropagation()">
      <div class="dialog-left">
        <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" style="width: 55px; margin-bottom: 12px;">
        <h1 class="dialog-title-white">Edit contact</h1>
        <div class="blue-line-horizontal" style="width: 90px; height: 3px; background-color: #29ABE2;"></div>
      </div>
      
      <div class="dialog-right">
        <div class="close-btn-container">
          <button onclick="closeAddContactDialog()" class="btn-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12L18 18M18 6L12 12L18 6ZM12 12L6 18L12 12ZM12 12L6 6L12 12Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="edit-content-container">
          <div class="contact-form-avatar" style="background-color: ${contact.color}; margin: 0;">
            ${contact.initials}
          </div>
          
          <form onsubmit="saveContact(event, ${contact.id})" class="edit-form-fields" novalidate>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="text" value="${contact.name}" id="edit-contact-name" placeholder="Name" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
                <img src="./assets/login-screen/person.svg" class="input-icon">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="email" value="${contact.email}" id="edit-contact-email" placeholder="Email" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
                <img src="./assets/login-screen/mail.svg" class="input-icon">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="tel" value="${contact.phone}" id="edit-contact-phone" placeholder="Phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
                <img src="./assets/icons/phone.svg" class="input-icon">
              </div>
            </div>
            
            <div class="form-actions-dialog">
              <button type="button" class="btn-cancel" onclick="deleteContact(${contact.id}); closeAddContactDialog();">Delete</button>
              <button type="submit" class="btn-create-submit" id="edit-contact-submit">
                Save <img src="./assets/icons/check-icon.png" alt="check" style="filter: brightness(0) invert(1);">
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function getMobileEditContactTemplate(contact) {
  return `
    <div class="edit-contact-mobile-overlay" onclick="event.stopPropagation()">
      <div class="dialog-header-blue">
        <div class="close-btn-container-mobile">
            <button onclick="closeAddContactDialog()" class="btn-close-white">✕</button>
        </div>
        <h1 class="dialog-title-white">Edit contact</h1>
        <div class="blue-line-horizontal"></div>
      </div>
      
      <div class="dialog-content-white">
        <div class="contact-form-avatar-center" style="background-color: ${contact.color}">
          ${contact.initials}
        </div>
        
        <form onsubmit="saveContact(event, ${contact.id})" class="edit-form-mobile" novalidate>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="text" value="${contact.name}" id="edit-contact-name" placeholder="Name" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
              <img src="./assets/login-screen/person.svg" class="input-icon">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="email" value="${contact.email}" id="edit-contact-email" placeholder="Email" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
              <img src="./assets/login-screen/mail.svg" class="input-icon">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="tel" value="${contact.phone}" id="edit-contact-phone" placeholder="Phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')">
              <img src="./assets/icons/phone.svg" class="input-icon">
            </div>
          </div>
          
          <div class="form-actions-mobile">
            <button type="button" class="btn-delete-outline" onclick="deleteContact(${contact.id}); closeAddContactDialog();">Delete</button>
            <button type="submit" class="btn-save-dark" id="edit-contact-submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * --- ADD CONTACT DIALOG LOGIK ---
 */
function getAddContactDialogTemplate() {
  if (window.innerWidth <= 780) {
    return getMobileAddContactTemplate();
  } else {
    return getDesktopAddContactTemplate();
  }
}

function getDesktopAddContactTemplate() {
  return `
    <div class="slide-in-dialog active" onclick="event.stopPropagation()">
      <div class="dialog-left">
        <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" class="dialog-logo-small">
        <h1 class="dialog-title-white">Add contact</h1>
        <p class="dialog-subtitle-white">Tasks are better with a team!</p>
        <div class="blue-line-horizontal"></div>
      </div>
      
      <div class="dialog-right">
        <div class="close-btn-container">
          <button onclick="closeAddContactDialog()" class="btn-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12L18 18M18 6L12 12L18 6ZM12 12L6 18L12 12ZM12 12L6 6L12 12Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="edit-content-container">
          <div class="contact-form-avatar-default">
            <img src="./assets/login-screen/person.svg" alt="Default Avatar">
          </div>
          
          <form onsubmit="createContact(event)" class="edit-form-fields" novalidate>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="text" placeholder="Name" id="new-contact-name" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
                <img src="./assets/login-screen/person.svg" class="input-icon">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="email" placeholder="Email" id="new-contact-email" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
                <img src="./assets/login-screen/mail.svg" class="input-icon">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="tel" placeholder="Phone" id="new-contact-phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
                <img src="./assets/icons/phone.svg" class="input-icon">
              </div>
            </div>
            
            <div class="form-actions-dialog">
              <button type="button" class="btn-cancel" onclick="closeAddContactDialog()">
                Cancel <span class="cancel-x">✕</span>
              </button>
              <button type="submit" class="btn-create-submit btn-disabled" id="add-contact-submit" disabled>
                Create contact <img src="./assets/icons/check-icon.png" alt="check" class="check-icon-white">
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function getMobileAddContactTemplate() {
  return `
    <div class="edit-contact-mobile-overlay" onclick="event.stopPropagation()">
      <div class="dialog-header-blue">
        <div class="close-btn-container-mobile">
            <button onclick="closeAddContactDialog()" class="btn-close-white">✕</button>
        </div>
        <h1 class="dialog-title-white">Add contact</h1>
        <p style="color: white; font-size: 20px; margin-top: 8px;">Tasks are better with a team!</p>
        <div class="blue-line-horizontal"></div>
      </div>
      
      <div class="dialog-content-white">
        <div class="contact-form-avatar-center" style="background-color: #D1D1D1;">
          <img src="./assets/login-screen/person.svg" alt="" style="width: 64px; height: 64px; filter: invert(1);">
        </div>
        
        <form onsubmit="createContact(event)" class="edit-form-mobile" novalidate>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="text" placeholder="Name" id="new-contact-name" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
              <img src="./assets/login-screen/person.svg" class="input-icon">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="email" placeholder="Email" id="new-contact-email" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
              <img src="./assets/login-screen/mail.svg" class="input-icon">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="tel" placeholder="Phone" id="new-contact-phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')">
              <img src="./assets/icons/phone.svg" class="input-icon">
            </div>
          </div>
          
          <div class="form-actions-mobile">
            <button type="submit" class="btn-save-dark btn-disabled" id="add-contact-submit" style="width: 200px;" disabled>Kontakt erstellen</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * --- HELPER TEMPLATES ---
 */
function getContactGroupLetterTemplate(letter) {
  return `<div class="contact-group-letter">${letter}</div>`;
}

function getSeparatorLineTemplate() {
  return `<div class="separator-line" style="border-bottom: 1px solid #D1D1D1; margin: 0 24px 10px 24px;"></div>`;
}
