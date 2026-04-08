import { ScrollView as RNScrollView, type ViewStyle } from 'react-native';

import type { ScrollViewProps } from './types';
import { useUniversalLifecycle } from '../hooks';

/**
 * A scrollable container that supports vertical or horizontal scrolling.
 */
export function ScrollView({
  children,
  direction = 'vertical',
  showsIndicators = true,
  style,
  // onPress is not supported on web ScrollView — accepted for
  // API compatibility but silently ignored (RN ScrollView has no press handler).
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
}: ScrollViewProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const isHorizontal = direction === 'horizontal';

  const containerStyle: ViewStyle = {
    // Constrain to viewport width so horizontal content overflows and scrolls
    // instead of expanding the parent layout.
    maxWidth: '100vw' as any,
    ...style,
    ...(style?.height != null ? { flexGrow: 0 } : undefined),
    ...(hidden ? { display: 'none' } : undefined),
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined),
  };

  return (
    <RNScrollView
      horizontal={isHorizontal}
      showsVerticalScrollIndicator={!isHorizontal && showsIndicators}
      showsHorizontalScrollIndicator={isHorizontal && showsIndicators}
      style={containerStyle}
      nestedScrollEnabled
      testID={testID}>
      {children}
    </RNScrollView>
  );
}
