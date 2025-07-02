
"use client";

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Map, Car, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';

export default function DriverDashboardPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center pt-24 pb-12 px-4 w-full">
        <div className="w-full max-w-2xl">
          {/* Botón para abrir el mapa */}
          <div className="flex justify-end mb-6">
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsMapOpen(true)}>
                  <Map className="mr-2 h-5 w-5" />
                  Ver mi Ubicación
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
                  <DialogTitle className="text-2xl font-semibold text-primary">Tu Ubicación Actual</DialogTitle>
                  <DialogDescription>
                    Este mapa muestra tu ubicación en tiempo real.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-grow min-h-0 relative">
                  {isMapOpen && <UserLocationMap />}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Secciones colapsables */}
          <Accordion type="multiple" defaultValue={['pasajes', 'ofertas']} className="w-full space-y-4">
            <AccordionItem value="pasajes" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 hover:no-underline">
                <div className="flex items-center">
                  <Car className="mr-3 h-6 w-6" />
                  Pasajes en tu Zona
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                  No hay pasajes disponibles en tu zona en este momento. Vuelve a consultar más tarde.
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ofertas" className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="text-xl font-semibold text-primary px-4 hover:no-underline">
                 <div className="flex items-center">
                  <Send className="mr-3 h-6 w-6" />
                  Ofertas Enviadas
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                  No has enviado ninguna oferta.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
}
