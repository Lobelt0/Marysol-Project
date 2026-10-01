import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { formatearMoneda, formatoFecha } from '../utils/fechas';

// Deja solo dígitos. Si es un celular chileno de 9 dígitos sin código de país, antepone 56.
function digitosWhatsApp(tel) {
  let d = (tel || '').replace(/\D/g, '');
  if (d.length === 9 && d.startsWith('9')) d = '56' + d;
  return d;
}

export default function FichaCliente({ cliente, onCerrar, onCambio }) {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    setEditando(false);
    setNombre(cliente.nombre);
    setTelefono(cliente.telefono || '');
    cargarStats(cliente.id);
  }, [cliente]);

  async function cargarStats(id) {
    try {
      setCargando(true);
      setStats(null);
      const { data, error } = await supabase
        .from('cita')
        .select('monto, fecha_corte')
        .eq('cliente_id', id)
        .order('fecha_corte', { ascending: false });
      if (error) throw error;

      const lista = data || [];
      setStats({
        visitas: lista.length,
        total: lista.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0),
        ultima: lista.length > 0 ? lista[0].fecha_corte : null,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCargando(false);
    }
  }

  async function abrir(url) {
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la aplicación.');
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'El nombre es obligatorio.');
      return;
    }
    try {
      setGuardando(true);
      const { error } = await supabase
        .from('cliente')
        .update({ nombre: nombre.trim(), telefono: telefono.trim() || null })
        .eq('id', cliente.id);
      if (error) throw error;
      onCambio();
      onCerrar();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert(
      'Eliminar cliente',
      `¿Eliminar a ${cliente.nombre}? Sus atenciones anteriores se mantienen en el historial y los reportes, pero aparecerán como "Cliente General".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: eliminar },
      ]
    );
  }

  async function eliminar() {
    try {
      const { error } = await supabase.from('cliente').delete().eq('id', cliente.id);
      if (error) throw error;
      onCambio();
      onCerrar();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <Modal visible={!!cliente} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        {cliente && (
          <View style={styles.contenedor}>
            {editando ? (
              <>
                <Text style={styles.titulo}>Editar cliente</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre *"
                  placeholderTextColor={colors.placeholder}
                  value={nombre}
                  onChangeText={setNombre}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono (opcional)"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={telefono}
                  onChangeText={setTelefono}
                />
                <View style={styles.filaBotones}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.btnSecondary }]}
                    onPress={() => setEditando(false)}
                  >
                    <Text style={{ color: colors.btnSecondaryText }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={guardar}
                    disabled={guardando}
                  >
                    <Text style={styles.btnTextoBlanco}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.titulo}>{cliente.nombre}</Text>
                <Text style={styles.telefono}>{cliente.telefono || 'Sin teléfono'}</Text>

                {cargando || !stats ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.statsFila}>
                    <View style={styles.stat}>
                      <Text style={styles.statValor}>{stats.visitas}</Text>
                      <Text style={styles.statLabel}>Visitas</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValor}>{formatearMoneda(stats.total)}</Text>
                      <Text style={styles.statLabel}>Total gastado</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValor}>
                        {stats.ultima ? formatoFecha(stats.ultima) : '—'}
                      </Text>
                      <Text style={styles.statLabel}>Última visita</Text>
                    </View>
                  </View>
                )}

                {!!cliente.telefono && (
                  <View style={styles.filaBotones}>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: colors.primary }]}
                      onPress={() => abrir(`tel:${cliente.telefono.replace(/[^\d+]/g, '')}`)}
                    >
                      <Ionicons name="call-outline" size={18} color="#FFF" />
                      <Text style={styles.btnTextoBlanco}> Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: '#25D366' }]}
                      onPress={() => abrir(`https://wa.me/${digitosWhatsApp(cliente.telefono)}`)}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                      <Text style={styles.btnTextoBlanco}> WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.filaBotones}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.btnSecondary }]}
                    onPress={() => setEditando(true)}
                  >
                + Registrar    <Ionicons name="create-outline" size={18} color={colors.btnSecondaryText} />
                    <Text style={{ color: colors.btnSecondaryText }}> Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.btnSecondary }]}
                    onPress={confirmarEliminar}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={{ color: colors.danger }}> Eliminar</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cerrar} onPress={onCerrar}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center' },
    contenedor: { width: '88%', backgroundColor: c.card, borderRadius: 14, padding: 20 },
    titulo: { fontSize: 20, fontWeight: 'bold', color: c.text, marginBottom: 4 },
    telefono: { fontSize: 14, color: c.textSecondary, marginBottom: 14 },
    statsFila: { flexDirection: 'row', marginBottom: 16 },
    stat: {
      flex: 1, alignItems: 'center', paddingVertical: 10,
      backgroundColor: c.background, borderRadius: 10, marginHorizontal: 3,
    },
    statValor: { fontSize: 14, fontWeight: 'bold', color: c.primary },
    statLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
    input: {
      borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10,
      marginTop: 10, color: c.text, backgroundColor: c.inputBg,
    },
    filaBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    btn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 11, borderRadius: 8, marginHorizontal: 4,
    },
    btnTextoBlanco: { color: '#FFF', fontWeight: 'bold' },
    cerrar: { alignItems: 'center', marginTop: 16 },
  });