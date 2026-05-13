import { ScrollView as RNScrollView, StyleSheet } from 'react-native';

import type { ScrollViewProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  container: {
    // Constrain to viewport width so horizontal content overflows and scrolls
    // instead of expanding the parent layout.
    // @ts-expect-error
    maxWidth: '100vw',
  },
  noGrow: { flexGrow: 0 },
  hidden: { display: 'none' },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
});

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
  disabled = false,
  hidden = false,
  testID,
}: ScrollViewProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const isHorizontal = direction === 'horizontal';

  // react-native-web does not support separate vertical and horizontal indicator props,
  // so we map both to its single `showsIndicators` prop.
  const showVerticalIndicator = showsIndicators;
  const showHorizontalIndicator = showsIndicators;

  return (
    <RNScrollView
      horizontal={isHorizontal}
      showsVerticalScrollIndicator={showVerticalIndicator}
      showsHorizontalScrollIndicator={showHorizontalIndicator}
      nestedScrollEnabled
      testID={testID}
      style={[
        styles.container,
        style,
        style?.height != null && styles.noGrow,
        hidden && styles.hidden,
        disabled && styles.disabled,
      ]}>
      {children}
    </RNScrollView>
  );
}

export * from './types';
