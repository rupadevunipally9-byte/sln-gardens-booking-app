import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyD1FttYNrcWyBKx0gMp-7rlFBmFIHAAJcQ",
  authDomain: "sln-gardens.firebaseapp.com",
  databaseURL: "https://sln-gardens-default-rtdb.firebaseio.com",
  projectId: "sln-gardens",
  storageBucket: "sln-gardens.firebasestorage.app",
  messagingSenderId: "728241550025",
  appId: "1:728241550025:web:dec0279c66bbc8f421d318",
  measurementId: "G-RWLW9P3PJC"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
