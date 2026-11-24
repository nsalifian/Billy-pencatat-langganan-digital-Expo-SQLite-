import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { migrasi } from '../db/schema';
import { aturPenangan, siapkanKanal } from '../lib/pengingat';
import { sinkronPengingat } from '../lib/sinkron';
import { warna } from '../theme';

aturPenangan();

function Pemuat() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: warna.latar }}>
      <ActivityIndicator color={warna.utama} />
    </View>
  );
}

/** Menyelaraskan pengingat satu kali setiap aplikasi dibuka. */
function PenyelarasAwal() {
  const db = useSQLiteContext();
  useEffect(() => {
    siapkanKanal()
      .then(() => sinkronPengingat(db))
      .catch(() => {});
  }, [db]);
  return null;
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Pemuat />}>
      <SQLiteProvider databaseName="billy.db" onInit={migrasi} useSuspense>
        <PenyelarasAwal />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: warna.kartu },
            headerTintColor: warna.teks,
            contentStyle: { backgroundColor: warna.latar },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}