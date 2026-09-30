import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../services/supabase';

export default function NuevoCorteScreen() {
  const [barberoActual, setBarberoActual] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [clienteId, setClienteId] = useState('');
  const [barberoId, setBarberoId] = useState('');
  const [tipoCorteId, setTipoCorteId] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerBarberoAutenticado();
    cargarClientes();
    cargarServicios();
  }, []);

  async function obtenerBarberoAutenticado() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('barbero')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        if (error) throw error;
        if (data) {
          setBarberoActual(data);
          setBarberoId(data.id.toString());
        }
      }
    } catch (err) {
      console.log('Error al obtener barbero:', err.message);
    }
  }

async function cargarClientes() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: barbero } = await supabase
    .from('barbero').select('id').eq('auth_id', user.id).single();
  const { data } = await supabase
    .from('cliente').select('*')
    .eq('barbero_id', barbero.id).order('nombre');
  setClientes(data || []);
}

async function cargarServicios() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: barbero } = await supabase
    .from('barbero').select('id').eq('auth_id', user.id).single();
  const { data } = await supabase
    .from('tipo_corte').select('*')
    .eq('barbero_id', barbero.id).order('nombre');
  setServicios(data || []);
}

  async function guardarCita() {
    if (!tipoCorteId || !monto) {
      Alert.alert('Atención', 'Selecciona el servicio e ingresa el monto.');
      return;
    }
    try {
      setGuardando(true);
      const { error } = await supabase.from('cita').insert([{
        cliente_id: clienteId ? parseInt(clienteId) : null,
        barbero_id: barberoId ? parseInt(barberoId) : null,
        tipo_corte_id: parseInt(tipoCorteId),
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
        notas: notas.trim() || null,
        fecha_corte: new Date().toISOString(),
      }]);
      if (error) throw new Error(error.message);
      Alert.alert('Éxito', 'Atención registrada correctamente.');
      setClienteId('');
      setTipoCorteId('');
      setMonto('');
      setNotas('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Registrar Atención</Text>
      {barberoActual && (
        <Text style={styles.barberoInfo}>Barbero: {barberoActual.nombre}</Text>
      )}

      <Text style={styles.label}>Cliente</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={clienteId} onValueChange={setClienteId}>
          <Picker.Item label="Cliente General" value="" />
          {clientes.map(c => (
            <Picker.Item key={c.id} label={c.nombre} value={c.id.toString()} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Servicio *</Text>
      <View style={styles.pickerContainer}>
        <Picker
  selectedValue={tipoCorteId}
  onValueChange={(value) => {
    setTipoCorteId(value);
    const servicio = servicios.find(s => s.id.toString() === value);
    if (servicio) setMonto(servicio.precio.toString());
    else setMonto('');
  }}
>
          <Picker.Item label="Seleccionar servicio..." value="" />
          {servicios.map(s => (
            <Picker.Item key={s.id} label={s.nombre} value={s.id.toString()} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Monto ($) *</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="numeric"
        value={monto}
        onChangeText={setMonto}
      />

      <Text style={styles.label}>Método de Pago</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={metodoPago} onValueChange={setMetodoPago}>
          <Picker.Item label="Efectivo" value="Efectivo" />
          <Picker.Item label="Transferencia" value="Transferencia" />
          <Picker.Item label="Débito" value="Débito" />
        </Picker>
      </View>

      <Text style={styles.label}>Notas (Opcional)</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Observaciones..."
        multiline
        value={notas}
        onChangeText={setNotas}
      />

      <TouchableOpacity
        style={styles.btnGuardar}
        onPress={guardarCita}
        disabled={guardando}
      >
        {guardando
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.btnTexto}>Registrar Atención</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: '#F8F9FA' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5 },
  barberoInfo: { fontSize: 14, color: '#666', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, marginBottom: 5 },
  btnGuardar: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});