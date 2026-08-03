/**
 * @fileoverview Logic for generating and displaying user initials.
 */

/**
 * Generates initials from a name
 * @param {string} name - The full name
 * @returns {string} The generated initials
 */
function getInitialsFromName(name) {
  if (!name) return "?";
  if (name.trim().toLowerCase() === "guest" || name.trim().toLowerCase() === "gast") return "G";
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
 * Displays user initials
 * @param {string} name - The username
 */
function displayUserInitials(name) {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement || !name) return;
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (currentUser && currentUser.profileImageSmall && currentUser.profileImageSmall.base64) {
    if (typeof showHeaderProfileImage === "function") {
      showHeaderProfileImage(currentUser.profileImageSmall.base64);
    }
    return;
  }
  const initials = getInitialsFromName(name);
  initialsElement.textContent = initials;
}


/**
 * Displays the guest initials
 */
function displayGuestInitials() {
  const initialsElement = document.getElementById("user-initials");
  if (initialsElement) {
    initialsElement.textContent = "G";
  }
}


/**
 * Initializes the side menu
 * @param {string} page - The current page
 */
function initSideMenu(page) {
  console.log("Side menu initialized for page:", page);
}
