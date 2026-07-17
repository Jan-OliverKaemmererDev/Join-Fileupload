/**
 * @fileoverview WCAG Accessibility Enhancements
 * Adds keyboard navigation support for all interactive elements.
 * This file is purely additive and does NOT modify any existing JS logic.
 */

/**
 * Handles ESC key to close active overlays in priority order.
 * The image viewer already has its own ESC handler in board-image-viewer.js,
 * so it is checked first to avoid duplicate handling.
 */
function handleGlobalEscKey(e) {
  if (e.key !== "Escape") return;

  if (closeActiveOverlayByPriority()) {
    e.preventDefault();
  }
}

/**
 * Tries to close the topmost active overlay.
 * Returns true if an overlay was closed.
 * @returns {boolean}
 */
function closeActiveOverlayByPriority() {
  const overlayChecks = getOverlayPriorityList();
  for (let i = 0; i < overlayChecks.length; i++) {
    if (overlayChecks[i].check()) {
      overlayChecks[i].close();
      return true;
    }
  }
  return false;
}

/**
 * Returns the ordered list of overlay checks and close functions.
 * Priority: Image Viewer > Delete Confirm > Account > Mobile Edit > Task Details > Add Task > Contact
 * @returns {Array<{check: Function, close: Function}>}
 */
function getOverlayPriorityList() {
  return [
    {
      check: function () { return isOverlayActive("image-viewer-overlay"); },
      close: function () { if (typeof closeImageViewer === "function") closeImageViewer(); }
    },
    {
      check: function () { return isDialogActive("delete-confirm-dialog"); },
      close: function () { if (typeof closeDeleteConfirmOverlay === "function") closeDeleteConfirmOverlay(); }
    },
    {
      check: function () { return isOverlayActive("account-overlay"); },
      close: function () { if (typeof closeAccountOverlay === "function") closeAccountOverlay(); }
    },
    {
      check: function () { return isOverlayActive("mobile-edit-overlay"); },
      close: function () { if (typeof closeMobileEditOverlay === "function") closeMobileEditOverlay(); }
    },
    {
      check: function () { return isOverlayActive("task-details-overlay"); },
      close: function () { if (typeof closeTaskDetails === "function") closeTaskDetails(); }
    },
    {
      check: function () { return isOverlayActive("add-task-overlay"); },
      close: function () { if (typeof closeAddTaskOverlay === "function") closeAddTaskOverlay(); }
    },
    {
      check: function () { return isOverlayActive("add-contact-overlay"); },
      close: function () { if (typeof closeAddContactDialog === "function") closeAddContactDialog(); }
    },
    {
      check: function () { return isDropdownActive("user-dropdown"); },
      close: function () { closeUserDropdownMenu(); }
    },
    {
      check: function () { return isOverlayActive("welcome-overlay"); },
      close: function () { if (typeof closeWelcomeOverlay === "function") closeWelcomeOverlay(); }
    }
  ];
}

/**
 * Checks if an overlay element exists and has the "active" class.
 * @param {string} id - The element ID.
 * @returns {boolean}
 */
function isOverlayActive(id) {
  const el = document.getElementById(id);
  return el && el.classList.contains("active");
}

/**
 * Checks if a dialog element exists and has the "active" class.
 * @param {string} id - The element ID.
 * @returns {boolean}
 */
function isDialogActive(id) {
  const el = document.getElementById(id);
  return el && el.classList.contains("active");
}

/**
 * Checks if a dropdown element exists and has the "active" class.
 * @param {string} id - The element ID.
 * @returns {boolean}
 */
function isDropdownActive(id) {
  const el = document.getElementById(id);
  return el && el.classList.contains("active");
}

/**
 * Closes the user dropdown menu.
 */
function closeUserDropdownMenu() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.remove("active");
}

/**
 * Handles Enter and Space key presses on elements with role="button".
 * This allows keyboard activation of custom button elements.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleRoleButtonKeydown(e) {
  if (e.key !== "Enter" && e.key !== " ") return;
  const target = e.target;
  if (!target) return;
  if (target.getAttribute("role") === "button" || isClickableDiv(target)) {
    e.preventDefault();
    target.click();
  }
}

/**
 * Checks if an element is a non-native clickable div with onclick and tabindex.
 * @param {HTMLElement} el - The element to check.
 * @returns {boolean}
 */
function isClickableDiv(el) {
  if (el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
    return false;
  }
  return el.hasAttribute("onclick") && el.hasAttribute("tabindex");
}

/**
 * Sets up focus trapping within the currently active modal dialog.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleFocusTrap(e) {
  if (e.key !== "Tab") return;
  const activeModal = findActiveModal();
  if (!activeModal) return;
  trapFocusInElement(activeModal, e);
}

/**
 * Finds the currently active modal overlay.
 * @returns {HTMLElement|null}
 */
function findActiveModal() {
  const modalIds = [
    "image-viewer-overlay",
    "delete-confirm-dialog",
    "account-overlay",
    "mobile-edit-overlay",
    "task-details-overlay",
    "add-task-overlay",
    "add-contact-overlay",
    "welcome-overlay"
  ];
  for (let i = 0; i < modalIds.length; i++) {
    const el = document.getElementById(modalIds[i]);
    if (el && el.classList.contains("active")) {
      return el;
    }
  }
  return null;
}

/**
 * Traps focus within a given container element.
 * @param {HTMLElement} container - The container to trap focus in.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function trapFocusInElement(container, e) {
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll(focusableSelector);
  if (focusableElements.length === 0) return;
  const firstEl = focusableElements[0];
  const lastEl = focusableElements[focusableElements.length - 1];
  if (e.shiftKey && document.activeElement === firstEl) {
    e.preventDefault();
    lastEl.focus();
  } else if (!e.shiftKey && document.activeElement === lastEl) {
    e.preventDefault();
    firstEl.focus();
  }
}

/**
 * Initializes all WCAG accessibility event listeners.
 */
function initWcagAccessibility() {
  document.addEventListener("keydown", handleGlobalEscKey);
  document.addEventListener("keydown", handleRoleButtonKeydown);
  document.addEventListener("keydown", handleFocusTrap);
}

document.addEventListener("DOMContentLoaded", initWcagAccessibility);
