import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local usando dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getSupabaseClient, agregarFestivo } from '../lib/database';
import festivosInfo from '../data/festivos_info.json';
import festivos from '../data/festivos.json';

type AñoFestivo = "2024" | "2025" | "2026" | "2027" | "2028" | "2029" | "2030" | "2031" | "2032" | "2033" | "2034" | "2035" | "2036" | "2037" | "2038" | "2039" | "2040";
type Festivos = Record<AñoFestivo, string[]>;

async function migrarFestivos() {
  const supabase = getSupabaseClient();
  try {
    // Limpiar tabla de festivos
    const { error: deleteError } = await supabase
      .from('festivos')
      .delete()
      .neq('id', '0'); // Assuming 'id' is never '0' to delete all rows

    if (deleteError) {
      console.error('Error al limpiar la tabla de festivos:', deleteError);
      throw deleteError;
    }
    console.log('Tabla de festivos limpiada exitosamente');

    // Insertar festivos fijos
    for (const [fecha, nombre] of Object.entries(festivosInfo.festivos_fijos)) {
      for (let año = 2024; año <= 2040; año++) {
        const fechaCompleta = `${año}-${fecha}`;
        // Verificar si la fecha ya existe en la tabla (menos eficiente pero mantiene la lógica de deduplicación)
        const { data: existing, error: selectError } = await supabase
          .from('festivos')
          .select('id')
          .eq('fecha', fechaCompleta);
        
        if (selectError) {
          console.error('Error al verificar existencia de festivo:', selectError);
          throw selectError;
        }

        if (!existing || existing.length === 0) {
          await agregarFestivo(fechaCompleta, nombre, 'FIJO');
        }
      }
    }
    
    // Insertar festivos móviles
    for (const [nombre, info] of Object.entries(festivosInfo.festivos_moviles)) {
      for (let año = 2024; año <= 2040; año++) {
        const añoStr = año.toString() as AñoFestivo;
        if (festivos[añoStr]) {
          for (const fecha of festivos[añoStr]) {
            const [añoFecha, mes, dia] = fecha.split('-').map(Number);
            if (añoFecha === año && mes === info.mes && info.dias.includes(dia)) {
               // Verificar si la fecha ya existe en la tabla
              const { data: existing, error: selectError } = await supabase
                .from('festivos')
                .select('id')
                .eq('fecha', fecha);
              
              if (selectError) {
                console.error('Error al verificar existencia de festivo:', selectError);
                throw selectError;
              }

              if (!existing || existing.length === 0) {
                await agregarFestivo(fecha, nombre, 'MOVIL');
              }
            }
          }
        }
      }
    }
    
    console.log('Migración de festivos completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración de festivos:', error);
  }
}

migrarFestivos(); 