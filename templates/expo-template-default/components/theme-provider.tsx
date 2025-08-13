import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider as RNTheme } from '@react-navigation/native';

export function ThemeProvider(props: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return <RNTheme value={colorScheme === 'dark' ? DarkTheme : DefaultTheme} {...props} />;
}
