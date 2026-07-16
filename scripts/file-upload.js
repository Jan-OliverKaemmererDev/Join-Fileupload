/**
 * @fileoverview Profilbild-Upload Logik.
 * Erstellt einen versteckten Filepicker, behandelt Bildauswahl,
 * Panning und steuert den Komprimierungs- und Upload-Prozess.
 */

let fileInput = null;
let pendingProfileImageFile = null;
let currentOffsetY = 0;
let isPanning = false;
let startY = 0;
let baseOffsetY = 0;
let originalImageWidth = 0;
let originalImageHeight = 0;
let previewImgElement = null;

/**
 * Initialisiert den File-Upload.
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
 * @param {Event} event - Das Change-Event des File-Inputs.
 */
async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file || !(await validateSelectedImage(file))) return;
  pendingProfileImageFile = file;
  currentOffsetY = 0;
  baseOffsetY = 0;
  enableImagePanning(URL.createObjectURL(file));
}

/**
 * Validiert die ausgewählte Bilddatei.
 * @param {File} file - Die zu validierende Datei.
 * @returns {Promise<boolean>} True, wenn das Bild gültig ist.
 */
async function validateSelectedImage(file) {
  if (!isValidImageFile(file)) {
    showFileFormatError();
    return false;
  }
  if (!(await validateImageMagicBytes(file))) {
    showFileFormatError();
    return false;
  }
  return true;
}

/**
 * Aktiviert das Verschieben des Bildes im Avatar-Kreis.
 * @param {string} src - Die Bildquelle als Object URL.
 */
function enableImagePanning(src) {
  const avatarContainer = document.getElementById("account-initials");
  if (!avatarContainer) return;
  setupPreviewImage(avatarContainer, src);
  bindImageDragEvents();
}

/**
 * Erstellt und fügt das Vorschaubild ein.
 * @param {HTMLElement} container - Der Avatar-Container.
 * @param {string} src - Die Bildquelle.
 */
function setupPreviewImage(container, src) {
  container.innerHTML = "";
  previewImgElement = document.createElement("img");
  previewImgElement.src = src;
  previewImgElement.classList.add("account-profile-img", "panning-active");
  previewImgElement.ondragstart = () => false;
  container.appendChild(previewImgElement);
  previewImgElement.onload = () => handlePreviewLoaded(container);
}

/**
 * Berechnet und wendet Skalierung für das geladene Vorschaubild an.
 * @param {HTMLElement} container - Der Avatar-Container.
 */
function handlePreviewLoaded(container) {
  originalImageWidth = previewImgElement.naturalWidth;
  originalImageHeight = previewImgElement.naturalHeight;
  const cWidth = container.clientWidth || 120;
  const cHeight = container.clientHeight || 120;
  const scale = Math.max(cWidth / originalImageWidth, cHeight / originalImageHeight);
  applyImageScale(scale, cWidth);
}

/**
 * Wendet Skalierung und Positionierung auf das Bild an.
 * @param {number} scale - Der berechnete Skalierungsfaktor.
 * @param {number} cWidth - Die Container-Breite.
 */
function applyImageScale(scale, cWidth) {
  const scaledWidth = originalImageWidth * scale;
  previewImgElement.style.width = scaledWidth + "px";
  previewImgElement.style.height = (originalImageHeight * scale) + "px";
  previewImgElement.style.top = "0px";
  previewImgElement.style.left = scaledWidth > cWidth ? -(scaledWidth - cWidth) / 2 + "px" : "0px";
  previewImgElement.dataset.scale = scale;
}

/**
 * Bindet die Drag-Events an das Vorschaubild.
 */
function bindImageDragEvents() {
  previewImgElement.addEventListener("mousedown", handleDragStart);
  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);
  previewImgElement.addEventListener("touchstart", handleDragStart, { passive: false });
  document.addEventListener("touchmove", handleDragMove, { passive: false });
  document.addEventListener("touchend", handleDragEnd);
}

/**
 * Startet den Drag-Vorgang für das Profilbild.
 * @param {Event} e - Das Event.
 */
function handleDragStart(e) {
  if (!pendingProfileImageFile) return;
  isPanning = true;
  startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  baseOffsetY = currentOffsetY;
  previewImgElement.style.cursor = "grabbing";
  e.preventDefault();
}

/**
 * Verschiebt das Bild während des Drags.
 * @param {Event} e - Das Event.
 */
function handleDragMove(e) {
  if (!isPanning || !pendingProfileImageFile || !previewImgElement) return;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  let newOffsetY = baseOffsetY + (clientY - startY);
  newOffsetY = constrainDragOffset(newOffsetY);
  currentOffsetY = newOffsetY;
  previewImgElement.style.top = currentOffsetY + "px";
  e.preventDefault();
}

