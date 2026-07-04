import React, { useState } from 'react';
import logoWhite from '../assets/logo-white.png';
import logoGold  from '../assets/logo-gold.png';

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completá los dos campos.'); return; }
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'Email o contraseña incorrectos.',
        'Email not confirmed':       'Debés confirmar tu email antes de ingresar.',
        'User not found':            'No existe una cuenta con ese email.',
      };
      setError(msgs[err.message] || 'Error al ingresar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute', bottom: -60, right: -60,
        width: 400, height: 400, opacity: 0.04,
        pointerEvents: 'none',
      }}>
        <img src={logoGold} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{
        position: 'absolute', top: -80, left: -80,
        width: 300, height: 300, opacity: 0.03,
        pointerEvents: 'none',
      }}>
        <img src={logoGold} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo y título */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 80, height: 80,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <img src={logoWhite} alt="Logo" style={{ width: 52, height: 52, objectFit: 'contain' }} />
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--gold)',
            marginBottom: 8,
          }}>
            Iglesia Evangélica
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--white)',
            lineHeight: 1.2, fontFamily: 'Georgia, serif',
          }}>
            Unión Pentecostal
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            Sistema de Gestión de Socios
          </div>
        </div>

        {/* Card formulario */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 20,
          padding: '36px 36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
            Ingresá a tu cuenta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 28 }}>
            Usá las credenciales asignadas por el administrador.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="usuario@iglesia.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: '100%', fontSize: 15 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ width: '100%', fontSize: 15, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: 'var(--gray-400)', padding: 0,
                  }}
                  title={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid',
                borderColor: 'var(--danger)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'var(--gray-200)' : 'var(--navy)',
                color: loading ? 'var(--gray-400)' : 'var(--white)',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: 4,
              }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {/* Separador */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '24px 0 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
            <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
              Roles disponibles
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
          </div>

          {/* Leyenda de roles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
            {[
              { rol: 'Admin',    color: '#1C2B4B', bg: 'rgba(28,43,75,0.08)', desc: 'Acceso total' },
              { rol: 'Cobrador', color: '#92600A', bg: '#FEF3D7',             desc: 'Su templo' },
              { rol: 'Consulta', color: '#1A6B3C', bg: '#EAF5EE',             desc: 'Solo lectura' },
            ].map(r => (
              <div key={r.rol} style={{
                background: r.bg, borderRadius: 8,
                padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.rol}</div>
                <div style={{ fontSize: 10, color: r.color, opacity: 0.7, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          El acceso es controlado por el administrador del sistema
        </div>
      </div>
    </div>
  );
}
