import { Text as RNText, useColorScheme, type TextStyle } from 'react-native';

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

  const isDarkScheme = useColorScheme() === 'dark';

  const textStyleOverrides: TextStyle = {
    ...(textStyle?.fontSize != null ? { fontSize: textStyle.fontSize } : undefined),
    ...(textStyle?.fontWeight != null ? { fontWeight: textStyle.fontWeight } : undefined),
    ...(textStyle?.fontFamily != null ? { fontFamily: textStyle.fontFamily } : undefined),
    ...(textStyle?.color != null ? { color: textStyle.color } : undefined),
    ...(textStyle?.lineHeight != null ? { lineHeight: textStyle.lineHeight } : undefined),
    ...(textStyle?.letterSpacing != null ? { letterSpacing: textStyle.letterSpacing } : undefined),
    ...(textStyle?.textAlign != null ? { textAlign: textStyle.textAlign } : undefined),
  };

  return (
    <RNText
      style={[
        isDarkScheme ? textDarkStyle : textLightStyle,
        style,
        textStyleOverrides,
        hidden ? hiddenStyle : null,
        disabled ? disabledStyle : null,
      ]}
      numberOfLines={numberOfLines}
      onPress={onPress}
      disabled={disabled}
      testID={testID}>
      {children}
    </RNText>
  );
}

const textLightStyle: TextStyle = {
  color: '#000000',
};

const textDarkStyle: TextStyle = {
  color: '#FFFFFF',
};

const hiddenStyle: TextStyle = {
  display: 'none',
};

const disabledStyle: TextStyle = {
  opacity: 0.5,
};

export * from './types';
