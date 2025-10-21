
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Globe, Facebook } from 'lucide-react';

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
    className="h-12 w-12 text-primary mb-4"
  >
    <path d="M15 10l-4 4 6 6 4-16-18 7 4 2 2 6 3-4" />
  </svg>
);

const contactOptions = [
  {
    icon: Mail,
    title: "Correo Electrónico",
    value: "soporte.akiapp@gmail.com",
    href: "mailto:soporte.akiapp@gmail.com",
    ariaLabel: "Enviar un correo a soporte"
  },
  {
    icon: TelegramIcon,
    title: "Telegram",
    value: "+1 352 530 9235",
    href: "https://t.me/+13525309235",
    ariaLabel: "Abrir chat de Telegram con soporte"
  },
  {
    icon: Globe,
    title: "Página Web",
    value: "pagina-aki.vercel.app",
    href: "https://pagina-aki.vercel.app",
    ariaLabel: "Visitar la página web de Akí"
  },
  {
    icon: Facebook,
    title: "Facebook",
    value: "Perfil de Akí",
    href: "https://www.facebook.com/profile.php?id=61582299488529",
    ariaLabel: "Visitar el perfil de Facebook de Akí"
  }
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {contactOptions.map((option, index) => (
            <Link
              key={index}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={option.ariaLabel}
              className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transform hover:-translate-y-1 hover:shadow-primary/20 transition-all duration-300 group"
            >
              <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110">
                <option.icon />
              </div>
              <h2 className="text-2xl font-semibold text-secondary-foreground mb-2">{option.title}</h2>
              <p className="text-lg text-muted-foreground group-hover:text-primary transition-colors duration-300">{option.value}</p>
            </Link>
          ))}
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
