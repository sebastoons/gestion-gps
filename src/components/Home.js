import React from 'react';
import { Briefcase, Package, Users } from 'lucide-react';

const Home = ({ setCurrentView }) => {
  return (
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
};

export default Home;