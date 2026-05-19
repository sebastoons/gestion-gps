import React, { useEffect, useRef, useState } from 'react';
import { Home as HomeIcon, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.ITF,
];

const TIPO_COLOR = {
  Nuevo:    { border: '#16a34a', bg: '#dcfce7', text: '#166534' },
  Retirado: { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  Malo:     { border: '#dc2626', bg: '#fee2e2', text: '#991b1b' },
};

const lbl = {
  display: 'block', fontFamily: 'Quantico', fontSize: '0.6em',
  fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', marginBottom: 4,
};

const EscanerGPS = ({
  setCurrentView,
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  empresas,
}) => {
  const [phase, setPhase] = useState('scanning');
  const [scanKey, setScanKey] = useState(0);
  const [camError, setCamError] = useState('');
  const qrRef = useRef(null);
  const [form, setForm] = useState({
    imei: '', tipo: 'Nuevo', empresa: 'Entel',
    fecha: new Date().toISOString().split('T')[0],
    nombreDispositivo: '',
  });

  useEffect(() => {
    if (phase !== 'scanning') return;

    const id = 'qr-vid-' + scanKey;
    setCamError('');
    let cancelled = false;
    let qr = null;

    const tryStart = async (constraints) => {
      qr = new Html5Qrcode(id, { formatsToSupport: FORMATS, verbose: false });
      qrRef.current = qr;
      await qr.start(
        constraints,
        { fps: 12, qrbox: { width: 240, height: 80 } },
        (text) => {
          if (cancelled) return;
          qr.stop().then(() => {
            qrRef.current = null;
            setForm(f => ({ ...f, imei: text.trim() }));
            setPhase('confirm');
          }).catch(() => {
            setForm(f => ({ ...f, imei: text.trim() }));
            setPhase('confirm');
          });
        },
        () => {}
      );
    };

    (async () => {
      try {
        await tryStart({ facingMode: { exact: 'environment' } });
      } catch {
        try {
          await tryStart({ facingMode: 'environment' });
        } catch {
          if (!cancelled) setCamError('Sin acceso a cámara. Usa ingreso manual.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (qrRef.current) { qrRef.current.stop().catch(() => {}); qrRef.current = null; }
    };
  }, [phase, scanKey]);

  const reiniciar = () => {
    setScanKey(k => k + 1);
    setForm(f => ({ ...f, imei: '', nombreDispositivo: '' }));
    setPhase('scanning');
  };

  const guardar = () => {
    const imei = form.imei?.trim();
    if (!imei) { alert('IMEI requerido'); return; }
    const { tipo, empresa, fecha, nombreDispositivo } = form;
    const base = { imei, empresa, fecha, nombreDispositivo: nombreDispositivo.trim() };
    if (tipo === 'Nuevo') {
      setEquiposNuevos(prev => [...prev, { id: `N${String(prev.length + 1).padStart(3, '0')}`, ...base, asignado: false }]);
    } else if (tipo === 'Retirado') {
      setEquiposRetirados(prev => [...prev, { id: `R${String(prev.length + 1).padStart(3, '0')}`, ...base, cliente: '' }]);
    } else {
      setEquiposMalos(prev => [...prev, { id: `M${String(prev.length + 1).padStart(3, '0')}`, ...base, asignado: false, nombreCliente: '' }]);
    }
    setPhase('saved');
    setTimeout(reiniciar, 1800);
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Escáner GPS</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <HomeIcon size={18} /> Inicio
            </button>
          </div>

          {phase === 'scanning' && (
            <div>
              <p style={{ fontFamily: 'Quantico', fontSize: '0.65em', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
                Apunta la cámara al código de barras del IMEI
              </p>

              <div className="scanner-box">
                <div id={'qr-vid-' + scanKey} style={{ width: '100%' }} />
              </div>

              {camError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', margin: '10px auto', maxWidth: 340 }}>
                  <AlertCircle size={14} color="#dc2626" />
                  <span style={{ fontFamily: 'Quantico', fontSize: '0.6em', color: '#dc2626', textTransform: 'uppercase' }}>{camError}</span>
                </div>
              )}

              <div style={{ margin: '12px auto', maxWidth: 340 }}>
                <label style={lbl}>O ingresa el IMEI manualmente</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={form.imei} type="tel" inputMode="numeric"
                    onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                    placeholder="IMEI del equipo..." />
                  <button className="btn btn-primary"
                    onClick={() => { if (form.imei.trim()) setPhase('confirm'); }}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'confirm' && (
            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Quantico', fontSize: '0.6em', color: '#374151', textTransform: 'uppercase', marginBottom: 4 }}>IMEI detectado</p>
                <p style={{ fontFamily: 'Quantico', fontSize: '1em', fontWeight: 'bold', color: '#065f46', letterSpacing: 2, marginBottom: 8 }}>{form.imei}</p>
                <input className="form-input" value={form.imei}
                  onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                  style={{ textAlign: 'center', fontWeight: 'bold' }} />
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={lbl}>Nombre del dispositivo GPS</label>
                  <input className="form-input" value={form.nombreDispositivo}
                    onChange={e => setForm(f => ({ ...f, nombreDispositivo: e.target.value }))}
                    placeholder="Ej: Teltonika FMB920..." />
                </div>

                <div>
                  <label style={lbl}>Tipo de equipo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {['Nuevo', 'Retirado', 'Malo'].map(t => {
                      const c = TIPO_COLOR[t];
                      const active = form.tipo === t;
                      return (
                        <button key={t} className={`tipo-btn${active ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, tipo: t }))} style={{
                          padding: '10px 4px', borderRadius: 10,
                          border: `2px solid ${active ? c.border : '#e5e7eb'}`,
                          background: active ? c.bg : undefined,
                          color: active ? c.text : '#6b7280',
                          cursor: 'pointer', fontFamily: 'Quantico', fontSize: '0.65em',
                          fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.15s',
                        }}>{t}</button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Empresa</label>
                    <select className="form-select" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}>
                      {(empresas || ['Entel', 'UGPS']).map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Fecha</label>
                    <input type="date" className="form-input" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={reiniciar}>
                  <RefreshCw size={14} /> Volver a escanear
                </button>
                <button className="btn btn-success" onClick={guardar}>
                  <Check size={14} /> Guardar equipo
                </button>
              </div>
            </div>
          )}

          {phase === 'saved' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={36} color="#16a34a" strokeWidth={3} />
              </div>
              <p style={{ fontFamily: 'Changa', fontSize: '1.2em', textTransform: 'uppercase', color: '#065f46', fontWeight: 'bold', margin: 0 }}>
                {form.tipo} guardado
              </p>
              <p style={{ fontFamily: 'Quantico', fontSize: '0.65em', color: '#6b7280', textTransform: 'uppercase', marginTop: 6 }}>
                {form.imei} — {form.empresa}
              </p>
              <p style={{ fontFamily: 'Quantico', fontSize: '0.6em', color: '#9ca3af', marginTop: 12 }}>
                Preparando siguiente escaneo...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscanerGPS;
