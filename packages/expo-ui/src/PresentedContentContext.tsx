import { createContext, useContext, type ReactNode } from 'react';

export const PresentedContentContext = createContext(false);

/**
 * Whether the surrounding content is presented in its own view controller — a sheet, a popover
 * — rather than in the React Native surface.
 *
 * `RNHostView` needs this because nothing above such content dispatches React Native touches: the
 * surface root is not one of its ancestors. A hosted view there has to dispatch its own touches and
 * be the origin its content is measured from, and both of those come from a single `layoutRoot`
 * prop.
 *
 * Defaults to `false`, so content that is not wrapped keeps deferring to the surface root.
 */
export function useIsPresentedInOwnWindow(): boolean {
  return useContext(PresentedContentContext);
}

export function PresentedContent({ children }: { children: ReactNode }) {
  return <PresentedContentContext.Provider value>{children}</PresentedContentContext.Provider>;
}
