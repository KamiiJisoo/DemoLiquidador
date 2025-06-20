import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Verificar configuración básica
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas correctamente')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de datos
export interface Acceso {
  id?: number
  ip: string
  fecha: string
}

export interface Cargo {
  id?: number
  nombre: string
  salario: number
}

export interface Festivo {
  id?: number
  fecha: string
  nombre: string
  tipo: 'FIJO' | 'MOVIL'
}

// Funciones para la tabla ACCESOS
export async function registrarAcceso(ip: string) {
  const fecha = new Date().toISOString()
  console.log('Registrando acceso en Supabase...', { ip, fecha })
  
  try {
    const { data, error } = await supabase
      .from('accesos')
      .insert([{ ip, fecha }])
    
    if (error) {
      console.error('Error al registrar acceso:', error)
      throw error
    }
    
    console.log('Acceso registrado exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en registrarAcceso:', error)
    throw error
  }
}

export async function obtenerAccesos() {
  try {
    const { data, error } = await supabase
      .from('accesos')
      .select('*')
      .order('fecha', { ascending: false })
    
    if (error) {
      console.error('Error al obtener accesos:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error en obtenerAccesos:', error)
    throw error
  }
}

export async function limpiarAccesos() {
  try {
    const { error } = await supabase
      .from('accesos')
      .delete()
      .neq('id', 0) // Eliminar todos los registros
    
    if (error) {
      console.error('Error al limpiar accesos:', error)
      throw error
    }
    
    console.log('Accesos limpiados exitosamente')
  } catch (error) {
    console.error('Error en limpiarAccesos:', error)
    throw error
  }
}

// Funciones para la tabla CARGOS
export async function agregarCargo(nombre: string, salario: number) {
  console.log('Agregando cargo en Supabase...', { nombre, salario })
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .insert([{ nombre, salario }])
    
    if (error) {
      console.error('Error al agregar cargo:', error)
      throw error
    }
    
    console.log('Cargo agregado exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en agregarCargo:', error)
    throw error
  }
}

export async function obtenerCargos() {
  try {
    const { data, error } = await supabase
      .from('cargos')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error al obtener cargos:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error en obtenerCargos:', error)
    throw error
  }
}

export async function actualizarCargo(id: number, nombre: string, salario: number) {
  console.log('Actualizando cargo en Supabase...', { id, nombre, salario })
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .update({ nombre, salario })
      .eq('id', id)
    
    if (error) {
      console.error('Error al actualizar cargo:', error)
      throw error
    }
    
    console.log('Cargo actualizado exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en actualizarCargo:', error)
    throw error
  }
}

export async function eliminarCargo(id: number) {
  console.log('Eliminando cargo en Supabase...', { id })
  
  try {
    const { data, error } = await supabase
      .from('cargos')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error al eliminar cargo:', error)
      throw error
    }
    
    console.log('Cargo eliminado exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en eliminarCargo:', error)
    throw error
  }
}

// Funciones para la tabla FESTIVOS
export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  try {
    const { data, error } = await supabase
      .from('festivos')
      .insert([{ fecha, nombre, tipo }])
    
    if (error) {
      console.error('Error al agregar festivo:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error en agregarFestivo:', error)
    throw error
  }
}

export async function obtenerFestivos() {
  try {
    const { data, error } = await supabase
      .from('festivos')
      .select('*')
      .order('fecha', { ascending: true })
    
    if (error) {
      console.error('Error al obtener festivos:', error)
      throw error
    }
    
    // Asegurar que las fechas estén en formato YYYY-MM-DD
    const festivosFormateados = (data || []).map(festivo => ({
      ...festivo,
      fecha: festivo.fecha.split('T')[0] // Remover timestamp si existe
    }))
    
    return festivosFormateados
  } catch (error) {
    console.error('Error en obtenerFestivos:', error)
    throw error
  }
}

export async function obtenerFestivosPorAño(año: number) {
  try {
    console.log(`Obteniendo festivos para el año ${año}`)
    const { data, error } = await supabase
      .from('festivos')
      .select('*')
      .gte('fecha', `${año}-01-01`)
      .lte('fecha', `${año}-12-31`)
      .order('fecha', { ascending: true })
    
    if (error) {
      console.error('Error al obtener festivos por año:', error)
      throw error
    }
    
    console.log('Datos crudos de Supabase:', data?.slice(0, 3))
    
    // Asegurar que las fechas estén en formato YYYY-MM-DD
    const festivosFormateados = (data || []).map(festivo => ({
      ...festivo,
      fecha: festivo.fecha.split('T')[0] // Remover timestamp si existe
    }))
    
    console.log('Festivos formateados en backend:', festivosFormateados.slice(0, 3))
    return festivosFormateados
  } catch (error) {
    console.error('Error en obtenerFestivosPorAño:', error)
    throw error
  }
}

export async function eliminarFestivo(fecha: string) {
  try {
    console.log('Eliminando festivo en Supabase con fecha:', fecha)
    
    // Primero verificamos si existe el festivo
    const { data: festivos, error: selectError } = await supabase
      .from('festivos')
      .select('*')
      .eq('fecha', fecha)
    
    if (selectError) {
      console.error('Error al buscar festivo:', selectError)
      throw selectError
    }
    
    console.log('Festivos encontrados:', festivos)
    
    if (!festivos || festivos.length === 0) {
      console.error('No se encontró ningún festivo con la fecha:', fecha)
      return { data: null, count: 0 }
    }
    
    // Eliminamos el festivo
    const { data, error } = await supabase
      .from('festivos')
      .delete()
      .eq('fecha', fecha)
    
    if (error) {
      console.error('Error al eliminar festivo:', error)
      throw error
    }
    
    console.log('Resultado de la eliminación:', data)
    return { data, count: 1 }
  } catch (error) {
    console.error('Error en eliminarFestivo:', error)
    throw error
  }
}

// Función para exportar la base de datos
export async function exportarBaseDeDatos() {
  try {
    const accesos = await obtenerAccesos()
    const cargos = await obtenerCargos()
    const festivos = await obtenerFestivos()
    
    const data = { accesos, cargos, festivos }
    
    // En el navegador no podemos escribir archivos directamente
    // Retornamos los datos para que se puedan descargar
    return data
  } catch (error) {
    console.error('Error en exportarBaseDeDatos:', error)
    throw error
  }
}

// Función para inicializar cargos predefinidos
export async function inicializarCargosPredefinidos() {
  try {
    // Verificar si ya existen cargos
    const cargosExistentes = await obtenerCargos()
    
    if (cargosExistentes.length === 0) {
      const cargosPredefinidos = [
        { nombre: 'BOMBERO', salario: 2054865 },
        { nombre: 'CABO DE BOMBERO', salario: 2197821 },
        { nombre: 'SARGENTO DE BOMBERO', salario: 2269299 },
        { nombre: 'TENIENTE DE BOMBERO', salario: 2510541 }
      ]

      for (const cargo of cargosPredefinidos) {
        await agregarCargo(cargo.nombre, cargo.salario)
      }
      
      console.log('Cargos predefinidos inicializados')
    }
  } catch (error) {
    console.error('Error al inicializar cargos predefinidos:', error)
    throw error
  }
} 