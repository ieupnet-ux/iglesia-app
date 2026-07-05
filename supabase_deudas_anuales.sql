-- ============================================================
-- DEUDAS ANUALES — Iglesia Unión Pentecostal
-- Ejecutar en Supabase > SQL Editor > New Query
-- ============================================================

-- Tabla: deudas_anuales
-- Cada socio tiene una fila por año con el importe de ese año
CREATE TABLE IF NOT EXISTS deudas_anuales (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  miembro_id  BIGINT NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  anio        INTEGER NOT NULL,
  importe     INTEGER NOT NULL,
  saldo       INTEGER NOT NULL,   -- lo que falta pagar de ese año
  pagado      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(miembro_id, anio)
);

CREATE INDEX IF NOT EXISTS idx_deudas_miembro ON deudas_anuales(miembro_id);
CREATE INDEX IF NOT EXISTS idx_deudas_anio    ON deudas_anuales(anio);

-- Agregar columna anio a cobranzas
ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS anio INTEGER;
ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS deuda_anual_id BIGINT REFERENCES deudas_anuales(id);

-- RLS
ALTER TABLE deudas_anuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos ven deudas" ON deudas_anuales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona deudas" ON deudas_anuales
  FOR ALL USING (get_mi_rol() = 'admin');

CREATE POLICY "Cobrador gestiona deudas de su templo" ON deudas_anuales
  FOR ALL USING (
    get_mi_rol() = 'cobrador' AND
    miembro_id IN (
      SELECT id FROM miembros WHERE templo_id = get_mi_templo()
    )
  );

-- ── Función: generar deudas anuales para todos los miembros ──
-- Llamar una vez por año para generar las deudas del nuevo período
CREATE OR REPLACE FUNCTION generar_deudas_anuales(p_anio INTEGER)
RETURNS void AS $$
DECLARE
  r RECORD;
  v_importe INTEGER;
  v_cfg RECORD;
BEGIN
  SELECT cuota_mayor, cuota_menor INTO v_cfg FROM configuracion LIMIT 1;
  FOR r IN SELECT * FROM miembros LOOP
    v_importe := CASE r.categoria WHEN 'mayor' THEN v_cfg.cuota_mayor ELSE v_cfg.cuota_menor END;
    INSERT INTO deudas_anuales (miembro_id, anio, importe, saldo, pagado)
    VALUES (r.id, p_anio, v_importe, v_importe, false)
    ON CONFLICT (miembro_id, anio) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Generar deudas para el año actual ───────────────────────
SELECT generar_deudas_anuales(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

