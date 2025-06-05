import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Client
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL and Anon Key must be provided in .env.local');
      // Or throw an error, depending on desired behavior
      throw new Error('Supabase URL and Anon Key must be provided in .env.local');
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// Funciones de utilidad para Supabase
export async function registrarAcceso(ip: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('accesos')
    .insert([{ ip: ip, fecha: new Date().toISOString() }]);
  
  if (error) {
    console.error('Error al registrar acceso:', error);
    throw error;
  }
  console.log('Acceso registrado exitosamente:', data);
}

export async function obtenerAccesos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('accesos')
    .select('*');
  
  if (error) {
    console.error('Error al obtener accesos:', error);
    throw error;
  }
  return data;
}

export async function limpiarAccesos() {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('accesos')
    .delete()
    .neq('id', '0'); // Delete all rows (assuming 'id' is never '0')
  
  if (error) {
    console.error('Error al limpiar accesos:', error);
    throw error;
  }
  console.log('Accesos limpiados exitosamente');
}

export async function agregarCargo(nombre: string, salario: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cargos')
    .insert([{ nombre: nombre, salario: salario }]);

  if (error) {
    console.error('Error al agregar cargo:', error);
    throw error;
  }
  console.log('Cargo agregado exitosamente:', data);
}

export async function obtenerCargos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cargos')
    .select('*');

  if (error) {
    console.error('Error al obtener cargos:', error);
    throw error;
  }
  return data;
}

export async function actualizarCargo(id: number, nombre: string, salario: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cargos')
    .update({ nombre: nombre, salario: salario })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar cargo:', error);
    throw error;
  }
  console.log('Cargo actualizado exitosamente:', data);
}

export async function eliminarCargo(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cargos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar cargo:', error);
    throw error;
  }
  console.log('Cargo eliminado exitosamente:', data);
}

// Esta función de exportar base de datos ya no es necesaria de la misma forma con Supabase
// Puedes usar las herramientas de exportación de Supabase si necesitas exportar datos
/*
export async function exportarBaseDeDatos() {
  // ... (implementación anterior para MySQL)
}
*/

export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('festivos')
    .insert([{ fecha: fecha, nombre: nombre, tipo: tipo }]);

  if (error) {
    console.error('Error al agregar festivo:', error);
    throw error;
  }
  console.log('Festivo agregado exitosamente:', data);
}

export async function obtenerFestivos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error al obtener festivos:', error);
    throw error;
  }
  return data;
}

export async function obtenerFestivosPorAño(año: number) {
  const supabase = getSupabaseClient();
  // En PostgreSQL (Supabase), usamos EXTRACT para obtener el año de una fecha
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .filter('fecha', 'gte', `${año}-01-01`)
    .filter('fecha', 'lte', `${año}-12-31`)
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error al obtener festivos por año:', error);
    throw error;
  }
  return data;
}

export async function eliminarFestivo(fecha: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('festivos')
    .delete()
    .eq('fecha', fecha);

  if (error) {
    console.error('Error al eliminar festivo:', error);
    throw error;
  }
  console.log('Festivo eliminado exitosamente:', data);
}

// La función connectToDatabase ya no es necesaria de la misma forma con Supabase
// export { connectToDatabase }; 