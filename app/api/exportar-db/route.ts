import { NextRequest, NextResponse } from 'next/server'
import { exportarBaseDeDatos } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await exportarBaseDeDatos()
    
    // Crear el archivo JSON para descargar
    const jsonData = JSON.stringify(data, null, 2)
    
    return new NextResponse(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="db_export.json"'
      }
    })
  } catch (error) {
    console.error('Error al exportar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al exportar base de datos' },
      { status: 500 }
    )
  }
} 