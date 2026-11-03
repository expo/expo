import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useUniversalLifecycle } from '../hooks';
import { StackAxisContext, useCrossAxisSize } from '../stackAxis';
import type { UniversalAlignment } from '../types';
import type { ColumnProps } from './types';

const styles = StyleSheet.create({
  column: { flexDirection: 'column' },
  // Fill the parent's cross axis when this column has no size of its own on that axis.
  // A set size must not use stretch: that overrides the parent's `alignItems`,
  // and the column then sits at the start.
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
  const crossAxisSize = useCrossAxisSize(style);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.column,
        crossAxisSize == null && styles.stretch,
        alignmentStyles[alignment],
        spacing != null && { gap: spacing },
        style,
        hidden && styles.hidden,
        disabled && styles.disabled,
      ]}>
      <StackAxisContext.Provider value="vertical">{children}</StackAxisContext.Provider>
    </Container>
  );
}

export * from './types';
