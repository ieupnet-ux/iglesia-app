import React, { useState } from 'react';
import { Card, Button, Modal, FormField, Badge, Toast } from '../components/UI';

export default function Cobranzas({ data, registrarCobranza, eliminarCobranza }) {
  const { cobranzas, miembros, cobradores, templos, configuracion } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filtroCobradorId, setFiltroCobradorId] = useState('');
  const [busqueda, setBusqueda]   = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    cobrador_id: '',
    miembro_id: '',
    monto: '',
    numero_recibo: '',
    fecha: today,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const miembroSeleccionado = miembros.find(m => m.id === parseInt(form.miembro_id));
  const cuotaMiembro = miembroSeleccionado
    ? (miembroSeleccionado.categoria === 'mayor' ? configuracion.cuota_mayor : configuracion.cuota_menor)
    : 0;

  const handleGuardar = async () => {
    if (!form.cobrador_id || !form.miembro_id || !form.monto || !form.numero_recibo) return;
    setSaving(true);
    try {
      await registrarCobranza({
        cobrador_id:   parseInt(form.cobrador_id),
        miembro_id:    parseInt(form.miembro_id),
        monto:         parseInt(form.monto),
        numero_recibo: form.numero_recibo,
        fecha:         form.fecha,
      });
      setForm({ cobrador_id: '', miembro_id: '', monto: '', numero_recibo: '', fecha: today });
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
      showToast('Cobranza anulada — la deuda del miembro fue revertida');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const filtradas = cobranzas
    .filter(c => !filtroCobradorId || c.cobrador_id === parseInt(filtroCobradorId))
    .filter(c => {
      if (!busqueda) return true;
      const m  = miembros.find(m => m.id === c.miembro_id);
      const co = cobradores.find(co => co.id === c.cobrador_id);
      return (
        c.numero_recibo.toLowerCase().includes(busqueda.toLowerCase()) ||
        m?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        co?.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Cobranzas</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{filtradas.length} de {cobranzas.length} registros</div>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Registrar cobranza</Button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por recibo, miembro, cobrador…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: 280 }}
        />
        <select value={filtroCobradorId} onChange={e => setFiltroCobradorId(e.target.value)} style={{ width: 200 }}>
          <option value="">Todos los cobradores</option>
          {cobradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Fecha','N° Recibo','Cobrador','Templo','Miembro','Categoría','Monto',''].map(h => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--gray-400)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
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
                  <td style={{ padding: '13px 20px', color: 'var(--gray-600)' }}>{c.fecha}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                      color: 'var(--navy)', background: 'var(--gray-100)',
                      padding: '3px 8px', borderRadius: 4,
                    }}>{c.numero_recibo}</span>
                  </td>
                  <td style={{ padding: '13px 20px', fontWeight: 600, color: 'var(--navy)' }}>{cobrador?.nombre || '—'}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--gray-600)' }}>{templo?.nombre || '—'}</td>
                  <td style={{ padding: '13px 20px', fontWeight: 500 }}>{miembro?.nombre || '—'}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <Badge variant={miembro?.categoria || 'default'}>
                      {miembro?.categoria === 'mayor' ? 'Mayor' : miembro?.categoria === 'menor' ? 'Menor' : '—'}
                    </Badge>
                  </td>
                  <td style={{ padding: '13px 20px', fontWeight: 700, color: 'var(--success)' }}>{fmt(c.monto)}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <Button size="sm" variant="ghost" onClick={() => handleEliminar(c)}>Anular</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal nueva cobranza */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar cobranza">
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Cobrador" required>
              <select value={form.cobrador_id} onChange={e => setForm(f => ({ ...f, cobrador_id: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {cobradores.map(c => {
                  const t = templos.find(t => t.id === c.templo_id);
                  return <option key={c.id} value={c.id}>{c.nombre} — {t?.nombre}</option>;
                })}
              </select>
            </FormField>
            <FormField label="Miembro" required>
              <select value={form.miembro_id} onChange={e => setForm(f => ({ ...f, miembro_id: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </FormField>
          </div>

          {/* Info miembro seleccionado */}
          {miembroSeleccionado && (
            <div style={{
              background: miembroSeleccionado.deuda === 0 ? 'var(--success-bg)' : 'var(--warning-bg)',
              borderRadius: 8, padding: '12px 16px', fontSize: 13,
              color: miembroSeleccionado.deuda === 0 ? 'var(--success)' : 'var(--warning)',
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12,
            }}>
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Categoría</div><strong>{miembroSeleccionado.categoria}</strong></div>
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Cuota anual</div><strong>{fmt(cuotaMiembro)}</strong></div>
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Deuda actual</div><strong>{fmt(miembroSeleccionado.deuda)}</strong></div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Monto" required>
              <input
                type="number" min="0" placeholder="0"
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

          <FormField label="Fecha de cobro">
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            />
          </FormField>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={handleGuardar}
              disabled={saving || !form.cobrador_id || !form.miembro_id || !form.monto || !form.numero_recibo}
            >
              {saving ? 'Guardando…' : 'Registrar cobranza'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
