let autoScrollInterval;
let scrollDirection = 0; // 1 for down, -1 for up, 0 for none
let horizontalAutoScrollInterval;
let scrollDirectionX = 0; // 1 for right, -1 for left, 0 for none
let currentScrollingList = null;

/**
 * Initialisiert Touch-Drag-and-Drop für mobile Geräte
 */
function initTouchDragDrop() {
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
}

/**
 * Behandelt den Touchstart auf einer Task-Karte
 * @param {TouchEvent} ev - Das Touch-Event
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
 * Behandelt die Touchmove-Events während des Drags
 * @param {TouchEvent} ev - Das Touch-Event
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
 * Erstellt einen visuellen Klon der Karte für den Touch-Drag
 * @param {Touch} touch - Das Touch-Objekt
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
 * Aktualisiert Position des Klons und prüft Highlights/Scroll
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
 * Behandelt das Touchend-Event und führt den Drop aus
 * @param {TouchEvent} ev - Das Touch-Event
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
  touchDragElement = null;
  touchDragTaskId = null;
  setTimeout(function () {
    isDragging = false;
  }, 0);
}

/**
 * Führt den eigentlichen Drop-Vorgang aus
 */
function performTouchDrop(ev) {
  const touch = ev.changedTouches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  const column = getColumnUnderPoint(x, y);

  if (column && touchDragTaskId !== null) {
    currentDraggedTaskId = touchDragTaskId;
    const status = getStatusFromColumnId(column.id);

    const element = document.elementFromPoint(x, y);
    const targetCard = element ? element.closest(".task-card") : null;
    let targetTaskId = null;
    let relativePos = "after";

    if (targetCard && targetCard !== touchDragElement) {
      targetTaskId = getTaskIdFromCard(targetCard);
      const rect = targetCard.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (x < midX) relativePos = "before";
    }

    if (status) {
      moveTo(status, targetTaskId, relativePos);
    }
  }
}

/**
 * Bereinigt den Drag-Zustand nach dem Drop
 */
function cleanupTouchDragState() {
  touchDragClone.remove();
  touchDragClone = null;
  touchDragElement.style.opacity = "";
  removeAllHighlights();
}

/**
 * Aktualisiert die Auto-Scroll-Richtung basierend auf der Touch-Position
 * @param {number} y - Y-Koordinate des Touches
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
 * Startet den Auto-Scroll-Intervall
 */
function startAutoScroll() {
  if (autoScrollInterval) return;
  autoScrollInterval = setInterval(function () {
    window.scrollBy(0, scrollDirection * 15);
  }, 20);
}

/**
 * Stoppt den Auto-Scroll-Intervall
 */
function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
  scrollDirection = 0;
}

/**
 * Aktualisiert die horizontale Auto-Scroll-Richtung basierend auf der Touch-Position innerhalb einer Spalte
 */
function updateHorizontalAutoScroll(x, y) {
  const column = getColumnUnderPoint(x, y);
  if (!column) {
    stopHorizontalAutoScroll();
    return;
  }
  const list = column.querySelector(".task-list");
  if (!list) {
    stopHorizontalAutoScroll();
    return;
  }
  const rect = list.getBoundingClientRect();
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
 * Startet den horizontalen Auto-Scroll-Intervall für eine spezifische Liste
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
 * Stoppt den horizontalen Auto-Scroll-Intervall
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
 * Findet die Board-Spalte unter einem bestimmten Punkt
 * @param {number} x - X-Koordinate
 * @param {number} y - Y-Koordinate
 * @returns {HTMLElement|null} Das Spalten-Element oder null
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
 * Gibt den Status-String für eine Spalten-ID zurück
 * @param {string} columnId - Die HTML-ID der Spalte
 * @returns {string|null} Der Status-String oder null
 */
function getStatusFromColumnId(columnId) {
  if (columnId === "column-todo") return "todo";
  if (columnId === "column-inprogress") return "inprogress";
  if (columnId === "column-awaitfeedback") return "awaitfeedback";
  if (columnId === "column-done") return "done";
  return null;
}

/**
 * Hebt die Spalte unter dem Touch-Punkt hervor
 * @param {number} x - X-Koordinate
 * @param {number} y - Y-Koordinate
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
 * Entfernt alle Drag-Hervorhebungen
 */
function removeAllHighlights() {
  const lists = document.querySelectorAll(".task-list");
  for (let i = 0; i < lists.length; i++) {
    lists[i].classList.remove("drag-over");
  }
}
