import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVXYs85_F4IQgWHIkQePsUaYq5lL6Lp6g",
  authDomain: "apeel-9671e.firebaseapp.com",
  projectId: "apeel-9671e",
  storageBucket: "apeel-9671e.firebasestorage.app",
  messagingSenderId: "729575704560",
  appId: "1:729575704560:web:0bdf86a399a9877b08ff35",
  measurementId: "G-D474J2PESJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
