
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';

export default function QuienesSomosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-24 pb-12 px-4 text-center">
        <div className="mb-6">
          <Users className="mx-auto h-20 w-20 text-primary animate-taxi-bounce" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6">
          Sobre Akí
        </h1>
        <p className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-2xl leading-relaxed">
          Somos Akí, una plataforma diseñada para revolucionar la forma en que te mueves. Nuestra misión es simple: conectar pasajeros y conductores de manera rápida, segura y transparente, poniendo el control en tus manos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mb-12">
            <div className="bg-card p-8 rounded-lg shadow-lg text-left">
                <h2 className="text-3xl font-semibold text-primary mb-4">Nuestra Visión</h2>
                <p className="text-lg text-foreground/70 leading-relaxed">
                    Aspiramos a ser la solución de movilidad preferida en cada comunidad, ofreciendo una alternativa justa y eficiente al transporte tradicional. Creemos en un sistema donde los pasajeros eligen la oferta que mejor se adapta a sus necesidades y los conductores trabajan con flexibilidad y autonomía.
                </p>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-lg text-left">
                <h2 className="text-3xl font-semibold text-primary mb-4">Nuestros Valores</h2>
                <ul className="space-y-4 text-lg text-foreground/70">
                    <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 shrink-0" />
                        <span><strong>Transparencia:</strong> Sin tarifas ocultas. Pasajeros y conductores conocen y acuerdan el precio antes de cada viaje.</span>
                    </li>
                    <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 shrink-0" />
                        <span><strong>Seguridad:</strong> Tu bienestar es nuestra prioridad. Verificamos a nuestros conductores y ofrecemos herramientas como el chat en tiempo real para una comunicación segura.</span>
                    </li>
                    <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 shrink-0" />
                        <span><strong>Eficiencia:</strong> Nuestra tecnología te conecta con los conductores más cercanos para minimizar tu tiempo de espera y optimizar cada ruta.</span>
                    </li>
                </ul>
            </div>
        </div>
        <Button asChild variant="outline" className="mt-8 border-primary text-primary hover:bg-accent hover:text-accent-foreground text-lg py-3 px-6 rounded-full transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
