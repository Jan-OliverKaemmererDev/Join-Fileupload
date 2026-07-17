/**
 * @fileoverview Logik für das mobile Board-Edit Overlay.
 * Verwaltet Formular, Kontakte, Priorität und Speichern beim Bearbeiten eines Tasks.
 */

let mobileEditTaskId = null;
let mobileEditSelectedContacts = [];
let mobileEditSubtasks = [];
let mobileEditSelectedPriority = "medium";
let mobileEditAttachments = [];
let currentMobileEditTaskOriginalState = null;

/**
 * Öffnet das mobile Edit-Overlay für einen Task.
 * @param {number} taskId - Die ID des Tasks
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
 * Schließt das mobile Edit-Overlay und setzt den Zustand zurück.
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
 * Füllt das mobile Edit-Formular mit den Daten eines Tasks.
 * @param {Object} task - Das Task-Objekt
 */
function fillMobileEditForm(task) {
  currentMobileEditTaskOriginalState = JSON.stringify({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    assignedTo: task.assignedTo ? [...task.assignedTo].sort() : [],
    subtasks: task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [],
    attachments: task.attachments ? task.attachments.length : 0
  });

  fillMobileEditBasicInfo(task);
  selectMobileEditPriority(task.priority || "medium");
  fillMobileEditSubtasks(task);
  fillMobileEditContacts(task);
  renderMobileEditAssignedToOptions();
  renderMobileEditSelectedInitials();
  mobileEditAttachments = task.attachments ? JSON.parse(JSON.stringify(task.attachments)) : [];
  if (typeof updateMobileEditAttachmentsPreview === "function") {
    updateMobileEditAttachmentsPreview();
  }
  validateMobileEditForm();
}

/**
 * Füllt die Grunddaten (Titel, Beschreibung, Datum) im mobilen Edit-Formular.
 * @param {Object} task - Das Task-Objekt
 */
function fillMobileEditBasicInfo(task) {
  document.getElementById("mobile-edit-title").value = task.title || "";
  document.getElementById("mobile-edit-description").value =
    task.description || "";
  document.getElementById("mobile-edit-due-date").value = task.dueDate || "";
}

/**
 * Füllt die Subtasks im mobilen Edit-Formular aus den Task-Daten.
 * @param {Object} task - Das Task-Objekt
 */
function fillMobileEditSubtasks(task) {
  mobileEditSubtasks =
    task.subtasks && task.subtasks.length > 0
      ? JSON.parse(JSON.stringify(task.subtasks))
      : [];
  renderMobileEditSubtasks();
}

/**
 * Füllt die ausgewählten Kontakte im mobilen Edit-Formular.
 * @param {Object} task - Das Task-Objekt
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
 * Setzt die Priorität im mobilen Edit-Overlay.
 * @param {string} priority - Die Priorität ("urgent", "medium", "low")
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
 * Rendert die Kontaktoptionen im Assigned-To-Dropdown des mobilen Edits.
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
 * Erstellt Avatar-Daten (HTML und Style) für einen Kontakt.
 * Gibt ein Objekt mit avatarInner und avatarStyle zurück.
 * @param {Object} contact - Das Kontakt-Objekt
 * @param {string} [imgClass] - Optionale CSS-Klasse für das Profilbild
 * @returns {{avatarInner: string, avatarStyle: string}} Avatar-Daten
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
 * Erstellt das Template für eine Kontakt-Option im Assigned-To-Dropdown.
 * @param {Object} contact - Das Kontakt-Objekt
 * @param {boolean} isSelected - Ob der Kontakt ausgewählt ist
 * @returns {string} HTML-String der Kontakt-Option
 */
function getMobileEditContactOptionTemplate(contact, isSelected) {
  const selectedClass = isSelected ? "selected" : "";
  const nameSuffix = contact.isYou ? " (You)" : "";
  const avatar = buildMobileEditContactAvatar(contact, "account-profile-img");
  return getMobileEditContactOptionHtml(contact, selectedClass, nameSuffix, avatar.avatarInner, avatar.avatarStyle);
}

/**
 * Schaltet die Auswahl eines Kontakts im Assigned-To-Dropdown um.
 * @param {string} contactId - Die ID des Kontakts
 * @param {Event} event - Das Klick-Event
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
 * Fügt einen Kontakt zur Auswahl hinzu oder entfernt ihn.
 * @param {string} contactId - Die ID des Kontakts
 * @param {Object} contact - Das Kontakt-Objekt
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
 * Rendert die Avatare der ausgewählten Kontakte unterhalb des Dropdowns.
 * Zeigt entweder ein Profilbild oder die Initialen mit Hintergrundfarbe an.
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
 * Schaltet das Assigned-To-Dropdown im mobilen Edit um.
 */
function toggleMobileEditAssignedToDropdown() {
  const wrapper = document.getElementById("mobile-edit-assigned-to-wrapper");
  const options = document.getElementById("mobile-edit-assigned-to-options");
  wrapper.classList.toggle("open");
  options.classList.toggle("d-none");
}

/**
 * Event-Listener: Schließt das Assigned-To-Dropdown bei Klick außerhalb des Wrappers.
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
 * Überprüft, ob das mobile Formular geändert wurde.
 * @returns {boolean} True, wenn Änderungen vorgenommen wurden.
 */
function isMobileTaskDirty() {
  if (!currentMobileEditTaskOriginalState) return true;
  
  const currentAssignedTo = mobileEditSelectedContacts ? [...mobileEditSelectedContacts].map(c => typeof c === 'object' ? c.id : c).sort() : [];
  const currentSubtasks = mobileEditSubtasks ? mobileEditSubtasks : [];
  const currentAttachments = typeof mobileEditAttachments !== 'undefined' ? mobileEditAttachments.length : 0;
  
  const currentState = JSON.stringify({
    title: document.getElementById("mobile-edit-title").value.trim(),
    description: document.getElementById("mobile-edit-description").value.trim(),
    dueDate: document.getElementById("mobile-edit-due-date").value,
    priority: typeof mobileEditSelectedPriority !== 'undefined' ? mobileEditSelectedPriority : "medium",
    assignedTo: currentAssignedTo,
    subtasks: currentSubtasks,
    attachments: currentAttachments
  });
  
  return currentState !== currentMobileEditTaskOriginalState;
}

/**
 * Validiert das mobile Edit-Formular.
 * Deaktiviert den Speichern-Button, wenn Titel oder Datum fehlen, oder keine Änderungen vorgenommen wurden.
 */
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
 * Speichert den bearbeiteten Task.
 * Liest Formulardaten, aktualisiert den Task und speichert ihn.
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
 * Aktualisiert das Task-Objekt mit den Daten aus dem mobilen Edit-Formular.
 * @param {Object} task - Das zu aktualisierende Task-Objekt
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
 * Schließt alle Overlays und zeigt eine Erfolgsmeldung nach dem Speichern.
 */
function finalizeMobileEditSave() {
  renderTasks();
  closeMobileEditOverlay();
  closeTaskDetails();
  showToast("Task updated successfully");
}
