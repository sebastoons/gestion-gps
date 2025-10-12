import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import Clientes from './components/Clientes';
import './styles/Common.css';

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

  return (
    <div className="font-sans">
      {currentView === 'home' && <Home setCurrentView={setCurrentView} />}
      
      {currentView === 'trabajos' && (
        <Trabajos 
          setCurrentView={setCurrentView}
          trabajos={trabajos}
          setTrabajos={setTrabajos}
          empresas={empresas}
          empresaSeleccionada={empresaSeleccionada}
          setEmpresaSeleccionada={setEmpresaSeleccionada}
          mesSeleccionado={mesSeleccionado}
          setMesSeleccionado={setMesSeleccionado}
        />
      )}
      
      {currentView === 'equipos' && (
        <Equipos 
          setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos}
          setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados}
          setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos}
          setEquiposMalos={setEquiposMalos}
        />
      )}
      
      {currentView === 'clientes' && (
        <Clientes 
          setCurrentView={setCurrentView}
          clientes={clientes}
          setClientes={setClientes}
          empresas={empresas}
        />
      )}
    </div>
  );
};

export default App;