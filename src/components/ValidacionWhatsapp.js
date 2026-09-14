import React, { useState, useRef, useEffect } from 'react';
import { Home } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { deleteFromTable, syncTable, nextTrabajoId, nextEquipoId, agregarOActualizarCliente } from '../lib/supabase';
import { formatFecha } from '../utils/dateUtils';
import { ACCESORIOS, preciosDe, calcularUF, formatUF } from '../utils/pricing';

// Mismo listado (y mismos nombres exactos) que usa Trabajos.js — antes cada
// pantalla tenía su propia lista de periféricos con nombres distintos para
// lo mismo (ej. "sensor puerta" acá, "Sensor Puerta" allá), así que un
// precio editado en una no tenía cómo aplicarse en la otra.
const PERIFERICOS = ACCESORIOS;

const MARCAS_VAL = [
  'Alfa Romeo','Audi','BAIC','BMW','BYD','Changan','Chery','Chevrolet','Citroën',
  'DAF','DFSK','Dodge','Dongfeng','Fiat','Ford','Foton','Geely','Great Wall',
  'Haval','Hino','Honda','Hyundai','Isuzu','Iveco','JAC','JMC','Jeep','Kenworth',
  'Kia','Lada','Land Rover','Lexus','MAN','MG','Mahindra','Maxus','Mazda',
  'Mercedes-Benz','Mitsubishi','Nissan','Omoda','Opel','Peugeot','Porsche','Ram',
  'Renault','Scania','Seat','Skoda','Ssangyong','Subaru','Suzuki','Tata',
  'Toyota','Volkswagen','Volvo','Wuling','Otros'
];

const AÑOS_VAL = Array.from({ length: 37 }, (_, i) => String(2026 - i));

const VACIO = {
  cliente: '', fecha: '', servicio: 'Instalación', empresa: 'Entel',
  ppuVinIn: '', ppuVinOut: '', marca: '', modelo: '', anio: '',
  gpsIn: '', gpsOut: '', kms: '',
  ubicacion: '', perifericos: [], detalles: '', trabajo: '',
  destinoDesinstalacion: 'Retirado',
  compania: '', idProveedor: ''
};

// Todos los campos del formulario son reordenables (botón "Reordenar Campos").
// El orden elegido se guarda por dispositivo, igual que otras preferencias de
// interfaz (theme, tipoDocumento). "Compañía" e "ID Proveedor" (datos que
// piden algunas empresas GPS, ej. Mavi GPS) parten arriba de todo por defecto.
const ORDEN_CAMPOS_DEFAULT = [
  'compania', 'idProveedor', 'empresa', 'cliente', 'fecha', 'servicio',
  'ppuVinIn', 'ppuVinOut', 'marca', 'modelo', 'anio', 'gpsIn', 'gpsOut',
  'kms', 'ubicacion', 'perifericos', 'detalles', 'trabajo', 'destino',
];
const ORDEN_CAMPOS_KEY = 'ordenCamposValidacion';
const cargarOrdenCampos = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(ORDEN_CAMPOS_KEY));
    if (Array.isArray(guardado) && guardado.length === ORDEN_CAMPOS_DEFAULT.length
      && ORDEN_CAMPOS_DEFAULT.every(k => guardado.includes(k))) return guardado;
  } catch { /* usa el default */ }
  return ORDEN_CAMPOS_DEFAULT;
};

// Varios campos comparten una sola línea del mensaje de WhatsApp (ej. PPU
// IN/OUT). El orden del mensaje sigue el orden visual usando la posición del
// primer campo de cada grupo que aparezca en ordenCampos.
const SEGMENTO_DE_CAMPO = {
  empresa: 'empresa', cliente: 'cliente', fecha: 'fecha', servicio: 'servicio',
  ppuVinIn: 'ppu', ppuVinOut: 'ppu',
  marca: 'vehiculo', modelo: 'vehiculo', anio: 'vehiculo',
  gpsIn: 'gps', gpsOut: 'gps',
  kms: 'kms', ubicacion: 'ubicacion', perifericos: 'perifericos',
  detalles: 'detalles', trabajo: 'trabajo',
  compania: 'compania', idProveedor: 'idProveedor',
};

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const getMesFacturacion = (fechaStr, empresa) => {
  const d = new Date(fechaStr + 'T12:00:00');
  if (isNaN(d)) return null;
  const base = (empresa === 'Entel' && d.getDate() >= 24)
    ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : d;
  return `${MESES_ES[base.getMonth()]} ${base.getFullYear()}`;
};

