'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Car, Route, Star, Loader2, AlertTriangle, MapPin, Package, User, Info, Clock } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';


const statusSteps = [
  { id: 'searching', label: 'Buscando Conductor', icon: Search },
  { id: 'driver_en_route', label: 'Conductor en Camino', icon: Car },
  { id: 'in_progress', label: 'Viaje en Curso', icon: Route },
  { id: 'completed', label: 'Valora el Viaje', icon: Star },
];

const statusOrder = statusSteps.map(s => s.id);

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
  const [sortBy, setSortBy] = useState<SortByType>('price_asc');
  const [countdown, setCountdown] = useState('05:00');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

  const handleTimeoutCancel = useCallback(async () => {
    if (isDeleting || trip?.status !== 'searching') {
        return;
    }
    setIsDeleting(true);

    try {
        await deleteDoc(doc(db, 'trips', tripId));
        toast({
            title: "Solicitud Expirada",
            description: "Tu solicitud de viaje ha expirado, pero guardamos tus datos.",
        });
    } catch (e) {
        console.error("Error al cancelar el viaje por tiempo:", e);
    } finally {
        router.push('/dashboard/passenger');
    }
  }, [isDeleting, tripId, router, toast, trip?.status]);


  const handleUserConfirmCancel = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
        await deleteDoc(doc(db, 'trips', tripId));
        
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('aki_arrival_last_trip_request');
        }
        
        toast({
            title: "Solicitud Cancelada",
            description: "Tu solicitud de viaje ha sido cancelada con éxito.",
        });
        setIsCancelAlertOpen(false);
        router.push('/dashboard/passenger');
    } catch (e) {
        console.error("Error al cancelar el viaje:", e);
        toast({
            title: "Error al Cancelar",
            description: "No se pudo cancelar la solicitud. Inténtalo de nuevo.",
            variant: "destructive",
        });
        setIsDeleting(false);
        setIsCancelAlertOpen(false);
    }
  };

  const handleUserAbortCancel = () => {
    setIsCancelAlertOpen(false);
    // Vuelve a añadir el estado al historial para que el próximo intento de retroceso sea interceptado de nuevo.
    window.history.pushState(null, '', window.location.href);
  };

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
          setTrip({ id: docSnapshot.id, ...docSnapshot.data() });
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
    
    const offersQuery = query(collection(db, 'trips', tripId, 'offers'));
    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOffers(offersData);
    });

    return () => {
        unsubscribeTrip();
        unsubscribeOffers();
    };
  }, [tripId]);

  useEffect(() => {
    if (!trip?.createdAt || trip.status !== 'searching') return;

    const createdAt = trip.createdAt.toDate();
    const expiryTime = createdAt.getTime() + 5 * 60 * 1000;

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiryTime - now;

        if (distance <= 0) {
            clearInterval(interval);
            setCountdown("00:00");
            handleTimeoutCancel();
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }
    }, 1000);

    return () => clearInterval(interval);

  }, [trip, handleTimeoutCancel]);

  
  const currentStatusIndex = trip ? statusOrder.indexOf(trip.status) : -1;

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating_desc':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }, [offers, sortBy]);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-16 pb-12 px-4">

        <div className="w-full max-w-2xl flex justify-end mb-4">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="transition-transform active:scale-95">
                        <Info className="mr-2 h-4 w-4" />
                        Ver Detalles
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary">Detalles del Viaje</DialogTitle>
                         <DialogDescription>Resumen de la solicitud de tu viaje.</DialogDescription>
                    </DialogHeader>
                     <div className="space-y-4 pt-4">
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Recogida</h3>
                            <p className="text-md font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-accent shrink-0" /> {trip?.pickupAddress}
                            </p>
                         </div>
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Destino</h3>
                            <p className="text-md font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-accent shrink-0" /> {trip?.destinationAddress}
                            </p>
                         </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Tipo de Viaje</h3>
                            <div className="text-md font-semibold text-foreground flex items-center gap-2">
                                {trip?.tripType === 'passenger' ? (
                                    <>
                                        <User className="h-5 w-5 text-accent" /> 
                                        <span>{trip?.passengerCount} Pasajero(s)</span>
                                    </>
                                ) : (
                                    <>
                                       <Package className="h-5 w-5 text-accent" />
                                       <span className="truncate">{trip?.cargoDescription}</span>
                                    </>
                                )}
                            </div>
                         </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        
        {/* Status Indicator */}
        <div className="w-full max-w-2xl mt-4">
          <div className="flex items-center relative">
            {/* Connecting Lines */}
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
                      'mt-2 text-sm text-center',
                       index === currentStatusIndex ? 'text-primary dark:text-accent font-bold' : 'text-muted-foreground'
                    )}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Offers Table (visible only in 'searching' state) */}
        {currentStatusIndex === 0 && (
            <>
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-destructive my-6 p-2 bg-destructive/10 rounded-md">
                    <Clock className="h-6 w-6" />
                    <span>Tiempo restante para seleccionar: {countdown}</span>
                </div>
                <Card className="w-full max-w-2xl animate-in fade-in-50 duration-500">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-xl text-primary">Ofertas Recibidas</CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                                <Select onValueChange={(value: SortByType) => setSortBy(value)} defaultValue={sortBy}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Seleccionar orden" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="price_asc">Precio (menor a mayor)</SelectItem>
                                        <SelectItem value="price_desc">Precio (mayor a menor)</SelectItem>
                                        <SelectItem value="rating_desc">Calificación (mejor a peor)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Calificación</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-center">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedOffers.length > 0 ? sortedOffers.map((offer, index) => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>{offer.driverName}</TableCell>
                                        <TableCell>{renderRating(offer.rating)}</TableCell>
                                        <TableCell className="text-right font-semibold">${offer.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button size="sm" variant="outline" className="transition-transform active:scale-95">Seleccionar</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                            Esperando ofertas de conductores cercanos...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </>
        )}
        
        {/* Driver Info Placeholder */}
        {currentStatusIndex >= 1 && (
            <div className="w-full max-w-md mt-8 p-6 bg-card rounded-lg shadow-md animate-in fade-in-50 duration-500">
                <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4">Información del Conductor</h2>
                <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-5 bg-muted rounded w-1/2"></div>
                    <div className="h-5 bg-muted rounded w-2/3"></div>
                </div>
            </div>
        )}
        
        <Button variant="outline" className="mt-12 transition-transform active:scale-95" disabled={isDeleting} onClick={() => setIsCancelAlertOpen(true)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>
      </main>

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
            <AlertDialogAction onClick={handleUserConfirmCancel} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Sí, Cancelar Solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
