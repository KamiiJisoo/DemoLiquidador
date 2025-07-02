/**
 * Utilidades para el manejo correcto de fechas evitando problemas de zona horaria
 */

// Variable para controlar si mostrar logs de depuración
const DEBUG_DATES = process.env.NODE_ENV === 'development';

/**
 * Convierte una fecha de Supabase (string) a formato YYYY-MM-DD
 * evitando problemas de zona horaria
 * 
 * IMPORTANTE: Si la fecha ya está en formato YYYY-MM-DD, se devuelve sin cambios
 */
export function formatDateFromSupabase(dateValue: string | Date): string {
  if (DEBUG_DATES) {
    console.log('formatDateFromSupabase input:', dateValue, 'type:', typeof dateValue);
  }
  
  if (typeof dateValue === 'string') {
    // CASO MÁS COMÚN: Si ya está en formato YYYY-MM-DD, devolverla SIN CAMBIOS
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      if (DEBUG_DATES) console.log('✅ Date already in YYYY-MM-DD format, returning as-is:', dateValue);
      return dateValue;
    }
    
    // Si es una fecha ISO completa, extraer solo la parte de la fecha
    if (dateValue.includes('T')) {
      const result = dateValue.split('T')[0];
      if (DEBUG_DATES) console.log('Extracted date from ISO string:', dateValue, '->', result);
      return result;
    }
    
    // Para fechas que pueden tener problemas de zona horaria,
    // parseamos manualmente para evitar el problema del UTC
    const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const result = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      if (DEBUG_DATES) console.log('Manually parsed date:', dateValue, '->', result);
      return result;
    }
    
    // Para otros formatos, intentar parsear con cuidado
    try {
      // Crear fecha usando el constructor que evita problemas de zona horaria
      const parts = dateValue.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Los meses van de 0-11
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        const result = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0');
        if (DEBUG_DATES) console.log('Parsed date with manual constructor:', dateValue, '->', result);
        return result;
      }
      
      // Fallback: usar el constructor normal con mediodía
      const dateWithTime = dateValue + 'T12:00:00';
      const date = new Date(dateWithTime);
      const result = date.toISOString().split('T')[0];
      if (DEBUG_DATES) console.log('Fallback parsed date:', dateValue, '->', result);
      return result;
    } catch (error) {
      console.error('Error parsing date:', dateValue, error);
      return dateValue;
    }
  }
  
  // Si es un objeto Date
  if (dateValue instanceof Date) {
    const result = dateValue.getFullYear() + '-' + 
                  String(dateValue.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(dateValue.getDate()).padStart(2, '0');
    if (DEBUG_DATES) console.log('Converted Date object:', dateValue, '->', result);
    return result;
  }
  
  const result = String(dateValue);
  if (DEBUG_DATES) console.log('Converted to string:', dateValue, '->', result);
  return result;
}

/**
 * Función simplificada que NO procesa fechas que ya están en formato correcto
 */
export function ensureDateFormat(dateValue: string | Date): string {
  // Si es string y ya está en formato YYYY-MM-DD, devolverla sin cambios
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  }
  
  // Solo para otros casos, usar la función completa
  return formatDateFromSupabase(dateValue);
}

/**
 * Convierte una fecha del DatePicker a formato YYYY-MM-DD para Supabase
 */
export function formatDateForSupabase(date: Date): string {
  // Usar getFullYear, getMonth, getDate para evitar problemas de zona horaria
  const result = date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
  
  if (DEBUG_DATES) {
    console.log('formatDateForSupabase:', date, '->', result);
  }
  
  return result;
}

/**
 * Crea un objeto Date desde una string YYYY-MM-DD sin problemas de zona horaria
 */
export function parseDateSafe(dateString: string): Date {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const result = new Date(year, month - 1, day);
    if (DEBUG_DATES) {
      console.log('parseDateSafe:', dateString, '->', result);
    }
    return result;
  }
  
  // Para otros formatos, usar el constructor normal
  const result = new Date(dateString);
  if (DEBUG_DATES) {
    console.log('parseDateSafe fallback:', dateString, '->', result);
  }
  return result;
} 