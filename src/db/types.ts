export type Langganan = {
  id: number;
  nama: string;
  harga: number;
  tanggal_tagih: string; // YYYY-MM-DD
  pengingat: number; // berapa hari sebelum tagih; 0 = tanpa pengingat
  dibuat_pada: string; // YYYY-MM-DD
};

export type Riwayat = {
  id: number;
  nama: string;
  harga: number;
  dicatat_sejak: string;
  berhenti_pada: string;
};

/** Data yang diisi pengguna pada formulir. */
export type InputLangganan = Omit<Langganan, 'id' | 'dibuat_pada'>;

export const VERSI_CADANGAN = 1;

export type BerkasCadangan = {
  versi: number;
  diekspor_pada: string;
  langganan: Langganan[];
  riwayat: Riwayat[];
};