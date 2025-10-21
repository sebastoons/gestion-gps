import React, { useState } from 'react';
import { Download, Plus, Edit2, Trash2, Home, Camera, X, AlertTriangle } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import BarcodeScanner from './BarcodeScanner';
import '../styles/Scanner.css';

const Equipos = ({ 
  setCurrentView,
  equiposNuevos,
  setEquiposNuevos,
  equiposRetirados,
  setEquiposRetirados,
  equiposMalos,
  setEquiposMalos,
  empresas,
  empresaSeleccionada,
  setEmpresaSeleccionada
}) => {
  const [equipoView, setEquipoView] = useState('nuevos');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formDataEquipo, setFormDataEquipo] = useState({
    id: '',
    fechaRecepcion: '',
    imei: '',
    asignado: false,
    nombreCliente: '',
    estado: 'disponible',
    empresa: empresaSeleccionada
  });

  const [formDataRetirado, setFormDataRetirado] = useState({
    id: '',
    fecha: '',
    cliente: '',
    imei: '',
    empresa: empresaSeleccionada
  });

  const [formDataMalo, setFormDataMalo] = useState({
    id: '',
    imei: '',
    asignado: false,
    nombreCliente: '',
    empresa: empresaSeleccionada
  });

  const getEquiposByView = () => {
    let equipos = [];
    switch(equipoView) {
      case 'nuevos': 
        equipos = equiposNuevos;
        break;
      case 'retirados': 
        equipos = equiposRetirados;
        break;
      case 'malos': 
        equipos = equiposMalos;
        break;
      default: 
        equipos = [];
    }
    return equipos.filter(e => e.empresa === empresaSeleccionada);
  };

  const handleScanSuccess = (scannedImei) => {
    const existeEnNuevos = equiposNuevos.find(
      e => e.imei === scannedImei && e.empresa === empresaSeleccionada
    );
    const existeEnRetirados = equiposRetirados.find(
      e => e.imei === scannedImei && e.empresa === empresaSeleccionada
    );
    const existeEnMalos = equiposMalos.find(
      e => e.imei === scannedImei && e.empresa === empresaSeleccionada
    );
    
    let mensaje = '';
    let ubicacion = '';
    
    if (existeEnNuevos) {
      ubicacion = 'Equipos Nuevos';
      mensaje = `⚠️ IMEI DUPLICADO EN ${empresaSeleccionada.toUpperCase()}\n\nEste IMEI ya está registrado en "${ubicacion}":\n\nID: ${existeEnNuevos.id}\nIMEI: ${existeEnNuevos.imei}\nEmpresa: ${existeEnNuevos.empresa}\nEstado: ${existeEnNuevos.estado || 'N/A'}\nCliente: ${existeEnNuevos.nombreCliente || 'Sin asignar'}\n\n¿Deseas usarlo de todos modos?`;
    } else if (existeEnRetirados) {
      ubicacion = 'Equipos Retirados';
      mensaje = `⚠️ IMEI DUPLICADO EN ${empresaSeleccionada.toUpperCase()}\n\nEste IMEI ya está registrado en "${ubicacion}":\n\nID: ${existeEnRetirados.id}\nIMEI: ${existeEnRetirados.imei}\nEmpresa: ${existeEnRetirados.empresa}\nCliente: ${existeEnRetirados.cliente}\nFecha: ${existeEnRetirados.fecha}\n\n¿Deseas usarlo de todos modos?`;
    } else if (existeEnMalos) {
      ubicacion = 'Equipos Malos';
      mensaje = `⚠️ IMEI DUPLICADO EN ${empresaSeleccionada.toUpperCase()}\n\nEste IMEI ya está registrado en "${ubicacion}":\n\nID: ${existeEnMalos.id}\nIMEI: ${existeEnMalos.imei}\nEmpresa: ${existeEnMalos.empresa}\nCliente: ${existeEnMalos.nombreCliente || 'Sin asignar'}\n\n¿Deseas usarlo de todos modos?`;
    }
    
    if (mensaje) {
      if (!window.confirm(mensaje)) {
        setShowScanner(false);
        return;
      }
    }
    
    if (equipoView === 'nuevos') {
      setFormDataEquipo({...formDataEquipo, imei: scannedImei});
    } else if (equipoView === 'retirados') {
      setFormDataRetirado({...formDataRetirado, imei: scannedImei});
    } else if (equipoView === 'malos') {
      setFormDataMalo({...formDataMalo, imei: scannedImei});
    }
    setShowScanner(false);
  };

  const handleSubmitNuevo = () => {
    if (!formDataEquipo.imei || !formDataEquipo.fechaRecepcion) {
      alert('Por favor completa los campos obligatorios (IMEI y Fecha)');
      return;
    }

    if (editingItem) {
      setEquiposNuevos(equiposNuevos.map(e => e.id === editingItem.id ? { ...formDataEquipo, id: editingItem.id } : e));
      setEditingItem(null);
    } else {
      const prefix = empresaSeleccionada === 'Location World' ? 'ELW' : 'EU';
      const count = equiposNuevos.filter(e => e.empresa === empresaSeleccionada).length + 1;
      const newId = `${prefix}${String(count).padStart(3, '0')}`;
      setEquiposNuevos([...equiposNuevos, { ...formDataEquipo, id: newId, empresa: empresaSeleccionada }]);
    }
    setShowForm(false);
    setFormDataEquipo({
      id: '', fechaRecepcion: '', imei: '', asignado: false, nombreCliente: '', estado: 'disponible', empresa: empresaSeleccionada
    });
  };

  const handleSubmitRetirado = () => {
    if (!formDataRetirado.imei || !formDataRetirado.fecha || !formDataRetirado.cliente) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (editingItem) {
      setEquiposRetirados(equiposRetirados.map(e => e.id === editingItem.id ? { ...formDataRetirado, id: editingItem.id } : e));
      setEditingItem(null);
    } else {
      const prefix = empresaSeleccionada === 'Location World' ? 'RLW' : 'RU';
      const count = equiposRetirados.filter(e => e.empresa === empresaSeleccionada).length + 1;
      const newId = `${prefix}${String(count).padStart(3, '0')}`;
      setEquiposRetirados([...equiposRetirados, { ...formDataRetirado, id: newId, empresa: empresaSeleccionada }]);
    }
    setShowForm(false);
    setFormDataRetirado({ id: '', fecha: '', cliente: '', imei: '', empresa: empresaSeleccionada });
  };

  const handleSubmitMalo = () => {
    if (!formDataMalo.imei) {
      alert('Por favor ingresa el IMEI del equipo');
      return;
    }

    if (editingItem) {
      setEquiposMalos(equiposMalos.map(e => e.id === editingItem.id ? { ...formDataMalo, id: editingItem.id } : e));
      setEditingItem(null);
    } else {
      const prefix = empresaSeleccionada === 'Location World' ? 'MLW' : 'MU';
      const count = equiposMalos.filter(e => e.empresa === empresaSeleccionada).length + 1;
      const newId = `${prefix}${String(count).padStart(3, '0')}`;
      setEquiposMalos([...equiposMalos, { ...formDataMalo, id: newId, empresa: empresaSeleccionada }]);
    }
    setShowForm(false);
    setFormDataMalo({ id: '', imei: '', asignado: false, nombreCliente: '', empresa: empresaSeleccionada });
  };

  const handleEdit = (equipo) => {
    setEditingItem(equipo);
    if (equipoView === 'nuevos') setFormDataEquipo(equipo);
    if (equipoView === 'retirados') setFormDataRetirado(equipo);
    if (equipoView === 'malos') setFormDataMalo(equipo);
    setShowForm(true);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (equipoView === 'nuevos') setEquiposNuevos(equiposNuevos.filter(e => e.id !== itemToDelete));
    if (equipoView === 'retirados') setEquiposRetirados(equiposRetirados.filter(e => e.id !== itemToDelete));
    if (equipoView === 'malos') setEquiposMalos(equiposMalos.filter(e => e.id !== itemToDelete));
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'disponible': return 'green';
      case 'asignado': return 'orange';
      case 'perdido': return 'red';
      default: return 'gray';
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'disponible': return 'Disponible';
      case 'asignado': return 'Asignado';
      case 'perdido': return 'Perdido';
      default: return estado;
    }
  };

  const currentData = getEquiposByView();

  const contarEquiposPorEmpresa = (tipo) => {
    let equipos = [];
    if (tipo === 'nuevos') equipos = equiposNuevos;
    if (tipo === 'retirados') equipos = equiposRetirados;
    if (tipo === 'malos') equipos = equiposMalos;
    return equipos.filter(e => e.empresa === empresaSeleccionada).length;
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Equipos GPS</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa GPS</label>
              <select
                value={empresaSeleccionada}
                onChange={(e) => {
                  setEmpresaSeleccionada(e.target.value);
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="form-select"
              >
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
          </div>

          <div className="tab-container">
            <button
              onClick={() => {
                setEquipoView('nuevos');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`tab-button ${equipoView === 'nuevos' ? 'active green' : ''}`}
            >
              Equipos Nuevos ({contarEquiposPorEmpresa('nuevos')})
            </button>
            <button
              onClick={() => {
                setEquipoView('retirados');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`tab-button ${equipoView === 'retirados' ? 'active blue' : ''}`}
            >
              Equipos Retirados ({contarEquiposPorEmpresa('retirados')})
            </button>
            <button
              onClick={() => {
                setEquipoView('malos');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`tab-button ${equipoView === 'malos' ? 'active red' : ''}`}
            >
              Equipos Malos ({contarEquiposPorEmpresa('malos')})
            </button>
          </div>

          <div className="toolbar">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                if (equipoView === 'nuevos') setFormDataEquipo({ id: '', fechaRecepcion: '', imei: '', asignado: false, nombreCliente: '', estado: 'disponible', empresa: empresaSeleccionada });
                if (equipoView === 'retirados') setFormDataRetirado({ id: '', fecha: '', cliente: '', imei: '', empresa: empresaSeleccionada });
                if (equipoView === 'malos') setFormDataMalo({ id: '', imei: '', asignado: false, nombreCliente: '', empresa: empresaSeleccionada });
              }}
              className="btn btn-primary"
            >
              <Plus size={20} /> Agregar Equipo
            </button>
            <button
              onClick={() => exportToCSV(currentData, `equipos_${equipoView}_${empresaSeleccionada}_${new Date().toISOString().split('T')[0]}`)}
              className="btn btn-success"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {showForm && equipoView === 'nuevos' && (
            <div className="form-container">
              <h3 className="form-title">
                {editingItem ? 'Editar Equipo Nuevo' : 'Nuevo Equipo GPS'}
              </h3>
              <div className="form-grid">
                <input
                  type="date"
                  value={formDataEquipo.fechaRecepcion}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, fechaRecepcion: e.target.value})}
                  className="form-input"
                  placeholder="Fecha Recepción"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="IMEI *"
                    value={formDataEquipo.imei}
                    onChange={(e) => setFormDataEquipo({...formDataEquipo, imei: e.target.value})}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                    title="Escanear código de barras"
                  >
                    <Camera size={20} />
                  </button>
                </div>
                <select
                  value={formDataEquipo.estado}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, estado: e.target.value, asignado: e.target.value === 'asignado'})}
                  className="form-select"
                >
                  <option value="disponible">Disponible (Verde)</option>
                  <option value="asignado">Asignado (Naranja)</option>
                  <option value="perdido">Perdido (Rojo)</option>
                </select>
                {formDataEquipo.estado === 'asignado' && (
                  <input
                    type="text"
                    placeholder="Nombre del Cliente"
                    value={formDataEquipo.nombreCliente}
                    onChange={(e) => setFormDataEquipo({...formDataEquipo, nombreCliente: e.target.value})}
                    className="form-input"
                  />
                )}
              </div>
              <div className="form-actions">
                <button onClick={handleSubmitNuevo} className="btn btn-success">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showForm && equipoView === 'retirados' && (
            <div className="form-container blue">
              <h3 className="form-title">
                {editingItem ? 'Editar Equipo Retirado' : 'Registrar Equipo Retirado'}
              </h3>
              <div className="form-grid three-cols">
                <input
                  type="date"
                  value={formDataRetirado.fecha}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, fecha: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Cliente *"
                  value={formDataRetirado.cliente}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, cliente: e.target.value})}
                  className="form-input"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="IMEI *"
                    value={formDataRetirado.imei}
                    onChange={(e) => setFormDataRetirado({...formDataRetirado, imei: e.target.value})}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                    title="Escanear código de barras"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleSubmitRetirado} className="btn btn-primary">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showForm && equipoView === 'malos' && (
            <div className="form-container red">
              <h3 className="form-title">
                {editingItem ? 'Editar Equipo Malo' : 'Registrar Equipo Malo'}
              </h3>
              <div className="form-grid">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="IMEI *"
                    value={formDataMalo.imei}
                    onChange={(e) => setFormDataMalo({...formDataMalo, imei: e.target.value})}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                    title="Escanear código de barras"
                  >
                    <Camera size={20} />
                  </button>
                </div>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formDataMalo.asignado}
                      onChange={(e) => setFormDataMalo({...formDataMalo, asignado: e.target.checked})}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">¿Estaba asignado a un cliente?</span>
                  </label>
                </div>
                {formDataMalo.asignado && (
                  <input
                    type="text"
                    placeholder="Nombre del Cliente"
                    value={formDataMalo.nombreCliente}
                    onChange={(e) => setFormDataMalo({...formDataMalo, nombreCliente: e.target.value})}
                    className="form-input"
                  />
                )}
              </div>
              <div className="form-actions">
                <button onClick={handleSubmitMalo} className="btn btn-danger">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {equipoView === 'nuevos' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="green">
                  <tr>
                    <th>ID</th>
                    <th>Fecha Recepción</th>
                    <th>IMEI</th>
                    <th className="center">Estado</th>
                    <th>Cliente Asignado</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No hay equipos nuevos registrados para {empresaSeleccionada}
                      </td>
                    </tr>
                  ) : (
                    currentData.map(equipo => (
                      <tr key={equipo.id}>
                        <td>{equipo.id}</td>
                        <td>{equipo.fechaRecepcion}</td>
                        <td className="text-mono">{equipo.imei}</td>
                        <td className="center">
                          <div className="status-badge-equipos">
                            <div className={`status-dot ${getEstadoColor(equipo.estado)}`}></div>
                            <span className="status-text">{getEstadoTexto(equipo.estado)}</span>
                          </div>
                        </td>
                        <td>{equipo.nombreCliente || '-'}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button onClick={() => handleEdit(equipo)} className="action-btn edit" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => confirmDelete(equipo.id)} className="action-btn delete" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {equipoView === 'retirados' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="blue">
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>IMEI</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No hay equipos retirados registrados para {empresaSeleccionada}
                      </td>
                    </tr>
                  ) : (
                    currentData.map(equipo => (
                      <tr key={equipo.id}>
                        <td>{equipo.id}</td>
                        <td>{equipo.fecha}</td>
                        <td>{equipo.cliente}</td>
                        <td className="text-mono">{equipo.imei}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button onClick={() => handleEdit(equipo)} className="action-btn edit" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => confirmDelete(equipo.id)} className="action-btn delete" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {equipoView === 'malos' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="red">
                  <tr>
                    <th>ID</th>
                    <th>IMEI</th>
                    <th className="center">Estado</th>
                    <th>Cliente</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No hay equipos malos registrados para {empresaSeleccionada}
                      </td>
                    </tr>
                  ) : (
                    currentData.map(equipo => (
                      <tr key={equipo.id}>
                        <td>{equipo.id}</td>
                        <td className="text-mono">{equipo.imei}</td>
                        <td className="center">
                          <div className="status-badge-equipos">
                            <div className={`status-dot ${equipo.asignado ? 'red' : 'green'}`}></div>
                            <span className="status-text">{equipo.asignado ? 'Estaba Asignado' : 'No Asignado'}</span>
                          </div>
                        </td>
                        <td>{equipo.nombreCliente || '-'}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button onClick={() => handleEdit(equipo)} className="action-btn edit" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => confirmDelete(equipo.id)} className="action-btn delete" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-icon-wrapper warning">
                <AlertTriangle size={32} />
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close-btn">
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <p className="modal-message">
                ¿Estás seguro de que deseas eliminar este equipo?
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={handleDelete} className="btn btn-danger modal-btn">
                Eliminar
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary modal-btn">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipos;