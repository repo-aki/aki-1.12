
"use client";

import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react'; // Icono de mapa
import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';

export default function DriverDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center justify-center pt-20 pb-12 px-4">
        {/* Botón central para mostrar el mapa */}
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="font-semibold text-xl py-8 px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsMapOpen(true)}
            >
              <Map className="mr-3 h-7 w-7" />
              Mostrar mi Ubicación
            </Button>
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

        {/* Aquí puedes agregar más contenido específico para el conductor si es necesario */}
        <p className="text-center text-muted-foreground mt-8">
          Panel principal del conductor. Próximamente más funcionalidades.
        </p>
      </main>
    </div>
  );
}
