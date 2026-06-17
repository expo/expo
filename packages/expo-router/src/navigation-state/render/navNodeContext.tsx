'use client';
// R-Phase B — hands each navigator its slice of the tree (Decisions R-2/R-4).
//
// The root provides `root`; when a navigator renders a route's screen it provides that route's
// `child` NavNode, so a nested navigator reads ITS slice here. The slice is reference-stable across
// dispatches that don't touch it (the reducer preserves identity), which the consuming navigator can
// exploit (memoize on the slice) to avoid re-rendering on unrelated navigations.

import { createContext, use, type ReactNode } from 'react';

import type { NavNode } from '../types';

const NavNodeContext = createContext<NavNode | null>(null);

export function NavNodeProvider({ node, children }: { node: NavNode; children: ReactNode }) {
  return <NavNodeContext value={node}>{children}</NavNodeContext>;
}

/** The current navigator's NavNode slice. */
export function useNavNodeSlice(): NavNode {
  const node = use(NavNodeContext);
  if (!node) {
    throw new Error('useNavNodeSlice must be used within a NavNodeProvider');
  }
  return node;
}
