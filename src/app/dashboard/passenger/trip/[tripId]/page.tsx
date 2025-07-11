
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, collection, query, orderBy, deleteDoc, updateDoc, Timestamp, writeBatch, serverTimestamp, limit, where, getDocs, runTransaction, getDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, Search, Car, Route, Star, Loader2, AlertTriangle, MapPin, Package, User, Info, Clock, CheckCircle, MessageSquare, Send, Map, Bell, XCircle, Users, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import DynamicTripMap from '@/components/dynamic-trip-map';
import UserLocationMap from '@/components/user-location-map';
import TripChat from '@/components/trip-chat';
import AnimatedTaxiIcon from '@/components/animated-taxi-icon';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const statusSteps = [
  { id: 'searching', label: 'Buscando', icon: Search },
  { id: 'driver_en_route', label: 'En Espera', icon: Car },
  { id: 'in_progress', label: 'Viajando', icon: Route },
  { id: 'completed', label: 'Finalizado', icon: CheckCircle },
];

const statusOrder = statusSteps.map(s => s.id);
const terminalStatuses = ['completed', 'cancelled', 'expired'];

type SortByType = 'price_asc' | 'price_desc' | 'rating_desc';

export default function TripStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<DocumentData[]>([]);
  const [countdown, setCountdown] = useState('05:00');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [isTimeoutAlertOpen, setIsTimeoutAlertOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isStartTripAlertOpen, setIsStartTripAlertOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DocumentData | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const tripRef = useRef<DocumentData | null>(null);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadTimestamp = useRef<Timestamp | null>(null);

  // State for detailed driver profile
  const [driverProfile, setDriverProfile] = useState<DocumentData | null>(null);
  const [driverRatings, setDriverRatings] = useState<{ average: number, comments: any[] }>({ average: 0, comments: [] });
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(false);


  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  const handleUserConfirmCancel = async () => {
    if (isDeleting || !tripId) return;
    setIsDeleting(true);

    try {
        await runTransaction(db, async (transaction) => {
            const tripDocRef = doc(db, 'trips', tripId);
            const tripDoc = await transaction.get(tripDocRef);
            if (!tripDoc.exists()) throw new Error("Trip not found");
            const tripData = tripDoc.data();

            transaction.update(tripDocRef, {
                status: 'cancelled',
                cancelledBy: 'passenger',
                expiresAt: serverTimestamp(),
                activeForDriver: false,
                activeForPassenger: false
            });

            if (tripData.driverId) {
                const driverRef = doc(db, "drivers", tripData.driverId);
                const driverDoc = await transaction.get(driverRef);
                if (driverDoc.exists()) {
                    const currentCancelled = driverDoc.data().cancelledTrips || 0;
                    transaction.update(driverRef, { cancelledTrips: currentCancelled + 1 });
                }
            }
        });
        
        setIsCancelAlertOpen(false);
        setIsTimeoutAlertOpen(false);
    } catch (e) {
        console.error("Error al cancelar el viaje:", e);
        toast({
            title: "Error al Cancelar",
            description: "No se pudo cancelar la solicitud. Inténtalo de nuevo.",
            variant: "destructive",
        });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetrySearch = async () => {
      if (isRetrying || !tripId) return;
      setIsRetrying(true);
      try {
        const newExpiryDate = new Date(Date.now() + 5 * 60 * 1000);
        await updateDoc(doc(db, 'trips', tripId), {
          expiresAt: Timestamp.fromDate(newExpiryDate),
        });
        toast({
          title: "Búsqueda Reiniciada",
          description: "Tienes 5 minutos más para encontrar un conductor.",
        });
        setIsTimeoutAlertOpen(false);
      } catch (e) {
        console.error("Error al reintentar la búsqueda:", e);
        toast({
          title: "Error",
          description: "No se pudo reiniciar la búsqueda. Por favor, cancela y vuelve a intentarlo.",
          variant: "destructive",
        });
      } finally {
        setIsRetrying(false);
      }
    };


  const handleUserAbortCancel = () => {
    setIsCancelAlertOpen(false);
    // Vuelve a añadir el estado al historial para que el próximo intento de retroceso sea interceptado de nuevo.
    if (trip?.status === 'searching') {
        window.history.pushState(null, '', window.location.href);
    }
  };

  const handleAcceptOffer = async (offer: DocumentData) => {
    if (isAccepting || !tripId || !offer) return;
    setIsAccepting(true);
    try {
        const batch = writeBatch(db);

        const tripDocRef = doc(db, 'trips', tripId);
        batch.update(tripDocRef, {
            status: 'driver_en_route',
            driverId: offer.driverId,
            driverName: offer.driverName,
            vehicleType: offer.vehicleType,
            driverRating: offer.rating,
            acceptedOfferId: offer.id,
            offerPrice: offer.price,
            driverLocation: null, // Initialize driver location field
            activeForDriver: true,
            activeForPassenger: true,
        });

        const offerDocRef = doc(db, 'trips', tripId, 'offers', offer.id);
        batch.update(offerDocRef, { status: 'accepted' });

        offers.forEach(otherOffer => {
            if (otherOffer.id !== offer.id) {
                const otherOfferRef = doc(db, 'trips', tripId, 'offers', otherOffer.id);
                batch.update(otherOfferRef, { status: 'rejected' });
            }
        });

        await batch.commit();

        toast({
            title: "¡Oferta Aceptada!",
            description: "Tu conductor está en camino.",
        });
    } catch (e) {
        console.error("Error al aceptar la oferta:", e);
        toast({
            title: "Error al Aceptar",
            description: "No se pudo aceptar la oferta. Inténtalo de nuevo.",
            variant: "destructive",
        });
    } finally {
        setIsAccepting(false);
    }
  };

  const handleStartTrip = async () => {
    if (isStartingTrip || !tripId) return;
    setIsStartingTrip(true);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'in_progress',
      });
      toast({
        title: "¡Viaje Iniciado!",
        description: "Que tengas un buen viaje.",
      });
    } catch (error) {
      console.error("Error al iniciar el viaje:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el viaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsStartingTrip(false);
      setIsStartTripAlertOpen(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (isCompleting || !tripId || !trip.driverId) return;
    setIsCompleting(true);
    try {
        const tripRef = doc(db, 'trips', tripId);
        const driverRef = doc(db, 'drivers', trip.driverId);
        
        await runTransaction(db, async (transaction) => {
            const driverDoc = await transaction.get(driverRef);
            if (!driverDoc.exists()) {
                throw new Error("Driver profile not found.");
            }
            
            transaction.update(tripRef, { status: 'completed' });

            const currentCompleted = driverDoc.data().completedTrips || 0;
            transaction.update(driverRef, { completedTrips: currentCompleted + 1 });
        });

        toast({
            title: "Viaje Finalizado",
            description: "Gracias por viajar con Akí. Por favor, valora tu experiencia.",
        });
    } catch (error: any) {
        console.error("Error al finalizar el viaje:", error);
        let description = "No se pudo finalizar el viaje. Inténtalo de nuevo.";
        if (error.code === 'permission-denied') {
            description = "Error de permisos. No se pudo actualizar el estado del viaje o las estadísticas del conductor.";
        }
        toast({
            title: "Error",
            description: description,
            variant: "destructive",
        });
    } finally {
        setIsCompleting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
        toast({
            title: "Calificación Requerida",
            description: "Por favor, selecciona una calificación de estrellas antes de enviar.",
            variant: "destructive",
        });
        return;
    }

    if (isSubmittingRating || !tripId || !trip.driverId) return;
    setIsSubmittingRating(true);

    try {
      const tripDocRef = doc(db, 'trips', tripId);
      const driverDocRef = doc(db, 'drivers', trip.driverId);
      
      await runTransaction(db, async (transaction) => {
        // 1. READ from driver document
        const driverDoc = await transaction.get(driverDocRef);
        if (!driverDoc.exists()) {
          throw new Error("El perfil del conductor no fue encontrado.");
        }
        
        // 2. Perform calculations with read data
        const driverData = driverDoc.data();
        const currentRating = driverData.rating || 0;
        const ratingCount = driverData.ratingCount || 0;

        const newRatingCount = ratingCount + 1;
        const newTotalRatingValue = (currentRating * ratingCount) + rating;
        const newAverageRating = newTotalRatingValue / newRatingCount;

        // 3. WRITE to trip document
        transaction.update(tripDocRef, {
          rating: rating,
          comment: comment,
          activeForPassenger: false
        });

        // 4. WRITE to driver document
        transaction.update(driverDocRef, {
          rating: newAverageRating,
          ratingCount: newRatingCount,
        });
        
        // 5. WRITE to new ratings subcollection document
        const ratingData = {
            tripId: tripId,
            rating: rating,
            comment: comment,
            passengerName: trip.passengerName || 'Anónimo',
            createdAt: serverTimestamp()
        };
        const newRatingDocRef = doc(collection(db, 'drivers', trip.driverId, 'ratings'));
        transaction.set(newRatingDocRef, ratingData);
      });

      toast({
        title: "¡Valoración Enviada!",
        description: "Gracias por tus comentarios.",
      });
      router.push('/dashboard/passenger');
      
    } catch (error: any) {
        console.error("Error al enviar la valoración:", error);
        let description = "No se pudo enviar tu valoración. Por favor, inténtalo de nuevo.";
        if (error.code === 'permission-denied') {
            description = "Error de permisos. Asegúrate de que las reglas de seguridad de Firestore permitan a los pasajeros valorar a los conductores.";
        } else if (error.message.includes("El perfil del conductor no fue encontrado.")) {
            description = "No se pudo encontrar el perfil del conductor para guardar la valoración.";
        }
        toast({
            title: "Error al Enviar Valoración",
            description: description,
            variant: "destructive",
        });
    } finally {
        setIsSubmittingRating(false);
    }
  };


  const handleFetchDriverInfo = useCallback(async (offer: DocumentData) => {
    if (!offer.driverId) return;
    setSelectedOffer(offer);
    setIsInfoDialogOpen(true);
    setIsProfileDataLoading(true);

    try {
        const driverDocRef = doc(db, "drivers", offer.driverId);
        const driverDocSnap = await getDoc(driverDocRef);
        
        if (!driverDocSnap.exists()) {
            throw new Error("No se pudo encontrar el perfil del conductor.");
        }
        
        const driverData = driverDocSnap.data();
        setDriverProfile(driverData);
        
        const ratingsQuery = query(
          collection(db, "drivers", offer.driverId, "ratings"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const commentsData = ratingsSnapshot.docs.map(d => d.data());

        setDriverRatings({
            average: driverData.rating || 0,
            comments: commentsData,
        });

    } catch (error: any) {
        console.error("Error fetching driver info:", error);
        let description = "No se pudo cargar la información del conductor.";
        if (error.code === 'permission-denied') {
            description = "Error de permisos. Revisa las reglas de seguridad de Firestore.";
        }
        toast({ title: "Error", description, variant: "destructive" });
    } finally {
        setIsProfileDataLoading(false);
    }
  }, [toast]);

  const handleFetchAcceptedDriverInfo = useCallback(async () => {
    if (!trip?.driverId) return;
    setIsInfoDialogOpen(true);
    setIsProfileDataLoading(true);

    try {
        const driverDocRef = doc(db, "drivers", trip.driverId);
        const driverDocSnap = await getDoc(driverDocRef);
        
        if (!driverDocSnap.exists()) {
            throw new Error("No se pudo encontrar el perfil del conductor.");
        }
        
        const driverData = driverDocSnap.data();
        setDriverProfile(driverData);
        
        const ratingsQuery = query(
          collection(db, "drivers", trip.driverId, "ratings"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const commentsData = ratingsSnapshot.docs.map(d => d.data());

        setDriverRatings({
            average: driverData.rating || 0,
            comments: commentsData,
        });

    } catch (error: any) {
        console.error("Error fetching driver info:", error);
        let description = "No se pudo cargar la información del conductor.";
        if (error.code === 'permission-denied') {
            description = "Error de permisos. Revisa las reglas de seguridad de Firestore.";
        }
        toast({ title: "Error", description, variant: "destructive" });
    } finally {
        setIsProfileDataLoading(false);
    }
  }, [trip?.driverId, toast]);

  useEffect(() => {
    // Interceptar el botón de retroceso del navegador/móvil
    if (trip?.status === 'searching') {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        setIsCancelAlertOpen(true);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [trip?.status]);


  useEffect(() => {
    if (!tripId) return;

    const tripDocRef = doc(db, 'trips', tripId);
    const unsubscribeTrip = onSnapshot(
      tripDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const newTripData = { id: docSnapshot.id, ...docSnapshot.data() };
          const previousTripData = tripRef.current;

          // Toast for driver arrival
          if (
              newTripData.status === 'driver_at_pickup' &&
              previousTripData?.status !== 'driver_at_pickup'
          ) {
              toast({
                  title: "¡El conductor ha llegado!",
                  description: "Por favor, dirígete al punto de recogida.",
              });
          }

          // Check if the trip was just cancelled
          if (
            newTripData.status === 'cancelled' &&
            (!previousTripData || previousTripData.status !== 'cancelled')
          ) {
            const description = newTripData.cancelledBy === 'driver'
              ? "El conductor ha cancelado el viaje."
              : "Tu solicitud de viaje ha sido cancelada.";

            toast({
              title: "Viaje Cancelado",
              description: description,
              variant: newTripData.cancelledBy === 'driver' ? "destructive" : "default",
            });

            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('aki_arrival_last_trip_request');
            }
            setTimeout(() => router.push('/dashboard/passenger'), 3000);
            setTrip(newTripData);
            setLoading(false);
            return;
          }

          // Handle 'expired' state
          if (newTripData.status === 'expired') {
             if (typeof window !== 'undefined') {
               sessionStorage.removeItem('aki_arrival_last_trip_request');
             }
             router.push('/dashboard/passenger');
             return;
          }
          
          setTrip(newTripData);
          setError(null);
        } else {
          setError('No se pudo encontrar el viaje solicitado o ha expirado.');
          setTrip(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error al escuchar el estado del viaje:", err);
        setError('Hubo un error al cargar los datos del viaje.');
        setLoading(false);
      }
    );
    
    const offersQuery = query(collection(db, 'trips', tripId, 'offers'), orderBy('createdAt', 'desc'));
    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOffers(offersData);
    });

    return () => {
        unsubscribeTrip();
        unsubscribeOffers();
    };
  }, [tripId, router, toast]);

    const handleChatOpenChange = async (open: boolean) => {
        setIsChatOpen(open);
        if (open) {
            setUnreadCount(0);
            const q = query(collection(db, 'trips', tripId, 'messages'), orderBy('createdAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                lastReadTimestamp.current = snapshot.docs[0].data().createdAt as Timestamp;
            }
        }
    };
    
    useEffect(() => {
        if (!tripId || !auth.currentUser || isChatOpen) return;

        const q = query(
            collection(db, 'trips', tripId, 'messages'),
            where('createdAt', '>', lastReadTimestamp.current || new Timestamp(0, 0))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessagesFromOther = snapshot.docs.filter(doc => doc.data().senderId !== auth.currentUser!.uid);
            if (newMessagesFromOther.length > 0) {
                 setUnreadCount(prev => prev + newMessagesFromOther.length);
            }
        });

        return () => unsubscribe();
    }, [tripId, isChatOpen]);

  useEffect(() => {
    if (!trip?.expiresAt || trip.status !== 'searching') return;

    const expiryTime = trip.expiresAt.toDate().getTime();

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiryTime - now;

        if (distance <= 0) {
            clearInterval(interval);
            setCountdown("00:00");
            if (!isTimeoutAlertOpen && !isCancelAlertOpen) {
              setIsTimeoutAlertOpen(true);
            }
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }
    }, 1000);

    return () => clearInterval(interval);

  }, [trip, isTimeoutAlertOpen, isCancelAlertOpen]);

  
  const currentStatusIndex = trip ? statusOrder.indexOf(trip.status) : -1;
  const isDriverAtPickup = trip?.status === 'driver_at_pickup';

  const sortedOffers = useMemo(() => {
    // Sort by price ascending
    return [...offers].sort((a, b) => a.price - b.price);
  }, [offers]);

  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <Star key={i} className={cn(
                "h-4 w-4",
                i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50"
            )} />
        );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const renderRatingInput = () => (
    <div className="flex items-center justify-center gap-2 my-6">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => setRating(star)} type="button">
          <Star
            className={cn(
              "h-12 w-12 cursor-pointer transition-colors duration-200",
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex flex-col items-center justify-center flex-grow">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando estado del viaje...</p>
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
          <Button asChild variant="outline" className="mt-8">
            <Link href="/dashboard/passenger">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!trip) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex flex-col items-center justify-center flex-grow">
          <p className="mt-4 text-muted-foreground">No se encontró el viaje.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-16 pb-12 px-4">
        
        {/* Status Indicator */}
        <div className="w-full max-w-2xl mt-4">
          <div className="flex items-center relative">
            {/* Connecting Lines */}
            <div className="absolute top-6 left-0 w-full h-1 bg-muted"></div>
            <div 
              className="absolute top-6 left-0 h-1 bg-green-500 transition-all duration-500"
              style={{ width: `${((isDriverAtPickup ? 1 : currentStatusIndex) / (statusSteps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="flex items-center justify-between w-full">
              {statusSteps.map((step, index) => {
                 const isActive = currentStatusIndex === index;
                 const isCompleted = isDriverAtPickup ? index < 1 : currentStatusIndex > index;
                 const isPulsing = isDriverAtPickup && index === 1;

                 return (
                    <div className="flex flex-col items-center text-center z-10 w-24" key={step.id}>
                        <div
                            className={cn(
                            'flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 border-4',
                            isCompleted || isPulsing ? 'bg-green-500 border-green-100 dark:border-green-900 text-white' : 'bg-muted border-background text-muted-foreground',
                            isPulsing && 'animate-pulse'
                            )}
                        >
                            <step.icon className="h-6 w-6" />
                        </div>
                        <p className={cn(
                            'mt-2 text-sm text-center font-semibold',
                            isActive ? 'text-primary dark:text-accent' : 'text-muted-foreground'
                        )}>
                            {step.label}
                        </p>
                    </div>
                 );
              })}
            </div>
          </div>
        </div>

        {/* Offers Table (visible only in 'searching' state) */}
        {trip?.status === 'searching' && (
            <div className="w-full max-w-2xl animate-in fade-in-50 duration-500">
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-destructive my-6 p-2 bg-destructive/10 rounded-md">
                    <Clock className="h-6 w-6 animate-spin-slow" />
                    <span>Tiempo Restante: {countdown}</span>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl text-primary flex items-center">
                              Ofertas Recibidas
                              <Badge
                                  variant="secondary"
                                  className={cn(
                                      "ml-3",
                                      sortedOffers.length > 0 && "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-200 font-bold"
                                  )}
                              >
                                  {sortedOffers.length}
                              </Badge>
                            </CardTitle>
                        </div>
                         <CardDescription className="flex items-center justify-between">
                            <span>Tu solicitud</span>
                             <Button variant="outline" size="sm" onClick={() => setIsRequestInfoOpen(true)}>
                                <Info className="mr-2 h-4 w-4"/>
                                Info
                            </Button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-2 py-2">Vehículo</TableHead>
                                        <TableHead className="text-right px-2 py-2">Precio</TableHead>
                                        <TableHead className="text-center px-2 py-2">Info</TableHead>
                                        <TableHead className="text-center px-2 py-2">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedOffers.length > 0 ? (
                                    sortedOffers.map((offer) => (
                                        <TableRow key={offer.id} className="text-sm">
                                            <TableCell className="font-medium px-2 py-2">{offer.vehicleType || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-semibold px-2 py-2">${offer.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-center px-2 py-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => handleFetchDriverInfo(offer)}
                                            >
                                                <Info className="h-5 w-5" />
                                            </Button>
                                            </TableCell>
                                            <TableCell className="text-center px-2 py-2">
                                                <Button 
                                                size="sm" 
                                                className="bg-green-500 hover:bg-green-600 text-white font-semibold transition-transform active:scale-95 h-8 px-2.5"
                                                onClick={() => handleAcceptOffer(offer)}
                                                disabled={isAccepting}
                                                >
                                                    {isAccepting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                                                    Aceptar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                Esperando ofertas de conductores cercanos...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-6 flex justify-center">
                    <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar Solicitud
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Cancelar la Solicitud?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Si abandonas esta página, tu solicitud de viaje actual se cancelará. ¿Estás seguro de que deseas continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleUserAbortCancel} disabled={isDeleting}>Continuar Buscando</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUserConfirmCancel} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Sí, Cancelar Solicitud
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        )}

        {/* Driver Info Card and Trip Controls for driver_en_route and driver_at_pickup */}
        {(trip?.status === 'driver_en_route' || trip?.status === 'driver_at_pickup') && (
            <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col animate-in fade-in-50 duration-500">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div>
                            <CardTitle className="text-xl">
                                {trip.status === 'driver_at_pickup' ? '¡El Conductor ha Llegado!' : 'Conductor en Camino'}
                            </CardTitle>
                             {trip.status === 'driver_en_route' && (
                                <CardDescription className="pt-1">
                                    Espera en: <span className="font-bold text-primary">{trip.pickupAddress}</span>
                                </CardDescription>
                             )}
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full">
                           {trip.status === 'driver_at_pickup' ? <CheckCircle className="h-6 w-6 text-primary" /> : <Car className="h-6 w-6 text-primary animate-taxi-bounce" />}
                        </div>
                    </CardHeader>
                     <CardContent className="p-4 pt-0">
                        {trip.status === 'driver_at_pickup' && (
                            <div className="mb-4">
                                <p className="text-muted-foreground">{trip.driverName?.split(' ')[0] || '...'} te está esperando en:</p>
                                <p className="font-bold text-primary">{trip.pickupAddress}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold">{trip.driverName}</p>
                                <p className="text-muted-foreground">{trip.vehicleType}</p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0" onClick={handleFetchAcceptedDriverInfo}>
                                <Info className="mr-2 h-4 w-4" /> Info
                            </Button>
                        </div>

                         {trip.status === 'driver_en_route' && (
                             <div className="flex items-center justify-between mt-4 border-t pt-4">
                                <span className="text-sm text-muted-foreground">Ver Conductor</span>
                                <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                                            <MapPin className="mr-1.5 h-4 w-4" />
                                            Mapa
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                                        <DialogHeader>
                                        <DialogTitle>Mapa del Viaje en Tiempo Real</DialogTitle>
                                        <DialogDescription>
                                            Ubicación del conductor (amarillo) y tuya (verde).
                                        </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-grow min-h-0 relative">
                                        {isMapOpen && <DynamicTripMap userRole="passenger" trip={trip} />}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                         )}

                        <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t">
                            <p className="font-medium">Precio Acordado</p>
                            <p className="font-bold text-xl text-primary">${trip.offerPrice?.toFixed(2)}</p>
                        </div>

                        {trip.status === 'driver_at_pickup' && (
                             <div className="p-3 mt-4 rounded-lg bg-muted/50 animate-pulse flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                                <p className="text-base text-foreground/90">
                                    Al comenzar el viaje presione el botón <span className="font-bold text-green-500">Comenzar Viaje</span>
                                    <ArrowDownCircle className="inline-block ml-1 h-5 w-5 text-green-500" />
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Floating Chat Button */}
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
                            <SheetTitle>Chat con {trip.driverName?.split(' ')[0] || 'Conductor'}</SheetTitle>
                            <SheetDescription>Los mensajes son en tiempo real.</SheetDescription>
                        </SheetHeader>
                        <TripChat
                            tripId={trip.id}
                            userRole="passenger"
                            currentUserName={trip.passengerName || 'Pasajero'}
                            otherUserName={trip.driverName || 'Conductor'}
                        />
                    </SheetContent>
                </Sheet>

                {/* Fixed bottom controls */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t md:static md:bg-transparent md:p-0 md:border-none mt-auto">
                    <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="font-bold border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-md h-14"
                                    disabled={isDeleting}
                                >
                                    Cancelar Viaje
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro de cancelar?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer y afectará a tus estadísticas. El conductor será notificado.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Continuar Viaje</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleUserConfirmCancel} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sí, Cancelar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog open={isStartTripAlertOpen} onOpenChange={setIsStartTripAlertOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className={cn(
                                        "font-bold bg-green-500 hover:bg-green-600 text-white text-md h-14",
                                        trip.status === 'driver_at_pickup' && "animate-pulse"
                                    )}
                                    disabled={trip.status !== 'driver_at_pickup' || isStartingTrip}
                                >
                                    {isStartingTrip && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {trip.status === 'driver_at_pickup' ? 'Comenzar Viaje' : 'Conductor en Camino...'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar Inicio de Viaje?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Se encuentra en el vehículo con el conductor y ha comenzado su viaje con normalidad.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isStartingTrip}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleStartTrip} disabled={isStartingTrip}>
                                        {isStartingTrip && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Aceptar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        )}

        {/* In Progress View */}
        {trip?.status === 'in_progress' && (
            <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col animate-in fade-in-50 duration-500">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Viaje en Curso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-2 text-lg">
                           <MapPin className="h-5 w-5 mt-1 text-green-500 shrink-0" />
                           <span className="font-medium text-foreground">Destino: {trip.destinationAddress}</span>
                        </div>
                         <Separator/>
                         <div className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold">{trip.driverName}</p>
                                <p className="text-muted-foreground">{trip.vehicleType}</p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0" onClick={handleFetchAcceptedDriverInfo}>
                                <Info className="mr-2 h-4 w-4" /> Info
                            </Button>
                        </div>
                         <Separator/>
                        <div className="flex justify-between items-center text-sm">
                            <p className="font-medium">Precio Acordado</p>
                            <p className="font-bold text-xl text-primary">${trip.offerPrice?.toFixed(2)}</p>
                        </div>
                        <Separator/>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                {trip.destinationCoordinates ? "Ver Lugar de Destino" : "Ver Mapa"}
                            </span>
                            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default" size="sm" className="w-32 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-transform active:scale-95">
                                        <Map className="mr-1.5 h-4 w-4" />
                                        Mapa
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                                    <DialogHeader>
                                        <DialogTitle>Tu Viaje en Tiempo Real</DialogTitle>
                                        <DialogDescription>Este mapa muestra tu ubicación actual y el destino.</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-grow min-h-0 relative">
                                        {isMapOpen && <UserLocationMap markerLocation={trip.destinationCoordinates} markerPopupText="Destino" />}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                 <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t md:static md:bg-transparent md:p-0 md:border-none mt-auto w-full max-w-2xl">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                            size="lg" 
                            className="w-full font-bold bg-green-500 hover:bg-green-600 text-white text-md h-14"
                            disabled={isCompleting}
                        >
                            {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalizó el Viaje
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro de que finalizó el viaje?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Confirma que has llegado a tu destino y el viaje ha terminado.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel disabled={isCompleting}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCompleteTrip} disabled={isCompleting}>
                                  {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Aceptar
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        )}

        {/* Rating View */}
        {trip?.status === 'completed' && trip.rating === undefined && (
            <div className="w-full max-w-2xl mt-6 space-y-4 flex-grow flex flex-col items-center justify-center animate-in fade-in-50 duration-500">
                <Card className="w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">¡Viaje Completado!</CardTitle>
                        <CardDescription>Por favor, valora tu experiencia con {trip.driverName?.split(' ')[0] || 'el conductor'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderRatingInput()}
                        <Textarea 
                            placeholder="Deja un comentario opcional..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mt-4"
                        />
                    </CardContent>
                </Card>
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                     <Button
                        variant="outline"
                        size="lg"
                        className="h-14"
                        onClick={() => router.push('/dashboard/passenger')}
                    >
                        Ir al Panel Principal
                    </Button>
                    <Button
                        size="lg"
                        className="h-14 font-bold"
                        onClick={handleSubmitRating}
                        disabled={rating === 0 || isSubmittingRating}
                    >
                        {isSubmittingRating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Valoración
                    </Button>
                </div>
            </div>
        )}
        
        { (trip.status !== 'searching' && 
         trip.status !== 'driver_en_route' && 
         trip.status !== 'driver_at_pickup' && 
         trip.status !== 'in_progress' &&
         (trip.status !== 'completed' || trip.rating !== undefined)
         ) && (
          <Button variant="outline" className="mt-12 transition-transform active:scale-95" onClick={() => router.push('/dashboard/passenger')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        )}
      </main>

      {/* Driver Info Dialog (for offers) */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Información del Conductor</DialogTitle>
            </DialogHeader>
            {isProfileDataLoading ? (
              <div className="py-8 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : driverProfile ? (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Información Personal</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Nombre:</span> {driverProfile.fullName}</p>
                       <p><span className="font-medium text-foreground">Vehículo:</span> {driverProfile.vehicleType}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-3"/>
                  
                  <div>
                      <h3 className="font-semibold text-lg mb-2">Estadísticas de Viajes</h3>
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500"/>
                            <p className="text-sm"><span className="font-bold">{driverProfile.completedTrips || 0}</span> Completados</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive"/>
                            <p className="text-sm"><span className="font-bold">{driverProfile.cancelledTrips || 0}</span> Cancelados</p>
                          </div>
                      </div>
                  </div>

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
                                        {renderRating(review.rating)}
                                        <p className="text-sm text-muted-foreground italic mt-1">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                      ) : (
                          <p className="text-sm text-muted-foreground">Aún no tiene comentarios.</p>
                      )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="py-4 text-center text-muted-foreground">No se pudo cargar la información del perfil.</div>
            )}
        </DialogContent>
      </Dialog>
      
       {/* Request Info Dialog */}
      <Dialog open={isRequestInfoOpen} onOpenChange={setIsRequestInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Detalles de tu Solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recogida</p>
                <p className="text-lg font-semibold">{trip.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-500 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destino</p>
                <p className="text-lg font-semibold">{trip.destinationAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {trip.tripType === 'passenger' ? (
                <>
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pasajeros</p>
                    <p className="text-lg font-semibold">{trip.passengerCount}</p>
                  </div>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mercancía</p>
                    <p className="text-lg font-semibold">{trip.cargoDescription}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Manual Cancellation Dialog */}
      <AlertDialog open={isCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar la Solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Si abandonas esta página, tu solicitud de viaje actual se cancelará y no se guardarán los datos del formulario. ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleUserAbortCancel} disabled={isDeleting}>Continuar Buscando</AlertDialogCancel>
            <AlertDialogAction onClick={handleUserConfirmCancel} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Sí, Cancelar Solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Timeout Dialog */}
      <AlertDialog open={isTimeoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tiempo de Espera Agotado</AlertDialogTitle>
            <AlertDialogDescription>
              Tu solicitud ha expirado. ¿Deseas buscar de nuevo durante 5 minutos más o cancelar la solicitud por completo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleUserConfirmCancel} disabled={isDeleting || isRetrying}>Cancelar Solicitud</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetrySearch} disabled={isDeleting || isRetrying}>
              {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Volver a Intentarlo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
