
"use client";

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';

const STEPS = [
  { id: 1, title: 'Lugar de Recogida' },
  { id: 2, title: 'Lugar de Destino' },
  { id: 3, title: 'Datos del Viaje' },
];

export default function PassengerDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      {/* Mover el contenido hacia arriba y reducir el espaciado */}
      <main className="flex flex-col flex-grow items-center justify-start pt-24 px-4">
        
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col">
            {STEPS.map((step, index) => (
              // Reducir el margen inferior para juntar los elementos
              <div key={step.id} className="flex items-start mb-4 last:mb-0">
                {/* Columna para la esfera y la línea vertical */}
                <div className="flex flex-col items-center mr-3">
                  {/* Esfera más pequeña */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-base font-bold z-10 shrink-0">
                    {step.id}
                  </div>
                  {/* Línea de conexión vertical más corta */}
                  {index < STEPS.length - 1 && (
                    <div className="w-px h-12 bg-black" />
                  )}
                </div>

                {/* Contenido: Línea horizontal y título, ajustado para alinear con la esfera */}
                <div className="flex items-center pt-0.5">
                  <div className="w-4 h-px bg-black mr-3"></div>
                  <p className="text-lg font-semibold text-foreground">{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Botón flotante para el Mapa */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="icon"
              className="rounded-full h-16 w-16 shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label="Ver mapa"
              onClick={() => setIsMapOpen(true)}
            >
              <MapPin className="h-8 w-8" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
            <DialogTitle className="text-2xl font-semibold text-primary">Tu Ubicación Actual</DialogTitle>
            <DialogDescription>
              Este mapa muestra tu ubicación. Puedes cerrarlo cuando desees.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow min-h-0 relative">
            {isMapOpen && <UserLocationMap />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
