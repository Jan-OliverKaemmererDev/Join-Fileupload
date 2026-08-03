/**
 * @fileoverview HTML templates generating functions for the board view.
 */

/**
 * Generates the HTML template for a task card
 * @param {Object} task - The task object
 * @param {string} categoryClass - The CSS class for the category
 * @param {string} categoryLabel - The label for the category
 * @param {string} progressHtml - The HTML for the progress bar
 * @param {string} assigneesHtml - The HTML for the assigned users
 * @param {string} priorityIcon - The HTML for the priority icon
 * @returns {string} The HTML template for the task card
 */
function getTaskCardTemplate(
  task,
  categoryClass,
  categoryLabel,
  progressHtml,
  assigneesHtml,
  priorityIcon,
  sourceIconHtml,
) {
  return `
    <article class="task-card" tabindex="0" draggable="true" data-task-id="${task.id}" ondragstart="startDragging(${task.id}, event)" ondragend="endDragging()" onclick="openTaskDetails(${task.id})" onkeydown="if(event.key === 'Enter'){ openTaskDetails(${task.id}); event.preventDefault(); }" aria-label="Task: ${task.title}">
      ${sourceIconHtml}
      <span class="category-tag ${categoryClass}" aria-label="Category: ${categoryLabel}">${categoryLabel}</span>
      <h3 class="task-title">${task.title}</h3>
      <p class="task-description">${task.description}</p>
      ${progressHtml}
      <footer class="task-footer">
        <div class="task-assignees" aria-label="Assignees">
          ${assigneesHtml}
        </div>
        <div class="task-priority">
          ${priorityIcon}
        </div>
      </footer>
    </article>
  `;
}


/**
 * Generates the HTML template for a progress bar
 * @param {number} completed - Number of subtasks completed
 * @param {number} total - Total number of subtasks
 * @param {number} percent - The calculated percentage of completion
 * @returns {string} The HTML template for the progress bar
 */
function getProgressBarTemplate(completed, total, percent) {
  return `
    <section class="task-subtasks" aria-label="Subtasks progress">
      <div class="progress-bar-container" role="progressbar" aria-label="Progress bar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" style="width: ${percent}%"></div>
      </div>
      <span>${completed}/${total} Subtasks</span>
    </section>
  `;
}


/**
 * Generates the HTML template for an assignee badge with an image
 * @param {string} initials - The assignee's initials
 * @param {string} color - The background color
 * @param {string} profileImageBase64 - The base64 string of the image
 * @returns {string} The HTML template for the assignee badge
 */
function getAssigneeImageBadgeTemplate(initials, color, profileImageBase64) {
  const backgroundColor = color || "#00bee8";
  return `<span class="assignee-badge" style="background-color: ${backgroundColor};" aria-label="Assignee: ${initials}"><img src="${profileImageBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Profile picture of ${initials}"></span>`;
}


/**
 * Generates the HTML template for an assignee badge with initials
 * @param {string} initials - The assignee's initials
 * @param {string} color - The background color
 * @returns {string} The HTML template for the assignee badge
 */
function getAssigneeInitialsBadgeTemplate(initials, color) {
  const backgroundColor = color || "#00bee8";
  return `<span class="assignee-badge" style="background-color: ${backgroundColor};" aria-label="Assignee: ${initials}">${initials}</span>`;
}


/**
 * Generates the HTML template for missing tasks
 * @param {string} message - The message to display
 * @returns {string} The HTML template for the error message
 */
function getNoTasksTemplate(message) {
  return `<p class="no-tasks" aria-label="${message}">${message}</p>`;
}


/**
 * Generates the HTML template for a subtask element in the details view
 * @param {number} taskId - The ID of the task
 * @param {number} index - The index of the subtask
 * @param {Object} st - The subtask object
 * @returns {string} The HTML template for the subtask element
 */
function getSubtaskItemDetailTemplate(taskId, index, st) {
  const checkedClass = st.completed ? "checked" : "";
  return `
    <label class="subtask-item-detail" onclick="toggleSubtask(${taskId}, ${index})" aria-label="Subtask: ${st.text}">
      <div class="subtask-checkbox ${checkedClass}" aria-hidden="true"></div>
      <span>${st.text}</span>
    </label>
  `;
}


