/**
 * @fileoverview Touch and drag-and-drop logic for the board on mobile devices.
 */

let autoScrollInterval;
let scrollDirection = 0; // 1 for down, -1 for up, 0 for none
let horizontalAutoScrollInterval;
let scrollDirectionX = 0; // 1 for right, -1 for left, 0 for none
let currentScrollingList = null;

/**
 * Initializes touch drag and drop for mobile devices
 */
function initTouchDragDrop() {
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
}

/**
 * Handles touchstart on a task card
 * @param {TouchEvent} ev - The touch event
 */
function handleTouchStart(ev) {
  const card = ev.target.closest(".task-card");
  if (!card) return;
  const touch = ev.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchDragTaskId = getTaskIdFromCard(card);
  touchDragElement = card;
}

/**
 * Handles the touchmove events during drag
 * @param {TouchEvent} ev - The touch event
 */
function handleTouchMove(ev) {
  if (!touchDragElement) return;
  const touch = ev.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartX);
  const deltaY = Math.abs(touch.clientY - touchStartY);
  if (!touchDragClone && (deltaX > 10 || deltaY > 10)) {
    createTouchDragClone(touch);
  }
  if (touchDragClone) {
    updateDragClonePosition(ev, touch);
  }
}

/**
 * Creates a visual clone of the map for touch drag
 * @param {Touch} touch - The touch object
 */
function createTouchDragClone(touch) {
  touchDragClone = touchDragElement.cloneNode(true);
  touchDragClone.style.position = "fixed";
  touchDragClone.style.zIndex = "10000";
  touchDragClone.style.width = touchDragElement.offsetWidth + "px";
  touchDragClone.style.opacity = "0.8";
  touchDragClone.style.pointerEvents = "none";
  touchDragClone.style.transform = "rotate(3deg)";
  document.body.appendChild(touchDragClone);
  document.body.style.overflow = "hidden";
  document.body.classList.add("no-select");
  touchDragElement.style.opacity = "0.3";
  isDragging = true;
}

/**
 * Updates clone position and checks highlights/scroll
 */
function updateDragClonePosition(ev, touch) {
  if (ev.cancelable) ev.preventDefault();
  touchDragClone.style.left =
    touch.clientX - touchDragClone.offsetWidth / 2 + "px";
  touchDragClone.style.top = touch.clientY - 30 + "px";
  highlightColumnUnderTouch(touch.clientX, touch.clientY);
  updateAutoScroll(touch.clientY);
  updateHorizontalAutoScroll(touch.clientX, touch.clientY);
}

/**
 * Handles the touchend event and executes the drop
 * @param {TouchEvent} ev - The touch event
 */
function handleTouchEnd(ev) {
  stopAutoScroll();
  stopHorizontalAutoScroll();
  document.body.style.overflow = "";
  document.body.classList.remove("no-select");
  if (!touchDragElement) return;
  if (touchDragClone) {
    performTouchDrop(ev);
    cleanupTouchDragState();
  }
  resetTouchDragVariables();
}

/**
 * Resets the touch drag variables
 */
function resetTouchDragVariables() {
  touchDragElement = null;
  touchDragTaskId = null;
  setTimeout(() => isDragging = false, 0);
}

/**
 * Performs the actual drop operation
 */
function performTouchDrop(ev) {
  const touch = ev.changedTouches[0];
  const column = getColumnUnderPoint(touch.clientX, touch.clientY);
  if (!column || touchDragTaskId === null) return;
  
  currentDraggedTaskId = touchDragTaskId;
  const status = getStatusFromColumnId(column.id);
  if (!status) return;

  const targetInfo = getTouchDropTargetInfo(touch.clientX, touch.clientY);
  moveTo(status, targetInfo.taskId, targetInfo.relativePos);
}

/**
 * Gets the drop target information (taskId and relativePos)
 */
function getTouchDropTargetInfo(x, y) {
  const element = document.elementFromPoint(x, y);
  const targetCard = element ? element.closest(".task-card") : null;
  let taskId = null;
  let relativePos = "after";
  
  if (targetCard && targetCard !== touchDragElement) {
    taskId = getTaskIdFromCard(targetCard);
    const rect = targetCard.getBoundingClientRect();
    if (x < rect.left + rect.width / 2) relativePos = "before";
  }
  return { taskId, relativePos };
}

