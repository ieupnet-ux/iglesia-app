import React, { useState } from 'react';
import { Card, Badge, Button, Modal, FormField, DeudaBar, Toast } from '../components/UI';

export default function Miembros({ data, agregarMiembro, eliminarMiembro }) {
  const { miembros, templos, configuracion } = data;
  const [modalOpen, setModalOpen]   = useState(false);
  const [filtroTemplo, setFiltro]   = useState('');
  const [filtroCat, setFiltroCat]   = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [toast, setToast]           = useState(null);
  const [saving, setSaving]         = useState(false);

  const [form, setForm] = useState({ nombre: '', categoria: 'mayor', templo_id: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return;
    if (!form.templo_id) return;
    setSaving(true);
    try {
      await agregarMiembro({ ...form, templo_id: parseInt(form.templo_id) });
      setForm({ nombre: '', categoria: 'mayor', templo_id: '' });
      setModalOpen(false);
      showToast('Miembro agregado correctamente');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (m) => {
    if (!window.confirm(`¿Eliminar a ${m.nombre}?`)) return;
    try {
      await eliminarMiembro(m.id);
      showToast('Miembro eliminado');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const filtrados = miembros
    .filter(m => !filtroTemplo || m.templo_id === parseInt(filtroTemplo))
    .filter(m => !filtroCat   || m.categoria === filtroCat)
    .filter(m => !busqueda    || m.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const cuotaMiembro = (m) => m.categoria === 'mayor' ? configuracion.cuota_mayor : configuracion.cuota_menor;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Miembros</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
            {filtrados.length} de {miembros.length} registros
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuevo miembro</Button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: 220 }}
        />
        <select value={filtroTemplo} onChange={e => setFiltro(e.target.value)} style={{ width: 180 }}>
          <option value="">Todos los templos</option>
          {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} style={{ width: 160 }}>
          <option value="">Todas las categorías</option>
          <option value="mayor">Mayor</option>
          <option value="menor">Menor</option>
        </select>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Nombre','Categoría','Templo','Cuota anual','Estado deuda','Deuda pendiente',''].map(h => (
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
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                No hay miembros que coincidan con los filtros
              </td></tr>
            ) : filtrados.map(m => {
              const templo = templos.find(t => t.id === m.templo_id);
              const cuota  = cuotaMiembro(m);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--navy)' }}>{m.nombre}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge variant={m.categoria}>{m.categoria === 'mayor' ? 'Mayor' : 'Menor'}</Badge>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--gray-600)' }}>{templo?.nombre || '—'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--gray-600)' }}>{fmt(cuota)}</td>
                  <td style={{ padding: '14px 20px', minWidth: 140 }}>
                    <DeudaBar deuda={m.deuda} cuota={cuota} />
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: m.deuda === 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {m.deuda === 0 ? 'Al día ✓' : fmt(m.deuda)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Button size="sm" variant="ghost" onClick={() => handleEliminar(m)}>Eliminar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal nuevo miembro */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar nuevo miembro">
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Nombre completo" required>
            <input
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Categoría" required>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="mayor">Mayor — {fmt(configuracion.cuota_mayor)}</option>
                <option value="menor">Menor — {fmt(configuracion.cuota_menor)}</option>
              </select>
            </FormField>
            <FormField label="Templo" required>
              <select value={form.templo_id} onChange={e => setForm(f => ({ ...f, templo_id: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--gray-600)' }}>
            La deuda inicial se asignará automáticamente según la cuota anual de la categoría seleccionada.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={saving || !form.nombre.trim() || !form.templo_id}>
              {saving ? 'Guardando…' : 'Agregar miembro'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
