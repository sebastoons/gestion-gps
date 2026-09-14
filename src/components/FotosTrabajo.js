import React, { useState, useRef } from 'react';
import { Home, Plus, Trash2, Search, Camera, X, Eye } from 'lucide-react';
import { deleteFromTable, nextFotoTrabajoId, subirFotoTrabajo, eliminarFotoTrabajo, MAX_FOTO_BYTES } from '../lib/supabase';
import { formatFecha } from '../utils/dateUtils';
import '../styles/FotosTrabajo.css';

const SERVICIOS = ['Instalación', 'Desinstalación', 'Mantención', 'Reinstalación', 'Visita Fallida'];
const MAX_FOTOS = 4;

const VACIO = {
  fecha: '', servicio: 'Instalación', ppu: '', marca: '', modelo: '', anio: '',
  cliente: '', ubicacion: '', observaciones: '', fotosVehiculo: [], fotosGps: [],
};

// ── Carga de fotos: hasta 4 por sección, 5MB c/u, sube a Supabase Storage ────
const FotosUpload = ({ fotos, onChange, onUploadingChange, carpeta }) => {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef(null);

  const marcarSubiendo = (v) => { setSubiendo(v); if (onUploadingChange) onUploadingChange(v); };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!files.length) return;
    const cupo = MAX_FOTOS - fotos.length;
    const aSubir = files.slice(0, Math.max(0, cupo));
    if (files.length > aSubir.length) {
      alert(`Sólo se pueden agregar hasta ${MAX_FOTOS} fotos por sección — se ignoraron las que sobraban.`);
    }
    marcarSubiendo(true);
    try {
      for (const file of aSubir) {
        if (file.size > MAX_FOTO_BYTES) {
          alert(`"${file.name}" pesa más de 5MB — elige una foto más liviana.`);
          continue;
        }
        try {
          const url = await subirFotoTrabajo(file, carpeta);
          onChange(prev => [...prev, url]);
        } catch (err) {
          console.error('subir foto trabajo:', err);
          alert(`No se pudo subir "${file.name}". Verifica tu conexión e intenta de nuevo.`);
        }
      }
    } finally {
      marcarSubiendo(false);
    }
  };

  const quitarFoto = (url) => {
    onChange(prev => prev.filter(f => f !== url));
    eliminarFotoTrabajo(url);
  };

  return (
    <div className="ft-fotos-grid">
      {fotos.map(url => (
        <div key={url} className="ft-foto-slot">
          <img src={url} alt="Foto" />
          <button type="button" className="ft-foto-remove" onClick={() => quitarFoto(url)} title="Quitar foto"><X size={12}/></button>
        </div>
      ))}
      {subiendo && <div className="ft-foto-uploading">Subiendo...</div>}
      {fotos.length < MAX_FOTOS && !subiendo && (
        <button type="button" className="ft-foto-add" onClick={() => inputRef.current?.click()}>
          <Camera size={18}/> Agregar foto
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple
        style={{display:'none'}} onChange={handleFiles}/>
    </div>
  );
};

const FotosTrabajo = ({ setCurrentView, registros, setRegistros, empresas, empresaSeleccionada, setEmpresaSeleccionada, pendientes, setPendientes }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ ...VACIO, fecha: new Date().toISOString().split('T')[0] });
  const [verItem, setVerItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subiendoVehiculo, setSubiendoVehiculo] = useState(false);
  const [subiendoGps, setSubiendoGps] = useState(false);

  const registrosEmpresa = (registros || []).filter(r => r.empresa === empresaSeleccionada);
  const registrosFiltrados = registrosEmpresa.filter(r =>
    (r.ppu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => setFormData({ ...VACIO, fecha: new Date().toISOString().split('T')[0] });

  const abrirNuevo = () => {
    resetForm();
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...VACIO, ...item });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.ppu?.trim() || !formData.fecha) {
      alert('Por favor completa los campos obligatorios (PPU y Fecha)');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        setRegistros(prev => prev.map(r => r.id === editingItem.id ? { ...formData, id: editingItem.id } : r));
      } else {
        // Contador atómico (igual que trabajos/clientes/equipos): evita que
        // dos dispositivos agregando registros casi al mismo tiempo, o
        // borrar uno y agregar otro, terminen con el mismo id.
        const newId = await nextFotoTrabajoId(registros || []);
        setRegistros(prev => [...(prev || []), { ...formData, ppu: formData.ppu.toUpperCase(), id: newId, empresa: empresaSeleccionada, createdAt: new Date().toISOString() }]);
      }
      setShowForm(false);
      setEditingItem(null);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const item = (registros || []).find(r => r.id === deleteId);
    setRegistros(prev => prev.filter(r => r.id !== deleteId));
    deleteFromTable('fotos_trabajo', deleteId);
    // Limpia también los archivos del bucket — no bloquea el borrado del
    // registro si alguna falla (best-effort, ver eliminarFotoTrabajo).
    if (item) [...(item.fotosVehiculo||[]), ...(item.fotosGps||[])].forEach(eliminarFotoTrabajo);
    setDeleteId(null);
  };

  // Registros fotográficos que quedaron pendientes desde Validación WhatsApp
  // (uno por cada vehículo validado, se van acumulando hasta que el usuario
  // los llena o los descarta acá).
  const llenarPendiente = (item) => {
    if (item.empresa && item.empresa !== empresaSeleccionada) setEmpresaSeleccionada(item.empresa);
    setEditingItem(null);
    setFormData({
      ...VACIO,
      fecha: item.fecha || new Date().toISOString().split('T')[0],
      servicio: SERVICIOS.includes(item.servicio) ? item.servicio : 'Instalación',
      ppu: item.ppu || '', marca: item.marca || '', modelo: item.modelo || '',
      anio: item.anio || '', cliente: item.cliente || '', ubicacion: item.ubicacion || '',
    });
    setShowForm(true);
    if (setPendientes) setPendientes(prev => prev.filter(p => p.id !== item.id));
    // El efecto de sync de App.js sólo hace upsert de lo que queda en el
    // array — sin este borrado explícito, el pendiente resuelto seguiría
    // en la tabla remota y reaparecería en cualquier otro dispositivo (o
    // al recargar) aunque ya se haya sacado de la lista local.
    deleteFromTable('fotos_pendientes', item.id);
  };

  const descartarPendiente = (item) => {
    if (setPendientes) setPendientes(prev => prev.filter(p => p.id !== item.id));
    deleteFromTable('fotos_pendientes', item.id);
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Registro Fotográfico</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          {pendientes && pendientes.map(item => (
            <div key={item.id} className="ft-banner-pendiente">
              <span>
                📷 ¿Llenar fotos de {item.servicio} — {item.empresa} | {item.ppu || 'Sin PPU'} | {item.cliente || ''}?
              </span>
              <button className="btn btn-purple" onClick={() => llenarPendiente(item)}>Llenar ✓</button>
              <button className="btn btn-secondary" onClick={() => descartarPendiente(item)}>✕</button>
            </div>
          ))}

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select value={empresaSeleccionada} onChange={e => setEmpresaSeleccionada(e.target.value)} className="form-select">
                {(empresas || []).map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar por PPU o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button onClick={abrirNuevo} className="btn btn-purple">
              <Plus size={20} /> Agregar Registro
            </button>
          </div>

          {showForm && (
            <div className="form-container purple">
              <h3 className="form-title">{editingItem ? 'Editar Registro' : 'Nuevo Registro'}</h3>
              <div className="form-grid three-cols">
                <div>
                  <label className="filter-label">PPU *</label>
                  <input className="form-input" value={formData.ppu} onChange={e => setFormData({...formData, ppu: e.target.value.toUpperCase()})} placeholder="Ej: ABCD12" />
                </div>
                <div>
                  <label className="filter-label">Fecha *</label>
                  <input type="date" className="form-input" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                </div>
                <div>
                  <label className="filter-label">Servicio</label>
                  <select className="form-select" value={formData.servicio} onChange={e => setFormData({...formData, servicio: e.target.value})}>
                    {SERVICIOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="filter-label">Marca</label>
                  <input className="form-input" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
                </div>
                <div>
                  <label className="filter-label">Modelo</label>
                  <input className="form-input" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                </div>
                <div>
                  <label className="filter-label">Año</label>
                  <input className="form-input" value={formData.anio} onChange={e => setFormData({...formData, anio: e.target.value})} />
                </div>
                <div>
                  <label className="filter-label">Cliente</label>
                  <input className="form-input" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="filter-label">Dónde fue instalado (dirección, comuna, etc.)</label>
                  <input className="form-input" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label className="filter-label">Fotos del Vehículo (máx. {MAX_FOTOS}, 5MB c/u)</label>
                <FotosUpload fotos={formData.fotosVehiculo} carpeta="vehiculo"
                  onChange={upd => setFormData(f => ({...f, fotosVehiculo: typeof upd === 'function' ? upd(f.fotosVehiculo) : upd}))}
                  onUploadingChange={setSubiendoVehiculo} />
              </div>

              <div style={{ marginTop: 14 }}>
                <label className="filter-label">Fotos del GPS (máx. {MAX_FOTOS}, 5MB c/u)</label>
                <FotosUpload fotos={formData.fotosGps} carpeta="gps"
                  onChange={upd => setFormData(f => ({...f, fotosGps: typeof upd === 'function' ? upd(f.fotosGps) : upd}))}
                  onUploadingChange={setSubiendoGps} />
              </div>

              <div style={{ marginTop: 14 }}>
                <label className="filter-label">Observaciones</label>
                <textarea className="form-input" rows={2} value={formData.observaciones}
                  onChange={e => setFormData({...formData, observaciones: e.target.value})} style={{ resize: 'vertical' }} />
              </div>

              <div className="form-actions">
                <button onClick={handleSubmit} className="btn btn-purple" disabled={saving || subiendoVehiculo || subiendoGps}>
                  {saving ? 'Guardando...' : (subiendoVehiculo || subiendoGps) ? 'Esperando fotos...' : (editingItem ? 'Actualizar' : 'Guardar')}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem', fontSize: '0.55em', color: '#6b7280', fontFamily: 'Quantico', textTransform: 'uppercase' }}>
            Mostrando {registrosFiltrados.length} de {registrosEmpresa.length} registros — {empresaSeleccionada}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead className="purple">
                <tr>
                  <th>ID</th><th>PPU</th><th>Cliente</th><th>Fecha</th><th>Servicio</th>
                  <th className="center">Fotos</th><th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">
                    {searchTerm ? 'No se encontraron registros con ese criterio de búsqueda' : 'No hay registros fotográficos'}
                  </td></tr>
                ) : (
                  registrosFiltrados.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="text-bold">{item.ppu || '-'}</td>
                      <td>{item.cliente || '-'}</td>
                      <td>{formatFecha(item.fecha)}</td>
                      <td>{item.servicio}</td>
                      <td className="center">{(item.fotosVehiculo?.length || 0) + (item.fotosGps?.length || 0)}</td>
                      <td className="center">
                        <div className="table-actions">
                          <button onClick={() => setVerItem(item)} className="action-btn edit" title="Ver fotos"><Eye size={18} /></button>
                          <button onClick={() => handleEdit(item)} className="action-btn edit" title="Editar">✎</button>
                          <button onClick={() => setDeleteId(item.id)} className="action-btn delete" title="Eliminar"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {verItem && (
        <div className="modal-overlay" onClick={() => setVerItem(null)}>
          <div className="ft-detalle-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'Changa', fontWeight: 'bold', textTransform: 'uppercase' }}>{verItem.ppu} — {verItem.cliente || 'Sin cliente'}</span>
              <button onClick={() => setVerItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20}/></button>
            </div>
            <p className="ft-detalle-info">
              {formatFecha(verItem.fecha)} · {verItem.servicio} · {[verItem.marca, verItem.modelo, verItem.anio].filter(Boolean).join(' ')}
              {verItem.ubicacion ? ` · ${verItem.ubicacion}` : ''}
            </p>
            {verItem.observaciones && <p className="ft-detalle-info">{verItem.observaciones}</p>}

            <div className="ft-detalle-seccion">Fotos del Vehículo</div>
            {verItem.fotosVehiculo?.length ? (
              <div className="ft-fotos-grid ft-fotos-grid--ver">
                {verItem.fotosVehiculo.map(url => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="ft-foto-slot">
                    <img src={url} alt="Foto vehículo" />
                  </a>
                ))}
              </div>
            ) : <p className="ft-detalle-vacio">Sin fotos</p>}

            <div className="ft-detalle-seccion">Fotos del GPS</div>
            {verItem.fotosGps?.length ? (
              <div className="ft-fotos-grid ft-fotos-grid--ver">
                {verItem.fotosGps.map(url => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="ft-foto-slot">
                    <img src={url} alt="Foto GPS" />
                  </a>
                ))}
              </div>
            ) : <p className="ft-detalle-vacio">Sin fotos</p>}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay"><div className="modal-container">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Eliminación</h3>
            <p className="modal-message">¿Eliminar este registro y sus fotos de forma permanente?</p>
          </div>
          <div className="modal-actions">
            <button onClick={handleDelete} className="btn btn-danger modal-btn">Eliminar</button>
            <button onClick={() => setDeleteId(null)} className="btn btn-secondary modal-btn">Cancelar</button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default FotosTrabajo;
