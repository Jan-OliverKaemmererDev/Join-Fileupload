/**
 * @fileoverview Utility functions for Firestore-based contact management.
 * Handles loading, creating, updating, and deleting contacts for the current user,
 * as well as displaying success alert notifications.
 */

/**
 * Loads all contacts for the given user from Firestore and populates the local contacts array.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @returns {Promise<void>}
 */
function loadContactsFromFirestoreAsync(currentUser) {
  return (async function () {
    try {
      const contactsRef = getContactsReference(currentUser);
      const snapshot = await window.fbGetDocs(contactsRef);
      populateContactsFromSnapshot(snapshot);
    } catch (error) {
      console.error("Error loading contacts:", error);
      contacts = [];
    }
  })();
}

/**
 * Returns a Firestore collection reference for the contacts of the given user.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @returns {import('firebase/firestore').CollectionReference} The contacts collection reference.
 */
function getContactsReference(currentUser) {
  return window.fbCollection(
    window.firebaseDb,
    "users",
    currentUser.id,
    "contacts",
  );
}

/**
 * Saves a new contact to Firestore and finalizes the contact creation process.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {{id: string}} newContact - The new contact object to save.
 * @returns {Promise<void>}
 */
function saveNewContactToFirestore(currentUser, newContact) {
  return (async function () {
    try {
      await saveContactToFirestoreDb(currentUser, newContact);
      finalizeContactCreation(newContact);
    } catch (error) {
      console.error("Error creating contact:", error);
    }
  })();
}

/**
 * Writes a new contact document to Firestore.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {{id: string}} newContact - The contact object to write.
 * @returns {Promise<void>}
 */
function saveContactToFirestoreDb(currentUser, newContact) {
  return (async function () {
    const contactRef = window.fbDoc(
      window.firebaseDb,
      "users",
      currentUser.id,
      "contacts",
      newContact.id,
    );
    await window.fbSetDoc(contactRef, newContact);
  })();
}

/**
 * Persists an updated contact to Firestore and finalizes the update process.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {Object} contact - The updated contact data.
 * @param {string|number} id - The ID of the contact to update.
 * @returns {Promise<void>}
 */
function persistContactToFirestore(currentUser, contact, id) {
  return (async function () {
    try {
      await updateContactInFirestoreDb(currentUser, contact, id);
      finalizeContactUpdate(contact);
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  })();
}

/**
 * Overwrites an existing contact document in Firestore with new data.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {Object} contact - The contact data to write.
 * @param {string|number} id - The document ID of the contact.
 * @returns {Promise<void>}
 */
function updateContactInFirestoreDb(currentUser, contact, id) {
  return (async function () {
    const contactRef = window.fbDoc(
      window.firebaseDb,
      "users",
      currentUser.id,
      "contacts",
      String(id),
    );
    await window.fbSetDoc(contactRef, contact);
  })();
}

/**
 * Removes a contact from Firestore and finalizes the deletion process.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {string|number} id - The ID of the contact to delete.
 * @returns {Promise<void>}
 */
function removeContactFromFirestore(currentUser, id) {
  return (async function () {
    try {
      await deleteContactFromFirestoreDb(currentUser, id);
      finalizeContactDeletion(id);
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  })();
}

/**
 * Deletes a contact document from Firestore.
 * @param {{id: string}} currentUser - The currently authenticated user object.
 * @param {string|number} id - The ID of the contact document to delete.
 * @returns {Promise<void>}
 */
function deleteContactFromFirestoreDb(currentUser, id) {
  return (async function () {
    const contactRef = window.fbDoc(
      window.firebaseDb,
      "users",
      currentUser.id,
      "contacts",
      String(id),
    );
    await window.fbDeleteDoc(contactRef);
  })();
}

/**
 * Creates and displays a temporary success alert on the page.
 * The alert fades in, stays briefly, then fades out and is removed.
 * @returns {void}
 */
function showSuccessAlert() {
  const alert = document.createElement("div");
  alert.className = "success-alert";
  alert.innerText = "Kontakt erfolgreich erstellt!";
  document.body.appendChild(alert);
  showAlertWithDelay(alert);
}

/**
 * Triggers the show and hide animations for the alert element using timeouts.
 * @param {HTMLElement} alert - The alert DOM element to animate.
 * @returns {void}
 */
function showAlertWithDelay(alert) {
  setTimeout(function () {
    alert.classList.add("show");
  }, 50);
  setTimeout(function () {
    hideAndRemoveAlert(alert);
  }, 1000);
}

/**
 * Removes the "show" class from the alert and then removes it from the DOM after the transition.
 * @param {HTMLElement} alert - The alert DOM element to hide and remove.
 * @returns {void}
 */
function hideAndRemoveAlert(alert) {
  alert.classList.remove("show");
  setTimeout(function () {
    alert.remove();
  }, 500);
}
