/**
 * @fileoverview Main logic for the mobile board edit overlay.
 */
let mobileEditTaskId = null;
let mobileEditSelectedContacts = [];
let mobileEditSubtasks = [];
let mobileEditSelectedPriority = "medium";
let mobileEditAttachments = [];

/**
 * Opens the mobile edit overlay for a task.
 * @param {number} taskId - The ID of the task
 */
function openMobileEditOverlay(taskId) {
  const task = findTask(taskId);
  if (!task) return;
  mobileEditTaskId = taskId;
  fillMobileEditForm(task);
  document.getElementById("mobile-edit-overlay").classList.add("active");
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
}

/**
 * Closes the mobile edit overlay and resets the state.
 */
function closeMobileEditOverlay() {
  document.getElementById("mobile-edit-overlay").classList.remove("active");
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
  mobileEditTaskId = null;
  mobileEditSelectedContacts = [];
  mobileEditSubtasks = [];
}

/**
 * Fills the mobile edit form with the data of a task.
 * @param {Object} task - The task object
 */
function fillMobileEditForm(task) {
  saveMobileOriginalEditState(task);
  fillMobileEditBasicInfo(task);
  selectMobileEditPriority(task.priority || "medium");
  fillMobileEditSubtasks(task);
  fillMobileEditContacts(task);
  renderMobileEditAssignedToOptions();
  renderMobileEditSelectedInitials();
  mobileEditAttachments = task.attachments ? JSON.parse(JSON.stringify(task.attachments)) : [];
  if (typeof updateMobileEditAttachmentsPreview === "function") updateMobileEditAttachmentsPreview();
  validateMobileEditForm();
}

/**
 * Saves the original task state to check for dirtiness later
 */
function saveMobileOriginalEditState(task) {
  currentMobileEditTaskOriginalState = JSON.stringify({
    title: task.title, description: task.description,
    dueDate: task.dueDate, priority: task.priority,
    assignedTo: task.assignedTo ? [...task.assignedTo].sort() : [],
    subtasks: task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [],
    attachments: task.attachments ? task.attachments.length : 0
  });
}

/**
 * Fills the basic data (title, description, date) in the mobile edit form.
 * @param {Object} task - The task object
 */
function fillMobileEditBasicInfo(task) {
  document.getElementById("mobile-edit-title").value = task.title || "";
  document.getElementById("mobile-edit-description").value =
    task.description || "";
  const mobileDateInput = document.getElementById("mobile-edit-due-date");
  if (task.dueDate) mobileDateInput.type = "date";
  mobileDateInput.value = task.dueDate || "";
}

/**
 * Populates the subtasks in the mobile edit form from the task data.
 * @param {Object} task - The task object
 */
function fillMobileEditSubtasks(task) {
  mobileEditSubtasks =
    task.subtasks && task.subtasks.length > 0
      ? JSON.parse(JSON.stringify(task.subtasks))
      : [];
  renderMobileEditSubtasks();
}

/**
 * Populates the selected contacts in the mobile edit form.
 * @param {Object} task - The task object
 */
function fillMobileEditContacts(task) {
  mobileEditSelectedContacts = [];
  if (Array.isArray(task.assignedTo)) {
    task.assignedTo.forEach(function (id) {
      const contact = allContacts.find(function (c) {
        return String(c.id) === String(id);
      });
      if (contact) mobileEditSelectedContacts.push(contact);
    });
  }
}

/**
 * Sets priority in mobile edit overlay.
 * @param {string} priority - The priority ("urgent", "medium", "low")
 */
function selectMobileEditPriority(priority) {
  mobileEditSelectedPriority = priority;
  const btns = document.querySelectorAll("#mobile-edit-overlay .priority-btn");
  btns.forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.priority === priority);
  });
  
  if (typeof validateMobileEditForm === 'function') {
    validateMobileEditForm();
  }
}

/**
 * Renders the contact options in the mobile edit's Assigned To dropdown.
 */
function renderMobileEditAssignedToOptions() {
  const container = document.getElementById("mobile-edit-assigned-to-options");
  if (!container) return;
  container.innerHTML = "";
  allContacts.forEach(function (contact) {
    const isSelected = mobileEditSelectedContacts.some(function (c) {
      return c.id === contact.id;
    });
    container.innerHTML += getMobileEditContactOptionTemplate(
      contact,
      isSelected,
    );
  });
}

/**
 * Creates avatar data (HTML and style) for a contact.
 * Returns an object with avatarInner and avatarStyle.
 * @param {Object} contact - The contact object
 * @param {string} [imgClass] - Optional CSS class for the profile picture
 * @returns {{avatarInner: string, avatarStyle: string}} avatar data
 */
