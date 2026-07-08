/**
 * Initialisiert das Seitenmenü und markiert die aktive Seite
 * @param {string} currentPage - Die aktuell aktive Seite
 */
function initSideMenu(currentPage) {
  const navLinks = document.querySelectorAll(".sidebar .nav-links a");
  for (let i = 0; i < navLinks.length; i++) {
    processNavLink(navLinks[i], currentPage);
  }
}


/**
 * Verarbeitet einen einzelnen Navigationslink
 * @param {HTMLElement} link - Das Link-Element
 * @param {string} currentPage - Die aktuell aktive Seite
 */
function processNavLink(link, currentPage) {
  link.classList.remove("active");
  const href = link.getAttribute("href");
  if (href && href.includes(currentPage)) {
    link.classList.add("active");
  }
}


/**
 * Navigiert zu einer bestimmten Seite
 * @param {string} pageName - Der Name der Zielseite
 */
function navigateTo(pageName) {
  window.location.href = pageName;
}


/**
 * Zeigt die Benutzer-Initialen im Header an
 * @param {string} username - Der Benutzername
 */
function displayUserInitials(username) {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement || !username) return;
  const nameParts = username.trim().split(" ");
  let initials = "";
  if (nameParts.length >= 2) {
    initials = nameParts[0][0] + nameParts[1][0];
  } else if (nameParts.length === 1) {
    initials = nameParts[0][0];
  }
  initialsElement.textContent = initials.toUpperCase();
}


/**
 * Zeigt die Gast-Initialen im Header an
 */
function displayGuestInitials() {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement) return;
  initialsElement.textContent = "G";
  initialsElement.classList.add("guest-avatar");
}
