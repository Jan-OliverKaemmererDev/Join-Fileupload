/**
 * @fileoverview Main application logic and initialization.
 */

/**
 * Updates logo visibility based on screen width
 * @param {HTMLElement} overlay 
 * @param {HTMLElement} logo 
 */
function updateLogoVisibility(overlay, logo) {
  if (overlay && !overlay.classList.contains("hidden") && logo) {
    if (window.innerWidth <= 780) {
      logo.src = "./assets/main-page/join-logo-white.svg";
    } else {
      logo.src = "./assets/login-screen/join-logo.png";
    }
  }
}

/**
 * Initializes the login page
 */
function initLogin() {
  const overlay = document.getElementById("welcome-overlay");
  const logo = document.getElementById("flying-logo");

  const updateLogo = () => updateLogoVisibility(overlay, logo);

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
 * Processes the login procedure
 * @param {Event} event - The submit event of the login form
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
 * Performs a guest login
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
 * Creates a resetter for login errors
 * @param {HTMLElement} errorMsg 
 * @param {HTMLElement} emailInput 
 * @param {HTMLElement} passwordInput 
 * @returns {Function}
 */
function createLoginErrorResetter(errorMsg, emailInput, passwordInput) {
  const resetError = () => {
    if (errorMsg) errorMsg.classList.add("v-none");
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
    emailInput.removeEventListener("input", resetError);
    passwordInput.removeEventListener("input", resetError);
  };
  return resetError;
}

/**
 * Shows a login error message
 * @param {string} message - The error message to display
 */
function showLoginError() {
  const errorMsg = document.getElementById("login-error");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (errorMsg) errorMsg.classList.remove("v-none");
  emailInput.classList.add("input-error");
  passwordInput.classList.add("input-error");

  const resetError = createLoginErrorResetter(errorMsg, emailInput, passwordInput);
  emailInput.addEventListener("input", resetError);
  passwordInput.addEventListener("input", resetError);
}

/**
 * Toggles the visibility of the password
 * @param {string} inputId - The ID of the password input field
 * @param {HTMLElement} iconElement - The icon element for the visibility
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
 * Fetches elements for login validation
 * @returns {Object|null} Elements or null
 */
function getLoginElements() {
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");
  const btn = document.getElementById("login-btn");
  if (!emailInput || !passInput || !btn) return null;
  return {
    email: emailInput.value.trim(), password: passInput.value, btn: btn,
    emailHint: document.getElementById("login-email-hint"),
    passHint: document.getElementById("login-pass-hint"),
    emailInput: emailInput, passInput: passInput
  };
}

/**
 * Validates login email UI
 */
function validateLoginEmailField(email, emailValid, showErrors, emailHint, emailInput) {
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
}

/**
 * Validates login password UI
 */
function validateLoginPasswordField(password, passValid, showErrors, passHint, passInput) {
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
}

/**
 * Checks the validity of the login form fields.
 * @param {boolean} showErrors - Whether to explicitly show errors.
 */
function checkLoginValidity(showErrors = false) {
  const els = getLoginElements();
  if (!els) return;

  const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(els.email);
  const passValid = els.password.length >= 6;

  validateLoginEmailField(els.email, emailValid, showErrors, els.emailHint, els.emailInput);
  validateLoginPasswordField(els.password, passValid, showErrors, els.passHint, els.passInput);

  const allValid = emailValid && passValid;
  els.btn.disabled = !allValid;
  els.btn.classList.toggle("btn-disabled", !allValid);
}

/**
 * Attaches blur validator to email field
 * @param {HTMLElement} emailInput 
 */
function attachLoginEmailBlur(emailInput) {
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

/**
 * Attaches blur validator to password field
 * @param {HTMLElement} passInput 
 */
function attachLoginPasswordBlur(passInput) {
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

document.addEventListener("DOMContentLoaded", function() {
  var emailInput = document.getElementById("email");
  var passInput = document.getElementById("password");
  if (emailInput) attachLoginEmailBlur(emailInput);
  if (passInput) attachLoginPasswordBlur(passInput);
});
