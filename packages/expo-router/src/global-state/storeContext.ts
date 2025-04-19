import { createContext, useContext } from 'react';

import { RouterStore } from './router-store';

export const StoreContext = createContext<RouterStore | null>(null);

export const useExpoRouterStore = () => useContext(StoreContext)!;
