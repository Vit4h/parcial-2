require('dotenv').config();
const sql = require('mssql');

const database = process.env.DB_NAME || 'RegistroEmpresa';
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'sqlserver',
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
  },
  connectionTimeout: 10000,
  requestTimeout: 30000
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function inicializar() {
  let admin;
  // SQL Server puede tardar en aceptar conexiones después de iniciar el contenedor.
  for (let intento = 1; intento <= 60; intento++) {
    try {
      admin = await new sql.ConnectionPool({ ...config, database: 'master' }).connect();
      break;
    } catch (error) {
      if (intento === 60) throw error;
      console.log(`Esperando SQL Server (${intento}/60)...`);
      await sleep(3000);
    }
  }

  try {
    await admin.request().query(`IF DB_ID('RegistroEmpresa') IS NULL CREATE DATABASE [RegistroEmpresa]`);
  } finally {
    await admin.close();
  }

  const pool = await new sql.ConnectionPool({ ...config, database }).connect();
  try {
    await pool.request().query(`
      IF OBJECT_ID('dbo.Empleados', 'U') IS NULL
      CREATE TABLE dbo.Empleados (
        IdEmpleado INT IDENTITY(1,1) PRIMARY KEY,
        Nombre VARCHAR(50) NOT NULL,
        Apellido VARCHAR(50) NOT NULL,
        Documento VARCHAR(25) NOT NULL UNIQUE,
        Puesto VARCHAR(80) NOT NULL,
        Departamento VARCHAR(80) NOT NULL,
        Correo VARCHAR(120) NOT NULL,
        Telefono VARCHAR(25) NOT NULL
      );
    `);
    await pool.request().query(`
      IF OBJECT_ID('dbo.Clientes', 'U') IS NULL
      CREATE TABLE dbo.Clientes (
        IdCliente INT IDENTITY(1,1) PRIMARY KEY,
        Nombre VARCHAR(50) NOT NULL,
        Apellido VARCHAR(50) NOT NULL,
        Correo VARCHAR(120) NOT NULL,
        Telefono VARCHAR(25) NOT NULL,
        Empresa VARCHAR(100) NOT NULL
      );
    `);
    console.log('Conexión y tablas de SQL Server listas');
    return pool;
  } catch (error) {
    await pool.close();
    throw error;
  }
}

const poolPromise = inicializar();
module.exports = { sql, poolPromise };
