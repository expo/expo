import { darkTheme, lightTheme } from '@expo/styleguide-base';
import { useColorScheme } from 'react-native';

export function useTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
