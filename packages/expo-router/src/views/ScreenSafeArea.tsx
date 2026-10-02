import { use, type PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-screens/experimental';

import { SafeAreaEdgesContext } from './SafeAreaEdgesContext';

export function ScreenSafeArea({ children }: PropsWithChildren) {
  const edges = use(SafeAreaEdgesContext);
  return (
    <SafeAreaView style={{ flex: 1 }} collapsable={false} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
