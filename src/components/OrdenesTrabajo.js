import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Search, ChevronLeft, X, Trash2, Check, Home as HomeIcon, ChevronDown } from 'lucide-react';
import { supabase, loadTable, syncTable } from '../lib/supabase';
import '../styles/OrdenesTrabajo.css';

const REGIONES = [
  'Arica y Parinacota','Tarapacá','Antofagasta','Atacama','Coquimbo','Valparaíso',
  'Metropolitana de Santiago',"O'Higgins",'Maule','Ñuble','Biobío','Araucanía',
  'Los Ríos','Los Lagos','Aysén','Magallanes'
];
const CIUDADES = {
  'Arica y Parinacota':['Arica','Putre'],
  'Tarapacá':['Iquique','Alto Hospicio','Pozo Almonte'],
  'Antofagasta':['Antofagasta','Calama','Tocopilla','Mejillones'],
  'Atacama':['Copiapó','Vallenar','Caldera'],
  'Coquimbo':['La Serena','Coquimbo','Ovalle','Vicuña'],
  'Valparaíso':['Valparaíso','Viña del Mar','Quilpué','Villa Alemana','San Antonio','Quillota'],
  'Metropolitana de Santiago':['Santiago','Puente Alto','Maipú','La Florida','Las Condes','Providencia','Ñuñoa','San Bernardo','Pudahuel','Vitacura'],
  "O'Higgins":['Rancagua','San Fernando','Rengo','Machalí'],
  'Maule':['Talca','Curicó','Linares','Constitución'],
  'Ñuble':['Chillán','Bulnes','San Carlos'],
  'Biobío':['Concepción','Talcahuano','Los Ángeles','Chiguayante'],
  'Araucanía':['Temuco','Villarrica','Pucón','Angol'],
  'Los Ríos':['Valdivia','La Unión','Río Bueno'],
  'Los Lagos':['Puerto Montt','Osorno','Castro','Ancud'],
  'Aysén':['Coyhaique','Puerto Aysén'],
  'Magallanes':['Punta Arenas','Puerto Natales'],
};
const COMUNAS = {
  // Región Metropolitana — todas las 52 comunas bajo "Santiago"
  'Santiago':[
    'Alhué','Buin','Calera de Tango','Cerrillos','Cerro Navia','Colina','Conchalí',
    'Curacaví','El Bosque','El Monte','Estación Central','Huechuraba','Independencia',
    'Isla de Maipo','La Cisterna','La Florida','La Granja','La Pintana','La Reina',
    'Lampa','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú',
    'María Pinto','Melipilla','Ñuñoa','Padre Hurtado','Paine','Pedro Aguirre Cerda',
    'Peñaflor','Peñalolén','Pirque','Providencia','Pudahuel','Puente Alto','Quilicura',
    'Quinta Normal','Recoleta','Renca','San Bernardo','San José de Maipo','San Miguel',
    'San Pedro','Santiago Centro','Talagante','Tiltil','Vitacura'
  ],
  'Puente Alto':['Puente Alto'],'Maipú':['Maipú'],'La Florida':['La Florida'],
  'Las Condes':['Las Condes'],'Providencia':['Providencia'],'Ñuñoa':['Ñuñoa'],
  'San Bernardo':['San Bernardo'],'Pudahuel':['Pudahuel'],'Vitacura':['Vitacura'],
  'Valparaíso':['Valparaíso','Casablanca','Quintero','Puchuncaví'],
  'Viña del Mar':['Viña del Mar','Concón'],'Quilpué':['Quilpué'],'Villa Alemana':['Villa Alemana'],
  'San Antonio':['San Antonio','Cartagena','El Tabo','El Quisco','Algarrobo','Santo Domingo'],
  'Quillota':['Quillota','La Cruz','La Calera','Hijuelas','Nogales'],
  'Concepción':['Concepción','Chiguayante','Penco','Hualqui','Santa Juana','Florida'],
  'Talcahuano':['Talcahuano','Hualpén'],'Los Ángeles':['Los Ángeles','Mulchén','Nacimiento'],
  'Temuco':['Temuco','Padre Las Casas','Vilcún','Lautaro'],
  'Villarrica':['Villarrica'],'Pucón':['Pucón'],'Angol':['Angol'],
  'Antofagasta':['Antofagasta'],'Calama':['Calama','Ollagüe'],'Tocopilla':['Tocopilla'],
  'La Serena':['La Serena','Vicuña'],'Coquimbo':['Coquimbo'],'Ovalle':['Ovalle','Monte Patria'],
  'Iquique':['Iquique','Alto Hospicio'],'Alto Hospicio':['Alto Hospicio'],'Pozo Almonte':['Pozo Almonte'],
  'Arica':['Arica','Camarones','General Lagos','Putre'],
  'Rancagua':['Rancagua','Machalí','Graneros','Codegua'],
  'San Fernando':['San Fernando','Chimbarongo'],'Rengo':['Rengo','Olivar'],
  'Talca':['Talca','Maule','San Clemente','Pelarco'],
  'Curicó':['Curicó','Teno','Romeral'],'Linares':['Linares','Longaví'],
  'Chillán':['Chillán','Chillán Viejo','Bulnes','San Carlos'],
  'Valdivia':['Valdivia','Mariquina','Lanco'],'La Unión':['La Unión'],
  'Puerto Montt':['Puerto Montt','Puerto Varas','Calbuco','Maullín'],
  'Osorno':['Osorno','Puerto Octay','San Pablo'],
  'Castro':['Castro','Ancud','Quellón','Quemchi'],
  'Copiapó':['Copiapó','Caldera','Tierra Amarilla'],
  'Vallenar':['Vallenar','Alto del Carmen'],
  'Coyhaique':['Coyhaique'],'Puerto Aysén':['Puerto Aysén'],
  'Punta Arenas':['Punta Arenas','Natales','Puerto Natales'],
};

