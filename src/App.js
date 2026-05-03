import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import ValoresTrabajos from './components/ValoresTrabajos';
import ValidacionWhatsapp from './components/ValidacionWhatsapp';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import { Download, Upload } from 'lucide-react';
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
  const [mesSeleccionado, setMesSeleccionado] = useState('Octubre 2025');

  // Cargar desde Supabase al iniciar
  useEffect(() => {
    const loadData = async () => {
      const [t, en, er, em] = await Promise.all([
        loadTable('trabajos'),
        loadTable('equipos_nuevos'),
        loadTable('equipos_retirados'),
        loadTable('equipos_malos'),
      ]);
      setTrabajos(t.map(norm));
      setEquiposNuevos(en.map(norm));
      setEquiposRetirados(er.map(norm));
      setEquiposMalos(em.map(norm));
      const storedClientes = localStorage.getItem('clientes');
      if (storedClientes) setClientes(JSON.parse(storedClientes));
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
    localStorage.setItem('clientes', JSON.stringify(clientes));
  }, [clientes]);

  // ── Backup ──────────────────────────────────────────────────────────────────
  const exportarBackup = () => {
    const backup = {
      version: '2.0', fecha: new Date().toISOString(),
      datos: { trabajos, equiposNuevos, equiposRetirados, equiposMalos, clientes, empresaSeleccionada, mesSeleccionado }
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-gps-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✓ Backup exportado correctamente.');
  };

  const importarBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.datos) { alert('❌ Archivo de backup inválido'); return; }
        const msg = `⚠️ ¿Deseas restaurar este backup?\n\nFecha: ${new Date(backup.fecha).toLocaleString('es-CL')}\nVersión: ${backup.version || '1.0'}\n\nEsto reemplazará todos los datos actuales.`;
        if (window.confirm(msg)) {
          const v = (e) => { const n = normalizeEmpresa(e); return empresas.includes(n) ? n : 'Entel'; };
          const migrate = (item) => ({ ...item, empresa: v(item.empresa) });
          if (backup.datos.trabajos) setTrabajos(backup.datos.trabajos.map(migrate));
          if (backup.datos.equiposNuevos) setEquiposNuevos(backup.datos.equiposNuevos.map(migrate));
          if (backup.datos.equiposRetirados) setEquiposRetirados(backup.datos.equiposRetirados.map(migrate));
          if (backup.datos.equiposMalos) setEquiposMalos(backup.datos.equiposMalos.map(migrate));
          if (backup.datos.clientes) setClientes(backup.datos.clientes);
          if (backup.datos.empresaSeleccionada) setEmpresaSeleccionada(v(backup.datos.empresaSeleccionada));
          if (backup.datos.mesSeleccionado) setMesSeleccionado(backup.datos.mesSeleccionado);
          alert(`✓ Backup restaurado correctamente.`);
        }
      } catch (err) {
        console.error(err);
        alert('❌ Error al leer el archivo de backup.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="font-sans">
      {currentView !== 'home' && (
        <div style={{ position:'fixed', bottom:'10px', right:'15px', display:'flex', flexDirection:'column', gap:'10px', fontSize:'0.85em', zIndex:1000 }}>
          <button onClick={exportarBackup} className="btn btn-success" style={{ boxShadow:'0 4px 6px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:'7px' }} title="Exportar backup">
            <Download size={12} /> Backup
          </button>
          <label className="btn btn-primary" style={{ boxShadow:'0 4px 6px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:'7px', cursor:'pointer' }} title="Importar backup">
            <Upload size={12} /> Restaurar
            <input type="file" accept=".json" onChange={importarBackup} style={{ display:'none' }} />
          </label>
        </div>
      )}

      {currentView === 'home' && <Home setCurrentView={setCurrentView} />}

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
          clientes={clientes} />
      )}

      {currentView === 'validacion' && (
        <ValidacionWhatsapp setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          trabajos={trabajos} setTrabajos={setTrabajos}
          clientes={clientes} setClientes={setClientes}
          mesSeleccionado={mesSeleccionado} />
      )}
    </div>
  );
};

export default App;
