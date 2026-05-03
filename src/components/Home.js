import React from 'react';
import { Briefcase, Package, DollarSign, MessageCircle, ClipboardList } from 'lucide-react';
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
        <p className="home-subtitle">Gestiona tus trabajos, equipos y OT</p>
        
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
            onClick={() => setCurrentView('valores')}
            className="home-card"
          >
            <DollarSign className="card-icon orange" />
            <h2 className="card-title">Valor de Trabajos</h2>
            <p className="card-description">Tabla de precios y servicios</p>
          </button>

          <button
            onClick={() => setCurrentView('validacion')}
            className="home-card"
          >
            <MessageCircle className="card-icon" style={{ color: '#25D366' }} />
            <h2 className="card-title">Validación WhatsApp</h2>
            <p className="card-description">Genera y envía validaciones por WhatsApp</p>
          </button>

          <button
            onClick={() => setCurrentView('ordenes')}
            className="home-card"
          >
            <ClipboardList className="card-icon" style={{ color: '#f59e0b' }} />
            <h2 className="card-title">Órdenes de Trabajo</h2>
            <p className="card-description">Crea y gestiona OT por vehículo y servicio GPS</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;