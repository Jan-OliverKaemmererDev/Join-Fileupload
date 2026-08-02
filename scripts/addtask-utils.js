/**
 * @fileoverview Utility functions for adding and managing tasks.
 */
/**
 * Sets the minimum date for the due date field to today
 */
function setMinimumDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("due-date").setAttribute("min", today);
}

/**
 * Updates user initials in header
 * @param {Object} user - The user object
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
 * @param {string} name - The full name
 * @returns {string} The generated initials
 */
function getInitialsFromName(name) {
  if (!name || typeof name !== "string") return "U";
  if (name.trim().toLowerCase() === "guest" || name.trim().toLowerCase() === "gast") return "G";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Selects a priority and updates the UI
 * @param {string} priority - The selected priority
 */
function selectPriority(priority) {
  const buttons = document.querySelectorAll(".priority-btn");
  removeActiveFromAll(buttons);
  addActiveToSelected(priority);
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Removes the active class from all buttons
 * @param {NodeList} buttons - The list of priority buttons
 */
function removeActiveFromAll(buttons) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
}

/**
 * Adds the active class to the selected priority button
 * @param {string} priority - The selected priority
 */
function addActiveToSelected(priority) {
  const selectedBtn = document.querySelector(
    '[data-priority="' + priority + '"]',
  );
  if (selectedBtn) {
    selectedBtn.classList.add("active");
    selectedPriority = priority;
  }
}

/**
 * Displays a toast message
 * @param {string} message - The message to display
 */
function showToast(message) {
  let toast = document.getElementById("toast-message");
  if (!toast) {
    toast = createToastElement();
  }
  toast.innerHTML = getToastTemplate(message);
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.classList.remove("d-none");
  hideToastAfterDelay(toast);
}

/**
 * Creates a toast element
 * @returns {HTMLElement} The created Toast element
 */
function createToastElement() {
  const toast = document.createElement("div");
  toast.id = "toast-message";
  toast.className = "toast-message d-none";
  document.body.appendChild(toast);
  return toast;
}

/**
 * Hides the toast message after a delay
 * @param {HTMLElement} toast - The toast element
 */
function hideToastAfterDelay(toast) {
  setTimeout(function () {
    toast.classList.add("d-none");
  }, 3000);
}
