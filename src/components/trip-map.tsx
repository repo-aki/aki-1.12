
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DocumentData, GeoPoint, doc, updateDoc } from 'firebase/firestore';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase/config';

interface TripMapProps {
  userRole: 'driver' | 'passenger';
  trip: DocumentData;
}

const TripMap: React.FC<TripMapProps> = ({ userRole, trip }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const passengerMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const locationWatcherRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Watch own location and update firestore if driver
    locationWatcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (userRole === 'driver') {
          const { latitude, longitude } = position.coords;
          const tripRef = doc(db, 'trips', trip.id);
          updateDoc(tripRef, { driverLocation: new GeoPoint(latitude, longitude) })
            .catch(e => console.error("Failed to update driver location:", e));
        }
        if (isLoading) setIsLoading(false);
      },
      (err) => {
        let message = 'No se pudo obtener la ubicación. Por favor, habilita los permisos.';
        if (err.code === 1) {
            message = 'Permiso de ubicación denegado. El mapa no puede funcionar sin tu ubicación.';
        } else if (err.code === 2) {
            message = 'Ubicación no disponible. Activa el GPS de tu dispositivo.';
        }
        setError(message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      if (locationWatcherRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatcherRef.current);
      }
      mapInstanceRef.current?.remove();
    };
  }, [userRole, trip.id, isLoading]);

  useEffect(() => {
    if (isLoading || error || !mapContainerRef.current) return;
    
    let LModule: typeof L;

    Promise.all([
      import('leaflet'),
    ]).then(([L]) => {
      LModule = L;
      const passengerLocation = trip.pickupCoordinates ? { lat: trip.pickupCoordinates.lat, lng: trip.pickupCoordinates.lng } : null;
      const driverLocation = trip.driverLocation ? { lat: trip.driverLocation.latitude, lng: trip.driverLocation.longitude } : null;
      const destinationLocation = trip.destinationCoordinates ? { lat: trip.destinationCoordinates.lat, lng: trip.destinationCoordinates.lng } : null;

      if (!mapInstanceRef.current) {
        // Initialize map
        const initialCenter = driverLocation || passengerLocation || [21.5218, -77.7812]; // Default to Cuba
        const map = L.map(mapContainerRef.current!).setView(initialCenter, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      }

      const map = mapInstanceRef.current;
      const bounds = L.latLngBounds([]);

      const driverIcon = L.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--accent))" stroke="#000" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4"/><path d="M6 17h.01"/><path d="M18 17h.01"/><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M19 12H5"/><path d="M2.5 12H5"/><path d="M19 12h2.5"/><path d="m5 12 1.4-2.8A2 2 0 0 1 8.2 8h7.6a2 2 0 0 1 1.8 1.2L19 12"/></svg></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
      });

      const passengerIcon = L.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--primary))" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
      });
      
      const destinationIcon = L.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
      });

      // Update passenger marker
      if (passengerLocation) {
        if (!passengerMarkerRef.current) {
          passengerMarkerRef.current = L.marker(passengerLocation, { icon: passengerIcon }).addTo(map).bindPopup('Punto de Encuentro');
        } else {
          passengerMarkerRef.current.setLatLng(passengerLocation);
        }
        bounds.extend(passengerLocation);
      }
      
      // Update driver marker
      if (driverLocation) {
        if (!driverMarkerRef.current) {
          driverMarkerRef.current = L.marker(driverLocation, { icon: driverIcon }).addTo(map).bindPopup('Tu Ubicación');
        } else {
          driverMarkerRef.current.setLatLng(driverLocation);
        }
        bounds.extend(driverLocation);
      }

      // Update destination marker
      if (destinationLocation) {
        if (!destinationMarkerRef.current) {
          destinationMarkerRef.current = L.marker(destinationLocation, { icon: destinationIcon }).addTo(map).bindPopup('Destino Final');
        } else {
          destinationMarkerRef.current.setLatLng(destinationLocation);
        }
        bounds.extend(destinationLocation);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    });
  }, [isLoading, error, trip.driverLocation, trip.pickupCoordinates, trip.destinationCoordinates]);


  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="flex h-full w-full items-center justify-center text-destructive"><AlertTriangle className="mr-2"/>{error}</div>;
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-md" />;
};

export default TripMap;
