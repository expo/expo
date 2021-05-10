import { useColorScheme } from 'react-native';

export function useThemeName(): 'dark' | 'light' {
  const theme = useColorScheme();
  return theme === 'dark' ? 'dark' : 'light';
}
