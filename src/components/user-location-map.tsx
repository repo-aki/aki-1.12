
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import type L from 'leaflet';
import { Button } from '@/components/ui/button';

let LeafletModule: typeof L | null = null;

interface UserLocationMapProps {
  onDestinationSelect?: (location: { lat: number; lng: number }) => void;
  markerLocation?: { lat: number; lng: number } | null;
  markerPopupText?: string;
}

const UserLocationMap: React.FC<UserLocationMapProps> = ({ onDestinationSelect, markerLocation, markerPopupText }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(LeafletModule !== null);
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number } | null>(null);

  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !LeafletModule) {
      setLoading(true);
      import('leaflet').then(LModule => {
        LeafletModule = LModule.default;
        setIsLeafletLoaded(true);
      }).catch(err => {
        console.error("Error al cargar Leaflet:", err);
        setError("No se pudo cargar la librería del mapa. Intenta recargar.");
        setLoading(false);
      });
    } else if (LeafletModule) {
      setIsLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLeafletLoaded) return;

    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error(`Error obteniendo geolocalización: Code ${err.code} - ${err.message}`, err);
          let userError;
            if (err.code === 1) { // PERMISSION_DENIED
            userError = "Permiso de ubicación denegado. El mapa no puede funcionar sin tu ubicación.";
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
            userError = "Ubicación no disponible. Por favor, activa el GPS de tu dispositivo y asegúrate de tener buena señal.";
            } else if (err.code === 3) { // TIMEOUT
            userError = "La solicitud de ubicación ha caducado. Comprueba tu conexión a internet y asegúrate de tener buena señal.";
            } else {
            userError = "No se pudo obtener tu ubicación.";
            }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setError("La geolocalización no es soportada por este navegador.");
      setLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }
    };
  }, [isLeafletLoaded]);

  useEffect(() => {
    if (location && mapContainerRef.current && isLeafletLoaded && LeafletModule) {
      if (!mapInstanceRef.current) {
        const userIcon = LeafletModule.divIcon({
          html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="hsl(var(--primary))" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

        const map = LeafletModule.map(mapContainerRef.current, {
          center: [location.lat, location.lng],
          zoom: 15,
          layers: [
            LeafletModule.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            }),
          ],
        });

        LeafletModule.marker([location.lat, location.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('Tu ubicación actual');
        
        const bounds = LeafletModule.latLngBounds([location.lat, location.lng]);

        if (markerLocation) {
           const destinationIcon = LeafletModule.divIcon({
              html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`,
              className: '',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
              popupAnchor: [0, -36]
          });

          LeafletModule.marker([markerLocation.lat, markerLocation.lng], { icon: destinationIcon })
            .addTo(map)
            .bindPopup(markerPopupText || 'Ubicación Marcada');
          
          bounds.extend([markerLocation.lat, markerLocation.lng]);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        if (onDestinationSelect) {
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                setSelectedDestination({ lat, lng });

                const destinationIcon = LeafletModule!.divIcon({
                  html: `<div class="relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#fff" stroke-width="0.5"></path></svg><svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`,
                  className: '',
                  iconSize: [36, 36],
                  iconAnchor: [18, 36],
                  popupAnchor: [0, -36]
                });

                if (destinationMarkerRef.current) {
                    destinationMarkerRef.current.setLatLng(e.latlng);
                } else {
                    destinationMarkerRef.current = LeafletModule!.marker([lat, lng], { icon: destinationIcon }).addTo(map);
                }
                destinationMarkerRef.current.bindPopup("Destino seleccionado").openPopup();
            });
        }
        
        mapInstanceRef.current = map;

        if (invalidateTimeoutRef.current) clearTimeout(invalidateTimeoutRef.current);
        invalidateTimeoutRef.current = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 300);
      }
    }
  }, [location, isLeafletLoaded, onDestinationSelect, markerLocation, markerPopupText]);

  const handleConfirmDestination = () => {
    if (selectedDestination && onDestinationSelect) {
      onDestinationSelect(selectedDestination);
    }
  };

  if (loading || !isLeafletLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">{!isLeafletLoaded ? 'Cargando mapa...' : 'Obteniendo tu ubicación...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error de Ubicación</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow flex flex-col min-h-0 w-full h-full relative">
       <div id="userMap" ref={mapContainerRef} className="flex-grow min-h-0 w-full h-full rounded-md shadow-md bg-muted" />
       {onDestinationSelect && selectedDestination && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
           <Button onClick={handleConfirmDestination} size="lg" className="shadow-lg">
             <CheckCircle className="mr-2 h-5 w-5" />
             Confirmar Destino
           </Button>
         </div>
       )}
    </div>
  );
};

export default UserLocationMap;
