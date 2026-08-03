/**
 * @fileoverview Logic for handling the user dropdown menu.
 */

/**
 * Adds a help link to the dropdown if not already present (mobile only)
 * @param {HTMLElement} dropdown - The dropdown element
 */
function insertMobileHelpLink(dropdown) {
  if (window.innerWidth <= 780 && !document.getElementById("dropdown-help-link")) {
    const helpLink = document.createElement("a");
    helpLink.id = "dropdown-help-link";
    helpLink.href = "help.html";
    helpLink.textContent = "Help";
    helpLink.className = "dropdown-help-mobile";
    dropdown.insertBefore(helpLink, dropdown.firstChild);
  }
}

/**
 * Toggles the user dropdown menu. On mobile devices (≤780px) a help link is also inserted.
 */
function toggleUserMenu() {
  const dropdown = document.getElementById("user-dropdown");
  insertMobileHelpLink(dropdown);
  dropdown.classList.toggle("active");
}


/**
 * Closes dropdown menu when clicked outside
 * @param {Event} event - The click event
 */
function handleClickOutside(event) {
  const dropdown = document.getElementById("user-dropdown");
  const userInitials = document.getElementById("user-initials");
  if (
    dropdown &&
    dropdown.classList.contains("active") &&
    !userInitials.contains(event.target) &&
    !dropdown.contains(event.target)
  ) {
    dropdown.classList.remove("active");
  }
}


/**
 * Logs the user out and redirects to the login page
 */
async function handleLogout() {
  await waitForFirebase();
  await logoutUser();
  window.location.href = "index.html";
}


/**
 * Sets up the event listener for clicks outside the menu
 */
function setupClickOutsideListener() {
  document.addEventListener("click", handleClickOutside, true);
}

/**
 * Ensures dropdown is closed when returning via back button (bfcache)
 */
function setupBfCacheListener() {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      const dropdown = document.getElementById("user-dropdown");
      if (dropdown) {
        dropdown.style.transition = "none";
        dropdown.classList.remove("active");
        setTimeout(() => {
          dropdown.style.transition = "";
        }, 50);
      }
    }
  });
}

/**
 * Closes the dropdown immediately when a link inside it is clicked
 */
function setupDropdownLinksListener() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) {
    dropdown.addEventListener("click", (event) => {
      if (event.target.tagName === "A" || event.target.closest("a")) {
        dropdown.style.transition = "none";
        dropdown.classList.remove("active");
        setTimeout(() => {
          dropdown.style.transition = "";
        }, 50);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupClickOutsideListener();
  setupBfCacheListener();
  setupDropdownLinksListener();
});
