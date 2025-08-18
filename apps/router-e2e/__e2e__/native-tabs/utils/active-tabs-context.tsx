import { createContext, useState } from 'react';

export const ActiveTabsContext = createContext<{
  activeTabs: string[];
  setActiveTabs: ReturnType<typeof useState<string[]>>[1];
}>({ activeTabs: [], setActiveTabs: () => {} });
