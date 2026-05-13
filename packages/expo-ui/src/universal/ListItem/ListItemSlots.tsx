import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import type { ListItemLeadingProps, ListItemSupportingProps, ListItemTrailingProps } from './types';

/** Leading-slot marker for [`ListItem`](#listitem). */
export function Leading(props: ListItemLeadingProps) {
  return <>{props.children}</>;
}

/** Trailing-slot marker for [`ListItem`](#listitem). */
export function Trailing(props: ListItemTrailingProps) {
  return <>{props.children}</>;
}

/** Supporting-text-slot marker for [`ListItem`](#listitem), rendered below the headline. */
export function Supporting(props: ListItemSupportingProps) {
  return <>{props.children}</>;
}

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
export function extractListItemSlots(children: ReactNode): ExtractedListItemSlots {
  let leading: ReactNode | undefined;
  let trailing: ReactNode | undefined;
  let supporting: ReactNode | undefined;
  const headline: ReactNode[] = [];

  const walk = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) {
        headline.push(child);
        return;
      }
      if (child.type === Leading) {
        leading = (child.props as { children?: ReactNode }).children;
        return;
      }
      if (child.type === Trailing) {
        trailing = (child.props as { children?: ReactNode }).children;
        return;
      }
      if (child.type === Supporting) {
        supporting = (child.props as { children?: ReactNode }).children;
        return;
      }
      if (child.type === Fragment) {
        walk((child.props as { children?: ReactNode }).children);
        return;
      }
      headline.push(child);
    });
  };

  walk(children);
  return { leading, trailing, supporting, headline };
}
