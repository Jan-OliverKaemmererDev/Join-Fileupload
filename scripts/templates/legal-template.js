/**
 * @fileoverview HTML template generating functions for legal and privacy pages.
 */
/**
 * Generates the HTML template for the sidebar in public mode (not logged in)
 * @returns {string} The HTML template for the public sidebar
 */
function getPublicSidebarTemplate() {
  const isPrivacyActive = window.location.pathname.includes("privacypolicy")
    ? "active"
    : "";
  const isLegalActive = window.location.pathname.includes("legalnotice")
    ? "active"
    : "";

  return `
    <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" class="sidebar-logo"/>
    
    <div class="sidebar-content-wrapper">
    
        <div class="nav-links">
          <a href="index.html" class="login-link">
            <img src="./assets/privacy-policy-page/back-to-login.svg" alt="Log In" class="back-arrow-icon">
            <span class="login-text">Log In</span>
          </a>
        </div>
        
        <div class="legal-links">
          <a href="privacypolicy.html" class="${isPrivacyActive}">Privacy Policy</a>
          <a href="legalnotice.html" class="${isLegalActive}">Legal notice</a>
        </div>
        
    </div>
  `;
}

/**
 * Generates the HTML template for the sidebar in user mode (logged in)
 * @returns {string} The HTML template for the user sidebar
 */
function getUserSidebarTemplate() {
  const isPrivacyActive = window.location.pathname.includes("privacypolicy")
    ? "active"
    : "";
  const isLegalActive = window.location.pathname.includes("legalnotice")
    ? "active"
    : "";

  return `
    <img src="./assets/main-page/join-logo-white.svg" alt="Join Logo" />
    <div class="nav-links">
      <a href="summaryuser.html">
        <img src="./assets/summary-page/summary-icon.svg" alt="" />
        Summary
      </a>
      <a href="addtask.html">
        <img src="./assets/summary-page/add-task-icon.svg" alt="" />
        Add Task
      </a>
      <a href="board.html">
        <img src="./assets/summary-page/board-icon.svg" alt="" />
        Board
      </a>
      <a href="contacts.html">
        <img src="./assets/summary-page/contacts-icon.svg" alt="" />
        Contacts
      </a>
    </div>
    <div class="legal-links">
      <a href="privacypolicy.html" class="${isPrivacyActive}">Privacy Policy</a>
      <a href="legalnotice.html" class="${isLegalActive}">Legal notice</a>
    </div>
  `;
}

/**
 * Generates the HTML template for the mobile back arrow
 * @param {string} backHref - The target of the link
 * @returns {string} The HTML template for the back arrow
 */
function getMobileBackArrowTemplate(backHref) {
  return `
    <a href="${backHref}" class="mobile-back-arrow">
      <img src="./assets/icons/arrow-left-blue.png" alt="Back">
    </a>
  `;
}
