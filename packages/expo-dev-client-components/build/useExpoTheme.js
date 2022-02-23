import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';
import { useThemePreference } from './ThemeProvider';
export function useExpoTheme() {
    const colorScheme = useColorScheme();
    const preference = useThemePreference();
    let theme = preference;
    if (theme === 'no-preference' && colorScheme != null) {
        theme = colorScheme;
    }
    if (colorScheme === 'dark') {
        return darkTheme;
    }
    return lightTheme;
}
//# sourceMappingURL=useExpoTheme.js.map