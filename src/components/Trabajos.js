import React, { useState, useEffect } from 'react';
import { Download, Plus, Home, FileImage, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { exportToVisualPDF, exportToVisualImage } from '../utils/visualExportUtils';

const Trabajos = ({ 
  setCurrentView, 
  trabajos, 
  setTrabajos, 
  empresas, 
  empresaSeleccionada, 
  setEmpresaSeleccionada,
  mesSeleccionado,
  setMesSeleccionado,
  equiposNuevos,
  setEquiposNuevos,
  equiposRetirados,
  setEquiposRetirados
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [valorUFMes, setValorUFMes] = useState(39000);
  const [formData, setFormData] = useState({
    id: '',
    nombreCliente: '',
    fecha: '',
    servicio: 'Instalación',
    accesorios: [],
    ppuIn: '',
    ppuOut: '',
    imeiIn: '',
    imeiOut: '',
    km: '',
    valorUF: '',
    valorPesos: '',
    empresa: empresaSeleccionada,
    mes: mesSeleccionado
  });

  // Recalcular valores en pesos cuando cambia el valor UF
  useEffect(() => {
    const trabajosActualizados = trabajos.map(trabajo => {
      if (trabajo.empresa === empresaSeleccionada && trabajo.mes === mesSeleccionado) {
        const valorUFTrabajo = parseFloat(trabajo.valorUF) || 0;
        const nuevoValorPesos = Math.round(valorUFTrabajo * valorUFMes);
        return {
          ...trabajo,
          valorPesos: nuevoValorPesos.toString()
        };
      }
      return trabajo;
    });
    
    const hayChangios = trabajosActualizados.some((t, i) => t.valorPesos !== trabajos[i]?.valorPesos);
    if (hayChangios) {
      setTrabajos(trabajosActualizados);
    }
  }, [valorUFMes, empresaSeleccionada, mesSeleccionado, trabajos, setTrabajos]);

  useEffect(() => {
    const costosServicios = {
      'Instalación': 0.8,
      'Desinstalación': 0.5,
      'Mantención': 0.7,
      'Reinstalación': 0.8,
      'Visita Fallida': 0.5
    };

    const accesoriosDisponibles = {
      'ON BATT': 0.6,
      'edata': 0.6,
      'dallas': 0.4,
      'buzzer': 0.4,
      'sos': 0.4,
      'inmovilizador': 0.4,
      'GPS externo': 0.3,
      'sensor T°': 0.4,
      'sensor puerta': 0.4
    };

    const costoServicio = costosServicios[formData.servicio] || 0;
    const costoAccesorios = formData.accesorios.reduce((sum, acc) => {
      return sum + (accesoriosDisponibles[acc] || 0);
    }, 0);
    const totalUF = costoServicio + costoAccesorios;
    const totalPesos = Math.round(totalUF * valorUFMes);

    const valorUFFormateado = totalUF % 1 === 0 ? totalUF.toString() : parseFloat(totalUF.toFixed(2)).toString();

    setFormData(prev => ({
      ...prev,
      valorUF: valorUFFormateado,
      valorPesos: totalPesos.toString()
    }));
  }, [formData.servicio, formData.accesorios, valorUFMes]);

  const accesoriosDisponibles = {
    'ON BATT': 0.6,
    'edata': 0.6,
    'dallas': 0.4,
    'buzzer': 0.4,
    'sos': 0.4,
    'inmovilizador': 0.4,
    'GPS externo': 0.3,
    'sensor T°': 0.4,
    'sensor puerta': 0.4
  };

  // FILTRAR TRABAJOS POR EMPRESA Y MES
  const trabajosFiltrados = trabajos.filter(
    t => t.empresa === empresaSeleccionada && t.mes === mesSeleccionado
  );

  const calcularTotales = () => {
    const totalUF = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.valorUF) || 0), 0);
    const totalPesos = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.valorPesos) || 0), 0);
    const totalKm = trabajosFiltrados.reduce((sum, t) => sum + (parseFloat(t.km) || 0), 0);
    const valorKm = empresaSeleccionada === 'Location World' ? 150 : 250;
    const totalValorKm = totalKm * valorKm;
    const subtotal = totalPesos + totalValorKm;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const totalUFFormateado = totalUF % 1 === 0 ? totalUF : parseFloat(totalUF.toFixed(2));

    return { totalUF: totalUFFormateado, totalPesos, totalKm, totalValorKm, subtotal, iva, total };
  };

  // FUNCIÓN PARA DESCONTAR EQUIPOS DEL INVENTARIO
  const descontarEquipos = (imeiIn, imeiOut) => {
    let mensajesDescuento = [];

    // Procesar IMEI IN (equipo instalado)
    if (imeiIn && imeiIn.trim() !== '') {
      const imeiInLimpio = imeiIn.trim();
      
      // Buscar en equipos nuevos
      const equipoNuevo = equiposNuevos.find(
        e => e.imei === imeiInLimpio && e.empresa === empresaSeleccionada
      );
      
      if (equipoNuevo) {
        // Eliminar de equipos nuevos
        const nuevosEquiposNuevos = equiposNuevos.filter(
          e => !(e.imei === imeiInLimpio && e.empresa === empresaSeleccionada)
        );
        setEquiposNuevos(nuevosEquiposNuevos);
        mensajesDescuento.push(`✓ Equipo NUEVO (${imeiInLimpio}) descontado del inventario`);
      }
    }

    // Procesar IMEI OUT (equipo retirado)
    if (imeiOut && imeiOut.trim() !== '') {
      const imeiOutLimpio = imeiOut.trim();
      
      // Buscar en equipos retirados
      const equipoRetirado = equiposRetirados.find(
        e => e.imei === imeiOutLimpio && e.empresa === empresaSeleccionada
      );
      
      if (equipoRetirado) {
        // Eliminar de equipos retirados
        const nuevosEquiposRetirados = equiposRetirados.filter(
          e => !(e.imei === imeiOutLimpio && e.empresa === empresaSeleccionada)
        );
        setEquiposRetirados(nuevosEquiposRetirados);
        mensajesDescuento.push(`✓ Equipo RETIRADO (${imeiOutLimpio}) descontado del inventario`);
      }
    }

    // Mostrar mensajes de confirmación
    if (mensajesDescuento.length > 0) {
      alert(`EQUIPOS DESCONTADOS:\n\n${mensajesDescuento.join('\n')}\n\nLos equipos ya no aparecerán en la sección de Equipos.`);
    }
  };

  const handleSubmit = () => {
    if (!formData.nombreCliente || !formData.fecha) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    if (editingItem) {
      // Actualizar trabajo existente (NO descontar equipos en edición)
      setTrabajos(trabajos.map(t => t.id === editingItem.id ? { ...formData, id: editingItem.id } : t));
      setEditingItem(null);
    } else {
      // Crear nuevo trabajo
      const prefix = empresaSeleccionada === 'Location World' ? 'LW' : 'U';
      const trabajosDeEmpresa = trabajos.filter(t => t.empresa === empresaSeleccionada);
      const count = trabajosDeEmpresa.length + 1;
      const newId = `${prefix}${String(count).padStart(3, '0')}`;
      
      // Guardar el trabajo
      setTrabajos([...trabajos, { ...formData, id: newId, empresa: empresaSeleccionada, mes: mesSeleccionado }]);
      
      // DESCONTAR EQUIPOS DEL INVENTARIO
      descontarEquipos(formData.imeiIn, formData.imeiOut);
    }
    
    setShowForm(false);
    setFormData({
      id: '', nombreCliente: '', fecha: '', servicio: 'Instalación',
      accesorios: [], ppuIn: '', ppuOut: '', imeiIn: '', imeiOut: '', km: '',
      valorUF: '', valorPesos: '', empresa: empresaSeleccionada, mes: mesSeleccionado
    });
  };

  const handleEdit = (trabajo) => {
    setEditingItem(trabajo);
    setFormData(trabajo);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este trabajo?')) {
      setTrabajos(trabajos.filter(t => t.id !== id));
    }
  };

  const totales = calcularTotales();

  // Funciones de exportación visual
  const handleExportVisualPDF = () => {
    exportToVisualPDF('trabajos-export-container', `trabajos_${empresaSeleccionada}_${mesSeleccionado}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportVisualImage = () => {
    exportToVisualImage('trabajos-export-container', `trabajos_${empresaSeleccionada}_${mesSeleccionado}_${new Date().toISOString().split('T')[0]}`);
  };

  // Verificar si un IMEI existe en el inventario
  const verificarIMEIEnInventario = (imei, tipo) => {
    if (!imei || imei.trim() === '') return null;
    
    const imeiLimpio = imei.trim();
    
    if (tipo === 'IN') {
      // Buscar en equipos nuevos
      const equipoNuevo = equiposNuevos.find(
        e => e.imei === imeiLimpio && e.empresa === empresaSeleccionada
      );
      return equipoNuevo ? 'NUEVO' : null;
    } else if (tipo === 'OUT') {
      // Buscar en equipos retirados
      const equipoRetirado = equiposRetirados.find(
        e => e.imei === imeiLimpio && e.empresa === empresaSeleccionada
      );
      return equipoRetirado ? 'RETIRADO' : null;
    }
    
    return null;
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Trabajos del Mes</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select
                value={empresaSeleccionada}
                onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                className="form-select"
              >
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div>
              <label className="filter-label">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="form-select"
              >
                <option>Febrero 2026</option>
                <option>Marzo 2026</option>
                <option>Abril 2026</option>
                <option>Mayo 2026</option>
                <option>Junio 2026</option>
                <option>Julio 2026</option>
                <option>Enero 2026</option>
              </select>
            </div>
            <div>
              <label className="filter-label">
                Valor UF($) 
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '0.85em', 
                  color: '#16a34a',
                  fontWeight: 'bold'
                }}>
                  ⟳ Actualizar tabla
                </span>
              </label>
              <input
                type="number"
                value={valorUFMes}
                onChange={(e) => setValorUFMes(Number(e.target.value) || 0)}
                className="form-input"
                placeholder="Ej: 39000"
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className="toolbar">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                setFormData({
                  id: '', nombreCliente: '', fecha: '', servicio: 'Instalación',
                  accesorios: [], ppuIn: '', ppuOut: '', imeiIn: '', imeiOut: '', km: '',
                  valorUF: '', valorPesos: '', empresa: empresaSeleccionada, mes: mesSeleccionado
                });
              }}
              className="btn btn-primary"
            >
              <Plus size={20} /> Agregar
            </button>
            <button
              onClick={() => exportToCSV(trabajosFiltrados, `trabajos_${empresaSeleccionada}_${mesSeleccionado}`)}
              className="btn btn-success"
            >
              <Download size={20} /> Excel
            </button>
            <button
              onClick={handleExportVisualPDF}
              className="btn btn-danger"
              title="Exportar como se ve en la app (PDF)"
            >
              <FileImage size={20} /> PDF Visual
            </button>
            <button
              onClick={handleExportVisualImage}
              className="btn btn-purple"
              title="Exportar como se ve en la app (Imagen)"
            >
              <FileImage size={20} /> Imagen
            </button>
          </div>

          {showForm && (
            <div className="form-container blue">
              <h3 className="form-title">
                {editingItem ? 'Editar Trabajo' : 'Nuevo Trabajo'}
              </h3>
              
              {/* Alerta informativa */}
              {!editingItem && (
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{
                    fontFamily: 'Quantico',
                    fontSize: '0.65em',
                    color: '#1e40af',
                    textTransform: 'uppercase',
                    lineHeight: '1.4'
                  }}>
                    <strong>Sistema de descuento automático:</strong><br />
                    Al guardar este trabajo, los equipos con IMEI ingresados serán descontados automáticamente del inventario de Equipos.
                  </div>
                </div>
              )}

              <div className="form-grid three-cols">
                <input
                  type="text"
                  placeholder="Nombre Cliente *"
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                  className="form-input"
                />
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.servicio}
                  onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                  className="form-select"
                >
                  <option>Instalación</option>
                  <option>Desinstalación</option>
                  <option>Mantención</option>
                  <option>Reinstalación</option>
                  <option>Visita Fallida</option>
                </select>
                
                <select
                  multiple
                  value={formData.accesorios}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, accesorios: selected});
                  }}
                  className="form-select"
                  style={{ minHeight: '80px' }}
                >
                  {Object.keys(accesoriosDisponibles).map(accesorio => (
                    <option key={accesorio} value={accesorio}>
                      {accesorio}
                    </option>
                  ))}
                </select>

                {/* PPU IN */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="PPU IN (Patente Entrada)"
                    value={formData.ppuIn}
                    onChange={(e) => setFormData({...formData, ppuIn: e.target.value.toUpperCase()})}
                    className="form-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* PPU OUT */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="PPU OUT (Patente Salida)"
                    value={formData.ppuOut}
                    onChange={(e) => setFormData({...formData, ppuOut: e.target.value.toUpperCase()})}
                    className="form-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* IMEI IN con indicador */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="IMEI IN (Equipo Instalado)"
                    value={formData.imeiIn}
                    onChange={(e) => setFormData({...formData, imeiIn: e.target.value})}
                    className="form-input"
                    style={{
                      paddingRight: verificarIMEIEnInventario(formData.imeiIn, 'IN') ? '50px' : '10px'
                    }}
                  />
                  {!editingItem && verificarIMEIEnInventario(formData.imeiIn, 'IN') && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6em',
                      fontFamily: 'Quantico',
                      fontWeight: 'bold'
                    }}>
                      EN STOCK
                    </span>
                  )}
                </div>

                {/* IMEI OUT con indicador */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="IMEI OUT (Equipo Retirado)"
                    value={formData.imeiOut}
                    onChange={(e) => setFormData({...formData, imeiOut: e.target.value})}
                    className="form-input"
                    style={{
                      paddingRight: verificarIMEIEnInventario(formData.imeiOut, 'OUT') ? '50px' : '10px'
                    }}
                  />
                  {!editingItem && verificarIMEIEnInventario(formData.imeiOut, 'OUT') && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6em',
                      fontFamily: 'Quantico',
                      fontWeight: 'bold'
                    }}>
                      EN STOCK
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="KM"
                  value={formData.km}
                  onChange={(e) => setFormData({...formData, km: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSubmit} className="btn btn-primary">
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Contenedor para exportación visual */}
          <div id="trabajos-export-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Russo One', fontSize: '1.5em', color: '#1f2937', marginBottom: '10px' }}>
                TRABAJOS DEL MES
              </h2>
              <div style={{ fontFamily: 'Changa', fontSize: '1.1em', color: '#4b5563' }}>
                {empresaSeleccionada} - {mesSeleccionado}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.55em', color: '#6b7280', fontFamily: 'Quantico', textTransform: 'uppercase' }}>
              Mostrando {trabajosFiltrados.length} trabajos
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Accesorios</th>
                    <th>PPU IN</th>
                    <th>PPU OUT</th>
                    <th>IMEI IN</th>
                    <th>IMEI OUT</th>
                    <th className="right">KM</th>
                    <th className="right">UF</th>
                    <th className="right">Valor $</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="empty-state">
                        No hay trabajos registrados para este mes
                      </td>
                    </tr>
                  ) : (
                    trabajosFiltrados.map(trabajo => (
                      <tr key={trabajo.id}>
                        <td>{trabajo.id}</td>
                        <td className="text-bold">{trabajo.nombreCliente}</td>
                        <td>{trabajo.fecha}</td>
                        <td>{trabajo.servicio}</td>
                        <td style={{ fontSize: '0.55em' }}>
                          {trabajo.accesorios && trabajo.accesorios.length > 0 
                            ? trabajo.accesorios.join(', ') 
                            : '-'}
                        </td>
                        <td>{trabajo.ppuIn || '-'}</td>
                        <td>{trabajo.ppuOut || '-'}</td>
                        <td className="text-mono">{trabajo.imeiIn || '-'}</td>
                        <td className="text-mono">{trabajo.imeiOut || '-'}</td>
                        <td className="right">{trabajo.km}</td>
                        <td className="right">{trabajo.valorUF}</td>
                        <td className="right">${Number(trabajo.valorPesos).toLocaleString()}</td>
                        <td className="center">
                          <div className="table-actions">
                            <button 
                              onClick={() => handleEdit(trabajo)} 
                              className="action-btn edit"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(trabajo.id)} 
                              className="action-btn delete"
                              title="Eliminar"
                            >
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

            {trabajosFiltrados.length > 0 && (
              <div className="summary-container">
                <h3 className="summary-title">Resumen del Mes</h3>
                <div className="summary-grid">
                  <div className="summary-card">
                    <span className="summary-label">Total UF</span>
                    <div className="summary-value blue">{totales.totalUF}</div>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">Total Pesos</span>
                    <div className="summary-value green">${totales.totalPesos.toLocaleString()}</div>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">Total KM</span>
                    <div className="summary-value purple">{totales.totalKm}</div>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">Valor KM</span>
                    <div className="summary-value orange">${totales.totalValorKm.toLocaleString()}</div>
                  </div>
                </div>
                <div className="summary-total">
                  <div className="summary-total-card">
                    <span className="summary-total-label">Subtotal</span>
                    <div className="summary-total-value">${totales.subtotal.toLocaleString()}</div>
                  </div>
                  <div className="summary-total-card">
                    <span className="summary-total-label">IVA (19%)</span>
                    <div className="summary-total-value">${Math.round(totales.iva).toLocaleString()}</div>
                  </div>
                  <div className="summary-total-card highlight">
                    <span className="summary-total-label">TOTAL</span>
                    <div className="summary-total-value">${Math.round(totales.total).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trabajos;