/**
 * Initialisiert die Legal Notice oder Privacy Policy Seite.
 * Unterscheidet zwischen öffentlichem Zugriff (nicht eingeloggt) und internem Zugriff.
 */
function initLegalPrivacy() {
  const urlParams = new URLSearchParams(window.location.search);
  const isPublic = urlParams.get("public") === "true";
  const currentUser =
    typeof getCurrentUser === "function" ? getCurrentUser() : null;

  if (isPublic || !currentUser) {
    setupPublicView();
  } else {
    setupUserView(currentUser);
  }

  setupMobileBackArrow(isPublic, currentUser);
}

/**
 * Setzt die Ansicht für nicht eingeloggte Nutzer oder öffentlichen Zugriff.
 */
function setupPublicView() {
  const sidebar = document.querySelector(".sidebar");
  const headerIcons = document.getElementById("header-icons");

  if (sidebar) {
    sidebar.innerHTML = getPublicSidebarTemplate();
  }

  if (headerIcons) {
    headerIcons.style.display = "none";
  }
}

/**
 * Setzt die Ansicht für eingeloggte Nutzer.
 * @param {Object} currentUser - Das aktuelle Nutzer-Objekt
 */
function setupUserView(currentUser) {
  document.body.classList.add("is-logged-in");

  if (currentUser.isGuest) {
    if (typeof displayGuestInitials === "function") displayGuestInitials();
  } else {
    if (typeof displayUserInitials === "function")
      displayUserInitials(currentUser.name);
  }
}

/**
 * Konfiguriert den mobilen Zurück-Pfeil basierend auf dem Zugriffskontext.
 * @param {boolean} isPublic - Ob öffentlicher Zugriff besteht
 * @param {Object|null} currentUser - Der aktuelle Nutzer
 */
function setupMobileBackArrow(isPublic, currentUser) {
  const contentTitle = document.querySelector("h1");
  if (!contentTitle || contentTitle.querySelector(".mobile-back-arrow")) return;

  const backHref = isPublic || !currentUser ? "index.html" : "summaryuser.html";
  contentTitle.innerHTML += getMobileBackArrowTemplate(backHref);
}
