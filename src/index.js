import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// No registrar un service worker nuevo: uno anterior (cache-first, sin
// revalidar) dejaba dispositivos atrapados en versiones viejas del código,
// sin ver los cambios de sincronización con Supabase — ver
// public/service-worker.js, que se mantiene solo como "interruptor de
// apagado" para limpiar el de cualquier dispositivo que ya lo tenga
// instalado.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  });
}