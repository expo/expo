import { Text as NativeText, type TextProps } from 'react-native';

import { useTheme } from '../native';
// eslint-disable-next-line no-restricted-imports

export function Text({ style, ...rest }: TextProps) {
  const { colors, fonts } = useTheme();

  return <NativeText {...rest} style={[{ color: colors.text }, fonts.regular, style]} />;
}
