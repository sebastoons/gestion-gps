import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Download, Search, ChevronLeft, X, Trash2, Mail, Check } from 'lucide-react';
import '../styles/OrdenesTrabajo.css';

const ACCESORIOS = [
  { key: 'inmovilizacion', label: 'Inmovilización' },
  { key: 'apDePuerta', label: 'AP de Puerta' },
  { key: 'sos', label: 'SOS' },
  { key: 'can100Edata', label: 'CAN100 EDATA' },
  { key: 'dallas', label: 'Dallas' },
  { key: 'temperatura', label: 'Temperatura' },
  { key: 'magnetico', label: 'Magnético' },
];

const SERVICIOS = ['Instalación', 'Mantenimiento', 'Desinstalación', 'Homologación'];

const INVENTARIO = [
  'Luces Altas','Luces Bajas','Luces de Reversa','Reversa','Direccionales',
  'Plumillas','Aire Acondicionado','Pito','Radio','Pantalla de Video',
  'Cámara de Reversa','Testigos del Tablero','Espejos Retrovisores',
  'Est. Tapicería Interior','Estado de la Batería','Master','Llanta de Repuesto'
];

const makeOT = () => ({
  fecha: new Date().toISOString().split('T')[0],
  tipoServicio: 'Instalación',
  ciudad: '', tecnico: '', linea: '', canal: '', tecnologia: '',
  placa: '', marca: '', modelo: '', color: '', vin: '', kilometraje: '',
  imei: '', imeiAnterior: '',
  accesorios: { inmovilizacion:false, apDePuerta:false, sos:false, can100Edata:false, dallas:false, temperatura:false, magnetico:false, otro:'' },
  inventario: Object.fromEntries(INVENTARIO.map(k => [k, 'NA'])),
  combustible: 4,
  estadoPruebas: 'OK',
  in1:'', in2:'', in3:'', in4:'', out1:'', out2:'', out3:'', out4:'',
  ubicacionEquipo: '',
  materiales: '', voltajeEncendido: '', voltajeApagado: '',
  trabajoRealizado: '', observaciones: '',
  nombreResponsable: '', cargoResponsable: '', ccResponsable: '', empresaInstaladora: '',
});

// ── Logos por empresa ─────────────────────────────────────────────────────────
const EmpresaLogos = ({ empresa }) => {
  if (empresa === 'UGPS') return (
    <div className="ot-logos-wrap">
      <img src="/logos/ugps.svg" alt="UGPS" className="ot-logo-img" />
    </div>
  );
  // Entel → muestra Onway + Entel
  return (
    <div className="ot-logos-wrap">
      <img src="/logos/onway.svg" alt="Onway" className="ot-logo-img" />
      <img src="/logos/entel.svg" alt="Entel" className="ot-logo-img" />
    </div>
  );
};


