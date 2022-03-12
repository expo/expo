import * as React from 'react';
declare type ThemePreference = 'light' | 'dark' | 'no-preference';
declare type Theme = 'light' | 'dark';
export declare const useTheme: () => Theme;
declare type ThemeProviderProps = {
    children: React.ReactNode;
    themePreference?: ThemePreference;
};
export declare function ThemeProvider({ children, themePreference }: ThemeProviderProps): JSX.Element;
export {};
//# sourceMappingURL=ThemeProvider2.d.ts.map