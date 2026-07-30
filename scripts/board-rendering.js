/**
 * @fileoverview Rendering logic for the board view and its tasks.
 */
/**
 * Generates the HTML for a task card
 * @param {Object} task - The task object
 * @returns {string} The generated HTML
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
 * Returns the CSS class for a category
 * @param {string} category - The category
 * @returns {string} The CSS class
 */
function getCategoryClass(category) {
  return category === "user-story"
    ? "category-user-story"
    : "category-technical";
}

/**
 * Returns the label for a category
 * @param {string} category - The category
 * @returns {string} The category label
 */
function getCategoryLabel(category) {
  return category === "user-story" ? "User Story" : "Technical Task";
}

/**
 * Generates the HTML for the progress bar
 * @param {Object} task - The task object
 * @returns {string} The HTML for the progress bar
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
 * Counts completed subtasks
 * @param {Array} subtasks - Array of subtasks
 * @returns {number} Number of subtasks completed
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
 * Generates the HTML for assigned users
 * @param {Object} task - The task object
 * @returns {string} The HTML for the assignees
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
 * Adds the badges for the first 3 assignees
 */
function addAssigneeBadges(assignedTo) {
  let html = "";
  const displayCount = Math.min(assignedTo.length, 3);
  for (let i = 0; i < displayCount; i++) {
    html += buildSingleAssigneeBadge(assignedTo[i]);
  }
  return html;
}

/**
 * Builds a single assignee badge HTML
 */
function buildSingleAssigneeBadge(contactId) {
  const contact = findContactById(contactId);
  if (!contact) return "";
  const initials = getInitialsFromName(contact.name);
  const profileImg = getContactProfileImage(contact);
  return getAssigneeBadgeTemplate(initials, contact.color, profileImg);
}

/**
 * Returns the profile image base64 if available
 */
function getContactProfileImage(contact) {
  if (contact.profileImageSmall?.base64) return contact.profileImageSmall.base64;
  if (contact.profileImage?.base64) return contact.profileImage.base64;
  return null;
}

/**
 * Adds the "+X" badge
 */
function addExtraAssigneesBadge(totalCount) {
  return getAssigneeBadgeTemplate(`+${totalCount - 3}`, "#2A3647");
}

/**
 * Searches for a contact by ID (without Arrow Function)
 */
function findContactById(contactId) {
  return allContacts.find(function (c) {
    return String(c.id) === String(contactId);
  });
}

/**
 * Generates the HTML for assigned contacts in the details view
 * @param {Object} task - The task object
 * @returns {string} The HTML with contact badges and names
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
 * Builds the HTML entries for all assigned contacts
 * @param {Array} assignedIds - Array of contact IDs
 * @returns {string} The HTML for all contact entries
 */
function buildAssigneeDetailItems(assignedIds) {
  let html = "";
  for (let i = 0; i < assignedIds.length; i++) {
    html += processAssigneeItem(assignedIds[i]);
  }
  return html || "<span>No one</span>";
}

/**
 * Processes a single assignee entry for details
 */
function processAssigneeItem(contactId) {
  const contact = findContactById(contactId);
  if (!contact) return "";
  
  const initials = getInitialsFromName(contact.name);
  const profileImg = getContactProfileImage(contact);
  
  return getAssignedToDetailItemTemplate(
    initials,
    contact.color,
    contact.name,
    profileImg
  );
}

/**
 * Returns the icon for a priority
 * @param {string} priority - The priority
 * @returns {string} The HTML for the priority icon
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
 * Generates the HTML for the subtasks list
 * @param {Object} task - The task object
 * @returns {string} The HTML for the subtasks
 */
function buildSubtasksHtml(task) {
  let subtasksHtml = "";
  for (let i = 0; i < task.subtasks.length; i++) {
    const st = task.subtasks[i];
    subtasksHtml += getSubtaskItemDetailTemplate(task.id, i, st);
  }
  return subtasksHtml;
}
