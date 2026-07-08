// v3.0 - mobile responsive
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { Spinner } from './components/UI';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Miembros        from './pages/Miembros';
import Cobradores      from './pages/Cobradores';
import Cobranzas       from './pages/Cobranzas';
import Reportes        from './pages/Reportes';
import Usuarios        from './pages/Usuarios';
import Configuracion   from './pages/Configuracion';
import ImportarMiembros from './pages/ImportarMiembros';
import Asamblea        from './pages/Asamblea';
import { useSupabase } from './hooks/useSupabase';
import { useAuth }     from './hooks/useAuth';
import logoWhite       from './assets/logo-white.png';

const TAB_LABELS = {
  dashboard:     'Dashboard',
  miembros:      'Miembros',
  cobradores:    'Cobradores',
  cobranzas:     'Cobranzas',
  reportes:      'Reportes',
  asamblea:      'Asamblea',
  usuarios:      'Usuarios',
  importar:      'Importar socios',
  configuracion: 'Configuración',
};

export default function App() {
  const [tab, setTab]           = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { session, perfil, loadingAuth, signIn, signOut, puede } = useAuth();
  const {
    data, loading, error, cargarTodo,
    agregarTemplo, eliminarTemplo,
    actualizarCuotas,
    agregarMiembro, eliminarMiembro,
    agregarCobrador, eliminarCobrador,
    registrarCobranza, eliminarCobranza,
    generarDeudasAnio, agregarDeudaManual,
  } = useSupabase();

  if (loadingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(200,155,60,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Login onLogin={signIn} />;

  if (perfil && !perfil.activo) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'var(--white)', borderRadius: 16, padding: '36px 32px', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: 'var(--navy)', marginBottom: 8, fontSize: 18 }}>Cuenta deshabilitada</h2>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 20 }}>
            Tu cuenta fue deshabilitada. Contactá al administrador.
          </p>
          <button onClick={signOut} style={{ padding: '10px 24px', background: 'var(--navy)', color: 'var(--white)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (loading) return <Spinner />;
    if (error) return (
      <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 12, padding: '20px', color: 'var(--danger)' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Error de conexión</div>
        <div style={{ fontSize: 13 }}>{error}</div>
        <button onClick={cargarTodo} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--danger)', color: 'var(--white)', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Reintentar
        </button>
      </div>
    );

    switch (tab) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'miembros':
        if (!puede.verTodo) return <AccesoDenegado />;
        return <Miembros data={data}
          agregarMiembro={puede.gestionarMiembros ? agregarMiembro : null}
          eliminarMiembro={puede.gestionarMiembros ? eliminarMiembro : null}
          agregarDeudaManual={puede.gestionarMiembros ? agregarDeudaManual : null}
          generarDeudasAnio={puede.gestionarMiembros ? generarDeudasAnio : null}
        />;
      case 'cobradores':
        if (!puede.verTodo) return <AccesoDenegado />;
        return <Cobradores data={data}
          agregarCobrador={puede.gestionarCobradores ? agregarCobrador : null}
          eliminarCobrador={puede.gestionarCobradores ? eliminarCobrador : null}
        />;
      case 'cobranzas':
        return <Cobranzas data={data}
          registrarCobranza={puede.registrarCobranza ? registrarCobranza : null}
          eliminarCobranza={puede.eliminarCobranza ? eliminarCobranza : null}
          perfilActual={perfil}
        />;
      case 'reportes':
        if (!puede.verTodo) return <AccesoDenegado />;
        return <Reportes data={data} />;
      case 'asamblea':
        return <Asamblea data={data} />;
      case 'usuarios':
        if (!puede.gestionarUsuarios) return <AccesoDenegado />;
        return <Usuarios data={data} />;
      case 'importar':
        if (!puede.gestionarMiembros) return <AccesoDenegado />;
        return <ImportarMiembros data={data} onImportado={() => { cargarTodo(); setTab('miembros'); }} />;
      case 'configuracion':
        if (!puede.configurar) return <AccesoDenegado />;
        return <Configuracion data={data}
          actualizarCuotas={actualizarCuotas}
          agregarTemplo={agregarTemplo}
          eliminarTemplo={eliminarTemplo}
        />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        tab={tab}
        setTab={setTab}
        perfil={perfil}
        onSignOut={signOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        {/* Topbar mobile */}
        <div className="topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--white)',
              fontSize: 22, cursor: 'pointer', padding: '8px',
              display: 'flex', alignItems: 'center',
            }}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoWhite} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
              {TAB_LABELS[tab] || 'Gestión'}
            </span>
          </div>
          <button
            onClick={cargarTodo}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', padding: '8px' }}
            title="Actualizar"
          >
            ↻
          </button>
        </div>

        {/* Contenido */}
        <div className="page-content">
          {/* Botón actualizar desktop */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }} className="hide-mobile">
            <button
              onClick={cargarTodo}
              style={{
                background: 'var(--white)', border: '1px solid var(--gray-200)',
                borderRadius: 8, padding: '7px 14px', fontSize: 13,
                color: 'var(--gray-600)', cursor: 'pointer', fontWeight: 500,
              }}
            >
              ↻ Actualizar
            </button>
          </div>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

function AccesoDenegado() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h3 style={{ color: 'var(--navy)', marginBottom: 6 }}>Acceso restringido</h3>
      <p style={{ fontSize: 14 }}>Tu rol no tiene permisos para ver esta sección.</p>
    </div>
  );
}
