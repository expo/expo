import * as React from 'react';
export declare type ThemePreference = 'no-preference' | 'light' | 'dark';
declare type ThemeProviderProps = {
    children: React.ReactNode;
    theme: ThemePreference;
};
export declare function ThemePreferenceProvider({ children, theme }: ThemeProviderProps): JSX.Element;
declare type ThemePreferenceChangeListener = (preference: ThemePreference) => void;
export declare const ThemePreferences: {
    getPreference: () => ThemePreference;
    addChangeListener: (listener: ThemePreferenceChangeListener) => void;
    notify: (newPreference: ThemePreference) => void;
};
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map