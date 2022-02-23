import * as React from 'react';

export type ThemePreference = 'no-preference' | 'light' | 'dark';

const ThemeContext = React.createContext('no-preference');

type ThemeProviderProps = {
  children: React.ReactNode;
  theme: ThemePreference;
};

export function ThemePreferenceProvider({ children, theme }: ThemeProviderProps) {
  React.useEffect(() => {
    console.log({ theme });
    ThemePreferences.notify(theme);
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

type ThemePreferenceChangeListener = (preference: ThemePreference) => void;

function createThemePreferenceStore() {
  const listeners: ThemePreferenceChangeListener[] = [];

  let currentPreference: ThemePreference = 'no-preference';

  function addChangeListener(listener: ThemePreferenceChangeListener) {
    listeners.push(listener);
  }

  function notify(newPreference: ThemePreference) {
    currentPreference = newPreference;
    listeners.forEach((l) => l(newPreference));
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
