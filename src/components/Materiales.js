import React, { useState } from 'react';
import { Home, Plus, Trash2, Camera } from 'lucide-react';
import { deleteFromTable } from '../lib/supabase';
import BarcodeScanner from './BarcodeScanner';
import '../styles/Scanner.css';

const TIPOS_MATERIAL = [
  'ON BATT', 'Edata', 'Dallas', 'Buzzer', 'SOS',
  'Inmovilizador', 'GPS Externo', 'Sensor T°', 'Sensor Puerta',
];

const Materiales = ({
  setCurrentView,
  materiales, setMateriales,
  empresas, empresaSeleccionada, setEmpresaSeleccionada,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ON BATT',
    serial: '',
    cantidad: 1,
    fecha: new Date().toISOString().split('T')[0],
  });

  const filtrados = (materiales || []).filter(m => m.empresa === empresaSeleccionada);
  const count = tipo => filtrados.filter(m => m.tipo === tipo).length;

  const guardar = () => {
    const cantidad = Math.max(1, parseInt(form.cantidad) || 1);
    const base = Date.now();
    const nuevos = Array.from({ length: cantidad }, (_, i) => ({
      tipo: form.tipo,
      serial: cantidad === 1 ? form.serial : '',
      fecha: form.fecha,
      id: `MAT${base + i}`,
      empresa: empresaSeleccionada,
    }));
    setMateriales(prev => [...prev, ...nuevos]);
    setShowForm(false);
    setForm({ tipo: 'ON BATT', serial: '', cantidad: 1, fecha: new Date().toISOString().split('T')[0] });
  };

  const eliminar = id => {
    deleteFromTable('materiales', id);
    setMateriales(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Materiales</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select value={empresaSeleccionada} onChange={e => setEmpresaSeleccionada(e.target.value)} className="form-select">
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 8, marginBottom: 16 }}>
            {TIPOS_MATERIAL.map(tipo => (
              <div key={tipo} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Quantico', fontSize: '0.52em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>{tipo}</div>
                <div style={{ fontFamily: 'Changa', fontSize: '1.3em', fontWeight: 'bold', color: count(tipo) > 0 ? '#16a34a' : '#9ca3af' }}>{count(tipo)}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
              <Plus size={20} /> Agregar Material
            </button>
          </div>

          {showForm && (
            <div className="form-container">
              <h3 className="form-title">Nuevo Material</h3>
              <div className="form-grid three-cols">
                <div>
                  <label className="filter-label">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="form-select">
                    {TIPOS_MATERIAL.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="filter-label">Cantidad</label>
                  <input type="number" min="1" max="99" value={form.cantidad}
                    onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                    className="form-input" />
                </div>
                <div>
                  <label className="filter-label">Fecha</label>
                  <input type="date" value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="form-input" />
                </div>
                {parseInt(form.cantidad) === 1 && (
                  <div style={{ gridColumn: 'span 3' }}>
                    <label className="filter-label">Serial / Código (opcional)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" placeholder="N/A" value={form.serial}
                        onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                        className="form-input" style={{ flex: 1 }} />
                      <button type="button" onClick={() => setShowScanner(true)} className="btn btn-primary"
                        style={{ padding: '0.5rem', minWidth: 'auto' }} title="Escanear código">
                        <Camera size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button onClick={guardar} className="btn btn-success">
                  Guardar{parseInt(form.cantidad) > 1 ? ` (${form.cantidad})` : ''}
                </button>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead className="green">
                <tr>
                  <th>Tipo</th>
                  <th>Serial</th>
                  <th>Fecha</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">No hay materiales para {empresaSeleccionada}</td></tr>
                ) : (
                  filtrados.map(m => (
                    <tr key={m.id}>
                      <td>{m.tipo}</td>
                      <td className="text-mono">{m.serial || '-'}</td>
                      <td>{m.fecha}</td>
                      <td className="center">
                        <div className="table-actions">
                          <button onClick={() => eliminar(m.id)} className="action-btn delete" title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={code => { setForm(f => ({ ...f, serial: code })); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Materiales;
