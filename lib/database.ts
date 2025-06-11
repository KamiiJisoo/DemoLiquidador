import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Supabase client
let supabase: SupabaseClient;

async function connectToDatabase() {
  if (supabase) {
    return supabase;
  }

  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('Connected to Supabase database');
    return supabase;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Funciones de utilidad para Supabase
export async function registrarAcceso(ip: string) {
  const supabase = await connectToDatabase();
  const fecha = new Date().toISOString();
  console.log('Executing INSERT query for registrarAcceso...', { ip, fecha });
  try {
    const { data, error } = await supabase
      .from('accesos')
      .insert([{ ip, fecha }]);
    
    if (error) throw error;
    console.log('INSERT query successful for registrarAcceso');
  } catch (error: any) {
    console.error('Error executing INSERT query in registrarAcceso:', error);
    throw error;
  }
}

export async function obtenerAccesos() {
  const supabase = await connectToDatabase();
  const { data, error } = await supabase
    .from('accesos')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function limpiarAccesos() {
  const supabase = await connectToDatabase();
  const { error } = await supabase
    .from('accesos')
    .delete()
    .neq('id', 0);
  
  if (error) throw error;
}

export async function agregarCargo(nombre: string, salario: number) {
  const supabase = await connectToDatabase();
  console.log('Executing INSERT query for agregarCargo...', { nombre, salario });
  try {
    const { data, error } = await supabase
      .from('cargos')
      .insert([{ nombre, salario }]);
    
    if (error) throw error;
    console.log('INSERT query successful for agregarCargo');
  } catch (error) {
    console.error('Error executing INSERT query in agregarCargo:', error);
    throw error;
  }
}

export async function obtenerCargos() {
  const supabase = await connectToDatabase();
  const { data, error } = await supabase
    .from('cargos')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function eliminarCargo(id: number) {
  const supabase = await connectToDatabase();
  console.log('Executing DELETE query for eliminarCargo...', { id });
  try {
    const { error } = await supabase
      .from('cargos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('DELETE query successful for eliminarCargo');
  } catch (error) {
    console.error('Error executing DELETE query in eliminarCargo:', error);
    throw error;
  }
}

export async function exportarBaseDeDatos() {
  const accesos = await obtenerAccesos();
  const cargos = await obtenerCargos();
  const data = { accesos, cargos };
  fs.writeFileSync(path.join(process.cwd(), 'db_export.json'), JSON.stringify(data, null, 2));
  return data;
}

export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  const supabase = await connectToDatabase();
  try {
    const { data, error } = await supabase
      .from('festivos')
      .insert([{ fecha, nombre, tipo }]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al agregar festivo:', error);
    throw error;
  }
}

export async function obtenerFestivos() {
  const supabase = await connectToDatabase();
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .order('fecha');
  
  if (error) throw error;
  return data;
}

export async function obtenerFestivosPorAño(año: number) {
  const supabase = await connectToDatabase();
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .gte('fecha', `${año}-01-01`)
    .lte('fecha', `${año}-12-31`)
    .order('fecha');
  
  if (error) throw error;
  return data;
}

export async function eliminarFestivo(fecha: string) {
  const supabase = await connectToDatabase();
  try {
    const { error } = await supabase
      .from('festivos')
      .delete()
      .eq('fecha', fecha);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar festivo:', error);
    throw error;
  }
}

export { connectToDatabase }; 