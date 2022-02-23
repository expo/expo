import * as React from 'react';
const ThemeContext = React.createContext('no-preference');
export function ThemePreferenceProvider({ children, theme }) {
    React.useEffect(() => {
        ThemePreferences.notify(theme);
    }, [theme]);
    return React.createElement(ThemeContext.Provider, { value: theme }, children);
}
function createThemePreferenceStore() {
    const listeners = [];
    let currentPreference = 'no-preference';
    function addChangeListener(listener) {
        listeners.push(listener);
    }
    function notify(newPreference) {
        currentPreference = newPreference;
        listeners.forEach((l) => l(currentPreference));
    }
    function getPreference() {
        return currentPreference;
    }
    return {
        getPreference,
        addChangeListener,
        notify,
    };
}
export const ThemePreferences = createThemePreferenceStore();
//# sourceMappingURL=ThemeProvider.js.map