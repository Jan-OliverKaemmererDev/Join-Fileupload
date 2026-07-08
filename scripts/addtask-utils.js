/**
 * Setzt das Mindestdatum für das Due-Date-Feld auf heute
 */
function setMinimumDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("due-date").setAttribute("min", today);
}

/**
 * Aktualisiert die Benutzer-Initialen im Header
 * @param {Object} user - Das Benutzer-Objekt
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
 * @param {string} name - Der vollständige Name
 * @returns {string} Die generierten Initialen
 */
function getInitialsFromName(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Wählt eine Priorität aus und aktualisiert die UI
 * @param {string} priority - Die ausgewählte Priorität
 */
function selectPriority(priority) {
  const buttons = document.querySelectorAll(".priority-btn");
  removeActiveFromAll(buttons);
  addActiveToSelected(priority);
}

/**
 * Entfernt die active-Klasse von allen Buttons
 * @param {NodeList} buttons - Die Liste der Priority-Buttons
 */
function removeActiveFromAll(buttons) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
}

/**
 * Fügt die active-Klasse zum ausgewählten Priority-Button hinzu
 * @param {string} priority - Die ausgewählte Priorität
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
 * Zeigt eine Toast-Nachricht an
 * @param {string} message - Die anzuzeigende Nachricht
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
 * Erstellt ein Toast-Element
 * @returns {HTMLElement} Das erstellte Toast-Element
 */
function createToastElement() {
  const toast = document.createElement("div");
  toast.id = "toast-message";
  toast.className = "toast-message d-none";
  document.body.appendChild(toast);
  return toast;
}

/**
 * Versteckt die Toast-Nachricht nach einer Verzögerung
 * @param {HTMLElement} toast - Das Toast-Element
 */
function hideToastAfterDelay(toast) {
  setTimeout(function () {
    toast.classList.add("d-none");
  }, 3000);
}
