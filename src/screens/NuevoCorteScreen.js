import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';

export default function NuevoCorteScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);
  const itemProps = { color: colors.text, style: { backgroundColor: colors.inputBg } };

  const [barberoActual, setBarberoActual] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [clienteId, setClienteId] = useState('');
  const [tipoCorteId, setTipoCorteId] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: barbero, error: errorBarbero } = await supabase
        .from('barbero')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (errorBarbero || !barbero) throw new Error('No se encontró tu perfil de barbero.');
      setBarberoActual(barbero);

      const [resClientes, resServicios] = await Promise.all([
        supabase.from('cliente').select('*').eq('barbero_id', barbero.id).order('nombre'),
        supabase.from('tipo_corte').select('*').eq('barbero_id', barbero.id).order('nombre'),
      ]);

      if (resClientes.error) throw resClientes.error;
      if (resServicios.error) throw resServicios.error;

      setClientes(resClientes.data || []);
      setServicios(resServicios.data || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function guardarCita() {
    if (!tipoCorteId || !monto) {
      Alert.alert('Atención', 'Selecciona el servicio e ingresa el monto.');
      return;
    }
    if (!barberoActual) {
      Alert.alert('Error', 'No se pudo identificar al barbero. Intenta de nuevo.');
      return;
    }
    try {
      setGuardando(true);
      const { error } = await supabase.from('cita').insert([{
        cliente_id: clienteId ? parseInt(clienteId) : null,
        barbero_id: barberoActual.id,
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
        <Picker
          selectedValue={clienteId}
          onValueChange={setClienteId}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="Cliente General" value="" {...itemProps} />
          {clientes.map((c) => (
            <Picker.Item key={c.id} label={c.nombre} value={c.id.toString()} {...itemProps} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Servicio *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={tipoCorteId}
          onValueChange={(value) => {
            setTipoCorteId(value);
            const servicio = servicios.find((s) => s.id.toString() === value);
            setMonto(servicio ? servicio.precio.toString() : '');
          }}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="Seleccionar servicio..." value="" {...itemProps} />
          {servicios.map((s) => (
            <Picker.Item key={s.id} label={s.nombre} value={s.id.toString()} {...itemProps} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Monto ($) *</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
        value={monto}
        onChangeText={setMonto}
      />

      <Text style={styles.label}>Método de Pago</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={metodoPago}
          onValueChange={setMetodoPago}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="Efectivo" value="Efectivo" {...itemProps} />
          <Picker.Item label="Transferencia" value="Transferencia" {...itemProps} />
          <Picker.Item label="Débito" value="Débito" {...itemProps} />
        </Picker>
      </View>

      <Text style={styles.label}>Notas (Opcional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Observaciones..."
        placeholderTextColor={colors.placeholder}
        multiline
        value={notas}
        onChangeText={setNotas}
      />

      <TouchableOpacity style={styles.btnGuardar} onPress={guardarCita} disabled={guardando}>
        {guardando
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.btnTexto}>Registrar Atención</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: c.background },
    titulo: { fontSize: 22, fontWeight: 'bold', color: c.text, marginBottom: 5 },
    barberoInfo: { fontSize: 14, color: c.textSecondary, marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 5, marginTop: 10 },
    input: {
      backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border,
      borderRadius: 8, padding: 12, fontSize: 16, color: c.text,
    },
    pickerContainer: {
      backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border,
      borderRadius: 8, marginBottom: 5,
    },
    picker: { color: c.text },
    btnGuardar: {
      backgroundColor: c.primary, padding: 15, borderRadius: 8,
      alignItems: 'center', marginTop: 20, marginBottom: 40,
    },
    btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  });