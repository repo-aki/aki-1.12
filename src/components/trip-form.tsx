
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, ArrowRight, User, Package, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UserLocationMap from '@/components/user-location-map';


const tripSchema = z.object({
  pickupAddress: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
  destinationAddress: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
  tripType: z.enum(["passenger", "cargo"], {
    required_error: "Debes seleccionar un tipo de viaje.",
  }),
  passengerCount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un número entero.").min(1, "Debe haber al menos 1 pasajero.").max(8, "No pueden ser más de 8 pasajeros.").optional()
  ),
  cargoDescription: z.string().max(50, "La descripción no puede exceder los 50 caracteres.").optional(),
}).superRefine((data, ctx) => {
    if (data.tripType === 'passenger') {
        if (data.passengerCount === undefined || data.passengerCount === null) {
            ctx.addIssue({
                code: 'custom',
                message: "El número de pasajeros es obligatorio.",
                path: ["passengerCount"],
            });
        }
    } else if (data.tripType === 'cargo') {
        if (!data.cargoDescription) {
            ctx.addIssue({
                code: 'custom',
                message: "La descripción de la mercancía es obligatoria.",
                path: ["cargoDescription"],
            });
        } else if (data.cargoDescription.trim().length < 10) {
            ctx.addIssue({
                code: 'custom',
                message: "La descripción debe tener al menos 10 caracteres.",
                path: ["cargoDescription"],
            });
        }
    }
});

type TripFormValues = z.infer<typeof tripSchema>;

const STEPS = [
  { id: 1, title: 'Lugar de Recogida', fields: ['pickupAddress'] as const },
  { id: 2, title: 'Lugar de Destino', fields: ['destinationAddress'] as const },
  { id: 3, title: 'Datos del Viaje', fields: ['tripType', 'passengerCount', 'cargoDescription'] as const },
];

