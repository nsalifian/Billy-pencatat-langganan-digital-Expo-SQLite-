import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validasiBerkasCadangan, validasiForm } from '../src/lib/validasi';

const formSah = { nama: 'Netflix', harga: '54000', tanggal_tagih: '2026-12-05', pengingat: '1' };

describe('validasiForm', () => {
  it('menerima isian yang sah', () => {
    const h = validasiForm(formSah);
    assert.equal(h.ok, true);
    if (h.ok) assert.deepEqual(h.data, { nama: 'Netflix', harga: 54000, tanggal_tagih: '2026-12-05', pengingat: 1 });
  });
  it('menolak nama kosong dan harga kosong', () => {
    const h = validasiForm({ ...formSah, nama: '   ', harga: '' });
    assert.equal(h.ok, false);
    if (!h.ok) {
      assert.ok(h.galat.nama);
      assert.ok(h.galat.harga);
    }
  });
  it('menolak harga nol, negatif, desimal, dan huruf', () => {
    for (const harga of ['0', '-5', '1.5', 'abc', '1e3']) {
      assert.equal(validasiForm({ ...formSah, harga }).ok, false, `harga ${harga}`);
    }
  });
  it('menolak tanggal yang tidak ada', () => {
    assert.equal(validasiForm({ ...formSah, tanggal_tagih: '2027-02-30' }).ok, false);
  });
  it('pengingat kosong dianggap 0; di luar 0..30 ditolak', () => {
    const kosong = validasiForm({ ...formSah, pengingat: '' });
    assert.equal(kosong.ok && kosong.data.pengingat, 0);
    assert.equal(validasiForm({ ...formSah, pengingat: '31' }).ok, false);
    assert.equal(validasiForm({ ...formSah, pengingat: '-1' }).ok, false);
  });
  it('menolak nama lebih dari 60 karakter', () => {
    assert.equal(validasiForm({ ...formSah, nama: 'x'.repeat(61) }).ok, false);
  });
});

const berkasSah = {
  versi: 1,
  diekspor_pada: '2026-11-24',
  langganan: [
    { id: 1, nama: 'Netflix', harga: 54000, tanggal_tagih: '2026-12-05', pengingat: 1, dibuat_pada: '2026-11-01' },
  ],
  riwayat: [{ id: 1, nama: 'Spotify', harga: 55000, dicatat_sejak: '2026-01-01', berhenti_pada: '2026-10-01' }],
};

describe('validasiBerkasCadangan', () => {
  it('menerima berkas yang sah', () => {
    assert.equal(validasiBerkasCadangan(berkasSah).ok, true);
  });
  it('menolak bukan objek, versi salah, dan kunci hilang', () => {
    assert.equal(validasiBerkasCadangan('teks').ok, false);
    assert.equal(validasiBerkasCadangan(null).ok, false);
    assert.equal(validasiBerkasCadangan({ ...berkasSah, versi: 2 }).ok, false);
    assert.equal(validasiBerkasCadangan({ versi: 1, riwayat: [] }).ok, false);
    assert.equal(validasiBerkasCadangan({ versi: 1, langganan: [] }).ok, false);
  });
  it('menolak tipe keliru dan tanggal tidak valid', () => {
    const rusak = { ...berkasSah, langganan: [{ ...berkasSah.langganan[0], harga: '54000' }] };
    assert.equal(validasiBerkasCadangan(rusak).ok, false);
    const tanggalBuruk = { ...berkasSah, riwayat: [{ ...berkasSah.riwayat[0], berhenti_pada: '2026-02-31' }] };
    assert.equal(validasiBerkasCadangan(tanggalBuruk).ok, false);
  });
  it('menolak id ganda', () => {
    const ganda = { ...berkasSah, langganan: [berkasSah.langganan[0], berkasSah.langganan[0]] };
    assert.equal(validasiBerkasCadangan(ganda).ok, false);
  });
});