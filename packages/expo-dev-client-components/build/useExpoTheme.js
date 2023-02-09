import { lightTheme, darkTheme, palette } from '@expo/styleguide-native';
import * as React from 'react';
import { useColorScheme } from 'react-native';
const ThemeContext = React.createContext('light');
export const useTheme = () => React.useContext(ThemeContext);
export function ThemeProvider({ children, themePreference = 'no-preference' }) {
    const systemTheme = useColorScheme();
    const theme = React.useMemo(() => {
        if (themePreference !== 'no-preference') {
            return themePreference;
        }
        return systemTheme ?? 'light';
    }, [themePreference, systemTheme]);
    return React.createElement(ThemeContext.Provider, { value: theme }, children);
}
export function useCurrentTheme() {
    const theme = useTheme();
    return theme;
}
export function useExpoTheme() {
    const theme = useTheme();
    if (theme === 'dark') {
        return darkTheme;
    }
    return lightTheme;
}
export function useExpoPalette() {
    const theme = useTheme();
    return palette[theme];
}
//# sourceMappingURL=useExpoTheme.js.map