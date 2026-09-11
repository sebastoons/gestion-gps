import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import ValoresTrabajos from './components/ValoresTrabajos';
import ValidacionWhatsapp from './components/ValidacionWhatsapp';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import EscanerGPS from './components/EscanerGPS';
import Materiales from './components/Materiales';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import { Sun, Moon, X, Plus, Download, Upload } from 'lucide-react';
import { supabase, loadTable, syncTable, deleteFromTable, exportBackup, importBackup } from './lib/supabase';
import { preciosDe, calcularUF } from './utils/pricing';
import './styles/Common.css';

// ── Gestión de empresas ───────────────────────────────────────────────────────
const EmpresasModal = ({ empresas, setEmpresas, onRemove, onClose }) => {
  const [newName, setNewName] = useState('');
  const add = () => {
    const n = newName.trim();
    // Comparación case-insensitive: "mega gps" y "Mega GPS" deben tratarse
    // como la MISMA empresa, si no cada una termina con su propio id_counter,
    // ot_counter y filtro de vista, partiendo en dos los datos de una sola
    // empresa (bug de "empresa duplicada" difícil de notar hasta que los
    // trabajos de una de las dos "mitades" parecen desaparecer).
    if (!n || empresas.some(e => e.trim().toLowerCase() === n.toLowerCase())) return;
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
                <button onClick={() => onRemove(e)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626' }}><X size={14}/></button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Nueva empresa..."
            style={{ flex:1, padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:8, fontFamily:'Quantico', fontSize:'0.8em', textTransform:'uppercase' }} />
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
          Tus datos se sincronizan automáticamente entre dispositivos vía Supabase. Exporta un archivo igual como respaldo extra o para migrar a otra cuenta.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-primary" onClick={async () => {
            const fallos = await exportBackup();
            setMsg(fallos.length
              ? { ok:false, text:`Archivo descargado, pero no se pudo leer: ${fallos.join(', ')}. Vuelve a intentar antes de confiar en este respaldo.` }
              : { ok:true, text:'Archivo descargado.' });
          }}>
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
  const skipSync = useRef({ trabajos: true, equiposNuevos: true, equiposRetirados: true, equiposMalos: true, clientes: true, materiales: true, empresas: true, preciosEmpresas: true });
  const [escanerReturn, setEscanerReturn] = useState('home');
  const [materError, setMaterError] = useState(null);
  // Precios (valor UF, valor km, tablas de servicios/accesorios) por
  // empresa — objeto {nombreEmpresa: {valorUF, valorKm, servicios, accesorios}}.
  const [preciosEmpresas, setPreciosEmpresas] = useState({});

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
  const [actualizacionDisponible, setActualizacionDisponible] = useState(false);
  const versionActual = useRef(null);
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

  const onRemoveEmpresa = async (nombre) => {
    setEmpresas(prev => prev.filter(x => x !== nombre));
    const err = await deleteFromTable('empresas', nombre);
    // Si la baja remota falla, revierte para no dejar el dispositivo
    // "creyendo" que la empresa se borró cuando en Supabase sigue existiendo.
    if (err) setEmpresas(prev => prev.includes(nombre) ? prev : [...prev, nombre]);
  };

  // Cargar desde Supabase al iniciar — única fuente de verdad
  useEffect(() => {
    const loadData = async () => {
      const [t, en, er, em, cl, mat, emp, prec] = await Promise.all([
        loadTable('trabajos'),
        loadTable('equipos_nuevos'),
        loadTable('equipos_retirados'),
        loadTable('equipos_malos'),
        loadTable('clientes'),
        loadTable('materiales'),
        loadTable('empresas'),
        loadTable('precios_empresa'),
      ]);
      // Si Supabase ya tiene empresas guardadas, esas mandan (skip del eco de
      // sincronización). Si la tabla está vacía (proyecto recién conectado),
      // se deja el valor local/por-defecto y SÍ se sincroniza, para sembrar
      // la nube con lo que ya tenía este dispositivo.
      skipSync.current = {
        trabajos: true, equiposNuevos: true, equiposRetirados: true, equiposMalos: true,
        clientes: true, materiales: true, empresas: emp.length > 0, preciosEmpresas: true,
      };
      setTrabajos(t.map(norm));
      setEquiposNuevos(en.map(norm));
      setEquiposRetirados(er.map(norm));
      setEquiposMalos(em.map(norm));
      // clientes/materiales también llevan "empresa": sin normalizar, un
      // registro guardado con un nombre viejo de empresa (ej. "LW" antes de
      // renombrarse a "Entel") deja de coincidir con el filtro por empresa
      // vigente y desaparece silenciosamente de la vista de esa empresa.
      setClientes((cl || []).map(norm));
      setMateriales((mat || []).map(norm));
      if (emp.length) setEmpresas(emp.map(e => e.nombre));
      setPreciosEmpresas(Object.fromEntries((prec || []).map(p => [p.empresa, p])));
      setLoaded(true);
    };
    loadData();
  }, []);

  // Sincronizar adiciones/ediciones a Supabase (upsert, no borra)
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

  // Empresas: agregar sincroniza (upsert); quitar es explícito, ver onRemoveEmpresa.
  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.empresas) { skipSync.current.empresas = false; return; }
    const t = setTimeout(() => syncTable('empresas', empresas.map(nombre => ({ id: nombre, nombre }))), 300);
    return () => clearTimeout(t);
  }, [empresas, loaded]);

  // Precios por empresa (valor UF, valor km, servicios, accesorios) — se
  // sincroniza igual que empresas, reenviando el objeto completo cada vez
  // (son pocas empresas con pocos campos cada una, el payload es chico).
  useEffect(() => {
    if (!loaded) return;
    if (skipSync.current.preciosEmpresas) { skipSync.current.preciosEmpresas = false; return; }
    const items = Object.entries(preciosEmpresas).map(([empresa, cfg]) => ({ id: empresa, empresa, ...cfg }));
    if (!items.length) return;
    const t = setTimeout(() => syncTable('precios_empresa', items), 300);
    return () => clearTimeout(t);
  }, [preciosEmpresas, loaded]);

  // Coherencia con "Valor de Trabajos": si se edita el precio de un
  // servicio/accesorio o el valor UF de una empresa, los trabajos YA
  // INGRESADOS de esa empresa tienen que reflejar el precio nuevo — no sólo
  // los que se creen de ahora en adelante. Se recalcula valorUF/valorPesos
  // de CADA trabajo a partir de su servicio/accesorios y los precios
  // vigentes de su empresa (no sólo el mes que esté abierto en Trabajos del
  // Mes en este momento), y sólo se sincroniza lo que realmente cambió.
  useEffect(() => {
    if (!loaded || !trabajos.length) return;
    const cambiados = [];
    const actualizados = trabajos.map(t => {
      const precios = preciosDe(t.empresa, preciosEmpresas);
      const nuevoUF = calcularUF(t.servicio, t.accesorios || [], precios);
      const nuevoUFStr = nuevoUF % 1 === 0 ? nuevoUF.toString() : parseFloat(nuevoUF.toFixed(2)).toString();
      const nuevoPesos = Math.round(nuevoUF * precios.valorUF).toString();
      if (nuevoUFStr !== t.valorUF || nuevoPesos !== t.valorPesos) {
        const actualizado = { ...t, valorUF: nuevoUFStr, valorPesos: nuevoPesos };
        cambiados.push(actualizado);
        return actualizado;
      }
      return t;
    });
    if (cambiados.length) {
      skipSync.current.trabajos = true; // ya se sincroniza explícito abajo, sólo lo cambiado
      setTrabajos(actualizados);
      syncTable('trabajos', cambiados);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preciosEmpresas, loaded]);

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
  useEffect(() => {
    if (!loaded) return;
    const ch = supabase.channel('live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' },
        async () => { const d = await loadTable('trabajos'); skipSync.current.trabajos = true; setTrabajos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_nuevos' },
        async () => { const d = await loadTable('equipos_nuevos'); skipSync.current.equiposNuevos = true; setEquiposNuevos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_retirados' },
        async () => { const d = await loadTable('equipos_retirados'); skipSync.current.equiposRetirados = true; setEquiposRetirados(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_malos' },
        async () => { const d = await loadTable('equipos_malos'); skipSync.current.equiposMalos = true; setEquiposMalos(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' },
        async () => { const d = await loadTable('clientes'); skipSync.current.clientes = true; setClientes(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materiales' },
        // Sin el guard "d.length > 0" que tenía antes: si otro dispositivo
        // borra el último material/empresa, este también debe reflejar la
        // lista vacía en vez de quedarse para siempre con datos ya borrados.
        async () => { const d = await loadTable('materiales'); skipSync.current.materiales = true; setMateriales(d.map(norm)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' },
        async () => { const d = await loadTable('empresas'); skipSync.current.empresas = true; setEmpresas(d.map(e => e.nombre)); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'precios_empresa' },
        async () => { const d = await loadTable('precios_empresa'); skipSync.current.preciosEmpresas = true; setPreciosEmpresas(Object.fromEntries(d.map(p => [p.empresa, p]))); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loaded]);

  // Avisa cuando Netlify publicó una versión nueva de la app. Usa
  // asset-manifest.json — lo genera react-scripts en cada build sin
  // depender de ningún script propio (a diferencia de un archivo de
  // versión escrito a mano, que sólo se actualiza si el comando de build
  // configurado en Netlify realmente dispara ese script) — y su nombre de
  // archivo principal (main.[hash].js) cambia únicamente cuando el código
  // servido realmente cambió. Si al comparar difiere del que se cargó al
  // abrir la app, muestra el aviso para recargar. No usa un service worker
  // (el anterior dejaba dispositivos atrapados en versiones viejas — ver
  // src/index.js).
  useEffect(() => {
    const revisar = async () => {
      try {
        const res = await fetch(`/asset-manifest.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { files } = await res.json();
        const version = files?.['main.js'];
        if (!version) return;
        if (versionActual.current === null) { versionActual.current = version; return; }
        if (version !== versionActual.current) setActualizacionDisponible(true);
      } catch { /* sin conexión; se vuelve a intentar en el próximo ciclo */ }
    };
    revisar();
    const intervalo = setInterval(revisar, 2 * 60 * 1000);
    const alVolver = () => { if (document.visibilityState === 'visible') revisar(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', revisar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', revisar);
    };
  }, []);

  return (
    <div className="font-sans" style={actualizacionDisponible ? { paddingTop: 44 } : undefined}>
      {actualizacionDisponible && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:2000,
          display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap',
          padding:'10px 16px', background:'#3b82f6', color:'#fff',
          fontFamily:'Quantico', fontSize:'0.75em', fontWeight:'bold', textTransform:'uppercase',
          boxShadow:'0 2px 10px rgba(0,0,0,0.25)',
        }}>
          <span>🔄 Hay una actualización disponible. Recarga la página para continuar.</span>
          <button onClick={() => window.location.reload()} className="btn btn-secondary"
            style={{ fontSize:'1em', padding:'4px 12px', background:'#fff', color:'#3b82f6', borderColor:'#fff' }}>
            Recargar ahora
          </button>
        </div>
      )}

      {currentView !== 'home' && (
        <div style={{ position:'fixed', bottom:'10px', right:'15px', display:'flex', flexDirection:'column', gap:'8px', zIndex:1000 }}>
          <button onClick={() => setDarkMode(d => !d)} className="btn btn-secondary" style={{ boxShadow:'0 4px 12px rgba(0,0,0,0.2)', justifyContent:'center' }} title="Cambiar tema">
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            {darkMode ? 'Claro' : 'Oscuro'}
          </button>
        </div>
      )}

      {showEmpresasModal && (
        <EmpresasModal empresas={empresas} setEmpresas={setEmpresas} onRemove={onRemoveEmpresa} onClose={() => setShowEmpresasModal(false)} />
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
          clientes={clientes} setClientes={setClientes}
          preciosEmpresas={preciosEmpresas} setPreciosEmpresas={setPreciosEmpresas} />
      )}

      {currentView === 'valores' && (
        <ValoresTrabajos setCurrentView={setCurrentView} empresas={empresas}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          preciosEmpresas={preciosEmpresas} setPreciosEmpresas={setPreciosEmpresas} />
      )}

      {currentView === 'clientes' && (
        <Clientes setCurrentView={setCurrentView} clientes={clientes} setClientes={setClientes} empresas={empresas}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada} />
      )}

      {currentView === 'dashboard' && (
        <Dashboard setCurrentView={setCurrentView} trabajos={trabajos} empresas={empresas}
          mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado}
          preciosEmpresas={preciosEmpresas} />
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
          empresas={empresas} empresaSeleccionada={empresaSeleccionada} />
      )}

      {currentView === 'validacion' && (
        <ValidacionWhatsapp setCurrentView={setCurrentView} empresas={empresas}
          equiposNuevos={equiposNuevos} setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados} setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos} setEquiposMalos={setEquiposMalos}
          trabajos={trabajos} setTrabajos={setTrabajos}
          clientes={clientes} setClientes={setClientes}
          materiales={materiales} setMateriales={setMateriales}
          mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado} setOtQueue={setOtQueue}
          empresaSeleccionada={empresaSeleccionada} setEmpresaSeleccionada={setEmpresaSeleccionada}
          pendingOT={pendingOT} setPendingOT={setPendingOT}
          preciosEmpresas={preciosEmpresas} />
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
