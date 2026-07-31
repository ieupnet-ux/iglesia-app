// v1.0 - cambio de contraseña y datos personales
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, Button, FormField, Toast } from '../components/UI';

export default function MiPerfil({ perfil, onSignOut }) {
  const [tab, setTab] = useState('password');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formPass, setFormPass] = useState({
    nueva: '', confirmar: '', mostrar: false,
  });

  const [formNombre, setFormNombre] = useState({
    nombre: perfil?.nombre || '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Cambiar contraseña ────────────────────────────────────
  const handleCambiarPassword = async () => {
    if (!formPass.nueva) { showToast('Ingresá la nueva contraseña', 'error'); return; }
    if (formPass.nueva.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (formPass.nueva !== formPass.confirmar) { showToast('Las contraseñas no coinciden', 'error'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formPass.nueva });
      if (error) throw error;
      setFormPass({ nueva: '', confirmar: '', mostrar: false });
      showToast('Contraseña actualizada correctamente');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar nombre ────────────────────────────────────────
  const handleCambiarNombre = async () => {
    if (!formNombre.nombre.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ nombre: formNombre.nombre.trim() })
        .eq('id', perfil.id);
      if (error) throw error;
      showToast('Nombre actualizado. Recargá la página para verlo en el menú.');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const estiloTab = (activo) => ({
    padding: '9px 20px', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: activo ? 600 : 400,
    borderBottom: activo ? '2px solid var(--navy)' : '2px solid transparent',
    background: 'transparent',
    color: activo ? 'var(--navy)' : 'var(--gray-400)',
    transition: 'all 0.15s',
  });

  const ROL_LABEL = { admin: 'Administrador', cobrador: 'Cobrador', consulta: 'Consulta' };

  return (
    <div style={{ maxWidth: 520 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Mi perfil</h2>
        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
          Configuración de tu cuenta
        </div>
      </div>

      {/* Info del usuario */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'var(--white)', flexShrink: 0,
          }}>
            {perfil?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{perfil?.nombre}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: perfil?.rol === 'admin' ? 'rgba(28,43,75,0.10)' : perfil?.rol === 'cobrador' ? 'var(--gold-pale)' : 'var(--success-bg)',
                color: perfil?.rol === 'admin' ? 'var(--navy)' : perfil?.rol === 'cobrador' ? 'var(--warning)' : 'var(--success)',
                padding: '3px 10px', borderRadius: 99,
              }}>
                {ROL_LABEL[perfil?.rol] || perfil?.rol}
              </span>
              {perfil?.templos && (
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {perfil.templos.nombre}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--gray-200)', marginBottom: 20, display: 'flex' }}>
        <button style={estiloTab(tab === 'password')} onClick={() => setTab('password')}>
          🔒 Cambiar contraseña
        </button>
        <button style={estiloTab(tab === 'nombre')} onClick={() => setTab('nombre')}>
          ✎ Cambiar nombre
        </button>
      </div>

      {/* Tab: cambiar contraseña */}
      {tab === 'password' && (
        <Card>
          <CardHeader title="Nueva contraseña" subtitle="Mínimo 6 caracteres" />
          <div style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
            <FormField label="Nueva contraseña" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={formPass.mostrar ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formPass.nueva}
                  onChange={e => setFormPass(f => ({ ...f, nueva: e.target.value }))}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setFormPass(f => ({ ...f, mostrar: !f.mostrar }))}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: 'var(--gray-400)', padding: 0,
                  }}
                >{formPass.mostrar ? '🙈' : '👁'}</button>
              </div>
            </FormField>

            <FormField label="Confirmar contraseña" required>
              <input
                type={formPass.mostrar ? 'text' : 'password'}
                placeholder="Repetí la contraseña"
                value={formPass.confirmar}
                onChange={e => setFormPass(f => ({ ...f, confirmar: e.target.value }))}
              />
            </FormField>

            {/* Indicador de coincidencia */}
            {formPass.nueva && formPass.confirmar && (
              <div style={{
                fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
                background: formPass.nueva === formPass.confirmar ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: formPass.nueva === formPass.confirmar ? 'var(--success)' : 'var(--danger)',
              }}>
                {formPass.nueva === formPass.confirmar ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCambiarPassword}
                disabled={saving || !formPass.nueva || !formPass.confirmar || formPass.nueva !== formPass.confirmar}
              >
                {saving ? 'Guardando…' : 'Cambiar contraseña'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: cambiar nombre */}
      {tab === 'nombre' && (
        <Card>
          <CardHeader title="Nombre de usuario" subtitle="Cómo aparecés en el sistema" />
          <div style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
            <FormField label="Tu nombre" required>
              <input
                placeholder="Nombre y apellido"
                value={formNombre.nombre}
                onChange={e => setFormNombre({ nombre: e.target.value })}
              />
            </FormField>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCambiarNombre}
                disabled={saving || !formNombre.nombre.trim()}
              >
                {saving ? 'Guardando…' : 'Guardar nombre'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Cerrar sesión */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button variant="ghost" onClick={onSignOut} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

