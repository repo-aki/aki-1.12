
"use client";

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';
import TripForm from '@/components/trip-form';

export default function PassengerDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center justify-start pt-24 px-4 w-full">
        <TripForm />
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
              Usa el mapa para confirmar tu ubicación o destino.
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
