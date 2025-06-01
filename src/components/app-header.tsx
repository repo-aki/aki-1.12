import { Menu, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import Link from 'next/link';

const AppHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col space-y-4 mt-8">
            <Link href="/" className="text-lg font-medium hover:text-primary">Home</Link>
            <Link href="/login" className="text-lg font-medium hover:text-primary">Login</Link>
            <Link href="/signup" className="text-lg font-medium hover:text-primary">Sign Up</Link>
          </nav>
        </SheetContent>
      </Sheet>
       <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="hidden md:flex">
            <Menu className="h-6 w-6" />
       </Button>

      <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-headline font-semibold text-primary">
          Akí Arrival
        </h1>
      </Link>
      
      <Button variant="ghost" size="icon" aria-label="User account">
        <UserCircle className="h-6 w-6" />
      </Button>
    </header>
  );
};
export default AppHeader;
