import { NextRequest, NextResponse } from 'next/server';
import { actualizarCargo, eliminarCargo } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('PUT /api/cargos/[id] called with id:', params.id);
  try {
    const id = parseInt(params.id);
    const { nombre, salario } = await request.json();
    
    if (!nombre || !salario || isNaN(id)) {
      return NextResponse.json(
        { error: 'ID, nombre y salario son requeridos' },
        { status: 400 }
      );
    }
    
    await actualizarCargo(id, nombre, salario);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cargo actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cargo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('DELETE /api/cargos/[id] called with id:', params.id);
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID válido es requerido' },
        { status: 400 }
      );
    }
    
    await eliminarCargo(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cargo eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cargo' },
      { status: 500 }
    );
  }
} 