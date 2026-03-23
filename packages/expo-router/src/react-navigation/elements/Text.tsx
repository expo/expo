import { useTheme } from '@react-navigation/native';
// eslint-disable-next-line no-restricted-imports
import { Text as NativeText, type TextProps } from 'react-native';

export function Text({ style, ...rest }: TextProps) {
  const { colors, fonts } = useTheme();

  return (
    <NativeText
      {...rest}
      style={[{ color: colors.text }, fonts.regular, style]}
    />
  );
}
