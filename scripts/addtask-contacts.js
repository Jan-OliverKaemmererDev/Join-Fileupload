/**
 * @fileoview Contact selection and handling for the add task page.
 */
/**
 * Loads contacts from Firestore
 */
async function loadContacts() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  try {
    const snapshot = await fetchContactsSnapshot(currentUser.id);
    processContactsSnapshot(snapshot, currentUser);
    sortContactsByName();
    renderAssignedToOptions();
  } catch (error) {
    console.error("Error loading contacts:", error);
  }
}

/**
 * Gets the snapshot of contacts from Firestore
 */
function fetchContactsSnapshot(userId) {
  const contactsRef = window.fbCollection(
    window.firebaseDb,
    "users",
    userId,
    "contacts",
  );
  return window.fbGetDocs(contactsRef);
}

/**
 * Processes the Firestore snapshot of contacts
 */
function processContactsSnapshot(snapshot, currentUser) {
  allContacts = [];
  
  if (currentUser) {
    allContacts.push({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
      color: "#29ABE2",
      initials: getInitialsFromName(currentUser.name),
      isYou: true,
      profileImageSmall: currentUser.profileImageSmall
    });
  }

  snapshot.forEach(function (doc) {
    const contact = doc.data();
    contact.id = doc.id;
    contact.isYou = contact.email === currentUser.email;
    if (!contact.isYou) {
      allContacts.push(contact);
    }
  });
}

/**
 * Sorts contacts alphabetically
 */
function sortContactsByName() {
  allContacts.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
}

/**
 * Renders contact options in dropdown
 */
function renderAssignedToOptions() {
  const optionsContainer = document.getElementById("assigned-to-options");
  if (!optionsContainer) return;
  optionsContainer.innerHTML = "";
  allContacts.forEach(function (contact) {
    const isSelected = selectedContacts.some(function (c) {
      return c.id === contact.id;
    });
    
    const selectedClass = isSelected ? "selected" : "";
    const nameSuffix = contact.isYou ? " (You)" : "";
    let avatarInner = contact.initials;
    let avatarStyle = `background-color: ${contact.color}`;
    
    if (contact.profileImageSmall && contact.profileImageSmall.base64) {
      avatarInner = `<img src="${contact.profileImageSmall.base64}" class="account-profile-img" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
    }

    optionsContainer.innerHTML += getContactOptionTemplate(
      contact.id, 
      contact.name, 
      selectedClass, 
      nameSuffix, 
      avatarStyle, 
      avatarInner
    );
  });
}

/**
 * Toggles the drop down menu
 */
function toggleAssignedToDropdown() {
  const wrapper = document.getElementById("assigned-to-wrapper");
  const options = document.getElementById("assigned-to-options");
  wrapper.classList.toggle("open");
  options.classList.toggle("d-none");
}

/**
 * Toggles the selection of a contact
 * @param {string} contactId - The ID of the contact
 * @param {Event} event - The click event
 */
function toggleContactSelection(contactId, event) {
  event.stopPropagation();
  const contact = allContacts.find(function (c) {
    return c.id === contactId;
  });
  if (!contact) return;
  updateSelectedContacts(contact, contactId);
  renderAssignedToOptions();
  renderSelectedInitials();
  
  if (typeof validateForm === 'function') {
    validateForm();
  }
}

/**
 * Updates the list of selected contacts
 */
function updateSelectedContacts(contact, contactId) {
  const index = selectedContacts.findIndex(function (c) {
    return c.id === contactId;
  });
  if (index > -1) {
    selectedContacts.splice(index, 1);
  } else {
    selectedContacts.push(contact);
  }
}

/**
 * Renders the initials of the selected contacts
 */
function renderSelectedInitials() {
  const container = document.getElementById("selected-contacts-initials");
  if (!container) return;
  container.innerHTML = "";
  selectedContacts.forEach(function (contact) {
    let avatarInner = contact.initials;
    let avatarStyle = `background-color: ${contact.color}`;
    
    if (contact.profileImageSmall && contact.profileImageSmall.base64) {
      avatarInner = `<img src="${contact.profileImageSmall.base64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      avatarStyle = `background-color: transparent; position: relative; overflow: hidden;`;
    }

    container.innerHTML += getSelectedContactInitialsTemplate(avatarStyle, avatarInner);
  });
}

// Schließt das Dropdown bei Klick außerhalb
document.addEventListener(
  "click",
  function (event) {
    const wrapper = document.getElementById("assigned-to-wrapper");
    if (wrapper && !wrapper.contains(event.target)) {
      wrapper.classList.remove("open");
      const options = document.getElementById("assigned-to-options");
      if (options) options.classList.add("d-none");
    }
  },
  true,
);

/**
 * Loads the assigned contacts into the form state
 * @param {Object} task - The task object
 */
function loadAssigneesForEdit(task) {
  selectedContacts = [];
  if (Array.isArray(task.assignedTo)) {
    processEditAssignees(task.assignedTo);
  }
  renderAssignedToOptions();
  renderSelectedInitials();
}

/**
 * Processes the assignees when processing a task
 */
function processEditAssignees(assignedToList) {
  for (let i = 0; i < assignedToList.length; i++) {
    const contact = findContactById(assignedToList[i]);
    if (contact) {
      selectedContacts.push(contact);
    }
  }
}

/**
 * Finds a contact by their ID
 */
function findContactById(id) {
  return allContacts.find(function (c) {
    return String(c.id) === String(id);
  });
}
