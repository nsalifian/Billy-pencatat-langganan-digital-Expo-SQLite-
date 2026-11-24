export type NilaiSql = string | number | null;

/** Antarmuka minimal; SQLiteDatabase milik expo-sqlite memenuhinya. */
export interface DbQuery {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: NilaiSql[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: NilaiSql[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: NilaiSql[]): Promise<T | null>;
}

export interface Db extends DbQuery {
  /** Seluruh langkah berhasil, atau seluruhnya dibatalkan. */
  withExclusiveTransactionAsync(task: (txn: DbQuery) => Promise<void>): Promise<void>;
}

export const VERSI_SKEMA = 1;

export async function migrasi(db: DbQuery): Promise<void> {
  const baris = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  let versi = baris?.user_version ?? 0;
  if (versi >= VERSI_SKEMA) return;

  if (versi < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS langganan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        harga INTEGER NOT NULL,
        tanggal_tagih TEXT NOT NULL,
        pengingat INTEGER DEFAULT 1,
        dibuat_pada TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS riwayat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        harga INTEGER NOT NULL,
        dicatat_sejak TEXT NOT NULL,
        berhenti_pada TEXT NOT NULL
      );
    `);
    versi = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${VERSI_SKEMA}`);
}