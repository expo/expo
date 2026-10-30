import { createContext, type RefObject } from 'react';

/**
 * The web `List` node. `List.ForEach` uses it to find its visible rows.
 */
export const ListScrollContext = createContext<RefObject<unknown> | null>(null);
