import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import DynamicSlogans from '@/components/dynamic-slogans';

export default function HomePage() {
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

        <div className="space-y-4 flex flex-col items-center w-full max-w-72 sm:max-w-xs">
          <Button 
            asChild 
            size="lg" 
            className="font-semibold w-full text-lg py-3 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Link href="/login">Tengo Cuenta</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="font-semibold w-full text-lg py-3 rounded-full border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-shadow"
          >
            <Link href="/signup">Nuevo Usuario</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
