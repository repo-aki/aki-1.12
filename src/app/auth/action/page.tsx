
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { applyActionCode } from 'firebase/auth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ActionHandler() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta, por favor espera...');

  useEffect(() => {
    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('El enlace no es válido o está incompleto. Por favor, intenta de nuevo.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, actionCode);
            setStatus('success');
            setMessage('¡Tu cuenta ha sido verificada con éxito! Ya puedes cerrar esta ventana y volver a la aplicación.');
            break;
          // Aquí se podrían agregar otros modos como 'resetPassword', 'recoverEmail', etc.
          default:
            setStatus('error');
            setMessage('La acción solicitada no es válida.');
        }
      } catch (error: any) {
        console.error("Error al procesar la acción:", error);
        setStatus('error');
        let userMessage = 'El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.';
        if (error.code === 'auth/invalid-action-code') {
            userMessage = 'El código de verificación no es válido o ya ha sido utilizado. Intenta registrarte de nuevo.';
        }
        setMessage(userMessage);
      }
    };

    handleAction();
  }, [mode, actionCode]);

  return (
    <div className="flex items-center justify-center flex-grow p-4">
      <Card className="w-full max-w-md text-center shadow-lg animate-in fade-in-50 duration-500">
        <CardHeader>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-4">
            {status === 'loading' && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="h-20 w-20 text-green-500 animate-in zoom-in-50" />}
            {status === 'error' && <AlertCircle className="h-20 w-20 text-destructive animate-in zoom-in-50" />}
            </div>
            <CardTitle className="text-3xl font-bold">
                {status === 'loading' && 'Procesando...'}
                {status === 'success' && '¡Éxito!'}
                {status === 'error' && 'Error'}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}


export default function ActionPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex flex-col flex-grow">
              <Suspense fallback={
                <div className="flex items-center justify-center flex-grow">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              }>
                <ActionHandler />
              </Suspense>
            </main>
        </div>
    );
}
