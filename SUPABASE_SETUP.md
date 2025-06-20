# Configuración de Supabase

## Pasos para migrar de MySQL a Supabase

### 1. Crear proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la clave anónima (anon key)

### 2. Crear las tablas en Supabase

Ejecuta las siguientes consultas SQL en el editor SQL de Supabase:

```sql
-- Tabla de accesos
CREATE TABLE IF NOT EXISTS accesos (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(255) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de cargos
CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  salario INTEGER NOT NULL
);

-- Tabla de festivos
CREATE TABLE IF NOT EXISTS festivos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('FIJO', 'MOVIL'))
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_accesos_fecha ON accesos(fecha);
CREATE INDEX IF NOT EXISTS idx_accesos_ip ON accesos(ip);
CREATE INDEX IF NOT EXISTS idx_cargos_nombre ON cargos(nombre);
CREATE INDEX IF NOT EXISTS idx_festivos_fecha ON festivos(fecha);
CREATE INDEX IF NOT EXISTS idx_festivos_tipo ON festivos(tipo);
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la carpeta `PagRecargos` con el siguiente contenido:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui

# MySQL Configuration (mantener por si necesitas rollback)
DATABASE_PASSWORD=tu_password_mysql
```

**¿Dónde encontrar estos valores?**
- Ve a tu proyecto en Supabase
- Haz clic en "Settings" → "API"
- Copia la "Project URL" y la "anon/public" key

### 4. Configurar políticas de seguridad (RLS)

En el editor SQL de Supabase, ejecuta:

```sql
-- Habilitar RLS (Row Level Security)
ALTER TABLE accesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE festivos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir todas las operaciones (ajusta según tus necesidades)
CREATE POLICY "Allow all operations on accesos" ON accesos FOR ALL USING (true);
CREATE POLICY "Allow all operations on cargos" ON cargos FOR ALL USING (true);
CREATE POLICY "Allow all operations on festivos" ON festivos FOR ALL USING (true);
```

### 5. Migrar datos existentes (opcional)

Si tienes datos en MySQL que quieres migrar:

1. Exporta los datos de MySQL
2. Usa el panel de Supabase para importar los datos
3. O ejecuta consultas INSERT directamente en el editor SQL

### 6. Probar la conexión

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a la aplicación y prueba las funcionalidades:
   - Gestión de cargos
   - Gestión de festivos
   - Registro de accesos

### 7. Rollback (si es necesario)

Si necesitas volver a MySQL:
1. Cambia las importaciones en las rutas API de `@/lib/supabase` a `@/lib/database`
2. El archivo `database.ts` original se mantiene intacto

## Ventajas de Supabase sobre MySQL local

- ✅ **Hospedaje en la nube**: No necesitas mantener un servidor MySQL
- ✅ **Escalabilidad automática**: Supabase maneja el escalado
- ✅ **Backups automáticos**: Tus datos están seguros
- ✅ **Panel de administración**: Interface web para gestionar datos
- ✅ **APIs REST automáticas**: Supabase genera APIs REST automáticamente
- ✅ **Real-time subscriptions**: Actualizaciones en tiempo real (si las necesitas)
- ✅ **Autenticación integrada**: Si en el futuro necesitas autenticación

## Estructura de las tablas

### Tabla `accesos`
- `id`: SERIAL PRIMARY KEY
- `ip`: VARCHAR(255) NOT NULL
- `fecha`: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### Tabla `cargos`
- `id`: SERIAL PRIMARY KEY
- `nombre`: VARCHAR(255) NOT NULL UNIQUE
- `salario`: INTEGER NOT NULL

### Tabla `festivos`
- `id`: SERIAL PRIMARY KEY
- `fecha`: DATE NOT NULL UNIQUE
- `nombre`: VARCHAR(255) NOT NULL
- `tipo`: VARCHAR(10) NOT NULL CHECK (tipo IN ('FIJO', 'MOVIL'))

## Notas importantes

1. **Variables de entorno**: Asegúrate de que las variables estén configuradas correctamente
2. **Políticas RLS**: Las políticas actuales permiten todo acceso. En producción, considera restringirlas
3. **Límites de Supabase**: El plan gratuito tiene límites. Revisa los límites en tu dashboard
4. **Backup**: Aunque Supabase hace backups automáticos, considera hacer backups manuales periódicos 