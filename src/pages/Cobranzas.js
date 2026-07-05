// v3.0 - cobro multi-año
import React, { useState } from 'react';
import { Card, Button, Modal, FormField, Badge, Toast } from '../components/UI';

export default function Cobranzas({ data, registrarCobranza, eliminarCobranza }) {
  const { cobranzas, miembros, cobradores, templos, deudasAnuales } = data;
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filtroCobradorId, setFiltroCobradorId] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [busqueda, setBusqueda]   = useState('');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    cobrador_id:   '',
    miembro_id:    '',
    numero_recibo: '',
    fecha:         today,
    aniosSeleccionados: {}, // { deuda_anual_id: monto }
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Deudas pendientes del miembro seleccionado ordenadas por año asc (más vieja primero)
  const deudasDelMiembro = form.miembro_id
    ? deudasAnuales
        .filter(d => d.miembro_id === parseInt(form.miembro_id) && !d.pagado)
        .sort((a, b) => a.anio - b.anio)
    : [];

  const handleMiembroChange = (miembro_id) => {
    setForm(f => ({ ...f, miembro_id, aniosSeleccionados: {} }));
  };

  // Seleccionar/deseleccionar un año con su saldo completo
  const toggleAnio = (deudaId, saldo) => {
    setForm(f => {
      const sel = { ...f.aniosSeleccionados };
      if (sel[deudaId] !== undefined) {
        delete sel[deudaId];
      } else {
        sel[deudaId] = saldo;
      }
      return { ...f, aniosSeleccionados: sel };
    });
  };

  // Cambiar monto parcial de un año
  const cambiarMonto = (deudaId, monto) => {
    setForm(f => ({ ...f, aniosSeleccionados: { ...f.aniosSeleccionados, [deudaId]: monto } }));
  };

  // Seleccionar todos los años pendientes
  const seleccionarTodos = () => {
    const todos = {};
    deudasDelMiembro.forEach(d => { todos[d.id] = d.saldo; });
    setForm(f => ({ ...f, aniosSeleccionados: todos }));
  };

  const totalACobrar = Object.values(form.aniosSeleccionados)
    .reduce((s, m) => s + (parseInt(m) || 0), 0);

  const aniosSeleccionadosCount = Object.keys(form.aniosSeleccionados).length;

  const handleGuardar = async () => {
    if (!form.cobrador_id || !form.miembro_id || !form.numero_recibo || aniosSeleccionadosCount === 0) return;
    setSaving(true);
    try {
      // Registrar una cobranza por cada año seleccionado
      for (const [deudaId, monto] of Object.entries(form.aniosSeleccionados)) {
        if (!monto || parseInt(monto) === 0) continue;
        const deuda = deudasAnuales.find(d => d.id === parseInt(deudaId));
        await registrarCobranza({
          cobrador_id:    parseInt(form.cobrador_id),
          miembro_id:     parseInt(form.miembro_id),
          deuda_anual_id: parseInt(deudaId),
          anio:           deuda?.anio,
          monto:          parseInt(monto),
          numero_recibo:  form.numero_recibo,
          fecha:          form.fecha,
        });
      }
      setForm({ cobrador_id: form.cobrador_id, miembro_id: '', aniosSeleccionados: {}, numero_recibo: '', fecha: today });
      setModalOpen(false);
      showToast(`Cobranza registrada — ${aniosSeleccionadosCount} año${aniosSeleccionadosCount > 1 ? 's' : ''} abonado${aniosSeleccionadosCount > 1 ? 's' : ''}`);
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
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--navy)', background: 'var(--gray-100)', padding: '3px 8px', borderRadius: 4 }}>
                      {c.numero_recibo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'var(--gold-pale)', color: 'var(--warning)', fontWeight: 700, fontSize: 13, padding: '3px 10px', borderRadius: 99 }}>
                      {c.anio || '—'}
                    </span>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar cobranza" width={540}>
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Cobrador y miembro */}
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
              <select value={form.miembro_id} onChange={e => handleMiembroChange(e.target.value)}>
                <option value="">Seleccionar…</option>
                {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </FormField>
          </div>

          {/* Años adeudados */}
          {form.miembro_id && (
            <FormField label="Años a abonar">
              {deudasDelMiembro.length === 0 ? (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  ✓ Este miembro no tiene deudas pendientes
                </div>
              ) : (
                <div style={{ border: '1.5px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Encabezado con botón seleccionar todos */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--gray-50)',
                    borderBottom: '1px solid var(--gray-200)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>
                      {deudasDelMiembro.length} año{deudasDelMiembro.length > 1 ? 's' : ''} pendiente{deudasDelMiembro.length > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={seleccionarTodos}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: 'var(--navy)',
                        textDecoration: 'underline', padding: 0,
                      }}
                    >
                      Seleccionar todos
                    </button>
                  </div>

                  {/* Lista de años */}
                  {deudasDelMiembro.map(d => {
                    const seleccionado = form.aniosSeleccionados[d.id] !== undefined;
                    return (
                      <div key={d.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 60px 1fr 1fr',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--gray-100)',
                        background: seleccionado ? 'rgba(28,43,75,0.03)' : 'transparent',
                      }}>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => toggleAnio(d.id, d.saldo)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        {/* Año */}
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: seleccionado ? 'var(--navy)' : 'var(--gray-600)',
                        }}>{d.anio}</span>
                        {/* Saldo */}
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          <div>Cuota: {fmt(d.importe)}</div>
                          <div style={{ color: 'var(--danger)', fontWeight: 600 }}>Debe: {fmt(d.saldo)}</div>
                        </div>
                        {/* Input monto */}
                        {seleccionado ? (
                          <input
                            type="number"
                            min="1"
                            max={d.saldo}
                            value={form.aniosSeleccionados[d.id]}
                            onChange={e => cambiarMonto(d.id, e.target.value)}
                            style={{ fontSize: 13, padding: '5px 8px' }}
                          />
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--gray-200)', textAlign: 'right' }}>—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </FormField>
          )}

          {/* Total a cobrar */}
          {aniosSeleccionadosCount > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12, background: 'var(--navy)', borderRadius: 10, padding: '14px 16px',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Años seleccionados</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>{aniosSeleccionadosCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Total a cobrar</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{fmt(totalACobrar)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Un solo recibo</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  {form.numero_recibo || '—'}
                </div>
              </div>
            </div>
          )}

          {/* Recibo y fecha */}
          {form.miembro_id && deudasDelMiembro.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="N° Recibo (talonario)" required>
                <input
                  placeholder="Ej: T01-00123"
                  value={form.numero_recibo}
                  onChange={e => setForm(f => ({ ...f, numero_recibo: e.target.value }))}
                />
              </FormField>
              <FormField label="Fecha de cobro">
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
              </FormField>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={handleGuardar}
              disabled={saving || !form.cobrador_id || !form.miembro_id || aniosSeleccionadosCount === 0 || !form.numero_recibo || totalACobrar === 0}
            >
              {saving
                ? 'Registrando…'
                : aniosSeleccionadosCount > 1
                  ? `Registrar ${aniosSeleccionadosCount} años — ${fmt(totalACobrar)}`
                  : `Registrar cobranza — ${fmt(totalACobrar)}`
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
