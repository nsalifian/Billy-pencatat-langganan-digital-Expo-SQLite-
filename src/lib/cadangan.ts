import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { BerkasCadangan } from '../db/types';
import { validasiBerkasCadangan, type HasilImpor } from './validasi';

/** Menulis cadangan ke berkas sementara lalu membuka lembar bagikan. */
export async function bagikanCadangan(berkas: BerkasCadangan): Promise<void> {
  const file = new File(Paths.cache, `billy-cadangan-${berkas.diekspor_pada}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(berkas, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Fitur berbagi tidak tersedia di perangkat ini.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Simpan cadangan Billy' });
}

/** Memilih berkas JSON, lalu memvalidasinya. Mengembalikan null bila pengguna membatalkan. */
export async function pilihBerkasImpor(): Promise<HasilImpor | null> {
  const hasil = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (hasil.canceled) return null;

  try {
    const teks = await new File(hasil.assets[0].uri).text();
    return validasiBerkasCadangan(JSON.parse(teks));
  } catch {
    return { ok: false, pesan: 'Berkas tidak dapat dibaca sebagai JSON.' };
  }
}