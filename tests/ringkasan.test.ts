import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Langganan } from '../src/db/types';
import { hitungRingkasan } from '../src/lib/ringkasan';

const buat = (id: number, nama: string, harga: number): Langganan => ({
  id,
  nama,
  harga,
  tanggal_tagih: '2026-12-01',
  pengingat: 1,
  dibuat_pada: '2026-11-01',
});

describe('hitungRingkasan', () => {
  it('Rp 100.000 per bulan menjadi Rp 1.200.000 setahun', () => {
    const r = hitungRingkasan([buat(1, 'Netflix', 54000), buat(2, 'Spotify', 46000)]);
    assert.equal(r.jumlah, 2);
    assert.equal(r.totalBulanan, 100000);
    assert.equal(r.estimasiSetahun, 1200000);
  });
  it('menentukan langganan termahal', () => {
    const r = hitungRingkasan([buat(1, 'A', 10000), buat(2, 'B', 90000), buat(3, 'C', 50000)]);
    assert.equal(r.termahal?.nama, 'B');
  });
  it('daftar kosong menghasilkan nol dan tanpa termahal', () => {
    const r = hitungRingkasan([]);
    assert.deepEqual(
      { jumlah: r.jumlah, total: r.totalBulanan, setahun: r.estimasiSetahun, termahal: r.termahal },
      { jumlah: 0, total: 0, setahun: 0, termahal: null },
    );
  });
});