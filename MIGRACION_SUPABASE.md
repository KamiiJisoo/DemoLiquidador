# Migración de MySQL a Supabase

## ✅ Cambios realizados

### 1. Actualización del archivo `lib/database.ts`
- ✅ Reemplazado `mysql2` con `@supabase/supabase-js`
- ✅ Convertidas todas las consultas SQL a métodos de Supabase
- ✅ Mantenidas todas las funciones existentes con la misma interfaz
- ✅ Agregada función `inicializarDatosPredefinidos()` para insertar cargos iniciales

### 2. Dependencias actualizadas
- ✅ Removida dependencia `mysql2`
- ✅ Mantenida dependencia `@supabase/supabase-js` (ya estaba instalada)

### 3. API endpoints actualizados
- ✅ Actualizado endpoint `/api/cargos` para inicializar datos predefinidos

## 🔧 Configuración requerida

### 1. Variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto `PagRecargos/` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

**Dónde obtener estos valores:**
1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a Settings → API
4. Copia la URL del proyecto y la clave anónima (anon/public)

### 2. Estructura de tablas en Supabase

Asegúrate de que tengas estas tablas creadas en tu base de datos de Supabase:

#### Tabla `accesos`
```sql
CREATE TABLE accesos (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(255) NOT NULL,
  fecha TIMESTAMP NOT NULL
);
```

#### Tabla `cargos`
```sql
CREATE TABLE cargos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  salario INTEGER NOT NULL
);
```

#### Tabla `festivos`
```sql
CREATE TABLE festivos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('FIJO', 'MOVIL'))
);
```

### 3. Políticas de seguridad (RLS)

Si tienes Row Level Security habilitado, necesitarás crear políticas para permitir operaciones:

```sql
-- Para la tabla accesos
ALTER TABLE accesos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on accesos" ON accesos FOR ALL USING (true);

-- Para la tabla cargos
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on cargos" ON cargos FOR ALL USING (true);

-- Para la tabla festivos
ALTER TABLE festivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on festivos" ON festivos FOR ALL USING (true);
```

## 🚀 Pasos para completar la migración

1. **Configurar variables de entorno:**
   - Crea el archivo `.env.local` con tus credenciales de Supabase
   
2. **Verificar estructura de tablas:**
   - Confirma que todas las tablas existen en Supabase
   - Ejecuta las políticas de seguridad si es necesario
   
3. **Probar la aplicación:**
   ```bash
   npm run dev
   ```
   
4. **Verificar funcionalidades:**
   - ✅ Registro de accesos
   - ✅ Gestión de cargos (crear, leer, actualizar, eliminar)
   - ✅ Gestión de festivos
   - ✅ Exportación de datos

## 🔄 Funciones migradas

Todas estas funciones han sido migradas y mantienen la misma interfaz:

- `registrarAcceso(ip: string)`
- `obtenerAccesos()`
- `limpiarAccesos()`
- `agregarCargo(nombre: string, salario: number)`
- `obtenerCargos()`
- `actualizarCargo(id: number, nombre: string, salario: number)`
- `eliminarCargo(id: number)`
- `agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL')`
- `obtenerFestivos()`
- `obtenerFestivosPorAño(año: number)`
- `eliminarFestivo(fecha: string)`
- `exportarBaseDeDatos()`

## ⚠️ Notas importantes

1. **Datos predefinidos:** Los cargos predefinidos se insertan automáticamente la primera vez que se accede al endpoint `/api/cargos`

2. **Formato de fechas:** Supabase maneja las fechas de forma ligeramente diferente a MySQL, pero la migración incluye las conversiones necesarias

3. **Consultas por año:** La función `obtenerFestivosPorAño()` ahora usa filtros de rango de fechas en lugar de la función `YEAR()` de MySQL

4. **Eliminación de registros:** La función `limpiarAccesos()` ahora usa `.neq('id', 0)` para eliminar todos los registros

## 🔍 Solución de problemas

### Error: "Faltan las variables de entorno de Supabase"
- Verifica que el archivo `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo después de agregar las variables

### Error de conexión a Supabase
- Verifica que la URL y la clave sean correctas
- Confirma que el proyecto de Supabase esté activo

### Error en consultas
- Verifica que las tablas existan en Supabase
- Confirma que las políticas RLS permitan las operaciones necesarias

### Problema con fechas (mostrar día anterior)
- **Síntoma**: Los festivos aparecen con un día de diferencia (ej: Año Nuevo aparece como 31/12 en lugar de 01/01)
- **Causa**: Problemas de zona horaria al convertir fechas entre JavaScript y Supabase
- **Solución**: Se implementaron utilidades especiales en `lib/dateUtils.ts` que manejan las fechas sin problemas de zona horaria
- **Verificación**: Puedes acceder a `/api/test-dates` para diagnosticar problemas de fechas

### Tipo de columna en Supabase
Para evitar problemas de fechas, asegúrate de que la columna `fecha` en la tabla `festivos` sea de tipo `DATE` (no `TIMESTAMP` o `TIMESTAMPTZ`):

```sql
-- Verificar el tipo de columna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'festivos' AND column_name = 'fecha';

-- Si necesitas cambiar el tipo:
ALTER TABLE festivos ALTER COLUMN fecha TYPE DATE;
``` 