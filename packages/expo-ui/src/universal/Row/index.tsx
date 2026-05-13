import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import type { RowProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import type { UniversalAlignment } from '../types';

const styles = StyleSheet.create({
  row: {
    // Fill the parent's cross-axis by default so a `<Spacer flexible />`
    // child has room to grow. Without this, a Row placed inside a `Column`
    // with alignment other than 'stretch' is content-sized on web, which
    // leaves flex children with no leftover space. SwiftUI and Compose
    // achieve the same effect via their own layout phases.
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  hidden: { display: 'none' },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
});

const alignmentStyles = StyleSheet.create({
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
} satisfies Record<UniversalAlignment, ViewStyle>);

/**
 * A horizontal layout container that arranges its children from start to end.
 */
export function Row({
  children,
  alignment = 'start',
  spacing,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled = false,
  hidden = false,
  testID,
}: RowProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.row,
        alignmentStyles[alignment],
        spacing != null && { gap: spacing },
        style,
        hidden && styles.hidden,
        disabled && styles.disabled,
      ]}>
      {children}
    </Container>
  );
}

export * from './types';
