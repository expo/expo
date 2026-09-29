import { View } from 'react-native';

import DomView from './DomView';

// Set by the e2e suite to a literal hermesc packs together with the DOM component
// html placeholder, to check the html rename does not clip neighbouring strings.
export const hbcOverlapProbe = process.env.EXPO_PUBLIC_HBC_OVERLAP_PROBE;

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <DomView />
    </View>
  );
}
