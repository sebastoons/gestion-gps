import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import ValoresTrabajos from './components/ValoresTrabajos';
import ValidacionWhatsapp from './components/ValidacionWhatsapp';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import EscanerGPS from './components/EscanerGPS';
import { Sun, Moon } from 'lucide-react';
import { supabase, loadTable, syncTable } from './lib/supabase';
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
  // skipSync: prevents the initial load from triggering a sync back to Supabase
  const skipSync = useRef({ trabajos: false, equiposNuevos: false, equiposRetirados: false, equiposMalos: false, clientes: false });

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
      // Si alguna tabla falló (null), no cargamos ni sincronizamos
      if (t === null || en === null || er === null || em === null) {
        console.error('Error al cargar datos de Supabase. Los datos locales se mantienen.');
        setLoaded(true); // permite uso offline pero NO dispara sync
        return;
      }
      // Marcar skip para que la carga inicial no dispare sync hacia Supabase
      skipSync.current = { trabajos: true, equiposNuevos: true, equiposRetirados: true, equiposMalos: true, clientes: true };
      setTrabajos(t.map(norm));
      setEquiposNuevos(en.map(norm));
      setEquiposRetirados(er.map(norm));
      setEquiposMalos(em.map(norm));
      if (cl !== null && cl.length > 0) {
        setClientes(cl);
      } else {
        const stored = localStorage.getItem('clientes');
        if (stored) try { setClientes(JSON.parse(stored)); } catch(_) {}
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  // Sincronizar a Supabase — solo cuando el usuario cambia datos (no en carga inicial)
  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.trabajos) { skipSync.current.trabajos = false; return; }
    const t = setTimeout(() => syncTable('trabajos', trabajos), 1500);
    return () => clearTimeout(t);
  }, [trabajos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposNuevos) { skipSync.current.equiposNuevos = false; return; }
    const t = setTimeout(() => syncTable('equipos_nuevos', equiposNuevos), 1500);
    return () => clearTimeout(t);
  }, [equiposNuevos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposRetirados) { skipSync.current.equiposRetirados = false; return; }
    const t = setTimeout(() => syncTable('equipos_retirados', equiposRetirados), 1500);
    return () => clearTimeout(t);
  }, [equiposRetirados, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposMalos) { skipSync.current.equiposMalos = false; return; }
    const t = setTimeout(() => syncTable('equipos_malos', equiposMalos), 1500);
    return () => clearTimeout(t);
  }, [equiposMalos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.clientes) { skipSync.current.clientes = false; return; }
    const t = setTimeout(() => syncTable('clientes', clientes), 1500);
    return () => clearTimeout(t);
  }, [clientes, loaded]);

  // Realtime: recibe cambios de otros dispositivos en vivo
  useEffect(() => {
    if (!loaded) return;
    const ch = supabase.channel('live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' },
        async () => { const d = await loadTable('trabajos'); if (!d) return; skipSync.current.trabajos = true; setTrabajos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_nuevos' },
        async () => { const d = await loadTable('equipos_nuevos'); if (!d) return; skipSync.current.equiposNuevos = true; setEquiposNuevos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_retirados' },
        async () => { const d = await loadTable('equipos_retirados'); if (!d) return; skipSync.current.equiposRetirados = true; setEquiposRetirados(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_malos' },
        async () => { const d = await loadTable('equipos_malos'); if (!d) return; skipSync.current.equiposMalos = true; setEquiposMalos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' },
        async () => { const d = await loadTable('clientes'); if (!d) return; skipSync.current.clientes = true; setClientes(d); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loaded]);

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
