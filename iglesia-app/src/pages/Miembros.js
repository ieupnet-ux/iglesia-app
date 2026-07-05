import React, { useState } from 'react';
import { Card, Badge, Button, Modal, FormField, Toast } from '../components/UI';

export default function Miembros({ data, agregarMiembro, eliminarMiembro, agregarDeudaManual, generarDeudasAnio }) {
  const { miembros, templos, configuracion, deudasAnuales } = data;
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalDeuda, setModalDeuda]     = useState(false);
  const [modalGenerar, setModalGenerar] = useState(false);
  const [miembroDeuda, setMiembroDeuda] = useState(null);
  const [filtroTemplo, setFiltro]       = useState('');
  const [filtroCat, setFiltroCat]       = useState('');
  const [busqueda, setBusqueda]         = useState('');
  const [toast, setToast]               = useState(null);
  const [saving, setSaving]             = useState(false);
  const [anioGenerar, setAnioGenerar]   = useState(new Date().getFullYear());

  const [form, setForm]         = useState({ nombre: '', categoria: 'mayor', templo_id: '' });
  const [formDeuda, setFormDeuda] = useState({ anio: new Date().getFullYear(), importe: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fmt = (n) => n?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.templo_id) return;
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

  const handleAgregarDeuda = async () => {
    if (!miembroDeuda || !formDeuda.anio || !formDeuda.importe) return;
    setSaving(true);
    try {
      await agregarDeudaManual({
        miembro_id: miembroDeuda.id,
        anio: parseInt(formDeuda.anio),
        importe: parseInt(formDeuda.importe),
      });
      setModalDeuda(false);
      showToast(`Deuda ${formDeuda.anio} agregada a ${miembroDeuda.nombre}`);
    } catch (e) {
      showToast(e.message || 'Ya existe una deuda para ese año', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerarAnio = async () => {
    setSaving(true);
    try {
      await generarDeudasAnio(parseInt(anioGenerar));
      setModalGenerar(false);
      showToast(`Deudas ${anioGenerar} generadas para todos los miembros`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtrados = miembros
    .filter(m => !filtroTemplo || m.templo_id === parseInt(filtroTemplo))
    .filter(m => !filtroCat   || m.categoria === filtroCat)
    .filter(m => !busqueda    || m.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // Calcular deuda total de un miembro (suma de saldos pendientes por año)
  const deudaTotalMiembro = (miembroId) =>
    deudasAnuales.filter(d => d.miembro_id === miembroId && !d.pagado).reduce((s, d) => s + d.saldo, 0);

  const aniosPendientes = (miembroId) =>
    deudasAnuales.filter(d => d.miembro_id === miembroId && !d.pagado).map(d => d.anio).sort();

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
        <div style={{ display: 'flex', gap: 10 }}>
          {generarDeudasAnio && (
            <Button variant="ghost" onClick={() => setModalGenerar(true)}>⊞ Generar deudas año</Button>
          )}
          {agregarMiembro && (
            <Button onClick={() => setModalOpen(true)}>+ Nuevo miembro</Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar por nombre…" value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: 220 }} />
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
              {['Nombre','Categoría','Templo','Años con deuda','Deuda total','Acciones'].map(h => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--gray-400)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                No hay miembros que coincidan
              </td></tr>
            ) : filtrados.map(m => {
              const templo  = templos.find(t => t.id === m.templo_id);
              const deuda   = deudaTotalMiembro(m.id);
              const anios   = aniosPendientes(m.id);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--navy)' }}>{m.nombre}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge variant={m.categoria}>{m.categoria === 'mayor' ? 'Mayor' : 'Menor'}</Badge>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--gray-600)', fontSize: 13 }}>{templo?.nombre || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {anios.length === 0 ? (
                      <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Al día</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {anios.map(a => (
                          <span key={a} style={{
                            background: 'var(--danger-bg)', color: 'var(--danger)',
                            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: deuda === 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {deuda === 0 ? 'Sin deuda' : fmt(deuda)}
                  </td>
                  <td style={{ padding: '14px 20px', display: 'flex', gap: 6 }}>
                    {agregarDeudaManual && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setMiembroDeuda(m);
                        setFormDeuda({ anio: new Date().getFullYear(), importe: m.categoria === 'mayor' ? configuracion.cuota_mayor : configuracion.cuota_menor });
                        setModalDeuda(true);
                      }}>+ Deuda</Button>
                    )}
                    {eliminarMiembro && (
                      <Button size="sm" variant="ghost" onClick={() => handleEliminar(m)}>Eliminar</Button>
                    )}
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
            <input placeholder="Nombre y apellido" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
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
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--gray-600)' }}>
            Se generará automáticamente la deuda para el año {new Date().getFullYear()} con la cuota correspondiente.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={saving || !form.nombre.trim() || !form.templo_id}>
              {saving ? 'Guardando…' : 'Agregar miembro'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal agregar deuda manual */}
      <Modal open={modalDeuda} onClose={() => setModalDeuda(false)} title={`Agregar deuda a ${miembroDeuda?.nombre}`}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--gray-600)' }}>
            Usá esto para cargar deudas de años anteriores que no estaban registradas en el sistema.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Año" required>
              <input type="number" min="2000" max="2099" value={formDeuda.anio} onChange={e => setFormDeuda(f => ({ ...f, anio: e.target.value }))} />
            </FormField>
            <FormField label="Importe de ese año" required>
              <input type="number" min="0" value={formDeuda.importe} onChange={e => setFormDeuda(f => ({ ...f, importe: e.target.value }))} />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalDeuda(false)}>Cancelar</Button>
            <Button onClick={handleAgregarDeuda} disabled={saving || !formDeuda.anio || !formDeuda.importe}>
              {saving ? 'Guardando…' : 'Agregar deuda'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal generar deudas para un año */}
      <Modal open={modalGenerar} onClose={() => setModalGenerar(false)} title="Generar deudas anuales">
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: 'var(--warning-bg)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--warning)' }}>
            Esto generará una deuda anual para <strong>todos los miembros</strong> con el importe de cuota actual. Solo genera si no existe ya para ese año.
          </div>
          <FormField label="Año a generar" required>
            <input type="number" min="2000" max="2099" value={anioGenerar} onChange={e => setAnioGenerar(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalGenerar(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleGenerarAnio} disabled={saving}>
              {saving ? 'Generando…' : `Generar deudas ${anioGenerar}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
