import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJQ7nDkc9ev30236hZvqbHq3CAfQkhT6g",
  authDomain: "online-voting-gdg.firebaseapp.com",
  projectId: "online-voting-gdg",
  storageBucket: "online-voting-gdg.firebasestorage.app",
  messagingSenderId: "677077065388",
  appId: "1:677077065388:web:7d3793af84c3803048c909",
  measurementId: "G-P0L2S784QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set persistence to LOCAL
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Firebase persistence set to local"))
    .catch(error => console.error("Firebase persistence error:", error));
} catch (error) {
  console.error("Firebase configuration error:", error);
}

export { app, auth, db, storage };
