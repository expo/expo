import React from 'react';
import { View, Text } from 'react-native';
import { Banana } from '../components/icons';
const AsyncChunk = React.lazy(() => import('../components/async-chunk'));

try {
  let AbsolutelyMissingLibrary = require('@bacons/absolute-missing-library');
  console.log(AbsolutelyMissingLibrary);
} catch (e) {}

// let OptionalExisting;

// try {
//   OptionalExisting = require('../components/optional-existing').default;
// } catch (e) {}

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
      <Text>Hello, world!</Text>
      {/* <OptionalExisting /> */}

      {mounted && (
        <React.Suspense fallback={<Text>Loading...</Text>}>
          <AsyncChunk />
        </React.Suspense>
      )}
      <Banana />
    </View>
  );
}
