/**
 * @fileoview Logic for the side navigation menu.
 */
/**
 * Initializes the page menu and highlights the active page
 * @param {string} currentPage - The currently active page
 */
function initSideMenu(currentPage) {
  const navLinks = document.querySelectorAll(".sidebar .nav-links a");
  for (let i = 0; i < navLinks.length; i++) {
    processNavLink(navLinks[i], currentPage);
  }
}


/**
 * Handles a single navigation link
 * @param {HTMLElement} link - The link element
 * @param {string} currentPage - The currently active page
 */
function processNavLink(link, currentPage) {
  link.classList.remove("active");
  const href = link.getAttribute("href");
  if (href && href.includes(currentPage)) {
    link.classList.add("active");
  }
}


/**
 * Navigates to a specific page
 * @param {string} pageName - The name of the target page
 */
function navigateTo(pageName) {
  window.location.href = pageName;
}


/**
 * Displays user initials in header
 * @param {string} username - The username
 */
function displayUserInitials(username) {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement || !username) return;
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (currentUser && currentUser.profileImageSmall && currentUser.profileImageSmall.base64) {
    if (typeof showHeaderProfileImage === "function") {
      showHeaderProfileImage(currentUser.profileImageSmall.base64);
    }
    return;
  }
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
 * Displays the guest initials in the header
 */
function displayGuestInitials() {
  const initialsElement = document.getElementById("user-initials");
  if (!initialsElement) return;
  initialsElement.textContent = "G";
  initialsElement.classList.add("guest-avatar");
}
