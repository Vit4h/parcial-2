const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// Configuración explícita: nombres de tablas, columnas y tipos no provienen del usuario.
const recursos = {
  empleados: {
    tabla: 'Empleados', id: 'IdEmpleado',
    campos: {
      Nombre: { tipo: sql.VarChar(50), max: 50 },
      Apellido: { tipo: sql.VarChar(50), max: 50 },
      Documento: { tipo: sql.VarChar(25), max: 25 },
      Puesto: { tipo: sql.VarChar(80), max: 80 },
      Departamento: { tipo: sql.VarChar(80), max: 80 },
      Correo: { tipo: sql.VarChar(120), max: 120 },
      Telefono: { tipo: sql.VarChar(25), max: 25 }
    }
  },
  clientes: {
    tabla: 'Clientes', id: 'IdCliente',
    campos: {
      Nombre: { tipo: sql.VarChar(50), max: 50 },
      Apellido: { tipo: sql.VarChar(50), max: 50 },
      Correo: { tipo: sql.VarChar(120), max: 120 },
      Telefono: { tipo: sql.VarChar(25), max: 25 },
      Empresa: { tipo: sql.VarChar(100), max: 100 }
    }
  }
};

function validar(registro, definicion) {
  if (!registro || typeof registro !== 'object' || Array.isArray(registro)) return 'Debes proporcionar un registro válido.';
  for (const [campo, config] of Object.entries(definicion.campos)) {
    if (typeof registro[campo] !== 'string' || !registro[campo].trim()) return `El campo ${campo} es obligatorio.`;
    if (registro[campo].trim().length > config.max) return `${campo} debe tener como máximo ${config.max} caracteres.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registro.Correo.trim())) return 'El correo electrónico no es válido.';
  return null;
}

function crearSolicitud(pool, definicion, datos, id) {
  const request = pool.request();
  if (id !== undefined) request.input('id', sql.Int, id);
  for (const [campo, config] of Object.entries(definicion.campos)) {
    request.input(campo, config.tipo, datos[campo].trim());
  }
  return request;
}

function manejarError(error, res) {
  console.error('Error SQL:', error);
  if (error.number === 2627 || error.number === 2601) {
    return res.status(409).json({ mensaje: 'Ya existe un registro con ese documento o correo.' });
  }
  return res.status(500).json({ mensaje: 'Ocurrió un error al consultar la base de datos.' });
}

app.get('/api/health', (_req, res) => res.json({ estado: 'ok' }));

app.param('recurso', (req, res, next, recurso) => {
  if (!Object.hasOwn(recursos, recurso)) return res.status(404).json({ mensaje: 'Recurso no encontrado.' });
  req.definicion = recursos[recurso];
  next();
});

app.get('/api/:recurso', async (req, res) => {
  try {
    const { tabla, id, campos } = req.definicion;
    const pool = await poolPromise;
    const resultado = await pool.request().query(`SELECT ${[id, ...Object.keys(campos)].join(', ')} FROM ${tabla} ORDER BY ${id} DESC`);
    res.json(resultado.recordset);
  } catch (error) { manejarError(error, res); }
});

app.post('/api/:recurso', async (req, res) => {
  const definicion = req.definicion;
  const error = validar(req.body, definicion);
  if (error) return res.status(400).json({ mensaje: error });
  try {
    const pool = await poolPromise;
    const columnas = Object.keys(definicion.campos);
    const valores = columnas.map(columna => `@${columna}`);
    const request = crearSolicitud(pool, definicion, req.body);
    const resultado = await request.query(`INSERT INTO ${definicion.tabla} (${columnas.join(', ')}) OUTPUT INSERTED.${definicion.id} VALUES (${valores.join(', ')})`);
    res.status(201).json({ mensaje: 'Registro creado correctamente.', id: resultado.recordset[0][definicion.id] });
  } catch (error) { manejarError(error, res); }
});

app.put('/api/:recurso/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) return res.status(400).json({ mensaje: 'ID inválido.' });
  const definicion = req.definicion;
  const error = validar(req.body, definicion);
  if (error) return res.status(400).json({ mensaje: error });
  try {
    const pool = await poolPromise;
    const cambios = Object.keys(definicion.campos).map(campo => `${campo} = @${campo}`).join(', ');
    const request = crearSolicitud(pool, definicion, req.body, id);
    const resultado = await request.query(`UPDATE ${definicion.tabla} SET ${cambios} WHERE ${definicion.id} = @id`);
    if (!resultado.rowsAffected[0]) return res.status(404).json({ mensaje: 'Registro no encontrado.' });
    res.json({ mensaje: 'Registro actualizado correctamente.' });
  } catch (error) { manejarError(error, res); }
});

app.delete('/api/:recurso/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) return res.status(400).json({ mensaje: 'ID inválido.' });
  try {
    const definicion = req.definicion;
    const pool = await poolPromise;
    const resultado = await pool.request().input('id', sql.Int, id)
      .query(`DELETE FROM ${definicion.tabla} WHERE ${definicion.id} = @id`);
    if (!resultado.rowsAffected[0]) return res.status(404).json({ mensaje: 'Registro no encontrado.' });
    res.json({ mensaje: 'Registro eliminado correctamente.' });
  } catch (error) { manejarError(error, res); }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`API disponible en http://localhost:${PORT}`));
