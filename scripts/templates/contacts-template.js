/**
 * Generiert das HTML-Template für ein Contact-Listen-Element
 */
function getContactItemTemplate(contact) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color};`;
  
  if (contact.profileImageSmall && contact.profileImageSmall.base64) {
    avatarInner = `<img src="${contact.profileImageSmall.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
  }

  return `
    <article class="contact-item" tabindex="0" onclick="showContactDetails('${contact.id}')" data-id="${contact.id}" onkeydown="if(event.key === 'Enter'){ showContactDetails('${contact.id}'); event.preventDefault(); }" aria-label="Show details for ${contact.name}">
      <div class="contact-avatar" style="${avatarStyle}">
        ${avatarInner}
      </div>
      <div class="contact-info-list">
        <span class="contact-name-list">${contact.name}${contact.isYou ? ' (You)' : ''}</span>
        <span class="contact-email-list">${contact.email}</span>
      </div>
    </article>
  `;
}

/**
 * --- DETAIL ANSICHT LOGIK ---
 */

function getDesktopContactDetailsTemplate(contact) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color}`;
  
  if (contact.profileImage && contact.profileImage.base64) {
    avatarInner = `<img src="${contact.profileImage.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
  }

  return `
    <header class="contact-header-details">
        <div class="contact-avatar-large" style="${avatarStyle}">
            ${avatarInner}
        </div>
        <div class="contact-name-section">
            <h1 class="contact-name-details">${contact.name}${contact.isYou ? ' (You)' : ''}</h1>
            <nav class="contact-actions" aria-label="Contact actions">
                <button class="btn-text-icon" onclick="openEditContactDialog('${contact.id}')" aria-label="Edit contact ${contact.name}">
                    <img src="./assets/icons/edit.svg" alt="Edit"> Edit
                </button>
                <button class="btn-text-icon" onclick="deleteContact('${contact.id}')" aria-label="Delete contact ${contact.name}">
                    <img src="./assets/icons/delete.svg" alt="Delete"> Delete
                </button>
            </nav>
        </div>
    </header>

    <h2 class="contact-information-header">Contact Information</h2>
    
    <section class="contact-info-details">
        <div class="info-group">
            <span class="info-label">Email</span>
            <a href="mailto:${contact.email}" target="_blank" class="contact-email-list" aria-label="Send email to ${contact.email}">${contact.email}</a>
        </div>
        <div class="info-group">
            <span class="info-label">Phone</span>
            <span>${contact.phone}</span>
        </div>
    </section>
  `;
}

function getMobileContactDetailsTemplate(contact) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color}`;
  
  if (contact.profileImage && contact.profileImage.base64) {
    avatarInner = `<img src="${contact.profileImage.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
  }

  return `
    <header class="details-header-mobile">
        <div>
            <h1>Contacts</h1>
            <p>Better with a team</p>
            <hr class="blue-line-horizontal">
        </div>
        <img src="./assets/login-screen/arrow-left.svg" class="back-arrow-mobile" onclick="closeContactDetails()" aria-label="Back to contacts list" role="button" tabindex="0" onkeydown="if(event.key === 'Enter') closeContactDetails();">
    </header>

    <div class="contact-view-title">
        <div class="initials-large" style="${avatarStyle}">
            ${avatarInner}
        </div>
        <h2 class="contact-name-large">${contact.name}${contact.isYou ? ' (You)' : ''}</h2>
    </div>

    <div class="info-headline-container">
        <span>Kontakt Information</span>
    </div>

    <span class="info-label">Email</span>
    <a href="mailto:${contact.email}" target="_blank" class="info-value-email" aria-label="Send email to ${contact.email}">${contact.email}</a>

    <span class="info-label">Phone</span>
    <span class="info-value">${contact.phone}</span>

    <div class="mobile-menu-btn" onclick="toggleContactMenu(event)" aria-label="Open contact menu" role="button" tabindex="0" onkeydown="if(event.key === 'Enter') toggleContactMenu(event);">
        <img src="./assets/icons/more_vert.svg" alt="Menu">
        <nav id="contact-menu-box" class="contact-menu-box" onclick="event.stopPropagation()" aria-label="Contact actions">
            <button class="menu-item" onclick="openEditContactDialog('${contact.id}')" aria-label="Edit contact ${contact.name}">
                <img src="./assets/icons/edit.svg" alt="Edit"> Edit
            </button>
            <button class="menu-item" onclick="deleteContact('${contact.id}'); closeContactDetails();" aria-label="Delete contact ${contact.name}">
                <img src="./assets/icons/delete.svg" alt="Delete"> Delete
            </button>
        </nav>
    </div>
  `;
}

