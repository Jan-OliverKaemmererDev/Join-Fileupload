/**
 * @fileoverview Profilbild-Upload Logik.
 * Erstellt einen versteckten Filepicker, validiert Bilder,
 * komprimiert sie und speichert sie als Base64 in Firebase.
 */


/** Erlaubte MIME-Types für Bilddateien */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Maximale Dateigröße in Bytes (2 MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Referenz auf den versteckten File-Input */
let fileInput = null;

/** Globale Variablen für verzögertes Speichern und Verschieben */
let pendingProfileImageFile = null;
let currentOffsetY = 0;
let isPanning = false;
let startY = 0;
let baseOffsetY = 0;
let originalImageWidth = 0;
let originalImageHeight = 0;
let previewImgElement = null;


/**
 * Initialisiert den File-Upload: erstellt den versteckten Input
 * und bindet den Klick-Handler an den Camera-Badge.
 */
function initFileUpload() {
  createHiddenFileInput();
  bindCameraBadgeClick();
}


/**
 * Erstellt einen versteckten File-Input im DOM.
 */
function createHiddenFileInput() {
  if (document.getElementById("profile-file-input")) return;
  fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "profile-file-input";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", handleFileSelected);
  document.body.appendChild(fileInput);
}


/**
 * Bindet den Klick-Handler an den Camera-Badge.
 * Wird per MutationObserver erneut gebunden, falls das Overlay
 * nachträglich ins DOM eingefügt wird.
 */
function bindCameraBadgeClick() {
  const badge = document.getElementById("account-camera-badge");
  if (badge) {
    badge.addEventListener("click", openFilePicker);
  }
}


/**
 * Öffnet den nativen Filepicker.
 */
function openFilePicker() {
  if (!fileInput) createHiddenFileInput();
  fileInput.value = "";
  fileInput.click();
}


/**
 * Wird aufgerufen, wenn der User eine Datei ausgewählt hat.
 * @param {Event} event - Das Change-Event des File-Inputs
 */
async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!isValidImageFile(file)) {
    alert("Bitte wähle eine gültige Bilddatei (JPEG, PNG, GIF oder WebP).");
    return;
  }
  
  const isValid = await validateImageMagicBytes(file);
  if (!isValid) {
    alert("Die Datei scheint kein gültiges Bild zu sein.");
    return;
  }

  // Bild als Vorschau laden und Verschieben aktivieren
  pendingProfileImageFile = file;
  currentOffsetY = 0;
  baseOffsetY = 0;
  
  const objectUrl = URL.createObjectURL(file);
  enableImagePanning(objectUrl);
}

/**
 * Aktiviert das Verschieben des Bildes im Avatar-Kreis.
 */
function enableImagePanning(src) {
  const avatarContainer = document.getElementById("account-initials");
  if (!avatarContainer) return;
  
  // Bild-Element erstellen oder aktualisieren
  avatarContainer.innerHTML = "";
  previewImgElement = document.createElement("img");
  previewImgElement.src = src;
  previewImgElement.classList.add("account-profile-img", "panning-active");
  
  // Verhindert das Standard-Drag-Verhalten des Browsers
  previewImgElement.ondragstart = () => false;
  
  avatarContainer.appendChild(previewImgElement);
  
  // Warten bis das Bild geladen ist, um Dimensionen zu berechnen
  previewImgElement.onload = function() {
    originalImageWidth = previewImgElement.naturalWidth;
    originalImageHeight = previewImgElement.naturalHeight;
    
    const containerWidth = avatarContainer.clientWidth || 120;
    const containerHeight = avatarContainer.clientHeight || 120;
    
    const scale = Math.max(containerWidth / originalImageWidth, containerHeight / originalImageHeight);
    const scaledWidth = originalImageWidth * scale;
    const scaledHeight = originalImageHeight * scale;
    
    previewImgElement.style.width = scaledWidth + "px";
    previewImgElement.style.height = scaledHeight + "px";
    previewImgElement.style.top = "0px";
    
    // Horizontal zentrieren bei Querformat
    if (scaledWidth > containerWidth) {
      previewImgElement.style.left = -(scaledWidth - containerWidth) / 2 + "px";
    } else {
      previewImgElement.style.left = "0px";
    }
    
    // Speichere den Scale-Faktor für den Crop
    previewImgElement.dataset.scale = scale;
  };

  // Event Listener für Maus und Touch
  previewImgElement.addEventListener("mousedown", handleDragStart);
  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);

  previewImgElement.addEventListener("touchstart", handleDragStart, {passive: false});
  document.addEventListener("touchmove", handleDragMove, {passive: false});
  document.addEventListener("touchend", handleDragEnd);
}

