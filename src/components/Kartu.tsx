import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { jarak, radius, warna } from '../theme';

export function Kartu({ children, style, ...sisa }: { children: ReactNode } & ViewProps) {
  return (
    <View style={[gaya.kartu, style]} {...sisa}>
      {children}
    </View>
  );
}

const gaya = StyleSheet.create({
  kartu: {
    backgroundColor: warna.kartu,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: jarak.lg,
  },
});