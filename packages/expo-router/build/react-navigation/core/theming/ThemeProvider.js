'use client';
import * as React from 'react';
import { ThemeContext } from './ThemeContext';
export function ThemeProvider({ value, children }) {
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
//# sourceMappingURL=ThemeProvider.js.map