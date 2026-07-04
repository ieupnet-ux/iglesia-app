import React, { useState } from 'react';
import { Card, CardHeader, Button, FormField, Badge, Toast, Divider } from '../components/UI';
import logoGold from '../assets/logo-gold.png';
import logoNavy from '../assets/logo-navy.png';
import logoWhite from '../assets/logo-white.png';

export default function Configuracion({ data, actualizarCuotas, agregarTemplo, eliminarTemplo }) {
  const { configuracion, templos, miembros } = data;
  const [cuotas, setCuotas]     = useState({ mayor: configuracion.cuota_mayor, menor: configuracion.cuota_menor });
  const [nuevoTemplo, setNuevo] = useState('');
  const [toast, setToast]       = useState(null);
  const [saving, setSaving]     = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fmt = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const handleGuardarCuotas = async () => {
    setSaving(true);
    try {
      await actualizarCuotas(parseInt(cuotas.mayor), parseInt(cuotas.menor));
      showToast('Cuotas actualizadas correctamente');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarTemplo = async () => {
    if (!nuevoTemplo.trim()) return;
    try {
      await agregarTemplo(nuevoTemplo.trim());
      setNuevo('');
      showToast('Templo agregado');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleEliminarTemplo = async (t) => {
    const miembrosEnTemplo = miembros.filter(m => m.templo_id === t.id).length;
    if (miembrosEnTemplo > 0) {
      showToast(`No se puede eliminar: tiene ${miembrosEnTemplo} miembro(s) asignado(s)`, 'error');
      return;
    }
    if (!window.confirm(`¿Eliminar el templo "${t.nombre}"?`)) return;
    try {
      await eliminarTemplo(t.id);
      showToast('Templo eliminado');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Configuración</h2>
        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>Parámetros generales del sistema</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Cuotas anuales */}
        <Card>
          <CardHeader title="Cuotas anuales" subtitle="Valores por categoría de socio" />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
              <FormField label="Cuota socios mayores">
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: 'var(--gray-400)', fontWeight: 500,
                  }}>$</span>
                  <input
                    type="number" min="0"
                    value={cuotas.mayor}
                    onChange={e => setCuotas(c => ({ ...c, mayor: e.target.value }))}
                    style={{ paddingLeft: 24 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                  {miembros.filter(m => m.categoria === 'mayor').length} socios en esta categoría
                </div>
              </FormField>
              <FormField label="Cuota socios menores">
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: 'var(--gray-400)', fontWeight: 500,
                  }}>$</span>
                  <input
                    type="number" min="0"
                    value={cuotas.menor}
                    onChange={e => setCuotas(c => ({ ...c, menor: e.target.value }))}
                    style={{ paddingLeft: 24 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                  {miembros.filter(m => m.categoria === 'menor').length} socios en esta categoría
                </div>
              </FormField>
            </div>

            <div style={{
              background: 'var(--gold-pale)',
              border: '1px solid var(--gold)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--warning)',
              lineHeight: 1.6,
            }}>
              <strong>Nota:</strong> Cambiar los valores de cuota no actualizará retroactivamente
              la deuda de los miembros existentes. Solo afecta a los nuevos registros.
            </div>

            <Button onClick={handleGuardarCuotas} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Guardando…' : 'Guardar cambios de cuotas'}
            </Button>
          </div>
        </Card>

        {/* Templos */}
        <Card>
          <CardHeader
            title="Templos"
            subtitle={`${templos.length} templo${templos.length !== 1 ? 's' : ''} registrado${templos.length !== 1 ? 's' : ''}`}
          />
          <div style={{ padding: '16px 24px' }}>
            {templos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 13 }}>
                No hay templos registrados
              </div>
            ) : templos.map(t => {
              const count = miembros.filter(m => m.templo_id === t.id).length;
              return (
                <div key={t.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--gray-100)',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{t.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
                      {count} miembro{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleEliminarTemplo(t)}>
                    Eliminar
                  </Button>
                </div>
              );
            })}

            <Divider margin="16px 0 14px" />

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Nombre del templo…"
                value={nuevoTemplo}
                onChange={e => setNuevo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAgregarTemplo()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAgregarTemplo} disabled={!nuevoTemplo.trim()}>
                Agregar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Logos disponibles */}
      <Card style={{ marginTop: 20 }}>
        <CardHeader title="Identidad visual" subtitle="Logos disponibles para usar en documentos e impresiones" />
        <div style={{ padding: '24px', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { src: logoNavy, label: 'Logo navy', bg: 'var(--white)' },
            { src: logoGold, label: 'Logo dorado', bg: 'var(--white)' },
            { src: logoWhite, label: 'Logo blanco', bg: 'var(--navy)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{
                width: 100, height: 100,
                background: item.bg,
                borderRadius: 12,
                border: '1px solid var(--gray-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <img src={item.src} alt={item.label} style={{ width: 64, height: 64, objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
