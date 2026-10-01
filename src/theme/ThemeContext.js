import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tema_preferido';

export const paletaClara = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#DDDDDD',
  primary: '#007AFF',
  inputBg: '#FFFFFF',
  placeholder: '#999999',
  danger: '#FF3B30',
  success: '#2E7D32',
  overlay: 'rgba(0,0,0,0.5)',
  btnSecondary: '#E5E5EA',
  btnSecondaryText: '#666666',
  tabBar: '#FFFFFF',
};

export const paletaOscura = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#F2F2F2',
  textSecondary: '#A0A0A0',
  border: '#333333',
  primary: '#0A84FF',
  inputBg: '#2A2A2A',
  placeholder: '#777777',
  danger: '#FF453A',
  success: '#66BB6A',
  overlay: 'rgba(0,0,0,0.7)',
  btnSecondary: '#3A3A3C',
  btnSecondaryText: '#CCCCCC',
  tabBar: '#1E1E1E',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [modo, setModo] = useState('system'); // 'system' | 'light' | 'dark'
  const [listo, setListo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((valor) => {
        if (valor === 'system' || valor === 'light' || valor === 'dark') setModo(valor);
      })
      .catch(() => {})
      .finally(() => setListo(true));
  }, []);

  function cambiarModo(nuevo) {
    setModo(nuevo);
    AsyncStorage.setItem(STORAGE_KEY, nuevo).catch(() => {});
  }

  function ciclarModo() {
    const siguiente = modo === 'system' ? 'light' : modo === 'light' ? 'dark' : 'system';
    cambiarModo(siguiente);
  }

  const esOscuro = modo === 'system' ? sistema === 'dark' : modo === 'dark';

  const value = useMemo(
    () => ({
      modo,
      esOscuro,
      colors: esOscuro ? paletaOscura : paletaClara,
      cambiarModo,
      ciclarModo,
    }),
    [modo, esOscuro]
  );

  if (!listo) return null; // evita el parpadeo de tema al abrir

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}