/**
 * Generates the HTML template for the task detail view
 * @param {Object} task - The task object
 * @param {string} subtasksHtml - The HTML for the subtasks
 * @param {string} priorityIcon - The HTML for the priority icon
 * @param {string} categoryClass - The CSS class for the category
 * @param {string} categoryLabel - The label for the category
 * @param {string} assignedToHtml - The HTML for the assigned contacts
 * @returns {string} The HTML template for the task details
 */
function getTaskDetailsTemplate(
  task,
  subtasksHtml,
  priorityIcon,
  categoryClass,
  categoryLabel,
  assignedToHtml,
  attachmentsHtml = "",
  aiIndicatorHtml = "",
  creatorSectionHtml = ""
) {
  return `
    <header class="task-details-header" aria-label="Task header">
      <div style="display: flex; align-items: center; gap: 16px;">
        <span class="category-tag ${categoryClass}" aria-label="Category: ${categoryLabel}">${categoryLabel}</span>
        ${aiIndicatorHtml}
      </div>
      <button class="task-details-close" onclick="closeTaskDetails()" aria-label="Close task details">
        <img src="./assets/icons/clear-X-icon.svg" alt="Close">
      </button>
    </header>
    <h1 class="task-details-title">${task.title}</h1>
    <p class="task-description task-description-full">${task.description}</p>
    ${creatorSectionHtml}
    <div class="task-details-info">
      <span class="task-details-label">Due date:</span>
      <span>${task.dueDate}</span>
    </div>
    <div class="task-details-info">
      <span class="task-details-label">Priority:</span>
      <div class="task-details-priority">
        <span>${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
        ${priorityIcon}
      </div>
    </div>
    <div class="task-details-info task-details-assignees">
      <span class="task-details-label">Assigned To:</span>
      <div class="assignee-details-list">${assignedToHtml}</div>
    </div>
    ${attachmentsHtml}
    <section class="subtasks-section" aria-label="Subtasks list">
      <p class="subtasks-heading">Subtasks</p>
      <div class="subtasks-list-details">
        ${subtasksHtml}
      </div>
    </section>
    <nav class="task-details-actions" aria-label="Task actions">
      <button onclick="deleteTask(${task.id})" class="task-action-btn" aria-label="Delete task">
        <img src="./assets/icons/delete.svg" alt="Delete">
        Delete
      </button>
      <hr class="task-action-separator">
      <button onclick="editTask(${task.id})" class="task-action-btn" aria-label="Edit task">
        <img src="./assets/icons/edit.svg" alt="Edit">
        Edit
      </button>
    </nav>
  `;
}


/**
 * Generates an HTML template for an assigned contact in the details view with an image
 * @param {string} color - background color of the badge
 * @param {string} name - Full name of the contact
 * @param {string} profileImageBase64 - The profile image base64
 * @returns {string} The HTML for the contact entry
 */
function getAssignedToDetailImageItemTemplate(color, name, profileImageBase64) {
  return `
    <span class="assignee-badge assignee-badge-detail" style="background-color: ${color};" aria-label="Assignee: ${name}"><img src="${profileImageBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Profile picture of ${name}"></span>
  `;
}


/**
 * Generates an HTML template for an assigned contact in the details view with initials
 * @param {string} initials - Initials of the contact
 * @param {string} color - background color of the badge
 * @param {string} name - Full name of the contact
 * @returns {string} The HTML for the contact entry
 */
function getAssignedToDetailInitialsItemTemplate(initials, color, name) {
  return `
    <span class="assignee-badge assignee-badge-detail" style="background-color: ${color};" aria-label="Assignee: ${name}">${initials}</span>
  `;
}


/**
 * Generates the high priority HTML icon
 * @returns {string} The HTML for the urgent icon
 */
function getUrgentPriorityIcon() {
  return `<img src="./assets/icons/urgent-iconAddTask.png" alt="Urgent">`;
}


/**
 * Generates the medium priority HTML icon
 * @returns {string} The HTML for the media icon
 */
function getMediumPriorityIcon() {
  return `<img src="./assets/icons/medium-iconAddTask.png" alt="Medium">`;
}


/**
 * Generates the low priority HTML icon
 * @returns {string} The HTML for the low icon
 */
