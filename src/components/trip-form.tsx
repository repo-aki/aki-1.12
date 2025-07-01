
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, ArrowRight, User, Package } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const tripSchema = z.object({
  pickupAddress: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  destinationAddress: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  tripType: z.enum(["passenger", "cargo"], {
    required_error: "Debes seleccionar un tipo de viaje.",
  }),
  passengerCount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un número entero.").min(1, "Debe haber al menos 1 pasajero.").max(8, "No pueden ser más de 8 pasajeros.").optional()
  ),
  cargoDescription: z.string().max(50, "La descripción no puede exceder los 50 caracteres.").optional(),
}).refine((data) => {
  if (data.tripType === 'passenger') return data.passengerCount != null;
  return true;
}, {
  message: "El número de pasajeros es obligatorio.",
  path: ["passengerCount"],
}).refine((data) => {
  if (data.tripType === 'cargo') return data.cargoDescription != null && data.cargoDescription.trim() !== '';
  return true;
}, {
  message: "La descripción de la mercancía es obligatoria.",
  path: ["cargoDescription"],
});

type TripFormValues = z.infer<typeof tripSchema>;

const STEPS = [
  { id: 1, title: 'Lugar de Recogida', fields: ['pickupAddress'] as const },
  { id: 2, title: 'Lugar de Destino', fields: ['destinationAddress'] as const },
  { id: 3, title: 'Datos del Viaje', fields: ['tripType', 'passengerCount', 'cargoDescription'] as const },
];

export default function TripForm() {
  const [activeStep, setActiveStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange', // Validate on change to enable/disable buttons
  });

  const tripType = form.watch('tripType');

  const handleNextStep = async (fields: readonly (keyof TripFormValues)[]) => {
    const isValid = await form.trigger(fields);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  function onSubmit(data: TripFormValues) {
    console.log(data);
    toast({
      title: "¡Viaje Solicitado!",
      description: "Hemos recibido tu solicitud y estamos buscando un conductor.",
    });
    // Here you would typically send the data to a backend API
  }
  
  const isStep1Completed = form.getFieldState('pickupAddress').isDirty && !form.getFieldState('pickupAddress').invalid;
  const isStep2Completed = form.getFieldState('destinationAddress').isDirty && !form.getFieldState('destinationAddress').invalid;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

          {/* Stepper Visuals */}
          <div className="mb-8">
            {STEPS.map((step, index) => {
              const isCompleted = (step.id === 1 && isStep1Completed) || (step.id === 2 && isStep2Completed);
              const isActive = activeStep === step.id;
              const isEnabled = activeStep >= step.id;

              return (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-white font-bold z-10 shrink-0 transition-colors duration-300",
                        isCompleted ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted-foreground"
                      )}
                    >
                      {step.id}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn("w-px h-20 bg-muted-foreground", (isCompleted || isActive) && "bg-primary" )} />
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

                    {isActive && (
                      <div className="mt-4 animate-in fade-in-50 duration-500">
                        {step.id === 1 && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="pickupAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dirección de Recogida</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Escribe la dirección o punto de referencia..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button onClick={() => handleNextStep(step.fields)} disabled={!isStep1Completed}>
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
                                  <FormLabel>Dirección de Destino</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Escribe la dirección o punto de referencia..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button variant="outline" className="w-full">
                               <MapPin className="mr-2 h-4 w-4" /> Marcar en el mapa (Opcional)
                            </Button>
                            <Button onClick={() => handleNextStep(step.fields)} disabled={!isStep2Completed}>
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
                                  <FormLabel>¿Qué quieres transportar?</FormLabel>
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
                                      <Input type="number" min="1" max="8" placeholder="Ej: 2" {...field} />
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
                                        placeholder="Ej: Una caja pequeña y una maleta"
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
