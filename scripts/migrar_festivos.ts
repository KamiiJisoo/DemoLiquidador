import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { format, addDays, parse, startOfYear, endOfYear } from 'date-fns';

// Cargar variables de entorno desde .env.local usando dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getSupabaseClient, agregarFestivo } from '../lib/database';
import festivosInfo from '../data/festivos_info.json';
// import festivos from '../data/festivos.json'; // Removed: no longer using pre-calculated dates

// Note: The types AñoFestivo and Festivos are no longer strictly needed in this script as we are calculating dynamically.

// Calcular fecha de Pascua (algoritmo de Meeus/Jones/Butcher)
function calcularPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  // Note: month is 0-indexed in Date constructor
  return new Date(year, mes - 1, dia);
}

// Trasladar festivo al siguiente lunes si no cae lunes
function trasladarALunes(fecha: Date): Date {
  const diaSemana = fecha.getDay();
  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  if (diaSemana === 1) return fecha; // Already a Monday
  // Calculate days to add to get to the next Monday
  const diasParaLunes = (1 - diaSemana + 7) % 7;
  return addDays(fecha, diasParaLunes);
}

// Function to check if a date already exists in Supabase
async function fechaExiste(supabase: any, fecha: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('festivos')
    .select('count', { count: 'exact' })
    .eq('fecha', fecha);

  if (error) {
    console.error('Error al verificar existencia de festivo:', error);
    // Depending on desired behavior, you might throw here or return false
    throw error; 
  }

  return count !== null && count > 0;
}

async function main() {
  const supabase = getSupabaseClient();
  try {
    console.log('Limpiando tabla de festivos existente...');
    // Supabase delete to remove all rows (adjust RLS policy if needed)
    // Using a condition that is always true to delete all rows
    const { error: deleteError } = await supabase
      .from('festivos')
      .delete()
      .neq('id', '0'); // Assumes 'id' column exists and no row has id '0'

    if (deleteError) {
      console.error('Error al limpiar la tabla de festivos:', deleteError);
      throw deleteError;
    }
    console.log('Tabla de festivos limpiada exitosamente.');

    console.log('Iniciando migración de festivos...');
    let totalFestivosAgregados = 0;
    let festivosDuplicadosEncontrados = 0;

    for (let year = 2024; year <= 2040; year++) {
      console.log(`\nProcesando año ${year}...`);

      // Fixed holidays (always on the same day and month)
      for (const [monthDay, nombre] of Object.entries(festivosInfo.festivos_fijos)) {
        const fechaCompleta = `${year}-${monthDay}`;
        if (!(await fechaExiste(supabase, fechaCompleta))) {
          await agregarFestivo(fechaCompleta, nombre, 'FIJO');
          totalFestivosAgregados++;
        } else {
          festivosDuplicadosEncontrados++;
        }
      }
      console.log(`  Festivos fijos procesados para ${year}.`);

      // Movable holidays (based on Easter or fixed date but moved to Monday)
      const pascua = calcularPascua(year);

      const movableHolidays = [
        { nombre: 'Reyes Magos', month: 0, day: 6, emiliani: true }, // Month is 0-indexed (January is 0)
        { nombre: 'San José', month: 2, day: 19, emiliani: true }, // March is 2
        { nombre: 'Jueves Santo', base: pascua, offset: -3, emiliani: false }, // Not moved to Monday
        { nombre: 'Viernes Santo', base: pascua, offset: -2, emiliani: false }, // Not moved to Monday
        { nombre: 'Ascensión del Señor', base: pascua, offset: 39, emiliani: true },
        { nombre: 'Corpus Christi', base: pascua, offset: 60, emiliani: true },
        { nombre: 'Sagrado Corazón de Jesús', base: pascua, offset: 68, emiliani: true },
        { nombre: 'San Pedro y San Pablo', month: 5, day: 29, emiliani: true }, // June is 5
        { nombre: 'Asunción de la Virgen', month: 7, day: 15, emiliani: true }, // August is 7
        { nombre: 'Día de la Raza', month: 9, day: 12, emiliani: true }, // October is 9
        { nombre: 'Todos los Santos', month: 10, day: 1, emiliani: true }, // November is 10
        { nombre: 'Independencia de Cartagena', month: 10, day: 11, emiliani: true }, // November is 10
      ];

      for (const festivoInfo of movableHolidays) {
        let baseDate: Date;
        if (festivoInfo.base) {
          // Holiday based on Easter
          baseDate = addDays(new Date(festivoInfo.base), festivoInfo.offset!);
        } else {
          // Holiday fixed by month and day
          baseDate = new Date(year, festivoInfo.month!, festivoInfo.day);
        }

        const finalDate = festivoInfo.emiliani ? trasladarALunes(baseDate) : baseDate;
        const fechaCompleta = format(finalDate, 'yyyy-MM-dd');
        const nombre = festivoInfo.nombre;

        if (!(await fechaExiste(supabase, fechaCompleta))) {
             await agregarFestivo(fechaCompleta, nombre, 'MOVIL');
             totalFestivosAgregados++;
           } else {
             festivosDuplicadosEncontrados++;
           }
      }
       console.log(`  Festivos móviles procesados para ${year}.`);
    }

    console.log(`\nMigración de festivos completada exitosamente.`);
    console.log(`Total de festivos agregados: ${totalFestivosAgregados}`);
    console.log(`Festivos duplicados encontrados (si se ejecutó con datos existentes): ${festivosDuplicadosEncontrados}`);

    // Optional: Verify a few important holidays after migration
    console.log('\nVerificando algunos festivos importantes después de la migración:');
    const datesToVerify = ['2025-01-01', '2025-06-02', '2024-03-28', '2024-03-29', '2025-04-17', '2025-04-18', '2025-05-01'];
    const { data: verifiedFestivos, error: verifyError }: { data: any[] | null, error: any } = await supabase
      .from('festivos')
      .select('fecha, nombre')
      .in('fecha', datesToVerify);

    if (verifyError) {
      console.error('Error al verificar festivos importantes:', verifyError);
    } else if (verifiedFestivos) {
       console.log('Festivos verificados (fecha, nombre):', verifiedFestivos);
    } else {
        console.log('No se encontraron los festivos verificados en la base de datos.');
    }

  } catch (error) {
    console.error('Error durante la migración de festivos:', error);
    process.exit(1);
  }
}

main(); 