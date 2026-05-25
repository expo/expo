'use client';
import { createContext, use } from 'react';

import type { RouterStore } from './store';

export const StoreContext = createContext<RouterStore | null>(null);

export const useExpoRouterStore = () => use(StoreContext)!;
