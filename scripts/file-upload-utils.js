/**
 * @fileoview Utility functions for handling file uploads.
 */
/**
 Allowed MIME types for image files
 */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

/**
 Maximum file size in bytes (2 MB)
 */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Checks whether the selected file is a valid image.
 * @param {File} file - The file to check.
 * @returns {boolean} True if it is a valid image format.
 */
function isValidImageFile(file) {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Validates a file's magic bytes asynchronously.
 * @param {File} file - The file to check.
 * @returns {Promise<boolean>} True if magic bytes match an image format.
 */
async function validateImageMagicBytes(file) {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  return false;
}

/**
 * Calculates the new dimensions while maintaining the aspect ratio.
 * @param {number} origWidth - original width.
 * @param {number} origHeight - Original height.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @returns {{width: number, height: number}} The calculated dimensions.
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
 * Compresses an image to the specified maximum size.
 * @param {File} file - The image file.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - JPEG quality (0-1).
 * @returns {Promise<Blob>} The compressed image blob.
 */
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fileType = file.type || "image/jpeg";
    img.onload = () => handleImageCompression(img, maxWidth, maxHeight, quality, fileType, resolve, reject);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Performs the actual image compression.
 * @param {HTMLImageElement} img - The loaded image.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - JPEG quality.
 * @param {string} fileType - The MIME type of the image.
 * @param {Function} resolve - Promise Resolve.
 * @param {Function} reject - Promise Reject.
 */
function handleImageCompression(img, maxWidth, maxHeight, quality, fileType, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight);
  
  // If PNG, it cannot be compressed with quality parameter. Use webp to preserve transparency but allow compression!
  let outputType = fileType;
  if (fileType === "image/png") {
    outputType = "image/webp";
  }
  
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Bild konnte nicht komprimiert werden."));
  }, outputType, quality);
}

/**
 * Draws the image onto the canvas for compression.
 * @param {HTMLImageElement} img - The loaded image.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 */
function drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight) {
  const dims = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
  canvas.width = dims.width;
  canvas.height = dims.height;
  ctx.drawImage(img, 0, 0, dims.width, dims.height);
}

/**
 * Compresses a blob to the specified maximum size.
 * @param {Blob} blob - The blob to compress.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - JPEG quality (0-1).
 * @returns {Promise<Blob>} The compressed image blob.
 */
function compressBlob(blob, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fileType = blob.type || "image/jpeg";
    img.onload = () => handleBlobCompression(img, maxWidth, maxHeight, quality, fileType, resolve, reject);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Performs blob compression.
 * @param {HTMLImageElement} img - The loaded image.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - JPEG quality.
 * @param {string} fileType - The MIME type of the image.
 * @param {Function} resolve - Promise Resolve.
 * @param {Function} reject - Promise Reject.
 */
function handleBlobCompression(img, maxWidth, maxHeight, quality, fileType, resolve, reject) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  drawCompressionCanvas(img, canvas, ctx, maxWidth, maxHeight);
  
  // If PNG, it cannot be compressed with quality parameter. Use webp to preserve transparency but allow compression!
  let outputType = fileType;
  if (fileType === "image/png") {
    outputType = "image/webp";
  }

  canvas.toBlob((newBlob) => {
    if (newBlob) resolve(newBlob);
    else reject(new Error("Bild konnte nicht komprimiert werden."));
  }, outputType, quality);
}

/**
 * Converts a blob to a Base64 string.
 * @param {Blob} blob - The blob to convert.
 * @returns {Promise<string>} The base64 string (including data URL prefix).
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
 * Builds the JSON object for the profile picture.
 * @param {string} filename - The original filename.
 * @param {string} fileType - The MIME type.
 * @param {string} base64 - The base64 string.
 * @param {number} [size] - The file size.
 * @returns {Object} The profile picture data object.
 */
function buildProfileImageData(filename, fileType, base64, size) {
  return { filename, fileType, base64, ...(size !== undefined && { size }) };
}

/**
 * Saves profile picture in Firebase Firestore.
 * @param {Object} profileImage - The large profile image object.
 * @param {Object} profileImageSmall - The small profile image object.
 */
async function saveProfileImageToFirebase(profileImage, profileImageSmall) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  const userRef = window.fbDoc(window.firebaseDb, "users", currentUser.id);
  await window.fbUpdateDoc(userRef, { profileImage, profileImageSmall });
  updateSessionProfileImage(currentUser, profileImage, profileImageSmall);
}

/**
 * Updates session data with the new profile picture.
 * @param {Object} currentUser - The current User object.
 * @param {Object} profileImage - The large profile image object.
 * @param {Object} profileImageSmall - The small profile image object.
 */
function updateSessionProfileImage(currentUser, profileImage, profileImageSmall) {
  currentUser.profileImage = profileImage;
  currentUser.profileImageSmall = profileImageSmall;
  sessionStorage.setItem("join_current_user", JSON.stringify(currentUser));
}

/**
 * Updates all UI elements with the new profile picture.
 * @param {string} largeBase64 - Base64 of the large image.
 * @param {string} smallBase64 - Base64 of the small image.
 */
function updateProfileImageUI(largeBase64, smallBase64) {
  showAccountProfileImage(largeBase64);
  showHeaderProfileImage(smallBase64);
}

/**
 * Shows profile picture in account overlay avatar.
 * @param {string} base64 - Base64 of the image.
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
 * Ensures that an image element exists in the account avatar.
 * @param {HTMLElement} avatar - The avatar container.
 * @returns {HTMLImageElement} The Image element.
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
 * Hides the initials text in the account avatar.
 * @param {HTMLElement} avatar - The avatar element.
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
 * Shows the small profile picture in the header.
 * @param {string} base64 - Base64 of the small image.
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
 * Ensures that the header image element exists.
 * @param {HTMLElement} initialsEl - The header initials element.
 * @returns {HTMLImageElement} The Image element.
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
 * Deletes the text from the header avatar.
 * @param {HTMLElement} initialsEl - The header initials element.
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
 * Displays an error message for an invalid file format.
 */
function showFileFormatError() {
  const errorMsg = ensureErrorMsgElement();
  triggerErrorMsgAnimation(errorMsg);
}

/**
 * Ensures that the error element exists.
 * @returns {HTMLElement} The error message element.
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
 * Triggers the animation for the error message.
 * @param {HTMLElement} errorMsg - The error message element.
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
 * Displays an error message for a file that is too large.
 */
function showFileSizeError() {
  const errorMsg = ensureSizeErrorMsgElement();
  triggerErrorMsgAnimation(errorMsg);
}

/**
 * Ensures that the file size error element exists.
 * @returns {HTMLElement} The error message element.
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
