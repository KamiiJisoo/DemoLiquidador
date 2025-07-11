import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Acceso {
  id: number
  ip: string
  fecha: string
}

export interface Cargo {
  id: number
  nombre: string
  salario: number
}

export interface Festivo {
  id: number
  fecha: string
  nombre: string
  tipo: 'FIJO' | 'MOVIL'
}

// Database functions using Supabase
export async function registrarAcceso(ip: string) {
  const fecha = new Date().toISOString();
  console.log('Registrando acceso en Supabase...', { ip, fecha });
  
  const { data, error } = await supabase
    .from('accesos')
    .insert([{ ip, fecha }]);
  
  if (error) {
    console.error('Error al registrar acceso:', error);
    throw error;
  }
  
  console.log('Acceso registrado exitosamente');
  return data;
}

export async function obtenerAccesos() {
  const { data, error } = await supabase
    .from('accesos')
    .select('*')
    .order('fecha', { ascending: false });
  
  if (error) {
    console.error('Error al obtener accesos:', error);
    throw error;
  }
  
  return data || [];
}

export async function limpiarAccesos() {
  const { error } = await supabase
    .from('accesos')
    .delete()
    .neq('id', 0); // Delete all records
  
  if (error) {
    console.error('Error al limpiar accesos:', error);
    throw error;
  }
}

export async function agregarCargo(nombre: string, salario: number) {
  console.log('Agregando cargo en Supabase...', { nombre, salario });
  
  const { data, error } = await supabase
    .from('cargos')
    .insert([{ nombre, salario }]);
  
  if (error) {
    console.error('Error al agregar cargo:', error);
    throw error;
  }
  
  console.log('Cargo agregado exitosamente');
  return data;
}

export async function obtenerCargos() {
  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .order('nombre', { ascending: true });
  
  if (error) {
    console.error('Error al obtener cargos:', error);
    throw error;
  }
  
  return data || [];
}

export async function actualizarCargo(id: number, nombre: string, salario: number) {
  console.log('Actualizando cargo en Supabase...', { id, nombre, salario });
  
  const { data, error } = await supabase
    .from('cargos')
    .update({ nombre, salario })
    .eq('id', id);
  
  if (error) {
    console.error('Error al actualizar cargo:', error);
    throw error;
  }
  
  console.log('Cargo actualizado exitosamente');
  return data;
}

export async function eliminarCargo(id: number) {
  console.log('Eliminando cargo en Supabase...', { id });
  
  const { data, error } = await supabase
    .from('cargos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error al eliminar cargo:', error);
    throw error;
  }
  
  console.log('Cargo eliminado exitosamente');
  return data;
}

export async function exportarBaseDeDatos() {
  const accesos = await obtenerAccesos();
  const cargos = await obtenerCargos();
  const festivos = await obtenerFestivos();
  
  const data = { accesos, cargos, festivos };
  return data;
}

export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  const { data, error } = await supabase
    .from('festivos')
    .insert([{ fecha, nombre, tipo }]);
  
  if (error) {
    console.error('Error al agregar festivo:', error);
    throw error;
  }
  
  return data;
}

export async function obtenerFestivos() {
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .order('fecha', { ascending: true });
  
  if (error) {
    console.error('Error al obtener festivos:', error);
    throw error;
  }
  
  return data || [];
}

export async function obtenerFestivosPorAño(año: number) {
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .gte('fecha', `${año}-01-01`)
    .lt('fecha', `${año + 1}-01-01`)
    .order('fecha', { ascending: true });
  
  if (error) {
    console.error('Error al obtener festivos por año:', error);
    throw error;
  }
  
  return data || [];
}

export async function eliminarFestivo(fecha: string) {
  console.log('Eliminando festivo en Supabase con fecha:', fecha);
  
  const { data, error } = await supabase
    .from('festivos')
    .delete()
    .eq('fecha', fecha);
  
  if (error) {
    console.error('Error al eliminar festivo:', error);
    throw error;
  }
  
  console.log('Festivo eliminado exitosamente');
  return data;
} 