import AsyncStorage from '@react-native-async-storage/async-storage';
import { uraiJam } from './tanggal';

const KUNCI_JAM = 'billy.jam_pengingat';
export const JAM_BAWAAN = '09:00';

export async function ambilJamPengingat(): Promise<string> {
  try {
    const nilai = await AsyncStorage.getItem(KUNCI_JAM);
    return nilai && uraiJam(nilai) ? nilai : JAM_BAWAAN;
  } catch {
    return JAM_BAWAAN;
  }
}

export async function simpanJamPengingat(jam: string): Promise<void> {
  if (!uraiJam(jam)) throw new Error('Format jam tidak valid.');
  await AsyncStorage.setItem(KUNCI_JAM, jam);
}