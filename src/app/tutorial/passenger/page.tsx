
import Image from 'next/image';
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, MapPin, Send, Car, Star, Lightbulb, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "1. Regístrate en Segundos",
    description: "Crea tu cuenta de pasajero con tu correo y número de teléfono. ¡Es rápido, fácil y seguro!",
    image: "/tutorial/pasajero/1.jpg",
    hint: "passenger registration screen"
  },
  {
    icon: MapPin,
    title: "2. Solicita tu Viaje",
    description: "Indica tu ubicación de recogida y tu destino. Especifica si necesitas transporte para pasajeros o para alguna mercancía.",
    image: "/tutorial/pasajero/2.jpg",
    hint: "passenger trip request form"
  },
  {
    icon: Send,
    title: "3. Recibe y Compara Ofertas",
    description: "Los conductores cercanos verán tu solicitud y te enviarán sus ofertas. Podrás ver el precio, el tipo de vehículo y la valoración del conductor.",
    image: "/tutorial/pasajero/3.jpg",
    hint: "passenger offers list"
  },
  {
    icon: CheckCircle,
    title: "4. Acepta la Mejor Oferta",
    description: "Elige la oferta que más te convenga y acéptala. El conductor será notificado al instante y se pondrá en camino.",
    image: "/tutorial/pasajero/4.jpg",
    hint: "passenger accept offer dialog"
  },
  {
    icon: Car,
    title: "5. Sigue a tu Conductor",
    description: "Mira en el mapa cómo tu conductor se acerca en tiempo real. Puedes comunicarte con él a través del chat si es necesario.",
    image: "/tutorial/pasajero/5.jpg",
    hint: "passenger active trip map"
  },
  {
    icon: Star,
    title: "6. Valora tu Experiencia",
    description: "Al final del viaje, no olvides valorar al conductor. Tus comentarios ayudan a mantener una comunidad segura y de confianza para todos.",
    image: "/tutorial/pasajero/6.jpg",
    hint: "passenger rating screen"
  }
];

const tips = [
  "Sé lo más específico posible con las direcciones para evitar confusiones.",
  "Si llevas mercancía, descríbela bien para que los conductores sepan si tienen espacio.",
  "Revisa la valoración de los conductores antes de aceptar una oferta.",
  "Usa el chat integrado para coordinar el punto exacto de recogida.",
  "Sé puntual. El conductor te está esperando."
];

export default function PassengerTutorialPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-24 pb-12 px-4">
        <div className="text-center mb-10 max-w-3xl">
          <UserPlus className="mx-auto h-16 w-16 text-primary mb-4 animate-taxi-bounce" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Guía para Pasajeros de Akí
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Bienvenido a Akí. Aquí te mostramos lo fácil que es moverte por la ciudad con nosotros.
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
