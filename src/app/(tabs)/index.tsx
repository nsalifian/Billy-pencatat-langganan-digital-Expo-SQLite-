import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { KartuTagihan } from '../../components/KartuTagihan';
import { RingkasanBeranda } from '../../components/RingkasanBeranda';
import { Tombol } from '../../components/Tombol';
import { getAll, markPaid } from '../../db/repository';
import type { Langganan } from '../../db/types';
import { hitungRingkasan } from '../../lib/ringkasan';
import { sinkronPengingat } from '../../lib/sinkron';
import { hariIni as ambilHariIni } from '../../lib/tanggal';
import { jarak, warna } from '../../theme';

export default function LayarBeranda() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [daftar, setDaftar] = useState<Langganan[]>([]);
  const [hariIni, setHariIni] = useState(ambilHariIni());

  const muat = useCallback(async () => {
    setHariIni(ambilHariIni());
    setDaftar(await getAll(db));
  }, [db]);

  // Muat ulang setiap layar ini kembali tampil (mis. setelah menambah/mengubah data).
  useFocusEffect(
    useCallback(() => {
      muat().catch(() => Alert.alert('Gagal memuat data', 'Coba buka ulang aplikasi.'));
    }, [muat]),
  );

  async function bayar(item: Langganan) {
    try {
      await markPaid(db, item.id);
      await muat();
      await sinkronPengingat(db);
    } catch {
      Alert.alert('Gagal memperbarui', 'Tanggal tagih tidak dapat diperbarui.');
    }
  }

  return (
    <FlatList
      data={daftar}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={gaya.isi}
      ListHeaderComponent={
        <View style={gaya.header}>
          <RingkasanBeranda data={hitungRingkasan(daftar)} />
          <Tombol label="Tambah langganan" onPress={() => router.push('../form')} />
        </View>
      }
      ListEmptyComponent={
        <Text style={gaya.kosong}>Belum ada langganan. Ketuk "Tambah langganan" untuk mulai mencatat.</Text>
      }
      renderItem={({ item }) => (
        <KartuTagihan
          item={item}
          hariIni={hariIni}
          onBuka={() => router.push({ pathname: '../langganan/[id]', params: { id: String(item.id) } })}
          onBayar={() => bayar(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: jarak.md }} />}
    />
  );
}

const gaya = StyleSheet.create({
  isi: { padding: jarak.lg, paddingBottom: jarak.xl },
  header: { gap: jarak.md, marginBottom: jarak.lg },
  kosong: { textAlign: 'center', color: warna.teksPudar, fontSize: 15, marginTop: jarak.xl },
});