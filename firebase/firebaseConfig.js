// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFjyKDrWUNasVyAPtm5qTPz3nIHQXe9uI",
  authDomain: "succiondeesferas.firebaseapp.com",
  projectId: "succiondeesferas",
  storageBucket: "succiondeesferas.firebasestorage.app",
  messagingSenderId: "152914698955",
  appId: "1:152914698955:web:bb1617100345297dcc714e",
  measurementId: "G-0BSZ7Z76WS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // ✅ ¡Esto es necesario!