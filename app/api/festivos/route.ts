import { NextResponse } from 'next/server';
import { obtenerFestivos } from '@/lib/database';

export async function GET() {
  try {
    const festivos = await obtenerFestivos();
    return NextResponse.json({ success: true, festivos });
  } catch (error) {
    console.error('Error al obtener festivos:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener festivos' }, { status: 500 });
  }
} 