import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function BarrasHorizontales({ datos, vacio = 'Sin datos todavía.' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);
  const max = Math.max(...datos.map((d) => d.valor), 0);

  if (datos.length === 0) return <Text style={styles.vacio}>{vacio}</Text>;

  return (
    <View>
      {datos.map((d, i) => {
        const pct = max > 0 ? (d.valor / max) * 100 : 0;
        return (
          <View key={i} style={styles.fila}>
            <View style={styles.textos}>
              <Text style={styles.etiqueta} numberOfLines={1}>{d.etiqueta}</Text>
              <Text style={styles.detalle}>{d.detalle}</Text>
            </View>
            <View style={styles.pista}>
              <View style={[styles.relleno, { width: `${pct}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    fila: { marginBottom: 12 },
    textos: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    etiqueta: { fontSize: 14, color: c.text, flex: 1, marginRight: 8 },
    detalle: { fontSize: 13, color: c.textSecondary },
    pista: { height: 10, borderRadius: 5, backgroundColor: c.border, overflow: 'hidden' },
    relleno: { height: 10, borderRadius: 5, backgroundColor: c.primary },
    vacio: { color: c.textSecondary, textAlign: 'center', paddingVertical: 10 },
  });