import React, { useState, useEffect, useRef } from 'react';
import { Home, Edit2, Save, X, FileText, Camera } from 'lucide-react';
import '../styles/ValoresTrabajos.css';

const ValoresTrabajos = ({ setCurrentView }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [valorUF, setValorUF] = useState(38500);
  const exportRef = useRef(null);

  const serviciosIniciales = [
    { detalle: 'INSTALACION ON BATT - OBD', uf: 0.4 },
    { detalle: 'INSTALACION BASICA', uf: 0.8 },
    { detalle: 'INSTALACION BASICA + CORTACORRIENTE', uf: 1 },
    { detalle: 'MANTENIMIENTO', uf: 0.7 },
    { detalle: 'MIGRACION', uf: 1.1 },
    { detalle: 'DESINSTALACION', uf: 0.5 },
    { detalle: 'VISITA FALLIDA (MIN)', uf: 0.5 },
    { detalle: 'INSTALACION CANBUS', uf: 0.6 },
    { detalle: 'ACCESORIOS (SOS, IBUTTON, BUZZER, BLOQUEO)', uf: 0.4 }
  ];

  const infoIniciales = {
    valorKm: 250,
    detallesServicios: 'Incluye instalación, configuración y prueba del equipo GPS. Garantía de 6 meses en mano de obra.',
    tipoBoleta: 'Boleta de Honorarios',
    nombreEmpresa: 'Location World',
    rutEmpresa: '12.345.678-9',
    direccion: 'Av. Providencia 1234, Santiago',
    telefono: '+56 9 1234 5678',
    email: 'contacto@locationworld.cl'
  };

  const [servicios, setServicios] = useState(serviciosIniciales);
  const [infoAdicional, setInfoAdicional] = useState(infoIniciales);
  const [editedServicios, setEditedServicios] = useState([...serviciosIniciales]);
  const [editedInfo, setEditedInfo] = useState({...infoIniciales});

  useEffect(() => {
    const stored = localStorage.getItem('valoresTrabajos');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.servicios) {
          setServicios(data.servicios);
          setEditedServicios(data.servicios);
        }
        if (data.infoAdicional) {
          setInfoAdicional(data.infoAdicional);
          setEditedInfo(data.infoAdicional);
        }
        if (data.valorUF) {
          setValorUF(data.valorUF);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setServicios([...editedServicios]);
    setInfoAdicional({...editedInfo});
    
    const dataToSave = {
      servicios: editedServicios,
      infoAdicional: editedInfo,
      valorUF
    };
    localStorage.setItem('valoresTrabajos', JSON.stringify(dataToSave));
    
    setIsEditing(false);
    alert('✓ Cambios guardados correctamente');
  };

  const handleCancel = () => {
    setEditedServicios([...servicios]);
    setEditedInfo({...infoAdicional});
    setIsEditing(false);
  };

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
        {/* Header principal */}
        <div className="valores-header-card">
          <div className="valores-header">
            <h2 className="valores-title">Valores de Trabajos GPS</h2>
            <button onClick={() => setCurrentView('home')} className="btn-valores btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          <div className="valores-toolbar">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-valores btn-primary">
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
            <div className="valores-uf-input">
              <label className="valores-label">Valor UF Actual ($)</label>
              <input
                type="number"
                value={valorUF}
                onChange={(e) => setValorUF(Number(e.target.value))}
                className="valores-input"
              />
            </div>
          )}
        </div>

        {/* Contenido exportable */}
        <div ref={exportRef} className="valores-export-card">
          {/* Header de la empresa */}
          <div className="valores-empresa-header">
            <h1 className="valores-empresa-nombre">{displayInfo.nombreEmpresa}</h1>
            {isEditing ? (
              <div className="valores-form-grid">
                <input
                  type="text"
                  value={editedInfo.nombreEmpresa}
                  onChange={(e) => setEditedInfo({...editedInfo, nombreEmpresa: e.target.value})}
                  placeholder="Nombre Empresa"
                  className="valores-input"
                />
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
                <p>RUT: {displayInfo.rutEmpresa}</p>
                <p>{displayInfo.direccion}</p>
                <p>Tel: {displayInfo.telefono} | Email: {displayInfo.email}</p>
              </div>
            )}
          </div>

          {/* Tabla de servicios */}
          <div className="valores-tabla-section">
            <h3 className="valores-tabla-title">Tabla de Precios - Servicios GPS</h3>
            
            <div className="valores-table-container">
              <table className="valores-table">
                <thead>
                  <tr>
                    <th className="text-left">Detalle</th>
                    <th className="text-center">UF</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información adicional */}
          <div className="valores-info-adicional">
            <h4 className="valores-info-title">Información Adicional</h4>
            
            <div className="valores-info-item">
              <strong>Valor por KM recorrido:</strong>
              {isEditing ? (
                <input
                  type="number"
                  value={editedInfo.valorKm}
                  onChange={(e) => setEditedInfo({...editedInfo, valorKm: Number(e.target.value)})}
                  className="valores-input-km"
                />
              ) : (
                <span className="valores-km-valor">${displayInfo.valorKm.toLocaleString()}</span>
              )}
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

          {/* Footer */}
          <div className="valores-footer">
            <p>Valor UF considerado: ${valorUF.toLocaleString()}</p>
            <p>Documento generado el {new Date().toLocaleDateString('es-CL')}</p>
            <p className="valores-footer-italic">Precios sujetos a cambios según variación de la UF</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValoresTrabajos;