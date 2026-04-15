import { Text as RNText, type TextStyle } from 'react-native';

import type { TextProps } from './types';
import { useUniversalLifecycle } from '../hooks';

/**
 * A component for displaying styled text content.
 */
export function Text({
  children,
  textStyle,
  numberOfLines,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
}: TextProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const mergedStyle: TextStyle = {
    ...style,
    ...(textStyle?.fontSize != null ? { fontSize: textStyle.fontSize } : undefined),
    ...(textStyle?.fontWeight != null ? { fontWeight: textStyle.fontWeight } : undefined),
    ...(textStyle?.fontFamily != null ? { fontFamily: textStyle.fontFamily } : undefined),
    ...(textStyle?.color != null ? { color: textStyle.color } : undefined),
    ...(textStyle?.lineHeight != null ? { lineHeight: textStyle.lineHeight } : undefined),
    ...(textStyle?.letterSpacing != null ? { letterSpacing: textStyle.letterSpacing } : undefined),
    ...(textStyle?.textAlign != null ? { textAlign: textStyle.textAlign } : undefined),
    ...(hidden ? { display: 'none' } : undefined),
    ...(disabled ? { opacity: 0.5 } : undefined),
  };

  return (
    <RNText
      style={mergedStyle}
      numberOfLines={numberOfLines}
      onPress={onPress}
      disabled={disabled}
      testID={testID}>
      {children}
    </RNText>
  );
}

export * from './types';
