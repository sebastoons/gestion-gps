import React, { useState, useEffect } from 'react';
import { Download, Plus, Edit2, Trash2, Home, Package, Users, Briefcase } from 'lucide-react';

// Utilidad para exportar a CSV (compatible con Excel)
const exportToCSV = (data, filename) => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [trabajos, setTrabajos] = useState([]);
  const [equiposNuevos, setEquiposNuevos] = useState([]);
  const [equiposRetirados, setEquiposRetirados] = useState([]);
  const [equiposMalos, setEquiposMalos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empresas, setEmpresas] = useState(['Location World', 'UGPS', 'Entel', 'Verizon', 'TrackChile']);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('Location World');
  const [mesSeleccionado, setMesSeleccionado] = useState('Octubre 2025');
  const [equipoView, setEquipoView] = useState('nuevos');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Cargar datos del localStorage
  useEffect(() => {
    const loadData = () => {
      const storedTrabajos = localStorage.getItem('trabajos');
      const storedEquiposNuevos = localStorage.getItem('equiposNuevos');
      const storedEquiposRetirados = localStorage.getItem('equiposRetirados');
      const storedEquiposMalos = localStorage.getItem('equiposMalos');
      const storedClientes = localStorage.getItem('clientes');
      const storedEmpresas = localStorage.getItem('empresas');

      if (storedTrabajos) setTrabajos(JSON.parse(storedTrabajos));
      if (storedEquiposNuevos) setEquiposNuevos(JSON.parse(storedEquiposNuevos));
      if (storedEquiposRetirados) setEquiposRetirados(JSON.parse(storedEquiposRetirados));
      if (storedEquiposMalos) setEquiposMalos(JSON.parse(storedEquiposMalos));
      if (storedClientes) setClientes(JSON.parse(storedClientes));
      if (storedEmpresas) setEmpresas(JSON.parse(storedEmpresas));
    };
    loadData();
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('trabajos', JSON.stringify(trabajos));
  }, [trabajos]);

  useEffect(() => {
    localStorage.setItem('equiposNuevos', JSON.stringify(equiposNuevos));
  }, [equiposNuevos]);

  useEffect(() => {
    localStorage.setItem('equiposRetirados', JSON.stringify(equiposRetirados));
  }, [equiposRetirados]);

  useEffect(() => {
    localStorage.setItem('equiposMalos', JSON.stringify(equiposMalos));
  }, [equiposMalos]);

  useEffect(() => {
    localStorage.setItem('clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('empresas', JSON.stringify(empresas));
  }, [empresas]);

  // Componente Home
  const HomeView = () => (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Sistema de Gestión GPS</h1>
        <p className="text-gray-600 text-center mb-8">Gestiona tus trabajos, equipos y clientes</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentView('trabajos')}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Briefcase className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Trabajos del Mes</h2>
            <p className="text-gray-600 text-sm">Gestiona trabajos realizados por empresa</p>
          </button>

          <button
            onClick={() => setCurrentView('equipos')}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Package className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Equipos GPS</h2>
            <p className="text-gray-600 text-sm">Administra equipos nuevos, retirados y malos</p>
          </button>

          <button
            onClick={() => setCurrentView('clientes')}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gestión de Clientes</h2>
            <p className="text-gray-600 text-sm">Base de datos de clientes GPS</p>
          </button>
        </div>
      </div>
    </div>
  );

  // Componente Trabajos del Mes
  const TrabajosView = () => {
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Trabajos del Mes</h2>
              <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400">
                <Home size={20} /> Inicio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Empresa</label>
                <select
                  value={empresaSeleccionada}
                  onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Mes</label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Agosto 2025</option>
                  <option>Septiembre 2025</option>
                  <option>Octubre 2025</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
              >
                <Plus size={20} /> Agregar Trabajo
              </button>
              <button
                onClick={() => exportToCSV(trabajosFiltrados, `trabajos_${empresaSeleccionada}_${mesSeleccionado}`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800"
              >
                <Download size={20} /> Exportar
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {editingItem ? 'Editar Trabajo' : 'Nuevo Trabajo'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre Cliente *"
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={formData.servicio}
                    onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="PPU OUT"
                    value={formData.ppuOut}
                    onChange={(e) => setFormData({...formData, ppuOut: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="IMEI IN"
                    value={formData.imeiIn}
                    onChange={(e) => setFormData({...formData, imeiIn: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="IMEI OUT"
                    value={formData.imeiOut}
                    onChange={(e) => setFormData({...formData, imeiOut: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="KM"
                    value={formData.km}
                    onChange={(e) => setFormData({...formData, km: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor UF"
                    value={formData.valorUF}
                    onChange={(e) => setFormData({...formData, valorUF: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Valor Pesos"
                    value={formData.valorPesos}
                    onChange={(e) => setFormData({...formData, valorPesos: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium"
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

            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="p-3 border border-gray-600 text-left">ID</th>
                    <th className="p-3 border border-gray-600 text-left">Cliente</th>
                    <th className="p-3 border border-gray-600 text-left">Fecha</th>
                    <th className="p-3 border border-gray-600 text-left">Servicio</th>
                    <th className="p-3 border border-gray-600 text-left">PPU IN</th>
                    <th className="p-3 border border-gray-600 text-left">PPU OUT</th>
                    <th className="p-3 border border-gray-600 text-left">IMEI IN</th>
                    <th className="p-3 border border-gray-600 text-left">IMEI OUT</th>
                    <th className="p-3 border border-gray-600 text-right">KM</th>
                    <th className="p-3 border border-gray-600 text-right">UF</th>
                    <th className="p-3 border border-gray-600 text-right">Valor $</th>
                    <th className="p-3 border border-gray-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="p-8 text-center text-gray-500">
                        No hay trabajos registrados para este mes
                      </td>
                    </tr>
                  ) : (
                    trabajosFiltrados.map(trabajo => (
                      <tr key={trabajo.id} className="hover:bg-gray-100 transition-colors">
                        <td className="p-3 border border-gray-300">{trabajo.id}</td>
                        <td className="p-3 border border-gray-300">{trabajo.nombreCliente}</td>
                        <td className="p-3 border border-gray-300">{trabajo.fecha}</td>
                        <td className="p-3 border border-gray-300">{trabajo.servicio}</td>
                        <td className="p-3 border border-gray-300">{trabajo.ppuIn}</td>
                        <td className="p-3 border border-gray-300">{trabajo.ppuOut}</td>
                        <td className="p-3 border border-gray-300">{trabajo.imeiIn}</td>
                        <td className="p-3 border border-gray-300">{trabajo.imeiOut}</td>
                        <td className="p-3 border border-gray-300 text-right">{trabajo.km}</td>
                        <td className="p-3 border border-gray-300 text-right">{trabajo.valorUF}</td>
                        <td className="p-3 border border-gray-300 text-right">${Number(trabajo.valorPesos).toLocaleString()}</td>
                        <td className="p-3 border border-gray-300">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => handleEdit(trabajo)} 
                              className="text-blue-600 hover:text-blue-800 active:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(trabajo.id)} 
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

            {trabajosFiltrados.length > 0 && (
              <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Resumen del Mes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="bg-white p-3 rounded shadow">
                    <span className="text-gray-600">Total UF:</span>
                    <div className="text-xl font-bold text-blue-600">{totales.totalUF.toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <span className="text-gray-600">Total Pesos:</span>
                    <div className="text-xl font-bold text-green-600">${totales.totalPesos.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <span className="text-gray-600">Total KM:</span>
                    <div className="text-xl font-bold text-purple-600">{totales.totalKm}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <span className="text-gray-600">Valor KM:</span>
                    <div className="text-xl font-bold text-orange-600">${totales.totalValorKm.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-600 text-sm">Subtotal:</span>
                    <div className="text-2xl font-bold">${totales.subtotal.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-600 text-sm">IVA (19%):</span>
                    <div className="text-2xl font-bold">${totales.iva.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-600 text-white p-4 rounded shadow">
                    <span className="text-sm">TOTAL:</span>
                    <div className="text-2xl font-bold">${totales.total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Componente Equipos GPS
  const EquiposView = () => {
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
                onClick={() => setEquipoView('nuevos')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'nuevos' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Equipos Nuevos
              </button>
              <button
                onClick={() => setEquipoView('retirados')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'retirados' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Equipos Retirados
              </button>
              <button
                onClick={() => setEquipoView('malos')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${equipoView === 'malos' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Equipos Malos
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <Package className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-medium">
                Sección en desarrollo
              </p>
              <p className="text-gray-600 mt-2">
                Esta funcionalidad seguirá el mismo patrón CRUD de la sección Trabajos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente Clientes
  const ClientesView = () => {
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

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 text-center">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-medium">
                Sección en desarrollo
              </p>
              <p className="text-gray-600 mt-2">
                Aquí podrás gestionar hasta 200 clientes con información completa
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado principal
  return (
    <div className="font-sans">
      {currentView === 'home' && <HomeView />}
      {currentView === 'trabajos' && <TrabajosView />}
      {currentView === 'equipos' && <EquiposView />}
      {currentView === 'clientes' && <ClientesView />}
    </div>
  );
};

export default App;