const CL_ITEMS = ['Batería','Check Engine','Error tablero inst.','A/C','Radio','Intermitentes'];

// ── Dropdown multi-select para periféricos ──────────────────────────────────
const PerifeDropdown = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = p => onChange(selected.includes(p) ? selected.filter(x => x !== p) : [...selected, p]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} className="perifedrop-trigger" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8,
        cursor: 'pointer', background: 'white', minHeight: 36, gap: 6, fontSize: '0.8em'
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected.length ? '#111' : '#9ca3af' }}>
          {selected.length === 0 ? 'Seleccionar...' : selected.join(', ')}
        </span>
        <ChevronDown size={13} style={{ flexShrink: 0 }} />
      </div>
      {open && (
        <div className="perifedrop-menu" style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid #d1d5db', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: 6
        }}>
          {PERIFERICOS.map(p => (
            <label key={p} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px',
              fontSize: '0.75em', textTransform: 'uppercase', cursor: 'pointer',
              borderRadius: 4, fontFamily: 'Quantico'
            }}>
              <input type="checkbox" checked={selected.includes(p)} onChange={() => toggle(p)}
                style={{ accentColor: '#507cdd' }} />
              {p}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ────────────────────────────────────────────────────
const ValidacionWhatsapp = ({
  setCurrentView,
  empresas,
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  trabajos, setTrabajos,
  clientes, setClientes,
  materiales, setMateriales,
  mesSeleccionado, setMesSeleccionado, setOtQueue,
  empresaSeleccionada, setEmpresaSeleccionada,
  pendingOT, setPendingOT,
  setFotosPendientes,
  preciosEmpresas,
}) => {
  const [form, setForm] = useState(() => ({ ...VACIO, empresa: empresaSeleccionada || empresas?.[0] || '' }));
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [showPpuOut, setShowPpuOut] = useState(false);
  const [showGpsOut, setShowGpsOut] = useState(false);
  const [ordenCampos, setOrdenCampos] = useState(cargarOrdenCampos);
  const [modoOrden, setModoOrden] = useState(false);

  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  // Reordena dentro de los campos actualmente visibles (algunos, como
  // "Destino GPS OUT", sólo se muestran según el servicio elegido), sin
  // perder la posición relativa de los que están ocultos.
  const moverCampo = (key, dir, visibles) => {
    setOrdenCampos(prev => {
      const pos = visibles.indexOf(key);
      const destino = visibles[pos + dir];
      if (!destino) return prev;
      const nuevo = [...prev];
      const i1 = nuevo.indexOf(key);
      const i2 = nuevo.indexOf(destino);
      [nuevo[i1], nuevo[i2]] = [nuevo[i2], nuevo[i1]];
      try { localStorage.setItem(ORDEN_CAMPOS_KEY, JSON.stringify(nuevo)); } catch { /* localStorage no disponible */ }
      return nuevo;
    });
  };

  const crearDraftOT = () => {
    const esReinst = form.servicio === 'Reinstalación';
    return {
      fecha: form.fecha,
      tipoServicio: esReinst ? 'Instalación' : form.servicio,
      region: '', ciudad: '', comuna: '',
      tecnico: 'Sebastian Parra', empresaInstaladora: 'Sebastian Parra',
      ppu: (form.ppuVinIn || '').toUpperCase(),
      marca: form.marca, modelo: form.modelo, anio: form.anio,
      color: '', kilometraje: form.kms || '',
      imeiIn: form.gpsIn || '',
      imeiOut: esReinst ? '' : (showGpsOut ? (form.gpsOut || '') : ''),
      accesoriosGPS: [],
      checklist: Object.fromEntries(CL_ITEMS.map(k => [k, { estado: 'NA', nota: '' }])),
      observaciones: [
        form.detalles, form.trabajo,
        form.perifericos.length ? `Periféricos: ${form.perifericos.join(', ')}` : ''
      ].filter(Boolean).join(' | '),
      _empresa: form.empresa,
      nombreCliente: form.cliente,
    };
  };

  const crearDraftOTDesinst = () => ({
    fecha: form.fecha,
    tipoServicio: 'Desinstalación',
    region: '', ciudad: '', comuna: '',
    tecnico: 'Sebastian Parra', empresaInstaladora: 'Sebastian Parra',
    // Es el mismo vehículo que la mitad de Instalación de esta Reinstalación:
    // si no se usó el checkbox "PPU/VIN OUT" (lo normal, es el mismo auto),
    // usa el PPU IN en vez de dejarlo vacío — antes quedaba vacío junto con
    // marca/modelo/año, bloqueando el guardado de la OT hasta escribirlos de
    // nuevo a mano pese a que ya se habían ingresado una vez.
    ppu: (showPpuOut && form.ppuVinOut ? form.ppuVinOut : form.ppuVinIn).toUpperCase(),
    marca: form.marca, modelo: form.modelo, anio: form.anio,
    color: '', kilometraje: '',
    imeiIn: '',
    imeiOut: showGpsOut ? (form.gpsOut || '') : '',
    accesoriosGPS: [],
    checklist: Object.fromEntries(CL_ITEMS.map(k => [k, { estado: 'NA', nota: '' }])),
    observaciones: [form.detalles, form.trabajo].filter(Boolean).join(' | '),
    _empresa: form.empresa,
    nombreCliente: form.cliente,
  });

  // Registro fotográfico pendiente para este trabajo — sólo los datos que
  // Registro Fotográfico también pide (ver FotosTrabajo.js), para
  // precargar el formulario cuando el usuario decida llenarlo.
  const crearDraftFoto = () => ({
    fecha: form.fecha,
    servicio: form.servicio,
    ppu: (form.ppuVinIn || '').toUpperCase(),
    marca: form.marca, modelo: form.modelo, anio: form.anio,
    cliente: form.cliente,
    ubicacion: form.ubicacion || '',
    empresa: form.empresa,
  });

  const verificarGPS = imei => {
    if (!imei?.trim()) return null;
    const i = imei.trim();
    if (equiposNuevos.find(e => e.imei === i && e.empresa === form.empresa)) return 'NUEVO';
    if (equiposRetirados.find(e => e.imei === i && e.empresa === form.empresa)) return 'RETIRADO';
    if (equiposMalos.find(e => e.imei === i && e.empresa === form.empresa)) return 'MALO';
    return null;
  };

  const generarLineaSegmento = seg => {
    switch (seg) {
      case 'empresa': return `*EMPRESA*: ${form.empresa}`;
      case 'cliente': return `*CLIENTE*: ${cap(form.cliente)}`;
      case 'fecha': return `*FECHA*: ${formatFecha(form.fecha)}`;
      case 'servicio': return `*SERVICIO*: ${cap(form.servicio)}`;
      case 'ppu': {
        // form.ppuVinOut no se limpia al desmarcar "PPU/VIN OUT" (sólo se
        // oculta el input) — sin este guard, el mensaje seguía mostrando un
        // valor que el usuario ya había "quitado" en la pantalla.
        if (!form.ppuVinIn && !(showPpuOut && form.ppuVinOut)) return null;
        const p = [];
        if (form.ppuVinIn) p.push(`*PPU/VIN IN*: ${form.ppuVinIn.toUpperCase()}`);
        if (showPpuOut && form.ppuVinOut) p.push(`*PPU/VIN OUT*: ${form.ppuVinOut.toUpperCase()}`);
        return p.join(' | ');
      }
      case 'vehiculo': {
        const vm = [form.marca, form.modelo, form.anio].filter(Boolean).join(' ');
        return vm ? `*MARCA/MODELO*: ${vm}` : null;
      }
      case 'gps': {
        if (!form.gpsIn && !(showGpsOut && form.gpsOut)) return null;
        const p = [];
        if (form.gpsIn) p.push(`*GPS IN*: ${form.gpsIn}`);
        if (showGpsOut && form.gpsOut) p.push(`*GPS OUT*: ${form.gpsOut}`);
        return p.join(' | ');
      }
      case 'kms': return form.kms ? `*KMS ODOMETRO*: ${form.kms}` : null;
      case 'ubicacion': return form.ubicacion ? `*UBICACION*: ${cap(form.ubicacion)}` : null;
      case 'perifericos': return form.perifericos.length ? `*PERIFERICOS*: ${form.perifericos.join(', ')}` : null;
      case 'detalles': return form.detalles ? `*DETALLES*: ${cap(form.detalles)}` : null;
      case 'trabajo': return form.trabajo ? `*TRABAJO*: ${cap(form.trabajo)}` : null;
      case 'compania': return form.compania ? `*COMPAÑÍA*: ${form.compania}` : null;
      case 'idProveedor': return form.idProveedor ? `*ID TICKET*: ${form.idProveedor}` : null;
      default: return null;
    }
  };

  const generarMensaje = () => {
    const vistos = new Set();
    const lineas = [];
    ordenCampos.forEach(k => {
      const seg = SEGMENTO_DE_CAMPO[k];
      if (!seg || vistos.has(seg)) return;
      vistos.add(seg);
      const linea = generarLineaSegmento(seg);
      if (linea) lineas.push(linea);
    });
    return lineas.join('\n');
  };

  const procesarEquipos = async () => {
    const { servicio, destinoDesinstalacion: dest } = form;
    const gpsIn = form.gpsIn?.trim();
    const gpsOut = showGpsOut ? form.gpsOut?.trim() : '';
    const quitarInventario = imei => {
      const enNuevos = equiposNuevos.find(e => e.imei === imei && e.empresa === form.empresa);
      if (enNuevos) { deleteFromTable('equipos_nuevos', enNuevos.id); setEquiposNuevos(prev => prev.filter(e => e.id !== enNuevos.id)); return; }
      const enRet = equiposRetirados.find(e => e.imei === imei && e.empresa === form.empresa);
      if (enRet) { deleteFromTable('equipos_retirados', enRet.id); setEquiposRetirados(prev => prev.filter(e => e.id !== enRet.id)); return; }
      // Un GPS "malo" reparado y reinstalado (el badge "MALO" en GPS IN ya
      // avisa que está ahí) también debe salir de ese inventario — si no,
      // queda contado dos veces: como reinstalado Y como malo para siempre.
      const enMalo = equiposMalos.find(e => e.imei === imei && e.empresa === form.empresa);
      if (enMalo) { deleteFromTable('equipos_malos', enMalo.id); setEquiposMalos(prev => prev.filter(e => e.id !== enMalo.id)); }
    };
    const descontarMateriales = (perifericos, empresa) => {
      if (!materiales?.length) return;
      perifericos.forEach(peri => {
        const norm = peri.toLowerCase();
        const match = materiales.find(m => m.empresa === empresa && m.tipo.toLowerCase() === norm);
        if (match) {
          deleteFromTable('materiales', match.id);
          setMateriales(prev => prev.filter(m => m.id !== match.id));
        }
      });
    };
    if (servicio === 'Instalación' || servicio === 'Reinstalación') {
      if (gpsIn) quitarInventario(gpsIn);
      if (form.perifericos.length > 0) descontarMateriales(form.perifericos, form.empresa);
    } else if (servicio === 'Desinstalación') {
      if (gpsOut) {
        if (dest === 'Malo') {
          const id = await nextEquipoId('equipos_malos', form.empresa, equiposMalos, 'M', empresas);
          setEquiposMalos(prev => [...prev, { id, imei: gpsOut, asignado: true, nombreCliente: form.cliente, empresa: form.empresa }]);
        } else {
          const id = await nextEquipoId('equipos_retirados', form.empresa, equiposRetirados, 'R', empresas);
          setEquiposRetirados(prev => [...prev, { id, fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa }]);
        }
      }
    } else if (servicio === 'Mantención') {
      if (gpsIn) quitarInventario(gpsIn);
      if (gpsOut) {
        const id = await nextEquipoId('equipos_retirados', form.empresa, equiposRetirados, 'R', empresas);
        setEquiposRetirados(prev => [...prev, { id, fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa }]);
      }
    }
  };

  const agregarClienteSiNoExiste = (nombre, empresa) =>
    agregarOActualizarCliente({ nombreCliente: nombre, empresa }, clientes, setClientes);

  // Retorna el mes de facturación en el que quedó registrado el trabajo, para
  // poder avisarle al usuario dónde encontrarlo si no coincide con el mes
  // que tiene seleccionado actualmente en "Trabajos del Mes".
  const agregarATrabajos = async () => {
    const emp = form.empresa;
    const mes = getMesFacturacion(form.fecha, emp) || mesSeleccionado;
    // Precios de la empresa elegida en ESTE formulario (form.empresa, no
    // necesariamente la misma que empresaSeleccionada globalmente) — cada
    // empresa tiene los suyos, editables desde "Valor de Trabajos". Antes el
    // valor UF estaba fijo en 39000 acá, distinto del resto de la app.
    const precios = preciosDe(emp, preciosEmpresas);
    const valorUFMes = precios.valorUF;

    if (form.servicio === 'Reinstalación') {
      const id1 = await nextTrabajoId(emp, trabajos, empresas);
      const id2 = await nextTrabajoId(emp, trabajos, empresas);
      const ufInst = calcularUF('Instalación', form.perifericos, precios);
      const ufDes = precios.servicios['Desinstalación'] || 0;
      const job1 = {
        id: id1, nombreCliente: form.cliente, fecha: form.fecha,
        servicio: 'Desinstalación', accesorios: [],
        ppuIn: '', ppuOut: showPpuOut ? form.ppuVinOut.toUpperCase() : '',
        imeiIn: '', imeiOut: showGpsOut ? form.gpsOut : '',
        // El odómetro (form.kms) NO se traspasa acá a propósito: el km de
        // Trabajos del Mes es un dato distinto (los km que se facturan) que
        // el usuario edita a mano después — mezclarlos con la lectura del
        // odómetro del vehículo pisaría ese valor manual.
        km: '', valorUF: formatUF(ufDes), valorPesos: Math.round(ufDes * valorUFMes).toString(),
        empresa: emp, mes
      };
      const job2 = {
        id: id2, nombreCliente: form.cliente, fecha: form.fecha,
        servicio: 'Instalación', accesorios: form.perifericos,
        ppuIn: form.ppuVinIn.toUpperCase(), ppuOut: '',
        imeiIn: form.gpsIn, imeiOut: '',
        km: '', valorUF: formatUF(ufInst), valorPesos: Math.round(ufInst * valorUFMes).toString(),
        empresa: emp, mes
      };
      setTrabajos(prev => [...prev, job1, job2]);
      await syncTable('trabajos', [job1, job2]);
    } else {
      const newId = await nextTrabajoId(emp, trabajos, empresas);
      const uf = calcularUF(form.servicio, form.perifericos, precios);
      const newJob = {
        id: newId, nombreCliente: form.cliente, fecha: form.fecha,
        servicio: form.servicio, accesorios: form.perifericos,
        ppuIn: form.ppuVinIn.toUpperCase(), ppuOut: showPpuOut ? form.ppuVinOut.toUpperCase() : '',
        imeiIn: form.gpsIn, imeiOut: showGpsOut ? form.gpsOut : '',
        // El odómetro (form.kms) NO se traspasa acá a propósito: el km de
        // Trabajos del Mes es un dato distinto (los km que se facturan) que
        // el usuario edita a mano después — mezclarlos con la lectura del
        // odómetro del vehículo pisaría ese valor manual.
        km: '', valorUF: formatUF(uf), valorPesos: Math.round(uf * valorUFMes).toString(),
        empresa: emp, mes
      };
      setTrabajos(prev => [...prev, newJob]);
      await syncTable('trabajos', [newJob]);
    }
    return { mes, empresa: emp };
  };

  const validar = () => {
    if (!form.cliente || !form.fecha) { alert('Completa los campos obligatorios: Cliente y Fecha'); return false; }
    return true;
  };

  const ejecutarAcciones = async () => {
    const esReinst = form.servicio === 'Reinstalación';
    await procesarEquipos();
    const { mes, empresa } = await agregarATrabajos();
    await agregarClienteSiNoExiste(form.cliente, empresa);
    setUltimoRegistro({ mes, empresa });
    if (setPendingOT) setPendingOT({ inst: crearDraftOT(), desinst: esReinst ? crearDraftOTDesinst() : null });
    // A diferencia de pendingOT (que se pisa), acá se acumula: si se valida
    // más de un vehículo seguido, Registro Fotográfico debe preguntar por
    // todos, uno por uno, cuando el usuario finalmente entre a esa sección.
    if (setFotosPendientes) {
      setFotosPendientes(prev => [...prev, { ...crearDraftFoto(), _qid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }]);
    }
    setForm(prev => ({
      ...VACIO,
      cliente: prev.cliente,
      empresa: prev.empresa,
      servicio: prev.servicio,
      marca: prev.marca,
      modelo: prev.modelo,
      anio: prev.anio,
    }));
    setShowPpuOut(false);
    setShowGpsOut(false);
  };

  const handleEnviar = async () => {
    if (!validar()) return;
    const msg = generarMensaje();
    await ejecutarAcciones();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopiar = () => {
    if (!validar()) return;
    const msg = generarMensaje();
    const copiar = async () => {
      await ejecutarAcciones();
      alert(`✓ Copiado y registrado en trabajos ${form.empresa}`);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(copiar).catch(() => { const ta=document.createElement('textarea');ta.value=msg;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);copiar(); });
    } else { const ta=document.createElement('textarea');ta.value=msg;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);copiar(); }
  };

  const gpsInEstado = verificarGPS(form.gpsIn);
  const gpsOutEstado = verificarGPS(form.gpsOut);
  const badge = est => ({
    backgroundColor: est==='NUEVO'?'#16a34a':est==='RETIRADO'?'#3b82f6':'#ef4444',
    color:'white', padding:'2px 6px', borderRadius:'4px', fontSize:'0.5em',
    fontFamily:'Quantico', fontWeight:'bold', position:'absolute', right:'8px',
    top:'50%', transform:'translateY(-50%)', pointerEvents:'none'
  });
  const lbl = { display:'block', fontFamily:'Quantico', fontSize:'0.6em', fontWeight:'bold', textTransform:'uppercase', color:'#374151', marginBottom:'4px' };

  // Contenido de cada campo del formulario, en un mapa por clave para que el
  // orden visual (ordenCampos, editable con "Reordenar Campos") sea el único
  // que decide en qué posición aparece cada uno dentro de la grilla.
  const nodosCampos = {
    compania: (
      <>
        <label style={lbl}>COMPAÑÍA</label>
        <input className="form-input" value={form.compania} onChange={e => set('compania', e.target.value)} />
      </>
    ),
    idProveedor: (
      <>
        <label style={lbl}>ID TICKET</label>
        <input className="form-input" value={form.idProveedor} onChange={e => set('idProveedor', e.target.value)} />
      </>
    ),
    empresa: (
      <>
        <label style={lbl}>EMPRESA</label>
        <select className="form-select" value={form.empresa} onChange={e => { set('empresa', e.target.value); if (setEmpresaSeleccionada) setEmpresaSeleccionada(e.target.value); }}>
          {(empresas || []).map(e => <option key={e}>{e}</option>)}
        </select>
      </>
    ),
    cliente: (
      <>
        <label style={lbl}>CLIENTE *</label>
        <input className="form-input" value={form.cliente} onChange={e => set('cliente', e.target.value)} />
      </>
    ),
    fecha: (
      <>
        <label style={lbl}>FECHA *</label>
        <input type="date" className="form-input" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
      </>
    ),
    servicio: (
      <>
        <label style={lbl}>SERVICIO</label>
        <select className="form-select" value={form.servicio} onChange={e => set('servicio', e.target.value)}>
          <option>Instalación</option><option>Desinstalación</option>
          <option>Mantención</option><option>Reinstalación</option><option>Visita Fallida</option>
        </select>
      </>
    ),
    ppuVinIn: (
      <>
        <label style={lbl}>PPU/VIN IN</label>
        <input className="form-input" value={form.ppuVinIn} onChange={e => set('ppuVinIn', e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }} />
      </>
    ),
    ppuVinOut: (
      <>
        <label style={{ ...lbl, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
          <input type="checkbox" checked={showPpuOut} onChange={e => setShowPpuOut(e.target.checked)}
            style={{ width:16, height:16, accentColor:'#3b82f6', cursor:'pointer' }} />
          PPU/VIN OUT
        </label>
        {showPpuOut && (
          <input className="form-input" value={form.ppuVinOut} onChange={e => set('ppuVinOut', e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }} />
        )}
      </>
    ),
    marca: (
      <>
        <label style={lbl}>MARCA</label>
        <select className="form-select" value={form.marca} onChange={e => set('marca', e.target.value)}>
          <option value="">Seleccionar...</option>
          {MARCAS_VAL.map(m => <option key={m}>{m}</option>)}
        </select>
      </>
    ),
    modelo: (
      <>
        <label style={lbl}>MODELO</label>
        <input className="form-input" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
      </>
    ),
    anio: (
      <>
        <label style={lbl}>AÑO</label>
        <select className="form-select" value={form.anio} onChange={e => set('anio', e.target.value)}>
          <option value="">Seleccionar...</option>
          {AÑOS_VAL.map(a => <option key={a}>{a}</option>)}
        </select>
      </>
    ),
    gpsIn: (
      <>
        <label style={lbl}>GPS IN (IMEI)</label>
        <div style={{ position:'relative' }}>
          <input className="form-input" type="tel" inputMode="numeric" pattern="[0-9]*"
            value={form.gpsIn} onChange={e => set('gpsIn', e.target.value)}
            style={{ paddingRight: gpsInEstado ? '72px' : undefined }} />
          {gpsInEstado && <span style={badge(gpsInEstado)}>{gpsInEstado}</span>}
        </div>
      </>
    ),
    gpsOut: (
      <>
        <label style={{ ...lbl, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
          <input type="checkbox" checked={showGpsOut} onChange={e => setShowGpsOut(e.target.checked)}
            style={{ width:16, height:16, accentColor:'#3b82f6', cursor:'pointer' }} />
          GPS OUT
        </label>
        {showGpsOut && (
          <div style={{ position:'relative' }}>
            <input className="form-input" type="tel" inputMode="numeric" pattern="[0-9]*"
              value={form.gpsOut} onChange={e => set('gpsOut', e.target.value)}
              style={{ paddingRight: gpsOutEstado ? '72px' : undefined }} />
            {gpsOutEstado && <span style={badge(gpsOutEstado)}>{gpsOutEstado}</span>}
          </div>
        )}
      </>
    ),
    kms: (
      <>
        <label style={lbl}>KMS ODÓMETRO</label>
        <input type="number" className="form-input" value={form.kms} onChange={e => set('kms', e.target.value)} />
      </>
    ),
    ubicacion: (
      <>
        <label style={lbl}>UBICACIÓN</label>
        <input className="form-input" value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} />
      </>
    ),
    perifericos: (
      <>
        <label style={lbl}>PERIFÉRICOS</label>
        <PerifeDropdown selected={form.perifericos} onChange={v => set('perifericos', v)} />
      </>
    ),
    detalles: (
      <>
        <label style={lbl}>DETALLES</label>
        <textarea className="form-input" rows={2} value={form.detalles}
          onChange={e => set('detalles', e.target.value)} style={{ resize:'vertical' }} />
      </>
    ),
    trabajo: (
      <>
        <label style={lbl}>TRABAJO</label>
        <input className="form-input" value={form.trabajo} onChange={e => set('trabajo', e.target.value)} />
      </>
    ),
    destino: form.servicio === 'Desinstalación' ? (
      <>
        <label style={lbl}>DESTINO GPS OUT</label>
        <select className="form-select" value={form.destinoDesinstalacion} onChange={e => set('destinoDesinstalacion', e.target.value)}>
          <option value="Retirado">Retirado</option>
          <option value="Malo">Malo</option>
        </select>
      </>
    ) : null,
  };
  const camposVisibles = ordenCampos.filter(k => nodosCampos[k] != null);

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Validación WhatsApp</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="form-container" style={{ borderLeft: '4px solid #25D366' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <span style={{ ...lbl, marginBottom:0, color: modoOrden ? '#3b82f6' : undefined }}>
                {modoOrden ? 'Usa las flechas para mover cada campo' : ''}
              </span>
              <button type="button" onClick={() => setModoOrden(o => !o)}
                className={modoOrden ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize:'0.7em', display:'flex', alignItems:'center', gap:6 }}>
                {modoOrden ? '✓ Listo' : '↕ Reordenar Campos'}
              </button>
            </div>

            <div className="form-grid three-cols">
              {camposVisibles.map((k, i) => (
                <div key={k} style={{
                  display:'flex', gap:6, gridColumn: k === 'detalles' ? 'span 2' : undefined,
                  background: modoOrden ? 'rgba(59,130,246,0.08)' : undefined,
                  border: modoOrden ? '1px dashed #93c5fd' : undefined,
                  borderRadius: modoOrden ? 8 : undefined, padding: modoOrden ? 6 : undefined,
                }}>
                  {modoOrden && (
                    <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
                      <button type="button" onClick={() => moverCampo(k, -1, camposVisibles)} disabled={i === 0}
                        className="btn btn-secondary" style={{ padding:2, lineHeight:0, opacity: i === 0 ? 0.3 : 1 }}
                        title="Mover arriba">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" onClick={() => moverCampo(k, 1, camposVisibles)} disabled={i === camposVisibles.length - 1}
                        className="btn btn-secondary" style={{ padding:2, lineHeight:0, opacity: i === camposVisibles.length - 1 ? 0.3 : 1 }}
                        title="Mover abajo">
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    {nodosCampos[k]}
                  </div>
                </div>
              ))}
            </div>

            <div className="val-preview" style={{ marginTop:15, padding:12, backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, fontFamily:'monospace', fontSize:'0.8em', whiteSpace:'pre-wrap', color:'#166534', lineHeight:1.6 }}>
              {generarMensaje()}
            </div>

            <div className="form-actions">
              <button onClick={handleEnviar} className="btn btn-success" style={{ backgroundColor:'#25D366', borderColor:'#25D366' }}>
                ✉ Enviar WhatsApp
              </button>
              <button onClick={handleCopiar} className="btn btn-primary">
                ⎘ Copiar
              </button>
            </div>

            {ultimoRegistro && (
              <div className="val-preview" style={{ marginTop:12, padding:'8px 12px', backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, fontFamily:'Quantico', fontSize:'0.65em', color:'#166534', textTransform:'uppercase', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ flex:1 }}>
                  ✓ Registrado en Trabajos del Mes — {ultimoRegistro.empresa} · {ultimoRegistro.mes}
                </span>
                {(ultimoRegistro.mes !== mesSeleccionado || ultimoRegistro.empresa !== empresaSeleccionada) && (
                  <button className="btn btn-primary" style={{ fontSize:'0.7em', padding:'4px 10px', textTransform:'uppercase' }}
                    onClick={() => {
                      if (setEmpresaSeleccionada) setEmpresaSeleccionada(ultimoRegistro.empresa);
                      if (setMesSeleccionado) setMesSeleccionado(ultimoRegistro.mes);
                      setCurrentView('trabajos');
                    }}>
                    Ver en Trabajos →
                  </button>
                )}
              </div>
            )}

            {pendingOT && (
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                <div className="val-banner" style={{ padding:'10px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'Quantico', fontSize:'0.7em', color:'#92400e', flex:1 }}>
                    📋 ¿Crear OT de {pendingOT.inst.tipoServicio}?
                  </span>
                  <button className="btn btn-primary" style={{ fontSize:'0.7em', padding:'4px 10px' }}
                    onClick={() => {
                      const toAdd = [pendingOT.inst];
                      if (pendingOT.desinst) toAdd.push(pendingOT.desinst);
                      if (setOtQueue) setOtQueue(prev => [...prev, ...toAdd]);
                      if (setPendingOT) setPendingOT(null);
                      setCurrentView('ordenes');
                    }}>
                    Sí →
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize:'0.7em', padding:'4px 8px' }}
                    onClick={() => { if (setPendingOT) setPendingOT(null); }}>✕</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidacionWhatsapp;
