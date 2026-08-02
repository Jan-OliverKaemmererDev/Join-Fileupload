/**
 * @fileoverview Main application logic and initialization.
 */
/**
 * Initialisiert die Login-Seite
 */
function initLogin() {
  const overlay = document.getElementById("welcome-overlay");
  const logo = document.getElementById("flying-logo");

  const updateLogo = () => {
    if (overlay && !overlay.classList.contains("hidden") && logo) {
      if (window.innerWidth <= 780) {
        logo.src = "./assets/main-page/join-logo-white.svg";
      } else {
        logo.src = "./assets/login-screen/join-logo.png";
      }
    }
  };

  updateLogo();
  window.addEventListener("resize", updateLogo);
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
    if (typeof updateTaskMetrics === "function") {
      await updateTaskMetrics(currentUser);
    } else if (typeof renderTaskMetrics === "function") {
      renderTaskMetrics();
    }
  }

  checkMobileGreeting();
}

/**
 * Checks the validity of the login form fields.
 * @param {boolean} showErrors - Whether to explicitly show errors.
 */
function checkLoginValidity(showErrors = false) {
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  var btn = document.getElementById("login-btn");
  var emailHint = document.getElementById("login-email-hint");
  var passHint = document.getElementById("login-pass-hint");
  var emailInput = document.getElementById("email");
  var passInput = document.getElementById("password");

  if (!emailInput || !passInput || !btn) return;

  var emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(email);
  var passValid = password.length >= 6;

  if (showErrors || emailValid || email.length === 0) {
    if (email.length > 0 && !emailValid) {
      emailHint.textContent = "Bitte eine gültige E-Mail-Adresse eingeben.";
      emailHint.style.display = "block";
      emailInput.classList.add("input-error");
    } else {
      emailHint.style.display = "none";
      emailInput.classList.remove("input-error");
    }
  }

  if (showErrors || passValid || password.length === 0) {
    if (password.length > 0 && !passValid) {
      passHint.textContent = "Das Passwort muss mindestens 6 Zeichen lang sein.";
      passHint.style.display = "block";
      passInput.classList.add("input-error");
    } else {
      passHint.style.display = "none";
      passInput.classList.remove("input-error");
    }
  }

  var allValid = emailValid && passValid;
  btn.disabled = !allValid;
  btn.classList.toggle("btn-disabled", !allValid);
}

document.addEventListener("DOMContentLoaded", function() {
  var emailInput = document.getElementById("email");
  var passInput = document.getElementById("password");
  if (emailInput) {
    emailInput.addEventListener("blur", function() {
      var email = emailInput.value.trim();
      if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        var emailHint = document.getElementById("login-email-hint");
        if (emailHint) {
          emailHint.textContent = "Bitte eine gültige E-Mail-Adresse eingeben.";
          emailHint.style.display = "block";
        }
        emailInput.classList.add("input-error");
      }
    });
  }
  if (passInput) {
    passInput.addEventListener("blur", function() {
      var password = passInput.value;
      if (password.length > 0 && password.length < 6) {
        var passHint = document.getElementById("login-pass-hint");
        if (passHint) {
          passHint.textContent = "Das Passwort muss mindestens 6 Zeichen lang sein.";
          passHint.style.display = "block";
        }
        passInput.classList.add("input-error");
      }
    });
  }
});
