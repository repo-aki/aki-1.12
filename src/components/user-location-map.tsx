
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';
import type L from 'leaflet'; // Importación explícita de tipos

// Variable para almacenar la librería Leaflet una vez cargada
let LeafletModule: typeof L | null = null;

const UserLocationMap: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(LeafletModule !== null); // Inicializa basado en si ya se cargó
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cargar Leaflet dinámicamente solo en el lado del cliente
    if (typeof window !== 'undefined' && !LeafletModule) {
      setLoading(true); // Mostrar carga mientras se carga Leaflet también
      import('leaflet').then(LModule => {
        LeafletModule = LModule.default;
        setIsLeafletLoaded(true);
        // No establecemos setLoading(false) aquí, esperamos la geolocalización
      }).catch(err => {
        console.error("Error al cargar Leaflet:", err);
        setError("No se pudo cargar la librería del mapa. Intenta recargar.");
        setLoading(false);
      });
    } else if (LeafletModule) {
        setIsLeafletLoaded(true); // Si ya estaba cargado globalmente
    }
  }, []);

  useEffect(() => {
    if (!isLeafletLoaded) return; // No hacer nada hasta que Leaflet esté cargado

    setLoading(true); // Iniciar carga para geolocalización
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
          console.error("Error obteniendo geolocalización:", err);
          let userError = "No se pudo obtener tu ubicación. ";
          if (err.code === err.PERMISSION_DENIED) {
            userError += "Has denegado el permiso de ubicación.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            userError += "La información de ubicación no está disponible.";
          } else if (err.code === err.TIMEOUT) {
            userError += "Se agotó el tiempo de espera para obtener la ubicación.";
          } else {
            userError += "Ocurrió un error desconocido.";
          }
          setError(userError);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("La geolocalización no es soportada por este navegador.");
      setLoading(false);
    }

    // Limpieza al desmontar el componente
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }
    };
  }, [isLeafletLoaded]); // Se ejecuta cuando Leaflet se carga

  useEffect(() => {
    if (location && mapContainerRef.current && isLeafletLoaded && LeafletModule) {
      if (mapInstanceRef.current) {
        // Si ya existe una instancia pero la ubicación cambió, solo actualizamos la vista
        mapInstanceRef.current.setView([location.lat, location.lng], 15);
        // Podríamos actualizar el marcador si fuera necesario, pero para este caso
        // asumimos que el marcador se añade una vez.
      } else {
        // Crear el mapa solo si no existe una instancia
        const defaultIcon = LeafletModule.icon({
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
        LeafletModule.marker([location.lat, location.lng], { icon: defaultIcon }).addTo(map);
        mapInstanceRef.current = map;

        // Invalidar el tamaño del mapa después de que el diálogo esté visible
        if (invalidateTimeoutRef.current) clearTimeout(invalidateTimeoutRef.current);
        invalidateTimeoutRef.current = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 300); // Un breve retraso para asegurar que el DOM esté listo
      }
    }
  }, [location, isLeafletLoaded]); // Depende de `location` y `isLeafletLoaded`

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
    <div className="flex-grow flex flex-col min-h-0 w-full h-full">
       <div id="userMap" ref={mapContainerRef} className="flex-grow min-h-0 w-full h-full rounded-md shadow-md bg-muted" />
    </div>
  );
};

export default UserLocationMap;
