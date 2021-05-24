import { useColorScheme } from 'react-native';

import Colors from '../constants/Colors';

export type AvailableColors = typeof Colors['light'] & typeof Colors['dark'];

export function useThemeName(): 'dark' | 'light' {
  const theme = useColorScheme();
  return theme === 'dark' ? 'dark' : 'light';
}

export function useTheme(): [AvailableColors, boolean] {
  const theme = useColorScheme();
  return [Colors[theme], theme === 'dark'];
}
