import React, { useState } from 'react';
import { Download, Plus, Edit2, Trash2, Home } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Equipos = ({ 
  setCurrentView,
  equiposNuevos,
  setEquiposNuevos,
  equiposRetirados,
  setEquiposRetirados,
  equiposMalos,
  setEquiposMalos
}) => {
  const [equipoView, setEquipoView] = useState('nuevos');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formDataEquipo, setFormDataEquipo] = useState({
    id: '',
    fechaRecepcion: '',
    imei: '',
    asignado: false,
    nombreCliente: '',
    estado: 'disponible'
  });

  const [formDataRetirado, setFormDataRetirado] = useState({
    id: '',
    fecha: '',
    cliente: '',
    imei: ''
  });

  const [formDataMalo, setFormDataMalo] = useState({
    id: '',
    imei: '',
    asignado: false,
    nombreCliente: ''
  });

  const getEquiposByView = () => {
    switch(equipoView) {
      case 'nuevos': return equiposNuevos;
      case 'retirados': return equiposRetirados;
      case 'malos': return equiposMalos;
      default: return [];
    }
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
      const newId = `EQ${String(equiposNuevos.length + 1).padStart(3, '0')}`;
      setEquiposNuevos([...equiposNuevos, { ...formDataEquipo, id: newId }]);
    }
    setShowForm(false);
    setFormDataEquipo({
      id: '', fechaRecepcion: '', imei: '', asignado: false, nombreCliente: '', estado: 'disponible'
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
      const newId = `ER${String(equiposRetirados.length + 1).padStart(3, '0')}`;
      setEquiposRetirados([...equiposRetirados, { ...formDataRetirado, id: newId }]);
    }
    setShowForm(false);
    setFormDataRetirado({ id: '', fecha: '', cliente: '', imei: '' });
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
      const newId = `EM${String(equiposMalos.length + 1).padStart(3, '0')}`;
      setEquiposMalos([...equiposMalos, { ...formDataMalo, id: newId }]);
    }
    setShowForm(false);
    setFormDataMalo({ id: '', imei: '', asignado: false, nombreCliente: '' });
  };

  const handleEdit = (equipo) => {
    setEditingItem(equipo);
    if (equipoView === 'nuevos') setFormDataEquipo(equipo);
    if (equipoView === 'retirados') setFormDataRetirado(equipo);
    if (equipoView === 'malos') setFormDataMalo(equipo);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo?')) {
      if (equipoView === 'nuevos') setEquiposNuevos(equiposNuevos.filter(e => e.id !== id));
      if (equipoView === 'retirados') setEquiposRetirados(equiposRetirados.filter(e => e.id !== id));
      if (equipoView === 'malos') setEquiposMalos(equiposMalos.filter(e => e.id !== id));
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'disponible': return 'green';
      case 'asignado': return 'orange';
      case 'perdido': return 'red';
      default: return 'gray';
    }
  };

  const currentData = getEquiposByView();

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <h2 className="page-title">Equipos GPS</h2>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
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
              Equipos Nuevos ({equiposNuevos.length})
            </button>
            <button
              onClick={() => {
                setEquipoView('retirados');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`tab-button ${equipoView === 'retirados' ? 'active blue' : ''}`}
            >
              Equipos Retirados ({equiposRetirados.length})
            </button>
            <button
              onClick={() => {
                setEquipoView('malos');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`tab-button ${equipoView === 'malos' ? 'active red' : ''}`}
            >
              Equipos Malos ({equiposMalos.length})
            </button>
          </div>

          <div className="toolbar">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                if (equipoView === 'nuevos') setFormDataEquipo({ id: '', fechaRecepcion: '', imei: '', asignado: false, nombreCliente: '', estado: 'disponible' });
                if (equipoView === 'retirados') setFormDataRetirado({ id: '', fecha: '', cliente: '', imei: '' });
                if (equipoView === 'malos') setFormDataMalo({ id: '', imei: '', asignado: false, nombreCliente: '' });
              }}
              className="btn btn-primary"
            >
              <Plus size={20} /> Agregar Equipo
            </button>
            <button
              onClick={() => exportToCSV(currentData, `equipos_${equipoView}_${new Date().toISOString().split('T')[0]}`)}
              className="btn btn-success"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {/* FORMULARIO EQUIPOS NUEVOS */}
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
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataEquipo.imei}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, imei: e.target.value})}
                  className="form-input"
                />
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

          {/* FORMULARIO EQUIPOS RETIRADOS */}
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
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataRetirado.imei}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, imei: e.target.value})}
                  className="form-input"
                />
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

          {/* FORMULARIO EQUIPOS MALOS */}
          {showForm && equipoView === 'malos' && (
            <div className="form-container red">
              <h3 className="form-title">
                {editingItem ? 'Editar Equipo Malo' : 'Registrar Equipo Malo'}
              </h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataMalo.imei}
                  onChange={(e) => setFormDataMalo({...formDataMalo, imei: e.target.value})}
                  className="form-input"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formDataMalo.asignado}
                      onChange={(e) => setFormDataMalo({...formDataMalo, asignado: e.target.checked})}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span>¿Estaba asignado a un cliente?</span>
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

          {/* TABLA EQUIPOS NUEVOS */}
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
                  {equiposNuevos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No hay equipos nuevos registrados
                      </td>
                    </tr>
                  ) : (
                    equiposNuevos.map(equipo => (
                      <tr key={equipo.id}>
                        <td>{equipo.id}</td>
                        <td>{equipo.fechaRecepcion}</td>
                        <td className="text-mono">{equipo.imei}</td>
                        <td className="center">
                          <div className="status-badge">
                            <div className={`status-dot ${getEstadoColor(equipo.estado)}`}></div>
                            <span style={{ textTransform: 'capitalize' }}>{equipo.estado}</span>
                          </div>
                        </td>
                        <td>{equipo.nombreCliente || '-'}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button onClick={() => handleEdit(equipo)} className="action-btn edit" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(equipo.id)} className="action-btn delete" title="Eliminar">
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

          {/* TABLA EQUIPOS RETIRADOS */}
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
                  {equiposRetirados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No hay equipos retirados registrados
                      </td>
                    </tr>
                  ) : (
                    equiposRetirados.map(equipo => (
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
                            <button onClick={() => handleDelete(equipo.id)} className="action-btn delete" title="Eliminar">
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

          {/* TABLA EQUIPOS MALOS */}
          {equipoView === 'malos' && (
            <div className="table-container">
              <table className="data-table">
                <thead className="red">
                  <tr>
                    <th>ID</th>
                    <th>IMEI</th>
                    <th className="center">Estado Asignación</th>
                    <th>Cliente (si aplica)</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposMalos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No hay equipos malos registrados
                      </td>
                    </tr>
                  ) : (
                    equiposMalos.map(equipo => (
                      <tr key={equipo.id}>
                        <td>{equipo.id}</td>
                        <td className="text-mono">{equipo.imei}</td>
                        <td className="center">
                          <div className="status-badge">
                            <div className={`status-dot ${equipo.asignado ? 'red' : 'green'}`}></div>
                            <span>{equipo.asignado ? 'Estaba asignado' : 'No asignado'}</span>
                          </div>
                        </td>
                        <td>{equipo.nombreCliente || '-'}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button onClick={() => handleEdit(equipo)} className="action-btn edit" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(equipo.id)} className="action-btn delete" title="Eliminar">
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
    </div>
  );
};

export default Equipos;