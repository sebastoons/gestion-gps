import React, { useState } from 'react';
import { Download, Plus, Edit2, Trash2, Home, Search } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import '../styles/Common.css';

const Clientes = ({ 
  setCurrentView,
  clientes,
  setClientes,
  empresas
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    nombreCliente: '',
    empresa: 'Location World',
    nombreContacto1: '',
    telefono1: '',
    nombreContacto2: '',
    telefono2: '',
    region: '',
    ciudad: '',
    comuna: '',
    direccion: '',
    tipoVehiculo: ''
  });

  const regiones = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana de Santiago',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
  ];

  const ciudadesPorRegion = {
    'Arica y Parinacota': ['Arica', 'Putre'],
    'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
    'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
    'Atacama': ['Copiapó', 'Vallenar', 'Caldera'],
    'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Vicuña'],
    'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Quillota'],
    'Metropolitana de Santiago': ['Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa', 'Vitacura', 'San Bernardo', 'Pudahuel'],
    'O\'Higgins': ['Rancagua', 'San Fernando', 'Rengo', 'Machalí'],
    'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución'],
    'Ñuble': ['Chillán', 'Bulnes', 'San Carlos'],
    'Biobío': ['Concepción', 'Talcahuano', 'Los Ángeles', 'Chiguayante', 'San Pedro de la Paz'],
    'Araucanía': ['Temuco', 'Villarrica', 'Pucón', 'Angol'],
    'Los Ríos': ['Valdivia', 'La Unión', 'Río Bueno'],
    'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Ancud'],
    'Aysén': ['Coyhaique', 'Puerto Aysén'],
    'Magallanes': ['Punta Arenas', 'Puerto Natales']
  };

  const comunasPorCiudad = {
    'Santiago': ['Santiago Centro', 'Estación Central', 'Independencia', 'Recoleta', 'Quinta Normal'],
    'Puente Alto': ['Puente Alto'],
    'Maipú': ['Maipú'],
    'La Florida': ['La Florida'],
    'Las Condes': ['Las Condes'],
    'Providencia': ['Providencia'],
    'Ñuñoa': ['Ñuñoa'],
    'Vitacura': ['Vitacura'],
    'San Bernardo': ['San Bernardo'],
    'Pudahuel': ['Pudahuel'],
    'Valparaíso': ['Valparaíso'],
    'Viña del Mar': ['Viña del Mar'],
    'Concepción': ['Concepción'],
    'Temuco': ['Temuco'],
    'Antofagasta': ['Antofagasta'],
    'La Serena': ['La Serena'],
    'Coquimbo': ['Coquimbo']
  };

  const tiposVehiculos = [
    'Autos',
    'Camionetas',
    'Furgones',
    'Buses',
    'Camiones',
    'Grúas',
    'Motos',
    'Maquinaria',
    'Otros'
  ];

  const handleSubmit = () => {
    if (!formData.nombreCliente || !formData.empresa) {
      alert('Por favor completa los campos obligatorios (Nombre y Empresa)');
      return;
    }

    if (editingItem) {
      setClientes(clientes.map(c => c.id === editingItem.id ? { ...formData, id: editingItem.id } : c));
      setEditingItem(null);
    } else {
      const newId = `CL${String(clientes.length + 1).padStart(3, '0')}`;
      setClientes([...clientes, { ...formData, id: newId }]);
    }
    setShowForm(false);
    setFormData({
      id: '', nombreCliente: '', empresa: 'Location World',
      nombreContacto1: '', telefono1: '', nombreContacto2: '', telefono2: '',
      region: '', ciudad: '', comuna: '', direccion: '', tipoVehiculo: ''
    });
  };

  const handleEdit = (cliente) => {
    setEditingItem(cliente);
    setFormData(cliente);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono1?.includes(searchTerm) ||
    cliente.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ciudadesDisponibles = formData.region ? ciudadesPorRegion[formData.region] || [] : [];
  const comunasDisponibles = formData.ciudad ? comunasPorCiudad[formData.ciudad] || [formData.ciudad] : [];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <h2 className="page-title">Gestión de Clientes</h2>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="toolbar">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, empresa, ID, teléfono o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                setFormData({
                  id: '', nombreCliente: '', empresa: 'Location World',
                  nombreContacto1: '', telefono1: '', nombreContacto2: '', telefono2: '',
                  region: '', ciudad: '', comuna: '', direccion: '', tipoVehiculo: ''
                });
              }}
              className="btn btn-purple"
            >
              <Plus size={20} /> Agregar Cliente
            </button>
            <button
              onClick={() => exportToCSV(clientes, `clientes_${new Date().toISOString().split('T')[0]}`)}
              className="btn btn-success"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {showForm && (
            <div className="form-container purple">
              <h3 className="form-title">
                {editingItem ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <div className="form-grid three-cols">
                <input
                  type="text"
                  placeholder="Nombre Cliente *"
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  className="form-select"
                >
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Nombre Contacto 1"
                  value={formData.nombreContacto1}
                  onChange={(e) => setFormData({...formData, nombreContacto1: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono 1"
                  value={formData.telefono1}
                  onChange={(e) => setFormData({...formData, telefono1: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Nombre Contacto 2"
                  value={formData.nombreContacto2}
                  onChange={(e) => setFormData({...formData, nombreContacto2: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono 2"
                  value={formData.telefono2}
                  onChange={(e) => setFormData({...formData, telefono2: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value, ciudad: '', comuna: ''})}
                  className="form-select"
                >
                  <option value="">Seleccionar Región</option>
                  {regiones.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                </select>
                <select
                  value={formData.ciudad}
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value, comuna: ''})}
                  className="form-select"
                  disabled={!formData.region}
                >
                  <option value="">Seleccionar Ciudad</option>
                  {ciudadesDisponibles.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <select
                  value={formData.comuna}
                  onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                  className="form-select"
                  disabled={!formData.ciudad}
                >
                  <option value="">Seleccionar Comuna</option>
                  {comunasDisponibles.map(com => <option key={com} value={com}>{com}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Dirección"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="form-input col-span-2"
                />
                <select
                  value={formData.tipoVehiculo}
                  onChange={(e) => setFormData({...formData, tipoVehiculo: e.target.value})}
                  className="form-select"
                >
                  <option value="">Tipo de Vehículo</option>
                  {tiposVehiculos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button 
                  onClick={handleSubmit}
                  className="btn btn-purple"
                >
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

          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead className="purple">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Empresa</th>
                  <th>Contacto 1</th>
                  <th>Teléfono 1</th>
                  <th>Contacto 2</th>
                  <th>Teléfono 2</th>
                  <th>Región</th>
                  <th>Ciudad</th>
                  <th>Comuna</th>
                  <th>Dirección</th>
                  <th>Tipo Vehículo</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="empty-state">
                      {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <tr key={cliente.id}>
                      <td>{cliente.id}</td>
                      <td className="text-bold">{cliente.nombreCliente}</td>
                      <td>{cliente.empresa}</td>
                      <td>{cliente.nombreContacto1 || '-'}</td>
                      <td>{cliente.telefono1 || '-'}</td>
                      <td>{cliente.nombreContacto2 || '-'}</td>
                      <td>{cliente.telefono2 || '-'}</td>
                      <td>{cliente.region || '-'}</td>
                      <td>{cliente.ciudad || '-'}</td>
                      <td>{cliente.comuna || '-'}</td>
                      <td>{cliente.direccion || '-'}</td>
                      <td>{cliente.tipoVehiculo || '-'}</td>
                      <td className="center">
                        <div className="table-actions">
                          <button 
                            onClick={() => handleEdit(cliente)} 
                            className="action-btn edit"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cliente.id)} 
                            className="action-btn delete"
                            title="Eliminar"
                          >
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
        </div>
      </div>
    </div>
  );
};

export default Clientes;