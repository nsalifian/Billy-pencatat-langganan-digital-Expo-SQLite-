import { Tabs } from 'expo-router';
import { warna } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: warna.utama,
        tabBarInactiveTintColor: warna.teksPudar,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
        headerStyle: { backgroundColor: warna.kartu },
        headerTintColor: warna.teks,
        sceneStyle: { backgroundColor: warna.latar },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}