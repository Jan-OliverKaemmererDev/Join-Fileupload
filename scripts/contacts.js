let contacts = [];

/**
 * Initialisiert die Kontaktseite, lädt Daten und wählt ggf. einen Kontakt aus
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
 * Lädt die Kontakte aus Firestore
 */
function loadContactsFromFirestore() {
  return (async function () {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    await loadContactsFromFirestoreAsync(currentUser);
  })();
}

/**
 * Befüllt das lokale Kontakte-Array aus einem Firestore-Snapshot
 * @param {Object} snapshot - Der Firestore Snapshot
 */
function populateContactsFromSnapshot(snapshot) {
  contacts = [];
  snapshot.forEach(function (doc) {
    const data = doc.data();
    data.id = doc.id;
    contacts.push(data);
  });
}

/**
 * Sortiert die Kontakte alphabetisch nach Namen
 */
function sortContacts() {
  contacts.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
}

/**
 * Generiert die Initialen aus dem Namen
 * @param {string} name - Der vollständige Name
 * @returns {string} Die Initialen
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
 * Rendert die Kontaktliste
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
 * Fügt eine Buchstabengruppe zur Liste hinzu, falls der Anfangsbuchstabe neu ist
 * @param {HTMLElement} list - Das Listen-Element
 * @param {Object} contact - Das Kontakt-Objekt
 */
function addLetterGroupIfNeeded(list, contact) {
  const first = contact.name[0].toUpperCase();
  if (first !== getLastRenderedLetter()) {
    updateLastRenderedLetter(first);
    addLetterGroupToList(list, first);
  }
}

/**
 * Fügt einen einzelnen Kontakt zur Liste hinzu
 * @param {HTMLElement} list - Das Listen-Element
 * @param {Object} contact - Das Kontakt-Objekt
 */
function appendContactItemToList(list, contact) {
  addLetterGroupIfNeeded(list, contact);
  list.innerHTML += getContactItemTemplate(contact);
}

let lastRenderedLetter = "";

/**
 * Gibt den zuletzt gerenderten Buchstaben zurück
 * @returns {string} Der Buchstabe
 */
function getLastRenderedLetter() {
  return lastRenderedLetter;
}

/**
 * Aktualisiert den zuletzt gerenderten Buchstaben
 * @param {string} letter - Der Buchstabe
 */
function updateLastRenderedLetter(letter) {
  lastRenderedLetter = letter;
}

/**
 * Fügt einen Buchstaben-Trenner zur Liste hinzu
 * @param {HTMLElement} list - Das Listen-Element
 * @param {string} letter - Der Buchstabe
 */
function addLetterGroupToList(list, letter) {
  list.innerHTML +=
    getContactGroupLetterTemplate(letter) + getSeparatorLineTemplate();
}

/**
 * Findet einen Kontakt anhand seiner ID
 * @param {string|number} id - Die Kontakt-ID
 * @returns {Object|null} Der Kontakt oder null
 */
function findContactById(id) {
  const found = contacts.find(function (c) {
    return String(c.id) === String(id);
  });
  return found || null;
}

/**
 * Zeigt die Details eines Kontakts an
 * @param {string|number} id - Die Kontakt-ID
 */
function showContactDetails(id) {
  const contact = findContactById(id);
  if (!contact) return;
  renderContactDetailsView(contact, id);
  markActiveContact(id);
  applyContactDetailsVisibility(id);
}

/**
 * Rendert die Detailansicht eines Kontakts abhängig von der Bildschirmgröße
 * @param {Object} contact - Der Kontakt
 * @param {string|number} id - Die Kontakt-ID
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
 * Markiert einen Kontakt in der Liste als aktiv
 * @param {string|number} id - Die Kontakt-ID
 */
function markActiveContact(id) {
  const items = document.querySelectorAll(".contact-item");
  items.forEach(function (item) {
    const isActive = item.getAttribute("data-id") === String(id);
    item.classList.toggle("active", isActive);
  });
}

/**
 * Wendet Sichtbarkeitsklassen für die Detailansicht an
 * @param {string|number} id - Die Kontakt-ID
 */
function applyContactDetailsVisibility(id) {
  if (window.innerWidth <= 780) {
    applyMobileContactDetailsVisibility();
  } else {
    applyDesktopContactDetailsVisibility();
  }
}

/**
 * Wendet Sichtbarkeitsklassen für die mobile Detailansicht an
 */
function applyMobileContactDetailsVisibility() {
  const container = document.querySelector(".contact-details-container");
  container.classList.add("show-mobile");
}

/**
 * Wendet Sichtbarkeitsklassen für die Desktop-Detailansicht an
 */
function applyDesktopContactDetailsVisibility() {
  const container = document.getElementById("contact-details-view");
  container.classList.add("visible");
}

/**
 * Blendet die Kontakt-Detail-Container (Mobile und Desktop) aus
 */
function hideContactDetailsContainers() {
  const containerMobile = document.querySelector(".contact-details-container");
  const containerDesktop = document.getElementById("contact-details-view");
  if (containerMobile) containerMobile.classList.remove("show-mobile");
  if (containerDesktop) containerDesktop.classList.remove("visible");
}

/**
 * Leert den Inhalt der Kontakt-Detailansicht nach der CSS-Transition
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
 * Entfernt die aktive Markierung von allen Kontakt-Listenelementen
 */
function deactivateContactItems() {
  const items = document.querySelectorAll(".contact-item");
  items.forEach(function (item) {
    item.classList.remove("active");
  });
}

/**
 * Schließt die Kontakt-Detailansicht und entfernt alle aktiven Zustände. Leert den Inhalt nach der CSS-Transition.
 */
function closeContactDetails() {
  hideContactDetailsContainers();
  clearContactDetailContent();
  deactivateContactItems();
}

/**
 * Prüft den Benutzer und aktualisiert ggf. Initialen im Header
 */
function checkUser() {
  if (typeof getCurrentUser === "function") {
    const user = getCurrentUser();
    if (user && document.getElementById("user-initials")) {
      document.getElementById("user-initials").innerText = getInitials(
        user.name,
      );
    }
  }
}

/**
 * Schaltet das Kontakt-Menü auf Mobilgeräten um
 * @param {Event} e - Das Klick-Event
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
