import { StyleSheet, View } from 'react-native';

import type { RNHostViewProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  fillParent: { width: '100%', height: '100%' },
  matchContents: { width: 'fit-content', height: 'fit-content' },
  hidden: { display: 'none' },
});

/**
 * Hosts React Native views inside SwiftUI or Jetpack Compose views.
 */
export function RNHostView({
  children,
  style,
  onAppear,
  onDisappear,
  hidden = false,
  testID,
  matchContents = false,
}: RNHostViewProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  return (
    <View
      testID={testID}
      style={[
        matchContents ? styles.matchContents : styles.fillParent,
        style,
        hidden && styles.hidden,
      ]}>
      {children}
    </View>
  );
}

export * from './types';
