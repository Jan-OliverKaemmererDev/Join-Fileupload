/**
 * @fileoverview WCAG Accessibility Enhancements for keyboard navigation.
 */

/**
 * Handles ESC key to close active overlays in priority order.
 * The image viewer already has its own ESC handler in board-image-viewer.js,
 * so it is checked first to avoid duplicate handling.
 */
function handleGlobalEscKey(event) {
  if (event.key !== "Escape") return;

  if (closeActiveOverlayByPriority()) {
    event.preventDefault();
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
 * Image viewer overlay check configuration
 * @returns {Object}
 */
function imgViewerOverlayCheck() {
  return {
    check: () => isOverlayActive("image-viewer-overlay"),
    close: () => {
      if (typeof closeImageViewer === "function") closeImageViewer();
    },
  };
}

/**
 * Delete confirm dialog check configuration
 * @returns {Object}
 */
function deleteConfirmCheck() {
  return {
    check: () => isDialogActive("delete-confirm-dialog"),
    close: () => {
      if (typeof closeDeleteConfirmOverlay === "function")
        closeDeleteConfirmOverlay();
    },
  };
}

/**
 * Account overlay check configuration
 * @returns {Object}
 */
function accountOverlayCheck() {
  return {
    check: () => isOverlayActive("account-overlay"),
    close: () => {
      if (typeof closeAccountOverlay === "function") closeAccountOverlay();
    },
  };
}

/**
 * Mobile edit overlay check configuration
 * @returns {Object}
 */
function mobileEditCheck() {
  return {
    check: () => isOverlayActive("mobile-edit-overlay"),
    close: () => {
      if (typeof closeMobileEditOverlay === "function")
        closeMobileEditOverlay();
    },
  };
}

/**
 * Returns high priority overlays
 * @returns {Array}
 */
function getHighPriorityOverlays() {
  return [
    imgViewerOverlayCheck(),
    deleteConfirmCheck(),
    accountOverlayCheck(),
    mobileEditCheck(),
  ];
}

/**
 * Task details check configuration
 * @returns {Object}
 */
function taskDetailsCheck() {
  return {
    check: () => isOverlayActive("task-details-overlay"),
    close: () => {
      if (typeof closeTaskDetails === "function") closeTaskDetails();
    },
  };
}

/**
 * Add task overlay check configuration
 * @returns {Object}
 */
function addTaskOverlayCheck() {
  return {
    check: () => isOverlayActive("add-task-overlay"),
    close: () => {
      if (typeof closeAddTaskOverlay === "function") closeAddTaskOverlay();
    },
  };
}

/**
 * Add contact check configuration
 * @returns {Object}
 */
function addContactCheck() {
  return {
    check: () => isOverlayActive("add-contact-overlay"),
    close: () => {
      if (typeof closeAddContactDialog === "function")
        closeAddContactDialog();
    },
  };
}

/**
 * User dropdown check configuration
 * @returns {Object}
 */
function userDropdownCheck() {
  return {
    check: () => isDropdownActive("user-dropdown"),
    close: closeUserDropdownMenu,
  };
}

/**
 * Welcome overlay check configuration
 * @returns {Object}
 */
function welcomeOverlayCheck() {
  return {
    check: () => isOverlayActive("welcome-overlay"),
    close: () => {
      if (typeof closeWelcomeOverlay === "function") closeWelcomeOverlay();
    },
  };
}

/**
 * Returns low priority overlays
 * @returns {Array}
 */
function getLowPriorityOverlays() {
  return [
    taskDetailsCheck(),
    addTaskOverlayCheck(),
    addContactCheck(),
    userDropdownCheck(),
    welcomeOverlayCheck(),
  ];
}

/**
 * Returns the ordered list of overlay checks and close functions.
 * Priority: Image Viewer > Delete Confirm > Account > Mobile Edit > Task Details > Add Task > Contact
 * @returns {Array<{check: Function, close: Function}>}
 */
function getOverlayPriorityList() {
  return getHighPriorityOverlays().concat(getLowPriorityOverlays());
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
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleRoleButtonKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target;
  if (!target) return;
  if (target.getAttribute("role") === "button" || isClickableDiv(target)) {
    event.preventDefault();
    target.click();
  }
}

/**
 * Checks if an element is a non-native clickable div with onclick and tabindex.
 * @param {HTMLElement} el - The element to check.
 * @returns {boolean}
 */
function isClickableDiv(el) {
  if (
    el.tagName === "BUTTON" ||
    el.tagName === "A" ||
    el.tagName === "INPUT" ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA"
  ) {
    return false;
  }
  return el.hasAttribute("onclick") && el.hasAttribute("tabindex");
}

/**
 * Sets up focus trapping within the currently active modal dialog.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleFocusTrap(event) {
  if (event.key !== "Tab") return;
  const activeModal = findActiveModal();
  if (!activeModal) return;
  trapFocusInElement(activeModal, event);
}

/**
 * Finds the currently active modal overlay.
 * @returns {HTMLElement|null}
 */
function findActiveModal() {
  const modalIds = getModalIds();
  for (let i = 0; i < modalIds.length; i++) {
    const el = document.getElementById(modalIds[i]);
    if (el && el.classList.contains("active")) {
      return el;
    }
  }
  return null;
}

/**
 * Returns a list of modal element IDs.
 */
function getModalIds() {
  return [
    "image-viewer-overlay",
    "delete-confirm-dialog",
    "account-overlay",
    "mobile-edit-overlay",
    "task-details-overlay",
    "add-task-overlay",
    "add-contact-overlay",
    "welcome-overlay",
  ];
}

/**
 * Handles bounds for focus trapping
 * @param {KeyboardEvent} event 
 * @param {HTMLElement} firstEl 
 * @param {HTMLElement} lastEl 
 */
function handleFocusTrapBounds(event, firstEl, lastEl) {
  if (event.shiftKey && document.activeElement === firstEl) {
    event.preventDefault();
    lastEl.focus();
  } else if (!event.shiftKey && document.activeElement === lastEl) {
    event.preventDefault();
    firstEl.focus();
  }
}

/**
 * Traps focus within a given container element.
 * @param {HTMLElement} container - The container to trap focus in.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function trapFocusInElement(container, event) {
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll(focusableSelector);
  if (focusableElements.length === 0) return;
  
  const firstEl = focusableElements[0];
  const lastEl = focusableElements[focusableElements.length - 1];
  handleFocusTrapBounds(event, firstEl, lastEl);
}

/**
 * Focuses the first focusable element within a container.
 * @param {HTMLElement} container - The container element.
 */
function focusFirstElementInContainer(container) {
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll(focusableSelector);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  } else {
    container.setAttribute("tabindex", "-1");
    container.focus();
  }
}

/**
 * Initializes a MutationObserver to automatically focus the first element
 * when a modal overlay is opened.
 */
function initModalObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(processMutation);
  });
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
    attributeOldValue: true,
  });
}

/**
 * Processes a single mutation for modal focus.
 */
function processMutation(mutation) {
  if (mutation.type !== "attributes" || mutation.attributeName !== "class")
    return;
  const target = mutation.target;
  const oldClass = mutation.oldValue || "";
  const isNowActive = target.classList.contains("active");
  const wasActive = oldClass.split(" ").includes("active");

  if (getModalIds().includes(target.id) && isNowActive && !wasActive) {
    setTimeout(() => focusFirstElementInContainer(target), 50);
  }
}

/**
 * Initializes all WCAG accessibility event listeners.
 */
function initWcagAccessibility() {
  document.addEventListener("keydown", handleGlobalEscKey);
  document.addEventListener("keydown", handleRoleButtonKeydown);
  document.addEventListener("keydown", handleFocusTrap);
  initModalObserver();
}

document.addEventListener("DOMContentLoaded", initWcagAccessibility);
