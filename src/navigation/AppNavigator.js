import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

import HomeScreen from '../screens/HomeScreen';
import NuevoCorteScreen from '../screens/NuevoCorteScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import ClientesScreen from '../screens/ClientesScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
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

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer theme={DefaultTheme}>
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
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#666666',
          tabBarStyle: { backgroundColor: '#FFFFFF' },
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerRight: () => (
            <TouchableOpacity
              onPress={confirmarCerrarSesion}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          ),
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Resumen' }} />
        <Tab.Screen name="NuevoCorte" component={NuevoCorteScreen} options={{ title: 'Registrar' }} />
        <Tab.Screen name="Servicios" component={ServiciosScreen} options={{ title: 'Servicios' }} />
        <Tab.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Clientes' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}