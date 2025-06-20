-- Ejecuta estas consultas en el editor SQL de Supabase para arreglar las políticas de seguridad

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cargos', 'accesos', 'festivos');

-- 2. Deshabilitar RLS temporalmente para probar (SOLO PARA DESARROLLO)
ALTER TABLE cargos DISABLE ROW LEVEL SECURITY;
ALTER TABLE accesos DISABLE ROW LEVEL SECURITY;
ALTER TABLE festivos DISABLE ROW LEVEL SECURITY;

-- 3. O si prefieres mantener RLS habilitado, crear políticas permisivas
-- (Ejecuta esto SOLO si quieres mantener RLS habilitado)
/*
-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow all operations on cargos" ON cargos;
DROP POLICY IF EXISTS "Allow all operations on accesos" ON accesos;
DROP POLICY IF EXISTS "Allow all operations on festivos" ON festivos;

-- Crear nuevas políticas permisivas
CREATE POLICY "Allow all operations on cargos" ON cargos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on accesos" ON accesos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on festivos" ON festivos FOR ALL USING (true) WITH CHECK (true);
*/

-- 4. Verificar que las tablas existen y tienen datos
SELECT 'cargos' as tabla, count(*) as registros FROM cargos
UNION ALL
SELECT 'accesos' as tabla, count(*) as registros FROM accesos
UNION ALL
SELECT 'festivos' as tabla, count(*) as registros FROM festivos; 