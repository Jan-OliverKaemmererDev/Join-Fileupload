/**
 * @fileoview HTML template generating functions for the account overlay.
 */
/**
 * Returns the HTML template for the account overlay
 * @returns {string} The full HTML template of the account overlay
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
 * Returns the HTML for the left side of the account dialog
 * @returns {string} HTML string with logo, title and underscore
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
 * Returns the HTML for the right side of the account dialog
 * @returns {string} HTML string with close button, avatar and form
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
 * Returns the HTML for the close button
 * @returns {string} HTML string with the X button (SVG)
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
 * Returns the HTML for the avatar area
 * @returns {string} HTML string with initials circle and camera icon
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
 * Returns the HTML for the form fields and action buttons
 * @returns {string} HTML string with name, email, phone inputs and buttons
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
 * Returns the HTML for a single input field
 * @param {string} type - The input type (text, email, tel)
 * @param {string} id - The ID of the input element
 * @param {string} iconFile - The filename of the icon
 * @returns {string} HTML string with input wrapper and icon
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
 * Returns the HTML for the action buttons (Delete/Edit/Save).
 * @returns {string} HTML string with delete and edit buttons
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
 * Returns the HTML for the Delete Confirmation Overlay.
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
