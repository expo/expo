'use client';

import { createContext } from 'react';

import type { NavigationState } from '../routers';

export const RootNavigationStateContext = createContext<NavigationState | undefined>(undefined);
