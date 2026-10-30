import { createContext, use } from 'react';

import type { SplitViewColumnName } from '../global-state/types';

export interface SplitViewState {
  /**
   * Shows the column. A compact `SplitView` shows it at once. An expanded one shows it after the next collapse.
   */
  show: (column: SplitViewColumnName) => void;
  /**
   * Whether the `SplitView` shows one column.
   */
  isCollapsed: boolean;
  /**
   * The column that a compact `SplitView` shows now, or after the next collapse. It is `undefined` until a value is
   * known.
   */
  compactColumn: SplitViewColumnName | undefined;
}

export const SplitViewContext = createContext<SplitViewState | null>(null);

/**
 * Returns the column state of the `SplitView`. Use it in a `SplitView.Column` or in a route of the `SplitView`.
 *
 * On Android and web, `show` does nothing, `isCollapsed` is `false`, and `compactColumn` is `undefined`.
 */
export function useSplitView(): SplitViewState {
  const state = use(SplitViewContext);
  if (!state) {
    throw new Error(
      'useSplitView must be used inside a SplitView column or route. The layout that renders SplitView is outside the SplitView. Move the component into a SplitView.Column or a route, or use the SplitView ref.'
    );
  }
  return state;
}
