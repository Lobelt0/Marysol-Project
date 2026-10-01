import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { MESES, DIAS_SEMANA, armarClave, claveDia } from '../utils/fechas';

export default function Calendario({ mes, onCambiarMes, marcados, seleccionado, onSeleccionar }) {
  const { colors } = useTheme();
  const styles = useMemo(() => crearEstilos(colors), [colors]);

  const anio = mes.getFullYear();
  const m = mes.getMonth();
  const diasEnMes = new Date(anio, m + 1, 0).getDate();
  const offset = (new Date(anio, m, 1).getDay() + 6) % 7; // semana parte en lunes
  const hoy = claveDia(new Date());

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <TouchableOpacity onPress={() => onCambiarMes(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.tituloMes}>{MESES[m]} {anio}</Text>
        <TouchableOpacity onPress={() => onCambiarMes(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.fila}>
        {DIAS_SEMANA.map((d, i) => (
          <View key={i} style={styles.celda}>
            <Text style={styles.diaSemana}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grilla}>
        {celdas.map((dia, i) => {
          if (dia === null) return <View key={i} style={styles.celda} />;
          const clave = armarClave(anio, m, dia);
          const esSel = clave === seleccionado;
          const esHoy = clave === hoy;
          const tiene = !!marcados[clave];
          return (
            <TouchableOpacity key={i} style={styles.celda} onPress={() => onSeleccionar(clave)}>
              <View
                style={[
                  styles.circulo,
                  esHoy && !esSel && { borderWidth: 1, borderColor: colors.primary },
                  esSel && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.numero, esSel && { color: '#FFF', fontWeight: 'bold' }]}>{dia}</Text>
              </View>
              <View style={[styles.punto, { opacity: tiene ? 1 : 0 }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const crearEstilos = (c) =>
  StyleSheet.create({
    contenedor: { backgroundColor: c.card, borderRadius: 12, padding: 12, elevation: 2 },
    encabezado: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10,
    },
    tituloMes: { fontSize: 17, fontWeight: 'bold', color: c.text },
    fila: { flexDirection: 'row' },
    grilla: { flexDirection: 'row', flexWrap: 'wrap' },
    celda: { width: '14.2857%', alignItems: 'center', justifyContent: 'center', height: 46 },
    diaSemana: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    circulo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    numero: { fontSize: 14, color: c.text },
    punto: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.success, marginTop: 2 },
  });