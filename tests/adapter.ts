import { DatabaseSync } from 'node:sqlite';
import type { Db, DbQuery, NilaiSql } from '../src/db/schema';

/**
 * Pembungkus node:sqlite yang memenuhi antarmuka Db milik aplikasi, sehingga
 * repository diuji dengan SQLite sungguhan tanpa perangkat. `gagalPada`
 * (opsional) menyimulasikan kegagalan: kueri yang mengandung teks tersebut
 * melempar galat di dalam transaksi.
 */
export function buatDb(gagalPada?: string): Db {
  const sqlite = new DatabaseSync(':memory:');

  const kueri: DbQuery = {
    async execAsync(sql) {
      sqlite.exec(sql);
    },
    async runAsync(sql, params: NilaiSql[] = []) {
      return sqlite.prepare(sql).run(...params);
    },
    async getAllAsync<T>(sql: string, params: NilaiSql[] = []) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: NilaiSql[] = []) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
  };

  return {
    ...kueri,
    async withExclusiveTransactionAsync(task) {
      sqlite.exec('BEGIN EXCLUSIVE');
      const txn: DbQuery = {
        ...kueri,
        async runAsync(sql, params = []) {
          if (gagalPada && sql.includes(gagalPada)) throw new Error('kegagalan simulasi');
          return kueri.runAsync(sql, params);
        },
      };
      try {
        await task(txn);
        sqlite.exec('COMMIT');
      } catch (galat) {
        sqlite.exec('ROLLBACK');
        throw galat;
      }
    },
  };
}