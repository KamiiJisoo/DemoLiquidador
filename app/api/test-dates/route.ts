import { NextResponse } from 'next/server';
import { formatDateFromSupabase, parseDateSafe, formatDateForSupabase } from '@/lib/dateUtils';
import { obtenerFestivos } from '@/lib/database';

export async function GET() {
  try {
    // Obtener algunos festivos de la base de datos
    const festivos = await obtenerFestivos();
    const primerosFestvos = festivos.slice(0, 3);
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tests: [] as any[]
    };
    
    // Test 1: Fechas desde Supabase
    primerosFestvos.forEach((festivo, index) => {
      const fechaOriginal = festivo.fecha as string;
      const fechaFormateada = formatDateFromSupabase(fechaOriginal);
      const fechaParsed = parseDateSafe(fechaFormateada);
      
      diagnostico.tests.push({
        test: `Festivo ${index + 1}`,
        fechaOriginal,
        fechaFormateada,
        fechaParsed: fechaParsed.toISOString(),
        fechaDisplay: fechaParsed.toLocaleDateString('es-ES'),
        problemaDetectado: fechaOriginal !== fechaFormateada ? 'Fecha modificada durante formateo' : 'OK'
      });
    });
    
    // Test 2: Conversión de fechas comunes
    const fechasTest = [
      '2025-01-01',
      '2025-03-23', 
      '2025-04-16',
      '2025-12-31'
    ];
    
    fechasTest.forEach(fecha => {
      const conNewDate = new Date(fecha);
      const conParseDateSafe = parseDateSafe(fecha);
      
      diagnostico.tests.push({
        test: `Conversión ${fecha}`,
        fechaOriginal: fecha,
        conNewDate: {
          iso: conNewDate.toISOString(),
          local: conNewDate.toLocaleDateString('es-ES'),
          getDate: conNewDate.getDate(),
          problema: conNewDate.getDate() !== parseInt(fecha.split('-')[2]) ? 'PROBLEMA: Día diferente' : 'OK'
        },
        conParseDateSafe: {
          iso: conParseDateSafe.toISOString(),
          local: conParseDateSafe.toLocaleDateString('es-ES'),
          getDate: conParseDateSafe.getDate(),
          problema: conParseDateSafe.getDate() !== parseInt(fecha.split('-')[2]) ? 'PROBLEMA: Día diferente' : 'OK'
        }
      });
    });
    
    // Test 3: Ida y vuelta de fechas
    const fechaTest = new Date(2025, 0, 1); // 1 de enero de 2025
    const fechaParaSupabase = formatDateForSupabase(fechaTest);
    const fechaDesdeSupabase = formatDateFromSupabase(fechaParaSupabase);
    const fechaFinal = parseDateSafe(fechaDesdeSupabase);
    
    diagnostico.tests.push({
      test: 'Ida y vuelta',
      fechaOriginal: fechaTest.toISOString(),
      fechaParaSupabase,
      fechaDesdeSupabase,
      fechaFinal: fechaFinal.toISOString(),
      problema: fechaTest.getDate() !== fechaFinal.getDate() ? 'PROBLEMA: Días diferentes' : 'OK'
    });
    
    return NextResponse.json({
      success: true,
      diagnostico,
      recomendacion: 'Usa parseDateSafe() en lugar de new Date() para fechas en formato YYYY-MM-DD'
    });
    
  } catch (error) {
    console.error('Error en test de fechas:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al ejecutar tests de fechas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 