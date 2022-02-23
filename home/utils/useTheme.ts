import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';

import { useSelector } from '../redux/Hooks';

type ExpoTheme = typeof lightTheme;

export function useStyleguideTheme(): { theme: ExpoTheme; themeType: 'light' | 'dark' } {
  const preferredAppearance = useSelector((data) => data.settings.preferredAppearance);
  const colorScheme = useColorScheme();

  const theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;

  if (theme === 'dark') {
    return { theme: darkTheme, themeType: 'dark' };
  }

  return { theme: lightTheme, themeType: 'light' };
}
