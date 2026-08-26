import React, { useMemo, useState } from 'react';
import { Home, FileImage, Table2, DollarSign, ListChecks } from 'lucide-react';
import { exportToVisualImage } from '../utils/visualExportUtils';
import '../styles/Dashboard.css';

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const parseMes = (mesStr) => {
  const [nombre, anioStr] = (mesStr || '').split(' ');
  const idx = MESES_ES.indexOf(nombre);
  const anio = parseInt(anioStr, 10) || 0;
  return { idx, anio, sortKey: anio * 12 + (idx < 0 ? 0 : idx), corto: idx >= 0 ? `${MESES_CORTOS[idx]} ${String(anio).slice(2)}` : mesStr };
};

const fmtPesos = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;
const fmtCompacto = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1).replace('.0', '')}K`;
  return `$${Math.round(n)}`;
};

const MESES_A_MOSTRAR = 12;

// Mismo valor por km que usa Trabajos del Mes (empresaSeleccionada === 'Entel' ? 200 : 250),
// pero aplicado por trabajo según SU propia empresa (acá conviven varias a la vez).
const valorKmDe = (empresa) => (empresa === 'Entel' ? 200 : 250);

// Réplica de calcularTotales() de Trabajos.js: como IVA/retención son proporciones
// fijas del subtotal, sumar subtotales y aplicar el % una sola vez al final da el
// mismo resultado que sumar los totales ya calculados por trabajo/mes — no hace
// falta repetir el cálculo por cada agrupación.
const calcularFinal = (pesos, kmValor, tipoDocumento) => {
  const subtotal = pesos + kmValor;
  if (tipoDocumento === 'boleta') {
    const totalBoleta = Math.round(subtotal / (1 - 0.1525));
    return { subtotal, final: totalBoleta, extra: totalBoleta - subtotal, extraLabel: 'Retención (15.25%)', extraCorto: 'Retención' };
  }
  const iva = subtotal * 0.19;
  return { subtotal, final: subtotal + iva, extra: iva, extraLabel: 'IVA (19%)', extraCorto: 'IVA' };
};

const Dashboard = ({ setCurrentView, trabajos, empresas }) => {
  const [metrica, setMetrica] = useState('pesos'); // 'pesos' | 'cantidad'
  const [verTabla, setVerTabla] = useState(false);
  const [hover, setHover] = useState(null);
  // Comparte la preferencia con Trabajos del Mes, para que "factura" o "boleta"
  // sea la misma elección en toda la app.
  const [tipoDocumento, setTipoDocumento] = useState(() => localStorage.getItem('tipoDocumento') || 'factura');
  const cambiarTipoDocumento = (t) => { setTipoDocumento(t); localStorage.setItem('tipoDocumento', t); };

  const colorFor = (empresa) => `var(--series-${(Math.max(0, empresas.indexOf(empresa)) % 8) + 1})`;

  const datos = useMemo(() => {
    const porEmpresa = new Map(empresas.map(e => [e, { pesos: 0, uf: 0, cantidad: 0, km: 0, kmValor: 0 }]));
    const porMesMap = new Map();

    trabajos.forEach(t => {
      const pesos = parseFloat(t.valorPesos) || 0;
      const uf = parseFloat(t.valorUF) || 0;
      const km = parseFloat(t.km) || 0;
      const kmValor = km * valorKmDe(t.empresa);

      if (!porEmpresa.has(t.empresa)) porEmpresa.set(t.empresa, { pesos: 0, uf: 0, cantidad: 0, km: 0, kmValor: 0 });
      const e = porEmpresa.get(t.empresa);
      e.pesos += pesos; e.uf += uf; e.cantidad += 1; e.km += km; e.kmValor += kmValor;

      if (!porMesMap.has(t.mes)) porMesMap.set(t.mes, { mes: t.mes, ...parseMes(t.mes), porEmpresa: new Map(), totalPesos: 0, totalCantidad: 0 });
      const m = porMesMap.get(t.mes);
      if (!m.porEmpresa.has(t.empresa)) m.porEmpresa.set(t.empresa, { pesos: 0, cantidad: 0 });
      const me = m.porEmpresa.get(t.empresa);
      me.pesos += pesos; me.cantidad += 1;
      m.totalPesos += pesos; m.totalCantidad += 1;
    });

    const mesesOrdenados = Array.from(porMesMap.values()).sort((a, b) => a.sortKey - b.sortKey);
    const mesesOcultos = Math.max(0, mesesOrdenados.length - MESES_A_MOSTRAR);
    const mesesVisibles = mesesOrdenados.slice(-MESES_A_MOSTRAR);

    const granTotalPesos = trabajos.reduce((s, t) => s + (parseFloat(t.valorPesos) || 0), 0);
    const granTotalUF = trabajos.reduce((s, t) => s + (parseFloat(t.valorUF) || 0), 0);
    const granTotalCantidad = trabajos.length;
    const granTotalKm = trabajos.reduce((s, t) => s + (parseFloat(t.km) || 0), 0);
    const granTotalKmValor = trabajos.reduce((s, t) => s + (parseFloat(t.km) || 0) * valorKmDe(t.empresa), 0);

    const empresasOrdenadas = Array.from(porEmpresa.entries())
      .map(([empresa, v]) => ({ empresa, ...v }))
      .sort((a, b) => b.pesos - a.pesos);

    return { porEmpresa, mesesVisibles, mesesOcultos, granTotalPesos, granTotalUF, granTotalCantidad, granTotalKm, granTotalKmValor, empresasOrdenadas };
  }, [trabajos, empresas]);

  const { mesesVisibles, mesesOcultos, granTotalPesos, granTotalUF, granTotalCantidad, granTotalKm, granTotalKmValor, empresasOrdenadas } = datos;
  const granFinal = calcularFinal(granTotalPesos, granTotalKmValor, tipoDocumento);

  const valorMes = (m, emp) => {
    const v = m.porEmpresa.get(emp);
    if (!v) return 0;
    return metrica === 'pesos' ? v.pesos : v.cantidad;
  };
  const valorEmpresa = (e) => metrica === 'pesos' ? e.pesos : e.cantidad;
  const totalMes = (m) => metrica === 'pesos' ? m.totalPesos : m.totalCantidad;
  const fmtC = metrica === 'pesos' ? fmtCompacto : (n) => `${n}`;

  const maxTotal = Math.max(1, ...mesesVisibles.map(totalMes));
  const maxEmpresa = Math.max(1, ...empresasOrdenadas.map(valorEmpresa));

  const hayDatos = trabajos.length > 0;

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-card">
          <div className="page-header">
            <div className="page-header-left">
              <img src="/logo_solo.svg" alt="Logo" className="page-logo" />
              <h2 className="page-title">Dashboard</h2>
            </div>
            <button onClick={() => setCurrentView('home')} className="btn btn-secondary">
              <Home size={20} /> Inicio
            </button>
          </div>

          {!hayDatos ? (
            <p className="empty-state">Aún no hay trabajos registrados para mostrar en el dashboard</p>
          ) : (
            <>
              <div className="db-toolbar">
                <div className="db-metric-toggle">
                  <button className={`btn ${metrica === 'pesos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMetrica('pesos')}>
                    <DollarSign size={15} /> Monto
                  </button>
                  <button className={`btn ${metrica === 'cantidad' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMetrica('cantidad')}>
                    <ListChecks size={15} /> Cantidad
                  </button>
                </div>
                <div className="db-metric-toggle">
                  <button className={`btn ${tipoDocumento === 'factura' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => cambiarTipoDocumento('factura')}>Factura</button>
                  <button className={`btn ${tipoDocumento === 'boleta' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => cambiarTipoDocumento('boleta')}>Boleta</button>
                </div>
                <button className="btn btn-secondary" onClick={() => setVerTabla(v => !v)}>
                  <Table2 size={15} /> {verTabla ? 'Ocultar tabla' : 'Ver tabla'}
                </button>
                <button className="btn btn-success" onClick={() => exportToVisualImage('dashboard-export', 'dashboard_servitrak')}>
                  <FileImage size={15} /> Imagen
                </button>
              </div>

              <div id="dashboard-export">
                {/* ── Hero: total general — líquido, km y retención/IVA de TODAS las empresas ── */}
                <div className="db-hero">
                  <span className="db-hero-label">Total {tipoDocumento === 'boleta' ? 'Boleta' : 'Factura'} — Todas las Empresas</span>
                  <div className="db-hero-stats">
                    <div className="db-hero-stat">
                      <span className="db-hero-stat-label">Líquido</span>
                      <span className="db-hero-stat-value">{fmtPesos(granFinal.subtotal)}</span>
                    </div>
                    <div className="db-hero-stat">
                      <span className="db-hero-stat-label">Valor Km</span>
                      <span className="db-hero-stat-value">{fmtPesos(granTotalKmValor)}</span>
                      <span className="db-hero-stat-hint">{granTotalKm.toFixed(0)} km</span>
                    </div>
                    <div className="db-hero-stat">
                      <span className="db-hero-stat-label">{granFinal.extraCorto}</span>
                      <span className="db-hero-stat-value">{fmtPesos(granFinal.extra)}</span>
                    </div>
                  </div>
                  <span className="db-hero-sub">
                    {granTotalCantidad} trabajos ({granTotalUF.toFixed(1)} UF) · Total {tipoDocumento === 'boleta' ? 'boleta' : 'a facturar'}: {fmtPesos(granFinal.final)}
                  </span>
                </div>

                {/* ── Totales por empresa — mismos 3 campos (líquido, km, retención/IVA), compacto ── */}
                <h3 className="db-section-title">Totales por Empresa</h3>
                <div className="db-empresa-grid">
                  {empresasOrdenadas.map(e => {
                    const f = calcularFinal(e.pesos, e.kmValor, tipoDocumento);
                    return (
                    <div key={e.empresa} className="db-empresa-card" style={{ '--card-color': colorFor(e.empresa) }}>
                      <div className="db-empresa-head">
                        <span className="db-dot" style={{ background: colorFor(e.empresa) }} />
                        <span className="db-empresa-name">{e.empresa}</span>
                        <span className="db-empresa-count">{e.cantidad} trab.</span>
                      </div>
                      <div className="db-empresa-stats">
                        <div className="db-empresa-stat">
                          <span className="db-empresa-stat-label">Líquido</span>
                          <span className="db-empresa-stat-value">{fmtCompacto(f.subtotal)}</span>
                        </div>
                        <div className="db-empresa-stat">
                          <span className="db-empresa-stat-label">Km $</span>
                          <span className="db-empresa-stat-value">{fmtCompacto(e.kmValor)}</span>
                        </div>
                        <div className="db-empresa-stat">
                          <span className="db-empresa-stat-label">{f.extraCorto}</span>
                          <span className="db-empresa-stat-value">{fmtCompacto(f.extra)}</span>
                        </div>
                      </div>
                      <div className="db-meter">
                        <div className="db-meter-fill" style={{ width: `${(valorEmpresa(e) / maxEmpresa) * 100}%`, background: colorFor(e.empresa) }} />
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* ── Trabajos por mes ── */}
                <h3 className="db-section-title">Trabajos por Mes</h3>
                {mesesOcultos > 0 && (
                  <p className="db-note">Mostrando los últimos {MESES_A_MOSTRAR} meses ({mesesOcultos} mes{mesesOcultos > 1 ? 'es' : ''} anterior{mesesOcultos > 1 ? 'es' : ''} no se muestra{mesesOcultos > 1 ? 'n' : ''} aquí, pero sí en la tabla y en Trabajos del Mes).</p>
                )}

                <div className="db-legend">
                  {empresas.map(emp => (
                    <div key={emp} className="db-legend-item">
                      <span className="db-dot" style={{ background: colorFor(emp) }} />
                      <span>{emp}</span>
                    </div>
                  ))}
                </div>

                <div className="db-chart-scroll">
                  <div className="db-chart">
                    {mesesVisibles.map(m => {
                      const empresasConValor = empresas.filter(emp => valorMes(m, emp) > 0);
                      return (
                        <div key={m.mes} className="db-bar-col">
                          <span className="db-bar-total">{fmtC(totalMes(m))}</span>
                          <div className="db-bar-stack">
                            {empresasConValor.map((emp, i) => {
                              const val = valorMes(m, emp);
                              const pct = (val / maxTotal) * 100;
                              const esUltimo = i === empresasConValor.length - 1;
                              return (
                                <div
                                  key={emp}
                                  className={`db-bar-seg ${esUltimo ? 'db-bar-seg--top' : ''}`}
                                  style={{ height: `${pct}%`, background: colorFor(emp) }}
                                  onMouseEnter={() => setHover({ mes: m.mes, empresa: emp, valor: val })}
                                  onMouseLeave={() => setHover(null)}
                                />
                              );
                            })}
                          </div>
                          <span className="db-bar-label">{m.corto}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hover && (
                  <div className="db-tooltip">
                    <strong>{hover.empresa}</strong> — {hover.mes}: {metrica === 'pesos' ? fmtPesos(hover.valor) : `${hover.valor} trabajos`}
                  </div>
                )}

                {/* ── Tabla de datos ── */}
                {verTabla && (
                  <div className="table-container" style={{ marginTop: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mes</th>
                          {empresas.map(emp => <th key={emp}>{emp}</th>)}
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mesesVisibles.map(m => (
                          <tr key={m.mes}>
                            <td className="text-bold">{m.mes}</td>
                            {empresas.map(emp => (
                              <td key={emp}>{metrica === 'pesos' ? fmtPesos(valorMes(m, emp)) : valorMes(m, emp)}</td>
                            ))}
                            <td className="text-bold">{metrica === 'pesos' ? fmtPesos(totalMes(m)) : totalMes(m)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
