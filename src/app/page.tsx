
"use client"; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import DynamicSlogans from '@/components/dynamic-slogans';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, LogIn, Loader2 } from 'lucide-react';
import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, determine role and redirect
        setAuthStatus('authenticated');
        const driverDocRef = doc(db, "drivers", user.uid);
        const driverDocSnap = await getDoc(driverDocRef);

        if (driverDocSnap.exists()) {
          router.replace('/dashboard/driver');
        } else {
          router.replace('/dashboard/passenger');
        }
      } else {
        // User is not logged in, show the welcome page
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignupDialogClose = () => setSignupDialogOpen(false);
  const handleLoginDialogClose = () => {
    setLoginDialogOpen(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const openSignupDialog = () => {
    handleLoginDialogClose(); // Close login if open
    setSignupDialogOpen(true);
  };

  const openLoginDialog = () => {
    handleSignupDialogClose(); // Close signup if open
    setLoginDialogOpen(true);
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      // onAuthStateChanged will handle the redirection, just show toast
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo a tu panel...",
      });
      handleLoginDialogClose();
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      let errorMessage = "Credenciales incorrectas o usuario no encontrado.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "El correo electrónico o la contraseña son incorrectos.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico no es válido.";
      }
      toast({
        title: "Error al Iniciar Sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authStatus === 'loading' || authStatus === 'authenticated') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex flex-col items-center justify-center flex-grow text-center px-4">
          <AnimatedTaxiIcon />
          <h2 className="text-2xl font-semibold text-primary animate-pulse flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin"/>
            Cargando Akí...
          </h2>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-12 pb-10 px-4 text-center">
        <div className="mb-4">
          <AnimatedTaxiIcon />
        </div>

        <h2 className="text-5xl md:text-6xl font-headline font-extrabold text-primary mb-5">
          Welcome
        </h2>

        <div className="mb-8">
          <DynamicSlogans />
        </div>

        <div className="space-y-4 flex flex-col items-center w-full max-w-xs sm:max-w-xs">
          <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="font-semibold w-full text-lg py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-150 ease-in-out active:scale-95 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Tengo Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card rounded-lg p-6">
              <DialogHeader className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <LogIn className="h-16 w-16 text-primary animate-taxi-bounce" />
                </div>
                <DialogTitle className="text-3xl font-bold text-primary">Iniciar Sesión</DialogTitle>
                <DialogDescription className="text-md text-foreground/70 mt-2">
                  Ingresa tus credenciales para continuar.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-2 text-left">
                  <Label htmlFor="email-login" className="font-semibold text-foreground/90">Correo Electrónico</Label>
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="tu@ejemplo.com" 
                    className="bg-muted/50 border-border focus:bg-background" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password-login" className="font-semibold text-foreground/90">Contraseña</Label>
                  <Input 
                    id="password-login" 
                    type="password" 
                    placeholder="•••••••••" 
                    className="bg-muted/50 border-border focus:bg-background" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-lg py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 ease-in-out active:scale-95"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={openSignupDialog}
                  className="text-sm text-primary hover:underline"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={signupDialogOpen} onOpenChange={setSignupDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="font-semibold w-full text-lg py-3 rounded-full border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-all duration-150 ease-in-out active:scale-95"
              >
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card rounded-lg p-6">
              <DialogHeader className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <UserPlus className="h-16 w-16 text-primary animate-taxi-bounce" />
                </div>
                <DialogTitle className="text-3xl font-bold text-primary">Registro</DialogTitle>
                <DialogDescription className="text-md text-foreground/70 mt-2">
                  Selecciona cómo quieres usar Akí.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full font-semibold text-lg py-3 rounded-full border-2 border-primary text-primary hover:bg-primary/10 transition-all duration-150 ease-in-out active:scale-95"
                  onClick={() => {
                    handleSignupDialogClose();
                  }}
                >
                  <Link href="/signup/driver">Registrarse como Conductor</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full font-semibold text-lg py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 ease-in-out active:scale-95"
                  onClick={() => {
                    handleSignupDialogClose();
                  }}
                >
                  <Link href="/signup/passenger">Registrarse como Pasajero</Link>
                </Button>
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={openLoginDialog}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Ya tienes cuenta? Iniciar Sesión
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
