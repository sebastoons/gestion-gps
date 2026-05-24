import React, { useState } from 'react';
import { Home, Plus, Trash2, Camera, Download, Edit2, X, AlertTriangle, QrCode } from 'lucide-react';
import { deleteFromTable } from '../lib/supabase';
import { exportToCSV } from '../utils/exportUtils';
import BarcodeScanner from './BarcodeScanner';
import '../styles/Scanner.css';

const TIPOS_MATERIAL = [
  'ON BATT','Edata','Dallas','Buzzer','SOS',
  'Inmovilizador 12v','Inmovilizador 24v',
  'GPS Externo','Sensor T°','Sensor Puerta',
];

const TODAY = new Date().toISOString().split('T')[0];

const Materiales = ({
  setCurrentView,
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  materiales, setMateriales,
  empresas, empresaSeleccionada, setEmpresaSeleccionada,
  onOpenScanner,
}) => {
  const [tab, setTab] = useState('materiales');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formN, setFormN] = useState({ fechaRecepcion: TODAY, imei: '', estado: 'disponible', nombreCliente: '' });
  const [formR, setFormR] = useState({ fecha: TODAY, cliente: '', imei: '' });
  const [formMl, setFormMl] = useState({ imei: '', asignado: false, nombreCliente: '' });
  const [formMat, setFormMat] = useState({ tipo: 'ON BATT', serial: '', cantidad: 1, fecha: TODAY });

  const filtN  = equiposNuevos.filter(e => e.empresa === empresaSeleccionada);
  const filtR  = equiposRetirados.filter(e => e.empresa === empresaSeleccionada);
  const filtMl = equiposMalos.filter(e => e.empresa === empresaSeleccionada);
  const filtMat = (materiales || []).filter(m => m.empresa === empresaSeleccionada);

  const pfx = (base) => empresaSeleccionada === 'UGPS' ? `U${base}` : `E${base}`;

  const switchTab = (t) => { setTab(t); setShowForm(false); setEditingId(null); };

  const resetForms = () => {
    setFormN({ fechaRecepcion: TODAY, imei: '', estado: 'disponible', nombreCliente: '' });
    setFormR({ fecha: TODAY, cliente: '', imei: '' });
    setFormMl({ imei: '', asignado: false, nombreCliente: '' });
    setFormMat({ tipo: 'ON BATT', serial: '', cantidad: 1, fecha: TODAY });
  };

  const openAdd = () => { resetForms(); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setEditingId(item.id);
    if (tab === 'nuevos')    setFormN(item);
    if (tab === 'retirados') setFormR(item);
    if (tab === 'malos')     setFormMl(item);
    setShowForm(true);
  };

  const saveNuevo = () => {
    if (!formN.imei || !formN.fechaRecepcion) { alert('IMEI y Fecha son requeridos'); return; }
    if (editingId) {
      setEquiposNuevos(prev => prev.map(e => e.id === editingId ? { ...formN, id: editingId, empresa: empresaSeleccionada } : e));
    } else {
      const id = `${pfx('N')}${String(filtN.length + 1).padStart(3, '0')}`;
      setEquiposNuevos(prev => [...prev, { ...formN, id, empresa: empresaSeleccionada }]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveRetirado = () => {
    if (!formR.imei || !formR.fecha || !formR.cliente) { alert('Completa todos los campos'); return; }
    if (editingId) {
      setEquiposRetirados(prev => prev.map(e => e.id === editingId ? { ...formR, id: editingId, empresa: empresaSeleccionada } : e));
    } else {
      const id = `${pfx('R')}${String(filtR.length + 1).padStart(3, '0')}`;
      setEquiposRetirados(prev => [...prev, { ...formR, id, empresa: empresaSeleccionada }]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveMalo = () => {
    if (!formMl.imei) { alert('IMEI es requerido'); return; }
    if (editingId) {
      setEquiposMalos(prev => prev.map(e => e.id === editingId ? { ...formMl, id: editingId, empresa: empresaSeleccionada } : e));
    } else {
      const id = `${pfx('M')}${String(filtMl.length + 1).padStart(3, '0')}`;
      setEquiposMalos(prev => [...prev, { ...formMl, id, empresa: empresaSeleccionada }]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveMaterial = () => {
    const qty = Math.max(1, parseInt(formMat.cantidad) || 1);
    const base = Date.now();
    setMateriales(prev => [...prev, ...Array.from({ length: qty }, (_, i) => ({
      tipo: formMat.tipo, serial: qty === 1 ? formMat.serial : '',
      fecha: formMat.fecha, id: `MAT${base + i}`, empresa: empresaSeleccionada,
    }))]);
    setShowForm(false);
  };

  const confirmDelete = (id) => setDeleteId(id);
  const handleDelete = () => {
    const tbl = { nuevos:'equipos_nuevos', retirados:'equipos_retirados', malos:'equipos_malos', materiales:'materiales' }[tab];
    deleteFromTable(tbl, deleteId);
    if (tab === 'nuevos')    setEquiposNuevos(prev => prev.filter(e => e.id !== deleteId));
    if (tab === 'retirados') setEquiposRetirados(prev => prev.filter(e => e.id !== deleteId));
    if (tab === 'malos')     setEquiposMalos(prev => prev.filter(e => e.id !== deleteId));
    if (tab === 'materiales') setMateriales(prev => prev.filter(m => m.id !== deleteId));
    setDeleteId(null);
  };

  const handleScan = (scannedImei) => {
    if (tab !== 'materiales') {
      const enNuevos = equiposNuevos.find(e => e.imei === scannedImei && e.empresa === empresaSeleccionada);
      const enRet    = equiposRetirados.find(e => e.imei === scannedImei && e.empresa === empresaSeleccionada);
      const enMalos  = equiposMalos.find(e => e.imei === scannedImei && e.empresa === empresaSeleccionada);
      if (enNuevos || enRet || enMalos) {
        const where = enNuevos ? 'Nuevos' : enRet ? 'Retirados' : 'Malos';
        if (!window.confirm(`⚠️ IMEI ya registrado en ${where}. ¿Usar de todos modos?`)) { setShowScanner(false); return; }
      }
    }
    if (tab === 'nuevos')    setFormN(f => ({ ...f, imei: scannedImei }));
    if (tab === 'retirados') setFormR(f => ({ ...f, imei: scannedImei }));
    if (tab === 'malos')     setFormMl(f => ({ ...f, imei: scannedImei }));
    if (tab === 'materiales') setFormMat(f => ({ ...f, serial: scannedImei }));
    setShowScanner(false);
  };

  const countMat = tipo => filtMat.filter(m => m.tipo === tipo).length;
  const currentData = { nuevos: filtN, retirados: filtR, malos: filtMl, materiales: filtMat }[tab];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Inventario GPS</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select value={empresaSeleccionada}
                onChange={e => { setEmpresaSeleccionada(e.target.value); setShowForm(false); setEditingId(null); }}
                className="form-select">
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
          </div>

          <div className="tab-container">
            <button onClick={() => switchTab('nuevos')}    className={`tab-button ${tab === 'nuevos'    ? 'active green' : ''}`}>Nuevos ({filtN.length})</button>
            <button onClick={() => switchTab('retirados')} className={`tab-button ${tab === 'retirados' ? 'active blue'  : ''}`}>Retirados ({filtR.length})</button>
            <button onClick={() => switchTab('malos')}     className={`tab-button ${tab === 'malos'     ? 'active red'   : ''}`}>Malos ({filtMl.length})</button>
            <button onClick={() => switchTab('materiales')} className={`tab-button ${tab === 'materiales' ? 'active' : ''}`}>Materiales ({filtMat.length})</button>
          </div>

          {tab === 'materiales' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8, marginBottom:16 }}>
              {TIPOS_MATERIAL.map(tipo => (
                <div key={tipo} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Quantico', fontSize:'0.48em', textTransform:'uppercase', color:'#6b7280', marginBottom:4 }}>{tipo}</div>
                  <div style={{ fontFamily:'Changa', fontSize:'1.3em', fontWeight:'bold', color: countMat(tipo) > 0 ? '#16a34a' : '#9ca3af' }}>{countMat(tipo)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="toolbar">
            <button onClick={openAdd} className="btn btn-primary">
              <Plus size={20} /> Agregar
            </button>
            {tab !== 'materiales' && onOpenScanner && (
              <button onClick={onOpenScanner} className="btn btn-secondary">
                <QrCode size={20} /> Escáner GPS
              </button>
            )}
            <button onClick={() => exportToCSV(currentData, `${tab}_${empresaSeleccionada}`)} className="btn btn-success">
              <Download size={20} /> Exportar
            </button>
          </div>

          {/* ── Formulario Nuevos ── */}
          {showForm && tab === 'nuevos' && (
            <div className="form-container">
              <h3 className="form-title">{editingId ? 'Editar' : 'Nuevo'} Equipo GPS</h3>
              <div className="form-grid">
                <input type="date" value={formN.fechaRecepcion} onChange={e => setFormN(f => ({...f, fechaRecepcion: e.target.value}))} className="form-input" />
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input type="text" placeholder="IMEI *" value={formN.imei} onChange={e => setFormN(f => ({...f, imei: e.target.value}))} className="form-input" style={{ flex:1 }} />
                  <button type="button" onClick={() => setShowScanner(true)} className="btn btn-primary" style={{ padding:'0.5rem', minWidth:'auto' }}><Camera size={20}/></button>
                </div>
                <select value={formN.estado} onChange={e => setFormN(f => ({...f, estado: e.target.value, asignado: e.target.value === 'asignado'}))} className="form-select">
                  <option value="disponible">Disponible</option>
                  <option value="asignado">Asignado</option>
                  <option value="perdido">Perdido</option>
                </select>
                {formN.estado === 'asignado' && (
                  <input type="text" placeholder="Nombre del Cliente" value={formN.nombreCliente} onChange={e => setFormN(f => ({...f, nombreCliente: e.target.value}))} className="form-input" />
                )}
              </div>
              <div className="form-actions">
                <button onClick={saveNuevo} className="btn btn-success">{editingId ? 'Actualizar' : 'Guardar'}</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {/* ── Formulario Retirados ── */}
          {showForm && tab === 'retirados' && (
            <div className="form-container blue">
              <h3 className="form-title">{editingId ? 'Editar' : 'Registrar'} Equipo Retirado</h3>
              <div className="form-grid three-cols">
                <input type="date" value={formR.fecha} onChange={e => setFormR(f => ({...f, fecha: e.target.value}))} className="form-input" />
                <input type="text" placeholder="Cliente *" value={formR.cliente} onChange={e => setFormR(f => ({...f, cliente: e.target.value}))} className="form-input" />
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input type="text" placeholder="IMEI *" value={formR.imei} onChange={e => setFormR(f => ({...f, imei: e.target.value}))} className="form-input" style={{ flex:1 }} />
                  <button type="button" onClick={() => setShowScanner(true)} className="btn btn-primary" style={{ padding:'0.5rem', minWidth:'auto' }}><Camera size={20}/></button>
                </div>
              </div>
              <div className="form-actions">
                <button onClick={saveRetirado} className="btn btn-primary">{editingId ? 'Actualizar' : 'Guardar'}</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {/* ── Formulario Malos ── */}
          {showForm && tab === 'malos' && (
            <div className="form-container red">
              <h3 className="form-title">{editingId ? 'Editar' : 'Registrar'} Equipo Malo</h3>
              <div className="form-grid">
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input type="text" placeholder="IMEI *" value={formMl.imei} onChange={e => setFormMl(f => ({...f, imei: e.target.value}))} className="form-input" style={{ flex:1 }} />
                  <button type="button" onClick={() => setShowScanner(true)} className="btn btn-danger" style={{ padding:'0.5rem', minWidth:'auto' }}><Camera size={20}/></button>
                </div>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={formMl.asignado} onChange={e => setFormMl(f => ({...f, asignado: e.target.checked}))} className="checkbox-input" />
                    <span className="checkbox-text">¿Estaba asignado a un cliente?</span>
                  </label>
                </div>
                {formMl.asignado && (
                  <input type="text" placeholder="Nombre del Cliente" value={formMl.nombreCliente} onChange={e => setFormMl(f => ({...f, nombreCliente: e.target.value}))} className="form-input" />
                )}
              </div>
              <div className="form-actions">
                <button onClick={saveMalo} className="btn btn-danger">{editingId ? 'Actualizar' : 'Guardar'}</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {/* ── Formulario Materiales ── */}
          {showForm && tab === 'materiales' && (
            <div className="form-container">
              <h3 className="form-title">Nuevo Material</h3>
              <div className="form-grid three-cols">
                <div>
                  <label className="filter-label">Tipo</label>
                  <select value={formMat.tipo} onChange={e => setFormMat(f => ({...f, tipo: e.target.value}))} className="form-select">
                    {TIPOS_MATERIAL.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="filter-label">Cantidad</label>
                  <input type="number" min="1" max="99" value={formMat.cantidad} onChange={e => setFormMat(f => ({...f, cantidad: e.target.value}))} className="form-input" />
                </div>
                <div>
                  <label className="filter-label">Fecha</label>
                  <input type="date" value={formMat.fecha} onChange={e => setFormMat(f => ({...f, fecha: e.target.value}))} className="form-input" />
                </div>
                {parseInt(formMat.cantidad) === 1 && (
                  <div style={{ gridColumn:'span 3' }}>
                    <label className="filter-label">Serial / Código (opcional)</label>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <input type="text" placeholder="N/A" value={formMat.serial} onChange={e => setFormMat(f => ({...f, serial: e.target.value}))} className="form-input" style={{ flex:1 }} />
                      <button type="button" onClick={() => setShowScanner(true)} className="btn btn-primary" style={{ padding:'0.5rem', minWidth:'auto' }}><Camera size={20}/></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button onClick={saveMaterial} className="btn btn-success">
                  Guardar{parseInt(formMat.cantidad) > 1 ? ` (${formMat.cantidad})` : ''}
                </button>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {/* ── Tabla Nuevos ── */}
          {tab === 'nuevos' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="green"><tr><th>ID</th><th>Fecha</th><th>IMEI</th><th>Cliente</th><th className="center">Acc.</th></tr></thead>
                <tbody>
                  {filtN.length === 0
                    ? <tr><td colSpan="5" className="empty-state">Sin equipos nuevos para {empresaSeleccionada}</td></tr>
                    : filtN.map(e => (
                      <tr key={e.id}>
                        <td>{e.id}</td><td>{e.fechaRecepcion}</td><td className="text-mono">{e.imei}</td><td>{e.nombreCliente||'-'}</td>
                        <td className="center"><div className="table-actions">
                          <button onClick={() => handleEdit(e)} className="action-btn edit"><Edit2 size={18}/></button>
                          <button onClick={() => confirmDelete(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tabla Retirados ── */}
          {tab === 'retirados' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="blue"><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>IMEI</th><th className="center">Acc.</th></tr></thead>
                <tbody>
                  {filtR.length === 0
                    ? <tr><td colSpan="5" className="empty-state">Sin equipos retirados para {empresaSeleccionada}</td></tr>
                    : filtR.map(e => (
                      <tr key={e.id}>
                        <td>{e.id}</td><td>{e.fecha}</td><td>{e.cliente}</td><td className="text-mono">{e.imei}</td>
                        <td className="center"><div className="table-actions">
                          <button onClick={() => handleEdit(e)} className="action-btn edit"><Edit2 size={18}/></button>
                          <button onClick={() => confirmDelete(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tabla Malos ── */}
          {tab === 'malos' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="red"><tr><th>ID</th><th>IMEI</th><th>Cliente</th><th className="center">Acc.</th></tr></thead>
                <tbody>
                  {filtMl.length === 0
                    ? <tr><td colSpan="4" className="empty-state">Sin equipos malos para {empresaSeleccionada}</td></tr>
                    : filtMl.map(e => (
                      <tr key={e.id}>
                        <td>{e.id}</td><td className="text-mono">{e.imei}</td><td>{e.nombreCliente||'-'}</td>
                        <td className="center"><div className="table-actions">
                          <button onClick={() => handleEdit(e)} className="action-btn edit"><Edit2 size={18}/></button>
                          <button onClick={() => confirmDelete(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tabla Materiales ── */}
          {tab === 'materiales' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="green"><tr><th>Tipo</th><th>Serial</th><th>Fecha</th><th className="center">Acc.</th></tr></thead>
                <tbody>
                  {filtMat.length === 0
                    ? <tr><td colSpan="4" className="empty-state">Sin materiales para {empresaSeleccionada}</td></tr>
                    : filtMat.map(m => (
                      <tr key={m.id}>
                        <td>{m.tipo}</td><td className="text-mono">{m.serial||'-'}</td><td>{m.fecha}</td>
                        <td className="center"><div className="table-actions">
                          <button onClick={() => confirmDelete(m.id)} className="action-btn delete"><Trash2 size={18}/></button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showScanner && <BarcodeScanner onScanSuccess={handleScan} onClose={() => setShowScanner(false)} />}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-icon-wrapper warning"><AlertTriangle size={32}/></div>
              <button onClick={() => setDeleteId(null)} className="modal-close-btn"><X size={24}/></button>
            </div>
            <div className="modal-content">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <p className="modal-message">¿Eliminar este elemento?</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleDelete} className="btn btn-danger modal-btn">Eliminar</button>
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary modal-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materiales;
