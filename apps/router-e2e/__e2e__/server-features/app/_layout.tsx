import * as Font from 'expo-font';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';

import { Container } from '../components/Container';

export default function RootLayout() {
  const [isLoaded] = Font.useFonts({ sweet: require('../sweet.ttf') });

  // This is important for the test because static font extraction will ensure this is never called
  // with static websites. We can test by seeing if the app has HTML rendered.
  // Server-only: blocking on the client would blank the page (and remount the tree on hydration),
  // breaking the loader navigation/state tests.
  if (!isLoaded && typeof window === 'undefined') {
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
      <Container>
        <Slot />
      </Container>
    </>
  );
}
