import { getAll } from '../db/repository';
import type { DbQuery } from '../db/schema';
import { ambilJamPengingat } from './pengaturan';
import { jadwalkanUlang } from './pengingat';

/** Menyelaraskan notifikasi terjadwal dengan data terkini. Panggil setelah setiap perubahan data. */
export async function sinkronPengingat(db: DbQuery): Promise<number> {
  const [daftar, jam] = await Promise.all([getAll(db), ambilJamPengingat()]);
  return jadwalkanUlang(daftar, jam);
}