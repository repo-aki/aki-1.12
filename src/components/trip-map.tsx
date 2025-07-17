
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DocumentData } from 'firebase/firestore';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';

interface TripMapProps {
  userRole: 'driver' | 'passenger';
  trip: DocumentData;
}

let LeafletModule: typeof L | null = null;

const TripMap: React.FC<TripMapProps> = ({ userRole, trip }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const passengerMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasCenteredMap = useRef(false);

  // --- Dynamic Leaflet Loading ---
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && !LeafletModule) {
      import('leaflet').then(LModule => {
        LeafletModule = LModule;
        setIsLoading(false); 
      }).catch(err => {
        console.error("Error al cargar Leaflet:", err);
        setError("No se pudo cargar la librería del mapa.");
        setIsLoading(false);
      });
    } else if (LeafletModule) {
      setIsLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- Map Initialization ---
  useEffect(() => {
    if (isLoading || !mapContainerRef.current || mapInstanceRef.current) return;
    
    if (LeafletModule && mapContainerRef.current && mapContainerRef.current.innerHTML === "") {
        const map = LeafletModule.map(mapContainerRef.current, {
            center: [21.5218, -77.7812], // Default to Cuba
            zoom: 6,
        });

        LeafletModule.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        hasCenteredMap.current = false;
      }
    };
  }, [isLoading]);

  // --- Marker and View Updates ---
  useEffect(() => {
    if (isLoading || !mapInstanceRef.current || !LeafletModule) return;
    
    const map = mapInstanceRef.current;
    
    const passengerLocation = trip.pickupCoordinates ? { lat: trip.pickupCoordinates.lat, lng: trip.pickupCoordinates.lng } : null;
    const driverLocation = trip.driverLocation ? { lat: trip.driverLocation.latitude, lng: trip.driverLocation.longitude } : null;
    const destinationLocation = trip.destinationCoordinates ? { lat: trip.destinationCoordinates.lat, lng: trip.destinationCoordinates.lng } : null;
    
    const bounds = LeafletModule.latLngBounds([]);

    const driverIcon = LeafletModule.divIcon({
      html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--accent))" stroke="#1C1917" stroke-width="0.5"></path><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const passengerIcon = LeafletModule.divIcon({
      html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--primary))" stroke="#fff" stroke-width="0.5"></path><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
    
    const destinationIcon = LeafletModule.divIcon({
      html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    // Manage Passenger Marker
    const shouldShowPassengerMarker = !(userRole === 'driver' && trip.status === 'in_progress');
    if (shouldShowPassengerMarker && passengerLocation) {
        if (!passengerMarkerRef.current) {
            passengerMarkerRef.current = LeafletModule.marker(passengerLocation, { icon: passengerIcon }).addTo(map).bindPopup(userRole === 'driver' ? 'Lugar de Recogida' : 'Tu Ubicación');
        } else {
            passengerMarkerRef.current.setLatLng(passengerLocation);
        }
        bounds.extend(passengerLocation);
    } else if (passengerMarkerRef.current) {
        passengerMarkerRef.current.remove();
        passengerMarkerRef.current = null;
    }
    
    // Manage Driver Marker
    if (driverLocation) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = LeafletModule.marker(driverLocation, { icon: driverIcon }).addTo(map).bindPopup('Ubicación del Conductor');
      } else {
        driverMarkerRef.current.setLatLng(driverLocation);
      }
      bounds.extend(driverLocation);
    }

    // Manage Destination Marker
    if (destinationLocation) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = LeafletModule.marker(destinationLocation, { icon: destinationIcon }).addTo(map).bindPopup('Lugar de Destino');
      } else {
        destinationMarkerRef.current.setLatLng(destinationLocation);
      }
      bounds.extend(destinationLocation);
    }
    
    // Fit bounds only if there are valid points and the map hasn't been panned by the user
    if (bounds.isValid() && !hasCenteredMap.current) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        hasCenteredMap.current = true;
    }
  }, [isLoading, trip, userRole]);


  if (isLoading) {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center text-center text-muted-foreground bg-muted rounded-lg shadow-inner">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="mt-2 text-sm font-medium">Cargando mapa...</p>
        </div>
    );
  }

  if (error) {
    return <div className="flex h-full w-full items-center justify-center text-destructive"><AlertTriangle className="mr-2"/>{error}</div>;
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-md bg-muted" />;
};

export default TripMap;
