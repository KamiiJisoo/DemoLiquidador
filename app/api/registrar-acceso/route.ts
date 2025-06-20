export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { registrarAcceso } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('POST /api/registrar-acceso called');
  try {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    await registrarAcceso(ip);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Acceso registrado exitosamente' 
    });
  } catch (error) {
    console.error('Error al registrar acceso:', error);
    return NextResponse.json(
      { error: 'Error al registrar acceso' },
      { status: 500 }
    );
  }
} 