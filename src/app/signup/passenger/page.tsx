
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

import { auth, db } from '@/lib/firebase/config'; // Import Firebase auth and db
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions

const provincesWithMunicipalities = [
  { name: "Pinar del Río", municipalities: ["Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua", "Minas de Matahambre", "Pinar del Río", "San Juan y Martínez", "San Luis", "Sandino", "Viñales"] },
  { name: "Artemisa", municipalities: ["Alquízar", "Artemisa", "Bahía Honda", "Bauta", "Caimito", "Candelaria", "Guanajay", "Güira de Melena", "Mariel", "San Antonio de los Baños", "San Cristóbal"] },
  { name: "La Habana", municipalities: ["Arroyo Naranjo", "Boyeros", "Centro Habana", "Cerro", "Cotorro", "Diez de Octubre", "Guanabacoa", "Habana del Este", "Habana Vieja", "La Lisa", "Marianao", "Playa", "Plaza de la Revolución", "Regla", "San Miguel del Padrón"] },
  { name: "Mayabeque", municipalities: ["Batabanó", "Bejucal", "Güines", "Jaruco", "Madruga", "Melena del Sur", "Nueva Paz", "Quivicán", "San José de las Lajas", "San Nicolás", "Santa Cruz del Norte"] },
  { name: "Matanzas", municipalities: ["Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Matanzas", "Pedro Betancourt", "Perico", "Unión de Reyes"] },
  { name: "Cienfuegos", municipalities: ["Abreus", "Aguada de Pasajeros", "Cienfuegos", "Cruces", "Cumanayagua", "Lajas", "Palmira", "Rodas"] },
  { name: "Villa Clara", municipalities: ["Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada", "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Remedios", "Sagua la Grande", "Santa Clara", "Santo Domingo"] },
  { name: "Sancti Spíritus", municipalities: ["Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Sancti Spíritus", "Taguasco", "Trinidad", "Yaguajay"] },
  { name: "Ciego de Ávila", municipalities: ["Baraguá", "Bolivia", "Chambas", "Ciego de Ávila", "Ciro Redondo", "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela"] },
  { name: "Camagüey", municipalities: ["Camagüey", "Carlos Manuel de Céspedes", "Esmeralda", "Florida", "Guáimaro", "Jimaguayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicú", "Sierra de Cubitas", "Vertientes"] },
  { name: "Las Tunas", municipalities: ["Amancio", "Colombia", "Jesús Menéndez", "Jobabo", "Las Tunas", "Majibacoa", "Manatí", "Puerto Padre"] },
  { name: "Holguín", municipalities: ["Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto", "Frank País", "Gibara", "Holguín", "Mayarí", "Moa", "Rafael Freyre", "Sagua de Tánamo", "Urbano Noris"] },
  { name: "Granma", municipalities: ["Bartolomé Masó", "Bayamo", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón", "Río Cauto", "Yara"] },
  { name: "Santiago de Cuba", municipalities: ["Contramaestre", "Guamá", "Mella", "Palma Soriano", "San Luis", "Santiago de Cuba", "Segundo Frente", "Songo - La Maya", "Tercer Frente"] },
  { name: "Guantánamo", municipalities: ["Baracoa", "Caimanera", "El Salvador", "Guantánamo", "Imías", "Maisí", "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras"] },
  { name: "Isla de la Juventud", municipalities: ["Isla de la Juventud"] }
];

const formSchema = z.object({
  fullName: z.string()
    .min(1, "Nombre y Apellidos es obligatorio.")
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
    .startsWith("+53 ", "El número debe comenzar con +53 (Cuba).")
    .regex(/^\+53\s\d{8}$/, "Formato de teléfono cubano inválido (ej: +53 51234567)."),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string()
    .min(1, "Confirmar contraseña es obligatorio."),
  province: z.string().min(1, "Debes seleccionar una provincia."),
  municipality: z.string().min(1, "Debes seleccionar un municipio."),
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "Debes aceptar los términos y condiciones y la política de privacidad.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type PassengerFormValues = z.infer<typeof formSchema>;

export default function PassengerSignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

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
  const selectedProvince = form.watch("province");

  useEffect(() => {
    if (selectedProvince) {
      const provinceData = provincesWithMunicipalities.find(p => p.name === selectedProvince);
      setAvailableMunicipalities(provinceData ? provinceData.municipalities : []);
      form.setValue("municipality", ""); 
    } else {
      setAvailableMunicipalities([]);
    }
  }, [selectedProvince, form]);

  async function onSubmit(data: PassengerFormValues) {
    form.formState.isSubmitting; 
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // 2. Store additional passenger data in Firestore
      const passengerData = {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        province: data.province,
        municipality: data.municipality,
        role: 'passenger', // Add a role field
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", user.uid), passengerData);

      toast({
        title: "Registro Exitoso",
        description: `¡Bienvenido ${data.fullName.split(' ')[0]}! Tu cuenta ha sido creada.`,
      });
      router.push('/dashboard/passenger'); 
    } catch (error: any) {
      console.error("Error en el registro con Firebase:", error);
      let errorMessage = "Ocurrió un error desconocido. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo electrónico ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil. Intenta con una más segura.";
      } else if (error.code) {
        errorMessage = `Error: ${error.message}`;
      }
      toast({
        title: "Error en el Registro",
        description: errorMessage,
        variant: "destructive",
      });
    }
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
                  <FormLabel>Nombre y Apellidos</FormLabel>
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
                    <Input
                      placeholder="+53 51234567"
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value;
                        const prefix = '+53 ';
                        
                        if (!value.startsWith(prefix)) {
                          value = prefix; 
                        }
                        
                        const numericPart = value.substring(prefix.length).replace(/[^0-9]/g, '');
                        value = prefix + numericPart.substring(0, 8); 
                        
                        field.onChange(value);
                      }}
                      className="bg-muted/30 focus:bg-background"
                    />
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("municipality", ""); 
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted/30 focus:bg-background">
                        <SelectValue placeholder="Selecciona una provincia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provincesWithMunicipalities.map(province => (
                        <SelectItem key={province.name} value={province.name}>{province.name}</SelectItem>
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={!selectedProvince || availableMunicipalities.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted/30 focus:bg-background">
                        <SelectValue placeholder={!selectedProvince ? "Selecciona una provincia primero" : "Selecciona un municipio"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMunicipalities.map(municipality => (
                        <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
                      ))}
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
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
              </Link>
            </Button>
        </div>
      </main>
    </div>
  );
}
