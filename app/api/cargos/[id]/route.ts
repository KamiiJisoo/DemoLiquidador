import { NextRequest, NextResponse } from 'next/server';
import { actualizarCargo, eliminarCargo } from '@/lib/sqlite';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nombre, salario } = await request.json();
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    actualizarCargo(id, nombre, salario);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    return NextResponse.json({ error: 'Error al actualizar cargo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    eliminarCargo(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    return NextResponse.json({ error: 'Error al eliminar cargo' }, { status: 500 });
  }
} 