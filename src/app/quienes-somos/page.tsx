
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

export default function QuienesSomosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-24 pb-12 px-4 text-center">
        <div className="mb-6">
          <Users className="mx-auto h-16 w-16 text-primary animate-taxi-bounce" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-8">
          Quiénes Somos
        </h1>
        <p className="text-xl text-foreground/80 mb-10 max-w-lg">
          Somos Akí Arrival, tu compañero de confianza para viajes rápidos, seguros y eficientes. Nuestra misión es conectar pasajeros con conductores de manera transparente y sencilla.
        </p>
        <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-semibold text-secondary mb-4">Nuestra Visión</h2>
          <p className="text-md text-foreground/70">
            Revolucionar la movilidad urbana ofreciendo una plataforma intuitiva que prioriza la seguridad, la comodidad y la satisfacción tanto de pasajeros como de conductores.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-12 border-primary text-primary hover:bg-primary/10 text-lg py-3 px-6 rounded-full transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
