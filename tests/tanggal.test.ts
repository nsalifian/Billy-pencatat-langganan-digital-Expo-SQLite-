import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adalahYmdValid,
  formatRupiah,
  formatTanggal,
  selisihHari,
  statusDariSisaHari,
  tambahBulan,
  teksSisaHari,
  waktuPengingat,
} from '../src/lib/tanggal';

describe('tambahBulan', () => {
  it('memajukan satu bulan pada hari biasa', () => {
    assert.equal(tambahBulan('2026-10-15', 1), '2026-11-15');
  });
  it('menjepit ke hari terakhir bulan pendek (non-kabisat)', () => {
    assert.equal(tambahBulan('2027-01-31', 1), '2027-02-28');
  });
  it('menjepit ke 29 Februari pada tahun kabisat', () => {
    assert.equal(tambahBulan('2028-01-31', 1), '2028-02-29');
  });
  it('menjepit 31 Maret ke 30 April', () => {
    assert.equal(tambahBulan('2027-03-31', 1), '2027-04-30');
  });
  it('melewati pergantian tahun', () => {
    assert.equal(tambahBulan('2026-12-10', 1), '2027-01-10');
  });
});

describe('selisihHari', () => {
  it('menghitung selisih dalam bulan yang sama', () => {
    assert.equal(selisihHari('2026-11-01', '2026-11-06'), 5);
  });
  it('bernilai negatif bila tujuan sudah lewat', () => {
    assert.equal(selisihHari('2026-11-10', '2026-11-08'), -2);
  });
  it('tepat pada pergantian tahun', () => {
    assert.equal(selisihHari('2026-12-31', '2027-01-01'), 1);
  });
});

describe('status warna', () => {
  it('2 hari: merah', () => assert.equal(statusDariSisaHari(2), 'merah'));
  it('6 hari: kuning', () => assert.equal(statusDariSisaHari(6), 'kuning'));
  it('15 hari: hijau', () => assert.equal(statusDariSisaHari(15), 'hijau'));
  it('batas: 3 merah, 4 kuning, 7 kuning, 8 hijau', () => {
    assert.equal(statusDariSisaHari(3), 'merah');
    assert.equal(statusDariSisaHari(4), 'kuning');
    assert.equal(statusDariSisaHari(7), 'kuning');
    assert.equal(statusDariSisaHari(8), 'hijau');
  });
  it('terlambat tetap merah', () => assert.equal(statusDariSisaHari(-5), 'merah'));
});

describe('teks dan format', () => {
  it('teksSisaHari', () => {
    assert.equal(teksSisaHari(-2), 'Terlambat 2 hari');
    assert.equal(teksSisaHari(0), 'Hari ini');
    assert.equal(teksSisaHari(1), 'Besok');
    assert.equal(teksSisaHari(9), '9 hari lagi');
  });
  it('formatRupiah', () => {
    assert.equal(formatRupiah(0), 'Rp 0');
    assert.equal(formatRupiah(55000), 'Rp 55.000');
    assert.equal(formatRupiah(1200000), 'Rp 1.200.000');
  });
  it('formatTanggal', () => assert.equal(formatTanggal('2026-11-03'), '3 Nov 2026'));
});

describe('validitas tanggal', () => {
  it('menolak tanggal yang tidak ada di kalender', () => {
    assert.equal(adalahYmdValid('2027-02-29'), false);
    assert.equal(adalahYmdValid('2026-13-01'), false);
    assert.equal(adalahYmdValid('2026-4-5'), false);
  });
  it('menerima 29 Februari tahun kabisat', () => {
    assert.equal(adalahYmdValid('2028-02-29'), true);
  });
});

describe('waktuPengingat', () => {
  it('3 hari sebelum 10 Nov pukul 09:00 jatuh pada 7 Nov', () => {
    const w = waktuPengingat('2026-11-10', 3, '09:00');
    assert.ok(w);
    assert.equal(w.getFullYear(), 2026);
    assert.equal(w.getMonth(), 10);
    assert.equal(w.getDate(), 7);
    assert.equal(w.getHours(), 9);
  });
  it('menolak jam atau tanggal tidak valid', () => {
    assert.equal(waktuPengingat('2026-11-10', 1, '25:00'), null);
    assert.equal(waktuPengingat('salah', 1, '09:00'), null);
  });
});