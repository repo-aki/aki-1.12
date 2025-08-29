
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAnalytics, type Analytics } from "firebase/analytics"; // Descomenta si necesitas analytics

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
// let analytics: Analytics | undefined; // Declara analytics
// // Verifica si 'window' está definido (es decir, estamos en el cliente) y si measurementId existe
// if (typeof window !== 'undefined' && firebaseConfig.measurementId) { 
//   analytics = getAnalytics(app); // Inicializa analytics solo en el lado del cliente y si measurementId está presente
// }

export { app, auth, db /*, analytics */ }; // Añade analytics a las exportaciones si se usa
