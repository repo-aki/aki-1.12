
"use client";

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';

import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import PasswordStrengthIndicator from '@/components/password-strength-indicator';
import { useToast } from '@/hooks/use-toast';

const provinces = [
  "Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas",
  "Cienfuegos", "Villa Clara", "Sancti Spíritus", "Ciego de Ávila",
  "Camagüey", "Las Tunas", "Holguín", "Granma", "Santiago de Cuba",
  "Guantánamo", "Isla de la Juventud"
];

const formSchema = z.object({
  fullName: z.string()
    .min(1, "Nombre y Apellido es obligatorio.")
    .refine(value => value.trim().split(/\s+/).length >= 3, {
      message: "Debe contener al menos tres palabras (nombre y dos apellidos).",
    }),
  email: z.string()
    .min(1, "Correo Electrónico es obligatorio.")
    .email("Formato de correo inválido.")
    .refine(value => value.endsWith('@gmail.com'), {
      message: "El correo debe ser una cuenta @gmail.com.",
    }),
  phone: z.string()
    .min(1, "Número de Teléfono es obligatorio.")
    .startsWith("+53", "El número debe comenzar con +53 (Cuba).")
    .regex(/^\+53\s?\d{8}$/, "Formato de teléfono cubano inválido (ej: +53 51234567)."),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string()
    .min(1, "Confirmar contraseña es obligatorio."),
  province: z.string().min(1, "Debes seleccionar una provincia."),
  municipality: z.string().min(1, "Debes seleccionar un municipio."), // Simplificado por ahora
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "Debes aceptar los términos y condiciones y la política de privacidad.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Error se mostrará en el campo confirmPassword
});

type PassengerFormValues = z.infer<typeof formSchema>;

export default function PassengerSignupPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "+53 ",
      password: "",
      confirmPassword: "",
      province: "",
      municipality: "",
      termsAccepted: false,
    },
  });

  const passwordValue = form.watch("password");

  function onSubmit(data: PassengerFormValues) {
    console.log(data);
    toast({
      title: "Registro Exitoso (Simulado)",
      description: "Tus datos de pasajero han sido enviados.",
    });
    // Aquí iría la lógica de envío del formulario al backend
    // form.reset(); // Opcional: resetear el formulario
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col items-center flex-grow pt-20 pb-12 px-4">
        <div className="flex flex-col items-center text-center w-full max-w-md">
          <UserPlus className="h-16 w-16 text-primary mb-4 animate-taxi-bounce" />
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
            Registro de Pasajero
          </h1>
          <p className="text-md text-foreground/70 mb-8">
            Completa tus datos para crear tu cuenta en Akí.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre y Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ana García Pérez" {...field} className="bg-muted/30 focus:bg-background"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico (Gmail)</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@ejemplo.com" {...field} className="bg-muted/30 focus:bg-background"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+53 51234567" {...field} className="bg-muted/30 focus:bg-background"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña (mín. 8 caracteres)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="•••••••••" 
                        {...field} 
                        className="bg-muted/30 focus:bg-background pr-10"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </Button>
                    </div>
                  </FormControl>
                  <PasswordStrengthIndicator password={passwordValue} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="•••••••••" 
                        {...field} 
                        className="bg-muted/30 focus:bg-background pr-10"
                      />
                       <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted/30 focus:bg-background">
                        <SelectValue placeholder="Selecciona una provincia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provinces.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="municipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted/30 focus:bg-background">
                        <SelectValue placeholder="Selecciona un municipio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Lista de municipios genérica por ahora. Idealmente dinámica. */}
                      <SelectItem value="municipio1">Municipio 1 (Ejemplo)</SelectItem>
                      <SelectItem value="municipio2">Municipio 2 (Ejemplo)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Acepto los <Link href="/politica-privacidad#terminos" className="text-primary hover:underline">términos y condiciones</Link> y la <Link href="/politica-privacidad" className="text-primary hover:underline">política de privacidad</Link>.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full font-semibold text-lg py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 ease-in-out active:scale-95"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>
        </Form>

        <div className="mt-8 flex flex-col items-center space-y-3 w-full max-w-md">
            <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 transition-transform active:scale-95">
              <Link href="/signup">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Selección de Rol
              </Link>
            </Button>
            <Button asChild variant="link" className="text-primary">
              <Link href="/">
                Volver al Inicio
              </Link>
            </Button>
        </div>

      </main>
    </div>
  );
}

