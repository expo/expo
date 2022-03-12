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
    }, [themePreference]);
    return React.createElement(ThemeContext.Provider, { value: theme }, children);
}
//# sourceMappingURL=ThemeProvider.js.map