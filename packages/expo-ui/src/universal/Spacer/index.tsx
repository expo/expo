import { View, type ViewStyle } from 'react-native';

import type { SpacerProps } from './types';
import { useUniversalLifecycle } from '../hooks';

/**
 * A layout spacer that produces empty space between siblings in a
 * [`Row`](#row) or [`Column`](#column).
 */
export function Spacer({
  size,
  flexible = false,
  style,
  onAppear,
  onDisappear,
  hidden,
  testID,
}: SpacerProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const viewStyle: ViewStyle = {
    ...(flexible ? { flex: 1 } : undefined),
    ...(size != null ? { width: size, height: size } : undefined),
    ...style,
    ...(hidden ? { display: 'none' } : undefined),
  };

  return <View style={viewStyle} testID={testID} />;
}

export * from './types';
