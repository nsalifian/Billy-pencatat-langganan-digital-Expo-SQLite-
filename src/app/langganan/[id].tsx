import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Kartu } from '../../components/Kartu';
import { Tombol } from '../../components/Tombol';
import { getById, remove, stop } from '../../db/repository';
import type { Langganan } from '../../db/types';
import { sinkronPengingat } from '../../lib/sinkron';
import {
  formatRupiah,
  formatTanggal,
  hariIni,
  selisihHari,
  statusDariSisaHari,
  teksSisaHari,
} from '../../lib/tanggal';
import { jarak, warna } from '../../theme';

function Baris({ label, nilai, warnaNilai }: { label: string; nilai: string; warnaNilai?: string }) {
  return (
    <View style={gaya.baris}>
      <Text style={gaya.label}>{label}</Text>
      <Text style={[gaya.nilai, warnaNilai ? { color: warnaNilai } : null]}>{nilai}</Text>
    </View>
  );
}

export default function LayarDetail() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNomor = Number(id);

  const [data, setData] = useState<Langganan | null>(null);
  const [selesaiMuat, setSelesaiMuat] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getById(db, idNomor)
        .then(setData)
        .catch(() => Alert.alert('Gagal memuat data', 'Coba lagi.'))
        .finally(() => setSelesaiMuat(true));
    }, [db, idNomor]),
  );

  async function selesaiUbahData() {
    await sinkronPengingat(db);
    router.back();
  }

  async function berhenti() {
    try {
      await stop(db, idNomor, hariIni());
      await selesaiUbahData();
    } catch {
      Alert.alert('Gagal', 'Langganan tidak dapat dipindahkan ke riwayat.');
    }
  }

  async function hapusPermanen() {
    try {
      await remove(db, idNomor);
      await selesaiUbahData();
    } catch {
      Alert.alert('Gagal', 'Langganan tidak dapat dihapus.');
    }
  }

  function tanyaHapus() {
    if (!data) return;
    Alert.alert(`Hapus ${data.nama}?`, 'Pilih tindakan yang sesuai.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus permanen', style: 'destructive', onPress: hapusPermanen },
      { text: 'Berhenti berlangganan', onPress: berhenti },
    ]);
  }

  if (!selesaiMuat) return null;

  if (!data) {
    return (
      <View style={gaya.kosong}>
        <Stack.Screen options={{ title: 'Detail' }} />
        <Text style={gaya.teksKosong}>Langganan tidak ditemukan.</Text>
      </View>
    );
  }

  const sisa = selisihHari(hariIni(), data.tanggal_tagih);

  return (
    <ScrollView contentContainerStyle={gaya.isi}>
      <Stack.Screen options={{ title: data.nama }} />
      <Kartu style={{ gap: jarak.md }}>
        <Baris label="Harga per bulan" nilai={formatRupiah(data.harga)} />
        <Baris label="Tanggal tagih" nilai={formatTanggal(data.tanggal_tagih)} />
        <Baris label="Status" nilai={teksSisaHari(sisa)} warnaNilai={warna[statusDariSisaHari(sisa)]} />
        <Baris
          label="Pengingat"
          nilai={data.pengingat === 0 ? 'Tanpa pengingat' : `${data.pengingat} hari sebelum`}
        />
        <Baris label="Dicatat sejak" nilai={formatTanggal(data.dibuat_pada)} />
      </Kartu>
      <Tombol
        label="Ubah"
        onPress={() => router.push({ pathname: '/form', params: { id: String(data.id) } })}
      />
      <Tombol label="Hapus" varian="bahaya" onPress={tanyaHapus} />
    </ScrollView>
  );
}

const gaya = StyleSheet.create({
  isi: { padding: jarak.lg, gap: jarak.lg },
  baris: { flexDirection: 'row', justifyContent: 'space-between', gap: jarak.md },
  label: { fontSize: 15, color: warna.teksPudar },
  nilai: { fontSize: 15, fontWeight: '600', color: warna.teks, flexShrink: 1, textAlign: 'right' },
  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  teksKosong: { color: warna.teksPudar, fontSize: 16 },
});