/**
 * @fileoverview Profilbild-Upload Logik für Kontakte.
 * Erstellt einen versteckten Filepicker, validiert Bilder,
 * erlaubt das Zuschneiden und gibt die Base64-Daten für das Speichern zurück.
 */

let contactFileInput = null;
let pendingContactProfileImageFile = null;
let contactCurrentOffsetY = 0;
let isContactPanning = false;
let contactStartY = 0;
let contactBaseOffsetY = 0;
let contactOriginalImageWidth = 0;
let contactOriginalImageHeight = 0;
let contactPreviewImgElement = null;

/**
 * Initialisiert den File-Upload für Kontakte.
 */
function initContactFileUpload() {
  createHiddenContactFileInput();
  bindContactCameraBadgeClick();
}

/**
 * Erstellt einen versteckten File-Input im DOM.
 */
function createHiddenContactFileInput() {
  if (document.getElementById("contact-profile-file-input")) return;
  contactFileInput = document.createElement("input");
  contactFileInput.type = "file";
  contactFileInput.id = "contact-profile-file-input";
  contactFileInput.accept = "image/*";
  contactFileInput.style.display = "none";
  contactFileInput.addEventListener("change", handleContactFileSelected);
  document.body.appendChild(contactFileInput);
}

/**
 * Bindet den Klick-Handler an den Camera-Badge.
 */
function bindContactCameraBadgeClick() {
  const badge = document.getElementById("contact-camera-badge");
  if (badge) {
    badge.addEventListener("click", openContactFilePicker);
  }
}

/**
 * Öffnet den nativen Filepicker.
 */
function openContactFilePicker() {
  if (!contactFileInput) createHiddenContactFileInput();
  contactFileInput.value = "";
  contactFileInput.click();
}

/**
 * Wird aufgerufen, wenn der User eine Datei ausgewählt hat.
 * @param {Event} event - Das Change-Event des File-Inputs
 */
async function handleContactFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (typeof isValidImageFile === "function" && !isValidImageFile(file)) {
    if (typeof showFileFormatError === "function") showFileFormatError();
    return;
  }
  
  if (typeof validateImageMagicBytes === "function") {
    const isValid = await validateImageMagicBytes(file);
    if (!isValid) {
      if (typeof showFileFormatError === "function") showFileFormatError();
      return;
    }
  }

  pendingContactProfileImageFile = file;
  contactCurrentOffsetY = 0;
  contactBaseOffsetY = 0;
  
  const objectUrl = URL.createObjectURL(file);
  enableContactImagePanning(objectUrl);
}

/**
 * Aktiviert das Verschieben des Bildes im Avatar-Kreis.
 */
function enableContactImagePanning(src) {
  const avatarContainer = document.getElementById("contact-initials");
  if (!avatarContainer) return;
  
  avatarContainer.innerHTML = "";
  contactPreviewImgElement = document.createElement("img");
  contactPreviewImgElement.src = src;
  contactPreviewImgElement.classList.add("account-profile-img", "panning-active");
  
  contactPreviewImgElement.ondragstart = () => false;
  
  avatarContainer.appendChild(contactPreviewImgElement);
  
  contactPreviewImgElement.onload = function() {
    contactOriginalImageWidth = contactPreviewImgElement.naturalWidth;
    contactOriginalImageHeight = contactPreviewImgElement.naturalHeight;
    
    const containerWidth = avatarContainer.clientWidth || 120;
    const containerHeight = avatarContainer.clientHeight || 120;
    
    const scale = Math.max(containerWidth / contactOriginalImageWidth, containerHeight / contactOriginalImageHeight);
    const scaledWidth = contactOriginalImageWidth * scale;
    const scaledHeight = contactOriginalImageHeight * scale;
    
    contactPreviewImgElement.style.width = scaledWidth + "px";
    contactPreviewImgElement.style.height = scaledHeight + "px";
    contactPreviewImgElement.style.top = "0px";
    
    if (scaledWidth > containerWidth) {
      contactPreviewImgElement.style.left = -(scaledWidth - containerWidth) / 2 + "px";
    } else {
      contactPreviewImgElement.style.left = "0px";
    }
    
    contactPreviewImgElement.dataset.scale = scale;
  };

  contactPreviewImgElement.addEventListener("mousedown", handleContactDragStart);
  document.addEventListener("mousemove", handleContactDragMove);
  document.addEventListener("mouseup", handleContactDragEnd);

  contactPreviewImgElement.addEventListener("touchstart", handleContactDragStart, {passive: false});
  document.addEventListener("touchmove", handleContactDragMove, {passive: false});
  document.addEventListener("touchend", handleContactDragEnd);
}

