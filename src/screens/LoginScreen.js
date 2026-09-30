import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [nombre, setNombre] = useState(''); // Campo nombre para el barbero
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atención', 'Ingresa correo y contraseña.');
      return;
    }

    if (esRegistro && !nombre.trim()) {
      Alert.alert('Atención', 'Ingresa tu nombre completo para el perfil de barbero.');
      return;
    }

    try {
      setCargando(true);

      if (esRegistro) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
  });

  if (authError) throw new Error(authError.message);

  const user = authData?.user;
  if (!user) throw new Error('No se pudo crear el usuario. Intenta de nuevo.');

  // Esperar un momento para que Auth procese el usuario
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error: barberoError } = await supabase.from('barbero').insert([{
    nombre: nombre.trim(),
    correo: email.trim(),
    auth_id: user.id,
  }]);

  if (barberoError) throw new Error(barberoError.message);

  Alert.alert('Éxito', 'Cuenta creada correctamente. Ya puedes ingresar.');
  setEsRegistro(false);
} else {
        // Inicio de sesión normal
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw new Error(error.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Barbería App</Text>
      <Text style={styles.subtitulo}>
        {esRegistro ? 'Registro de Nuevo Barbero' : 'Iniciar Sesión'}
      </Text>

      {esRegistro && (
        <TextInput
          style={styles.input}
          placeholder="Nombre completo (Barbero) *"
          value={nombre}
          onChangeText={setNombre}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.btnPrincipal}
        onPress={handleAuth}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnTexto}>
            {esRegistro ? 'Registrarme como Barbero' : 'Ingresar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnModo}
        onPress={() => setEsRegistro(!esRegistro)}
      >
        <Text style={styles.modoTexto}>
          {esRegistro
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿Nuevo barbero? Registra tu cuenta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    backgroundColor: '#F8F9FA',
  },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  btnPrincipal: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnModo: { marginTop: 20, alignItems: 'center' },
  modoTexto: { color: '#007AFF', fontSize: 14 },
});