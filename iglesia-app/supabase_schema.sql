-- ============================================================
-- IGLESIA EVANGÉLICA UNIÓN PENTECOSTAL
-- Schema de base de datos — Supabase / PostgreSQL
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- Tabla: templos
CREATE TABLE IF NOT EXISTS templos (
  id    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: configuracion (fila única con los valores de cuotas)
CREATE TABLE IF NOT EXISTS configuracion (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cuota_mayor  INTEGER NOT NULL DEFAULT 50000,
  cuota_menor  INTEGER NOT NULL DEFAULT 25000,
  updated_at   TIMESTAMPTZ DEFAULT now()
);
INSERT INTO configuracion (cuota_mayor, cuota_menor) VALUES (50000, 25000);

-- Tabla: miembros
CREATE TABLE IF NOT EXISTS miembros (
  id             BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre         TEXT NOT NULL,
  categoria      TEXT NOT NULL CHECK (categoria IN ('mayor','menor')),
  templo_id      BIGINT NOT NULL REFERENCES templos(id) ON DELETE CASCADE,
  deuda          INTEGER NOT NULL DEFAULT 0,
  fecha_registro DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Tabla: cobradores
CREATE TABLE IF NOT EXISTS cobradores (
  id                    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre                TEXT NOT NULL,
  templo_id             BIGINT NOT NULL REFERENCES templos(id) ON DELETE CASCADE,
  total_cobrado         INTEGER NOT NULL DEFAULT 0,
  cobranzas_registradas INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Tabla: cobranzas
CREATE TABLE IF NOT EXISTS cobranzas (
  id             BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cobrador_id    BIGINT NOT NULL REFERENCES cobradores(id) ON DELETE CASCADE,
  miembro_id     BIGINT NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  monto          INTEGER NOT NULL,
  numero_recibo  TEXT NOT NULL,
  fecha          DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_miembros_templo    ON miembros(templo_id);
CREATE INDEX IF NOT EXISTS idx_cobradores_templo  ON cobradores(templo_id);
CREATE INDEX IF NOT EXISTS idx_cobranzas_cobrador ON cobranzas(cobrador_id);
CREATE INDEX IF NOT EXISTS idx_cobranzas_miembro  ON cobranzas(miembro_id);
CREATE INDEX IF NOT EXISTS idx_cobranzas_fecha    ON cobranzas(fecha);

-- Vista: reporte por cobrador
CREATE OR REPLACE VIEW reporte_cobradores AS
SELECT
  co.id,
  co.nombre AS cobrador,
  t.nombre  AS templo,
  co.cobranzas_registradas,
  co.total_cobrado,
  COUNT(cz.id) FILTER (WHERE cz.fecha >= date_trunc('month', CURRENT_DATE)) AS cobrado_este_mes
FROM cobradores co
JOIN templos t ON t.id = co.templo_id
LEFT JOIN cobranzas cz ON cz.cobrador_id = co.id
GROUP BY co.id, co.nombre, t.nombre, co.cobranzas_registradas, co.total_cobrado;