/**
 * Cleans up drag state after drop
 */
function cleanupTouchDragState() {
  touchDragClone.remove();
  touchDragClone = null;
  touchDragElement.style.opacity = "";
  removeAllHighlights();
}

/**
 * Updates auto-scroll direction based on touch position
 * @param {number} y - Y coordinate of the touch
 */
function updateAutoScroll(y) {
  const scrollThreshold = 100;
  const windowHeight = window.innerHeight;

  if (y < scrollThreshold) {
    scrollDirection = -1;
    startAutoScroll();
  } else if (y > windowHeight - scrollThreshold) {
    scrollDirection = 1;
    startAutoScroll();
  } else {
    stopAutoScroll();
  }
}

/**
 * Starts the auto-scroll interval
 */
function startAutoScroll() {
  if (autoScrollInterval) return;
  autoScrollInterval = setInterval(function () {
    window.scrollBy(0, scrollDirection * 15);
  }, 20);
}

/**
 * Stops auto-scroll interval
 */
function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
  scrollDirection = 0;
}

/**
 * Checks horizontal scroll position and adjusts auto-scroll
 * @param {number} x - Touch X coordinate
 * @param {DOMRect} rect - Bounding rectangle of the list
 * @param {HTMLElement} list - The list element
 */
function checkHorizontalScroll(x, rect, list) {
  const threshold = 50;
  if (x < rect.left + threshold) {
    scrollDirectionX = -1;
    startHorizontalAutoScroll(list);
  } else if (x > rect.right - threshold) {
    scrollDirectionX = 1;
    startHorizontalAutoScroll(list);
  } else {
    stopHorizontalAutoScroll();
  }
}

/**
 * Updates horizontal auto-scroll direction based on touch position within a column
 */
function updateHorizontalAutoScroll(x, y) {
  const column = getColumnUnderPoint(x, y);
  const list = column ? column.querySelector(".task-list") : null;
  if (!list) return stopHorizontalAutoScroll();
  
  checkHorizontalScroll(x, list.getBoundingClientRect(), list);
}

/**
 * Starts the horizontal auto-scroll interval for a specific list
 */
function startHorizontalAutoScroll(list) {
  if (horizontalAutoScrollInterval && currentScrollingList === list) return;
  stopHorizontalAutoScroll();
  currentScrollingList = list;
  horizontalAutoScrollInterval = setInterval(function () {
    if (currentScrollingList) {
      currentScrollingList.scrollLeft += scrollDirectionX * 15;
    }
  }, 20);
}

/**
 * Stops horizontal auto-scroll interval
 */
function stopHorizontalAutoScroll() {
  if (horizontalAutoScrollInterval) {
    clearInterval(horizontalAutoScrollInterval);
    horizontalAutoScrollInterval = null;
  }
  scrollDirectionX = 0;
  currentScrollingList = null;
}

/**
 * Finds the board column under a specific point
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {HTMLElement|null} The column element or null
 */
function getColumnUnderPoint(x, y) {
  const columns = document.querySelectorAll(".board-column");
  for (let i = 0; i < columns.length; i++) {
    const rect = columns[i].getBoundingClientRect();
    const inX = x >= rect.left && x <= rect.right;
    const inY = y >= rect.top && y <= rect.bottom;
    if (inX && inY) {
      return columns[i];
    }
  }
  return null;
}

/**
 * Returns the status string for a column ID
 * @param {string} columnId - The HTML ID of the column
 * @returns {string|null} The status string or null
 */
function getStatusFromColumnId(columnId) {
  if (columnId === "column-todo") return "todo";
  if (columnId === "column-inprogress") return "inprogress";
  if (columnId === "column-awaitfeedback") return "awaitfeedback";
  if (columnId === "column-done") return "done";
  return null;
}

/**
 * Highlights the column under the touch point
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function highlightColumnUnderTouch(x, y) {
  removeAllHighlights();
  const column = getColumnUnderPoint(x, y);
  if (column) {
    const list = column.querySelector(".task-list");
    if (list) {
      list.classList.add("drag-over");
    }
  }
}

/**
 * Removes all drag highlighting
 */
function removeAllHighlights() {
  const lists = document.querySelectorAll(".task-list");
  for (let i = 0; i < lists.length; i++) {
    lists[i].classList.remove("drag-over");
  }
}
