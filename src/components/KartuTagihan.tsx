import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Langganan } from '../db/types';
import { formatRupiah, formatTanggal, selisihHari, statusDariSisaHari, teksSisaHari } from '../lib/tanggal';
import { jarak, radius, warna } from '../theme';
import { Tombol } from './Tombol';

type Props = {
  item: Langganan;
  hariIni: string;
  onBuka: () => void;
  onBayar: () => void;
};

export function KartuTagihan({ item, hariIni, onBuka, onBayar }: Props) {
  const sisa = selisihHari(hariIni, item.tanggal_tagih);
  const warnaStatus = warna[statusDariSisaHari(sisa)];

  return (
    <View style={gaya.kartu}>
      <Pressable accessibilityRole="button" onPress={onBuka} style={gaya.atas}>
        <View style={[gaya.penanda, { backgroundColor: warnaStatus }]} />
        <View style={gaya.tengah}>
          <Text style={gaya.nama} numberOfLines={1}>
            {item.nama}
          </Text>
          <Text style={gaya.tanggal}>Tagih {formatTanggal(item.tanggal_tagih)}</Text>
          <Text style={[gaya.sisa, { color: warnaStatus }]}>{teksSisaHari(sisa)}</Text>
        </View>
        <Text style={gaya.harga}>{formatRupiah(item.harga)}</Text>
      </Pressable>
      <Tombol label="Tandai sudah dibayar" varian="sekunder" onPress={onBayar} />
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
    gap: jarak.md,
  },
  atas: { flexDirection: 'row', alignItems: 'center', gap: jarak.md },
  penanda: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  tengah: { flex: 1, gap: 2 },
  nama: { fontSize: 17, fontWeight: '700', color: warna.teks },
  tanggal: { fontSize: 14, color: warna.teksPudar },
  sisa: { fontSize: 14, fontWeight: '600' },
  harga: { fontSize: 16, fontWeight: '700', color: warna.teks },
});