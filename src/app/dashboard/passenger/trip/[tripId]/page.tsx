
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Car, Route, Star, Loader2, AlertTriangle, MapPin, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusSteps = [
  { id: 'searching', label: 'Buscando Conductor', icon: Search },
  { id: 'driver_en_route', label: 'Conductor en Camino', icon: Car },
  { id: 'in_progress', label: 'Viaje en Curso', icon: Route },
  { id: 'completed', label: 'Valora el Viaje', icon: Star },
];

const statusOrder = statusSteps.map(s => s.id);

export default function TripStatusPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const tripDocRef = doc(db, 'trips', tripId);
    const unsubscribe = onSnapshot(
      tripDocRef,
      (doc) => {
        if (doc.exists()) {
          setTrip({ id: doc.id, ...doc.data() });
          setError(null);
        } else {
          setError('No se pudo encontrar el viaje solicitado.');
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

    return () => unsubscribe();
  }, [tripId]);
  
  const currentStatusIndex = trip ? statusOrder.indexOf(trip.status) : -1;

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
      <main className="flex flex-col items-center flex-grow pt-24 pb-12 px-4">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-10">
          Estado de tu Viaje
        </h1>

        {/* Status Indicator */}
        <div className="w-full max-w-2xl">
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
                      'flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 border-4 border-background',
                      index <= currentStatusIndex ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
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

        {/* Trip Details */}
        <div className="w-full max-w-md mt-12 p-6 bg-card rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Detalles del Viaje</h2>
             <div>
                <h3 className="text-sm font-medium text-muted-foreground">Recogida</h3>
                <p className="text-md font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-secondary shrink-0" /> {trip?.pickupAddress}
                </p>
             </div>
             <div>
                <h3 className="text-sm font-medium text-muted-foreground">Destino</h3>
                <p className="text-md font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-secondary shrink-0" /> {trip?.destinationAddress}
                </p>
             </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Viaje</h3>
                <div className="text-md font-semibold text-foreground flex items-center gap-2">
                    {trip?.tripType === 'passenger' ? (
                        <>
                            <User className="h-5 w-5 text-secondary" /> 
                            <span>{trip?.passengerCount} Pasajero(s)</span>
                        </>
                    ) : (
                        <>
                           <Package className="h-5 w-5 text-secondary" />
                           <span className="truncate">{trip?.cargoDescription}</span>
                        </>
                    )}
                </div>
             </div>
        </div>
        
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

        <Button asChild variant="outline" className="mt-12">
            <Link href="/dashboard/passenger">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
            </Link>
        </Button>
      </main>
    </div>
  );
}
