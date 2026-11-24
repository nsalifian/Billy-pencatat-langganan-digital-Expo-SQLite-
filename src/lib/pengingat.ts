import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Langganan } from '../db/types';
import { formatRupiah, waktuPengingat } from './tanggal';

export const KANAL_ID = 'tagihan';

/** Atur tampilan notifikasi saat aplikasi sedang terbuka. Panggil sekali di _layout. */
export function aturPenangan(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Android 8+ mewajibkan kanal notifikasi. */
export async function siapkanKanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(KANAL_ID, {
    name: 'Pengingat tagihan',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Meminta izin bila belum ada; mengembalikan true bila diizinkan. */
export async function pastikanIzin(): Promise<boolean> {
  const sekarang = await Notifications.getPermissionsAsync();
  if (sekarang.granted) return true;
  if (!sekarang.canAskAgain) return false;
  const hasil = await Notifications.requestPermissionsAsync();
  return hasil.granted;
}

/**
 * Menjadwalkan ulang seluruh pengingat dari data terkini: batalkan semua,
 * lalu jadwalkan satu notifikasi per langganan yang pengingatnya > 0 dan
 * waktunya belum lewat. Mengembalikan jumlah notifikasi yang terjadwal.
 */
export async function jadwalkanUlang(
  daftar: Langganan[],
  jam: string,
  sekarang: Date = new Date(),
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await pastikanIzin())) return 0;

  let jumlah = 0;
  for (const item of daftar) {
    if (item.pengingat <= 0) continue;
    const waktu = waktuPengingat(item.tanggal_tagih, item.pengingat, jam);
    if (!waktu || waktu.getTime() <= sekarang.getTime()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tagihan ${item.nama}`,
        body: `${formatRupiah(item.harga)} jatuh tempo ${
          item.pengingat === 1 ? 'besok' : `${item.pengingat} hari lagi`
        }.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: waktu,
        channelId: KANAL_ID,
      },
    });
    jumlah += 1;
  }
  return jumlah;
}