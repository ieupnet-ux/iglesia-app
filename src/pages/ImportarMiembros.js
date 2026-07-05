import React, { useState, useRef } from 'react';
import { Card, CardHeader, Button, Badge, Toast } from '../components/UI';
import { supabase } from '../lib/supabaseClient';

// Mapeo de nombre de templo del CSV al templo en la BD
// El sistema intenta hacer match automático por nombre
function normalizarTexto(t) {
  return t?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
}

function parsearFecha(str) {
  if (!str) return null;
  // Formato d/m/yyyy
  const partes = str.trim().split('/');
  if (partes.length === 3) {
    const [d, m, a] = partes;
    const fecha = `${a.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    if (!isNaN(Date.parse(fecha))) return fecha;
  }
  return null;
}

function parsearCSV(texto) {
  const lineas = texto.split('\n').filter(l => l.trim());
  if (lineas.length < 2) return [];

  // Detectar separador (tab o coma)
  const separador = lineas[0].includes('\t') ? '\t' : ',';
  const encabezados = lineas[0].split(separador).map(h => h.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  );

  return lineas.slice(1).map(linea => {
    const valores = linea.split(separador).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    encabezados.forEach((h, i) => { obj[h] = valores[i] || ''; });
    return obj;
  }).filter(r => r[encabezados[0]]); // filtrar filas vacías
}

function mapearMiembro(row, templos, configuracion) {
  // Buscar columnas flexiblemente
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.includes(k));
      if (found && row[found]) return row[found].trim();
    }
    return '';
  };

  const apellido  = get('apellido');
  const nombres   = get('nombre');
  const nombre    = [apellido, nombres].filter(Boolean).join(' ');
  const nroSocio  = get('n_de_socio', 'n_socio', 'nro', 'socio', 'numero');
  const temploCSV = get('templo');

  // Intentar hacer match del templo
  let templo_id = null;
  if (temploCSV && templos.length > 0) {
    const temploNorm = normalizarTexto(temploCSV);
    const match = templos.find(t => {
      const tNorm = normalizarTexto(t.nombre);
      return tNorm.includes(temploNorm) || temploNorm.includes(tNorm) ||
        temploNorm.split(' ').some(p => p.length > 3 && tNorm.includes(p));
    });
    if (match) templo_id = match.id;
  }

  // Determinar categoría por fecha de nacimiento
  let categoria = 'mayor';
  const fechaNac = parsearFecha(get('fecha_de_nacimiento', 'fecha_nac', 'nacimiento'));
  if (fechaNac) {
    const edad = Math.floor((new Date() - new Date(fechaNac)) / (365.25 * 24 * 3600 * 1000));
    if (edad < 18) categoria = 'menor';
  }

  const cuota = categoria === 'mayor' ? configuracion.cuota_mayor : configuracion.cuota_menor;

  return {
    nombre:           nombre || '(Sin nombre)',
    apellido:         apellido,
    categoria,
    templo_id,
    templo_csv:       temploCSV,
    deuda:            cuota,
    nro_socio:        nroSocio,
    cuit:             get('cuit'),
    documento:        get('documento', 'dni', 'doc'),
    fecha_nacimiento: fechaNac,
    lugar_nacimiento: get('lugar_de_nacimiento', 'lugar_nac'),
    nacionalidad:     get('nacionalidad') || 'Argentina',
    sexo:             get('sexo'),
    estado_civil:     get('estado_civil'),
    domicilio:        get('domicilio'),
    ciudad:           get('ciudad'),
    provincia:        get('provincia'),
    celular:          get('n_celular', 'celular', 'telefono'),
    email:            get('e_mail', 'email', 'correo'),
    observacion:      get('observacion'),
    ocupacion:        get('ocupacion'),
  };
}

export default function ImportarMiembros({ data, onImportado }) {
  const { templos, configuracion } = data;
  const [paso, setPaso]           = useState(1);
  const [preview, setPreview]     = useState([]);
  const [errores, setErrores]     = useState([]);
  const [importing, setImporting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [toast, setToast]         = useState(null);
  const [anioDeuda, setAnioDeuda] = useState(new Date().getFullYear());
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = ev.target.result;
      const rows  = parsearCSV(texto);
      if (rows.length === 0) { showToast('No se encontraron datos en el archivo', 'error'); return; }

      const mapeados  = rows.map(r => mapearMiembro(r, templos, configuracion));
      const sinTemplo = mapeados.filter(m => !m.templo_id);
      const conTemplo = mapeados.filter(m => m.templo_id);

      setPreview(mapeados);
      setErrores(sinTemplo);
      setPaso(2);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportar = async () => {
    setImporting(true);
    let importados = 0;
    let omitidos   = 0;
    let errCount   = 0;
    const anioActual = parseInt(anioDeuda);

    for (const m of preview) {
      if (!m.templo_id) { omitidos++; continue; }
      try {
        // Verificar si ya existe por nro_socio o documento
        if (m.nro_socio || m.documento) {
          const { data: existe } = await supabase
            .from('miembros')
            .select('id')
            .or(
              [m.nro_socio ? `nro_socio.eq.${m.nro_socio}` : null,
               m.documento ? `documento.eq.${m.documento}` : null]
              .filter(Boolean).join(',')
            )
            .limit(1);
          if (existe && existe.length > 0) { omitidos++; continue; }
        }

        const { data: nuevo, error } = await supabase.from('miembros').insert([{
          nombre:           m.nombre,
          apellido:         m.apellido,
          categoria:        m.categoria,
          templo_id:        m.templo_id,
          deuda:            m.deuda,
          nro_socio:        m.nro_socio || null,
          cuit:             m.cuit || null,
          documento:        m.documento || null,
          fecha_nacimiento: m.fecha_nacimiento || null,
          lugar_nacimiento: m.lugar_nacimiento || null,
          nacionalidad:     m.nacionalidad || 'Argentina',
          sexo:             m.sexo || null,
          estado_civil:     m.estado_civil || null,
          domicilio:        m.domicilio || null,
          ciudad:           m.ciudad || null,
          provincia:        m.provincia || null,
          celular:          m.celular || null,
          email:            m.email || null,
          observacion:      m.observacion || null,
          ocupacion:        m.ocupacion || null,
        }]).select().single();

        if (error) throw error;

        // Generar deuda anual
        await supabase.from('deudas_anuales').insert([{
          miembro_id: nuevo.id,
          anio:       anioActual,
          importe:    m.deuda,
          saldo:      m.deuda,
          pagado:     false,
        }]).select();

        importados++;
      } catch (e) {
        console.error('Error importando', m.nombre, e);
        errCount++;
      }
    }

    setResultado({ importados, omitidos, errores: errCount });
    setPaso(3);
    setImporting(false);
    if (onImportado) onImportado();
  };

  const fmt = (n) => n?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Importar miembros</h2>
        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
          Desde Google Sheets exportado como CSV o TSV
        </div>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['Preparar archivo','Vista previa','Resultado'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: paso > i + 1 ? 'var(--success)' : paso === i + 1 ? 'var(--navy)' : 'var(--gray-200)',
              color: paso >= i + 1 ? 'var(--white)' : 'var(--gray-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>{paso > i + 1 ? '✓' : i + 1}</div>
            <span style={{ fontSize: 13, color: paso === i + 1 ? 'var(--navy)' : 'var(--gray-400)', fontWeight: paso === i + 1 ? 600 : 400 }}>
              {label}
            </span>
            {i < 2 && <div style={{ width: 32, height: 1, background: 'var(--gray-200)' }} />}
          </div>
        ))}
      </div>

      {/* Paso 1: Instrucciones */}
      {paso === 1 && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <CardHeader title="Cómo exportar desde Google Sheets" />
            <div style={{ padding: '20px 24px' }}>
              <ol style={{ lineHeight: 2, fontSize: 14, color: 'var(--gray-600)', paddingLeft: 20 }}>
                <li>Abrí tu planilla en Google Sheets</li>
                <li>Menú <strong>Archivo → Descargar → Valores separados por comas (.csv)</strong></li>
                <li>Guardá el archivo en tu computadora</li>
                <li>Subilo acá abajo</li>
              </ol>
              <div style={{
                background: 'var(--warning-bg)', borderRadius: 8,
                padding: '12px 16px', marginTop: 16, fontSize: 13, color: 'var(--warning)',
              }}>
                <strong>Columnas requeridas:</strong> la planilla debe tener al menos las columnas
                <strong> Apellidos, Nombres y Templo</strong>. El resto es opcional pero se importa si está presente.
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Subir archivo CSV" />
            <div style={{ padding: '24px' }}>
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  border: '2px dashed var(--gray-200)',
                  borderRadius: 12, padding: '40px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
                  Click para seleccionar archivo
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  Formatos aceptados: .csv, .tsv, .txt
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleArchivo}
                style={{ display: 'none' }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Paso 2: Vista previa */}
      {paso === 2 && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
            {[
              { label: 'Total en archivo', value: preview.length, color: 'var(--navy)' },
              { label: 'Con templo asignado', value: preview.filter(m => m.templo_id).length, color: 'var(--success)' },
              { label: 'Sin templo (omitidos)', value: preview.filter(m => !m.templo_id).length, color: 'var(--danger)' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--white)', border: '1px solid var(--gray-200)',
                borderRadius: 12, padding: '16px 20px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: item.color, marginTop: 4, fontFamily: 'Georgia, serif' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Templos sin match */}
          {errores.length > 0 && (
            <Card>
              <CardHeader title="⚠ Miembros sin templo asignado" subtitle="Estos serán omitidos en la importación" />
              <div style={{ padding: '0 0 8px' }}>
                {[...new Set(errores.map(m => m.templo_csv))].map(t => (
                  <div key={t} style={{ padding: '10px 24px', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>"{t}"</span>
                    <span style={{ color: 'var(--gray-400)', marginLeft: 8 }}>
                      → no coincide con ningún templo registrado
                    </span>
                  </div>
                ))}
                <div style={{ padding: '12px 24px', fontSize: 12, color: 'var(--gray-400)' }}>
                  Para importarlos, creá primero esos templos en <strong>Configuración</strong> con el mismo nombre.
                </div>
              </div>
            </Card>
          )}

          {/* Año de deuda */}
          <Card>
            <CardHeader title="Año de deuda inicial" subtitle="Se generará una deuda anual para cada miembro importado" />
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" min="2000" max="2099"
                value={anioDeuda}
                onChange={e => setAnioDeuda(e.target.value)}
                style={{ width: 120 }}
              />
              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                Cuota: {fmt(configuracion.cuota_mayor)} mayores / {fmt(configuracion.cuota_menor)} menores
              </span>
            </div>
          </Card>

          {/* Tabla preview */}
          <Card>
            <CardHeader title={`Vista previa — primeros ${Math.min(preview.length, 10)} registros`} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    {['N° Socio','Nombre','Categoría','Templo','Documento','Ciudad','Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 11 }}>{m.nro_socio || '—'}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 600, color: 'var(--navy)' }}>{m.nombre}</td>
                      <td style={{ padding: '9px 14px' }}><Badge variant={m.categoria}>{m.categoria}</Badge></td>
                      <td style={{ padding: '9px 14px', fontSize: 11 }}>{m.templo_csv || '—'}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 11 }}>{m.documento || '—'}</td>
                      <td style={{ padding: '9px 14px', fontSize: 11 }}>{m.ciudad || '—'}</td>
                      <td style={{ padding: '9px 14px' }}>
                        {m.templo_id
                          ? <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 11 }}>✓ OK</span>
                          : <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 11 }}>✗ Sin templo</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => { setPaso(1); setPreview([]); setErrores([]); }}>
              ← Volver
            </Button>
            <Button
              variant="gold"
              onClick={handleImportar}
              disabled={importing || preview.filter(m => m.templo_id).length === 0}
            >
              {importing
                ? `Importando...`
                : `Importar ${preview.filter(m => m.templo_id).length} miembros`
              }
            </Button>
          </div>
        </div>
      )}

      {/* Paso 3: Resultado */}
      {paso === 3 && resultado && (
        <Card>
          <div style={{ padding: '48px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {resultado.errores === 0 ? '✅' : '⚠️'}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>
              Importación completada
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 480, margin: '0 auto 32px' }}>
              <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>{resultado.importados}</div>
                <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>Importados</div>
              </div>
              <div style={{ background: 'var(--warning-bg)', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--warning)' }}>{resultado.omitidos}</div>
                <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>Omitidos</div>
              </div>
              <div style={{ background: resultado.errores > 0 ? 'var(--danger-bg)' : 'var(--gray-50)', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: resultado.errores > 0 ? 'var(--danger)' : 'var(--gray-400)' }}>{resultado.errores}</div>
                <div style={{ fontSize: 12, color: resultado.errores > 0 ? 'var(--danger)' : 'var(--gray-400)', marginTop: 4 }}>Errores</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => { setPaso(1); setPreview([]); setErrores([]); setResultado(null); }}>
                Importar otro archivo
              </Button>
              <Button onClick={() => onImportado && onImportado()}>
                Ver miembros →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

