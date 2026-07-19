import { PropsWithChildren, createContext, useState } from 'react';

export const SharedTabsContext = createContext<{
  index: number;
  setIndex: (index: number) => void;
} | null>(null);

/**
 * Wraps a group of tabs to share the same state. Useful for guides where one aspect of the guide is broken up into multiple tabs, e.g. Yarn vs NPM.
 */
export function TabsGroup({ children }: PropsWithChildren) {
  const [index, setIndex] = useState(0);
  return (
    <SharedTabsContext.Provider value={{ index, setIndex }}>{children}</SharedTabsContext.Provider>
  );
}
