import type { ReactNode } from 'react';

// Web and server rendering do not add safe area insets.
export function HorizontalSafeAreaView({ children }: { children: ReactNode }) {
  return children;
}
