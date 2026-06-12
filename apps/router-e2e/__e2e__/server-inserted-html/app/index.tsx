import React, { Suspense, useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useStreamedValue } from '../components/StreamedData';

function delayed(value: string, ms: number): () => Promise<string> {
  return () => new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function SourceText({ testID, source }: { testID: string; source: 'stream' | 'fetched' }) {
  // Only rendered after mount: the server renders `fetched` while the hydrated client
  // reads from the injected stream data, which would otherwise mismatch during hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <Text testID={testID}>{mounted ? source : 'pending'}</Text>;
}

function FastSection() {
  const { value, source } = useStreamedValue('fast', delayed('fast-data', 100));
  return (
    <>
      <Text testID="fast-value">{value}</Text>
      <SourceText testID="fast-source" source={source} />
    </>
  );
}

function SlowSection() {
  const { value, source } = useStreamedValue('slow', delayed('slow-data', 500));
  return (
    <>
      <Text testID="slow-value">{value}</Text>
      <SourceText testID="slow-source" source={source} />
    </>
  );
}

export default function Page() {
  return (
    <>
      <Text testID="index-text">Index</Text>
      <Suspense fallback={<Text testID="fast-fallback">Loading fast…</Text>}>
        <FastSection />
      </Suspense>
      <Suspense fallback={<Text testID="slow-fallback">Loading slow…</Text>}>
        <SlowSection />
      </Suspense>
    </>
  );
}
