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
    estado: 'disponible' // disponible, asignado, perdido
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
      case 'disponible': return 'bg-green-500';
      case 'asignado': return 'bg-orange-500';
      case 'perdido': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const currentData = getEquiposByView();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Equipos GPS</h2>
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => {
                setEquipoView('nuevos');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'nuevos' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Equipos Nuevos ({equiposNuevos.length})
            </button>
            <button
              onClick={() => {
                setEquipoView('retirados');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'retirados' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Equipos Retirados ({equiposRetirados.length})
            </button>
            <button
              onClick={() => {
                setEquipoView('malos');
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'malos' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Equipos Malos ({equiposMalos.length})
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                if (equipoView === 'nuevos') setFormDataEquipo({ id: '', fechaRecepcion: '', imei: '', asignado: false, nombreCliente: '', estado: 'disponible' });
                if (equipoView === 'retirados') setFormDataRetirado({ id: '', fecha: '', cliente: '', imei: '' });
                if (equipoView === 'malos') setFormDataMalo({ id: '', imei: '', asignado: false, nombreCliente: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
            >
              <Plus size={20} /> Agregar Equipo
            </button>
            <button
              onClick={() => exportToCSV(currentData, `equipos_${equipoView}_${new Date().toISOString().split('T')[0]}`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {/* FORMULARIO EQUIPOS NUEVOS */}
          {showForm && equipoView === 'nuevos' && (
            <div className="bg-green-50 p-6 rounded-lg mb-6 border-2 border-green-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {editingItem ? 'Editar Equipo Nuevo' : 'Nuevo Equipo GPS'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formDataEquipo.fechaRecepcion}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, fechaRecepcion: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  placeholder="Fecha Recepción"
                />
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataEquipo.imei}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, imei: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={formDataEquipo.estado}
                  onChange={(e) => setFormDataEquipo({...formDataEquipo, estado: e.target.value, asignado: e.target.value === 'asignado'})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
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
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handleSubmitNuevo} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* FORMULARIO EQUIPOS RETIRADOS */}
          {showForm && equipoView === 'retirados' && (
            <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {editingItem ? 'Editar Equipo Retirado' : 'Registrar Equipo Retirado'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  value={formDataRetirado.fecha}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, fecha: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Cliente *"
                  value={formDataRetirado.cliente}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, cliente: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataRetirado.imei}
                  onChange={(e) => setFormDataRetirado({...formDataRetirado, imei: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handleSubmitRetirado} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* FORMULARIO EQUIPOS MALOS */}
          {showForm && equipoView === 'malos' && (
            <div className="bg-red-50 p-6 rounded-lg mb-6 border-2 border-red-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {editingItem ? 'Editar Equipo Malo' : 'Registrar Equipo Malo'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="IMEI *"
                  value={formDataMalo.imei}
                  onChange={(e) => setFormDataMalo({...formDataMalo, imei: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formDataMalo.asignado}
                      onChange={(e) => setFormDataMalo({...formDataMalo, asignado: e.target.checked})}
                      className="w-4 h-4"
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
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handleSubmitMalo} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* TABLA EQUIPOS NUEVOS */}
          {equipoView === 'nuevos' && (
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="p-3 border border-green-600 text-left">ID</th>
                    <th className="p-3 border border-green-600 text-left">Fecha Recepción</th>
                    <th className="p-3 border border-green-600 text-left">IMEI</th>
                    <th className="p-3 border border-green-600 text-center">Estado</th>
                    <th className="p-3 border border-green-600 text-left">Cliente Asignado</th>
                    <th className="p-3 border border-green-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposNuevos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No hay equipos nuevos registrados
                      </td>
                    </tr>
                  ) : (
                    equiposNuevos.map(equipo => (
                      <tr key={equipo.id} className="hover:bg-gray-100">
                        <td className="p-3 border">{equipo.id}</td>
                        <td className="p-3 border">{equipo.fechaRecepcion}</td>
                        <td className="p-3 border font-mono">{equipo.imei}</td>
                        <td className="p-3 border">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${getEstadoColor(equipo.estado)}`}></div>
                            <span className="text-sm capitalize">{equipo.estado}</span>
                          </div>
                        </td>
                        <td className="p-3 border">{equipo.nombreCliente || '-'}</td>
                        <td className="p-3 border">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(equipo)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(equipo.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
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
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th className="p-3 border border-blue-600 text-left">ID</th>
                    <th className="p-3 border border-blue-600 text-left">Fecha</th>
                    <th className="p-3 border border-blue-600 text-left">Cliente</th>
                    <th className="p-3 border border-blue-600 text-left">IMEI</th>
                    <th className="p-3 border border-blue-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposRetirados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No hay equipos retirados registrados
                      </td>
                    </tr>
                  ) : (
                    equiposRetirados.map(equipo => (
                      <tr key={equipo.id} className="hover:bg-gray-100">
                        <td className="p-3 border">{equipo.id}</td>
                        <td className="p-3 border">{equipo.fecha}</td>
                        <td className="p-3 border">{equipo.cliente}</td>
                        <td className="p-3 border font-mono">{equipo.imei}</td>
                        <td className="p-3 border">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(equipo)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(equipo.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
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
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-red-700 text-white">
                    <th className="p-3 border border-red-600 text-left">ID</th>
                    <th className="p-3 border border-red-600 text-left">IMEI</th>
                    <th className="p-3 border border-red-600 text-center">Estado Asignación</th>
                    <th className="p-3 border border-red-600 text-left">Cliente (si aplica)</th>
                    <th className="p-3 border border-red-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposMalos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No hay equipos malos registrados
                      </td>
                    </tr>
                  ) : (
                    equiposMalos.map(equipo => (
                      <tr key={equipo.id} className="hover:bg-gray-100">
                        <td className="p-3 border">{equipo.id}</td>
                        <td className="p-3 border font-mono">{equipo.imei}</td>
                        <td className="p-3 border">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${equipo.asignado ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="text-sm">{equipo.asignado ? 'Estaba asignado' : 'No asignado'}</span>
                          </div>
                        </td>
                        <td className="p-3 border">{equipo.nombreCliente || '-'}</td>
                        <td className="p-3 border">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(equipo)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(equipo.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
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