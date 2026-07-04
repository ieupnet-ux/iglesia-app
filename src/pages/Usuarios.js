import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, Button, Modal, FormField, Badge, Toast } from '../components/UI';

const ROL_CONFIG = {
  admin:    { label: 'Admin',    variant: 'navy',    desc: 'Acceso total al sistema' },
  cobrador: { label: 'Cobrador', variant: 'gold',    desc: 'Solo su templo asignado' },
  consulta: { label: 'Consulta', variant: 'success', desc: 'Solo lectura, todos los datos' },
};

export default function Usuarios({ data }) {
  const { templos } = data;
  const [usuarios, setUsuarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'cobrador', templo_id: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    const { data: perfiles, error } = await supabase
      .from('perfiles')
      .select('*, templos(nombre)')
      .order('nombre');
    if (!error) setUsuarios(perfiles || []);
    setLoading(false);
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleCrearUsuario = async () => {
    if (!form.nombre || !form.email || !form.password || !form.rol) return;
    setSaving(true);
    try {
      // Crear usuario en Supabase Auth (como admin usando la API de administración)
      // En producción esto requiere el service_role key en backend.
      // Con la anon key, usamos signUp normal + metadata para rol
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre: form.nombre,
            rol: form.rol,
          },
        },
      });
      if (authError) throw authError;

      // Actualizar perfil con templo si corresponde
      if (authData.user && form.templo_id) {
        await supabase.from('perfiles')
          .update({ templo_id: parseInt(form.templo_id), nombre: form.nombre, rol: form.rol })
          .eq('id', authData.user.id);
      }

      setForm({ nombre: '', email: '', password: '', rol: 'cobrador', templo_id: '' });
      setModalOpen(false);
      showToast('Usuario creado. Debe confirmar su email para ingresar.');
      await cargarUsuarios();
    } catch (e) {
      const msgs = {
        'User already registered': 'Ya existe un usuario con ese email.',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      };
      showToast(msgs[e.message] || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (usuario) => {
    const nuevoEstado = !usuario.activo;
    const { error } = await supabase
      .from('perfiles')
      .update({ activo: nuevoEstado })
      .eq('id', usuario.id);
    if (!error) {
      showToast(`Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`);
      await cargarUsuarios();
    }
  };

  const handleCambiarRol = async (usuario, nuevoRol) => {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', usuario.id);
    if (!error) {
      showToast('Rol actualizado');
      await cargarUsuarios();
    }
  };

  const handleCambiarTemplo = async (usuario, templo_id) => {
    const { error } = await supabase
      .from('perfiles')
      .update({ templo_id: templo_id ? parseInt(templo_id) : null })
      .eq('id', usuario.id);
    if (!error) {
      showToast('Templo asignado actualizado');
      await cargarUsuarios();
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Usuarios del sistema</h2>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuevo usuario</Button>
      </div>

      {/* Descripción de roles */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {Object.entries(ROL_CONFIG).map(([key, r]) => (
          <div key={key} style={{
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: key === 'admin' ? 'rgba(28,43,75,0.10)' : key === 'cobrador' ? 'var(--gold-pale)' : 'var(--success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              {key === 'admin' ? '🛡' : key === 'cobrador' ? '💼' : '👁'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Usuario','Email','Rol','Templo asignado','Estado','Acciones'].map(h => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--gray-400)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                Cargando usuarios…
              </td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                No hay usuarios registrados
              </td></tr>
            ) : usuarios.map(u => {
              const rc = ROL_CONFIG[u.rol] || ROL_CONFIG.consulta;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Nombre con avatar */}
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(28,43,75,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--navy)',
                        flexShrink: 0,
                      }}>
                        {u.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{u.nombre}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '13px 20px', color: 'var(--gray-600)', fontSize: 13 }}>
                    {u.email || '—'}
                  </td>

                  {/* Rol editable */}
                  <td style={{ padding: '13px 20px' }}>
                    <select
                      value={u.rol}
                      onChange={e => handleCambiarRol(u, e.target.value)}
                      style={{
                        fontSize: 12, padding: '4px 8px',
                        border: '1.5px solid var(--gray-200)',
                        borderRadius: 6, background: 'var(--white)',
                        fontWeight: 600, cursor: 'pointer',
                        color: u.rol === 'admin' ? 'var(--navy)' : u.rol === 'cobrador' ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="cobrador">Cobrador</option>
                      <option value="consulta">Consulta</option>
                    </select>
                  </td>

                  {/* Templo editable */}
                  <td style={{ padding: '13px 20px' }}>
                    <select
                      value={u.templo_id || ''}
                      onChange={e => handleCambiarTemplo(u, e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', border: '1.5px solid var(--gray-200)', borderRadius: 6, background: 'var(--white)' }}
                    >
                      <option value="">Sin asignar</option>
                      {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '13px 20px' }}>
                    <Badge variant={u.activo ? 'success' : 'danger'}>
                      {u.activo ? 'Activo' : 'Deshabilitado'}
                    </Badge>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '13px 20px' }}>
                    <Button
                      size="sm"
                      variant={u.activo ? 'ghost' : 'success'}
                      onClick={() => handleToggleActivo(u)}
                    >
                      {u.activo ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal nuevo usuario */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear nuevo usuario">
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Nombre completo" required>
            <input
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              placeholder="usuario@correo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </FormField>

          <FormField label="Contraseña inicial" required>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Rol" required>
              <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                <option value="admin">Admin — acceso total</option>
                <option value="cobrador">Cobrador — su templo</option>
                <option value="consulta">Consulta — solo lectura</option>
              </select>
            </FormField>
            <FormField label="Templo asignado">
              <select value={form.templo_id} onChange={e => setForm(f => ({ ...f, templo_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </FormField>
          </div>

          {/* Info sobre roles */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 8,
            padding: '12px 16px', fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7,
          }}>
            <strong>Admin:</strong> gestión total — miembros, cobranzas, usuarios, configuración.<br />
            <strong>Cobrador:</strong> registra cobranzas y ve miembros de su templo asignado.<br />
            <strong>Consulta:</strong> acceso de solo lectura a todos los datos y reportes.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCrearUsuario}
              disabled={saving || !form.nombre || !form.email || !form.password}
            >
              {saving ? 'Creando…' : 'Crear usuario'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
