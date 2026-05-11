import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import ValoresTrabajos from './components/ValoresTrabajos';
import ValidacionWhatsapp from './components/ValidacionWhatsapp';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import EscanerGPS from './components/EscanerGPS';
import { Sun, Moon } from 'lucide-react';
import { loadTable, syncTable } from './lib/supabase';
import './styles/Common.css';

const normalizeEmpresa = (e) => {
  if (!e || e === 'Location World' || e === 'LW' || e === 'LW ENTEL') return 'Entel';
  return e;
};
const norm = item => ({ ...item, empresa: normalizeEmpresa(item.empresa) });

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [trabajos, setTrabajos] = useState([]);
  const [equiposNuevos, setEquiposNuevos] = useState([]);
  const [equiposRetirados, setEquiposRetirados] = useState([]);
  const [equiposMalos, setEquiposMalos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [empresas] = useState(['Entel', 'UGPS']);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('Entel');
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const n = new Date();
    const m = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${m[n.getMonth()]} ${n.getFullYear()}`;
  });
  const [otQueue, setOtQueue] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const s = localStorage.getItem('theme');
    return s !== null ? s === 'dark' : true;
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Cargar desde Supabase al iniciar
  useEffect(() => {
    const loadData = async () => {
      const [t, en, er, em, cl] = await Promise.all([
        loadTable('trabajos'),
        loadTable('equipos_nuevos'),
        loadTable('equipos_retirados'),
        loadTable('equipos_malos'),
        loadTable('clientes'),
      ]);
      setTrabajos(t.map(norm));
      setEquiposNuevos(en.map(norm));
      setEquiposRetirados(er.map(norm));
      setEquiposMalos(em.map(norm));
      if (cl.length > 0) {
        setClientes(cl);
      } else {
        // Migrar desde localStorage si Supabase está vacío
        const stored = localStorage.getItem('clientes');
        if (stored) setClientes(JSON.parse(stored));
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  // Sincronizar a Supabase con debounce (1.5s tras último cambio)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => syncTable('trabajos', trabajos), 1500);
    return () => clearTimeout(t);
  }, [trabajos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => syncTable('equipos_nuevos', equiposNuevos), 1500);
    return () => clearTimeout(t);
  }, [equiposNuevos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => syncTable('equipos_retirados', equiposRetirados), 1500);
    return () => clearTimeout(t);
  }, [equiposRetirados, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => syncTable('equipos_malos', equiposMalos), 1500);
    return () => clearTimeout(t);
  }, [equiposMalos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => syncTable('clientes', clientes), 1500);
    return () => clearTimeout(t);
  }, [clientes, loaded]);

  return (
    <div className="font-sans">
      {currentView !== 'home' && (
        <div style={{ position:'fixed', bottom:'10px', right:'15px', display:'flex', flexDirection:'column', gap:'8px', zIndex:1000 }}>
          <button onClick={() => setDarkMode(d => !d)} className="btn btn-secondary" style={{ boxShadow:'0 4px 12px rgba(0,0,0,0.2)', justifyContent:'center' }} title="Cambiar tema">
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            {darkMode ? 'Claro' : 'Oscuro'}
          </button>
        </div>
      )}

      {currentView === 'home' && <Home setCurrentView={setCurrentView} darkMode={darkMode} setDarkMode={setDarkMode} />}

      {currentView === 'trabajos' && (
        <Trabajos setCurrentView={setCurrentView} trabajos={trabajos} setTrabajos={setTrabajos}
          empresas={empresas} empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          clientes={clientes} setClientes={setClientes} />
      )}

      {currentView === 'equipos' && (
        <Equipos setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          empresas={empresas} empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada} />
      )}

      {currentView === 'valores' && <ValoresTrabajos setCurrentView={setCurrentView} />}

      {currentView === 'ordenes' && (
        <OrdenesTrabajo setCurrentView={setCurrentView} empresas={empresas}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          clientes={clientes} otQueue={otQueue} setOtQueue={setOtQueue} />
      )}

      {currentView === 'escaner' && (
        <EscanerGPS setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          empresas={empresas} />
      )}

      {currentView === 'validacion' && (
        <ValidacionWhatsapp setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          trabajos={trabajos} setTrabajos={setTrabajos}
          clientes={clientes} setClientes={setClientes}
          mesSeleccionado={mesSeleccionado} setOtQueue={setOtQueue} />
      )}
    </div>
  );
};

export default App;
