// v2.0 - deudas anuales
import React, { useState } from 'react';
import { Card, Button, Modal, FormField, Badge, Toast } from '../components/UI';

export default function Cobranzas({ data, registrarCobranza, eliminarCobranza, perfilActual }) {
  const { cobranzas, miembros, cobradores, templos, deudasAnuales } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filtroCobradorId, setFiltroCobradorId] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [busqueda, setBusqueda]   = useState('');

  const today = new Date().toISOString().split('T')[0];
  const anioActual = new Date().getFullYear();

  const [form, setForm] = useState({
    cobrador_id: '',
    miembro_id: '',
    deuda_anual_id: '',
    monto: '',
    numero_recibo: '',
    fecha: today,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Deudas del miembro seleccionado (ordenadas por año desc)
  const deudasDelMiembro = form.miembro_id
    ? deudasAnuales
        .filter(d => d.miembro_id === parseInt(form.miembro_id) && !d.pagado)
        .sort((a, b) => b.anio - a.anio)
    : [];

  const deudaSeleccionada = deudasAnuales.find(d => d.id === parseInt(form.deuda_anual_id));

  // Al cambiar miembro, limpiar deuda seleccionada
  const handleMiembroChange = (miembro_id) => {
    setForm(f => ({ ...f, miembro_id, deuda_anual_id: '', monto: '' }));
  };

  // Al seleccionar año/deuda, prellenar el monto con el saldo pendiente
  const handleDeudaChange = (deuda_anual_id) => {
    const deuda = deudasAnuales.find(d => d.id === parseInt(deuda_anual_id));
    setForm(f => ({ ...f, deuda_anual_id, monto: deuda ? deuda.saldo : '' }));
  };

  const handleGuardar = async () => {
    if (!form.cobrador_id || !form.miembro_id || !form.deuda_anual_id || !form.monto || !form.numero_recibo) return;
    const deuda = deudasAnuales.find(d => d.id === parseInt(form.deuda_anual_id));
    setSaving(true);
    try {
      await registrarCobranza({
        cobrador_id:   parseInt(form.cobrador_id),
        miembro_id:    parseInt(form.miembro_id),
        deuda_anual_id: parseInt(form.deuda_anual_id),
        anio:          deuda?.anio,
        monto:         parseInt(form.monto),
        numero_recibo: form.numero_recibo,
        fecha:         form.fecha,
      });
      setForm({ cobrador_id: form.cobrador_id, miembro_id: '', deuda_anual_id: '', monto: '', numero_recibo: '', fecha: today });
      setModalOpen(false);
      showToast('Cobranza registrada correctamente');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (cz) => {
    if (!window.confirm(`¿Anular cobranza ${cz.numero_recibo}?`)) return;
    try {
      await eliminarCobranza(cz);
      showToast('Cobranza anulada — el saldo del año fue revertido');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const fmt = (n) => n?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  // Años disponibles para filtro
  const aniosDisponibles = [...new Set(cobranzas.map(c => c.anio).filter(Boolean))].sort((a,b) => b - a);

  const filtradas = cobranzas
    .filter(c => !filtroCobradorId || c.cobrador_id === parseInt(filtroCobradorId))
    .filter(c => !filtroAnio || c.anio === parseInt(filtroAnio))
    .filter(c => {
      if (!busqueda) return true;
      const m  = miembros.find(m => m.id === c.miembro_id);
      const co = cobradores.find(co => co.id === c.cobrador_id);
      return (
        c.numero_recibo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        co?.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    });

  const miembroSeleccionado = miembros.find(m => m.id === parseInt(form.miembro_id));

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Cobranzas</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{filtradas.length} de {cobranzas.length} registros</div>
        </div>
        {registrarCobranza && <Button onClick={() => setModalOpen(true)}>+ Registrar cobranza</Button>}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por recibo, miembro, cobrador…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: 260 }}
        />
        <select value={filtroCobradorId} onChange={e => setFiltroCobradorId(e.target.value)} style={{ width: 190 }}>
          <option value="">Todos los cobradores</option>
          {cobradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} style={{ width: 140 }}>
          <option value="">Todos los años</option>
          {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Fecha','N° Recibo','Año abonado','Cobrador','Templo','Miembro','Categoría','Monto',''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--gray-400)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                No hay cobranzas que coincidan
              </td></tr>
            ) : filtradas.map(c => {
              const miembro  = miembros.find(m => m.id === c.miembro_id);
              const cobrador = cobradores.find(co => co.id === c.cobrador_id);
              const templo   = templos.find(t => t.id === cobrador?.templo_id);
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13 }}>{c.fecha}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                      color: 'var(--navy)', background: 'var(--gray-100)',
                      padding: '3px 8px', borderRadius: 4,
                    }}>{c.numero_recibo}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: 'var(--gold-pale)', color: 'var(--warning)',
                      fontWeight: 700, fontSize: 13,
                      padding: '3px 10px', borderRadius: 99,
                    }}>{c.anio || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy)' }}>{cobrador?.nombre || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13 }}>{templo?.nombre || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{miembro?.nombre || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={miembro?.categoria || 'default'}>
                      {miembro?.categoria === 'mayor' ? 'Mayor' : miembro?.categoria === 'menor' ? 'Menor' : '—'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--success)' }}>{fmt(c.monto)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {eliminarCobranza && (
                      <Button size="sm" variant="ghost" onClick={() => handleEliminar(c)}>Anular</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal nueva cobranza */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar cobranza" width={520}>
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Cobrador */}
          <FormField label="Cobrador" required>
            <select value={form.cobrador_id} onChange={e => setForm(f => ({ ...f, cobrador_id: e.target.value }))}>
              <option value="">Seleccionar cobrador…</option>
              {cobradores.map(c => {
                const t = templos.find(t => t.id === c.templo_id);
                return <option key={c.id} value={c.id}>{c.nombre} — {t?.nombre}</option>;
              })}
            </select>
          </FormField>

          {/* Miembro */}
          <FormField label="Miembro" required>
            <select value={form.miembro_id} onChange={e => handleMiembroChange(e.target.value)}>
              <option value="">Seleccionar miembro…</option>
              {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </FormField>

          {/* Año que abona */}
          {form.miembro_id && (
            <FormField label="Año que abona" required>
              {deudasDelMiembro.length === 0 ? (
                <div style={{
                  background: 'var(--success-bg)', color: 'var(--success)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13,
                }}>
                  ✓ Este miembro no tiene deudas pendientes
                </div>
              ) : (
                <select value={form.deuda_anual_id} onChange={e => handleDeudaChange(e.target.value)}>
                  <option value="">Seleccionar año…</option>
                  {deudasDelMiembro.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.anio} — Saldo pendiente: ${d.saldo.toLocaleString('es-AR')} (cuota: ${d.importe.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          )}

          {/* Info deuda seleccionada */}
          {deudaSeleccionada && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
              background: 'var(--warning-bg)', borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--gray-400)', marginBottom: 2 }}>Año</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{deudaSeleccionada.anio}</div>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--gray-400)', marginBottom: 2 }}>Cuota original</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmt(deudaSeleccionada.importe)}</div>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--gray-400)', marginBottom: 2 }}>Saldo pendiente</div>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(deudaSeleccionada.saldo)}</div>
              </div>
            </div>
          )}

          {/* Monto y recibo */}
          {form.deuda_anual_id && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Monto que paga" required>
                <input
                  type="number" min="1"
                  max={deudaSeleccionada?.saldo}
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                />
              </FormField>
              <FormField label="N° Recibo (talonario)" required>
                <input
                  placeholder="Ej: T01-00123"
                  value={form.numero_recibo}
                  onChange={e => setForm(f => ({ ...f, numero_recibo: e.target.value }))}
                />
              </FormField>
            </div>
          )}

          {form.deuda_anual_id && (
            <FormField label="Fecha de cobro">
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </FormField>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={handleGuardar}
              disabled={saving || !form.cobrador_id || !form.miembro_id || !form.deuda_anual_id || !form.monto || !form.numero_recibo}
            >
              {saving ? 'Guardando…' : 'Registrar cobranza'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
