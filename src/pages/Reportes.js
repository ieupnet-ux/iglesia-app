// v2.0 - documento, cuit y exportacion
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

  // ── Exportar a CSV (compatible con Google Sheets) ─────────
  const exportarCSV = () => {
    const cobradoresParaExportar = cobradorSeleccionado
      ? cobradores.filter(c => c.id === parseInt(cobradorSeleccionado))
      : cobradores;

    const filas = [];

    // Encabezados
    filas.push([
      'Fecha',
      'N° Recibo',
      'Año abonado',
      'Cobrador',
      'Templo',
      'N° Socio',
      'Apellido y Nombre',
      'Documento',
      'CUIT',
      'Categoría',
      'Cuota anual',
      'Monto cobrado',
      'Deuda restante',
    ].join(','));

    for (const cobrador of cobradoresParaExportar) {
      const templo = templos.find(t => t.id === cobrador.templo_id);
      let czCobrador = cobranzas.filter(c => c.cobrador_id === cobrador.id);
      if (filtroAnio) czCobrador = czCobrador.filter(c => c.anio === parseInt(filtroAnio));

      for (const cz of czCobrador) {
        const miembro = miembros.find(m => m.id === cz.miembro_id);
        const cuota   = miembro?.categoria === 'mayor' ? configuracion.cuota_mayor : configuracion.cuota_menor;
        const deuda   = deudasAnuales.find(d => d.miembro_id === cz.miembro_id && d.anio === cz.anio);

        const fila = [
          cz.fecha || '',
          cz.numero_recibo || '',
          cz.anio || '',
          cobrador.nombre || '',
          templo?.nombre || '',
          miembro?.nro_socio || '',
          `"${miembro?.nombre || ''}"`,
          miembro?.documento || '',
          miembro?.cuit || '',
          miembro?.categoria || '',
          cuota || '',
          cz.monto || '',
          deuda?.saldo ?? '',
        ];
        filas.push(fila.join(','));
      }
    }

    // Agregar fila de totales al final
    filas.push('');
    const totalCobrado = cobranzas
      .filter(c => !cobradorSeleccionado || c.cobrador_id === parseInt(cobradorSeleccionado))
      .filter(c => !filtroAnio || c.anio === parseInt(filtroAnio))
      .reduce((s, c) => s + c.monto, 0);
    filas.push(`,,,,,,,,,,,"TOTAL",${totalCobrado}`);

    const csv     = filas.join('\n');
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const link    = document.createElement('a');
    const fecha   = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const nombre  = cobradorSeleccionado
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
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1a202c; padding: 20px; }
          h1 { font-size: 16px; color: #1C2B4B; margin-bottom: 4px; }
          h2 { font-size: 12px; font-weight: normal; color: #666; margin-bottom: 16px; }
          .header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 2px solid #1C2B4B; padding-bottom: 10px; }
          img { width: 36px; height: 36px; object-fit: contain; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #1C2B4B; color: white; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
          tr:nth-child(even) td { background: #f8f9fb; }
          .total-row td { font-weight: bold; background: #f5edd8 !important; color: #1C2B4B; border-top: 2px solid #C89B3C; }
          .cobrador-header { background: #243358; color: white; padding: 8px 10px; margin-top: 16px; font-weight: bold; font-size: 12px; }
          .footer { margin-top: 24px; font-size: 9px; color: #999; text-align: right; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${contenido}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const cobradoresConDatos = cobradores.map(c => {
    let czDelCobrador = cobranzas.filter(cz => cz.cobrador_id === c.id);
    if (filtroAnio) czDelCobrador = czDelCobrador.filter(cz => cz.anio === parseInt(filtroAnio));
    const templo      = templos.find(t => t.id === c.templo_id);
    const totalCobrado = czDelCobrador.reduce((s, cz) => s + cz.monto, 0);
    return { ...c, templo, czDelCobrador, totalCobrado };
  });

  const cobradoresParaReporte = cobradorSeleccionado
    ? cobradoresConDatos.filter(c => c.id === parseInt(cobradorSeleccionado))
    : cobradoresConDatos;

  const totalGeneral = cobranzas
    .filter(c => !cobradorSeleccionado || c.cobrador_id === parseInt(cobradorSeleccionado))
    .filter(c => !filtroAnio || c.anio === parseInt(filtroAnio))
    .reduce((s, c) => s + c.monto, 0);

  const totalDeuda   = miembros.reduce((s, m) => {
    const deudas = deudasAnuales.filter(d => d.miembro_id === m.id && !d.pagado);
    return s + deudas.reduce((sd, d) => sd + d.saldo, 0);
  }, 0);

  const mayores = miembros.filter(m => m.categoria === 'mayor');
  const menores = miembros.filter(m => m.categoria === 'menor');

  return (
    <div>
      {/* Barra de acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
          <Button variant="ghost" onClick={exportarCSV}>
            ↓ Exportar a Sheets
          </Button>
          <Button variant="gold" onClick={handlePrint}>
            ⎙ Imprimir
          </Button>
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
              Reporte de cobranzas
              {filtroAnio ? ` — Año ${filtroAnio}` : ''}
              {' — '}{new Date().toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })}
            </h2>
          </div>
        </div>

        {cobradoresParaReporte.map(c => (
          <Card key={c.id} style={{ marginBottom: 20 }}>
            <CardHeader
              title={c.nombre}
              subtitle={`${c.templo?.nombre || '—'} · ${c.czDelCobrador.length} cobranza${c.czDelCobrador.length !== 1 ? 's' : ''}${filtroAnio ? ` — ${filtroAnio}` : ''}`}
              action={
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total cobrado</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', fontFamily: 'Georgia, serif' }}>{fmt(c.totalCobrado)}</div>
                </div>
              }
            />

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    {['Fecha','N° Recibo','Año','N° Socio','Apellido y Nombre','Documento','CUIT','Categoría','Monto','Deuda restante'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: 'var(--gray-400)', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.czDelCobrador.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                      Sin cobranzas{filtroAnio ? ` en ${filtroAnio}` : ''}
                    </td></tr>
                  ) : c.czDelCobrador.map(cz => {
                    const miembro = miembros.find(m => m.id === cz.miembro_id);
                    const deuda   = deudasAnuales.find(d => d.miembro_id === cz.miembro_id && d.anio === cz.anio);
                    return (
                      <tr key={cz.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{cz.fecha}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 4 }}>
                            {cz.numero_recibo}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: 'var(--gold-pale)', color: 'var(--warning)', fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 99 }}>
                            {cz.anio || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-600)' }}>
                          {miembro?.nro_socio || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                          {miembro?.nombre || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-600)' }}>
                          {miembro?.documento || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-600)' }}>
                          {miembro?.cuit || '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge variant={miembro?.categoria || 'default'}>
                            {miembro?.categoria === 'mayor' ? 'Mayor' : 'Menor'}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                          {fmt(cz.monto)}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap', color: deuda?.saldo === 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {deuda ? (deuda.saldo === 0 ? 'Al día ✓' : fmt(deuda.saldo)) : '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Fila total */}
                  {c.czDelCobrador.length > 0 && (
                    <tr style={{ background: 'var(--gold-pale)', borderTop: '2px solid var(--gold)' }}>
                      <td colSpan={8} style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--navy)', fontSize: 12 }}>
                        Total cobrado por {c.nombre}
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--success)', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {fmt(c.totalCobrado)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ))}

        <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'right', marginTop: 8 }}>
          Generado el {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} · Iglesia Evangélica Unión Pentecostal
        </div>
      </div>
    </div>
  );
}
