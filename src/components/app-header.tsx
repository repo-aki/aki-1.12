
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Menu, Users, FileText, Mail, LogOut, Star, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import { auth, db } from '@/lib/firebase/config';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Helper function to render stars
const renderRating = (rating: number, size: string = 'h-5 w-5') => {
    const stars = [];
    const fullStars = Math.round(rating); // Round to nearest whole star

    for (let i = 0; i < 5; i++) {
        stars.push(
            <Star 
                key={`star-${i}`} 
                className={cn(
                    size, 
                    i < fullStars ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                )} 
            />
        );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
};


const AppHeader = () => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // New state for profile data
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [tripStats, setTripStats] = useState<{ completed: number; cancelled: number }>({ completed: 0, cancelled: 0 });
  const [driverRatings, setDriverRatings] = useState<{ average: number; comments: any[] }>({ average: 0, comments: [] });
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Control profile dialog

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        setIsProfileDataLoading(true);

        // Fetch user data from Firestore
        let userDocSnap;
        let profileData;
        let role = 'Usuario';
        
        const driverDocRef = doc(db, "drivers", user.uid);
        userDocSnap = await getDoc(driverDocRef);
        if (userDocSnap.exists()) {
          profileData = userDocSnap.data();
          role = 'driver';
          setUserName(profileData.fullName?.split(' ')[0] || 'Conductor');
          setUserRole('Conductor');
        } else {
          const userDocRef = doc(db, "users", user.uid);
          userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            profileData = userDocSnap.data();
            role = 'passenger';
            setUserName(profileData.fullName?.split(' ')[0] || 'Pasajero');
            setUserRole('Pasajero');
          } else {
            setUserName(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario');
            setUserRole('Usuario');
          }
        }
        setUserProfile(profileData);

        // Fetch trip statistics
        const idField = role === 'driver' ? 'driverId' : 'passengerId';
        const tripsQuery = query(collection(db, "trips"), where(idField, "==", user.uid));
        const tripsSnapshot = await getDocs(tripsQuery);
        
        let completed = 0;
        let cancelled = 0;
        const ratingComments: any[] = [];
        let totalRating = 0;
        let ratingCount = 0;

        tripsSnapshot.forEach(tripDoc => {
          const tripData = tripDoc.data();
          if (tripData.status === 'completed') {
            completed++;
            if (role === 'driver' && tripData.rating) {
              totalRating += tripData.rating;
              ratingCount++;
              if (tripData.comment) {
                ratingComments.push({ rating: tripData.rating, comment: tripData.comment });
              }
            }
          } else if (tripData.status === 'cancelled') {
            cancelled++;
          }
        });
        
        setTripStats({ completed, cancelled });

        if (role === 'driver') {
          setDriverRatings({
            average: ratingCount > 0 ? totalRating / ratingCount : 0,
            comments: ratingComments,
          });
        }
        setIsProfileDataLoading(false);

      } else {
        setAuthUser(null);
        setUserName(null);
        setUserRole(null);
        setUserProfile(null);
        setTripStats({ completed: 0, cancelled: 0 });
        setDriverRatings({ average: 0, comments: [] });
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
      setIsSheetOpen(false);
      setIsProfileOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error al Cerrar Sesión",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  const openProfile = () => {
    setIsSheetOpen(false);
    setIsProfileOpen(true);
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col pt-8 bg-sidebar text-sidebar-foreground">
              <SheetHeader className="mb-4 pb-4 border-b border-sidebar-border text-left px-2">
                {userName ? (
                  <SheetTitle className="text-2xl font-semibold text-sidebar-primary">
                    Hola, {userName}
                  </SheetTitle>
                ) : (
                  <SheetTitle className="text-2xl font-semibold text-sidebar-primary">Menú</SheetTitle>
                )}
                {userRole && (
                  <SheetDescription className="text-sidebar-foreground/80">
                    Perfil de {userRole}
                  </SheetDescription>
                )}
              </SheetHeader>
              <nav className="flex flex-col space-y-1 flex-grow">
                {authUser && (
                    <Button 
                        variant="ghost" 
                        className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                        onClick={openProfile}
                    >
                        <User className="mr-3 h-5 w-5" />
                        Mi Perfil
                    </Button>
                )}
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
          {userName && (
            <span className="ml-2 text-md font-medium text-muted-foreground hidden sm:inline">
              Hola, {userName}
            </span>
          )}
        </div>
        
        {authUser ? (
          <DialogTrigger asChild>
             <Button variant="ghost" className="rounded-full h-10 w-10 p-0">
                <Avatar>
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {userRole === 'Conductor' ? '🚕' : '👤'}
                  </AvatarFallback>
                </Avatar>
             </Button>
          </DialogTrigger>
        ) : (
          <Link href="/" className="font-bold text-xl text-primary" aria-label="Ir a la página de inicio de Akí Arrival">
            Akí
          </Link>
        )}

      </header>

      <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Perfil de {userRole}</DialogTitle>
            <DialogDescription>
              Información de tu cuenta y estadísticas.
            </DialogDescription>
          </DialogHeader>
          {isProfileDataLoading ? (
            <div className="py-4">Cargando perfil...</div>
          ) : userProfile ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Información Personal</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p><span className="font-medium text-foreground">Nombre:</span> {userProfile.fullName}</p>
                    <p><span className="font-medium text-foreground">Correo:</span> {userProfile.email}</p>
                    <p><span className="font-medium text-foreground">Teléfono:</span> {userProfile.phone}</p>
                    <p><span className="font-medium text-foreground">Ubicación:</span> {userProfile.municipality}, {userProfile.province}</p>
                  </div>
                </div>

                {userRole === 'Conductor' && userProfile.vehicleType && (
                  <div>
                    <Separator className="my-3"/>
                    <h3 className="font-semibold text-lg mb-2">Información del Vehículo</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                       <p><span className="font-medium text-foreground">Tipo:</span> {userProfile.vehicleType}</p>
                       <p><span className="font-medium text-foreground">Uso:</span> {userProfile.vehicleUsage}</p>
                       {userProfile.passengerCapacity && <p><span className="font-medium text-foreground">Capacidad:</span> {userProfile.passengerCapacity} pasajeros</p>}
                    </div>
                  </div>
                )}
                
                <Separator className="my-3"/>
                
                <div>
                    <h3 className="font-semibold text-lg mb-2">Estadísticas de Viajes</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <CheckCircle className="h-5 w-5 text-green-500"/>
                           <p className="text-sm"><span className="font-bold">{tripStats.completed}</span> Completados</p>
                        </div>
                         <div className="flex items-center gap-2">
                           <XCircle className="h-5 w-5 text-destructive"/>
                           <p className="text-sm"><span className="font-bold">{tripStats.cancelled}</span> Cancelados</p>
                        </div>
                    </div>
                </div>

                 {userRole === 'Conductor' && (
                  <div>
                    <Separator className="my-3"/>
                    <h3 className="font-semibold text-lg mb-2">Valoraciones</h3>
                    <div className="flex items-center gap-2 mb-3">
                        {renderRating(driverRatings.average)}
                        <span className="font-bold text-lg">({driverRatings.average.toFixed(1)})</span>
                    </div>
                    
                    {driverRatings.comments.length > 0 ? (
                       <ScrollArea className="h-32">
                           <div className="space-y-3">
                               {driverRatings.comments.map((review, index) => (
                                   <div key={index} className="p-2 border rounded-md bg-muted/50">
                                       {renderRating(review.rating, 'h-4 w-4')}
                                       <p className="text-sm text-muted-foreground italic mt-1">"{review.comment}"</p>
                                   </div>
                               ))}
                           </div>
                       </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground">Aún no tienes comentarios.</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-4">No se pudo cargar la información del perfil.</div>
          )}
      </DialogContent>
    </Dialog>
  );
};
export default AppHeader;
