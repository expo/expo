import { StyleSheet, View } from 'react-native';

import type { RNHostViewProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  fill: { flex: 1 },
  matchContents: { alignSelf: 'flex-start' },
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
      style={[matchContents ? styles.matchContents : styles.fill, style, hidden && styles.hidden]}>
      {children}
    </View>
  );
}

export * from './types';
