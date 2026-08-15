import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import ValoresTrabajos from './components/ValoresTrabajos';
import ValidacionWhatsapp from './components/ValidacionWhatsapp';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import EscanerGPS from './components/EscanerGPS';
import Materiales from './components/Materiales';
import Dashboard from './components/Dashboard';
import { Sun, Moon, X, Plus, Download, Upload } from 'lucide-react';
import { loadTable, syncTable, exportBackup, importBackup } from './lib/localStore';
import './styles/Common.css';

// ── Gestión de empresas ───────────────────────────────────────────────────────
const EmpresasModal = ({ empresas, setEmpresas, onClose }) => {
  const [newName, setNewName] = useState('');
  const add = () => {
    const n = newName.trim();
    if (!n || empresas.includes(n)) return;
    setEmpresas(prev => [...prev, n]);
    setNewName('');
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:'100%', maxWidth:360, boxShadow:'0 20px 40px rgba(0,0,0,0.3)' }} className="dark-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontFamily:'Changa', fontWeight:'bold', fontSize:'1em', textTransform:'uppercase' }}>Gestionar Empresas</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><X size={18}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {empresas.map(e => (
            <div key={e} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#f3f4f6', borderRadius:8 }}>
              <span style={{ fontFamily:'Quantico', fontSize:'0.85em', fontWeight:'bold' }}>{e}</span>
              {empresas.length > 1 && (
                <button onClick={() => setEmpresas(prev => prev.filter(x => x !== e))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626' }}><X size={14}/></button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Nueva empresa..."
            style={{ flex:1, padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:8, fontFamily:'Quantico', fontSize:'0.8em' }} />
          <button onClick={add} className="btn btn-primary" style={{ fontSize:'0.8em', padding:'6px 12px' }}>
            <Plus size={13}/> Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Respaldo manual (exportar / importar) ────────────────────────────────────
const RespaldoModal = ({ onClose }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Importar reemplazará TODOS los datos guardados en este dispositivo por los del archivo. ¿Continuar?')) {
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      await importBackup(file);
      setMsg({ ok: true, text: 'Datos importados. Recargando la app...' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setMsg({ ok: false, text: `Error al importar: ${err.message}` });
      setBusy(false);
    }
    e.target.value = '';
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:'100%', maxWidth:380, boxShadow:'0 20px 40px rgba(0,0,0,0.3)' }} className="dark-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontFamily:'Changa', fontWeight:'bold', fontSize:'1em', textTransform:'uppercase' }}>Respaldo de Datos</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><X size={18}/></button>
        </div>
        <p style={{ fontFamily:'Quantico', fontSize:'0.65em', color:'#6b7280', textTransform:'uppercase', marginBottom:16, lineHeight:1.5 }}>
          Los datos se guardan solo en este dispositivo. Exporta un archivo para respaldar o mover tu información a otro celular/computador, y luego impórtalo ahí.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-primary" onClick={() => { exportBackup(); setMsg({ ok:true, text:'Archivo descargado.' }); }}>
            <Download size={15}/> Exportar respaldo
          </button>
          <button className="btn btn-secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload size={15}/> Importar respaldo
          </button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display:'none' }} onChange={handleImport} />
        </div>
        {msg && (
          <p style={{ marginTop:14, fontFamily:'Quantico', fontSize:'0.65em', textTransform:'uppercase', color: msg.ok ? '#166534' : '#dc2626' }}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
};

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
  const [materiales, setMateriales] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const skipSync = useRef({ trabajos: true, equiposNuevos: true, equiposRetirados: true, equiposMalos: true, clientes: true, materiales: true });
  const [escanerReturn, setEscanerReturn] = useState('home');
  const [materError, setMaterError] = useState(null);

  const [empresas, setEmpresas] = useState(() => {
    try { const s = localStorage.getItem('empresas'); return s ? JSON.parse(s) : ['UGPS']; } catch { return ['UGPS']; }
  });
  const [showEmpresasModal, setShowEmpresasModal] = useState(false);
  const [showRespaldoModal, setShowRespaldoModal] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(() => {
    try { const s = localStorage.getItem('empresas'); const list = s ? JSON.parse(s) : ['UGPS']; return list[0] || 'UGPS'; } catch { return 'UGPS'; }
  });
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const n = new Date();
    const m = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${m[n.getMonth()]} ${n.getFullYear()}`;
  });
  const [otQueue, setOtQueue] = useState([]);
  const [pendingOT, setPendingOT] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const s = localStorage.getItem('theme');
    return s !== null ? s === 'dark' : true;
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('empresas', JSON.stringify(empresas));
    if (empresas.length > 0 && !empresas.includes(empresaSeleccionada)) {
      setEmpresaSeleccionada(empresas[0]);
    }
  }, [empresas, empresaSeleccionada]);

  // Cargar desde el almacenamiento local del dispositivo — única fuente de verdad
  useEffect(() => {
    const loadData = async () => {
      const [t, en, er, em, cl, mat] = await Promise.all([
        loadTable('trabajos'),
        loadTable('equipos_nuevos'),
        loadTable('equipos_retirados'),
        loadTable('equipos_malos'),
        loadTable('clientes'),
        loadTable('materiales'),
      ]);
      skipSync.current = { trabajos: true, equiposNuevos: true, equiposRetirados: true, equiposMalos: true, clientes: true, materiales: true };
      setTrabajos(t.map(norm));
      setEquiposNuevos(en.map(norm));
      setEquiposRetirados(er.map(norm));
      setEquiposMalos(em.map(norm));
      if (cl?.length) setClientes(cl);
      if (mat?.length) setMateriales(mat);
      setLoaded(true);
    };
    loadData();
  }, []);

  // Guardar adiciones/ediciones en el almacenamiento local (upsert, no borra)
  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.trabajos) { skipSync.current.trabajos = false; return; }
    const t = setTimeout(() => syncTable('trabajos', trabajos), 300);
    return () => clearTimeout(t);
  }, [trabajos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposNuevos) { skipSync.current.equiposNuevos = false; return; }
    const t = setTimeout(() => syncTable('equipos_nuevos', equiposNuevos), 300);
    return () => clearTimeout(t);
  }, [equiposNuevos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposRetirados) { skipSync.current.equiposRetirados = false; return; }
    const t = setTimeout(() => syncTable('equipos_retirados', equiposRetirados), 300);
    return () => clearTimeout(t);
  }, [equiposRetirados, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.equiposMalos) { skipSync.current.equiposMalos = false; return; }
    const t = setTimeout(() => syncTable('equipos_malos', equiposMalos), 300);
    return () => clearTimeout(t);
  }, [equiposMalos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.clientes) { skipSync.current.clientes = false; return; }
    const t = setTimeout(() => syncTable('clientes', clientes), 300);
    return () => clearTimeout(t);
  }, [clientes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.materiales) { skipSync.current.materiales = false; return; }
    let active = true;
    const t = setTimeout(async () => {
      const err = await syncTable('materiales', materiales);
      if (!active) return;
      if (err) setMaterError(prev => prev || 'sync');
      else setMaterError(null);
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [materiales, loaded]);

  // Realtime: recibe cambios de otros dispositivos en vivo
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

      {showEmpresasModal && (
        <EmpresasModal empresas={empresas} setEmpresas={setEmpresas} onClose={() => setShowEmpresasModal(false)} />
      )}

      {showRespaldoModal && (
        <RespaldoModal onClose={() => setShowRespaldoModal(false)} />
      )}

      {currentView === 'home' && <Home setCurrentView={setCurrentView} darkMode={darkMode} setDarkMode={setDarkMode}
        empresas={empresas} onManageEmpresas={() => setShowEmpresasModal(true)}
        onRespaldo={() => setShowRespaldoModal(true)} />}

      {currentView === 'trabajos' && (
        <Trabajos setCurrentView={setCurrentView} trabajos={trabajos} setTrabajos={setTrabajos}
          empresas={empresas} empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          clientes={clientes} setClientes={setClientes} />
      )}

      {currentView === 'valores' && <ValoresTrabajos setCurrentView={setCurrentView} />}

      {currentView === 'dashboard' && (
        <Dashboard setCurrentView={setCurrentView} trabajos={trabajos} empresas={empresas} />
      )}

      {currentView === 'ordenes' && (
        <OrdenesTrabajo setCurrentView={setCurrentView} empresas={empresas}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          clientes={clientes} otQueue={otQueue} setOtQueue={setOtQueue}
          pendingOT={pendingOT} setPendingOT={setPendingOT} />
      )}

      {currentView === 'escaner' && (
        <EscanerGPS setCurrentView={setCurrentView} returnView={escanerReturn}
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
          materiales={materiales} setMateriales={setMateriales}
          mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado} setOtQueue={setOtQueue}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          pendingOT={pendingOT} setPendingOT={setPendingOT} />
      )}

      {(currentView === 'materiales' || currentView === 'equipos') && (
        <Materiales setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          materiales={materiales} setMateriales={setMateriales}
          empresas={empresas} empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          onOpenScanner={() => { setEscanerReturn('materiales'); setCurrentView('escaner'); }}
          dbError={materError} />
      )}
    </div>
  );
};

export default App;