/**
 * --- EDIT DIALOG LOGIK (Screenshot Design) ---
 */

function getDesktopEditContactTemplate(contact) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color}; margin: 0;`;
  
  if (contact.profileImage && contact.profileImage.base64) {
    avatarInner = `<img src="${contact.profileImage.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; margin: 0; position: relative; overflow: hidden;`;
  }

  return `
    <div class="slide-in-dialog active" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
      <aside class="dialog-left">
        <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" style="width: 55px; margin-bottom: 12px;">
        <h1 class="dialog-title-white" id="edit-dialog-title">Edit contact</h1>
        <hr class="blue-line-horizontal" style="width: 90px; height: 3px; background-color: #29ABE2;">
      </aside>
      
      <main class="dialog-right">
        <div class="close-btn-container">
          <button onclick="closeAddContactDialog()" class="btn-close" aria-label="Close edit contact dialog">
            <img src="./assets/icons/clear-X-icon.svg" alt="Close">
          </button>
        </div>
        
        <div class="edit-content-container">
          <div class="account-avatar-wrapper" style="margin: 0 auto; display: flex; justify-content: center; align-items: center;">
            <div class="contact-form-avatar" id="contact-initials" style="${avatarStyle} margin: 0;">
              ${avatarInner}
            </div>
            <div id="contact-camera-badge" class="account-camera-badge" style="display: flex;" role="button" tabindex="0" aria-label="Change profile picture" onkeydown="if(event.key === 'Enter') this.click();">
              <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
            </div>
          </div>
          
          <form onsubmit="saveContact(event, '${contact.id}')" class="edit-form-fields" novalidate aria-label="Edit contact form">
            <div class="input-group">
              <div class="input-wrapper">
                <input type="text" value="${contact.name}" id="edit-contact-name" placeholder="Name" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Name">
                <img src="./assets/login-screen/person.svg" class="input-icon" alt="">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="email" value="${contact.email}" id="edit-contact-email" placeholder="Email" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Email">
                <img src="./assets/login-screen/mail.svg" class="input-icon" alt="">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="tel" value="${contact.phone}" id="edit-contact-phone" placeholder="Phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Phone">
                <img src="./assets/icons/phone.svg" class="input-icon" alt="">
              </div>
            </div>
            
            <footer class="form-actions-dialog">
              <button type="button" class="btn-cancel" onclick="deleteContact('${contact.id}'); closeAddContactDialog();" aria-label="Delete contact">Delete</button>
              <button type="submit" class="btn-create-submit" id="edit-contact-submit" aria-label="Save changes">
                Save <img src="./assets/icons/check-icon.png" alt="check" style="filter: brightness(0) invert(1);">
              </button>
            </footer>
          </form>
        </div>
      </main>
    </div>
  `;
}

