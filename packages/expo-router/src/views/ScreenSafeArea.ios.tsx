import { use, type PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-screens/experimental';

import { NativeStackTopInsetContext } from '../react-navigation/native-stack/utils/NativeStackTopInsetContext';
import { ScreenPresentationContext } from '../react-navigation/native-stack/utils/ScreenPresentationContext';
import { SafeAreaEdgesContext } from './SafeAreaEdgesContext';

export function ScreenSafeArea({ children }: PropsWithChildren) {
  const presentation = use(ScreenPresentationContext);
  const nativeStackAppliesTop = use(NativeStackTopInsetContext);
  const edges = use(SafeAreaEdgesContext);

  // An extra native view prevents RNS from finding the form sheet's ScrollView for resizing.
  if (presentation === 'formSheet') {
    return children;
  }

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      collapsable={false}
      edges={nativeStackAppliesTop ? { ...edges, top: false } : edges}>
      {children}
    </SafeAreaView>
  );
}
