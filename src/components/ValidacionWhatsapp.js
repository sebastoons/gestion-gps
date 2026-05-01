import React, { useState } from 'react';
import { Home } from 'lucide-react';

const COSTOS = {
  'Instalación': 0.8, 'Desinstalación': 0.5,
  'Mantención': 0.7, 'Reinstalación': 0.8, 'Visita Fallida': 0.5
};

const VACIO = {
  cliente: '', fecha: '', servicio: 'Instalación', empresa: 'Entel',
  ppuVinIn: '', ppuVinOut: '', marcaModelo: '',
  gpsIn: '', gpsOut: '', kms: '',
  ubicacion: '', perifericos: '', detalles: '', trabajo: '',
  destinoDesinstalacion: 'Retirado'
};

const ValidacionWhatsapp = ({
  setCurrentView,
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  trabajos, setTrabajos,
  mesSeleccionado
}) => {
  const [form, setForm] = useState({ ...VACIO });

  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

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
      const partes = [];
      if (form.ppuVinIn) partes.push(`*PPU/VIN IN*: ${form.ppuVinIn.toUpperCase()}`);
      if (form.ppuVinOut) partes.push(`*PPU/VIN OUT*: ${form.ppuVinOut.toUpperCase()}`);
      lineas.push(partes.join(' | '));
    }
    if (form.marcaModelo) lineas.push(`*MARCA/MODELO*: ${cap(form.marcaModelo)}`);
    if (form.gpsIn || form.gpsOut) {
      const partes = [];
      if (form.gpsIn) partes.push(`*GPS IN*: ${form.gpsIn}`);
      if (form.gpsOut) partes.push(`*GPS OUT*: ${form.gpsOut}`);
      lineas.push(partes.join(' | '));
    }
    if (form.kms) lineas.push(`*KMS*: ${form.kms}`);
    if (form.ubicacion) lineas.push(`*UBICACION*: ${cap(form.ubicacion)}`);
    if (form.perifericos) lineas.push(`*PERIFERICOS*: ${cap(form.perifericos)}`);
    if (form.detalles) lineas.push(`*DETALLES*: ${cap(form.detalles)}`);
    if (form.trabajo) lineas.push(`*TRABAJO*: ${cap(form.trabajo)}`);
    return lineas.join('\n');
  };

  const procesarEquipos = () => {
    const { servicio, destinoDesinstalacion: dest } = form;
    const gpsIn = form.gpsIn?.trim();
    const gpsOut = form.gpsOut?.trim();

    const quitarInventario = imei => {
      if (equiposNuevos.find(e => e.imei === imei)) {
        setEquiposNuevos(prev => prev.filter(e => e.imei !== imei));
      } else if (equiposRetirados.find(e => e.imei === imei)) {
        setEquiposRetirados(prev => prev.filter(e => e.imei !== imei));
      }
    };

    if (servicio === 'Instalación' || servicio === 'Reinstalación') {
      if (gpsIn) quitarInventario(gpsIn);
    } else if (servicio === 'Desinstalación') {
      if (gpsOut) {
        if (dest === 'Malo') {
          setEquiposMalos(prev => [...prev, {
            id: `M${String(prev.length + 1).padStart(3, '0')}`,
            imei: gpsOut, asignado: true, nombreCliente: form.cliente, empresa: form.empresa
          }]);
        } else {
          setEquiposRetirados(prev => [...prev, {
            id: `R${String(prev.length + 1).padStart(3, '0')}`,
            fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa
          }]);
        }
      }
    } else if (servicio === 'Mantención') {
      if (gpsIn) quitarInventario(gpsIn);
      if (gpsOut) {
        setEquiposRetirados(prev => [...prev, {
          id: `R${String(prev.length + 1).padStart(3, '0')}`,
          fecha: form.fecha, cliente: form.cliente, imei: gpsOut, empresa: form.empresa
        }]);
      }
    }
  };

  const agregarATrabajos = () => {
    const emp = form.empresa;
    const trabajosEmp = trabajos.filter(t => t.empresa === emp);
    const prefix = emp === 'UGPS' ? 'U' : 'E';
    const newId = `${prefix}${String(trabajosEmp.length + 1).padStart(3, '0')}`;
    const uf = COSTOS[form.servicio] || 0.8;
    const accs = form.perifericos ? form.perifericos.split(',').map(s => s.trim()).filter(Boolean) : [];
    setTrabajos(prev => [...prev, {
      id: newId, nombreCliente: form.cliente, fecha: form.fecha,
      servicio: form.servicio, accesorios: accs,
      ppuIn: form.ppuVinIn.toUpperCase(), ppuOut: form.ppuVinOut.toUpperCase(),
      imeiIn: form.gpsIn, imeiOut: form.gpsOut, km: form.kms,
      valorUF: uf.toString(), valorPesos: Math.round(uf * 39000).toString(),
      empresa: emp, mes: mesSeleccionado
    }]);
  };

  const validar = () => {
    if (!form.cliente || !form.fecha) {
      alert('Completa los campos obligatorios: Cliente y Fecha');
      return false;
    }
    return true;
  };

  const ejecutarAcciones = () => {
    procesarEquipos();
    agregarATrabajos();
    setForm({ ...VACIO });
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
    const copiar = () => {
      ejecutarAcciones();
      alert(`✓ Copiado y registrado en trabajos ${form.empresa}`);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(copiar).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = msg;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copiar();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copiar();
    }
  };

  const gpsInEstado = verificarGPS(form.gpsIn);
  const gpsOutEstado = verificarGPS(form.gpsOut);

  const badge = estado => ({
    backgroundColor: estado === 'NUEVO' ? '#16a34a' : estado === 'RETIRADO' ? '#3b82f6' : '#ef4444',
    color: 'white', padding: '2px 6px', borderRadius: '4px',
    fontSize: '0.5em', fontFamily: 'Quantico', fontWeight: 'bold',
    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none'
  });

  const lbl = {
    display: 'block', fontFamily: 'Quantico', fontSize: '0.6em',
    fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', marginBottom: '4px'
  };

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
                <select className="form-select" value={form.empresa}
                  onChange={e => setForm({ ...form, empresa: e.target.value })}>
                  <option>Entel</option>
                  <option>UGPS</option>
                </select>
              </div>
              <div>
                <label style={lbl}>CLIENTE *</label>
                <input className="form-input" value={form.cliente}
                  onChange={e => setForm({ ...form, cliente: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>FECHA *</label>
                <input type="date" className="form-input" value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>SERVICIO</label>
                <select className="form-select" value={form.servicio}
                  onChange={e => setForm({ ...form, servicio: e.target.value })}>
                  <option>Instalación</option>
                  <option>Desinstalación</option>
                  <option>Mantención</option>
                  <option>Reinstalación</option>
                  <option>Visita Fallida</option>
                </select>
              </div>

              <div>
                <label style={lbl}>PPU/VIN IN</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="form-input" value={form.ppuVinIn}
                    onChange={e => setForm({ ...form, ppuVinIn: e.target.value.toUpperCase() })}
                    style={{ textTransform: 'uppercase' }} />
                  <input className="form-input" placeholder="VIN OUT" value={form.ppuVinOut}
                    onChange={e => setForm({ ...form, ppuVinOut: e.target.value.toUpperCase() })}
                    style={{ maxWidth: '90px', textTransform: 'uppercase' }} />
                </div>
              </div>

              <div>
                <label style={lbl}>MARCA/MODELO</label>
                <input className="form-input" value={form.marcaModelo}
                  onChange={e => setForm({ ...form, marcaModelo: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>GPS IN (IMEI)</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input className="form-input" value={form.gpsIn}
                      onChange={e => setForm({ ...form, gpsIn: e.target.value })}
                      style={{ paddingRight: gpsInEstado ? '72px' : undefined }} />
                    {gpsInEstado && <span style={badge(gpsInEstado)}>{gpsInEstado}</span>}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" placeholder="GPS OUT" value={form.gpsOut}
                      onChange={e => setForm({ ...form, gpsOut: e.target.value })}
                      style={{ maxWidth: '120px', paddingRight: gpsOutEstado ? '72px' : undefined }} />
                    {gpsOutEstado && <span style={badge(gpsOutEstado)}>{gpsOutEstado}</span>}
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>KMS</label>
                <input type="number" className="form-input" value={form.kms}
                  onChange={e => setForm({ ...form, kms: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>UBICACION</label>
                <input className="form-input" value={form.ubicacion}
                  onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>PERIFERICOS</label>
                <input className="form-input" value={form.perifericos}
                  onChange={e => setForm({ ...form, perifericos: e.target.value })} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>DETALLES</label>
                <textarea className="form-input" rows={2} value={form.detalles}
                  onChange={e => setForm({ ...form, detalles: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label style={lbl}>TRABAJO</label>
                <input className="form-input" value={form.trabajo}
                  onChange={e => setForm({ ...form, trabajo: e.target.value })} />
              </div>

              {form.servicio === 'Desinstalación' && (
                <div>
                  <label style={lbl}>DESTINO GPS OUT</label>
                  <select className="form-select" value={form.destinoDesinstalacion}
                    onChange={e => setForm({ ...form, destinoDesinstalacion: e.target.value })}>
                    <option value="Retirado">Retirado</option>
                    <option value="Malo">Malo</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '15px', padding: '12px',
              backgroundColor: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8em',
              whiteSpace: 'pre-wrap', color: '#166534', lineHeight: '1.6'
            }}>
              {generarMensaje()}
            </div>

            <div className="form-actions">
              <button onClick={handleEnviar} className="btn btn-success"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}>
                ✉ Enviar WhatsApp
              </button>
              <button onClick={handleCopiar} className="btn btn-primary">
                ⎘ Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidacionWhatsapp;
