
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

      const driverIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });

      const passengerIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });

      // Update passenger marker
      if (passengerLocation) {
        if (!passengerMarkerRef.current) {
          passengerMarkerRef.current = L.marker(passengerLocation, { icon: passengerIcon }).addTo(map).bindPopup('Pasajero');
        } else {
          passengerMarkerRef.current.setLatLng(passengerLocation);
        }
        bounds.extend(passengerLocation);
      }
      
      // Update driver marker
      if (driverLocation) {
        if (!driverMarkerRef.current) {
          driverMarkerRef.current = L.marker(driverLocation, { icon: driverIcon }).addTo(map).bindPopup('Conductor');
        } else {
          driverMarkerRef.current.setLatLng(driverLocation);
        }
        bounds.extend(driverLocation);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    });
  }, [isLoading, error, trip.driverLocation, trip.pickupCoordinates]);


  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="flex h-full w-full items-center justify-center text-destructive"><AlertTriangle className="mr-2"/>{error}</div>;
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-md" />;
};

export default TripMap;
