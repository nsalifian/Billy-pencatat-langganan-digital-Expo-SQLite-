import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { uraiJam } from '../lib/tanggal';
import { jarak, radius, warna } from '../theme';

type Props = {
  label: string;
  nilai: string; // HH:MM
  onUbah: (jam: string) => void;
};

function dua(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function keDate(jam: string): Date {
  const p = uraiJam(jam) ?? { h: 9, m: 0 };
  const d = new Date();
  d.setHours(p.h, p.m, 0, 0);
  return d;
}

export function PilihJam({ label, nilai, onUbah }: Props) {
  function terima(tanggal: Date) {
    onUbah(`${dua(tanggal.getHours())}:${dua(tanggal.getMinutes())}`);
  }

  function bukaAndroid() {
    DateTimePickerAndroid.open({
      value: keDate(nilai),
      mode: 'time',
      is24Hour: true,
      onChange: (event, tanggal) => {
        if (event.type === 'set' && tanggal) terima(tanggal);
      },
    });
  }

  return (
    <View style={gaya.baris}>
      <Text style={gaya.label}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable accessibilityRole="button" onPress={bukaAndroid} style={gaya.tombol}>
          <Text style={gaya.teks}>{nilai}</Text>
        </Pressable>
      ) : (
        <View style={gaya.ios}>
          <DateTimePicker
            value={keDate(nilai)}
            mode="time"
            display="compact"
            onChange={(_e, tanggal) => {
              if (tanggal) terima(tanggal);
            }}
          />
        </View>
      )}
    </View>
  );
}

const gaya = StyleSheet.create({
  baris: { gap: jarak.xs },
  label: { fontSize: 14, fontWeight: '600', color: warna.teks },
  tombol: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: warna.garis,
    borderRadius: radius,
    backgroundColor: warna.kartu,
    paddingHorizontal: jarak.md,
    justifyContent: 'center',
  },
  teks: { fontSize: 16, color: warna.teks },
  ios: { alignItems: 'flex-start' },
});