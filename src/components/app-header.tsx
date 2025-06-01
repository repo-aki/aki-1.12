import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import Link from 'next/link';

const AppHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-start h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col space-y-4 mt-8">
            <Link href="/" className="text-lg font-medium hover:text-primary">Inicio</Link>
            <Link href="/login" className="text-lg font-medium hover:text-primary">Iniciar Sesión</Link>
            <Link href="/signup" className="text-lg font-medium hover:text-primary">Registrarse</Link>
            {/* Agrega más enlaces de navegación aquí si es necesario */}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};
export default AppHeader;
