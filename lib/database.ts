import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: ReturnType<typeof createClient>;

function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan las variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase database');
  }
  return supabase;
}

// Inicializar datos predefinidos si es necesario
export async function inicializarDatosPredefinidos() {
  const supabase = getSupabaseClient();
  
  try {
    // Verificar si ya existen cargos
    const { data: cargos, error } = await supabase
      .from('cargos')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Error verificando cargos existentes:', error);
      return;
    }

    // Si no hay cargos, insertar los predefinidos
    if (!cargos || cargos.length === 0) {
      const cargosPredefinidos = [
        { nombre: 'BOMBERO', salario: 2054865 },
        { nombre: 'CABO DE BOMBERO', salario: 2197821 },
        { nombre: 'SARGENTO DE BOMBERO', salario: 2269299 },
        { nombre: 'TENIENTE DE BOMBERO', salario: 2510541 }
      ];

      const { error: insertError } = await supabase
        .from('cargos')
        .insert(cargosPredefinidos);

      if (insertError) {
        console.error('Error insertando cargos predefinidos:', insertError);
      } else {
        console.log('Cargos predefinidos insertados correctamente');
      }
    }
  } catch (error) {
    console.error('Error en inicializarDatosPredefinidos:', error);
  }
}

// Funciones de utilidad para Supabase
export async function registrarAcceso(ip: string) {
  const supabase = getSupabaseClient();
  const fecha = new Date().toISOString();
  console.log('Executing INSERT query for registrarAcceso...', { ip, fecha });
  
  try {
    const { data, error } = await supabase
      .from('accesos')
      .insert([{ ip, fecha }])
      .select();

    if (error) {
      console.error('Error executing INSERT query in registrarAcceso:', error);
      throw error;
    }
    
    console.log('INSERT query successful for registrarAcceso. Data:', data);
    return data;
  } catch (error: any) {
    console.error('Error details:', error.message);
    throw error;
  }
}

export async function obtenerAccesos() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('accesos')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error obteniendo accesos:', error);
    throw error;
  }

  return data || [];
}

export async function limpiarAccesos() {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('accesos')
    .delete()
    .neq('id', 0); // Eliminar todos los registros

  if (error) {
    console.error('Error limpiando accesos:', error);
    throw error;
  }
}

export async function agregarCargo(nombre: string, salario: number) {
  const supabase = getSupabaseClient();
  console.log('Executing INSERT query for agregarCargo...', { nombre, salario });
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .insert([{ nombre, salario }])
      .select();

    if (error) {
      console.error('Error executing INSERT query in agregarCargo:', error);
      throw error;
    }
    
    console.log('INSERT query successful for agregarCargo. Data:', data);
    return data;
  } catch (error) {
    console.error('Error in agregarCargo:', error);
    throw error;
  }
}

export async function obtenerCargos() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error obteniendo cargos:', error);
    throw error;
  }

  return data || [];
}

export async function actualizarCargo(id: number, nombre: string, salario: number) {
  const supabase = getSupabaseClient();
  console.log('Executing UPDATE query for actualizarCargo...', { id, nombre, salario });
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .update({ nombre, salario })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error executing UPDATE query in actualizarCargo:', error);
      throw error;
    }
    
    console.log('UPDATE query successful for actualizarCargo. Data:', data);
    return data;
  } catch (error) {
    console.error('Error in actualizarCargo:', error);
    throw error;
  }
}

export async function eliminarCargo(id: number) {
  const supabase = getSupabaseClient();
  console.log('Executing DELETE query for eliminarCargo...', { id });
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error executing DELETE query in eliminarCargo:', error);
      throw error;
    }
    
    console.log('DELETE query successful for eliminarCargo. Data:', data);
    return data;
  } catch (error) {
    console.error('Error in eliminarCargo:', error);
    throw error;
  }
}

export async function exportarBaseDeDatos() {
  const accesos = await obtenerAccesos();
  const cargos = await obtenerCargos();
  const festivos = await obtenerFestivos();
  const data = { accesos, cargos, festivos };
  fs.writeFileSync(path.join(process.cwd(), 'db_export.json'), JSON.stringify(data, null, 2));
  return data;
}

export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Agregando festivo con fecha:', fecha, 'nombre:', nombre, 'tipo:', tipo);
    
    const { data, error } = await supabase
      .from('festivos')
      .insert([{ fecha, nombre, tipo }])
      .select();

    if (error) {
      console.error('Error al agregar festivo:', error);
      throw error;
    }
    
    console.log('Festivo agregado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error al agregar festivo:', error);
    throw error;
  }
}

export async function obtenerFestivos() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error obteniendo festivos:', error);
    throw error;
  }

  console.log('Festivos obtenidos de Supabase:', data);
  return data || [];
}

export async function obtenerFestivosPorAño(año: number) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('festivos')
    .select('*')
    .gte('fecha', `${año}-01-01`)
    .lte('fecha', `${año}-12-31`)
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error obteniendo festivos por año:', error);
    throw error;
  }

  return data || [];
}

export async function eliminarFestivo(fecha: string) {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Eliminando festivo en la base de datos con fecha:', fecha);
    
    // Primero intentamos encontrar el festivo
    const { data: festivos, error: findError } = await supabase
      .from('festivos')
      .select('*')
      .eq('fecha', fecha);
    
    console.log('Festivos encontrados:', festivos);
    
    if (findError) {
      console.error('Error buscando festivo:', findError);
      throw findError;
    }
    
    if (!festivos || festivos.length === 0) {
      console.error('No se encontró ningún festivo con la fecha:', fecha);
      return { data: null, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('festivos')
      .delete()
      .eq('fecha', fecha)
      .select();
    
    if (error) {
      console.error('Error al eliminar festivo:', error);
      throw error;
    }
    
    console.log('Resultado de la eliminación:', data);
    return { data, count: data?.length || 0 };
  } catch (error) {
    console.error('Error al eliminar festivo:', error);
    throw error;
  }
}

// Función de compatibilidad (ya no es necesaria pero se mantiene para evitar errores)
export async function connectToDatabase() {
  return getSupabaseClient();
} 