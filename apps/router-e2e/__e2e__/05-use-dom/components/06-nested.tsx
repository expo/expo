'use dom';

// Tests that DOM components can be nested within each other and only register the root.
import { View } from 'react-native';

import LocalAsset from './03-local-asset';

export default function Page(_: { dom?: import('expo/dom').DOMProps }) {
  return (
    <div style={{ width: '100%' }}>
      <View
        testID="06-nested"
        style={{
          width: '100%',
          height: 100,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'dodgerblue',
        }}
      />
      <LocalAsset />
    </div>
  );
}
