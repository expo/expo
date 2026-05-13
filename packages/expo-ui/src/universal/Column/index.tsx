import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import type { ColumnProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import type { UniversalAlignment } from '../types';

const styles = StyleSheet.create({
  column: { flexDirection: 'column' },
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
 * A vertical layout container that arranges its children from top to bottom.
 */
export function Column({
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
}: ColumnProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.column,
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
