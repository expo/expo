import { Pressable, View, type ViewStyle } from 'react-native';

import type { ColumnProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import type { UniversalAlignment } from '../types';

const alignmentMap: Record<UniversalAlignment, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

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
  disabled,
  hidden,
  testID,
}: ColumnProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const viewStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems: alignmentMap[alignment],
    gap: spacing,
    ...style,
    ...(hidden ? { display: 'none' } : undefined),
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined),
  };

  const Container = onPress ? Pressable : View;

  return (
    <Container style={viewStyle} onPress={onPress} disabled={disabled} testID={testID}>
      {children}
    </Container>
  );
}

export * from './types';
