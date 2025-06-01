
"use client"; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import DynamicSlogans from '@/components/dynamic-slogans';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export default function HomePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDialogClose = () => setDialogOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-12 pb-10 px-4 text-center">
        <div className="mb-4">
          <AnimatedTaxiIcon />
        </div>

        <h2 className="text-5xl md:text-6xl font-headline font-extrabold text-primary mb-5">
          Welcome to Akí
        </h2>

        <div className="mb-8">
          <DynamicSlogans />
        </div>

        <div className="space-y-4 flex flex-col items-center w-full max-w-xs sm:max-w-xs">
          <Button 
            asChild 
            size="lg" 
            className="font-semibold w-full text-lg py-3 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Link href="/login">Tengo Cuenta</Link>
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="font-semibold w-full text-lg py-3 rounded-full border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-shadow"
              >
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card rounded-lg p-6">
              <DialogHeader className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <UserPlus className="h-16 w-16 text-primary" />
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
                  className="w-full font-semibold text-lg py-3 rounded-full border-2 border-primary text-primary hover:bg-primary/10"
                  onClick={handleDialogClose}
                >
                  <Link href="/signup/driver">Registrarse como Conductor</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full font-semibold text-lg py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleDialogClose}
                >
                  <Link href="/signup/passenger">Registrarse como Pasajero</Link>
                </Button>
              </div>
              <div className="mt-6 text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:underline"
                  onClick={handleDialogClose}
                >
                  ¿Ya tienes cuenta? Iniciar Sesión
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
