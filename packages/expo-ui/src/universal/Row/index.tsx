import { Pressable, View, type ViewStyle } from 'react-native';

import type { RowProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import type { UniversalAlignment } from '../types';

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
    // Fill the parent's cross-axis by default so a `<Spacer flexible />`
    // child has room to grow. Without this, a Row placed inside a `Column`
    // with alignment other than 'stretch' is content-sized on web, which
    // leaves flex children with no leftover space. SwiftUI and Compose
    // achieve the same effect via their own layout phases.
    alignSelf: 'stretch',
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

export * from './types';
