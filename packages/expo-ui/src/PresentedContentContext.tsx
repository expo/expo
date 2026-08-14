import { createContext, useContext, type ReactNode } from 'react';

const PresentedContentContext = createContext(false);

/**
 * Whether the surrounding content is presented in its own view controller — a sheet, a popover —
 * rather than in the React Native surface.
 *
 * `RNHostView` needs this because nothing above such content dispatches React Native touches: the
 * surface root is not one of its ancestors. A hosted view there has to dispatch its own touches and
 * be the origin its content is measured from, and both of those come from a single `layoutRoot`
 * prop so they cannot disagree.
 *
 * Defaults to `false`, so content that is not wrapped keeps deferring to the surface root.
 */
export function useIsPresentedInOwnWindow(): boolean {
  return useContext(PresentedContentContext);
}

/**
 * Marks its children as presented in their own view controller. Wrap only the presented content —
 * an anchor or label rendered in place stays in the React Native surface and must not be wrapped.
 *
 * A slot needs this when both are true: it renders arbitrary views, and that content is
 * interactive. `BottomSheet`'s content and `Popover.Content` qualify. The others deliberately do
 * not: `Alert`, `ConfirmationDialog`, `Menu` and `ContextMenu.Items` only render buttons and
 * similar menu content, so a hosted view never appears there at all; and `ContextMenu.Preview`
 * renders arbitrary views but is non-interactive on iOS — a tap commits or dismisses the menu
 * rather than reaching the content, measured on device. Wrapping a slot that cannot receive
 * touches would still switch it to `layoutRoot`, which turns off the content origin for nothing.
 */
export function PresentedContent({ children }: { children: ReactNode }) {
  return <PresentedContentContext.Provider value>{children}</PresentedContentContext.Provider>;
}
