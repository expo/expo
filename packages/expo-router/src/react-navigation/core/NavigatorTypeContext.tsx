'use client';
import { createContext } from 'react';

/**
 * The kind of the navigator that owns the current screen (e.g. `'stack'`, `'tab'`, `'drawer'`).
 * Navigation state no longer carries a `type`, so views that behave differently per navigator
 * kind (e.g. "is this route a preloaded stack route?") read it from here. `undefined` outside a
 * navigator that provides it.
 */
export const NavigatorTypeContext = createContext<string | undefined>(undefined);
