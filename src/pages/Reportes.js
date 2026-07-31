// v3.0 - reporte por cobrador con desglose por templo
import React, { useRef, useState } from 'react';
import { Card, CardHeader, Button, Badge } from '../components/UI';
import logoNavy from '../assets/logo-navy.png';

export default function Reportes({ data }) {
  const { cobranzas, miembros, cobradores, templos, configuracion, deudasAnuales } = data;
  const [cobradorSeleccionado, setCobradorSeleccionado] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const printRef = useRef();

  const fmt = (n) => n?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
  const aniosDisponibles = [...new Set(cobranzas.map(c => c.anio).filter(Boolean))].sort((a,b) => b - a);

  // ── Exportar CSV ──────────────────────────────────────────
  const exportarCSV = () => {
    const cobradoresParaExportar = cobradorSeleccionado
      ? cobradores.filter(c => c.id === parseInt(cobradorSeleccionado))
      : cobradores;

    const filas = [[
      'Fecha','N° Recibo','Año','Cobrador','Templo cobrador','Templo miembro',
      'N° Socio','Apellido y Nombre','Documento','CUIT','Categoría','Monto cobrado','Deuda restante',
    ].join(',')];

    for (const cobrador of cobradoresParaExportar) {
      const temploCobrador = templos.find(t => t.id === cobrador.templo_id);
      let czCobrador = cobranzas.filter(c => c.cobrador_id === cobrador.id);
      if (filtroAnio) czCobrador = czCobrador.filter(c => c.anio === parseInt(filtroAnio));

      for (const cz of czCobrador) {
        const miembro      = miembros.find(m => m.id === cz.miembro_id);
        const temploMiembro = templos.find(t => t.id === miembro?.templo_id);
        const deuda        = deudasAnuales.find(d => d.miembro_id === cz.miembro_id && d.anio === cz.anio);
        filas.push([
          cz.fecha || '',
          cz.numero_recibo || '',
          cz.anio || '',
          cobrador.nombre || '',
          temploCobrador?.nombre || 'Todos',
          `"${temploMiembro?.nombre || ''}"`,
          miembro?.nro_socio || '',
          `"${miembro?.nombre || ''}"`,
          miembro?.documento || '',
          miembro?.cuit || '',
          miembro?.categoria || '',
          cz.monto || '',
          deuda?.saldo ?? '',
        ].join(','));
      }
    }

    const totalCobrado = cobranzas
      .filter(c => !cobradorSeleccionado || c.cobrador_id === parseInt(cobradorSeleccionado))
      .filter(c => !filtroAnio || c.anio === parseInt(filtroAnio))
      .reduce((s, c) => s + c.monto, 0);
    filas.push('');
    filas.push(`,,,,,,,,,,,"TOTAL",${totalCobrado}`);

    const csv  = filas.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const nombre = cobradorSeleccionado
      ? cobradores.find(c => c.id === parseInt(cobradorSeleccionado))?.nombre
      : 'Todos';
    link.href     = url;
    link.download = `cobranzas_${nombre}_${fecha}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Imprimir ──────────────────────────────────────────────
  const handlePrint = () => {
    const contenido = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>Reporte de Cobranzas — Iglesia Unión Pentecostal</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #1a202c; padding: 20px; }
          h1 { font-size: 15px; color: #1C2B4B; margin-bottom: 4px; }
          h2 { font-size: 11px; font-weight: normal; color: #666; margin-bottom: 16px; }
          .header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 2px solid #1C2B4B; padding-bottom: 10px; }
          img { width: 32px; height: 32px; object-fit: contain; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #1C2B4B; color: white; padding: 5px 7px; text-align: left; font-size: 8px; text-transform: uppercase; }
          td { padding: 5px 7px; border-bottom: 1px solid #eee; font-size: 9px; }
          tr:nth-child(even) td { background: #f8f9fb; }
          .total-row td { font-weight: bold; background: #f5edd8 !important; border-top: 2px solid #C89B3C; }
          .seccion-templo { background: #EEF0F5; padding: 5px 8px; font-weight: bold; font-size: 9px; color: #1C2B4B; margin-top: 6px; }
          .cobrador-header { background: #243358; color: white; padding: 7px 10px; margin-top: 14px; font-weight: bold; font-size: 11px; }
          .footer { margin-top: 20px; font-size: 8px; color: #999; text-align: right; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${contenido}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  // ── Construir datos del reporte ───────────────────────────
  const cobradoresConDatos = cobradores.map(c => {
    let czDelCobrador = cobranzas.filter(cz => cz.cobrador_id === c.id);
    if (filtroAnio) czDelCobrador = czDelCobrador.filter(cz => cz.anio === parseInt(filtroAnio));
    const templo       = templos.find(t => t.id === c.templo_id);
    const totalCobrado = czDelCobrador.reduce((s, cz) => s + cz.monto, 0);
    const cobrador_multiTemplo = !c.templo_id; // cobra en varios templos

    // Agrupar por templo del miembro (para cobradores sin templo fijo)
    const porTemplo = templos.map(t => {
      const czTemplo = czDelCobrador.filter(cz => {
        const m = miembros.find(m => m.id === cz.miembro_id);
        return m?.templo_id === t.id;
      });
      return { templo: t, cobranzas: czTemplo, total: czTemplo.reduce((s, cz) => s + cz.monto, 0) };
    }).filter(r => r.cobranzas.length > 0);

    return { ...c, templo, czDelCobrador, totalCobrado, cobrador_multiTemplo, porTemplo };
  });

  const cobradoresParaReporte = cobradorSeleccionado
    ? cobradoresConDatos.filter(c => c.id === parseInt(cobradorSeleccionado))
    : cobradoresConDatos;

  const totalGeneral = cobranzas
    .filter(c => !cobradorSeleccionado || c.cobrador_id === parseInt(cobradorSeleccionado))
    .filter(c => !filtroAnio || c.anio === parseInt(filtroAnio))
    .reduce((s, c) => s + c.monto, 0);

  const totalDeuda = miembros.reduce((s, m) => {
    return s + deudasAnuales.filter(d => d.miembro_id === m.id && !d.pagado).reduce((sd, d) => sd + d.saldo, 0);
  }, 0);

  const mayores = miembros.filter(m => m.categoria === 'mayor');
  const menores = miembros.filter(m => m.categoria === 'menor');

  // ── Tabla de cobranzas por cobrador ──────────────────────
  const TablaCobranzas = ({ czLista, mostrarTemplo = false }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          {['Fecha','N° Recibo','Año',mostrarTemplo && 'Templo','N° Socio','Miembro','Documento','CUIT','Cat.','Monto','Deuda restante']
            .filter(Boolean).map(h => (
            <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {czLista.length === 0 ? (
          <tr><td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>
            Sin cobranzas{filtroAnio ? ` en ${filtroAnio}` : ''}
          </td></tr>
        ) : czLista.map(cz => {
          const miembro      = miembros.find(m => m.id === cz.miembro_id);
          const temploMiembro = templos.find(t => t.id === miembro?.templo_id);
          const deuda        = deudasAnuales.find(d => d.miembro_id === cz.miembro_id && d.anio === cz.anio);
          return (
            <tr key={cz.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '9px 12px', color: 'var(--gray-600)', whiteSpace: 'nowrap', fontSize: 11 }}>{cz.fecha}</td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                  {cz.numero_recibo}
                </span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ background: 'var(--gold-pale)', color: 'var(--warning)', fontWeight: 700, fontSize: 11, padding: '2px 7px', borderRadius: 99 }}>
                  {cz.anio || '—'}
                </span>
              </td>
              {mostrarTemplo && (
                <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--gray-600)' }}>{temploMiembro?.nombre || '—'}</td>
              )}
              <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 10, color: 'var(--gray-400)' }}>{miembro?.nro_socio || '—'}</td>
              <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{miembro?.nombre || '—'}</td>
              <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 10 }}>{miembro?.documento || '—'}</td>
              <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 10 }}>{miembro?.cuit || '—'}</td>
              <td style={{ padding: '9px 12px' }}>
                <Badge variant={miembro?.categoria || 'default'}>
                  {miembro?.categoria === 'mayor' ? 'Mayor' : 'Menor'}
                </Badge>
              </td>
              <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>{fmt(cz.monto)}</td>
              <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap', color: deuda?.saldo === 0 ? 'var(--success)' : 'var(--danger)' }}>
                {deuda ? (deuda.saldo === 0 ? 'Al día ✓' : fmt(deuda.saldo)) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      {/* Barra de acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Reportes</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>Cobranzas y estado de deuda</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={cobradorSeleccionado} onChange={e => setCobradorSeleccionado(e.target.value)} style={{ width: 200 }}>
            <option value="">Todos los cobradores</option>
            {cobradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} style={{ width: 130 }}>
            <option value="">Todos los años</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button variant="ghost" onClick={exportarCSV}>↓ Exportar a Sheets</Button>
          <Button variant="gold" onClick={handlePrint}>⎙ Imprimir</Button>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total cobrado',    value: fmt(totalGeneral), bg: 'var(--navy)',  color: 'var(--white)',  sub: `${cobranzas.length} cobranzas` },
          { label: 'Deuda pendiente',  value: fmt(totalDeuda),   bg: 'var(--white)', color: 'var(--danger)', border: true, sub: 'a recaudar' },
          { label: 'Socios mayores',   value: mayores.length,    bg: 'var(--white)', color: 'var(--navy)',   border: true, sub: `Cuota: ${fmt(configuracion.cuota_mayor)}` },
          { label: 'Socios menores',   value: menores.length,    bg: 'var(--white)', color: 'var(--navy)',   border: true, sub: `Cuota: ${fmt(configuracion.cuota_menor)}` },
        ].map(item => (
          <div key={item.label} style={{
            background: item.bg, border: item.border ? '1px solid var(--gray-200)' : 'none',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: item.bg === 'var(--navy)' ? 'rgba(255,255,255,0.5)' : 'var(--gray-400)' }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: item.color, marginTop: 6, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{item.value}</div>
            <div style={{ fontSize: 11, marginTop: 6, color: item.bg === 'var(--navy)' ? 'rgba(255,255,255,0.35)' : 'var(--gray-400)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Contenido del reporte */}
      <div ref={printRef}>
        {/* Encabezado de impresión */}
        <div className="header" style={{ display: 'none' }}>
          <img src={logoNavy} alt="Logo" />
          <div>
            <h1>Iglesia Evangélica Unión Pentecostal</h1>
            <h2>
              Reporte de cobranzas{filtroAnio ? ` — Año ${filtroAnio}` : ''}
              {' — '}{new Date().toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })}
            </h2>
          </div>
        </div>

        {cobradoresParaReporte.map(c => (
          <Card key={c.id} style={{ marginBottom: 20 }}>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{c.nombre}</span>
                  {c.cobrador_multiTemplo && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--gold-pale)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 99 }}>
                      Todos los templos
                    </span>
                  )}
                </div>
              }
              subtitle={`${c.templo?.nombre || 'Todos los templos'} · ${c.czDelCobrador.length} cobranza${c.czDelCobrador.length !== 1 ? 's' : ''}${filtroAnio ? ` — ${filtroAnio}` : ''}`}
              action={
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total cobrado</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', fontFamily: 'Georgia, serif' }}>{fmt(c.totalCobrado)}</div>
                </div>
              }
            />

            {/* Si cobra en varios templos: mostrar desglose por templo */}
            {c.cobrador_multiTemplo && c.czDelCobrador.length > 0 ? (
              <div>
                {/* Resumen por templo */}
                <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Resumen por templo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8 }}>
                    {c.porTemplo.map(r => (
                      <div key={r.templo.id} style={{
                        background: 'var(--white)', border: '1px solid var(--gray-200)',
                        borderRadius: 8, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{r.templo.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.cobranzas.length} cobranza{r.cobranzas.length !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{fmt(r.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabla con columna de templo */}
                <TablaCobranzas czLista={c.czDelCobrador} mostrarTemplo={true} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', background: 'var(--gold-pale)', borderTop: '2px solid var(--gold)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 13 }}>
                    Total cobrado por {c.nombre}: <span style={{ color: 'var(--success)', fontSize: 16 }}>{fmt(c.totalCobrado)}</span>
                  </span>
                </div>
              </div>
            ) : (
              /* Cobrador de un solo templo: tabla simple */
              <div>
                <TablaCobranzas czLista={c.czDelCobrador} mostrarTemplo={false} />
                {c.czDelCobrador.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '11px 20px', background: 'var(--gold-pale)', borderTop: '2px solid var(--gold)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 13 }}>
                      Total: <span style={{ color: 'var(--success)', fontSize: 16 }}>{fmt(c.totalCobrado)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'right', marginTop: 8 }}>
          Generado el {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} · Iglesia Evangélica Unión Pentecostal
        </div>
      </div>
    </div>
  );
}
