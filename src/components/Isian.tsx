import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { jarak, radius, warna } from '../theme';

type Props = TextInputProps & { label: string; galat?: string };

export function Isian({ label, galat, style, ...sisa }: Props) {
  return (
    <View style={gaya.baris}>
      <Text style={gaya.label}>{label}</Text>
      <TextInput
        placeholderTextColor={warna.teksPudar}
        style={[gaya.input, galat ? gaya.inputGalat : null, style]}
        {...sisa}
      />
      {galat ? <Text style={gaya.galat}>{galat}</Text> : null}
    </View>
  );
}

const gaya = StyleSheet.create({
  baris: { gap: jarak.xs },
  label: { fontSize: 14, fontWeight: '600', color: warna.teks },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: warna.garis,
    borderRadius: radius,
    backgroundColor: warna.kartu,
    paddingHorizontal: jarak.md,
    fontSize: 16,
    color: warna.teks,
  },
  inputGalat: { borderColor: warna.bahaya },
  galat: { fontSize: 13, color: warna.bahaya },
});