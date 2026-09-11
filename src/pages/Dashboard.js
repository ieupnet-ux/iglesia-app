// v2.0 - porcentajes de recaudacion
import React from 'react';
import { MetricCard, Card, CardHeader } from '../components/UI';
import logoGold from '../assets/logo-gold.png';

export default function Dashboard({ data }) {
  const { miembros, cobradores, cobranzas, templos, deudasAnuales } = data;

  const fmt = (n) => (n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  // ── Cálculos globales usando deudas_anuales ───────────────
  const totalOriginal  = deudasAnuales.reduce((s, d) => s + (d.importe || 0), 0);
  const totalPendiente = deudasAnuales.reduce((s, d) => s + (d.saldo || 0), 0);
  const totalCobrado   = totalOriginal - totalPendiente;
  const porcentajeGlobal = totalOriginal > 0 ? Math.round((totalCobrado / totalOriginal) * 100) : 0;

  // Miembros al día vs con deuda (según saldo pendiente real)
  const miembrosConDeuda = new Set(
    deudasAnuales.filter(d => !d.pagado && d.saldo > 0).map(d => d.miembro_id)
  );
  const conDeuda = miembrosConDeuda.size;
  const sinDeuda = miembros.length - conDeuda;
  const pctAlDia = miembros.length > 0 ? Math.round((sinDeuda / miembros.length) * 100) : 0;

  const ultimasCobranzas = [...cobranzas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.id - a.id)
    .slice(0, 8);

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--navy)', borderRadius: 'var(--radius-lg)',
        padding: '32px 36px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, opacity: 0.06 }}>
          <img src={logoGold} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            Panel de gestión
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--white)', lineHeight: 1.2 }}>
            Iglesia Evangélica<br />Unión Pentecostal
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            {templos.length} templo{templos.length !== 1 ? 's' : ''} registrado{templos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Círculo de porcentaje global */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: `conic-gradient(var(--gold) ${porcentajeGlobal * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', background: 'var(--navy)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{porcentajeGlobal}%</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Recaudado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas con porcentajes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard label="Total miembros" value={miembros.length}
          sub={`${sinDeuda} al día (${pctAlDia}%) · ${conDeuda} con deuda`} />
        <MetricCard label="Cobradores" value={cobradores.length}
          sub={`en ${templos.length} templo${templos.length !== 1 ? 's' : ''}`} />
        <MetricCard label="Total cobrado" value={fmt(totalCobrado)}
          sub={`${porcentajeGlobal}% del total · ${cobranzas.length} cobranzas`} accent />
        <MetricCard label="Deuda pendiente" value={fmt(totalPendiente)}
          sub={`${100 - porcentajeGlobal}% falta recaudar`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Últimas cobranzas */}
        <Card>
          <CardHeader title="Últimas cobranzas" subtitle={`${cobranzas.length} registradas en total`} />
          <div style={{ padding: '0 0 4px' }}>
            {ultimasCobranzas.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                Aún no hay cobranzas registradas
              </div>
            ) : ultimasCobranzas.map(c => {
              const miembro  = miembros.find(m => m.id === c.miembro_id);
              const cobrador = cobradores.find(co => co.id === c.cobrador_id);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{miembro?.nombre || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
                      {cobrador?.nombre} · Rec. {c.numero_recibo} · {c.fecha}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                    {fmt(c.monto)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Estado por templo con porcentaje */}
        <Card>
          <CardHeader title="Recaudación por templo" subtitle="Porcentaje cobrado del total" />
          <div style={{ padding: '8px 0 4px' }}>
            {templos.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                No hay templos configurados
              </div>
            ) : templos.map(t => {
              const idsMiembros = miembros.filter(m => m.templo_id === t.id).map(m => m.id);
              const deudasT     = deudasAnuales.filter(d => idsMiembros.includes(d.miembro_id));
              const originalT   = deudasT.reduce((s, d) => s + (d.importe || 0), 0);
              const pendienteT  = deudasT.reduce((s, d) => s + (d.saldo || 0), 0);
              const cobradoT    = originalT - pendienteT;
              const pct         = originalT > 0 ? Math.round((cobradoT / originalT) * 100) : 0;
              const color = pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--gold)' : 'var(--danger)';

              return (
                <div key={t.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{t.nombre}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {idsMiembros.length} miembro{idsMiembros.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--success)' }}>Cobrado: {fmt(cobradoT)}</span>
                    <span style={{ color: 'var(--danger)' }}>Pendiente: {fmt(pendienteT)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
