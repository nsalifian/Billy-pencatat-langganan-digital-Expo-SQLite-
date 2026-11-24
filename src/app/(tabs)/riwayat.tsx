import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Kartu } from '../../components/Kartu';
import { Tombol } from '../../components/Tombol';
import { getRiwayat, removeRiwayat } from '../../db/repository';
import type { Riwayat } from '../../db/types';
import { formatBulanTahun, formatRupiah } from '../../lib/tanggal';
import { jarak, warna } from '../../theme';

export default function LayarRiwayat() {
  const db = useSQLiteContext();
  const [daftar, setDaftar] = useState<Riwayat[]>([]);

  const muat = useCallback(async () => {
    setDaftar(await getRiwayat(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      muat().catch(() => Alert.alert('Gagal memuat riwayat', 'Coba buka ulang aplikasi.'));
    }, [muat]),
  );

  function tanyaHapus(item: Riwayat) {
    Alert.alert(`Hapus ${item.nama} dari riwayat?`, 'Catatan ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          removeRiwayat(db, item.id)
            .then(muat)
            .catch(() => Alert.alert('Gagal', 'Catatan tidak dapat dihapus.'));
        },
      },
    ]);
  }

  return (
    <FlatList
      data={daftar}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={gaya.isi}
      ListEmptyComponent={
        <Text style={gaya.kosong}>
          Belum ada riwayat. Langganan yang Anda hentikan akan tercatat di sini.
        </Text>
      }
      ItemSeparatorComponent={() => <View style={{ height: jarak.md }} />}
      renderItem={({ item }) => (
        <Kartu style={{ gap: jarak.sm }}>
          <View style={gaya.baris}>
            <Text style={gaya.nama} numberOfLines={1}>
              {item.nama}
            </Text>
            <Text style={gaya.harga}>{formatRupiah(item.harga)}/bln</Text>
          </View>
          <Text style={gaya.periode}>
            {formatBulanTahun(item.dicatat_sejak)} - {formatBulanTahun(item.berhenti_pada)}
          </Text>
          <Tombol label="Hapus" varian="sekunder" onPress={() => tanyaHapus(item)} />
        </Kartu>
      )}
    />
  );
}

const gaya = StyleSheet.create({
  isi: { padding: jarak.lg, paddingBottom: jarak.xl },
  baris: { flexDirection: 'row', justifyContent: 'space-between', gap: jarak.md },
  nama: { flex: 1, fontSize: 17, fontWeight: '700', color: warna.teks },
  harga: { fontSize: 15, fontWeight: '600', color: warna.teks },
  periode: { fontSize: 14, color: warna.teksPudar },
  kosong: { textAlign: 'center', color: warna.teksPudar, fontSize: 15, marginTop: jarak.xl },
});