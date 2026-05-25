import React, { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Camera, Download, Edit2, X, AlertTriangle, QrCode } from 'lucide-react';
import { deleteFromTable } from '../lib/supabase';
import { exportToCSV } from '../utils/exportUtils';
import BarcodeScanner from './BarcodeScanner';
import '../styles/Scanner.css';

const TIPOS_MATERIAL = [
  'ON BATT','Edata','Dallas','Buzzer','SOS',
  'Inmovilizador 12v','Inmovilizador 24v',
  'GPS Externo','Sensor T°','Sensor Puerta',
];

const CARDS = [
  { key:'nuevos',    label:'GPS Nuevo',    color:'#16a34a', bg:'#dcfce7', cat:'equipo' },
  { key:'retirados', label:'GPS Retirado', color:'#3b82f6', bg:'#dbeafe', cat:'equipo' },
  { key:'malos',     label:'GPS Malo',     color:'#dc2626', bg:'#fee2e2', cat:'equipo' },
  ...TIPOS_MATERIAL.map(t => ({ key:t, label:t, color:'#0d9488', bg:'#ccfbf1', cat:'material' })),
];

const TODAY = new Date().toISOString().split('T')[0];

const Materiales = ({
  setCurrentView,
  equiposNuevos, setEquiposNuevos,
  equiposRetirados, setEquiposRetirados,
  equiposMalos, setEquiposMalos,
  materiales, setMateriales,
  empresas, empresaSeleccionada, setEmpresaSeleccionada,
  onOpenScanner,
  dbError,
}) => {
  const [selectedType, setSelectedType] = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [formType, setFormType]         = useState('nuevos');
  const [editingId, setEditingId]       = useState(null);
  const [showScanner, setShowScanner]   = useState(false);
  const [deleteId, setDeleteId]         = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const [formN,   setFormN]   = useState({ fechaRecepcion:TODAY, imei:'', estado:'disponible', nombreCliente:'' });
  const [formR,   setFormR]   = useState({ fecha:TODAY, cliente:'', imei:'' });
  const [formMl,  setFormMl]  = useState({ imei:'', asignado:false, nombreCliente:'' });
  const [formMat, setFormMat] = useState({ tipo:TIPOS_MATERIAL[0], serial:'', cantidad:1, fecha:TODAY });

  // Limpiar selección al cambiar de tipo
  useEffect(() => { setSelectedRows(new Set()); }, [selectedType]);

  const emp     = empresaSeleccionada;
  const filtN   = equiposNuevos.filter(e => e.empresa === emp);
  const filtR   = equiposRetirados.filter(e => e.empresa === emp);
  const filtMl  = equiposMalos.filter(e => e.empresa === emp);
  const filtMat = (materiales || []).filter(m => m.empresa === emp);

  const countOf = (key) => {
    if (key === 'nuevos')    return filtN.length;
    if (key === 'retirados') return filtR.length;
    if (key === 'malos')     return filtMl.length;
    return filtMat.filter(m => m.tipo === key).length;
  };

  const tableData = () => {
    if (!selectedType) return null;
    if (selectedType === 'nuevos')    return filtN;
    if (selectedType === 'retirados') return filtR;
    if (selectedType === 'malos')     return filtMl;
    return filtMat.filter(m => m.tipo === selectedType);
  };

  const toggleRow = (id) => setSelectedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const data = tableData() || [];
    setSelectedRows(data.length > 0 && selectedRows.size === data.length
      ? new Set()
      : new Set(data.map(d => d.id)));
  };

  const pfx = (b) => emp === 'UGPS' ? `U${b}` : `E${b}`;

  const resetForms = () => {
    setFormN({ fechaRecepcion:TODAY, imei:'', estado:'disponible', nombreCliente:'' });
    setFormR({ fecha:TODAY, cliente:'', imei:'' });
    setFormMl({ imei:'', asignado:false, nombreCliente:'' });
    setFormMat({ tipo: CARDS.find(c=>c.key===selectedType)?.cat==='material' ? selectedType : TIPOS_MATERIAL[0], serial:'', cantidad:1, fecha:TODAY });
  };

  const openAdd = () => {
    resetForms();
    setEditingId(null);
    const t = selectedType || 'nuevos';
    setFormType(t);
    if (CARDS.find(c=>c.key===t)?.cat==='material') setFormMat(f=>({...f, tipo:t}));
    setShowForm(true);
  };

  const handleCardClick = (key) => {
    setSelectedType(prev => prev === key ? null : key);
    setShowForm(false); setEditingId(null);
  };

  const handleFormTypeChange = (t) => {
    setFormType(t);
    if (CARDS.find(c=>c.key===t)?.cat==='material') setFormMat(f=>({...f, tipo:t}));
  };

  const handleEdit = (item, cat) => {
    setEditingId(item.id);
    if (cat === 'nuevos')    { setFormType('nuevos');    setFormN(item); }
    if (cat === 'retirados') { setFormType('retirados'); setFormR(item); }
    if (cat === 'malos')     { setFormType('malos');     setFormMl(item); }
    setShowForm(true);
  };

  const saveNuevo = () => {
    if (!formN.imei || !formN.fechaRecepcion) { alert('IMEI y Fecha requeridos'); return; }
    if (editingId) {
      setEquiposNuevos(prev => prev.map(e => e.id===editingId ? {...formN,id:editingId,empresa:emp} : e));
    } else {
      setEquiposNuevos(prev => [...prev, {...formN, id:`${pfx('N')}${String(filtN.length+1).padStart(3,'0')}`, empresa:emp}]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveRetirado = () => {
    if (!formR.imei || !formR.fecha || !formR.cliente) { alert('Completa todos los campos'); return; }
    if (editingId) {
      setEquiposRetirados(prev => prev.map(e => e.id===editingId ? {...formR,id:editingId,empresa:emp} : e));
    } else {
      setEquiposRetirados(prev => [...prev, {...formR, id:`${pfx('R')}${String(filtR.length+1).padStart(3,'0')}`, empresa:emp}]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveMalo = () => {
    if (!formMl.imei) { alert('IMEI requerido'); return; }
    if (editingId) {
      setEquiposMalos(prev => prev.map(e => e.id===editingId ? {...formMl,id:editingId,empresa:emp} : e));
    } else {
      setEquiposMalos(prev => [...prev, {...formMl, id:`${pfx('M')}${String(filtMl.length+1).padStart(3,'0')}`, empresa:emp}]);
    }
    setShowForm(false); setEditingId(null);
  };

  const saveMaterial = () => {
    const qty = Math.max(1, parseInt(formMat.cantidad)||1);
    const base = Date.now();
    setMateriales(prev => [...prev, ...Array.from({length:qty}, (_,i) => ({
      tipo:formMat.tipo, serial:qty===1?formMat.serial:'',
      fecha:formMat.fecha, id:`MAT${base+i}`, empresa:emp,
    }))]);
    setShowForm(false);
  };

  const handleSave = () => {
    const card = CARDS.find(c=>c.key===formType);
    if (!card) return;
    if (card.cat === 'equipo') {
      if (formType==='nuevos')    saveNuevo();
      if (formType==='retirados') saveRetirado();
      if (formType==='malos')     saveMalo();
    } else {
      saveMaterial();
    }
  };

  const deleteTbl = () =>
    selectedType==='nuevos'    ? 'equipos_nuevos'   :
    selectedType==='retirados' ? 'equipos_retirados' :
    selectedType==='malos'     ? 'equipos_malos'     : 'materiales';

  const applyDelete = (ids) => {
    deleteFromTable(deleteTbl(), ids);
    if (selectedType==='nuevos')    setEquiposNuevos(p  => p.filter(e => !ids.includes(e.id)));
    if (selectedType==='retirados') setEquiposRetirados(p => p.filter(e => !ids.includes(e.id)));
    if (selectedType==='malos')     setEquiposMalos(p   => p.filter(e => !ids.includes(e.id)));
    if (CARDS.find(c=>c.key===selectedType)?.cat==='material')
      setMateriales(p => p.filter(m => !ids.includes(m.id)));
  };

  const handleDelete = () => { applyDelete([deleteId]); setDeleteId(null); };

  const handleBulkDelete = () => {
    applyDelete([...selectedRows]);
    setSelectedRows(new Set());
    setShowBulkConfirm(false);
  };

  const handleScan = (val) => {
    const card = CARDS.find(c=>c.key===formType);
    if (card?.cat==='equipo') {
      if (formType==='nuevos')    setFormN(f=>({...f,imei:val}));
      if (formType==='retirados') setFormR(f=>({...f,imei:val}));
      if (formType==='malos')     setFormMl(f=>({...f,imei:val}));
    } else {
      setFormMat(f=>({...f,serial:val}));
    }
    setShowScanner(false);
  };

  const exportData = () => {
    const d = tableData();
    if (d) exportToCSV(d, `${selectedType}_${emp}`);
    else exportToCSV([...filtN,...filtR,...filtMl,...filtMat], `inventario_${emp}`);
  };

  const selCard      = CARDS.find(c=>c.key===selectedType);
  const isEquipoForm = CARDS.find(c=>c.key===formType)?.cat==='equipo';
  const curData      = tableData() || [];
  const allSelected  = curData.length > 0 && selectedRows.size === curData.length;

  const ChkAll = () => (
    <input type="checkbox" checked={allSelected} onChange={toggleAll}
      style={{cursor:'pointer',width:16,height:16}}/>
  );
  const ChkRow = ({id}) => (
    <input type="checkbox" checked={selectedRows.has(id)} onChange={()=>toggleRow(id)}
      style={{cursor:'pointer',width:16,height:16}}/>
  );

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">

          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo"/>
              <h2 className="page-title">Inventario GPS</h2>
            </div>
            <button onClick={()=>setCurrentView('home')} className="btn btn-secondary">
              <Home size={20}/> Inicio
            </button>
          </div>

          {/* Banner de error de base de datos */}
          {dbError && (
            <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'10px 14px',marginBottom:12,display:'flex',gap:10,alignItems:'flex-start'}}>
              <AlertTriangle size={18} color="#dc2626" style={{flexShrink:0,marginTop:2}}/>
              <div>
                <p style={{fontFamily:'Changa',fontWeight:'bold',color:'#dc2626',fontSize:'0.75em',textTransform:'uppercase',margin:0}}>
                  Error de base de datos — los materiales no se están guardando
                </p>
                <p style={{fontFamily:'Quantico',color:'#7f1d1d',fontSize:'0.6em',textTransform:'uppercase',margin:'4px 0 0'}}>
                  {dbError === 'load'
                    ? 'No se pudo cargar la tabla "materiales". Créala en Supabase con columnas: id (text, PK) y data (jsonb), luego activa RLS con política de lectura/escritura pública.'
                    : 'Error al guardar en Supabase. Verifica que la tabla "materiales" existe con columnas id (text PK) y data (jsonb), y que las políticas RLS permiten INSERT y UPDATE.'}
                </p>
              </div>
            </div>
          )}

          <div className="filter-container">
            <div>
              <label className="filter-label">Empresa</label>
              <select value={emp} onChange={e=>{setEmpresaSeleccionada(e.target.value);setShowForm(false);setSelectedType(null);}} className="form-select">
                {empresas.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Grilla unificada de contadores */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))',gap:8,marginBottom:16}}>
            {CARDS.map(card=>{
              const n = countOf(card.key);
              const active = selectedType === card.key;
              return (
                <div key={card.key} onClick={()=>handleCardClick(card.key)} style={{
                  background: active ? card.bg : '#f8fafc',
                  border:`2px solid ${active ? card.color : '#e2e8f0'}`,
                  borderRadius:10, padding:'8px 6px', textAlign:'center', cursor:'pointer',
                  transition:'all 0.15s',
                }}>
                  <div style={{fontFamily:'Quantico',fontSize:'0.46em',textTransform:'uppercase',color:active?card.color:'#6b7280',marginBottom:4,lineHeight:1.2}}>{card.label}</div>
                  <div style={{fontFamily:'Changa',fontSize:'1.3em',fontWeight:'bold',color:n>0?card.color:'#9ca3af'}}>{n}</div>
                </div>
              );
            })}
          </div>

          {selectedType && (
            <p style={{fontFamily:'Quantico',fontSize:'0.58em',textTransform:'uppercase',color:selCard?.color,marginBottom:8,textAlign:'center'}}>
              Mostrando: {selCard?.label} — {emp} · Toca la tarjeta para quitar filtro
            </p>
          )}

          <div className="toolbar">
            <button onClick={openAdd} className="btn btn-primary"><Plus size={20}/> Agregar</button>
            {selCard?.cat==='equipo' && onOpenScanner && (
              <button onClick={onOpenScanner} className="btn btn-secondary"><QrCode size={20}/> Escáner GPS</button>
            )}
            {selectedRows.size > 0 && (
              <button onClick={()=>setShowBulkConfirm(true)} className="btn btn-danger">
                <Trash2 size={20}/> Eliminar ({selectedRows.size})
              </button>
            )}
            <button onClick={exportData} className="btn btn-success"><Download size={20}/> Exportar</button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="form-container" style={{borderLeft:`4px solid ${CARDS.find(c=>c.key===formType)?.color||'#3b82f6'}`}}>
              <div style={{marginBottom:12}}>
                <label className="filter-label">¿Qué agregar?</label>
                <select value={formType} onChange={e=>handleFormTypeChange(e.target.value)} className="form-select" disabled={!!editingId}>
                  {CARDS.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>

              {formType==='nuevos' && (
                <div className="form-grid">
                  <input type="date" value={formN.fechaRecepcion} onChange={e=>setFormN(f=>({...f,fechaRecepcion:e.target.value}))} className="form-input"/>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <input type="text" placeholder="IMEI *" value={formN.imei} onChange={e=>setFormN(f=>({...f,imei:e.target.value}))} className="form-input" style={{flex:1}}/>
                    <button type="button" onClick={()=>setShowScanner(true)} className="btn btn-primary" style={{padding:'0.5rem',minWidth:'auto'}}><Camera size={20}/></button>
                  </div>
                  <select value={formN.estado} onChange={e=>setFormN(f=>({...f,estado:e.target.value}))} className="form-select">
                    <option value="disponible">Disponible</option>
                    <option value="asignado">Asignado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  {formN.estado==='asignado' && <input type="text" placeholder="Cliente" value={formN.nombreCliente} onChange={e=>setFormN(f=>({...f,nombreCliente:e.target.value}))} className="form-input"/>}
                </div>
              )}

              {formType==='retirados' && (
                <div className="form-grid three-cols">
                  <input type="date" value={formR.fecha} onChange={e=>setFormR(f=>({...f,fecha:e.target.value}))} className="form-input"/>
                  <input type="text" placeholder="Cliente *" value={formR.cliente} onChange={e=>setFormR(f=>({...f,cliente:e.target.value}))} className="form-input"/>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <input type="text" placeholder="IMEI *" value={formR.imei} onChange={e=>setFormR(f=>({...f,imei:e.target.value}))} className="form-input" style={{flex:1}}/>
                    <button type="button" onClick={()=>setShowScanner(true)} className="btn btn-primary" style={{padding:'0.5rem',minWidth:'auto'}}><Camera size={20}/></button>
                  </div>
                </div>
              )}

              {formType==='malos' && (
                <div className="form-grid">
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <input type="text" placeholder="IMEI *" value={formMl.imei} onChange={e=>setFormMl(f=>({...f,imei:e.target.value}))} className="form-input" style={{flex:1}}/>
                    <button type="button" onClick={()=>setShowScanner(true)} className="btn btn-danger" style={{padding:'0.5rem',minWidth:'auto'}}><Camera size={20}/></button>
                  </div>
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={formMl.asignado} onChange={e=>setFormMl(f=>({...f,asignado:e.target.checked}))} className="checkbox-input"/>
                      <span className="checkbox-text">¿Estaba asignado?</span>
                    </label>
                  </div>
                  {formMl.asignado && <input type="text" placeholder="Nombre del Cliente" value={formMl.nombreCliente} onChange={e=>setFormMl(f=>({...f,nombreCliente:e.target.value}))} className="form-input"/>}
                </div>
              )}

              {!isEquipoForm && (
                <div className="form-grid three-cols">
                  <div>
                    <label className="filter-label">Cantidad</label>
                    <input type="number" min="1" max="99" value={formMat.cantidad} onChange={e=>setFormMat(f=>({...f,cantidad:e.target.value}))} className="form-input"/>
                  </div>
                  <div>
                    <label className="filter-label">Fecha</label>
                    <input type="date" value={formMat.fecha} onChange={e=>setFormMat(f=>({...f,fecha:e.target.value}))} className="form-input"/>
                  </div>
                  {parseInt(formMat.cantidad)===1 && (
                    <div>
                      <label className="filter-label">Serial (opcional)</label>
                      <div style={{display:'flex',gap:'0.5rem'}}>
                        <input type="text" placeholder="N/A" value={formMat.serial} onChange={e=>setFormMat(f=>({...f,serial:e.target.value}))} className="form-input" style={{flex:1}}/>
                        <button type="button" onClick={()=>setShowScanner(true)} className="btn btn-primary" style={{padding:'0.5rem',minWidth:'auto'}}><Camera size={20}/></button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button onClick={handleSave} className="btn btn-success">
                  {editingId ? 'Actualizar' : `Guardar${!isEquipoForm&&parseInt(formMat.cantidad)>1?` (${formMat.cantidad})`:''}`}
                </button>
                <button onClick={()=>{setShowForm(false);setEditingId(null);}} className="btn btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {!selectedType && !showForm && (
            <p style={{textAlign:'center',fontFamily:'Quantico',fontSize:'0.6em',textTransform:'uppercase',color:'#9ca3af',padding:'24px 0'}}>
              Toca una tarjeta para ver el detalle
            </p>
          )}

          {/* Tabla GPS Nuevos */}
          {selectedType==='nuevos' && (
            <div className="table-container"><table className="data-table">
              <thead className="green"><tr>
                <th style={{width:36,textAlign:'center'}}><ChkAll/></th>
                <th>ID</th><th>Fecha</th><th>IMEI</th><th>Cliente</th><th className="center">Acc.</th>
              </tr></thead>
              <tbody>
                {filtN.length===0
                  ? <tr><td colSpan="6" className="empty-state">Sin equipos nuevos para {emp}</td></tr>
                  : filtN.map(e=><tr key={e.id} style={{background:selectedRows.has(e.id)?'rgba(99,102,241,0.08)':''}}>
                      <td style={{textAlign:'center'}}><ChkRow id={e.id}/></td>
                      <td>{e.id}</td><td>{e.fechaRecepcion}</td><td className="text-mono">{e.imei}</td><td>{e.nombreCliente||'-'}</td>
                      <td className="center"><div className="table-actions">
                        <button onClick={()=>handleEdit(e,'nuevos')} className="action-btn edit"><Edit2 size={18}/></button>
                        <button onClick={()=>setDeleteId(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                      </div></td>
                    </tr>)}
              </tbody>
            </table></div>
          )}

          {/* Tabla GPS Retirados */}
          {selectedType==='retirados' && (
            <div className="table-container"><table className="data-table">
              <thead className="blue"><tr>
                <th style={{width:36,textAlign:'center'}}><ChkAll/></th>
                <th>ID</th><th>Fecha</th><th>Cliente</th><th>IMEI</th><th className="center">Acc.</th>
              </tr></thead>
              <tbody>
                {filtR.length===0
                  ? <tr><td colSpan="6" className="empty-state">Sin equipos retirados para {emp}</td></tr>
                  : filtR.map(e=><tr key={e.id} style={{background:selectedRows.has(e.id)?'rgba(99,102,241,0.08)':''}}>
                      <td style={{textAlign:'center'}}><ChkRow id={e.id}/></td>
                      <td>{e.id}</td><td>{e.fecha}</td><td>{e.cliente}</td><td className="text-mono">{e.imei}</td>
                      <td className="center"><div className="table-actions">
                        <button onClick={()=>handleEdit(e,'retirados')} className="action-btn edit"><Edit2 size={18}/></button>
                        <button onClick={()=>setDeleteId(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                      </div></td>
                    </tr>)}
              </tbody>
            </table></div>
          )}

          {/* Tabla GPS Malos */}
          {selectedType==='malos' && (
            <div className="table-container"><table className="data-table">
              <thead className="red"><tr>
                <th style={{width:36,textAlign:'center'}}><ChkAll/></th>
                <th>ID</th><th>IMEI</th><th>Cliente</th><th className="center">Acc.</th>
              </tr></thead>
              <tbody>
                {filtMl.length===0
                  ? <tr><td colSpan="5" className="empty-state">Sin equipos malos para {emp}</td></tr>
                  : filtMl.map(e=><tr key={e.id} style={{background:selectedRows.has(e.id)?'rgba(99,102,241,0.08)':''}}>
                      <td style={{textAlign:'center'}}><ChkRow id={e.id}/></td>
                      <td>{e.id}</td><td className="text-mono">{e.imei}</td><td>{e.nombreCliente||'-'}</td>
                      <td className="center"><div className="table-actions">
                        <button onClick={()=>handleEdit(e,'malos')} className="action-btn edit"><Edit2 size={18}/></button>
                        <button onClick={()=>setDeleteId(e.id)} className="action-btn delete"><Trash2 size={18}/></button>
                      </div></td>
                    </tr>)}
              </tbody>
            </table></div>
          )}

          {/* Tabla Materiales */}
          {selectedType && CARDS.find(c=>c.key===selectedType)?.cat==='material' && (
            <div className="table-container"><table className="data-table">
              <thead className="green"><tr>
                <th style={{width:36,textAlign:'center'}}><ChkAll/></th>
                <th>Tipo</th><th>Serial</th><th>Fecha</th><th className="center">Acc.</th>
              </tr></thead>
              <tbody>
                {filtMat.filter(m=>m.tipo===selectedType).length===0
                  ? <tr><td colSpan="5" className="empty-state">Sin {selectedType} para {emp}</td></tr>
                  : filtMat.filter(m=>m.tipo===selectedType).map(m=><tr key={m.id} style={{background:selectedRows.has(m.id)?'rgba(99,102,241,0.08)':''}}>
                      <td style={{textAlign:'center'}}><ChkRow id={m.id}/></td>
                      <td>{m.tipo}</td><td className="text-mono">{m.serial||'-'}</td><td>{m.fecha}</td>
                      <td className="center"><div className="table-actions">
                        <button onClick={()=>setDeleteId(m.id)} className="action-btn delete"><Trash2 size={18}/></button>
                      </div></td>
                    </tr>)}
              </tbody>
            </table></div>
          )}

        </div>
      </div>

      {showScanner && <BarcodeScanner onScanSuccess={handleScan} onClose={()=>setShowScanner(false)}/>}

      {/* Modal: eliminar uno */}
      {deleteId && (
        <div className="modal-overlay"><div className="modal-container">
          <div className="modal-header">
            <div className="modal-icon-wrapper warning"><AlertTriangle size={32}/></div>
            <button onClick={()=>setDeleteId(null)} className="modal-close-btn"><X size={24}/></button>
          </div>
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Eliminación</h3>
            <p className="modal-message">¿Eliminar este elemento de forma permanente?</p>
          </div>
          <div className="modal-actions">
            <button onClick={handleDelete} className="btn btn-danger modal-btn">Eliminar</button>
            <button onClick={()=>setDeleteId(null)} className="btn btn-secondary modal-btn">Cancelar</button>
          </div>
        </div></div>
      )}

      {/* Modal: eliminar seleccionados */}
      {showBulkConfirm && (
        <div className="modal-overlay"><div className="modal-container">
          <div className="modal-header">
            <div className="modal-icon-wrapper warning"><AlertTriangle size={32}/></div>
            <button onClick={()=>setShowBulkConfirm(false)} className="modal-close-btn"><X size={24}/></button>
          </div>
          <div className="modal-content">
            <h3 className="modal-title">Eliminar {selectedRows.size} elementos</h3>
            <p className="modal-message">
              Se eliminarán {selectedRows.size} {selCard?.label} de forma permanente. ¿Continuar?
            </p>
          </div>
          <div className="modal-actions">
            <button onClick={handleBulkDelete} className="btn btn-danger modal-btn">
              Eliminar {selectedRows.size}
            </button>
            <button onClick={()=>setShowBulkConfirm(false)} className="btn btn-secondary modal-btn">Cancelar</button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default Materiales;
