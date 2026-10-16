import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BriefcaseBusiness, Users, Plus, Search, Pencil, Trash2, ArrowLeft, Save, Building2, ChevronRight, RefreshCcw } from 'lucide-react';

const MODULOS = {
  empleados: {
    titulo: 'Empleados', singular: 'empleado', id: 'IdEmpleado', subtitulo: 'Organiza y administra los registros de tu equipo.',
    campos: [
      ['Nombre', 'Nombre', 'text', 50], ['Apellido', 'Apellido', 'text', 50],
      ['Documento', 'Documento / DPI', 'text', 25], ['Puesto', 'Puesto de trabajo', 'text', 80],
      ['Departamento', 'Departamento', 'text', 80], ['Correo', 'Correo electrónico', 'email', 120],
      ['Telefono', 'Teléfono', 'tel', 25]
    ],
    columnas: ['Nombre', 'Apellido', 'Documento', 'Puesto', 'Departamento', 'Correo']
  },
  clientes: {
    titulo: 'Clientes', singular: 'cliente', id: 'IdCliente', subtitulo: 'Consulta y gestiona tu cartera de clientes.',
    campos: [
      ['Nombre', 'Nombre', 'text', 50], ['Apellido', 'Apellido', 'text', 50],
      ['Correo', 'Correo electrónico', 'email', 120], ['Telefono', 'Teléfono', 'tel', 25],
      ['Empresa', 'Empresa', 'text', 100]
    ],
    columnas: ['Nombre', 'Apellido', 'Correo', 'Telefono', 'Empresa']
  }
};

async function api(ruta, opciones) {
  let response;
  try { response = await fetch(`/api/${ruta}`, opciones); }
  catch { throw new Error('No se pudo conectar con el backend. Verifica que Express esté ejecutándose.'); }
  const tipo = response.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) throw new Error('La API no devolvió JSON. Comprueba la configuración del servidor.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.mensaje || 'La operación no pudo completarse.');
  return data;
}

function Listado({ modulo }) {
  const cfg = MODULOS[modulo];
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async (signal) => {
    setCargando(true); setError('');
    try {
      const data = await api(modulo, signal ? { signal } : undefined);
      setRegistros(data);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally { if (!signal?.aborted) setCargando(false); }
  }, [modulo]);

  useEffect(() => {
    const controlador = new AbortController();
    cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  const filtrados = useMemo(() => registros.filter(r =>
    cfg.columnas.some(c => String(r[c] ?? '').toLowerCase().includes(busqueda.toLowerCase().trim()))
  ), [registros, busqueda, cfg]);

  const eliminar = async (registro) => {
    if (!window.confirm(`¿Eliminar a ${registro.Nombre} ${registro.Apellido}? Esta acción no se puede deshacer.`)) return;
    setAviso('');
    try {
      await api(`${modulo}/${registro[cfg.id]}`, { method: 'DELETE' });
      setRegistros(actual => actual.filter(r => r[cfg.id] !== registro[cfg.id]));
      setAviso('Registro eliminado correctamente.');
    } catch (e) { setError(e.message); }
  };

  return <section className="screen">
    <div className="page-heading">
      <div><span className="kicker">DIRECTORIO / {cfg.titulo.toUpperCase()}</span><h1>{cfg.titulo}</h1><p>{cfg.subtitulo}</p></div>
      <button className="btn primary" onClick={() => navigate(`/${modulo}/nuevo`)}><Plus size={18}/> Nuevo {cfg.singular}</button>
    </div>
    <div className="metrics-row">
      <div className="metric"><span className="metric-icon"><Users size={21}/></span><div><div className="metric-label">Total de {modulo}</div><div className="metric-value">{registros.length}</div></div></div>
      <div className="metric"><span className="metric-icon soft"><Building2 size={21}/></span><div><div className="metric-label">Resultados visibles</div><div className="metric-value">{filtrados.length}</div></div></div>
    </div>
    <div className="panel">
      <div className="panel-header"><div><h2>Listado de {modulo}</h2><p>Información actualizada de los registros</p></div><button className="icon-btn" title="Actualizar listado" onClick={() => cargar()}><RefreshCcw size={18}/></button></div>
      <div className="toolbar"><label className="search"><Search size={18}/><input placeholder={`Buscar ${modulo}...`} value={busqueda} onChange={e => setBusqueda(e.target.value)}/></label><span className="record-count">{filtrados.length} registros</span></div>
      {aviso && <div className="notice success" role="status">{aviso}</div>}
      {error && <div className="notice error" role="alert">{error} <button onClick={() => cargar()}>Reintentar</button></div>}
      {cargando ? <div className="empty">Cargando información...</div> : <div className="table-scroll"><table><thead><tr><th>ID</th>{cfg.columnas.map(c => <th key={c}>{c}</th>)}<th>Acciones</th></tr></thead><tbody>
        {filtrados.map(r => <tr key={r[cfg.id]}><td className="id-cell">#{r[cfg.id]}</td>{cfg.columnas.map(c => <td key={c}>{c === 'Nombre' ? <span className="person"><span className="avatar">{r.Nombre?.[0]}{r.Apellido?.[0]}</span><strong>{r[c]}</strong></span> : r[c]}</td>)}<td><div className="actions"><button className="action edit" title="Editar" onClick={() => navigate(`/${modulo}/editar/${r[cfg.id]}`)}><Pencil size={16}/></button><button className="action delete" title="Eliminar" onClick={() => eliminar(r)}><Trash2 size={16}/></button></div></td></tr>)}
        {filtrados.length === 0 && <tr><td colSpan={cfg.columnas.length + 2} className="empty">{error ? 'No se pudo cargar el listado.' : 'No hay registros que mostrar.'}</td></tr>}
      </tbody></table></div>}
      <div className="panel-footer">Mostrando {filtrados.length} de {registros.length} registros</div>
    </div>
  </section>;
}

function Formulario({ modulo }) {
  const cfg = MODULOS[modulo];
  const { id } = useParams();
  const editar = Boolean(id);
  const navigate = useNavigate();
  const [datos, setDatos] = useState(Object.fromEntries(cfg.campos.map(c => [c[0], ''])));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(editar);

  useEffect(() => {
    if (!editar) return;
    const controlador = new AbortController();
    api(modulo, { signal: controlador.signal })
      .then(lista => {
        const encontrado = lista.find(r => String(r[cfg.id]) === id);
        if (!encontrado) throw new Error('El registro no existe.');
        setDatos(Object.fromEntries(cfg.campos.map(c => [c[0], encontrado[c[0]] ?? ''])));
      })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [modulo, id, editar, cfg]);

  const guardar = async e => {
    e.preventDefault(); setError(''); setGuardando(true);
    try {
      await api(`${modulo}${editar ? `/${id}` : ''}`, {
        method: editar ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, String(v).trim()])))
      });
      navigate(`/${modulo}`);
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  return <section className="screen form-screen">
    <button className="back-link" onClick={() => navigate(`/${modulo}`)}><ArrowLeft size={18}/> Volver al listado</button>
    <div className="page-heading"><div><span className="kicker">{cfg.titulo.toUpperCase()} / {editar ? 'EDITAR' : 'NUEVO REGISTRO'}</span><h1>{editar ? `Editar ${cfg.singular}` : `Registrar ${cfg.singular}`}</h1><p>Completa la información para {editar ? 'actualizar' : 'crear'} el registro.</p></div></div>
    <div className="panel form-panel"><div className="panel-header"><div><h2>Información {modulo === 'empleados' ? 'laboral y personal' : 'del cliente'}</h2><p>Todos los campos son obligatorios</p></div></div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {cargando ? <div className="empty">Cargando registro...</div> : <form onSubmit={guardar}>
        <div className="form-grid">{cfg.campos.map(([campo, etiqueta, tipo, max]) => <label className="field" key={campo}><span>{etiqueta}</span><input type={tipo} maxLength={max} required value={datos[campo]} onChange={e => setDatos(a => ({ ...a, [campo]: e.target.value }))} placeholder={`Ingresa ${etiqueta.toLowerCase()}`}/></label>)}</div>
        <div className="form-actions"><button type="button" className="btn outline" onClick={() => navigate(`/${modulo}`)}>Cancelar</button><button className="btn primary" disabled={guardando}><Save size={18}/>{guardando ? 'Guardando...' : editar ? 'Guardar cambios' : `Guardar ${cfg.singular}`}</button></div>
      </form>}
    </div>
  </section>;
}

function App() {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><div className="logo-icon"><BriefcaseBusiness size={22}/></div><div><strong>GestiónPro</strong><small>Panel administrativo</small></div></div>
      <div className="side-section">GESTIÓN</div>
      <nav><NavLink to="/empleados" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><BriefcaseBusiness size={19}/> Empleados <ChevronRight size={16} className="nav-arrow"/></NavLink><NavLink to="/clientes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Users size={19}/> Clientes <ChevronRight size={16} className="nav-arrow"/></NavLink></nav>
      <div className="sidebar-bottom"><div className="status-dot"/> Sistema de registros <small>React + Express + SQL Server</small></div>
    </aside>
    <div className="content-shell"><header className="topbar"><span>Administración general</span><div className="top-profile"><span className="online-dot"/> Sistema activo <div className="user-badge">AD</div></div></header><main className="main-content"><Routes><Route path="/" element={<Navigate to="/empleados" replace/>}/><Route path="/empleados" element={<Listado modulo="empleados"/>}/><Route path="/clientes" element={<Listado modulo="clientes"/>}/><Route path="/empleados/nuevo" element={<Formulario modulo="empleados"/>}/><Route path="/clientes/nuevo" element={<Formulario modulo="clientes"/>}/><Route path="/empleados/editar/:id" element={<Formulario modulo="empleados"/>}/><Route path="/clientes/editar/:id" element={<Formulario modulo="clientes"/>}/><Route path="*" element={<Navigate to="/empleados" replace/>}/></Routes></main></div>
  </div>;
}

export default App;
