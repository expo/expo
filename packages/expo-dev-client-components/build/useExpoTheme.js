import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';
import { useThemePreference } from './ThemeProvider';
export function useCurrentTheme() {
    const colorScheme = useColorScheme();
    const preference = useThemePreference();
    let theme = 'light';
    if (preference && preference !== 'no-preference') {
        theme = preference;
    }
    if ((!preference || preference === 'no-preference') && colorScheme != null) {
        theme = colorScheme;
    }
    return theme;
}
export function useExpoTheme() {
    const theme = useCurrentTheme();
    if (theme === 'dark') {
        return darkTheme;
    }
    return lightTheme;
}
//# sourceMappingURL=useExpoTheme.js.map