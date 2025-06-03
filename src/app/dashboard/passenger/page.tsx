
"use client";

import Link from 'next/link';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { MapPin, PlusCircle } from 'lucide-react';
import type React from 'react';

export default function PassengerDashboardPage() {
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
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          asChild
          size="icon"
          className="rounded-full h-16 w-16 shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label="Ver mapa"
        >
          {/* En el futuro, esto enlazará a la página del mapa: <Link href="/dashboard/passenger/map"> */}
          <Link href="#">
            <MapPin className="h-8 w-8" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
