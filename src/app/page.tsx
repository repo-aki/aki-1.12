import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import DynamicSlogans from '@/components/dynamic-slogans';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center justify-center flex-grow pt-24 pb-12 px-4 text-center">
        <AnimatedTaxiIcon />

        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
          Welcome to Akí Arrival!
        </h2>

        <DynamicSlogans />

        <div className="mt-6 space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
          <Button asChild size="lg" className="font-semibold min-w-[180px] shadow-md hover:shadow-lg transition-shadow">
            <Link href="/login">Existing User</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="font-semibold min-w-[180px] border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-md hover:shadow-lg transition-shadow"
          >
            <Link href="/signup">New User</Link>
          </Button>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-foreground/60 border-t">
        © {new Date().getFullYear()} Akí Arrival. All rights reserved.
      </footer>
    </div>
  );
}
