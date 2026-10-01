import 'react-native-url-polyfill/auto'; // PRIMERA línea, antes de todo
import { registerRootComponent } from 'expo';
import React from 'react';
import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}

registerRootComponent(App);