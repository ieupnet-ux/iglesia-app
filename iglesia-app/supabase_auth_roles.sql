-- ============================================================
-- AUTENTICACIÓN Y ROLES — Iglesia Unión Pentecostal
-- Ejecutar DESPUÉS de supabase_schema.sql
-- ============================================================

-- Tabla de perfiles vinculada a auth.users de Supabase
CREATE TABLE IF NOT EXISTS perfiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  rol        TEXT NOT NULL CHECK (rol IN ('admin', 'cobrador', 'consulta')),
  templo_id  BIGINT REFERENCES templos(id) ON DELETE SET NULL,
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);

-- ── Row Level Security (RLS) ────────────────────────────────
-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE templos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobradores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranzas    ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_mi_rol()
RETURNS TEXT AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: obtener templo del usuario autenticado
CREATE OR REPLACE FUNCTION get_mi_templo()
RETURNS BIGINT AS $$
  SELECT templo_id FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── Políticas: perfiles ─────────────────────────────────────
CREATE POLICY "Ver perfil propio" ON perfiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin ve todos los perfiles" ON perfiles
  FOR SELECT USING (get_mi_rol() = 'admin');

CREATE POLICY "Admin gestiona perfiles" ON perfiles
  FOR ALL USING (get_mi_rol() = 'admin');

-- ── Políticas: templos ──────────────────────────────────────
CREATE POLICY "Todos ven templos" ON templos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona templos" ON templos
  FOR ALL USING (get_mi_rol() = 'admin');

-- ── Políticas: configuracion ────────────────────────────────
CREATE POLICY "Todos ven configuracion" ON configuracion
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona configuracion" ON configuracion
  FOR ALL USING (get_mi_rol() = 'admin');

-- ── Políticas: miembros ─────────────────────────────────────
-- Admin ve todos; cobrador ve solo su templo; consulta ve todos
CREATE POLICY "Admin ve todos los miembros" ON miembros
  FOR SELECT USING (get_mi_rol() = 'admin');

CREATE POLICY "Consulta ve todos los miembros" ON miembros
  FOR SELECT USING (get_mi_rol() = 'consulta');

CREATE POLICY "Cobrador ve miembros de su templo" ON miembros
  FOR SELECT USING (
    get_mi_rol() = 'cobrador' AND templo_id = get_mi_templo()
  );

CREATE POLICY "Admin gestiona miembros" ON miembros
  FOR ALL USING (get_mi_rol() = 'admin');

-- ── Políticas: cobradores ───────────────────────────────────
CREATE POLICY "Todos ven cobradores" ON cobradores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona cobradores" ON cobradores
  FOR ALL USING (get_mi_rol() = 'admin');

-- ── Políticas: cobranzas ────────────────────────────────────
CREATE POLICY "Admin ve todas las cobranzas" ON cobranzas
  FOR SELECT USING (get_mi_rol() = 'admin');

CREATE POLICY "Consulta ve todas las cobranzas" ON cobranzas
  FOR SELECT USING (get_mi_rol() = 'consulta');

CREATE POLICY "Cobrador ve sus cobranzas" ON cobranzas
  FOR SELECT USING (
    get_mi_rol() = 'cobrador' AND
    cobrador_id IN (SELECT id FROM cobradores WHERE templo_id = get_mi_templo())
  );

CREATE POLICY "Admin y cobrador insertan cobranzas" ON cobranzas
  FOR INSERT WITH CHECK (
    get_mi_rol() IN ('admin', 'cobrador')
  );

CREATE POLICY "Admin elimina cobranzas" ON cobranzas
  FOR DELETE USING (get_mi_rol() = 'admin');

-- ── Función: crear perfil automáticamente al registrarse ────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'consulta')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

