import type { Langganan } from '../db/types';

export type Ringkasan = {
  jumlah: number;
  totalBulanan: number;
  estimasiSetahun: number;
  termahal: Langganan | null;
};

export function hitungRingkasan(daftar: Langganan[]): Ringkasan {
  const totalBulanan = daftar.reduce((jumlah, item) => jumlah + item.harga, 0);
  let termahal: Langganan | null = null;
  for (const item of daftar) {
    if (termahal === null || item.harga > termahal.harga) termahal = item;
  }
  return { jumlah: daftar.length, totalBulanan, estimasiSetahun: totalBulanan * 12, termahal };
}