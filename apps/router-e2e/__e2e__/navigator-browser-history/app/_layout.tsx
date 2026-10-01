import { Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function RootLayout() {
  const pathname = usePathname();
  // Rendered only on the client after hydration, so tests can wait for the app to be interactive.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <>
      <Head>
        <title>{pathname}</title>
      </Head>
      <Stack>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {mounted && <Text testID="root-mounted">Mounted</Text>}
    </>
  );
}
