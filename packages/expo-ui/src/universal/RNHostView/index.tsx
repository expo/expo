import { StyleSheet, View } from 'react-native';

import { useUniversalLifecycle } from '../hooks';
import type { RNHostViewProps } from './types';

const styles = StyleSheet.create({
  fillParent: { width: '100%', height: '100%' },
  matchContents: { width: 'fit-content', height: 'fit-content' },
  hidden: { display: 'none' },
});

/**
 * Hosts React Native views inside Jetpack Compose or SwiftUI views.
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
