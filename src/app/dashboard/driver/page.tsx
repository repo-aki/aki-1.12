
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, DocumentData, doc, getDoc, addDoc, serverTimestamp, Timestamp, collectionGroup, writeBatch, updateDoc, limit, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import UserLocationMap from '@/components/user-location-map';
import { Map as MapIcon, Car, Send, MapPin, Loader2, AlertTriangle, XCircle, RefreshCw, MessageSquare, CheckCircle, Route, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import DynamicTripMap from '@/components/dynamic-trip-map';
import TripChat from '@/components/trip-chat';


function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

const formatDistance = (km: number) => {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Componente para la vista del viaje activo
function ActiveTripView({ trip }: { trip: DocumentData }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isNotifyingArrival, setIsNotifyingArrival] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastReadTimestamp = useRef<Timestamp | null>(null);
    const [isArrivalAlertOpen, setIsArrivalAlertOpen] = useState(false);

    const statusSteps = [
      { id: 'driver_en_route', label: 'En Camino', icon: Car },
      { id: 'driver_at_pickup', label: 'Esperando', icon: Clock },
      { id: 'in_progress', label: 'Viajando', icon: Route },
      { id: 'completed', label: 'Finalizado', icon: CheckCircle },
    ];
    const statusOrder = statusSteps.map(s => s.id);
    const currentStatusIndex = trip ? statusOrder.indexOf(trip.status) : -1;

    const handleChatOpenChange = async (open: boolean) => {
        setIsChatOpen(open);
        if (open) {
            setUnreadCount(0);
            const q = query(collection(db, 'trips', trip.id, 'messages'), orderBy('createdAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                lastReadTimestamp.current = snapshot.docs[0].data().createdAt as Timestamp;
            }
        }
    };

    useEffect(() => {
        if (!trip.id || !auth.currentUser || isChatOpen) return;

        const q = query(
            collection(db, 'trips', trip.id, 'messages'),
            where('createdAt', '>', lastReadTimestamp.current || new Timestamp(0, 0))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessagesFromOther = snapshot.docs.filter(doc => doc.data().senderId !== auth.currentUser!.uid);
            if (newMessagesFromOther.length > 0) {
                 setUnreadCount(prev => prev + newMessagesFromOther.length);
            }
        });

        return () => unsubscribe();
    }, [trip.id, isChatOpen]);

    const handleCancelTrip = async () => {
        if (!trip?.id) return;
        setIsCancelling(true);
        try {
            await updateDoc(doc(db, "trips", trip.id), {
                status: 'cancelled',
                cancelledBy: 'driver',
            });
            toast({
                title: "Viaje Cancelado",
                description: "Has cancelado el viaje asignado.",
            });
        } catch (error) {
            console.error("Error al cancelar el viaje:", error);
            toast({
                title: "Error",
                description: "No se pudo cancelar el viaje. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };

     const handleArrival = async () => {
        if (!trip?.id) return;
        setIsNotifyingArrival(true);
        try {
            await updateDoc(doc(db, "trips", trip.id), {
                status: 'driver_at_pickup',
            });
            toast({
                title: "Notificación Enviada",
                description: "El pasajero ha sido notificado de tu llegada.",
            });
        } catch (error) {
            console.error("Error al notificar llegada:", error);
            toast({
                title: "Error",
                description: "No se pudo enviar la notificación. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsNotifyingArrival(false);
            setIsArrivalAlertOpen(false); // Close the dialog
        }
    };

    const handleCompleteTrip = async () => {
        if (isCompleting || !trip?.id) return;
        setIsCompleting(true);
        try {
            await updateDoc(doc(db, "trips", trip.id), {
                status: 'completed',
            });
            toast({
                title: "Viaje Finalizado",
                description: "Has completado el viaje con éxito.",
            });
        } catch (error) {
            console.error("Error al finalizar el viaje:", error);
            toast({
                title: "Error",
                description: "No se pudo finalizar el viaje. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsCompleting(false);
        }
    };
    
    const handleGoToDashboard = async () => {
        if (isArchiving || !trip?.id) return;
        setIsArchiving(true);
        try {
            await updateDoc(doc(db, "trips", trip.id), {
                driverHasAcknowledgedCompletion: true,
            });
            toast({
                title: "Volviendo al panel",
                description: "Puedes buscar nuevos viajes.",
            });
        } catch (error) {
            console.error("Error al archivar el viaje:", error);
            toast({
                title: "Error",
                description: "No se pudo volver al panel. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex flex-col items-center flex-grow pt-16 pb-12 px-4 w-full">
                
                <div className="w-full max-w-2xl mt-4">
                    <div className="flex items-center relative">
                        <div className="absolute top-6 left-0 w-full h-1 bg-muted"></div>
                        <div 
                        className="absolute top-6 left-0 h-1 bg-green-500 transition-all duration-500"
                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                        ></div>
                        <div className="flex items-center justify-between w-full">
                        {statusSteps.map((step, index) => (
                            <div className="flex flex-col items-center text-center z-10 w-24" key={step.id}>
                            <div
                                className={cn(
                                'flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 border-4',
                                index <= currentStatusIndex ? 'bg-green-500 border-green-100 dark:border-green-900 text-white' : 'bg-muted border-background text-muted-foreground'
                                )}
                            >
                                <step.icon className="h-6 w-6" />
                            </div>
                            <p className={cn(
                                'mt-2 text-sm text-center font-semibold',
                                index === currentStatusIndex ? 'text-primary dark:text-accent' : 'text-muted-foreground'
                                )}>
                                {step.label}
                            </p>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col animate-in fade-in-50 duration-500">
                     {trip.status === 'driver_en_route' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <CardTitle className="text-xl">Dirígete a la Recogida</CardTitle>
                                    <CardDescription>{trip.pickupAddress}</CardDescription>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                            </CardHeader>
                        </Card>
                    )}

                     {trip.status === 'driver_at_pickup' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <CardTitle className="text-xl">Esperando al Pasajero</CardTitle>
                                    <CardDescription>El pasajero confirmará el inicio del viaje.</CardDescription>
                                </div>
                                <div className="p-3 bg-yellow-500/10 rounded-full">
                                    <Clock className="h-6 w-6 text-yellow-500" />
                                </div>
                            </CardHeader>
                        </Card>
                    )}

                    {trip.status === 'in_progress' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <CardTitle className="text-xl">Viaje en Curso</CardTitle>
                                    <CardDescription>Destino: {trip.destinationAddress}</CardDescription>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-full">
                                    <Route className="h-6 w-6 text-blue-500" />
                                </div>
                            </CardHeader>
                        </Card>
                    )}
                    
                    {trip.status === 'completed' && (
                        <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col items-center justify-center text-center animate-in fade-in-50 duration-500">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="text-2xl">¡Viaje Finalizado!</CardTitle>
                                    <CardDescription>
                                        Puedes esperar la valoración del pasajero o volver al panel principal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={handleGoToDashboard} disabled={isArchiving} size="lg">
                                        {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Ir al Panel Principal
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {trip.status !== 'completed' && (
                        <>
                            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                              <DialogTrigger asChild>
                                 <Button variant="outline" size="lg" className="w-full h-14 text-lg">
                                   <MapIcon className="mr-2 h-5 w-5" />
                                   {trip.status === 'in_progress' ? 'Ver mi Ubicación' : 'Ver Mapa en Vivo'}
                                 </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>
                                   {trip.status === 'in_progress' ? 'Tu Ubicación en Tiempo Real' : 'Mapa del Viaje en Tiempo Real'}
                                  </DialogTitle>
                                   <DialogDescription>
                                    {trip.status === 'in_progress' ? 'Este mapa muestra tu ubicación actual.' : 'Ubicación del pasajero (verde) y tuya (amarillo).'}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex-grow min-h-0 relative">
                                   {isMapOpen && (
                                     trip.status === 'in_progress' ? <UserLocationMap /> : <DynamicTripMap userRole="driver" trip={trip} />
                                   )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {trip.status !== 'in_progress' && (
                                <Sheet open={isChatOpen} onOpenChange={handleChatOpenChange}>
                                    <SheetTrigger asChild>
                                        <Button size="icon" className="relative rounded-full h-16 w-16 fixed bottom-28 right-6 z-10 shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground animate-in zoom-in-50 duration-300">
                                            <MessageSquare className="h-8 w-8" />
                                            <span className="sr-only">Abrir chat</span>
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl flex flex-col">
                                        <SheetHeader className="text-left">
                                            <SheetTitle>Chat con {trip.passengerName?.split(' ')[0] || 'Pasajero'}</SheetTitle>
                                            <SheetDescription>Los mensajes son en tiempo real.</SheetDescription>
                                        </SheetHeader>
                                        <TripChat
                                            tripId={trip.id}
                                            userRole="driver"
                                            currentUserName={trip.driverName || 'Conductor'}
                                            otherUserName={trip.passengerName || 'Pasajero'}
                                        />
                                    </SheetContent>
                                </Sheet>
                            )}

                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t md:static md:bg-transparent md:p-0 md:border-none mt-auto">
                                <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
                                    <Button 
                                      variant="outline" 
                                      size="lg" 
                                      className="font-bold border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-md h-14"
                                      onClick={handleCancelTrip}
                                      disabled={isCancelling}
                                    >
                                        {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Cancelar Viaje
                                    </Button>
                                    
                                    {trip.status === 'driver_en_route' && (
                                        <AlertDialog open={isArrivalAlertOpen} onOpenChange={setIsArrivalAlertOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    size="lg" 
                                                    className="font-bold bg-green-500 hover:bg-green-600 text-white text-md h-14 animate-pulse"
                                                    disabled={isNotifyingArrival}
                                                >
                                                    He Llegado
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Confirmar Llegada?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Se le notificará al pasajero "{trip.passengerName}" que estás en el punto de recogida acordado.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isNotifyingArrival}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleArrival} disabled={isNotifyingArrival}>
                                                        {isNotifyingArrival && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Aceptar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    
                                     {trip.status === 'driver_at_pickup' && (
                                        <Button size="lg" disabled className="font-bold text-md h-14">
                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                             Esperando Pasajero...
                                        </Button>
                                    )}

                                     {trip.status === 'in_progress' && (
                                        <Button 
                                            size="lg" 
                                            className="font-bold bg-green-500 hover:bg-green-600 text-white text-md h-14"
                                            onClick={handleCompleteTrip}
                                            disabled={isCompleting}
                                        >
                                            {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Finalizar Viaje
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}


// Componente para la vista del panel de control normal
function DriverDashboardView() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverProfile, setDriverProfile] = useState<DocumentData | null>(null);
  const [allTrips, setAllTrips] = useState<DocumentData[]>([]);
  const [sentOffers, setSentOffers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const locationWatcher = useRef<number | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DocumentData | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const { toast } = useToast();

  const [isDestinationMapOpen, setIsDestinationMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setError("No se pudo identificar al usuario.");
        return;
    };

    const fetchDriverProfile = async () => {
        const driverDocRef = doc(db, "drivers", currentUser.uid);
        const driverDocSnap = await getDoc(driverDocRef);
        if (driverDocSnap.exists()) {
            setDriverProfile(driverDocSnap.data());
        } else {
            setError("No se pudo cargar tu perfil de conductor.");
        }
    };
    
    fetchDriverProfile();
  }, []);

  const filterAndSortTrips = useCallback((trips: DocumentData[], driverLoc: { lat: number; lng: number } | null) => {
    if (!driverLoc) return [];
    
    const tripsWithDistance = trips.map(trip => {
      if (trip.pickupCoordinates) {
        const distance = getDistanceInKm(
          driverLoc.lat,
          driverLoc.lng,
          trip.pickupCoordinates.lat,
          trip.pickupCoordinates.lng
        );
        return { ...trip, distance };
      }
      return { ...trip, distance: Infinity };
    });
    
    const nearby = tripsWithDistance.filter(trip => trip.distance < 0.5); // 500 meters
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
  }, []);

  const nearbyAvailableTrips = useMemo(() => {
    if (!driverLocation || !driverProfile) return [];
    
    const usage = driverProfile.vehicleUsage;
    let filteredByType = allTrips;

    if (usage === 'Pasaje') {
        filteredByType = allTrips.filter(trip => trip.tripType === 'passenger');
    } else if (usage === 'Carga') {
        filteredByType = allTrips.filter(trip => trip.tripType === 'cargo');
    }
    
    const sentOfferTripIds = new Set(sentOffers.map(offer => offer.tripId));
    const available = filteredByType.filter(trip => !sentOfferTripIds.has(trip.id));
    return filterAndSortTrips(available, driverLocation);
  }, [allTrips, sentOffers, driverLocation, filterAndSortTrips, driverProfile]);

  const tripsWithSentOffers = useMemo(() => {
    if (sentOffers.length === 0 || allTrips.length === 0) {
        return [];
    }
    const tripMap = new Map(allTrips.map(trip => [trip.id, trip]));
    
    return sentOffers
        .map(offer => {
            const trip = tripMap.get(offer.tripId);
            if (trip) {
                return { ...trip, ...offer, offerId: offer.id };
            }
            return null;
        })
        .filter((item): item is DocumentData => item !== null)
        .sort((a, b) => (b.createdAt?.toDate() ?? 0) - (a.createdAt?.toDate() ?? 0));
  }, [sentOffers, allTrips]);


  const fetchTrips = useCallback(() => {
    setIsRefreshing(true);
    setLoading(true);

    const q = query(
        collection(db, "trips"), 
        where("status", "==", "searching"),
        where("expiresAt", ">", new Date())
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tripsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllTrips(tripsData);
        setLoading(false);
        setIsRefreshing(false);
    }, (err) => {
        console.error("Error fetching trips:", err);
        setError("No se pudieron cargar los viajes. Intenta recargar la página.");
        setLoading(false);
        setIsRefreshing(false);
    });

    return unsubscribe;
  }, []);

  const fetchSentOffers = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return () => {};

    const offersQuery = query(
        collectionGroup(db, 'offers'),
        where('driverId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => {
            const tripId = doc.ref.parent.parent?.id;
            return { id: doc.id, tripId, ...doc.data() };
        });
        setSentOffers(offersData);
    }, (err) => {
        console.error("Error fetching sent offers:", err);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      locationWatcher.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setDriverLocation(newLocation);
          if (!mapCenter) {
             setMapCenter(newLocation);
          }
          setError(null); 
        },
        (err) => {
          let userError = "No se puede obtener tu ubicación en tiempo real. ";
          if (err.code === 2) {
            userError += "La ubicación no está disponible. Por favor, activa el GPS de tu dispositivo.";
          } else if (err.code === 1) {
            userError += "Debes conceder permiso de ubicación para ver viajes.";
          } else if (err.code === 3) {
            userError += "La solicitud de ubicación ha caducado.";
          } else {
            userError += "Asegúrate de tener la geolocalización activada.";
          }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    } else {
      setError("La geolocalización no es compatible con este navegador.");
      setLoading(false);
    }

    return () => {
      if (locationWatcher.current) {
        navigator.geolocation.clearWatch(locationWatcher.current);
      }
    };
  }, [mapCenter]);
  
  useEffect(() => {
    const unsubscribeTrips = fetchTrips();
    const unsubscribeOffers = fetchSentOffers();
    return () => {
        unsubscribeTrips();
        unsubscribeOffers();
    };
  }, [fetchTrips, fetchSentOffers]);
  
  const handleMakeOfferClick = (trip: DocumentData) => {
    setSelectedTrip(trip);
    setOfferPrice('');
    setIsOfferDialogOpen(true);
  };

  const handleViewDestination = (coords: { lat: number; lng: number }) => {
    setMapCenter(coords);
    setMapMarker(coords);
    setIsDestinationMapOpen(true);
  };

  const handleSendOffer = async () => {
    if (!selectedTrip || !offerPrice || !auth.currentUser) return;
    setIsSubmittingOffer(true);

    try {
        const driverDocRef = doc(db, "drivers", auth.currentUser.uid);
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
            throw new Error("No se encontraron los datos del conductor.");
        }
        const driverData = driverDocSnap.data();

        const offerData = {
            driverId: auth.currentUser.uid,
            driverName: driverData.fullName,
            vehicleType: driverData.vehicleType,
            rating: driverData.rating || 4.5,
            price: Number(offerPrice),
            createdAt: serverTimestamp(),
            status: 'pending',
        };

        await addDoc(collection(db, "trips", selectedTrip.id, "offers"), offerData);
        
        toast({
            title: "Oferta Enviada",
            description: `Tu oferta de $${offerPrice} ha sido enviada.`,
        });
        setIsOfferDialogOpen(false);

    } catch (error: any) {
        console.error("Error al enviar la oferta:", error);
        toast({
            title: "Error al Enviar Oferta",
            description: error.message || "No se pudo enviar tu oferta. Inténtalo de nuevo.",
            variant: "destructive",
        });
    } finally {
        setIsSubmittingOffer(false);
    }
  };


  const renderNearbyTrips = () => {
    if (error) {
      return (
        <div className="p-4 bg-destructive/10 rounded-lg text-center text-destructive flex flex-col items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            <p className="font-semibold">{error}</p>
        </div>
      );
    }
    if (loading || !driverProfile) {
       return (
        <div className="p-4 rounded-lg text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>Buscando pasajes cercanos...</span>
        </div>
       );
    }
    if (nearbyAvailableTrips.length === 0) {
       return (
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground flex flex-col items-center gap-2">
            <XCircle className="h-8 w-8" />
            <p>No hay pasajes disponibles en tu zona en este momento.</p>
        </div>
       );
    }
    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px] px-1 py-2">Tipo</TableHead>
                        <TableHead className="px-1 py-2">Destino</TableHead>
                        <TableHead className="text-right w-[70px] px-1 py-2">Dist.</TableHead>
                        <TableHead className="text-center w-[100px] px-1 py-2">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nearbyAvailableTrips.map((trip) => (
                        <TableRow key={trip.id} className="text-xs">
                            <TableCell className="px-1 py-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-semibold text-xs",
                                    trip.tripType === 'passenger'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700'
                                      : 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700'
                                  )}
                                >
                                    {trip.tripType === 'passenger' ? 'Pasaje' : 'Carga'}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-1 py-2">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-medium text-sm line-clamp-2">{trip.destinationAddress}</span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={cn("h-7 w-7 rounded-full shrink-0", trip.destinationCoordinates ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50' : 'text-muted-foreground/50 cursor-not-allowed')}
                                      disabled={!trip.destinationCoordinates}
                                      onClick={() => trip.destinationCoordinates && handleViewDestination(trip.destinationCoordinates)}
                                    >
                                        <MapPin className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold px-1 py-2">{formatDistance(trip.distance)}</TableCell>
                            <TableCell className="text-center px-1 py-2">
                                <Button
                                  size="sm"
                                  className="h-8 px-2 transition-transform active:scale-95 bg-green-500 hover:bg-green-600 text-white font-semibold"
                                  onClick={() => handleMakeOfferClick(trip)}
                                >
                                    <Send className="mr-1 h-3 w-3" />
                                    Ofertar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
  };

  const renderSentOffers = () => {
    if (tripsWithSentOffers.length === 0) {
      return (
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
          No has enviado ninguna oferta activa.
        </div>
      );
    }
    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-2">Destino</TableHead>
                        <TableHead className="text-right w-[120px] px-2">Tu Oferta</TableHead>
                        <TableHead className="text-center w-[120px] px-2">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tripsWithSentOffers.map((tripOffer) => (
                        <TableRow key={tripOffer.offerId} className="text-sm">
                            <TableCell className="font-medium px-2 py-3">{tripOffer.destinationAddress}</TableCell>
                            <TableCell className="text-right font-semibold px-2 py-3">${Number(tripOffer.price).toFixed(2)}</TableCell>
                            <TableCell className="text-center px-2 py-3">
                                <Badge variant={tripOffer.status === 'pending' ? 'secondary' : tripOffer.status === 'accepted' ? 'default' : 'destructive'}>
                                    {tripOffer.status === 'pending' ? 'Pendiente' : tripOffer.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center pt-24 pb-12 px-4 w-full">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={fetchTrips} disabled={isRefreshing} className="transition-transform active:scale-95">
              <RefreshCw className={cn("mr-2 h-5 w-5", isRefreshing && "animate-spin")} />
              Actualizar
            </Button>
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => { setMapCenter(driverLocation); setMapMarker(null); setIsMapOpen(true); }} className="transition-transform active:scale-95">
                  <MapIcon className="mr-2 h-5 w-5" />
                  Ver mi Ubicación
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
                  <DialogTitle className="text-2xl font-semibold text-primary">Tu Ubicación Actual</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0 relative">
                  {isMapOpen && <UserLocationMap />}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Accordion type="multiple" defaultValue={['pasajes', 'ofertas']} className="w-full space-y-4">
            <AccordionItem value="pasajes" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 py-4 hover:no-underline">
                <div className="flex items-center">
                  <Car className="mr-3 h-6 w-6" />
                  Pasajes en tu Zona
                  <Badge
                    variant="secondary"
                    className={cn(
                        "ml-3",
                        nearbyAvailableTrips.length > 0 && "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-200 font-bold"
                    )}
                  >
                    {nearbyAvailableTrips.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {renderNearbyTrips()}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ofertas" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 py-4 hover:no-underline">
                 <div className="flex items-center">
                  <Send className="mr-3 h-6 w-6" />
                  Ofertas Enviadas
                  <Badge
                    variant="secondary"
                    className={cn(
                        "ml-3",
                        tripsWithSentOffers.length > 0 && "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-200 font-bold"
                    )}
                  >
                    {tripsWithSentOffers.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {renderSentOffers()}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>

       <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Hacer una Oferta</DialogTitle>
            <DialogDescription>
              Ingresa el precio que deseas ofertar para este viaje. El pasajero verá tu oferta al instante.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="offer-price" className="text-right">
                Precio (CUP)
              </Label>
              <Input
                id="offer-price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Ej: 500"
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleSendOffer} disabled={isSubmittingOffer || !offerPrice} className="w-full transition-transform active:scale-95">
            {isSubmittingOffer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isSubmittingOffer ? 'Enviando...' : 'Enviar Oferta'}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={isDestinationMapOpen} onOpenChange={setIsDestinationMapOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
            <DialogTitle className="text-2xl font-semibold text-primary">Ubicación de Destino</DialogTitle>
            <DialogDescription>
              Este mapa muestra tu ubicación y el destino solicitado por el pasajero.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow min-h-0 relative">
            {isDestinationMapOpen && <UserLocationMap markerLocation={mapMarker} markerPopupText="Destino del Pasajero" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function DriverDashboardPage() {
    const [activeTrip, setActiveTrip] = useState<DocumentData | null>(null);
    const [isCheckingForActiveTrip, setIsCheckingForActiveTrip] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const activeTripIdRef = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "trips"),
                    where("driverId", "==", user.uid),
                    where("status", "in", ["driver_en_route", "driver_at_pickup", "in_progress", "completed"])
                );

                const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    const unacknowledgedTrips = snapshot.docs.filter(doc => !doc.data().driverHasAcknowledgedCompletion);

                    if (unacknowledgedTrips.length === 0) {
                        if (activeTripIdRef.current) {
                            toast({
                                title: "Viaje Concluido",
                                description: "El viaje ha sido cancelado o ha finalizado.",
                            });
                        }
                        setActiveTrip(null);
                        activeTripIdRef.current = null;
                    } else {
                        const tripDoc = unacknowledgedTrips[0];
                        const tripData = { id: tripDoc.id, ...tripDoc.data() };

                        if (!activeTripIdRef.current) {
                           toast({
                                title: "¡Nuevo Viaje!",
                                description: "Un pasajero ha aceptado tu oferta.",
                            });
                        } else if (activeTripIdRef.current && tripData.status === 'in_progress' && activeTrip?.status !== 'in_progress') {
                           toast({
                                title: "¡Viaje Iniciado!",
                                description: "El pasajero ha confirmado el inicio del viaje.",
                            });
                        }

                        setActiveTrip(tripData);
                        activeTripIdRef.current = tripDoc.id;
                    }
                    setIsCheckingForActiveTrip(false);
                }, (err) => {
                    console.error("Error fetching active trip:", err);
                    setError("No se pudo verificar si hay un viaje activo.");
                    setIsCheckingForActiveTrip(false);
                });
                
                return () => unsubscribeFirestore();
            } else {
                setActiveTrip(null);
                activeTripIdRef.current = null;
                setIsCheckingForActiveTrip(false);
            }
        });

        return () => unsubscribeAuth();
    }, [toast, activeTrip?.status]);

    if (isCheckingForActiveTrip) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <main className="flex flex-col items-center justify-center flex-grow">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Verificando viajes activos...</p>
                </main>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <main className="flex flex-col items-center justify-center flex-grow text-center px-4">
                  <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                  <h1 className="text-2xl font-bold text-destructive">Error</h1>
                  <p className="mt-2 text-muted-foreground">{error}</p>
                </main>
            </div>
        );
    }

    if (activeTrip) {
        return <ActiveTripView trip={activeTrip} />;
    }

    return <DriverDashboardView />;
}
