
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';
import { Map, Car, Send, MapPin, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


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


export default function DriverDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyTrips, setNearbyTrips] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationWatcher = useRef<number | null>(null);

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

  useEffect(() => {
    if (navigator.geolocation) {
      locationWatcher.current = navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null); 
        },
        (err) => {
          let userError = "No se puede obtener tu ubicación en tiempo real. ";
          if (err.code === err.PERMISSION_DENIED) {
            userError += "Debes conceder permiso de ubicación para ver viajes.";
          } else {
            userError += "Asegúrate de tener la geolocalización activada.";
          }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
  }, []);

  useEffect(() => {
    if (!driverLocation) {
        setLoading(true);
        return;
    }
    
    setLoading(true);
    const q = query(collection(db, "trips"), where("status", "==", "searching"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tripsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredTrips = filterAndSortTrips(tripsData, driverLocation);
        setNearbyTrips(filteredTrips);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching trips:", err);
        setError("No se pudieron cargar los viajes. Intenta recargar la página.");
        setLoading(false);
    });

    return () => unsubscribe();

  }, [driverLocation, filterAndSortTrips]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-4 bg-destructive/10 rounded-lg text-center text-destructive flex flex-col items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            <p className="font-semibold">{error}</p>
        </div>
      );
    }
    if (loading) {
       return (
        <div className="p-4 rounded-lg text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>Buscando pasajes cercanos...</span>
        </div>
       );
    }
    if (nearbyTrips.length === 0) {
       return (
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground flex flex-col items-center gap-2">
            <XCircle className="h-8 w-8" />
            <p>No hay pasajes disponibles en tu zona en este momento.</p>
        </div>
       );
    }
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead className="text-right">Distancia</TableHead>
                        <TableHead className="text-center">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nearbyTrips.map((trip) => (
                        <TableRow key={trip.id}>
                            <TableCell>
                                <Badge variant={trip.tripType === 'passenger' ? 'default' : 'secondary'}>
                                    {trip.tripType === 'passenger' ? 'Pasaje' : 'Carga'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{trip.destinationAddress}</span>
                                    <Button size="icon" variant="ghost" className={cn("h-8 w-8 rounded-full", trip.destinationCoordinates ? 'text-green-500' : 'text-muted-foreground/50 cursor-not-allowed')} disabled={!trip.destinationCoordinates}>
                                        <MapPin className="h-5 w-5" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatDistance(trip.distance)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="outline" size="sm">
                                    <Send className="mr-2 h-4 w-4" />
                                    Hacer Oferta
                                </Button>
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
        <div className="w-full max-w-4xl">
          <div className="flex justify-end mb-6">
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsMapOpen(true)}>
                  <Map className="mr-2 h-5 w-5" />
                  Ver mi Ubicación
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
                  <DialogTitle className="text-2xl font-semibold text-primary">Tu Ubicación Actual</DialogTitle>
                  <DialogDescription>
                    Este mapa muestra tu ubicación en tiempo real.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-grow min-h-0 relative">
                  {isMapOpen && <UserLocationMap />}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Accordion type="multiple" defaultValue={['pasajes', 'ofertas']} className="w-full space-y-4">
            <AccordionItem value="pasajes" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 hover:no-underline">
                <div className="flex items-center">
                  <Car className="mr-3 h-6 w-6" />
                  Pasajes en tu Zona
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                {renderContent()}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ofertas" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 hover:no-underline">
                 <div className="flex items-center">
                  <Send className="mr-3 h-6 w-6" />
                  Ofertas Enviadas
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                  No has enviado ninguna oferta.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
}
