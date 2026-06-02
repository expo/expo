'use client';
import { createContext } from 'react';

import type { NavigationStore } from './navigationStore';
import type { NavigationTree } from './types';

/**
 * The committed navigation tree, flowed down by plain React context (no `useSyncExternalStore`).
 * Consumers read it with `use(RootTreeContext)`; route info / per-navigator slices derive from it.
 */
export const RootTreeContext = createContext<NavigationTree>(undefined);

/**
 * The producer-side staging buffer. The navigation container owns it and re-publishes its committed
 * tree via {@link RootTreeContext}; the imperative drain reaches it via the module singleton.
 */
export const NavigationStoreContext = createContext<NavigationStore | null>(null);
