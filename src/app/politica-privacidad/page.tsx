
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-24 pb-12 px-4">
        <div className="text-center mb-10">
          <FileText className="mx-auto h-16 w-16 text-primary mb-4 animate-taxi-bounce" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Política de Privacidad
          </h1>
        </div>
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-3xl w-full text-left space-y-4 text-foreground/80">
          <p>En Akí Arrival, valoramos tu privacidad y nos comprometemos a proteger tu información personal. Esta política describe cómo recopilamos, usamos y compartimos tus datos.</p>
          <h2 className="text-2xl font-semibold text-secondary pt-2">Información que Recopilamos</h2>
          <p>Recopilamos información que nos proporcionas directamente, como tu nombre, correo electrónico, número de teléfono y detalles de pago. También recopilamos información automáticamente cuando usas nuestros servicios, como tu ubicación, información del dispositivo y datos de uso.</p>
          <h2 className="text-2xl font-semibold text-secondary pt-2">Cómo Usamos tu Información</h2>
          <p>Usamos tu información para proporcionar y mejorar nuestros servicios, procesar pagos, comunicarnos contigo, personalizar tu experiencia y garantizar la seguridad de nuestra plataforma.</p>
          <h2 className="text-2xl font-semibold text-secondary pt-2">Compartir Información</h2>
          <p>Podemos compartir tu información con conductores para facilitar los viajes, con proveedores de servicios que nos ayudan a operar, y según lo exija la ley. No vendemos tu información personal a terceros.</p>
           <h2 className="text-2xl font-semibold text-secondary pt-2">Tus Derechos</h2>
          <p>Tienes derecho a acceder, corregir o eliminar tu información personal. También puedes oponerte a ciertos procesamientos de datos. Contáctanos para ejercer tus derechos.</p>
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
