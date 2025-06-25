
"use client";

import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
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
      <main className="flex flex-col flex-grow items-center justify-center pt-16 px-4">
        
        <div className="w-full max-w-xl mx-auto">
          <div className="flex items-start">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Contenedor para el círculo y el título */}
                <div className="flex flex-col items-center w-32 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white text-xl font-bold">
                    {step.id}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{step.title}</p>
                </div>

                {/* Línea de conexión */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 bg-black mt-6" />
                )}
              </React.Fragment>
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
              onClick={() => setIsMapOpen(true)} // Aseguramos que el clic abra el diálogo
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
