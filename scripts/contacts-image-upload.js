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
 * @param {Event} event - Das Change-Event des File-Inputs.
 */
async function handleContactFileSelected(event) {
  const file = event.target.files[0];
  if (!file || !(await validateContactImage(file))) return;
  pendingContactProfileImageFile = file;
  contactCurrentOffsetY = 0;
  contactBaseOffsetY = 0;
  enableContactImagePanning(URL.createObjectURL(file));
}

/**
 * Validiert die ausgewählte Bilddatei anhand von Endung und Magic Bytes.
 * @param {File} file - Die zu validierende Datei.
 * @returns {Promise<boolean>} True, wenn das Bild gültig ist, sonst false.
 */
async function validateContactImage(file) {
  if (typeof isValidImageFile === "function" && !isValidImageFile(file)) {
    if (typeof showFileFormatError === "function") showFileFormatError();
    return false;
  }
  if (typeof validateImageMagicBytes === "function" && !(await validateImageMagicBytes(file))) {
    if (typeof showFileFormatError === "function") showFileFormatError();
    return false;
  }
  return true;
}

/**
 * Aktiviert das Verschieben des Bildes im Avatar-Kreis.
 * @param {string} src - Die Bildquelle als Object URL.
 */
function enableContactImagePanning(src) {
  const avatarContainer = document.getElementById("contact-initials");
  if (!avatarContainer) return;
  setupContactPreviewImage(avatarContainer, src);
  bindContactDragEvents();
}

/**
 * Erstellt und fügt das Vorschaubild in den Container ein.
 * @param {HTMLElement} container - Der Avatar-Container.
 * @param {string} src - Die Bildquelle als Object URL.
 */
function setupContactPreviewImage(container, src) {
  container.innerHTML = "";
  contactPreviewImgElement = document.createElement("img");
  contactPreviewImgElement.src = src;
  contactPreviewImgElement.classList.add("account-profile-img", "panning-active");
  contactPreviewImgElement.ondragstart = () => false;
  container.appendChild(contactPreviewImgElement);
  contactPreviewImgElement.onload = () => handleContactImageLoaded(container);
}

/**
 * Verarbeitet das geladene Bild und skaliert es passend zum Container.
 * @param {HTMLElement} container - Der Avatar-Container.
 */
function handleContactImageLoaded(container) {
  contactOriginalImageWidth = contactPreviewImgElement.naturalWidth;
  contactOriginalImageHeight = contactPreviewImgElement.naturalHeight;
  const cWidth = container.clientWidth || 120;
  const cHeight = container.clientHeight || 120;
  const scale = Math.max(cWidth / contactOriginalImageWidth, cHeight / contactOriginalImageHeight);
  applyContactImageScaleAndPosition(scale, cWidth);
}

/**
 * Wendet Skalierung und zentrierte Positionierung auf das Bild an.
 * @param {number} scale - Der berechnete Skalierungsfaktor.
 * @param {number} cWidth - Die Container-Breite.
 */
function applyContactImageScaleAndPosition(scale, cWidth) {
  const scaledWidth = contactOriginalImageWidth * scale;
  contactPreviewImgElement.style.width = scaledWidth + "px";
  contactPreviewImgElement.style.height = (contactOriginalImageHeight * scale) + "px";
  contactPreviewImgElement.style.top = "0px";
  contactPreviewImgElement.style.left = scaledWidth > cWidth ? -(scaledWidth - cWidth) / 2 + "px" : "0px";
  contactPreviewImgElement.dataset.scale = scale;
}

/**
 * Bindet die Mouse- und Touch-Events für das Verschieben.
 */
function bindContactDragEvents() {
  contactPreviewImgElement.addEventListener("mousedown", handleContactDragStart);
  document.addEventListener("mousemove", handleContactDragMove);
  document.addEventListener("mouseup", handleContactDragEnd);
  contactPreviewImgElement.addEventListener("touchstart", handleContactDragStart, {passive: false});
  document.addEventListener("touchmove", handleContactDragMove, {passive: false});
  document.addEventListener("touchend", handleContactDragEnd);
}

/**
 * Startet den Drag-Vorgang für das Profilbild.
 * @param {Event} e - Das Mouse- oder Touch-Event.
 */
function handleContactDragStart(e) {
  if (!pendingContactProfileImageFile) return;
  isContactPanning = true;
  contactStartY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  contactBaseOffsetY = contactCurrentOffsetY;
  contactPreviewImgElement.style.cursor = "grabbing";
  e.preventDefault();
}

/**
 * Verschiebt das Bild während des Drag-Vorgangs.
 * @param {Event} e - Das Mouse- oder Touch-Event.
 */
