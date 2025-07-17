
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DocumentData, GeoPoint } from 'firebase/firestore';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  // --- Map Initialization and Cleanup ---
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!mapContainerRef.current) return;

    // Load Leaflet dynamically
    Promise.all([
      import('leaflet'),
    ]).then(([L]) => {
      if (!isMountedRef.current || mapInstanceRef.current) return;

      const initialCenter: L.LatLngExpression = [21.5218, -77.7812]; // Default to Cuba
      
      // Prevent re-initialization on the same container
      if (mapContainerRef.current && mapContainerRef.current.innerHTML === "") {
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 6,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
        
        // Force map to redraw after a short delay to fix rendering issues in dialogs
        setTimeout(() => map.invalidateSize(), 100);
      }
      
      setIsLoading(false);
    }).catch(err => {
      console.error("Error loading Leaflet:", err);
      setError("Failed to load map library.");
      setIsLoading(false);
    });

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Marker and View Updates ---
  useEffect(() => {
    if (isLoading || !mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    const passengerLocation = trip.pickupCoordinates ? { lat: trip.pickupCoordinates.lat, lng: trip.pickupCoordinates.lng } : null;
    const driverLocation = trip.driverLocation ? { lat: trip.driverLocation.latitude, lng: trip.driverLocation.longitude } : null;
    const destinationLocation = trip.destinationCoordinates ? { lat: trip.destinationCoordinates.lat, lng: trip.destinationCoordinates.lng } : null;

    import('leaflet').then(L => {
        const bounds = L.latLngBounds([]);

        const driverIcon = L.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--accent))" stroke="#1C1917" stroke-width="0.5"></path><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

        const passengerIcon = L.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--primary))" stroke="#fff" stroke-width="0.5"></path><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
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

        // Manage Passenger Marker
        const shouldShowPassengerMarker = !(userRole === 'driver' && trip.status === 'in_progress');
        if (shouldShowPassengerMarker && passengerLocation) {
            if (!passengerMarkerRef.current) {
                passengerMarkerRef.current = L.marker(passengerLocation, { icon: passengerIcon }).addTo(map).bindPopup(userRole === 'driver' ? 'Lugar de Recogida' : 'Tu Ubicación');
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
            driverMarkerRef.current = L.marker(driverLocation, { icon: driverIcon }).addTo(map).bindPopup('Ubicación del Conductor');
          } else {
            driverMarkerRef.current.setLatLng(driverLocation);
          }
          bounds.extend(driverLocation);
        }

        // Manage Destination Marker
        if (destinationLocation) {
          if (!destinationMarkerRef.current) {
            destinationMarkerRef.current = L.marker(destinationLocation, { icon: destinationIcon }).addTo(map).bindPopup('Lugar de Destino');
          } else {
            destinationMarkerRef.current.setLatLng(destinationLocation);
          }
          bounds.extend(destinationLocation);
        }
        
        // Fit bounds only if there are valid points and the map hasn't been panned by the user
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    });
  }, [isLoading, trip, userRole]);


  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="flex h-full w-full items-center justify-center text-destructive"><AlertTriangle className="mr-2"/>{error}</div>;
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-md" />;
};

export default TripMap;
