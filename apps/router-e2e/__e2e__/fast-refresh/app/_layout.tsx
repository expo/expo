import { Slot } from 'expo-router';
import Head from 'expo-router/head';

export default function Layout() {
  const LAYOUT_VALUE = 'TEST_VALUE';
  return (
    <>
      <Head>
        <meta name="expo-nested-layout" content={LAYOUT_VALUE} />
      </Head>
      <Slot />
    </>
  );
}
