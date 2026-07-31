// v3.0 - usa RPC para actualizar perfiles correctamente
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Modal, FormField, Badge, Toast } from '../components/UI';

const ROL_CONFIG = {
  admin:    { label: 'Admin',    desc: 'Acceso total al sistema' },
  cobrador: { label: 'Cobrador', desc: 'Solo su templo asignado' },
  consulta: { label: 'Consulta', desc: 'Solo lectura' },
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

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data: perfiles, error } = await supabase
        .from('perfiles')
        .select('*, templos(nombre)')
        .order('nombre');
      if (error) throw error;
      setUsuarios(perfiles || []);
    } catch (e) {
      showToast('Error cargando usuarios: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  // ── Crear usuario ─────────────────────────────────────────
  const handleCrearUsuario = async () => {
    if (!form.nombre || !form.email || !form.password || !form.rol) return;
    setSaving(true);
    try {
      // 1. Crear en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nombre: form.nombre, rol: form.rol } },
      });
      if (authError) throw authError;

      // 2. Actualizar perfil via RPC (espera que el trigger lo cree)
      if (authData.user) {
        // Reintentar hasta 5 veces esperando que el trigger cree el perfil
        let ok = false;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 600));
          const { error } = await supabase.rpc('actualizar_perfil', {
            p_id:       authData.user.id,
            p_nombre:   form.nombre,
            p_rol:      form.rol,
            p_templo_id: form.templo_id ? parseInt(form.templo_id) : null,
          });
          if (!error) { ok = true; break; }
        }
        if (!ok) {
          // Fallback: upsert directo
          await supabase.from('perfiles').upsert({
            id:        authData.user.id,
            nombre:    form.nombre,
            rol:       form.rol,
            templo_id: form.templo_id ? parseInt(form.templo_id) : null,
          });
        }
      }

      setForm({ nombre: '', email: '', password: '', rol: 'cobrador', templo_id: '' });
      setModalOpen(false);
      showToast('Usuario creado correctamente');
      await cargarUsuarios();
    } catch (e) {
      const msgs = {
        'User already registered':                         'Ya existe un usuario con ese email.',
        'Password should be at least 6 characters':        'La contraseña debe tener al menos 6 caracteres.',
        'Unable to validate email address: invalid format': 'El formato del email no es válido.',
      };
      showToast(msgs[e.message] || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar rol ───────────────────────────────────────────
  const handleCambiarRol = async (usuario, nuevoRol) => {
    const { error } = await supabase
      .from('perfiles').update({ rol: nuevoRol }).eq('id', usuario.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Rol actualizado');
    await cargarUsuarios();
  };

  // ── Cambiar templo ────────────────────────────────────────
  const handleCambiarTemplo = async (usuario, templo_id) => {
    const { error } = await supabase
      .from('perfiles')
      .update({ templo_id: templo_id ? parseInt(templo_id) : null })
      .eq('id', usuario.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Templo actualizado');
    await cargarUsuarios();
  };

  // ── Habilitar / Deshabilitar ──────────────────────────────
  const handleToggleActivo = async (usuario) => {
    const nuevoEstado = !usuario.activo;
    const { error } = await supabase
      .from('perfiles').update({ activo: nuevoEstado }).eq('id', usuario.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`);
    await cargarUsuarios();
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

      {/* Cards de roles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(ROL_CONFIG).map(([key, r]) => (
          <div key={key} style={{
            background: 'var(--white)', border: '1px solid var(--gray-200)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 20 }}>
              {key === 'admin' ? '🛡' : key === 'cobrador' ? '💼' : '👁'}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Usuario','Rol','Templo asignado','Estado','Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--gray-400)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  Cargando usuarios…
                </td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  No hay usuarios registrados
                </td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Nombre */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: u.rol === 'admin' ? 'rgba(28,43,75,0.10)' : u.rol === 'cobrador' ? 'var(--gold-pale)' : 'var(--success-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--navy)',
                      }}>
                        {u.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{u.nombre}</div>
                        {u.templos && (
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>
                            {u.templos.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td style={{ padding: '13px 16px' }}>
                    <select value={u.rol} onChange={e => handleCambiarRol(u, e.target.value)}
                      style={{
                        fontSize: 12, padding: '5px 8px',
                        border: '1.5px solid var(--gray-200)', borderRadius: 6,
                        background: 'var(--white)', fontWeight: 600, cursor: 'pointer',
                        color: u.rol === 'admin' ? 'var(--navy)' : u.rol === 'cobrador' ? 'var(--warning)' : 'var(--success)',
                      }}>
                      <option value="admin">Admin</option>
                      <option value="cobrador">Cobrador</option>
                      <option value="consulta">Consulta</option>
                    </select>
                  </td>

                  {/* Templo */}
                  <td style={{ padding: '13px 16px' }}>
                    <select value={u.templo_id || ''} onChange={e => handleCambiarTemplo(u, e.target.value)}
                      style={{ fontSize: 12, padding: '5px 8px', border: '1.5px solid var(--gray-200)', borderRadius: 6, background: 'var(--white)' }}>
                      <option value="">Sin asignar</option>
                      {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '13px 16px' }}>
                    <Badge variant={u.activo !== false ? 'success' : 'danger'}>
                      {u.activo !== false ? 'Activo' : 'Deshabilitado'}
                    </Badge>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '13px 16px' }}>
                    <Button size="sm" variant={u.activo !== false ? 'ghost' : 'success'}
                      onClick={() => handleToggleActivo(u)}>
                      {u.activo !== false ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal nuevo usuario */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear nuevo usuario">
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Nombre completo" required>
            <input placeholder="Nombre y apellido" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <input type="email" placeholder="usuario@correo.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Contraseña inicial" required>
            <input type="password" placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Rol" required>
              <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="cobrador">Cobrador</option>
                <option value="consulta">Consulta</option>
              </select>
            </FormField>
            <FormField label="Templo asignado">
              <select value={form.templo_id} onChange={e => setForm(f => ({ ...f, templo_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {templos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{
            background: 'var(--warning-bg)', borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: 'var(--warning)', lineHeight: 1.7,
          }}>
            ⚠ El usuario debe confirmar su email antes de poder ingresar al sistema. Si querés evitar esto, deshabilitá la confirmación de email en Supabase → Authentication → Settings.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrearUsuario}
              disabled={saving || !form.nombre || !form.email || !form.password}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
