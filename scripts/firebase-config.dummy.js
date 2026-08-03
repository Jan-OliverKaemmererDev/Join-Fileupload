/**
 * @fileoverview Dummy Firebase configuration module for testing.
 * This module sets up the connection to a mock Firebase backend, including
 * authentication and Firestore database services.
 */

/**
 * Required Firebase SDKs for app initialization, authentication, and Firestore.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Dummy configuration object containing the Firebase project credentials.
 * Replace with your project's configuration object from the Firebase Console.
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};

/**
 * Initializes the Firebase application instance.
 */
const app = initializeApp(firebaseConfig);

/**
 * Initializes the Firebase Authentication service.
 */
const auth = getAuth(app);

/**
 * Initializes the Cloud Firestore database service.
 */
const db = getFirestore(app);

export { auth, db };
