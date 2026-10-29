import { Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';

export default function RootLayout() {
  const pathname = usePathname();
  return (
    <>
      <Head>
        <title>{pathname}</title>
      </Head>
      <Stack>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
