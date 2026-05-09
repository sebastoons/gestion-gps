import React, { useEffect, useState } from 'react';
import { Home as HomeIcon, RefreshCw, Check } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
  const [form, setForm] = useState({
    imei: '', tipo: 'Nuevo', empresa: 'Entel',
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (phase !== 'scanning') return;
    let scanner = null;
    const id = 'qr-reader-' + scanKey;
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: { width: 280, height: 90 }, rememberLastUsedCamera: true }, false);
        scanner.render(
          (text) => { try { scanner.clear(); } catch (e) {} setForm(f => ({ ...f, imei: text.trim() })); setPhase('confirm'); },
          () => {}
        );
      } catch (e) { console.error('Scanner init error:', e); }
    }, 120);
    return () => {
      clearTimeout(timer);
      if (scanner) { try { scanner.clear(); } catch (e) {} }
    };
  }, [phase, scanKey]);

  const reiniciar = () => { setScanKey(k => k + 1); setForm(f => ({ ...f, imei: '' })); setPhase('scanning'); };

  const guardar = () => {
    const imei = form.imei?.trim();
    if (!imei) { alert('IMEI requerido'); return; }
    const { tipo, empresa, fecha } = form;
    if (tipo === 'Nuevo') {
      setEquiposNuevos(prev => [...prev, { id: `N${String(prev.length + 1).padStart(3, '0')}`, imei, empresa, fecha, asignado: false }]);
    } else if (tipo === 'Retirado') {
      setEquiposRetirados(prev => [...prev, { id: `R${String(prev.length + 1).padStart(3, '0')}`, imei, empresa, fecha, cliente: '' }]);
    } else {
      setEquiposMalos(prev => [...prev, { id: `M${String(prev.length + 1).padStart(3, '0')}`, imei, empresa, asignado: false, nombreCliente: '' }]);
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
              <p style={{ fontFamily: 'Quantico', fontSize: '0.65em', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
                Apunta al código de barras / QR del IMEI
              </p>
              <div id={'qr-reader-' + scanKey} style={{ maxWidth: 420, margin: '0 auto' }} />
              <div style={{ margin: '16px auto', maxWidth: 420 }}>
                <label style={lbl}>O ingresa el IMEI manualmente</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={form.imei}
                    onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                    placeholder="IMEI del equipo..." />
                  <button className="btn btn-primary"
                    onClick={() => { if (form.imei.trim()) setPhase('confirm'); }}>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'confirm' && (
            <div style={{ maxWidth: 380, margin: '0 auto' }}>
              <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Quantico', fontSize: '0.6em', color: '#374151', textTransform: 'uppercase', marginBottom: 6 }}>IMEI detectado</p>
                <p style={{ fontFamily: 'Quantico', fontSize: '1.1em', fontWeight: 'bold', color: '#065f46', letterSpacing: 2, marginBottom: 8 }}>{form.imei}</p>
                <input className="form-input" value={form.imei}
                  onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                  style={{ textAlign: 'center', fontWeight: 'bold' }} />
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={lbl}>Tipo de equipo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {['Nuevo', 'Retirado', 'Malo'].map(t => {
                      const c = TIPO_COLOR[t];
                      const active = form.tipo === t;
                      return (
                        <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))} style={{
                          padding: '10px 4px', borderRadius: 10,
                          border: `2px solid ${active ? c.border : '#e5e7eb'}`,
                          background: active ? c.bg : 'white',
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

              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
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
