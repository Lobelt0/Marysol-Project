import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatoCorto } from '../utils/fechas';

const ALTO = 140;

export default function GraficoBarras({ datos }) {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);
  const max = Math.max(...datos.map((d) => d.valor), 0);

  return (
    <View style={styles.contenedor}>
      {datos.map((d, i) => {
        const alto = max > 0 ? Math.max((d.valor / max) * ALTO, d.valor > 0 ? 4 : 2) : 2;
        return (
          <View key={i} style={styles.columna}>
            <Text style={styles.valor}>{d.valor > 0 ? formatoCorto(d.valor) : ''}</Text>
            <View style={[styles.barra, { height: alto, opacity: d.valor > 0 ? 1 : 0.3 }]} />
            <Text style={styles.etiqueta}>{d.etiqueta}</Text>
          </View>
        );
      })}
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    contenedor: {
      flexDirection: 'row', alignItems: 'flex-end',
      justifyContent: 'space-around', height: ALTO + 50,
    },
    columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    valor: { fontSize: 11, color: c.textSecondary, marginBottom: 4 },
    barra: { width: 22, borderRadius: 6, backgroundColor: c.primary },
    etiqueta: { fontSize: 12, color: c.text, marginTop: 6, fontWeight: '600' },
  });