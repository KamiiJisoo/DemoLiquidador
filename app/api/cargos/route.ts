import { NextRequest, NextResponse } from 'next/server';
import { obtenerCargos, agregarCargo, inicializarCargosPredefinidos } from '@/lib/supabase';

export async function GET() {
  try {
    // Inicializar cargos predefinidos si no existen
    await inicializarCargosPredefinidos();
    
    const cargos = await obtenerCargos();
    return NextResponse.json({ cargos });
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    return NextResponse.json({ error: 'Error al obtener cargos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/cargos called');
  try {
    const { nombre, salario } = await request.json();
    
    if (!nombre || !salario) {
      return NextResponse.json(
        { error: 'Nombre y salario son requeridos' },
        { status: 400 }
      );
    }
    
    await agregarCargo(nombre, salario);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cargo agregado exitosamente' 
    });
  } catch (error) {
    console.error('Error al agregar cargo:', error);
    return NextResponse.json({ error: 'Error al agregar cargo' }, { status: 500 });
  }
} 