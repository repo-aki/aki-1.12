
import * as admin from 'firebase-admin';

// Esta variable contendrá la instancia de la app de Firebase Admin
let app: admin.app.App;

// Verifica si la app ya ha sido inicializada para evitar errores
if (!admin.apps.length) {
  // Configura las credenciales. Estas se leerán desde las variables de entorno en Vercel
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // La clave privada necesita un tratamiento especial para leerla desde una variable de entorno
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // Inicializa la app de Firebase Admin
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Si ya está inicializada, simplemente la recupera
  app = admin.apps[0]!;
}

// Exporta la instancia de Firestore desde la app de admin
// Usaremos esto en nuestras rutas de API para interactuar con la base de datos de forma segura
const dbAdmin = admin.firestore();

export { app as adminApp, dbAdmin };
