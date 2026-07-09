/**
 * Gibt das HTML-Template für das Account-Overlay zurück
 * @returns {string} Das vollständige HTML-Template des Account-Overlays
 */
function getAccountOverlayTemplate() {
  return `
    <div id="account-overlay" role="dialog" aria-modal="true" aria-label="My Account" onclick="closeAccountOverlay()">
      <div class="slide-in-dialog" id="account-dialog" onclick="event.stopPropagation()">
        ${getAccountDialogLeftHTML()}
        ${getAccountDialogRightHTML()}
      </div>
      <div class="slide-in-dialog delete-confirm-dialog" id="delete-confirm-dialog" onclick="event.stopPropagation()">
        ${getDeleteConfirmDialogHTML()}
      </div>
    </div>
  `;
}


/**
 * Gibt das HTML für die linke Seite des Account-Dialogs zurück
 * @returns {string} HTML-String mit Logo, Titel und Unterstrich
 */
function getAccountDialogLeftHTML() {
  return `
    <div class="dialog-left">
      <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" class="dialog-logo-small">
      <h1 id="account-dialog-title" class="dialog-title-white">My account</h1>
      <div class="blue-line-horizontal"></div>
    </div>
  `;
}


/**
 * Gibt das HTML für die rechte Seite des Account-Dialogs zurück
 * @returns {string} HTML-String mit Close-Button, Avatar und Formular
 */
function getAccountDialogRightHTML() {
  return `
    <div class="dialog-right">
      ${getAccountCloseButtonHTML()}
      <div class="edit-content-container">
        ${getAccountAvatarHTML()}
        ${getAccountFormFieldsHTML()}
      </div>
    </div>
  `;
}


/**
 * Gibt das HTML für den Schließen-Button zurück
 * @returns {string} HTML-String mit dem X-Button (SVG)
 */
function getAccountCloseButtonHTML() {
  return `
    <div class="close-btn-container">
      <button onclick="closeAccountOverlay()" class="btn-close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12L18 18M18 6L12 12L18 6ZM12 12L6 18L12 12ZM12 12L6 6L12 12Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
}


/**
 * Gibt das HTML für den Avatar-Bereich zurück
 * @returns {string} HTML-String mit Initialen-Kreis und Kamera-Icon
 */
function getAccountAvatarHTML() {
  return `
    <div class="account-avatar-wrapper">
      <div class="contact-form-avatar" id="account-initials" style="background-color: #d19a9a;"></div>
      <div id="account-camera-badge" class="account-camera-badge">
        <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
      </div>
    </div>
  `;
}


/**
 * Gibt das HTML für die Formularfelder und Aktions-Buttons zurück
 * @returns {string} HTML-String mit Name-, E-Mail-, Telefon-Inputs und Buttons
 */
function getAccountFormFieldsHTML() {
  return `
    <div class="edit-form-fields">
      ${getAccountInputHTML("text", "account-name", "person.svg")}
      ${getAccountInputHTML("email", "account-email", "mail.svg")}
      ${getAccountInputHTML("tel", "account-phone", "phone.svg")}
      ${getAccountActionButtonsHTML()}
    </div>
  `;
}


/**
 * Gibt das HTML für ein einzelnes Input-Feld zurück
 * @param {string} type - Der Input-Typ (text, email, tel)
 * @param {string} id - Die ID des Input-Elements
 * @param {string} iconFile - Der Dateiname des Icons
 * @returns {string} HTML-String mit Input-Wrapper und Icon
 */
function getAccountInputHTML(type, id, iconFile) {
  const iconPath = iconFile === "phone.svg"
    ? `./assets/icons/${iconFile}`
    : `./assets/login-screen/${iconFile}`;
  return `
    <div class="input-group">
      <div class="input-wrapper">
        <input type="${type}" id="${id}" value="" readonly oninput="checkAccountFormValidity()">
        <img src="${iconPath}" class="input-icon">
      </div>
      <span id="hint-${id}" class="signup-hint"></span>
    </div>
  `;
}


/**
 * Gibt das HTML für die Aktions-Buttons (Delete/Edit/Save) zurück
 * @returns {string} HTML-String mit Delete- und Edit-Button
 */
function getAccountActionButtonsHTML() {
  return `
    <div class="form-actions-dialog" style="justify-content: flex-start;">
      <button type="button" class="btn-cancel" onclick="showDeleteConfirmOverlay()">Delete my account</button>
      <button type="button" id="account-action-btn" class="btn-create-submit" onclick="toggleEditAccount()">Edit</button>
    </div>
  `;
}


/**
 * Gibt das HTML für das Delete Confirmation Overlay zurück.
 * @returns {string}
 */
function getDeleteConfirmDialogHTML() {
  return `
    <div class="close-btn-container-small">
      <button onclick="closeDeleteConfirmOverlay()" class="btn-close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12L18 18M18 6L12 12L18 6ZM12 12L6 18L12 12ZM12 12L6 6L12 12Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div class="delete-confirm-content">
      <div class="delete-icon-circle">!</div>
      <h2>Are you sure you want<br>to delete your account?</h2>
      <div class="delete-confirm-actions">
        <button class="btn-cancel" onclick="confirmDeleteAccount()">Yes</button>
        <button class="btn-create-submit" onclick="closeDeleteConfirmOverlay()">No</button>
      </div>
    </div>
  `;
}