/**
 * Begrenzt den Offset-Wert auf den erlaubten Bereich.
 * @param {number} offset - Der gewünschte Offset-Wert.
 * @returns {number} Der begrenzte Offset-Wert.
 */
function constrainDragOffset(offset) {
  const scale = parseFloat(previewImgElement.dataset.scale) || 1;
  const minOffset = (previewImgElement.parentElement.clientHeight || 120) - (originalImageHeight * scale);
  if (minOffset >= 0) return 0;
  if (offset > 0) return 0;
  if (offset < minOffset) return minOffset;
  return offset;
}

/**
 * Beendet den Drag-Vorgang.
 */
function handleDragEnd() {
  if (isPanning && previewImgElement) {
    isPanning = false;
    previewImgElement.style.cursor = "grab";
  }
}

/**
 * Gibt zurück, ob ein Profilbild zum Speichern bereitliegt.
 * @returns {boolean} True, wenn ein Bild bereitliegt.
 */
function hasPendingProfileImage() {
  return pendingProfileImageFile !== null;
}

/**
 * Bricht den anstehenden Bild-Upload ab.
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
 * @returns {Promise<void>} Ein Promise für den Vorgang.
 */
async function processPendingProfileImage() {
  if (!pendingProfileImageFile) return;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => handleImageProcessing(img, resolve, reject);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = URL.createObjectURL(pendingProfileImageFile);
  });
}

/**
 * Führt die Bildverarbeitung nach dem Laden durch.
 * @param {HTMLImageElement} img - Das geladene Bild.
 * @param {Function} resolve - Die Promise Resolve-Funktion.
 * @param {Function} reject - Die Promise Reject-Funktion.
 */
function handleImageProcessing(img, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  setupCropCanvas(canvas, ctx, img);
  canvas.toBlob(
    (blob) => processCroppedBlob(blob, resolve, reject),
    pendingProfileImageFile.type, 1.0
  );
}

/**
 * Bereitet das Canvas für den Bildzuschnitt vor.
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element.
 * @param {CanvasRenderingContext2D} ctx - Der Kontext.
 * @param {HTMLImageElement} img - Das zu zeichnende Bild.
 */
function setupCropCanvas(canvas, ctx, img) {
  const scale = parseFloat(previewImgElement?.dataset.scale) || 1;
  const containerWidth = previewImgElement?.parentElement.clientWidth || 120;
  const cropY = Math.abs(currentOffsetY) / scale;
  const scaledWidth = originalImageWidth * scale;
  const cropX = scaledWidth > containerWidth ? ((scaledWidth - containerWidth) / 2) / scale : 0;
  const cropSize = containerWidth / scale;
  canvas.width = Math.min(cropSize, originalImageWidth);
  canvas.height = Math.min(cropSize, originalImageHeight);
  ctx.drawImage(img, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
}

/**
 * Komprimiert den zugeschnittenen Blob und wandelt ihn um.
 * @param {Blob} blob - Der zugeschnittene Bild-Blob.
 * @param {Function} resolve - Die Promise Resolve-Funktion.
 * @param {Function} reject - Die Promise Reject-Funktion.
 */
async function processCroppedBlob(blob, resolve, reject) {
  if (!blob) return reject(new Error("Konnte das Bild nicht zuschneiden."));
  try {
    const largeBlob = await compressBlob(blob, 800, 800, 0.8);
    const smallBlob = await compressBlob(blob, 100, 100, 0.6);
    await buildProfileResult(largeBlob, smallBlob);
    pendingProfileImageFile = null;
    resolve();
  } catch (e) {
    reject(e);
  }
}

/**
 * Baut das Resultat zusammen und speichert es.
 * @param {Blob} largeBlob - Der große Bild-Blob.
 * @param {Blob} smallBlob - Der kleine Bild-Blob.
 */
async function buildProfileResult(largeBlob, smallBlob) {
  const largeBase64 = await blobToBase64(largeBlob);
  const smallBase64 = await blobToBase64(smallBlob);
  const name = pendingProfileImageFile.name;
  const profileImage = buildProfileImageData(name, largeBlob.type, largeBase64);
  const profileImageSmall = buildProfileImageData(name, smallBlob.type, smallBase64);
  await saveProfileImageToFirebase(profileImage, profileImageSmall);
  updateProfileImageUI(largeBase64, smallBase64);
}

/**
 * Verarbeitet und lädt ein direkt ausgewähltes Bild ohne Panning hoch.
 * @param {File} file - Die ausgewählte Bilddatei.
 */
async function processAndUploadImage(file) {
  if (!(await validateImageMagicBytes(file))) {
    showFileFormatError();
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
