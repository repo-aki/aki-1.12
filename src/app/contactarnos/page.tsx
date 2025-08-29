
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Send } from 'lucide-react';

// Inline SVG for Telegram Icon
const TelegramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-12 w-12 text-primary mb-4 animate-taxi-bounce"
  >
    <path d="M15 10l-4 4 6 6 4-16-18 7 4 2 2 6 3-4" />
  </svg>
);

export default function ContactarnosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-24 pb-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-10">
          Contactarnos
        </h1>
        <p className="text-xl text-foreground/80 mb-10 max-w-lg">
          ¿Tienes preguntas o necesitas ayuda? Estamos aquí para asistirte.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Mail className="h-12 w-12 text-primary mb-4 animate-taxi-bounce" />
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-2">Correo Electrónico</h2>
            <p className="text-lg text-muted-foreground">soporte.akiapp@gmail.com</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
            <TelegramIcon />
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-2">Telegram</h2>
            <p className="text-lg text-muted-foreground">+13525309235</p>
          </div>
        </div>
         <p className="text-md text-muted-foreground mt-10 max-w-lg">
          Nuestro equipo de soporte está disponible todos los días de la semana, de 8:00 AM a 10:00 PM.
        </p>
        <Button asChild variant="outline" className="mt-12 border-primary text-primary hover:bg-accent hover:text-accent-foreground text-lg py-3 px-6 rounded-full transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
