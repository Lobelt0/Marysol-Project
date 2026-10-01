import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';

export default function ClientesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [barberoId, setBarberoId] = useState(null);

  useEffect(() => {
    obtenerBarberoYClientes();
  }, []);

  async function obtenerBarberoYClientes() {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: barbero, error } = await supabase
        .from('barbero')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;
      setBarberoId(barbero.id);

      const { data, error: errorClientes } = await supabase
        .from('cliente')
        .select('*')
        .eq('barbero_id', barbero.id)
        .order('nombre');

      if (errorClientes) throw errorClientes;
      setClientes(data || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCargando(false);
    }
  }

  async function agregarCliente() {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'El nombre es obligatorio.');
      return;
    }
    try {
      setGuardando(true);
      const { error } = await supabase.from('cliente').insert([{
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        barbero_id: barberoId,
      }]);
      if (error) throw error;
      Alert.alert('Éxito', 'Cliente guardado.');
      setNombre('');
      setTelefono('');
      setModalVisible(false);
      obtenerBarberoYClientes();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis Clientes</Text>
        <TouchableOpacity style={styles.btnAgregar} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnTexto}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.telefono}>{item.telefono || 'Sin teléfono'}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes clientes registrados.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Nuevo Cliente</Text>
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
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.btnSecondaryText }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnGuardar]}
                onPress={agregarCliente}
                disabled={guardando}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: c.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: c.text },
    btnAgregar: { backgroundColor: c.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    btnTexto: { color: '#FFF', fontWeight: 'bold' },
    card: { backgroundColor: c.card, padding: 14, borderRadius: 10, marginBottom: 10, elevation: 1 },
    nombre: { fontSize: 16, fontWeight: 'bold', color: c.text },
    telefono: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: c.card, borderRadius: 12, padding: 20 },
    modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: c.text },
    input: {
      borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10,
      marginBottom: 12, color: c.text, backgroundColor: c.inputBg,
    },
    modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    btnModal: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 },
    btnCancelar: { backgroundColor: c.btnSecondary },
    btnGuardar: { backgroundColor: c.primary },
    emptyText: { textAlign: 'center', color: c.textSecondary, marginTop: 30 },
  });