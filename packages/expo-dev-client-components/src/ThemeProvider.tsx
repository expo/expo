import * as React from 'react';

export type ThemePreference = 'no-preference' | 'light' | 'dark';

const ThemeContext = React.createContext('no-preference');

type ThemeProviderProps = {
  children: React.ReactNode;
  theme: ThemePreference;
};

export function ThemePreferenceProvider({ children, theme }: ThemeProviderProps) {
  React.useEffect(() => {
    ThemePreferences.notify(theme);
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

type ThemePreferenceChangeListener = (preference: ThemePreference) => void;

function createThemePreferenceStore() {
  let listeners: ThemePreferenceChangeListener[] = [];

  let currentPreference: ThemePreference = 'no-preference';

  function addChangeListener(listener: ThemePreferenceChangeListener) {
    listeners.push(listener);
  }

  function removeChangeListener(listener: ThemePreferenceChangeListener) {
    listeners = listeners.filter((l) => l !== listener);
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
    removeChangeListener,
    notify,
  };
}

export function useThemePreference() {
  const [themePreference, setThemePreference] = React.useState<ThemePreference>(
    ThemePreferences.getPreference()
  );

  React.useEffect(() => {
    function onPreferenceChange(preference: ThemePreference) {
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
