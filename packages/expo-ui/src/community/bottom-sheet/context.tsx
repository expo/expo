import { createContext, useContext } from 'react';

import type { BottomSheetMethods } from './types';

export const BottomSheetContext = createContext<BottomSheetMethods | null>(null);

/** Internal context for passing layout flags to BottomSheetView. Not part of public API. */
export const BottomSheetInternalContext = createContext({ fitToContents: false });

/**
 * Hook to access the bottom sheet methods from within its children.
 * Must be used inside a `BottomSheet` component.
 *
 * Returns the same methods available on the `BottomSheet` ref:
 * `snapToIndex`, `snapToPosition`, `expand`, `collapse`, `close`, `forceClose`, `present`, `dismiss`.
 */
export function useBottomSheet(): BottomSheetMethods {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheet component');
  }
  return context;
}
