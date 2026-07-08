/**
 * Generiert das HTML für eine Task-Karte
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das generierte HTML
 */
function generateTaskCardHtml(task) {
  const catClass = getCategoryClass(task.category);
  const catLabel = getCategoryLabel(task.category);
  return getTaskCardTemplate(
    task,
    catClass,
    catLabel,
    generateProgressHtml(task),
    generateAssigneesHtml(task),
    getPriorityIcon(task.priority),
  );
}

/**
 * Gibt die CSS-Klasse für eine Kategorie zurück
 * @param {string} category - Die Kategorie
 * @returns {string} Die CSS-Klasse
 */
function getCategoryClass(category) {
  return category === "user-story"
    ? "category-user-story"
    : "category-technical";
}

/**
 * Gibt das Label für eine Kategorie zurück
 * @param {string} category - Die Kategorie
 * @returns {string} Das Kategorie-Label
 */
function getCategoryLabel(category) {
  return category === "user-story" ? "User Story" : "Technical Task";
}

/**
 * Generiert das HTML für den Fortschrittsbalken
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das HTML für den Fortschrittsbalken
 */
function generateProgressHtml(task) {
  if (task.subtasks && task.subtasks.length > 0) {
    const completed = countCompletedSubtasks(task.subtasks);
    const total = task.subtasks.length;
    return getProgressBarTemplate(completed, total);
  }
  return "";
}

/**
 * Zählt die abgeschlossenen Subtasks
 * @param {Array} subtasks - Array mit Subtasks
 * @returns {number} Anzahl der abgeschlossenen Subtasks
 */
function countCompletedSubtasks(subtasks) {
  let count = 0;
  for (let i = 0; i < subtasks.length; i++) {
    if (subtasks[i].completed) {
      count++;
    }
  }
  return count;
}

/**
 * Generiert das HTML für zugewiesene Benutzer
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das HTML für die Assignees
 */
function generateAssigneesHtml(task) {
  if (!task.assignedTo || !Array.isArray(task.assignedTo)) return "";
  let html = addAssigneeBadges(task.assignedTo);
  if (task.assignedTo.length > 3) {
    html += addExtraAssigneesBadge(task.assignedTo.length);
  }
  return html;
}

/**
 * Fügt die Badges für die ersten 3 Assignees hinzu
 */
function addAssigneeBadges(assignedTo) {
  let html = "";
  const displayCount = Math.min(assignedTo.length, 3);
  for (let i = 0; i < displayCount; i++) {
    const contact = findContactById(assignedTo[i]);
    if (contact) {
      const initials = getInitialsFromName(contact.name);
      html += getAssigneeBadgeTemplate(initials, contact.color);
    }
  }
  return html;
}

/**
 * Fügt das "+X" Badge hinzu
 */
function addExtraAssigneesBadge(totalCount) {
  return getAssigneeBadgeTemplate(`+${totalCount - 3}`, "#2A3647");
}

/**
 * Sucht einen Kontakt anhand der ID (ohne Arrow Function)
 */
function findContactById(contactId) {
  return allContacts.find(function (c) {
    return String(c.id) === String(contactId);
  });
}

/**
 * Generiert das HTML für zugewiesene Kontakte in der Detailansicht
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das HTML mit Kontakt-Badges und Namen
 */
function buildAssignedToDetailsHtml(task) {
  if (
    !task.assignedTo ||
    !Array.isArray(task.assignedTo) ||
    task.assignedTo.length === 0
  ) {
    return "<span>No one</span>";
  }
  return buildAssigneeDetailItems(task.assignedTo);
}

/**
 * Baut die HTML-Einträge für alle zugewiesenen Kontakte
 * @param {Array} assignedIds - Array von Kontakt-IDs
 * @returns {string} Das HTML für alle Kontakt-Einträge
 */
function buildAssigneeDetailItems(assignedIds) {
  let html = "";
  for (let i = 0; i < assignedIds.length; i++) {
    html += processAssigneeItem(assignedIds[i]);
  }
  return html || "<span>No one</span>";
}

/**
 * Verarbeitet einen einzelnen Assignee-Eintrag für Details
 */
function processAssigneeItem(contactId) {
  const contact = findContactById(contactId);
  if (contact) {
    const initials = getInitialsFromName(contact.name);
    return getAssignedToDetailItemTemplate(
      initials,
      contact.color,
      contact.name,
    );
  }
  return "";
}

/**
 * Gibt das Icon für eine Priorität zurück
 * @param {string} priority - Die Priorität
 * @returns {string} Das HTML für das Prioritäts-Icon
 */
function getPriorityIcon(priority) {
  if (priority === "urgent") {
    return getUrgentPriorityIcon();
  } else if (priority === "medium") {
    return getMediumPriorityIcon();
  } else {
    return getLowPriorityIcon();
  }
}

/**
 * Generiert das HTML für die Subtasks-Liste
 * @param {Object} task - Das Task-Objekt
 * @returns {string} Das HTML für die Subtasks
 */
function buildSubtasksHtml(task) {
  let subtasksHtml = "";
  for (let i = 0; i < task.subtasks.length; i++) {
    const st = task.subtasks[i];
    subtasksHtml += getSubtaskItemDetailTemplate(task.id, i, st);
  }
  return subtasksHtml;
}
