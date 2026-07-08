/**
 * @fileoverview Firebase initialization module.
 * Imports Firebase Auth and Firestore functions and exposes them on the global
 * `window` object so that non-module scripts can access them.
 * Dispatches a `firebaseReady` event once all globals are registered.
 */

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/** @type {import('firebase/auth').Auth} Global Firebase Auth instance. */
window.firebaseAuth = auth;

/** @type {import('firebase/firestore').Firestore} Global Firebase Firestore instance. */
window.firebaseDb = db;

/** @type {Function} Creates a new user with email and password. */
window.fbCreateUser = createUserWithEmailAndPassword;

/** @type {Function} Signs in an existing user with email and password. */
window.fbSignIn = signInWithEmailAndPassword;

/** @type {Function} Signs in a user anonymously. */
window.fbSignInAnon = signInAnonymously;

/** @type {Function} Signs out the currently authenticated user. */
window.fbSignOut = signOut;

/** @type {Function} Updates the profile of the currently authenticated user. */
window.fbUpdateProfile = updateProfile;

/** @type {Function} Returns a reference to a Firestore collection. */
window.fbCollection = collection;

/** @type {Function} Returns a reference to a Firestore document. */
window.fbDoc = doc;

/** @type {Function} Writes data to a Firestore document. */
window.fbSetDoc = setDoc;

/** @type {Function} Reads a single Firestore document. */
window.fbGetDoc = getDoc;

/** @type {Function} Reads all documents from a Firestore collection. */
window.fbGetDocs = getDocs;

/** @type {Function} Deletes a Firestore document. */
window.fbDeleteDoc = deleteDoc;

/** @type {Function} Updates fields in an existing Firestore document. */
window.fbUpdateDoc = updateDoc;

/** @type {Function} Returns a Firestore write batch for atomic operations. */
window.fbWriteBatch = writeBatch;

/** @type {boolean} Flag indicating that Firebase is initialized and ready. */
window.firebaseReady = true;

window.dispatchEvent(new Event("firebaseReady"));
