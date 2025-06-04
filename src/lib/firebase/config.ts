
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAnalytics, type Analytics } from "firebase/analytics"; // Descomenta si necesitas analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Requerido si planeas usar Analytics
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
