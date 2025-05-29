import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Asegurarnos de que el directorio existe
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ruta absoluta a la base de datos local
const dbPath = path.join(dbDir, 'db.sqlite');

// Crear una única instancia de la base de datos
let db: Database.Database;

try {
  db = new Database(dbPath);
  
  // Crear tablas si no existen
  db.exec(`
    CREATE TABLE IF NOT EXISTS accesos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cargos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      salario INTEGER NOT NULL
    );
  `);

  // Insertar cargos predefinidos si la tabla está vacía
  const result = db.prepare('SELECT COUNT(*) as count FROM cargos').get() as { count: number };
  if (result.count === 0) {
    const cargosPredefinidos = [
      { nombre: 'BOMBERO', salario: 2054865 },
      { nombre: 'CABO DE BOMBERO', salario: 2197821 },
      { nombre: 'SARGENTO DE BOMBERO', salario: 2269299 },
      { nombre: 'TENIENTE DE BOMBERO', salario: 2510541 }
    ];
    
    const insert = db.prepare('INSERT INTO cargos (nombre, salario) VALUES (?, ?)');
    cargosPredefinidos.forEach(cargo => {
      insert.run(cargo.nombre, cargo.salario);
    });
  }
} catch (error) {
  console.error('Error al inicializar la base de datos:', error);
  throw error;
}

// Funciones de utilidad
export function registrarAcceso(ip: string) {
  const fecha = new Date().toISOString();
  db.prepare('INSERT INTO accesos (ip, fecha) VALUES (?, ?)').run(ip, fecha);
}

export function obtenerAccesos() {
  return db.prepare('SELECT * FROM accesos').all();
}

export function limpiarAccesos() {
  db.prepare('DELETE FROM accesos').run();
}

export function agregarCargo(nombre: string, salario: number) {
  db.prepare('INSERT INTO cargos (nombre, salario) VALUES (?, ?)').run(nombre, salario);
}

export function obtenerCargos() {
  return db.prepare('SELECT * FROM cargos').all();
}

export function actualizarCargo(id: number, nombre: string, salario: number) {
  db.prepare('UPDATE cargos SET nombre = ?, salario = ? WHERE id = ?').run(nombre, salario, id);
}

export function eliminarCargo(id: number) {
  db.prepare('DELETE FROM cargos WHERE id = ?').run(id);
}

// Función para exportar la base de datos a un archivo JSON
export function exportarBaseDeDatos() {
  const accesos = obtenerAccesos();
  const cargos = obtenerCargos();
  const data = { accesos, cargos };
  fs.writeFileSync(path.join(process.cwd(), 'db_export.json'), JSON.stringify(data, null, 2));
  return data;
}

export default db; 