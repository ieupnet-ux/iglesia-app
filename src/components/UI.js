import React from 'react';

/* ── Card ─────────────────────────────────────────────────── */
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderBottom: '1px solid var(--gray-100)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ── Metric card ──────────────────────────────────────────── */
export function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: accent ? `1.5px solid var(--gold)` : '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: accent ? '0 4px 16px rgba(200,155,60,0.12)' : 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color: accent ? 'var(--gold)' : 'var(--navy)',
        marginTop: 8,
        lineHeight: 1,
        fontFamily: 'Georgia, serif',
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────── */
export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { bg: 'var(--gray-100)', color: 'var(--gray-600)' },
    navy:    { bg: 'rgba(28,43,75,0.10)', color: 'var(--navy)' },
    gold:    { bg: 'var(--gold-pale)', color: 'var(--warning)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)' },
    danger:  { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    mayor:   { bg: 'rgba(28,43,75,0.10)', color: 'var(--navy)' },
    menor:   { bg: 'var(--gold-pale)', color: 'var(--warning)' },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}

/* ── Button ───────────────────────────────────────────────── */
export function Button({ children, onClick, variant = 'primary', size = 'md', type = 'button', style, disabled }) {
  const base = {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s, opacity 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  const variants = {
    primary:  { background: 'var(--navy)', color: 'var(--white)' },
    gold:     { background: 'var(--gold)', color: 'var(--navy-dark)' },
    ghost:    { background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--gray-200)' },
    danger:   { background: 'var(--danger)', color: 'var(--white)' },
    success:  { background: 'var(--success)', color: 'var(--white)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

/* ── FormField ────────────────────────────────────────────── */
export function FormField({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)' }}>
          {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(19,30,53,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--gray-400)', cursor: 'pointer', lineHeight: 1,
              padding: '2px 6px', borderRadius: 4,
            }}
          >×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Toast simple ─────────────────────────────────────────── */
export function Toast({ msg, type = 'success' }) {
  if (!msg) return null;
  const colors = {
    success: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--success)' },
    error:   { bg: 'var(--danger-bg)',  color: 'var(--danger)',  border: 'var(--danger)' },
  };
  const c = colors[type];
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius)',
      padding: '12px 20px',
      fontSize: 14, fontWeight: 500,
      boxShadow: 'var(--shadow-md)',
    }}>
      {msg}
    </div>
  );
}

/* ── Spinner ──────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--gray-200)',
        borderTopColor: 'var(--navy)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── DeudaBar ─────────────────────────────────────────────── */
export function DeudaBar({ deuda, cuota }) {
  const pct = cuota > 0 ? Math.round(((cuota - deuda) / cuota) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: 'var(--gray-100)',
        borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--gold)' : 'var(--danger)',
          borderRadius: 99,
          transition: 'width 0.4s',
        }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--gray-400)', minWidth: 28, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Divider ──────────────────────────────────────────────── */
export function Divider({ margin = '16px 0' }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--gray-100)', margin }} />;
}
