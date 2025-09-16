
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwnPhSHA9owQu70Bw4-EuuKyHUe1oq__c",
  authDomain: "ak-arrival.firebaseapp.com",
  projectId: "ak-arrival",
  storageBucket: "ak-arrival.firebasestorage.app",
  messagingSenderId: "361359063347",
  appId: "1:361359063347:web:9d671f1a850214849a2646"
};

// Inicializar Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
