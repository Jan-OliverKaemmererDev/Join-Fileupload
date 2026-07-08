/**
 * Generiert das HTML-Template für die Sidebar im öffentlichen Modus (nicht eingeloggt)
 * @returns {string} Das HTML-Template für die öffentliche Sidebar
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
 * Generiert das HTML-Template für den mobilen Zurück-Pfeil
 * @param {string} backHref - Das Ziel der Verlinkung
 * @returns {string} Das HTML-Template für den Zurück-Pfeil
 */
function getMobileBackArrowTemplate(backHref) {
  return `
    <a href="${backHref}" class="mobile-back-arrow">
      <img src="./assets/icons/arrow-left-blue.png" alt="Back">
    </a>
  `;
}
