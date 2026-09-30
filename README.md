# Marysol-Project
App móvil para gestión de barberías en React Native y Supabase. Permite registrar clientes, tipos de corte y visualizar el historial de ingresos mensuales.
# Descripción de la Base de Datos: Sistema de Gestión para Barbería

Esta base de datos relacional está diseñada para administrar las operaciones diarias de un barbero independiente o una barbería. Su arquitectura centraliza el catálogo de servicios, el directorio de clientes y el historial de transacciones, permitiendo calcular ingresos mensuales, analizar la popularidad de los cortes y gestionar la agenda sin duplicidad de datos.

La estructura consta de **4 tablas principales** conectadas entre sí:

## 1. `barbero` (Profesionales)

Almacena el perfil de los barberos que utilizan la aplicación. Aunque el proyecto sea para una sola persona, esta tabla permite escalar la aplicación en el futuro si el negocio crece y contrata más personal.

- **Campos clave:** Identificador único (`id`), nombre completo y correo electrónico (usado para el futuro inicio de sesión).

## 2. `cliente` (Directorio)

Mantiene un registro único de cada persona que se atiende en el local. Separar al cliente de la cita permite que un mismo usuario tenga un historial de múltiples cortes a lo largo del año sin tener que escribir sus datos repetidas veces.

- **Campos clave:** Identificador único (`id`), nombre completo y número de teléfono (útil para contactarlos vía WhatsApp o llamadas).

## 3. `tipo_corte` (Catálogo de Servicios)

Funciona como la lista de precios o el "menú" de la barbería. Estandariza los servicios que se ofrecen para evitar errores de tipeo y mantener un control exacto de las finanzas.

- **Campos clave:** Identificador (`id`), nombre del servicio (ej. "Corte Clásico", "Perfilado de Barba") y el valor monetario (`precio`). Incluye una regla (`CHECK`) que impide registrar precios negativos.

## 4. `cita` (Historial de Movimientos)

Es la tabla transaccional y el corazón del sistema. Su función es registrar cada evento o servicio completado. Funciona uniendo las tres tablas anteriores mediante claves foráneas (Foreign Keys).

- **Campos clave:**
  - `cliente_id`: ¿A quién se le cortó el pelo?
  - `barbero_id`: ¿Qué barbero hizo el trabajo?
  - `tipo_corte_id`: ¿Qué servicio se realizó?
  - `fecha_corte`: La fecha y hora exacta del servicio (`TIMESTAMPTZ` para respetar la zona horaria del teléfono).
  - `metodo_pago`: Cómo pagó el cliente (Efectivo, Transferencia, Tarjeta).
  - `notas`: Campo de texto libre para observaciones (ej. "Trajo su propio gel", "Anotado en cuenta por cobrar").

## Reglas de Negocio e Integridad de Datos (`ON DELETE`)

El modelo incluye protecciones específicas para evitar que la contabilidad del barbero se corrompa por errores humanos:

- **Protección del catálogo (`RESTRICT`):** Si un barbero intenta borrar un tipo de corte (ej. "Corte Clásico") del catálogo, pero ese corte ya está registrado en el historial de meses anteriores, la base de datos bloqueará la acción. Esto evita que los historiales de ingresos queden huérfanos de precio.
- **Conservación de ingresos (`SET NULL`):** Si se elimina a un `cliente` de la agenda, sus registros en la tabla `cita` no se borran. El campo `cliente_id` simplemente queda vacío (`NULL`). Esto garantiza que el dinero ingresado por ese corte siga sumando al total mensual del barbero, aunque el perfil del cliente ya no exista.

# Estructura del proyecto

```

Marysol-Project/
├── assets/                  # Imágenes, iconos y fuentes del proyecto
├── src/                     # Todo el código fuente de tu aplicación
│   ├── components/          # Componentes reutilizables (tarjetas, botones, modal)
│   ├── screens/             # Pantallas principales (Dashboard, Historial, NuevoCorte)
│   ├── services/            # Configuración y llamadas a la API
│   │   └── supabase.js      # Inicialización del cliente de Supabase
│   ├── navigation/          # Configuración de rutas/navegación entre pantallas
│   └── utils/               # Funciones auxiliares (formateo de fechas, moneda)
├── .env                     # Variables de entorno (URL y Anon Key de Supabase)
├── .gitignore               # Archivos ignorados por Git
├── index.js                 # Punto de entrada principal de la aplicación
├── app.json                 # Configuración del proyecto en Expo
├── package.json             # Dependencias del proyecto
└── README.md                # Documentación del repositorio

```