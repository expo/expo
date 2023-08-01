// Tests nested Head metadata in a static rendering app.

import { Stack } from 'expo-router';
import Head from 'expo-router/head';

export default function Layout() {
  return (
    <>
      <Head>
        <meta name="expo-nested-layout" content="TEST_VALUE" />

        {/* Test that public env vars are exposed. */}
        <meta name="expo-e2e-public-env-var-client" content={process.env.EXPO_PUBLIC_TEST_VALUE} />
        {/* Test that server env vars can be inlined during SSG. */}
        <meta
          name="expo-e2e-private-env-var-client"
          content={process.env.EXPO_NOT_PUBLIC_TEST_VALUE}
        />
      </Head>
      <Stack />
    </>
  );
}
