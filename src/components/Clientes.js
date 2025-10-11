import React, { useState } from 'react';
import { Download, Plus, Edit2, Trash2, Home, Search } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

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

  // Datos de Chile
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
    'Coquimbo': ['Coquimbo'],
    // Agregar más según necesidad
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

  // Filtrar clientes por búsqueda
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h2>
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, empresa, ID, teléfono o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800"
            >
              <Plus size={20} /> Agregar Cliente
            </button>
            <button
              onClick={() => exportToCSV(clientes, `clientes_${new Date().toISOString().split('T')[0]}`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800"
            >
              <Download size={20} /> Exportar
            </button>
          </div>

          {showForm && (
            <div className="bg-purple-50 p-6 rounded-lg mb-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {editingItem ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nombre Cliente *"
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Nombre Contacto 1"
                  value={formData.nombreContacto1}
                  onChange={(e) => setFormData({...formData, nombreContacto1: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="tel"
                  placeholder="Teléfono 1"
                  value={formData.telefono1}
                  onChange={(e) => setFormData({...formData, telefono1: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Nombre Contacto 2"
                  value={formData.nombreContacto2}
                  onChange={(e) => setFormData({...formData, nombreContacto2: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="tel"
                  placeholder="Teléfono 2"
                  value={formData.telefono2}
                  onChange={(e) => setFormData({...formData, telefono2: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value, ciudad: '', comuna: ''})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar Región</option>
                  {regiones.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                </select>
                <select
                  value={formData.ciudad}
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value, comuna: ''})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  disabled={!formData.region}
                >
                  <option value="">Seleccionar Ciudad</option>
                  {ciudadesDisponibles.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <select
                  value={formData.comuna}
                  onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
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
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 md:col-span-2"
                />
                <select
                  value={formData.tipoVehiculo}
                  onChange={(e) => setFormData({...formData, tipoVehiculo: e.target.value})}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Tipo de Vehículo</option>
                  {tiposVehiculos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 font-medium"
                >
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 active:bg-gray-500 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </div>

          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-purple-700 text-white">
                  <th className="p-3 border border-purple-600 text-left">ID</th>
                  <th className="p-3 border border-purple-600 text-left">Cliente</th>
                  <th className="p-3 border border-purple-600 text-left">Empresa</th>
                  <th className="p-3 border border-purple-600 text-left">Contacto 1</th>
                  <th className="p-3 border border-purple-600 text-left">Teléfono 1</th>
                  <th className="p-3 border border-purple-600 text-left">Contacto 2</th>
                  <th className="p-3 border border-purple-600 text-left">Teléfono 2</th>
                  <th className="p-3 border border-purple-600 text-left">Región</th>
                  <th className="p-3 border border-purple-600 text-left">Ciudad</th>
                  <th className="p-3 border border-purple-600 text-left">Comuna</th>
                  <th className="p-3 border border-purple-600 text-left">Dirección</th>
                  <th className="p-3 border border-purple-600 text-left">Tipo Vehículo</th>
                  <th className="p-3 border border-purple-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <tr key={cliente.id} className="hover:bg-gray-100 transition-colors">
                      <td className="p-3 border border-gray-300">{cliente.id}</td>
                      <td className="p-3 border border-gray-300 font-medium">{cliente.nombreCliente}</td>
                      <td className="p-3 border border-gray-300">{cliente.empresa}</td>
                      <td className="p-3 border border-gray-300">{cliente.nombreContacto1 || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.telefono1 || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.nombreContacto2 || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.telefono2 || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.region || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.ciudad || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.comuna || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.direccion || '-'}</td>
                      <td className="p-3 border border-gray-300">{cliente.tipoVehiculo || '-'}</td>
                      <td className="p-3 border border-gray-300">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => handleEdit(cliente)} 
                            className="text-blue-600 hover:text-blue-800 active:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cliente.id)} 
                            className="text-red-600 hover:text-red-800 active:text-red-900 p-1"
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