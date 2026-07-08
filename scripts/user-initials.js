/**
 * Generiert Initialen aus einem Namen
 * @param {string} name - Der vollständige Name
 * @returns {string} Die generierten Initialen
 */
function getInitialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  }
}


/**
 * Aktualisiert die Benutzer-Initialen im Header
 * @param {Object} user - Das Benutzer-Objekt mit name-Eigenschaft
 */
function updateHeaderInitials(user) {
  const initialsElement = document.getElementById("user-initials");
  if (initialsElement && user) {
    const initials = getInitialsFromName(user.name);
    initialsElement.textContent = initials;
  }
}


/**
 * Zeigt die Benutzer-Initialen an
 * @param {string} name - Der Benutzername
 */
function displayUserInitials(name) {
  const initialsElement = document.getElementById("user-initials");
  if (initialsElement && name) {
    const initials = getInitialsFromName(name);
    initialsElement.textContent = initials;
  }
}


/**
 * Zeigt die Gast-Initialen an
 */
function displayGuestInitials() {
  const initialsElement = document.getElementById("user-initials");
  if (initialsElement) {
    initialsElement.textContent = "G";
  }
}


/**
 * Initialisiert das Seitenmenü
 * @param {string} page - Die aktuelle Seite
 */
function initSideMenu(page) {
  console.log("Side menu initialized for page:", page);
}
