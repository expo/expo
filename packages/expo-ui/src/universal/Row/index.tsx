import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useUniversalLifecycle } from '../hooks';
import type { UniversalAlignment } from '../types';
import type { RowProps } from './types';

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  // Fill the parent's cross axis when this row has no width of its own,
  // so a flexible child still has leftover space. A set width must not use
  // stretch, or the parent's alignment cannot move it.
  stretch: { alignSelf: 'stretch' },
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
        style?.width == null && styles.stretch,
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
