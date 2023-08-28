// Tests nested Head metadata in a static rendering app.

import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';

export default function Layout() {
  const [isLoaded] = Font.useFonts({ sweet: require('../sweet.ttf') });

  // This is important for the test because static font extraction will ensure this is never called
  // with static websites. We can test by seeing if the app has HTML rendered.
  if (!isLoaded) {
    return null;
  }

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