function buildMobileEditContactAvatar(contact, imgClass) {
  let avatarInner = contact.initials;
  let avatarStyle = `background-color: ${contact.color}`;
  if (contact.profileImageSmall && contact.profileImageSmall.base64) {
    const cls = imgClass ? ` class="${imgClass}"` : "";
    avatarInner = `<img src="${contact.profileImageSmall.base64}"${cls} style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
  }
  return { avatarInner: avatarInner, avatarStyle: avatarStyle };
}

/**
 * Created the template for a contact option in the Assigned To dropdown.
 * @param {Object} contact - The contact object
 * @param {boolean} isSelected - Whether the contact is selected
 * @returns {string} HTML string of the contact option
 */
function getMobileEditContactOptionTemplate(contact, isSelected) {
  const selectedClass = isSelected ? "selected" : "";
  const nameSuffix = contact.isYou ? " (You)" : "";
  const avatar = buildMobileEditContactAvatar(contact, "account-profile-img");
  return getMobileEditContactOptionHtml(contact, selectedClass, nameSuffix, avatar.avatarInner, avatar.avatarStyle);
}

/**
 * Toggles the selection of a contact in the Assigned To dropdown.
 * @param {string} contactId - The ID of the contact
 * @param {Event} event - The click event
 */
function toggleMobileEditContactSelection(contactId, event) {
  event.stopPropagation();
  const contact = allContacts.find(function (c) {
    return String(c.id) === String(contactId);
  });
  if (!contact) return;
  updateMobileSelectedContacts(contactId, contact);
  renderMobileEditAssignedToOptions();
  renderMobileEditSelectedInitials();
  
  if (typeof validateMobileEditForm === 'function') {
    validateMobileEditForm();
  }
}

/**
 * Adds or removes a contact from the selection.
 * @param {string} contactId - The ID of the contact
 * @param {Object} contact - The contact object
 */
function updateMobileSelectedContacts(contactId, contact) {
  const index = mobileEditSelectedContacts.findIndex(function (c) {
    return String(c.id) === String(contactId);
  });
  if (index > -1) {
    mobileEditSelectedContacts.splice(index, 1);
  } else {
    mobileEditSelectedContacts.push(contact);
  }
}

/**
 * Renders the avatars of the selected contacts below the dropdown.
 * Displays either a profile picture or initials with background color.
 */
function renderMobileEditSelectedInitials() {
  const container = document.getElementById("mobile-edit-selected-contacts-initials");
  if (!container) return;
  container.innerHTML = "";
  mobileEditSelectedContacts.forEach(function (contact) {
    const avatar = buildMobileEditContactAvatar(contact);
    container.innerHTML += getMobileEditSelectedAvatarHtml(avatar.avatarInner, avatar.avatarStyle);
  });
}

/**
 * Toggles the Assigned To dropdown in mobile edit.
 */
function toggleMobileEditAssignedToDropdown() {
  const wrapper = document.getElementById("mobile-edit-assigned-to-wrapper");
  const options = document.getElementById("mobile-edit-assigned-to-options");
  wrapper.classList.toggle("open");
  options.classList.toggle("d-none");
}

/**
 * Event listener: Closes the assigned-to dropdown when clicked outside the wrapper.
 */
document.addEventListener(
  "click",
  function (event) {
    const wrapper = document.getElementById("mobile-edit-assigned-to-wrapper");
    if (wrapper && !wrapper.contains(event.target)) {
      wrapper.classList.remove("open");
      const options = document.getElementById(
        "mobile-edit-assigned-to-options",
      );
      if (options) options.classList.add("d-none");
    }
  },
  true,
);

/**
 * Checks whether the mobile form has been changed.
 * @returns {boolean} True if changes were made.
 */
function isMobileTaskDirty() {
  if (!currentMobileEditTaskOriginalState) return true;
  const currentStateObj = buildMobileCurrentEditState();
  return JSON.stringify(currentStateObj) !== currentMobileEditTaskOriginalState;
}

/**
 * Builds the current form state for comparison
 */
function buildMobileCurrentEditState() {
  const currentAssignedTo = mobileEditSelectedContacts ? [...mobileEditSelectedContacts].map(c => typeof c === 'object' ? c.id : c).sort() : [];
  return {
    title: document.getElementById("mobile-edit-title").value.trim(),
    description: document.getElementById("mobile-edit-description").value.trim(),
    dueDate: document.getElementById("mobile-edit-due-date").value,
    priority: typeof mobileEditSelectedPriority !== 'undefined' ? mobileEditSelectedPriority : "medium",
    assignedTo: currentAssignedTo,
    subtasks: mobileEditSubtasks ? mobileEditSubtasks : [],
    attachments: typeof mobileEditAttachments !== 'undefined' ? mobileEditAttachments.length : 0
  };
}

/**
 * Validates the mobile edit form.
 * Disables the save button if the title or date is missing or no changes have been made.
function validateMobileEditForm() {
  const title = document.getElementById("mobile-edit-title").value.trim();
  const dueDate = document.getElementById("mobile-edit-due-date").value;
  const btn = document.getElementById("mobile-edit-save-btn");
  
  let isValid = !!(title && dueDate);
  
  if (!isMobileTaskDirty()) {
    isValid = false;
  }
  
  if (btn) btn.disabled = !isValid;
}

/**
 * Saves the processed task.
 * Reads form data, updates the task and saves it.
 */
async function saveMobileEditTask() {
  if (!mobileEditTaskId) return;
  const taskIndex = findTaskById(mobileEditTaskId);
  if (taskIndex === -1) return;
  const task = tasks[taskIndex];
  updateTaskDataFromMobileEdit(task);
  await saveSingleTask(task);
  finalizeMobileEditSave();
}

/**
 * Updates the task object with the data from the mobile edit form.
 * @param {Object} task - The task object to update
 */
function updateTaskDataFromMobileEdit(task) {
  task.title = document.getElementById("mobile-edit-title").value.trim();
  task.description = document
    .getElementById("mobile-edit-description")
    .value.trim();
  task.dueDate = document.getElementById("mobile-edit-due-date").value;
  task.priority = mobileEditSelectedPriority;
  task.assignedTo = mobileEditSelectedContacts.map(function (c) {
    return c.id;
  });
  task.subtasks = JSON.parse(JSON.stringify(mobileEditSubtasks));
  task.attachments = JSON.parse(JSON.stringify(mobileEditAttachments));
}

/**
 * Closes all overlays and shows a success message after saving.
 */
function finalizeMobileEditSave() {
  renderTasks();
  closeMobileEditOverlay();
  closeTaskDetails();
  showToast("Task updated successfully");
}
