
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
}

const UserLocationMap: React.FC<UserLocationMapProps> = ({ onDestinationSelect }) => {
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
          let userError = "No se pudo obtener tu ubicación. ";
          if (err.code === 1) { // PERMISSION_DENIED
            userError += "Has denegado el permiso de ubicación.";
          } else if (err.code === 3) { // TIMEOUT
            userError += "La solicitud de ubicación ha caducado.";
          } else {
            userError += "Asegúrate de tener activada la geolocalización.";
          }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
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
        const userIcon = LeafletModule.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
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
        
        if (onDestinationSelect) {
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                setSelectedDestination({ lat, lng });

                const destinationIcon = LeafletModule.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                });

                if (destinationMarkerRef.current) {
                    destinationMarkerRef.current.setLatLng(e.latlng);
                } else {
                    destinationMarkerRef.current = LeafletModule.marker([lat, lng], { icon: destinationIcon }).addTo(map);
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
  }, [location, isLeafletLoaded, onDestinationSelect]);

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
