import { use } from 'react';
import { Text, View } from 'react-native';

import { delayPromise } from '../components/delay';

// Suspends via `use(promise)` on the controllable delay. Pre-flip: navigating here flashes the
// Suspense fallback and unmounts the origin. Post-flip (Step 5): the origin stays mounted and no
// fallback flashes until `resolveDelay()` commits. Held open forever exercises the starvation case
// (risk 2). This is the import-mode-independent suspending fixture (mirrors the jest characterization).
export default function Slow() {
  use(delayPromise('slow'));
  return (
    <View testID="slow-content" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Slow screen (committed)</Text>
    </View>
  );
}
