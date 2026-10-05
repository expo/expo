import { StyleSheet, View } from 'react-native';

import { resolveMatchContents } from '../../utils/matchContents';
import { useUniversalLifecycle } from '../hooks';
import type { RNHostViewProps } from './types';

const styles = StyleSheet.create({
  fillWidth: { width: '100%' },
  fillHeight: { height: '100%' },
  fitWidth: { width: 'fit-content' },
  fitHeight: { height: 'fit-content' },
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
  onLayout,
}: RNHostViewProps) {
  useUniversalLifecycle(onAppear, onDisappear);
  const { horizontal, vertical } = resolveMatchContents(matchContents);

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[
        horizontal ? styles.fitWidth : styles.fillWidth,
        vertical ? styles.fitHeight : styles.fillHeight,
        style,
        hidden && styles.hidden,
      ]}>
      {children}
    </View>
  );
}

export * from './types';
