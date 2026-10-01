import React, { useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const [nombre, setNombre] = useState('');
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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { error: barberoError } = await supabase.from('barbero').insert([
          {
            nombre: nombre.trim(),
            correo: email.trim(),
            auth_id: user.id,
          },
        ]);

        if (barberoError) throw new Error(barberoError.message);

        Alert.alert('Éxito', 'Cuenta de barbero registrada correctamente. Ya puedes ingresar.');
        setEsRegistro(false);
      } else {
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
          placeholderTextColor={colors.placeholder}
          value={nombre}
          onChangeText={setNombre}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico *"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña *"
        placeholderTextColor={colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleAuth} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnTexto}>
            {esRegistro ? 'Registrarme como Barbero' : 'Ingresar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnModo} onPress={() => setEsRegistro(!esRegistro)}>
        <Text style={styles.modoTexto}>
          {esRegistro
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿Nuevo barbero? Registra tu cuenta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 25,
      backgroundColor: c.background,
    },
    titulo: { fontSize: 28, fontWeight: 'bold', color: c.text, textAlign: 'center' },
    subtitulo: { fontSize: 16, color: c.textSecondary, textAlign: 'center', marginBottom: 25, marginTop: 5 },
    input: {
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      fontSize: 16,
      color: c.text,
    },
    btnPrincipal: {
      backgroundColor: c.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 5,
    },
    btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    btnModo: { marginTop: 20, alignItems: 'center' },
    modoTexto: { color: c.primary, fontSize: 14 },
  });