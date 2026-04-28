import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsOrbjsbDt6NISqEOTEk8pnVZjGWDZvwI",
  authDomain: "web-cloud-ynov-fee89.firebaseapp.com",
  projectId: "web-cloud-ynov-fee89",
  storageBucket: "web-cloud-ynov-fee89.firebasestorage.app",
  messagingSenderId: "7831595404",
  appId: "1:7831595404:web:895fc66a9eb730eba38ea9",
  measurementId: "G-P2H74NZKRT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
