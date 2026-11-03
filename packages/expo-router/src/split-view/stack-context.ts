import { createContext } from 'react';

export interface SplitViewStackColumn {
  columnId: string;
  ownsHeader: boolean;
  isCollapsed: boolean;
  showsSidebarButton: boolean;
}

// Cleared at the first Stack so a Stack inside one of its screens cannot claim the column.
export const SplitViewStackContext = createContext<SplitViewStackColumn | null>(null);
