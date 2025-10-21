
# Base de Conocimiento de la Aplicación "Akí"

Este documento detalla el funcionamiento completo de la aplicación "Akí", una plataforma de movilidad para el mercado cubano. Está diseñado para servir como fuente de conocimiento para un agente de IA que responderá preguntas de los usuarios.

---

## 1. Descripción General de la Aplicación

**Nombre:** Akí Arrival (comúnmente "Akí")

**Concepto Central:** Akí es una aplicación móvil que conecta a pasajeros que necesitan un viaje con conductores disponibles. Su característica distintiva es un **sistema de ofertas en tiempo real**. En lugar de tarifas fijas, los pasajeros publican su solicitud de viaje y los conductores cercanos envían sus ofertas de precio. El pasajero elige la oferta que más le conviene.

**Mercado Objetivo:** Cuba.

**Propuesta de Valor:**
- **Para Pasajeros:** Control total sobre el precio del viaje, transparencia y la capacidad de elegir al conductor basándose en precio, vehículo y valoración.
- **Para Conductores:** Flexibilidad para elegir qué viajes tomar, libertad para establecer sus propios precios por viaje y una plataforma para encontrar más clientes.

**Tipos de Servicio:**
1.  Transporte de **Pasajeros**.
2.  Transporte de **Mercancía** (carga ligera o paquetería).

---

## 2. Flujo de Usuario y Características Principales

### 2.1. Registro de Usuarios

El registro está separado por roles: Pasajero y Conductor.

- **Campos Comunes:**
  - Nombre completo (requiere nombre y dos apellidos).
  - Correo electrónico (restringido a `@gmail.com`).
  - Número de teléfono (formato cubano `+53 5XXXXXXX`).
  - Contraseña (con indicador de seguridad).
  - Provincia y Municipio.
  - Aceptación de Términos y Política de Privacidad.

- **Campos Específicos para Conductores:**
  - Tipo de Vehículo (`Bicitaxi`, `Motoneta`, `Carretón`, `Carro`).
  - Uso del Vehículo (`Pasaje`, `Carga`, `Pasaje y Carga`).
  - Capacidad de Pasajeros (obligatorio si el uso incluye `Pasaje`).

#### Proceso de Verificación de Correo (¡MUY IMPORTANTE!)
- **Obligatorio para todos los usuarios.**
- Después de completar el formulario de registro, la app envía un **enlace de verificación** al correo del usuario.
- El usuario **debe hacer clic en ese enlace** para activar su cuenta.
- **Un usuario no puede iniciar sesión ni acceder a la aplicación si su correo no ha sido verificado.**
- Si un usuario intenta iniciar sesión sin verificar, se le informa que debe revisar su correo y se le ofrece la opción de reenviar el enlace de verificación.

### 2.2. Inicio de Sesión
- Los usuarios inician sesión con su correo electrónico y contraseña.
- Tras un inicio de sesión exitoso, la app redirige al usuario a su panel correspondiente (`/dashboard/passenger` o `/dashboard/driver`).

### 2.3. Panel del Pasajero (`/dashboard/passenger`)

- **Formulario de Solicitud de Viaje:**
  1.  **Lugar de Recogida:** El usuario introduce su dirección o punto de referencia. La app captura la ubicación GPS del dispositivo en el momento de la solicitud para mostrarla a los conductores.
  2.  **Lugar de Destino:** El usuario introduce la dirección de destino. Opcionalmente, puede marcar el destino en un mapa.
  3.  **Tipo de Viaje:** Elige entre "Pasajeros" o "Mercancía".
      - Si es **Pasajeros**, debe indicar la cantidad de personas.
      - Si es **Mercancía**, debe proporcionar una breve descripción.
- Una vez enviado el formulario, se crea una solicitud de viaje que expira en **5 minutos** y se redirige a la página de estado del viaje.

### 2.4. Página de Estado del Viaje del Pasajero (`/dashboard/passenger/trip/[tripId]`)

Esta página muestra el estado del viaje en tiempo real.

- **Estado "Buscando":**
  - Muestra un contador regresivo de 5 minutos.
  - Lista las **ofertas de los conductores** en una tabla, ordenadas por precio (de menor a mayor).
  - Para cada oferta, el pasajero ve el **precio**, el **tipo de vehículo** y puede hacer clic en "Info" para ver el **perfil del conductor** (nombre, valoración media, estadísticas, y comentarios de otros usuarios).
  - El pasajero puede **aceptar** una oferta. Al hacerlo, el estado del viaje cambia.
  - Si no llegan ofertas o no se acepta ninguna en 5 minutos, la solicitud expira.

- **Estado "Conductor en Camino":**
  - Muestra el nombre del conductor, el tipo de vehículo y la distancia aproximada a la que se encuentra.
  - El pasajero puede ver la **ubicación del conductor en tiempo real** en un mapa.
  - Hay un **chat integrado** para comunicarse con el conductor.

