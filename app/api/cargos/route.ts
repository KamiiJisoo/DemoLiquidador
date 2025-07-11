import { NextRequest, NextResponse } from 'next/server';
import { obtenerCargos, agregarCargo } from '@/lib/supabase';

export async function GET() {
  console.log('GET /api/cargos called');
  try {
    const cargos = await obtenerCargos();
    console.log('Successfully fetched cargos in GET /api/cargos');
    return NextResponse.json({ cargos });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cargos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/cargos called');
  try {
    const { nombre, salario } = await request.json();
    await agregarCargo(nombre, salario);
    console.log('Successfully added cargo in POST /api/cargos');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/cargos:', error);
    return NextResponse.json({ error: 'Error al agregar cargo' }, { status: 500 });
  }
} 