function handleContactDragMove(e) {
  if (!isContactPanning || !pendingContactProfileImageFile || !contactPreviewImgElement) return;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  let newOffsetY = contactBaseOffsetY + (clientY - contactStartY);
  newOffsetY = constrainContactDragOffset(newOffsetY);
  contactCurrentOffsetY = newOffsetY;
  contactPreviewImgElement.style.top = contactCurrentOffsetY + "px";
  e.preventDefault();
}

/**
 * Begrenzt den Offset-Wert auf den erlaubten Bereich.
 * @param {number} offset - Der gewünschte Offset-Wert.
 * @returns {number} Der begrenzte Offset-Wert.
 */
function constrainContactDragOffset(offset) {
  const scale = parseFloat(contactPreviewImgElement.dataset.scale) || 1;
  const minOffset = (contactPreviewImgElement.parentElement.clientHeight || 120) - (contactOriginalImageHeight * scale);
  if (minOffset >= 0) return 0;
  if (offset > 0) return 0;
  if (offset < minOffset) return minOffset;
  return offset;
}

/**
 * Beendet den Drag-Vorgang für das Profilbild.
 */
function handleContactDragEnd() {
  if (isContactPanning && contactPreviewImgElement) {
    isContactPanning = false;
    contactPreviewImgElement.style.cursor = "grab";
  }
}

/**
 * Gibt zurück, ob ein Profilbild zum Speichern bereitliegt.
 * @returns {boolean} True, wenn ein Bild bereitliegt.
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
 * @returns {Promise<{profileImage: Object, profileImageSmall: Object} | null>} Ein Promise mit den Bilddaten.
 */
async function processPendingContactProfileImage() {
  if (!pendingContactProfileImageFile) return null;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => handleContactImageProcessing(img, resolve, reject);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = URL.createObjectURL(pendingContactProfileImageFile);
  });
}

/**
 * Führt die Bildverarbeitung nach dem Laden durch.
 * @param {HTMLImageElement} img - Das geladene Bild-Element.
 * @param {Function} resolve - Die Promise Resolve-Funktion.
 * @param {Function} reject - Die Promise Reject-Funktion.
 */
function handleContactImageProcessing(img, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  setupContactCropCanvas(canvas, ctx, img);
  canvas.toBlob(
    (blob) => processContactCroppedBlob(blob, resolve, reject),
    pendingContactProfileImageFile.type, 1.0
  );
}

/**
 * Bereitet das Canvas für den Bildzuschnitt vor und zeichnet das Bild.
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element.
 * @param {CanvasRenderingContext2D} ctx - Der 2D-Kontext.
 * @param {HTMLImageElement} img - Das zu zeichnende Bild.
 */
function setupContactCropCanvas(canvas, ctx, img) {
  const scale = parseFloat(contactPreviewImgElement?.dataset.scale) || 1;
  const containerWidth = contactPreviewImgElement?.parentElement.clientWidth || 120;
  const cropY = Math.abs(contactCurrentOffsetY) / scale;
  const scaledWidth = contactOriginalImageWidth * scale;
  const cropX = scaledWidth > containerWidth ? ((scaledWidth - containerWidth) / 2) / scale : 0;
  const cropSize = containerWidth / scale;
  canvas.width = Math.min(cropSize, contactOriginalImageWidth);
  canvas.height = Math.min(cropSize, contactOriginalImageHeight);
  ctx.drawImage(img, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
}

/**
 * Komprimiert den zugeschnittenen Blob und wandelt ihn um.
 * @param {Blob} blob - Der zugeschnittene Bild-Blob.
 * @param {Function} resolve - Die Promise Resolve-Funktion.
 * @param {Function} reject - Die Promise Reject-Funktion.
 */
async function processContactCroppedBlob(blob, resolve, reject) {
  if (!blob) return reject(new Error("Konnte das Bild nicht zuschneiden."));
  try {
    const largeBlob = await compressBlob(blob, 800, 800, 0.8);
    const smallBlob = await compressBlob(blob, 100, 100, 0.6);
    resolve(await buildContactProfileResult(largeBlob, smallBlob));
  } catch (e) {
    reject(e);
  }
}

/**
 * Baut das finale Ergebnis-Objekt zusammen.
 * @param {Blob} largeBlob - Der große Bild-Blob.
 * @param {Blob} smallBlob - Der kleine Bild-Blob.
 * @returns {Promise<{profileImage: Object, profileImageSmall: Object}>} Das Ergebnis-Objekt.
 */
async function buildContactProfileResult(largeBlob, smallBlob) {
  const largeBase64 = await blobToBase64(largeBlob);
  const smallBase64 = await blobToBase64(smallBlob);
  const name = pendingContactProfileImageFile.name;
  const profileImage = buildProfileImageData(name, largeBlob.type, largeBase64);
  const profileImageSmall = buildProfileImageData(name, smallBlob.type, smallBase64);
  pendingContactProfileImageFile = null;
  return { profileImage, profileImageSmall };
}
