import { tambahBulan } from '../lib/tanggal';
import type { BerkasCadangan, InputLangganan, Langganan, Riwayat } from './types';
import { VERSI_CADANGAN } from './types';
import type { Db, DbQuery } from './schema';

export function getAll(db: DbQuery): Promise<Langganan[]> {
  return db.getAllAsync<Langganan>('SELECT * FROM langganan ORDER BY tanggal_tagih ASC, id ASC', []);
}

export function getById(db: DbQuery, id: number): Promise<Langganan | null> {
  return db.getFirstAsync<Langganan>('SELECT * FROM langganan WHERE id = ?', [id]);
}

/** Menambah langganan; mengembalikan id baris baru. */
export async function create(db: DbQuery, data: InputLangganan, hariIni: string): Promise<number> {
  await db.runAsync(
    'INSERT INTO langganan (nama, harga, tanggal_tagih, pengingat, dibuat_pada) VALUES (?, ?, ?, ?, ?)',
    [data.nama, data.harga, data.tanggal_tagih, data.pengingat, hariIni],
  );
  const baris = await db.getFirstAsync<{ id: number }>('SELECT last_insert_rowid() AS id', []);
  return baris?.id ?? 0;
}

export async function update(db: DbQuery, id: number, data: InputLangganan): Promise<void> {
  await db.runAsync('UPDATE langganan SET nama = ?, harga = ?, tanggal_tagih = ?, pengingat = ? WHERE id = ?', [
    data.nama,
    data.harga,
    data.tanggal_tagih,
    data.pengingat,
    id,
  ]);
}

/** Tandai sudah dibayar: tanggal tagih maju satu bulan. */
export async function markPaid(db: DbQuery, id: number): Promise<string | null> {
  const baris = await getById(db, id);
  if (!baris) return null;
  const berikutnya = tambahBulan(baris.tanggal_tagih, 1);
  await db.runAsync('UPDATE langganan SET tanggal_tagih = ? WHERE id = ?', [berikutnya, id]);
  return berikutnya;
}

/** Berhenti berlangganan: salin ke riwayat lalu hapus, dalam satu transaksi. */
export async function stop(db: Db, id: number, hariIni: string): Promise<boolean> {
  let ditemukan = false;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const baris = await getById(txn, id);
    if (!baris) return;
    ditemukan = true;
    await txn.runAsync(
      'INSERT INTO riwayat (nama, harga, dicatat_sejak, berhenti_pada) VALUES (?, ?, ?, ?)',
      [baris.nama, baris.harga, baris.dibuat_pada, hariIni],
    );
    await txn.runAsync('DELETE FROM langganan WHERE id = ?', [id]);
  });
  return ditemukan;
}

/** Hapus permanen: data dibuang tanpa jejak di riwayat. */
export async function remove(db: DbQuery, id: number): Promise<void> {
  await db.runAsync('DELETE FROM langganan WHERE id = ?', [id]);
}

export function getRiwayat(db: DbQuery): Promise<Riwayat[]> {
  return db.getAllAsync<Riwayat>('SELECT * FROM riwayat ORDER BY berhenti_pada DESC, id DESC', []);
}

export async function removeRiwayat(db: DbQuery, id: number): Promise<void> {
  await db.runAsync('DELETE FROM riwayat WHERE id = ?', [id]);
}

export async function exportData(db: DbQuery, hariIni: string): Promise<BerkasCadangan> {
  const langganan = await db.getAllAsync<Langganan>('SELECT * FROM langganan ORDER BY id ASC', []);
  const riwayat = await db.getAllAsync<Riwayat>('SELECT * FROM riwayat ORDER BY id ASC', []);
  return { versi: VERSI_CADANGAN, diekspor_pada: hariIni, langganan, riwayat };
}

/** Menimpa seluruh data. Panggil validasiBerkasCadangan lebih dulu dan minta konfirmasi pengguna. */
export async function importData(db: Db, berkas: BerkasCadangan): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM langganan', []);
    await txn.runAsync('DELETE FROM riwayat', []);
    for (const s of berkas.langganan) {
      await txn.runAsync(
        'INSERT INTO langganan (id, nama, harga, tanggal_tagih, pengingat, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, s.nama, s.harga, s.tanggal_tagih, s.pengingat, s.dibuat_pada],
      );
    }
    for (const r of berkas.riwayat) {
      await txn.runAsync(
        'INSERT INTO riwayat (id, nama, harga, dicatat_sejak, berhenti_pada) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.nama, r.harga, r.dicatat_sejak, r.berhenti_pada],
      );
    }
  });
}

/** Menghapus seluruh data (tombol "Hapus semua data" di Pengaturan). */
export async function clearAll(db: Db): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM langganan', []);
    await txn.runAsync('DELETE FROM riwayat', []);
  });
}