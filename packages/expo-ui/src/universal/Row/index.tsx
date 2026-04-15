import { Pressable, View, type ViewStyle } from 'react-native';

import type { RowProps, UniversalAlignment } from './types';
import { useUniversalLifecycle } from '../hooks';

const alignmentMap: Record<UniversalAlignment, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

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
  disabled,
  hidden,
  testID,
}: RowProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const viewStyle: ViewStyle = {
    flexDirection: 'row',
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
