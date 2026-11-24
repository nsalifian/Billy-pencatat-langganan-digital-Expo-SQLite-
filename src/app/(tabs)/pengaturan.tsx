import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Kartu } from '../../components/Kartu';
import { PilihJam } from '../../components/PilihJam';
import { Tombol } from '../../components/Tombol';
import { clearAll, exportData, importData } from '../../db/repository';
import { bagikanCadangan, pilihBerkasImpor } from '../../lib/cadangan';
import { JAM_BAWAAN, ambilJamPengingat, simpanJamPengingat } from '../../lib/pengaturan';
import { sinkronPengingat } from '../../lib/sinkron';
import { hariIni } from '../../lib/tanggal';
import { jarak, warna } from '../../theme';

export default function LayarPengaturan() {
  const db = useSQLiteContext();
  const [jam, setJam] = useState(JAM_BAWAAN);

  useFocusEffect(
    useCallback(() => {
      ambilJamPengingat().then(setJam);
    }, []),
  );

  async function ubahJam(baru: string) {
    try {
      await simpanJamPengingat(baru);
      setJam(baru);
      await sinkronPengingat(db);
    } catch {
      Alert.alert('Gagal', 'Jam pengingat tidak dapat disimpan.');
    }
  }

  async function ekspor() {
    try {
      await bagikanCadangan(await exportData(db, hariIni()));
    } catch (e) {
      Alert.alert('Gagal mengekspor', e instanceof Error ? e.message : 'Cadangan tidak dapat dibuat.');
    }
  }

  async function impor() {
    try {
      const hasil = await pilihBerkasImpor();
      if (hasil === null) return;
      if (!hasil.ok) {
        Alert.alert('Berkas ditolak', hasil.pesan);
        return;
      }
      const { data } = hasil;
      Alert.alert(
        'Timpa seluruh data?',
        `Berkas berisi ${data.langganan.length} langganan dan ${data.riwayat.length} riwayat. Data yang ada sekarang akan diganti.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Timpa',
            style: 'destructive',
            onPress: () => {
              importData(db, data)
                .then(() => sinkronPengingat(db))
                .then(() => Alert.alert('Berhasil', 'Data berhasil diimpor.'))
                .catch(() => Alert.alert('Gagal', 'Impor dibatalkan; data lama tetap utuh.'));
            },
          },
        ],
      );
    } catch {
      Alert.alert('Gagal mengimpor', 'Berkas tidak dapat diproses.');
    }
  }

  function hapusSemua() {
    Alert.alert('Hapus semua data?', 'Seluruh langganan dan riwayat akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus semua',
        style: 'destructive',
        onPress: () => {
          clearAll(db)
            .then(() => sinkronPengingat(db))
            .then(() => Alert.alert('Selesai', 'Seluruh data telah dihapus.'))
            .catch(() => Alert.alert('Gagal', 'Data tidak dapat dihapus.'));
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={gaya.isi}>
      <Kartu style={{ gap: jarak.md }}>
        <Text style={gaya.judul}>Pengingat</Text>
        <PilihJam label="Jam notifikasi" nilai={jam} onUbah={ubahJam} />
      </Kartu>

      <Kartu style={{ gap: jarak.md }}>
        <Text style={gaya.judul}>Cadangan data</Text>
        <Text style={gaya.catatan}>Data hanya tersimpan di perangkat ini. Ekspor secara berkala sebagai cadangan.</Text>
        <Tombol label="Ekspor data (JSON)" onPress={ekspor} />
        <Tombol label="Impor data" varian="sekunder" onPress={impor} />
      </Kartu>

      <Kartu style={{ gap: jarak.md }}>
        <Text style={gaya.judul}>Zona berbahaya</Text>
        <Tombol label="Hapus semua data" varian="bahaya" onPress={hapusSemua} />
      </Kartu>
    </ScrollView>
  );
}

const gaya = StyleSheet.create({
  isi: { padding: jarak.lg, gap: jarak.lg },
  judul: { fontSize: 17, fontWeight: '700', color: warna.teks },
  catatan: { fontSize: 14, color: warna.teksPudar },
});