export default function TripForm() {
  const [activeStep, setActiveStep] = useState(1);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [destinationFromMap, setDestinationFromMap] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
    defaultValues: {
      pickupAddress: '',
      destinationAddress: '',
      tripType: 'passenger',
      passengerCount: undefined,
      cargoDescription: '',
    }
  });

  const { pickupAddress, destinationAddress, tripType, passengerCount, cargoDescription } = form.watch();

  const handleNextStep = async (fields: readonly (keyof TripFormValues)[]) => {
    const isValid = await form.trigger(fields);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleDestinationSelect = (location: { lat: number; lng: number }) => {
    setDestinationFromMap(location);
    setIsMapOpen(false);
    toast({
      title: "Ubicación Marcada",
      description: "El destino ha sido marcado en el mapa como referencia.",
    });
  };

  async function onSubmit(data: TripFormValues) {
    const user = auth.currentUser;
    if (!user) {
        toast({
            title: "Error de autenticación",
            description: "Debes iniciar sesión para solicitar un viaje.",
            variant: "destructive",
        });
        return;
    }

    let pickupCoordinates: { lat: number; lng: number } | null = null;
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            });
        });
        pickupCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };
    } catch (geoError: any) {
        console.error("Geolocation error:", geoError);
        toast({
            title: "Error de Ubicación",
            description: "No se pudo obtener tu ubicación de recogida. Activa la geolocalización y vuelve a intentarlo.",
            variant: "destructive",
        });
        return; 
    }

    try {
        const tripData = {
            ...data,
            passengerId: user.uid,
            status: 'searching', 
            createdAt: serverTimestamp(),
            destinationCoordinates: destinationFromMap,
            pickupCoordinates: pickupCoordinates,
        };

        const docRef = await addDoc(collection(db, "trips"), tripData);
        
        toast({
          title: "¡Viaje Solicitado!",
          description: "Hemos recibido tu solicitud y estamos buscando un conductor.",
        });
        
        router.push(`/dashboard/passenger/trip/${docRef.id}`);

    } catch (error) {
        console.error("Error creating trip:", error);
        toast({
          title: "Error al solicitar el viaje",
          description: "No se pudo crear la solicitud. Inténtalo de nuevo.",
          variant: "destructive",
        });
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

          <div className="mb-8">
            {STEPS.map((step, index) => {
              const isCompleted = activeStep > step.id;
              const isActive = activeStep === step.id;
              const isEnabled = isCompleted || isActive;

              return (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full font-bold z-10 shrink-0 transition-colors duration-300",
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-muted-foreground text-white'
                      )}
                    >
                      {step.id}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn("w-px h-20", isCompleted ? "bg-green-500" : (isActive ? "bg-primary" : "bg-muted-foreground"))} />
                    )}
                  </div>

                  <div className="pt-0.5 flex-grow">
                     <button
                      type="button"
                      onClick={() => { if (isEnabled) setActiveStep(step.id) }}
                      disabled={!isEnabled}
                      className={cn(
                        "text-lg font-semibold text-left w-full",
                         isEnabled ? "cursor-pointer text-foreground" : "cursor-not-allowed text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </button>

                    {isCompleted && (
                      <div className="mt-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded-md animate-in fade-in-50 duration-500">
                          {step.id === 1 && pickupAddress && (
                              <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                  <p className="font-medium text-foreground/80">{pickupAddress}</p>
                              </div>
                          )}
                          {step.id === 2 && destinationAddress && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                        <p className="font-medium text-foreground/80">{destinationAddress}</p>
                                    </div>
                                    {destinationFromMap && (
                                      <div className="bg-green-500 rounded-full p-1 flex items-center justify-center shrink-0" title="Destino marcado en mapa">
                                          <MapPin className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                </div>
                          )}
                          {step.id === 3 && tripType && (
                                <div className="flex items-center gap-2">
                                    {tripType === 'passenger' ? (
                                        <>
                                            <User className="h-4 w-4 shrink-0 text-primary" />
                                            <p className="font-medium text-foreground/80">{passengerCount || 0} Pasajero(s)</p>
                                        </>
                                    ) : (
                                        <>
                                            <Package className="h-4 w-4 shrink-0 text-primary" />
                                            <p className="font-medium text-foreground/80 truncate">{cargoDescription}</p>
                                        </>
                                    )}
                                </div>
                          )}
                      </div>
                    )}

                    {isActive && (
                      <div className="mt-4 animate-in fade-in-50 duration-500">
                        {step.id === 1 && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="pickupAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Dirección o Lugar de Referencia" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button onClick={() => handleNextStep(step.fields)} disabled={!form.getFieldState('pickupAddress').isDirty || !!form.getFieldState('pickupAddress').error}>
                              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {step.id === 2 && (
                           <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="destinationAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Dirección o Lugar de Referencia" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant={destinationFromMap ? 'default' : 'outline'}
                                      className={cn(
                                        "w-full",
                                        !!destinationFromMap && "bg-green-500 hover:bg-green-600 text-white"
                                      )}
                                    >
                                       {!!destinationFromMap ? <CheckCircle className="mr-2 h-4 w-4" /> : <MapPin className="mr-2 h-4 w-4" />}
                                       {!!destinationFromMap ? "Ubicación de Referencia Marcada" : "Marcar en el mapa (Opcional)"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] w-full h-[70vh] flex flex-col p-4 overflow-hidden">
                                  <DialogHeader className="shrink-0 pb-2 mb-2 border-b">
                                    <DialogTitle className="text-2xl font-semibold text-primary">Selecciona tu Destino</DialogTitle>
                                    <DialogDescription>
                                      Haz clic en el mapa para marcar tu destino y luego confirma.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex-grow min-h-0 relative">
                                    {isMapOpen && <UserLocationMap onDestinationSelect={handleDestinationSelect} />}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            <Button onClick={() => handleNextStep(step.fields)} disabled={!form.getFieldState('destinationAddress').isDirty || !!form.getFieldState('destinationAddress').error}>
                              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {step.id === 3 && (
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="tripType"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel>Tipo de Viaje</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col space-y-1"
                                    >
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="passenger" /></FormControl>
                                        <FormLabel className="font-normal flex items-center"><User className="mr-2 h-4 w-4"/>Pasajeros</FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="cargo" /></FormControl>
                                        <FormLabel className="font-normal flex items-center"><Package className="mr-2 h-4 w-4"/>Mercancía</FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {tripType === 'passenger' && (
                              <FormField
                                control={form.control}
                                name="passengerCount"
                                render={({ field }) => (
                                  <FormItem className="animate-in fade-in-50">
                                    <FormLabel>Número de pasajeros</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="1" max="8" placeholder="Ej: 2" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} value={field.value === undefined ? '' : field.value} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {tripType === 'cargo' && (
                               <FormField
                                control={form.control}
                                name="cargoDescription"
                                render={({ field }) => (
                                  <FormItem className="animate-in fade-in-50">
                                    <FormLabel>Describe la mercancía</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Ej: Mudanza, Material de Construcción"
                                        maxLength={50}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              className={cn("w-full max-w-xs transition-opacity duration-500", form.formState.isValid ? "opacity-100" : "opacity-0 pointer-events-none")}
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Solicitando...' : 'Solicitar Viaje'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
