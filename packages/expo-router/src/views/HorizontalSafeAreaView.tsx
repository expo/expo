import type { ReactNode } from 'react';

// Web and server rendering do not add safe area insets.
export function HorizontalSafeAreaView({ children }: { children: ReactNode }) {
  return children;
}

// Screens get no left and right insets here, so the default navigator keeps all edges.
export function useDefaultNavigatorSafeAreaEdges() {
  return undefined;
}
