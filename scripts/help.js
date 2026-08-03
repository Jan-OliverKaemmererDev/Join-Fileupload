/**
 * @fileoverview Logic for the help page.
 */

/**
 * Initializes the help page and displays the user initials
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
 * Updates user initials in header
 * @param {Object} user - The user object with name property
 */
function updateHeaderInitials(user) {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement || !user) return;
  if (user.profileImageSmall && user.profileImageSmall.base64) {
    if (typeof showHeaderProfileImage === "function") {
      showHeaderProfileImage(user.profileImageSmall.base64);
    }
    return;
  }
  const initials = getInitialsFromName(user.name);
  initialsElement.textContent = initials;
}


/**
 * Generates initials from a name
 * @param {string} name - The user's full name
 * @returns {string} The generated initials
 */
function getInitialsFromName(name) {
  if (name.trim().toLowerCase() === "guest" || name.trim().toLowerCase() === "gast") return "G";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
