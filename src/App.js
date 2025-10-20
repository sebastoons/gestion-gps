import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import Clientes from './components/Clientes';
import ValoresTrabajos from './components/ValoresTrabajos';
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

  // Cargar datos del localStorage con migración
  useEffect(() => {
    const loadData = () => {
      const storedTrabajos = localStorage.getItem('trabajos');
      const storedEquiposNuevos = localStorage.getItem('equiposNuevos');
      const storedEquiposRetirados = localStorage.getItem('equiposRetirados');
      const storedEquiposMalos = localStorage.getItem('equiposMalos');
      const storedClientes = localStorage.getItem('clientes');
      const storedEmpresas = localStorage.getItem('empresas');

      // MIGRACIÓN: Agregar empresa a equipos sin ella
      const migrateEquipos = (equipos, defaultEmpresa = 'Location World') => {
        if (!equipos) return [];
        return equipos.map(equipo => ({
          ...equipo,
          empresa: equipo.empresa || defaultEmpresa
        }));
      };

      // Migrar trabajos
      if (storedTrabajos) {
        const trabajosData = JSON.parse(storedTrabajos);
        setTrabajos(migrateEquipos(trabajosData, 'Location World'));
      }
      
      // Migrar equipos nuevos
      if (storedEquiposNuevos) {
        const equiposData = JSON.parse(storedEquiposNuevos);
        setEquiposNuevos(migrateEquipos(equiposData, 'Location World'));
      }
      
      // Migrar equipos retirados
      if (storedEquiposRetirados) {
        const equiposData = JSON.parse(storedEquiposRetirados);
        setEquiposRetirados(migrateEquipos(equiposData, 'Location World'));
      }
      
      // Migrar equipos malos
      if (storedEquiposMalos) {
        const equiposData = JSON.parse(storedEquiposMalos);
        setEquiposMalos(migrateEquipos(equiposData, 'Location World'));
      }
      
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
          empresas={empresas}
          empresaSeleccionada={empresaSeleccionada}
          setEmpresaSeleccionada={setEmpresaSeleccionada}
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

      {currentView === 'valores' && (
        <ValoresTrabajos 
          setCurrentView={setCurrentView}
        />
      )}
    </div>
  );
};

export default App;