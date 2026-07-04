import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabase() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState({
    templos: [],
    miembros: [],
    cobradores: [],
    cobranzas: [],
    configuracion: { id: null, cuota_mayor: 50000, cuota_menor: 25000 },
  });

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, m, co, cz, cfg] = await Promise.all([
        supabase.from('templos').select('*').order('nombre'),
        supabase.from('miembros').select('*').order('nombre'),
        supabase.from('cobradores').select('*').order('nombre'),
        supabase.from('cobranzas').select('*').order('created_at', { ascending: false }),
        supabase.from('configuracion').select('*').limit(1),
      ]);
      if (t.error) throw t.error;
      if (m.error) throw m.error;
      if (co.error) throw co.error;
      if (cz.error) throw cz.error;
      setData({
        templos:       t.data  || [],
        miembros:      m.data  || [],
        cobradores:    co.data || [],
        cobranzas:     cz.data || [],
        configuracion: cfg.data?.[0] || { id: null, cuota_mayor: 50000, cuota_menor: 25000 },
      });
    } catch (e) {
      setError(e.message || 'Error al conectar con Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // ── Templos ──────────────────────────────────────────────
  const agregarTemplo = async (nombre) => {
    const { data: row, error } = await supabase.from('templos').insert([{ nombre }]).select().single();
    if (error) throw error;
    setData(prev => ({ ...prev, templos: [...prev.templos, row].sort((a,b) => a.nombre.localeCompare(b.nombre)) }));
    return row;
  };

  const eliminarTemplo = async (id) => {
    const { error } = await supabase.from('templos').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, templos: prev.templos.filter(t => t.id !== id) }));
  };

  // ── Configuración ────────────────────────────────────────
  const actualizarCuotas = async (cuota_mayor, cuota_menor) => {
    const cfg = data.configuracion;
    let row;
    if (cfg.id) {
      const { data: updated, error } = await supabase
        .from('configuracion')
        .update({ cuota_mayor, cuota_menor, updated_at: new Date().toISOString() })
        .eq('id', cfg.id)
        .select().single();
      if (error) throw error;
      row = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('configuracion')
        .insert([{ cuota_mayor, cuota_menor }])
        .select().single();
      if (error) throw error;
      row = inserted;
    }
    setData(prev => ({ ...prev, configuracion: row }));
    return row;
  };

  // ── Miembros ─────────────────────────────────────────────
  const agregarMiembro = async ({ nombre, categoria, templo_id }) => {
    const deuda = categoria === 'mayor' ? data.configuracion.cuota_mayor : data.configuracion.cuota_menor;
    const { data: row, error } = await supabase
      .from('miembros')
      .insert([{ nombre, categoria, templo_id, deuda }])
      .select().single();
    if (error) throw error;
    setData(prev => ({ ...prev, miembros: [...prev.miembros, row].sort((a,b) => a.nombre.localeCompare(b.nombre)) }));
    return row;
  };

  const eliminarMiembro = async (id) => {
    const { error } = await supabase.from('miembros').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, miembros: prev.miembros.filter(m => m.id !== id) }));
  };

  // ── Cobradores ───────────────────────────────────────────
  const agregarCobrador = async ({ nombre, templo_id }) => {
    const { data: row, error } = await supabase
      .from('cobradores')
      .insert([{ nombre, templo_id }])
      .select().single();
    if (error) throw error;
    setData(prev => ({ ...prev, cobradores: [...prev.cobradores, row].sort((a,b) => a.nombre.localeCompare(b.nombre)) }));
    return row;
  };

  const eliminarCobrador = async (id) => {
    const { error } = await supabase.from('cobradores').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, cobradores: prev.cobradores.filter(c => c.id !== id) }));
  };

  // ── Cobranzas ────────────────────────────────────────────
  const registrarCobranza = async ({ cobrador_id, miembro_id, monto, numero_recibo, fecha }) => {
    // 1. Insertar cobranza
    const { data: cobranza, error: errCz } = await supabase
      .from('cobranzas')
      .insert([{ cobrador_id, miembro_id, monto, numero_recibo, fecha }])
      .select().single();
    if (errCz) throw errCz;

    // 2. Actualizar deuda del miembro
    const miembro = data.miembros.find(m => m.id === miembro_id);
    const nuevaDeuda = Math.max(0, miembro.deuda - monto);
    await supabase.from('miembros').update({ deuda: nuevaDeuda }).eq('id', miembro_id);

    // 3. Actualizar totales del cobrador
    const cobrador = data.cobradores.find(c => c.id === cobrador_id);
    await supabase.from('cobradores').update({
      total_cobrado: cobrador.total_cobrado + monto,
      cobranzas_registradas: cobrador.cobranzas_registradas + 1,
    }).eq('id', cobrador_id);

    await cargarTodo();
    return cobranza;
  };

  const eliminarCobranza = async (cobranza) => {
    const { error } = await supabase.from('cobranzas').delete().eq('id', cobranza.id);
    if (error) throw error;

    // Revertir deuda del miembro
    const miembro = data.miembros.find(m => m.id === cobranza.miembro_id);
    if (miembro) {
      const cuotaBase = miembro.categoria === 'mayor' ? data.configuracion.cuota_mayor : data.configuracion.cuota_menor;
      const deudaRevertida = Math.min(cuotaBase, miembro.deuda + cobranza.monto);
      await supabase.from('miembros').update({ deuda: deudaRevertida }).eq('id', cobranza.miembro_id);
    }
    // Revertir totales del cobrador
    const cobrador = data.cobradores.find(c => c.id === cobranza.cobrador_id);
    if (cobrador) {
      await supabase.from('cobradores').update({
        total_cobrado: Math.max(0, cobrador.total_cobrado - cobranza.monto),
        cobranzas_registradas: Math.max(0, cobrador.cobranzas_registradas - 1),
      }).eq('id', cobranza.cobrador_id);
    }
    await cargarTodo();
  };

  return {
    data, loading, error, cargarTodo,
    agregarTemplo, eliminarTemplo,
    actualizarCuotas,
    agregarMiembro, eliminarMiembro,
    agregarCobrador, eliminarCobrador,
    registrarCobranza, eliminarCobranza,
  };
}
