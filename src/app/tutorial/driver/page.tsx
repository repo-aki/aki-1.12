
import Image from 'next/image';
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Car, Search, Send, MapPin, CheckCircle, Star, Lightbulb } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "1. Registro Fácil y Rápido",
    description: "Crea tu cuenta de conductor en minutos. Rellena tu información personal, los datos de tu vehículo y ¡listo para empezar!",
    image: "/tutorial/conductor/1.jpg",
    hint: "driver registration screen"
  },
  {
    icon: Search,
    title: "2. Encuentra Viajes Cercanos",
    description: "Activa tu ubicación para ver un listado de solicitudes de pasajeros y de carga en tu zona. Los viajes más cercanos a ti aparecerán primero.",
    image: "/tutorial/conductor/2.jpg",
    hint: "driver dashboard trip list"
  },
  {
    icon: Send,
    title: "3. Envía tu Oferta",
    description: "Revisa los detalles del viaje (destino, pasajeros, etc.) y envía tu mejor oferta. El pasajero recibirá tu propuesta al instante.",
    image: "/tutorial/conductor/3.jpg",
    hint: "driver make offer dialog"
  },
  {
    icon: Car,
    title: "4. ¡Oferta Aceptada! Dirígete al Pasajero",
    description: "Una vez que el pasajero acepte tu oferta, recibirás una notificación. Dirígete al punto de recogida. El pasajero podrá ver tu ubicación en tiempo real.",
    image: "/tutorial/conductor/4.jpg",
    hint: "driver active trip map"
  },
  {
    icon: MapPin,
    title: "5. Inicia y Completa el Viaje",
    description: "Al llegar, notifica al pasajero con el botón 'He Llegado'. Una vez que el viaje comience, sigue la ruta al destino y finaliza el viaje en la app al llegar.",
    image: "/tutorial/conductor/5.jpg",
    hint: "driver arrival notification"
  },
  {
    icon: Star,
    title: "6. Recibe tu Valoración",
    description: "Al finalizar, el pasajero valorará su experiencia. Un buen servicio te asegura mejores valoraciones y más oportunidades de viaje.",
    image: "/tutorial/conductor/6.jpg",
    hint: "driver rating profile"
  }
];

const tips = [
  "Mantén tu perfil actualizado, especialmente los datos de tu vehículo.",
  "Sé rápido al ofertar. Los primeros en responder suelen tener más éxito.",
  "Comunícate de forma amable a través del chat si necesitas coordinar detalles.",
  "Un vehículo limpio y un trato cordial garantizan valoraciones de 5 estrellas.",
  "Conduce de forma segura y respeta las normas de tránsito. Tu seguridad y la del pasajero son lo primero."
];

export default function DriverTutorialPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-24 pb-12 px-4">
        <div className="text-center mb-10 max-w-3xl">
          <Car className="mx-auto h-16 w-16 text-primary mb-4 animate-taxi-bounce" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Guía para Conductores de Akí
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Aprende a sacarle el máximo provecho a la aplicación y aumenta tus ganancias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full mb-12">
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                   <div className="p-3 bg-primary/10 rounded-full">
                     <step.icon className="h-6 w-6 text-primary" />
                   </div>
                   <CardTitle className="text-xl text-primary">{step.title}</CardTitle>
                </div>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden relative">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    data-ai-hint={step.hint}
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="w-full max-w-3xl bg-card shadow-lg mb-12">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Lightbulb className="h-8 w-8 text-yellow-400"/>
                    <CardTitle className="text-2xl text-primary">Consejos y Recomendaciones</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3 text-lg">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0"/>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        <Button asChild variant="outline" className="mt-8 border-primary text-primary hover:bg-accent hover:text-accent-foreground text-lg py-3 px-6 rounded-full transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
