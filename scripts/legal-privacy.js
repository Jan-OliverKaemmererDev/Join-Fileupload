/**
 * @fileoverview Logic for rendering legal and privacy policy pages.
 */

/**
 * Initializes the Legal Notice or Privacy Policy page.
 * Distinguishes between public access (not logged in) and internal access.
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
 * Checks if the given page name is active based on the URL.
 * @param {string} pageName - The page name to check.
 * @returns {string} "active" if it matches, else "".
 */
function getActiveLegalClass(pageName) {
  return window.location.pathname.includes(pageName) ? "active" : "";
}

/**
 * Sets the view for non-logged in users or public access.
 */
function setupPublicView() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.innerHTML = getPublicSidebarTemplate(
      getActiveLegalClass("privacypolicy"),
      getActiveLegalClass("legalnotice")
    );
  }

  const headerIcons = document.getElementById("header-icons");
  if (headerIcons) {
    headerIcons.style.display = "none";
  }
}

/**
 * Displays initials for user or guest
 * @param {Object} currentUser - The current user object
 */
function displayUserOrGuestInitials(currentUser) {
  if (currentUser.isGuest) {
    if (typeof displayGuestInitials === "function") displayGuestInitials();
  } else {
    if (typeof displayUserInitials === "function")
      displayUserInitials(currentUser.name);
  }
}

/**
 * Sets the view for logged in users.
 * @param {Object} currentUser - The current user object
 */
function setupUserView(currentUser) {
  document.body.classList.add("is-logged-in");

  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.innerHTML = getUserSidebarTemplate(
      getActiveLegalClass("privacypolicy"),
      getActiveLegalClass("legalnotice")
    );
  }

  displayUserOrGuestInitials(currentUser);
}

/**
 * Configures mobile back arrow based on access context.
 * @param {boolean} isPublic - Whether public access exists
 * @param {Object|null} currentUser - The current user
 */
function setupMobileBackArrow(isPublic, currentUser) {
  const contentTitle = document.querySelector("h1");
  if (!contentTitle || contentTitle.querySelector(".mobile-back-arrow")) return;

  let backHref = isPublic || !currentUser ? "index.html" : "summaryuser.html";
  
  if (document.referrer && document.referrer.includes(window.location.host)) {
    backHref = "javascript:history.back()";
  }

  contentTitle.innerHTML += getMobileBackArrowTemplate(backHref);
}
