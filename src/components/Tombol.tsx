import { Pressable, StyleSheet, Text } from 'react-native';
import { jarak, radius, warna } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  varian?: 'utama' | 'sekunder' | 'bahaya';
  nonaktif?: boolean;
};

export function Tombol({ label, onPress, varian = 'utama', nonaktif = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={nonaktif}
      onPress={onPress}
      style={({ pressed }) => [gaya.dasar, gaya[varian], (pressed || nonaktif) && gaya.redup]}
    >
      <Text style={[gaya.teks, varian === 'sekunder' && gaya.teksSekunder]}>{label}</Text>
    </Pressable>
  );
}

const gaya = StyleSheet.create({
  dasar: {
    minHeight: 48,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: jarak.lg,
  },
  utama: { backgroundColor: warna.utama },
  bahaya: { backgroundColor: warna.bahaya },
  sekunder: { backgroundColor: warna.kartu, borderWidth: 1, borderColor: warna.garis },
  redup: { opacity: 0.6 },
  teks: { color: warna.utamaTeks, fontSize: 16, fontWeight: '600' },
  teksSekunder: { color: warna.teks },
});