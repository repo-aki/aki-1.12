
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase/config';
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

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

const vehicleTypes = ["Bicitaxi", "Motoneta", "Carretón", "Carro"];
const vehicleUsages = ["Pasaje", "Carga", "Pasaje y Carga"];

const formSchema = z.object({
  fullName: z.string()
    .min(1, "Nombre y Apellidos es obligatorio.")
    .refine(value => value.trim().split(/\s+/).length >= 3, {
      message: "Debe contener al menos tres palabras (nombre y dos apellidos).",
    }),
  province: z.string().min(1, "Debes seleccionar una provincia."),
  municipality: z.string().min(1, "Debes seleccionar un municipio."),
  // Driver specific fields
  vehicleType: z.string().optional(),
  vehicleUsage: z.string().optional(),
  passengerCapacity: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().int().min(1, "La capacidad debe ser al menos 1.").optional()
  ),
}).refine(data => {
  if (data.vehicleUsage === "Pasaje" || data.vehicleUsage === "Pasaje y Carga") {
    return data.passengerCapacity !== undefined && data.passengerCapacity >= 1;
  }
  return true;
}, {
  message: "La capacidad de pasajeros es obligatoria para este uso del vehículo.",
  path: ["passengerCapacity"],
});

type EditProfileFormValues = z.infer<typeof formSchema>;

interface EditProfileFormProps {
  userProfile: any;
  userRole: string | null;
  onUpdate: () => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userProfile, userRole, onUpdate, onCancel }) => {
  const { toast } = useToast();
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: userProfile.fullName || "",
      province: userProfile.province || "",
      municipality: userProfile.municipality || "",
      vehicleType: userProfile.vehicleType || "",
      vehicleUsage: userProfile.vehicleUsage || "",
      passengerCapacity: userProfile.passengerCapacity || undefined,
    },
  });

  const selectedProvince = form.watch("province");
  const selectedVehicleUsage = form.watch("vehicleUsage");

  useEffect(() => {
    const provinceData = provincesWithMunicipalities.find(p => p.name === selectedProvince);
    setAvailableMunicipalities(provinceData ? provinceData.municipalities : []);
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedVehicleUsage !== "Pasaje" && selectedVehicleUsage !== "Pasaje y Carga") {
      form.setValue("passengerCapacity", undefined);
      form.clearErrors("passengerCapacity");
    }
  }, [selectedVehicleUsage, form]);

  async function onSubmit(data: EditProfileFormValues) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Error", description: "No estás autenticado.", variant: "destructive" });
      return;
    }

    try {
      const collectionName = userRole === 'Conductor' ? 'drivers' : 'users';
      const userDocRef = doc(db, collectionName, currentUser.uid);

      await updateDoc(userDocRef, {
        ...data,
        passengerCapacity: data.passengerCapacity || null,
      });

      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Error al actualizar el perfil:", error);
      toast({
        title: "Error al Actualizar",
        description: "No se pudo guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
        {/* Read-only fields */}
        <div className="space-y-2">
          <FormLabel>Correo Electrónico</FormLabel>
          <Input value={userProfile.email} disabled />
        </div>
        <div className="space-y-2">
          <FormLabel>Teléfono</FormLabel>
          <Input value={userProfile.phone} disabled />
        </div>

        {/* Editable fields */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre y Apellidos</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
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
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                    {provincesWithMunicipalities.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
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
                    disabled={!selectedProvince}
                >
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                    {availableMunicipalities.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {userRole === 'Conductor' && (
          <>
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Vehículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vehicleTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uso del Vehículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vehicleUsages.map(usage => <SelectItem key={usage} value={usage}>{usage}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(selectedVehicleUsage === "Pasaje" || selectedVehicleUsage === "Pasaje y Carga") && (
              <FormField
                control={form.control}
                name="passengerCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad de Pasajeros</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            value={field.value === undefined ? '' : field.value}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProfileForm;
