import React from 'react';
import { Briefcase, Package, Users, DollarSign } from 'lucide-react';
import '../styles/Home.css';

const Home = ({ setCurrentView }) => {
  return (
    <div className="home-container">
      <div className="home-content">
        {/* Logo */}
        <div className="logo-container">
          <img src="/logo.svg" alt="Logo GPS Management" className="app-logo" />
        </div>
        
        <h1 className="home-title">Sistema de Gestión GPS</h1>
        <p className="home-subtitle">Gestiona tus trabajos, equipos y clientes</p>
        
        <div className="home-grid">
          <button
            onClick={() => setCurrentView('trabajos')}
            className="home-card"
          >
            <Briefcase className="card-icon blue" />
            <h2 className="card-title">Trabajos del Mes</h2>
            <p className="card-description">Gestiona trabajos realizados por empresa</p>
          </button>

          <button
            onClick={() => setCurrentView('equipos')}
            className="home-card"
          >
            <Package className="card-icon green" />
            <h2 className="card-title">Equipos GPS</h2>
            <p className="card-description">Administra equipos nuevos, retirados y malos</p>
          </button>

          <button
            onClick={() => setCurrentView('clientes')}
            className="home-card"
          >
            <Users className="card-icon purple" />
            <h2 className="card-title">Gestión de Clientes</h2>
            <p className="card-description">Base de datos de clientes GPS</p>
          </button>

          <button
            onClick={() => setCurrentView('valores')}
            className="home-card"
          >
            <DollarSign className="card-icon orange" />
            <h2 className="card-title">Valores de Trabajos</h2>
            <p className="card-description">Tabla de precios y exportación</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;