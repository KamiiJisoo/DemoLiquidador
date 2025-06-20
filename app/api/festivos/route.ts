import { NextRequest, NextResponse } from 'next/server';
import { obtenerFestivos, obtenerFestivosPorAño, agregarFestivo, eliminarFestivo } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const año = searchParams.get('año');
    
    let festivos;
    if (año) {
      festivos = await obtenerFestivosPorAño(parseInt(año));
    } else {
      festivos = await obtenerFestivos();
    }
    
    return NextResponse.json({ success: true, festivos });
  } catch (error) {
    console.error('Error al obtener festivos:', error);
    return NextResponse.json(
      { error: 'Error al obtener festivos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fecha, nombre, tipo } = await request.json();
    
    if (!fecha || !nombre || !tipo) {
      return NextResponse.json(
        { error: 'Fecha, nombre y tipo son requeridos' },
        { status: 400 }
      );
    }
    
    if (!['FIJO', 'MOVIL'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo debe ser FIJO o MOVIL' },
        { status: 400 }
      );
    }
    
    await agregarFestivo(fecha, nombre, tipo);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Festivo agregado exitosamente' 
    });
  } catch (error) {
    console.error('Error al agregar festivo:', error);
    return NextResponse.json(
      { error: 'Error al agregar festivo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    
    if (!fecha) {
      return NextResponse.json(
        { error: 'Fecha es requerida' },
        { status: 400 }
      );
    }
    
    const result = await eliminarFestivo(fecha);
    
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'No se encontró el festivo a eliminar' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Festivo eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar festivo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar festivo' },
      { status: 500 }
    );
  }
} 