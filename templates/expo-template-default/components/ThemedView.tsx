import { View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ViewProps = {
  lightColor?: string;
  darkColor?: string;
} & View['props'];

export function ThemedView(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
