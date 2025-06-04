
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
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(LeafletModule !== null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !LeafletModule) {
      setLoading(true);
      import('leaflet').then(LModule => {
        LeafletModule = LModule.default;
        setIsLeafletLoaded(true);
        // No es necesario setLoading(false) aquí, se maneja en el efecto de geolocalización
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
    if (!isLeafletLoaded) return; // Solo proceder si Leaflet está cargado

    setLoading(true); // Iniciar carga para obtener ubicación
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
          // Mensaje de error en consola mejorado
          console.error(`Error obteniendo geolocalización. Code: ${err.code}, Message: "${err.message}"`, err);
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
        // Opciones de geolocalización ajustadas:
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setError("La geolocalización no es soportada por este navegador.");
      setLoading(false);
    }

    // Función de limpieza para el efecto de geolocalización y el mapa
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }
    };
  }, [isLeafletLoaded]); // Depender solo de isLeafletLoaded para el flujo de geolocalización

  useEffect(() => {
    // Este efecto se encarga solo de renderizar/actualizar el mapa cuando la ubicación cambia y Leaflet está listo
    if (location && mapContainerRef.current && isLeafletLoaded && LeafletModule) {
      if (mapInstanceRef.current) {
        // Si ya existe un mapa, solo actualiza la vista y el marcador
        mapInstanceRef.current.setView([location.lat, location.lng], 15);
        // Opcional: Mover un marcador existente o crear uno nuevo si es necesario
        // Por ahora, estamos recreando el mapa en la limpieza del efecto anterior
      } else {
        // Crear el mapa si no existe
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

        // Invalidar tamaño después de que el mapa se haya añadido al DOM y sea visible
        if (invalidateTimeoutRef.current) clearTimeout(invalidateTimeoutRef.current);
        invalidateTimeoutRef.current = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 300); // Aumentamos el timeout para dar más tiempo a la animación del diálogo y renderizado.
      }
    }
  }, [location, isLeafletLoaded]); // Depender de location e isLeafletLoaded para renderizar el mapa

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
  
  // Asegurar que el contenedor del mapa exista incluso si la ubicación aún no está disponible (pero no hay error/carga)
  return (
    <div className="flex-grow flex flex-col min-h-0 w-full h-full">
       <div id="userMap" ref={mapContainerRef} className="flex-grow min-h-0 w-full h-full rounded-md shadow-md bg-muted" />
    </div>
  );
};

export default UserLocationMap;
