import { Text as RNText, StyleSheet, useColorScheme } from 'react-native';

import type { TextProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  light: { color: '#000000' },
  dark: { color: '#FFFFFF' },
  hidden: { display: 'none' },
  disabled: { opacity: 0.5 },
});

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
  disabled = false,
  hidden = false,
  testID,
}: TextProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const isDarkScheme = useColorScheme() === 'dark';

  return (
    <RNText
      numberOfLines={numberOfLines}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        isDarkScheme ? styles.dark : styles.light,
        style,
        textStyle,
        hidden && styles.hidden,
        disabled && styles.disabled,
      ]}>
      {children}
    </RNText>
  );
}

export * from './types';
