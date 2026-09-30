import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function ServiciosScreen() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [barberoId, setBarberoId] = useState(null);

  useEffect(() => {
    obtenerBarberoYServicios();
  }, []);

  async function obtenerBarberoYServicios() {
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

      const { data, error: errorServicios } = await supabase
        .from('tipo_corte')
        .select('*')
        .eq('barbero_id', barbero.id)
        .order('nombre');

      if (errorServicios) throw errorServicios;
      setServicios(data || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCargando(false);
    }
  }

  async function agregarServicio() {
    if (!nombre.trim() || !precio.trim()) {
      Alert.alert('Atención', 'Ingresa nombre y precio.');
      return;
    }
    try {
      setGuardando(true);
      const { error } = await supabase.from('tipo_corte').insert([{
        nombre: nombre.trim(),
        precio: parseInt(precio),
        barbero_id: barberoId,
      }]);
      if (error) throw error;
      Alert.alert('Éxito', 'Servicio agregado.');
      setNombre('');
      setPrecio('');
      setModalVisible(false);
      obtenerBarberoYServicios();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis Servicios</Text>
        <TouchableOpacity style={styles.btnAgregar} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnTexto}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nombreServicio}>{item.nombre}</Text>
              <Text style={styles.precioServicio}>${item.precio.toLocaleString()}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes servicios registrados.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Nuevo Servicio</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del servicio *"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio ($) *"
              keyboardType="numeric"
              value={precio}
              onChangeText={setPrecio}
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#666' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnGuardar]}
                onPress={agregarServicio}
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  btnAgregar: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnTexto: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  nombreServicio: { fontSize: 16, fontWeight: '600', color: '#333' },
  precioServicio: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  btnModal: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 },
  btnCancelar: { backgroundColor: '#E5E5EA' },
  btnGuardar: { backgroundColor: '#007AFF' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 30 },
});