- **Estado "Conductor ha Llegado":**
  - La app notifica al pasajero que el conductor está en el punto de recogida.
  - Se habilita el botón **"Comenzar Viaje"**, que el pasajero debe presionar para confirmar que ha abordado el vehículo.

- **Estado "En Progreso":**
  - El viaje ha comenzado. El mapa muestra la ruta hacia el destino.
  - El pasajero tiene un botón para **"Finalizar Viaje"** cuando llega a su destino.

- **Estado "Completado":**
  - Se solicita al pasajero que **valore al conductor (de 1 a 5 estrellas)** y deje un comentario opcional.
  - La valoración es obligatoria para cerrar el ciclo del viaje.

- **Cancelación:** El pasajero puede cancelar el viaje en cualquier momento antes de que se complete.

### 2.5. Panel del Conductor (`/dashboard/driver`)

- **Requisito:** El conductor debe tener activada la geolocalización en su dispositivo.
- **Visibilidad de Viajes:** El panel muestra una lista de solicitudes de viaje (con estado "searching") que se encuentran en un radio de **500 metros** alrededor de la ubicación actual del conductor. Si una solicitud sale de este radio, desaparece de la lista.
- **Información del Viaje:** Para cada solicitud, el conductor ve el destino, el tipo de viaje (pasajeros/carga) y la distancia a la que se encuentra el punto de recogida.
- **Acción de Ofertar:** El conductor puede hacer clic en "Ofertar" en cualquier viaje, lo que abre un diálogo para que ingrese el precio que desea cobrar.
- **Ofertas Enviadas:** El panel también muestra una lista de las ofertas que el conductor ha enviado y que están pendientes o han sido rechazadas.

### 2.6. Página de Viaje Activo del Conductor

- Se activa cuando un pasajero acepta la oferta del conductor.
- Muestra el estado del viaje: "En Camino", "Esperando al Pasajero", "En Progreso".
- Proporciona un **mapa** para navegar hacia el punto de recogida y luego hacia el destino.
- El conductor debe presionar el botón **"He Llegado"** al llegar al punto de recogida, lo que notifica al pasajero.
- Una vez que el pasajero confirma el inicio, el estado cambia a "En Progreso".
- El conductor puede **finalizar el viaje** al llegar al destino.
- También dispone de **chat integrado** para comunicarse con el pasajero.

---

## 3. Configuración Técnica y de Seguridad

### 3.1. Base de Datos (Firebase Firestore)

La estructura principal de la base de datos es la siguiente:

- `users/{userId}`: Almacena perfiles de **pasajeros**.
- `drivers/{driverId}`: Almacena perfiles de **conductores**. Incluye campos como `rating`, `ratingCount`, `completedTrips`, etc.
  - `drivers/{driverId}/ratings/{ratingId}`: Subcolección con las valoraciones individuales recibidas.
- `trips/{tripId}`: Documento principal para cada viaje. Contiene:
  - `status`: (searching, driver_en_route, driver_at_pickup, in_progress, completed, cancelled, expired).
  - `passengerId`, `driverId` (una vez aceptado).
  - Direcciones, coordenadas, tipo de viaje, etc.
  - `offers/{offerId}`: Subcolección con las ofertas de los conductores para ese viaje.
  - `messages/{messageId}`: Subcolección para el chat de ese viaje.

### 3.2. Reglas de Seguridad de Firestore

- **Todo denegado por defecto.**
- Un usuario solo puede leer/modificar **su propio perfil**.
- Un pasajero puede leer perfiles de conductores, pero no modificarlos.
- Un viaje (`trip`) solo puede ser leído por el pasajero o el conductor involucrado.
- Los conductores solo pueden consultar (`list`) viajes con estado `searching`.
- Un conductor solo puede crear una oferta (`offer`) para un viaje.
- El chat (`messages`) solo es accesible para los participantes del viaje.
- Solo un pasajero que completó un viaje puede crear una valoración (`rating`) para el conductor de ese viaje.

### 3.3. Distribución y Actualización de la App (APK)

- **Distribución:** La aplicación se distribuye como un archivo APK, principalmente a través de un enlace de descarga (por ejemplo, alojado en Google Drive). **No está en la Play Store.**
- **Instalación:** Los usuarios deben habilitar la opción "Instalar desde fuentes desconocidas" en sus dispositivos Android.
- **Gestión de Versiones:**
  - Existe un sistema de **actualización forzada**.
  - En Firestore, hay un documento (`configs/app_version`) que especifica la `minVersion` (versión mínima requerida) y el `downloadUrl` (enlace al nuevo APK).
  - Al iniciar, la app **nativa** (el APK) comprueba su versión contra la `minVersion` de Firestore.
  - Si la versión instalada es obsoleta, la app bloquea el acceso y obliga al usuario a descargar la nueva versión desde el `downloadUrl`. Esto es crucial para mantener la seguridad y la compatibilidad.
- **Tipo de APK:** La aplicación es una **WebView**, lo que significa que el APK es un contenedor nativo que carga la aplicación web (desarrollada en Next.js). La lógica de verificación de versión se ejecuta en el código nativo **antes** de cargar la web.
