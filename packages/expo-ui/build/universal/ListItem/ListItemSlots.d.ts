import { type ReactNode } from 'react';
import type { ListItemLeadingProps, ListItemSupportingProps, ListItemTrailingProps } from './types';
/** Leading-slot marker for [`ListItem`](#listitem). */
export declare function Leading(props: ListItemLeadingProps): ReactNode;
/** Trailing-slot marker for [`ListItem`](#listitem). */
export declare function Trailing(props: ListItemTrailingProps): ReactNode;
/** Supporting-text-slot marker for [`ListItem`](#listitem), rendered below the headline. */
export declare function Supporting(props: ListItemSupportingProps): ReactNode;
export type ExtractedListItemSlots = {
    leading?: ReactNode;
    trailing?: ReactNode;
    supporting?: ReactNode;
    headline: ReactNode[];
};
/**
 * Walks `children`, pulls out any `<ListItem.Leading>` /
 * `<ListItem.Trailing>` / `<ListItem.Supporting>` slots, and returns the
 * remaining nodes as the headline content. Recurses into `React.Fragment`.
 */
export declare function extractListItemSlots(children: ReactNode): ExtractedListItemSlots;
//# sourceMappingURL=ListItemSlots.d.ts.map