const MARCAS = [
  'Alfa Romeo','Audi','BAIC','BMW','BYD','Chery','Chevrolet','Citroën','Dodge',
  'Dongfeng','Fiat','Ford','Foton','Geely','Great Wall','Haval','Honda','Hyundai',
  'Isuzu','JAC','Jeep','Kia','Land Rover','Mazda','Mercedes-Benz','MG','Mitsubishi',
  'Nissan','Opel','Peugeot','Ram','Renault','Ssangyong','Subaru','Suzuki',
  'Toyota','Volkswagen','Volvo','Otros'
];
const COLORES = ['Blanco','Negro','Gris','Plata','Rojo','Azul','Verde','Amarillo','Naranja','Café/Marrón','Beige','Celeste','Morado','Otro'];
const AÑOS = Array.from({length:37},(_,i)=>String(2026-i));
const TECNICOS = ['Sebastian Parra'];
const EMPRESAS_INST = ['Sebastian Parra'];
const ACCESORIOS_GPS = ['Inmovilización','SOS','Dallas','Buzzer','Edata','Sensor T°','Sensor Puerta'];
const SERVICIOS = ['Instalación','Desinstalación','Mantención','Reinstalación','Visita Fallida'];
const CHECKLIST_ITEMS = ['Batería','Check Engine','Error tablero inst.','A/C','Radio','Intermitentes'];

const makeOT = () => ({
  fecha: new Date().toISOString().split('T')[0],
  tipoServicio:'Instalación', region:'', ciudad:'', comuna:'',
  tecnico:'Sebastian Parra', empresaInstaladora:'Sebastian Parra',
  ppu:'', marca:'', modelo:'', anio:'', color:'', kilometraje:'',
  imeiIn:'', imeiOut:'', accesoriosGPS:[],
  checklist: Object.fromEntries(CHECKLIST_ITEMS.map(k=>[k,{estado:'NA',nota:''}])),
  observaciones:'',
});

const formatRut = val => {
  const c = val.replace(/[^0-9kK]/g,'').toUpperCase();
  if (c.length<=1) return c;
  return `${c.slice(0,-1)}-${c.slice(-1)}`;
};

const showImeiIn  = s => ['Instalación','Mantención','Reinstalación'].includes(s);
const showImeiOut = s => ['Desinstalación','Mantención'].includes(s);

