/**
 * @fileoverview Utility-Funktionen für den Profilbild-Upload.
 * Beinhaltet Validierung, Komprimierung, Base64-Konvertierung,
 * Firebase-Speicherung und UI-Updates.
 */

/** Erlaubte MIME-Types für Bilddateien */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

/** Maximale Dateigröße in Bytes (2 MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Prüft, ob die ausgewählte Datei ein gültiges Bild ist.
 * @param {File} file - Die zu prüfende Datei.
 * @returns {boolean} True, wenn es ein gültiges Bildformat ist.
 */
function isValidImageFile(file) {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Validiert die Magic Bytes einer Datei asynchron.
 * @param {File} file - Die zu prüfende Datei.
 * @returns {Promise<boolean>} True, wenn Magic Bytes einem Bildformat entsprechen.
 */
async function validateImageMagicBytes(file) {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  return false;
}

/**
 * Berechnet die neuen Dimensionen unter Beibehaltung des Seitenverhältnisses.
 * @param {number} origWidth - Originalbreite.
 * @param {number} origHeight - Originalhöhe.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 * @returns {{width: number, height: number}} Die berechneten Dimensionen.
 */
function calculateDimensions(origWidth, origHeight, maxWidth, maxHeight) {
  let width = origWidth;
  let height = origHeight;
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round(width * (maxHeight / height));
    height = maxHeight;
  }
  return { width, height };
}

/**
 * Komprimiert ein Bild auf die angegebene Maximalgröße.
 * @param {File} file - Die Bilddatei.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 * @param {number} quality - JPEG-Qualität (0-1).
 * @returns {Promise<Blob>} Der komprimierte Bild-Blob.
 */
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => handleImageCompression(img, maxWidth, maxHeight, quality, resolve, reject);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Führt die eigentliche Bild-Komprimierung durch.
 * @param {HTMLImageElement} img - Das geladene Bild.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 * @param {number} quality - JPEG-Qualität.
 * @param {Function} resolve - Promise Resolve.
 * @param {Function} reject - Promise Reject.
 */
function handleImageCompression(img, maxWidth, maxHeight, quality, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight);
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Bild konnte nicht komprimiert werden."));
  }, "image/jpeg", quality);
}

/**
 * Zeichnet das Bild auf das Canvas zur Komprimierung.
 * @param {HTMLImageElement} img - Das geladene Bild.
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element.
 * @param {CanvasRenderingContext2D} ctx - Der Canvas-Kontext.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 */
function drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight) {
  const dims = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
  canvas.width = dims.width;
  canvas.height = dims.height;
  ctx.drawImage(img, 0, 0, dims.width, dims.height);
}

/**
 * Komprimiert einen Blob auf die angegebene Maximalgröße.
 * @param {Blob} blob - Der zu komprimierende Blob.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 * @param {number} quality - JPEG-Qualität (0-1).
 * @returns {Promise<Blob>} Der komprimierte Bild-Blob.
 */
function compressBlob(blob, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => handleBlobCompression(img, maxWidth, maxHeight, quality, resolve, reject);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Führt die Blob-Komprimierung durch.
 * @param {HTMLImageElement} img - Das geladene Bild.
 * @param {number} maxWidth - Maximale Breite.
 * @param {number} maxHeight - Maximale Höhe.
 * @param {number} quality - JPEG-Qualität.
 * @param {Function} resolve - Promise Resolve.
 * @param {Function} reject - Promise Reject.
 */
function handleBlobCompression(img, maxWidth, maxHeight, quality, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight);
  canvas.toBlob((newBlob) => {
    if (newBlob) resolve(newBlob);
    else reject(new Error("Bild konnte nicht komprimiert werden."));
  }, "image/jpeg", quality);
}

/**
 * Konvertiert einen Blob in einen Base64-String.
 * @param {Blob} blob - Der zu konvertierende Blob.
 * @returns {Promise<string>} Der Base64-String (inkl. Data-URL-Prefix).
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Baut das JSON-Objekt für das Profilbild.
 * @param {string} filename - Der originale Dateiname.
 * @param {string} fileType - Der MIME-Type.
 * @param {string} base64 - Der Base64-String.
 * @param {number} [size] - Die Dateigröße.
 * @returns {Object} Das Profilbild-Datenobjekt.
 */
function buildProfileImageData(filename, fileType, base64, size) {
  return { filename, fileType, base64, ...(size !== undefined && { size }) };
}

/**
 * Speichert das Profilbild in Firebase Firestore.
 * @param {Object} profileImage - Das große Profilbild-Objekt.
 * @param {Object} profileImageSmall - Das kleine Profilbild-Objekt.
 */
async function saveProfileImageToFirebase(profileImage, profileImageSmall) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isGuest) return;
  const userRef = window.fbDoc(window.firebaseDb, "users", currentUser.id);
  await window.fbUpdateDoc(userRef, { profileImage, profileImageSmall });
  updateSessionProfileImage(currentUser, profileImage, profileImageSmall);
}

/**
 * Aktualisiert die Session-Daten mit dem neuen Profilbild.
 * @param {Object} currentUser - Das aktuelle User-Objekt.
 * @param {Object} profileImage - Das große Profilbild-Objekt.
 * @param {Object} profileImageSmall - Das kleine Profilbild-Objekt.
 */
