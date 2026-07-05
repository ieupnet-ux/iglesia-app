import React, { useRef, useState } from 'react';
import { Card, CardHeader, Button, Badge } from '../components/UI';
import logoNavy from '../assets/logo-navy.png';

export default function Reportes({ data }) {
  const { cobranzas, miembros, cobradores, templos, configuracion } = data;
  const [cobradorSeleccionado, setCobradorSeleccionado] = useState('');
  const printRef = useRef();

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const handlePrint = () => {
    const contenido = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>Reporte de Cobranzas — Iglesia Unión Pentecostal</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a202c; padding: 24px; }
          h1 { font-size: 18px; color: #1C2B4B; margin-bottom: 4px; }
          h2 { font-size: 13px; font-weight: normal; color: #666; margin-bottom: 20px; }
          .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #1C2B4B; padding-bottom: 12px; }
          img { width: 40px; height: 40px; object-fit: contain; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #1C2B4B; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #f8f9fb; }
          .total-row td { font-weight: bold; background: #f5edd8 !important; color: #1C2B4B; border-top: 2px solid #C89B3C; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: bold; }
          .mayor { background: #dce3f0; color: #1C2B4B; }
          .menor { background: #f5edd8; color: #92600A; }
          .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: right; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${contenido}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  // Construir datos del reporte
  const cobradoresConDatos = cobradores.map(c => {
    const czDelCobrador = cobranzas.filter(cz => cz.cobrador_id === c.id);
    const templo        = templos.find(t => t.id === c.templo_id);
    const totalCobrado  = czDelCobrador.reduce((s, cz) => s + cz.monto, 0);
    const miembrosUnicos = [...new Set(czDelCobrador.map(cz => cz.miembro_id))];
    return { ...c, templo, czDelCobrador, totalCobrado, miembrosUnicos };
  });

  const cobradorFiltrado = cobradorSeleccionado
    ? cobradoresConDatos.find(c => c.id === parseInt(cobradorSeleccionado))
    : null;

  const cobradoresParaReporte = cobradorFiltrado ? [cobradorFiltrado] : cobradoresConDatos;

  // Resumen global
  const totalGeneral  = cobranzas.reduce((s, c) => s + c.monto, 0);
  const totalDeuda    = miembros.reduce((s, m) => s + m.deuda, 0);
  const mayores       = miembros.filter(m => m.categoria === 'mayor');
  const menores       = miembros.filter(m => m.categoria === 'menor');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Reportes</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>Cobranzas y estado de deuda</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={cobradorSeleccionado}
            onChange={e => setCobradorSeleccionado(e.target.value)}
            style={{ width: 220 }}
          >
            <option value="">Todos los cobradores</option>
            {cobradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <Button variant="gold" onClick={handlePrint}>⎙ Imprimir reporte</Button>
        </div>
      </div>

      {/* Resumen global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total cobrado', value: fmt(totalGeneral), bg: 'var(--navy)', color: 'var(--white)', sub: `${cobranzas.length} cobranzas` },
          { label: 'Deuda pendiente', value: fmt(totalDeuda), bg: 'var(--white)', color: 'var(--danger)', border: true, sub: 'a recaudar' },
          { label: 'Socios mayores', value: mayores.length, bg: 'var(--white)', color: 'var(--navy)', border: true, sub: `Cuota: ${fmt(configuracion.cuota_mayor)}` },
          { label: 'Socios menores', value: menores.length, bg: 'var(--white)', color: 'var(--navy)', border: true, sub: `Cuota: ${fmt(configuracion.cuota_menor)}` },
        ].map(item => (
          <div key={item.label} style={{
            background: item.bg,
            border: item.border ? '1px solid var(--gray-200)' : 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: item.bg === 'var(--navy)' ? 'rgba(255,255,255,0.5)' : 'var(--gray-400)' }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: item.color, marginTop: 6, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{item.value}</div>
            <div style={{ fontSize: 11, marginTop: 6, color: item.bg === 'var(--navy)' ? 'rgba(255,255,255,0.35)' : 'var(--gray-400)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Contenido a imprimir */}
      <div ref={printRef}>
        {/* Encabezado del reporte (sólo en print) */}
        <div className="header" style={{ display: 'none' }}>
          <img src={logoNavy} alt="Logo" />
          <div>
            <h1>Iglesia Evangélica Unión Pentecostal</h1>
            <h2>Reporte de cobranzas — {new Date().toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })}</h2>
          </div>
        </div>

        {cobradoresParaReporte.map(c => (
          <Card key={c.id} style={{ marginBottom: 20 }}>
            <CardHeader
              title={c.nombre}
              subtitle={`${c.templo?.nombre || '—'} · ${c.czDelCobrador.length} cobranza${c.czDelCobrador.length !== 1 ? 's' : ''}`}
              action={
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total cobrado</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', fontFamily: 'Georgia, serif' }}>{fmt(c.totalCobrado)}</div>
                </div>
              }
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Fecha','N° Recibo','Miembro','Categoría','Monto cobrado','Deuda restante'].map(h => (
                    <th key={h} style={{
                      padding: '10px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--gray-400)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.czDelCobrador.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    Sin cobranzas registradas
                  </td></tr>
                ) : c.czDelCobrador.map(cz => {
                  const miembro = miembros.find(m => m.id === cz.miembro_id);
                  return (
                    <tr key={cz.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '11px 20px', color: 'var(--gray-600)' }}>{cz.fecha}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 4 }}>
                          {cz.numero_recibo}
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px', fontWeight: 600, color: 'var(--navy)' }}>{miembro?.nombre || '—'}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <Badge variant={miembro?.categoria || 'default'}>
                          {miembro?.categoria === 'mayor' ? 'Mayor' : 'Menor'}
                        </Badge>
                      </td>
                      <td style={{ padding: '11px 20px', fontWeight: 700, color: 'var(--success)' }}>{fmt(cz.monto)}</td>
                      <td style={{ padding: '11px 20px', color: miembro?.deuda === 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {miembro ? (miembro.deuda === 0 ? 'Al día ✓' : fmt(miembro.deuda)) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {/* Fila total */}
                {c.czDelCobrador.length > 0 && (
                  <tr className="total-row" style={{ background: 'var(--gold-pale)', borderTop: '2px solid var(--gold)' }}>
                    <td colSpan={4} style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--navy)', fontSize: 13 }}>
                      Total cobrado por {c.nombre}
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
                      {fmt(c.totalCobrado)}
                    </td>
                    <td style={{ padding: '12px 20px' }} />
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        ))}

        <div className="footer" style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'right', marginTop: 8 }}>
          Generado el {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} · Iglesia Evangélica Unión Pentecostal
        </div>
      </div>
    </div>
  );
}
