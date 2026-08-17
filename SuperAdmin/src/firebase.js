import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLmCTMC_OzP9u-8NVPGdYrey93d4F6vH8",
  authDomain: "drzapp-61e27.firebaseapp.com",
  projectId: "drzapp-61e27",
  storageBucket: "drzapp-61e27.firebasestorage.app",
  messagingSenderId: "765441560039",
  appId: "1:765441560039:web:placeholder"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app for admin creation without logging out the Super Admin
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
