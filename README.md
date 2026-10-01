# Marysol-Project

App móvil para **barberos independientes**, hecha con React Native (Expo) y Supabase. Cada barbero crea su cuenta y gestiona **sus propios** clientes, servicios y atenciones, con datos completamente aislados de los demás usuarios.

## Funcionalidades

### Cuenta y seguridad
- Registro e inicio de sesión con Supabase Auth. Al registrarse se crea el perfil de barbero vinculado a la cuenta (`auth_id`).
- **Aislamiento por barbero con Row Level Security (RLS):** cada barbero solo puede ver y modificar sus propios clientes, servicios y atenciones.
- Cierre de sesión con confirmación desde el encabezado.

### Resumen del día
- Ingresos y cantidad de atenciones de hoy.
- Lista de atenciones recientes; mantener presionada una atención permite anularla.
- Actualización automática al entrar a la pantalla y *pull to refresh*.

### Registrar atención
- Selección de cliente (opcional, por defecto "Cliente General") y de servicio.
- El monto se **autocompleta con el precio del servicio**, pero se puede editar (por ejemplo, para un descuento).
- Método de pago (Efectivo, Transferencia, Débito) y notas opcionales.
- Las listas de clientes y servicios se recargan cada vez que se entra a la pantalla.

### Reportes
- **Calendario mensual** con los días que tuvieron atenciones. Al tocar un día se ven sus atenciones y el total de ingresos.
- **Gráficos de los últimos 30 días:** ingresos de los últimos 7 días, servicios más vendidos y distribución por método de pago.
- Calendario y gráficos están hechos con componentes propios de React Native, **sin librerías de gráficos adicionales**.

### Clientes
- Lista con **buscador** por nombre o teléfono (ignora tildes y mayúsculas).
- **Ficha del cliente:** número de visitas, total gastado y fecha de la última visita.
- Botones para **llamar** y escribir por **WhatsApp**.
- Edición y eliminación. Al eliminar un cliente, sus atenciones se conservan en el historial y los reportes, pero pasan a mostrarse como "Cliente General".

### Servicios
- Alta y edición de servicios (nombre y precio).
- Los servicios se **archivan** en lugar de borrarse: dejan de aparecer al registrar atenciones, pero el historial y los reportes conservan su nombre.

### Apariencia
- **Modo claro, modo oscuro o predeterminado del dispositivo**, seleccionable desde el encabezado.
- La preferencia se guarda en el dispositivo (`AsyncStorage`).

## Tecnologías

