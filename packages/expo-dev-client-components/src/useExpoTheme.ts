import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';

type ExpoTheme = typeof lightTheme;

export function useExpoTheme(): ExpoTheme {
  const colorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    return darkTheme;
  }

  return lightTheme;
}
