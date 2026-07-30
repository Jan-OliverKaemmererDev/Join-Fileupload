/**
 * @fileoverview Main logic for the file upload component.
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
 * Initializes the file upload.
 */
function initFileUpload() {
  createHiddenFileInput();
  bindCameraBadgeClick();
}

/**
 * Creates a hidden file input in the DOM.
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
 * Binds the click handler to the camera badge.
 */
function bindCameraBadgeClick() {
  const badge = document.getElementById("account-camera-badge");
  if (badge) {
    badge.addEventListener("click", openFilePicker);
  }
}

/**
 * Opens the native file picker.
 */
function openFilePicker() {
  if (!fileInput) createHiddenFileInput();
  fileInput.value = "";
  fileInput.click();
}

/**
 * Called when the user has selected a file.
 * @param {Event} event - The change event of the file input.
 */
async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!isValidImageSizeOrFormat(file)) return;
  if (!(await validateSelectedImage(file))) return;
  pendingProfileImageFile = file;
  currentOffsetY = 0;
  baseOffsetY = 0;
  enableImagePanning(URL.createObjectURL(file));
}

/**
 * Validates the selected image file.
 * @param {File} file - The file to validate.
 * @returns {Promise<boolean>} True if the image is valid.
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
 * Enables moving the image in the avatar circle.
 * @param {string} src - The image source as Object URL.
 */
function enableImagePanning(src) {
  const avatarContainer = document.getElementById("account-initials");
  if (!avatarContainer) return;
  setupPreviewImage(avatarContainer, src);
  bindImageDragEvents();
}

/**
 * Creates and inserts the preview image.
 * @param {HTMLElement} container - The avatar container.
 * @param {string} src - The image source.
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
 * Calculates and applies scaling for the loaded preview image.
 * @param {HTMLElement} container - The avatar container.
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
 * Applies scaling and positioning to the image.
 * @param {number} scale - The calculated scaling factor.
 * @param {number} cWidth - The container width.
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
 * Binds the drag events to the preview image.
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
 * Starts the profile picture dragging process.
 * @param {Event} e - The event.
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
 * Moves the image while dragging.
 * @param {Event} e - The event.
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
 * Limits the offset value to the permitted range.
 * @param {number} offset - The desired offset value.
 * @returns {number} The limited offset value.
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
 * Ends the dragging process.
 */
function handleDragEnd() {
  if (isPanning && previewImgElement) {
    isPanning = false;
    previewImgElement.style.cursor = "grab";
  }
}

/**
 * Returns whether a profile picture is ready to be saved.
 * @returns {boolean} True if an image is available.
 */
function hasPendingProfileImage() {
  return pendingProfileImageFile !== null;
}

/**
 * Cancels the pending image upload.
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
 * Cuts the moved image, compresses it and uploads it.
 * @returns {Promise<void>} A promise for the operation.
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
 * Performs image processing after loading.
 * @param {HTMLImageElement} img - The loaded image.
 * @param {Function} resolve - The Promise Resolve function.
 * @param {Function} reject - The Promise Reject function.
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
 * Prepares the canvas for image cropping.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The context.
 * @param {HTMLImageElement} img - The image to draw.
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
 * Compresses and transforms the cropped blob.
 * @param {Blob} blob - The cropped image blob.
 * @param {Function} resolve - The Promise Resolve function.
 * @param {Function} reject - The Promise Reject function.
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
 * Assembles the result and saves it.
 * @param {Blob} largeBlob - The large image blob.
 * @param {Blob} smallBlob - The small image blob.
 */
async function buildProfileResult(largeBlob, smallBlob) {
  const largeBase64 = await blobToBase64(largeBlob);
  if (isBase64TooLarge(largeBase64)) {
    cancelPendingProfileImage();
    throw new Error("File too large for Firebase after compression");
  }
  const smallBase64 = await blobToBase64(smallBlob);
  const name = pendingProfileImageFile.name;
  await saveAndDisplayImages(name, largeBlob, largeBase64, smallBlob, smallBase64);
}

/**
 * Processes and uploads a directly selected image without panning.
 * @param {File} file - The selected image file.
 */
async function processAndUploadImage(file) {
  if (!isValidImageSizeOrFormat(file)) return;
  if (!(await validateImageMagicBytes(file))) return showFileFormatError();

  const largeBlob = await compressImage(file, 800, 800, 0.8);
  const largeBase64 = await blobToBase64(largeBlob);
  if (isBase64TooLarge(largeBase64)) return;

  const smallBlob = await compressImage(file, 100, 100, 0.6);
  const smallBase64 = await blobToBase64(smallBlob);
  await saveAndDisplayImages(file.name, largeBlob, largeBase64, smallBlob, smallBase64);
}

/**
 * Validates the file size
 */
function isValidImageSizeOrFormat(file) {
  const max = typeof MAX_FILE_SIZE !== 'undefined' ? MAX_FILE_SIZE : 2 * 1024 * 1024;
  if (file.size > max) {
    if (typeof showFileSizeError === "function") showFileSizeError();
    return false;
  }
  return true;
}

/**
 * Checks if the generated base64 string is too large
 */
function isBase64TooLarge(base64) {
  if (base64.length * 0.75 > 1024 * 1024) {
    if (typeof showFileSizeError === "function") showFileSizeError();
    return true;
  }
  return false;
}

/**
 * Assembles the user objects and saves them
 */
async function saveAndDisplayImages(name, lBlob, lBase, sBlob, sBase) {
  const pImg = buildProfileImageData(name, lBlob.type, lBase, lBlob.size);
  const pImgSmall = buildProfileImageData(name, sBlob.type, sBase, sBlob.size);
  await saveProfileImageToFirebase(pImg, pImgSmall);
  updateProfileImageUI(lBase, sBase);
}
