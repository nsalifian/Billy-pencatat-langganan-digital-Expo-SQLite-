import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Isian } from '../components/Isian';
import { PilihTanggal } from '../components/PilihTanggal';
import { Tombol } from '../components/Tombol';
import { create, getById, update } from '../db/repository';
import { sinkronPengingat } from '../lib/sinkron';
import { hariIni } from '../lib/tanggal';
import { validasiForm, type GalatForm } from '../lib/validasi';
import { jarak, warna } from '../theme';

export default function LayarFormulir() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const idUbah = id ? Number(id) : null;

  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [tanggal, setTanggal] = useState(hariIni());
  const [pengingat, setPengingat] = useState('1');
  const [galat, setGalat] = useState<GalatForm>({});
  const [menyimpan, setMenyimpan] = useState(false);

  // Mode ubah: isi formulir dari data yang tersimpan.
  useEffect(() => {
    if (idUbah === null) return;
    getById(db, idUbah)
      .then((baris) => {
        if (!baris) {
          Alert.alert('Data tidak ditemukan', 'Langganan ini sudah tidak ada.');
          router.back();
          return;
        }
        setNama(baris.nama);
        setHarga(String(baris.harga));
        setTanggal(baris.tanggal_tagih);
        setPengingat(String(baris.pengingat));
      })
      .catch(() => Alert.alert('Gagal memuat data', 'Coba lagi.'));
  }, [db, idUbah, router]);

  async function simpan() {
    const hasil = validasiForm({ nama, harga, tanggal_tagih: tanggal, pengingat });
    if (!hasil.ok) {
      setGalat(hasil.galat);
      return;
    }
    setGalat({});
    setMenyimpan(true);
    try {
      if (idUbah === null) await create(db, hasil.data, hariIni());
      else await update(db, idUbah, hasil.data);
      await sinkronPengingat(db);
      router.back();
    } catch {
      Alert.alert('Gagal menyimpan', 'Data tidak dapat disimpan. Coba lagi.');
      setMenyimpan(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={gaya.isi} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: idUbah === null ? 'Tambah langganan' : 'Ubah langganan' }} />
      <Isian
        label="Nama layanan"
        placeholder="Contoh: Netflix"
        value={nama}
        onChangeText={setNama}
        galat={galat.nama}
        maxLength={60}
      />
      <Isian
        label="Harga per bulan (Rp)"
        placeholder="Contoh: 54000"
        value={harga}
        onChangeText={setHarga}
        galat={galat.harga}
        keyboardType="number-pad"
      />
      <PilihTanggal label="Tanggal tagih berikutnya" nilai={tanggal} onUbah={setTanggal} galat={galat.tanggal_tagih} />
      <Isian
        label="Pengingat (hari sebelum tagih)"
        placeholder="0 = tanpa pengingat"
        value={pengingat}
        onChangeText={setPengingat}
        galat={galat.pengingat}
        keyboardType="number-pad"
      />
      <Text style={gaya.catatan}>Seluruh langganan dianggap berulang setiap bulan.</Text>
      <Tombol label={menyimpan ? 'Menyimpan...' : 'Simpan'} onPress={simpan} nonaktif={menyimpan} />
    </ScrollView>
  );
}

const gaya = StyleSheet.create({
  isi: { padding: jarak.lg, gap: jarak.lg },
  catatan: { fontSize: 13, color: warna.teksPudar },
});