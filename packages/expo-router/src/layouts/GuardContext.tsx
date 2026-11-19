'use client';

import { createContext } from 'react';

import type { GuardedRedirects } from '../global-state/guards';

// The guards that a layout declares for the navigator right below it. Each screen resets it,
// so a navigator without its own declaration does not read the guards of a parent layout.
export const GuardContext = createContext<GuardedRedirects | null>(null);
// `true` in a screen whose navigator blocks its route.
export const RouteBlockedContext = createContext(false);
