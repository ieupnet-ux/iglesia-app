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
    deudasAnuales: [],
    configuracion: { id: null, cuota_mayor: 50000, cuota_menor: 25000 },
  });

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, m, co, cz, cfg, da] = await Promise.all([
        supabase.from('templos').select('*').order('nombre'),
        supabase.from('miembros').select('*').order('nombre'),
        supabase.from('cobradores').select('*').order('nombre'),
        supabase.from('cobranzas').select('*').order('created_at', { ascending: false }),
        supabase.from('configuracion').select('*').limit(1),
        supabase.from('deudas_anuales').select('*').order('anio', { ascending: false }),
      ]);
      if (t.error) throw t.error;
      if (m.error) throw m.error;
      if (co.error) throw co.error;
      if (cz.error) throw cz.error;
      if (da.error) throw da.error;
      setData({
        templos:       t.data  || [],
        miembros:      m.data  || [],
        cobradores:    co.data || [],
        cobranzas:     cz.data || [],
        deudasAnuales: da.data || [],
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
        .eq('id', cfg.id).select().single();
      if (error) throw error;
      row = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('configuracion')
        .insert([{ cuota_mayor, cuota_menor }]).select().single();
      if (error) throw error;
      row = inserted;
    }
    setData(prev => ({ ...prev, configuracion: row }));
    return row;
  };

  // ── Miembros ─────────────────────────────────────────────
  const agregarMiembro = async ({ nombre, categoria, templo_id }) => {
    const { data: row, error } = await supabase
      .from('miembros')
      .insert([{ nombre, categoria, templo_id, deuda: 0 }])
      .select().single();
    if (error) throw error;

    // Generar deuda del año actual automáticamente
    const anioActual = new Date().getFullYear();
    const importe = categoria === 'mayor' ? data.configuracion.cuota_mayor : data.configuracion.cuota_menor;
    await supabase.from('deudas_anuales').insert([{
      miembro_id: row.id, anio: anioActual, importe, saldo: importe, pagado: false
    }]).select();

    await cargarTodo();
    return row;
  };

  const eliminarMiembro = async (id) => {
    const { error } = await supabase.from('miembros').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({
      ...prev,
      miembros: prev.miembros.filter(m => m.id !== id),
      deudasAnuales: prev.deudasAnuales.filter(d => d.miembro_id !== id),
    }));
  };

  // ── Cobradores ───────────────────────────────────────────
  const agregarCobrador = async ({ nombre, templo_id }) => {
    const { data: row, error } = await supabase
      .from('cobradores').insert([{ nombre, templo_id }]).select().single();
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
  const registrarCobranza = async ({ cobrador_id, miembro_id, deuda_anual_id, anio, monto, numero_recibo, fecha }) => {
    const { data: cobranza, error: errCz } = await supabase
      .from('cobranzas')
      .insert([{ cobrador_id, miembro_id, deuda_anual_id, anio, monto, numero_recibo, fecha }])
      .select().single();
    if (errCz) throw errCz;

    // Actualizar saldo de la deuda anual
    const deuda = data.deudasAnuales.find(d => d.id === deuda_anual_id);
    if (deuda) {
      const nuevoSaldo = Math.max(0, deuda.saldo - monto);
      await supabase.from('deudas_anuales').update({
        saldo: nuevoSaldo,
        pagado: nuevoSaldo === 0,
      }).eq('id', deuda_anual_id);
    }

    // Actualizar totales del cobrador
    const cobrador = data.cobradores.find(c => c.id === cobrador_id);
    if (cobrador) {
      await supabase.from('cobradores').update({
        total_cobrado: cobrador.total_cobrado + monto,
        cobranzas_registradas: cobrador.cobranzas_registradas + 1,
      }).eq('id', cobrador_id);
    }

    await cargarTodo();
    return cobranza;
  };

  const eliminarCobranza = async (cobranza) => {
    const { error } = await supabase.from('cobranzas').delete().eq('id', cobranza.id);
    if (error) throw error;

    // Revertir saldo de la deuda anual
    if (cobranza.deuda_anual_id) {
      const deuda = data.deudasAnuales.find(d => d.id === cobranza.deuda_anual_id);
      if (deuda) {
        const saldoRevertido = Math.min(deuda.importe, deuda.saldo + cobranza.monto);
        await supabase.from('deudas_anuales').update({
          saldo: saldoRevertido,
          pagado: false,
        }).eq('id', cobranza.deuda_anual_id);
      }
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

  // ── Deudas anuales ───────────────────────────────────────
  const generarDeudasAnio = async (anio) => {
    const { error } = await supabase.rpc('generar_deudas_anuales', { p_anio: anio });
    if (error) throw error;
    await cargarTodo();
  };

  const agregarDeudaManual = async ({ miembro_id, anio, importe }) => {
    const { data: row, error } = await supabase
      .from('deudas_anuales')
      .insert([{ miembro_id, anio, importe, saldo: importe, pagado: false }])
      .select().single();
    if (error) throw error;
    await cargarTodo();
    return row;
  };

  return {
    data, loading, error, cargarTodo,
    agregarTemplo, eliminarTemplo,
    actualizarCuotas,
    agregarMiembro, eliminarMiembro,
    agregarCobrador, eliminarCobrador,
    registrarCobranza, eliminarCobranza,
    generarDeudasAnio, agregarDeudaManual,
  };
}
