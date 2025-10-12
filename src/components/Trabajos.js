import React, { useState } from 'react';
import { Download, Plus, Edit2, Trash2, Home } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Trabajos = ({ 
  setCurrentView, 
  trabajos, 
  setTrabajos, 
  empresas, 
  empresaSeleccionada, 
  setEmpresaSeleccionada,
  mesSeleccionado,
  setMesSeleccionado
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nombreCliente: '',
    fecha: '',
    servicio: 'Instalación',
    ppuIn: '',
    ppuOut: '',
    imeiIn: '',
    imeiOut: '',
    km: '',
    valorUF: '',
    valorPesos: '',
    empresa: empresaSeleccionada,
    mes: mesSeleccionado
  });

  const trabajosFiltrados = trabajos.filter(
    t => t.empresa === empresaSeleccionada && t.mes === mesSeleccionado
  );

  const calcularTotales = () => {
    const totalUF = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.valorUF) || 0), 0);
    const totalPesos = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.valorPesos) || 0), 0);
    const totalKm = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.km) || 0), 0);
    const valorKm = empresaSeleccionada === 'Location World' ? 150 : 250;
    const totalValorKm = totalKm * valorKm;
    const subtotal = totalPesos + totalValorKm;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return { totalUF, totalPesos, totalKm, totalValorKm, subtotal, iva, total };
  };

  const handleSubmit = () => {
    if (!formData.nombreCliente || !formData.fecha) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    if (editingItem) {
      setTrabajos(trabajos.map(t => t.id === editingItem.id ? { ...formData, id: editingItem.id } : t));
      setEditingItem(null);
    } else {
      const prefix = empresaSeleccionada === 'Location World' ? 'LW' : 'U';
      const count = trabajos.filter(t => t.empresa === empresaSeleccionada).length + 1;
      const newId = `${prefix}${String(count).padStart(3, '0')}`;
      setTrabajos([...trabajos, { ...formData, id: newId }]);
    }
    setShowForm(false);
    setFormData({
      id: '', nombreCliente: '', fecha: '', servicio: 'Instalación',
      ppuIn: '', ppuOut: '', imeiIn: '', imeiOut: '', km: '',
      valorUF: '', valorPesos: '', empresa: empresaSeleccionada, mes: mesSeleccionado
    });
  };

  const handleEdit = (trabajo) => {
    setEditingItem(trabajo);
    setFormData(trabajo);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este trabajo?')) {
      setTrabajos(trabajos.filter(t => t.id !== id));
    }
  };

  const totales = calcularTotales();

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <h2 className="page-title">Trabajos del Mes</h2>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select
                value={empresaSeleccionada}
                onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                className="form-select"
              >
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div>
              <label className="filter-label">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="form-select"
              >
                <option>Agosto 2025</option>
                <option>Septiembre 2025</option>
                <option>Octubre 2025</option>
              </select>
            </div>
          </div>

          <div className="toolbar">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                setFormData({
                  id: '', nombreCliente: '', fecha: '', servicio: 'Instalación',
                  ppuIn: '', ppuOut: '', imeiIn: '', imeiOut: '', km: '',
                  valorUF: '', valorPesos: '', empresa: empresaSeleccionada, mes: mesSeleccionado
                });
              }}
              className="btn btn-primary"
            >
              <Plus size={20} /> Agregar Trabajo
            </button>
            <button
              onClick={() => exportToCSV(trabajosFiltrados, `trabajos_${empresaSeleccionada}_${mesSeleccionado}`)}
              className="btn btn-success"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {showForm && (
            <div className="form-container blue">
              <h3 className="form-title">
                {editingItem ? 'Editar Trabajo' : 'Nuevo Trabajo'}
              </h3>
              <div className="form-grid three-cols">
                <input
                  type="text"
                  placeholder="Nombre Cliente *"
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                  className="form-input"
                />
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.servicio}
                  onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                  className="form-select"
                >
                  <option>Instalación</option>
                  <option>Retiro</option>
                  <option>Mantención</option>
                  <option>Reubicación</option>
                </select>
                <input
                  type="text"
                  placeholder="PPU IN"
                  value={formData.ppuIn}
                  onChange={(e) => setFormData({...formData, ppuIn: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="PPU OUT"
                  value={formData.ppuOut}
                  onChange={(e) => setFormData({...formData, ppuOut: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="IMEI IN"
                  value={formData.imeiIn}
                  onChange={(e) => setFormData({...formData, imeiIn: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="IMEI OUT"
                  value={formData.imeiOut}
                  onChange={(e) => setFormData({...formData, imeiOut: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="KM"
                  value={formData.km}
                  onChange={(e) => setFormData({...formData, km: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor UF"
                  value={formData.valorUF}
                  onChange={(e) => setFormData({...formData, valorUF: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Valor Pesos"
                  value={formData.valorPesos}
                  onChange={(e) => setFormData({...formData, valorPesos: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSubmit} className="btn btn-primary">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>PPU IN</th>
                  <th>PPU OUT</th>
                  <th>IMEI IN</th>
                  <th>IMEI OUT</th>
                  <th className="right">KM</th>
                  <th className="right">UF</th>
                  <th className="right">Valor $</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trabajosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="empty-state">
                      No hay trabajos registrados para este mes
                    </td>
                  </tr>
                ) : (
                  trabajosFiltrados.map(trabajo => (
                    <tr key={trabajo.id}>
                      <td>{trabajo.id}</td>
                      <td className="text-bold">{trabajo.nombreCliente}</td>
                      <td>{trabajo.fecha}</td>
                      <td>{trabajo.servicio}</td>
                      <td>{trabajo.ppuIn}</td>
                      <td>{trabajo.ppuOut}</td>
                      <td className="text-mono">{trabajo.imeiIn}</td>
                      <td className="text-mono">{trabajo.imeiOut}</td>
                      <td className="right">{trabajo.km}</td>
                      <td className="right">{trabajo.valorUF}</td>
                      <td className="right">${Number(trabajo.valorPesos).toLocaleString()}</td>
                      <td className="center">
                        <div className="table-actions">
                          <button onClick={() => handleEdit(trabajo)} className="action-btn edit" title="Editar">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(trabajo.id)} className="action-btn delete" title="Eliminar">
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

          {trabajosFiltrados.length > 0 && (
            <div className="summary-container">
              <h3 className="summary-title">Resumen del Mes</h3>
              <div className="summary-grid">
                <div className="summary-card">
                  <span className="summary-label">Total UF:</span>
                  <div className="summary-value blue">{totales.totalUF.toFixed(2)}</div>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Pesos:</span>
                  <div className="summary-value green">${totales.totalPesos.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total KM:</span>
                  <div className="summary-value purple">{totales.totalKm}</div>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Valor KM:</span>
                  <div className="summary-value orange">${totales.totalValorKm.toLocaleString()}</div>
                </div>
              </div>
              <div className="summary-total">
                <div className="summary-total-card">
                  <span className="summary-total-label">Subtotal:</span>
                  <div className="summary-total-value">${totales.subtotal.toLocaleString()}</div>
                </div>
                <div className="summary-total-card">
                  <span className="summary-total-label">IVA (19%):</span>
                  <div className="summary-total-value">${totales.iva.toLocaleString()}</div>
                </div>
                <div className="summary-total-card highlight">
                  <span className="summary-total-label">TOTAL:</span>
                  <div className="summary-total-value">${totales.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trabajos;