function getMobileEditContactTemplate(contact) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color}`;
  
  if (contact.profileImage && contact.profileImage.base64) {
    avatarInner = `<img src="${contact.profileImage.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
  }

  return `
    <div class="edit-contact-mobile-overlay" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="edit-mobile-dialog-title">
      <header class="dialog-header-blue">
        <div class="close-btn-container-mobile">
            <button onclick="closeAddContactDialog()" class="btn-close-white" aria-label="Close edit contact dialog">✕</button>
        </div>
        <h1 class="dialog-title-white" id="edit-mobile-dialog-title">Edit contact</h1>
        <hr class="blue-line-horizontal">
      </header>
      
      <main class="dialog-content-white">
        <div class="contact-form-avatar-center" style="border: none; background: transparent; overflow: visible; display: flex; justify-content: center;">
          <div class="account-avatar-wrapper" style="width: 120px; height: 120px; position: relative;">
            <div class="contact-form-avatar" id="contact-initials" style="${avatarStyle} width: 100%; height: 100%; margin: 0; position: absolute; top: 0; left: 0;">
              ${avatarInner}
            </div>
            <div id="contact-camera-badge" class="account-camera-badge" style="display: flex; z-index: 10;" role="button" tabindex="0" aria-label="Change profile picture" onkeydown="if(event.key === 'Enter') this.click();">
              <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
            </div>
          </div>
        </div>
        
        <form onsubmit="saveContact(event, '${contact.id}')" class="edit-form-mobile" novalidate aria-label="Edit contact form">
          <div class="input-group">
            <div class="input-wrapper">
              <input type="text" value="${contact.name}" id="edit-contact-name" placeholder="Name" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Name">
              <img src="./assets/login-screen/person.svg" class="input-icon" alt="">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="email" value="${contact.email}" id="edit-contact-email" placeholder="Email" oninput="checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Email">
              <img src="./assets/login-screen/mail.svg" class="input-icon" alt="">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="tel" value="${contact.phone}" id="edit-contact-phone" placeholder="Phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('edit-contact-name', 'edit-contact-email', 'edit-contact-phone', 'edit-contact-submit')" aria-label="Phone">
              <img src="./assets/icons/phone.svg" class="input-icon" alt="">
            </div>
          </div>
          
          <footer class="form-actions-mobile">
            <button type="button" class="btn-delete-outline" onclick="deleteContact('${contact.id}'); closeAddContactDialog();" aria-label="Delete contact">Delete</button>
            <button type="submit" class="btn-save-dark" id="edit-contact-submit" aria-label="Save changes">Save</button>
          </footer>
        </form>
      </main>
    </div>
  `;
}

/**
 * --- ADD CONTACT DIALOG LOGIK ---
 */

function getDesktopAddContactTemplate() {
  return `
    <div class="slide-in-dialog active" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="add-dialog-title">
      <aside class="dialog-left">
        <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" class="dialog-logo-small">
        <h1 class="dialog-title-white" id="add-dialog-title">Add contact</h1>
        <p class="dialog-subtitle-white">Tasks are better with a team!</p>
        <hr class="blue-line-horizontal">
      </aside>
      
      <main class="dialog-right">
        <div class="close-btn-container">
          <button onclick="closeAddContactDialog()" class="btn-close" aria-label="Close add contact dialog">
            <img src="./assets/icons/clear-X-icon.svg" alt="Close">
          </button>
        </div>
        
        <div class="edit-content-container">
          <div class="account-avatar-wrapper" style="margin: 0 auto; display: flex; justify-content: center; align-items: center;">
            <div class="contact-form-avatar" id="contact-initials" style="margin: 0; background-color: #d1d1d1; border: 3px solid white; box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);">
              <img src="./assets/login-screen/person.svg" alt="Default Avatar" style="width: 64px; filter: brightness(0) invert(1);">
            </div>
            <div id="contact-camera-badge" class="account-camera-badge" style="display: flex;" role="button" tabindex="0" aria-label="Add profile picture" onkeydown="if(event.key === 'Enter') this.click();">
              <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
            </div>
          </div>
          
          <form onsubmit="createContact(event)" class="edit-form-fields" novalidate aria-label="Add contact form">
            <div class="input-group">
              <div class="input-wrapper">
                <input type="text" placeholder="Name" id="new-contact-name" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Name">
                <img src="./assets/login-screen/person.svg" class="input-icon" alt="">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="email" placeholder="Email" id="new-contact-email" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Email">
                <img src="./assets/login-screen/mail.svg" class="input-icon" alt="">
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <input type="tel" placeholder="Phone" id="new-contact-phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Phone">
                <img src="./assets/icons/phone.svg" class="input-icon" alt="">
              </div>
            </div>
            
            <footer class="form-actions-dialog">
              <button type="button" class="btn-cancel" onclick="closeAddContactDialog()" aria-label="Cancel">
                Cancel <span class="cancel-x">✕</span>
              </button>
              <button type="submit" class="btn-create-submit btn-disabled" id="add-contact-submit" disabled aria-label="Create contact">
                Create contact <img src="./assets/icons/check-icon.png" alt="check" class="check-icon-white">
              </button>
            </footer>
          </form>
        </div>
      </main>
    </div>
  `;
}

function getMobileAddContactTemplate() {
  return `
    <div class="edit-contact-mobile-overlay" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="add-mobile-dialog-title">
      <header class="dialog-header-blue">
        <div class="close-btn-container-mobile">
            <button onclick="closeAddContactDialog()" class="btn-close-white" aria-label="Close add contact dialog">✕</button>
        </div>
        <h1 class="dialog-title-white" id="add-mobile-dialog-title">Add contact</h1>
        <p style="color: white; font-size: 20px; margin-top: 8px;">Tasks are better with a team!</p>
        <hr class="blue-line-horizontal">
      </header>
      
      <main class="dialog-content-white">
        <div class="contact-form-avatar-center" style="border: none; background: transparent; overflow: visible; display: flex; justify-content: center;">
          <div class="account-avatar-wrapper" style="width: 120px; height: 120px; position: relative;">
            <div class="contact-form-avatar" id="contact-initials" style="width: 100%; height: 100%; margin: 0; position: absolute; top: 0; left: 0; background-color: #D1D1D1; border: 3px solid white; box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);">
              <img src="./assets/login-screen/person.svg" alt="Default Avatar" style="width: 64px; filter: brightness(0) invert(1);">
            </div>
            <div id="contact-camera-badge" class="account-camera-badge" style="display: flex; z-index: 10;" role="button" tabindex="0" aria-label="Add profile picture" onkeydown="if(event.key === 'Enter') this.click();">
              <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
            </div>
          </div>
        </div>
        
        <form onsubmit="createContact(event)" class="edit-form-mobile" novalidate aria-label="Add contact form">
          <div class="input-group">
            <div class="input-wrapper">
              <input type="text" placeholder="Name" id="new-contact-name" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Name">
              <img src="./assets/login-screen/person.svg" class="input-icon" alt="">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="email" placeholder="Email" id="new-contact-email" oninput="checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Email">
              <img src="./assets/login-screen/mail.svg" class="input-icon" alt="">
            </div>
          </div>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="tel" placeholder="Phone" id="new-contact-phone" oninput="this.value = this.value.replace(/[^0-9]/g, ''); checkContactFormValidity('new-contact-name', 'new-contact-email', 'new-contact-phone', 'add-contact-submit')" aria-label="Phone">
              <img src="./assets/icons/phone.svg" class="input-icon" alt="">
            </div>
          </div>
          
          <footer class="form-actions-mobile">
            <button type="submit" class="btn-save-dark btn-disabled" id="add-contact-submit" style="width: 200px;" disabled aria-label="Create contact">Kontakt erstellen</button>
          </footer>
        </form>
      </main>
    </div>
  `;
}

/**
 * --- HELPER TEMPLATES ---
 */
function getContactGroupLetterTemplate(letter) {
  return `<h2 class="contact-group-letter">${letter}</h2>`;
}

function getSeparatorLineTemplate() {
  return `<hr class="separator-line" style="border: none; border-bottom: 1px solid #D1D1D1; margin: 0 24px 10px 24px;">`;
}
