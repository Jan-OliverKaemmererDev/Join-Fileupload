/**
 * Generiert das HTML-Template für eine Task-Karte
 * @param {Object} task - Das Task-Objekt
 * @param {string} categoryClass - Die CSS-Klasse für die Kategorie
 * @param {string} categoryLabel - Das Label für die Kategorie
 * @param {string} progressHtml - Das HTML für den Fortschrittsbalken
 * @param {string} assigneesHtml - Das HTML für die zugewiesenen Benutzer
 * @param {string} priorityIcon - Das HTML für das Prioritäts-Icon
 * @returns {string} Das HTML-Template für die Task-Karte
 */
function getTaskCardTemplate(
  task,
  categoryClass,
  categoryLabel,
  progressHtml,
  assigneesHtml,
  priorityIcon,
) {
  let sourceIcon = "";
  if (task.createdBy === "extern") {
    sourceIcon = `<img src="./assets/icons/issue-collector/wand.svg" class="task-source-icon" alt="Extern">`;
  } else if (task.creatorType === "internal-user" || (task.createdBy && task.createdBy !== "extern")) {
    sourceIcon = `<img src="./assets/icons/issue-collector/profile.svg" class="task-source-icon" alt="User">`;
  }

  return `
    <article class="task-card" tabindex="0" draggable="true" data-task-id="${task.id}" ondragstart="startDragging(${task.id}, event)" ondragend="endDragging()" onclick="openTaskDetails(${task.id})" onkeydown="if(event.key === 'Enter'){ openTaskDetails(${task.id}); event.preventDefault(); }" aria-label="Task: ${task.title}">
      ${sourceIcon}
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
 * Generiert das HTML-Template für einen Fortschrittsbalken
 * @param {number} completed - Anzahl der abgeschlossenen Subtasks
 * @param {number} total - Gesamtanzahl der Subtasks
 * @returns {string} Das HTML-Template für den Fortschrittsbalken
 */
function getProgressBarTemplate(completed, total) {
  const percent = (completed / total) * 100;
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
 * Generiert das HTML-Template für ein Assignee-Badge
 * @param {string} initials - Die Initialen des Assignees
 * @returns {string} Das HTML-Template für das Assignee-Badge
 */
function getAssigneeBadgeTemplate(initials, color, profileImageBase64 = null) {
  const backgroundColor = color || "#00bee8";
  if (profileImageBase64) {
    return `<span class="assignee-badge" style="background-color: ${backgroundColor};" aria-label="Assignee: ${initials}"><img src="${profileImageBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Profile picture of ${initials}"></span>`;
  }
  return `<span class="assignee-badge" style="background-color: ${backgroundColor};" aria-label="Assignee: ${initials}">${initials}</span>`;
}


/**
 * Generiert das HTML-Template für fehlende Tasks
 * @param {string} message - Die anzuzeigende Nachricht
 * @returns {string} Das HTML-Template für die Fehlmeldung
 */
function getNoTasksTemplate(message) {
  return `<p class="no-tasks" aria-label="${message}">${message}</p>`;
}


/**
 * Generiert das HTML-Template für ein Subtask-Element in der Detailansicht
 * @param {number} taskId - Die ID des Tasks
 * @param {number} index - Der Index des Subtasks
 * @param {Object} st - Das Subtask-Objekt
 * @returns {string} Das HTML-Template für das Subtask-Element
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
 * Generiert das HTML-Template für die Task-Detailansicht
 * @param {Object} task - Das Task-Objekt
 * @param {string} subtasksHtml - Das HTML für die Subtasks
 * @param {string} priorityIcon - Das HTML für das Prioritäts-Icon
 * @param {string} categoryClass - Die CSS-Klasse für die Kategorie
 * @param {string} categoryLabel - Das Label für die Kategorie
 * @param {string} assignedToHtml - Das HTML für die zugewiesenen Kontakte
 * @returns {string} Das HTML-Template für die Task-Details
 */
function getTaskDetailsTemplate(
  task,
  subtasksHtml,
  priorityIcon,
  categoryClass,
  categoryLabel,
  assignedToHtml,
  attachmentsHtml = ""
) {
  let aiIndicator = "";
  if (task.createdBy === "extern") {
    aiIndicator = `
      <span style="display: flex; align-items: center; gap: 8px;">
        <img src="./assets/icons/issue-collector/wand.svg" alt="AI">
        <span style="background: linear-gradient(to right, #9327FF, #2EA1DC); -webkit-background-clip: text; color: transparent; font-size: 16px;">Ai-generated ticket</span>
      </span>
    `;
  }

  let creatorSection = "";
  if (task.createdBy === "extern") {
    creatorSection = `
      <section class="task-details-info task-creator-section" aria-label="Task creator info">
        <span class="task-details-label">Creator:</span>
        <div class="task-creator-info">
          <span class="creator-badge creator-badge-extern">
            <img src="./assets/icons/issue-collector/globe.svg" alt="Extern">
            Extern
          </span>
          <div class="creator-person-info">
            <span class="creator-name">${task.creatorName || "Externer Benutzer"}</span>
            <a href="mailto:${task.creatorEmail || ''}" target="_blank" class="creator-contact-link">
              <img src="./assets/icons/issue-collector/email.svg" class="creator-contact-icon-email" alt="Email">
              E-mail
            </a>
          </div>
        </div>
      </section>
    `;
  } else if (task.creatorType === "internal-user" || (task.createdBy && task.createdBy !== "extern")) {
    const name = task.creatorName || "Member";
    const email = task.creatorEmail || "";
    creatorSection = `
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

  return `
    <header class="task-details-header" aria-label="Task header">
      <div style="display: flex; align-items: center; gap: 16px;">
        <span class="category-tag ${categoryClass}" aria-label="Category: ${categoryLabel}">${categoryLabel}</span>
        ${aiIndicator}
      </div>
      <button class="task-details-close" onclick="closeTaskDetails()" aria-label="Close task details">
        <img src="./assets/icons/clear-X-icon.svg" alt="Close">
      </button>
    </header>
    <h1 class="task-details-title">${task.title}</h1>
    <p class="task-description task-description-full">${task.description}</p>
    ${creatorSection}
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
 * Generiert ein HTML-Template für einen zugewiesenen Kontakt in der Detailansicht
 * @param {string} initials - Initialen des Kontakts
 * @param {string} color - Hintergrundfarbe des Badges
 * @param {string} name - Vollständiger Name des Kontakts
 * @returns {string} Das HTML für den Kontakt-Eintrag
 */
function getAssignedToDetailItemTemplate(initials, color, name, profileImageBase64 = null) {
  if (profileImageBase64) {
    return `
      <span class="assignee-badge assignee-badge-detail" style="background-color: ${color};" aria-label="Assignee: ${name}"><img src="${profileImageBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Profile picture of ${name}"></span>
    `;
  }
  return `
    <span class="assignee-badge assignee-badge-detail" style="background-color: ${color};" aria-label="Assignee: ${name}">${initials}</span>
  `;
}


/**
 * Generiert das HTML-Icon für hohe Priorität
 * @returns {string} Das HTML für das Urgent-Icon
 */
function getUrgentPriorityIcon() {
  return `<img src="./assets/icons/urgent-iconAddTask.png" alt="Urgent">`;
}


/**
 * Generiert das HTML-Icon für mittlere Priorität
 * @returns {string} Das HTML für das Medium-Icon
 */
function getMediumPriorityIcon() {
  return `<img src="./assets/icons/medium-iconAddTask.png" alt="Medium">`;
}


/**
 * Generiert das HTML-Icon für niedrige Priorität
 * @returns {string} Das HTML für das Low-Icon
 */
function getLowPriorityIcon() {
  return `<img src="./assets/icons/low-iconAddTask.png" alt="Low">`;
}

/**
 * HTML-Template für ein Attachment Thumbnail
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
 * HTML-Template für die Attachments-Sektion
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
