export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { registrarAcceso } from '@/lib/sqlite';

export async function POST(request: NextRequest) {
  try {
    // Obtener IP del request
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIP || request.ip || 'localhost';
    
    // Registrar el acceso
    registrarAcceso(ip);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al registrar acceso:', error);
    return NextResponse.json(
      { error: 'Error al registrar acceso' },
      { status: 500 }
    );
  }
} 