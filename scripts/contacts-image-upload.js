/**
 * @fileoverview Profile picture upload logic for contacts.
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
 * Initializes file upload for contacts.
 */
function initContactFileUpload() {
  createHiddenContactFileInput();
  bindContactCameraBadgeClick();
}

/**
 * Creates a hidden file input in the DOM.
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
 * Binds the click handler to the camera badge.
 */
function bindContactCameraBadgeClick() {
  const badge = document.getElementById("contact-camera-badge");
  if (badge) {
    badge.addEventListener("click", openContactFilePicker);
  }
}

/**
 * Opens the native file picker.
 */
function openContactFilePicker() {
  if (!contactFileInput) createHiddenContactFileInput();
  contactFileInput.value = "";
  contactFileInput.click();
}

/**
 * Called when the user has selected a file.
 * @param {Event} event - The change event of the file input.
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
 * Validates the selected image file based on extension and magic bytes.
 * @param {File} file - The file to validate.
 * @returns {Promise<boolean>} True if the image is valid, false otherwise.
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
 * Enables moving the image in the avatar circle.
 * @param {string} src - The image source as Object URL.
 */
function enableContactImagePanning(src) {
  const avatarContainer = document.getElementById("contact-initials");
  if (!avatarContainer) return;
  setupContactPreviewImage(avatarContainer, src);
  bindContactDragEvents();
}

/**
 * Creates and inserts the preview image into the container.
 * @param {HTMLElement} container - The avatar container.
 * @param {string} src - The image source as Object URL.
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
 * Processes the loaded image and scales it to fit the container.
 * @param {HTMLElement} container - The avatar container.
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
 * Applies scaling and centered positioning to the image.
 * @param {number} scale - The calculated scaling factor.
 * @param {number} cWidth - The container width.
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
 * Binds the mouse and touch events for moving.
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
 * Starts the profile picture dragging process.
 * @param {Event} e - The mouse or touch event.
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
 * Moves the image during dragging.
 * @param {Event} e - The mouse or touch event.
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
 * Limits the offset value to the permitted range.
 * @param {number} offset - The desired offset value.
 * @returns {number} The limited offset value.
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
 * Stops dragging the profile picture.
 */
function handleContactDragEnd() {
  if (isContactPanning && contactPreviewImgElement) {
    isContactPanning = false;
    contactPreviewImgElement.style.cursor = "grab";
  }
}

/**
 * Returns whether a profile picture is ready to be saved.
 * @returns {boolean} True if an image is available.
 */
function hasPendingContactProfileImage() {
  return pendingContactProfileImageFile !== null;
}

/**
 * Cancels the pending image upload.
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
 * Cuts the moved image, compresses it and returns the Base64 data.
 * @returns {Promise<{profileImage: Object, profileImageSmall: Object} | null>} A Promise with the image data.
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
 * Performs image processing after loading.
 * @param {HTMLImageElement} img - The loaded image element.
 * @param {Function} resolve - The Promise Resolve function.
 * @param {Function} reject - The Promise Reject function.
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
 * Prepares the canvas for image cropping and draws the image.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The 2D context.
 * @param {HTMLImageElement} img - The image to draw.
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
 * Compresses and transforms the cropped blob.
 * @param {Blob} blob - The cropped image blob.
 * @param {Function} resolve - The Promise Resolve function.
 * @param {Function} reject - The Promise Reject function.
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
 * Assembles the final result object.
 * @param {Blob} largeBlob - The large image blob.
 * @param {Blob} smallBlob - The small image blob.
 * @returns {Promise<{profileImage: Object, profileImageSmall: Object}>} The result object.
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
