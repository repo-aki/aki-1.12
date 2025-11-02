
import { NextResponse } from 'next/server';
import { adminApp, dbAdmin } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// Asegurarse de que la app de admin esté inicializada
const authAdmin = getAuth(adminApp);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        email, 
        password, 
        fullName, 
        phone, 
        province, 
        municipality, 
        role,
        // Campos específicos de conductor
        vehicleType,
        vehicleUsage,
        passengerCapacity
    } = body;

    // --- Validación de datos básicos en el servidor ---
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }
     if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    // --- Lógica de creación de usuario con Firebase Admin SDK ---
    
    // 1. Crear usuario en Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
      displayName: fullName,
      emailVerified: false, // La verificación se seguirá manejando en el cliente
    });

    // 2. Preparar y guardar datos del usuario en Firestore
    let userData: any = {
        uid: userRecord.uid,
        fullName,
        email,
        phone,
        province,
        municipality,
        role,
        createdAt: new Date().toISOString(),
    };
    
    if (role === 'passenger') {
        await dbAdmin.collection('users').doc(userRecord.uid).set(userData);
    } else if (role === 'driver') {
        // Añadir datos específicos del conductor
        userData = {
            ...userData,
            vehicleType,
            vehicleUsage,
            ...( (vehicleUsage === "Pasaje" || vehicleUsage === "Pasaje y Carga") && 
               { passengerCapacity: passengerCapacity } ),
            rating: 0, 
            ratingCount: 0,
            completedTrips: 0,
            cancelledTrips: 0,
        };
        await dbAdmin.collection('drivers').doc(userRecord.uid).set(userData);
    } else {
        return NextResponse.json({ error: 'Rol no soportado.' }, { status: 400 });
    }


    // 3. Devolver una respuesta exitosa
    return NextResponse.json({ uid: userRecord.uid, email: userRecord.email }, { status: 201 });

  } catch (error: any) {
    console.error("Error en el registro del servidor:", error);

    let errorMessage = 'Ocurrió un error en el servidor.';
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este correo electrónico ya está registrado.';
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'La contraseña no es válida. Debe tener al menos 6 caracteres.';
        statusCode = 400;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

    