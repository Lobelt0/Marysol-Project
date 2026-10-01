import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import NuevoCorteScreen from '../screens/NuevoCorteScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import ClientesScreen from '../screens/ClientesScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();

const iconoModo = {
  system: 'phone-portrait-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
};

export default function AppNavigator() {
  const { colors, esOscuro, modo, cambiarModo } = useTheme();
  const [session, setSession] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargando(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCargando(false);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  function confirmarCerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

    function elegirTema() {
    Alert.alert(
      'Apariencia',
      'Elige el modo de la app',
      [
        { text: 'Claro', onPress: () => cambiarModo('light') },
        { text: 'Oscuro', onPress: () => cambiarModo('dark') },
        { text: 'Predeterminado del dispositivo', onPress: () => cambiarModo('system') },
      ],
      { cancelable: true }
    );
  }

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  const base = esOscuro ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.tabBar,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const iconos = {
              Inicio: focused ? 'home' : 'home-outline',
              NuevoCorte: focused ? 'add-circle' : 'add-circle-outline',
              Servicios: focused ? 'cut' : 'cut-outline',
              Clientes: focused ? 'people' : 'people-outline',
            };
            return <Ionicons name={iconos[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
          headerStyle: { backgroundColor: colors.tabBar },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <TouchableOpacity
                onPress={elegirTema}
                style={{ marginRight: 18 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={iconoModo[modo]} size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarCerrarSesion}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="log-out-outline" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Resumen' }} />
        <Tab.Screen name="NuevoCorte" component={NuevoCorteScreen} options={{ title: '+ Registrar' }} />
        <Tab.Screen name="Servicios" component={ServiciosScreen} options={{ title: 'Servicios' }} />
        <Tab.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Clientes' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}