import * as React from 'react';
const ThemeContext = React.createContext('no-preference');
export function ThemePreferenceProvider({ children, theme }) {
    React.useEffect(() => {
        ThemePreferences.notify(theme);
    }, [theme]);
    return React.createElement(ThemeContext.Provider, { value: theme }, children);
}
function createThemePreferenceStore() {
    let listeners = [];
    let currentPreference = 'no-preference';
    function addChangeListener(listener) {
        listeners.push(listener);
    }
    function removeChangeListener(listener) {
        listeners = listeners.filter((l) => l !== listener);
    }
    function notify(newPreference) {
        currentPreference = newPreference;
        listeners.forEach((l) => l(newPreference));
    }
    function getPreference() {
        return currentPreference;
    }
    return {
        getPreference,
        addChangeListener,
        removeChangeListener,
        notify,
    };
}
export function useThemePreference() {
    const [themePreference, setThemePreference] = React.useState(ThemePreferences.getPreference());
    React.useEffect(() => {
        function onPreferenceChange(preference) {
            setThemePreference(preference);
        }
        ThemePreferences.addChangeListener(onPreferenceChange);
        return () => {
            ThemePreferences.removeChangeListener(onPreferenceChange);
        };
    }, []);
    return themePreference;
}
export const ThemePreferences = createThemePreferenceStore();
//# sourceMappingURL=ThemeProvider.js.map