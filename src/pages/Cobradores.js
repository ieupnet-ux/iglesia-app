// v3.0 - porcentaje de recaudacion por cobrador/templo
import React, { useState } from 'react';
import { Card, Button, Modal, FormField, Toast } from '../components/UI';

export default function Cobradores({ data, agregarCobrador, eliminarCobrador }) {
  const { cobradores, templos, cobranzas, miembros, deudasAnuales } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState({ nombre: '', templo_id: '' });
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.templo_id) return;
    setSaving(true);
    try {
      await agregarCobrador({ nombre: form.nombre, templo_id: parseInt(form.templo_id) });
      setForm({ nombre: '', templo_id: '' });
      setModalOpen(false);
      showToast('Cobrador registrado correctamente');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (c) => {
    if (!window.confirm(`¿Eliminar al cobrador ${c.nombre}?`)) return;
    try {
      await eliminarCobrador(c.id);
      showToast('Cobrador eliminado');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const fmt = (n) => (n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  // ── Cálculo de recaudación por templo ─────────────────────
  // Para un templo: total original de deudas vs saldo pendiente
  const recaudacionTemplo = (temploId) => {
    if (!temploId) {
      // Cobrador sin templo (cobra en todos) — usar todo el sistema
      const totalOriginal = deudasAnuales.reduce((s, d) => s + (d.importe || 0), 0);
      const totalPendiente = deudasAnuales.reduce((s, d) => s + (d.saldo || 0), 0);
      const cobrado = totalOriginal - totalPendiente;
      return { totalOriginal, totalPendiente, cobrado };
    }
    // Miembros de ese templo
    const idsMiembros = miembros.filter(m => m.templo_id === temploId).map(m => m.id);
    const deudasTemplo = deudasAnuales.filter(d => idsMiembros.includes(d.miembro_id));
    const totalOriginal  = deudasTemplo.reduce((s, d) => s + (d.importe || 0), 0);
    const totalPendiente = deudasTemplo.reduce((s, d) => s + (d.saldo || 0), 0);
    const cobrado = totalOriginal - totalPendiente;
    return { totalOriginal, totalPendiente, cobrado };
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Cobradores</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{cobradores.length} registrados</div>
        </div>
        {agregarCobrador && <Button onClick={() => setModalOpen(true)}>+ Nuevo cobrador</Button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {cobradores.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)' }}>
            No hay cobradores registrados aún
          </div>
        ) : cobradores.map(c => {
          const templo = templos.find(t => t.id === c.templo_id);

          // Totales del cobrador (lo que él registró)
          const czCobrador   = cobranzas.filter(cz => cz.cobrador_id === c.id);
          const totalCobrado = czCobrador.reduce((s, cz) => s + (cz.monto || 0), 0);
          const cantidad     = czCobrador.length;
          const ultimo = [...czCobrador].sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.id - a.id)[0];

          // Recaudación del templo
          const rec = recaudacionTemplo(c.templo_id);
          const porcentajeCobrado = rec.totalOriginal > 0
            ? Math.round((rec.cobrado / rec.totalOriginal) * 100)
            : 0;
          const porcentajeFalta = 100 - porcentajeCobrado;

          // Color de la barra según el porcentaje
          const colorBarra = porcentajeCobrado >= 75 ? 'var(--success)'
            : porcentajeCobrado >= 40 ? 'var(--gold)'
            : 'var(--danger)';

          return (
            <Card key={c.id}>
              <div style={{ background: 'var(--navy)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--navy)', flexShrink: 0,
                }}>
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {templo?.nombre || 'Todos los templos'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total cobrado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{fmt(totalCobrado)}</div>
                  </div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cobranzas</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{cantidad}</div>
                  </div>
                </div>

                {/* Barra de recaudación del templo */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Recaudación del templo
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: colorBarra }}>{porcentajeCobrado}%</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${porcentajeCobrado}%`,
                      background: colorBarra, borderRadius: 99,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: 'var(--success)' }}>
                      Cobrado: {fmt(rec.cobrado)}
                    </span>
                    <span style={{ color: 'var(--danger)' }}>
                      Falta: {fmt(rec.totalPendiente)} ({porcentajeFalta}%)
                    </span>
                  </div>
                </div>

                {ultimo && (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 14 }}>
                    Último recibo: <strong>{ultimo.numero_recibo}</strong> — {ultimo.fecha}
                  </div>
                )}

                {eliminarCobrador && (
                  <Button size="sm" variant="ghost" onClick={() => handleEliminar(c)} style={{ width: '100%' }}>
                    Eliminar cobrador
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar cobrador">
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Nombre del cobrador" required>
            <input placeholder="Nombre y apellido" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </FormField>
          <FormField label="Templo asignado" required>
            <select value={form.templo_id} onChange={e => setForm(f => ({ ...f, templo_id: e.target.value }))}>
              <option value="">Seleccionar templo…</option>
              {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={saving || !form.nombre.trim() || !form.templo_id}>
              {saving ? 'Guardando…' : 'Agregar cobrador'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
