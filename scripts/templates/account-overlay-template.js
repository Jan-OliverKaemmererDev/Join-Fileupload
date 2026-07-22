/**
 * Gibt das HTML-Template für das Account-Overlay zurück
 * @returns {string} Das vollständige HTML-Template des Account-Overlays
 */
function getAccountOverlayTemplate() {
  return `
    <section id="account-overlay" role="dialog" aria-modal="true" aria-label="My Account" onclick="closeAccountOverlay()">
      <article class="slide-in-dialog" id="account-dialog" onclick="event.stopPropagation()">
        ${getAccountDialogLeftHTML()}
        ${getAccountDialogRightHTML()}
      </article>
      <article class="slide-in-dialog delete-confirm-dialog" id="delete-confirm-dialog" onclick="event.stopPropagation()">
        ${getDeleteConfirmDialogHTML()}
      </article>
    </section>
  `;
}


/**
 * Gibt das HTML für die linke Seite des Account-Dialogs zurück
 * @returns {string} HTML-String mit Logo, Titel und Unterstrich
 */
function getAccountDialogLeftHTML() {
  return `
    <header class="dialog-left">
      <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" class="dialog-logo-small">
      <h1 id="account-dialog-title" class="dialog-title-white">My account</h1>
      <hr class="blue-line-horizontal">
    </header>
  `;
}


/**
 * Gibt das HTML für die rechte Seite des Account-Dialogs zurück
 * @returns {string} HTML-String mit Close-Button, Avatar und Formular
 */
function getAccountDialogRightHTML() {
  return `
    <section class="dialog-right">
      ${getAccountCloseButtonHTML()}
      <div class="edit-content-container">
        ${getAccountAvatarHTML()}
        ${getAccountFormFieldsHTML()}
      </div>
    </section>
  `;
}


/**
 * Gibt das HTML für den Schließen-Button zurück
 * @returns {string} HTML-String mit dem X-Button (SVG)
 */
function getAccountCloseButtonHTML() {
  return `
    <nav class="close-btn-container">
      <button onclick="closeAccountOverlay()" class="btn-close" aria-label="Close My Account overlay">
        <img src="./assets/icons/clear-X-icon.svg" alt="Close">
      </button>
    </nav>
  `;
}


/**
 * Gibt das HTML für den Avatar-Bereich zurück
 * @returns {string} HTML-String mit Initialen-Kreis und Kamera-Icon
 */
function getAccountAvatarHTML() {
  return `
    <figure class="account-avatar-wrapper">
      <span class="contact-form-avatar" id="account-initials" style="background-color: #d19a9a;">
        <img id="account-profile-img" class="account-profile-img" alt="Profilbild" style="display: none;">
      </span>
      <span id="account-camera-badge" class="account-camera-badge" tabindex="0" role="button" aria-label="Change profile picture">
        <img class="account-camera-icon" src="./assets/icons/camera.svg" alt="Change photo">
      </span>
    </figure>
  `;
}


/**
 * Gibt das HTML für die Formularfelder und Aktions-Buttons zurück
 * @returns {string} HTML-String mit Name-, E-Mail-, Telefon-Inputs und Buttons
 */
function getAccountFormFieldsHTML() {
  return `
    <form class="edit-form-fields" onsubmit="event.preventDefault();">
      ${getAccountInputHTML("text", "account-name", "person.svg")}
      ${getAccountInputHTML("email", "account-email", "mail.svg")}
      ${getAccountInputHTML("tel", "account-phone", "phone.svg")}
      ${getAccountActionButtonsHTML()}
    </form>
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
      <span class="input-wrapper">
        <input type="${type}" id="${id}" value="" readonly aria-label="${id}" oninput="checkAccountFormValidity()">
        <img src="${iconPath}" class="input-icon" alt="">
      </span>
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
    <nav class="close-btn-container-small">
      <button onclick="closeDeleteConfirmOverlay()" class="btn-close" aria-label="Close confirmation dialog">
        <img src="./assets/icons/clear-X-icon.svg" alt="Close">
      </button>
    </nav>
    <section class="delete-confirm-content">
      <span class="delete-icon-circle">!</span>
      <h2>Are you sure you want<br>to delete your account?</h2>
      <div class="delete-confirm-actions">
        <button class="btn-cancel" onclick="confirmDeleteAccount()">Yes</button>
        <button class="btn-create-submit" onclick="closeDeleteConfirmOverlay()">No</button>
      </div>
    </section>
  `;
}
