import { NextResponse } from 'next/server';
// import { exportarBaseDeDatos } from '@/lib/database'; // Removed as it's for MySQL

export async function GET() {
  try {
    // const data = await exportarBaseDeDatos(); // Removed as it's for MySQL
    // return NextResponse.json({ success: true, data });
    
    // Indicate that database export is handled differently with Supabase
    return NextResponse.json({ success: true, message: 'Database export via this endpoint is not available with Supabase. Use the Supabase dashboard or CLI for export.' });
    
  } catch (error) {
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
} 