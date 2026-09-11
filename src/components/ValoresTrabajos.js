import React, { useState, useRef } from 'react';
import { Home, Edit2, Save, X, FileText, Camera, Trash2, Plus } from 'lucide-react';
import { SERVICIOS, ACCESORIOS, preciosDe } from '../utils/pricing';
import '../styles/ValoresTrabajos.css';

const ValoresTrabajos = ({ setCurrentView, empresas, empresaSeleccionada, setEmpresaSeleccionada, preciosEmpresas, setPreciosEmpresas }) => {
  const [isEditing, setIsEditing] = useState(false);
  const exportRef = useRef(null);

  const serviciosIniciales = [
    { detalle: 'INSTALACION ON BATT - OBD', uf: 0.6 },
    { detalle: 'INSTALACION BASICA', uf: 0.8 },
    { detalle: 'MANTENIMIENTO', uf: 0.7 },
    { detalle: 'MIGRACION', uf: 1.1 },
    { detalle: 'DESINSTALACION', uf: 0.5 },
    { detalle: 'DESINSTALACION GPS EXTERNO', uf: 0.3 },
    { detalle: 'VISITA FALLIDA (45 MIN)', uf: 0.5 },
    { detalle: 'INSTALACION CANBUS', uf: 0.6 },
    { detalle: 'ACCESORIOS (SOS, IBUTTON, BUZZER, BLOQUEO)', uf: 0.4 },
    { detalle: 'SENSOR TEMPERATURA', uf: 0.4 },
    { detalle: 'SENSOR PUERTA', uf: 0.6 }
  ];

  const infoIniciales = {
    detallesServicios: 'Incluye instalación, configuración y prueba del equipo GPS.',
    tipoBoleta: 'Factura o Boleta de Honorarios',
    usarLogo: true, // Nueva opción para usar logo
    nombreEmpresa: '',
    rutEmpresa: '',
    direccion: '',
    telefono: '+56 9 26266291',
    email: 'sebas.parragps@gmail.com'
  };

  const [servicios, setServicios] = useState(serviciosIniciales);
  const [infoAdicional, setInfoAdicional] = useState(infoIniciales);
  const [editedServicios, setEditedServicios] = useState([...serviciosIniciales]);
  const [editedInfo, setEditedInfo] = useState({...infoIniciales});
  // Precios reales (motor de cobro) de la empresa elegida arriba — null
  // cuando no se está editando; se llena con una copia fresca al entrar a
  // modo edición y se descarta al cancelar/guardar.
  const [editedPrecios, setEditedPrecios] = useState(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('valoresTrabajos');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.servicios) {
          setServicios(data.servicios);
          setEditedServicios(data.servicios);
        }
        if (data.infoAdicional) {
          // Completa con los defaults cualquier campo que un respaldo viejo
          // no tuviera — si no, quedaban en undefined: el input arrancaba
          // "no controlado" y sólo se veía controlado después de escribir
          // algo una vez. valorKm quedó afuera: ahora es parte de los
          // precios reales por empresa (ver más abajo), no de este bloque
          // de datos "para el documento impreso".
          const { valorKm, ...resto } = data.infoAdicional;
          const infoCompleta = {
            ...infoIniciales,
            ...resto,
            usarLogo: data.infoAdicional.usarLogo !== undefined ? data.infoAdicional.usarLogo : true
          };
          setInfoAdicional(infoCompleta);
          setEditedInfo(infoCompleta);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Precios reales de la empresa seleccionada (valor UF, valor km, precio de
  // cada servicio y accesorio) — cada empresa tiene los suyos, antes eran un
  // solo valor compartido por toda la app.
  const precios = preciosDe(empresaSeleccionada, preciosEmpresas);
  const displayPrecios = isEditing ? editedPrecios : precios;

  const startEdit = () => {
    setEditedServicios([...servicios]);
    setEditedInfo({...infoAdicional});
    setEditedPrecios(preciosDe(empresaSeleccionada, preciosEmpresas));
    setIsEditing(true);
  };

  const handleSave = () => {
    setServicios([...editedServicios]);
    setInfoAdicional({...editedInfo});

    const dataToSave = {
      servicios: editedServicios,
      infoAdicional: editedInfo,
    };
    localStorage.setItem('valoresTrabajos', JSON.stringify(dataToSave));
    setPreciosEmpresas(prev => ({ ...prev, [empresaSeleccionada]: editedPrecios }));

    setIsEditing(false);
    setEditedPrecios(null);
    alert('✓ Cambios guardados correctamente');
  };

  const handleCancel = () => {
    setEditedServicios([...servicios]);
    setEditedInfo({...infoAdicional});
    setEditedPrecios(null);
    setIsEditing(false);
  };

  const setValorUF = (valor) => setEditedPrecios(p => ({ ...p, valorUF: valor }));
  const setValorKm = (valor) => setEditedPrecios(p => ({ ...p, valorKm: valor }));
  const setPrecioServicio = (servicio, valor) => setEditedPrecios(p => ({ ...p, servicios: { ...p.servicios, [servicio]: valor } }));
  const setPrecioAccesorio = (acc, valor) => setEditedPrecios(p => ({ ...p, accesorios: { ...p.accesorios, [acc]: valor } }));

  const eliminarServicio = (idx) => setEditedServicios(prev => prev.filter((_, i) => i !== idx));
  const agregarServicio = () => setEditedServicios(prev => [...prev, { detalle: 'NUEVO SERVICIO', uf: 0 }]);

  const exportToPDF = async () => {
    try {
      const element = exportRef.current;
      const canvas = await window.html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`valores-trabajos-gps-${new Date().toISOString().split('T')[0]}.pdf`);

      alert('✓ PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('❌ Error al generar el PDF. Por favor intenta nuevamente.');
    }
  };

  const exportToImage = async () => {
    try {
      const element = exportRef.current;
      const canvas = await window.html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `valores-trabajos-gps-${new Date().toISOString().split('T')[0]}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
        alert('✓ Imagen descargada correctamente');
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error al generar imagen:', error);
      alert('❌ Error al generar la imagen. Por favor intenta nuevamente.');
    }
  };

  const displayData = isEditing ? editedServicios : servicios;
  const displayInfo = isEditing ? editedInfo : infoAdicional;

  return (
    <div className="valores-container">
      <div className="valores-content">
        <div className="valores-header-card">
          <div className="valores-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="valores-title">Valores Trabajos</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn-valores btn-secondary">
              <Home size={12} />Inicio
            </button>
          </div>

          <div className="valores-uf-input">
            <label className="valores-label">Empresa</label>
            <select
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              className="valores-input"
              disabled={isEditing}
            >
              {(empresas || []).map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>

          <div className="valores-toolbar">
            {!isEditing ? (
              <>
                <button onClick={startEdit} className="btn-valores btn-primary">
                  <Edit2 size={18} /> Editar
                </button>
                <button onClick={exportToPDF} className="btn-valores btn-danger">
                  <FileText size={18} /> Descargar PDF
                </button>
                <button onClick={exportToImage} className="btn-valores btn-success">
                  <Camera size={18} /> Descargar JPG
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} className="btn-valores btn-success">
                  <Save size={18} /> Guardar
                </button>
                <button onClick={handleCancel} className="btn-valores btn-secondary">
                  <X size={18} /> Cancelar
                </button>
              </>
            )}
          </div>

          {isEditing && (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div className="valores-uf-input">
                <label className="valores-label">Valor UF Actual ($)</label>
                <input
                  type="number"
                  value={editedPrecios.valorUF}
                  onChange={(e) => setValorUF(Number(e.target.value))}
                  className="valores-input"
                />
              </div>
              <div className="valores-uf-input">
                <label className="valores-label">Valor por KM recorrido ($)</label>
                <input
                  type="number"
                  value={editedPrecios.valorKm}
                  onChange={(e) => setValorKm(Number(e.target.value))}
                  className="valores-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Precios reales por empresa — esto es lo que usan Trabajos del Mes
            y Validación WhatsApp para cobrar; antes era un solo valor
            compartido por toda la app sin importar la empresa. */}
        <div className="valores-header-card">
          <h3 className="valores-tabla-title">Precios de Servicios y Accesorios — {empresaSeleccionada}</h3>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div className="valores-table-container" style={{ flex:1, minWidth:220 }}>
              <table className="valores-table">
                <thead><tr><th className="text-left">Servicio</th><th className="text-center">UF</th></tr></thead>
                <tbody>
                  {SERVICIOS.map(s => (
                    <tr key={s}>
                      <td>{s}</td>
                      <td className="text-center">
                        {isEditing ? (
                          <input type="number" step="0.1" value={displayPrecios.servicios[s]}
                            onChange={e => setPrecioServicio(s, parseFloat(e.target.value) || 0)}
                            className="valores-input-uf" />
                        ) : (
                          <span className="valores-uf-valor">{displayPrecios.servicios[s]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="valores-table-container" style={{ flex:1, minWidth:220 }}>
              <table className="valores-table">
                <thead><tr><th className="text-left">Accesorio</th><th className="text-center">UF</th></tr></thead>
                <tbody>
                  {ACCESORIOS.map(a => (
                    <tr key={a}>
                      <td>{a}</td>
                      <td className="text-center">
                        {isEditing ? (
                          <input type="number" step="0.1" value={displayPrecios.accesorios[a]}
                            onChange={e => setPrecioAccesorio(a, parseFloat(e.target.value) || 0)}
                            className="valores-input-uf" />
                        ) : (
                          <span className="valores-uf-valor">{displayPrecios.accesorios[a]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontFamily:'Quantico', fontSize:'0.6em', color:'#6b7280', textTransform:'uppercase', marginTop:10 }}>
            "ON BATT" en una Instalación reemplaza el valor de Instalación (no se suma aparte).
          </p>
        </div>

        <div ref={exportRef} className="valores-export-card">
          <div className="valores-empresa-header">
            {/* Logo o Nombre de la empresa */}
            {displayInfo.usarLogo ? (
              <div className="valores-logo-container">
                <img src="/logo.svg" alt="Logo Empresa" className="valores-empresa-logo" />
              </div>
            ) : (
              <h1 className="valores-empresa-nombre">{displayInfo.nombreEmpresa}</h1>
            )}

            {isEditing ? (
              <div className="valores-form-grid">
                {/* Toggle para usar logo o nombre */}
                <div className="valores-logo-toggle">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editedInfo.usarLogo}
                      onChange={(e) => setEditedInfo({...editedInfo, usarLogo: e.target.checked})}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Usar logo en lugar de nombre</span>
                  </label>
                </div>

                {!editedInfo.usarLogo && (
                  <input
                    type="text"
                    value={editedInfo.nombreEmpresa}
                    onChange={(e) => setEditedInfo({...editedInfo, nombreEmpresa: e.target.value})}
                    placeholder="Nombre Empresa"
                    className="valores-input"
                  />
                )}

                <input
                  type="text"
                  value={editedInfo.rutEmpresa}
                  onChange={(e) => setEditedInfo({...editedInfo, rutEmpresa: e.target.value})}
                  placeholder="RUT"
                  className="valores-input"
                />

                <input
                  type="text"
                  value={editedInfo.direccion}
                  onChange={(e) => setEditedInfo({...editedInfo, direccion: e.target.value})}
                  placeholder="Dirección"
                  className="valores-input"
                />
                <input
                  type="tel"
                  value={editedInfo.telefono}
                  onChange={(e) => setEditedInfo({...editedInfo, telefono: e.target.value})}
                  placeholder="Teléfono"
                  className="valores-input"
                />
                <input
                  type="email"
                  value={editedInfo.email}
                  onChange={(e) => setEditedInfo({...editedInfo, email: e.target.value})}
                  placeholder="Email"
                  className="valores-input"
                />
              </div>
            ) : (
              <div className="valores-empresa-info">
                {/*<p>RUT: {displayInfo.rutEmpresa}</p>*/}
                <p>{displayInfo.direccion}</p>
                <p>| Tel: {displayInfo.telefono}</p>
                <p>| Email: {displayInfo.email}</p>
              </div>
            )}
          </div>

          <div className="valores-tabla-section">
            <h3 className="valores-tabla-title">Tabla de Precios - Servicios GPS</h3>

            <div className="valores-table-container">
              <table className="valores-table">
                <thead>
                  <tr>
                    <th className="text-left">Detalle</th>
                    <th className="text-center">UF</th>
                    {isEditing && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((servicio, index) => (
                    <tr key={index}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={servicio.detalle}
                            onChange={(e) => {
                              const newServicios = [...editedServicios];
                              newServicios[index].detalle = e.target.value;
                              setEditedServicios(newServicios);
                            }}
                            className="valores-input-table"
                          />
                        ) : (
                          <strong>{servicio.detalle}</strong>
                        )}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={servicio.uf}
                            onChange={(e) => {
                              const newServicios = [...editedServicios];
                              newServicios[index].uf = parseFloat(e.target.value) || 0;
                              setEditedServicios(newServicios);
                            }}
                            className="valores-input-uf"
                          />
                        ) : (
                          <span className="valores-uf-valor">{servicio.uf}</span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="text-center">
                          <button
                            onClick={() => eliminarServicio(index)}
                            title="Eliminar fila"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isEditing && (
              <button
                onClick={agregarServicio}
                style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed #3b82f6', borderRadius: '6px', color: '#3b82f6', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8em', fontFamily: 'Quantico' }}
              >
                <Plus size={14} /> Agregar fila
              </button>
            )}
          </div>

          <div className="valores-info-adicional">
            <h4 className="valores-info-title">Información Adicional</h4>

            <div className="valores-info-item">
              <strong>Valor por KM recorrido:</strong>
              <span className="valores-km-valor">${displayPrecios.valorKm.toLocaleString()}</span>
            </div>

            <div className="valores-info-item">
              <strong className="valores-info-label">Detalles de los Servicios:</strong>
              {isEditing ? (
                <textarea
                  value={editedInfo.detallesServicios}
                  onChange={(e) => setEditedInfo({...editedInfo, detallesServicios: e.target.value})}
                  rows={3}
                  className="valores-textarea"
                />
              ) : (
                <p className="valores-detalles-text">{displayInfo.detallesServicios}</p>
              )}
            </div>

            <div className="valores-info-item">
              <strong>Tipo de Documento:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInfo.tipoBoleta}
                  onChange={(e) => setEditedInfo({...editedInfo, tipoBoleta: e.target.value})}
                  className="valores-input-boleta"
                />
              ) : (
                <span className="valores-boleta-text">{displayInfo.tipoBoleta}</span>
              )}
            </div>
          </div>

          <div className="valores-footer">
            <p>Empresa: {empresaSeleccionada} · Valor UF considerado: ${displayPrecios.valorUF.toLocaleString()}</p>
            <p>Documento generado el {new Date().toLocaleDateString('es-CL')}</p>
            <p className="valores-footer-italic">Precios sujetos a cambios según variación de la UF</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValoresTrabajos;
