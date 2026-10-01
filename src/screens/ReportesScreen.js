import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import Calendario from '../components/Calendario';
import GraficoBarras from '../components/GraficoBarras';
import BarrasHorizontales from '../components/BarrasHorizontales';
import { MESES, claveDia, letraDia, horaCorta, formatearMoneda } from '../utils/fechas';

const SELECT = `
  id, monto, metodo_pago, fecha_corte, notas,
  cliente ( nombre ),
  tipo_corte ( nombre )
`;

async function traerCitas(barberoId, desde, hasta) {
  const { data, error } = await supabase
    .from('cita')
    .select(SELECT)
    .eq('barbero_id', barberoId)
    .gte('fecha_corte', desde.toISOString())
    .lt('fecha_corte', hasta.toISOString())
    .order('fecha_corte', { ascending: false });
  if (error) throw error;
  return data || [];
}

export default function ReportesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const [vista, setVista] = useState('calendario'); // 'calendario' | 'graficos'
  const [barberoId, setBarberoId] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const [mes, setMes] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  const [diaSel, setDiaSel] = useState(claveDia(new Date()));
  const [citasMes, setCitasMes] = useState([]);
  const [citasStats, setCitasStats] = useState([]);
  const [cargandoMes, setCargandoMes] = useState(true);
  const [cargandoStats, setCargandoStats] = useState(true);

  // Obtener el barbero autenticado una sola vez
  useEffect(() => {
    async function obtener() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: barbero } = await supabase
        .from('barbero').select('id').eq('auth_id', user.id).single();
      if (barbero) setBarberoId(barbero.id);
    }
    obtener();
  }, []);

  // Recargar cada vez que se entra a la pestaña
  useFocusEffect(
    useCallback(() => {
      setRecarga((n) => n + 1);
    }, [])
  );

  // Citas del mes visible (calendario)
  useEffect(() => {
    if (!barberoId) return;
    async function cargar() {
      try {
        setCargandoMes(true);
        const desde = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const hasta = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
        setCitasMes(await traerCitas(barberoId, desde, hasta));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setCargandoMes(false);
      }
    }
    cargar();
  }, [barberoId, mes, recarga]);

  // Últimos 30 días (gráficos)
  useEffect(() => {
    if (!barberoId) return;
    async function cargar() {
      try {
        setCargandoStats(true);
        const hoy = new Date();
        const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29);
        const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        setCitasStats(await traerCitas(barberoId, desde, hasta));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setCargandoStats(false);
      }
    }
    cargar();
  }, [barberoId, recarga]);

  function cambiarMes(delta) {
    setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1));
    setDiaSel(null);
  }

  // ---- Datos del calendario ----
  const marcados = useMemo(() => {
    const obj = {};
    citasMes.forEach((c) => {
      const k = claveDia(c.fecha_corte);
      obj[k] = (obj[k] || 0) + 1;
    });
    return obj;
  }, [citasMes]);

  const totalMes = useMemo(
    () => citasMes.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0),
    [citasMes]
  );

  const citasDia = useMemo(
    () => (diaSel ? citasMes.filter((c) => claveDia(c.fecha_corte) === diaSel) : []),
    [citasMes, diaSel]
  );
  const totalDia = citasDia.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);

  // ---- Datos de los gráficos ----
  const stats = useMemo(() => {
    const total = citasStats.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
    const cantidad = citasStats.length;

    // Ingresos de los últimos 7 días
    const ultimos7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = claveDia(d);
      const valor = citasStats
        .filter((c) => claveDia(c.fecha_corte) === k)
        .reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
      ultimos7.push({ etiqueta: letraDia(d), valor });
    }

    // Servicios más vendidos
    const porServicio = {};
    citasStats.forEach((c) => {
      const n = c.tipo_corte?.nombre || 'Sin servicio';
      porServicio[n] = porServicio[n] || { cantidad: 0, total: 0 };
      porServicio[n].cantidad += 1;
      porServicio[n].total += parseFloat(c.monto) || 0;
    });
    const topServicios = Object.entries(porServicio)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 5)
      .map(([nombre, v]) => ({
        etiqueta: nombre,
        valor: v.cantidad,
        detalle: `${v.cantidad} · ${formatearMoneda(v.total)}`,
      }));

    // Métodos de pago
    const porMetodo = {};
    citasStats.forEach((c) => {
      const n = c.metodo_pago || 'Otro';
      porMetodo[n] = (porMetodo[n] || 0) + (parseFloat(c.monto) || 0);
    });
    const metodos = Object.entries(porMetodo)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, monto]) => ({
        etiqueta: nombre,
        valor: monto,
        detalle: `${formatearMoneda(monto)} (${total > 0 ? Math.round((monto / total) * 100) : 0}%)`,
      }));

    return {
      total,
      cantidad,
      promedio: cantidad > 0 ? total / cantidad : 0,
      ultimos7,
      topServicios,
      metodos,
    };
  }, [citasStats]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.selector}>
        {[
          { id: 'calendario', label: 'Calendario' },
          { id: 'graficos', label: 'Gráficos' },
        ].map((op) => (
          <TouchableOpacity
            key={op.id}
            style={[styles.opcion, vista === op.id && styles.opcionActiva]}
            onPress={() => setVista(op.id)}
          >
            <Text style={[styles.opcionTexto, vista === op.id && styles.opcionTextoActivo]}>
              {op.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {vista === 'calendario' ? (
        <View>
          <View style={styles.resumenFila}>
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaLabel}>Ingresos {MESES[mes.getMonth()]}</Text>
              <Text style={styles.tarjetaValor}>{formatearMoneda(totalMes)}</Text>
            </View>
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaLabel}>Atenciones</Text>
              <Text style={styles.tarjetaValor}>{citasMes.length}</Text>
            </View>
          </View>

          <Calendario
            mes={mes}
            onCambiarMes={cambiarMes}
            marcados={marcados}
            seleccionado={diaSel}
            onSeleccionar={setDiaSel}
          />

          {cargandoMes ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={{ marginTop: 16 }}>
              {diaSel ? (
                <>
                  <View style={styles.detalleCabecera}>
                    <Text style={styles.seccion}>{diaSel}</Text>
                    <Text style={styles.totalDia}>{formatearMoneda(totalDia)}</Text>
                  </View>
                  {citasDia.length === 0 ? (
                    <Text style={styles.vacio}>Sin atenciones este día.</Text>
                  ) : (
                    citasDia.map((c) => (
                      <View key={c.id} style={styles.cita}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.citaServicio}>{c.tipo_corte?.nombre || 'Servicio'}</Text>
                          <Text style={styles.citaDetalle}>
                            {horaCorta(c.fecha_corte)} · {c.cliente?.nombre || 'Cliente General'} · {c.metodo_pago}
                          </Text>
                        </View>
                        <Text style={styles.citaMonto}>{formatearMoneda(c.monto)}</Text>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <Text style={styles.vacio}>Toca un día para ver sus atenciones.</Text>
              )}
            </View>
          )}
        </View>
      ) : cargandoStats ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <View>
          <Text style={styles.nota}>Últimos 30 días</Text>
          <View style={styles.resumenFila}>
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaLabel}>Ingresos</Text>
              <Text style={styles.tarjetaValor}>{formatearMoneda(stats.total)}</Text>
            </View>
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaLabel}>Promedio por atención</Text>
              <Text style={styles.tarjetaValor}>{formatearMoneda(stats.promedio)}</Text>
            </View>
          </View>

          <View style={styles.bloque}>
            <Text style={styles.seccion}>Ingresos de los últimos 7 días</Text>
            <GraficoBarras datos={stats.ultimos7} />
          </View>

          <View style={styles.bloque}>
            <Text style={styles.seccion}>Servicios más vendidos</Text>
            <BarrasHorizontales datos={stats.topServicios} />
          </View>

          <View style={styles.bloque}>
            <Text style={styles.seccion}>Métodos de pago</Text>
            <BarrasHorizontales datos={stats.metodos} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 16, backgroundColor: c.background },
    selector: {
      flexDirection: 'row', backgroundColor: c.btnSecondary,
      borderRadius: 10, padding: 3, marginBottom: 16,
    },
    opcion: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    opcionActiva: { backgroundColor: c.primary },
    opcionTexto: { fontSize: 14, fontWeight: '600', color: c.btnSecondaryText },
    opcionTextoActivo: { color: '#FFF' },
    resumenFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    tarjeta: { flex: 0.48, backgroundColor: c.card, padding: 14, borderRadius: 12, elevation: 2 },
    tarjetaLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
    tarjetaValor: { fontSize: 20, fontWeight: 'bold', color: c.primary },
    detalleCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seccion: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 10 },
    totalDia: { fontSize: 16, fontWeight: 'bold', color: c.success },
    vacio: { color: c.textSecondary, textAlign: 'center', marginTop: 10 },
    cita: {
      backgroundColor: c.card, padding: 12, borderRadius: 10, marginBottom: 8,
      flexDirection: 'row', alignItems: 'center', elevation: 1,
    },
    citaServicio: { fontSize: 15, fontWeight: 'bold', color: c.text },
    citaDetalle: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    citaMonto: { fontSize: 15, fontWeight: 'bold', color: c.success },
    nota: { fontSize: 13, color: c.textSecondary, marginBottom: 10 },
    bloque: { backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2 },
  });