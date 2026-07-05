import React from 'react';
import { MetricCard, Card, CardHeader, DeudaBar } from '../components/UI';
import logoGold from '../assets/logo-gold.png';

export default function Dashboard({ data }) {
  const { miembros, cobradores, cobranzas, templos } = data;

  const totalCobrado    = cobranzas.reduce((s, c) => s + c.monto, 0);
  const totalDeuda      = miembros.reduce((s, m) => s + m.deuda, 0);
  const sinDeuda        = miembros.filter(m => m.deuda === 0).length;
  const conDeuda        = miembros.filter(m => m.deuda > 0).length;
  const ultimasCobranzas = cobranzas.slice(0, 8);

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 36px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 200, height: 200, opacity: 0.06,
        }}>
          <img src={logoGold} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: 8,
          }}>
            Panel de gestión
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--white)', lineHeight: 1.2 }}>
            Iglesia Evangélica<br />Unión Pentecostal
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            {templos.length} templo{templos.length !== 1 ? 's' : ''} registrado{templos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard label="Total miembros"  value={miembros.length}           sub={`${sinDeuda} al día · ${conDeuda} con deuda`} />
        <MetricCard label="Cobradores"      value={cobradores.length}         sub={`en ${templos.length} templo${templos.length !== 1 ? 's' : ''}`} />
        <MetricCard label="Total cobrado"   value={fmt(totalCobrado)}         sub={`${cobranzas.length} cobranzas`} accent />
        <MetricCard label="Deuda pendiente" value={fmt(totalDeuda)}           sub="a recaudar" />
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
                <div key={c.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--gray-100)',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                      {miembro?.nombre || '—'}
                    </div>
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

        {/* Estado por templo */}
        <Card>
          <CardHeader title="Estado por templo" />
          <div style={{ padding: '8px 0 4px' }}>
            {templos.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                No hay templos configurados
              </div>
            ) : templos.map(t => {
              const miembrosT = miembros.filter(m => m.templo_id === t.id);
              const deudaT    = miembrosT.reduce((s, m) => s + m.deuda, 0);
              const cobradoT  = cobranzas
                .filter(cz => {
                  const mb = miembros.find(m => m.id === cz.miembro_id);
                  return mb?.templo_id === t.id;
                })
                .reduce((s, cz) => s + cz.monto, 0);
              const total = deudaT + cobradoT;
              return (
                <div key={t.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{t.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                      {miembrosT.length} miembro{miembrosT.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <DeudaBar deuda={deudaT} cuota={total || 1} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--gray-400)' }}>
                    <span>Cobrado: {fmt(cobradoT)}</span>
                    <span>Pendiente: {fmt(deudaT)}</span>
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