function handleContactDragStart(e) {
  if (!pendingContactProfileImageFile) return;
  isContactPanning = true;
  contactStartY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  contactBaseOffsetY = contactCurrentOffsetY;
  contactPreviewImgElement.style.cursor = "grabbing";
  e.preventDefault();
}

function handleContactDragMove(e) {
  if (!isContactPanning || !pendingContactProfileImageFile || !contactPreviewImgElement) return;
  
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  const deltaY = clientY - contactStartY;
  
  let newOffsetY = contactBaseOffsetY + deltaY;
  
  const scale = parseFloat(contactPreviewImgElement.dataset.scale) || 1;
  const scaledHeight = contactOriginalImageHeight * scale;
  const containerHeight = contactPreviewImgElement.parentElement.clientHeight || 120;
  
  const minOffset = containerHeight - scaledHeight;
  
  if (minOffset >= 0) {
    newOffsetY = 0;
  } else {
    if (newOffsetY > 0) newOffsetY = 0;
    if (newOffsetY < minOffset) newOffsetY = minOffset;
  }
  
  contactCurrentOffsetY = newOffsetY;
  contactPreviewImgElement.style.top = contactCurrentOffsetY + "px";
  e.preventDefault();
}

function handleContactDragEnd() {
  if (isContactPanning && contactPreviewImgElement) {
    isContactPanning = false;
    contactPreviewImgElement.style.cursor = "grab";
  }
}

/**
 * Gibt zurück, ob ein Profilbild zum Speichern bereitliegt.
 */
function hasPendingContactProfileImage() {
  return pendingContactProfileImageFile !== null;
}

/**
 * Bricht den anstehenden Bild-Upload ab.
 */
function cancelPendingContactProfileImage() {
  pendingContactProfileImageFile = null;
  contactCurrentOffsetY = 0;
  contactBaseOffsetY = 0;
  if (contactPreviewImgElement) {
    contactPreviewImgElement.remove();
    contactPreviewImgElement = null;
  }
}

/**
 * Schneidet das verschobene Bild aus, komprimiert es und gibt die Base64-Daten zurück.
 * @returns {Promise<{profileImage: Object, profileImageSmall: Object} | null>}
 */
async function processPendingContactProfileImage() {
  if (!pendingContactProfileImageFile) return null;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async function() {
      const scale = parseFloat(contactPreviewImgElement.dataset.scale) || 1;
      const containerWidth = contactPreviewImgElement ? contactPreviewImgElement.parentElement.clientWidth : 120;
      
      const cropY = Math.abs(contactCurrentOffsetY) / scale;
      let cropX = 0;
      
      const scaledWidth = contactOriginalImageWidth * scale;
      if (scaledWidth > containerWidth) {
        cropX = ((scaledWidth - containerWidth) / 2) / scale;
      }
      
      const cropSize = containerWidth / scale;
      
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(cropSize, contactOriginalImageWidth);
      canvas.height = Math.min(cropSize, contactOriginalImageHeight);
      const ctx = canvas.getContext("2d");
      
      ctx.drawImage(img, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async function(blob) {
        if (!blob) {
          reject(new Error("Konnte das Bild nicht zuschneiden."));
          return;
        }
        
        try {
          const largeBlob = await compressBlob(blob, 800, 800, 0.8);
          const smallBlob = await compressBlob(blob, 100, 100, 0.6);
          
          const largeBase64 = await blobToBase64(largeBlob);
          const smallBase64 = await blobToBase64(smallBlob);
          
          const profileImage = buildProfileImageData(pendingContactProfileImageFile.name, largeBlob.type, largeBase64);
          const profileImageSmall = buildProfileImageData(pendingContactProfileImageFile.name, smallBlob.type, smallBase64);
          
          pendingContactProfileImageFile = null;
          resolve({ profileImage, profileImageSmall });
        } catch(e) {
          reject(e);
        }
      }, pendingContactProfileImageFile.type, 1.0);
    };
    img.src = URL.createObjectURL(pendingContactProfileImageFile);
  });
}
