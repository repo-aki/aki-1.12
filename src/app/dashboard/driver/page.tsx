
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, DocumentData, doc, getDoc, addDoc, serverTimestamp, Timestamp, collectionGroup, writeBatch, updateDoc, limit, orderBy, getDocs, runTransaction, GeoPoint } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Map as MapIcon, Car, Send, MapPin, Loader2, AlertTriangle, XCircle, RefreshCw, MessageSquare, CheckCircle, Route, Clock, Bell, DollarSign, Users, Package, Info, User, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import DynamicTripMap from '@/components/dynamic-trip-map';
import TripChat from '@/components/trip-chat';
import { Separator } from '@/components/ui/separator';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';

type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
};

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
  const meters = km * 1000;
  if (meters < 50) {
    return "< 50 m";
  }
  if (meters < 1000) {
    return `${(Math.round(meters / 50) * 50)} m`;
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
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Add initial notification when trip is accepted
        setNotifications([{
            id: `trip-accepted-${trip.id}`,
            title: '¡Nuevo Viaje!',
            description: `Un pasajero ha aceptado tu oferta para ir a ${trip.destinationAddress}.`,
            timestamp: new Date(),
            icon: Car
        }]);
    }, [trip.id, trip.destinationAddress]);

    useEffect(() => {
        const previousStatus = sessionStorage.getItem(`trip_status_${trip.id}`);
        const currentStatus = trip.status;

        if (previousStatus !== currentStatus) {
            let newNotification: Omit<Notification, 'id' | 'timestamp'> | null = null;

            if (currentStatus === 'driver_at_pickup') {
                newNotification = { title: "Llegaste al Punto de Recogida", description: "Se ha notificado al pasajero de tu llegada.", icon: Clock };
            } else if (currentStatus === 'in_progress' && !notificationShownRef.current[currentStatus]) {
                 newNotification = { title: "¡Viaje Iniciado!", description: "El pasajero ha confirmado el inicio del viaje.", icon: Route };
                 notificationShownRef.current[currentStatus] = true;
            } else if (currentStatus === 'completed') {
                newNotification = { title: "Viaje Finalizado", description: "El viaje ha sido completado con éxito.", icon: CheckCircle };
            } else if (currentStatus === 'cancelled') {
                 newNotification = { title: "Viaje Cancelado", description: "El viaje ha sido cancelado.", icon: XCircle };
            }

            if (newNotification) {
                 setNotifications(prev => [...prev, {
                    ...newNotification,
                    id: `${currentStatus}-${Date.now()}`,
                    timestamp: new Date()
                }]);
            }

            sessionStorage.setItem(`trip_status_${trip.id}`, currentStatus);
        }

    }, [trip.status, trip.id]);

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
        if (!trip?.id || !auth.currentUser?.uid) return;
        setIsCancelling(true);
        try {
            await runTransaction(db, async (transaction) => {
                // --- ALL READS FIRST ---
                const tripRef = doc(db, "trips", trip.id);
                const driverRef = doc(db, "drivers", auth.currentUser.uid);
                const driverDoc = await transaction.get(driverRef);
                
                if (!driverDoc.exists()) {
                    throw new Error("Driver not found");
                }
                const currentCancelled = driverDoc.data().cancelledTrips || 0;

                // --- THEN ALL WRITES ---
                transaction.update(tripRef, {
                    status: 'cancelled',
                    cancelledBy: 'driver',
                    activeForDriver: false,
                    activeForPassenger: false
                });

                transaction.update(driverRef, { cancelledTrips: currentCancelled + 1 });
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
                activeForDriver: false,
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
            <AppHeader notifications={notifications} />
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

                <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col animate-in fade-in-50 duration-500 pb-40">
                     {trip.status === 'driver_en_route' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl leading-snug">
                                    Diríjase a: <span className="font-bold text-primary">{trip.pickupAddress}</span>
                                </CardTitle>
                                <CardDescription className="pt-1">
                                    El usuario {trip.passengerName?.split(' ')[0] || '...'} lo está esperando.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Ver Lugar de Recogida</span>
                                    <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="default" size="sm" className="w-32 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-transform active:scale-95">
                                                <MapIcon className="mr-1.5 h-4 w-4" />
                                                Mapa
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[80vh] flex flex-col p-4 overflow-hidden">
                                            <DialogHeader>
                                                <DialogTitle>Mapa del Viaje en Tiempo Real</DialogTitle>
                                                <DialogDescription className="text-center py-2 text-foreground/80">
                                                    El <b>Lugar de Recogida</b> es <span className="text-destructive font-bold">APROXIMADO</span>, guíate por la dirección brindada.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex justify-around text-xs mt-1 mb-3 py-2 border-y">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }}></div>
                                                    <span>Tu Ubicación</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                                                    <span>Lugar de Recogida</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    <span>Lugar de Destino</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow min-h-0 relative mt-2">
                                                {isMapOpen && (
                                                    <DynamicTripMap userRole="driver" trip={trip} />
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Separator />
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-5 w-5 text-green-500" />
                                            <span>Precio Acordado:</span>
                                        </div>
                                        <span className="font-bold text-lg text-foreground">${trip.offerPrice?.toFixed(2)}</span>
                                    </div>
                                    {trip.tripType === 'passenger' && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-5 w-5 text-blue-500" />
                                                <span>Pasajeros:</span>
                                            </div>
                                            <span className="font-bold text-lg text-foreground">{trip.passengerCount}</span>
                                        </div>
                                    )}
                                    {trip.tripType === 'cargo' && (
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <Package className="h-5 w-5 text-orange-500" />
                                                <span>Mercancía:</span>
                                            </div>
                                            <span className="font-semibold text-base text-foreground">{trip.cargoDescription}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-lg text-foreground/90 mt-4 text-center p-2 bg-muted rounded-md animate-pulse-soft flex items-center justify-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                                    <p className="text-lg text-foreground font-semibold">
                                        Al llegar al lugar de recogida presione el botón "He Llegado".
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                     {trip.status === 'driver_at_pickup' && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-6 w-6 text-primary" />
                                      <CardTitle className="text-xl leading-snug">
                                        Esperando en...
                                      </CardTitle>
                                    </div>
                                    <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="default" size="sm" className="w-24 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-transform active:scale-95">
                                                <MapIcon className="mr-1.5 h-4 w-4" />
                                                Mapa
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[80vh] flex flex-col p-4 overflow-hidden">
                                            <DialogHeader>
                                                <DialogTitle>Mapa del Viaje en Tiempo Real</DialogTitle>
                                                <DialogDescription className="text-center py-2 text-foreground/80">
                                                    El <b>Lugar de Recogida</b> es <span className="text-destructive font-bold">APROXIMADO</span>, guíate por la dirección brindada.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex justify-around text-xs mt-1 mb-3 py-2 border-y">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }}></div>
                                                    <span>Tu Ubicación</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                                                    <span>Lugar de Recogida</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    <span>Lugar de Destino</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow min-h-0 relative mt-2">
                                                {isMapOpen && (
                                                    <DynamicTripMap userRole="driver" trip={trip} />
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2">
                                <div className="flex items-start gap-2 text-lg">
                                    <MapPin className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                                    <span className="font-bold text-primary">{trip.pickupAddress}</span>
                                </div>

                                <div className="p-3 rounded-lg bg-muted/50 animate-pulse flex items-start gap-3">
                                    <AlertTriangle className="h-6 w-6 text-yellow-500 mt-0.5 shrink-0" />
                                    <p className="text-base text-foreground/90">
                                        <span className="font-bold">IMPORTANTE:</span> El pasajero tiene la obligación de presionar el botón "Comenzar Viaje" para tener una experiencia completa en la app Akí.
                                    </p>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-5 w-5 text-green-500" />
                                            <span>Precio Acordado:</span>
                                        </div>
                                        <span className="font-bold text-lg text-foreground">${trip.offerPrice?.toFixed(2)}</span>
                                    </div>
                                    {trip.tripType === 'passenger' && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-5 w-5 text-blue-500" />
                                                <span>Pasajeros:</span>
                                            </div>
                                            <span className="font-bold text-lg text-foreground">{trip.passengerCount}</span>
                                        </div>
                                    )}
                                    {trip.tripType === 'cargo' && (
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <Package className="h-5 w-5 text-orange-500" />
                                                <span>Mercancía:</span>
                                            </div>
                                            <span className="font-semibold text-base text-foreground">{trip.cargoDescription}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {trip.status === 'in_progress' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Diríjase a:</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-2 text-lg">
                                    <MapPin className="h-5 w-5 mt-1 text-green-500 shrink-0" />
                                    <span className="font-bold text-foreground">{trip.destinationAddress}</span>
                                </div>
                                <p className="text-base text-muted-foreground">
                                    Lleve a {trip.passengerName?.split(' ')[0] || '...'} al Lugar de Destino.
                                </p>
                                <Separator/>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {trip.destinationCoordinates ? "Ver Lugar de Destino" : "Ver Mapa"}
                                    </span>
                                    <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="default" size="sm" className="w-32 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-transform active:scale-95">
                                                <MapIcon className="mr-1.5 h-4 w-4" />
                                                Mapa
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[80vh] flex flex-col p-4 overflow-hidden">
                                             <DialogHeader>
                                                <DialogTitle>Viaje en Curso</DialogTitle>
                                                <DialogDescription className="text-center py-2 text-foreground/80">
                                                    Este mapa muestra tu ubicación actual y el destino del pasajero.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex justify-around text-xs mt-1 mb-3 py-2 border-y">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }}></div>
                                                    <span>Tu Ubicación</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    <span>Lugar de Destino</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow min-h-0 relative mt-2">
                                                {isMapOpen && (
                                                    <DynamicTripMap userRole="driver" trip={trip} />
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Separator />
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-5 w-5 text-green-500" />
                                            <span>Precio Acordado:</span>
                                        </div>
                                        <span className="font-bold text-lg text-foreground">${trip.offerPrice?.toFixed(2)}</span>
                                    </div>
                                    {trip.tripType === 'passenger' && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-5 w-5 text-blue-500" />
                                                <span>Pasajeros:</span>
                                            </div>
                                            <span className="font-bold text-lg text-foreground">{trip.passengerCount}</span>
                                        </div>
                                    )}
                                    {trip.tripType === 'cargo' && (
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <Package className="h-5 w-5 text-orange-500" />
                                                <span>Mercancía:</span>
                                            </div>
                                            <span className="font-semibold text-base text-foreground">{trip.cargoDescription}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {trip.status === 'completed' && (
                        <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col items-center justify-center text-center animate-in fade-in-50 duration-500">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="text-2xl">¡Viaje Finalizado!</CardTitle>
                                    <CardDescription>
                                        Felicidades, has finalizado el viaje, ahora el pasajero podrá valorar su experiencia. Vuelva al panel principal para buscar nuevo viajes
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
                            {(trip.status === 'driver_en_route' || trip.status === 'driver_at_pickup') && (
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
                                    <SheetContent side="bottom" className="h-1/2 rounded-t-2xl flex flex-col">
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
                                <div className={cn("max-w-2xl mx-auto", trip.status === 'in_progress' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3')}>
                                    {trip.status !== 'in_progress' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    size="lg" 
                                                    className="font-bold border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-md h-14"
                                                    disabled={isCancelling}
                                                >
                                                    Cancelar Viaje
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro de cancelar?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer y afectará a tus estadísticas. El pasajero será notificado.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Continuar Viaje</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleCancelTrip} disabled={isCancelling} className={buttonVariants({ variant: "destructive" })}>
                                                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                        Sí, Cancelar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    
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
                                        <Button size="lg" disabled className="font-bold text-md h-14 col-span-2">
                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                             Esperando Pasajero...
                                        </Button>
                                    )}

                                     {trip.status === 'in_progress' && (
                                        <Button 
                                            size="lg" 
                                            className="w-full font-bold bg-green-500 hover:bg-green-600 text-white text-md h-14"
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
  
  const locationWatcher = useRef<number | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DocumentData | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const { toast } = useToast();

  const [isTripInfoOpen, setIsTripInfoOpen] = useState(false);
  const [infoDialogTrip, setInfoDialogTrip] = useState<DocumentData | null>(null);

  const [isDestinationMapOpen, setIsDestinationMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [isCapacityWarningOpen, setIsCapacityWarningOpen] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // La actualización de datos es en tiempo real, 
        // así que solo simulamos una recarga para dar feedback visual.
        setTimeout(() => {
            setRefreshing(false);
            toast({ title: "Datos Actualizados", description: "El panel ha sido actualizado."});
        }, 1000);
  }, [toast]);


  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setError("No se pudo identificar al usuario.");
        setLoading(false);
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
    
    // 5km radius
    const nearby = tripsWithDistance.filter(trip => trip.distance < 5); 
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
  }, []);
  
  const [nearbyAvailableTrips, tripsWithSentOffers] = useMemo(() => {
    if (!allTrips.length && !sentOffers.length) return [[], []];

    const sentOfferTripIds = new Set(sentOffers.map(offer => offer.tripId));
    
    // Filter out trips that already have an offer sent by this driver
    let availableTrips = allTrips.filter(trip => !sentOfferTripIds.has(trip.id));

    // Filter based on driver's vehicle usage profile
    if (driverProfile) {
        const usage = driverProfile.vehicleUsage;
        if (usage === 'Pasaje') {
            availableTrips = availableTrips.filter(trip => trip.tripType === 'passenger');
        } else if (usage === 'Carga') {
            availableTrips = availableTrips.filter(trip => trip.tripType === 'cargo');
        }
    }
    
    // Calculate distance and sort nearby trips if location is available
    const nearbyList = driverLocation ? filterAndSortTrips(availableTrips, driverLocation) : [];

    // Map sent offers to their corresponding trip details
    const tripMap = new Map(allTrips.map(trip => [trip.id, trip]));
    const offersList = sentOffers
        .map(offer => {
            const trip = tripMap.get(offer.tripId);
            return trip ? { ...trip, ...offer, offerId: offer.id } : null;
        })
        .filter((item): item is DocumentData => item !== null && (item.status === 'pending' || item.status === 'rejected'))
        .sort((a, b) => (b.createdAt?.toDate() ?? 0) - (a.createdAt?.toDate() ?? 0));

    return [nearbyList, offersList];

  }, [allTrips, sentOffers, driverLocation, driverProfile, filterAndSortTrips]);

  // Real-time updates for trips
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "trips"), 
      where("status", "==", "searching")
    );
    
    const unsubscribeTrips = onSnapshot(q, (querySnapshot) => {
      const tripsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(trip => trip.expiresAt && trip.expiresAt.toDate() > new Date());
      setAllTrips(tripsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching real-time trips:", err);
      toast({
          title: "Error de Conexión",
          description: "No se pudieron cargar los viajes en tiempo real.",
          variant: "destructive"
      });
      setLoading(false);
    });

    return () => unsubscribeTrips();
  }, [toast]);

  // Real-time updates for offers
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const offersQuery = query(
        collectionGroup(db, 'offers'),
        where('driverId', '==', currentUser.uid)
    );

    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => {
            const tripId = doc.ref.parent.parent?.id;
            return { id: doc.id, tripId, ...doc.data() };
        });
        setSentOffers(offersData);
    }, (err) => {
        console.error("Error fetching sent offers:", err);
    });

    return () => unsubscribeOffers();
  }, []);

  // Location watching
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
          if (error) setError(null); 
        },
        (err) => {
          let userError;
          if (err.code === 1) { // PERMISSION_DENIED
            userError = "Debes conceder permiso de ubicación para ver viajes. Por favor, actívalo en la configuración de tu navegador y recarga la página.";
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            userError = "Tu ubicación no está disponible. Por favor, activa el GPS de tu dispositivo y asegúrate de tener buena señal.";
          } else if (err.code === 3) { // TIMEOUT
            userError = "La solicitud de ubicación ha caducado. Comprueba tu conexión e inténtalo de nuevo.";
          } else {
            userError = "No se puede obtener tu ubicación en tiempo real. Asegúrate de que la geolocalización está activada.";
          }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
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
  }, [error]); 
  
  const handleMakeOfferClick = (trip: DocumentData) => {
    setSelectedTrip(trip);
    if (!driverProfile) {
        toast({ title: "Error", description: "No se pudo cargar tu perfil.", variant: "destructive" });
        return;
    }
    
    if (trip.tripType === 'passenger' && (driverProfile.vehicleUsage === 'Pasaje' || driverProfile.vehicleUsage === 'Pasaje y Carga')) {
        const passengerCapacity = driverProfile.passengerCapacity || 0;
        if (trip.passengerCount > passengerCapacity) {
            setIsCapacityWarningOpen(true);
            return;
        }
    }
    
    openOfferDialog();
  };

  const openOfferDialog = () => {
    setOfferPrice('');
    setIsOfferDialogOpen(true);
  }

  const handleCapacityWarningContinue = () => {
    setIsCapacityWarningOpen(false);
    openOfferDialog();
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
            rating: driverData.rating || 0,
            price: Number(offerPrice),
            createdAt: serverTimestamp(),
            status: 'pending',
        };

        const newOfferRef = await addDoc(collection(db, "trips", selectedTrip.id, "offers"), offerData);
        
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
    if (loading && !allTrips.length) {
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
                        <TableHead className="w-[120px] px-2 py-2 text-center">Transporte</TableHead>
                        <TableHead className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                              Destino
                              <MapPin className="h-4 w-4 text-green-500 animate-pulse" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center px-2 py-2 w-[100px]">Info</TableHead>
                        <TableHead className="text-center w-[100px] px-2 py-2">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nearbyAvailableTrips.map((trip) => (
                        <TableRow key={trip.id}>
                            <TableCell className="px-2 py-3 align-top text-center space-y-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-semibold text-xs whitespace-nowrap",
                                    trip.tripType === 'passenger'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700'
                                      : 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700'
                                  )}
                                >
                                    {trip.tripType === 'passenger' ? `${trip.passengerCount} Pasajero${trip.passengerCount > 1 ? 's' : ''}` : 'Mercancía'}
                                </Badge>
                                {trip.tripType === 'cargo' && (
                                    <p className="text-sm text-foreground/80 font-medium">
                                        {trip.cargoDescription}
                                    </p>
                                )}
                            </TableCell>
                            <TableCell className="px-2 py-3 align-top text-center">
                              <p className="font-medium text-sm line-clamp-2">{trip.destinationAddress}</p>
                            </TableCell>
                            <TableCell className="text-center px-2 py-3 align-top">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => {
                                      setInfoDialogTrip(trip);
                                      setIsTripInfoOpen(true);
                                  }}
                                >
                                    <Info className="mr-1 h-3 w-3" />
                                    Info
                                </Button>
                            </TableCell>
                            <TableCell className="text-center px-2 py-3 align-top">
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
                        <TableHead className="px-2 text-center">Destino</TableHead>
                        <TableHead className="text-center w-[120px] px-2">Tu Oferta</TableHead>
                        <TableHead className="text-center w-[120px] px-2">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tripsWithSentOffers.map((tripOffer) => (
                        <TableRow key={tripOffer.offerId} className="text-sm">
                            <TableCell className="font-medium px-2 py-3 text-center">{tripOffer.destinationAddress}</TableCell>
                            <TableCell className="text-center font-semibold px-2 py-3">${Number(tripOffer.price).toFixed(2)}</TableCell>
                            <TableCell className="text-center px-2 py-3">
                                <Badge variant={tripOffer.status === 'pending' ? 'secondary' : 'destructive'}>
                                    {tripOffer.status === 'pending' ? 'Pendiente' : 'Rechazada'}
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
            <h1 className="text-3xl font-bold text-primary">Panel del Conductor</h1>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
                <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" onClick={() => { setMapCenter(driverLocation); setMapMarker(null); setIsMapOpen(true); }} className="w-32 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-transform active:scale-95">
                      <MapIcon className="mr-1.5 h-4 w-4" />
                      Mapa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                    <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
                      <DialogTitle className="text-2xl font-semibold text-primary">Tu Ubicación Actual</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow min-h-0 relative">
                      {isMapOpen && <UserLocationMap pinColor='accent' />}
                    </div>
                  </DialogContent>
                </Dialog>
            </div>
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
        <DialogContent className="sm:max-w-md">
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
            {isDestinationMapOpen && <UserLocationMap markerLocation={mapMarker} markerPopupText="Destino del Pasajero" pinColor='accent' />}
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isCapacityWarningOpen} onOpenChange={setIsCapacityWarningOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <AlertDialogTitle>Advertencia de Capacidad</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="pt-2 pl-11">
                    Este viaje requiere espacio para {selectedTrip?.passengerCount} pasajeros, pero tu vehículo solo tiene capacidad para {driverProfile?.passengerCapacity}. ¿Deseas ofertar de todos modos?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCapacityWarningContinue} className={buttonVariants({ variant: 'destructive' })}>
                    Continuar de todos modos
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isTripInfoOpen} onOpenChange={setIsTripInfoOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl text-primary">Información del Viaje</DialogTitle>
            </DialogHeader>
            {infoDialogTrip && (
                <div className="space-y-4 py-4">
                     <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Destino</p>
                            <p className="text-lg font-semibold">{infoDialogTrip.destinationAddress}</p>
                        </div>
                    </div>
                    {infoDialogTrip.destinationCoordinates && (
                        <div className="flex items-center justify-between gap-2">
                             <p className="text-sm font-medium">Ver Destino</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={() => handleViewDestination(infoDialogTrip.destinationCoordinates)}
                            >
                                <MapIcon className="mr-1 h-3 w-3" />
                                Mapa
                            </Button>
                        </div>
                     )}

                    <div className="flex items-center gap-3">
                         <Route className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Distancia al pasaje</p>
                            <p className="text-lg font-semibold">{formatDistance(infoDialogTrip.distance)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {infoDialogTrip.tripType === 'passenger' ? (
                            <>
                                <Users className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pasajeros</p>
                                    <p className="text-lg font-semibold">{infoDialogTrip.passengerCount}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Package className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Mercancía</p>
                                    <p className="text-lg font-semibold">{infoDialogTrip.cargoDescription}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

export const notificationShownRef = React.createRef<Record<string, boolean>>();
notificationShownRef.current = {};

export default function DriverDashboardPage() {
    const [activeTrip, setActiveTrip] = useState<DocumentData | null>(null);
    const [isCheckingForActiveTrip, setIsCheckingForActiveTrip] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const activeTripIdRef = useRef<string | null>(null);
    const locationWatcherRef = useRef<number | null>(null);

    // Effect to watch for an active trip
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "trips"),
                    where("driverId", "==", user.uid),
                    where("activeForDriver", "==", true),
                    limit(1)
                );

                const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    if (snapshot.empty) {
                        if (activeTripIdRef.current) {
                            if (!notificationShownRef.current['trip_concluded']) {
                                toast({
                                    title: "Viaje Concluido",
                                    description: "El viaje ha sido cancelado o ha finalizado.",
                                });
                                notificationShownRef.current['trip_concluded'] = true;
                            }
                            sessionStorage.removeItem(`trip_status_${activeTripIdRef.current}`);
                        }
                        setActiveTrip(null);
                        activeTripIdRef.current = null;
                        notificationShownRef.current = {};
                    } else {
                        const tripDoc = snapshot.docs[0];
                        const tripData = { id: tripDoc.id, ...tripDoc.data() };
                        const statusKey = `status_${tripData.status}`;
                        const currentStatus = tripData.status;

                        if (!activeTripIdRef.current && !notificationShownRef.current['new_trip']) {
                           toast({
                                title: "¡Nuevo Viaje!",
                                description: "Un pasajero ha aceptado tu oferta.",
                            });
                            notificationShownRef.current['new_trip'] = true;
                        } else if (currentStatus === 'in_progress' && !notificationShownRef.current[statusKey]) {
                           toast({
                                title: "¡Viaje Iniciado!",
                                description: "El pasajero ha confirmado el inicio del viaje.",
                            });
                            notificationShownRef.current[statusKey] = true;
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
                notificationShownRef.current = {};
            }
        });

        return () => unsubscribeAuth();
    }, [toast]);

    // Effect to start/stop location tracking based on active trip
    useEffect(() => {
        if (activeTrip && activeTrip.id && typeof window !== 'undefined' && navigator.geolocation) {
            locationWatcherRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const tripRef = doc(db, 'trips', activeTrip.id);
                    updateDoc(tripRef, { driverLocation: new GeoPoint(latitude, longitude) })
                        .catch(e => console.error("Failed to update driver location:", e));
                },
                (err) => {
                    console.error("Geolocation error during active trip:", err);
                    toast({
                        title: "Error de Ubicación",
                        description: "No se puede compartir tu ubicación. El pasajero no podrá verte en el mapa.",
                        variant: "destructive",
                    });
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        }

        // Cleanup function
        return () => {
            if (locationWatcherRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.clearWatch(locationWatcherRef.current);
                locationWatcherRef.current = null;
            }
        };
    }, [activeTrip, toast]);

    if (isCheckingForActiveTrip) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <main className="flex flex-col items-center justify-center flex-grow text-center px-4">
                    <AnimatedTaxiIcon />
                    <h2 className="text-2xl font-semibold text-primary mb-2">Verificando viajes activos...</h2>
                    <p className="text-muted-foreground">Esto tomará solo un momento.</p>
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