function handleDragStart(e) {
  if (!pendingProfileImageFile) return;
  isPanning = true;
  startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  baseOffsetY = currentOffsetY;
  previewImgElement.style.cursor = "grabbing";
  e.preventDefault();
}

function handleDragMove(e) {
  if (!isPanning || !pendingProfileImageFile || !previewImgElement) return;
  
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  const deltaY = clientY - startY;
  
  // Berechne neue Verschiebung
  let newOffsetY = baseOffsetY + deltaY;
  
  // Begrenzung berechnen
  const scale = parseFloat(previewImgElement.dataset.scale) || 1;
  const scaledHeight = originalImageHeight * scale;
  const containerHeight = previewImgElement.parentElement.clientHeight || 120;
  
  // Maximaler negativer Offset
  const minOffset = containerHeight - scaledHeight;
  
  if (minOffset >= 0) {
    // Bild ist quadratisch oder querformat, kann nicht vertikal verschoben werden
    newOffsetY = 0;
  } else {
    // Begrenze zwischen minOffset und 0
    if (newOffsetY > 0) newOffsetY = 0;
    if (newOffsetY < minOffset) newOffsetY = minOffset;
  }
  
  currentOffsetY = newOffsetY;
  previewImgElement.style.top = currentOffsetY + "px";
  e.preventDefault();
}

function handleDragEnd() {
  if (isPanning && previewImgElement) {
    isPanning = false;
    previewImgElement.style.cursor = "grab";
  }
}

/**
 * Gibt zurück, ob ein Profilbild zum Speichern bereitliegt.
 */
function hasPendingProfileImage() {
  return pendingProfileImageFile !== null;
}

/**
 * Bricht den anstehenden Bild-Upload ab und setzt den State zurück.
 */
function cancelPendingProfileImage() {
  pendingProfileImageFile = null;
  currentOffsetY = 0;
  baseOffsetY = 0;
  if (previewImgElement) {
    previewImgElement.remove();
    previewImgElement = null;
  }
}

/**
 * Schneidet das verschobene Bild aus, komprimiert es und lädt es hoch.
 */
async function processPendingProfileImage() {
  if (!pendingProfileImageFile) return;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async function() {
      const scale = parseFloat(previewImgElement.dataset.scale) || 1;
      const containerWidth = previewImgElement ? previewImgElement.parentElement.clientWidth : 120;
      
      // Umrechnung von DOM-Offset zu Original-Pixeln
      const cropY = Math.abs(currentOffsetY) / scale;
      let cropX = 0;
      
      // Falls das Bild horizontal zentriert wurde (Querformat)
      const scaledWidth = originalImageWidth * scale;
      if (scaledWidth > containerWidth) {
        cropX = ((scaledWidth - containerWidth) / 2) / scale;
      }
      
      // Ziel ist ein quadratischer Crop, basierend auf der Container-Größe
      const cropSize = containerWidth / scale;
      
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(cropSize, originalImageWidth);
      canvas.height = Math.min(cropSize, originalImageHeight);
      const ctx = canvas.getContext("2d");
      
      // Zeichne den Ausschnitt (sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)
      ctx.drawImage(img, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async function(blob) {
        if (!blob) {
          reject(new Error("Konnte das Bild nicht zuschneiden."));
          return;
        }
        // Der Blob entspricht dem abgeschnittenen Originalbild (jetzt 1:1)
        // Jetzt normal komprimieren in groß (800x800) und klein (100x100)
        try {
          const largeBlob = await compressBlob(blob, 800, 800, 0.8);
          const smallBlob = await compressBlob(blob, 100, 100, 0.6);
          
          const largeBase64 = await blobToBase64(largeBlob);
          const smallBase64 = await blobToBase64(smallBlob);
          
          const profileImage = buildProfileImageData(pendingProfileImageFile.name, largeBlob.type, largeBase64);
          const profileImageSmall = buildProfileImageData(pendingProfileImageFile.name, smallBlob.type, smallBase64);
          
          await saveProfileImageToFirebase(profileImage, profileImageSmall);
          updateProfileImageUI(largeBase64, smallBase64);
          
          // State aufräumen
          pendingProfileImageFile = null;
          resolve();
        } catch(e) {
          reject(e);
        }
      }, pendingProfileImageFile.type, 1.0);
    };
    img.src = URL.createObjectURL(pendingProfileImageFile);
  });
}

