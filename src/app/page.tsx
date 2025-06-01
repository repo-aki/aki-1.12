import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import DynamicSlogans from '@/components/dynamic-slogans';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-28 pb-16 px-4 text-center">
        <AnimatedTaxiIcon />

        <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-primary mb-4">
          Welcome to Akí
        </h2>

        <DynamicSlogans />

        <div className="mt-10 space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
          <Button asChild size="lg" className="font-semibold min-w-[180px] shadow-md hover:shadow-lg transition-shadow">
            <Link href="/login">Usuario Existente</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="font-semibold min-w-[180px] border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-shadow"
          >
            <Link href="/signup">Nuevo Usuario</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
