import React, { useState } from 'react';
import { Card, Button, Modal, FormField, Toast } from '../components/UI';

export default function Cobradores({ data, agregarCobrador, eliminarCobrador }) {
  const { cobradores, templos, cobranzas } = data;
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

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Cobradores</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{cobradores.length} registrados</div>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuevo cobrador</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {cobradores.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)' }}>
            No hay cobradores registrados aún
          </div>
        ) : cobradores.map(c => {
          const templo      = templos.find(t => t.id === c.templo_id);
          const czCobrador  = cobranzas.filter(cz => cz.cobrador_id === c.id);
          const ultimo      = czCobrador[0];

          return (
            <Card key={c.id}>
              {/* Header card cobrador */}
              <div style={{
                background: 'var(--navy)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif',
                  fontSize: 18, fontWeight: 700,
                  color: 'var(--navy)',
                  flexShrink: 0,
                }}>
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {templo?.nombre || '—'}
                  </div>
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total cobrado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{fmt(c.total_cobrado)}</div>
                  </div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cobranzas</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{c.cobranzas_registradas}</div>
                  </div>
                </div>

                {ultimo && (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 14 }}>
                    Último recibo: <strong>{ultimo.numero_recibo}</strong> — {ultimo.fecha}
                  </div>
                )}

                <Button size="sm" variant="ghost" onClick={() => handleEliminar(c)} style={{ width: '100%' }}>
                  Eliminar cobrador
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar cobrador">
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Nombre del cobrador" required>
            <input
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
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
