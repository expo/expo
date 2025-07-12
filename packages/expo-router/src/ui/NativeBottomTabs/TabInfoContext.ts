import { createContext } from 'react';

export interface TabInfoContextType {
  tabKey: string;
}

export const TabInfoContext = createContext<TabInfoContextType | undefined>(undefined);
