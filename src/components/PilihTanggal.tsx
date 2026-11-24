import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTanggal, uraiYmd, ymdDari } from '../lib/tanggal';
import { jarak, radius, warna } from '../theme';

type Props = {
  label: string;
  nilai: string; // YYYY-MM-DD
  onUbah: (ymd: string) => void;
  galat?: string;
};

function keDate(ymd: string): Date {
  const p = uraiYmd(ymd);
  return p ? new Date(p.y, p.m - 1, p.d) : new Date();
}

export function PilihTanggal({ label, nilai, onUbah, galat }: Props) {
  function bukaAndroid() {
    DateTimePickerAndroid.open({
      value: keDate(nilai),
      mode: 'date',
      onChange: (event, tanggal) => {
        if (event.type === 'set' && tanggal) onUbah(ymdDari(tanggal));
      },
    });
  }

  return (
    <View style={gaya.baris}>
      <Text style={gaya.label}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable
          accessibilityRole="button"
          onPress={bukaAndroid}
          style={[gaya.tombol, galat ? gaya.tombolGalat : null]}
        >
          <Text style={gaya.teks}>{formatTanggal(nilai)}</Text>
        </Pressable>
      ) : (
        <View style={gaya.ios}>
          <DateTimePicker
            value={keDate(nilai)}
            mode="date"
            display="compact"
            onChange={(_e, tanggal) => {
              if (tanggal) onUbah(ymdDari(tanggal));
            }}
          />
        </View>
      )}
      {galat ? <Text style={gaya.galat}>{galat}</Text> : null}
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
  tombolGalat: { borderColor: warna.bahaya },
  teks: { fontSize: 16, color: warna.teks },
  ios: { alignItems: 'flex-start' },
  galat: { fontSize: 13, color: warna.bahaya },
});