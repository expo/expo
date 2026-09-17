import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { createFallback } from '../components/suspense';

export const SuspenseFallback = createFallback('root-fallback');

/** Rendered only after the client tree commits, so tests can tell client output from server HTML. */
function ClientMarker() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? <Text testID="client-mounted">client</Text> : null;
}

export default function RootLayout() {
  return (
    <>
      <ClientMarker />
      <Slot />
    </>
  );
}
