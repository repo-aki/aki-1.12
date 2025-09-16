
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Menu, Users, FileText, Mail, LogOut, Star, CheckCircle, XCircle, User, Bell, Edit, Car, MapPin, Phone, Mail as MailIcon, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import { auth, db } from '@/lib/firebase/config';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import EditProfileForm from './edit-profile-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
};

interface AppHeaderProps {
  notifications?: Notification[];
}

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


const AppHeader: React.FC<AppHeaderProps> = ({ notifications = [] }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // New state for profile data
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [tripStats, setTripStats] = useState<{ completed: number; cancelled: number }>({ completed: 0, cancelled: 0 });
  const [driverRatings, setDriverRatings] = useState<{ average: number; comments: any[] }>({ average: 0, comments: [] });
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setNotificationCount(notifications.length);
  }, [notifications]);
  
  const handleNotificationsOpenChange = (open: boolean) => {
    setIsNotificationsOpen(open);
    if(open) {
        setNotificationCount(0); // Reset count when opening
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        fetchUserProfile(user);
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
  }, [toast]);

  const fetchUserProfile = async (user: FirebaseUser) => {
      if (!user) return;
      setIsProfileDataLoading(true);
      try {
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

        if(role === 'driver' && profileData) {
          setTripStats({
              completed: profileData.completedTrips || 0,
              cancelled: profileData.cancelledTrips || 0
          });

          const ratingsQuery = query(collection(db, "drivers", user.uid, 'ratings'), orderBy("createdAt", "desc"));
          const ratingsSnapshot = await getDocs(ratingsQuery);
          const ratingComments = ratingsSnapshot.docs.map(d => d.data());
          
          setDriverRatings({
            average: profileData.rating || 0,
            comments: ratingComments,
          });
        }
        
      } catch (error: any) {
          console.error("Error fetching user profile data:", error);
          toast({
              title: "Error de permisos",
              description: "No se pudo cargar tu perfil. Revisa las reglas de seguridad.",
              variant: "destructive",
          });
          setAuthUser(null);
      } finally {
          setIsProfileDataLoading(false);
      }
  }


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

  const handleProfileUpdate = () => {
    if(authUser) {
      fetchUserProfile(authUser);
    }
    setIsEditProfileOpen(false);
    setIsProfileOpen(true);
  }

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
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
              <nav className="flex flex-col space-y-1 flex-grow px-2">
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

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors hover:no-underline [&[data-state=open]]:bg-sidebar-accent">
                       <div className="flex items-center">
                        <BookOpen className="mr-3 h-5 w-5" />
                        Tutorial
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0 pl-8 space-y-1">
                      <Button variant="ghost" className="w-full justify-start font-normal" onClick={() => { router.push('/tutorial/passenger'); setIsSheetOpen(false); }}>
                        Pasajero
                      </Button>
                      <Button variant="ghost" className="w-full justify-start font-normal" onClick={() => { router.push('/tutorial/driver'); setIsSheetOpen(false); }}>
                        Conductor
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button 
                  variant="ghost" 
                  className="justify-start text-lg font-medium py-3 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" 
                  onClick={() => { router.push('/politica-privacidad'); setIsSheetOpen(false); }}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Política
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
                <div className="px-2 pt-4 text-center text-sm text-sidebar-foreground/60">
                  Versión: 1.12
                </div>
              </div>
            </SheetContent>
          </Sheet>
          {userName && (
            <span className="text-md font-semibold text-foreground">
              Hola, {userName}
            </span>
          )}
        </div>
        
        {authUser ? (
            <div className="flex items-center gap-2">
                 <Sheet open={isNotificationsOpen} onOpenChange={handleNotificationsOpenChange}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-6 w-6" />
                            {notificationCount > 0 && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {notificationCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Notificaciones del Viaje</SheetTitle>
                            <SheetDescription>
                                Aquí se muestran los eventos importantes de tu viaje actual.
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100%-4rem)] mt-4 pr-4">
                            {sortedNotifications.length > 0 ? (
                               <div className="space-y-4">
                                    {sortedNotifications.map((notification) => (
                                        <div key={notification.id} className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full mt-1">
                                                <notification.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{notification.title}</p>
                                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                                                <p className="text-xs text-muted-foreground/80 mt-1">
                                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                               </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                                    <p>No hay notificaciones en este momento.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
                <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <SheetTrigger asChild>
                         <Button variant="ghost" className="rounded-full h-10 w-10 p-0">
                            <Avatar>
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {'👤'}
                            </AvatarFallback>
                            </Avatar>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                        <SheetHeader className="p-6 pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <SheetTitle className="text-2xl">Perfil de {userRole}</SheetTitle>
                                    <SheetDescription>Información de tu cuenta y estadísticas.</SheetDescription>
                                </div>
                                <Button variant="outline" size="icon" onClick={() => { setIsProfileOpen(false); setIsEditProfileOpen(true); }}>
                                    <Edit className="h-4 w-4"/>
                                    <span className="sr-only">Editar Perfil</span>
                                </Button>
                            </div>
                        </SheetHeader>
                        <ScrollArea className="flex-grow">
                             {isProfileDataLoading ? (
                                <div className="p-6">Cargando perfil...</div>
                            ) : userProfile ? (
                                <div className="space-y-6 p-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <User className="h-6 w-6 text-primary"/>
                                            <CardTitle>Información Personal</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><p><span className="font-medium text-foreground">Nombre:</span> {userProfile.fullName}</p></div>
                                            <div className="flex items-center gap-2 text-muted-foreground"><MailIcon className="h-4 w-4" /><p><span className="font-medium text-foreground">Correo:</span> {userProfile.email}</p></div>
                                            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><p><span className="font-medium text-foreground">Teléfono:</span> {userProfile.phone}</p></div>
                                            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><p><span className="font-medium text-foreground">Ubicación:</span> {userProfile.municipality}, {userProfile.province}</p></div>
                                        </CardContent>
                                    </Card>

                                    {userRole === 'Conductor' && userProfile.vehicleType && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <Car className="h-6 w-6 text-primary"/>
                                            <CardTitle>Información del Vehículo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <p><span className="font-medium text-foreground">Tipo:</span> {userProfile.vehicleType}</p>
                                            <p><span className="font-medium text-foreground">Uso:</span> {userProfile.vehicleUsage}</p>
                                            {userProfile.passengerCapacity && <p><span className="font-medium text-foreground">Capacidad:</span> {userProfile.passengerCapacity} pasajeros</p>}
                                        </CardContent>
                                    </Card>
                                    )}
                                    
                                     <Card>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <CheckCircle className="h-6 w-6 text-green-500"/>
                                            <CardTitle>Estadísticas de Viajes</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500"/>
                                                <p className="text-sm"><span className="font-bold text-lg">{tripStats.completed}</span> Completados</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-5 w-5 text-destructive"/>
                                                <p className="text-sm"><span className="font-bold text-lg">{tripStats.cancelled}</span> Cancelados</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {userRole === 'Conductor' && (
                                     <Card>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <Star className="h-6 w-6 text-yellow-400"/>
                                            <CardTitle>Valoraciones</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 mb-4">
                                                {renderRating(driverRatings.average)}
                                                <span className="font-bold text-lg">({driverRatings.average.toFixed(1)})</span>
                                            </div>
                                            {driverRatings.comments.length > 0 ? (
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                                    {driverRatings.comments.map((review, index) => (
                                                        <div key={index} className="p-2 border rounded-md bg-muted/50">
                                                            {renderRating(review.rating, 'h-4 w-4')}
                                                            <p className="text-sm text-muted-foreground italic mt-1">"{review.comment}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Aún no tienes comentarios.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6">No se pudo cargar la información del perfil.</div>
                            )}
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        ) : (
          <Link href="/" className="font-bold text-xl text-primary" aria-label="Ir a la página de inicio de Akí">
            Akí
          </Link>
        )}
      </header>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Perfil</DialogTitle>
            <DialogDescription>
              Modifica tu información personal. El correo y el teléfono no se pueden cambiar.
            </DialogDescription>
          </DialogHeader>
          {userProfile && (
            <EditProfileForm
              userProfile={userProfile}
              userRole={userRole}
              onUpdate={handleProfileUpdate}
              onCancel={() => setIsEditProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default AppHeader;
