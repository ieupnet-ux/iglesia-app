# Iglesia Evangélica Unión Pentecostal
## Sistema de Gestión de Socios

---

## Requisitos previos

- Node.js v18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

---

## 1. Configurar Supabase

### Crear el proyecto
1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta.
2. Hacé clic en **New project**, elegí un nombre y región.
3. Esperá a que termine el aprovisionamiento (~2 min).

### Crear las tablas
1. En el panel de Supabase, andá a **SQL Editor → New Query**.
2. Copiá todo el contenido del archivo `supabase_schema.sql` y pegalo.
3. Hacé clic en **Run**.

### Obtener las credenciales
1. Andá a **Settings → API**.
2. Copiá:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon / public** key (empieza con `eyJ...`)

---

## 2. Configurar el proyecto local

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env
```

Editá el archivo `.env` y completá tus credenciales:

```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Ejecutar en desarrollo

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 4. Compilar para producción

```bash
npm run build
```

La carpeta `build/` está lista para subir a Vercel, Netlify, o cualquier hosting estático.

---

## Estructura del proyecto

```
src/
  assets/          # Logos (gold, navy, white)
  components/
    Sidebar.js     # Navegación lateral con logo
    UI.js          # Componentes reutilizables (Card, Badge, Modal, Button…)
  hooks/
    useSupabase.js # Toda la lógica de datos (CRUD)
  lib/
    supabaseClient.js
  pages/
    Dashboard.js   # Métricas y últimas cobranzas
    Miembros.js    # ABM de socios (mayor/menor)
    Cobradores.js  # ABM de cobradores por templo
    Cobranzas.js   # Registro de pagos con número de recibo
    Reportes.js    # Reporte imprimible por cobrador
    Configuracion.js # Cuotas anuales y gestión de templos
  App.js
  index.js
  index.css
public/
  logo-gold.png
  logo-navy.png
  logo-white.png
  favicon.ico
  manifest.json    # PWA
supabase_schema.sql
```

---

## Flujo de trabajo recomendado

1. **Configuración** → Crear templos y definir valores de cuotas
2. **Miembros** → Registrar socios (mayor o menor) asignados a cada templo
3. **Cobradores** → Registrar cobradores asignados a cada templo
4. **Cobranzas** → Ingresar cada cobro con el número de recibo del talonario
5. **Reportes** → Imprimir el reporte filtrado por cobrador

---

## Paleta de colores

| Nombre | Hex |
|--------|-----|
| Navy   | `#1C2B4B` |
| Gold   | `#C89B3C` |
| White  | `#FFFFFF` |
