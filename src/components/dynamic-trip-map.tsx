
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DynamicTripMap = dynamic(() => import('@/components/trip-map'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full w-full items-center justify-center text-center text-muted-foreground bg-muted rounded-lg shadow-inner">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="mt-2 text-sm font-medium">Cargando mapa...</p>
    </div>
  ),
});

export default DynamicTripMap;
