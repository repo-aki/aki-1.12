
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
          <p className="text-muted-foreground mt-2">Última actualización: 28 de agosto de 2024</p>
        </div>
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-3xl w-full text-left space-y-6 text-muted-foreground">
          <p className="text-lg">En Akí, tu privacidad es nuestra prioridad. Esta Política de Privacidad explica qué información recopilamos, cómo la usamos y protegemos, y los derechos que tienes sobre tus datos personales al usar nuestra aplicación.</p>
          
          <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">1. Información que Recopilamos</h2>
          <p>Para ofrecer un servicio eficiente y seguro, recopilamos diferentes tipos de información:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Información de Registro:</strong> Nombre completo, correo electrónico, número de teléfono, provincia y municipio.</li>
            <li><strong>Información de Conductores:</strong> Además de lo anterior, tipo de vehículo, uso (pasaje/carga) y capacidad de pasajeros.</li>
            <li><strong>Datos de Ubicación:</strong> Recopilamos la ubicación precisa de tu dispositivo cuando la app está en uso para facilitar el punto de recogida, mostrar la ubicación del conductor en tiempo real y sugerir viajes cercanos.</li>
            <li><strong>Información de Viajes:</strong> Direcciones de recogida y destino, tipo de viaje (pasajeros o mercancía), descripción de la mercancía, ofertas realizadas y aceptadas, y el historial de viajes.</li>
            <li><strong>Comunicaciones:</strong> Mensajes enviados a través del chat de la aplicación entre pasajeros y conductores.</li>
            <li><strong>Valoraciones y Comentarios:</strong> Calificaciones y comentarios que dejas sobre los conductores después de un viaje.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">2. Cómo Usamos tu Información</h2>
          <p>Utilizamos la información recopilada para los siguientes propósitos:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Proveer y Mejorar el Servicio:</strong> Conectar a pasajeros con conductores, facilitar la comunicación, procesar la logística de los viajes y mejorar la funcionalidad de la aplicación.</li>
            <li><strong>Seguridad:</strong> Verificar identidades, monitorear la actividad para prevenir fraudes y garantizar un entorno seguro para todos los usuarios.</li>
            <li><strong>Comunicación:</strong> Enviarte notificaciones importantes sobre tus viajes (ej: conductor en camino, llegada al punto de recogida), y responder a tus solicitudes de soporte.</li>
            <li><strong>Personalización:</strong> Mostrar viajes relevantes y mejorar tu experiencia general en la aplicación.</li>
            <li><strong>Cálculo de Estadísticas:</strong> Mantener un sistema de reputación (rating) para los conductores basado en las valoraciones de los pasajeros.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">3. Cómo Compartimos tu Información</h2>
          <p>Tu información se comparte de manera limitada y solo cuando es necesario:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Entre Pasajeros y Conductores:</strong> Cuando un conductor hace una oferta, el pasajero ve su nombre, tipo de vehículo y valoración. Cuando una oferta es aceptada, ambos usuarios pueden ver los detalles necesarios para coordinar el viaje, incluyendo nombre y ubicación en tiempo real.</li>
            <li><strong>Requisitos Legales:</strong> Podemos divulgar tu información si así lo exige la ley o para proteger los derechos, la propiedad o la seguridad de Akí, nuestros usuarios u otros.</li>
          </ul>
          <p className="font-semibold text-foreground">No vendemos ni alquilamos tu información personal a terceros para fines de marketing.</p>

          <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">4. Tus Derechos y Opciones</h2>
          <p>Tienes control sobre tu información personal. Puedes acceder y actualizar los datos de tu perfil directamente en la aplicación. Si deseas eliminar tu cuenta o solicitar la eliminación de tus datos, por favor contáctanos a través de nuestro correo de soporte.</p>

           <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">5. Seguridad de los Datos</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Sin embargo, ningún sistema es 100% seguro, y no podemos garantizar una seguridad absoluta.</p>

           <h2 className="text-2xl font-semibold text-secondary-foreground pt-2 border-t mt-6 pt-6">6. Cambios a esta Política</h2>
          <p>Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cualquier cambio importante publicando la nueva política en esta página y actualizando la fecha de "Última actualización".</p>
        </div>
        <Button asChild variant="outline" className="mt-12 border-primary text-primary hover:bg-accent hover:text-accent-foreground text-lg py-3 px-6 rounded-full transition-transform active:scale-95">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
      </main>
    </div>
  );
}
