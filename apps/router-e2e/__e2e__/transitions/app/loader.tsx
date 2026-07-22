import { use } from 'react';
import { Text, View } from 'react-native';

import { delayPromise } from '../components/delay';

// A suspending *data* read, standing in for a slow loader/fetch. It suspends via `use(promise)` on
// the controllable delay, so leaving it unresolved exercises risk 2 (a never-resolving data source
// holds the transition open forever). It deliberately does NOT use expo-router's `useLoaderData`:
// that pipeline is server-only (gated by `unstable_useServerDataLoaders` + a server export), which
// this playground doesn't run — a client `use(promise)` characterizes the same suspending-data
// timing without the RSC/SSR machinery.
export default function Loader() {
  use(delayPromise('loader'));
  return (
    <View
      testID="loader-content"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Loader data (committed)</Text>
    </View>
  );
}
