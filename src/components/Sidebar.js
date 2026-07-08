import React from 'react';
import logoWhite from '../assets/logo-white.png';

const NAV = [
  { id: 'dashboard',     icon: '⊞', label: 'Dashboard',       rol: ['admin','cobrador','consulta'] },
  { id: 'miembros',      icon: '✦', label: 'Miembros',        rol: ['admin','consulta'] },
  { id: 'cobradores',    icon: '◈', label: 'Cobradores',      rol: ['admin','consulta'] },
  { id: 'cobranzas',     icon: '◎', label: 'Cobranzas',       rol: ['admin','cobrador','consulta'] },
  { id: 'reportes',      icon: '▦', label: 'Reportes',        rol: ['admin','consulta'] },
  { id: 'asamblea',      icon: '🏛', label: 'Asamblea',        rol: ['admin','cobrador'] },
  { id: 'usuarios',      icon: '◉', label: 'Usuarios',        rol: ['admin'] },
  { id: 'importar',      icon: '⇪', label: 'Importar socios', rol: ['admin'] },
  { id: 'configuracion', icon: '◧', label: 'Configuración',   rol: ['admin'] },
];

const ROL_BADGE = {
  admin:    { label: 'Admin',    bg: 'rgba(200,155,60,0.25)', color: 'var(--gold-light)' },
  cobrador: { label: 'Cobrador', bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' },
  consulta: { label: 'Consulta', bg: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' },
};

export default function Sidebar({ tab, setTab, perfil, onSignOut, open, onClose }) {
  const rol = perfil?.rol || 'consulta';
  const navFiltrado = NAV.filter(item => item.rol.includes(rol));
  const rb = ROL_BADGE[rol] || ROL_BADGE.consulta;

  const handleNav = (id) => {
    setTab(id);
    if (onClose) onClose(); // cerrar en mobile
  };

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <img src={logoWhite} alt="Unión Pentecostal"
            style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: 11, fontWeight: 700,
              color: 'var(--gold)', letterSpacing: '0.07em', textTransform: 'uppercase',
            }}>Unión Pentecostal</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              Gestión de socios
            </div>
          </div>
          {/* Botón cerrar en mobile */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer',
                padding: '4px', lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navFiltrado.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', marginBottom: 2,
                  borderRadius: 8, border: 'none',
                  background: active ? 'rgba(200,155,60,0.18)' : 'transparent',
                  color: active ? 'var(--gold-light)' : 'rgba(255,255,255,0.58)',
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  textAlign: 'left', cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: active ? 'var(--gold)' : 'rgba(255,255,255,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: active ? 'var(--navy)' : 'rgba(255,255,255,0.45)',
                  flexShrink: 0,
                }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Usuario */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {perfil && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--navy)', flexShrink: 0,
              }}>
                {perfil.nombre?.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {perfil.nombre}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: 2,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: rb.bg, color: rb.color, padding: '1px 6px', borderRadius: 99,
                }}>{rb.label}</div>
              </div>
            </div>
          )}
          <button
            onClick={onSignOut}
            style={{
              width: '100%', padding: '9px 12px', minHeight: 40,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 7, color: 'rgba(255,255,255,0.6)',
              fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