/**
 * Hilfsfunktion um einen Blob zu komprimieren.
 */
function compressBlob(blob, maxWidth, maxHeight, quality) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      const dimensions = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      canvas.toBlob(function (newBlob) {
        if (newBlob) {
          resolve(newBlob);
        } else {
          reject(new Error("Bild konnte nicht komprimiert werden."));
        }
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}


/**
 * Prüft, ob die ausgewählte Datei ein gültiges Bild ist.
 * @param {File} file - Die zu prüfende Datei
 * @returns {boolean} true wenn gültiges Bildformat
 */
function isValidImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return false;
  }
  return true;
}


/**
 * Validiert die Magic Bytes einer Datei asynchron.
 * @param {File} file - Die zu prüfende Datei
 * @returns {Promise<boolean>} true wenn Magic Bytes einem Bildformat entsprechen
 */
async function validateImageMagicBytes(file) {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  return false;
}


/**
 * Verarbeitet das Bild: komprimiert es in zwei Größen und speichert es.
 * @param {File} file - Die ausgewählte Bilddatei
 */
async function processAndUploadImage(file) {
  const isValid = await validateImageMagicBytes(file);
  if (!isValid) {
    alert("Die Datei scheint kein gültiges Bild zu sein.");
    return;
  }
  const largeBlob = await compressImage(file, 800, 800, 0.8);
  const smallBlob = await compressImage(file, 100, 100, 0.6);
  const largeBase64 = await blobToBase64(largeBlob);
  const smallBase64 = await blobToBase64(smallBlob);
  const profileImage = buildProfileImageData(file.name, largeBlob.type, largeBase64);
  const profileImageSmall = buildProfileImageData(file.name, smallBlob.type, smallBase64);
  await saveProfileImageToFirebase(profileImage, profileImageSmall);
  updateProfileImageUI(largeBase64, smallBase64);
}


/**
 * Komprimiert ein Bild auf die angegebene Maximalgröße.
 * @param {File} file - Die Bilddatei
 * @param {number} maxWidth - Maximale Breite in Pixeln
 * @param {number} maxHeight - Maximale Höhe in Pixeln
 * @param {number} quality - JPEG-Qualität (0-1)
 * @returns {Promise<Blob>} Der komprimierte Bild-Blob
 */
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      const dimensions = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      canvas.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Bild konnte nicht komprimiert werden."));
        }
      }, "image/jpeg", quality);
    };
    img.onerror = function () {
      reject(new Error("Bild konnte nicht geladen werden."));
    };
    img.src = URL.createObjectURL(file);
  });
}


/**
 * Berechnet die neuen Dimensionen unter Beibehaltung des Seitenverhältnisses.
 * @param {number} origWidth - Originalbreite
 * @param {number} origHeight - Originalhöhe
 * @param {number} maxWidth - Maximale Breite
 * @param {number} maxHeight - Maximale Höhe
 * @returns {{width: number, height: number}} Die berechneten Dimensionen
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
  return { width: width, height: height };
}


/**
 * Konvertiert einen Blob in einen Base64-String.
 * @param {Blob} blob - Der zu konvertierende Blob
 * @returns {Promise<string>} Der Base64-String (inkl. Data-URL-Prefix)
 */
function blobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onloadend = function () {
      resolve(reader.result);
    };
    reader.onerror = function () {
      reject(new Error("Datei konnte nicht gelesen werden."));
    };
    reader.readAsDataURL(blob);
  });
}


/**
 * Baut das JSON-Objekt für das Profilbild.
 * @param {string} filename - Der originale Dateiname
 * @param {string} fileType - Der MIME-Type des Blobs
 * @param {string} base64 - Der Base64-String
 * @returns {Object} Das Profilbild-Datenobjekt
 */
function buildProfileImageData(filename, fileType, base64) {
  return {
    filename: filename,
    fileType: fileType,
    base64: base64
  };
}


/**
 * Speichert das Profilbild in Firebase Firestore.
 * @param {Object} profileImage - Das große Profilbild-Objekt
 * @param {Object} profileImageSmall - Das kleine Profilbild-Objekt
 */
async function saveProfileImageToFirebase(profileImage, profileImageSmall) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isGuest) return;
  const userRef = window.fbDoc(window.firebaseDb, "users", currentUser.id);
  await window.fbUpdateDoc(userRef, {
    profileImage: profileImage,
    profileImageSmall: profileImageSmall
  });
  updateSessionProfileImage(currentUser, profileImage, profileImageSmall);
}


/**
 * Aktualisiert die Session-Daten mit dem neuen Profilbild.
 * @param {Object} currentUser - Das aktuelle User-Objekt
 * @param {Object} profileImage - Das große Profilbild-Objekt
 * @param {Object} profileImageSmall - Das kleine Profilbild-Objekt
 */
function updateSessionProfileImage(currentUser, profileImage, profileImageSmall) {
  currentUser.profileImage = profileImage;
  currentUser.profileImageSmall = profileImageSmall;
  sessionStorage.setItem("join_current_user", JSON.stringify(currentUser));
}


/**
 * Aktualisiert alle UI-Elemente mit dem neuen Profilbild.
 * @param {string} largeBase64 - Base64 des großen Bildes
 * @param {string} smallBase64 - Base64 des kleinen Bildes
 */
function updateProfileImageUI(largeBase64, smallBase64) {
  showAccountProfileImage(largeBase64);
  showHeaderProfileImage(smallBase64);
}


/**
 * Zeigt das Profilbild im Account-Overlay-Avatar.
 * @param {string} base64 - Base64 des Bildes
 */
function showAccountProfileImage(base64) {
  const avatar = document.getElementById("account-initials");
  if (!avatar) return;
  let img = document.getElementById("account-profile-img");
  if (!img) {
    img = document.createElement("img");
    img.id = "account-profile-img";
    img.className = "account-profile-img";
    img.alt = "Profilbild";
    avatar.appendChild(img);
  }
  img.src = base64;
  img.style.display = "block";
  hideAccountInitialsText(avatar);
}


/**
 * Versteckt den Initialen-Text im Account-Avatar.
 * @param {HTMLElement} avatar - Das Avatar-Element
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
 * @param {string} base64 - Base64 des kleinen Bildes
 */
function showHeaderProfileImage(base64) {
  const initialsEl = document.getElementById("user-initials");
  if (!initialsEl) return;
  let img = initialsEl.querySelector(".header-profile-img");
  if (!img) {
    img = document.createElement("img");
    img.className = "header-profile-img";
    img.alt = "Profilbild";
    initialsEl.appendChild(img);
  }
  img.src = base64;
  img.style.display = "block";
  initialsEl.style.border = "none";
  initialsEl.style.overflow = "hidden";
  const textNodes = initialsEl.childNodes;
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].nodeType === Node.TEXT_NODE) {
      textNodes[i].textContent = "";
    }
  }
}