function getLowPriorityIcon() {
  return `<img src="./assets/icons/low-iconAddTask.png" alt="Low">`;
}


/**
 * HTML template for an attachment thumbnail
 * @param {number} taskId 
 * @param {number} index 
 * @param {string} previewSrc 
 * @param {string} name 
 * @returns {string} HTML
 */
function getTaskAttachmentThumbnailTemplate(taskId, index, previewSrc, name) {
  return `
    <figure class="thumbnail-container" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="openImageViewer(${taskId}, ${index})" aria-label="Attachment: ${name}">
      <div class="thumbnail-image-wrapper">
        <img src="${previewSrc}" alt="${name}" title="${name}">
        <div class="thumbnail-overlay">
          <button class="btn-download-thumbnail" onclick="event.stopPropagation(); downloadAttachment(${taskId}, ${index})" title="Download" aria-label="Download attachment: ${name}">
            <img src="./assets/icons/download-white.svg" alt="Download">
          </button>
        </div>
      </div>
      <figcaption class="thumbnail-name" title="${name}">${name}</figcaption>
    </figure>
  `;
}


/**
 * HTML template for the attachments section
 * @param {string} thumbnailsHtml 
 * @returns {string} HTML
 */
function getTaskAttachmentsSectionTemplate(thumbnailsHtml) {
  return `
    <section class="task-details-attachments" aria-label="Task attachments">
      <span class="task-details-label">Attachments:</span>
      <div class="attachments-list-details">
        ${thumbnailsHtml}
      </div>
    </section>
  `;
}


/**
 * HTML template for the extern task source icon
 * @returns {string} HTML
 */
function getTaskSourceIconExternTemplate() {
  return `<img src="./assets/icons/issue-collector/wand.svg" class="task-source-icon" alt="Extern">`;
}

/**
 * HTML template for the internal user task source icon
 * @returns {string} HTML
 */
function getTaskSourceIconUserTemplate() {
  return `<img src="./assets/icons/issue-collector/profile.svg" class="task-source-icon" alt="User">`;
}


/**
 * HTML template for the AI indicator
 * @returns {string} HTML
 */
function getTaskAiIndicatorTemplate() {
  return `
    <span style="display: flex; align-items: center; gap: 8px;">
      <img src="./assets/icons/issue-collector/wand.svg" alt="AI">
      <span style="background: linear-gradient(to right, #9327FF, #2EA1DC); -webkit-background-clip: text; color: transparent; font-size: 16px;">Ai-generated ticket</span>
    </span>
  `;
}


/**
 * HTML template for the external creator section
 * @param {string} name - Creator's name
 * @param {string} email - Creator's email
 * @returns {string} HTML
 */
function getTaskCreatorExternTemplate(name, email) {
  return `
    <section class="task-details-info task-creator-section" aria-label="Task creator info">
      <span class="task-details-label">Creator:</span>
      <div class="task-creator-info">
        <span class="creator-badge creator-badge-extern">
          <img src="./assets/icons/issue-collector/globe.svg" alt="Extern">
          Extern
        </span>
        <div class="creator-person-info">
          <span class="creator-name">${name}</span>
          <a href="mailto:${email}" target="_blank" class="creator-contact-link">
            <img src="./assets/icons/issue-collector/email.svg" class="creator-contact-icon-email" alt="Email">
            E-mail
          </a>
        </div>
      </div>
    </section>
  `;
}


/**
 * HTML template for the internal creator section
 * @param {string} name - Creator's name
 * @param {string} email - Creator's email
 * @returns {string} HTML
 */
function getTaskCreatorMemberTemplate(name, email) {
  return `
    <section class="task-details-info task-creator-section" aria-label="Task creator info">
      <span class="task-details-label">Creator:</span>
      <div class="task-creator-info">
        <span class="creator-badge creator-badge-member">
          <img src="./assets/icons/issue-collector/member.svg" alt="Member">
          Member
        </span>
        <div class="creator-person-info">
          <span class="creator-name">${name}</span>
          <a href="contacts.html" onclick="sessionStorage.setItem('selectedContactEmail', '${email}')" class="creator-contact-link">
            <img src="./assets/icons/issue-collector/profile.svg" class="creator-contact-icon-profile" alt="Profil">
            Profil
          </a>
        </div>
      </div>
    </section>
  `;
}
