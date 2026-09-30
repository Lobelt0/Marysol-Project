import 'react-native-url-polyfill/auto'; // PRIMERA línea, antes de todo
import { registerRootComponent } from 'expo';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return <AppNavigator />;
}

registerRootComponent(App);