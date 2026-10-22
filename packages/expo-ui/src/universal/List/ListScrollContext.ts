import { createContext, type RefObject } from 'react';

/**
 * The web `List` node, so `List.ForEach` can find which of its rows are visible.
 */
export const ListScrollContext = createContext<RefObject<unknown> | null>(null);
