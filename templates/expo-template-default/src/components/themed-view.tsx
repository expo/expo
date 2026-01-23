import { useColorScheme, View, type ViewProps } from 'react-native';

import { Colors, ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  useColorScheme();

  return (
    <View style={[{ backgroundColor: Colors[type ?? 'background'] }, style]} {...otherProps} />
  );
}
