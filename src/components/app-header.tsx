
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Menu, Users, FileText, Mail, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import { auth, db } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const AppHeader = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        // Fetch user data from Firestore
        let userDocSnap;
        // Check drivers collection first
        userDocSnap = await getDoc(doc(db, "drivers", user.uid));
        if (userDocSnap.exists()) {
          const driverData = userDocSnap.data();
          setUserName(driverData.fullName?.split(' ')[0] || 'Conductor');
          setUserRole(driverData.role || 'Conductor');
        } else {
          // Then check users collection (passengers)
          userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const passengerData = userDocSnap.data();
            setUserName(passengerData.fullName?.split(' ')[0] || 'Pasajero');
            setUserRole(passengerData.role || 'Pasajero');
          } else {
            // Fallback if no specific role data found
            setUserName(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario');
            setUserRole('Usuario'); // Generic role
          }
        }
      } else {
        setAuthUser(null);
        setUserName(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      setIsSheetOpen(false); // Close sheet on logout
      router.push('/'); // Redirect to home page
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error al Cerrar Sesión",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  const getRoleSpecificDashboardLink = () => {
    if (userRole === 'driver') {
      return '/dashboard/driver';
    } else if (userRole === 'passenger') {
      return '/dashboard/passenger';
    }
    return '/'; // Fallback to home if role is unknown or user not logged in
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          {userName && (
            <span className="ml-2 text-md font-medium text-muted-foreground hidden sm:inline">
              Hola, {userName}
            </span>
          )}
          <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col pt-8 bg-sidebar text-sidebar-foreground">
            <SheetHeader className="mb-4 pb-4 border-b border-sidebar-border">
              {userRole ? (
                <SheetTitle className="text-2xl font-semibold text-sidebar-primary">
                  Perfil de {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </SheetTitle>
              ) : (
                 <SheetTitle className="text-2xl font-semibold text-sidebar-primary">Menú</SheetTitle>
              )}
            </SheetHeader>
            <nav className="flex flex-col space-y-1 flex-grow">
              <Button 
                variant="ghost" 
                className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                onClick={() => { router.push(getRoleSpecificDashboardLink()); setIsSheetOpen(false); }}
                disabled={!authUser}
              >
                <Home className="mr-3 h-5 w-5" />
                Mi Panel
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                onClick={() => { router.push('/quienes-somos'); setIsSheetOpen(false); }}
              >
                <Users className="mr-3 h-5 w-5" />
                Quiénes Somos
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                onClick={() => { router.push('/politica-privacidad'); setIsSheetOpen(false); }}
              >
                <FileText className="mr-3 h-5 w-5" />
                Política de Privacidad
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                onClick={() => { router.push('/contactarnos'); setIsSheetOpen(false); }}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contactarnos
              </Button>
            </nav>
            <div className="mt-auto pt-4 border-t border-sidebar-border">
              {authUser && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-lg font-medium py-3 px-2 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors mb-2"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Cerrar Sesión
                </Button>
              )}
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>
       <Link href="/" className="font-bold text-xl text-primary" aria-label="Ir a la página de inicio de Akí Arrival">
        Akí
      </Link>
    </header>
  );
};
export default AppHeader;
