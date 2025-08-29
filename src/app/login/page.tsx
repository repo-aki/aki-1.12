import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-20 pb-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-6">
          Iniciar Sesión
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          ¡Bienvenido de nuevo! Por favor, ingresa tus credenciales para acceder a tu cuenta de Akí.
        </p>
        {/* Placeholder for login form */}
        <div className="w-full max-w-sm space-y-4 my-8">
          <div className="h-12 bg-muted rounded-md animate-pulse" />
          <div className="h-12 bg-muted rounded-md animate-pulse" />
          <div className="h-12 bg-primary/80 rounded-md animate-pulse" />
        </div>
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-accent hover:text-accent-foreground transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
