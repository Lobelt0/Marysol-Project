import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const [citasHoy, setCitasHoy] = useState([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barberoId, setBarberoId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function obtenerBarberoId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: barbero, error } = await supabase
      .from('barbero')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (error || !barbero) {
      await supabase.auth.signOut();
      return null;
    }

    return barbero.id;
  }

  async function cargarDatos() {
    try {
      const id = barberoId ?? (await obtenerBarberoId());
      if (!id) return;
      setBarberoId(id);

      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('cita')
        .select(`
          id, monto, metodo_pago, fecha_corte, notas,
          cliente ( nombre, telefono ),
          barbero ( nombre ),
          tipo_corte ( nombre )
        `)
        .eq('barbero_id', id)
        .gte('fecha_corte', inicioHoy.toISOString())
        .order('fecha_corte', { ascending: false });

      if (error) throw error;

      const registros = data || [];
      setCitasHoy(registros);
      const suma = registros.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
      setTotalIngresos(suma);
    } catch (err) {
      console.log('Error:', err.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }

  function confirmarEliminacion(id) {
    Alert.alert('Anular Registro', '¿Eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarCita(id) },
    ]);
  }

  async function eliminarCita(id) {
    try {
      const { error } = await supabase.from('cita').delete().eq('id', id);
      if (error) throw error;
      Alert.alert('Éxito', 'Registro eliminado.');
      cargarDatos();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resumen del Día</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ingresos Hoy</Text>
          <Text style={styles.metricValue}>${totalIngresos.toLocaleString()}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Atenciones</Text>
          <Text style={styles.metricValue}>{citasHoy.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>Atenciones Recientes (Mantén para anular)</Text>

      {cargando && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={citasHoy}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={cargarDatos}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.card}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onLongPress={() => confirmarEliminacion(item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.servicioNombre}>
                  {item.tipo_corte?.nombre || 'Servicio'}
                </Text>
                <Text style={styles.barberoNombre}>
                  Cliente: {item.cliente?.nombre || 'Cliente General'}
                </Text>
                <Text style={styles.barberoNombre}>Método: {item.metodo_pago}</Text>
              </View>
              <Text style={styles.monto}>${item.monto || 0}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay atenciones registradas hoy.</Text>
          }
        />
      )}
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: c.background },
    titulo: { fontSize: 24, fontWeight: 'bold', color: c.text, marginBottom: 16 },
    subtitulo: { fontSize: 15, fontWeight: '600', color: c.textSecondary, marginBottom: 12, marginTop: 10 },
    metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    metricCard: { flex: 0.48, backgroundColor: c.card, padding: 16, borderRadius: 12, elevation: 2 },
    metricLabel: { fontSize: 13, color: c.textSecondary, marginBottom: 4 },
    metricValue: { fontSize: 22, fontWeight: 'bold', color: c.primary },
    card: {
      backgroundColor: c.card, padding: 14, borderRadius: 10, marginBottom: 10,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1,
    },
    servicioNombre: { fontSize: 16, fontWeight: 'bold', color: c.text },
    barberoNombre: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    monto: { fontSize: 16, fontWeight: 'bold', color: c.success },
    emptyText: { textAlign: 'center', color: c.textSecondary, marginTop: 30 },
  });