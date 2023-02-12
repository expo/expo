import * as React from 'react';

import * as DevMenu from '../native-modules/DevMenu';

const defaultMenuPreferences: DevMenu.MenuPreferences = {
  isOnboardingFinished: false,
};

const MenuPreferencesContext = React.createContext<DevMenu.MenuPreferences>(defaultMenuPreferences);

export type MenuPreferencesProviderProps = {
  children: React.ReactNode;
  menuPreferences?: DevMenu.MenuPreferences;
};

export function MenuPreferencesProvider({
  children,
  menuPreferences = defaultMenuPreferences,
}: MenuPreferencesProviderProps) {
  return (
    <MenuPreferencesContext.Provider value={menuPreferences}>
      {children}
    </MenuPreferencesContext.Provider>
  );
}

export function useMenuPreferences() {
  const preferences = React.useContext(MenuPreferencesContext);

  function setOnboardingFinishedAsync(isFinished: boolean) {
    return DevMenu.setOnboardingFinishedAsync(isFinished);
  }

  return {
    ...preferences,
    actions: {
      setOnboardingFinishedAsync,
    },
  };
}
