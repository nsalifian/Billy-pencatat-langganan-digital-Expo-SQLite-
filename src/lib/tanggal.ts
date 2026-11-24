export type Ymd = string;
export type StatusTagih = 'merah' | 'kuning' | 'hijau';

const POLA_YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_HARI = 86_400_000;
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function adalahKabisat(tahun: number): boolean {
  return (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0;
}

export function hariDalamBulan(tahun: number, bulan: number): number {
  const tabel = [31, adalahKabisat(tahun) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return tabel[bulan - 1];
}

function dua(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function susunYmd(tahun: number, bulan: number, hari: number): Ymd {
  return `${String(tahun).padStart(4, '0')}-${dua(bulan)}-${dua(hari)}`;
}

/** Mengurai YYYY-MM-DD dan memastikan tanggalnya benar-benar ada di kalender. */
export function uraiYmd(teks: string): { y: number; m: number; d: number } | null {
  const cocok = POLA_YMD.exec(teks);
  if (!cocok) return null;
  const y = Number(cocok[1]);
  const m = Number(cocok[2]);
  const d = Number(cocok[3]);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > hariDalamBulan(y, m)) return null;
  return { y, m, d };
}

export function adalahYmdValid(teks: string): boolean {
  return uraiYmd(teks) !== null;
}

/** Date -> YYYY-MM-DD menurut zona waktu lokal. */
export function ymdDari(tanggal: Date): Ymd {
  return susunYmd(tanggal.getFullYear(), tanggal.getMonth() + 1, tanggal.getDate());
}

export function hariIni(sekarang: Date = new Date()): Ymd {
  return ymdDari(sekarang);
}

function nomorHari(teks: Ymd): number {
  const p = uraiYmd(teks);
  if (!p) throw new Error(`Tanggal tidak valid: ${teks}`);
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / MS_PER_HARI);
}

/** Selisih hari (tujuan - asal); positif bila tujuan lebih akhir. */
export function selisihHari(asal: Ymd, tujuan: Ymd): number {
  return nomorHari(tujuan) - nomorHari(asal);
}

export function tambahHari(teks: Ymd, n: number): Ymd {
  const t = new Date((nomorHari(teks) + n) * MS_PER_HARI);
  return susunYmd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Memajukan tanggal n bulan. Jika harinya tidak ada di bulan tujuan
 * (mis. 31 di bulan 30 hari), dipakai hari terakhir bulan itu.
 */
export function tambahBulan(teks: Ymd, n: number): Ymd {
  const p = uraiYmd(teks);
  if (!p) throw new Error(`Tanggal tidak valid: ${teks}`);
  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (((total % 12) + 12) % 12) + 1;
  return susunYmd(y, m, Math.min(p.d, hariDalamBulan(y, m)));
}

/** Merah: sisa 3 hari atau kurang (termasuk terlambat); kuning: 4-7; hijau: lebih dari 7. */
export function statusDariSisaHari(sisa: number): StatusTagih {
  if (sisa <= 3) return 'merah';
  if (sisa <= 7) return 'kuning';
  return 'hijau';
}

export function teksSisaHari(sisa: number): string {
  if (sisa < 0) return `Terlambat ${-sisa} hari`;
  if (sisa === 0) return 'Hari ini';
  if (sisa === 1) return 'Besok';
  return `${sisa} hari lagi`;
}

/** Contoh: "3 Nov 2026". */
export function formatTanggal(teks: Ymd): string {
  const p = uraiYmd(teks);
  if (!p) return teks;
  return `${p.d} ${BULAN_PENDEK[p.m - 1]} ${p.y}`;
}

/** Contoh: "Okt 2026". */
export function formatBulanTahun(teks: Ymd): string {
  const p = uraiYmd(teks);
  if (!p) return teks;
  return `${BULAN_PENDEK[p.m - 1]} ${p.y}`;
}

/** Contoh: "Rp 55.000". */
export function formatRupiah(nilai: number): string {
  const negatif = nilai < 0;
  const digit = String(Math.trunc(Math.abs(nilai))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negatif ? '-' : ''}Rp ${digit}`;
}

/** Mengurai "HH:MM" (24 jam). */
export function uraiJam(teks: string): { h: number; m: number } | null {
  const cocok = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(teks);
  return cocok ? { h: Number(cocok[1]), m: Number(cocok[2]) } : null;
}

/** Waktu notifikasi: `hariSebelum` hari sebelum tanggal tagih pada jam yang dipilih. */
export function waktuPengingat(tanggalTagih: Ymd, hariSebelum: number, jam: string): Date | null {
  const j = uraiJam(jam);
  if (!j || !adalahYmdValid(tanggalTagih)) return null;
  const sasaran = uraiYmd(tambahHari(tanggalTagih, -hariSebelum));
  if (!sasaran) return null;
  return new Date(sasaran.y, sasaran.m - 1, sasaran.d, j.h, j.m, 0, 0);
}