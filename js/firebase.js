import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSiFKfHy7B9Y0x8c73PXNrox9jaUboitw",
    authDomain: "debatehub-b3cd5.firebaseapp.com",
    projectId: "debatehub-b3cd5",
    storageBucket: "debatehub-b3cd5.firebasestorage.app",
    messagingSenderId: "20236706106",
    appId: "1:20236706106:web:4f08cd220a966bda1a3003",
    measurementId: "G-7WY1307LC9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
