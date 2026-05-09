import React from 'react';
import { Briefcase, Package, DollarSign, MessageCircle, ClipboardList, QrCode, Sun, Moon } from 'lucide-react';
import '../styles/Home.css';

const Home = ({ setCurrentView, darkMode, setDarkMode }) => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-topbar">
          <button className="home-toggle" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        <div className="logo-container">
          <img src="/logo.svg" alt="Logo GPS Management" className="app-logo" />
        </div>

        <h1 className="home-title">Sistema de Gestión GPS</h1>
        <p className="home-subtitle">Gestiona tus trabajos, equipos y OT</p>

        <div className="home-grid">
          <button onClick={() => setCurrentView('trabajos')} className="home-card">
            <div className="card-icon-wrap blue">
              <Briefcase size={24} color="#60a5fa" />
            </div>
            <h2 className="card-title">Trabajos del Mes</h2>
            <p className="card-description">Gestiona trabajos realizados por empresa</p>
          </button>

          <button onClick={() => setCurrentView('equipos')} className="home-card">
            <div className="card-icon-wrap green">
              <Package size={24} color="#4ade80" />
            </div>
            <h2 className="card-title">Equipos GPS</h2>
            <p className="card-description">Inventario nuevo, retirado y malo</p>
          </button>

          <button onClick={() => setCurrentView('valores')} className="home-card">
            <div className="card-icon-wrap orange">
              <DollarSign size={24} color="#fb923c" />
            </div>
            <h2 className="card-title">Valor de Trabajos</h2>
            <p className="card-description">Tabla de precios y servicios</p>
          </button>

          <button onClick={() => setCurrentView('validacion')} className="home-card">
            <div className="card-icon-wrap whatsapp">
              <MessageCircle size={24} color="#4ade80" />
            </div>
            <h2 className="card-title">Validación</h2>
            <p className="card-description">Genera y envía por WhatsApp</p>
          </button>

          <button onClick={() => setCurrentView('ordenes')} className="home-card">
            <div className="card-icon-wrap yellow">
              <ClipboardList size={24} color="#fbbf24" />
            </div>
            <h2 className="card-title">Órdenes de Trabajo</h2>
            <p className="card-description">Crea y gestiona OT por vehículo</p>
          </button>

          <button onClick={() => setCurrentView('escaner')} className="home-card featured">
            <div className="card-icon-wrap teal">
              <QrCode size={26} color="#2dd4bf" />
            </div>
            <div className="featured-text">
              <h2 className="card-title">Escáner GPS</h2>
              <p className="card-description">Escanea y registra equipos al inventario por código de barras o QR</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