function updateSessionProfileImage(currentUser, profileImage, profileImageSmall) {
  currentUser.profileImage = profileImage;
  currentUser.profileImageSmall = profileImageSmall;
  sessionStorage.setItem("join_current_user", JSON.stringify(currentUser));
}

/**
 * Aktualisiert alle UI-Elemente mit dem neuen Profilbild.
 * @param {string} largeBase64 - Base64 des großen Bildes.
 * @param {string} smallBase64 - Base64 des kleinen Bildes.
 */
function updateProfileImageUI(largeBase64, smallBase64) {
  showAccountProfileImage(largeBase64);
  showHeaderProfileImage(smallBase64);
}

/**
 * Zeigt das Profilbild im Account-Overlay-Avatar.
 * @param {string} base64 - Base64 des Bildes.
 */
function showAccountProfileImage(base64) {
  const avatar = document.getElementById("account-initials");
  if (!avatar) return;
  const img = ensureAccountImageElement(avatar);
  img.src = base64;
  img.style.display = "block";
  hideAccountInitialsText(avatar);
}

/**
 * Stellt sicher, dass ein Image-Element im Account-Avatar existiert.
 * @param {HTMLElement} avatar - Der Avatar-Container.
 * @returns {HTMLImageElement} Das Image-Element.
 */
function ensureAccountImageElement(avatar) {
  let img = document.getElementById("account-profile-img");
  if (!img) {
    img = document.createElement("img");
    img.id = "account-profile-img";
    img.className = "account-profile-img";
    img.alt = "Profilbild";
    avatar.appendChild(img);
  }
  return img;
}

/**
 * Versteckt den Initialen-Text im Account-Avatar.
 * @param {HTMLElement} avatar - Das Avatar-Element.
 */
function hideAccountInitialsText(avatar) {
  const textNodes = avatar.childNodes;
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].nodeType === Node.TEXT_NODE) {
      textNodes[i].textContent = "";
    }
  }
}

/**
 * Zeigt das kleine Profilbild im Header.
 * @param {string} base64 - Base64 des kleinen Bildes.
 */
function showHeaderProfileImage(base64) {
  const initialsEl = document.getElementById("user-initials");
  if (!initialsEl) return;
  const img = ensureHeaderImageElement(initialsEl);
  img.src = base64;
  img.style.display = "block";
  initialsEl.style.overflow = "hidden";
  clearHeaderTextNodes(initialsEl);
}

/**
 * Stellt sicher, dass das Header-Bild-Element existiert.
 * @param {HTMLElement} initialsEl - Das Header-Initialen-Element.
 * @returns {HTMLImageElement} Das Image-Element.
 */
function ensureHeaderImageElement(initialsEl) {
  let img = initialsEl.querySelector(".header-profile-img");
  if (!img) {
    img = document.createElement("img");
    img.className = "header-profile-img";
    img.alt = "Profilbild";
    initialsEl.appendChild(img);
  }
  return img;
}

/**
 * Löscht den Text aus dem Header-Avatar.
 * @param {HTMLElement} initialsEl - Das Header-Initialen-Element.
 */
function clearHeaderTextNodes(initialsEl) {
  const textNodes = initialsEl.childNodes;
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].nodeType === Node.TEXT_NODE) {
      textNodes[i].textContent = "";
    }
  }
}

/**
 * Zeigt eine Fehlermeldung für ein ungültiges Dateiformat an.
 */
function showFileFormatError() {
  const errorMsg = ensureErrorMsgElement();
  triggerErrorMsgAnimation(errorMsg);
}

/**
 * Stellt sicher, dass das Fehler-Element existiert.
 * @returns {HTMLElement} Das Fehlermeldungs-Element.
 */
function ensureErrorMsgElement() {
  let errorMsg = document.getElementById("file-format-error");
  if (!errorMsg) {
    errorMsg = document.createElement("div");
    errorMsg.id = "file-format-error";
    errorMsg.className = "file-format-error";
    errorMsg.innerHTML = getFileFormatErrorTemplate();
    document.body.appendChild(errorMsg);
  }
  return errorMsg;
}

/**
 * Löst die Animation für die Fehlermeldung aus.
 * @param {HTMLElement} errorMsg - Das Fehlermeldungs-Element.
 */
function triggerErrorMsgAnimation(errorMsg) {
  errorMsg.classList.remove("show");
  void errorMsg.offsetWidth; // trigger reflow
  errorMsg.classList.add("show");
  if (errorMsg.timeoutId) clearTimeout(errorMsg.timeoutId);
  errorMsg.timeoutId = setTimeout(() => {
    errorMsg.classList.remove("show");
  }, 4000);
}

/**
 * Zeigt eine Fehlermeldung für eine zu große Datei an.
 */
function showFileSizeError() {
  const errorMsg = ensureSizeErrorMsgElement();
  triggerErrorMsgAnimation(errorMsg);
}

/**
 * Stellt sicher, dass das Fehler-Element für die Dateigröße existiert.
 * @returns {HTMLElement} Das Fehlermeldungs-Element.
 */
function ensureSizeErrorMsgElement() {
  let errorMsg = document.getElementById("file-size-error");
  if (!errorMsg) {
    errorMsg = document.createElement("div");
    errorMsg.id = "file-size-error";
    errorMsg.className = "file-format-error file-size-error";
    errorMsg.innerHTML = getFileSizeErrorTemplate();
    document.body.appendChild(errorMsg);
  }
  return errorMsg;
}
