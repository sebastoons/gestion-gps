import React, { useState, useRef, useEffect } from 'react';
import { Home } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

const COSTOS = {
  'Instalación': 0.8, 'Desinstalación': 0.5,
  'Mantención': 0.7, 'Reinstalación': 0.8, 'Visita Fallida': 0.5
};

const PERIFERICOS = ['ON BATT','edata','dallas','buzzer','sos','inmovilizador','GPS externo','sensor T°','sensor puerta','cipia','dashcam','Básico'];

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
  destinoDesinstalacion: 'Retirado'
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
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  trabajos, setTrabajos,
  mesSeleccionado, setOtQueue
}) => {
  const [form, setForm] = useState({ ...VACIO });
  const [showPpuOut, setShowPpuOut] = useState(false);
  const [showGpsOut, setShowGpsOut] = useState(false);
  const [draftedOT, setDraftedOT] = useState(null); // { inst, desinst|null }

  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

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
    ppu: (showPpuOut ? form.ppuVinOut : '').toUpperCase(),
    marca: '', modelo: '', anio: '',
    color: '', kilometraje: '',
    imeiIn: '',
    imeiOut: showGpsOut ? (form.gpsOut || '') : '',
    accesoriosGPS: [],
    checklist: Object.fromEntries(CL_ITEMS.map(k => [k, { estado: 'NA', nota: '' }])),
    observaciones: [form.detalles, form.trabajo].filter(Boolean).join(' | '),
    _empresa: form.empresa,
    nombreCliente: form.cliente,
  });

  const verificarGPS = imei => {
    if (!imei?.trim()) return null;
    const i = imei.trim();
    if (equiposNuevos.find(e => e.imei === i)) return 'NUEVO';
    if (equiposRetirados.find(e => e.imei === i)) return 'RETIRADO';
    if (equiposMalos.find(e => e.imei === i)) return 'MALO';
    return null;
  };

  const generarMensaje = () => {
    const lineas = [
      `*EMPRESA*: ${form.empresa}`,
      `*CLIENTE*: ${cap(form.cliente)}`,
      `*FECHA*: ${form.fecha}`,
      `*SERVICIO*: ${cap(form.servicio)}`,
    ];
    if (form.ppuVinIn || form.ppuVinOut) {
      const p = [];
      if (form.ppuVinIn) p.push(`*PPU/VIN IN*: ${form.ppuVinIn.toUpperCase()}`);
      if (form.ppuVinOut) p.push(`*PPU/VIN OUT*: ${form.ppuVinOut.toUpperCase()}`);
      lineas.push(p.join(' | '));
    }
    const vm = [form.marca, form.modelo, form.anio].filter(Boolean).join(' ');
    if (vm) lineas.push(`*MARCA/MODELO*: ${vm}`);
    if (form.gpsIn || (showGpsOut && form.gpsOut)) {
      const p = [];
      if (form.gpsIn) p.push(`*GPS IN*: ${form.gpsIn}`);
      if (showGpsOut && form.gpsOut) p.push(`*GPS OUT*: ${form.gpsOut}`);
      lineas.push(p.join(' | '));
    }
    if (form.kms) lineas.push(`*KMS ODOMETRO*: ${form.kms}`);
    if (form.ubicacion) lineas.push(`*UBICACION*: ${cap(form.ubicacion)}`);
    if (form.perifericos.length) lineas.push(`*PERIFERICOS*: ${form.perifericos.join(', ')}`);
    if (form.detalles) lineas.push(`*DETALLES*: ${cap(form.detalles)}`);
    if (form.trabajo) lineas.push(`*TRABAJO*: ${cap(form.trabajo)}`);
    return lineas.join('\n');
  };

  const procesarEquipos = () => {
    const { servicio, destinoDesinstalacion: dest } = form;
    const gpsIn = form.gpsIn?.trim();
    const gpsOut = showGpsOut ? form.gpsOut?.trim() : '';
    const quitarInventario = imei => {
      if (equiposNuevos.find(e => e.imei === imei)) setEquiposNuevos(prev => prev.filter(e => e.imei !== imei));
      else if (equiposRetirados.find(e => e.imei === imei)) setEquiposRetirados(prev => prev.filter(e => e.imei !== imei));
    };
    if (servicio === 'Instalación' || servicio === 'Reinstalación') {
      if (gpsIn) quitarInventario(gpsIn);
    } else if (servicio === 'Desinstalación') {
      if (gpsOut) {
        if (dest === 'Malo') {
          setEquiposMalos(prev => [...prev, { id: `M${String(prev.length+1).padStart(3,'0')}`, imei: gpsOut, asignado: true, nombreCliente: form.cliente, empresa: form.empresa }]);
        } else {
          setEquiposRetirados(prev => [...prev, { id: `R${String(prev.length+1).padStart(3,'0')}`, fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa }]);
        }
      }
    } else if (servicio === 'Mantención') {
      if (gpsIn) quitarInventario(gpsIn);
      if (gpsOut) setEquiposRetirados(prev => [...prev, { id: `R${String(prev.length+1).padStart(3,'0')}`, fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa }]);
    }
  };

  const agregarATrabajos = () => {
    const emp = form.empresa;
    const prefix = emp === 'UGPS' ? 'U' : 'E';
    const mes = getMesFacturacion(form.fecha, emp) || mesSeleccionado;

    if (form.servicio === 'Reinstalación') {
      // Split into separate Desinstalación + Instalación entries
      setTrabajos(prev => {
        const count = prev.filter(t => t.empresa === emp).length;
        const id1 = `${prefix}${String(count + 1).padStart(3,'0')}`;
        const id2 = `${prefix}${String(count + 2).padStart(3,'0')}`;
        const ufInst = form.perifericos.includes('ON BATT') ? 0.6 : COSTOS['Instalación'];
        const ufDes = COSTOS['Desinstalación'];
        return [...prev,
          {
            id: id1, nombreCliente: form.cliente, fecha: form.fecha,
            servicio: 'Desinstalación', accesorios: [],
            ppuIn: '', ppuOut: showPpuOut ? form.ppuVinOut.toUpperCase() : '',
            imeiIn: '', imeiOut: showGpsOut ? form.gpsOut : '',
            km: '', valorUF: ufDes.toString(), valorPesos: Math.round(ufDes * 39000).toString(),
            empresa: emp, mes
          },
          {
            id: id2, nombreCliente: form.cliente, fecha: form.fecha,
            servicio: 'Instalación', accesorios: form.perifericos,
            ppuIn: form.ppuVinIn.toUpperCase(), ppuOut: '',
            imeiIn: form.gpsIn, imeiOut: '',
            km: '', valorUF: ufInst.toString(), valorPesos: Math.round(ufInst * 39000).toString(),
            empresa: emp, mes
          }
        ];
      });
    } else {
      const newId = `${prefix}${String(trabajos.filter(t => t.empresa === emp).length + 1).padStart(3,'0')}`;
      let uf = COSTOS[form.servicio] || 0.8;
      if (form.servicio === 'Instalación' && form.perifericos.includes('ON BATT')) uf = 0.6;
      setTrabajos(prev => [...prev, {
        id: newId, nombreCliente: form.cliente, fecha: form.fecha,
        servicio: form.servicio, accesorios: form.perifericos,
        ppuIn: form.ppuVinIn.toUpperCase(), ppuOut: showPpuOut ? form.ppuVinOut.toUpperCase() : '',
        imeiIn: form.gpsIn, imeiOut: showGpsOut ? form.gpsOut : '',
        km: '', valorUF: uf.toString(), valorPesos: Math.round(uf * 39000).toString(),
        empresa: emp, mes
      }]);
    }
  };

  const validar = () => {
    if (!form.cliente || !form.fecha) { alert('Completa los campos obligatorios: Cliente y Fecha'); return false; }
    return true;
  };

  const ejecutarAcciones = () => {
    const esReinst = form.servicio === 'Reinstalación';
    procesarEquipos();
    agregarATrabajos();
    setDraftedOT({ inst: crearDraftOT(), desinst: esReinst ? crearDraftOTDesinst() : null });
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

  const handleEnviar = () => {
    if (!validar()) return;
    const msg = generarMensaje();
    ejecutarAcciones();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopiar = () => {
    if (!validar()) return;
    const msg = generarMensaje();
    const copiar = () => { ejecutarAcciones(); alert(`✓ Copiado y registrado en trabajos ${form.empresa}`); };
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
            <div className="form-grid three-cols">
              <div>
                <label style={lbl}>EMPRESA</label>
                <select className="form-select" value={form.empresa} onChange={e => set('empresa', e.target.value)}>
                  <option>Entel</option><option>UGPS</option>
                </select>
              </div>
              <div>
                <label style={lbl}>CLIENTE *</label>
                <input className="form-input" value={form.cliente} onChange={e => set('cliente', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>FECHA *</label>
                <input type="date" className="form-input" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>SERVICIO</label>
                <select className="form-select" value={form.servicio} onChange={e => set('servicio', e.target.value)}>
                  <option>Instalación</option><option>Desinstalación</option>
                  <option>Mantención</option><option>Reinstalación</option><option>Visita Fallida</option>
                </select>
              </div>
              <div>
                <label style={lbl}>PPU/VIN IN</label>
                <input className="form-input" value={form.ppuVinIn} onChange={e => set('ppuVinIn', e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }} />
              </div>
              <div>
                <label style={{ ...lbl, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                  <input type="checkbox" checked={showPpuOut} onChange={e => setShowPpuOut(e.target.checked)}
                    style={{ width:16, height:16, accentColor:'#3b82f6', cursor:'pointer' }} />
                  PPU/VIN OUT
                </label>
                {showPpuOut && (
                  <input className="form-input" value={form.ppuVinOut} onChange={e => set('ppuVinOut', e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }} />
                )}
              </div>
              <div>
                <label style={lbl}>MARCA</label>
                <select className="form-select" value={form.marca} onChange={e => set('marca', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {MARCAS_VAL.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>MODELO</label>
                <input className="form-input" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>AÑO</label>
                <select className="form-select" value={form.anio} onChange={e => set('anio', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {AÑOS_VAL.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>GPS IN (IMEI)</label>
                <div style={{ position:'relative' }}>
                  <input className="form-input" type="tel" inputMode="numeric" pattern="[0-9]*"
                    value={form.gpsIn} onChange={e => set('gpsIn', e.target.value)}
                    style={{ paddingRight: gpsInEstado ? '72px' : undefined }} />
                  {gpsInEstado && <span style={badge(gpsInEstado)}>{gpsInEstado}</span>}
                </div>
              </div>
              <div>
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
              </div>
              <div>
                <label style={lbl}>KMS ODÓMETRO</label>
                <input type="number" className="form-input" value={form.kms} onChange={e => set('kms', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>UBICACIÓN</label>
                <input className="form-input" value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>PERIFÉRICOS</label>
                <PerifeDropdown selected={form.perifericos} onChange={v => set('perifericos', v)} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>DETALLES</label>
                <textarea className="form-input" rows={2} value={form.detalles}
                  onChange={e => set('detalles', e.target.value)} style={{ resize:'vertical' }} />
              </div>
              <div>
                <label style={lbl}>TRABAJO</label>
                <input className="form-input" value={form.trabajo} onChange={e => set('trabajo', e.target.value)} />
              </div>
              {form.servicio === 'Desinstalación' && (
                <div>
                  <label style={lbl}>DESTINO GPS OUT</label>
                  <select className="form-select" value={form.destinoDesinstalacion} onChange={e => set('destinoDesinstalacion', e.target.value)}>
                    <option value="Retirado">Retirado</option>
                    <option value="Malo">Malo</option>
                  </select>
                </div>
              )}
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

            {draftedOT && (
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                <div className="val-preview" style={{ padding:'8px 12px', backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, fontFamily:'Quantico', fontSize:'0.65em', color:'#166534', textTransform:'uppercase' }}>
                  ✓ Datos registrados en trabajos del mes
                </div>
                <div className="val-banner" style={{ padding:'10px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'Quantico', fontSize:'0.7em', color:'#92400e', flex:1 }}>
                    📋 ¿Crear OT de {draftedOT.inst.tipoServicio}?
                  </span>
                  <button className="btn btn-primary" style={{ fontSize:'0.7em', padding:'4px 10px' }}
                    onClick={() => {
                      const toAdd = [draftedOT.inst];
                      if (draftedOT.desinst) toAdd.push(draftedOT.desinst);
                      if (setOtQueue) setOtQueue(prev => [...prev, ...toAdd]);
                      setDraftedOT(null);
                    }}>
                    Sí →
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize:'0.7em', padding:'4px 8px' }}
                    onClick={() => setDraftedOT(null)}>No</button>
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
