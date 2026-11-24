import type { BerkasCadangan, InputLangganan, Langganan, Riwayat } from '../db/types';
import { VERSI_CADANGAN } from '../db/types';
import { adalahYmdValid } from './tanggal';

export type KolomForm = 'nama' | 'harga' | 'tanggal_tagih' | 'pengingat';
export type GalatForm = Partial<Record<KolomForm, string>>;
export type HasilForm = { ok: true; data: InputLangganan } | { ok: false; galat: GalatForm };

export const BATAS_NAMA = 60;
export const BATAS_HARGA = 1_000_000_000;
export const BATAS_PENGINGAT = 30;

/** Nama wajib; harga bilangan bulat positif; tanggal valid; pengingat 0..30 (kosong = 0). */
export function validasiForm(isian: {
  nama: string;
  harga: string;
  tanggal_tagih: string;
  pengingat: string;
}): HasilForm {
  const galat: GalatForm = {};

  const nama = isian.nama.trim();
  if (nama === '') galat.nama = 'Nama layanan wajib diisi.';
  else if (nama.length > BATAS_NAMA) galat.nama = `Nama paling banyak ${BATAS_NAMA} karakter.`;

  const hargaTeks = isian.harga.trim();
  const harga = /^\d+$/.test(hargaTeks) ? Number(hargaTeks) : NaN;
  if (hargaTeks === '') galat.harga = 'Harga wajib diisi.';
  else if (!Number.isSafeInteger(harga) || harga <= 0) galat.harga = 'Harga harus berupa angka lebih dari 0.';
  else if (harga > BATAS_HARGA) galat.harga = 'Harga terlalu besar.';

  if (isian.tanggal_tagih.trim() === '') galat.tanggal_tagih = 'Tanggal tagih wajib diisi.';
  else if (!adalahYmdValid(isian.tanggal_tagih)) galat.tanggal_tagih = 'Tanggal tagih tidak valid.';

  const pengingatTeks = isian.pengingat.trim();
  let pengingat = 0;
  if (pengingatTeks !== '') {
    pengingat = /^\d+$/.test(pengingatTeks) ? Number(pengingatTeks) : NaN;
    if (!Number.isInteger(pengingat) || pengingat > BATAS_PENGINGAT) {
      galat.pengingat = `Isi angka 0 sampai ${BATAS_PENGINGAT} (0 berarti tanpa pengingat).`;
    }
  }

  if (Object.keys(galat).length > 0) return { ok: false, galat };
  return { ok: true, data: { nama, harga, tanggal_tagih: isian.tanggal_tagih, pengingat } };
}

export type HasilImpor = { ok: true; data: BerkasCadangan } | { ok: false; pesan: string };

function adalahObjek(nilai: unknown): nilai is Record<string, unknown> {
  return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
}
function bulatPositif(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isSafeInteger(nilai) && nilai > 0;
}
function teksTidakKosong(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && nilai.trim() !== '';
}
function tanggalValid(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && adalahYmdValid(nilai);
}

/** Memeriksa isi berkas impor: kunci hilang, tipe keliru, atau id ganda ditolak seluruhnya. */
export function validasiBerkasCadangan(mentah: unknown): HasilImpor {
  if (!adalahObjek(mentah)) return { ok: false, pesan: 'Berkas bukan objek JSON yang dikenali.' };
  if (mentah.versi !== VERSI_CADANGAN) return { ok: false, pesan: 'Versi berkas cadangan tidak dikenali.' };
  if (!Array.isArray(mentah.langganan)) return { ok: false, pesan: 'Kunci "langganan" tidak ditemukan.' };
  if (!Array.isArray(mentah.riwayat)) return { ok: false, pesan: 'Kunci "riwayat" tidak ditemukan.' };

  const langganan: Langganan[] = [];
  const idLangganan = new Set<number>();
  for (const [indeks, baris] of mentah.langganan.entries()) {
    const label = `langganan ke-${indeks + 1}`;
    if (!adalahObjek(baris)) return { ok: false, pesan: `Data ${label} tidak valid.` };
    const { id, nama, harga, tanggal_tagih, pengingat, dibuat_pada } = baris;
    if (!bulatPositif(id)) return { ok: false, pesan: `Id pada ${label} tidak valid.` };
    if (idLangganan.has(id)) return { ok: false, pesan: `Id ${id} pada langganan muncul lebih dari sekali.` };
    if (!teksTidakKosong(nama)) return { ok: false, pesan: `Nama pada ${label} tidak valid.` };
    if (!bulatPositif(harga)) return { ok: false, pesan: `Harga pada ${label} harus bilangan bulat positif.` };
    if (!tanggalValid(tanggal_tagih)) return { ok: false, pesan: `Tanggal tagih pada ${label} tidak valid.` };
    if (typeof pengingat !== 'number' || !Number.isInteger(pengingat) || pengingat < 0 || pengingat > 365) {
      return { ok: false, pesan: `Pengingat pada ${label} tidak valid.` };
    }
    if (!tanggalValid(dibuat_pada)) return { ok: false, pesan: `Tanggal dibuat pada ${label} tidak valid.` };
    idLangganan.add(id);
    langganan.push({ id, nama: nama.trim(), harga, tanggal_tagih, pengingat, dibuat_pada });
  }

  const riwayat: Riwayat[] = [];
  const idRiwayat = new Set<number>();
  for (const [indeks, baris] of mentah.riwayat.entries()) {
    const label = `riwayat ke-${indeks + 1}`;
    if (!adalahObjek(baris)) return { ok: false, pesan: `Data ${label} tidak valid.` };
    const { id, nama, harga, dicatat_sejak, berhenti_pada } = baris;
    if (!bulatPositif(id)) return { ok: false, pesan: `Id pada ${label} tidak valid.` };
    if (idRiwayat.has(id)) return { ok: false, pesan: `Id ${id} pada riwayat muncul lebih dari sekali.` };
    if (!teksTidakKosong(nama)) return { ok: false, pesan: `Nama pada ${label} tidak valid.` };
    if (!bulatPositif(harga)) return { ok: false, pesan: `Harga pada ${label} harus bilangan bulat positif.` };
    if (!tanggalValid(dicatat_sejak)) return { ok: false, pesan: `Tanggal dicatat pada ${label} tidak valid.` };
    if (!tanggalValid(berhenti_pada)) return { ok: false, pesan: `Tanggal berhenti pada ${label} tidak valid.` };
    idRiwayat.add(id);
    riwayat.push({ id, nama: nama.trim(), harga, dicatat_sejak, berhenti_pada });
  }

  const diekspor = typeof mentah.diekspor_pada === 'string' ? mentah.diekspor_pada : '';
  return { ok: true, data: { versi: VERSI_CADANGAN, diekspor_pada: diekspor, langganan, riwayat } };
}