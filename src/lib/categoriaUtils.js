export function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const nac  = new Date(fechaNac);
  if (isNaN(nac)) return null;
  const hoy  = new Date();
  let edad   = hoy.getFullYear() - nac.getFullYear();
  const m    = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function categoriaSegunEdad(fechaNac) {
  const edad = calcularEdad(fechaNac);
  if (edad === null) return 'mayor';
  return edad <= 17 ? 'menor' : 'mayor';
}

export function parsearFecha(str) {
  if (!str) return null;
  const limpio = str.trim();
  const sep = limpio.includes('/') ? '/' : '-';
  const partes = limpio.split(sep);
  if (partes.length === 3) {
    const [d, m, a] = partes;
    if (a.length === 4) {
      const iso = `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
      if (!isNaN(Date.parse(iso))) return iso;
    }
    if (d.length === 4) {
      const iso = `${d}-${m.padStart(2,'0')}-${a.padStart(2,'0')}`;
      if (!isNaN(Date.parse(iso))) return iso;
    }
  }
  return null;
}

export function labelCategoria(categoria, fechaNac) {
  const edad = calcularEdad(fechaNac);
  const cat  = categoria === 'menor' ? 'Menor' : 'Mayor';
  return edad !== null ? `${cat} (${edad} años)` : cat;
}
