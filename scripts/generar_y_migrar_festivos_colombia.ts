import { agregarFestivo, connectToDatabase } from '../lib/database';

// Festivos fijos (día y mes siempre igual)
const festivosFijos = [
  { nombre: 'Año Nuevo', mes: 1, dia: 1 },
  { nombre: 'Día del Trabajo', mes: 5, dia: 1 },
  { nombre: 'Independencia de Colombia', mes: 7, dia: 20 },
  { nombre: 'Batalla de Boyacá', mes: 8, dia: 7 },
  { nombre: 'Inmaculada Concepción', mes: 12, dia: 8 },
  { nombre: 'Navidad', mes: 12, dia: 25 },
];

// Festivos trasladables por Ley Emiliani
const festivosEmiliani = [
  { nombre: 'Reyes Magos', mes: 1, dia: 6 },
  { nombre: 'San José', mes: 3, dia: 19 },
  { nombre: 'San Pedro y San Pablo', mes: 6, dia: 29 },
  { nombre: 'Asunción de la Virgen', mes: 8, dia: 15 },
  { nombre: 'Día de la Raza', mes: 10, dia: 12 },
  { nombre: 'Todos los Santos', mes: 11, dia: 1 },
  { nombre: 'Independencia de Cartagena', mes: 11, dia: 11 },
];

// Festivos religiosos móviles
const festivosReligiosos = [
  { nombre: 'Jueves Santo', offset: -3 }, // respecto a Pascua
  { nombre: 'Viernes Santo', offset: -2 },
  { nombre: 'Ascensión del Señor', offset: 43, emiliani: true }, // 39 días después de Pascua, pero se traslada
  { nombre: 'Corpus Christi', offset: 64, emiliani: true }, // 60 días después de Pascua, pero se traslada
  { nombre: 'Sagrado Corazón de Jesús', offset: 71, emiliani: true }, // 68 días después de Pascua, pero se traslada
];

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
  return new Date(year, mes - 1, dia);
}

// Trasladar festivo al siguiente lunes si no cae lunes
function trasladarALunes(fecha: Date): Date {
  const diaSemana = fecha.getDay();
  if (diaSemana === 1) return fecha; // Lunes
  // Si no es lunes, trasladar al siguiente lunes
  const diasParaLunes = (8 - diaSemana) % 7;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + diasParaLunes);
}

// Función para verificar si una fecha ya existe
async function fechaExiste(pool: any, fecha: string): Promise<boolean> {
  const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM festivos WHERE fecha = ?', [fecha]);
  return rows[0].count > 0;
}

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    const pool = await connectToDatabase();
    
    console.log('Eliminando festivos existentes...');
    await pool.execute('DELETE FROM festivos');
    console.log('Festivos existentes eliminados.');

    let totalFestivos = 0;
    let festivosDuplicados = 0;

    for (let year = 2024; year <= 2040; year++) {
      console.log(`\nProcesando año ${year}...`);
      
      // Fijos
      for (const festivo of festivosFijos) {
        const fecha = `${year}-${String(festivo.mes).padStart(2, '0')}-${String(festivo.dia).padStart(2, '0')}`;
        if (!(await fechaExiste(pool, fecha))) {
          await agregarFestivo(fecha, festivo.nombre, 'FIJO');
          totalFestivos++;
        } else {
          festivosDuplicados++;
        }
      }
      console.log(`  Festivos fijos agregados para ${year}`);

      // Emiliani
      for (const festivo of festivosEmiliani) {
        const fechaOriginal = new Date(year, festivo.mes - 1, festivo.dia);
        const fechaLunes = trasladarALunes(fechaOriginal);
        const fecha = `${fechaLunes.getFullYear()}-${String(fechaLunes.getMonth() + 1).padStart(2, '0')}-${String(fechaLunes.getDate()).padStart(2, '0')}`;
        if (!(await fechaExiste(pool, fecha))) {
          await agregarFestivo(fecha, festivo.nombre, 'MOVIL');
          totalFestivos++;
        } else {
          festivosDuplicados++;
          console.log(`  Duplicado encontrado: ${fecha} - ${festivo.nombre}`);
        }
      }
      console.log(`  Festivos Emiliani agregados para ${year}`);

      // Religiosos
      const pascua = calcularPascua(year);
      for (const festivo of festivosReligiosos) {
        let fechaBase = new Date(pascua);
        fechaBase.setDate(fechaBase.getDate() + festivo.offset);
        let fechaFinal = festivo.emiliani ? trasladarALunes(fechaBase) : fechaBase;
        const fecha = `${fechaFinal.getFullYear()}-${String(fechaFinal.getMonth() + 1).padStart(2, '0')}-${String(fechaFinal.getDate()).padStart(2, '0')}`;
        if (!(await fechaExiste(pool, fecha))) {
          await agregarFestivo(fecha, festivo.nombre, 'MOVIL');
          totalFestivos++;
        } else {
          festivosDuplicados++;
          console.log(`  Duplicado encontrado: ${fecha} - ${festivo.nombre}`);
        }
      }
      console.log(`  Festivos religiosos agregados para ${year}`);
    }

    console.log(`\nMigración completada exitosamente.`);
    console.log(`Total de festivos agregados: ${totalFestivos}`);
    console.log(`Festivos duplicados encontrados: ${festivosDuplicados}`);
    
    // Verificar algunos festivos importantes
    console.log('\nVerificando algunos festivos importantes:');
    const [rows]: any = await pool.execute('SELECT * FROM festivos WHERE fecha IN (?, ?, ?)', 
      ['2025-06-02', '2024-03-28', '2024-03-29']);
    console.log('Festivos verificados:', rows);

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

main(); 