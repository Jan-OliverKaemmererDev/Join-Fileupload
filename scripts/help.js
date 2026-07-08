/**
 * Initialisiert die Help-Seite und zeigt die Benutzer-Initialen an
 */
function initHelp() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    updateHeaderInitials(currentUser);
  } else {
    const initialsElement = document.getElementById("user-initials");
    if (initialsElement) initialsElement.textContent = "G";
  }
}


/**
 * Aktualisiert die Benutzer-Initialen im Header
 * @param {Object} user - Das Benutzer-Objekt mit name-Eigenschaft
 */
function updateHeaderInitials(user) {
  const initialsElement = document.getElementById("user-initials");
  if (initialsElement) {
    const initials = getInitialsFromName(user.name);
    initialsElement.textContent = initials;
  }
}


/**
 * Generiert Initialen aus einem Namen
 * @param {string} name - Der vollständige Name des Benutzers
 * @returns {string} Die generierten Initialen
 */
function getInitialsFromName(name) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