// ── AccesoriosDropdown ────────────────────────────────────────────────────────
const AccesoriosDropdown = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  const toggle = acc => onChange(selected.includes(acc)?selected.filter(a=>a!==acc):[...selected,acc]);
  return (
    <div ref={ref} style={{position:'relative'}}>
      <div className="acc-trigger" onClick={()=>setOpen(!open)}>
        <span>{selected.length===0?'Seleccionar accesorios...':selected.join(', ')}</span>
        <ChevronDown size={13} style={{flexShrink:0}}/>
      </div>
      {open && (
        <div className="acc-menu">
          {ACCESORIOS_GPS.map(acc=>(
            <label key={acc} className="acc-item">
              <input type="checkbox" checked={selected.includes(acc)} onChange={()=>toggle(acc)}/>{acc}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ChecklistRow (formulario) ─────────────────────────────────────────────────
const ChecklistRow = ({ item, estado, onChange }) => {
  const cycle = () => onChange(estado==='NA'?'OK':estado==='OK'?'DETALLE':'NA');
  const bg={NA:'#d1d5db',OK:'#16a34a',DETALLE:'#dc2626'}[estado];
  return (
    <div className="cl-item">
      <button type="button" className="cl-box" style={{background:bg}} onClick={cycle}>
        {estado==='OK'&&'✓'}{estado==='DETALLE'&&'!'}
      </button>
      <span className="cl-label">{item}</span>
    </div>
  );
};

// ── EmpresaLogos ──────────────────────────────────────────────────────────────
const EmpresaLogos = ({ empresa }) => empresa==='UGPS'
  ? <div className="ot-logos-wrap"><img src="/logos/ugps.png" alt="UGPS" className="ot-logo-img"/></div>
  : <div className="ot-logos-wrap"><img src="/logos/onway.png" alt="Onway" className="ot-logo-img"/><img src="/logos/entel.png" alt="Entel" className="ot-logo-img"/></div>;

// ── OTField ───────────────────────────────────────────────────────────────────
const OTField = ({ l, v, full }) => (
  <div className={`otd-field${full?' full':''}`}>
    <span className="otd-k">{l}</span>
    <span className="otd-v">{v||'—'}</span>
  </div>
);

// ── OTDoc ─────────────────────────────────────────────────────────────────────
const OTDoc = ({ ot, numero, empresa, cliente, rut, firma, aceptacion }) => {
  const esVF = ot.tipoServicio==='Visita Fallida';
  const cl = ot.checklist||{};
  const clBg = {NA:'#d1d5db',OK:'#16a34a',DETALLE:'#dc2626'};
  const inIn=showImeiIn(ot.tipoServicio), inOut=showImeiOut(ot.tipoServicio);
  return (
    <div className="otd">
      <div className="otd-hdr">
        <EmpresaLogos empresa={empresa}/>
        <div className="otd-hdr-mid">
          <span className="otd-title">ORDEN DE TRABAJO</span>
          <span className="otd-sub">{empresa}</span>
        </div>
        <div className="otd-num-wrap">
          <span className="otd-num-lbl">N°</span>
          <span className="otd-num">{numero}</span>
        </div>
      </div>

      {ot.ppu&&(
        <div className="otd-ppu-bar">
          <span className="otd-ppu-lbl">PPU</span>
          <span className="otd-ppu">{ot.ppu}</span>
        </div>
      )}

      <div className="otd-body">
        <div className="otd-sec">
          <div className="otd-sec-ttl">SERVICIO</div>
          <div className="otd-rows">
            <OTField l="TIPO" v={ot.tipoServicio}/>
            <OTField l="FECHA" v={ot.fecha}/>
            <OTField l="TÉCNICO" v={ot.tecnico}/>
            <OTField l="INSTALADORA" v={ot.empresaInstaladora}/>
          </div>
        </div>

        <div className="otd-sec">
          <div className="otd-sec-ttl">UBICACIÓN</div>
          <div className="otd-rows">
            <OTField l="REGIÓN" v={ot.region}/>
            <OTField l="CIUDAD" v={ot.ciudad}/>
            <OTField l="COMUNA" v={ot.comuna}/>
          </div>
        </div>

        {!esVF&&<>
          <div className="otd-sec">
            <div className="otd-sec-ttl">DATOS DEL VEHÍCULO</div>
            <div className="otd-rows">
              <OTField l="PPU" v={ot.ppu}/>
              <OTField l="MARCA" v={ot.marca}/>
              <OTField l="MODELO" v={ot.modelo}/>
              <OTField l="AÑO" v={ot.anio}/>
              <OTField l="COLOR" v={ot.color}/>
              <OTField l="KM" v={ot.kilometraje?`${ot.kilometraje} km`:''}/>
            </div>
          </div>

          <div className="otd-sec">
            <div className="otd-sec-ttl">GPS</div>
            <div className="otd-rows">
              {inIn&&<OTField l="IMEI IN" v={ot.imeiIn}/>}
              {inOut&&<OTField l="IMEI OUT" v={ot.imeiOut}/>}
              <OTField l="ACCESORIOS" v={ot.accesoriosGPS?.join(', ')||'—'} full/>
            </div>
          </div>

          <div className="otd-sec">
            <div className="otd-sec-ttl">CHECK LIST</div>
            <div className="otd-cl-grid">
              {CHECKLIST_ITEMS.map(item=>{
                const d=cl[item]||{estado:'NA'};
                return(
                  <div key={item} className="otd-cl-item">
                    <span className="otd-cl-box" style={{background:clBg[d.estado]||'#d1d5db'}}>
                      {d.estado==='OK'&&'✓'}{d.estado==='DETALLE'&&'!'}
                    </span>
                    <span className="otd-cl-lbl">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        <div className="otd-sec">
          <div className="otd-sec-ttl">OBSERVACIONES</div>
          <div className="otd-obs">{ot.observaciones||'—'}</div>
        </div>

        <div className="otd-sec">
          <div className="otd-sec-ttl">RECEPCIÓN</div>
          <div className="otd-rows">
            <OTField l="NOMBRE" v={cliente} full/>
            <OTField l="RUT" v={rut}/>
          </div>
          <div className="otd-acept">
            <span className="otd-cl-box" style={{background:aceptacion?'#16a34a':'#d1d5db',flexShrink:0,marginTop:1}}>
              {aceptacion&&'✓'}
            </span>
            <span className="otd-acept-txt">Declaro haber recibido el vehículo en las condiciones técnicas descritas, conforme a las actividades realizadas, sin observaciones ni reclamos.</span>
          </div>
          <div className="otd-firma-box">
            {firma?<img src={firma} alt="Firma" className="otd-firma-img"/>:<span className="otd-firma-empty">_______________</span>}
            <div className="otd-firma-lbl">Firma del cliente</div>
          </div>
        </div>
      </div>

      <div className="otd-footer">
        <span>{empresa} · {ot.fecha} · La firma acredita autorización y conformidad.</span>
        <img src="/logo.svg" alt="ServITrak" className="otd-footer-logo"/>
      </div>
    </div>
  );
};

// ── PDF ───────────────────────────────────────────────────────────────────────
const downloadPDF = async (elementId, filename) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const canvas = await window.html2canvas(el,{scale:2,backgroundColor:'#fff',useCORS:true,logging:false});
    const m=6, pageW=210;
    const contentW=pageW-m*2, contentH=(canvas.height*contentW)/canvas.width;
    const pdf = new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:[pageW, contentH+m*2]});
    pdf.addImage(canvas.toDataURL('image/png',1.0),'PNG',m,m,contentW,contentH);
    pdf.save(`${filename}.pdf`);
  } catch(e){ console.error(e); alert('Error al generar PDF.'); }
};

// ── Componente principal ──────────────────────────────────────────────────────
const OrdenesTrabajo = ({ setCurrentView, empresas, empresaSeleccionada }) => {
  const [step,setStep] = useState('list');
  const [otsList,setOtsList] = useState([]);
  const [sessionOTs,setSessionOTs] = useState([]);
  const [currentOT,setCurrentOT] = useState(makeOT());
  const [sessionEmpresa,setSessionEmpresa] = useState(empresaSeleccionada||'Entel');
  const [clienteData,setClienteData] = useState({nombre:'',rut:''});
  const [aceptacion,setAceptacion] = useState(false);
  const [firma,setFirma] = useState(null);
  const [search,setSearch] = useState('');
  const [filterMes,setFilterMes] = useState('');
  const [counters,setCounters] = useState({Entel:1,UGPS:1});
  const [historyOT,setHistoryOT] = useState(null);
  const [downloading,setDownloading] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(()=>{
    const load = async () => {
      const [ots, entel, ugps] = await Promise.all([
        loadTable('ordenes_trabajo'),
        supabase.from('ot_counters').select('counter').eq('empresa','Entel').single(),
        supabase.from('ot_counters').select('counter').eq('empresa','UGPS').single(),
      ]);
      setOtsList(ots);
      setCounters({
        Entel: entel.data?.counter || 1,
        UGPS: ugps.data?.counter || 1,
      });
    };
    load();
  },[]);

  const saveOTs = async (list) => {
    setOtsList(list);
    await syncTable('ordenes_trabajo', list);
  };

  // Canvas firma
  useEffect(()=>{
    if (step!=='cliente') return;
    const c=canvasRef.current; if (!c) return;
    const ctx=c.getContext('2d'); ctx.strokeStyle='#1f2937'; ctx.lineWidth=2; ctx.lineCap='round';
  },[step]);

  const getPos=(e,c)=>{const r=c.getBoundingClientRect(),s=e.touches?e.touches[0]:e;return{x:s.clientX-r.left,y:s.clientY-r.top};};
  const startDraw=e=>{e.preventDefault();isDrawing.current=true;const c=canvasRef.current,p=getPos(e,c),ctx=c.getContext('2d');ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const draw=e=>{e.preventDefault();if(!isDrawing.current)return;const c=canvasRef.current,p=getPos(e,c),ctx=c.getContext('2d');ctx.lineTo(p.x,p.y);ctx.stroke();};
  const endDraw=()=>{isDrawing.current=false;if(canvasRef.current)setFirma(canvasRef.current.toDataURL());};
  const clearFirma=()=>{const c=canvasRef.current;if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);setFirma(null);};

  const startSession=()=>{setSessionOTs([]);setCurrentOT(makeOT());setClienteData({nombre:'',rut:''});setAceptacion(false);setFirma(null);setStep('form');};

  const saveCurrentOT=()=>{
    if (!isVF&&!currentOT.ppu){alert('Ingresa la PPU del vehículo.');return;}
    setSessionOTs(prev=>[...prev,{...currentOT,_tmp:Date.now()}]);
    setStep('confirm');
  };

  const addAnotherOT=()=>{
    setCurrentOT({...makeOT(),fecha:currentOT.fecha,tipoServicio:currentOT.tipoServicio,
      region:currentOT.region,ciudad:currentOT.ciudad,comuna:currentOT.comuna,
      tecnico:currentOT.tecnico,empresaInstaladora:currentOT.empresaInstaladora});
    setStep('form');
  };

  const finalizeSession=async()=>{
    const emp=sessionEmpresa,prefix=emp==='UGPS'?'U':'E';
    const start=counters[emp];
    const sid=Date.now().toString();
    const newOTs=sessionOTs.map((ot,i)=>({...ot,id:`${sid}-${i}`,numero:`${prefix}${start+i}`,
      sessionId:sid,empresa:emp,cliente:clienteData.nombre,rutCliente:clienteData.rut,
      firma,aceptacion,createdAt:new Date().toISOString(),emailEnviado:false}));
    const nn=start+sessionOTs.length;
    await supabase.from('ot_counters').upsert({ empresa: emp, counter: nn });
    setCounters(p=>({...p,[emp]:nn}));
    saveOTs([...otsList,...newOTs]);
    setSessionOTs(newOTs);
    setStep('preview');
    setTimeout(()=>downloadPDF('ot-preview-wrap',`OT-${emp}-${new Date().toISOString().split('T')[0]}`),800);
  };

  const downloadHistoryOT=async ot=>{setHistoryOT(ot);setDownloading(true);await new Promise(r=>setTimeout(r,600));await downloadPDF('ot-history-render',`OT-${ot.numero}`);setDownloading(false);setHistoryOT(null);};
  const deleteOT=id=>{if(!window.confirm('¿Eliminar esta OT?'))return;saveOTs(otsList.filter(o=>o.id!==id));};
  const setOTField=(f,v)=>setCurrentOT(p=>({...p,[f]:v}));
  const setChecklist=(item,estado)=>setCurrentOT(p=>({...p,checklist:{...p.checklist,[item]:{estado,nota:''}}}));

  const threeAgo=new Date(); threeAgo.setMonth(threeAgo.getMonth()-3);
  const filteredOTs=otsList.filter(ot=>{
    if(new Date(ot.createdAt||ot.fecha)<threeAgo)return false;
    if(filterMes&&!ot.fecha?.startsWith(filterMes))return false;
    if(search){const q=search.toLowerCase();return(ot.ppu||'').toLowerCase().includes(q)||(ot.cliente||'').toLowerCase().includes(q)||String(ot.numero).toLowerCase().includes(q);}
    return true;
  });
  const getMeses=()=>{const now=new Date();return Array.from({length:3},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});};
  const comunasDisp=currentOT.ciudad?(COMUNAS[currentOT.ciudad]||[currentOT.ciudad]):[];
  const isVF=currentOT.tipoServicio==='Visita Fallida';

  // ── LIST ──────────────────────────────────────────────────────────────────
  if(step==='list') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn btn-secondary" onClick={()=>setCurrentView('home')}><ChevronLeft size={14}/> Inicio</button>
              <img src="/logo.svg" alt="Logo" className="page-logo"/>
            </div>
            <h1 className="page-title">Órdenes de Trabajo</h1>
            <button className="btn btn-success" onClick={startSession}><Plus size={14}/> Nueva OT</button>
          </div>
          <div className="ot-filter-bar">
            <div style={{position:'relative',flex:1}}>
              <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
              <input className="search-input" style={{paddingLeft:28}} placeholder="Buscar PPU, cliente, N°..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="form-select" style={{maxWidth:160}} value={filterMes} onChange={e=>setFilterMes(e.target.value)}>
              <option value="">Todos (3 meses)</option>
              {getMeses().map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead className="blue">
                <tr><th>N° OT</th><th>EMPRESA</th><th>FECHA</th><th>CLIENTE</th><th>PPU</th><th>SERVICIO</th><th>TÉCNICO</th><th>ACCIONES</th></tr>
              </thead>
              <tbody>
                {filteredOTs.length===0&&<tr><td colSpan={8} className="empty-state">Sin órdenes en el período</td></tr>}
                {filteredOTs.map(ot=>(
                  <tr key={ot.id}>
                    <td style={{fontWeight:700}}>{ot.numero}</td><td>{ot.empresa}</td><td>{ot.fecha}</td>
                    <td>{ot.cliente}</td><td>{ot.ppu}</td><td>{ot.tipoServicio}</td><td>{ot.tecnico}</td>
                    <td><div className="table-actions">
                      <button className="btn btn-primary" style={{fontSize:'0.6em',padding:'3px 7px'}} onClick={()=>downloadHistoryOT(ot)} disabled={downloading}><Download size={11}/> PDF</button>
                      <button className="action-btn delete" onClick={()=>deleteOT(ot.id)}><Trash2 size={14}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{fontSize:'0.6em',color:'#9ca3af',marginTop:8,fontFamily:'quantico',textAlign:'center'}}>Últimos 3 meses</p>
        </div>
      </div>
      {historyOT&&(
        <div style={{position:'absolute',left:'-9999px',top:0,width:'420px',background:'#f8fafc'}}>
          <div id="ot-history-render">
            <OTDoc ot={historyOT} numero={historyOT.numero} empresa={historyOT.empresa}
              cliente={historyOT.cliente} rut={historyOT.rutCliente} firma={historyOT.firma} aceptacion={historyOT.aceptacion}/>
          </div>
        </div>
      )}
    </div>
  );

  // ── FORM ──────────────────────────────────────────────────────────────────
  if(step==='form') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={()=>setStep('list')}><ChevronLeft size={14}/> Cancelar</button>
            <h1 className="page-title">Nueva OT — {sessionEmpresa}{sessionOTs.length>0?` (${sessionOTs.length+1})`:''}</h1>
          </div>

          <div className="form-container blue">
            <div className="form-grid">
              <div><label className="filter-label">Empresa</label>
                <select className="form-select" value={sessionEmpresa} onChange={e=>setSessionEmpresa(e.target.value)}>
                  {empresas.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
              <div><label className="filter-label">Tipo de Servicio</label>
                <select className="form-select" value={currentOT.tipoServicio} onChange={e=>setOTField('tipoServicio',e.target.value)}>
                  {SERVICIOS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-container blue">
            <div className="form-title">Datos del Servicio</div>
            <div className="form-grid three-cols">
              <div><label className="filter-label">Fecha</label>
                <input type="date" className="form-input" value={currentOT.fecha} onChange={e=>setOTField('fecha',e.target.value)}/>
              </div>
              <div><label className="filter-label">Región</label>
                <select className="form-select" value={currentOT.region}
                  onChange={e=>setCurrentOT(p=>({...p,region:e.target.value,ciudad:'',comuna:''}))}>
                  <option value="">Seleccionar...</option>
                  {REGIONES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="filter-label">Ciudad</label>
                <select className="form-select" value={currentOT.ciudad}
                  onChange={e=>setCurrentOT(p=>({...p,ciudad:e.target.value,comuna:''}))} disabled={!currentOT.region}>
                  <option value="">Seleccionar...</option>
                  {(CIUDADES[currentOT.region]||[]).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="filter-label">Comuna</label>
                <select className="form-select" value={currentOT.comuna}
                  onChange={e=>setOTField('comuna',e.target.value)} disabled={!currentOT.ciudad}>
                  <option value="">Seleccionar...</option>
                  {comunasDisp.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="filter-label">Técnico</label>
                <select className="form-select" value={currentOT.tecnico} onChange={e=>setOTField('tecnico',e.target.value)}>
                  {TECNICOS.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="filter-label">Empresa Instaladora</label>
                <select className="form-select" value={currentOT.empresaInstaladora} onChange={e=>setOTField('empresaInstaladora',e.target.value)}>
                  {EMPRESAS_INST.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          {isVF && (
            <div className="form-container">
              <div className="form-title">Datos del Vehículo</div>
              <div className="form-grid">
                <div><label className="filter-label">PPU</label>
                  <input className="form-input" value={currentOT.ppu} onChange={e=>setOTField('ppu',e.target.value.toUpperCase())} placeholder="Ej: ABCD12"/>
                </div>
              </div>
            </div>
          )}

          {!isVF && <>
            <div className="form-container">
              <div className="form-title">Datos del Vehículo</div>
              <div className="form-grid three-cols">
                <div><label className="filter-label">PPU *</label>
                  <input className="form-input" value={currentOT.ppu} onChange={e=>setOTField('ppu',e.target.value.toUpperCase())} placeholder="Ej: ABCD12"/>
                </div>
                <div><label className="filter-label">Marca</label>
                  <select className="form-select" value={currentOT.marca} onChange={e=>setOTField('marca',e.target.value)}>
                    <option value="">Seleccionar...</option>{MARCAS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className="filter-label">Modelo</label>
                  <input className="form-input" value={currentOT.modelo} onChange={e=>setOTField('modelo',e.target.value)}/>
                </div>
                <div><label className="filter-label">Año</label>
                  <select className="form-select" value={currentOT.anio} onChange={e=>setOTField('anio',e.target.value)}>
                    <option value="">Seleccionar...</option>{AÑOS.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>
                <div><label className="filter-label">Color</label>
                  <select className="form-select" value={currentOT.color} onChange={e=>setOTField('color',e.target.value)}>
                    <option value="">Seleccionar...</option>{COLORES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="filter-label">Kilometraje</label>
                  <input type="number" className="form-input" value={currentOT.kilometraje}
                    onChange={e=>setOTField('kilometraje',e.target.value)} placeholder="km" min={0}/>
                </div>
              </div>
            </div>

            <div className="form-container purple">
              <div className="form-title">Datos GPS</div>
              <div className="form-grid">
                {showImeiIn(currentOT.tipoServicio)&&(
                  <div><label className="filter-label">IMEI IN</label>
                    <input type="number" className="form-input" value={currentOT.imeiIn} onChange={e=>setOTField('imeiIn',e.target.value)}/>
                  </div>
                )}
                {showImeiOut(currentOT.tipoServicio)&&(
                  <div><label className="filter-label">IMEI OUT</label>
                    <input className="form-input" value={currentOT.imeiOut} onChange={e=>setOTField('imeiOut',e.target.value)}/>
                  </div>
                )}
                <div style={{gridColumn:'span 2'}}>
                  <label className="filter-label">Accesorios Instalados</label>
                  <AccesoriosDropdown selected={currentOT.accesoriosGPS} onChange={v=>setOTField('accesoriosGPS',v)}/>
                </div>
              </div>
            </div>

            <div className="form-container">
              <div className="form-title">Check List del Vehículo</div>
              <p style={{fontFamily:'quantico',fontSize:'0.6em',color:'#6b7280',marginBottom:8}}>Gris=N/A → Verde=Bueno → Rojo=Detalle</p>
              <div className="cl-grid">
                {CHECKLIST_ITEMS.map(item=>(
                  <ChecklistRow key={item} item={item}
                    estado={currentOT.checklist[item]?.estado||'NA'}
                    nota={currentOT.checklist[item]?.nota||''}
                    onChange={(e)=>setChecklist(item,e)}/>
                ))}
              </div>
            </div>
          </>}

          <div className="form-container">
            <div className="form-title">Observaciones</div>
            <textarea className="form-input" rows={3} value={currentOT.observaciones}
              onChange={e=>setOTField('observaciones',e.target.value)} style={{resize:'vertical'}}/>
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

  // ── CONFIRM ───────────────────────────────────────────────────────────────
  if(step==='confirm') return (
    <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="ot-confirm-card">
        <Check size={40} color="#16a34a"/>
        <h2 className="ot-confirm-title">OT Guardada</h2>
        <p className="ot-confirm-sub">{sessionOTs.length} OT{sessionOTs.length!==1?'s':''} en esta sesión.<br/>¿Necesitas crear otra OT?<br/><small>(Ubicación y técnico se copiarán)</small></p>
        <div className="ot-confirm-actions">
          <button className="btn btn-primary" style={{fontSize:'0.85em',padding:'10px 20px'}} onClick={addAnotherOT}><Plus size={15}/> Agregar otra OT</button>
          <button className="btn btn-success" style={{fontSize:'0.85em',padding:'10px 20px'}} onClick={()=>setStep('cliente')}><Check size={15}/> Datos del cliente</button>
        </div>
      </div>
    </div>
  );

  // ── CLIENTE ───────────────────────────────────────────────────────────────
  if(step==='cliente') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={()=>setStep('confirm')}><ChevronLeft size={14}/> Atrás</button>
            <h1 className="page-title">Datos del Cliente y Firma</h1>
          </div>

          <div className="form-container blue">
            <div className="form-title">Información del Cliente</div>
            <div className="form-grid">
              <div><label className="filter-label">Nombre *</label>
                <input className="form-input" value={clienteData.nombre}
                  onChange={e=>setClienteData(p=>({...p,nombre:e.target.value}))} placeholder="Nombre o empresa"/>
              </div>
              <div><label className="filter-label">RUT</label>
                <input className="form-input" value={clienteData.rut}
                  onChange={e=>setClienteData(p=>({...p,rut:formatRut(e.target.value)}))}
                  placeholder="12345678-9" maxLength={10}/>
              </div>
            </div>
          </div>

          <div className="form-container" style={{borderColor:'#f59e0b',background:'#fffbeb'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'4px 0'}}>
              <button type="button" className="acept-btn" style={{background:aceptacion?'#16a34a':'white',borderColor:aceptacion?'#16a34a':'#d97706'}} onClick={()=>setAceptacion(!aceptacion)}>
                {aceptacion&&<Check size={14} color="white"/>}
              </button>
              <p style={{fontFamily:'quantico',fontSize:'0.7em',color:'#374151',lineHeight:1.6,margin:0}}>
                Declaro haber recibido el vehículo en las condiciones técnicas descritas en la presente orden, conforme a las actividades realizadas, sin observaciones ni reclamos respecto a la intervención efectuada.
              </p>
            </div>
          </div>

          <div className="form-container">
            <div className="form-title">Firma del Cliente</div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <div className="ot-canvas-wrapper">
                <canvas ref={canvasRef} width={400} height={130} className="ot-canvas"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
              <button className="btn btn-secondary" onClick={clearFirma}><X size={12}/> Limpiar</button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-success" style={{fontSize:'0.85em',padding:'10px 24px'}}
              onClick={finalizeSession} disabled={!clienteData.nombre||!aceptacion}>
              <Check size={15}/> Finalizar y Descargar OT
            </button>
          </div>
          {(!clienteData.nombre||!aceptacion)&&(
            <p style={{textAlign:'center',fontFamily:'quantico',fontSize:'0.6em',color:'#ef4444',marginTop:6}}>
              {!clienteData.nombre?'* Ingresa el nombre':''}{!aceptacion?'  * Acepta las condiciones':''}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  const otDocProps = (ot) => ({ot, numero:ot.numero, empresa:sessionEmpresa,
    cliente:clienteData.nombre, rut:clienteData.rut, firma, aceptacion});

  if(step==='preview') return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header"><h1 className="page-title">OT — {sessionEmpresa}</h1></div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14,flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={()=>downloadPDF('ot-preview-wrap',`OT-${sessionEmpresa}-${new Date().toISOString().split('T')[0]}`)}><Download size={14}/> PDF</button>
            <button className="btn btn-success" onClick={()=>setStep('list')}><Check size={14}/> Historial</button>
            <button className="btn btn-secondary" onClick={()=>setCurrentView('home')}><HomeIcon size={14}/> Inicio</button>
          </div>

          {/* Preview — naturally responsive */}
          <div style={{width:'100%',background:'#f8fafc'}}>
            {sessionOTs.map((ot,i)=>(
              <div key={i} style={{marginBottom:i<sessionOTs.length-1?24:0}}>
                <OTDoc {...otDocProps(ot)}/>
                {i<sessionOTs.length-1&&<hr style={{margin:'16px 0',border:'2px dashed #d1d5db'}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden div for PDF capture at 420px */}
      <div style={{position:'fixed',left:'-9999px',top:0,width:'420px',background:'#f8fafc'}}>
        <div id="ot-preview-wrap">
          {sessionOTs.map((ot,i)=>(
            <div key={i} style={{marginBottom:i<sessionOTs.length-1?24:0}}>
              <OTDoc {...otDocProps(ot)}/>
              {i<sessionOTs.length-1&&<hr style={{margin:'16px 0',border:'2px dashed #d1d5db'}}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
};

export default OrdenesTrabajo;
