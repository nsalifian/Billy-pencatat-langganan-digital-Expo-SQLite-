import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as repo from '../src/db/repository';
import { migrasi } from '../src/db/schema';
import { validasiBerkasCadangan } from '../src/lib/validasi';
import { buatDb } from './adapter';

const netflix = { nama: 'Netflix', harga: 54000, tanggal_tagih: '2026-12-05', pengingat: 1 };
const spotify = { nama: 'Spotify', harga: 55000, tanggal_tagih: '2026-11-28', pengingat: 2 };

async function dbSiap(gagalPada?: string) {
  const db = buatDb(gagalPada);
  await migrasi(db);
  return db;
}

describe('migrasi', () => {
  it('membuat tabel dan dapat dijalankan berulang', async () => {
    const db = await dbSiap();
    await migrasi(db);
    const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    assert.equal(v?.user_version, 1);
    assert.deepEqual(await repo.getAll(db), []);
  });
});

describe('create, getAll, update', () => {
  it('menyimpan dan mengurutkan menurut tanggal tagih', async () => {
    const db = await dbSiap();
    const id1 = await repo.create(db, netflix, '2026-11-01');
    const id2 = await repo.create(db, spotify, '2026-11-02');
    assert.notEqual(id1, id2);
    const daftar = await repo.getAll(db);
    assert.deepEqual(daftar.map((x) => x.nama), ['Spotify', 'Netflix']);
    assert.equal(daftar[1].dibuat_pada, '2026-11-01');
  });
  it('mengubah data', async () => {
    const db = await dbSiap();
    const id = await repo.create(db, netflix, '2026-11-01');
    await repo.update(db, id, { ...netflix, harga: 65000 });
    assert.equal((await repo.getById(db, id))?.harga, 65000);
  });
  it('input berisi tanda kutip tidak merusak kueri', async () => {
    const db = await dbSiap();
    const id = await repo.create(db, { ...netflix, nama: "x'); DROP TABLE langganan;--" }, '2026-11-01');
    assert.equal((await repo.getById(db, id))?.nama, "x'); DROP TABLE langganan;--");
    assert.equal((await repo.getAll(db)).length, 1);
  });
});

describe('markPaid', () => {
  it('memajukan tanggal tagih satu bulan', async () => {
    const db = await dbSiap();
    const id = await repo.create(db, netflix, '2026-11-01');
    assert.equal(await repo.markPaid(db, id), '2027-01-05');
    assert.equal((await repo.getById(db, id))?.tanggal_tagih, '2027-01-05');
  });
  it('mengembalikan null untuk id yang tidak ada', async () => {
    assert.equal(await repo.markPaid(await dbSiap(), 999), null);
  });
});

describe('stop dan remove', () => {
  it('stop memindahkan ke riwayat dan menghapus dari langganan', async () => {
    const db = await dbSiap();
    const id = await repo.create(db, netflix, '2026-11-01');
    assert.equal(await repo.stop(db, id, '2026-11-24'), true);
    assert.equal((await repo.getAll(db)).length, 0);
    const riwayat = await repo.getRiwayat(db);
    assert.equal(riwayat.length, 1);
    assert.deepEqual(
      { nama: riwayat[0].nama, harga: riwayat[0].harga, sejak: riwayat[0].dicatat_sejak, henti: riwayat[0].berhenti_pada },
      { nama: 'Netflix', harga: 54000, sejak: '2026-11-01', henti: '2026-11-24' },
    );
  });
  it('stop pada id yang tidak ada mengembalikan false dan tidak mengubah apa pun', async () => {
    const db = await dbSiap();
    assert.equal(await repo.stop(db, 999, '2026-11-24'), false);
    assert.equal((await repo.getRiwayat(db)).length, 0);
  });
  it('stop bersifat atomik: kegagalan di tengah membatalkan seluruhnya', async () => {
    const db = await dbSiap('DELETE FROM langganan');
    const id = await repo.create(db, netflix, '2026-11-01');
    await assert.rejects(() => repo.stop(db, id, '2026-11-24'));
    assert.equal((await repo.getAll(db)).length, 1, 'langganan tetap ada');
    assert.equal((await repo.getRiwayat(db)).length, 0, 'riwayat tidak terisi separuh');
  });
  it('remove menghapus tanpa jejak di riwayat', async () => {
    const db = await dbSiap();
    const id = await repo.create(db, netflix, '2026-11-01');
    await repo.remove(db, id);
    assert.equal((await repo.getAll(db)).length, 0);
    assert.equal((await repo.getRiwayat(db)).length, 0);
  });
  it('removeRiwayat menghapus satu entri', async () => {
    const db = await dbSiap();
    const a = await repo.create(db, netflix, '2026-11-01');
    const b = await repo.create(db, spotify, '2026-11-01');
    await repo.stop(db, a, '2026-11-24');
    await repo.stop(db, b, '2026-11-24');
    const [pertama] = await repo.getRiwayat(db);
    await repo.removeRiwayat(db, pertama.id);
    assert.equal((await repo.getRiwayat(db)).length, 1);
  });
});

describe('ekspor dan impor', () => {
  it('ekspor lalu impor ke basis data baru menghasilkan data identik', async () => {
    const asal = await dbSiap();
    const a = await repo.create(asal, netflix, '2026-11-01');
    await repo.create(asal, spotify, '2026-11-02');
    await repo.stop(asal, a, '2026-11-24');
    const berkas = await repo.exportData(asal, '2026-11-24');

    const hasil = validasiBerkasCadangan(JSON.parse(JSON.stringify(berkas)));
    assert.equal(hasil.ok, true);
    if (!hasil.ok) return;

    const tujuan = await dbSiap();
    await repo.create(tujuan, { ...netflix, nama: 'Data lama' }, '2026-01-01');
    await repo.importData(tujuan, hasil.data);

    assert.deepEqual(await repo.getAll(tujuan), await repo.getAll(asal));
    assert.deepEqual(await repo.getRiwayat(tujuan), await repo.getRiwayat(asal));
  });
  it('impor yang gagal di tengah membiarkan data lama utuh', async () => {
    const db = await dbSiap();
    await repo.create(db, netflix, '2026-11-01');
    const dobel = {
      versi: 1,
      diekspor_pada: '2026-11-24',
      langganan: [
        { id: 7, ...spotify, dibuat_pada: '2026-11-01' },
        { id: 7, ...spotify, dibuat_pada: '2026-11-01' }, // id ganda memicu kegagalan di basis data
      ],
      riwayat: [],
    };
    await assert.rejects(() => repo.importData(db, dobel));
    const daftar = await repo.getAll(db);
    assert.equal(daftar.length, 1);
    assert.equal(daftar[0].nama, 'Netflix');
  });
  it('berkas rusak ditolak validasi sebelum menyentuh basis data', () => {
    assert.equal(validasiBerkasCadangan({ versi: 1, langganan: 'bukan array', riwayat: [] }).ok, false);
  });
  it('clearAll mengosongkan kedua tabel', async () => {
    const db = await dbSiap();
    const a = await repo.create(db, netflix, '2026-11-01');
    await repo.create(db, spotify, '2026-11-01');
    await repo.stop(db, a, '2026-11-24');
    await repo.clearAll(db);
    assert.equal((await repo.getAll(db)).length, 0);
    assert.equal((await repo.getRiwayat(db)).length, 0);
  });
});