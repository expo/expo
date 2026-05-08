import { StyleSheet, View } from 'react-native';

import type { SpacerProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  flexible: { flex: 1 },
  hidden: { display: 'none' },
});

/**
 * A layout spacer that produces empty space between siblings in a
 * `Row` or `Column`.
 */
export function Spacer({
  size,
  flexible = false,
  style,
  onAppear,
  onDisappear,
  hidden = false,
  testID,
}: SpacerProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  return (
    <View
      testID={testID}
      style={[
        flexible && styles.flexible,
        size != null && { width: size, height: size },
        style,
        hidden && styles.hidden,
      ]}
    />
  );
}

export * from './types';