const OTDoc = ({ ot, numero, empresa, cliente, firma }) => {
  const num = String(numero || 0).padStart(6, '0');
  return (
    <div className="ot-doc">
      <div className="ot-doc-header">
        <EmpresaLogos empresa={empresa} />
        <div className="ot-doc-title">ORDEN DE SERVICIO TÉCNICO</div>
        <div className="ot-doc-num">N° {num}</div>
      </div>

      {/* Datos de servicio */}
      <div className="ot-section">
        <div className="ot-section-title">DATOS DE SERVICIO</div>
        <div className="ot-grid-3">
          {[['FECHA', ot.fecha],['CIUDAD', ot.ciudad],['TÉCNICO', ot.tecnico],
            ['PLACA', ot.placa],['MARCA', ot.marca],['MODELO', ot.modelo],
            ['COLOR', ot.color],['KM', ot.kilometraje],['VIN', ot.vin],
            ['IMEI NUEVO', ot.imei],['IMEI ANTERIOR', ot.imeiAnterior],['TECNOLOGÍA', ot.tecnologia]].map(([l,v]) => (
            <div key={l} className="ot-field"><span className="ot-fl">{l}</span><span className="ot-fv">{v}</span></div>
          ))}
          <div className="ot-field ot-span2"><span className="ot-fl">CLIENTE / EMPRESA</span><span className="ot-fv">{cliente}</span></div>
          <div className="ot-field"><span className="ot-fl">EMPRESA INSTALADORA</span><span className="ot-fv">{ot.empresaInstaladora}</span></div>
        </div>
      </div>

      {/* Tipo de servicio */}
      <div className="ot-section">
        <div className="ot-section-title">TIPO DE SERVICIO</div>
        <div className="ot-row-wrap">
          {SERVICIOS.map(s => (
            <span key={s} className="ot-check-item">
              <span className={`ot-circle${ot.tipoServicio === s ? ' filled' : ''}`}></span>
              {s.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Accesorios */}
      <div className="ot-section">
        <div className="ot-section-title">ACCESORIOS INSTALADOS</div>
        <div className="ot-row-wrap">
          {ACCESORIOS.map(a => (
            <span key={a.key} className="ot-check-item">
              <span className={`ot-circle${ot.accesorios[a.key] ? ' filled' : ''}`}></span>
              {a.label.toUpperCase()}
            </span>
          ))}
          {ot.accesorios.otro && <span className="ot-check-item">OTRO: {ot.accesorios.otro}</span>}
        </div>
      </div>

      {/* Inventario + combustible en 2 columnas */}
      <div className="ot-row-2col">
        <div className="ot-section" style={{flex:2}}>
          <div className="ot-section-title">INVENTARIO INICIAL</div>
          <table className="ot-inv-table">
            <thead><tr><th>ÍTEM</th><th>B</th><th>M</th><th>N/A</th></tr></thead>
            <tbody>
              {INVENTARIO.map(item => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>{ot.inventario[item] === 'B' ? '✓' : ''}</td>
                  <td>{ot.inventario[item] === 'M' ? '✓' : ''}</td>
                  <td>{ot.inventario[item] === 'NA' ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:'6px'}}>
          <div className="ot-section">
            <div className="ot-section-title">COMBUSTIBLE</div>
            <div className="ot-fuel-bar">
              <span className="ot-fuel-label">E</span>
              {Array.from({length:8},(_,i) => (
                <div key={i} className={`ot-fuel-seg${i < ot.combustible ? ' filled' : ''}`}></div>
              ))}
              <span className="ot-fuel-label">F</span>
            </div>
          </div>
          <div className="ot-section">
            <div className="ot-section-title">PRUEBAS</div>
            <div className="ot-row-wrap">
              {['OK','NO OK'].map(s => (
                <span key={s} className="ot-check-item">
                  <span className={`ot-circle${ot.estadoPruebas === s ? ' filled' : ''}`}></span>{s}
                </span>
              ))}
            </div>
          </div>
          <div className="ot-section">
            <div className="ot-section-title">ENTRADAS / SALIDAS</div>
            <div className="ot-grid-2">
              {[1,2,3,4].map(n => (
                <React.Fragment key={n}>
                  <div className="ot-field"><span className="ot-fl">IN {n}</span><span className="ot-fv">{ot[`in${n}`]}</span></div>
                  <div className="ot-field"><span className="ot-fl">OUT {n}</span><span className="ot-fv">{ot[`out${n}`]}</span></div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="ot-section">
            <div className="ot-section-title">VOLTAJES</div>
            <div className="ot-grid-2">
              <div className="ot-field"><span className="ot-fl">ENCENDIDO</span><span className="ot-fv">{ot.voltajeEncendido}</span></div>
              <div className="ot-field"><span className="ot-fl">APAGADO</span><span className="ot-fv">{ot.voltajeApagado}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trabajo */}
      <div className="ot-section">
        <div className="ot-section-title">TRABAJO REALIZADO</div>
        <div className="ot-grid-3">
          <div className="ot-field ot-span3"><span className="ot-fl">MATERIALES UTILIZADOS</span><span className="ot-fv">{ot.materiales}</span></div>
          <div className="ot-field ot-span3"><span className="ot-fl">TRABAJO REALIZADO</span><span className="ot-fv">{ot.trabajoRealizado}</span></div>
          <div className="ot-field ot-span3"><span className="ot-fl">OBSERVACIONES</span><span className="ot-fv">{ot.observaciones}</span></div>
        </div>
      </div>

      {/* Responsable + Firma */}
      <div className="ot-row-2col">
        <div className="ot-section">
          <div className="ot-section-title">RESPONSABLE TÉCNICO</div>
          <div className="ot-grid-2">
            <div className="ot-field ot-span2"><span className="ot-fl">NOMBRE</span><span className="ot-fv">{ot.nombreResponsable}</span></div>
            <div className="ot-field"><span className="ot-fl">CC / RUT</span><span className="ot-fv">{ot.ccResponsable}</span></div>
            <div className="ot-field"><span className="ot-fl">CARGO</span><span className="ot-fv">{ot.cargoResponsable}</span></div>
          </div>
        </div>
        <div className="ot-section">
          <div className="ot-section-title">FIRMA CLIENTE: {cliente}</div>
          <div className="ot-firma-box">
            {firma ? <img src={firma} alt="Firma" className="ot-firma-img" /> : <span className="ot-firma-empty">_________________</span>}
          </div>
        </div>
      </div>

      <div className="ot-disclaimer">
        Con la firma del presente documento manifiesto que la intervención del vehículo fue autorizada y que las actividades realizadas fueron recibidas a satisfacción.
      </div>
    </div>
  );
};

// ── Función de descarga PDF ───────────────────────────────────────────────────
const downloadPDF = async (elementId, filename) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: '#fff', useCORS: true, logging: false });
    const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const m = 8;
    const iw = pw - m * 2;
    const ih = (canvas.height * iw) / canvas.width;
    const imgData = canvas.toDataURL('image/png', 1.0);
    if (ih <= ph - m * 2) {
      pdf.addImage(imgData, 'PNG', m, m, iw, ih);
    } else {
      const pch = ph - m * 2;
      const pages = Math.ceil(ih / pch);
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        const sy = (i * pch * canvas.width) / iw;
        const sh = Math.min((pch * canvas.width) / iw, canvas.height - sy);
        const pc = document.createElement('canvas');
        pc.width = canvas.width; pc.height = sh;
        pc.getContext('2d').drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
        pdf.addImage(pc.toDataURL('image/png'), 'PNG', m, m, iw, (sh * iw) / canvas.width);
      }
    }
    pdf.save(`${filename}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error al generar PDF.');
  }
};

// ── Componente principal ──────────────────────────────────────────────────────
const OrdenesTrabajo = ({ setCurrentView, empresas, empresaSeleccionada }) => {
  const [step, setStep] = useState('list');
  const [otsList, setOtsList] = useState([]);
  const [sessionOTs, setSessionOTs] = useState([]);
  const [currentOT, setCurrentOT] = useState(makeOT());
  const [sessionEmpresa, setSessionEmpresa] = useState(empresaSeleccionada || 'Location World');
  const [clienteData, setClienteData] = useState({ nombre: '', correo: '', rut: '' });
  const [firma, setFirma] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [otCounter, setOtCounter] = useState(1);
  const [historyOT, setHistoryOT] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Cargar datos
  useEffect(() => {
    const stored = localStorage.getItem('ordenesTrabajo');
    if (stored) {
      const data = JSON.parse(stored);
      setOtsList(data);
      if (data.length > 0) {
        setOtCounter(Math.max(...data.map(o => o.numero || 0)) + 1);
      }
    }
    const cnt = localStorage.getItem('otCounter');
    if (cnt) setOtCounter(parseInt(cnt));
  }, []);

  const saveOTs = (list) => {
    setOtsList(list);
    localStorage.setItem('ordenesTrabajo', JSON.stringify(list));
  };

  // Filtros - últimos 3 meses
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filteredOTs = otsList.filter(ot => {
    const d = new Date(ot.createdAt || ot.fecha);
    if (d < threeMonthsAgo) return false;
    if (filterMes && !ot.fecha?.startsWith(filterMes)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (ot.placa||'').toLowerCase().includes(q) ||
        (ot.cliente||'').toLowerCase().includes(q) ||
        String(ot.numero).includes(q);
    }
    return true;
  });

  const getMeses = () => {
    const now = new Date();
    return Array.from({length:3},(_,i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    });
  };

  // Firma canvas
  useEffect(() => {
    if (step !== 'cliente') return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  }, [step]);

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };
  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const p = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const c = canvasRef.current;
    const p = getPos(e, c);
    c.getContext('2d').lineTo(p.x, p.y);
    c.getContext('2d').stroke();
  };
  const endDraw = () => {
    isDrawing.current = false;
    if (canvasRef.current) setFirma(canvasRef.current.toDataURL());
  };
  const clearFirma = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setFirma(null);
  };

  // Flujo de creación
  const startSession = () => {
    setSessionOTs([]);
    setCurrentOT({ ...makeOT(), empresaInstaladora: sessionEmpresa });
    setClienteData({ nombre: '', correo: '', rut: '' });
    setFirma(null);
    setStep('form');
  };

  const saveCurrentOT = () => {
    if (!currentOT.placa && !currentOT.imei) {
      alert('Ingresa la Placa o el IMEI del vehículo.');
      return;
    }
    setSessionOTs(prev => [...prev, { ...currentOT, _tmp: Date.now() }]);
    setStep('confirm');
  };

  const addAnotherOT = () => {
    setCurrentOT({
      ...makeOT(),
      fecha: currentOT.fecha,
      tipoServicio: currentOT.tipoServicio,
      ciudad: currentOT.ciudad,
      tecnico: currentOT.tecnico,
      empresaInstaladora: currentOT.empresaInstaladora,
      nombreResponsable: currentOT.nombreResponsable,
      cargoResponsable: currentOT.cargoResponsable,
      ccResponsable: currentOT.ccResponsable,
    });
    setStep('form');
  };

  const finalizeSession = async () => {
    const sessionId = Date.now().toString();
    let counter = otCounter;
    const newOTs = sessionOTs.map((ot, i) => ({
      ...ot,
      id: `${sessionId}-${i}`,
      numero: counter + i,
      sessionId,
      empresa: sessionEmpresa,
      cliente: clienteData.nombre,
      correoCliente: clienteData.correo,
      rutCliente: clienteData.rut,
      firma,
      createdAt: new Date().toISOString(),
      emailEnviado: false,
    }));
    const updated = [...otsList, ...newOTs];
    saveOTs(updated);
    const newCounter = counter + sessionOTs.length;
    setOtCounter(newCounter);
    localStorage.setItem('otCounter', String(newCounter));
    setSessionOTs(newOTs);
    setStep('preview');
    setTimeout(() => {
      downloadPDF('ot-preview-wrap', `OT-${sessionEmpresa}-${new Date().toISOString().split('T')[0]}`);
    }, 800);
  };

  // Descarga desde historial
  const downloadHistoryOT = async (ot) => {
    setHistoryOT(ot);
    setDownloading(true);
    await new Promise(r => setTimeout(r, 600));
    await downloadPDF('ot-history-render', `OT-${String(ot.numero).padStart(6,'0')}`);
    setDownloading(false);
    setHistoryOT(null);
  };

  const deleteOT = (id) => {
    if (!window.confirm('¿Eliminar esta OT?')) return;
    saveOTs(otsList.filter(o => o.id !== id));
  };

  const setOTField = (field, val) => setCurrentOT(prev => ({ ...prev, [field]: val }));
  const setAccesorio = (key, val) => setCurrentOT(prev => ({ ...prev, accesorios: { ...prev.accesorios, [key]: val } }));
  const setInventario = (item, val) => setCurrentOT(prev => ({ ...prev, inventario: { ...prev.inventario, [item]: val } }));

  // ── VISTA: Lista / Historial ─────────────────────────────────────────────
  if (step === 'list') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn btn-secondary" onClick={() => setCurrentView('home')}>
                <ChevronLeft size={14}/> Inicio
              </button>
              <img src="/logo.svg" alt="Logo" className="page-logo" />
            </div>
            <h1 className="page-title">Órdenes de Trabajo</h1>
            <button className="btn btn-success" onClick={startSession}>
              <Plus size={14}/> Nueva OT
            </button>
          </div>

          {/* Filtros */}
          <div className="ot-filter-bar">
            <div style={{position:'relative',flex:1}}>
              <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
              <input className="search-input" style={{paddingLeft:28}} placeholder="Buscar placa, cliente, N°..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="form-select" style={{maxWidth:160}} value={filterMes} onChange={e=>setFilterMes(e.target.value)}>
              <option value="">Todos (3 meses)</option>
              {getMeses().map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="form-select" style={{maxWidth:160}} value={sessionEmpresa} onChange={e=>setSessionEmpresa(e.target.value)}>
              {empresas.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>

          {/* Tabla */}
          <div className="table-container">
            <table className="data-table">
              <thead className="blue">
                <tr>
                  <th>N° OT</th><th>EMPRESA</th><th>FECHA</th><th>CLIENTE</th>
                  <th>PLACA</th><th>SERVICIO</th><th>IMEI</th><th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredOTs.length === 0 && (
                  <tr><td colSpan={8} className="empty-state">Sin órdenes en el período seleccionado</td></tr>
                )}
                {filteredOTs.map(ot => (
                  <tr key={ot.id}>
                    <td style={{fontWeight:700}}>{String(ot.numero||0).padStart(6,'0')}</td>
                    <td>{ot.empresa}</td>
                    <td>{ot.fecha}</td>
                    <td>{ot.cliente}</td>
                    <td>{ot.placa}</td>
                    <td>{ot.tipoServicio}</td>
                    <td>{ot.imei}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-primary" style={{fontSize:'0.6em',padding:'3px 7px'}}
                          onClick={() => downloadHistoryOT(ot)} disabled={downloading}>
                          <Download size={11}/> PDF
                        </button>
                        <button className="action-btn delete" onClick={() => deleteOT(ot.id)} title="Eliminar">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{fontSize:'0.6em',color:'#9ca3af',marginTop:8,fontFamily:'quantico',textAlign:'center'}}>
            Mostrando OTs de los últimos 3 meses
          </p>
        </div>
      </div>

      {/* Render oculto para descarga histórica */}
      {historyOT && (
        <div style={{position:'absolute',left:'-9999px',top:0,width:'794px',background:'#fff'}}>
          <div id="ot-history-render">
            <OTDoc ot={historyOT} numero={historyOT.numero} empresa={historyOT.empresa}
              cliente={historyOT.cliente} firma={historyOT.firma}/>
          </div>
        </div>
      )}
    </div>
  );

  // ── VISTA: Formulario OT ────────────────────────────────────────────────
  if (step === 'form') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={() => setStep('list')}><ChevronLeft size={14}/> Cancelar</button>
            <h1 className="page-title">
              Nueva OT — {sessionEmpresa} {sessionOTs.length > 0 && `(OT ${sessionOTs.length + 1})`}
            </h1>
          </div>

          {/* Empresa */}
          <div className="form-container blue" style={{marginBottom:10}}>
            <div className="form-grid">
              <div>
                <label className="filter-label">Empresa</label>
                <select className="form-select" value={sessionEmpresa} onChange={e=>setSessionEmpresa(e.target.value)}>
                  {empresas.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="filter-label">Tipo de Servicio</label>
                <select className="form-select" value={currentOT.tipoServicio} onChange={e=>setOTField('tipoServicio',e.target.value)}>
                  {SERVICIOS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Datos del servicio */}
          <div className="form-container blue">
            <div className="form-title">Datos del Servicio</div>
            <div className="form-grid three-cols">
              {[['fecha','Fecha','date'],['ciudad','Ciudad','text'],['tecnico','Técnico','text'],
                ['linea','Línea','text'],['canal','Canal','text'],['tecnologia','Tecnología','text'],
                ['empresaInstaladora','Empresa Instaladora','text']].map(([f,l,t]) => (
                <div key={f}>
                  <label className="filter-label">{l}</label>
                  <input className="form-input" type={t} value={currentOT[f]} onChange={e=>setOTField(f,e.target.value)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Vehículo */}
          <div className="form-container">
            <div className="form-title">Datos del Vehículo</div>
            <div className="form-grid three-cols">
              {[['placa','Placa *'],['marca','Marca'],['modelo','Modelo'],
                ['color','Color'],['vin','VIN'],['kilometraje','Kilometraje']].map(([f,l]) => (
                <div key={f}>
                  <label className="filter-label">{l}</label>
                  <input className="form-input" value={currentOT[f]} onChange={e=>setOTField(f,e.target.value)}/>
                </div>
              ))}
            </div>
          </div>

          {/* GPS */}
          <div className="form-container purple">
            <div className="form-title">Datos GPS</div>
            <div className="form-grid three-cols">
              {[['imei','IMEI Nuevo *'],['imeiAnterior','IMEI Anterior'],['ubicacionEquipo','Ubicación Equipo']].map(([f,l]) => (
                <div key={f}>
                  <label className="filter-label">{l}</label>
                  <input className="form-input" value={currentOT[f]} onChange={e=>setOTField(f,e.target.value)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Accesorios */}
          <div className="form-container">
            <div className="form-title">Accesorios Instalados</div>
            <div className="ot-acc-grid">
              {ACCESORIOS.map(a => (
                <label key={a.key} className="ot-acc-label">
                  <input type="checkbox" checked={currentOT.accesorios[a.key]}
                    onChange={e=>setAccesorio(a.key, e.target.checked)}/>
                  {a.label}
                </label>
              ))}
              <div style={{gridColumn:'span 2'}}>
                <label className="filter-label">Otro accesorio</label>
                <input className="form-input" value={currentOT.accesorios.otro}
                  onChange={e=>setAccesorio('otro',e.target.value)} placeholder="Especificar..."/>
              </div>
            </div>
          </div>

          {/* Inventario */}
          <div className="form-container">
            <div className="form-title">Inventario Inicial</div>
            <div className="ot-inv-grid">
              {INVENTARIO.map(item => (
                <div key={item} className="ot-inv-row">
                  <span className="ot-inv-label">{item}</span>
                  <div className="ot-inv-btns">
                    {['B','M','NA'].map(v => (
                      <button key={v} type="button"
                        className={`ot-inv-btn${currentOT.inventario[item]===v?' active':''}`}
                        onClick={()=>setInventario(item,v)}>{v}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Condiciones */}
          <div className="form-container blue">
            <div className="form-title">Condiciones del Vehículo</div>
            <div className="form-grid">
              <div>
                <label className="filter-label">Combustible (0-8 segmentos)</label>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <span style={{fontSize:'0.7em',fontFamily:'quantico'}}>E</span>
                  <input type="range" min={0} max={8} value={currentOT.combustible}
                    onChange={e=>setOTField('combustible',parseInt(e.target.value))} style={{flex:1}}/>
                  <span style={{fontSize:'0.7em',fontFamily:'quantico'}}>F ({currentOT.combustible}/8)</span>
                </div>
              </div>
              <div>
                <label className="filter-label">Estado de Pruebas</label>
                <div style={{display:'flex',gap:12,marginTop:8}}>
                  {['OK','NO OK'].map(v => (
                    <label key={v} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'quantico',fontSize:'0.7em'}}>
                      <input type="radio" checked={currentOT.estadoPruebas===v}
                        onChange={()=>setOTField('estadoPruebas',v)}/> {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Entradas / Salidas */}
          <div className="form-container">
            <div className="form-title">Entradas y Salidas</div>
            <div className="form-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
              {[1,2,3,4].map(n => (
                <React.Fragment key={n}>
                  <div>
                    <label className="filter-label">IN {n}</label>
                    <input className="form-input" value={currentOT[`in${n}`]} onChange={e=>setOTField(`in${n}`,e.target.value)}/>
                  </div>
                  <div>
                    <label className="filter-label">OUT {n}</label>
                    <input className="form-input" value={currentOT[`out${n}`]} onChange={e=>setOTField(`out${n}`,e.target.value)}/>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Trabajo */}
          <div className="form-container purple">
            <div className="form-title">Detalles del Trabajo</div>
            <div className="form-grid">
              {[['voltajeEncendido','Voltaje Encendido (V)'],['voltajeApagado','Voltaje Apagado (V)']].map(([f,l]) => (
                <div key={f}>
                  <label className="filter-label">{l}</label>
                  <input className="form-input" value={currentOT[f]} onChange={e=>setOTField(f,e.target.value)}/>
                </div>
              ))}
              {[['materiales','Materiales Utilizados'],['trabajoRealizado','Trabajo Realizado'],['observaciones','Observaciones']].map(([f,l]) => (
                <div key={f} style={{gridColumn:'span 2'}}>
                  <label className="filter-label">{l}</label>
                  <textarea className="form-input" rows={2} value={currentOT[f]}
                    onChange={e=>setOTField(f,e.target.value)} style={{resize:'vertical'}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Responsable */}
          <div className="form-container">
            <div className="form-title">Responsable Técnico</div>
            <div className="form-grid three-cols">
              {[['nombreResponsable','Nombre Responsable'],['ccResponsable','CC / RUT'],['cargoResponsable','Cargo']].map(([f,l]) => (
                <div key={f}>
                  <label className="filter-label">{l}</label>
                  <input className="form-input" value={currentOT[f]} onChange={e=>setOTField(f,e.target.value)}/>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-success" style={{fontSize:'0.85em',padding:'8px 20px'}} onClick={saveCurrentOT}>
              <Check size={15}/> Guardar OT
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── VISTA: Confirmar otra OT ────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="ot-confirm-card">
        <FileText size={40} color="#507cdd"/>
        <h2 className="ot-confirm-title">OT guardada</h2>
        <p className="ot-confirm-sub">
          {sessionOTs.length} OT{sessionOTs.length!==1?'s':''} en esta sesión.<br/>
          ¿Necesitas crear otra OT para este servicio?<br/>
          <small>(Se copiarán los datos del técnico, no los del vehículo/GPS)</small>
        </p>
        <div className="ot-confirm-actions">
          <button className="btn btn-primary" style={{fontSize:'0.85em',padding:'10px 20px'}} onClick={addAnotherOT}>
            <Plus size={15}/> Agregar otra OT
          </button>
          <button className="btn btn-success" style={{fontSize:'0.85em',padding:'10px 20px'}} onClick={()=>setStep('cliente')}>
            <Check size={15}/> Continuar con datos del cliente
          </button>
        </div>
      </div>
    </div>
  );

  // ── VISTA: Datos del cliente + firma ────────────────────────────────────
  if (step === 'cliente') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={()=>setStep('confirm')}><ChevronLeft size={14}/> Atrás</button>
            <h1 className="page-title">Datos del Cliente y Firma</h1>
          </div>
          <p style={{fontFamily:'quantico',fontSize:'0.7em',textAlign:'center',marginBottom:16,color:'#6b7280'}}>
            {sessionOTs.length} OT{sessionOTs.length!==1?'s':''} creada{sessionOTs.length!==1?'s':''} — {sessionEmpresa}
          </p>

          <div className="form-container blue">
            <div className="form-title">Información del Cliente</div>
            <div className="form-grid three-cols">
              <div>
                <label className="filter-label">Nombre / Empresa *</label>
                <input className="form-input" value={clienteData.nombre}
                  onChange={e=>setClienteData(p=>({...p,nombre:e.target.value}))} placeholder="Nombre del cliente"/>
              </div>
              <div>
                <label className="filter-label">RUT</label>
                <input className="form-input" value={clienteData.rut}
                  onChange={e=>setClienteData(p=>({...p,rut:e.target.value}))} placeholder="12.345.678-9"/>
              </div>
              <div>
                <label className="filter-label">Correo electrónico</label>
                <input className="form-input" type="email" value={clienteData.correo}
                  onChange={e=>setClienteData(p=>({...p,correo:e.target.value}))} placeholder="cliente@email.com"/>
              </div>
            </div>
          </div>

          <div className="form-container">
            <div className="form-title">Firma del Cliente</div>
            <p style={{fontFamily:'quantico',fontSize:'0.65em',textAlign:'center',marginBottom:8,color:'#6b7280'}}>
              Firme en el recuadro a continuación
            </p>
            <div style={{display:'flex',justifyContent:'center'}}>
              <div className="ot-canvas-wrapper">
                <canvas ref={canvasRef} width={400} height={150} className="ot-canvas"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
              <button className="btn btn-secondary" onClick={clearFirma}><X size={12}/> Limpiar firma</button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-success" style={{fontSize:'0.85em',padding:'10px 24px'}}
              onClick={finalizeSession} disabled={!clienteData.nombre}>
              <Check size={15}/> Finalizar y descargar OT{sessionOTs.length!==1?'s':''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── VISTA: Preview y descarga ────────────────────────────────────────────
  if (step === 'preview') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <h1 className="page-title">OT Generada — {sessionEmpresa}</h1>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:20,flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={()=>downloadPDF('ot-preview-wrap',`OT-${sessionEmpresa}-${new Date().toISOString().split('T')[0]}`)}>
              <Download size={14}/> Descargar PDF
            </button>
            <button className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:6}}>
              <Mail size={14}/> Enviar por correo <span style={{fontSize:'0.75em',background:'#f59e0b',color:'#fff',borderRadius:4,padding:'1px 5px'}}>Próximamente</span>
            </button>
            <button className="btn btn-success" onClick={()=>setStep('list')}>
              <Check size={14}/> Ir al historial
            </button>
          </div>
          <div id="ot-preview-wrap" style={{background:'#fff',padding:16}}>
            {sessionOTs.map((ot, i) => (
              <div key={i} style={{pageBreakAfter: i < sessionOTs.length - 1 ? 'always' : 'auto', marginBottom: i < sessionOTs.length - 1 ? 40 : 0}}>
                <OTDoc ot={ot} numero={ot.numero} empresa={sessionEmpresa}
                  cliente={clienteData.nombre} firma={firma}/>
                {i < sessionOTs.length - 1 && <hr style={{margin:'30px 0',border:'2px dashed #ccc'}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return null;
};

export default OrdenesTrabajo;
