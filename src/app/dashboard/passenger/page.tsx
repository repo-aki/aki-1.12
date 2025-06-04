
"use client";

import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { MapPin, PlusCircle } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';


export default function PassengerDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center justify-center pt-16">
        {/* Botón central "Nuevo Viaje" */}
        <Button 
          size="lg" 
          className="font-semibold text-xl py-8 px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => {
            // Lógica para "Nuevo Viaje" se implementará aquí
            console.log("Botón Nuevo Viaje presionado");
          }}
        >
          <PlusCircle className="mr-3 h-7 w-7" />
          Nuevo Viaje
        </Button>
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
          <div className="flex-grow min-h-0 relative"> {/* Contenedor para que UserLocationMap pueda crecer y posicionar elementos si es necesario */}
            {isMapOpen && <UserLocationMap />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

