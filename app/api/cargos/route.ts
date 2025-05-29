import { NextRequest, NextResponse } from 'next/server';
import { obtenerCargos, agregarCargo } from '@/lib/sqlite';

export async function GET() {
  try {
    const cargos = obtenerCargos();
    return NextResponse.json({ cargos });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cargos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, salario } = await request.json();
    agregarCargo(nombre, salario);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al agregar cargo' }, { status: 500 });
  }
} 