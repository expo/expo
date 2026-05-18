import { Text, type TextProps } from 'react-native';
import { useTheme, type ThemeType } from 'ThemeProvider';

type Props = TextProps & {
  color?: keyof ThemeType['text'];
};

export const BodyText = ({ color = 'default', style, ...props }: Props) => {
  const { theme } = useTheme();
  return <Text {...props} style={[{ color: theme.text[color] }, style]} />;
};
