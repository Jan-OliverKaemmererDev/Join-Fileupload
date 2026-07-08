/**
 * Initialisiert die Login-Seite
 */
function initLogin() {
  const overlay = document.getElementById("welcome-overlay");
  const logo = document.getElementById("flying-logo");
  if (overlay && !overlay.classList.contains("hidden") && logo) {
    if (window.innerWidth <= 780) {
      logo.src = "./assets/main-page/join-logo-white.svg";
    }
  }
}

/**
 * Closes the welcome overlay
 */
function closeWelcomeOverlay() {
  const overlay = document.getElementById("welcome-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    const logo = document.getElementById("flying-logo");
    if (logo) {
      logo.src = "./assets/login-screen/join-logo.png";
    }
  }
}

/**
 * Verarbeitet den Login-Vorgang
 * @param {Event} event - Das Submit-Event des Login-Formulars
 */
async function handleLogin(event) {
  event.preventDefault();
  await waitForFirebase();
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const result = await loginUser(emailInput.value, passwordInput.value);
  if (result.success) {
    window.location.href = "summaryuser.html";
  } else {
    showLoginError();
  }
}

/**
 * Führt einen Gast-Login durch
 */
async function guestLogin() {
  await waitForFirebase();
  const result = await guestLoginUser();
  if (result.success) {
    window.location.href = "summaryguest.html";
  } else {
    showLoginError(result.message);
  }
}

/**
 * Zeigt eine Login-Fehlermeldung an
 * @param {string} message - Die anzuzeigende Fehlermeldung
 */
function showLoginError() {
  const errorMsg = document.getElementById("login-error");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (errorMsg) {
    errorMsg.classList.remove("v-none");
  }

  emailInput.classList.add("input-error");
  passwordInput.classList.add("input-error");

  const resetError = () => {
    if (errorMsg) errorMsg.classList.add("v-none");
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
    emailInput.removeEventListener("input", resetError);
    passwordInput.removeEventListener("input", resetError);
  };

  emailInput.addEventListener("input", resetError);
  passwordInput.addEventListener("input", resetError);
}

/**
 * Schaltet die Sichtbarkeit des Passworts um
 * @param {string} inputId - Die ID des Passwort-Input-Feldes
 * @param {HTMLElement} iconElement - Das Icon-Element für die Sichtbarkeit
 */
function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    iconElement.src = "./assets/login-screen/visibility.svg";
  } else {
    input.type = "password";
    iconElement.src = "./assets/login-screen/visibility_off.svg";
  }
}

/**
 * Initialisiert die Summary-Seite für angemeldete Benutzer
 */
function initSummary() {
  initSideMenu("summary");
  const currentUser = getCurrentUser();
  if (currentUser) {
    displayUserInitials(currentUser.name);
  } else {
    window.location.href = "index.html";
  }
}

/**
 * Initialisiert die Summary-Seite für Gast-Benutzer
 */
async function initSummaryGuest() {
  await waitForFirebase();
  initSideMenu("summary");
  displayGuestInitials();
  updateGreeting();

  const currentUser = getCurrentUser();
  if (currentUser) {
    await updateTaskMetrics(currentUser);
  }

  checkMobileGreeting();
}
