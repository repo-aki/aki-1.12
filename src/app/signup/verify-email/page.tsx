
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Loader2, LogIn, RefreshCw, AlertCircle } from 'lucide-react';
import AppHeader from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to set user and start verification check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          toast({
            title: "Correo Verificado",
            description: "Tu cuenta ya está verificada. Redirigiendo...",
          });
          router.replace('/'); 
        } else {
          // Start polling for verification status
          if (!verificationIntervalRef.current) {
            verificationIntervalRef.current = setInterval(async () => {
              const freshUser = auth.currentUser;
              if (freshUser) {
                await freshUser.reload();
                if (freshUser.emailVerified) {
                  if (verificationIntervalRef.current) clearInterval(verificationIntervalRef.current);
                  toast({
                    title: "¡Cuenta Verificada!",
                    description: "Tu correo ha sido confirmado con éxito. Redirigiendo...",
                  });
                  router.replace('/');
                }
              }
            }, 3000); // Check every 3 seconds
          }
        }
      } else {
        // If no user is logged in, they shouldn't be here.
        router.replace('/login');
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
    };
  }, [router, toast]);
  
  // Effect for resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user) {
      toast({ title: "Error", description: "No se encontró ningún usuario para reenviar el correo.", variant: "destructive" });
      return;
    }
    if(countdown > 0) {
      toast({ title: "Espera un momento", description: `Puedes reenviar el correo en ${countdown} segundos.`, variant: "destructive" });
      return;
    }

    setIsResending(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/`,
      };
      await sendEmailVerification(user, actionCodeSettings);
      toast({
        title: "Correo Reenviado",
        description: "Se ha enviado un nuevo enlace de verificación a tu correo.",
      });
      setCountdown(60); // Set 60 seconds cooldown
    } catch (error: any) {
      console.error("Error al reenviar el correo:", error);
      let description = "Ocurrió un error. Inténtalo de nuevo más tarde.";
      if (error.code === 'auth/too-many-requests') {
        description = "Has intentado reenviar el correo demasiadas veces. Por favor, espera unos minutos.";
      }
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex items-center justify-center flex-grow p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <MailCheck className="h-10 w-10 text-primary animate-taxi-bounce" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Verifica tu Correo</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Hemos enviado un enlace de activación a tu correo electrónico:
              <br />
              <strong className="text-foreground">{user?.email || 'cargando...'}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>Por favor, haz clic en el enlace de ese correo para activar tu cuenta. Si no lo encuentras, revisa tu carpeta de spam. Esta página se actualizará automáticamente.</p>
            
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-md flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0"/>
                <span>Debes verificar tu correo antes de poder iniciar sesión.</span>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full transition-transform active:scale-95"
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar Correo'}
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full transition-transform active:scale-95"
              onClick={() => {
                if(verificationIntervalRef.current) clearInterval(verificationIntervalRef.current);
                signOut(auth);
              }}
            >
              <Link href="/">
                <LogIn className="mr-2 h-4 w-4" />
                Ir a Iniciar Sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
