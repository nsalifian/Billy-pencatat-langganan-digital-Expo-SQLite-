import { StyleSheet, Text, View } from 'react-native';
import type { Ringkasan } from '../lib/ringkasan';
import { formatRupiah } from '../lib/tanggal';
import { jarak, radius, warna } from '../theme';

export function RingkasanBeranda({ data }: { data: Ringkasan }) {
  return (
    <View style={gaya.kartu}>
      <Text style={gaya.judul}>Total per bulan</Text>
      <Text style={gaya.total}>{formatRupiah(data.totalBulanan)}</Text>
      <View style={gaya.baris}>
        <View style={gaya.kolom}>
          <Text style={gaya.label}>Estimasi setahun</Text>
          <Text style={gaya.nilai}>{formatRupiah(data.estimasiSetahun)}</Text>
        </View>
        <View style={gaya.kolom}>
          <Text style={gaya.label}>Jumlah langganan</Text>
          <Text style={gaya.nilai}>{data.jumlah}</Text>
        </View>
      </View>
      {data.termahal ? (
        <Text style={gaya.label}>
          Termahal: {data.termahal.nama} ({formatRupiah(data.termahal.harga)})
        </Text>
      ) : null}
    </View>
  );
}

const gaya = StyleSheet.create({
  kartu: { backgroundColor: warna.utama, borderRadius: radius, padding: jarak.lg, gap: jarak.sm },
  judul: { color: warna.utamaTeks, opacity: 0.85, fontSize: 14 },
  total: { color: warna.utamaTeks, fontSize: 30, fontWeight: '800' },
  baris: { flexDirection: 'row', gap: jarak.lg, marginTop: jarak.xs },
  kolom: { flex: 1, gap: 2 },
  label: { color: warna.utamaTeks, opacity: 0.85, fontSize: 13 },
  nilai: { color: warna.utamaTeks, fontSize: 16, fontWeight: '700' },
});