- [Expo](https://expo.dev) SDK 57 · React Native 0.86 · React 19
- [Supabase](https://supabase.com) (PostgreSQL, Auth y RLS) con `@supabase/supabase-js`
- [React Navigation](https://reactnavigation.org) (pestañas inferiores)
- `@react-native-async-storage/async-storage`, `@react-native-picker/picker`, `@expo/vector-icons`
- [EAS Build](https://docs.expo.dev/build/introduction/) para generar el APK de Android

## Estructura del proyecto

```
Marysol-Project/
├── assets/                    # Ícono, ícono adaptable y favicon
├── src/
│   ├── components/
│   │   ├── Calendario.js          # Calendario mensual
│   │   ├── GraficoBarras.js       # Gráfico de barras verticales
│   │   ├── BarrasHorizontales.js  # Ranking en barras horizontales
│   │   └── FichaCliente.js        # Ficha del cliente (estadísticas, contacto, edición)
│   ├── screens/
│   │   ├── LoginScreen.js         # Inicio de sesión y registro
│   │   ├── HomeScreen.js          # Resumen del día
│   │   ├── NuevoCorteScreen.js    # Registrar atención
│   │   ├── ReportesScreen.js      # Calendario y gráficos
│   │   ├── ServiciosScreen.js     # Catálogo de servicios
│   │   └── ClientesScreen.js      # Directorio de clientes
│   ├── services/
│   │   └── supabase.js            # Cliente de Supabase
│   ├── navigation/
│   │   └── AppNavigator.js        # Pestañas, encabezado y control de sesión
│   ├── theme/
│   │   └── ThemeContext.js        # Paletas clara/oscura y preferencia de tema
│   └── utils/
│       └── fechas.js              # Formato de fechas y moneda
├── .env                       # Variables de entorno (no se sube a Git)
├── .gitignore                 # Archivos ignorados por Git
├── index.js                   # Punto de entrada
├── app.json                   # Configuración de Expo
├── eas.json                   # Perfiles de EAS Build
├── package.json               # Dependencias
└── README.md                  # Documentación
```

## Base de datos

El modelo tiene **4 tablas** conectadas, todas protegidas con RLS por barbero.

| Tabla | Descripción |
| --- | --- |
| `barbero` | Perfil de cada barbero, vinculado a su cuenta de Supabase Auth mediante `auth_id`. |
| `cliente` | Directorio de clientes de cada barbero (`barbero_id`). |
| `tipo_corte` | Catálogo de servicios de cada barbero, con precio. La columna `activo` permite archivar un servicio sin perder el historial. |
| `cita` | Historial de atenciones: cliente, barbero, servicio, monto, fecha, método de pago y notas. |

### Reglas de integridad (`ON DELETE`)

- **`cita.tipo_corte_id` → `RESTRICT`:** no se puede borrar un servicio que ya tiene atenciones registradas. Por eso la app los archiva (`activo = false`).
- **`cita.cliente_id` → `SET NULL`:** al eliminar un cliente, sus atenciones se conservan y los ingresos siguen sumando; solo se pierde el nombre del cliente.
- **`cita.barbero_id`, `cliente.barbero_id`, `tipo_corte.barbero_id` → `CASCADE`:** al eliminar un barbero se elimina todo lo suyo.
- Cada cita guarda su propio `monto`, así que cambiar el precio de un servicio **no altera** las atenciones anteriores.

<details>
<summary>Ver esquema SQL completo</summary>

```sql
CREATE TABLE barbero (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    barbero_id BIGINT REFERENCES barbero(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tipo_corte (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio INT NOT NULL CHECK (precio >= 0),
    barbero_id BIGINT REFERENCES barbero(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cita (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id) ON DELETE SET NULL,
    barbero_id BIGINT REFERENCES barbero(id) ON DELETE CASCADE,
    tipo_corte_id BIGINT REFERENCES tipo_corte(id) ON DELETE RESTRICT,
    monto NUMERIC NOT NULL DEFAULT 0,
    fecha_corte TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE barbero ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE cita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barbero_propio" ON barbero
  FOR ALL USING (auth.uid() = auth_id);
CREATE POLICY "clientes_propios" ON cliente
  FOR ALL USING (barbero_id = (SELECT id FROM barbero WHERE auth_id = auth.uid()));
CREATE POLICY "servicios_propios" ON tipo_corte
  FOR ALL USING (barbero_id = (SELECT id FROM barbero WHERE auth_id = auth.uid()));
CREATE POLICY "citas_propias" ON cita
  FOR ALL USING (barbero_id = (SELECT id FROM barbero WHERE auth_id = auth.uid()));
```

</details>

## Puesta en marcha

### Requisitos
- Node.js y npm
- Un proyecto de Supabase con el esquema de arriba ya creado
- La app **Expo Go** en el celular (SDK 57) para probar en desarrollo

### Instalación

```bash
npm install
```

Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Inicia el servidor de desarrollo y escanea el QR con Expo Go:

```bash
npx expo start
```

Si algo se comporta raro después de cambiar dependencias o variables, reinicia con la caché limpia:

```bash
npx expo start --clear
```

> **Nota:** si tu proyecto de Supabase tiene activada la confirmación de correo, el registro de barberos puede fallar durante el desarrollo. Desactívala en *Authentication → Settings* mientras pruebas.

## Generar el APK (Android)

El APK se compila en la nube con EAS Build:

```bash
npm install -g eas-cli
eas login
npx expo-doctor
eas build -p android --profile preview
```

- Antes de compilar, corre `npx expo-doctor` para detectar problemas de configuración sin gastar un build.
- Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` deben estar configuradas en el dashboard de Expo (*Environment variables*) para el entorno **preview**. El APK no lee el `.env` local.
- Con `--no-wait` el comando devuelve la terminal al instante y el build se sigue desde el link de expo.dev.
- Los cambios solo de JavaScript se prueban en Expo Go sin compilar. Cambiar `app.json`, el nombre, el ícono o agregar librerías nativas sí requiere un build nuevo.
- Al terminar, EAS entrega un link de descarga del APK para instalarlo directamente en el celular.

## Estado del proyecto

Versión `1.0.0`, preparada para el build 5.

### Ideas a futuro
- Sección de servicios archivados con opción de restaurarlos.
- Archivar clientes en lugar de eliminarlos, para conservar su nombre en el historial.
