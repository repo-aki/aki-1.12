
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';

const AppHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-start h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
          <SheetHeader className="mb-4 pb-4 border-b border-border">
            <SheetTitle className="text-2xl font-semibold text-primary">Menú</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-1 flex-grow">
            <Link href="/" className="text-lg font-medium hover:text-primary py-3 px-2 rounded-md hover:bg-muted">Inicio</Link>
            <Link href="/quienes-somos" className="text-lg font-medium hover:text-primary py-3 px-2 rounded-md hover:bg-muted">Quiénes Somos</Link>
            <Link href="/politica-privacidad" className="text-lg font-medium hover:text-primary py-3 px-2 rounded-md hover:bg-muted">Política de Privacidad</Link>
            <Link href="/contactarnos" className="text-lg font-medium hover:text-primary py-3 px-2 rounded-md hover:bg-muted">Contactarnos</Link>
          </nav>
          <div className="mt-auto pt-4 border-t border-border">
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
export default AppHeader;
