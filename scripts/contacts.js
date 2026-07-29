/**
 * @fileoverview Main logic for the contacts page.
 */
let contacts = [];

/**
 * Initializes the contact page, loads data and selects a contact if necessary
 */
function initContacts() {
  return (async function () {
    checkUser();
    await waitForFirebase();
    initSideMenu("contacts");
    await loadContactsFromFirestore();
    renderContactList();

    const selectedEmail = sessionStorage.getItem('selectedContactEmail');
    if (selectedEmail) {
      const contactToSelect = contacts.find(function(c) { return c.email === selectedEmail; });
      if (contactToSelect) {
        showContactDetails(contactToSelect.id);
      }
      sessionStorage.removeItem('selectedContactEmail');
    }
  })();
}

/**
 * Loads the contacts from Firestore
 */
function loadContactsFromFirestore() {
  return (async function () {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    await loadContactsFromFirestoreAsync(currentUser);
  })();
}

/**
 * Populates the local contacts array from a Firestore snapshot
 * @param {Object} snapshot - The Firestore snapshot
 */
function populateContactsFromSnapshot(snapshot) {
  contacts = [];
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  if (currentUser) {
    contacts.push({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
      color: "#29ABE2",
      initials: typeof getInitials === "function" ? getInitials(currentUser.name) : currentUser.name.substring(0,2).toUpperCase(),
      isYou: true,
      profileImageSmall: currentUser.profileImageSmall,
      profileImage: currentUser.profileImage
    });
  }

  snapshot.forEach(function (doc) {
    const data = doc.data();
    data.id = doc.id;
    if (!currentUser || data.email !== currentUser.email) {
      contacts.push(data);
    }
  });
}

/**
 * Sorts contacts alphabetically by name
 */
function sortContacts() {
  contacts.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
}

/**
 * Generates the initials from the name
 * @param {string} name - The full name
 * @returns {string} The initials
 */
function getInitials(name) {
  const parts = name.split(" ");
  const initials = parts
    .map(function (part) {
      return part[0];
    })
    .join("");
  return initials.toUpperCase();
}

/**
 * Renders the contact list
 */
function renderContactList() {
  const list = document.getElementById("contacts-list");
  if (!list) return;
  list.innerHTML = "";
  sortContacts();
  contacts.forEach(function (contact) {
    appendContactItemToList(list, contact);
  });
}

/**
 * Adds a letter group to the list if the first letter is new
 * @param {HTMLElement} list - The list element
 * @param {Object} contact - The contact object
 */
function addLetterGroupIfNeeded(list, contact) {
  const first = contact.name[0].toUpperCase();
  if (first !== getLastRenderedLetter()) {
    updateLastRenderedLetter(first);
    addLetterGroupToList(list, first);
  }
}

/**
 * Adds a single contact to the list
 * @param {HTMLElement} list - The list element
 * @param {Object} contact - The contact object
 */
function appendContactItemToList(list, contact) {
  addLetterGroupIfNeeded(list, contact);
  list.innerHTML += getContactItemTemplate(contact);
}

let lastRenderedLetter = "";

/**
 * Returns the last rendered letter
 * @returns {string} The letter
 */
function getLastRenderedLetter() {
  return lastRenderedLetter;
}

/**
 * Updates the last rendered letter
 * @param {string} letter - The letter
 */
function updateLastRenderedLetter(letter) {
  lastRenderedLetter = letter;
}

/**
 * Adds a letter separator to the list
 * @param {HTMLElement} list - The list element
 * @param {string} letter - The letter
 */
function addLetterGroupToList(list, letter) {
  list.innerHTML +=
    getContactGroupLetterTemplate(letter) + getSeparatorLineTemplate();
}

/**
 * Finds a contact by their ID
 * @param {string|number} id - The contact ID
 * @returns {Object|null} The contact or null
 */
function findContactById(id) {
  const found = contacts.find(function (c) {
    return String(c.id) === String(id);
  });
  return found || null;
}

/**
 * Displays the details of a contact
 * @param {string|number} id - The contact ID
 */
function showContactDetails(id) {
  const contact = findContactById(id);
  if (!contact) return;
  renderContactDetailsView(contact, id);
  markActiveContact(id);
  applyContactDetailsVisibility(id);
}

/**
 * Renders the detailed view of a contact depending on the screen size
 * @param {Object} contact - The contact
 * @param {string|number} id - The contact ID
 */
function renderContactDetailsView(contact, id) {
  const content = document.getElementById("contact-details-content");
  if (window.innerWidth > 780) {
    content.innerHTML = getDesktopContactDetailsTemplate(contact);
  } else {
    content.innerHTML = getMobileContactDetailsTemplate(contact);
  }
}

/**
 * Marks a contact in the list as active
 * @param {string|number} id - The contact ID
 */
function markActiveContact(id) {
  const items = document.querySelectorAll(".contact-item");
  items.forEach(function (item) {
    const isActive = item.getAttribute("data-id") === String(id);
    item.classList.toggle("active", isActive);
  });
}

/**
 * Applies visibility classes for the detail view
 * @param {string|number} id - The contact ID
 */
function applyContactDetailsVisibility(id) {
  if (window.innerWidth <= 780) {
    applyMobileContactDetailsVisibility();
  } else {
    applyDesktopContactDetailsVisibility();
  }
}

/**
 * Applies visibility classes for mobile detail view
 */
function applyMobileContactDetailsVisibility() {
  const container = document.querySelector(".contact-details-container");
  container.classList.add("show-mobile");
}

/**
 * Applies visibility classes for the desktop detail view
 */
function applyDesktopContactDetailsVisibility() {
  const container = document.getElementById("contact-details-view");
  container.classList.add("visible");
}

/**
 * Hides the contact detail containers (mobile and desktop).
 */
function hideContactDetailsContainers() {
  const containerMobile = document.querySelector(".contact-details-container");
  const containerDesktop = document.getElementById("contact-details-view");
  if (containerMobile) containerMobile.classList.remove("show-mobile");
  if (containerDesktop) containerDesktop.classList.remove("visible");
}

/**
 * Empties the contents of the contact detail view after the CSS transition
 */
function clearContactDetailContent() {
  const content = document.getElementById("contact-details-content");
  if (content) {
    setTimeout(function () {
      content.innerHTML = "";
    }, 200);
  }
}

/**
 * Removes the active flag from all contact list items
 */
function deactivateContactItems() {
  const items = document.querySelectorAll(".contact-item");
  items.forEach(function (item) {
    item.classList.remove("active");
  });
}

/**
 * Closes the contact details view and removes all active states. Empties the content after the CSS transition.
 */
function closeContactDetails() {
  hideContactDetailsContainers();
  clearContactDetailContent();
  deactivateContactItems();
}

/**
 * Checks the user and updates initials in the header if necessary
 */
function checkUser() {
  if (typeof getCurrentUser === "function") {
    const user = getCurrentUser();
    if (user && document.getElementById("user-initials")) {
      if (user.profileImageSmall && user.profileImageSmall.base64 && typeof showHeaderProfileImage === "function") {
        showHeaderProfileImage(user.profileImageSmall.base64);
      } else {
        document.getElementById("user-initials").innerText = getInitials(
          user.name,
        );
      }
    }
  }
}

/**
 * Toggles the contact menu on mobile devices
 * @param {Event} e - The click event
 */
function toggleContactMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("contact-menu-box");
  menu.classList.toggle("show");
}

document.addEventListener("click", function () {
  const menu = document.getElementById("contact-menu-box");
  if (menu) {
    menu.classList.remove("show");
  }
});
