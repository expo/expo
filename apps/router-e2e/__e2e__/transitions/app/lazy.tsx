import { lazy, Suspense } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { delayPromise } from '../components/delay';

// A bundle-split screen: the inner content is `React.lazy`-loaded behind a delay, so first
// navigation must load a chunk before it can render — the most common slow destination (risk 8).
// Pre-flip this shows the inner Suspense fallback on navigation; post-flip (Step 5) a bare push
// keeps the previous screen up until the chunk resolves.
const LazyContent = lazy(async () => {
  await delayPromise('lazy');
  return {
    default: () => (
      <View
        testID="lazy-content"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Lazy bundle content (loaded)</Text>
      </View>
    ),
  };
});

export default function Lazy() {
  return (
    <Suspense
      fallback={
        <View
          testID="lazy-fallback"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text>Loading bundle…</Text>
        </View>
      }>
      <LazyContent />
    </Suspense>
  );
}
