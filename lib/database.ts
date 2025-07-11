import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

// MySQL Connection Pool
let pool: mysql.Pool;

async function connectToDatabase() {
  if (pool) {
    return pool;
  }

  try {
    pool = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: process.env.DATABASE_PASSWORD,
      database: 'liquidador_bomberos',
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Check connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();

    // Create tables if they don't exist (MySQL syntax)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accesos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(255) NOT NULL,
        fecha VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cargos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        salario INT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS festivos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        tipo ENUM('FIJO', 'MOVIL') NOT NULL
      );
    `);

    // Insert predefinidos if table is empty
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM cargos');
    const result = rows[0];
    if (result.count === 0) {
      const cargosPredefinidos = [
        { nombre: 'BOMBERO', salario: 2054865 },
        { nombre: 'CABO DE BOMBERO', salario: 2197821 },
        { nombre: 'SARGENTO DE BOMBERO', salario: 2269299 },
        { nombre: 'TENIENTE DE BOMBERO', salario: 2510541 }
      ];

      const insertQuery = 'INSERT INTO cargos (nombre, salario) VALUES (?, ?)';
      for (const cargo of cargosPredefinidos) {
        await pool.execute(insertQuery, [cargo.nombre, cargo.salario]);
      }
    }

    return pool;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Funciones de utilidad para MySQL
export async function registrarAcceso(ip: string) {
  const pool = await connectToDatabase();
  const fecha = new Date().toISOString();
  console.log('Executing INSERT query for registrarAcceso...', { ip, fecha });
  try {
    const [result]: any = await pool.execute('INSERT INTO accesos (ip, fecha) VALUES (?, ?)', [ip, fecha]);
    console.log('INSERT query successful for registrarAcceso. Affected rows:', result.affectedRows);
  } catch (error: any) {
    console.error('Error executing INSERT query in registrarAcceso:', error);
    console.error('Error details:', error.message, error.code, error.sqlMessage);
    throw error;
  }
}

export async function obtenerAccesos() {
  const pool = await connectToDatabase();
  const [rows]: any = await pool.execute('SELECT * FROM accesos');
  return rows;
}

export async function limpiarAccesos() {
  const pool = await connectToDatabase();
  await pool.execute('DELETE FROM accesos');
}

export async function agregarCargo(nombre: string, salario: number) {
  const pool = await connectToDatabase();
  console.log('Executing INSERT query for agregarCargo...', { nombre, salario });
  try {
    const [result]: any = await pool.execute('INSERT INTO cargos (nombre, salario) VALUES (?, ?)', [nombre, salario]);
    console.log('INSERT query successful for agregarCargo. Affected rows:', result.affectedRows);
  } catch (error) {
    console.error('Error executing INSERT query in agregarCargo:', error);
    throw error;
  }
}

export async function obtenerCargos() {
  const pool = await connectToDatabase();
  const [rows]: any = await pool.execute('SELECT * FROM cargos');
  return rows;
}

export async function actualizarCargo(id: number, nombre: string, salario: number) {
  const pool = await connectToDatabase();
  console.log('Executing UPDATE query for actualizarCargo...', { id, nombre, salario });
  try {
    const [result]: any = await pool.execute('UPDATE cargos SET nombre = ?, salario = ? WHERE id = ?', [nombre, salario, id]);
    console.log('UPDATE query successful for actualizarCargo. Affected rows:', result.affectedRows);
  } catch (error) {
    console.error('Error executing UPDATE query in actualizarCargo:', error);
    throw error;
  }
}

export async function eliminarCargo(id: number) {
  const pool = await connectToDatabase();
  console.log('Executing DELETE query for eliminarCargo...', { id });
  try {
    const [result]: any = await pool.execute('DELETE FROM cargos WHERE id = ?', [id]);
    console.log('DELETE query successful for eliminarCargo. Affected rows:', result.affectedRows);
  } catch (error) {
    console.error('Error executing DELETE query in eliminarCargo:', error);
    throw error;
  }
}

export async function exportarBaseDeDatos() {
  const accesos = await obtenerAccesos();
  const cargos = await obtenerCargos();
  const data = { accesos, cargos };
  fs.writeFileSync(path.join(process.cwd(), 'db_export.json'), JSON.stringify(data, null, 2));
  return data;
}

export async function agregarFestivo(fecha: string, nombre: string, tipo: 'FIJO' | 'MOVIL') {
  const pool = await connectToDatabase();
  try {
    const [result]: any = await pool.execute(
      'INSERT INTO festivos (fecha, nombre, tipo) VALUES (?, ?, ?)',
      [fecha, nombre, tipo]
    );
    return result;
  } catch (error) {
    console.error('Error al agregar festivo:', error);
    throw error;
  }
}

export async function obtenerFestivos() {
  const pool = await connectToDatabase();
  const [rows]: any = await pool.execute('SELECT * FROM festivos ORDER BY fecha');
  return rows;
}

export async function obtenerFestivosPorAño(año: number) {
  const pool = await connectToDatabase();
  const [rows]: any = await pool.execute(
    'SELECT * FROM festivos WHERE YEAR(fecha) = ? ORDER BY fecha',
    [año]
  );
  return rows;
}

export async function eliminarFestivo(fecha: string) {
  const pool = await connectToDatabase();
  try {
    console.log('Eliminando festivo en la base de datos con fecha:', fecha);
    
    // Primero intentamos encontrar el festivo
    const [festivos]: any = await pool.execute('SELECT * FROM festivos WHERE fecha = ?', [fecha]);
    console.log('Festivos encontrados:', festivos);
    
    if (festivos.length === 0) {
      console.error('No se encontró ningún festivo con la fecha:', fecha);
      return { affectedRows: 0 };
    }
    
    const [result]: any = await pool.execute('DELETE FROM festivos WHERE fecha = ?', [fecha]);
    console.log('Resultado de la eliminación:', result);
    return result;
  } catch (error) {
    console.error('Error al eliminar festivo:', error);
    throw error;
  }
}

export { connectToDatabase }; 